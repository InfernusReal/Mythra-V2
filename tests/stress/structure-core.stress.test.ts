import { describe, expect, it } from "vitest";
import { planStructureScaffold } from "@/domains/structure/domain/scaffold";
import { clampStructureBudget, STRUCTURE_MAX_EDGE_BUDGET, STRUCTURE_MAX_NODE_BUDGET, STRUCTURE_MAX_PAGE_SIZE } from "@/domains/structure/domain/types";
import { previewReorder } from "@/domains/structure/domain/invariants";

describe("Structure Core bounded-load stress", () => {
  it("plans ten thousand placeholders deterministically within one bounded operation", () => {
    const input = { expectedStructuralVersion: 8, volumeCount: 100, chapterStart: 1, chapterCount: 10_000, createChapterOutlinePlaceholders: true, advisoryProjectTargetWords: 12_345_678 };
    const first = planStructureScaffold(input);
    expect(first.allocations).toHaveLength(100);
    expect(first.placeholderCount).toBe(10_000);
    expect(first.allocations.every((allocation) => allocation.chapterCount === 100)).toBe(true);
    expect(planStructureScaffold(input).planToken).toBe(first.planToken);
  });

  it("reorders ten thousand stable identities without creating replacement IDs", () => {
    const ids = Array.from({ length: 10_000 }, (_, index) => `chapter-${index}`);
    const preview = previewReorder(ids, "chapter-9999", 0);
    expect(preview.orderedIds).toHaveLength(10_000);
    expect(new Set(preview.orderedIds).size).toBe(10_000);
    expect(preview.orderedIds[0]).toBe("chapter-9999");
    expect(preview.referenceIdsPreserved).toBe(true);
  });

  it("clamps hostile read budgets before repository access", () => {
    expect(clampStructureBudget({ pageSize: 1_000_000, nodeBudget: 1_000_000, edgeBudget: 1_000_000, rangeStart: 10_000_000 }))
      .toEqual({ pageSize: STRUCTURE_MAX_PAGE_SIZE, nodeBudget: STRUCTURE_MAX_NODE_BUDGET, edgeBudget: STRUCTURE_MAX_EDGE_BUDGET, rangeStart: 1_000_000 });
    expect(clampStructureBudget({ pageSize: -1, nodeBudget: -1, edgeBudget: -1, rangeStart: -1 }))
      .toEqual({ pageSize: 1, nodeBudget: 1, edgeBudget: 0, rangeStart: 0 });
  });
});
