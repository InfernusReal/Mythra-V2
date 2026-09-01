export const performanceBudgets = Object.freeze({
  captureOpenP95Ms: 100,
  localInputP95Ms: 50,
  warmRouteP95Ms: 1_000,
  contextApplyP95Ms: 1_500,
  cumulativeLayoutShift: 0.05,
  maxRenderedListItems: 80,
  maxCausalDepth: 12,
  maxCausalNodes: 500,
  maxCausalEdges: 750,
  maxCausalPaths: 500
});

export type ViewportClass = "mobile" | "compact" | "wide";

export function classifyViewport(width: number): ViewportClass {
  if (!Number.isFinite(width) || width < 0) throw new Error("Viewport width must be a non-negative finite number.");
  if (width <= 767) return "mobile";
  if (width <= 1279) return "compact";
  return "wide";
}

export function percentile(samples: readonly number[], percentileRank: number): number {
  if (!samples.length) throw new Error("At least one performance sample is required.");
  if (percentileRank < 0 || percentileRank > 1) throw new Error("Percentile rank must be between zero and one.");
  const ordered = [...samples].sort((left, right) => left - right);
  return ordered[Math.ceil((ordered.length - 1) * percentileRank)]!;
}
