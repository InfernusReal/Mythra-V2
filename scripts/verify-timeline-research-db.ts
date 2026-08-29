import "dotenv/config";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaIdentityRepository } from "../domains/accounts/infrastructure/prisma-identity-repository";
import { PrismaWritingRepository } from "../domains/writing/infrastructure/prisma-writing-repository";
import { TimelineService } from "../domains/timeline/application/service";
import { PrismaTimelineRepository } from "../domains/timeline/infrastructure/prisma-timeline-repository";
import { NoteService } from "../domains/notes/application/service";
import { PrismaNoteRepository } from "../domains/notes/infrastructure/prisma-note-repository";
import { ResearchService } from "../domains/research/application/service";
import { PrismaResearchRepository } from "../domains/research/infrastructure/prisma-research-repository";
import { DeterministicMalwareScanner, FilesystemPrivateObjectStorage } from "../domains/research/infrastructure/local-storage";
import { HmacAssetAccessTokenService } from "../domains/research/infrastructure/signed-asset-access";
import { PrismaCaptureRepository } from "../domains/capture/infrastructure/prisma-capture-repository";
import { PrismaSearchRepository } from "../domains/search/infrastructure/prisma-search-repository";
import { createPrismaEndpointRegistry } from "../domains/causality/infrastructure/prisma-endpoint-adapters";
import { validateCausalChronology } from "../domains/causality/domain/chronology";
import type { Logger } from "../lib/observability/logger";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
const logger = { info() {}, warn() {}, error() {}, debug() {}, child() { return this; } } as Logger;

async function rejected(operation: Promise<unknown>, code: string) {
  try { await operation; return false; } catch (error) { return typeof error === "object" && error !== null && "code" in error && String(error.code) === code; }
}

