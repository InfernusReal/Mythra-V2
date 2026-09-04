import "dotenv/config";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaIdentityRepository } from "../domains/accounts/infrastructure/prisma-identity-repository";
import { CaptureService } from "../domains/capture/application/service";
import { PrismaCaptureRepository } from "../domains/capture/infrastructure/prisma-capture-repository";
import { NoteService } from "../domains/notes/application/service";
import { PrismaNoteRepository } from "../domains/notes/infrastructure/prisma-note-repository";
import { SuggestionService } from "../domains/suggestions/application/service";
import { PrismaSuggestionRepository } from "../domains/suggestions/infrastructure/prisma-suggestion-repository";
import { AgentToolService, type AgentToolDependencies } from "../domains/tools/application/service";
import { PrismaAgentToolAuditRepository } from "../domains/tools/infrastructure/prisma-tool-audit-repository";
import { PrismaAgentToolReadModel } from "../domains/tools/infrastructure/prisma-tool-read-model";
import { PrismaWritingRepository } from "../domains/writing/infrastructure/prisma-writing-repository";
import { createLogger } from "../lib/observability/logger";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
const logger = createLogger({ service: "s17-database-verifier" });
const unavailable = async () => { throw new Error("Unused verifier dependency."); };
async function rejected(operation: Promise<unknown>, code: string) { try { await operation; return false; } catch (error) { return typeof error === "object" && error !== null && "code" in error && String(error.code) === code; } }

