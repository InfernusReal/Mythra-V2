import "dotenv/config";

import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaIdentityRepository } from "../domains/accounts/infrastructure/prisma-identity-repository";
import { PrismaStructureRepository } from "../domains/structure/infrastructure/prisma-structure-repository";
import { planStructureScaffold } from "../domains/structure/domain/scaffold";
import { PrismaWritingRepository } from "../domains/writing/infrastructure/prisma-writing-repository";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
const emptyDocument: { type: "doc"; content: unknown[] } = { type: "doc", content: [] };

async function verify(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const suffix = randomUUID();
    const identities = new PrismaIdentityRepository(prisma);
    const owner = await identities.resolveOrProvision({ provider: "s4", subject: `owner-${suffix}`, email: `owner-${suffix}@example.test`, emailVerified: true }, suffix);
    const outsider = await identities.resolveOrProvision({ provider: "s4", subject: `other-${suffix}`, email: `other-${suffix}@example.test`, emailVerified: true }, suffix);
    const ownerActor = { ...owner, sessionId: randomUUID() };
    const outsiderActor = { ...outsider, sessionId: randomUUID() };
    const writing = new PrismaWritingRepository(prisma);
    const structure = new PrismaStructureRepository(prisma);
    const project = await writing.createProject(ownerActor, { title: "Structure verifier" });
    const chapters: Array<{ id: string }> = [];
    for (let index = 0; index < 3; index += 1) chapters.push((await writing.createChapter(ownerActor, { projectId: project.id, title: `Chapter ${index + 1}` })).chapter);
    const before = await structure.getOverview(ownerActor, project.id, { pageSize: 100, nodeBudget: 200, edgeBudget: 300, rangeStart: 0 });
    if (!before || before.plot || before.volumes.length || before.chapterOutlines.length || before.scenes.length || before.references.length || before.project.structuralVersion !== 1) throw new Error("Zero-structure project was not valid.");

    const plot = await structure.createPlot(ownerActor, project.id, { expectedStructuralVersion: 1, title: "Verification plot" });
    const plotOutline = await structure.upsertPlotOutline(ownerActor, project.id, { expectedStructuralVersion: 2, plotId: plot.object.id, title: "Plot outline", document: emptyDocument, plainText: "Plot outline content", purpose: "Verification" });
    const volumeA = await structure.createVolume(ownerActor, project.id, { expectedStructuralVersion: 3, plotId: plot.object.id, sequenceIndex: 0, title: "Volume A", targetWords: 40_000, hardTargetWordsEnabled: false });
    const volumeB = await structure.createVolume(ownerActor, project.id, { expectedStructuralVersion: 4, plotId: plot.object.id, sequenceIndex: 1, title: "Volume B", hardTargetWordsEnabled: false });
    const chapterOutline = await structure.upsertChapterOutline(ownerActor, project.id, { expectedStructuralVersion: 5, chapterId: chapters[0]!.id, volumeId: volumeA.object.id, sequenceIndex: 0, title: "Chapter plan", document: emptyDocument, plainText: "Outline detail", purpose: "Advance", emotionalMovement: "Pressure", revealedInformation: ["Fact"], entityReferenceKeys: [], locationReferenceKeys: [], milestoneReferenceKeys: [], targetWords: 2_000, hardTargetWordsEnabled: false, sceneStubs: [{ id: randomUUID(), title: "Scene stub" }], isPlaceholder: false });
    const scene = await structure.createSceneFromOutlineBlock(ownerActor, project.id, { expectedStructuralVersion: 6, chapterOutlineId: chapterOutline.object.id, blockId: "outline-block", sequenceIndex: 0, title: "Converted scene", outlineDocument: emptyDocument, outlineText: "Scene outline", purpose: "Pressure", hardTargetWordsEnabled: false });
    const intent = await structure.createNarrativeIntent(ownerActor, project.id, { expectedStructuralVersion: 7, targetType: "CHAPTER", targetId: chapters[0]!.id, category: "TENSION", intentText: "Increase pressure" });
    const referenceInput = { expectedStructuralVersion: 8, sourceType: "SCENE" as const, sourceId: scene.object.id, targetType: "NARRATIVE_INTENT" as const, targetId: intent.object.id, relationshipKey: "supports", provenanceType: "DIRECT" as const };
    const reference = await structure.createStoryReference(ownerActor, project.id, referenceInput);
    const duplicate = await structure.createStoryReference(ownerActor, project.id, { ...referenceInput, expectedStructuralVersion: 9 });
    if (duplicate.object.id !== reference.object.id || duplicate.projectStructuralVersion !== 9) throw new Error("Duplicate active reference was not idempotent.");
    await structure.assignChapterToVolume(ownerActor, project.id, { expectedStructuralVersion: 9, chapterId: chapters[0]!.id, volumeId: volumeA.object.id, volumeSequenceIndex: 0 });
    await structure.reorderVolumes(ownerActor, project.id, { expectedStructuralVersion: 10, orderedIds: [volumeB.object.id, volumeA.object.id] });
    const view = await structure.saveViewState(ownerActor, project.id, { mode: "ARCHITECT", activeLens: "SEMANTIC_ZOOM", expandedIds: [plot.object.id, chapterOutline.object.id], activeAnchorType: "CHAPTER", activeAnchorId: chapters[0]!.id, cursorOffset: 8, selectionAnchor: 8, selectionHead: 12, scrollTop: 640, pinIds: [intent.object.id] });
    const after = await structure.getOverview(ownerActor, project.id, { pageSize: 100, nodeBudget: 200, edgeBudget: 300, rangeStart: 0 });
    if (!after || after.project.structuralVersion !== 11 || after.volumes[0]?.id !== volumeB.object.id || after.chapters.find((chapter) => chapter.id === chapters[0]!.id)?.volumeId !== volumeA.object.id || after.references.length !== 2 || after.scenes[0]?.provenanceSourceId !== chapterOutline.object.id || view.mode !== "ARCHITECT") throw new Error("Structure write/read round trip failed.");
    if (plotOutline.projectStructuralVersion !== 3) throw new Error("Plot outline did not advance structural version.");
    const outboxCount = await prisma.outboxEvent.count({ where: { aggregateId: project.id, eventType: { startsWith: "structure." } } });
    const revisionCount = await prisma.objectRevision.count({ where: { projectId: project.id } });
    if (outboxCount !== 10 || revisionCount < 10) throw new Error("Transactional outbox or revision evidence was incomplete.");
    const intentRevision = await prisma.objectRevision.findFirst({ where: { projectId: project.id, objectType: "NARRATIVE_INTENT", objectId: intent.object.id }, select: { snapshot: true } });
    const outlineRevision = await prisma.objectRevision.findFirst({ where: { projectId: project.id, objectType: "CHAPTER_OUTLINE", objectId: chapterOutline.object.id }, select: { snapshot: true } });
    if (JSON.stringify(intentRevision?.snapshot).includes("Increase pressure") === false || JSON.stringify(outlineRevision?.snapshot).includes("Outline detail") === false) throw new Error("Object revisions did not preserve complete canonical state.");
    if (await structure.getOverview(outsiderActor, project.id, { pageSize: 100, nodeBudget: 200, edgeBudget: 300, rangeStart: 0 }) !== null) throw new Error("Cross-workspace Structure read succeeded.");
    await structure.createPlot(outsiderActor, project.id, { expectedStructuralVersion: 11, title: "Denied" }).then(() => { throw new Error("Cross-workspace Structure write succeeded."); }).catch((error: unknown) => { if (!(error instanceof Error) || error.message === "Cross-workspace Structure write succeeded.") throw error; });
    await structure.createNarrativeIntent(ownerActor, project.id, { expectedStructuralVersion: 11, targetType: "CHAPTER", targetId: randomUUID(), intentText: "Denied" }).then(() => { throw new Error("Unknown endpoint intent succeeded."); }).catch((error: unknown) => { if (!(error instanceof Error) || error.message === "Unknown endpoint intent succeeded.") throw error; });

    const scaffoldProject = await writing.createProject(ownerActor, { title: "Scaffold verifier" });
    for (let index = 0; index < 5; index += 1) await writing.createChapter(ownerActor, { projectId: scaffoldProject.id, title: `Scaffold chapter ${index + 1}` });
    const scaffoldInput = { expectedStructuralVersion: 1, volumeCount: 2, chapterStart: 1, chapterCount: 5, createChapterOutlinePlaceholders: true, advisoryProjectTargetWords: 50_000 };
    const scaffoldPlan = planStructureScaffold(scaffoldInput);
    const scaffold = await structure.applyScaffold(ownerActor, scaffoldProject.id, scaffoldInput, scaffoldPlan);
    if (scaffold.object.volumeIds.length !== 2 || scaffold.object.placeholderCount !== 5 || scaffold.object.assignedChapterCount !== 5 || scaffold.projectStructuralVersion !== 2) throw new Error("Scaffold apply did not match its preview.");
    const bounded = await structure.getOverview(ownerActor, scaffoldProject.id, { pageSize: 2, nodeBudget: 3, edgeBudget: 1, rangeStart: 0 });
    if (!bounded || bounded.page.returnedNodes > 3 || bounded.page.returnedEdges > 1 || !bounded.page.hasMoreNodes) throw new Error("Repository read budgets were not enforced.");

    const concurrentProject = await writing.createProject(ownerActor, { title: "Concurrent structure verifier" });
    const concurrent = await Promise.allSettled([
      structure.createPlot(ownerActor, concurrentProject.id, { expectedStructuralVersion: 1, title: "Concurrent A" }),
      structure.createPlot(ownerActor, concurrentProject.id, { expectedStructuralVersion: 1, title: "Concurrent B" })
    ]);
    const concurrentSuccesses = concurrent.filter((result) => result.status === "fulfilled").length;
    const concurrentConflicts = concurrent.filter((result): result is PromiseRejectedResult => result.status === "rejected" && typeof result.reason === "object" && result.reason !== null && result.reason.code === "CONFLICT").length;
    const concurrentState = await prisma.project.findUnique({ where: { id: concurrentProject.id }, select: { structuralVersion: true } });
    const concurrentPlotCount = await prisma.plot.count({ where: { projectId: concurrentProject.id } });
    const concurrentOutboxCount = await prisma.outboxEvent.count({ where: { aggregateId: concurrentProject.id, eventType: "structure.plot.changed" } });
    if (concurrentSuccesses !== 1 || concurrentConflicts !== 1 || concurrentState?.structuralVersion !== 2 || concurrentPlotCount !== 1 || concurrentOutboxCount !== 1) throw new Error(`Concurrent structural writes did not converge: ${JSON.stringify({ concurrentSuccesses, concurrentConflicts, structuralVersion: concurrentState?.structuralVersion, concurrentPlotCount, concurrentOutboxCount, rejectionCodes: concurrent.flatMap((result) => result.status === "rejected" ? [typeof result.reason === "object" && result.reason !== null && "code" in result.reason ? String(result.reason.code) : "UNKNOWN"] : []) })}`);

    // Console trace S4-DB-001: real PostgreSQL verified optionality, ownership, revisions, outbox, scaffold, ordering and budgets without content emission.
    console.log(JSON.stringify({ level: "info", step: "S4-DB-001", event: "structure_database.verified", projectId: project.id, structuralVersion: after.project.structuralVersion, volumeCount: after.volumes.length, chapterCount: after.chapters.length, outlineCount: after.chapterOutlines.length, sceneCount: after.scenes.length, referenceCount: after.references.length, outboxCount, revisionCount, completeRevisionSnapshots: true, duplicateReferenceIdempotent: true, crossWorkspaceRead: false, crossWorkspaceWrite: false, unknownEndpointWrite: false, scaffoldVolumeCount: scaffold.object.volumeIds.length, scaffoldPlaceholderCount: scaffold.object.placeholderCount, boundedNodeCount: bounded.page.returnedNodes, boundedEdgeCount: bounded.page.returnedEdges, concurrentWinners: concurrentSuccesses, concurrentConflicts }));
  } finally { await prisma.$disconnect(); }
}