async function verify() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const storageRoot = await mkdtemp(path.join(tmpdir(), "mythra-s11-"));
  try {
    const suffix = randomUUID(); const identities = new PrismaIdentityRepository(prisma);
    const owner = await identities.resolveOrProvision({ provider: "s11", subject: `owner-${suffix}`, email: `owner-${suffix}@example.test`, emailVerified: true }, suffix);
    const outsider = await identities.resolveOrProvision({ provider: "s11", subject: `outsider-${suffix}`, email: `outsider-${suffix}@example.test`, emailVerified: true }, suffix);
    const actor = { ...owner, sessionId: randomUUID() }; const outsiderActor = { ...outsider, sessionId: randomUUID() };
    const writing = new PrismaWritingRepository(prisma); const project = await writing.createProject(actor, { title: "S11 verifier" }); const chapter = (await writing.createChapter(actor, { projectId: project.id, title: "Verifier chapter" })).chapter;
    const timeline = new TimelineService(new PrismaTimelineRepository(prisma), logger); let structuralVersion = 1;
    const absolute = await timeline.write(actor, project.id, { mode: "ABSOLUTE", title: "Exact verifier", displayLabel: "Year of Ash 10", sortStart: 10 }, randomUUID()); structuralVersion = absolute.projectStructuralVersion;
    const approximate = await timeline.write(actor, project.id, { mode: "APPROXIMATE", title: "Approx verifier", displayLabel: "Around the thaw", sortStart: 12 }, randomUUID()); structuralVersion = approximate.projectStructuralVersion;
    const relative = await timeline.write(actor, project.id, { mode: "RELATIVE", title: "Relative verifier", displayLabel: "Three beats later", relativeToEventId: absolute.event.id, relativeOffset: 3 }, randomUUID()); structuralVersion = relative.projectStructuralVersion;
    const ordinal = await timeline.write(actor, project.id, { mode: "ORDINAL", title: "Ordinal verifier", displayLabel: "First remembered", ordinalValue: 1 }, randomUUID()); structuralVersion = ordinal.projectStructuralVersion;
    const range = await timeline.write(actor, project.id, { mode: "RANGE", title: "Range verifier", displayLabel: "The long winter", sortStart: 20, sortEnd: 30 }, randomUUID()); structuralVersion = range.projectStructuralVersion;
    const link = await timeline.link(actor, project.id, { eventId: absolute.event.id, targetType: "CHAPTER", targetId: chapter.id }, randomUUID()); const replayLink = await timeline.link(actor, project.id, { eventId: absolute.event.id, targetType: "CHAPTER", targetId: chapter.id }, randomUUID());
    const notes = new NoteService(new PrismaNoteRepository(prisma), logger); const note = await notes.write(actor, project.id, { title: "Verifier note", body: "Private durable verifier body", tags: [" Lore ", "lore", "Chronology"] }, randomUUID()); await prisma.storyReference.create({ data: { projectId: project.id, sourceType: "CHAPTER", sourceId: chapter.id, targetType: "NOTE", targetId: note.note.id, relationshipKey: "references" } }); const tagged = await notes.list(actor, project.id, { tag: "LORE", limit: 100 }, randomUUID());
    const storyChangePromotion = await notes.promote(actor, project.id, { noteId: note.note.id, targetType: "STORY_CHANGE", idempotencyKey: "s11-story-change", expectedStructuralVersion: structuralVersion }, randomUUID()); structuralVersion = storyChangePromotion.projectStructuralVersion; const milestonePromotion = await notes.promote(actor, project.id, { noteId: note.note.id, targetType: "MILESTONE", idempotencyKey: "s11-milestone", expectedStructuralVersion: structuralVersion }, randomUUID()); structuralVersion = milestonePromotion.projectStructuralVersion; const outlinePromotion = await notes.promote(actor, project.id, { noteId: note.note.id, targetType: "CHAPTER_OUTLINE", idempotencyKey: "s11-outline", expectedStructuralVersion: structuralVersion }, randomUUID()); structuralVersion = outlinePromotion.projectStructuralVersion; const promotionReplay = await notes.promote(actor, project.id, { noteId: note.note.id, targetType: "STORY_CHANGE", idempotencyKey: "s11-story-change", expectedStructuralVersion: structuralVersion }, randomUUID());
    const researchRepository = new PrismaResearchRepository(prisma); const research = new ResearchService(researchRepository, new FilesystemPrivateObjectStorage(storageRoot), new DeterministicMalwareScanner(), new HmacAssetAccessTokenService("s".repeat(64)), logger);
    const variants = [
      await research.create(actor, project.id, { kind: "NOTE", title: "Research note", body: "Verifier research" }, randomUUID()),
      await research.create(actor, project.id, { kind: "URL", title: "Research URL", url: "https://example.test/verifier" }, randomUUID()),
      await research.create(actor, project.id, { kind: "EXCERPT", title: "Research excerpt", excerpt: "User-authored verifier excerpt" }, randomUUID()),
      await research.create(actor, project.id, { kind: "CITATION", title: "Research citation", citation: "Verifier citation" }, randomUUID())
    ];
    const linkedResearch = variants[0]; if (!linkedResearch) throw new Error("Research variant fixture missing.");
    const uploaded = await research.upload(actor, project.id, { name: "verifier.txt", type: "text/plain", bytes: new TextEncoder().encode("clean verifier file") }, randomUUID()); const fileItem = await research.create(actor, project.id, { kind: "FILE", title: "Verifier file", assetId: uploaded.assetId }, randomUUID());
    const access = await research.issueAssetAccess(actor, project.id, uploaded.assetId, randomUUID()); const accessToken = new URL(`https://mythra.test${access.href}`).searchParams.get("access"); if (!accessToken) throw new Error("Signed token missing."); const downloaded = await research.download(actor, project.id, uploaded.assetId, accessToken, randomUUID()); const crossActorTokenRejected = await rejected(research.download(outsiderActor, project.id, uploaded.assetId, accessToken, randomUUID()), "FORBIDDEN");
    const researchLink = await research.link(actor, project.id, { researchItemId: linkedResearch.item.id, targetType: "CHAPTER", targetId: chapter.id }, randomUUID()); const researchLinkReplay = await research.link(actor, project.id, { researchItemId: linkedResearch.item.id, targetType: "CHAPTER", targetId: chapter.id }, randomUUID());
    const captureRepository = new PrismaCaptureRepository(prisma); const capture = await captureRepository.create(actor, { clientCaptureId: randomUUID(), projectId: project.id, rawText: "Verifier Capture conversion", route: `/app/chapters/${chapter.id}`, chapterId: chapter.id, entityContext: [], capturedAt: new Date().toISOString() }); const captureNote = await captureRepository.convert(actor, project.id, capture.capture.id, { conversionType: "NOTE", idempotencyKey: "note", targetBlockId: "", expectedStructuralVersion: structuralVersion }); structuralVersion = captureNote.projectStructuralVersion; const captureTimeline = await captureRepository.convert(actor, project.id, capture.capture.id, { conversionType: "TIMELINE_EVENT", idempotencyKey: "timeline", targetBlockId: "", expectedStructuralVersion: structuralVersion }); structuralVersion = captureTimeline.projectStructuralVersion;
    const registry = createPrismaEndpointRegistry(prisma); const exactEndpoint = await registry.resolve(project.id, { type: "TIMELINE_EVENT", id: absolute.event.id }); const relativeEndpoint = await registry.resolve(project.id, { type: "TIMELINE_EVENT", id: relative.event.id }); const ordinalEndpoint = await registry.resolve(project.id, { type: "TIMELINE_EVENT", id: ordinal.event.id }); const chronology = validateCausalChronology(exactEndpoint, relativeEndpoint, "CAUSES");
    const search = new PrismaSearchRepository(prisma); await search.synchronize(actor, project.id); const searchTypes = await prisma.searchDocument.groupBy({ by: ["documentType"], where: { projectId: project.id } }); const activeSearch = new Set(searchTypes.map((row) => String(row.documentType)));
    const outsiderRejected = await rejected(timeline.list(outsiderActor, project.id, { limit: 100 }, randomUUID()), "NOT_FOUND"); const invalidRangeRejected = await rejected(prisma.$executeRawUnsafe(`INSERT INTO "TimelineEvent" ("projectId","title","mode","displayLabel","sortStart","sortEnd") VALUES ($1::uuid,'invalid','RANGE','invalid',10,1)`, project.id), "P2010");
    const databaseShape = await prisma.$queryRaw<Array<{ table_count: bigint; index_count: bigint }>>`SELECT (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('TimelineEvent','TimelineEventLink','Note','NotePromotion','StoredAsset','ResearchItem','ResearchItemLink'))::bigint AS table_count, (SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('TimelineEvent','TimelineEventLink','Note','StoredAsset','ResearchItem','ResearchItemLink'))::bigint AS index_count`;
    const promotionTargets = new Set([storyChangePromotion.targetType, milestonePromotion.targetType, outlinePromotion.targetType]); const passed = new Set([absolute.event.mode, approximate.event.mode, relative.event.mode, ordinal.event.mode, range.event.mode]).size === 5 && link.linkId === replayLink.linkId && replayLink.replayed && tagged.notes.some((row) => row.id === note.note.id && row.backlinkCount === 1) && promotionTargets.size === 3 && promotionReplay.replayed && variants.length === 4 && fileItem.item.asset?.scanStatus === "CLEAN" && new TextDecoder().decode(downloaded.bytes) === "clean verifier file" && crossActorTokenRejected && researchLink.linkId === researchLinkReplay.linkId && researchLinkReplay.replayed && captureNote.targetType === "NOTE" && captureTimeline.targetType === "TIMELINE_EVENT" && exactEndpoint.storyTime === 10 && relativeEndpoint.storyTime === 13 && ordinalEndpoint.storyTime === null && chronology.status === "CONSISTENT" && ["TIMELINE_EVENT", "NOTE", "RESEARCH"].every((type) => activeSearch.has(type)) && outsiderRejected && invalidRangeRejected && Number(databaseShape[0]?.table_count ?? 0) === 7 && Number(databaseShape[0]?.index_count ?? 0) >= 12;
    if (!passed) throw new Error("S11 Timeline/Research database invariant failed.");
    // Console trace S11-DB-001: database proof records owned identities, counts, modes, security outcomes and versions only; authored text, URLs, labels, tokens, keys and bytes are excluded.
    console.log(JSON.stringify({ level: "info", step: "S11-DB-001", event: "timeline_research_database.verified", projectId: project.id, chapterId: chapter.id, eventCount: 5, modeCount: 5, noteId: note.note.id, noteBacklinkCount: tagged.notes.find((row) => row.id === note.note.id)?.backlinkCount ?? 0, promotionTargetCount: promotionTargets.size, researchVariantCount: variants.length + 1, signedDownloadBytes: downloaded.bytes.length, crossActorTokenRejected, researchLinkReplay: researchLinkReplay.replayed, captureNoteId: captureNote.targetId, captureTimelineId: captureTimeline.targetId, exactCoordinate: exactEndpoint.storyTime, relativeCoordinate: relativeEndpoint.storyTime, ordinalNeutral: ordinalEndpoint.storyTime === null, chronologyStatus: chronology.status, activeS11SearchTypes: ["TIMELINE_EVENT", "NOTE", "RESEARCH"].filter((type) => activeSearch.has(type)).length, outsiderRejected, invalidRangeRejected, tableCount: Number(databaseShape[0]!.table_count), indexCount: Number(databaseShape[0]!.index_count), structuralVersion }));
  } finally { await prisma.$disconnect(); await rm(storageRoot, { recursive: true, force: true }); }
}

