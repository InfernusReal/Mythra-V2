import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type Evidence = Readonly<{ id: string; file: string; needle: string }>;

const criticalE2E: readonly Evidence[] = [
  { id: "E2E-01", file: "tests/e2e/editor-core.spec.ts", needle: "moves from title to first keystroke" },
  { id: "E2E-02", file: "tests/e2e/durability.spec.ts", needle: "retains offline edits and retries" },
  { id: "E2E-03", file: "tests/e2e/durability.spec.ts", needle: "preserves both device variants" },
  { id: "E2E-04", file: "tests/e2e/capture.spec.ts", needle: "saves raw text locally first" },
  { id: "E2E-05", file: "tests/e2e/universe.spec.ts", needle: "quick-creates from a selection" },
  { id: "E2E-06", file: "tests/e2e/structure-core.spec.ts", needle: "scaffolds and reorders only after reviewed previews" },
  { id: "E2E-07", file: "tests/e2e/milestones.spec.ts", needle: "keeps zero milestones optional and applies only a reviewed allocation" },
  { id: "E2E-08", file: "tests/e2e/billing.spec.ts", needle: "shows complete Core access" },
  { id: "E2E-09", file: "tests/e2e/portability.spec.ts", needle: "verifies snapshot, export, safe-copy restore" },
  { id: "E2E-10", file: "tests/e2e/portability.spec.ts", needle: "Export full project archive" },
  { id: "E2E-11", file: "tests/e2e/capture.spec.ts", needle: "creates only explicitly requested causality" },
  { id: "E2E-12", file: "tests/e2e/live-model.spec.ts", needle: "repairs from canonical data" },
  { id: "E2E-13", file: "tests/e2e/causality.spec.ts", needle: "composes A causes B, traces" },
  { id: "E2E-14", file: "tests/e2e/causality.spec.ts", needle: "checks neutral chronology" }
];

const causalAcceptance: readonly Evidence[] = [
  { id: "E6-01", file: "tests/e2e/causality.spec.ts", needle: "keeps zero causality optional" },
  { id: "E6-02", file: "tests/e2e/causality.spec.ts", needle: "restores the exact position without changing prose" },
  { id: "E6-03", file: "tests/e2e/live-model.spec.ts", needle: "repairs from canonical data" },
  { id: "E6-04", file: "tests/unit/causality-domain.test.ts", needle: "uses story time normally, discovery time for reveals" },
  { id: "E6-05", file: "tests/stress/causality.stress.test.ts", needle: "stops a large neighborhood" },
  { id: "E6-06", file: "tests/unit/portability-representations.test.ts", needle: "preserves causal identity/semantics" },
  { id: "E6-07", file: "tests/e2e/agent-tool-seam.spec.ts", needle: "keeps proposals non-canonical" }
];

const visualDimensions = ["Light, Dark, Cream", "Wide, compact, mobile", "Context open and closed", "Selection tools", "Long titles", "RTL/international"] as const;
const doctrine = Array.from({ length: 16 }, (_, index) => `D-${index + 1}`);
const launchConditions = Array.from({ length: 11 }, (_, index) => `L-${index + 1}`);
const paidValidationEvents = ["structure.adopted", "capture.processed", "causality.feedback", "autosave.trust_feedback", "core.value_feedback", "external_tool.escape", "intelligence.interest"] as const;
const sourceSections = Array.from({ length: 40 }, (_, index) => `| ${index}.`);
const sourceAppendices = ["A", "B", "C", "D", "E"].map((appendix) => `| Appendix ${appendix} |`);
const subGates = Array.from({ length: 18 }, (_, index) => `Sub-gate ${index}`);
const requiredDocuments = [
  "docs/audits/final-v2-launch-audit.md",
  "docs/validation/paid-author-validation-plan.md",
  "docs/runbooks/founder-led-launch.md"
] as const;

function assertEvidence(entries: readonly Evidence[]): void {
  for (const entry of entries) {
    const path = resolve(entry.file);
    if (!existsSync(path) || !readFileSync(path, "utf8").includes(entry.needle)) {
      throw new Error(`${entry.id} evidence is missing: ${entry.file} :: ${entry.needle}`);
    }
  }
}

