import { describe, expect, it } from "vitest";
import { FixtureBillingProviderAdapter, signFixtureWebhook } from "@/domains/billing/infrastructure/provider-adapters";

const secret = "billing-webhook-secret-at-least-32-characters";
const event = { providerEventId: "event-1", eventType: "subscription.updated", workspaceId: "10000000-0000-4000-a000-000000000001", providerCustomerId: "customer-1", providerSubscriptionId: "subscription-1", planKey: "core", status: "active", currentPeriodStart: "2026-09-01T00:00:00.000Z", currentPeriodEnd: "2026-10-01T00:00:00.000Z", cancelAtPeriodEnd: false, providerVersion: "1" };

describe("fixture billing provider", () => {
  it("verifies the exact raw webhook body and parses a bounded event", () => {
    const adapter = new FixtureBillingProviderAdapter(secret, "http://127.0.0.1:3000");
    const raw = new TextEncoder().encode(JSON.stringify(event));
    expect(adapter.verifyWebhook(raw, signFixtureWebhook(raw, secret))).toMatchObject({ providerEventId: "event-1", planKey: "core", status: "active", providerVersion: 1n });
    expect(() => adapter.verifyWebhook(new TextEncoder().encode(`${JSON.stringify(event)} `), signFixtureWebhook(raw, secret))).toThrow();
    expect(() => adapter.verifyWebhook(raw, "invalid")).toThrow();
  });

  it("creates deterministic short-lived fixture destinations without exposing secrets", async () => {
    const adapter = new FixtureBillingProviderAdapter(secret, "http://127.0.0.1:3000", () => new Date("2026-09-01T00:00:00Z"));
    const checkout = await adapter.createCheckout({ workspaceId: event.workspaceId, userId: "20000000-0000-4000-a000-000000000001", priceRef: "core", successUrl: "http://127.0.0.1/success", cancelUrl: "http://127.0.0.1/cancel", idempotencyKey: "checkout-key" });
    expect(checkout.checkoutUrl).toContain("fixtureCheckout=");
    expect(checkout.checkoutUrl).not.toContain(secret);
    expect(checkout.expiresAt).toBe("2026-09-01T00:15:00.000Z");
    expect((await adapter.createPortal({ providerCustomerId: checkout.providerCustomerId, returnUrl: "http://127.0.0.1/return" })).portalUrl).toContain("fixturePortal=");
    expect(await adapter.listInvoices()).toEqual([]);
  });
});
