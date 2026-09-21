import { describe, expect, it, vi } from "vitest";
import { agentEvaluationCategories, runAgentEvaluationHarness } from "@/domains/tools/evaluation/harness";
import { passingAgentEvaluationFixtures } from "@/tests/fixtures/agent-evaluation";
import type { Logger } from "@/lib/observability/logger";

describe("deterministic agent evaluation harness", () => {
  it("covers and passes all ten frozen categories without a model", () => {
    const logger = { info: vi.fn() } as unknown as Logger;
    const report = runAgentEvaluationHarness(passingAgentEvaluationFixtures, logger);
    expect(report.passed).toBe(true);
    expect(Object.keys(report.categoryCoverage)).toEqual(agentEvaluationCategories);
    expect(report.results).toHaveLength(10);
    expect(logger.info).toHaveBeenCalledWith("agent_evaluation.completed", expect.objectContaining({ step: "S17-EVAL-001", passed: true }));
  });

  it("fails false evidence, missed evidence, incorrect findings and canonical mutations", () => {
    const base = passingAgentEvaluationFixtures[0]!;
    const report = runAgentEvaluationHarness([{ ...base, observed: { finding: !base.expected.finding, citedEvidenceIds: ["false-evidence"], canonicalMutationCount: 1 } }, ...passingAgentEvaluationFixtures.slice(1)]);
    expect(report.passed).toBe(false);
    expect(report.results[0]).toMatchObject({ findingCorrect: false, evidencePrecision: 0, evidenceRecall: 0, authorshipPreserved: false, passed: false });
  });
});
