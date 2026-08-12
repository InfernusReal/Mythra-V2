import { PrismaWritingRepository } from "@/domains/writing/infrastructure/prisma-writing-repository";
import { WritingService } from "@/domains/writing/application/commands";
import { getPrisma } from "@/lib/db/prisma";
import { logger } from "@/lib/observability/logger";

export function writingService(): WritingService {
  return new WritingService(new PrismaWritingRepository(getPrisma()), logger.child({ module: "writing" }));
}
