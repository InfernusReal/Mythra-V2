import type { PrismaClient } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { wouldCreateForbiddenHardRequiresCycle, type CausalEdge } from "@/domains/causality/domain/graph";
import type { CausalEndpoint, CausalRelationState, CausalRelationType } from "@/domains/causality/domain/types";
import { normalizeChapterDocument } from "@/domains/writing/domain/chapter-document";
import { runDeterministicAutomations } from "../domain/automation";
import type { NormalizedDomainEvent } from "../domain/events";
import { buildDurableDirective, buildDurableSemanticCoordinate, projectionCandidate, type NarrativeDirectiveItem, type ProjectionCandidate } from "../domain/projections";
import { calculateNeutralWarnings, type WarningFact } from "../domain/warnings";
import type { ProjectionBuildResult } from "../application/ports";

const SOURCE_CAP = 100_000;
const WINDOW_CAP = 500;
const ADJACENCY_CAP = 300;

function ensureBounded(name: string, count: number): void {
  if (count > SOURCE_CAP) throw new Error(`${name.toUpperCase()}_SOURCE_LIMIT`);
}

function versions(items: ReadonlyArray<{ id: string; version?: number }>): Record<string, number> {
  return Object.fromEntries(items.map((item) => [item.id, item.version ?? 1]));
}

function endpoint(type: string, id: string, blockId: string | null): CausalEndpoint {
  return { type: type as CausalEndpoint["type"], id, ...(blockId ? { blockId } : {}) };
}

function endpointKey(type: string, id: string, blockId: string | null = null): string {
  return `${type}:${id}:${blockId ?? ""}`;
}

function directiveItem(id: string, label: string, rank: number, sourceType: string, sourceId: string, sourceVersion: number, blockId?: string | null): NarrativeDirectiveItem {
  return { id, label, rank, provenance: { sourceType, sourceId, sourceVersion, ...(blockId ? { blockId } : {}) } };
}

export class PrismaLiveModelProjector {
  constructor(private readonly prisma: PrismaClient) {}