async function rollback() {
  const sql = await readFile(new URL("../prisma/migrations/20260828080000_timeline_research/rollback.sql", import.meta.url), "utf8"); const client = new Client({ connectionString }); await client.connect();
  try {
    const chapterBefore = await client.query(`SELECT "id", "bodyDocument", "bodyText", "version" FROM "Chapter" ORDER BY "createdAt" DESC LIMIT 1`); const captureBefore = await client.query(`SELECT "id", "rawText", "version" FROM "Capture" ORDER BY "capturedAt" DESC LIMIT 1`); const entityBefore = await client.query(`SELECT "id", "name", "aliasesJson", "version" FROM "StoryEntity" ORDER BY "createdAt" DESC LIMIT 1`);
    await client.query(sql);
    const remaining = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('TimelineEvent','TimelineEventLink','Note','NotePromotion','StoredAsset','ResearchItem','ResearchItemLink')`); const enums = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM pg_type WHERE typname IN ('TimelineMode','TimelineLinkTargetType','ResearchItemKind','AssetScanStatus')`);
    const chapterAfter = chapterBefore.rowCount ? await client.query(`SELECT "id", "bodyDocument", "bodyText", "version" FROM "Chapter" WHERE "id"=$1`, [(chapterBefore.rows[0] as { id: string }).id]) : { rows: [] }; const captureAfter = captureBefore.rowCount ? await client.query(`SELECT "id", "rawText", "version" FROM "Capture" WHERE "id"=$1`, [(captureBefore.rows[0] as { id: string }).id]) : { rows: [] }; const entityAfter = entityBefore.rowCount ? await client.query(`SELECT "id", "name", "aliasesJson", "version" FROM "StoryEntity" WHERE "id"=$1`, [(entityBefore.rows[0] as { id: string }).id]) : { rows: [] };
    if (remaining.rows[0]?.count !== "0" || enums.rows[0]?.count !== "0" || JSON.stringify(chapterBefore.rows[0]) !== JSON.stringify(chapterAfter.rows[0]) || JSON.stringify(captureBefore.rows[0]) !== JSON.stringify(captureAfter.rows[0]) || JSON.stringify(entityBefore.rows[0]) !== JSON.stringify(entityAfter.rows[0])) throw new Error("S11 rollback crossed the S10 canonical boundary.");
    await client.query(`DELETE FROM "_prisma_migrations" WHERE migration_name='20260828080000_timeline_research'`);
    // Console trace S11-DB-002: rollback proof records only preserved row counts and removed S11 schema counts.
    console.log(JSON.stringify({ level: "info", step: "S11-DB-002", event: "timeline_research_database.rollback_verified", remainingS11Tables: 0, remainingS11Enums: 0, chapterRowsPreserved: chapterBefore.rowCount ?? 0, captureRowsPreserved: captureBefore.rowCount ?? 0, entityRowsPreserved: entityBefore.rowCount ?? 0 }));
  } finally { await client.end(); }
}

const command = process.argv[2] ?? "verify";
if (command === "verify") await verify(); else if (command === "rollback") await rollback(); else throw new Error("Expected verify or rollback command.");
