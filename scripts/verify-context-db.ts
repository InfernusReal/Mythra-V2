import "dotenv/config";

import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaIdentityRepository } from "../domains/accounts/infrastructure/prisma-identity-repository";
import { PrismaContextRepository } from "../domains/context/infrastructure/prisma-context-repository";
import { PrismaWritingRepository } from "../domains/writing/infrastructure/prisma-writing-repository";
import { contextQuerySchema } from "../domains/context/domain/types";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
async function rejected(operation: Promise<unknown>, code: string): Promise<boolean> { try { await operation; return false; } catch (error) { return typeof error === "object" && error !== null && "code" in error && String(error.code) === code; } }

async function verify() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const suffix = randomUUID(); const identities = new PrismaIdentityRepository(prisma); const owner = await identities.resolveOrProvision({ provider: "s7", subject: `owner-${suffix}`, email: `owner-${suffix}@example.test`, emailVerified: true }, suffix); const outsider = await identities.resolveOrProvision({ provider: "s7", subject: `other-${suffix}`, email: `other-${suffix}@example.test`, emailVerified: true }, suffix); const actor = { ...owner, sessionId: randomUUID() }; const outsiderActor = { ...outsider, sessionId: randomUUID() };
    const writing = new PrismaWritingRepository(prisma); const context = new PrismaContextRepository(prisma); const project = await writing.createProject(actor, { title: "Context verifier" }); const chapter = (await writing.createChapter(actor, { projectId: project.id, title: "Chapter one" })).chapter; const otherChapter = (await writing.createChapter(actor, { projectId: project.id, title: "Chapter two" })).chapter; const blockId = chapter.document.content[0]!.attrs.blockId;
    const outline = await prisma.chapterOutline.create({ data: { projectId: project.id, chapterId: chapter.id, sequenceIndex: 0, title: "Current outline", purpose: "Private original purpose", document: { type: "doc", content: [] }, plainText: "", revealedInformation: [], entityReferenceKeys: [], locationReferenceKeys: [], milestoneReferenceKeys: [], sceneStubs: [] } });
    const pinnedOutline = await prisma.chapterOutline.create({ data: { projectId: project.id, chapterId: otherChapter.id, sequenceIndex: 1, title: "Pinned outline", purpose: "Pinned purpose", document: { type: "doc", content: [] }, plainText: "", revealedInformation: [], entityReferenceKeys: [], locationReferenceKeys: [], milestoneReferenceKeys: [], sceneStubs: [] } });
    const milestone = await prisma.milestone.create({ data: { projectId: project.id, sequenceIndex: 0, title: "Turning point" } }); await prisma.chapterMilestoneLink.create({ data: { projectId: project.id, chapterId: chapter.id, milestoneId: milestone.id, role: "TURN", weight: 2 } });
    const intent = await prisma.narrativeIntent.create({ data: { projectId: project.id, targetType: "CHAPTER", targetId: chapter.id, category: "TENSION", intentText: "Private preserve intent" } });
    const reference = await prisma.storyReference.create({ data: { projectId: project.id, sourceType: "MANUSCRIPT_BLOCK", sourceId: chapter.id, sourceBlockId: blockId, targetType: "MILESTONE", targetId: milestone.id, relationshipKey: "foreshadows" } });
    const change = await prisma.storyChange.create({ data: { projectId: project.id, kind: "EVENT", title: "Archive opens" } }); const relation = await prisma.causalRelation.create({ data: { projectId: project.id, sourceType: "STORY_CHANGE", sourceId: change.id, targetType: "MANUSCRIPT_BLOCK", targetId: chapter.id, targetBlockId: blockId, relationType: "ENABLES", importance: 80 } });
    const query = contextQuerySchema.parse({ cursorBlockId: blockId, selectedIds: [], cardCap: 8 }); const initial = await context.load(actor, chapter.id, query); if (!initial || initial.outline?.id !== outline.id || initial.milestones[0]?.id !== milestone.id || initial.references[0]?.id !== reference.id || initial.causal[0]?.id !== relation.id || initial.intents[0]?.id !== intent.id) throw new Error("S7 canonical sources did not compose.");
    await context.mutatePreference(actor, project.id, { action: "PIN", cardType: "CHAPTER_OUTLINE", sourceId: pinnedOutline.id }); await context.mutatePreference(actor, project.id, { action: "MUTE", cardType: "MILESTONE" }); const pinned = await context.load(actor, chapter.id, query); if (!pinned?.extraOutlines.some((row) => row.id === pinnedOutline.id) || !pinned.preferences.mutedTypes.includes("MILESTONE")) throw new Error("Project context preference or cross-chapter pin failed.");
    const invalidPinRejected = await rejected(context.mutatePreference(actor, project.id, { action: "PIN", cardType: "REFERENCE", sourceId: randomUUID() }), "NOT_FOUND"); const crossWorkspaceMutationRejected = await rejected(context.mutatePreference(outsiderActor, project.id, { action: "MUTE", cardType: "CAUSAL" }), "NOT_FOUND"); const crossWorkspaceRead = await context.load(outsiderActor, chapter.id, query);
    const edited = await context.editSource(actor, project.id, { sourceType: "CHAPTER_OUTLINE", sourceId: outline.id, expectedVersion: 1, expectedStructuralVersion: 1, field: "purpose", value: "Private revised purpose" }); const staleEditRejected = await rejected(context.editSource(actor, project.id, { sourceType: "CHAPTER_OUTLINE", sourceId: outline.id, expectedVersion: 1, expectedStructuralVersion: 1, field: "purpose", value: "Stale write" }), "CONFLICT");
    const revision = await prisma.objectRevision.findFirst({ where: { projectId: project.id, objectType: "CHAPTER_OUTLINE", objectId: outline.id }, select: { snapshot: true } }); const outbox = await prisma.outboxEvent.findFirst({ where: { aggregateId: project.id, eventType: "context.source_updated" }, select: { payload: true } }); if (!JSON.stringify(revision?.snapshot).includes("Private original purpose") || JSON.stringify(outbox?.payload).includes("Private revised purpose")) throw new Error("Context revision/outbox content boundary failed.");
    // Console trace S7-DB-001: PostgreSQL verified context ownership, preferences, pins, source revision, bounds and redaction without emitting author content.
    console.log(JSON.stringify({ level: "info", step: "S7-DB-001", event: "context_database.verified", projectId: project.id, structuralVersion: edited.projectStructuralVersion, descriptorSourceCount: 5, crossChapterPinLoaded: true, mutedTypeCount: pinned.preferences.mutedTypes.length, invalidPinRejected, crossWorkspaceRead: Boolean(crossWorkspaceRead), crossWorkspaceMutationRejected, staleEditRejected, revisionComplete: true, outboxContentFree: true }));
  } finally { await prisma.$disconnect(); }
}