  async build(event: NormalizedDomainEvent, generatedAt: Date): Promise<ProjectionBuildResult> {
    const project = await this.prisma.project.findUnique({ where: { id: event.projectId }, select: { id: true, workspaceId: true, structuralVersion: true, activeChapterId: true, updatedAt: true, status: true } });
    if (!project || project.workspaceId !== event.workspaceId || project.status === "DELETION_PENDING") throw new Error("PROJECT_NOT_AVAILABLE");
    const [members, chapters, plot, volumes, chapterOutlines, scenes, intents, milestones, milestoneLinks, milestoneDependencies, references, entities, entityStates, entityRelations, timelineEvents, timelineLinks, captures, conversions, notes, researchItems, storyChanges, causalRelations, storedAssets, searchCount] = await Promise.all([
      this.prisma.workspaceMember.findMany({ where: { workspaceId: project.workspaceId, status: "ACTIVE" }, orderBy: { userId: "asc" }, take: 1, select: { userId: true, role: true } }),
      this.prisma.chapter.findMany({ where: { projectId: project.id, archivedAt: null, status: { not: "ARCHIVED" } }, orderBy: { sequenceIndex: "asc" }, take: SOURCE_CAP + 1, select: { id: true, title: true, sequenceIndex: true, volumeId: true, volumeSequenceIndex: true, bodyDocument: true, wordCount: true, targetWords: true, status: true, version: true, updatedAt: true } }),
      this.prisma.plot.findFirst({ where: { projectId: project.id, archivedAt: null }, select: { id: true, version: true, outline: { where: { archivedAt: null }, select: { id: true, version: true } } } }),
      this.prisma.volume.findMany({ where: { projectId: project.id, archivedAt: null }, orderBy: { sequenceIndex: "asc" }, take: SOURCE_CAP + 1, select: { id: true, sequenceIndex: true, targetWords: true, version: true, outline: { where: { archivedAt: null }, select: { id: true, version: true } } } }),
      this.prisma.chapterOutline.findMany({ where: { projectId: project.id, archivedAt: null }, orderBy: { sequenceIndex: "asc" }, take: SOURCE_CAP + 1, select: { id: true, chapterId: true, volumeId: true, sequenceIndex: true, title: true, purpose: true, emotionalMovement: true, version: true } }),
      this.prisma.scene.findMany({ where: { projectId: project.id, archivedAt: null }, orderBy: [{ sequenceIndex: "asc" }, { id: "asc" }], take: SOURCE_CAP + 1, select: { id: true, chapterId: true, chapterOutlineId: true, purpose: true, version: true } }),
      this.prisma.narrativeIntent.findMany({ where: { projectId: project.id, archivedAt: null }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: SOURCE_CAP + 1, select: { id: true, targetType: true, targetId: true, blockId: true, category: true, intentText: true, version: true } }),
      this.prisma.milestone.findMany({ where: { projectId: project.id, archivedAt: null, status: { not: "ARCHIVED" } }, orderBy: { sequenceIndex: "asc" }, take: SOURCE_CAP + 1, select: { id: true, title: true, threadLabel: true, targetChapterStart: true, targetChapterEnd: true, status: true, version: true } }),
      this.prisma.chapterMilestoneLink.findMany({ where: { projectId: project.id, archivedAt: null }, orderBy: [{ milestoneId: "asc" }, { chapterId: "asc" }], take: SOURCE_CAP + 1, select: { id: true, chapterId: true, milestoneId: true, role: true, weight: true, version: true } }),
      this.prisma.milestoneDependency.findMany({ where: { projectId: project.id, archivedAt: null }, take: SOURCE_CAP + 1, select: { id: true, sourceMilestoneId: true, targetMilestoneId: true, state: true, isHard: true, version: true } }),
      this.prisma.storyReference.findMany({ where: { projectId: project.id, archivedAt: null }, orderBy: { updatedAt: "desc" }, take: SOURCE_CAP + 1, select: { id: true, sourceType: true, sourceId: true, sourceBlockId: true, targetType: true, targetId: true, targetBlockId: true, relationshipKey: true, version: true } }),
      this.prisma.storyEntity.findMany({ where: { projectId: project.id, archivedAt: null, status: "ACTIVE" }, orderBy: { id: "asc" }, take: SOURCE_CAP + 1, select: { id: true, name: true, version: true } }),
      this.prisma.entityStateSnapshot.findMany({ where: { projectId: project.id, archivedAt: null }, orderBy: [{ entityId: "asc" }, { orderIndex: "asc" }], take: SOURCE_CAP + 1, select: { id: true, entityId: true, anchorType: true, anchorId: true, sourceEntityVersion: true } }),
      this.prisma.entityRelation.findMany({ where: { projectId: project.id, archivedAt: null }, take: SOURCE_CAP + 1, select: { id: true, fromEntityId: true, toEntityId: true, version: true } }),
      this.prisma.timelineEvent.findMany({ where: { projectId: project.id, archivedAt: null }, orderBy: [{ sortStart: "asc" }, { ordinalValue: "asc" }, { id: "asc" }], take: SOURCE_CAP + 1, select: { id: true, title: true, mode: true, sortStart: true, sortEnd: true, relativeToEventId: true, version: true } }),
      this.prisma.timelineEventLink.findMany({ where: { projectId: project.id, archivedAt: null }, take: SOURCE_CAP + 1, select: { id: true, eventId: true, targetType: true, targetId: true } }),
      this.prisma.capture.findMany({ where: { projectId: project.id, lifecycle: { not: "DISMISSED" } }, orderBy: { capturedAt: "desc" }, take: SOURCE_CAP + 1, select: { id: true, userId: true, chapterId: true, outlineId: true, blockId: true, lifecycle: true, version: true } }),
      this.prisma.captureConversion.findMany({ where: { projectId: project.id }, take: SOURCE_CAP + 1, select: { id: true, captureId: true, targetType: true, targetId: true, projectStructuralVersion: true } }),
      this.prisma.note.findMany({ where: { projectId: project.id, archivedAt: null }, orderBy: { id: "asc" }, take: SOURCE_CAP + 1, select: { id: true, version: true } }),
      this.prisma.researchItem.findMany({ where: { projectId: project.id, archivedAt: null }, orderBy: { id: "asc" }, take: SOURCE_CAP + 1, select: { id: true, version: true } }),
      this.prisma.storyChange.findMany({ where: { projectId: project.id, archivedAt: null }, orderBy: { updatedAt: "desc" }, take: SOURCE_CAP + 1, select: { id: true, title: true, storyTime: true, discoveryTime: true, anchorType: true, anchorId: true, anchorBlockId: true, version: true } }),
      this.prisma.causalRelation.findMany({ where: { projectId: project.id, archivedAt: null, state: { in: ["ACTIVE", "TENTATIVE"] } }, orderBy: [{ importance: "desc" }, { id: "asc" }], take: SOURCE_CAP + 1, select: { id: true, sourceType: true, sourceId: true, sourceBlockId: true, targetType: true, targetId: true, targetBlockId: true, relationType: true, importance: true, state: true, isHard: true, temporalProgression: true, mutualStateSemantics: true, provenanceType: true, provenanceNote: true, version: true } }),
      this.prisma.storedAsset.findMany({ where: { projectId: project.id, archivedAt: null }, take: SOURCE_CAP + 1, select: { id: true, sizeBytes: true } }),
      this.prisma.searchDocument.count({ where: { projectId: project.id } }),
    ]);

    for (const [name, rows] of Object.entries({ chapters, volumes, chapterOutlines, scenes, intents, milestones, milestoneLinks, milestoneDependencies, references, entities, entityStates, entityRelations, timelineEvents, timelineLinks, captures, conversions, notes, researchItems, storyChanges, causalRelations, storedAssets })) ensureBounded(name, rows.length);

    const structuralVersion = project.structuralVersion;
    const projections: ProjectionCandidate[] = [];
    const chapterById = new Map(chapters.map((row) => [row.id, row]));
    const outlineByChapter = new Map(chapterOutlines.filter((row) => row.chapterId).map((row) => [row.chapterId!, row]));
    const linksByChapter = new Map<string, typeof milestoneLinks>();
    for (const link of milestoneLinks) linksByChapter.set(link.chapterId, [...(linksByChapter.get(link.chapterId) ?? []), link]);
    const milestoneById = new Map(milestones.map((row) => [row.id, row]));
    const referenceCounts: Record<string, number> = {};
    for (const row of references) { referenceCounts[row.sourceId] = (referenceCounts[row.sourceId] ?? 0) + 1; referenceCounts[row.targetId] = (referenceCounts[row.targetId] ?? 0) + 1; }
    const captureCounts: Record<string, number> = {};
    for (const capture of captures) if (capture.chapterId) captureCounts[capture.chapterId] = (captureCounts[capture.chapterId] ?? 0) + 1;

    projections.push(projectionCandidate({ kind: "CONTINUATION", scopeType: "PROJECT", scopeId: project.id, projectStructuralVersion: structuralVersion, sourceObjectVersions: versions(chapters), payload: { activeChapterId: project.activeChapterId, recentChapterIds: [...chapters].sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime()).slice(0, 5).map((row) => row.id), chapterCount: chapters.length }, freshness: "FRESH", generatedAt }));

