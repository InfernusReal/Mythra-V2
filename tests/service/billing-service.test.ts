import { beforeEach, describe, expect, it, vi } from "vitest";
import { BillingService } from "@/domains/billing/application/service";
import type { BillingProviderAdapter, BillingRepository, BillingState } from "@/domains/billing/application/ports";
import { createPlanCatalog, type BillingCatalogConfig } from "@/domains/billing/domain/catalog";
import { FixtureBillingProviderAdapter, signFixtureWebhook } from "@/domains/billing/infrastructure/provider-adapters";
import type { ProviderSubscriptionEvent, UsageInput, UsageResource } from "@/domains/billing/domain/types";
import { createLogger } from "@/lib/observability/logger";
import { InMemoryMetricsSink } from "@/lib/observability/metrics";

const actor = { userId: "20000000-0000-4000-a000-000000000001", workspaceId: "10000000-0000-4000-a000-000000000001", role: "OWNER" as const, sessionId: "session" };
const secret = "billing-webhook-secret-at-least-32-characters";
const config: BillingCatalogConfig = { coreAmountUsdCents: 1500, intelligenceAmountUsdCents: 2500, coreProviderPriceRef: "core-price", limits: { binaryStorageBytes: 100, snapshotBytes: 100, revisionStorageBytes: 100, exportGenerationBytes: 100, databaseRows: 100, bandwidthBytes: 100, futureAiUnits: 0 } };

class MemoryBillingRepository implements BillingRepository {
  state: BillingState = { providerCustomerId: null, providerSubscriptionId: null, planKey: "core", status: "incomplete", currentPeriodEnd: null, graceEndsAt: null, cancelAtPeriodEnd: false, providerVersion: 0n };
  usage: Partial<Record<UsageResource, number>> = {};
  events = new Set<string>();
  usageKeys = new Set<string>();
  async assertCanManageBilling() {}
  async readState() { return structuredClone(this.state); }
  async readUsage() { return structuredClone(this.usage); }
  async upsertCustomer(_actor: typeof actor, _provider: "FIXTURE" | "HTTP", providerCustomerId: string) { this.state.providerCustomerId = providerCustomerId; }
  async applyProviderEvent(event: ProviderSubscriptionEvent) { if (this.events.has(event.providerEventId)) return { replayed: true, outOfOrder: false }; this.events.add(event.providerEventId); const outOfOrder = this.state.providerVersion >= event.providerVersion; if (!outOfOrder) this.state = { providerCustomerId: event.providerCustomerId, providerSubscriptionId: event.providerSubscriptionId, planKey: event.planKey, status: event.status, currentPeriodEnd: event.currentPeriodEnd, graceEndsAt: event.status === "grace" ? event.currentPeriodEnd : null, cancelAtPeriodEnd: event.cancelAtPeriodEnd, providerVersion: event.providerVersion }; return { replayed: false, outOfOrder }; }
  async recordUsage(_workspaceId: string, input: UsageInput) { const key = `${input.resource}:${input.idempotencyKey}`; if (this.usageKeys.has(key)) return { replayed: true }; this.usageKeys.add(key); this.usage[input.resource] = (this.usage[input.resource] ?? 0) + input.quantity; return { replayed: false }; }
}

function webhook(version = 1n, status = "active" as const) { return { providerEventId: `event-${version}`, eventType: "subscription.updated", workspaceId: actor.workspaceId, providerCustomerId: "customer-1", providerSubscriptionId: "subscription-1", planKey: "core", status, currentPeriodStart: "2026-09-01T00:00:00.000Z", currentPeriodEnd: "2026-10-01T00:00:00.000Z", cancelAtPeriodEnd: false, providerVersion: String(version) }; }