async function rollback(): Promise<void> {
  const sql = await readFile(new URL("../prisma/migrations/20260812230000_structure_core/rollback.sql", import.meta.url), "utf8");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const proseBefore = await client.query<{ id: string; bodyDocument: unknown; bodyText: string }>(`SELECT "id", "bodyDocument", "bodyText" FROM "Chapter" ORDER BY "createdAt" LIMIT 1`);
    await client.query(sql);
    const remaining = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('Plot','PlotOutline','Volume','VolumeOutline','ChapterOutline','Scene','NarrativeIntent','StoryReference','ObjectRevision','StructureViewState')`);
    const prior = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('Project','Chapter','ChapterRevision','DraftConflict','ChapterSaveReceipt','WritingSessionState')`);
    const newColumns = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM information_schema.columns WHERE table_schema='public' AND table_name='Chapter' AND column_name IN ('volumeId','volumeSequenceIndex')`);
    const proseAfter = proseBefore.rowCount ? await client.query<{ id: string; bodyDocument: unknown; bodyText: string }>(`SELECT "id", "bodyDocument", "bodyText" FROM "Chapter" WHERE "id"=$1`, [proseBefore.rows[0]!.id]) : { rows: [] };
    if (remaining.rows[0]?.count !== "0" || prior.rows[0]?.count !== "6" || newColumns.rows[0]?.count !== "0" || JSON.stringify(proseBefore.rows[0]) !== JSON.stringify(proseAfter.rows[0])) throw new Error("Structure rollback crossed its capability or prose boundary.");
    await client.query(`DELETE FROM "_prisma_migrations" WHERE migration_name = '20260812230000_structure_core'`);
    // Console trace S4-DB-002: Structure-only rollback preserved all Phase 1 tables and byte-equivalent chapter prose.
    console.log(JSON.stringify({ level: "info", step: "S4-DB-002", event: "structure_database.rollback_verified", remainingStructureTables: 0, remainingStructureChapterColumns: 0, preservedPriorTables: 6, proseRowsPreserved: proseBefore.rowCount ?? 0 }));
  } finally { await client.end(); }
}

const command = process.argv[2] ?? "verify";
if (command === "verify") await verify();
else if (command === "rollback") await rollback();
else throw new Error("Expected verify or rollback command.");