    const labelMap = new Map<string, string>();
    for (const row of milestones) labelMap.set(endpointKey("MILESTONE", row.id), row.title);
    for (const row of chapterOutlines) labelMap.set(endpointKey("CHAPTER_OUTLINE", row.id), row.title);
    for (const row of scenes) labelMap.set(endpointKey("SCENE", row.id), row.purpose ?? "Scene");
    for (const row of entities) labelMap.set(endpointKey("ENTITY", row.id), row.name);
    for (const row of timelineEvents as Array<{ id: string; title: string }>) labelMap.set(endpointKey("TIMELINE_EVENT", row.id), row.title);
    for (const row of storyChanges) labelMap.set(endpointKey("STORY_CHANGE", row.id), row.title);
    for (const row of intents) labelMap.set(endpointKey("NARRATIVE_INTENT", row.id), row.category ?? "Narrative intent");
    for (const row of entityStates) labelMap.set(endpointKey("ENTITY_STATE", row.id), "Entity state");
    for (const row of conversions.filter((entry) => entry.targetType === "CAPTURE_DERIVED")) labelMap.set(endpointKey("CAPTURE_DERIVED", row.id), "Capture-derived object");

    for (const chapter of chapters) {
      const outline = outlineByChapter.get(chapter.id);
      const chapterLinks = linksByChapter.get(chapter.id) ?? [];
      const chapterMilestones = chapterLinks.map((link) => milestoneById.get(link.milestoneId)).filter((row): row is NonNullable<typeof row> => Boolean(row));
      const chapterIntents = intents.filter((intent) => intent.targetId === chapter.id && (intent.targetType === "CHAPTER" || intent.targetType === "PARAGRAPH_SELECTION"));
      const chapterReferences = references.filter((reference) => reference.sourceId === chapter.id || reference.targetId === chapter.id);
      const anchorKeys = new Set<string>([
        ...(outline ? [endpointKey("CHAPTER_OUTLINE", outline.id)] : []),
        ...chapterMilestones.map((row) => endpointKey("MILESTONE", row.id)),
        ...chapterIntents.map((row) => endpointKey("NARRATIVE_INTENT", row.id)),
        ...normalizeChapterDocument(chapter.bodyDocument).content.map((block) => endpointKey("MANUSCRIPT_BLOCK", chapter.id, block.attrs.blockId)),
      ]);
      const directCausal = causalRelations.filter((relation) => anchorKeys.has(endpointKey(relation.sourceType, relation.sourceId, relation.sourceBlockId)) || anchorKeys.has(endpointKey(relation.targetType, relation.targetId, relation.targetBlockId)));
      const sourceObjectVersions = { [chapter.id]: chapter.version, ...(outline ? { [outline.id]: outline.version } : {}), ...versions(chapterMilestones), ...versions(chapterIntents), ...versions(chapterReferences), ...versions(directCausal) };
      projections.push(projectionCandidate({ kind: "CHAPTER_CONTEXT", scopeType: "CHAPTER", scopeId: chapter.id, projectStructuralVersion: structuralVersion, sourceObjectVersions, payload: { chapterId: chapter.id, outlineId: outline?.id ?? null, milestoneIds: chapterMilestones.map((row) => row.id), referenceIds: chapterReferences.map((row) => row.id), narrativeIntentIds: chapterIntents.map((row) => row.id), causalRelationIds: directCausal.map((row) => row.id), captureIds: captures.filter((row) => row.chapterId === chapter.id).map((row) => row.id), freshness: "FRESH" }, freshness: "FRESH", generatedAt }));

      const becauseItems = directCausal.filter((relation) => anchorKeys.has(endpointKey(relation.targetType, relation.targetId, relation.targetBlockId))).map((relation) => directiveItem(`because:${relation.id}`, `${relation.relationType}: ${labelMap.get(endpointKey(relation.sourceType, relation.sourceId)) ?? relation.sourceType}`, 90 + relation.importance, "CAUSAL_RELATION", relation.id, relation.version, relation.sourceBlockId));
      const consequenceItems = directCausal.filter((relation) => anchorKeys.has(endpointKey(relation.sourceType, relation.sourceId, relation.sourceBlockId))).map((relation) => directiveItem(`consequence:${relation.id}`, `${relation.relationType}: ${labelMap.get(endpointKey(relation.targetType, relation.targetId)) ?? relation.targetType}`, 90 + relation.importance, "CAUSAL_RELATION", relation.id, relation.version, relation.targetBlockId));
      const directive = buildDurableDirective({ projectStructuralVersion: structuralVersion, chapterId: chapter.id, sourceObjectVersions, generatedAt: generatedAt.toISOString(), freshness: "FRESH", purposeItems: outline?.purpose ? [directiveItem(`purpose:${outline.id}`, outline.purpose, 100, "CHAPTER_OUTLINE", outline.id, outline.version)] : [], advanceItems: chapterLinks.flatMap((link) => { const milestone = milestoneById.get(link.milestoneId); return milestone ? [directiveItem(`advance:${milestone.id}`, `${link.role}: ${milestone.title}`, 80 + link.weight, "MILESTONE", milestone.id, milestone.version)] : []; }), preserveItems: chapterIntents.filter((row) => ["TENSION", "AMBIGUITY", "ATMOSPHERE"].includes(row.category ?? "")).map((row) => directiveItem(`preserve:${row.id}`, row.intentText, 70, "NARRATIVE_INTENT", row.id, row.version, row.blockId)), readerOutcomeItems: chapterIntents.filter((row) => ["REVELATION", "EMOTION"].includes(row.category ?? "")).map((row) => directiveItem(`outcome:${row.id}`, row.intentText, 70, "NARRATIVE_INTENT", row.id, row.version, row.blockId)), nextItems: chapterIntents.filter((row) => row.category === "PACING").map((row) => directiveItem(`next:${row.id}`, row.intentText, 65, "NARRATIVE_INTENT", row.id, row.version, row.blockId)), becauseItems, consequenceItems, rankedContextItems: chapterReferences.map((row) => directiveItem(`reference:${row.id}`, row.relationshipKey, row.sourceBlockId ? 60 : 40, "STORY_REFERENCE", row.id, row.version, row.sourceBlockId)) });
      projections.push(projectionCandidate({ kind: "NARRATIVE_DIRECTIVE", scopeType: "CHAPTER", scopeId: chapter.id, projectStructuralVersion: structuralVersion, sourceObjectVersions, payload: directive as unknown as Record<string, unknown>, freshness: "FRESH", generatedAt }));

      const volume = volumes.find((row) => row.id === chapter.volumeId);
      const scene = scenes.find((row) => row.chapterId === chapter.id || row.chapterOutlineId === outline?.id);
      const storyChange = storyChanges.find((row) => row.anchorId === chapter.id || row.anchorId === outline?.id || row.anchorId === scene?.id);
      const coordinate = buildDurableSemanticCoordinate({ projectId: project.id, projectStructuralVersion: structuralVersion, plotId: plot?.id, plotOutlineId: plot?.outline?.id, volumeId: volume?.id, volumeOutlineId: volume?.outline?.id, milestoneThreadIds: chapterMilestones.map((row) => row.id), chapterOutlineId: outline?.id, chapterId: chapter.id, sceneId: scene?.id, storyChangeId: storyChange?.id, neighborhoodSummaries: [{ level: "CHAPTER", count: chapters.length }, { level: "MILESTONE_THREAD", count: chapterMilestones.length }, { level: "STORY_CHANGE", count: storyChanges.length }] });
      projections.push(projectionCandidate({ kind: "SEMANTIC_COORDINATE", scopeType: "CHAPTER", scopeId: chapter.id, projectStructuralVersion: structuralVersion, sourceObjectVersions, payload: coordinate as unknown as Record<string, unknown>, freshness: "FRESH", generatedAt }));
    }

