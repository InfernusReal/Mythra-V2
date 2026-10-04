import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PHASE7_SEALED_COMMIT, verifyPhase7PlanAuthority } from "./phase7-plan-authority";

const PHASE_7_BASELINE = "4cf7412d1f589d5e8e77124f8e90b3ad8fb3ad3e";
const FINAL_RELEASE_PHRASE = "PHASE 7 PASS — MYTHRA V2 RELEASE SEAL RESTORED";
const LOCAL_CANDIDATE_PHRASE = "S20 LOCAL RELEASE-CANDIDATE AUDIT PASSED; REMOTE PROOF PENDING.";
const PREFLIGHT_PHRASE = "S20 AUTHORITY, BASELINE, ZERO-CREATIVE BOUNDARY";

type ChangedPath = Readonly<{ status: string; path: string }>;

function readRepositoryFile(path: string): string {
  const absolutePath = resolve(path);
  if (!existsSync(absolutePath)) throw new Error(`S20 required repository file is missing: ${path}`);
  return readFileSync(absolutePath, "utf8");
}

function requireIncludes(source: string, sourceName: string, needles: readonly string[]): void {
  for (const needle of needles) {
    if (!source.includes(needle)) throw new Error(`S20 evidence is missing from ${sourceName}: ${needle}`);
  }
}

function gitText(args: readonly string[]): string {
  return execFileSync("git", args, { cwd: resolve("."), encoding: "utf8" }).trim();
}

function phase7Changes(): readonly ChangedPath[] {
  const output = gitText(["diff", "--name-status", PHASE_7_BASELINE, "--"]);
  if (!output) throw new Error("S20 Phase 7 diff unexpectedly contains no changed paths.");
  return output.split(/\r?\n/u).map((line) => {
    const [status = "", ...pathParts] = line.split("\t");
    const path = pathParts.at(-1) ?? "";
    if (!status || !path) throw new Error(`S20 could not parse changed-path evidence: ${line}`);
    return { status, path };
  });
}

