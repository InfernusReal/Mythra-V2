import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BillingPanel,
  type BillingPanelState,
} from "@/components/billing/BillingPanel";

const state: BillingPanelState = {
  catalog: [
    {
      key: "core",
      name: "Mythra Core",
      amountUsdCents: 1500,
      interval: "month",
      availability: "SELLABLE",
    },
    {
      key: "intelligence",
      name: "Mythra Intelligence",
      amountUsdCents: 2500,
      interval: "month",
      availability: "FUTURE_ONLY",
    },
  ],
  entitlements: {
    workspaceId: "10000000-0000-4000-a000-000000000001",
    planKey: "core",
    planName: "Mythra Core",
    subscriptionStatus: "active",
    accessThrough: "2026-10-01T00:00:00.000Z",
    features: {
      editor: true,
      autosave: true,
      recovery: true,
      structure: true,
      milestones: true,
      causality: true,
      contextualWritingField: true,
      capture: true,
      universe: true,
      timeline: true,
      research: true,
      notes: true,
      search: true,
      language: true,
      liveStoryModel: true,
      revisionHistory: true,
      automaticSnapshots: true,
      restore: true,
      import: true,
      export: true,
      storyIntelligence: false,
    },
    limits: {
      binaryStorageBytes: 1024,
      snapshotBytes: 2048,
      revisionStorageBytes: 4096,
      exportGenerationBytes: 8192,
      databaseRows: 1000,
      bandwidthBytes: 16384,
      futureAiUnits: 0,
    },
    usage: {
      binaryStorageBytes: 512,
      snapshotBytes: 1024,
      revisionStorageBytes: 0,
      exportGenerationBytes: 0,
      databaseRows: 25,
      bandwidthBytes: 0,
      futureAiUnits: 0,
    },
    stale: false,
    generatedAt: "2026-09-01T00:00:00.000Z",
  },
  invoices: [],
  providerAvailable: true,
  portalAvailable: false,
  cancelAtPeriodEnd: false,
};

afterEach(() => vi.restoreAllMocks());

describe("BillingPanel", () => {
  it("shows Core price, all transparent cost meters and dormant Intelligence without feature lockout language", () => {
    render(<BillingPanel initialState={state} />);
    expect(
      screen.getByRole("heading", { name: "Mythra Core" }),
    ).toBeInTheDocument();
    expect(screen.getByText("$15.00/month")).toBeInTheDocument();
    expect(screen.getAllByRole("progressbar")).toHaveLength(7);
    expect(screen.getByRole("button", { name: "Future only" })).toBeDisabled();
    expect(
      screen.getByText(/not available, active, or charged/u),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Owned work stays readable and exportable/u),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to writing" }),
    ).toHaveAttribute("href", "/app");
  });

  it("keeps the page usable and states writing safety when the provider action fails", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: false,
          json: async () => ({
            error: {
              message:
                "Billing is temporarily unavailable. Writing remains available.",
            },
          }),
        }),
    );
    render(<BillingPanel initialState={state} />);
    fireEvent.click(screen.getByRole("button", { name: "Choose Core" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Writing remains available",
    );
    await waitFor(() =>
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("S14-UI-003"),
      ),
    );
    expect(
      screen.getByRole("link", { name: "Return to writing" }),
    ).toBeVisible();
  });

  it("truthfully presents stale provider status without disabling deterministic access", () => {
    render(
      <BillingPanel
        initialState={{
          ...state,
          providerAvailable: false,
          entitlements: { ...state.entitlements, stale: true },
        }}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Writing and owned exports remain available",
    );
    expect(screen.getByRole("button", { name: "Choose Core" })).toBeEnabled();
  });
});
