import { createHash } from "node:crypto";

export const PHASE7_SEALED_COMMIT = "f8fa1d061a91e748642e10387c6318df116f6ca0";
export const PHASE7_WORKPLAN_SHA256 = "87372ec08c80951e8321379019aab4e622f916dd3e62c09fbe2c60705ce44aa9";
export const PHASE7X_WORKPLAN_SHA256 = "510bcfad7920ac3fd87e631b5ffa4da324f429b1dfa4e7819d5c3be15045fe15";

type PlanVersion = "phase7" | "phase7x";
type PlanAuthority = Readonly<{
  version: PlanVersion;
  historicalSha256: string;
  currentSha256: string;
}>;

// Git checkouts may normalize LF to CRLF; no other whitespace/content normalization is allowed.
function normalizeLineEndings(source: string): string {
  return source.replaceAll("\r\n", "\n");
}

function sha256(source: string): string {
  return createHash("sha256").update(source).digest("hex");
}

/** Validate known plan versions, never infer approval from headings or an arbitrary appended tail. */
export function verifyPhase7PlanAuthority(
  historicalSource: string,
  currentSource: string,
  requiredVersion: PlanVersion,
): PlanAuthority {
  const historical = normalizeLineEndings(historicalSource);
  const current = normalizeLineEndings(currentSource);
  const historicalSha256 = sha256(historical);
  if (historicalSha256 !== PHASE7_WORKPLAN_SHA256) {
    throw new Error("S20 historical WorkPlan object does not match its sealed hash.");
  }
  if (!current.startsWith(historical)) {
    throw new Error("S20 current WorkPlan changes or omits original sealed plan content.");
  }
  const currentSha256 = sha256(current);
  if (requiredVersion === "phase7") {
    if (currentSha256 !== PHASE7_WORKPLAN_SHA256) {
      throw new Error("S20 historical plan validation requires the exact original plan.");
    }
    return { version: "phase7", historicalSha256, currentSha256 };
  }
  if (requiredVersion !== "phase7x") {
    throw new Error("S20 plan authority version is unsupported.");
  }
  const appendix = current.slice(historical.length);
  if (!appendix.startsWith("\n## 14. Phase 7X — Appearance Renewal and Curated Palettes\n")) {
    throw new Error("S20 approved Phase 7X appendix is missing or out of order.");
  }
  if (currentSha256 !== PHASE7X_WORKPLAN_SHA256) {
    throw new Error("S20 current WorkPlan does not match the explicitly approved Phase 7X plan hash.");
  }
  return { version: "phase7x", historicalSha256, currentSha256 };
}
