import "dotenv/config";

import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { hostname } from "node:os";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaIdentityRepository } from "../domains/accounts/infrastructure/prisma-identity-repository";
import { deterministicWorkerId, LiveModelService, LiveModelWorker } from "../domains/live-model/application/service";
import { PrismaLiveModelRepository } from "../domains/live-model/infrastructure/prisma-live-model-repository";
import { PrismaWritingRepository } from "../domains/writing/infrastructure/prisma-writing-repository";
import { createLogger } from "../lib/observability/logger";
import { InMemoryMetricsSink } from "../lib/observability/metrics";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

async function drain(worker: LiveModelWorker, workerId: string, cap = 100): Promise<{ completed: number; duplicates: number }> {
  let completed = 0; let duplicates = 0;
  for (let index = 0; index < cap; index += 1) {
    const result = await worker.runBatch(workerId); completed += result.completed; duplicates += result.duplicates;
    if (!result.claimed) return { completed, duplicates };
  }
  throw new Error("S12 verifier drain exceeded its batch cap.");
}

async function verify(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const logger = createLogger({ service: "s12-verifier" });
  const metrics = new InMemoryMetricsSink();
  const repository = new PrismaLiveModelRepository(prisma);
  const worker = new LiveModelWorker({ repository, logger, metrics, now: () => new Date() });
  const service = new LiveModelService(repository, logger, metrics);
  const workerId = deterministicWorkerId(hostname(), process.pid);
  try {
    const suffix = randomUUID(); const identities = new PrismaIdentityRepository(prisma);
    const owner = await identities.resolveOrProvision({ provider: "s12", subject: `owner-${suffix}`, email: `owner-${suffix}@example.test`, emailVerified: true }, suffix);
    const outsider = await identities.resolveOrProvision({ provider: "s12", subject: `outsider-${suffix}`, email: `outsider-${suffix}@example.test`, emailVerified: true }, suffix);
    const actor = { ...owner, sessionId: randomUUID() }; const outsiderActor = { ...outsider, sessionId: randomUUID() };
    const writing = new PrismaWritingRepository(prisma); const project = await writing.createProject(actor, { title: "S12 verifier" }); const chapter = (await writing.createChapter(actor, { projectId: project.id, title: "Verifier chapter" })).chapter;
    const plot = await prisma.plot.create({ data: { projectId: project.id, title: "Verifier plot" } });
    const plotOutline = await prisma.plotOutline.create({ data: { projectId: project.id, plotId: plot.id, document: { type: "doc", content: [] }, purpose: "Verifier purpose" } });
    const volume = await prisma.volume.create({ data: { projectId: project.id, plotId: plot.id, sequenceIndex: 0, title: "Verifier volume", targetWords: 2_000 } });
    const volumeOutline = await prisma.volumeOutline.create({ data: { projectId: project.id, volumeId: volume.id, document: { type: "doc", content: [] }, purpose: "Volume purpose" } });
    await prisma.chapter.update({ where: { id: chapter.id }, data: { volumeId: volume.id, volumeSequenceIndex: 0 } });
    const outline = await prisma.chapterOutline.create({ data: { projectId: project.id, chapterId: chapter.id, volumeId: volume.id, sequenceIndex: 0, title: "Verifier outline", document: { type: "doc", content: [] }, purpose: "Find the proof" } });
    const scene = await prisma.scene.create({ data: { projectId: project.id, chapterId: chapter.id, chapterOutlineId: outline.id, sequenceIndex: 0, title: "Verifier scene", outlineDocument: { type: "doc", content: [] }, purpose: "Apply pressure" } });
    const intent = await prisma.narrativeIntent.create({ data: { projectId: project.id, targetType: "CHAPTER", targetId: chapter.id, category: "TENSION", intentText: "Preserve uncertainty" } });
    const milestone = await prisma.milestone.create({ data: { projectId: project.id, sequenceIndex: 0, title: "Verifier milestone", targetChapterStart: 1, targetChapterEnd: 1 } });
    await prisma.chapterMilestoneLink.create({ data: { projectId: project.id, chapterId: chapter.id, milestoneId: milestone.id, role: "TURN" } });
    const entityType = await prisma.entityType.create({ data: { projectId: project.id, key: `person-${suffix}`, name: "Person" } });
    const entity = await prisma.storyEntity.create({ data: { projectId: project.id, entityTypeId: entityType.id, createdById: actor.userId, name: "Verifier entity" } });
    const entityState = await prisma.entityStateSnapshot.create({ data: { projectId: project.id, entityId: entity.id, anchorType: "CHAPTER", anchorId: chapter.id, stateJson: {}, orderIndex: 0, sourceEntityVersion: entity.version } });
    const timeline = await prisma.timelineEvent.create({ data: { projectId: project.id, title: "Verifier timeline", mode: "ABSOLUTE", displayLabel: "Point 1", sortStart: 1 } });
    const cause = await prisma.storyChange.create({ data: { projectId: project.id, kind: "EVENT", title: "Cause", storyTime: 2, anchorType: "SCENE", anchorId: scene.id } });
    const effect = await prisma.storyChange.create({ data: { projectId: project.id, kind: "OUTCOME", title: "Effect", storyTime: 1, anchorType: "CHAPTER_OUTLINE", anchorId: outline.id } });
    const relation = await prisma.causalRelation.create({ data: { projectId: project.id, sourceType: "STORY_CHANGE", sourceId: cause.id, targetType: "STORY_CHANGE", targetId: effect.id, relationType: "CAUSES" } });
    const orphanRelation = await prisma.causalRelation.create({ data: { projectId: project.id, sourceType: "STORY_CHANGE", sourceId: randomUUID(), targetType: "STORY_CHANGE", targetId: effect.id, relationType: "ENABLES" } });
    await prisma.storyReference.create({ data: { projectId: project.id, sourceType: "CHAPTER", sourceId: chapter.id, targetType: "ENTITY", targetId: entity.id } });
    await prisma.project.update({ where: { id: project.id }, data: { structuralVersion: 12 } });
    const trigger = await prisma.outboxEvent.create({ data: { workspaceId: actor.workspaceId, aggregateType: "Project", aggregateId: project.id, eventType: "CausalRelationUpdated", payload: { projectId: project.id, objectType: "CAUSAL_RELATION", objectId: relation.id, structuralVersion: 12 } } });

    const firstDrain = await drain(worker, workerId);
    const status = await service.status(actor, project.id, randomUUID()); if (!status) throw new Error("S12 status missing.");
    const kinds = new Set(status.projections.map((projection) => projection.kind));
    const expectedKinds = ["CONTINUATION", "CHAPTER_CONTEXT", "MILESTONE_PROGRESS", "VOLUME_HEALTH", "ENTITY_BACKLINKS", "TIMELINE_WINDOW", "SEARCH_DOCUMENT", "QUOTA_SEAM", "CAUSAL_NEIGHBORHOOD", "CAUSAL_IMPACT", "NARRATIVE_DIRECTIVE", "SEMANTIC_COORDINATE"];
    if (!expectedKinds.every((kind) => kinds.has(kind))) throw new Error("S12 projection catalog was incomplete.");
    const directive = await prisma.liveModelProjection.findUniqueOrThrow({ where: { projectId_kind_scopeType_scopeId: { projectId: project.id, kind: "NARRATIVE_DIRECTIVE", scopeType: "CHAPTER", scopeId: chapter.id } }, select: { payload: true, digest: true } });
    const directivePayload = directive.payload as Record<string, unknown>;
    if (!directivePayload.purpose || !Array.isArray(directivePayload.becauseItems) || !Array.isArray(directivePayload.consequenceItems) || typeof directivePayload.generatedAt !== "string") throw new Error("S12 durable directive contract was incomplete.");
    const coordinate = await prisma.liveModelProjection.findUniqueOrThrow({ where: { projectId_kind_scopeType_scopeId: { projectId: project.id, kind: "SEMANTIC_COORDINATE", scopeType: "CHAPTER", scopeId: chapter.id } }, select: { payload: true } });
    const levels = ((coordinate.payload as { orderedPath?: Array<{ level: string }> }).orderedPath ?? []).map((item) => item.level);
    if (!["PROJECT", "PLOT", "PLOT_OUTLINE", "VOLUME", "VOLUME_OUTLINE", "MILESTONE_THREAD", "CHAPTER_OUTLINE", "CHAPTER", "SCENE", "STORY_CHANGE"].every((level) => levels.includes(level))) throw new Error("S12 ruled semantic coordinate was incomplete.");
    if (!status.warnings.some((warning) => warning.warningType === "CAUSAL_TEMPORAL_CONFLICT") || !status.warnings.some((warning) => warning.warningType === "ORPHAN_CAUSAL_ENDPOINT")) throw new Error("S12 neutral causal warnings were missing.");

    await prisma.outboxEvent.update({ where: { id: trigger.id }, data: { status: "PENDING", completedAt: null, availableAt: new Date(), leaseOwner: null, leasedUntil: null } });
    const duplicate = await worker.runBatch(workerId);
    if (duplicate.duplicates !== 1) throw new Error("S12 duplicate delivery was not idempotent.");

    const before = new Map((await prisma.liveModelProjection.findMany({ where: { projectId: project.id }, select: { kind: true, scopeType: true, scopeId: true, digest: true } })).map((row) => [`${row.kind}:${row.scopeType}:${row.scopeId}`, row.digest]));
    const corrupt = await prisma.liveModelProjection.findFirstOrThrow({ where: { projectId: project.id, kind: "NARRATIVE_DIRECTIVE" }, select: { id: true } });
    await prisma.liveModelProjection.update({ where: { id: corrupt.id }, data: { payload: { corrupted: true }, digest: "0".repeat(64), freshness: "FAILED" } });
    const rebuilt = await service.rebuild(actor, project.id, randomUUID());
    const after = new Map((await prisma.liveModelProjection.findMany({ where: { projectId: project.id }, select: { kind: true, scopeType: true, scopeId: true, digest: true } })).map((row) => [`${row.kind}:${row.scopeType}:${row.scopeId}`, row.digest]));
    if ([...before].some(([key, digest]) => after.get(key) !== digest) || rebuilt.removed !== 0) throw new Error("S12 full rebuild did not match incremental projection state.");

    await prisma.liveModelProjection.update({ where: { id: corrupt.id }, data: { projectStructuralVersion: 99, sourceObjectVersions: { [chapter.id]: 99 } } });
    const stale = await service.rebuild(actor, project.id, randomUUID());
    if (stale.staleRejected < 1) throw new Error("S12 stale projection write was not rejected.");
    await prisma.liveModelProjection.update({ where: { id: corrupt.id }, data: { projectStructuralVersion: 12, sourceObjectVersions: { [chapter.id]: chapter.version } } });
    await service.rebuild(actor, project.id, randomUUID());

    const leaseEvent = await prisma.outboxEvent.create({ data: { workspaceId: actor.workspaceId, aggregateType: "Project", aggregateId: project.id, eventType: "ProjectCreated", payload: { projectId: project.id, structuralVersion: 12 }, status: "PROCESSING", leaseOwner: "expired-worker", leasedUntil: new Date(Date.now() - 1_000) } });
    await worker.runBatch(workerId);
    if ((await prisma.outboxEvent.findUniqueOrThrow({ where: { id: leaseEvent.id }, select: { status: true } })).status !== "COMPLETED") throw new Error("S12 expired lease was not recovered.");

    const badEvent = await prisma.outboxEvent.create({ data: { workspaceId: actor.workspaceId, aggregateType: "Project", aggregateId: project.id, eventType: "ProjectCreated", schemaVersion: 2, payload: { projectId: project.id, structuralVersion: 12 } } });
    for (let attempt = 0; attempt < 8; attempt += 1) { await prisma.outboxEvent.update({ where: { id: badEvent.id }, data: { availableAt: new Date() } }); await worker.runBatch(workerId); }
    const dead = await prisma.outboxEvent.findUniqueOrThrow({ where: { id: badEvent.id }, select: { status: true, attempts: true, deadLetteredAt: true, lastErrorCode: true } });
    if (dead.status !== "FAILED" || dead.attempts !== 8 || !dead.deadLetteredAt || dead.lastErrorCode !== "EVENT_SCHEMA_UNSUPPORTED") throw new Error("S12 retry/dead-letter policy failed.");

    if (await service.status(outsiderActor, project.id, randomUUID()) !== null) throw new Error("S12 cross-workspace status read succeeded.");
    const shape = await prisma.$queryRaw<Array<{ table_count: bigint; index_count: bigint }>>`SELECT (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('LiveModelEventDelivery','LiveModelProjection','LiveModelWarning'))::bigint AS table_count, (SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('LiveModelEventDelivery','LiveModelProjection','LiveModelWarning','OutboxEvent') AND indexname LIKE '%LiveModel%' OR indexname='OutboxEvent_status_availableAt_leasedUntil_idx')::bigint AS index_count`;
    const contentFree = !(await prisma.outboxEvent.findMany({ where: { id: { in: [trigger.id, leaseEvent.id, badEvent.id] } }, select: { payload: true } })).some((row) => JSON.stringify(row.payload).includes("Verifier purpose") || JSON.stringify(row.payload).includes("Preserve uncertainty"));
    if (Number(shape[0]?.table_count ?? 0) !== 3 || !contentFree || firstDrain.completed < 1 || !metrics.points.some((point) => point.name === "live_model.worker.batch.duration")) throw new Error("S12 database/observability proof was incomplete.");
    // Console trace S12-DB-001: PostgreSQL proof records IDs, versions, bounds, counts, freshness, recovery and privacy outcomes only.
    console.log(JSON.stringify({ level: "info", step: "S12-DB-001", event: "live_model_database.verified", projectId: project.id, chapterId: chapter.id, structuralVersion: status.projectStructuralVersion, projectionKindCount: kinds.size, projectionCount: status.projectionCount, firstDrainCompleted: firstDrain.completed, duplicateDeliveries: duplicate.duplicates, rebuildProjectionCount: rebuilt.projectionCount, rebuildParity: true, corruptProjectionRepaired: true, staleRejected: stale.staleRejected, leaseRecovered: true, deadLetterAttempts: dead.attempts, deadLetterCode: dead.lastErrorCode, activeWarningCount: status.warnings.length, crossWorkspaceRead: false, contentFreeOutbox: contentFree, tableCount: Number(shape[0]!.table_count), metricPointCount: metrics.points.length, causalRelationId: relation.id, orphanRelationId: orphanRelation.id, entityStateId: entityState.id, timelineEventId: timeline.id, plotOutlineId: plotOutline.id, volumeOutlineId: volumeOutline.id, intentId: intent.id }));
  } finally { await prisma.$disconnect(); }
}

