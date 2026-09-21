import "dotenv/config";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaIdentityRepository } from "../domains/accounts/infrastructure/prisma-identity-repository";
import { OperationsService } from "../domains/operations/application/service";
import { PrismaOperationsRepository } from "../domains/operations/infrastructure/prisma-operations-repository";
import { PrismaWritingRepository } from "../domains/writing/infrastructure/prisma-writing-repository";
import { PrismaFixedWindowRateLimiter } from "../lib/http/rate-limit";
import { createLogger } from "../lib/observability/logger";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
const recoverySecret = "s16-recovery-verifier-secret-32-characters-minimum";

async function rejected(operation: Promise<unknown>): Promise<boolean> { try { await operation; return false; } catch { return true; } }

async function verify() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const suffix = randomUUID(); const identities = new PrismaIdentityRepository(prisma);
    const owner = await identities.resolveOrProvision({ provider: "s16", subject: `owner-${suffix}`, email: `owner-${suffix}@example.test`, emailVerified: true }, suffix);
    const outsider = await identities.resolveOrProvision({ provider: "s16", subject: `outsider-${suffix}`, email: `outsider-${suffix}@example.test`, emailVerified: true }, suffix);
    const actor = { ...owner, sessionId: randomUUID() }; const outsiderActor = { ...outsider, sessionId: randomUUID() };
    const writing = new PrismaWritingRepository(prisma); const project = await writing.createProject(actor, { title: `private-${suffix}` }); await writing.createChapter(actor, { projectId: project.id, title: `private-chapter-${suffix}` });
    const repository = new PrismaOperationsRepository(prisma); const service = new OperationsService(repository, createLogger({ service: "s16-verifier" }), recoverySecret);
    await service.record({ workspaceId: actor.workspaceId, actorUserId: actor.userId, projectId: project.id, eventName: "writing.save", durationMs: 17, dimensions: { outcome: "success", stage: "database" } });
    await service.record({ workspaceId: outsiderActor.workspaceId, actorUserId: outsiderActor.userId, eventName: "auth.failure", numericValue: 1, dimensions: { outcome: "rejected", stage: "database" } });
    const crossWorkspaceProjectRejected = await rejected(service.record({ workspaceId: outsiderActor.workspaceId, actorUserId: outsiderActor.userId, projectId: project.id, eventName: "writing.save", durationMs: 1, dimensions: { outcome: "rejected" } }));
    const outbox = await prisma.outboxEvent.create({ data: { workspaceId: actor.workspaceId, aggregateType: "Verifier", aggregateId: randomUUID(), eventType: "verify.retry", payload: {}, status: "FAILED", attempts: 2, lastErrorCode: "DEPENDENCY_UNAVAILABLE" } });
    const preview = await service.previewOutboxRecovery(actor, outbox.id, Date.now());
    const completed = await service.confirmOutboxRecovery(actor, { recoveryId: preview.recoveryId, targetId: outbox.id, confirmationToken: preview.confirmationToken, phrase: preview.requiredPhrase });
    const replayRejected = await rejected(service.confirmOutboxRecovery(actor, { recoveryId: preview.recoveryId, targetId: outbox.id, confirmationToken: preview.confirmationToken, phrase: preview.requiredPhrase }));
    const outsiderTargetRejected = await rejected(service.previewOutboxRecovery(outsiderActor, outbox.id));
    const memberRejected = await rejected(service.adminSnapshot({ ...actor, role: "MEMBER" }));
    const snapshot = await service.adminSnapshot(actor); const outsiderSnapshot = await service.adminSnapshot({ ...outsiderActor, role: "OWNER" });
    const limiter = new PrismaFixedWindowRateLimiter(prisma, 2, 60_000, createLogger({ service: "s16-rate-verifier" })); await limiter.assertAllowed(`verify:${suffix}`, new Date(0)); await limiter.assertAllowed(`verify:${suffix}`, new Date(1)); const rateRejected = await rejected(limiter.assertAllowed(`verify:${suffix}`, new Date(2)));
    const state = await prisma.outboxEvent.findUniqueOrThrow({ where: { id: outbox.id }, select: { status: true, lastErrorCode: true } });
    const auditCount = await prisma.auditEvent.count({ where: { workspaceId: actor.workspaceId, kind: "ADMIN_RECOVERY", targetId: outbox.id } });
    const shape = await prisma.$queryRaw<Array<{ tables: bigint; indexes: bigint; checks: bigint }>>`SELECT (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('OperationalEvent','RateLimitBucket','RecoveryAction'))::bigint AS tables, (SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('OperationalEvent','RateLimitBucket','RecoveryAction'))::bigint AS indexes, (SELECT COUNT(*) FROM pg_constraint WHERE conname IN ('RateLimitBucket_bounds_check','RecoveryAction_status_check'))::bigint AS checks`;
    const serialized = JSON.stringify(snapshot);
    if (!completed.completed || !replayRejected || !outsiderTargetRejected || !crossWorkspaceProjectRejected || !memberRejected || !rateRejected || state.status !== "PENDING" || state.lastErrorCode !== null || auditCount !== 1 || snapshot.operations.length !== 1 || outsiderSnapshot.operations.some((event) => event.eventName === "writing.save") || serialized.includes(`private-${suffix}`) || Number(shape[0]?.tables ?? 0) !== 3 || Number(shape[0]?.indexes ?? 0) < 8 || Number(shape[0]?.checks ?? 0) !== 2) throw new Error("S16 database proof failed.");
    // Console trace S16-DB-001: launch-operations database proof reports only bounded schema, isolation, rate, recovery, and metadata counts.
    console.log(JSON.stringify({ level: "info", step: "S16-DB-001", event: "launch_operations_database.verified", workspaceId: actor.workspaceId, tableCount: Number(shape[0]!.tables), indexCount: Number(shape[0]!.indexes), checkCount: Number(shape[0]!.checks), operationalEventCount: snapshot.operations.length, auditCount, recoveryCompleted: completed.completed, replayRejected, crossWorkspaceRejected: outsiderTargetRejected && crossWorkspaceProjectRejected, memberRejected, rateRejected, contentExcluded: !serialized.includes(`private-${suffix}`) }));
  } finally { await prisma.$disconnect(); }
}

