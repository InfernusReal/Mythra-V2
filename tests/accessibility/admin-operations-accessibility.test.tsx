import axe from "axe-core";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminOperationsPanel } from "@/components/operations/AdminOperationsPanel";
import type { AdminOperationsSnapshot } from "@/domains/operations/application/ports";

const snapshot: AdminOperationsSnapshot = { actor: { userId: "f14278a4-18d1-401f-9714-1ae313c1b4b0", role: "OWNER" }, workspace: { id: "a873e0d0-e22f-4cd0-a7f9-484546489adc", planKey: "core", archived: false, memberCount: 1, projectCount: 1 }, subscription: null, quotas: [], jobs: [], exports: [], snapshots: [], audits: [], operations: [], alerts: [] };

describe("S16 admin accessibility", () => {
  it("has no serious or critical violations", async () => {
    const { container } = render(<main><AdminOperationsPanel snapshot={snapshot} /></main>);
    const results = await axe.run(container);
    expect(results.violations.filter((item) => item.impact === "critical" || item.impact === "serious")).toEqual([]);
    expect(document.querySelector('[role="region"]')).toHaveAttribute("tabindex", "0");
  });
});
