import { z } from "zod";
import type { Logger } from "@/lib/observability/logger";

export const agentEvaluationCategories = [
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
] as const;

export type AgentEvaluationCategory = (typeof agentEvaluationCategories)[number];

export const evaluationFixtureSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/u),
  category: z.enum(agentEvaluationCategories),
  expected: z.object({ finding: z.boolean(), citedEvidenceIds: z.array(z.string()).max(100), canonicalMutationCount: z.literal(0) }).strict(),
  observed: z.object({ finding: z.boolean(), citedEvidenceIds: z.array(z.string()).max(100), canonicalMutationCount: z.number().int().nonnegative() }).strict(),
}).strict();

export type AgentEvaluationFixture = z.infer<typeof evaluationFixtureSchema>;

export interface AgentEvaluationResult {
  fixtureId: string;
  category: AgentEvaluationCategory;
  passed: boolean;
  findingCorrect: boolean;
  evidencePrecision: number;
  evidenceRecall: number;
  authorshipPreserved: boolean;
}

const ratio = (numerator: number, denominator: number) => denominator === 0 ? 1 : numerator / denominator;

export function evaluateAgentFixture(raw: unknown): AgentEvaluationResult {
  const fixture = evaluationFixtureSchema.parse(raw);
  const expected = new Set(fixture.expected.citedEvidenceIds);
  const observed = new Set(fixture.observed.citedEvidenceIds);
  const truePositiveCount = [...observed].filter((id) => expected.has(id)).length;
  const evidencePrecision = ratio(truePositiveCount, observed.size);
  const evidenceRecall = ratio(truePositiveCount, expected.size);
  const findingCorrect = fixture.expected.finding === fixture.observed.finding;
  const authorshipPreserved = fixture.observed.canonicalMutationCount === fixture.expected.canonicalMutationCount;
  return { fixtureId: fixture.id, category: fixture.category, passed: findingCorrect && evidencePrecision === 1 && evidenceRecall === 1 && authorshipPreserved, findingCorrect, evidencePrecision, evidenceRecall, authorshipPreserved };
}

export function runAgentEvaluationHarness(rawFixtures: readonly unknown[], logger?: Logger) {
  const results = rawFixtures.map(evaluateAgentFixture);
  const categoryCoverage = Object.fromEntries(agentEvaluationCategories.map((category) => [category, results.some((result) => result.category === category)])) as Record<AgentEvaluationCategory, boolean>;
  const passed = results.every((result) => result.passed) && Object.values(categoryCoverage).every(Boolean);
  // Console trace S17-EVAL-001: deterministic evaluation records category coverage and aggregate pass counts without fixture evidence or findings.
  logger?.info("agent_evaluation.completed", { step: "S17-EVAL-001", fixtureCount: results.length, passedCount: results.filter((result) => result.passed).length, categoryCount: agentEvaluationCategories.length, passed });
  return { passed, results, categoryCoverage };
}
