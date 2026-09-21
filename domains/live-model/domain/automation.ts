export const deterministicAutomationCatalog = [
  "CHAPTER_RANGE_SCAFFOLD",
  "MILESTONE_ALLOCATION_PROGRESS_DENSITY",
  "WRITING_QUEUE",
  "CONTEXT_RESOLUTION",
  "BACKLINK_MAINTENANCE",
  "WORD_CADENCE_SUMMARIES",
  "STRUCTURE_REBALANCE_PREVIEW",
  "CAPTURE_CONTEXT",
  "SNAPSHOT_SCHEDULING",
  "DIRECTIVE_COMPILATION",
  "CAUSAL_NEIGHBORHOOD",
  "CAUSAL_IMPACT",
  "CAUSALITY_CHRONOLOGY_SANITY",
] as const;

export type DeterministicAutomationKind = (typeof deterministicAutomationCatalog)[number];

export interface AutomationChapter {
  id: string;
  sequenceIndex: number;
  volumeId: string | null;
  wordCount: number;
  targetWords: number | null;
  status: string;
  updatedAt: Date;
}

export interface AutomationMilestone {
  id: string;
  targetChapterStart: number | null;
  targetChapterEnd: number | null;
  status: string;
  linkedChapterIds: readonly string[];
}

export interface DeterministicAutomationInput {
  projectStructuralVersion: number;
  chapters: readonly AutomationChapter[];
  milestones: readonly AutomationMilestone[];
  referenceCounts: Readonly<Record<string, number>>;
  captureCounts: Readonly<Record<string, number>>;
  causalNodeCount: number;
  causalEdgeCount: number;
  snapshotProviderAvailable: boolean;
  lastVerifiedSnapshotAt: Date | null;
  now: Date;
}

export interface DeterministicAutomationOutput {
  projectStructuralVersion: number;
  chapterRangeScaffold: { existingRange: [number, number] | null; missingSequenceIndices: number[] };
  milestoneProgress: Array<{ milestoneId: string; linkedCount: number; completedCount: number; progress: number }>;
  writingQueue: string[];
  contextResolution: Array<{ chapterId: string; explicitReferenceCount: number }>;
  backlinkMaintenance: Array<{ objectId: string; backlinkCount: number }>;
  wordCadence: { totalWords: number; targetedWords: number; completion: number; activeDays: number };
  structureRebalancePreview: Array<{ chapterId: string; fromVolumeId: string | null; proposedSequenceIndex: number }>;
  captureContext: Array<{ chapterId: string; captureCount: number }>;
  snapshotSchedule: { providerAvailable: boolean; due: boolean; lastVerifiedAt: string | null };
  directiveCompilation: { requestedChapterIds: string[] };
  causalNeighborhood: { nodeCount: number; edgeCount: number; bounded: true };
  causalImpact: { candidateNodeCount: number; autoMutationCount: 0 };
  chronologySanity: { evaluatedFromExplicitAnchorsOnly: true };
}

function ratio(numerator: number, denominator: number): number {
  return denominator <= 0 ? 0 : Math.round((numerator / denominator) * 10_000) / 10_000;
}

export function runDeterministicAutomations(input: DeterministicAutomationInput): DeterministicAutomationOutput {
  const ordered = [...input.chapters].sort((left, right) => left.sequenceIndex - right.sequenceIndex || left.id.localeCompare(right.id));
  const first = ordered[0]?.sequenceIndex;
  const last = ordered.at(-1)?.sequenceIndex;
  const existing = new Set(ordered.map((chapter) => chapter.sequenceIndex));
  const missingSequenceIndices = first === undefined || last === undefined ? [] : Array.from({ length: last - first + 1 }, (_, index) => first + index).filter((index) => !existing.has(index));
  const milestoneProgress = input.milestones.map((milestone) => {
    const linked = ordered.filter((chapter) => milestone.linkedChapterIds.includes(chapter.id));
    const completedCount = linked.filter((chapter) => chapter.status === "FINAL" || chapter.status === "REVISED").length;
    return { milestoneId: milestone.id, linkedCount: linked.length, completedCount, progress: ratio(completedCount, linked.length) };
  }).sort((left, right) => left.milestoneId.localeCompare(right.milestoneId));
  const writingQueue = ordered.filter((chapter) => chapter.status !== "FINAL" && chapter.status !== "ARCHIVED").map((chapter) => chapter.id);
  const totalWords = ordered.reduce((total, chapter) => total + chapter.wordCount, 0);
  const targetedWords = ordered.reduce((total, chapter) => total + (chapter.targetWords ?? 0), 0);
  const activeDays = new Set(ordered.filter((chapter) => chapter.wordCount > 0).map((chapter) => chapter.updatedAt.toISOString().slice(0, 10))).size;
  const dueAfterMs = 24 * 60 * 60 * 1_000;
  const snapshotDue = input.snapshotProviderAvailable && (!input.lastVerifiedSnapshotAt || input.now.getTime() - input.lastVerifiedSnapshotAt.getTime() >= dueAfterMs);
  return {
    projectStructuralVersion: input.projectStructuralVersion,
    chapterRangeScaffold: { existingRange: first === undefined || last === undefined ? null : [first, last], missingSequenceIndices },
    milestoneProgress,
    writingQueue,
    contextResolution: ordered.map((chapter) => ({ chapterId: chapter.id, explicitReferenceCount: input.referenceCounts[chapter.id] ?? 0 })),
    backlinkMaintenance: Object.entries(input.referenceCounts).sort(([left], [right]) => left.localeCompare(right)).map(([objectId, backlinkCount]) => ({ objectId, backlinkCount })),
    wordCadence: { totalWords, targetedWords, completion: ratio(totalWords, targetedWords), activeDays },
    structureRebalancePreview: ordered.map((chapter, proposedSequenceIndex) => ({ chapterId: chapter.id, fromVolumeId: chapter.volumeId, proposedSequenceIndex })),
    captureContext: ordered.map((chapter) => ({ chapterId: chapter.id, captureCount: input.captureCounts[chapter.id] ?? 0 })),
    snapshotSchedule: { providerAvailable: input.snapshotProviderAvailable, due: snapshotDue, lastVerifiedAt: input.lastVerifiedSnapshotAt?.toISOString() ?? null },
    directiveCompilation: { requestedChapterIds: ordered.map((chapter) => chapter.id) },
    causalNeighborhood: { nodeCount: input.causalNodeCount, edgeCount: input.causalEdgeCount, bounded: true },
    causalImpact: { candidateNodeCount: input.causalNodeCount, autoMutationCount: 0 },
    chronologySanity: { evaluatedFromExplicitAnchorsOnly: true },
  };
}
