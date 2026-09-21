import { createHash } from "node:crypto";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { errors } from "@/lib/contracts/errors";
import type { Logger } from "@/lib/observability/logger";
import type { MetricsSink } from "@/lib/observability/metrics";
import { assertCoreFeatureCompleteness, assertSellablePlan, buildEntitlementSnapshot, type BillingCatalogConfig } from "../domain/catalog";
import { enforceCostQuota, isQuotaExemptAction } from "../domain/quota";
import type { BillingPlanKey, EntitlementSnapshot, UsageInput, UsageResource } from "../domain/types";
import type { BillingProviderAdapter, BillingRepository } from "./ports";

const sha256 = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");
const MONTH_MS = 30 * 24 * 60 * 60 * 1_000;

export class BillingService {
  constructor(
    private readonly repository: BillingRepository,
    private readonly provider: BillingProviderAdapter,
    private readonly catalog: Readonly<Record<BillingPlanKey, { key: BillingPlanKey; name: string; amountUsdCents: number; interval: "month"; availability: "SELLABLE" | "FUTURE_ONLY"; providerPriceRef: string | null }>>,
    private readonly config: BillingCatalogConfig,
    private readonly logger: Logger,
    private readonly metrics: MetricsSink,
    private readonly now: () => Date = () => new Date()
  ) {}

  private assertBillingManager(actor: SessionActor): void {
    if (actor.role !== "OWNER" && actor.role !== "ADMIN") throw errors.forbidden();
  }

  async entitlements(actor: SessionActor): Promise<EntitlementSnapshot> {
    const now = this.now();
    const state = await this.repository.readState(actor);
    const periodStart = new Date(now.getTime() - MONTH_MS);
    const usage = await this.repository.readUsage(actor.workspaceId, periodStart);
    const plan = this.catalog[state.planKey];
    const accessThrough = state.status === "grace" ? state.graceEndsAt : state.currentPeriodEnd;
    const snapshot = buildEntitlementSnapshot({ workspaceId: actor.workspaceId, planKey: state.planKey, planName: plan.name, status: state.status, accessThrough, limits: this.config.limits, usage, now });
    assertCoreFeatureCompleteness(snapshot);
    // Console trace S14-ENTITLEMENT-001: entitlement resolution reports only plan/status and bounded resource counts.
    this.logger.info("billing.entitlements_resolved", { step: "S14-ENTITLEMENT-001", workspaceId: actor.workspaceId, planKey: state.planKey, subscriptionStatus: state.status, usageResourceCount: Object.keys(snapshot.usage).length, featureCount: Object.keys(snapshot.features).length });
    return snapshot;
  }

  async status(actor: SessionActor) {
    const state = await this.repository.readState(actor);
    const entitlements = await this.entitlements(actor);
    let invoices: Awaited<ReturnType<BillingProviderAdapter["listInvoices"]>> = [];
    let providerAvailable = true;
    if (state.providerCustomerId) {
      try { invoices = await this.provider.listInvoices({ providerCustomerId: state.providerCustomerId, limit: 12 }); }
      catch { providerAvailable = false; }
    }
    // Console trace S14-STATUS-001: billing status completion excludes provider secrets and invoice line-item content.
    this.logger.info("billing.status_read", { step: "S14-STATUS-001", workspaceId: actor.workspaceId, subscriptionStatus: state.status, invoiceCount: invoices.length, providerAvailable });
    return { catalog: Object.values(this.catalog).map((plan) => ({ key: plan.key, name: plan.name, amountUsdCents: plan.amountUsdCents, interval: plan.interval, availability: plan.availability })), entitlements: { ...entitlements, stale: !providerAvailable }, invoices, providerAvailable, portalAvailable: Boolean(state.providerCustomerId), cancelAtPeriodEnd: state.cancelAtPeriodEnd };
  }

