import "dotenv/config";

import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaIdentityRepository } from "../domains/accounts/infrastructure/prisma-identity-repository";
import { PrismaMilestoneRepository } from "../domains/milestones/infrastructure/prisma-milestone-repository";
import { planMilestoneScaffold } from "../domains/milestones/domain/types";
import { PrismaStructureRepository } from "../domains/structure/infrastructure/prisma-structure-repository";
import { PrismaWritingRepository } from "../domains/writing/infrastructure/prisma-writing-repository";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

async function verify(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const suffix = randomUUID();
    const identities = new PrismaIdentityRepository(prisma);
    const owner = await identities.resolveOrProvision({ provider: "s5", subject: `owner-${suffix}`, email: `owner-${suffix}@example.test`, emailVerified: true }, suffix);
    const outsider = await identities.resolveOrProvision({ provider: "s5", subject: `other-${suffix}`, email: `other-${suffix}@example.test`, emailVerified: true }, suffix);
    const actor = { ...owner, sessionId: randomUUID() };
    const outsiderActor = { ...outsider, sessionId: randomUUID() };
    const writing = new PrismaWritingRepository(prisma);
    const milestones = new PrismaMilestoneRepository(prisma);
    const structure = new PrismaStructureRepository(prisma);
    const project = await writing.createProject(actor, { title: "Milestone verifier" });
    const chapter = (await writing.createChapter(actor, { projectId: project.id, title: "Chapter one" })).chapter;
    await prisma.chapter.update({ where: { id: chapter.id }, data: { targetWords: 1_000, wordCount: 500 } });
    const zero = await milestones.getOverview(actor, project.id, { nodeBudget: 200, edgeBudget: 300 });
    if (!zero || zero.milestones.length || zero.links.length || zero.dependencies.length) throw new Error("Zero-milestone project was not valid.");

    const first = await milestones.createMilestone(actor, project.id, { expectedStructuralVersion: 1, sequenceIndex: 0, title: "Opening", description: "Complete milestone revision content", threadLabel: "Main", targetChapterStart: 0, targetChapterEnd: 2, targetWords: 3_000, targetDate: "2026-09-01", status: "PLANNED", isPlaceholder: false });
    const second = await milestones.createMilestone(actor, project.id, { expectedStructuralVersion: 2, sequenceIndex: 1, title: "Turning point", targetChapterStart: 3, targetChapterEnd: 5, status: "PLANNED", isPlaceholder: false });
    const linkInput = { expectedStructuralVersion: 3, chapterId: chapter.id, milestoneId: first.object.id, role: "DEVELOP" as const, weight: 2 };
    const link = await milestones.linkChapter(actor, project.id, linkInput);
    const duplicateLink = await milestones.linkChapter(actor, project.id, { ...linkInput, expectedStructuralVersion: 4 });
    if (duplicateLink.object.id !== link.object.id || duplicateLink.projectStructuralVersion !== 4) throw new Error("Duplicate chapter role was not idempotent.");
    const soft = await milestones.writeDependency(actor, project.id, { expectedStructuralVersion: 4, sourceMilestoneId: first.object.id, targetMilestoneId: second.object.id, state: "TENTATIVE", isHard: false, note: "Complete dependency revision content" });
    await milestones.writeDependency(actor, project.id, { expectedStructuralVersion: 5, sourceMilestoneId: first.object.id, targetMilestoneId: second.object.id, state: "ACTIVE", isHard: true });
    await milestones.writeDependency(actor, project.id, { expectedStructuralVersion: 6, sourceMilestoneId: second.object.id, targetMilestoneId: first.object.id, state: "ACTIVE", isHard: true }).then(() => { throw new Error("Hard milestone cycle succeeded."); }).catch((error: unknown) => { if (!(error instanceof Error) || error.message === "Hard milestone cycle succeeded.") throw error; });
    const intent = await structure.createNarrativeIntent(actor, project.id, { expectedStructuralVersion: 6, targetType: "MILESTONE", targetId: first.object.id, category: "TENSION", intentText: "Intent attached to milestone" });
    const reference = await structure.createStoryReference(actor, project.id, { expectedStructuralVersion: 7, sourceType: "CHAPTER", sourceId: chapter.id, targetType: "MILESTONE", targetId: first.object.id, relationshipKey: "develops", provenanceType: "DIRECT" });
    const reordered = await milestones.reorderMilestones(actor, project.id, { expectedStructuralVersion: 8, orderedIds: [second.object.id, first.object.id] });
    const overview = await milestones.getOverview(actor, project.id, { nodeBudget: 200, edgeBudget: 300 });
    if (!overview || overview.milestones.length !== 2 || overview.milestones[0]?.id !== second.object.id || overview.links.length !== 1 || overview.dependencies.length !== 2 || overview.milestones[1]?.progress !== .5 || !overview.milestones[1]?.progressComplete) throw new Error("Milestone projection round trip failed.");
    const bounded = await milestones.getOverview(actor, project.id, { nodeBudget: 1, edgeBudget: 1 });
    if (!bounded || bounded.page.returnedNodes > 1 || bounded.page.returnedEdges > 1 || !bounded.page.hasMoreNodes || !bounded.page.hasMoreEdges) throw new Error("Milestone budgets were not enforced.");
    const revision = await prisma.objectRevision.findFirst({ where: { projectId: project.id, objectType: "MILESTONE", objectId: first.object.id }, select: { snapshot: true } });
    const dependencyRevision = await prisma.objectRevision.findFirst({ where: { projectId: project.id, objectType: "MILESTONE_DEPENDENCY", objectId: soft.object.id }, select: { snapshot: true } });
    if (!JSON.stringify(revision?.snapshot).includes("Complete milestone revision content") || !JSON.stringify(dependencyRevision?.snapshot).includes("Complete dependency revision content")) throw new Error("Milestone revisions omitted canonical content.");
    const milestoneOutboxCount = await prisma.outboxEvent.count({ where: { aggregateId: project.id, eventType: { startsWith: "milestone." } } });
    if (milestoneOutboxCount !== 6) throw new Error("Milestone outbox evidence was incomplete.");
    if (await milestones.getOverview(outsiderActor, project.id, { nodeBudget: 200, edgeBudget: 300 }) !== null) throw new Error("Cross-workspace milestone read succeeded.");
    await milestones.createMilestone(outsiderActor, project.id, { expectedStructuralVersion: 9, sequenceIndex: 2, title: "Denied", status: "PLANNED", isPlaceholder: false }).then(() => { throw new Error("Cross-workspace milestone write succeeded."); }).catch((error: unknown) => { if (!(error instanceof Error) || error.message === "Cross-workspace milestone write succeeded.") throw error; });

    const otherProject = await writing.createProject(actor, { title: "Other project" });
    const otherChapter = (await writing.createChapter(actor, { projectId: otherProject.id, title: "Other chapter" })).chapter;
    await milestones.linkChapter(actor, project.id, { expectedStructuralVersion: 9, chapterId: otherChapter.id, milestoneId: first.object.id, role: "INTRODUCE", weight: 1 }).then(() => { throw new Error("Cross-project milestone link succeeded."); }).catch((error: unknown) => { if (!(error instanceof Error) || error.message === "Cross-project milestone link succeeded.") throw error; });

    const scaffoldProject = await writing.createProject(actor, { title: "Milestone scaffold verifier" });
    const scaffoldInput = { expectedStructuralVersion: 1, milestoneCount: 4, chapterStart: 1, chapterCount: 12, advisoryProjectTargetWords: 60_000, cadenceStartDate: "2026-09-01", cadenceDays: 14 };
    const scaffold = await milestones.applyScaffold(actor, scaffoldProject.id, scaffoldInput, planMilestoneScaffold(scaffoldInput));
    if (scaffold.object.milestoneIds.length !== 4 || scaffold.object.placeholderCount !== 4 || scaffold.projectStructuralVersion !== 2) throw new Error("Milestone scaffold did not match its preview.");

    const concurrentProject = await writing.createProject(actor, { title: "Concurrent milestone verifier" });
    const concurrent = await Promise.allSettled([
      milestones.createMilestone(actor, concurrentProject.id, { expectedStructuralVersion: 1, sequenceIndex: 0, title: "A", status: "PLANNED", isPlaceholder: false }),
      milestones.createMilestone(actor, concurrentProject.id, { expectedStructuralVersion: 1, sequenceIndex: 1, title: "B", status: "PLANNED", isPlaceholder: false })
    ]);
    const winners = concurrent.filter((item) => item.status === "fulfilled").length;
    const conflicts = concurrent.filter((item): item is PromiseRejectedResult => item.status === "rejected" && typeof item.reason === "object" && item.reason !== null && item.reason.code === "CONFLICT").length;
    if (winners !== 1 || conflicts !== 1 || await prisma.milestone.count({ where: { projectId: concurrentProject.id } }) !== 1) throw new Error("Concurrent milestone writes did not converge.");

    // Console trace S5-DB-001: PostgreSQL verified milestone ownership, cycles, progress, idempotency, revisions, outbox, scaffold and bounds without creative content.
    console.log(JSON.stringify({ level: "info", step: "S5-DB-001", event: "milestone_database.verified", projectId: project.id, structuralVersion: reordered.projectStructuralVersion, milestoneCount: overview.milestones.length, linkCount: overview.links.length, dependencyCount: overview.dependencies.length, derivedProgress: overview.milestones[1]?.progress, hardCycleAccepted: false, duplicateLinkIdempotent: true, reorderPreservedIdentity: true, crossWorkspaceRead: false, crossWorkspaceWrite: false, crossProjectLink: false, milestoneIntentId: intent.object.id, milestoneReferenceId: reference.object.id, completeRevisionSnapshots: true, milestoneOutboxCount, boundedNodeCount: bounded.page.returnedNodes, boundedEdgeCount: bounded.page.returnedEdges, scaffoldPlaceholderCount: scaffold.object.placeholderCount, concurrentWinners: winners, concurrentConflicts: conflicts }));
  } finally { await prisma.$disconnect(); }
}

