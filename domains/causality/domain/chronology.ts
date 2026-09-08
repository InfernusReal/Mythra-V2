import type { ResolvedCausalEndpoint } from "./endpoint-registry";
import type { CausalRelationType } from "./types";

export interface ChronologyResult {
  status: "CONSISTENT" | "WARNING" | "INSUFFICIENT_INFORMATION";
  warnings: Array<{ code: "CAUSE_AFTER_EFFECT" | "REVEAL_BEFORE_DISCOVERY" }>;
  basis: "STORY_TIME" | "DISCOVERY_TIME" | "NONE";
}

export function validateCausalChronology(
  source: ResolvedCausalEndpoint,
  target: ResolvedCausalEndpoint,
  relationType: CausalRelationType,
): ChronologyResult {
  if (relationType === "REVEALS") {
    if (source.discoveryTime === null || target.discoveryTime === null)
      return {
        status: "INSUFFICIENT_INFORMATION",
        warnings: [],
        basis: "NONE",
      };
    const warnings =
      source.discoveryTime > target.discoveryTime
        ? [{ code: "REVEAL_BEFORE_DISCOVERY" as const }]
        : [];
    return {
      status: warnings.length ? "WARNING" : "CONSISTENT",
      warnings,
      basis: "DISCOVERY_TIME",
    };
  }
  if (source.storyTime === null || target.storyTime === null)
    return { status: "INSUFFICIENT_INFORMATION", warnings: [], basis: "NONE" };
  const warnings =
    source.storyTime > target.storyTime
      ? [{ code: "CAUSE_AFTER_EFFECT" as const }]
      : [];
  return {
    status: warnings.length ? "WARNING" : "CONSISTENT",
    warnings,
    basis: "STORY_TIME",
  };
}