async function rollback() {
  const client = new Client({ connectionString }); await client.connect();
  try {
    const before = await client.query<{ workspaces: string; projects: string; chapters: string }>(`SELECT (SELECT COUNT(*) FROM "Workspace")::text AS workspaces, (SELECT COUNT(*) FROM "Project")::text AS projects, (SELECT COUNT(*) FROM "Chapter")::text AS chapters`);
    const sql = await readFile(new URL("../prisma/migrations/20260901020000_launch_operations/rollback.sql", import.meta.url), "utf8"); await client.query(sql);
    const after = await client.query<{ workspaces: string; projects: string; chapters: string }>(`SELECT (SELECT COUNT(*) FROM "Workspace")::text AS workspaces, (SELECT COUNT(*) FROM "Project")::text AS projects, (SELECT COUNT(*) FROM "Chapter")::text AS chapters`);
    const remaining = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('OperationalEvent','RateLimitBucket','RecoveryAction')`);
    if (JSON.stringify(before.rows[0]) !== JSON.stringify(after.rows[0]) || remaining.rows[0]?.count !== "0") throw new Error("S16 rollback crossed its capability boundary.");
    await client.query(`DELETE FROM "_prisma_migrations" WHERE migration_name='20260901020000_launch_operations'`);
    // Console trace S16-DB-002: rollback proof records only S16 schema removal and preserved predecessor row counts.
    console.log(JSON.stringify({ level: "info", step: "S16-DB-002", event: "launch_operations_database.rollback_verified", remainingS16Tables: 0, preservedWorkspaceRows: Number(after.rows[0]!.workspaces), preservedProjectRows: Number(after.rows[0]!.projects), preservedChapterRows: Number(after.rows[0]!.chapters) }));
  } finally { await client.end(); }
}

const command = process.argv[2] ?? "verify";
if (command === "verify") await verify(); else if (command === "rollback") await rollback(); else throw new Error("Expected verify or rollback command.");
