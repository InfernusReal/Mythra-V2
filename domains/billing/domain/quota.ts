import { errors } from "@/lib/contracts/errors";
import type { EntitlementSnapshot, UsageResource } from "./types";

export interface QuotaDecision {
  resource: UsageResource;
  used: number;
  limit: number;
  requested: number;
  remaining: number;
  allowed: boolean;
}

export function decideQuota(snapshot: EntitlementSnapshot, resource: UsageResource, requested: number): QuotaDecision {
  if (!Number.isSafeInteger(requested) || requested < 0) throw errors.validation("Quota quantity must be a non-negative safe integer.");
  const used = snapshot.usage[resource];
  const limit = snapshot.limits[resource];
  const remaining = Math.max(0, limit - used);
  return { resource, used, limit, requested, remaining, allowed: requested <= remaining };
}

export function enforceCostQuota(snapshot: EntitlementSnapshot, resource: UsageResource, requested: number, action: string): QuotaDecision {
  const decision = decideQuota(snapshot, resource, requested);
  if (!decision.allowed) throw errors.quotaExceeded({ resource, used: decision.used, limit: decision.limit, requested, action });
  return decision;
}

export function isQuotaExemptAction(action: "READ" | "EXPORT_OWNED" | "CREATE" | "HIGH_COST_WRITE"): boolean {
  return action === "READ" || action === "EXPORT_OWNED";
}
