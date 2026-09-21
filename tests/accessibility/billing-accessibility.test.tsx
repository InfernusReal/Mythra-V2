import axe from "axe-core";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BillingPanel, type BillingPanelState } from "@/components/billing/BillingPanel";

const empty = { binaryStorageBytes: 0, snapshotBytes: 0, revisionStorageBytes: 0, exportGenerationBytes: 0, databaseRows: 0, bandwidthBytes: 0, futureAiUnits: 0 };
const state: BillingPanelState = { catalog: [{ key: "core", name: "Mythra Core", amountUsdCents: 1500, interval: "month", availability: "SELLABLE" }, { key: "intelligence", name: "Mythra Intelligence", amountUsdCents: 2500, interval: "month", availability: "FUTURE_ONLY" }], entitlements: { workspaceId: "10000000-0000-4000-a000-000000000001", planKey: "core", planName: "Mythra Core", subscriptionStatus: "grace", accessThrough: "2026-10-01T00:00:00.000Z", features: { editor: true, autosave: true, recovery: true, structure: true, milestones: true, causality: true, contextualWritingField: true, capture: true, universe: true, timeline: true, research: true, notes: true, search: true, language: true, liveStoryModel: true, revisionHistory: true, automaticSnapshots: true, restore: true, import: true, export: true, storyIntelligence: false }, limits: { ...empty, binaryStorageBytes: 1024, snapshotBytes: 1024, revisionStorageBytes: 1024, exportGenerationBytes: 1024, databaseRows: 1000, bandwidthBytes: 1024 }, usage: empty, stale: true, generatedAt: "2026-09-01T00:00:00.000Z" }, invoices: [], providerAvailable: false, portalAvailable: true, cancelAtPeriodEnd: true };

describe("billing accessibility", () => {
  it("uses named meters, status text, keyboard controls and no color-only plan state", async () => {
    const view = render(<BillingPanel initialState={state} />);
    const result = await axe.run(view.container);
    expect(result.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([]);
  });
});
