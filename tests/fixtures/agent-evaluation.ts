import type { AgentEvaluationFixture } from "@/domains/tools/evaluation/harness";

export const passingAgentEvaluationFixtures: AgentEvaluationFixture[] = [
  "continuity",
  "pov_knowledge",
  "chronology",
  "intent_alignment",
  "character_state",
  "usefulness",
  "false_positive_cost",
  "causal_path_correctness",
  "attribution_correctness",
  "authorship_preservation",
].map((category, index) => ({
  id: `agent-evaluation-${index + 1}`,
  category: category as AgentEvaluationFixture["category"],
  expected: { finding: index % 2 === 0, citedEvidenceIds: [`evidence-${index + 1}`], canonicalMutationCount: 0 },
  observed: { finding: index % 2 === 0, citedEvidenceIds: [`evidence-${index + 1}`], canonicalMutationCount: 0 },
}));
