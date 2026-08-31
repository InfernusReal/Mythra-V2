import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { BillingPlanKey, ProviderSubscriptionEvent, SubscriptionStatus, UsageInput, UsageResource } from "../domain/types";

export interface BillingState {
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  planKey: BillingPlanKey;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  graceEndsAt: Date | null;
  cancelAtPeriodEnd: boolean;
  providerVersion: bigint;
}

export interface BillingRepository {
  assertCanManageBilling(actor: SessionActor): Promise<void>;
  readState(actor: SessionActor): Promise<BillingState>;
  readUsage(workspaceId: string, periodStart: Date): Promise<Readonly<Partial<Record<UsageResource, number>>>>;
  upsertCustomer(actor: SessionActor, provider: "FIXTURE" | "HTTP", providerCustomerId: string): Promise<void>;
  applyProviderEvent(event: ProviderSubscriptionEvent, provider: "FIXTURE" | "HTTP", payloadSha256: string, correlationId: string): Promise<{ replayed: boolean; outOfOrder: boolean }>;
  recordUsage(workspaceId: string, input: UsageInput): Promise<{ replayed: boolean }>;
}

export interface ProviderCheckoutResult {
  providerCustomerId: string;
  checkoutUrl: string;
  expiresAt: string;
}

export interface BillingProviderAdapter {
  readonly provider: "FIXTURE" | "HTTP";
  createCheckout(input: { workspaceId: string; userId: string; priceRef: string; successUrl: string; cancelUrl: string; idempotencyKey: string }): Promise<ProviderCheckoutResult>;
  createPortal(input: { providerCustomerId: string; returnUrl: string }): Promise<{ portalUrl: string; expiresAt: string }>;
  listInvoices(input: { providerCustomerId: string; limit: number }): Promise<ReadonlyArray<{ id: string; status: string; amountUsdCents: number; issuedAt: string; invoiceUrl: string | null }>>;
  verifyWebhook(rawBody: Uint8Array, signature: string): ProviderSubscriptionEvent;
}
