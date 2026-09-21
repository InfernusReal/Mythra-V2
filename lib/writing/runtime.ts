import { PrismaWritingRepository } from "@/domains/writing/infrastructure/prisma-writing-repository";
import { PrismaDurabilityRepository } from "@/domains/writing/infrastructure/prisma-durability-repository";
import { DurabilityService } from "@/domains/writing/application/durability";
import { WritingService } from "@/domains/writing/application/commands";
import { getPrisma } from "@/lib/db/prisma";
import { logger } from "@/lib/observability/logger";
import { PrismaContinuationRepository } from "@/domains/writing/infrastructure/prisma-continuation-repository";
import { ContinuationService } from "@/domains/writing/application/continuation";
import { billingService } from "@/lib/billing/runtime";
import { PrismaOperationsRepository } from "@/domains/operations/infrastructure/prisma-operations-repository";
import { getEnv } from "@/lib/env";
import { featureFlags } from "@/lib/operations/feature-flags";

export function writingService(): WritingService {
  return new WritingService(new PrismaWritingRepository(getPrisma()), logger.child({ module: "writing" }), billingService());
}

export function durabilityService(): DurabilityService {
  const prisma = getPrisma();
  return new DurabilityService(new PrismaDurabilityRepository(prisma), logger.child({ module: "writing-durability" }), billingService(), new PrismaOperationsRepository(prisma), (workspaceId) => featureFlags(getEnv(), workspaceId).canaryEditorSave);
}

export function continuationService(): ContinuationService {
  return new ContinuationService(new PrismaContinuationRepository(getPrisma()), logger.child({ module: "writing-continuation" }));
}
