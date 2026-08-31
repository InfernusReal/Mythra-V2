import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { errors } from "@/lib/contracts/errors";
import type { BillingProviderAdapter, ProviderCheckoutResult } from "../application/ports";
import { providerSubscriptionEventSchema, type ProviderSubscriptionEvent } from "../domain/types";

const checkoutResponseSchema = z.object({ providerCustomerId: z.string().min(1).max(160), checkoutUrl: z.string().url(), expiresAt: z.string().datetime() }).strict();
const portalResponseSchema = z.object({ portalUrl: z.string().url(), expiresAt: z.string().datetime() }).strict();
const invoiceResponseSchema = z.array(z.object({ id: z.string().min(1).max(160), status: z.string().min(1).max(40), amountUsdCents: z.number().int().nonnegative(), issuedAt: z.string().datetime(), invoiceUrl: z.string().url().nullable() }).strict()).max(12);

function digestId(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

function verifiedSignature(rawBody: Uint8Array, signature: string, secret: string): void {
  const match = /^v1=([0-9a-f]{64})$/.exec(signature);
  if (!match) throw errors.forbidden();
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const actual = Buffer.from(match[1]!, "hex");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw errors.forbidden();
}

export function signFixtureWebhook(rawBody: Uint8Array, secret: string): string {
  return `v1=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
}

function parseProviderEvent(rawBody: Uint8Array): ProviderSubscriptionEvent {
  if (rawBody.byteLength > 256 * 1024) throw errors.validation("Billing webhook payload exceeds the accepted size.");
  try { return providerSubscriptionEventSchema.parse(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(rawBody))); }
  catch { throw errors.validation("Billing webhook payload is invalid."); }
}

export class FixtureBillingProviderAdapter implements BillingProviderAdapter {
  readonly provider = "FIXTURE" as const;
  constructor(private readonly webhookSecret: string, private readonly origin: string, private readonly now: () => Date = () => new Date()) {}

  async createCheckout(input: { workspaceId: string; userId: string; priceRef: string; successUrl: string; cancelUrl: string; idempotencyKey: string }): Promise<ProviderCheckoutResult> {
    const token = digestId(`${input.workspaceId}:${input.idempotencyKey}:${input.priceRef}`);
    return { providerCustomerId: `fixture_customer_${digestId(input.workspaceId)}`, checkoutUrl: `${this.origin}/app/settings/billing?fixtureCheckout=${token}`, expiresAt: new Date(this.now().getTime() + 15 * 60_000).toISOString() };
  }

  async createPortal(input: { providerCustomerId: string; returnUrl: string }): Promise<{ portalUrl: string; expiresAt: string }> {
    return { portalUrl: `${this.origin}/app/settings/billing?fixturePortal=${digestId(input.providerCustomerId)}`, expiresAt: new Date(this.now().getTime() + 5 * 60_000).toISOString() };
  }

  async listInvoices(): Promise<ReadonlyArray<{ id: string; status: string; amountUsdCents: number; issuedAt: string; invoiceUrl: string | null }>> { return []; }

  verifyWebhook(rawBody: Uint8Array, signature: string): ProviderSubscriptionEvent {
    verifiedSignature(rawBody, signature, this.webhookSecret);
    return parseProviderEvent(rawBody);
  }
}

export class HttpBillingProviderAdapter implements BillingProviderAdapter {
  readonly provider = "HTTP" as const;
  constructor(private readonly apiUrl: string, private readonly providerSecret: string, private readonly webhookSecret: string) {}

  private async request(path: string, body: unknown): Promise<unknown> {
    const response = await fetch(new URL(path, this.apiUrl), { method: "POST", headers: { authorization: `Bearer ${this.providerSecret}`, "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(8_000), cache: "no-store" });
    if (!response.ok) throw errors.dependencyUnavailable();
    return response.json();
  }

  async createCheckout(input: { workspaceId: string; userId: string; priceRef: string; successUrl: string; cancelUrl: string; idempotencyKey: string }): Promise<ProviderCheckoutResult> {
    return checkoutResponseSchema.parse(await this.request("/v1/checkouts", input));
  }

  async createPortal(input: { providerCustomerId: string; returnUrl: string }): Promise<{ portalUrl: string; expiresAt: string }> {
    return portalResponseSchema.parse(await this.request("/v1/portal", input));
  }

  async listInvoices(input: { providerCustomerId: string; limit: number }): Promise<ReadonlyArray<{ id: string; status: string; amountUsdCents: number; issuedAt: string; invoiceUrl: string | null }>> {
    return invoiceResponseSchema.parse(await this.request("/v1/invoices", input));
  }

  verifyWebhook(rawBody: Uint8Array, signature: string): ProviderSubscriptionEvent {
    verifiedSignature(rawBody, signature, this.webhookSecret);
    return parseProviderEvent(rawBody);
  }
}
