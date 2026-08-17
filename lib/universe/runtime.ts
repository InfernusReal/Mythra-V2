import { UniverseService } from "@/domains/universe/application/service";
import { PrismaUniverseRepository } from "@/domains/universe/infrastructure/prisma-universe-repository";
import { getPrisma } from "@/lib/db/prisma";
import { logger } from "@/lib/observability/logger";

export function universeService(): UniverseService {
  return new UniverseService(
    new PrismaUniverseRepository(getPrisma()),
    logger.child({ module: "universe" }),
  );
}
