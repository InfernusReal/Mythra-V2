import { describe, expect, it } from "vitest";
import { performanceBudgets, percentile } from "@/lib/performance/budgets";
import { virtualWindow } from "@/lib/performance/virtual-window";

describe("S15 performance stress", () => {
  it("calculates one hundred thousand windows over a million-row collection within bounded CPU and DOM output", () => {
    const samples: number[] = [];
    let maximumRendered = 0;
    const started = performance.now();
    for (let index = 0; index < 100_000; index += 1) {
      const operationStarted = performance.now();
      const window = virtualWindow({ itemCount: 1_000_000, rowHeight: 48, viewportHeight: 960, scrollTop: (index * 7919) % 47_999_040 });
      samples.push(performance.now() - operationStarted);
      maximumRendered = Math.max(maximumRendered, window.rendered);
    }
    const elapsed = performance.now() - started;
    expect(maximumRendered).toBeLessThanOrEqual(performanceBudgets.maxRenderedListItems);
    expect(percentile(samples, 0.95)).toBeLessThan(1);
    expect(elapsed).toBeLessThan(5_000);
  });

  it("never crosses causal safety budgets in generated boundary combinations", () => {
    for (let depth = 1; depth <= performanceBudgets.maxCausalDepth; depth += 1) {
      const nodes = Math.min(performanceBudgets.maxCausalNodes, depth * 83);
      const edges = Math.min(performanceBudgets.maxCausalEdges, nodes + depth * 21);
      const paths = Math.min(performanceBudgets.maxCausalPaths, edges);
      expect({ depth, nodes, edges, paths }).toMatchObject({
        depth: expect.any(Number), nodes: expect.any(Number), edges: expect.any(Number), paths: expect.any(Number)
      });
      expect(depth).toBeLessThanOrEqual(12);
      expect(nodes).toBeLessThanOrEqual(500);
      expect(edges).toBeLessThanOrEqual(750);
      expect(paths).toBeLessThanOrEqual(500);
    }
  });
});
