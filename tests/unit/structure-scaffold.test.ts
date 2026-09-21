import { describe, expect, it } from "vitest";
import { planStructureScaffold, verifyScaffoldPlan } from "@/domains/structure/domain/scaffold";

describe("Structure Core scaffold planner", () => {
  it("allocates chapter ranges and advisory words deterministically", () => {
    const input = { expectedStructuralVersion: 4, volumeCount: 3, chapterStart: 1, chapterCount: 10, createChapterOutlinePlaceholders: true, advisoryProjectTargetWords: 100_000 };
    const first = planStructureScaffold(input);
    const second = planStructureScaffold(input);
    expect(first).toEqual(second);
    expect(first.allocations.map((allocation) => allocation.chapterCount)).toEqual([4, 3, 3]);
    expect(first.allocations.map((allocation) => [allocation.chapterStart, allocation.chapterEnd])).toEqual([[1, 4], [5, 7], [8, 10]]);
    expect(first.allocations.reduce((sum, allocation) => sum + (allocation.advisoryTargetWords ?? 0), 0)).toBe(100_000);
    expect(first.placeholderCount).toBe(10);
    expect(first.planToken).toMatch(/^[a-f0-9]{64}$/);
    expect(verifyScaffoldPlan(input, first.planToken)).toEqual(first);
  });

  it("keeps zero-chapter volume ranges advisory instead of blocking apply", () => {
    const plan = planStructureScaffold({ expectedStructuralVersion: 1, volumeCount: 3, chapterStart: 8, chapterCount: 1, createChapterOutlinePlaceholders: false });
    expect(plan.allocations.map((allocation) => allocation.chapterCount)).toEqual([1, 0, 0]);
    expect(plan.warnings).toHaveLength(1);
    expect(plan.placeholderCount).toBe(0);
  });

  it("rejects a stale or modified apply token", () => {
    const input = { expectedStructuralVersion: 1, volumeCount: 2, chapterStart: 1, chapterCount: 4, createChapterOutlinePlaceholders: true };
    expect(() => verifyScaffoldPlan(input, "0".repeat(64))).toThrow("STALE_OR_TAMPERED_SCAFFOLD_PLAN");
  });
});