  async createCheckout(actor: SessionActor, input: { planKey: BillingPlanKey; idempotencyKey: string; successUrl: string; cancelUrl: string }) {
    this.assertBillingManager(actor);
    await this.repository.assertCanManageBilling(actor);
    const plan = this.catalog[input.planKey];
    assertSellablePlan(plan);
    // Console trace S14-CHECKOUT-001: checkout creation starts with stable workspace/plan identifiers only.
    this.logger.info("billing.checkout_started", { step: "S14-CHECKOUT-001", workspaceId: actor.workspaceId, planKey: plan.key });
    const result = await this.provider.createCheckout({ workspaceId: actor.workspaceId, userId: actor.userId, priceRef: plan.providerPriceRef!, successUrl: input.successUrl, cancelUrl: input.cancelUrl, idempotencyKey: input.idempotencyKey });
    await this.repository.upsertCustomer(actor, this.provider.provider, result.providerCustomerId);
    this.metrics.record({ name: "billing.checkout.created", value: 1, unit: "count", attributes: { planKey: plan.key, provider: this.provider.provider } });
    // Console trace S14-CHECKOUT-002: checkout completion records expiry but never a checkout URL or provider credential.
    this.logger.info("billing.checkout_created", { step: "S14-CHECKOUT-002", workspaceId: actor.workspaceId, planKey: plan.key, expiresAt: result.expiresAt });
    return { checkoutUrl: result.checkoutUrl, expiresAt: result.expiresAt };
  }

  async createPortal(actor: SessionActor, returnUrl: string) {
    this.assertBillingManager(actor);
    await this.repository.assertCanManageBilling(actor);
    const state = await this.repository.readState(actor);
    if (!state.providerCustomerId) throw errors.notFound();
    const result = await this.provider.createPortal({ providerCustomerId: state.providerCustomerId, returnUrl });
    // Console trace S14-PORTAL-001: provider portal creation logs workspace identity and expiry only.
    this.logger.info("billing.portal_created", { step: "S14-PORTAL-001", workspaceId: actor.workspaceId, expiresAt: result.expiresAt });
    return result;
  }

  async handleWebhook(rawBody: Uint8Array, signature: string, correlationId: string) {
    // Console trace S14-WEBHOOK-001: webhook verification starts with payload size/digest and never logs raw provider content or signature.
    this.logger.info("billing.webhook_received", { step: "S14-WEBHOOK-001", requestId: correlationId, provider: this.provider.provider, sizeBytes: rawBody.byteLength, payloadSha256: sha256(rawBody) });
    const event = this.provider.verifyWebhook(rawBody, signature);
    if (event.planKey === "intelligence" && event.status !== "incomplete" && event.status !== "canceled") throw errors.integrity();
    const result = await this.repository.applyProviderEvent(event, this.provider.provider, sha256(rawBody), correlationId);
    this.metrics.record({ name: "billing.webhook.processed", value: 1, unit: "count", attributes: { eventType: event.eventType, replayed: String(result.replayed), outOfOrder: String(result.outOfOrder) } });
    // Console trace S14-WEBHOOK-002: webhook completion reports stable event identity/state without payload content.
    this.logger.info("billing.webhook_processed", { step: "S14-WEBHOOK-002", requestId: correlationId, workspaceId: event.workspaceId, providerEventId: event.providerEventId, eventType: event.eventType, replayed: result.replayed, outOfOrder: result.outOfOrder });
    return result;
  }

  async recordUsage(actor: SessionActor, input: UsageInput) {
    if (input.resource === "futureAiUnits" && input.quantity > 0) throw errors.forbidden();
    const result = await this.repository.recordUsage(actor.workspaceId, input);
    // Console trace S14-USAGE-001: cost event records resource/count/source identity only and is idempotent.
    this.logger.info("billing.usage_recorded", { step: "S14-USAGE-001", workspaceId: actor.workspaceId, resource: input.resource, quantity: input.quantity, sourceType: input.sourceType, sourceId: input.sourceId ?? null, replayed: result.replayed });
    return result;
  }

  async authorizeCost(actor: SessionActor, resource: UsageResource, requested: number, action: "READ" | "EXPORT_OWNED" | "CREATE" | "HIGH_COST_WRITE") {
    if (isQuotaExemptAction(action)) {
      // Console trace S14-QUOTA-001: owned read/export bypass is explicit so quota cannot manufacture data lock-in.
      this.logger.info("billing.quota_exempt", { step: "S14-QUOTA-001", workspaceId: actor.workspaceId, resource, requested, action });
      return { allowed: true, exempt: true } as const;
    }
    const decision = enforceCostQuota(await this.entitlements(actor), resource, requested, action);
    // Console trace S14-QUOTA-002: successful cost guard reports bounded numeric decision facts only.
    this.logger.info("billing.quota_allowed", { step: "S14-QUOTA-002", workspaceId: actor.workspaceId, resource, requested, used: decision.used, limit: decision.limit, action });
    return { ...decision, exempt: false } as const;
  }
}
