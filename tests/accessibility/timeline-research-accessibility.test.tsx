import axe from "axe-core";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TimelineWorkspace } from "@/components/timeline/TimelineWorkspace";
import { ResearchWorkspace } from "@/components/research/ResearchWorkspace";

const projectId = "a0000000-0000-4000-8000-000000000001";

describe("Timeline and Research accessibility", () => {
  it("has no serious or critical violation across empty canonical surfaces", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const { container } = render(<><TimelineWorkspace projectId={projectId} initialEvents={[]} initialStructuralVersion={1} /><ResearchWorkspace projectId={projectId} initialNotes={[]} initialItems={[]} initialStructuralVersion={1} /></>);
    const results = await axe.run(container);
    expect(results.violations.filter((item) => item.impact === "critical" || item.impact === "serious")).toEqual([]);
  });
});
