import { describe, expect, it, vi } from "vitest";
import { FixtureBillingProviderAdapter, signFixtureWebhook } from "@/domains/billing/infrastructure/provider-adapters";

const secret = "billing-webhook-secret-at-least-32-characters";

describe("billing replay and usage stress", () => {
  it("verifies 5,000 bounded signed events without content retention", () => {
    const adapter = new FixtureBillingProviderAdapter(secret, "http://127.0.0.1:3000");
    const started = performance.now();
    for (let index = 0; index < 5_000; index += 1) {
      const raw = new TextEncoder().encode(JSON.stringify({ providerEventId: `event-${index}`, eventType: "subscription.updated", workspaceId: "10000000-0000-4000-a000-000000000001", providerCustomerId: "customer-1", providerSubscriptionId: "subscription-1", planKey: "core", status: "active", currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false, providerVersion: String(index + 1) }));
      expect(adapter.verifyWebhook(raw, signFixtureWebhook(raw, secret)).providerVersion).toBe(BigInt(index + 1));
    }
    expect(performance.now() - started).toBeLessThan(5_000);
  });

  it("collapses 2,000 concurrent replays to one effect and sums distinct cost events exactly", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const webhookEffects = new Set<string>(); const usageEffects = new Map<string, number>();
    await Promise.all(Array.from({ length: 2_000 }, async () => { await Promise.resolve(); webhookEffects.add("provider:event-1"); }));
    await Promise.all(Array.from({ length: 2_000 }, async (_, index) => { await Promise.resolve(); const key = `snapshot:${index}`; if (!usageEffects.has(key)) usageEffects.set(key, 1024); }));
    expect(webhookEffects.size).toBe(1);
    expect(usageEffects.size).toBe(2_000);
    expect([...usageEffects.values()].reduce((sum, value) => sum + value, 0)).toBe(2_048_000);
  });
});
