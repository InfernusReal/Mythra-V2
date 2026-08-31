import "server-only";
import { BillingService } from "@/domains/billing/application/service";
import { createPlanCatalog, type BillingCatalogConfig } from "@/domains/billing/domain/catalog";
import { HttpBillingProviderAdapter, FixtureBillingProviderAdapter } from "@/domains/billing/infrastructure/provider-adapters";
import { PrismaBillingRepository } from "@/domains/billing/infrastructure/prisma-billing-repository";
import { getPrisma } from "@/lib/db/prisma";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/observability/logger";
import { noOpMetrics } from "@/lib/observability/metrics";

export function billingCatalogConfig(): BillingCatalogConfig {
  const env = getEnv();
  return {
    coreAmountUsdCents: env.BILLING_CORE_AMOUNT_USD_CENTS,
    intelligenceAmountUsdCents: env.BILLING_INTELLIGENCE_AMOUNT_USD_CENTS,
    coreProviderPriceRef: env.BILLING_CORE_PRICE_REF,
    intelligenceProviderPriceRef: env.BILLING_INTELLIGENCE_PRICE_REF,
    limits: {
      binaryStorageBytes: 5 * 1024 * 1024 * 1024,
      snapshotBytes: 10 * 1024 * 1024 * 1024,
      revisionStorageBytes: 5 * 1024 * 1024 * 1024,
      exportGenerationBytes: 2 * 1024 * 1024 * 1024,
      databaseRows: 5_000_000,
      bandwidthBytes: 20 * 1024 * 1024 * 1024,
      futureAiUnits: 0
    }
  };
}

export function billingService(): BillingService {
  const env = getEnv();
  const config = billingCatalogConfig();
  const provider = env.BILLING_PROVIDER === "http"
    ? new HttpBillingProviderAdapter(env.BILLING_PROVIDER_API_URL!, env.BILLING_PROVIDER_SECRET!, env.BILLING_WEBHOOK_SECRET!)
    : new FixtureBillingProviderAdapter(env.BILLING_WEBHOOK_SECRET ?? env.SESSION_SECRET, env.APP_ORIGIN);
  return new BillingService(new PrismaBillingRepository(getPrisma()), provider, createPlanCatalog(config), config, logger.child({ module: "billing" }), noOpMetrics);
}