async function verify() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const suffix = randomUUID(); const identities = new PrismaIdentityRepository(prisma);
    const owner = await identities.resolveOrProvision({ provider: "s17", subject: `owner-${suffix}`, email: `owner-${suffix}@example.test`, emailVerified: true }, suffix);
    const outsider = await identities.resolveOrProvision({ provider: "s17", subject: `outsider-${suffix}`, email: `outsider-${suffix}@example.test`, emailVerified: true }, suffix);
    const actor = { ...owner, sessionId: randomUUID() }; const outsiderActor = { ...outsider, sessionId: randomUUID() };
    const writing = new PrismaWritingRepository(prisma); const project = await writing.createProject(actor, { title: "S17 verifier" }); const chapter = (await writing.createChapter(actor, { projectId: project.id, title: "S17 chapter" })).chapter;
    const privateProse = `private-${suffix}-`.repeat(1_200); await prisma.chapter.update({ where: { id: chapter.id }, data: { bodyText: privateProse } });
    const suggestions = new SuggestionService(new PrismaSuggestionRepository(prisma), logger); const notes = new NoteService(new PrismaNoteRepository(prisma), logger); const captures = new CaptureService(new PrismaCaptureRepository(prisma), logger);
    const readModel = new PrismaAgentToolReadModel(prisma);
    const dependencies = { readModel, suggestions, notes, captures, audit: new PrismaAgentToolAuditRepository(prisma), logger, search: { query: unavailable }, universe: { list: unavailable, detail: unavailable }, causality: { getNeighborhood: unavailable, traceImpact: unavailable } } as unknown as AgentToolDependencies;
    const tools = new AgentToolService(dependencies);
    const listed = await tools.list(actor, project.id, randomUUID());
    const text = await tools.call(actor, project.id, ["READ"], "get_chapter_text", { chapterId: chapter.id, start: 7, length: 8_000 }, randomUUID());
    const canonicalBefore = { relations: await prisma.causalRelation.count({ where: { projectId: project.id } }), milestones: await prisma.milestone.count({ where: { projectId: project.id } }) };
    const targetId = randomUUID(); const proposed = await tools.call(actor, project.id, ["PROPOSE"], "propose_structure_patch", { sourceAgent: "verifier.agent", idempotencyKey: "structure", finding: "Verifier finding", expectedStructuralVersion: 1, targetType: "MILESTONE", targetId, evidenceReferences: [{ type: "CHAPTER", id: chapter.id, relationship: "supports" }], operations: [{ operation: "replace", targetType: "MILESTONE", targetId, path: "/title", value: "Proposed only" }] }, randomUUID());
    const replayed = await tools.call(actor, project.id, ["PROPOSE"], "propose_structure_patch", { sourceAgent: "verifier.agent", idempotencyKey: "structure", finding: "Verifier finding", expectedStructuralVersion: 1, targetType: "MILESTONE", targetId, evidenceReferences: [{ type: "CHAPTER", id: chapter.id, relationship: "supports" }], operations: [{ operation: "replace", targetType: "MILESTONE", targetId, path: "/title", value: "Proposed only" }] }, randomUUID());
    const source = { type: "MILESTONE" as const, id: randomUUID() }; const target = { type: "MILESTONE" as const, id: randomUUID() };
    await tools.call(actor, project.id, ["PROPOSE"], "propose_causal_relation", { sourceAgent: "verifier.agent", idempotencyKey: "causal", finding: "Verifier causal finding", expectedStructuralVersion: 1, source, target, relationType: "CAUSES" }, randomUUID());
    const concurrentProposals = await Promise.all(Array.from({ length: 3 }, () => suggestions.create(actor, project.id, { sourceAgent: "verifier.concurrent", idempotencyKey: "same-proposal", category: "continuity", finding: "Concurrent verifier finding", evidenceReferences: [], proposedActions: [] }, randomUUID())));
    const concurrentSuggestionIds = new Set(concurrentProposals.map((result) => result.suggestion.id));
    const noteCall = { authorConfirmed: true as const, idempotencyKey: "note", title: "Verifier note", body: "Private verifier note" }; const note = await tools.call(actor, project.id, ["WRITE_METADATA"], "create_note", noteCall, randomUUID()); const noteReplay = await tools.call(actor, project.id, ["WRITE_METADATA"], "create_note", noteCall, randomUUID());
    const concurrentNotes = await Promise.all(Array.from({ length: 3 }, () => notes.write(actor, project.id, { title: noteCall.title, body: noteCall.body, tags: [], toolIdempotencyKey: "concurrent-note" }, randomUUID())));
    const concurrentNoteIds = new Set(concurrentNotes.map((result) => result.note.id));
    const captureCall = { authorConfirmed: true as const, clientCaptureId: "capture", rawText: "Private verifier capture", route: `/app/chapters/${chapter.id}`, chapterId: chapter.id, entityContext: [], capturedAt: new Date().toISOString() }; const capture = await tools.call(actor, project.id, ["WRITE_METADATA"], "create_capture", captureCall, randomUUID()); const captureReplay = await tools.call(actor, project.id, ["WRITE_METADATA"], "create_capture", captureCall, randomUUID());
    const restrictedRejected = await rejected(tools.call(actor, project.id, ["RESTRICTED_WRITE"], "replace_prose_range", { authorConfirmed: true, chapterId: chapter.id, start: 0, length: 1, replacement: "x" }, randomUUID()), "FORBIDDEN");
    const open = await suggestions.list(actor, project.id, { status: "open", limit: 100 }, randomUUID()); const first = open.suggestions[0]!; await suggestions.resolve(actor, project.id, first.id, { expectedVersion: first.version, status: "accepted", authorNote: "Author reviewed." }, randomUUID());
    for (const status of ["modified", "rejected", "intentional"] as const) {
      const created = await suggestions.create(actor, project.id, { sourceAgent: "verifier.status", idempotencyKey: status, category: "lifecycle", finding: `Verify ${status}.`, evidenceReferences: [], proposedActions: [] }, randomUUID());
      await suggestions.resolve(actor, project.id, created.suggestion.id, { expectedVersion: created.suggestion.version, status, ...(status === "modified" ? { authorNote: "Author modification recorded." } : {}) }, randomUUID());
    }
    const outsiderRejected = await rejected(suggestions.list(outsiderActor, project.id, { limit: 10 }, randomUUID()), "NOT_FOUND");
    const canonicalAfter = { relations: await prisma.causalRelation.count({ where: { projectId: project.id } }), milestones: await prisma.milestone.count({ where: { projectId: project.id } }) };
    const suggestionRows = await prisma.suggestion.findMany({ where: { projectId: project.id } }); const audits = await prisma.auditEvent.count({ where: { workspaceId: actor.workspaceId, kind: "AGENT_TOOL_ACCESS", targetId: project.id } });
    const lifecycleStatuses = new Set(suggestionRows.map((row) => row.status));
    const noteRows = await prisma.note.count({ where: { projectId: project.id, toolIdempotencyKey: { in: ["note", "concurrent-note"] } } }); const captureRows = await prisma.capture.count({ where: { projectId: project.id, clientCaptureId: "capture" } });
    const shape = await prisma.$queryRaw<Array<{ tables: bigint; indexes: bigint; checks: bigint; columns: bigint }>>`SELECT (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='Suggestion')::bigint AS tables, (SELECT COUNT(*) FROM pg_indexes WHERE tablename='Suggestion')::bigint AS indexes, (SELECT COUNT(*) FROM pg_constraint WHERE conname LIKE 'Suggestion_%_check')::bigint AS checks, (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='Note' AND column_name='toolIdempotencyKey')::bigint AS columns`;
    const serialized = JSON.stringify({ text, proposed, replayed, note, noteReplay, capture, captureReplay });
    const passed = listed.tools.length === 20 && serialized.includes(privateProse.slice(7, 100)) && !serialized.includes(privateProse.slice(8_008)) && suggestionRows.length === 6 && concurrentSuggestionIds.size === 1 && concurrentNoteIds.size === 1 && lifecycleStatuses.size === 5 && canonicalBefore.relations === canonicalAfter.relations && canonicalBefore.milestones === canonicalAfter.milestones && noteRows === 2 && captureRows === 1 && restrictedRejected && outsiderRejected && audits === 9 && Number(shape[0]?.tables ?? 0) === 1 && Number(shape[0]?.indexes ?? 0) >= 5 && Number(shape[0]?.checks ?? 0) >= 6 && Number(shape[0]?.columns ?? 0) === 1;
    if (!passed) throw new Error("S17 database proof failed.");
    // Console trace S17-DB-001: database proof records stable identities, schema/count bounds and security outcomes without prose, finding, Note or Capture content.
    console.log(JSON.stringify({ level: "info", step: "S17-DB-001", event: "agent_tool_seam_database.verified", workspaceId: actor.workspaceId, projectId: project.id, chapterId: chapter.id, toolCount: listed.tools.length, suggestionCount: suggestionRows.length, suggestionStatusCount: lifecycleStatuses.size, concurrentSuggestionRows: concurrentSuggestionIds.size, agentAuditCount: audits, boundedCharacters: 8_000, canonicalMutationCount: canonicalAfter.relations - canonicalBefore.relations + canonicalAfter.milestones - canonicalBefore.milestones, noteRows, concurrentNoteRows: concurrentNoteIds.size, captureRows, restrictedRejected, outsiderRejected, tableCount: Number(shape[0]!.tables), indexCount: Number(shape[0]!.indexes), checkCount: Number(shape[0]!.checks) }));
  } finally { await prisma.$disconnect(); }
}

