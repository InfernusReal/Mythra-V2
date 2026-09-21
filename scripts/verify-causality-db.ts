import "dotenv/config";

import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaIdentityRepository } from "../domains/accounts/infrastructure/prisma-identity-repository";
import { PrismaCausalityRepository } from "../domains/causality/infrastructure/prisma-causality-repository";
import { PrismaMilestoneRepository } from "../domains/milestones/infrastructure/prisma-milestone-repository";
import { PrismaWritingRepository } from "../domains/writing/infrastructure/prisma-writing-repository";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
const privateChangeDescription = "Complete private Story Change description";
const privateCondition = "Complete private causal condition";
const privateNote = "Complete private causal note";

async function rejected(
  operation: Promise<unknown>,
  code: string,
): Promise<boolean> {
  try {
    await operation;
    return false;
  } catch (error) {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      String(error.code) === code
    );
  }
}

async function databaseRejected(operation: Promise<unknown>): Promise<boolean> {
  try {
    await operation;
    return false;
  } catch {
    return true;
  }
}

async function verify(): Promise<void> {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    const suffix = randomUUID();
    const identities = new PrismaIdentityRepository(prisma);
    const owner = await identities.resolveOrProvision(
      {
        provider: "s6",
        subject: `owner-${suffix}`,
        email: `owner-${suffix}@example.test`,
        emailVerified: true,
      },
      suffix,
    );
    const outsider = await identities.resolveOrProvision(
      {
        provider: "s6",
        subject: `other-${suffix}`,
        email: `other-${suffix}@example.test`,
        emailVerified: true,
      },
      suffix,
    );
    const actor = { ...owner, sessionId: randomUUID() };
    const outsiderActor = { ...outsider, sessionId: randomUUID() };
    const writing = new PrismaWritingRepository(prisma);
    const milestones = new PrismaMilestoneRepository(prisma);
    const causality = new PrismaCausalityRepository(prisma);
    const project = await writing.createProject(actor, {
      title: "Causality verifier",
    });
    const chapter = (
      await writing.createChapter(actor, {
        projectId: project.id,
        title: "Chapter one",
      })
    ).chapter;
    const chapterBefore = await prisma.chapter.findUniqueOrThrow({
      where: { id: chapter.id },
      select: { bodyDocument: true, bodyText: true, version: true },
    });
    const blockId = chapter.document.content[0]!.attrs.blockId;
    const milestone = await milestones.createMilestone(actor, project.id, {
      expectedStructuralVersion: 1,
      sequenceIndex: 0,
      title: "Crossing",
      status: "PLANNED",
      isPlaceholder: false,
    });
    const outline = await prisma.chapterOutline.create({
      data: {
        projectId: project.id,
        chapterId: chapter.id,
        sequenceIndex: 0,
        title: "Chapter outline",
        document: { type: "doc", content: [] },
        plainText: "",
        revealedInformation: [],
        entityReferenceKeys: [],
        locationReferenceKeys: [],
        milestoneReferenceKeys: [],
        sceneStubs: [],
      },
    });
    const scene = await prisma.scene.create({
      data: {
        projectId: project.id,
        chapterId: chapter.id,
        chapterOutlineId: outline.id,
        sequenceIndex: 0,
        title: "Threshold",
        outlineDocument: { type: "doc", content: [] },
        outlineText: "",
      },
    });
    const intent = await prisma.narrativeIntent.create({
      data: {
        projectId: project.id,
        targetType: "SCENE",
        targetId: scene.id,
        category: "TENSION",
        intentText: "Private intent",
      },
    });
    const zeroProject = await writing.createProject(actor, {
      title: "Zero causality",
    });
    const zero = await causality.getOverview(actor, zeroProject.id, {
      nodeBudget: 200,
      edgeBudget: 300,
    });
    if (!zero || zero.storyChanges.length || zero.relations.length)
      throw new Error("Zero-causality project was not valid.");
    const missingBlockAnchorRejected = await databaseRejected(
      prisma.storyChange.create({
        data: {
          projectId: project.id,
          kind: "EVENT",
          title: "Invalid anchor",
          anchorType: "MANUSCRIPT_BLOCK",
          anchorId: chapter.id,
        },
      }),
    );
    if (!missingBlockAnchorRejected)
      throw new Error(
        "The database accepted a manuscript-block Story Change anchor without a block ID.",
      );

    let version = milestone.projectStructuralVersion;
    const first = await causality.writeStoryChange(actor, project.id, {
      expectedStructuralVersion: version,
      kind: "EVENT",
      title: "Door opens",
      description: privateChangeDescription,
      storyTime: 1,
      discoveryTime: 1,
      isPlaceholder: false,
    });
    version = first.projectStructuralVersion;
    const second = await causality.writeStoryChange(actor, project.id, {
      expectedStructuralVersion: version,
      kind: "OUTCOME",
      title: "Alarm sounds",
      storyTime: 2,
      discoveryTime: 2,
      isPlaceholder: false,
    });
    version = second.projectStructuralVersion;
    const reveal = await causality.writeStoryChange(actor, project.id, {
      expectedStructuralVersion: version,
      kind: "REVELATION",
      title: "Truth discovered",
      storyTime: 0,
      discoveryTime: 3,
      isPlaceholder: false,
    });
    version = reveal.projectStructuralVersion;
    const known = await causality.writeStoryChange(actor, project.id, {
      expectedStructuralVersion: version,
      kind: "STATE_CHANGE",
      title: "Prior knowledge",
      storyTime: 0,
      discoveryTime: 2,
      anchor: { type: "MANUSCRIPT_BLOCK", id: chapter.id, blockId },
      isPlaceholder: false,
    });
    version = known.projectStructuralVersion;

    const milestoneOutline = await causality.createRelation(actor, project.id, {
      expectedStructuralVersion: version,
      source: { type: "MILESTONE", id: milestone.object.id },
      target: { type: "CHAPTER_OUTLINE", id: outline.id },
      relationType: "CAUSES",
      strength: 0.8,
      importance: 60,
      state: "ACTIVE",
      isHard: false,
      temporalProgression: false,
      mutualStateSemantics: false,
      provenanceType: "DIRECT",
    });
    version = milestoneOutline.projectStructuralVersion;
    const sceneIntent = await causality.createRelation(actor, project.id, {
      expectedStructuralVersion: version,
      source: { type: "SCENE", id: scene.id },
      target: { type: "NARRATIVE_INTENT", id: intent.id },
      relationType: "ENABLES",
      strength: 0.5,
      importance: 40,
      state: "TENTATIVE",
      isHard: false,
      temporalProgression: false,
      mutualStateSemantics: false,
      provenanceType: "OUTLINE_BLOCK",
    });
    version = sceneIntent.projectStructuralVersion;
    const blockChange = await causality.createRelation(actor, project.id, {
      expectedStructuralVersion: version,
      source: { type: "MANUSCRIPT_BLOCK", id: chapter.id, blockId },
      target: { type: "STORY_CHANGE", id: first.object.id },
      relationType: "MOTIVATES",
      strength: 1,
      importance: 70,
      state: "ACTIVE",
      isHard: false,
      temporalProgression: false,
      mutualStateSemantics: false,
      provenanceType: "CHAPTER_PROSE",
    });
    version = blockChange.projectStructuralVersion;
    const firstSecond = await causality.createRelation(actor, project.id, {
      expectedStructuralVersion: version,
      source: { type: "STORY_CHANGE", id: first.object.id },
      target: { type: "STORY_CHANGE", id: second.object.id },
      relationType: "CAUSES",
      condition: privateCondition,
      strength: 1,
      importance: 90,
      state: "ACTIVE",
      isHard: false,
      temporalProgression: false,
      mutualStateSemantics: false,
      note: privateNote,
      provenanceType: "DIRECT",
      provenanceNote: "Complete private provenance",
    });
    version = firstSecond.projectStructuralVersion;
    const revealKnown = await causality.createRelation(actor, project.id, {
      expectedStructuralVersion: version,
      source: { type: "STORY_CHANGE", id: reveal.object.id },
      target: { type: "STORY_CHANGE", id: known.object.id },
      relationType: "REVEALS",
      strength: 1,
      importance: 80,
      state: "ACTIVE",
      isHard: false,
      temporalProgression: false,
      mutualStateSemantics: false,
      provenanceType: "DIRECT",
    });
    version = revealKnown.projectStructuralVersion;
    const duplicate = await causality.createRelation(actor, project.id, {
      expectedStructuralVersion: version,
      source: { type: "STORY_CHANGE", id: first.object.id },
      target: { type: "STORY_CHANGE", id: second.object.id },
      relationType: "CAUSES",
      strength: 0.1,
      importance: 1,
      state: "ACTIVE",
      isHard: false,
      temporalProgression: false,
      mutualStateSemantics: false,
      provenanceType: "DIRECT",
    });
    if (
      !duplicate.idempotent ||
      duplicate.object.id !== firstSecond.object.id ||
      duplicate.projectStructuralVersion !== version
    )
      throw new Error("Active duplicate relation was not idempotent.");
    const hardForward = await causality.createRelation(actor, project.id, {
      expectedStructuralVersion: version,
      source: { type: "STORY_CHANGE", id: first.object.id },
      target: { type: "STORY_CHANGE", id: second.object.id },
      relationType: "REQUIRES",
      strength: 1,
      importance: 100,
      state: "ACTIVE",
      isHard: true,
      temporalProgression: false,
      mutualStateSemantics: false,
      provenanceType: "DIRECT",
    });
    version = hardForward.projectStructuralVersion;
    const hardCycleRejected = await rejected(
      causality.createRelation(actor, project.id, {
        expectedStructuralVersion: version,
        source: { type: "STORY_CHANGE", id: second.object.id },
        target: { type: "STORY_CHANGE", id: first.object.id },
        relationType: "REQUIRES",
        strength: 1,
        importance: 100,
        state: "ACTIVE",
        isHard: true,
        temporalProgression: false,
        mutualStateSemantics: false,
        provenanceType: "DIRECT",
      }),
      "INTEGRITY_ERROR",
    );
    const feedback = await causality.createRelation(actor, project.id, {
      expectedStructuralVersion: version,
      source: { type: "STORY_CHANGE", id: second.object.id },
      target: { type: "STORY_CHANGE", id: first.object.id },
      relationType: "REQUIRES",
      strength: 1,
      importance: 100,
      state: "ACTIVE",
      isHard: true,
      temporalProgression: true,
      mutualStateSemantics: false,
      provenanceType: "DIRECT",
    });
    version = feedback.projectStructuralVersion;

    const missingActiveEndpointResults = await Promise.all(
      ["TIMELINE_EVENT", "ENTITY_STATE", "CAPTURE_DERIVED"].map((type) =>
        rejected(
          causality.createRelation(actor, project.id, {
            expectedStructuralVersion: version,
            source: { type, id: randomUUID() } as never,
            target: { type: "STORY_CHANGE", id: first.object.id },
            relationType: "CAUSES",
            strength: 1,
            importance: 50,
            state: "ACTIVE",
            isHard: false,
            temporalProgression: false,
            mutualStateSemantics: false,
            provenanceType: "DIRECT",
          }),
          "NOT_FOUND",
        ),
      ),
    );
    if (!missingActiveEndpointResults.every(Boolean))
      throw new Error(
        "An active causal endpoint adapter accepted a missing identity.",
      );
    const otherProject = await writing.createProject(actor, {
      title: "Other project",
    });
    const otherChange = await causality.writeStoryChange(
      actor,
      otherProject.id,
      {
        expectedStructuralVersion: 1,
        kind: "EVENT",
        title: "Elsewhere",
        isPlaceholder: false,
      },
    );
    const crossProjectRejected = await rejected(
      causality.createRelation(actor, project.id, {
        expectedStructuralVersion: version,
        source: { type: "STORY_CHANGE", id: otherChange.object.id },
        target: { type: "STORY_CHANGE", id: first.object.id },
        relationType: "CAUSES",
        strength: 1,
        importance: 50,
        state: "ACTIVE",
        isHard: false,
        temporalProgression: false,
        mutualStateSemantics: false,
        provenanceType: "DIRECT",
      }),
      "NOT_FOUND",
    );

    const reattached = await causality.lifecycleRelation(actor, project.id, {
      action: "REATTACH",
      expectedStructuralVersion: version,
      relationId: milestoneOutline.object.id,
      source: { type: "CHAPTER_OUTLINE", id: outline.id },
      target: { type: "MILESTONE", id: milestone.object.id },
    });
    version = reattached.projectStructuralVersion;
    const retired = await causality.lifecycleRelation(actor, project.id, {
      action: "RETIRE",
      expectedStructuralVersion: version,
      relationId: sceneIntent.object.id,
    });
    version = retired.projectStructuralVersion;
    const archived = await causality.lifecycleRelation(actor, project.id, {
      action: "ARCHIVE",
      expectedStructuralVersion: version,
      relationId: blockChange.object.id,
    });
    version = archived.projectStructuralVersion;
    if (
      reattached.object.source.type !== "CHAPTER_OUTLINE" ||
      retired.object.state !== "RETIRED" ||
      !archived.object.archivedAt
    )
      throw new Error(
        "Relation archive choices did not preserve explicit state.",
      );

    const chronology = await causality.validateChronology(
      actor,
      project.id,
      revealKnown.object.id,
    );
    if (
      chronology.chronology.basis !== "DISCOVERY_TIME" ||
      chronology.chronology.warnings[0]?.code !== "REVEAL_BEFORE_DISCOVERY"
    )
      throw new Error("Reveal chronology did not use discovery semantics.");
    const neutralChronology = await causality.validateChronology(
      actor,
      project.id,
      hardForward.object.id,
    );
    if (neutralChronology.chronology.basis !== "STORY_TIME")
      throw new Error("Story-time chronology basis was not resolved.");
    const impact = await causality.traceImpact(actor, project.id, {
      endpoint: { type: "STORY_CHANGE", id: first.object.id },
      direction: "DOWNSTREAM",
      states: ["ACTIVE"],
      maxDepth: 4,
      nodeBudget: 200,
      edgeBudget: 300,
      pathBudget: 200,
    });
    const bounded = await causality.getNeighborhood(actor, project.id, {
      endpoint: { type: "STORY_CHANGE", id: first.object.id },
      direction: "BOTH",
      states: ["ACTIVE"],
      maxDepth: 1,
      nodeBudget: 1,
      edgeBudget: 1,
      pathBudget: 1,
    });
    if (
      !impact.paths.length ||
      !impact.paths.every((path) =>
        path.steps.every(
          (step) => step.relationId && step.relationType && step.provenanceType,
        ),
      ) ||
      impact.language !== "POTENTIALLY_AFFECTED" ||
      !bounded.truncated ||
      bounded.nodeCount > 1 ||
      bounded.edgeCount > 1
    )
      throw new Error("Bounded causal traversal/provenance failed.");
    const directFirstProject = await writing.createProject(actor, {
      title: "Direct-first traversal verifier",
    });
    const rootId = randomUUID();
    const directTargetId = randomUUID();
    const unrelatedSourceId = randomUUID();
    const unrelatedTargetId = randomUUID();
    await prisma.storyChange.createMany({
      data: [
        {
          id: rootId,
          projectId: directFirstProject.id,
          kind: "EVENT",
          title: "Traversal root",
        },
        {
          id: directTargetId,
          projectId: directFirstProject.id,
          kind: "OUTCOME",
          title: "Direct target",
        },
        {
          id: unrelatedSourceId,
          projectId: directFirstProject.id,
          kind: "EVENT",
          title: "Unrelated source",
        },
        {
          id: unrelatedTargetId,
          projectId: directFirstProject.id,
          kind: "OUTCOME",
          title: "Unrelated target",
        },
      ],
    });
    await prisma.causalRelation.createMany({
      data: Array.from({ length: 750 }, () => ({
        projectId: directFirstProject.id,
        sourceType: "STORY_CHANGE" as const,
        sourceId: unrelatedSourceId,
        targetType: "STORY_CHANGE" as const,
        targetId: unrelatedTargetId,
        relationType: "CAUSES" as const,
        state: "TENTATIVE" as const,
      })),
    });
    await prisma.causalRelation.create({
      data: {
        projectId: directFirstProject.id,
        sourceType: "STORY_CHANGE",
        sourceId: rootId,
        targetType: "STORY_CHANGE",
        targetId: directTargetId,
        relationType: "CAUSES",
        state: "TENTATIVE",
      },
    });
    const directFirst = await causality.getNeighborhood(
      actor,
      directFirstProject.id,
      {
        endpoint: { type: "STORY_CHANGE", id: rootId },
        direction: "DOWNSTREAM",
        states: ["TENTATIVE"],
        maxDepth: 1,
        nodeBudget: 10,
        edgeBudget: 10,
        pathBudget: 10,
      },
    );
    if (
      directFirst.paths[0]?.steps[0]?.to.id !== directTargetId ||
      directFirst.edgeCount !== 1
    )
      throw new Error(
        "Frontier traversal allowed unrelated project edges to consume the direct-edge budget.",
      );
    const overview = await causality.getOverview(actor, project.id, {
      nodeBudget: 500,
      edgeBudget: 750,
    });
    if (
      !overview ||
      overview.storyChanges.length !== 4 ||
      overview.relations.length !== 6
    )
      throw new Error("Causal overview round trip failed.");
    if (
      (await causality.getOverview(outsiderActor, project.id, {
        nodeBudget: 200,
        edgeBudget: 300,
      })) !== null
    )
      throw new Error("Cross-workspace causal read succeeded.");
    const crossWorkspaceWriteRejected = await rejected(
      causality.writeStoryChange(outsiderActor, project.id, {
        expectedStructuralVersion: version,
        kind: "EVENT",
        title: "Denied",
        isPlaceholder: false,
      }),
      "NOT_FOUND",
    );

    const revisionJson = JSON.stringify(
      await prisma.objectRevision.findMany({
        where: {
          projectId: project.id,
          objectType: { in: ["STORY_CHANGE", "CAUSAL_RELATION"] },
        },
        select: { snapshot: true },
      }),
    );
    if (
      !revisionJson.includes(privateChangeDescription) ||
      !revisionJson.includes(privateCondition) ||
      !revisionJson.includes(privateNote)
    )
      throw new Error("Causal revisions omitted canonical authored content.");
    const outbox = await prisma.outboxEvent.findMany({
      where: {
        aggregateId: project.id,
        eventType: {
          in: [
            "StoryChangeUpdated",
            "CausalRelationCreated",
            "CausalRelationUpdated",
            "CausalRelationDeleted",
          ],
        },
      },
      select: { payload: true },
    });
    const outboxJson = JSON.stringify(outbox);
    if (
      outbox.length !== 14 ||
      outboxJson.includes(privateChangeDescription) ||
      outboxJson.includes(privateCondition) ||
      outboxJson.includes(privateNote)
    )
      throw new Error("Causal outbox count or redaction failed.");
    const chapterAfter = await prisma.chapter.findUniqueOrThrow({
      where: { id: chapter.id },
      select: { bodyDocument: true, bodyText: true, version: true },
    });
    if (JSON.stringify(chapterBefore) !== JSON.stringify(chapterAfter))
      throw new Error("Causal operations mutated chapter prose/version.");

    const concurrentProject = await writing.createProject(actor, {
      title: "Concurrent causal verifier",
    });
    const concurrent = await Promise.allSettled([
      causality.writeStoryChange(actor, concurrentProject.id, {
        expectedStructuralVersion: 1,
        kind: "EVENT",
        title: "A",
        isPlaceholder: false,
      }),
      causality.writeStoryChange(actor, concurrentProject.id, {
        expectedStructuralVersion: 1,
        kind: "EVENT",
        title: "B",
        isPlaceholder: false,
      }),
    ]);
    const winners = concurrent.filter(
      (item) => item.status === "fulfilled",
    ).length;
    const conflicts = concurrent.filter(
      (item): item is PromiseRejectedResult =>
        item.status === "rejected" &&
        typeof item.reason === "object" &&
        item.reason !== null &&
        item.reason.code === "CONFLICT",
    ).length;
    if (
      winners !== 1 ||
      conflicts !== 1 ||
      (await prisma.storyChange.count({
        where: { projectId: concurrentProject.id },
      })) !== 1 ||
      (await prisma.objectRevision.count({
        where: { projectId: concurrentProject.id, objectType: "STORY_CHANGE" },
      })) !== 1 ||
      (await prisma.outboxEvent.count({
        where: {
          aggregateId: concurrentProject.id,
          eventType: "StoryChangeUpdated",
        },
      })) !== 1
    )
      throw new Error("Concurrent causal writes did not converge atomically.");

    // Console trace S6-DB-001: PostgreSQL verified S6 ownership, adapters, cycles, chronology, traversal, revision/outbox, lifecycle, concurrency and prose isolation without authored content.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S6-DB-001",
        event: "causality_database.verified",
        projectId: project.id,
        structuralVersion: version,
        storyChangeCount: overview.storyChanges.length,
        activeRelationCount: overview.relations.length,
        allActiveAdaptersResolved: true,
        missingActiveEndpointsRejected: true,
        missingBlockAnchorRejected,
        hardCycleRejected,
        temporalFeedbackAccepted: true,
        duplicateActiveIdempotent: true,
        crossProjectRejected,
        crossWorkspaceRead: false,
        crossWorkspaceWriteRejected,
        revealBasis: chronology.chronology.basis,
        revealWarningCount: chronology.chronology.warnings.length,
        impactPathCount: impact.paths.length,
        fullPathProvenance: true,
        boundedNodeCount: bounded.nodeCount,
        boundedEdgeCount: bounded.edgeCount,
        directFirstTraversal: true,
        completeRevisionSnapshots: true,
        contentFreeOutbox: true,
        outboxCount: outbox.length,
        lifecycleChoicesPreserved: true,
        proseUnchanged: true,
        concurrentWinners: winners,
        concurrentConflicts: conflicts,
      }),
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function rollback(): Promise<void> {
  const sql = await readFile(
    new URL(
      "../prisma/migrations/20260813120000_causal_story_fabric/rollback.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const proseBefore = await client.query<{
      id: string;
      bodyDocument: unknown;
      bodyText: string;
      version: number;
    }>(
      `SELECT "id", "bodyDocument", "bodyText", "version" FROM "Chapter" ORDER BY "createdAt" LIMIT 1`,
    );
    await client.query(sql);
    const causalTables = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('StoryChange','CausalRelation')`,
    );
    const preservedTables = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('Plot','Volume','ChapterOutline','Scene','NarrativeIntent','StoryReference','ObjectRevision','StructureViewState','Milestone','ChapterMilestoneLink','MilestoneDependency')`,
    );
    const proseAfter = proseBefore.rowCount
      ? await client.query<{
          id: string;
          bodyDocument: unknown;
          bodyText: string;
          version: number;
        }>(
          `SELECT "id", "bodyDocument", "bodyText", "version" FROM "Chapter" WHERE "id"=$1`,
          [proseBefore.rows[0]!.id],
        )
      : { rows: [] };
    if (
      causalTables.rows[0]?.count !== "0" ||
      preservedTables.rows[0]?.count !== "11" ||
      JSON.stringify(proseBefore.rows[0]) !== JSON.stringify(proseAfter.rows[0])
    )
      throw new Error("Causality rollback crossed its S5/prose boundary.");
    await client.query(
      `DELETE FROM "_prisma_migrations" WHERE migration_name = '20260813120000_causal_story_fabric'`,
    );
    // Console trace S6-DB-002: S6-only rollback preserved S0–S5 canonical tables and byte-equivalent chapter prose.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S6-DB-002",
        event: "causality_database.rollback_verified",
        remainingCausalTables: 0,
        preservedPriorCapabilityTables: 11,
        proseRowsPreserved: proseBefore.rowCount ?? 0,
      }),
    );
  } finally {
    await client.end();
  }
}

const command = process.argv[2] ?? "verify";
if (command === "verify") await verify();
else if (command === "rollback") await rollback();
else throw new Error("Expected verify or rollback command.");
