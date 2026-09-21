import { ContextService } from "@/domains/context/application/service";
import { PrismaContextRepository } from "@/domains/context/infrastructure/prisma-context-repository";
import { getPrisma } from "@/lib/db/prisma";
import { logger } from "@/lib/observability/logger";
import { PrismaOperationsRepository } from "@/domains/operations/infrastructure/prisma-operations-repository";

export function contextService(): ContextService { const prisma = getPrisma(); return new ContextService(new PrismaContextRepository(prisma), logger.child({ module: "context" }), new PrismaOperationsRepository(prisma)); }
