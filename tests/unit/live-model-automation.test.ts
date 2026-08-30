import { describe, expect, it } from "vitest";
import { deterministicAutomationCatalog, runDeterministicAutomations } from "@/domains/live-model/domain/automation";
import { calculateNeutralWarnings, isWarningSuppressible, liveModelWarningTypes, neutralWarningMessages } from "@/domains/live-model/domain/warnings";

describe("deterministic Live Story Model automation", () => {
  it("implements the complete catalog as explicit bookkeeping without prose mutation", () => {
    expect(deterministicAutomationCatalog).toHaveLength(13);
    const result = runDeterministicAutomations({ projectStructuralVersion: 8, chapters: [{ id: "chapter-a", sequenceIndex: 0, volumeId: null, wordCount: 500, targetWords: 1_000, status: "DRAFT", updatedAt: new Date("2026-08-29T00:00:00.000Z") }, { id: "chapter-b", sequenceIndex: 2, volumeId: "volume", wordCount: 1_000, targetWords: 1_000, status: "FINAL", updatedAt: new Date("2026-08-28T00:00:00.000Z") }], milestones: [{ id: "milestone", targetChapterStart: 1, targetChapterEnd: 2, status: "IN_PROGRESS", linkedChapterIds: ["chapter-b"] }], referenceCounts: { "chapter-a": 2 }, captureCounts: { "chapter-a": 1 }, causalNodeCount: 4, causalEdgeCount: 3, snapshotProviderAvailable: false, lastVerifiedSnapshotAt: null, now: new Date("2026-08-29T00:00:00.000Z") });
    expect(result.chapterRangeScaffold.missingSequenceIndices).toEqual([1]);
    expect(result.milestoneProgress[0]).toMatchObject({ completedCount: 1, progress: 1 });
    expect(result.structureRebalancePreview).toHaveLength(2);
    expect(result.snapshotSchedule).toEqual({ providerAvailable: false, due: false, lastVerifiedAt: null });
    expect(result.causalImpact.autoMutationCount).toBe(0);
  });

  it("implements exactly ten neutral warning categories with suppressible creative facts", () => {
    expect(liveModelWarningTypes).toHaveLength(10);
    expect(Object.keys(neutralWarningMessages).sort()).toEqual([...liveModelWarningTypes].sort());
    const warnings = calculateNeutralWarnings({ milestones: [{ id: "m", targetChapterStart: 3, linkedChapterSequenceIndices: [], required: true }], milestoneChapterCounts: { chapter: 5 }, orphanStructureIds: ["outline"], brokenReferenceIds: ["reference"], timelineConflictIds: ["timeline"], quotaPercent: 0.9, snapshotProviderAvailable: true, snapshotAgeHours: 50, backupIntervalHours: 24, causalTemporalConflictIds: ["temporal"], hardPrerequisiteLoopIds: ["loop"], orphanCausalRelationIds: ["orphan"], currentChapterSequence: 1, densityPreference: 3 });
    expect(new Set(warnings.map((warning) => warning.warningType))).toEqual(new Set(liveModelWarningTypes));
    expect(isWarningSuppressible("DENSITY")).toBe(true);
    expect(isWarningSuppressible("HARD_PREREQUISITE_LOOP")).toBe(false);
  });
});
