import { describe, expect, it } from "vitest";
import { planMilestoneScaffold } from "@/domains/milestones/domain/types";
import { wouldCreateHardDependencyCycle } from "@/domains/milestones/domain/dependency";

describe("milestone stress boundaries", () => {
  it("plans the maximum 500 milestones over 10,000 chapters within the test budget", () => {
    const started = performance.now();
    const plan = planMilestoneScaffold({ expectedStructuralVersion: 1, milestoneCount: 500, chapterStart: 1, chapterCount: 10_000, advisoryProjectTargetWords: 500_000_000, cadenceStartDate: "2026-01-01", cadenceDays: 1 });
    expect(plan.allocations).toHaveLength(500);
    expect(plan.allocations.at(-1)?.chapterEnd).toBe(10_000);
    expect(performance.now() - started).toBeLessThan(1_000);
  });

  it("detects a cycle at the 5,000-edge service ceiling without recursion", () => {
    const id = (value: number) => `m-${value}`;
    const edges = Array.from({ length: 5_000 }, (_, index) => ({ sourceMilestoneId: id(index), targetMilestoneId: id(index + 1), isHard: true, state: "ACTIVE" as const }));
    const started = performance.now();
    expect(wouldCreateHardDependencyCycle(edges, id(5_000), id(0))).toBe(true);
    expect(performance.now() - started).toBeLessThan(1_000);
  });
});