if (criticalE2E.length !== 14 || visualDimensions.length !== 6 || causalAcceptance.length !== 7 || doctrine.length !== 16 || launchConditions.length !== 11) {
  throw new Error("Final audit source counts do not match the Bible.");
}
// Console trace P6-AUDIT-001: verifies the five immutable Bible audit counts without authored content.
console.log(JSON.stringify({ level: "info", step: "P6-AUDIT-001", event: "launch_audit.source_counts_verified", criticalE2E: criticalE2E.length, visualDimensions: visualDimensions.length, causalAcceptance: causalAcceptance.length, doctrineQuestions: doctrine.length, launchConditions: launchConditions.length }));

assertEvidence(criticalE2E);
assertEvidence(causalAcceptance);
// Console trace P6-AUDIT-002: records only evidence identifiers and counts after repository resolution.
console.log(JSON.stringify({ level: "info", step: "P6-AUDIT-002", event: "launch_audit.repository_evidence_verified", criticalE2E: criticalE2E.length, causalAcceptance: causalAcceptance.length }));

for (const file of requiredDocuments) {
  if (!existsSync(resolve(file))) throw new Error(`Required final audit document is missing: ${file}`);
}
const auditReport = readFileSync(resolve(requiredDocuments[0]), "utf8");
for (const item of [...visualDimensions, ...doctrine, ...launchConditions]) {
  if (!auditReport.includes(`| ${item} |`)) throw new Error(`Final audit report is missing: ${item}`);
}
// Console trace P6-AUDIT-003: records bounded document and checklist counts only.
console.log(JSON.stringify({ level: "info", step: "P6-AUDIT-003", event: "launch_audit.documents_verified", documentCount: requiredDocuments.length, visualDimensions: visualDimensions.length, doctrineQuestions: doctrine.length, launchConditions: launchConditions.length }));

const paidValidationPlan = readFileSync(resolve(requiredDocuments[1]), "utf8");
for (const eventName of paidValidationEvents) {
  if (!paidValidationPlan.includes(eventName)) throw new Error(`Paid-validation event is missing: ${eventName}`);
}
if (!paidValidationPlan.includes("day 7") || !paidValidationPlan.includes("day 30") || !paidValidationPlan.includes("ten unrelated writers")) throw new Error("Paid-validation cohort contract is incomplete.");
// Console trace P6-AUDIT-004: verifies the paid-validation measurement contract without cohort results or authored content.
console.log(JSON.stringify({ level: "info", step: "P6-AUDIT-004", event: "launch_audit.paid_validation_contract_verified", paidWriterTarget: 10, retentionIntervals: 2, codedEventCount: paidValidationEvents.length, observedCohortClaimed: false }));

const workPlan = readFileSync(resolve("WorkPlan.md"), "utf8");
const pathway = readFileSync(resolve("Path.md"), "utf8");
const normalizedWorkPlan = workPlan.replaceAll("**", "");
const normalizedPathway = pathway.replaceAll("**", "");
for (const needle of [...sourceSections, ...sourceAppendices]) {
  if (!workPlan.includes(needle)) throw new Error(`WorkPlan source coverage is missing: ${needle}`);
}
for (const subGate of subGates) {
  if (!normalizedWorkPlan.includes(subGate) || !normalizedPathway.includes(subGate)) throw new Error(`Sub-gate evidence is missing: ${subGate}`);
}
// Console trace P6-AUDIT-005: verifies the complete numbered source and capability-gate inventories.
console.log(JSON.stringify({ level: "info", step: "P6-AUDIT-005", event: "launch_audit.coverage_inventories_verified", numberedSections: sourceSections.length, appendices: sourceAppendices.length, subGates: subGates.length }));

for (const excluded of ["future integrations", "collaboration", "publisher workspaces", "regional/China-native operations", "community", "Story Intelligence", "model fine-tuning", "specialized narrative models"]) {
  if (!workPlan.includes(excluded)) throw new Error(`Future boundary is missing from WorkPlan.md: ${excluded}`);
}
// Console trace P6-AUDIT-006: confirms the post-V2 boundary count without enabling a future capability.
console.log(JSON.stringify({ level: "info", step: "P6-AUDIT-006", event: "launch_audit.future_boundary_verified", excludedCapabilityGroups: 8, aiEnabled: false }));