async function rollback() {
  const client = new Client({ connectionString }); await client.connect();
  try {
    const before = await client.query<{ workspaces: string; projects: string; chapters: string; notes: string }>(`SELECT (SELECT COUNT(*) FROM "Workspace")::text AS workspaces, (SELECT COUNT(*) FROM "Project")::text AS projects, (SELECT COUNT(*) FROM "Chapter")::text AS chapters, (SELECT COUNT(*) FROM "Note")::text AS notes`);
    const sql = await readFile(new URL("../prisma/migrations/20260902173000_agent_tool_seam/rollback.sql", import.meta.url), "utf8"); await client.query(sql);
    const after = await client.query<{ workspaces: string; projects: string; chapters: string; notes: string }>(`SELECT (SELECT COUNT(*) FROM "Workspace")::text AS workspaces, (SELECT COUNT(*) FROM "Project")::text AS projects, (SELECT COUNT(*) FROM "Chapter")::text AS chapters, (SELECT COUNT(*) FROM "Note")::text AS notes`);
    const remaining = await client.query<{ tables: string; enums: string; columns: string }>(`SELECT (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='Suggestion')::text AS tables, (SELECT COUNT(*) FROM pg_type WHERE typname='SuggestionStatus')::text AS enums, (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='Note' AND column_name='toolIdempotencyKey')::text AS columns`);
    if (JSON.stringify(before.rows[0]) !== JSON.stringify(after.rows[0]) || remaining.rows[0]?.tables !== "0" || remaining.rows[0]?.enums !== "0" || remaining.rows[0]?.columns !== "0") throw new Error("S17 rollback crossed the predecessor boundary.");
    await client.query(`DELETE FROM "_prisma_migrations" WHERE migration_name='20260902173000_agent_tool_seam'`);
    // Console trace S17-DB-002: rollback proof records removed S17 schema and preserved predecessor row counts only.
    console.log(JSON.stringify({ level: "info", step: "S17-DB-002", event: "agent_tool_seam_database.rollback_verified", remainingS17Tables: 0, remainingS17Enums: 0, remainingS17Columns: 0, preservedWorkspaceRows: Number(after.rows[0]!.workspaces), preservedProjectRows: Number(after.rows[0]!.projects), preservedChapterRows: Number(after.rows[0]!.chapters), preservedNoteRows: Number(after.rows[0]!.notes) }));
  } finally { await client.end(); }
}

const command = process.argv[2] ?? "verify";
if (command === "verify") await verify(); else if (command === "rollback") await rollback(); else throw new Error("Expected verify or rollback command.");
