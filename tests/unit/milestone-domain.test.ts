import { describe, expect, it } from "vitest";
import { chapterMilestoneLinkSchema, milestoneWriteSchema, planMilestoneReorder, planMilestoneScaffold, verifyMilestoneScaffold, weightedMilestoneProgress } from "@/domains/milestones/domain/types";
import { assertNoHardDependencyCycle, wouldCreateHardDependencyCycle } from "@/domains/milestones/domain/dependency";

const id = (value: number) => `00000000-0000-4000-8000-${value.toString().padStart(12, "0")}`;

describe("milestone domain", () => {
  it("produces deterministic, contiguous advisory allocations and cadence dates", () => {
    const input = { expectedStructuralVersion: 4, milestoneCount: 3, chapterStart: 1, chapterCount: 10, advisoryProjectTargetWords: 10_001, cadenceStartDate: "2026-08-13", cadenceDays: 7 };
    const first = planMilestoneScaffold(input);
    const second = planMilestoneScaffold(input);
    expect(first).toEqual(second);
    expect(first.allocations.map((item) => [item.chapterStart, item.chapterEnd])).toEqual([[1, 4], [5, 7], [8, 10]]);
    expect(first.allocations.map((item) => item.targetDate)).toEqual(["2026-08-13", "2026-08-20", "2026-08-27"]);
    expect(first.allocations.reduce((sum, item) => sum + (item.targetWords ?? 0), 0)).toBe(10_001);
    expect(verifyMilestoneScaffold(input, first.planToken)).toEqual(first);
  });

  it("rejects tampered previews and malformed role/range inputs", () => {
    const input = { expectedStructuralVersion: 4, milestoneCount: 1, chapterStart: 1, chapterCount: 1 };
    expect(() => verifyMilestoneScaffold(input, "0".repeat(64))).toThrow("stale or was modified");
    expect(milestoneWriteSchema.safeParse({ expectedStructuralVersion: 1, sequenceIndex: 0, title: "M", targetChapterStart: 3, targetChapterEnd: 2 }).success).toBe(false);
    expect(chapterMilestoneLinkSchema.safeParse({ expectedStructuralVersion: 1, chapterId: id(1), milestoneId: id(2), role: "CUSTOM", weight: 1 }).success).toBe(false);
    expect(() => planMilestoneScaffold({ expectedStructuralVersion: 1, milestoneCount: 2, chapterStart: 1, chapterCount: 2, cadenceStartDate: "2026-08-13" })).toThrow();
    expect(planMilestoneScaffold({ expectedStructuralVersion: 1, milestoneCount: 3, chapterStart: 1, chapterCount: 1 }).warnings).toHaveLength(1);
  });

  it("derives bounded weighted progress", () => {
    expect(weightedMilestoneProgress([{ weight: 1, ratio: .5 }, { weight: 3, ratio: 1 }])).toBe(.875);
    expect(weightedMilestoneProgress([{ weight: 1, ratio: 4 }, { weight: 1, ratio: -2 }])).toBe(.5);
    expect(weightedMilestoneProgress([])).toBe(0);
  });

  it("previews a complete identity-preserving reorder", () => {
    expect(planMilestoneReorder({ currentIds: [id(1), id(2), id(3)], movedId: id(3), targetIndex: 0 })).toEqual({ orderedIds: [id(3), id(1), id(2)], changes: [{ id: id(3), from: 2, to: 0 }, { id: id(1), from: 0, to: 1 }, { id: id(2), from: 1, to: 2 }] });
    expect(() => planMilestoneReorder({ currentIds: [id(1), id(1)], movedId: id(1), targetIndex: 0 })).toThrow();
  });

  it("rejects only hard active dependency cycles", () => {
    const edges = [{ sourceMilestoneId: id(1), targetMilestoneId: id(2), isHard: true, state: "ACTIVE" as const }];
    expect(wouldCreateHardDependencyCycle(edges, id(2), id(1))).toBe(true);
    expect(wouldCreateHardDependencyCycle(edges, id(2), id(3))).toBe(false);
    expect(() => assertNoHardDependencyCycle(edges, id(2), id(1))).toThrow();
    expect(wouldCreateHardDependencyCycle([{ ...edges[0]!, state: "TENTATIVE" }], id(2), id(1))).toBe(false);
  });

  it("preserves range and word totals across 1,000 deterministic allocations", () => {
    for (let seed = 1; seed <= 1_000; seed += 1) {
      const count = (seed % 50) + 1;
      const chapters = count + (seed % 200);
      const words = 10_000 + seed;
      const plan = planMilestoneScaffold({ expectedStructuralVersion: 1, milestoneCount: count, chapterStart: 1, chapterCount: chapters, advisoryProjectTargetWords: words });
      expect(plan.allocations[0]?.chapterStart).toBe(1);
      expect(plan.allocations.at(-1)?.chapterEnd).toBe(chapters);
      expect(plan.allocations.reduce((sum, item) => sum + (item.targetWords ?? 0), 0)).toBe(words);
      for (let index = 1; index < plan.allocations.length; index += 1) expect(plan.allocations[index]!.chapterStart).toBe(plan.allocations[index - 1]!.chapterEnd + 1);
    }
  });
});
