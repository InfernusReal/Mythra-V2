import "dotenv/config";

import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaIdentityRepository } from "../domains/accounts/infrastructure/prisma-identity-repository";
import { PrismaWritingRepository } from "../domains/writing/infrastructure/prisma-writing-repository";
import { PrismaDurabilityRepository } from "../domains/writing/infrastructure/prisma-durability-repository";
import { emptyChapterDocument } from "../domains/writing/domain/chapter-document";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
const documentWith = (text: string) => { const document = emptyChapterDocument(); document.content[0]!.content = [{ type: "text" as const, text }]; return document; };

async function verify(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const suffix = randomUUID();
    const identities = new PrismaIdentityRepository(prisma);
    const owner = await identities.resolveOrProvision({ provider: "s2", subject: `owner-${suffix}`, email: `owner-${suffix}@example.test`, emailVerified: true }, suffix);
    const outsider = await identities.resolveOrProvision({ provider: "s2", subject: `other-${suffix}`, email: `other-${suffix}@example.test`, emailVerified: true }, suffix);
    const ownerActor = { ...owner, sessionId: randomUUID() };
    const outsiderActor = { ...outsider, sessionId: randomUUID() };
    const writing = new PrismaWritingRepository(prisma);
    const durability = new PrismaDurabilityRepository(prisma);
    const project = await writing.createProject(ownerActor, { title: "Durability verifier" });
    const created = await writing.createChapter(ownerActor, { projectId: project.id, title: "Chapter 1" });
    const chapterId = created.chapter.id;

    const saveId = randomUUID();
    const firstDocument = documentWith("first durable text");
    const first = await durability.saveDraft(ownerActor, chapterId, { baseVersion: 1, clientSaveId: saveId, document: firstDocument });
    const replay = await durability.saveDraft(ownerActor, chapterId, { baseVersion: 1, clientSaveId: saveId, document: firstDocument });
    if (first.version !== 2 || !replay.idempotentReplay || replay.version !== 2) throw new Error("Duplicate retry was not idempotent.");

    const secondDocument = documentWith("server variant");
    await durability.saveDraft(ownerActor, chapterId, { baseVersion: 2, clientSaveId: randomUUID(), document: secondDocument });
    const localDocument = documentWith("local variant preserved");
    let conflictId = "";
    try { await durability.saveDraft(ownerActor, chapterId, { baseVersion: 2, clientSaveId: randomUUID(), document: localDocument }); }
    catch (error) { if (error instanceof Error && "safeDetails" in error) conflictId = String((error as { safeDetails?: { conflictId?: string } }).safeDetails?.conflictId ?? ""); }
    if (!conflictId) throw new Error("Stale save did not create a durable conflict.");
    const conflict = await durability.getConflict(ownerActor, conflictId);
    if (!conflict || conflict.serverVersion !== 3) throw new Error("Both conflict variants were not retrievable.");
    const localResolution = await durability.resolveConflict(ownerActor, conflictId, "KEEP_LOCAL");
    if (localResolution.version !== 4) throw new Error("Keep Local did not create a new monotonic version.");

    const keepServerId = randomUUID();
    try { await durability.saveDraft(ownerActor, chapterId, { baseVersion: 3, clientSaveId: keepServerId, document: documentWith("second stale local") }); } catch (error) { if (error instanceof Error && "safeDetails" in error) conflictId = String((error as { safeDetails?: { conflictId?: string } }).safeDetails?.conflictId ?? ""); }
    const serverResolution = await durability.resolveConflict(ownerActor, conflictId, "KEEP_SERVER");
    if (serverResolution.version !== 4) throw new Error("Keep Server changed the canonical version.");

    try { await durability.saveDraft(ownerActor, chapterId, { baseVersion: 3, clientSaveId: randomUUID(), document: documentWith("recovery local") }); } catch (error) { if (error instanceof Error && "safeDetails" in error) conflictId = String((error as { safeDetails?: { conflictId?: string } }).safeDetails?.conflictId ?? ""); }
    const recovery = await durability.resolveConflict(ownerActor, conflictId, "DUPLICATE_RECOVERY");
    if (!recovery.recoveryChapterId) throw new Error("Recovery copy was not created.");

    const checkpointId = randomUUID();
    const checkpoint = await durability.checkpoint(ownerActor, chapterId, { baseVersion: 4, clientSaveId: checkpointId, document: localDocument, label: "Manual checkpoint" });
    const checkpointReplay = await durability.checkpoint(ownerActor, chapterId, { baseVersion: 4, clientSaveId: checkpointId, document: localDocument, label: "Manual checkpoint" });
    if (checkpoint.version !== 5 || checkpointReplay.revisionId !== checkpoint.revisionId) throw new Error("Checkpoint retry duplicated a permanent revision.");

    const concurrentChapter = await writing.createChapter(ownerActor, { projectId: project.id, title: "Concurrent chapter" });
    const concurrentInputs = [
      { baseVersion: 1, clientSaveId: randomUUID(), document: documentWith("concurrent A") },
      { baseVersion: 1, clientSaveId: randomUUID(), document: documentWith("concurrent B") }
    ];
    const simultaneous = await Promise.allSettled(concurrentInputs.map((input) => durability.saveDraft(ownerActor, concurrentChapter.chapter.id, input)));
    for (let index = 0; index < simultaneous.length; index += 1) {
      if (simultaneous[index]?.status === "rejected") {
        await durability.saveDraft(ownerActor, concurrentChapter.chapter.id, concurrentInputs[index]!).catch(() => undefined);
      }
    }
    const concurrentStored = await prisma.chapter.findUniqueOrThrow({ where: { id: concurrentChapter.chapter.id } });
    const concurrentConflicts = await prisma.draftConflict.count({ where: { chapterId: concurrentChapter.chapter.id } });
    if (concurrentStored.version !== 2 || concurrentConflicts !== 1) throw new Error("Concurrent same-base saves did not preserve exactly one winner and one conflict.");

    await durability.saveDraft(outsiderActor, chapterId, { baseVersion: 5, clientSaveId: randomUUID(), document: localDocument })
      .then(() => { throw new Error("Cross-workspace save succeeded."); })
      .catch((error: unknown) => { if (!(error instanceof Error) || error.message === "Cross-workspace save succeeded.") throw error; });

    const stored = await prisma.chapter.findUniqueOrThrow({ where: { id: chapterId } });
    const revisionCount = await prisma.chapterRevision.count({ where: { chapterId } });
    const conflictCount = await prisma.draftConflict.count({ where: { chapterId } });
    // Console trace S2-DB-001: idempotency, conflict variants/resolutions, checkpoint, and ownership passed without content emission.
    console.log(JSON.stringify({ level: "info", step: "S2-DB-001", event: "durability_database.verified", chapterId, version: stored.version, receiptReplay: true, conflictCount, revisionCount, recoveryCreated: true, concurrentSameBaseAttempts: 2, concurrentWinnerCount: 1, concurrentConflictCount: 1, crossWorkspaceSave: false }));
  } finally { await prisma.$disconnect(); }
}

async function rollback(): Promise<void> {
  const sql = await readFile(new URL("../prisma/migrations/20260812190000_durability/rollback.sql", import.meta.url), "utf8");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(sql);
    const remaining = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('ChapterRevision','DraftConflict','ChapterSaveReceipt')`);
    const parents = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('Project','Chapter')`);
    if (remaining.rows[0]?.count !== "0" || parents.rows[0]?.count !== "2") throw new Error("Durability rollback crossed its capability boundary.");
    await client.query(`DELETE FROM "_prisma_migrations" WHERE migration_name = '20260812190000_durability'`);
    // Console trace S2-DB-002: durability-only rollback preserved Project/Chapter structures.
    console.log(JSON.stringify({ level: "info", step: "S2-DB-002", event: "durability_database.rollback_verified", remainingDurabilityTables: 0, preservedEditorTables: 2 }));
  } finally { await client.end(); }
}

const command = process.argv[2] ?? "verify";
if (command === "verify") await verify();
else if (command === "rollback") await rollback();
else throw new Error("Expected verify or rollback command.");
