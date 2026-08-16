import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { traverseCausalGraph, wouldCreateForbiddenHardRequiresCycle, type CausalEdge } from "@/domains/causality/domain/graph";
import type { CausalEndpoint } from "@/domains/causality/domain/types";

const change = (): CausalEndpoint => ({ type: "STORY_CHANGE", id: randomUUID() });
const link = (source: CausalEndpoint, target: CausalEndpoint): CausalEdge => ({ id: randomUUID(), source, target, relationType: "REQUIRES", state: "ACTIVE", isHard: true, temporalProgression: false, mutualStateSemantics: false, provenanceType: "DIRECT", provenanceNote: null });

describe("causality stress", () => {
  it("proves a 5,000-edge hard cycle iteratively without stack recursion", () => {
    const nodes = Array.from({ length: 5_001 }, change); const edges = Array.from({ length: 5_000 }, (_, index) => link(nodes[index]!, nodes[index + 1]!));
    expect(wouldCreateForbiddenHardRequiresCycle(edges, link(nodes[5_000]!, nodes[0]!))).toBe(true);
  });

  it("stops a large neighborhood at independent node, edge and path budgets", () => {
    const root = change(); const targets = Array.from({ length: 1_000 }, change); const edges = targets.map((target) => link(root, target));
    const result = traverseCausalGraph(edges, root, { direction: "DOWNSTREAM", maxDepth: 12, nodeBudget: 500, edgeBudget: 750, pathBudget: 200 });
    expect(result.paths).toHaveLength(200); expect(result.nodeCount).toBeLessThanOrEqual(500); expect(result.edgeCount).toBeLessThanOrEqual(750); expect(result.truncated).toBe(true);
  });
});
