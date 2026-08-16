import { ContextService } from "@/domains/context/application/service";
import { PrismaContextRepository } from "@/domains/context/infrastructure/prisma-context-repository";
import { getPrisma } from "@/lib/db/prisma";
import { logger } from "@/lib/observability/logger";

export function contextService(): ContextService { return new ContextService(new PrismaContextRepository(getPrisma()), logger.child({ module: "context" })); }
