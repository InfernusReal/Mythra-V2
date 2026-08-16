import { describe, expect, it } from "vitest";
import type { ContextSnapshot } from "@/domains/context/application/ports";
import { DeterministicContextResolver } from "@/domains/context/domain/resolver";
import { contextQuerySchema } from "@/domains/context/domain/types";

const uuid = (value: number) => `20000000-0000-4000-8000-${value.toString().padStart(12, "0")}`;
describe("Context resolver bounded stress", () => {
  it("sorts a large deterministic fixture while returning at most the hard card cap", () => {
    const snapshot: ContextSnapshot = { projectId: uuid(1), projectStructuralVersion: 9_999, chapterId: uuid(2), chapterVersion: 100, outline: null, extraOutlines: [], milestones: Array.from({ length: 5_000 }, (_, index) => ({ id: uuid(index + 10), title: `Milestone ${index}`, description: null, role: "DEVELOP", weight: index % 5, version: 1 })), references: [], causal: [], intents: [], pins: [], preferences: { mutedTypes: [], directiveEnabled: true } };
    const started = performance.now(); const result = new DeterministicContextResolver().resolve(snapshot, contextQuerySchema.parse({ selectedIds: [], cardCap: 20 })); const elapsed = performance.now() - started;
    expect(result.descriptors).toHaveLength(20); expect(result.page.totalEligibleCards).toBe(5_000); expect(result.page.hasMore).toBe(true); expect(elapsed).toBeLessThan(1_000);
  });
});
