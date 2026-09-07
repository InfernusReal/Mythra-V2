import "dotenv/config";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaIdentityRepository } from "@/domains/accounts/infrastructure/prisma-identity-repository";
import { PrismaOperationsRepository } from "@/domains/operations/infrastructure/prisma-operations-repository";
import type { AlertDelivery, AlertDeliveryInput } from "@/lib/observability/alerts";
import { recordOperationalEvent } from "@/lib/observability/operations";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

class RecordingDelivery implements AlertDelivery {
  readonly delivered: AlertDeliveryInput[] = [];
  failuresRemaining = 0;
  async deliver(input: AlertDeliveryInput): Promise<void> {
    if (this.failuresRemaining > 0) { this.failuresRemaining -= 1; throw new Error("SYNTHETIC_DELIVERY_FAILURE"); }
    this.delivered.push(structuredClone(input));
  }
}

async function verify() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const suffix = randomUUID();
    const identities = new PrismaIdentityRepository(prisma);
    const owner = await identities.resolveOrProvision({ provider: "s18-alert", subject: `owner-${suffix}`, email: `owner-${suffix}@example.test`, emailVerified: true }, suffix);
    const outsider = await identities.resolveOrProvision({ provider: "s18-alert", subject: `outsider-${suffix}`, email: `outsider-${suffix}@example.test`, emailVerified: true }, suffix);
    const concurrent = await identities.resolveOrProvision({ provider: "s18-alert", subject: `concurrent-${suffix}`, email: `concurrent-${suffix}@example.test`, emailVerified: true }, suffix);
    await prisma.operationalAlertDelivery.deleteMany({ where: { alertState: { scopeKey: "global" } } });
    await prisma.operationalAlertState.deleteMany({ where: { scopeKey: "global" } });
    const delivery = new RecordingDelivery();
    const repository = new PrismaOperationsRepository(prisma, delivery);
    const startedAt = new Date();
    for (let index = 0; index < 5; index += 1) {
      await recordOperationalEvent(repository, { workspaceId: owner.workspaceId, actorUserId: owner.userId, eventName: "writing.save", dimensions: { outcome: "failure", stage: "database" }, occurredAt: new Date(startedAt.getTime() + index) });
    }
    await recordOperationalEvent(repository, { workspaceId: owner.workspaceId, actorUserId: owner.userId, eventName: "writing.save", dimensions: { outcome: "failure", stage: "database" }, occurredAt: new Date(startedAt.getTime() + 5) });
    const firing = await prisma.operationalAlertState.findUniqueOrThrow({ where: { scopeKey_ruleKey: { scopeKey: `workspace:${owner.workspaceId}`, ruleKey: "save-failures" } } });
    const firingDeliveries = await prisma.operationalAlertDelivery.count({ where: { alertStateId: firing.id } });
    const recoveredAt = new Date(startedAt.getTime() + 5 * 60_000 + 10);
    await recordOperationalEvent(repository, { workspaceId: owner.workspaceId, actorUserId: owner.userId, eventName: "writing.save", dimensions: { outcome: "success", stage: "database" }, occurredAt: recoveredAt });
    const recovered = await prisma.operationalAlertState.findUniqueOrThrow({ where: { id: firing.id } });
    await repository.recordGlobalAlertSignal("outbox-lag", 60_001, new Date(startedAt.getTime() + 20));
    await repository.recordGlobalAlertSignal("outbox-lag", 10_000, new Date(startedAt.getTime() + 21));
    const globalOutbox = await prisma.operationalAlertState.findUniqueOrThrow({ where: { scopeKey_ruleKey: { scopeKey: "global", ruleKey: "outbox-lag" } } });
    await recordOperationalEvent(repository, { workspaceId: owner.workspaceId, actorUserId: owner.userId, eventName: "backup.status", dimensions: { status: "failed", errorCode: "SNAPSHOT_VERIFY_FAILED", resource: "project_snapshot" }, occurredAt: new Date(startedAt.getTime() + 22) });
    await recordOperationalEvent(repository, { workspaceId: owner.workspaceId, actorUserId: owner.userId, eventName: "backup.status", dimensions: { status: "verified", resource: "project_snapshot" }, occurredAt: new Date(startedAt.getTime() + 23) });
    const backupState = await prisma.operationalAlertState.findUniqueOrThrow({ where: { scopeKey_ruleKey: { scopeKey: `workspace:${owner.workspaceId}`, ruleKey: "backup-failure" } } });
    const backupDeliveries = await prisma.operationalAlertDelivery.count({ where: { alertStateId: backupState.id, status: "DELIVERED" } });
    await repository.recordGlobalAlertSignal("database-saturation", 91, new Date(startedAt.getTime() + 24));
    await repository.recordGlobalAlertSignal("database-saturation", 60, new Date(startedAt.getTime() + 25));
    const databaseState = await prisma.operationalAlertState.findUniqueOrThrow({ where: { scopeKey_ruleKey: { scopeKey: "global", ruleKey: "database-saturation" } } });
    const databaseDeliveries = await prisma.operationalAlertDelivery.count({ where: { alertStateId: databaseState.id, status: "DELIVERED" } });

    const failingDelivery = new RecordingDelivery(); failingDelivery.failuresRemaining = 1;
    const retryRepository = new PrismaOperationsRepository(prisma, failingDelivery);
    for (let index = 0; index < 3; index += 1) {
      await recordOperationalEvent(retryRepository, { workspaceId: outsider.workspaceId, actorUserId: outsider.userId, eventName: "storage.failure", numericValue: 1, dimensions: { status: "failed", errorCode: "PRIVATE_WRITE_FAILED", resource: "research_asset" }, occurredAt: new Date(startedAt.getTime() + 30 + index) });
    }
    const storageState = await prisma.operationalAlertState.findUniqueOrThrow({ where: { scopeKey_ruleKey: { scopeKey: `workspace:${outsider.workspaceId}`, ruleKey: "storage-failures" } } });
    const failedDelivery = await prisma.operationalAlertDelivery.findFirstOrThrow({ where: { alertStateId: storageState.id } });
    await prisma.operationalAlertDelivery.update({ where: { id: failedDelivery.id }, data: { status: "DELIVERING", leaseOwner: "crashed-worker", leasedUntil: new Date(startedAt.getTime() - 1), availableAt: new Date(0) } });
    const retryResult = await retryRepository.deliverPendingAlerts("replacement-worker", 1, new Date(startedAt.getTime() + 10_000));
    const retriedDelivery = await prisma.operationalAlertDelivery.findUniqueOrThrow({ where: { id: failedDelivery.id } });

    await Promise.all(Array.from({ length: 5 }, (_, index) => recordOperationalEvent(repository, { workspaceId: concurrent.workspaceId, actorUserId: concurrent.userId, eventName: "writing.save", dimensions: { outcome: "failure", stage: "concurrent" }, occurredAt: new Date(startedAt.getTime() + 100 + index) })));
    const concurrentState = await prisma.operationalAlertState.findUniqueOrThrow({ where: { scopeKey_ruleKey: { scopeKey: `workspace:${concurrent.workspaceId}`, ruleKey: "save-failures" } } });
    const concurrentDeliveries = await prisma.operationalAlertDelivery.count({ where: { alertStateId: concurrentState.id } });
    for (let index = 0; index < 20; index += 1) await repository.recordGlobalAlertSignal("auth-failures", 1, new Date(startedAt.getTime() + 200 + index));
    const authFiring = await prisma.operationalAlertState.findUniqueOrThrow({ where: { scopeKey_ruleKey: { scopeKey: "global", ruleKey: "auth-failures" } } });
    const expiryAt = new Date(startedAt.getTime() + 5 * 60_000 + 300);
    for (let batch = 0; batch < 20; batch += 1) {
      const result = await repository.deliverPendingAlerts(`window-expiry-${batch}`, 50, expiryAt);
      if (result.claimed === 0) break;
    }
    const authRecovered = await prisma.operationalAlertState.findUniqueOrThrow({ where: { id: authFiring.id } });
    const authDeliveries = await prisma.operationalAlertDelivery.count({ where: { alertStateId: authFiring.id, status: "DELIVERED" } });
    const ownerAlerts = await prisma.operationalAlertState.findMany({ where: { workspaceId: owner.workspaceId } });
    const outsiderLeak = await prisma.operationalAlertState.count({ where: { workspaceId: outsider.workspaceId, ruleKey: "save-failures" } });
    const rows = await prisma.operationalAlertState.findMany({ include: { deliveries: true } });
    const serialized = JSON.stringify(rows);
    const shape = await prisma.$queryRaw<Array<{ tables: bigint; indexes: bigint; checks: bigint }>>`SELECT (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('OperationalAlertState','OperationalAlertDelivery'))::bigint AS tables, (SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('OperationalAlertState','OperationalAlertDelivery'))::bigint AS indexes, (SELECT COUNT(*) FROM pg_constraint WHERE conname IN ('OperationalAlertState_state_check','OperationalAlertState_severity_check','OperationalAlertState_observed_check','OperationalAlertState_transition_check','OperationalAlertDelivery_state_check','OperationalAlertDelivery_status_check','OperationalAlertDelivery_observed_check','OperationalAlertDelivery_attempts_check','OperationalAlertDelivery_transition_check'))::bigint AS checks`;
    const facts = {
      firing: [firing.state, firing.observed, firing.transitionVersion, firingDeliveries],
      recovery: [recovered.state, recovered.observed, recovered.transitionVersion],
      outbox: [globalOutbox.state, globalOutbox.transitionVersion],
      backup: [backupState.state, backupState.observed, backupState.transitionVersion, backupDeliveries],
      database: [databaseState.state, databaseState.observed, databaseState.transitionVersion, databaseDeliveries],
      authentication: [authFiring.state, authFiring.observed, authFiring.transitionVersion, authRecovered.state, authRecovered.observed, authRecovered.transitionVersion, authDeliveries],
      retry: [retryResult.delivered, retriedDelivery.status, retriedDelivery.attempts],
      concurrency: [concurrentState.state, concurrentState.observed, concurrentState.transitionVersion, concurrentDeliveries],
      isolation: [ownerAlerts.length, outsiderLeak], contentExcluded: !serialized.includes(`owner-${suffix}`),
      shape: [Number(shape[0]?.tables ?? 0), Number(shape[0]?.indexes ?? 0), Number(shape[0]?.checks ?? 0)]
    };
    if (JSON.stringify(facts.firing) !== JSON.stringify(["FIRING", 6, 1, 1]) || JSON.stringify(facts.recovery) !== JSON.stringify(["OK", 0, 2]) || JSON.stringify(facts.outbox) !== JSON.stringify(["OK", 2]) || JSON.stringify(facts.backup) !== JSON.stringify(["OK", 0, 2, 2]) || JSON.stringify(facts.database) !== JSON.stringify(["OK", 60, 2, 2]) || JSON.stringify(facts.authentication) !== JSON.stringify(["FIRING", 20, 1, "OK", 0, 2, 2]) || JSON.stringify(facts.retry) !== JSON.stringify([1, "DELIVERED", 2]) || JSON.stringify(facts.concurrency) !== JSON.stringify(["FIRING", 5, 1, 1]) || JSON.stringify(facts.isolation) !== JSON.stringify([2, 0]) || !facts.contentExcluded || JSON.stringify(facts.shape) !== JSON.stringify([2, 8, 9])) throw new Error(`S18 operational-alert database proof failed: ${JSON.stringify(facts)}`);
    // Console trace S18-DB-004: native alert proof records only bounded state, transition, delivery, retry, isolation and schema counts.
    console.log(JSON.stringify({ level: "info", step: "S18-DB-004", event: "operational_alerts_database.verified", alertRuleCount: 6, workspaceAlertCount: ownerAlerts.length, saveTransitions: recovered.transitionVersion, outboxTransitions: globalOutbox.transitionVersion, backupTransitions: backupState.transitionVersion, authenticationTransitions: authRecovered.transitionVersion, storageRetryAttempts: retriedDelivery.attempts, databaseTransitions: databaseState.transitionVersion, concurrentObserved: concurrentState.observed, concurrentDeliveryCount: concurrentDeliveries, workspaceIsolated: outsiderLeak === 0, contentExcluded: !serialized.includes(`owner-${suffix}`), tableCount: Number(shape[0]!.tables), indexCount: Number(shape[0]!.indexes), checkCount: Number(shape[0]!.checks) }));
  } finally {
    await prisma.$disconnect();
  }
}

