import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { StoryReferenceInput } from "@/domains/references/domain/story-reference";
import type { ScaffoldInput, StructureScaffoldPlan } from "../domain/scaffold";
import type { NarrativeIntentCategory, NarrativeIntentTargetType, PresentationMode, StructureBudget, StructureLens, StructureMutationResult } from "../domain/types";

export interface PlotSummary { id: string; title: string; summary: string | null; version: number; outlineId: string | null }
export interface VolumeSummary { id: string; plotId: string; sequenceIndex: number; displayNumber: string | null; title: string; targetWords: number | null; hardTargetWordsEnabled: boolean; version: number; outlineId: string | null; chapterCount: number }
export interface ChapterOutlineSummary { id: string; chapterId: string | null; volumeId: string | null; sequenceIndex: number; title: string; plainText: string; purpose: string | null; emotionalMovement: string | null; targetWords: number | null; hardTargetWordsEnabled: boolean; isPlaceholder: boolean; version: number; sceneCount: number }
export interface ChapterStructureSummary { id: string; volumeId: string | null; volumeSequenceIndex: number | null; sequenceIndex: number; displayNumber: string | null; title: string; outlineId: string | null; sceneCount: number }
export interface SceneSummary { id: string; chapterId: string | null; chapterOutlineId: string | null; sequenceIndex: number; title: string; purpose: string | null; provenanceType: string; provenanceSourceId: string | null; provenanceBlockId: string | null; version: number }
export interface StoryReferenceSummary { id: string; sourceType: string; sourceId: string; sourceBlockId: string | null; targetType: string; targetId: string; targetBlockId: string | null; relationshipKey: string; provenanceType: string; version: number }
export interface NarrativeIntentSummary { id: string; targetType: NarrativeIntentTargetType; targetId: string; blockId: string | null; category: NarrativeIntentCategory | null; customCategory: string | null; version: number }
export interface StructureViewStateModel { mode: PresentationMode; activeLens: StructureLens; expandedIds: string[]; activeAnchorType: string | null; activeAnchorId: string | null; cursorOffset: number | null; selectionAnchor: number | null; selectionHead: number | null; scrollTop: number | null; pinIds: string[] }

export interface StructureOverview {
  project: { id: string; title: string; structuralVersion: number; activeChapterId: string | null };
  plot: PlotSummary | null;
  volumes: VolumeSummary[];
  chapterOutlines: ChapterOutlineSummary[];
  chapters: ChapterStructureSummary[];
  scenes: SceneSummary[];
  references: StoryReferenceSummary[];
  intents: NarrativeIntentSummary[];
  viewState: StructureViewStateModel;
  lenses: readonly ["OUTLINE", "VOLUMES", "CHAPTERS", "RELATIONSHIPS", "SEMANTIC_ZOOM"];
  page: { pageSize: number; nodeBudget: number; edgeBudget: number; rangeStart: number; nextRangeStart: number | null; returnedNodes: number; returnedEdges: number; hasMoreNodes: boolean; hasMoreEdges: boolean };
}

export interface OutlineContentInput {
  title: string;
  document: { type: "doc"; content: unknown[]; [key: string]: unknown };
  plainText: string;
  purpose?: string;
}

export interface ChapterOutlineInput extends OutlineContentInput {
  expectedStructuralVersion: number;
  outlineId?: string;
  chapterId?: string;
  volumeId?: string;
  sequenceIndex: number;
  emotionalMovement?: string;
  revealedInformation: string[];
  entityReferenceKeys: string[];
  locationReferenceKeys: string[];
  milestoneReferenceKeys: string[];
  targetWords?: number;
  hardTargetWordsEnabled: boolean;
  sceneStubs: Array<{ id: string; title: string }>;
  isPlaceholder: boolean;
}

export interface StructureRepository {
  assertProjectAccess(actor: SessionActor, projectId: string): Promise<void>;
  getOverview(actor: SessionActor, projectId: string, budget: StructureBudget): Promise<StructureOverview | null>;
  createPlot(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; title: string; summary?: string }): Promise<StructureMutationResult<PlotSummary>>;
  updatePlot(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; plotId: string; title: string; summary?: string }): Promise<StructureMutationResult<PlotSummary>>;
  upsertPlotOutline(actor: SessionActor, projectId: string, input: OutlineContentInput & { expectedStructuralVersion: number; plotId: string }): Promise<StructureMutationResult<{ id: string; version: number }>>;
  createVolume(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; plotId: string; sequenceIndex: number; displayNumber?: string; title: string; summary?: string; targetWords?: number; hardTargetWordsEnabled: boolean }): Promise<StructureMutationResult<VolumeSummary>>;
  updateVolume(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; volumeId: string; displayNumber?: string; title: string; summary?: string; targetWords?: number; hardTargetWordsEnabled: boolean }): Promise<StructureMutationResult<VolumeSummary>>;
  upsertVolumeOutline(actor: SessionActor, projectId: string, input: OutlineContentInput & { expectedStructuralVersion: number; volumeId: string }): Promise<StructureMutationResult<{ id: string; version: number }>>;
  upsertChapterOutline(actor: SessionActor, projectId: string, input: ChapterOutlineInput): Promise<StructureMutationResult<ChapterOutlineSummary>>;
  createSceneFromOutlineBlock(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; chapterOutlineId: string; blockId: string; sequenceIndex: number; title: string; outlineDocument: OutlineContentInput["document"]; outlineText: string; purpose?: string; targetWords?: number; hardTargetWordsEnabled: boolean }): Promise<StructureMutationResult<SceneSummary>>;
  createNarrativeIntent(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; targetType: NarrativeIntentTargetType; targetId: string; blockId?: string; selectionAnchor?: number; selectionHead?: number; category?: NarrativeIntentCategory; customCategory?: string; intentText: string }): Promise<StructureMutationResult<NarrativeIntentSummary>>;
  createStoryReference(actor: SessionActor, projectId: string, input: StoryReferenceInput): Promise<StructureMutationResult<StoryReferenceSummary>>;
  assignChapterToVolume(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; chapterId: string; volumeId: string | null; volumeSequenceIndex: number | null }): Promise<StructureMutationResult<{ chapterId: string; volumeId: string | null; volumeSequenceIndex: number | null }>>;
  reparentChapterOutline(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; chapterOutlineId: string; volumeId: string | null; sequenceIndex: number }): Promise<StructureMutationResult<ChapterOutlineSummary>>;
  reorderVolumes(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; orderedIds: string[] }): Promise<StructureMutationResult<{ orderedIds: string[] }>>;
  applyScaffold(actor: SessionActor, projectId: string, input: ScaffoldInput, plan: StructureScaffoldPlan): Promise<StructureMutationResult<{ plotId: string; volumeIds: string[]; placeholderCount: number; assignedChapterCount: number }>>;
  saveViewState(actor: SessionActor, projectId: string, state: StructureViewStateModel): Promise<StructureViewStateModel>;
}
