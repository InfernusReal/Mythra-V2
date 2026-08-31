import { describe, expect, it } from "vitest";
import { assertCoreFeatureCompleteness, assertSellablePlan, buildEntitlementSnapshot, createPlanCatalog, type BillingCatalogConfig } from "@/domains/billing/domain/catalog";
import { decideQuota, enforceCostQuota, isQuotaExemptAction } from "@/domains/billing/domain/quota";
import { deterministicFeatureKeys, usageInputSchema } from "@/domains/billing/domain/types";

const config: BillingCatalogConfig = {
  coreAmountUsdCents: 1500,
  intelligenceAmountUsdCents: 2500,
  coreProviderPriceRef: "core-price",
  limits: { binaryStorageBytes: 100, snapshotBytes: 200, revisionStorageBytes: 300, exportGenerationBytes: 400, databaseRows: 500, bandwidthBytes: 600, futureAiUnits: 0 }
};

describe("billing catalog and quota invariants", () => {
  it("exposes one sellable USD 15 Core plan and dormant USD 25 Intelligence", () => {
    const catalog = createPlanCatalog(config);
    expect(catalog.core).toMatchObject({ amountUsdCents: 1500, availability: "SELLABLE" });
    expect(catalog.intelligence).toMatchObject({ amountUsdCents: 2500, availability: "FUTURE_ONLY", providerPriceRef: null });
    expect(() => assertSellablePlan(catalog.core)).not.toThrow();
    expect(() => assertSellablePlan(catalog.intelligence)).toThrow();
  });

  it("rejects stale commercial configurations", () => {
    expect(() => createPlanCatalog({ ...config, coreAmountUsdCents: 1000 })).toThrow(/USD 15/u);
    expect(() => createPlanCatalog({ ...config, intelligenceAmountUsdCents: 2400 })).toThrow(/USD 25/u);
    expect(() => createPlanCatalog({ ...config, coreProviderPriceRef: " " })).toThrow(/price reference/u);
  });

  it("enables every deterministic Core feature and never Intelligence", () => {
    const snapshot = buildEntitlementSnapshot({ workspaceId: "10000000-0000-4000-a000-000000000001", planKey: "core", planName: "Mythra Core", status: "active", accessThrough: new Date("2026-10-01T00:00:00Z"), limits: config.limits, usage: { snapshotBytes: 50 }, now: new Date("2026-09-01T00:00:00Z") });
    expect(deterministicFeatureKeys.every((key) => snapshot.features[key])).toBe(true);
    expect(snapshot.features.storyIntelligence).toBe(false);
    expect(snapshot.usage.snapshotBytes).toBe(50);
    expect(snapshot.usage.binaryStorageBytes).toBe(0);
    expect(() => assertCoreFeatureCompleteness(snapshot)).not.toThrow();
  });

  it("returns actionable cost decisions while exempting owned read and export", () => {
    const snapshot = buildEntitlementSnapshot({ workspaceId: "10000000-0000-4000-a000-000000000001", planKey: "core", planName: "Mythra Core", status: "grace", accessThrough: new Date("2026-10-01T00:00:00Z"), limits: config.limits, usage: { snapshotBytes: 190 }, now: new Date("2026-09-01T00:00:00Z") });
    expect(decideQuota(snapshot, "snapshotBytes", 10)).toMatchObject({ allowed: true, remaining: 10 });
    expect(() => enforceCostQuota(snapshot, "snapshotBytes", 11, "HIGH_COST_WRITE")).toThrowError(expect.objectContaining({ code: "QUOTA_EXCEEDED", safeDetails: { resource: "snapshotBytes", used: 190, limit: 200, requested: 11, action: "HIGH_COST_WRITE" } }));
    expect(isQuotaExemptAction("READ")).toBe(true);
    expect(isQuotaExemptAction("EXPORT_OWNED")).toBe(true);
    expect(isQuotaExemptAction("CREATE")).toBe(false);
    expect(() => decideQuota(snapshot, "snapshotBytes", -1)).toThrow();
  });

  it("accepts only non-negative bounded cost events and has no prose dimension", () => {
    expect(usageInputSchema.parse({ resource: "databaseRows", quantity: 1, idempotencyKey: "row:project:1", sourceType: "Project" }).quantity).toBe(1);
    expect(() => usageInputSchema.parse({ resource: "proseWords", quantity: 1, idempotencyKey: "prose:1", sourceType: "Chapter" })).toThrow();
    expect(() => usageInputSchema.parse({ resource: "databaseRows", quantity: -1, idempotencyKey: "row:project:1", sourceType: "Project" })).toThrow();
  });
});
