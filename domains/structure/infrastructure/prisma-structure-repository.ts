import { Prisma, type NarrativeIntentCategory, type PrismaClient, type StoryReferenceEndpointType, type StructureObjectType } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { StoryReferenceInput } from "@/domains/references/domain/story-reference";
import { errors } from "@/lib/contracts/errors";
import type { ScaffoldInput, StructureScaffoldPlan } from "../domain/scaffold";
import type { NarrativeIntentTargetType, StructureBudget } from "../domain/types";
import type {
  ChapterOutlineInput,
  ChapterOutlineSummary,
  NarrativeIntentSummary,
  OutlineContentInput,
  PlotSummary,
  SceneSummary,
  StoryReferenceSummary,
  StructureOverview,
  StructureRepository,
  StructureViewStateModel,
  VolumeSummary
} from "../application/ports";

const ACTIVE_LENSES = ["OUTLINE", "VOLUMES", "CHAPTERS", "MILESTONES", "CAUSAL", "RELATIONSHIPS", "SEMANTIC_ZOOM"] as const;
type Transaction = Prisma.TransactionClient;

async function structureTransaction<T>(prisma: PrismaClient, operation: (tx: Transaction) => Promise<T>, options?: { timeout?: number }): Promise<T> {
  try {
    return await prisma.$transaction(operation, options);
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : null;
    if (code === "P2002" || code === "P2034") throw errors.conflict("The structure changed concurrently. Review the current structure and try again.");
    if (code === "P2003" || code === "P2014") throw errors.integrity();
    throw error;
  }
}

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function stringArray(value: unknown, limit: number): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, limit) : [];
}

async function ownedProject(tx: Transaction, actor: SessionActor, projectId: string, expectedStructuralVersion?: number) {
  const project = await tx.project.findFirst({
    where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE", ...(expectedStructuralVersion === undefined ? {} : { structuralVersion: expectedStructuralVersion }) },
    select: { id: true, workspaceId: true, structuralVersion: true }
  });
  if (!project) {
    const visible = await tx.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE" }, select: { id: true } });
    if (visible && expectedStructuralVersion !== undefined) throw errors.conflict("The structure changed after this preview. Review the current structure and try again.");
    throw errors.notFound();
  }
  return project;
}

async function finishMutation(tx: Transaction, actor: SessionActor, projectId: string, expectedStructuralVersion: number, eventType: string, objectType: string, objectId: string): Promise<number> {
  const update = await tx.project.updateMany({
    where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE", structuralVersion: expectedStructuralVersion },
    data: { structuralVersion: { increment: 1 } }
  });
  if (update.count !== 1) throw errors.conflict("The structure changed after this preview. Review the current structure and try again.");
  const structuralVersion = expectedStructuralVersion + 1;
  await tx.outboxEvent.create({
    data: {
      workspaceId: actor.workspaceId,
      aggregateType: "Project",
      aggregateId: projectId,
      eventType,
      payload: { projectId, objectType, objectId, structuralVersion }
    }
  });
  return structuralVersion;
}

async function revise(tx: Transaction, projectId: string, objectType: StructureObjectType, objectId: string, version: number, snapshot: unknown, reason: string) {
  await tx.objectRevision.create({ data: { projectId, objectType, objectId, version, snapshot: json(snapshot), reason } });
}

function plotSummary(plot: { id: string; title: string; summary: string | null; version: number; outline?: { id: string } | null }): PlotSummary {
  return { id: plot.id, title: plot.title, summary: plot.summary, version: plot.version, outlineId: plot.outline?.id ?? null };
}

function volumeSummary(volume: { id: string; plotId: string; sequenceIndex: number; displayNumber: string | null; title: string; targetWords: number | null; hardTargetWordsEnabled: boolean; version: number; outline?: { id: string } | null; _count?: { chapters: number } }): VolumeSummary {
  return { id: volume.id, plotId: volume.plotId, sequenceIndex: volume.sequenceIndex, displayNumber: volume.displayNumber, title: volume.title, targetWords: volume.targetWords, hardTargetWordsEnabled: volume.hardTargetWordsEnabled, version: volume.version, outlineId: volume.outline?.id ?? null, chapterCount: volume._count?.chapters ?? 0 };
}

function chapterOutlineSummary(outline: { id: string; chapterId: string | null; volumeId: string | null; sequenceIndex: number; title: string; plainText: string; purpose: string | null; emotionalMovement: string | null; targetWords: number | null; hardTargetWordsEnabled: boolean; isPlaceholder: boolean; version: number; _count?: { scenes: number } }): ChapterOutlineSummary {
  return { id: outline.id, chapterId: outline.chapterId, volumeId: outline.volumeId, sequenceIndex: outline.sequenceIndex, title: outline.title, plainText: outline.plainText, purpose: outline.purpose, emotionalMovement: outline.emotionalMovement, targetWords: outline.targetWords, hardTargetWordsEnabled: outline.hardTargetWordsEnabled, isPlaceholder: outline.isPlaceholder, version: outline.version, sceneCount: outline._count?.scenes ?? 0 };
}