async function rollback(): Promise<void> {
  const sql = await readFile(new URL("../prisma/migrations/20260813000000_milestones/rollback.sql", import.meta.url), "utf8");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const proseBefore = await client.query<{ id: string; bodyDocument: unknown; bodyText: string }>(`SELECT "id", "bodyDocument", "bodyText" FROM "Chapter" ORDER BY "createdAt" LIMIT 1`);
    await client.query(sql);
    const tables = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('Milestone','ChapterMilestoneLink','MilestoneDependency')`);
    const structureTables = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('Plot','Volume','ChapterOutline','Scene','NarrativeIntent','StoryReference','ObjectRevision','StructureViewState')`);
    const proseAfter = proseBefore.rowCount ? await client.query<{ id: string; bodyDocument: unknown; bodyText: string }>(`SELECT "id", "bodyDocument", "bodyText" FROM "Chapter" WHERE "id"=$1`, [proseBefore.rows[0]!.id]) : { rows: [] };
    if (tables.rows[0]?.count !== "0" || structureTables.rows[0]?.count !== "8" || JSON.stringify(proseBefore.rows[0]) !== JSON.stringify(proseAfter.rows[0])) throw new Error("Milestone rollback crossed its capability or prose boundary.");
    await client.query(`DELETE FROM "_prisma_migrations" WHERE migration_name = '20260813000000_milestones'`);
    // Console trace S5-DB-002: milestone-only rollback preserved Structure Core tables and byte-equivalent chapter prose.
    console.log(JSON.stringify({ level: "info", step: "S5-DB-002", event: "milestone_database.rollback_verified", remainingMilestoneTables: 0, preservedStructureTables: 8, proseRowsPreserved: proseBefore.rowCount ?? 0 }));
  } finally { await client.end(); }
}

const command = process.argv[2] ?? "verify";
if (command === "verify") await verify();
else if (command === "rollback") await rollback();
else throw new Error("Expected verify or rollback command.");
