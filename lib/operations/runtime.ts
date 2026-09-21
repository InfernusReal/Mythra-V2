import { OperationsService } from "@/domains/operations/application/service";
import { PrismaOperationsRepository } from "@/domains/operations/infrastructure/prisma-operations-repository";
import { getPrisma } from "@/lib/db/prisma";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/observability/logger";

export function operationsRepository(): PrismaOperationsRepository {
  return new PrismaOperationsRepository(getPrisma());
}

export function operationsService(): OperationsService {
  const env = getEnv();
  return new OperationsService(operationsRepository(), logger.child({ module: "operations" }), env.ADMIN_RECOVERY_SECRET ?? env.SESSION_SECRET);
}

export async function recordGlobalAlertSignal(ruleKey: string, signal: number, occurredAt = new Date()): Promise<void> {
  await operationsRepository().recordGlobalAlertSignal(ruleKey, signal, occurredAt);
}