function sceneSummary(scene: { id: string; chapterId: string | null; chapterOutlineId: string | null; sequenceIndex: number; title: string; purpose: string | null; provenanceType: string; provenanceSourceId: string | null; provenanceBlockId: string | null; version: number }): SceneSummary {
  return { ...scene };
}

function referenceSummary(reference: { id: string; sourceType: string; sourceId: string; sourceBlockId: string | null; targetType: string; targetId: string; targetBlockId: string | null; relationshipKey: string; provenanceType: string; version: number }): StoryReferenceSummary {
  return { ...reference };
}

async function assertEndpoint(tx: Transaction, projectId: string, type: string, id: string, ownerUserId?: string): Promise<void> {
  let found: { id: string } | null = null;
  switch (type) {
    case "PLOT": found = await tx.plot.findFirst({ where: { id, projectId, archivedAt: null }, select: { id: true } }); break;
    case "PLOT_OUTLINE": found = await tx.plotOutline.findFirst({ where: { id, projectId, archivedAt: null }, select: { id: true } }); break;
    case "VOLUME": found = await tx.volume.findFirst({ where: { id, projectId, archivedAt: null }, select: { id: true } }); break;
    case "VOLUME_OUTLINE": found = await tx.volumeOutline.findFirst({ where: { id, projectId, archivedAt: null }, select: { id: true } }); break;
    case "MILESTONE": found = await tx.milestone.findFirst({ where: { id, projectId, archivedAt: null }, select: { id: true } }); break;
    case "CHAPTER_OUTLINE": found = await tx.chapterOutline.findFirst({ where: { id, projectId, archivedAt: null }, select: { id: true } }); break;
    case "CHAPTER":
    case "MANUSCRIPT_BLOCK": found = await tx.chapter.findFirst({ where: { id, projectId, archivedAt: null }, select: { id: true } }); break;
    case "SCENE": found = await tx.scene.findFirst({ where: { id, projectId, archivedAt: null }, select: { id: true } }); break;
    case "NARRATIVE_INTENT": found = await tx.narrativeIntent.findFirst({ where: { id, projectId, archivedAt: null }, select: { id: true } }); break;
    case "ENTITY": found = await tx.storyEntity.findFirst({ where: { id, projectId, archivedAt: null, status: "ACTIVE" }, select: { id: true } }); break;
    case "CAPTURE": found = ownerUserId ? await tx.capture.findFirst({ where: { id, projectId, userId: ownerUserId, lifecycle: { not: "DISMISSED" } }, select: { id: true } }) : null; break;
    default: throw errors.dependencyUnavailable();
  }
  if (!found) throw errors.notFound();
}

async function assertIntentTarget(tx: Transaction, projectId: string, type: NarrativeIntentTargetType, id: string): Promise<void> {
  await assertEndpoint(tx, projectId, type === "PARAGRAPH_SELECTION" ? "CHAPTER" : type, id);
}