    for (const milestone of milestones) {
      const links = milestoneLinks.filter((row) => row.milestoneId === milestone.id);
      const completedCount = links.filter((row) => { const chapter = chapterById.get(row.chapterId); return chapter?.status === "FINAL" || chapter?.status === "REVISED"; }).length;
      projections.push(projectionCandidate({ kind: "MILESTONE_PROGRESS", scopeType: "MILESTONE", scopeId: milestone.id, projectStructuralVersion: structuralVersion, sourceObjectVersions: { [milestone.id]: milestone.version, ...versions(links) }, payload: { linkedChapterCount: links.length, completedChapterCount: completedCount, progress: links.length ? completedCount / links.length : 0, targetChapterStart: milestone.targetChapterStart, targetChapterEnd: milestone.targetChapterEnd }, freshness: "FRESH", generatedAt }));
    }

    for (const volume of volumes) {
      const volumeChapters = chapters.filter((row) => row.volumeId === volume.id);
      const wordCount = volumeChapters.reduce((total, row) => total + row.wordCount, 0);
      projections.push(projectionCandidate({ kind: "VOLUME_HEALTH", scopeType: "VOLUME", scopeId: volume.id, projectStructuralVersion: structuralVersion, sourceObjectVersions: { [volume.id]: volume.version, ...versions(volumeChapters) }, payload: { chapterCount: volumeChapters.length, wordCount, targetWords: volume.targetWords, targetProgress: volume.targetWords ? wordCount / volume.targetWords : null, hardJudgment: false }, freshness: "FRESH", generatedAt }));
    }

