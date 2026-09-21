import axe from "axe-core";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PortabilityPanel } from "@/components/portability/PortabilityPanel";

afterEach(() => vi.restoreAllMocks());

describe("PortabilityPanel accessibility", () => {
  it("renders accessible verified history actions and truthfully disables them offline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { snapshots: [{ id: "10000000-0000-4000-a000-000000000001", status: "VERIFIED", structuralVersion: 4, sizeBytes: "100", requestedAt: "2026-08-30T00:00:00.000Z", verifiedAt: "2026-08-30T00:00:01.000Z", retentionUntil: "2026-11-30T00:00:00.000Z" }], artifacts: [], imports: [] } }) }));
    const view = render(<PortabilityPanel projectId="00000000-0000-4000-a000-000000000001" online={false} />);
    await waitFor(() => expect(screen.getByText("Unavailable offline")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Create verified snapshot" })).toBeDisabled(); expect(screen.getByRole("button", { name: "Export full project archive" })).toBeDisabled();
    const result = await axe.run(view.container); expect(result.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([]);
  });
});
