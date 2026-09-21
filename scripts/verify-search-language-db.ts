import "dotenv/config";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaIdentityRepository } from "../domains/accounts/infrastructure/prisma-identity-repository";
import { PrismaWritingRepository } from "../domains/writing/infrastructure/prisma-writing-repository";
import { PrismaUniverseRepository } from "../domains/universe/infrastructure/prisma-universe-repository";
import { PrismaSearchRepository } from "../domains/search/infrastructure/prisma-search-repository";
import { PrismaVocabularyRepository } from "../domains/language/infrastructure/prisma-vocabulary-repository";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

async function rejected(operation: Promise<unknown>, code: string) {
  try { await operation; return false; }
  catch (error) { return typeof error === "object" && error !== null && "code" in error && String(error.code) === code; }
}

async function verify() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const suffix = randomUUID(); const identities = new PrismaIdentityRepository(prisma);
    const owner = await identities.resolveOrProvision({ provider: "s10", subject: `owner-${suffix}`, email: `owner-${suffix}@example.test`, emailVerified: true }, suffix);
    const outsider = await identities.resolveOrProvision({ provider: "s10", subject: `outsider-${suffix}`, email: `outsider-${suffix}@example.test`, emailVerified: true }, suffix);
    const actor = { ...owner, sessionId: randomUUID() }; const outsiderActor = { ...outsider, sessionId: randomUUID() };
    const writing = new PrismaWritingRepository(prisma); const project = await writing.createProject(actor, { title: "Search verifier" }); const chapter = (await writing.createChapter(actor, { projectId: project.id, title: "Aurora verifier chapter" })).chapter;
    const blockId = chapter.document.content[0]!.attrs.blockId;
    await prisma.chapter.update({ where: { id: chapter.id }, data: { bodyDocument: { schemaVersion: 1, type: "doc", content: [{ type: "paragraph", attrs: { blockId }, content: [{ type: "text", text: "Aurora arrives at the verifier harbor." }] }] }, bodyText: "Aurora arrives at the verifier harbor.", wordCount: 7, version: { increment: 1 } } });
    const plot = await prisma.plot.create({ data: { projectId: project.id, title: "Verifier plot", summary: "Aurora plot" } });
    await prisma.plotOutline.create({ data: { projectId: project.id, plotId: plot.id, document: { type: "doc", content: [] }, plainText: "Verifier plot outline", purpose: "Aurora purpose" } });
    const volume = await prisma.volume.create({ data: { projectId: project.id, plotId: plot.id, sequenceIndex: 0, title: "Verifier volume" } });
    await prisma.volumeOutline.create({ data: { projectId: project.id, volumeId: volume.id, document: { type: "doc", content: [] }, plainText: "Verifier volume outline", purpose: "Volume purpose" } });
    const chapterOutline = await prisma.chapterOutline.create({ data: { projectId: project.id, chapterId: chapter.id, sequenceIndex: 0, title: "Verifier chapter outline", document: { type: "doc", content: [] }, plainText: "Aurora outline", purpose: "Introduce Aurora" } });
    const milestone = await prisma.milestone.create({ data: { projectId: project.id, sequenceIndex: 0, title: "Verifier milestone", description: "Aurora turns" } });
    const change = await prisma.storyChange.create({ data: { projectId: project.id, kind: "EVENT", title: "Verifier Story Change", description: "Aurora chooses" } });
    const universe = new PrismaUniverseRepository(prisma); const catalog = await universe.catalog(actor, project.id); const entityType = catalog.entityTypes.find((item) => item.systemKey === "character"); if (!entityType) throw new Error("Character type missing.");
    const entity = await universe.create(actor, project.id, { typeId: entityType.id, name: "Aurora Sentinel", aliases: ["dawnkeeper"], summary: "Verifier entity", tags: [], values: [], expectedStructuralVersion: catalog.projectStructuralVersion });
    const relationType = await prisma.relationType.create({ data: { projectId: project.id, key: `guides_${suffix.slice(0, 8)}`, forwardLabel: "Guides verifier", reverseLabel: "Guided by verifier" } });
    const reference = await prisma.storyReference.create({ data: { projectId: project.id, sourceType: "CHAPTER", sourceId: chapter.id, targetType: "ENTITY", targetId: entity.entity.id, relationshipKey: "verifier_reference" } });
    const capture = await prisma.capture.create({ data: { userId: actor.userId, projectId: project.id, clientCaptureId: randomUUID(), rawText: "Verifier Capture Aurora", route: `/app/chapters/${chapter.id}`, chapterId: chapter.id, capturedAt: new Date() } });
    await prisma.workspaceMember.upsert({ where: { workspaceId_userId: { workspaceId: actor.workspaceId, userId: outsider.userId } }, create: { workspaceId: actor.workspaceId, userId: outsider.userId, role: "MEMBER", status: "ACTIVE" }, update: { status: "ACTIVE" } });
    await prisma.capture.create({ data: { userId: outsider.userId, projectId: project.id, clientCaptureId: randomUUID(), rawText: "collaborator-secret-token", route: `/app/projects/${project.id}`, capturedAt: new Date() } });

    const search = new PrismaSearchRepository(prisma); const synchronized = await search.synchronize(actor, project.id);
    const typeCount = await prisma.searchDocument.groupBy({ by: ["documentType"], where: { projectId: project.id } });
    const aliasResult = await search.search(actor, project.id, { query: "dawnkeeper", limit: 40, chapterId: chapter.id });
    const referenceResult = await search.search(actor, project.id, { query: "verifier reference", limit: 40, chapterId: chapter.id });
    const privateCapture = await search.search(actor, project.id, { query: "collaborator secret token", limit: 40 });
    const crossWorkspaceRejected = await rejected(search.search(outsiderActor, project.id, { query: "Aurora", limit: 40 }), "NOT_FOUND");
    const vocabulary = new PrismaVocabularyRepository(prisma); const firstSave = await vocabulary.mutate(actor, project.id, { action: "SAVE", term: "Aurora", normalizedTerm: "aurora", locale: "en", definition: "Verifier definition", partOfSpeech: "noun" }); const secondSave = await vocabulary.mutate(actor, project.id, { action: "SAVE", term: "Aurora", normalizedTerm: "aurora", locale: "en", definition: "Updated definition", partOfSpeech: "noun" }); const vocabularyRows = await vocabulary.list(actor, project.id, 100);
    const indexes = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM pg_indexes WHERE tablename='SearchDocument' AND indexname IN ('SearchDocument_searchVector_idx','SearchDocument_normalizedText_trgm_idx','SearchDocument_aliasesText_trgm_idx')`;
    const activeTypes = new Set(typeCount.map((item) => String(item.documentType)));
    const required = ["CHAPTER", "CHAPTER_OUTLINE", "PLOT_OUTLINE", "VOLUME_OUTLINE", "MILESTONE", "ENTITY", "STORY_CHANGE", "CAUSAL_RELATION_TYPE", "UNIVERSE_RELATION_TYPE", "STORY_REFERENCE", "CAPTURE"];
    const aliasFirst = aliasResult.groups.flatMap((group) => group.results)[0]; const referenceDocument = referenceResult.groups.flatMap((group) => group.results).find((item) => item.sourceId === reference.id);
    if (!required.every((type) => activeTypes.has(type)) || synchronized.sourceCount < 11 || aliasFirst?.sourceId !== entity.entity.id || !referenceDocument || privateCapture.page.total !== 0 || !crossWorkspaceRejected || firstSave.version !== 1 || secondSave.version !== 2 || vocabularyRows.length !== 1 || Number(indexes[0]?.count ?? 0) !== 3) throw new Error("S10 Search/Language database invariant failed.");
    // Console trace S10-DB-001: PostgreSQL verified projection coverage/ranking/ownership/indexes/vocabulary using identities and counts only.
    console.log(JSON.stringify({ level: "info", step: "S10-DB-001", event: "search_language_database.verified", projectId: project.id, chapterId: chapter.id, chapterOutlineId: chapterOutline.id, milestoneId: milestone.id, storyChangeId: change.id, entityId: entity.entity.id, relationTypeId: relationType.id, referenceId: reference.id, captureId: capture.id, activeTypeCount: activeTypes.size, sourceCount: synchronized.sourceCount, aliasExactFirst: aliasFirst?.sourceId === entity.entity.id, referenceSearchable: Boolean(referenceDocument), collaboratorCaptureExcluded: privateCapture.page.total === 0, crossWorkspaceRejected, vocabularyVersion: secondSave.version, indexCount: Number(indexes[0]?.count ?? 0) }));
  } finally { await prisma.$disconnect(); }
}

async function rollback() {
  const sql = await readFile(new URL("../prisma/migrations/20260817180000_search_language/rollback.sql", import.meta.url), "utf8"); const client = new Client({ connectionString }); await client.connect();
  try {
    const chapterBefore = await client.query(`SELECT "id", "bodyDocument", "bodyText", "version" FROM "Chapter" ORDER BY "createdAt" DESC LIMIT 1`); const captureBefore = await client.query(`SELECT "id", "rawText", "version" FROM "Capture" ORDER BY "createdAt" DESC LIMIT 1`); const entityBefore = await client.query(`SELECT "id", "name", "aliasesJson", "version" FROM "StoryEntity" ORDER BY "createdAt" DESC LIMIT 1`);
    await client.query(sql);
    const remaining = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('SearchDocument','SavedVocabularyTerm')`); const enumCount = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM pg_type WHERE typname='SearchDocumentType'`);
    const chapterAfter = chapterBefore.rowCount ? await client.query(`SELECT "id", "bodyDocument", "bodyText", "version" FROM "Chapter" WHERE "id"=$1`, [(chapterBefore.rows[0] as { id: string }).id]) : { rows: [] }; const captureAfter = captureBefore.rowCount ? await client.query(`SELECT "id", "rawText", "version" FROM "Capture" WHERE "id"=$1`, [(captureBefore.rows[0] as { id: string }).id]) : { rows: [] }; const entityAfter = entityBefore.rowCount ? await client.query(`SELECT "id", "name", "aliasesJson", "version" FROM "StoryEntity" WHERE "id"=$1`, [(entityBefore.rows[0] as { id: string }).id]) : { rows: [] };
    if (remaining.rows[0]?.count !== "0" || enumCount.rows[0]?.count !== "0" || JSON.stringify(chapterBefore.rows[0]) !== JSON.stringify(chapterAfter.rows[0]) || JSON.stringify(captureBefore.rows[0]) !== JSON.stringify(captureAfter.rows[0]) || JSON.stringify(entityBefore.rows[0]) !== JSON.stringify(entityAfter.rows[0])) throw new Error("S10 rollback crossed the S9 canonical boundary.");
    await client.query(`DELETE FROM "_prisma_migrations" WHERE migration_name='20260817180000_search_language'`);
    // Console trace S10-DB-002: S10 rollback removed only projection/vocabulary truth and preserved sampled S1/S8/S9 bytes.
    console.log(JSON.stringify({ level: "info", step: "S10-DB-002", event: "search_language_database.rollback_verified", remainingS10Tables: 0, searchEnumRemoved: true, chapterRowsPreserved: chapterBefore.rowCount ?? 0, captureRowsPreserved: captureBefore.rowCount ?? 0, entityRowsPreserved: entityBefore.rowCount ?? 0 }));
  } finally { await client.end(); }
}

const command = process.argv[2] ?? "verify";
if (command === "verify") await verify(); else if (command === "rollback") await rollback(); else throw new Error("Expected verify or rollback command.");