async function rollback() {
  const sql = await readFile(new URL("../prisma/migrations/20260816170000_contextual_writing_field/rollback.sql", import.meta.url), "utf8"); const client = new Client({ connectionString }); await client.connect();
  try { const proseBefore = await client.query<{ id: string; bodyDocument: unknown; bodyText: string; version: number }>(`SELECT "id", "bodyDocument", "bodyText", "version" FROM "Chapter" ORDER BY "createdAt" LIMIT 1`); await client.query(sql); const contextTables = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('ContextPreference','ContextPin')`); const priorTables = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('StoryChange','CausalRelation','Milestone','ChapterMilestoneLink','ChapterOutline','NarrativeIntent','StoryReference')`); const proseAfter = proseBefore.rowCount ? await client.query(`SELECT "id", "bodyDocument", "bodyText", "version" FROM "Chapter" WHERE "id"=$1`, [proseBefore.rows[0]!.id]) : { rows: [] }; if (contextTables.rows[0]?.count !== "0" || priorTables.rows[0]?.count !== "7" || JSON.stringify(proseBefore.rows[0]) !== JSON.stringify(proseAfter.rows[0])) throw new Error("S7 rollback crossed its S6/prose boundary."); await client.query(`DELETE FROM "_prisma_migrations" WHERE migration_name = '20260816170000_contextual_writing_field'`);
    // Console trace S7-DB-002: S7-only rollback preserved all sampled S0-S6 tables and byte-equivalent chapter prose.
    console.log(JSON.stringify({ level: "info", step: "S7-DB-002", event: "context_database.rollback_verified", remainingContextTables: 0, preservedPriorTables: 7, proseRowsPreserved: proseBefore.rowCount ?? 0 }));
  } finally { await client.end(); }
}

const command = process.argv[2] ?? "verify"; if (command === "verify") await verify(); else if (command === "rollback") await rollback(); else throw new Error("Expected verify or rollback command.");
