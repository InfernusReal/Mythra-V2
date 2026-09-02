import { createHash } from "node:crypto";
import type { AppEnv } from "@/lib/env";

export interface FeatureFlagSnapshot {
  adminRecovery: boolean;
  operationalAnalytics: boolean;
  canaryEditorSave: boolean;
  canaryPercent: number;
}

function stableBucket(workspaceId: string): number {
  return Number.parseInt(createHash("sha256").update(workspaceId).digest("hex").slice(0, 8), 16) % 100;
}

export function featureFlags(env: AppEnv, workspaceId: string): FeatureFlagSnapshot {
  const canaryPercent = env.CANARY_EDITOR_SAVE_PERCENT;
  return Object.freeze({ adminRecovery: env.FEATURE_ADMIN_RECOVERY, operationalAnalytics: env.FEATURE_OPERATIONAL_ANALYTICS, canaryEditorSave: canaryPercent > 0 && stableBucket(workspaceId) < canaryPercent, canaryPercent });
}
