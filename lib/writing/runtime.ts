import { PrismaWritingRepository } from "@/domains/writing/infrastructure/prisma-writing-repository";
import { PrismaDurabilityRepository } from "@/domains/writing/infrastructure/prisma-durability-repository";
import { DurabilityService } from "@/domains/writing/application/durability";
import { WritingService } from "@/domains/writing/application/commands";
import { getPrisma } from "@/lib/db/prisma";
import { logger } from "@/lib/observability/logger";
import { PrismaContinuationRepository } from "@/domains/writing/infrastructure/prisma-continuation-repository";
import { ContinuationService } from "@/domains/writing/application/continuation";

export function writingService(): WritingService {
  return new WritingService(new PrismaWritingRepository(getPrisma()), logger.child({ module: "writing" }));
}

export function durabilityService(): DurabilityService {
  return new DurabilityService(new PrismaDurabilityRepository(getPrisma()), logger.child({ module: "writing-durability" }));
}

export function continuationService(): ContinuationService {
  return new ContinuationService(new PrismaContinuationRepository(getPrisma()), logger.child({ module: "writing-continuation" }));
}