    for (const entity of entities) {
      const backlinks = references.filter((row) => (row.sourceType === "ENTITY" && row.sourceId === entity.id) || (row.targetType === "ENTITY" && row.targetId === entity.id));
      const relations = entityRelations.filter((row) => row.fromEntityId === entity.id || row.toEntityId === entity.id);
      const states = entityStates.filter((row) => row.entityId === entity.id);
      projections.push(projectionCandidate({ kind: "ENTITY_BACKLINKS", scopeType: "ENTITY", scopeId: entity.id, projectStructuralVersion: structuralVersion, sourceObjectVersions: { [entity.id]: entity.version, ...versions(backlinks), ...versions(relations) }, payload: { storyReferenceIds: backlinks.map((row) => row.id), entityRelationIds: relations.map((row) => row.id), stateSnapshotIds: states.map((row) => row.id) }, freshness: "FRESH", generatedAt }));
    }

    const timelineRows = (timelineEvents as unknown as Array<{ id: string; title: string; mode: string; sortStart: { toString(): string } | null; sortEnd: { toString(): string } | null; relativeToEventId: string | null; version: number }>);
    projections.push(projectionCandidate({ kind: "TIMELINE_WINDOW", scopeType: "PROJECT", scopeId: project.id, projectStructuralVersion: structuralVersion, sourceObjectVersions: versions(timelineRows), payload: { eventIds: timelineRows.slice(0, WINDOW_CAP).map((row) => row.id), returned: Math.min(timelineRows.length, WINDOW_CAP), total: timelineRows.length, hasMore: timelineRows.length > WINDOW_CAP, windowCap: WINDOW_CAP }, freshness: "FRESH", generatedAt }));
    projections.push(projectionCandidate({ kind: "SEARCH_DOCUMENT", scopeType: "PROJECT", scopeId: project.id, projectStructuralVersion: structuralVersion, sourceObjectVersions: { project: structuralVersion }, payload: { indexedDocumentCount: searchCount, synchronizationRequired: true }, freshness: "UPDATING", generatedAt }));

