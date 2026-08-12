import { StructureService } from "@/domains/structure/application/service";
import { PrismaStructureRepository } from "@/domains/structure/infrastructure/prisma-structure-repository";
import { getPrisma } from "@/lib/db/prisma";
import { logger } from "@/lib/observability/logger";

export function structureService(): StructureService {
  return new StructureService(new PrismaStructureRepository(getPrisma()), logger.child({ module: "structure" }));
}