const workPlan = readRepositoryFile("WorkPlan.md");
const pathway = readRepositoryFile("Path.md");
const packageJsonText = readRepositoryFile("package.json");
const packageJson = JSON.parse(packageJsonText) as {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const ciWorkflow = readRepositoryFile(".github/workflows/ci.yml");

const phase7Index = pathway.indexOf("## 27. Phase 7 — Compliance Closure and Product Polish");
const s19Index = pathway.indexOf("### 28.1 S19 authority, invariant boundary, and slice order");
const s20Index = pathway.indexOf("## 29. S20 — Final Coherence and Release Seal");
if (!(phase7Index >= 0 && phase7Index < s19Index && s19Index < s20Index)) {
  throw new Error("S20 Path gate order does not preserve Phase 7 -> S19 -> S20 chronology.");
}
requireIncludes(pathway, "Path.md", [
  "Phase 6 closed with no known gaps based on the evidence then recorded.",
  "Subsequent source inspection disproved the completeness of the S10 command integration claim.",
  "S19-L IS CLOSED.",
  "S20 begins as a verification-only gate"
]);
// Console trace S20-AUDIT-001: records only gate-order and historical-preservation outcomes.
console.log(JSON.stringify({ level: "info", step: "S20-AUDIT-001", event: "release_seal.gate_order_verified", phase6HistoryPreserved: true, s18Closed: true, s19Closed: true }));

const historicalWorkPlan = execFileSync("git", ["show", `${PHASE7_SEALED_COMMIT}:WorkPlan.md`], {
  cwd: resolve("."), encoding: "utf8", maxBuffer: 1024 * 1024,
});
const planAuthority = verifyPhase7PlanAuthority(historicalWorkPlan, workPlan, "phase7x");
requireIncludes(workPlan, "WorkPlan.md", [
  "Sub-gate 0 → Sub-gate 1 → ... → Sub-gate 17",
  "Series/Project → Plot → Plot Outline → Volume → Volume Outline → Milestone/Thread → Chapter Outline → Chapter → Scene → Prose",
  "`becauseItems[]` and `consequenceItems[]`",
  "Mythra Core at USD 15/month with full deterministic V2 access",
  "Mythra Intelligence at USD 25/month is future-only"
]);
for (let subGate = 0; subGate <= 17; subGate += 1) {
  if (!pathway.includes(`| ${subGate} |`) || !workPlan.includes(`Sub-gate ${subGate}`)) {
    throw new Error(`S20 original capability inventory is incomplete at Sub-gate ${subGate}.`);
  }
}
// Console trace S20-AUDIT-002: records pinned historical/current plan hashes, approved version and bounded gate counts without product content.
console.log(JSON.stringify({ level: "info", step: "S20-AUDIT-002", event: "release_seal.authority_verified", workPlanSha256: planAuthority.currentSha256, historicalWorkPlanSha256: planAuthority.historicalSha256, planVersion: planAuthority.version, originalSubGates: 18, directiveCollections: 2 }));

const s18ClosureIndex = pathway.indexOf("### 27.29 R08 exact remote proof and superseding S18 closure dashboard");
const s18ReclosureIndex = pathway.indexOf("### 27.34 R17/R18 exact remote proof and superseding S18 reclosure");
if (!(s18ClosureIndex >= 0 && s18ClosureIndex < s18ReclosureIndex)) {
  throw new Error("S20 cannot locate the ordered S18 closure and superseding reclosure evidence.");
}
const initialClosure = pathway.slice(s18ClosureIndex, s18ReclosureIndex);
const supersedingClosure = pathway.slice(s18ReclosureIndex, s19Index);
const initialRegisterIds = [
  ...Array.from({ length: 11 }, (_, index) => `R${String(index + 1).padStart(2, "0")}`),
  "R12a",
  "R12b",
  "R12c",
  "R13",
  "R14",
  "R15",
  "R16"
] as const;
for (const id of initialRegisterIds) {
  if (!initialClosure.includes(`| ${id} |`)) throw new Error(`S20 S18 terminal register omits ${id}.`);
}
for (const id of ["R17", "R18"]) {
  if (!supersedingClosure.includes(id)) throw new Error(`S20 S18 superseding closure omits ${id}.`);
}
const commandEvidence: Readonly<Record<string, readonly string[]>> = {
  "lib/commands/registry.ts": ["export const commandRegistry = [", "matchesCommandShortcut", "Mod+Alt+C"],
  "lib/commands/ranking.ts": ["rankPaletteItems", "commandHistoryKey", ".slice(0, 30)"],
  "lib/commands/runtime.ts": ["availableCommands", "captureCommandFocus", "registerWritingFocus"],
  "components/shell/CommandPalette.tsx": ["rankPaletteItems", "availableCommands", "event.isComposing", "aria-modal=\"true\""],
  "tests/unit/command-registry.test.ts": ["matches every Bible 8.7 shortcut exactly with no collision", "commandRegistry"],
  "tests/unit/command-ranking.test.ts": ["ranks recent objects and commands in the same list regardless of type", "bounds history at 30 records"],
  "tests/component/command-palette.test.tsx": ["does not credit failed actions to history", "preserves object Peek and successful Copy recency"],
  "tests/stress/command-ranking.stress.test.ts": ["500", "rankPaletteItems"],
  "tests/e2e/command-palette.spec.ts": ["executes checkpoint and Focus in place", "Continue Writing"]
};
for (const [file, needles] of Object.entries(commandEvidence)) requireIncludes(readRepositoryFile(file), file, needles);
// Console trace S20-AUDIT-003: reports only the count of verified S10 command evidence owners.
console.log(JSON.stringify({ level: "info", step: "S20-AUDIT-003", event: "release_seal.command_integration_verified", commandEvidenceFiles: Object.keys(commandEvidence).length, authoritativeRegistry: true, sharedRanking: true }));

const changedPaths = phase7Changes();
const deletedPaths = changedPaths.filter((entry) => entry.status.startsWith("D"));
if (deletedPaths.length > 0) {
  throw new Error(`S20 Phase 7 removed tracked capability files: ${deletedPaths.map((entry) => entry.path).join(", ")}`);
}
const unaccountedPaths = changedPaths.filter((entry) => !pathway.includes(entry.path));
if (unaccountedPaths.length > 0) {
  throw new Error(`S20 Path.md does not justify changed paths: ${unaccountedPaths.map((entry) => entry.path).join(", ")}`);
}
const phase7CommitCount = Number(gitText(["rev-list", "--count", `${PHASE_7_BASELINE}..HEAD`]));
if (!Number.isSafeInteger(phase7CommitCount) || phase7CommitCount < 1) throw new Error("S20 Phase 7 commit count is invalid.");
// Console trace S20-AUDIT-004: records only Git path/status and commit counts; no file content is emitted.
console.log(JSON.stringify({ level: "info", step: "S20-AUDIT-004", event: "release_seal.changed_files_accounted", changedPaths: changedPaths.length, deletedPaths: deletedPaths.length, unaccountedPaths: unaccountedPaths.length, phase7Commits: phase7CommitCount }));

const installedPackages = [...Object.keys(packageJson.dependencies ?? {}), ...Object.keys(packageJson.devDependencies ?? {})];
const forbiddenAiPackages = ["openai", "@anthropic-ai/sdk", "@google/generative-ai", "@aws-sdk/client-bedrock-runtime", "ollama"];
const installedAiPackages = installedPackages.filter((name) => forbiddenAiPackages.includes(name));
if (installedAiPackages.length > 0) throw new Error(`S20 zero-AI Core contains model dependencies: ${installedAiPackages.join(", ")}`);
if (packageJson.scripts?.["audit:release-seal"] !== "tsx scripts/verify-phase7-release-seal.ts") {
  throw new Error("S20 package command does not point to the deterministic release-seal verifier.");
}
requireIncludes(ciWorkflow, ".github/workflows/ci.yml", ["fetch-depth: 0", "npm run audit:launch", "npm run audit:release-seal"]);
requireIncludes(readRepositoryFile("scripts/verify-final-launch-audit.ts"), "scripts/verify-final-launch-audit.ts", ["criticalE2E.length !== 14", "aiEnabled: false"]);
// Console trace S20-AUDIT-005: emits only dependency and release-check counts plus the zero-AI outcome.
console.log(JSON.stringify({ level: "info", step: "S20-AUDIT-005", event: "release_seal.zero_ai_and_release_checks_verified", dependencyCount: installedPackages.length, forbiddenAiDependencies: installedAiPackages.length, launchAuditRetained: true, hostedSealAuditConfigured: true }));

const sealed = pathway.includes(FINAL_RELEASE_PHRASE);
const candidate = pathway.includes(LOCAL_CANDIDATE_PHRASE);
const preflight = process.argv.includes("--preflight");
if (!sealed && !candidate && !(preflight && pathway.includes(PREFLIGHT_PHRASE))) {
  throw new Error("S20 Path.md has neither a valid preflight, local release-candidate, nor final sealed state.");
}
if (sealed) {
  requireIncludes(pathway, "Path.md", ["S20 IS CLOSED", "Remaining Phase 7 gaps: **none**"]);
  if (!/\| 7\. Compliance Closure and Product Polish \|[^\n]+\| \*\*Passed/u.test(pathway)) {
    throw new Error("S20 final phrase exists but the Phase 7 status row is not Passed.");
  }
}
// Console trace S20-AUDIT-006: records only the finite audit mode and terminal gap count.
console.log(JSON.stringify({ level: "info", step: "S20-AUDIT-006", event: "release_seal.audit_state_verified", mode: sealed ? "sealed" : candidate ? "candidate" : "preflight", remainingGaps: sealed ? 0 : null, releaseSealRestored: sealed }));