    const automation = runDeterministicAutomations({ projectStructuralVersion: structuralVersion, chapters: chapters.map((row) => ({ id: row.id, sequenceIndex: row.sequenceIndex, volumeId: row.volumeId, wordCount: row.wordCount, targetWords: row.targetWords, status: row.status, updatedAt: row.updatedAt })), milestones: milestones.map((row) => ({ id: row.id, targetChapterStart: row.targetChapterStart, targetChapterEnd: row.targetChapterEnd, status: row.status, linkedChapterIds: milestoneLinks.filter((link) => link.milestoneId === row.id).map((link) => link.chapterId) })), referenceCounts, captureCounts, causalNodeCount: new Set(causalRelations.flatMap((row) => [endpointKey(row.sourceType, row.sourceId, row.sourceBlockId), endpointKey(row.targetType, row.targetId, row.targetBlockId)])).size, causalEdgeCount: causalRelations.length, snapshotProviderAvailable: false, lastVerifiedSnapshotAt: null, now: generatedAt });
    const storageBytes = storedAssets.reduce((total, row) => total + row.sizeBytes, 0n);
    projections.push(projectionCandidate({ kind: "QUOTA_SEAM", scopeType: "PROJECT", scopeId: project.id, projectStructuralVersion: structuralVersion, sourceObjectVersions: { project: structuralVersion }, payload: { storageBytes: storageBytes.toString(), chapterCount: chapters.length, objectCount: Object.values({ chapters, volumes, chapterOutlines, scenes, intents, milestones, milestoneLinks, milestoneDependencies, references, entities, entityStates, entityRelations, timelineEvents, timelineLinks, captures, conversions, notes, researchItems, storyChanges, causalRelations, storedAssets }).reduce((total, rows) => total + rows.length, 0), planLimitApplied: false, automation }, freshness: "FRESH", generatedAt }));

