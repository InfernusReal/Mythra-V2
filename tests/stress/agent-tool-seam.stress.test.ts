import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { chapterTextToolSchema, projectMapToolSchema, timelineWindowToolSchema } from "@/domains/tools/domain/contracts";
import { runAgentEvaluationHarness } from "@/domains/tools/evaluation/harness";
import { passingAgentEvaluationFixtures } from "@/tests/fixtures/agent-evaluation";

describe("agent tool seam stress", () => {
  it("validates 25,000 maximum-bound read requests deterministically", () => {
    const chapterId = randomUUID();
    for (let index = 0; index < 25_000; index += 1) {
      expect(chapterTextToolSchema.parse({ chapterId, start: index, length: 8_000 }).length).toBe(8_000);
      expect(projectMapToolSchema.parse({ perCollectionLimit: 100 }).perCollectionLimit).toBe(100);
      expect(timelineWindowToolSchema.parse({ before: 50, after: 50 }).before).toBe(50);
    }
  });

  it("runs 10,000 complete ten-category evaluations without state leakage", () => {
    for (let index = 0; index < 10_000; index += 1) expect(runAgentEvaluationHarness(passingAgentEvaluationFixtures).passed).toBe(true);
  });
});