async function rollback(): Promise<void> {
  const sql = await readFile(new URL("../prisma/migrations/20260829190000_live_story_model/rollback.sql", import.meta.url), "utf8"); const client = new Client({ connectionString }); await client.connect();
  try {
    const before = await client.query<{ project_count: string; chapter_count: string; causal_count: string; search_count: string }>(`SELECT (SELECT COUNT(*) FROM "Project")::text AS project_count, (SELECT COUNT(*) FROM "Chapter")::text AS chapter_count, (SELECT COUNT(*) FROM "CausalRelation")::text AS causal_count, (SELECT COUNT(*) FROM "SearchDocument")::text AS search_count`);
    await client.query(sql);
    const after = await client.query<{ project_count: string; chapter_count: string; causal_count: string; search_count: string }>(`SELECT (SELECT COUNT(*) FROM "Project")::text AS project_count, (SELECT COUNT(*) FROM "Chapter")::text AS chapter_count, (SELECT COUNT(*) FROM "CausalRelation")::text AS causal_count, (SELECT COUNT(*) FROM "SearchDocument")::text AS search_count`);
    const remaining = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('LiveModelEventDelivery','LiveModelProjection','LiveModelWarning')`);
    const columns = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM information_schema.columns WHERE table_schema='public' AND table_name='OutboxEvent' AND column_name IN ('schemaVersion','leaseOwner','leasedUntil','lastErrorCode','lastErrorAt','deadLetteredAt')`);
    if (JSON.stringify(before.rows[0]) !== JSON.stringify(after.rows[0]) || remaining.rows[0]?.count !== "0" || columns.rows[0]?.count !== "0") throw new Error("S12 rollback crossed its canonical boundary.");
    await client.query(`DELETE FROM "_prisma_migrations" WHERE migration_name='20260829190000_live_story_model'`);
    // Console trace S12-DB-002: rollback proof records only S12 schema removal and preserved canonical row counts.
    console.log(JSON.stringify({ level: "info", step: "S12-DB-002", event: "live_model_database.rollback_verified", remainingS12Tables: 0, remainingS12OutboxColumns: 0, preservedProjectRows: Number(after.rows[0]!.project_count), preservedChapterRows: Number(after.rows[0]!.chapter_count), preservedCausalRows: Number(after.rows[0]!.causal_count), preservedSearchRows: Number(after.rows[0]!.search_count) }));
  } finally { await client.end(); }
}

const command = process.argv[2] ?? "verify";
if (command === "verify") await verify(); else if (command === "rollback") await rollback(); else throw new Error("Expected verify or rollback command.");
