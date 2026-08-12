import "dotenv/config";

import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaIdentityRepository } from "../domains/accounts/infrastructure/prisma-identity-repository";
import { PrismaWritingRepository } from "../domains/writing/infrastructure/prisma-writing-repository";
import { PrismaContinuationRepository } from "../domains/writing/infrastructure/prisma-continuation-repository";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

async function verify(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const suffix = randomUUID();
    const identities = new PrismaIdentityRepository(prisma);
    const owner = await identities.resolveOrProvision({ provider: "s3", subject: `owner-${suffix}`, email: `owner-${suffix}@example.test`, emailVerified: true }, suffix);
    const outsider = await identities.resolveOrProvision({ provider: "s3", subject: `other-${suffix}`, email: `other-${suffix}@example.test`, emailVerified: true }, suffix);
    const ownerActor = { ...owner, sessionId: randomUUID() };
    const outsiderActor = { ...outsider, sessionId: randomUUID() };
    const writing = new PrismaWritingRepository(prisma);
    const continuation = new PrismaContinuationRepository(prisma);
    const project = await writing.createProject(ownerActor, { title: "Continuation verifier" });
    const chapters = [];
    for (let index = 0; index < 7; index += 1) chapters.push(await writing.createChapter(ownerActor, { projectId: project.id, title: `Chapter ${index + 1}` }));
    const oldest = chapters[0]!.chapter;
    const blockId = randomUUID();
    const pinIds = Array.from({ length: 50 }, () => randomUUID());
    const first = await continuation.saveWritingPosition(ownerActor, project.id, { activeChapterId: oldest.id, blockId, cursorOffset: 13, selectionAnchor: 14, selectionHead: 14, scrollTop: 777, contextPanelMode: "PINS", pinIds, capturedAt: "2026-08-12T12:00:00.000Z" });
    const second = await continuation.saveWritingPosition(ownerActor, project.id, { ...first, cursorOffset: 14, selectionAnchor: 15, selectionHead: 15, capturedAt: "2026-08-12T12:01:00.000Z" });
    const staleReplay = await continuation.saveWritingPosition(ownerActor, project.id, { ...first, cursorOffset: 1, selectionAnchor: 2, selectionHead: 2, capturedAt: "2026-08-12T11:59:00.000Z" });
    if (staleReplay.cursorOffset !== 14 || staleReplay.capturedAt !== second.capturedAt) throw new Error("An older delayed session write replaced newer continuation state.");
    const model = await continuation.getProjectContinuation(ownerActor, project.id);
    if (!model || model.activeChapter?.id !== oldest.id || model.recentChapters.length !== 5 || model.session.cursorOffset !== 14 || model.session.pinIds.length !== 50) throw new Error("Continuation round trip, active fallback, or bounds failed.");
    const sessionCount = await prisma.writingSessionState.count({ where: { userId: ownerActor.userId, projectId: project.id } });
    if (sessionCount !== 1) throw new Error("Per-user/project session upsert was not unique.");
    if (await continuation.getProjectContinuation(outsiderActor, project.id) !== null) throw new Error("Cross-workspace continuation read succeeded.");
    await continuation.saveWritingPosition(outsiderActor, project.id, second).then(() => { throw new Error("Cross-workspace continuation write succeeded."); }).catch((error: unknown) => { if (!(error instanceof Error) || error.message === "Cross-workspace continuation write succeeded.") throw error; });
    const outsiderProject = await writing.createProject(outsiderActor, { title: "Outside project" });
    const outsiderChapter = await writing.createChapter(outsiderActor, { projectId: outsiderProject.id, title: "Outside chapter" });
    await continuation.saveWritingPosition(ownerActor, project.id, { ...second, activeChapterId: outsiderChapter.chapter.id }).then(() => { throw new Error("Cross-project active chapter succeeded."); }).catch((error: unknown) => { if (!(error instanceof Error) || error.message === "Cross-project active chapter succeeded.") throw error; });
    await prisma.chapter.update({ where: { id: oldest.id }, data: { archivedAt: new Date() } });
    const archivedFallback = await continuation.getProjectContinuation(ownerActor, project.id);
    if (!archivedFallback?.activeChapter || archivedFallback.activeChapter.id === oldest.id) throw new Error("Archived continuation chapter did not fall back to an eligible chapter.");
    // Console trace S3-DB-001: bounded continuation, exact position, uniqueness, and ownership passed without content emission.
    console.log(JSON.stringify({ level: "info", step: "S3-DB-001", event: "continuation_database.verified", projectId: project.id, activeChapterId: model.activeChapter.id, recentChapterCount: model.recentChapters.length, storedSessionCount: sessionCount, cursorOffset: model.session.cursorOffset, scrollTop: model.session.scrollTop, pinCount: model.session.pinIds.length, staleWriteIgnored: true, archivedChapterFallback: true, crossWorkspaceRead: false, crossWorkspaceWrite: false, crossProjectChapter: false }));
  } finally { await prisma.$disconnect(); }
}

async function rollback(): Promise<void> {
  const sql = await readFile(new URL("../prisma/migrations/20260812210000_continuation/rollback.sql", import.meta.url), "utf8");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(sql);
    const remaining = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_name='WritingSessionState'`);
    const parents = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('Project','Chapter','ChapterRevision','DraftConflict','ChapterSaveReceipt')`);
    if (remaining.rows[0]?.count !== "0" || parents.rows[0]?.count !== "5") throw new Error("Continuation rollback crossed its capability boundary.");
    await client.query(`DELETE FROM "_prisma_migrations" WHERE migration_name = '20260812210000_continuation'`);
    // Console trace S3-DB-002: continuation-only rollback preserved all S1/S2 persistence.
    console.log(JSON.stringify({ level: "info", step: "S3-DB-002", event: "continuation_database.rollback_verified", remainingContinuationTables: 0, preservedPriorTables: 5 }));
  } finally { await client.end(); }
}

const command = process.argv[2] ?? "verify";
if (command === "verify") await verify();
else if (command === "rollback") await rollback();
else throw new Error("Expected verify or rollback command.");
