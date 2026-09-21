import { errors } from "@/lib/contracts/errors";
import {
  deterministicFeatureKeys,
  featureKeys,
  usageResources,
  type BillingPlanKey,
  type EntitlementSnapshot,
  type PlanDefinition,
  type SubscriptionStatus,
  type UsageResource
} from "./types";

export interface BillingCatalogConfig {
  coreAmountUsdCents: number;
  intelligenceAmountUsdCents: number;
  coreProviderPriceRef: string;
  intelligenceProviderPriceRef?: string;
  limits: Readonly<Record<UsageResource, number>>;
}

export function createPlanCatalog(config: BillingCatalogConfig): Readonly<Record<BillingPlanKey, PlanDefinition>> {
  if (config.coreAmountUsdCents !== 1500) throw new Error("Mythra Core must remain configured at USD 15 for this decision version.");
  if (config.intelligenceAmountUsdCents !== 2500) throw new Error("Dormant Mythra Intelligence must remain configured at USD 25 for this decision version.");
  if (!config.coreProviderPriceRef.trim()) throw new Error("Mythra Core requires a provider price reference.");
  return Object.freeze({
    core: Object.freeze({ key: "core", name: "Mythra Core", amountUsdCents: config.coreAmountUsdCents, interval: "month", availability: "SELLABLE", providerPriceRef: config.coreProviderPriceRef }),
    intelligence: Object.freeze({ key: "intelligence", name: "Mythra Intelligence", amountUsdCents: config.intelligenceAmountUsdCents, interval: "month", availability: "FUTURE_ONLY", providerPriceRef: config.intelligenceProviderPriceRef ?? null })
  });
}

export function assertSellablePlan(plan: PlanDefinition): asserts plan is PlanDefinition & { key: "core"; availability: "SELLABLE" } {
  if (plan.key !== "core" || plan.availability !== "SELLABLE") throw errors.forbidden();
}

export function buildEntitlementSnapshot(input: {
  workspaceId: string;
  planKey: BillingPlanKey;
  planName: string;
  status: SubscriptionStatus;
  accessThrough: Date | null;
  limits: Readonly<Record<UsageResource, number>>;
  usage: Readonly<Partial<Record<UsageResource, number>>>;
  stale?: boolean;
  now: Date;
}): EntitlementSnapshot {
  const deterministic = Object.fromEntries(deterministicFeatureKeys.map((key) => [key, input.planKey === "core"])) as Record<(typeof deterministicFeatureKeys)[number], boolean>;
  const features = Object.freeze({ ...deterministic, storyIntelligence: false }) as Readonly<Record<(typeof featureKeys)[number], boolean>>;
  const usage = Object.freeze(Object.fromEntries(usageResources.map((resource) => [resource, input.usage[resource] ?? 0]))) as Readonly<Record<UsageResource, number>>;
  return Object.freeze({
    workspaceId: input.workspaceId,
    planKey: input.planKey,
    planName: input.planName,
    subscriptionStatus: input.status,
    accessThrough: input.accessThrough?.toISOString() ?? null,
    features,
    limits: Object.freeze({ ...input.limits }),
    usage,
    stale: input.stale ?? false,
    generatedAt: input.now.toISOString()
  });
}

export function assertCoreFeatureCompleteness(snapshot: EntitlementSnapshot): void {
  if (snapshot.planKey !== "core") return;
  const unavailable = deterministicFeatureKeys.filter((key) => !snapshot.features[key]);
  if (unavailable.length) throw new Error(`Core entitlement omitted deterministic features: ${unavailable.join(",")}`);
  if (snapshot.features.storyIntelligence) throw new Error("Dormant Intelligence cannot be enabled in V2.");
}
