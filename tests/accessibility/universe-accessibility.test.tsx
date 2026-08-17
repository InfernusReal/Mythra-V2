import axe from "axe-core";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UniverseWorkspace } from "@/components/universe/UniverseWorkspace";

describe("Universe accessibility", () => {
  it("has no serious or critical issue in the bounded collection view", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const catalog = {
      entityTypes: [
        {
          id: "90000000-0000-4000-8000-000000000002",
          key: "custom",
          systemKey: "custom",
          name: "Custom",
          description: null,
          icon: null,
          locale: "en",
          fields: [],
        },
      ],
      relationTypes: [],
    };
    const { container } = render(
      <UniverseWorkspace
        projectId="90000000-0000-4000-8000-000000000001"
        initialEntities={[]}
        initialCatalog={catalog}
        initialStructuralVersion={1}
      />,
    );
    const results = await axe.run(container);
    expect(
      results.violations.filter(
        (item) => item.impact === "critical" || item.impact === "serious",
      ),
    ).toEqual([]);
  });
});