async function rollback() {
  const client = new Client({ connectionString }); await client.connect();
  try {
    const before = await client.query<{ events: string; workspaces: string }>(`SELECT (SELECT COUNT(*) FROM "OperationalEvent")::text AS events, (SELECT COUNT(*) FROM "Workspace")::text AS workspaces`);
    const sql = await readFile(new URL("../prisma/migrations/20260906162500_s18_operational_alerts/rollback.sql", import.meta.url), "utf8"); await client.query(sql);
    const after = await client.query<{ events: string; workspaces: string }>(`SELECT (SELECT COUNT(*) FROM "OperationalEvent")::text AS events, (SELECT COUNT(*) FROM "Workspace")::text AS workspaces`);
    const remaining = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('OperationalAlertState','OperationalAlertDelivery')`);
    if (JSON.stringify(before.rows[0]) !== JSON.stringify(after.rows[0]) || remaining.rows[0]?.count !== "0") throw new Error("S18 alert rollback crossed its capability boundary.");
    await client.query(`DELETE FROM "_prisma_migrations" WHERE migration_name='20260906162500_s18_operational_alerts'`);
    // Console trace S18-DB-005: alert-only rollback records removed table count and preserved predecessor operation/workspace rows.
    console.log(JSON.stringify({ level: "info", step: "S18-DB-005", event: "operational_alerts_database.rollback_verified", remainingAlertTables: 0, preservedOperationalEventRows: Number(after.rows[0]!.events), preservedWorkspaceRows: Number(after.rows[0]!.workspaces) }));
  } finally { await client.end(); }
}

const command = process.argv[2] ?? "verify";
if (command === "verify") await verify(); else if (command === "rollback") await rollback(); else throw new Error("Expected verify or rollback command.");
