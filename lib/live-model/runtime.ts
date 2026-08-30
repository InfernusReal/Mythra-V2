import { LiveModelService, LiveModelWorker } from "@/domains/live-model/application/service";
import { PrismaLiveModelRepository } from "@/domains/live-model/infrastructure/prisma-live-model-repository";
import { getPrisma } from "@/lib/db/prisma";
import { logger } from "@/lib/observability/logger";
import { noOpMetrics } from "@/lib/observability/metrics";

export function liveModelRepository(): PrismaLiveModelRepository {
  return new PrismaLiveModelRepository(getPrisma());
}

export function liveModelService(): LiveModelService {
  return new LiveModelService(liveModelRepository(), logger.child({ module: "live-model" }), noOpMetrics);
}

export function liveModelWorker(): LiveModelWorker {
  return new LiveModelWorker({ repository: liveModelRepository(), logger: logger.child({ module: "live-model-worker" }), metrics: noOpMetrics, now: () => new Date() });
}