describe("BillingService", () => {
  beforeEach(() => vi.spyOn(console, "log").mockImplementation(() => undefined));

  it("creates only Core checkout and gives the frontend the same complete entitlement keys", async () => {
    const repository = new MemoryBillingRepository(); const provider = new FixtureBillingProviderAdapter(secret, "http://127.0.0.1:3000"); const service = new BillingService(repository, provider, createPlanCatalog(config), config, createLogger({ service: "billing-test" }), new InMemoryMetricsSink(), () => new Date("2026-09-01T00:00:00Z"));
    const checkout = await service.createCheckout(actor, { planKey: "core", idempotencyKey: "checkout-key", successUrl: "http://127.0.0.1/success", cancelUrl: "http://127.0.0.1/cancel" });
    expect(checkout.checkoutUrl).toContain("fixtureCheckout");
    expect(repository.state.providerCustomerId).toContain("fixture_customer");
    await expect(service.createCheckout(actor, { planKey: "intelligence", idempotencyKey: "future-key", successUrl: "http://127.0.0.1/success", cancelUrl: "http://127.0.0.1/cancel" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const status = await service.status(actor);
    expect(status.catalog).toEqual(expect.arrayContaining([expect.objectContaining({ key: "core", amountUsdCents: 1500 }), expect.objectContaining({ key: "intelligence", availability: "FUTURE_ONLY" })]));
    expect(status.catalog.every((plan) => !("providerPriceRef" in plan))).toBe(true);
    expect(status.entitlements.features.storyIntelligence).toBe(false);
  });

  it("rejects non-admin billing mutations before invoking provider operations", async () => {
    const repository = new MemoryBillingRepository(); const base = new FixtureBillingProviderAdapter(secret, "http://127.0.0.1:3000"); const createCheckout = vi.spyOn(base, "createCheckout"); const createPortal = vi.spyOn(base, "createPortal"); const service = new BillingService(repository, base, createPlanCatalog(config), config, createLogger({ service: "billing-test" }), new InMemoryMetricsSink()); const member = { ...actor, role: "MEMBER" as const };
    await expect(service.createCheckout(member, { planKey: "core", idempotencyKey: "member", successUrl: "http://127.0.0.1/success", cancelUrl: "http://127.0.0.1/cancel" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(service.createPortal(member, "http://127.0.0.1/return")).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(createCheckout).not.toHaveBeenCalled(); expect(createPortal).not.toHaveBeenCalled();
  });

  it("processes signed webhooks idempotently and ignores older provider versions", async () => {
    const repository = new MemoryBillingRepository(); const metrics = new InMemoryMetricsSink(); const provider = new FixtureBillingProviderAdapter(secret, "http://127.0.0.1:3000"); const service = new BillingService(repository, provider, createPlanCatalog(config), config, createLogger({ service: "billing-test" }), metrics);
    const raw = new TextEncoder().encode(JSON.stringify(webhook(2n)));
    expect(await service.handleWebhook(raw, signFixtureWebhook(raw, secret), "request-1")).toEqual({ replayed: false, outOfOrder: false });
    expect(await service.handleWebhook(raw, signFixtureWebhook(raw, secret), "request-2")).toEqual({ replayed: true, outOfOrder: false });
    const old = new TextEncoder().encode(JSON.stringify(webhook(1n)));
    expect(await service.handleWebhook(old, signFixtureWebhook(old, secret), "request-3")).toEqual({ replayed: false, outOfOrder: true });
    expect(repository.state.providerVersion).toBe(2n);
    expect(metrics.points).toHaveLength(3);
  });

  it("meters cost drivers idempotently, blocks high-cost overage and exempts owned exports", async () => {
    const repository = new MemoryBillingRepository(); repository.state.status = "active"; const service = new BillingService(repository, new FixtureBillingProviderAdapter(secret, "http://127.0.0.1:3000"), createPlanCatalog(config), config, createLogger({ service: "billing-test" }), new InMemoryMetricsSink());
    expect(await service.recordUsage(actor, { resource: "snapshotBytes", quantity: 95, idempotencyKey: "snapshot:one", sourceType: "ProjectSnapshot" })).toEqual({ replayed: false });
    expect(await service.recordUsage(actor, { resource: "snapshotBytes", quantity: 95, idempotencyKey: "snapshot:one", sourceType: "ProjectSnapshot" })).toEqual({ replayed: true });
    await expect(service.authorizeCost(actor, "snapshotBytes", 6, "HIGH_COST_WRITE")).rejects.toMatchObject({ code: "QUOTA_EXCEEDED" });
    expect(await service.authorizeCost(actor, "snapshotBytes", Number.MAX_SAFE_INTEGER, "EXPORT_OWNED")).toEqual({ allowed: true, exempt: true });
    await expect(service.recordUsage(actor, { resource: "futureAiUnits", quantity: 1, idempotencyKey: "future:one", sourceType: "Future" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("degrades invoice refresh without degrading entitlement or writing access", async () => {
    const repository = new MemoryBillingRepository(); repository.state.providerCustomerId = "customer-1"; const base = new FixtureBillingProviderAdapter(secret, "http://127.0.0.1:3000"); const provider: BillingProviderAdapter = { ...base, provider: "FIXTURE", createCheckout: base.createCheckout.bind(base), createPortal: base.createPortal.bind(base), verifyWebhook: base.verifyWebhook.bind(base), listInvoices: async () => { throw new Error("provider down"); } };
    const service = new BillingService(repository, provider, createPlanCatalog(config), config, createLogger({ service: "billing-test" }), new InMemoryMetricsSink());
    const status = await service.status(actor);
    expect(status.providerAvailable).toBe(false);
    expect(status.entitlements.stale).toBe(true);
    expect(status.entitlements.features.editor).toBe(true);
    expect(status.invoices).toEqual([]);
  });
});