export class PrismaStructureRepository implements StructureRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async assertProjectAccess(actor: SessionActor, projectId: string): Promise<void> {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE" }, select: { id: true } });
    if (!project) throw errors.notFound();
  }

  async getOverview(actor: SessionActor, projectId: string, budget: StructureBudget): Promise<StructureOverview | null> {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE" }, select: { id: true, title: true, structuralVersion: true, activeChapterId: true } });
    if (!project) return null;
    const take = Math.min(budget.pageSize, budget.nodeBudget) + 1;
    const plot = await this.prisma.plot.findFirst({ where: { projectId, archivedAt: null }, select: { id: true, title: true, summary: true, version: true, outline: { where: { archivedAt: null }, select: { id: true } } } });
    const volumesRaw = await this.prisma.volume.findMany({ where: { projectId, archivedAt: null }, orderBy: { sequenceIndex: "asc" }, skip: budget.rangeStart, take, select: { id: true, plotId: true, sequenceIndex: true, displayNumber: true, title: true, targetWords: true, hardTargetWordsEnabled: true, version: true, outline: { where: { archivedAt: null }, select: { id: true } }, _count: { select: { chapters: { where: { archivedAt: null } } } } } });
    const outlinesRaw = await this.prisma.chapterOutline.findMany({ where: { projectId, archivedAt: null }, orderBy: { sequenceIndex: "asc" }, skip: budget.rangeStart, take, select: { id: true, chapterId: true, volumeId: true, sequenceIndex: true, title: true, plainText: true, purpose: true, emotionalMovement: true, targetWords: true, hardTargetWordsEnabled: true, isPlaceholder: true, version: true, _count: { select: { scenes: { where: { archivedAt: null } } } } } });
    const chaptersRaw = await this.prisma.chapter.findMany({ where: { projectId, archivedAt: null }, orderBy: { sequenceIndex: "asc" }, skip: budget.rangeStart, take, select: { id: true, volumeId: true, volumeSequenceIndex: true, sequenceIndex: true, displayNumber: true, title: true, outline: { where: { archivedAt: null }, select: { id: true } }, _count: { select: { scenes: { where: { archivedAt: null } } } } } });
    const scenesRaw = await this.prisma.scene.findMany({ where: { projectId, archivedAt: null }, orderBy: { sequenceIndex: "asc" }, skip: budget.rangeStart, take, select: { id: true, chapterId: true, chapterOutlineId: true, sequenceIndex: true, title: true, purpose: true, provenanceType: true, provenanceSourceId: true, provenanceBlockId: true, version: true } });
    const referencesRaw = await this.prisma.storyReference.findMany({ where: { projectId, archivedAt: null }, orderBy: { createdAt: "desc" }, skip: budget.rangeStart, take: budget.edgeBudget + 1, select: { id: true, sourceType: true, sourceId: true, sourceBlockId: true, targetType: true, targetId: true, targetBlockId: true, relationshipKey: true, provenanceType: true, version: true } });
    const intentsRaw = await this.prisma.narrativeIntent.findMany({ where: { projectId, archivedAt: null }, orderBy: { updatedAt: "desc" }, skip: budget.rangeStart, take, select: { id: true, targetType: true, targetId: true, blockId: true, category: true, customCategory: true, version: true } });
    const storedView = await this.prisma.structureViewState.findUnique({ where: { userId_projectId: { userId: actor.userId, projectId } }, select: { mode: true, activeLens: true, expandedIds: true, activeAnchorType: true, activeAnchorId: true, cursorOffset: true, selectionAnchor: true, selectionHead: true, scrollTop: true, pinIds: true } });
    let remaining = Math.max(0, budget.nodeBudget - (plot ? 1 : 0));
    const consume = <T>(items: T[]) => { const selected = items.slice(0, remaining); remaining -= selected.length; return selected; };
    const volumes = consume(volumesRaw).map(volumeSummary);
    const chapterOutlines = consume(outlinesRaw).map(chapterOutlineSummary);
    const chapters = consume(chaptersRaw).map((chapter) => ({ id: chapter.id, volumeId: chapter.volumeId, volumeSequenceIndex: chapter.volumeSequenceIndex, sequenceIndex: chapter.sequenceIndex, displayNumber: chapter.displayNumber, title: chapter.title, outlineId: chapter.outline?.id ?? null, sceneCount: chapter._count.scenes }));
    const scenes = consume(scenesRaw).map(sceneSummary);
    const intents = consume(intentsRaw).map<NarrativeIntentSummary>((intent) => ({ ...intent, targetType: intent.targetType as NarrativeIntentSummary["targetType"], category: intent.category as NarrativeIntentSummary["category"] }));
    const references = referencesRaw.slice(0, budget.edgeBudget).map(referenceSummary);
    const viewState: StructureViewStateModel = storedView ? {
      mode: storedView.mode,
      activeLens: storedView.activeLens,
      expandedIds: stringArray(storedView.expandedIds, 2_000),
      activeAnchorType: storedView.activeAnchorType,
      activeAnchorId: storedView.activeAnchorId,
      cursorOffset: storedView.cursorOffset,
      selectionAnchor: storedView.selectionAnchor,
      selectionHead: storedView.selectionHead,
      scrollTop: storedView.scrollTop,
      pinIds: stringArray(storedView.pinIds, 100)
    } : { mode: "DISCOVERY", activeLens: "OUTLINE", expandedIds: [], activeAnchorType: null, activeAnchorId: null, cursorOffset: null, selectionAnchor: null, selectionHead: null, scrollTop: null, pinIds: [] };
    const rawNodeCount = (plot ? 1 : 0) + volumesRaw.length + outlinesRaw.length + chaptersRaw.length + scenesRaw.length + intentsRaw.length;
    const hasMoreNodes = rawNodeCount > budget.nodeBudget || [volumesRaw, outlinesRaw, chaptersRaw, scenesRaw, intentsRaw].some((items) => items.length === take);
    const hasMoreEdges = referencesRaw.length > budget.edgeBudget;
    return {
      project,
      plot: plot ? plotSummary(plot) : null,
      volumes,
      chapterOutlines,
      chapters,
      scenes,
      references,
      intents,
      viewState,
      lenses: ACTIVE_LENSES,
      page: { ...budget, nextRangeStart: hasMoreNodes || hasMoreEdges ? budget.rangeStart + budget.pageSize : null, returnedNodes: budget.nodeBudget - remaining, returnedEdges: references.length, hasMoreNodes, hasMoreEdges }
    };
  }

  async createPlot(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; title: string; summary?: string }) {
    return structureTransaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      const created = await tx.plot.create({ data: { projectId, title: input.title, summary: input.summary }, select: { id: true, title: true, summary: true, version: true } });
      await revise(tx, projectId, "PLOT", created.id, created.version, created, "created");
      const structuralVersion = await finishMutation(tx, actor, projectId, input.expectedStructuralVersion, "structure.plot.changed", "PLOT", created.id);
      return { object: plotSummary(created), projectStructuralVersion: structuralVersion };
    });
  }

  async updatePlot(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; plotId: string; title: string; summary?: string }) {
    return structureTransaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      const existing = await tx.plot.findFirst({ where: { id: input.plotId, projectId, archivedAt: null }, select: { id: true, title: true, summary: true, version: true, outline: { where: { archivedAt: null }, select: { id: true } } } });
      if (!existing) throw errors.notFound();
      const saved = await tx.plot.update({ where: { id: existing.id }, data: { title: input.title, summary: input.summary, version: { increment: 1 } }, select: { id: true, title: true, summary: true, version: true, outline: { where: { archivedAt: null }, select: { id: true } } } });
      await revise(tx, projectId, "PLOT", saved.id, saved.version, saved, "updated");
      const structuralVersion = await finishMutation(tx, actor, projectId, input.expectedStructuralVersion, "structure.plot.changed", "PLOT", saved.id);
      return { object: plotSummary(saved), projectStructuralVersion: structuralVersion };
    });
  }

  async upsertPlotOutline(actor: SessionActor, projectId: string, input: OutlineContentInput & { expectedStructuralVersion: number; plotId: string }) {
    return structureTransaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      const plot = await tx.plot.findFirst({ where: { id: input.plotId, projectId, archivedAt: null }, select: { id: true } });
      if (!plot) throw errors.notFound();
      const existing = await tx.plotOutline.findFirst({ where: { plotId: plot.id, projectId, archivedAt: null }, select: { id: true, version: true, document: true, plainText: true, purpose: true } });
      const saved = existing ? await tx.plotOutline.update({ where: { id: existing.id }, data: { document: json(input.document), plainText: input.plainText, purpose: input.purpose, version: { increment: 1 } } }) : await tx.plotOutline.create({ data: { projectId, plotId: plot.id, document: json(input.document), plainText: input.plainText, purpose: input.purpose } });
      await revise(tx, projectId, "PLOT_OUTLINE", saved.id, saved.version, saved, existing ? "updated" : "created");
      const structuralVersion = await finishMutation(tx, actor, projectId, input.expectedStructuralVersion, "structure.plot_outline.changed", "PLOT_OUTLINE", saved.id);
      return { object: saved, projectStructuralVersion: structuralVersion };
    });
  }

  async createVolume(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; plotId: string; sequenceIndex: number; displayNumber?: string; title: string; summary?: string; targetWords?: number; hardTargetWordsEnabled: boolean }) {
    return structureTransaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      const plot = await tx.plot.findFirst({ where: { id: input.plotId, projectId, archivedAt: null }, select: { id: true } });
      if (!plot) throw errors.notFound();
      const { expectedStructuralVersion, ...volumeInput } = input;
      const created = await tx.volume.create({ data: { projectId, ...volumeInput }, select: { id: true, plotId: true, sequenceIndex: true, displayNumber: true, title: true, summary: true, targetWords: true, hardTargetWordsEnabled: true, version: true } });
      await revise(tx, projectId, "VOLUME", created.id, created.version, created, "created");
      const structuralVersion = await finishMutation(tx, actor, projectId, expectedStructuralVersion, "structure.volume.changed", "VOLUME", created.id);
      return { object: volumeSummary(created), projectStructuralVersion: structuralVersion };
    });
  }

  async updateVolume(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; volumeId: string; displayNumber?: string; title: string; summary?: string; targetWords?: number; hardTargetWordsEnabled: boolean }) {
    return structureTransaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      const existing = await tx.volume.findFirst({ where: { id: input.volumeId, projectId, archivedAt: null }, select: { id: true, plotId: true, sequenceIndex: true, displayNumber: true, title: true, summary: true, targetWords: true, hardTargetWordsEnabled: true, version: true, outline: { where: { archivedAt: null }, select: { id: true } }, _count: { select: { chapters: true } } } });
      if (!existing) throw errors.notFound();
      const saved = await tx.volume.update({ where: { id: existing.id }, data: { displayNumber: input.displayNumber, title: input.title, summary: input.summary, targetWords: input.targetWords, hardTargetWordsEnabled: input.hardTargetWordsEnabled, version: { increment: 1 } }, select: { id: true, plotId: true, sequenceIndex: true, displayNumber: true, title: true, summary: true, targetWords: true, hardTargetWordsEnabled: true, version: true, outline: { where: { archivedAt: null }, select: { id: true } }, _count: { select: { chapters: true } } } });
      await revise(tx, projectId, "VOLUME", saved.id, saved.version, saved, "updated");
      const structuralVersion = await finishMutation(tx, actor, projectId, input.expectedStructuralVersion, "structure.volume.changed", "VOLUME", saved.id);
      return { object: volumeSummary(saved), projectStructuralVersion: structuralVersion };
    });
  }

  async upsertVolumeOutline(actor: SessionActor, projectId: string, input: OutlineContentInput & { expectedStructuralVersion: number; volumeId: string }) {
    return structureTransaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      const volume = await tx.volume.findFirst({ where: { id: input.volumeId, projectId, archivedAt: null }, select: { id: true } });
      if (!volume) throw errors.notFound();
      const existing = await tx.volumeOutline.findFirst({ where: { volumeId: volume.id, projectId, archivedAt: null }, select: { id: true, version: true, document: true, plainText: true, purpose: true } });
      const saved = existing ? await tx.volumeOutline.update({ where: { id: existing.id }, data: { document: json(input.document), plainText: input.plainText, purpose: input.purpose, version: { increment: 1 } } }) : await tx.volumeOutline.create({ data: { projectId, volumeId: volume.id, document: json(input.document), plainText: input.plainText, purpose: input.purpose } });
      await revise(tx, projectId, "VOLUME_OUTLINE", saved.id, saved.version, saved, existing ? "updated" : "created");
      const structuralVersion = await finishMutation(tx, actor, projectId, input.expectedStructuralVersion, "structure.volume_outline.changed", "VOLUME_OUTLINE", saved.id);
      return { object: saved, projectStructuralVersion: structuralVersion };
    });
  }

  async upsertChapterOutline(actor: SessionActor, projectId: string, input: ChapterOutlineInput) {
    return structureTransaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      if (input.chapterId) await assertEndpoint(tx, projectId, "CHAPTER", input.chapterId);
      if (input.volumeId) await assertEndpoint(tx, projectId, "VOLUME", input.volumeId);
      const existing = input.outlineId ? await tx.chapterOutline.findFirst({ where: { id: input.outlineId, projectId, archivedAt: null }, select: { id: true, version: true, title: true, document: true, plainText: true, purpose: true, emotionalMovement: true, revealedInformation: true, entityReferenceKeys: true, locationReferenceKeys: true, milestoneReferenceKeys: true, targetWords: true, hardTargetWordsEnabled: true, sceneStubs: true, isPlaceholder: true, chapterId: true, volumeId: true, sequenceIndex: true, _count: { select: { scenes: true } } } }) : input.chapterId ? await tx.chapterOutline.findFirst({ where: { chapterId: input.chapterId, projectId, archivedAt: null }, select: { id: true, version: true, title: true, document: true, plainText: true, purpose: true, emotionalMovement: true, revealedInformation: true, entityReferenceKeys: true, locationReferenceKeys: true, milestoneReferenceKeys: true, targetWords: true, hardTargetWordsEnabled: true, sceneStubs: true, isPlaceholder: true, chapterId: true, volumeId: true, sequenceIndex: true, _count: { select: { scenes: true } } } }) : null;
      const data = { chapterId: input.chapterId, volumeId: input.volumeId, sequenceIndex: input.sequenceIndex, title: input.title, document: json(input.document), plainText: input.plainText, purpose: input.purpose, emotionalMovement: input.emotionalMovement, revealedInformation: json(input.revealedInformation), entityReferenceKeys: json(input.entityReferenceKeys), locationReferenceKeys: json(input.locationReferenceKeys), milestoneReferenceKeys: json(input.milestoneReferenceKeys), targetWords: input.targetWords, hardTargetWordsEnabled: input.hardTargetWordsEnabled, sceneStubs: json(input.sceneStubs), isPlaceholder: input.isPlaceholder };
      const select = { id: true, chapterId: true, volumeId: true, sequenceIndex: true, title: true, document: true, plainText: true, purpose: true, emotionalMovement: true, revealedInformation: true, entityReferenceKeys: true, locationReferenceKeys: true, milestoneReferenceKeys: true, targetWords: true, hardTargetWordsEnabled: true, sceneStubs: true, isPlaceholder: true, provenanceType: true, provenanceSourceId: true, version: true, _count: { select: { scenes: true } } } as const;
      const saved = existing ? await tx.chapterOutline.update({ where: { id: existing.id }, data: { ...data, version: { increment: 1 } }, select }) : await tx.chapterOutline.create({ data: { projectId, ...data }, select });
      await revise(tx, projectId, "CHAPTER_OUTLINE", saved.id, saved.version, saved, existing ? "updated" : "created");
      const structuralVersion = await finishMutation(tx, actor, projectId, input.expectedStructuralVersion, "structure.chapter_outline.changed", "CHAPTER_OUTLINE", saved.id);
      return { object: chapterOutlineSummary(saved), projectStructuralVersion: structuralVersion };
    });
  }

  async createSceneFromOutlineBlock(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; chapterOutlineId: string; blockId: string; sequenceIndex: number; title: string; outlineDocument: OutlineContentInput["document"]; outlineText: string; purpose?: string; targetWords?: number; hardTargetWordsEnabled: boolean }) {
    return structureTransaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      const outline = await tx.chapterOutline.findFirst({ where: { id: input.chapterOutlineId, projectId, archivedAt: null }, select: { id: true, chapterId: true } });
      if (!outline) throw errors.notFound();
      const created = await tx.scene.create({ data: { projectId, chapterId: outline.chapterId, chapterOutlineId: outline.id, sequenceIndex: input.sequenceIndex, title: input.title, outlineDocument: json(input.outlineDocument), outlineText: input.outlineText, purpose: input.purpose, targetWords: input.targetWords, hardTargetWordsEnabled: input.hardTargetWordsEnabled, provenanceType: "OUTLINE_BLOCK", provenanceSourceId: outline.id, provenanceBlockId: input.blockId } });
      await revise(tx, projectId, "SCENE", created.id, created.version, created, "created_from_outline_block");
      const backlink = await tx.storyReference.create({ data: { projectId, sourceType: "SCENE", sourceId: created.id, targetType: "CHAPTER_OUTLINE", targetId: outline.id, targetBlockId: input.blockId, relationshipKey: "derived_from", provenanceType: "OUTLINE_BLOCK" }, select: { id: true, version: true } });
      await revise(tx, projectId, "STORY_REFERENCE", backlink.id, backlink.version, backlink, "conversion_backlink_created");
      const structuralVersion = await finishMutation(tx, actor, projectId, input.expectedStructuralVersion, "structure.scene.changed", "SCENE", created.id);
      return { object: sceneSummary(created), projectStructuralVersion: structuralVersion };
    });
  }

  async createNarrativeIntent(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; targetType: NarrativeIntentTargetType; targetId: string; blockId?: string; selectionAnchor?: number; selectionHead?: number; category?: NarrativeIntentCategory; customCategory?: string; intentText: string }) {
    return structureTransaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      await assertIntentTarget(tx, projectId, input.targetType, input.targetId);
      const created = await tx.narrativeIntent.create({ data: { projectId, targetType: input.targetType, targetId: input.targetId, blockId: input.blockId, selectionAnchor: input.selectionAnchor, selectionHead: input.selectionHead, category: input.category, customCategory: input.customCategory, intentText: input.intentText } });
      await revise(tx, projectId, "NARRATIVE_INTENT", created.id, created.version, created, "created");
      const structuralVersion = await finishMutation(tx, actor, projectId, input.expectedStructuralVersion, "structure.intent.changed", "NARRATIVE_INTENT", created.id);
      return { object: created as NarrativeIntentSummary, projectStructuralVersion: structuralVersion };
    });
  }

  async createStoryReference(actor: SessionActor, projectId: string, input: StoryReferenceInput) {
    return structureTransaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      await assertEndpoint(tx, projectId, input.sourceType, input.sourceId, actor.userId);
      await assertEndpoint(tx, projectId, input.targetType, input.targetId, actor.userId);
      const existing = await tx.storyReference.findFirst({ where: { projectId, sourceType: input.sourceType, sourceId: input.sourceId, sourceBlockId: input.sourceBlockId ?? null, targetType: input.targetType, targetId: input.targetId, targetBlockId: input.targetBlockId ?? null, relationshipKey: input.relationshipKey, archivedAt: null }, select: { id: true, sourceType: true, sourceId: true, sourceBlockId: true, targetType: true, targetId: true, targetBlockId: true, relationshipKey: true, provenanceType: true, version: true } });
      if (existing) return { object: referenceSummary(existing), projectStructuralVersion: input.expectedStructuralVersion };
      const created = await tx.storyReference.create({ data: { projectId, sourceType: input.sourceType, sourceId: input.sourceId, sourceBlockId: input.sourceBlockId, targetType: input.targetType, targetId: input.targetId, targetBlockId: input.targetBlockId, relationshipKey: input.relationshipKey, provenanceType: input.provenanceType, provenanceNote: input.provenanceNote } });
      await revise(tx, projectId, "STORY_REFERENCE", created.id, created.version, created, "created");
      const structuralVersion = await finishMutation(tx, actor, projectId, input.expectedStructuralVersion, "structure.reference.changed", "STORY_REFERENCE", created.id);
      return { object: referenceSummary(created), projectStructuralVersion: structuralVersion };
    });
  }

  async assignChapterToVolume(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; chapterId: string; volumeId: string | null; volumeSequenceIndex: number | null }) {
    return structureTransaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      const chapter = await tx.chapter.findFirst({ where: { id: input.chapterId, projectId, archivedAt: null }, select: { id: true, volumeId: true, volumeSequenceIndex: true } });
      if (!chapter) throw errors.notFound();
      if (input.volumeId) await assertEndpoint(tx, projectId, "VOLUME", input.volumeId);
      const saved = await tx.chapter.update({ where: { id: chapter.id }, data: { volumeId: input.volumeId, volumeSequenceIndex: input.volumeSequenceIndex }, select: { id: true, volumeId: true, volumeSequenceIndex: true } });
      await revise(tx, projectId, "CHAPTER", saved.id, input.expectedStructuralVersion + 1, saved, "volume_membership_changed");
      const structuralVersion = await finishMutation(tx, actor, projectId, input.expectedStructuralVersion, "structure.chapter_membership.changed", "CHAPTER", saved.id);
      return { object: { chapterId: saved.id, volumeId: saved.volumeId, volumeSequenceIndex: saved.volumeSequenceIndex }, projectStructuralVersion: structuralVersion };
    });
  }

  async reparentChapterOutline(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; chapterOutlineId: string; volumeId: string | null; sequenceIndex: number }) {
    return structureTransaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      if (input.volumeId) await assertEndpoint(tx, projectId, "VOLUME", input.volumeId);
      const existing = await tx.chapterOutline.findFirst({ where: { id: input.chapterOutlineId, projectId, archivedAt: null }, select: { id: true, chapterId: true, volumeId: true, sequenceIndex: true, title: true, plainText: true, purpose: true, emotionalMovement: true, targetWords: true, hardTargetWordsEnabled: true, isPlaceholder: true, version: true, _count: { select: { scenes: true } } } });
      if (!existing) throw errors.notFound();
      const saved = await tx.chapterOutline.update({ where: { id: existing.id }, data: { volumeId: input.volumeId, sequenceIndex: input.sequenceIndex, version: { increment: 1 } }, select: { id: true, chapterId: true, volumeId: true, sequenceIndex: true, title: true, plainText: true, purpose: true, emotionalMovement: true, targetWords: true, hardTargetWordsEnabled: true, isPlaceholder: true, version: true, _count: { select: { scenes: true } } } });
      await revise(tx, projectId, "CHAPTER_OUTLINE", saved.id, saved.version, saved, input.volumeId ? "demoted" : "promoted");
      const structuralVersion = await finishMutation(tx, actor, projectId, input.expectedStructuralVersion, "structure.chapter_outline.reparented", "CHAPTER_OUTLINE", saved.id);
      return { object: chapterOutlineSummary(saved), projectStructuralVersion: structuralVersion };
    });
  }

  async reorderVolumes(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; orderedIds: string[] }) {
    return structureTransaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      const volumes = await tx.volume.findMany({ where: { projectId, archivedAt: null }, orderBy: { sequenceIndex: "asc" }, select: { id: true, sequenceIndex: true, version: true } });
      if (volumes.length !== input.orderedIds.length || new Set(input.orderedIds).size !== input.orderedIds.length || input.orderedIds.some((id) => !volumes.some((volume) => volume.id === id))) throw errors.integrity();
      await tx.$executeRaw(Prisma.sql`UPDATE "Volume" SET "sequenceIndex" = "sequenceIndex" + 1000001 WHERE "projectId" = ${projectId}::uuid AND "archivedAt" IS NULL`);
      for (const [sequenceIndex, id] of input.orderedIds.entries()) {
        const saved = await tx.volume.update({ where: { id }, data: { sequenceIndex, version: { increment: 1 } }, select: { id: true, sequenceIndex: true, version: true } });
        await revise(tx, projectId, "VOLUME", saved.id, saved.version, saved, "reordered");
      }
      const structuralVersion = await finishMutation(tx, actor, projectId, input.expectedStructuralVersion, "structure.volumes.reordered", "VOLUME", projectId);
      return { object: { orderedIds: input.orderedIds }, projectStructuralVersion: structuralVersion };
    });
  }

  async applyScaffold(actor: SessionActor, projectId: string, input: ScaffoldInput, plan: StructureScaffoldPlan) {
    return structureTransaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      let plot = await tx.plot.findFirst({ where: { projectId, archivedAt: null }, select: { id: true } });
      if (!plot) {
        plot = await tx.plot.create({ data: { projectId, title: "Main plot" }, select: { id: true } });
        await revise(tx, projectId, "PLOT", plot.id, 1, plot, "created_by_explicit_scaffold");
      }
      const existingVolumes = await tx.volume.findMany({ where: { projectId, archivedAt: null }, orderBy: { sequenceIndex: "asc" }, select: { id: true } });
      if (existingVolumes.length !== 0 && existingVolumes.length !== plan.allocations.length) throw errors.conflict("The preview no longer matches the current volume count.");
      const volumes = existingVolumes.length ? existingVolumes : await Promise.all(plan.allocations.map(async (allocation) => {
        const volume = await tx.volume.create({ data: { projectId, plotId: plot.id, sequenceIndex: allocation.sequenceIndex, displayNumber: String(allocation.sequenceIndex + 1), title: `Volume ${allocation.sequenceIndex + 1}`, targetWords: allocation.advisoryTargetWords ?? undefined }, select: { id: true } });
        await revise(tx, projectId, "VOLUME", volume.id, 1, volume, "created_by_scaffold");
        return volume;
      }));
      if (existingVolumes.length) {
        for (const [index, allocation] of plan.allocations.entries()) {
          const saved = await tx.volume.update({ where: { id: existingVolumes[index]!.id }, data: { targetWords: allocation.advisoryTargetWords ?? undefined, version: { increment: 1 } }, select: { id: true, sequenceIndex: true, targetWords: true, version: true } });
          await revise(tx, projectId, "VOLUME", saved.id, saved.version, saved, "advisory_allocation_rebalanced");
        }
      }
      const membershipSnapshots: Array<{ id: string; volumeId: string; volumeSequenceIndex: number }> = [];
      for (const [index, allocation] of plan.allocations.entries()) {
        const volume = volumes[index]!;
        const zeroBasedStart = allocation.chapterStart - 1;
        const zeroBasedEnd = allocation.chapterEnd - 1;
        if (allocation.chapterCount > 0) {
          await tx.$executeRaw(Prisma.sql`UPDATE "Chapter" SET "volumeId" = ${volume.id}::uuid, "volumeSequenceIndex" = "sequenceIndex" - ${zeroBasedStart} WHERE "projectId" = ${projectId}::uuid AND "archivedAt" IS NULL AND "sequenceIndex" BETWEEN ${zeroBasedStart} AND ${zeroBasedEnd}`);
          const assigned = await tx.chapter.findMany({ where: { projectId, archivedAt: null, sequenceIndex: { gte: zeroBasedStart, lte: zeroBasedEnd } }, select: { id: true, volumeId: true, volumeSequenceIndex: true } });
          membershipSnapshots.push(...assigned.flatMap((chapter) => chapter.volumeId && chapter.volumeSequenceIndex !== null ? [{ id: chapter.id, volumeId: chapter.volumeId, volumeSequenceIndex: chapter.volumeSequenceIndex }] : []));
        }
      }
      const chapterRange = Array.from({ length: input.chapterCount }, (_, offset) => input.chapterStart - 1 + offset);
      const assignedChapterCount = await tx.chapter.count({ where: { projectId, archivedAt: null, sequenceIndex: { in: chapterRange }, volumeId: { not: null } } });
      if (membershipSnapshots.length) await tx.objectRevision.createMany({ data: membershipSnapshots.map((chapter) => ({ projectId, objectType: "CHAPTER" as const, objectId: chapter.id, version: input.expectedStructuralVersion + 1, snapshot: json(chapter), reason: "scaffold_volume_membership" })) });
      let placeholderCount = 0;
      if (input.createChapterOutlinePlaceholders) {
        const existing = await tx.chapterOutline.findMany({ where: { projectId, sequenceIndex: { in: chapterRange }, archivedAt: null }, select: { sequenceIndex: true } });
        const existingSequences = new Set(existing.map((outline) => outline.sequenceIndex));
        const chapters = await tx.chapter.findMany({ where: { projectId, sequenceIndex: { in: chapterRange }, archivedAt: null }, select: { id: true, sequenceIndex: true, volumeId: true } });
        const chaptersBySequence = new Map(chapters.map((chapter) => [chapter.sequenceIndex, chapter]));
        const missingSequences = chapterRange.filter((sequenceIndex) => !existingSequences.has(sequenceIndex));
        const data = missingSequences.map((sequenceIndex) => ({ projectId, chapterId: chaptersBySequence.get(sequenceIndex)?.id, volumeId: chaptersBySequence.get(sequenceIndex)?.volumeId, sequenceIndex, title: `Chapter ${sequenceIndex + 1}`, document: json({ type: "doc", content: [] }), plainText: "", isPlaceholder: true }));
        if (data.length) await tx.chapterOutline.createMany({ data });
        if (data.length) {
          const created = await tx.chapterOutline.findMany({ where: { projectId, sequenceIndex: { in: missingSequences }, archivedAt: null }, select: { id: true, sequenceIndex: true, chapterId: true, volumeId: true, title: true, isPlaceholder: true, version: true } });
          await tx.objectRevision.createMany({ data: created.map((outline) => ({ projectId, objectType: "CHAPTER_OUTLINE" as const, objectId: outline.id, version: outline.version, snapshot: json(outline), reason: "created_by_scaffold" })) });
        }
        placeholderCount = data.length;
      }
      const structuralVersion = await finishMutation(tx, actor, projectId, input.expectedStructuralVersion, "structure.scaffold.applied", "PLOT", plot.id);
      return { object: { plotId: plot.id, volumeIds: volumes.map((volume) => volume.id), placeholderCount, assignedChapterCount }, projectStructuralVersion: structuralVersion };
    }, { timeout: 60_000 });
  }

  async saveViewState(actor: SessionActor, projectId: string, state: StructureViewStateModel): Promise<StructureViewStateModel> {
    return structureTransaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId);
      if (state.activeAnchorId && state.activeAnchorType) await assertEndpoint(tx, projectId, state.activeAnchorType, state.activeAnchorId, actor.userId);
      const data = { mode: state.mode, activeLens: state.activeLens, expandedIds: json(state.expandedIds), activeAnchorType: state.activeAnchorType as StoryReferenceEndpointType | null, activeAnchorId: state.activeAnchorId, cursorOffset: state.cursorOffset, selectionAnchor: state.selectionAnchor, selectionHead: state.selectionHead, scrollTop: state.scrollTop, pinIds: json(state.pinIds) };
      const saved = await tx.structureViewState.upsert({ where: { userId_projectId: { userId: actor.userId, projectId } }, create: { userId: actor.userId, projectId, ...data }, update: data, select: { mode: true, activeLens: true, expandedIds: true, activeAnchorType: true, activeAnchorId: true, cursorOffset: true, selectionAnchor: true, selectionHead: true, scrollTop: true, pinIds: true } });
      return { mode: saved.mode, activeLens: saved.activeLens, expandedIds: stringArray(saved.expandedIds, 2_000), activeAnchorType: saved.activeAnchorType, activeAnchorId: saved.activeAnchorId, cursorOffset: saved.cursorOffset, selectionAnchor: saved.selectionAnchor, selectionHead: saved.selectionHead, scrollTop: saved.scrollTop, pinIds: stringArray(saved.pinIds, 100) };
    });
  }
}
