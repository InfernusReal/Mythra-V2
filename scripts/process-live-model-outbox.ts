import { hostname } from "node:os";
import { deterministicWorkerId } from "@/domains/live-model/application/service";
import { getPrisma } from "@/lib/db/prisma";
import { liveModelWorker } from "@/lib/live-model/runtime";
import { logger } from "@/lib/observability/logger";

const drain = process.argv.includes("--drain");
const workerId = deterministicWorkerId(hostname(), process.pid);
let batches = 0; let claimed = 0; let completed = 0; let failed = 0;

try {
  do {
    const result = await liveModelWorker().runBatch(workerId);
    batches += 1; claimed += result.claimed; completed += result.completed + result.duplicates; failed += result.retried + result.deadLettered;
    if (!drain || result.claimed === 0) break;
    if (batches >= 1_000) throw new Error("WORKER_DRAIN_BATCH_LIMIT");
  } while (true);
  // Console trace S12-WORKER-008: worker process exit reports bounded operational totals only.
  logger.info("live_model.worker_process_completed", { step: "S12-WORKER-008", workerId, batches, claimed, completed, failed });
} finally {
  await getPrisma().$disconnect();
}