    const causalEdges: CausalEdge[] = causalRelations.map((row) => ({ id: row.id, source: endpoint(row.sourceType, row.sourceId, row.sourceBlockId), target: endpoint(row.targetType, row.targetId, row.targetBlockId), relationType: row.relationType as CausalRelationType, state: row.state as CausalRelationState, isHard: row.isHard, temporalProgression: row.temporalProgression, mutualStateSemantics: row.mutualStateSemantics, provenanceType: row.provenanceType, provenanceNote: row.provenanceNote }));
    const adjacency = new Map<string, typeof causalRelations>();
    for (const relation of causalRelations) {
      const source = endpointKey(relation.sourceType, relation.sourceId, relation.sourceBlockId); const target = endpointKey(relation.targetType, relation.targetId, relation.targetBlockId);
      adjacency.set(source, [...(adjacency.get(source) ?? []), relation]); adjacency.set(target, [...(adjacency.get(target) ?? []), relation]);
    }
    for (const [key, edges] of adjacency) {
      const [type, id, blockId] = key.split(":");
      const bounded = edges.slice(0, ADJACENCY_CAP);
      const common = { endpoint: { type, id, blockId: blockId || null }, relationIds: bounded.map((row) => row.id), returnedEdges: bounded.length, totalEdges: edges.length, truncated: edges.length > ADJACENCY_CAP, edgeBudget: ADJACENCY_CAP, pathProvenanceRequired: true };
      const sourceObjectVersions = versions(bounded);
      projections.push(projectionCandidate({ kind: "CAUSAL_NEIGHBORHOOD", scopeType: type ?? "ENDPOINT", scopeId: `${id}:${blockId ?? ""}`, projectStructuralVersion: structuralVersion, sourceObjectVersions, payload: { ...common, direction: "BOTH" }, freshness: "FRESH", generatedAt }));
      projections.push(projectionCandidate({ kind: "CAUSAL_IMPACT", scopeType: type ?? "ENDPOINT", scopeId: `${id}:${blockId ?? ""}`, projectStructuralVersion: structuralVersion, sourceObjectVersions, payload: { ...common, direction: "DOWNSTREAM", autoMutationCount: 0 }, freshness: "FRESH", generatedAt }));
    }

