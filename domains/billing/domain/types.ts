import { z } from "zod";

export const billingPlanKeys = ["core", "intelligence"] as const;
export type BillingPlanKey = (typeof billingPlanKeys)[number];

export const sellableBillingPlanKeys = ["core"] as const;
export type SellableBillingPlanKey = (typeof sellableBillingPlanKeys)[number];

export const deterministicFeatureKeys = [
  "editor",
  "autosave",
  "recovery",
  "structure",
  "milestones",
  "causality",
  "contextualWritingField",
  "capture",
  "universe",
  "timeline",
  "research",
  "notes",
  "search",
  "language",
  "liveStoryModel",
  "revisionHistory",
  "automaticSnapshots",
  "restore",
  "import",
  "export"
] as const;
export type DeterministicFeatureKey = (typeof deterministicFeatureKeys)[number];

export const featureKeys = [...deterministicFeatureKeys, "storyIntelligence"] as const;
export type FeatureKey = (typeof featureKeys)[number];

export const usageResources = [
  "binaryStorageBytes",
  "snapshotBytes",
  "revisionStorageBytes",
  "exportGenerationBytes",
  "databaseRows",
  "bandwidthBytes",
  "futureAiUnits"
] as const;
export type UsageResource = (typeof usageResources)[number];

export const usageResourceSchema = z.enum(usageResources);

export const subscriptionStatuses = ["incomplete", "trialing", "active", "grace", "past_due", "canceled"] as const;
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

export interface PlanDefinition {
  key: BillingPlanKey;
  name: string;
  amountUsdCents: number;
  interval: "month";
  availability: "SELLABLE" | "FUTURE_ONLY";
  providerPriceRef: string | null;
}

export interface EntitlementSnapshot {
  workspaceId: string;
  planKey: BillingPlanKey;
  planName: string;
  subscriptionStatus: SubscriptionStatus;
  accessThrough: string | null;
  features: Readonly<Record<FeatureKey, boolean>>;
  limits: Readonly<Record<UsageResource, number>>;
  usage: Readonly<Record<UsageResource, number>>;
  stale: boolean;
  generatedAt: string;
}

export interface ProviderSubscriptionEvent {
  providerEventId: string;
  eventType: "subscription.created" | "subscription.updated" | "subscription.canceled";
  workspaceId: string;
  providerCustomerId: string;
  providerSubscriptionId: string;
  planKey: BillingPlanKey;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  providerVersion: bigint;
}

export const providerSubscriptionEventSchema = z.object({
  providerEventId: z.string().min(1).max(160),
  eventType: z.enum(["subscription.created", "subscription.updated", "subscription.canceled"]),
  workspaceId: z.string().uuid(),
  providerCustomerId: z.string().min(1).max(160),
  providerSubscriptionId: z.string().min(1).max(160),
  planKey: z.enum(billingPlanKeys),
  status: z.enum(subscriptionStatuses),
  currentPeriodStart: z.coerce.date().nullable(),
  currentPeriodEnd: z.coerce.date().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  providerVersion: z.coerce.bigint().nonnegative()
}).strict();

export const usageInputSchema = z.object({
  resource: usageResourceSchema,
  quantity: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  idempotencyKey: z.string().min(8).max(128),
  sourceType: z.string().trim().min(1).max(80),
  sourceId: z.string().trim().min(1).max(128).optional()
}).strict();

export type UsageInput = z.infer<typeof usageInputSchema>;
