import axe from "axe-core";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchWorkspace } from "@/components/search/SearchWorkspace";

describe("Search and Language accessibility", () => {
  it("has no serious or critical issue in the empty full Search surface", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const { container } = render(<SearchWorkspace projectId="a0000000-0000-4000-8000-000000000001" />);
    const results = await axe.run(container);
    expect(results.violations.filter((item) => item.impact === "critical" || item.impact === "serious")).toEqual([]);
  });
});