    const validEndpoints = new Set<string>();
    for (const row of milestones) validEndpoints.add(endpointKey("MILESTONE", row.id));
    for (const row of chapterOutlines) validEndpoints.add(endpointKey("CHAPTER_OUTLINE", row.id));
    for (const row of scenes) validEndpoints.add(endpointKey("SCENE", row.id));
    for (const row of timelineRows) validEndpoints.add(endpointKey("TIMELINE_EVENT", row.id));
    for (const row of intents) validEndpoints.add(endpointKey("NARRATIVE_INTENT", row.id));
    for (const row of entityStates) validEndpoints.add(endpointKey("ENTITY_STATE", row.id));
    for (const row of conversions.filter((entry) => entry.targetType === "CAPTURE_DERIVED")) validEndpoints.add(endpointKey("CAPTURE_DERIVED", row.id));
    for (const row of storyChanges) validEndpoints.add(endpointKey("STORY_CHANGE", row.id));
    for (const chapter of chapters) for (const block of normalizeChapterDocument(chapter.bodyDocument).content) validEndpoints.add(endpointKey("MANUSCRIPT_BLOCK", chapter.id, block.attrs.blockId));
    const orphanCausal = causalRelations.filter((row) => !validEndpoints.has(endpointKey(row.sourceType, row.sourceId, row.sourceBlockId)) || !validEndpoints.has(endpointKey(row.targetType, row.targetId, row.targetBlockId))).map((row) => row.id);
    const hardLoopIds = causalEdges.length <= 5_000 ? causalEdges.filter((candidate) => candidate.isHard && candidate.relationType === "REQUIRES" && wouldCreateForbiddenHardRequiresCycle(causalEdges.filter((edge) => edge.id !== candidate.id), candidate)).map((row) => row.id) : [];
    const storyTimes = new Map<string, { storyTime: number | null; discoveryTime: number | null }>();
    for (const row of storyChanges) storyTimes.set(endpointKey("STORY_CHANGE", row.id), { storyTime: row.storyTime === null ? null : Number(row.storyTime), discoveryTime: row.discoveryTime === null ? null : Number(row.discoveryTime) });
    for (const row of timelineRows) storyTimes.set(endpointKey("TIMELINE_EVENT", row.id), { storyTime: row.sortStart === null ? null : Number(row.sortStart), discoveryTime: null });
    const causalTemporal = causalRelations.filter((row) => { const source = storyTimes.get(endpointKey(row.sourceType, row.sourceId)); const target = storyTimes.get(endpointKey(row.targetType, row.targetId)); if (row.relationType === "REVEALS") return source?.discoveryTime !== null && source?.discoveryTime !== undefined && target?.discoveryTime !== null && target?.discoveryTime !== undefined && source.discoveryTime > target.discoveryTime; return source?.storyTime !== null && source?.storyTime !== undefined && target?.storyTime !== null && target?.storyTime !== undefined && source.storyTime > target.storyTime; }).map((row) => row.id);
    const endpointExistsForReference = (type: string, id: string, blockId: string | null) => type === "PLOT" ? plot?.id === id : type === "PLOT_OUTLINE" ? plot?.outline?.id === id : type === "VOLUME" ? volumes.some((row) => row.id === id) : type === "VOLUME_OUTLINE" ? volumes.some((row) => row.outline?.id === id) : type === "CHAPTER_OUTLINE" ? chapterOutlines.some((row) => row.id === id) : type === "CHAPTER" ? chapterById.has(id) : type === "SCENE" ? scenes.some((row) => row.id === id) : type === "NARRATIVE_INTENT" ? intents.some((row) => row.id === id) : type === "MANUSCRIPT_BLOCK" ? validEndpoints.has(endpointKey(type, id, blockId)) : type === "MILESTONE" ? milestoneById.has(id) : type === "ENTITY" ? entities.some((row) => row.id === id) : type === "TIMELINE_EVENT" ? timelineRows.some((row) => row.id === id) : type === "NOTE" ? notes.some((row) => row.id === id) : type === "CAPTURE" ? captures.some((row) => row.id === id) : false;
    const brokenReferences = references.filter((row) => !endpointExistsForReference(row.sourceType, row.sourceId, row.sourceBlockId) || !endpointExistsForReference(row.targetType, row.targetId, row.targetBlockId)).map((row) => row.id);
    const milestoneChapterCounts: Record<string, number> = {}; for (const link of milestoneLinks) milestoneChapterCounts[link.chapterId] = (milestoneChapterCounts[link.chapterId] ?? 0) + 1;
    const warnings: WarningFact[] = calculateNeutralWarnings({ milestones: milestones.map((row) => ({ id: row.id, targetChapterStart: row.targetChapterStart, linkedChapterSequenceIndices: milestoneLinks.filter((link) => link.milestoneId === row.id).flatMap((link) => { const chapter = chapterById.get(link.chapterId); return chapter ? [chapter.sequenceIndex] : []; }), required: true })), milestoneChapterCounts, orphanStructureIds: [], brokenReferenceIds: brokenReferences, timelineConflictIds: [], quotaPercent: null, snapshotProviderAvailable: false, snapshotAgeHours: null, backupIntervalHours: 24, causalTemporalConflictIds: causalTemporal, hardPrerequisiteLoopIds: hardLoopIds, orphanCausalRelationIds: orphanCausal, currentChapterSequence: project.activeChapterId ? chapterById.get(project.activeChapterId)?.sequenceIndex ?? null : null, densityPreference: 4 });

    return { projectId: project.id, projectStructuralVersion: structuralVersion, projections, warnings, searchActors: members.map<SessionActor>((member) => ({ userId: member.userId, workspaceId: project.workspaceId, role: member.role, sessionId: "live-model-worker" })), automationCount: 13, sourceCounts: { chapters: chapters.length, notes: notes.length, researchItems: researchItems.length, projections: projections.length, warnings: warnings.length, causalRelations: causalRelations.length, searchDocuments: searchCount } };
  }
}
