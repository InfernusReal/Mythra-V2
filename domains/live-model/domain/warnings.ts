export const liveModelWarningTypes = [
  "RANGE_DRIFT",
  "DENSITY",
  "ORPHAN_STRUCTURE",
  "BROKEN_REFERENCE",
  "TIMELINE_ORDER_CONFLICT",
  "QUOTA_APPROACH",
  "BACKUP_HEALTH",
  "CAUSAL_TEMPORAL_CONFLICT",
  "HARD_PREREQUISITE_LOOP",
  "ORPHAN_CAUSAL_ENDPOINT",
] as const;

export type LiveModelWarningType = (typeof liveModelWarningTypes)[number];

export const neutralWarningMessages: Readonly<Record<LiveModelWarningType, string>> = {
  RANGE_DRIFT: "A milestone target range is approaching without linked development chapters.",
  DENSITY: "Several author-defined required milestones share the same chapter.",
  ORPHAN_STRUCTURE: "A planning object no longer has its previous structural attachment.",
  BROKEN_REFERENCE: "A reference points to an archived or unavailable object.",
  TIMELINE_ORDER_CONFLICT: "Two explicit timeline ordering constraints do not agree.",
  QUOTA_APPROACH: "A measured storage resource is approaching its configured limit.",
  BACKUP_HEALTH: "A verified project snapshot is older than the configured interval.",
  CAUSAL_TEMPORAL_CONFLICT: "An explicit cause appears after its effect in comparable story time.",
  HARD_PREREQUISITE_LOOP: "Active hard prerequisites form a cycle without explicit progression or mutual-state semantics.",
  ORPHAN_CAUSAL_ENDPOINT: "A causal relation points to an archived or unavailable endpoint.",
};

export interface WarningFact {
  warningKey: string;
  warningType: LiveModelWarningType;
  sourceType: string;
  sourceId: string;
  relatedType?: string;
  relatedId?: string;
  facts: Readonly<Record<string, string | number | boolean | null>>;
}

export interface WarningEngineInput {
  milestones: ReadonlyArray<{ id: string; targetChapterStart: number | null; linkedChapterSequenceIndices: readonly number[]; required: boolean }>;
  milestoneChapterCounts: Readonly<Record<string, number>>;
  orphanStructureIds: readonly string[];
  brokenReferenceIds: readonly string[];
  timelineConflictIds: readonly string[];
  quotaPercent: number | null;
  snapshotProviderAvailable: boolean;
  snapshotAgeHours: number | null;
  backupIntervalHours: number;
  causalTemporalConflictIds: readonly string[];
  hardPrerequisiteLoopIds: readonly string[];
  orphanCausalRelationIds: readonly string[];
  currentChapterSequence: number | null;
  densityPreference: number;
}

export function calculateNeutralWarnings(input: WarningEngineInput): WarningFact[] {
  const warnings: WarningFact[] = [];
  if (input.currentChapterSequence !== null) {
    for (const milestone of input.milestones) {
      if (milestone.targetChapterStart !== null && milestone.targetChapterStart - input.currentChapterSequence <= 2 && !milestone.linkedChapterSequenceIndices.length) {
        warnings.push({ warningKey: `range-drift:${milestone.id}`, warningType: "RANGE_DRIFT", sourceType: "MILESTONE", sourceId: milestone.id, facts: { targetChapterStart: milestone.targetChapterStart, currentChapterSequence: input.currentChapterSequence } });
      }
    }
  }
  for (const [chapterId, count] of Object.entries(input.milestoneChapterCounts).sort(([left], [right]) => left.localeCompare(right))) {
    if (count > input.densityPreference) warnings.push({ warningKey: `density:${chapterId}`, warningType: "DENSITY", sourceType: "CHAPTER", sourceId: chapterId, facts: { assignedRequiredMilestones: count, configuredPreference: input.densityPreference } });
  }
  for (const id of [...input.orphanStructureIds].sort()) warnings.push({ warningKey: `orphan-structure:${id}`, warningType: "ORPHAN_STRUCTURE", sourceType: "STRUCTURE", sourceId: id, facts: { reattachAvailable: true } });
  for (const id of [...input.brokenReferenceIds].sort()) warnings.push({ warningKey: `broken-reference:${id}`, warningType: "BROKEN_REFERENCE", sourceType: "STORY_REFERENCE", sourceId: id, facts: { inspectAvailable: true } });
  for (const id of [...input.timelineConflictIds].sort()) warnings.push({ warningKey: `timeline-order:${id}`, warningType: "TIMELINE_ORDER_CONFLICT", sourceType: "TIMELINE_EVENT", sourceId: id, facts: { overrideAvailable: true } });
  if (input.quotaPercent !== null && input.quotaPercent >= 0.8) warnings.push({ warningKey: "quota-approach:project", warningType: "QUOTA_APPROACH", sourceType: "PROJECT", sourceId: "project", facts: { measuredPercent: Math.round(input.quotaPercent * 100) } });
  if (input.snapshotProviderAvailable && input.snapshotAgeHours !== null && input.snapshotAgeHours > input.backupIntervalHours) warnings.push({ warningKey: "backup-health:project", warningType: "BACKUP_HEALTH", sourceType: "PROJECT", sourceId: "project", facts: { ageHours: Math.floor(input.snapshotAgeHours), configuredIntervalHours: input.backupIntervalHours } });
  for (const id of [...input.causalTemporalConflictIds].sort()) warnings.push({ warningKey: `causal-temporal:${id}`, warningType: "CAUSAL_TEMPORAL_CONFLICT", sourceType: "CAUSAL_RELATION", sourceId: id, facts: { overrideAvailable: true, comparableExplicitAnchors: true } });
  for (const id of [...input.hardPrerequisiteLoopIds].sort()) warnings.push({ warningKey: `hard-loop:${id}`, warningType: "HARD_PREREQUISITE_LOOP", sourceType: "CAUSAL_RELATION", sourceId: id, facts: { integrityConstraint: true } });
  for (const id of [...input.orphanCausalRelationIds].sort()) warnings.push({ warningKey: `orphan-causal:${id}`, warningType: "ORPHAN_CAUSAL_ENDPOINT", sourceType: "CAUSAL_RELATION", sourceId: id, facts: { reattachAvailable: true, retireAvailable: true, inspectImpactAvailable: true } });
  return warnings.sort((left, right) => left.warningKey.localeCompare(right.warningKey));
}

export function isWarningSuppressible(type: LiveModelWarningType): boolean {
  return type !== "HARD_PREREQUISITE_LOOP";
}
