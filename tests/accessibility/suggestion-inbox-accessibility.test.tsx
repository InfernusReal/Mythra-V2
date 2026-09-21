import axe from "axe-core";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SuggestionInbox } from "@/components/suggestions/SuggestionInbox";

describe("Suggestion inbox accessibility", () => {
  it("has no serious or critical issue in the author decision surface", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const { container } = render(<SuggestionInbox projectId="80000000-0000-4000-8000-000000000001" initialCursor={null} initialSuggestions={[{ id: "80000000-0000-4000-8000-000000000002", projectId: "80000000-0000-4000-8000-000000000001", sourceAgent: "test.agent", category: "continuity", targetType: null, targetId: null, sourceBlockId: null, finding: "Review this finding.", evidenceReferences: [], proposedActions: [], confidence: null, status: "open", authorNote: null, version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), resolvedAt: null }]} />);
    const results = await axe.run(container);
    expect(results.violations.filter((item) => item.impact === "critical" || item.impact === "serious")).toEqual([]);
  });
});
