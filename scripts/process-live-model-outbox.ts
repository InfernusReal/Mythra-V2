import { hostname } from "node:os";
import { deterministicWorkerId } from "@/domains/live-model/application/service";
import { getPrisma } from "@/lib/db/prisma";
import { liveModelWorker } from "@/lib/live-model/runtime";
import { logger } from "@/lib/observability/logger";
import { recordGlobalAlertSignal } from "@/lib/operations/runtime";

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
  const pending = await getPrisma().outboxEvent.aggregate({ where: { status: "PENDING" }, _min: { createdAt: true } });
  const outboxLagMs = pending._min.createdAt ? Math.max(0, Date.now() - pending._min.createdAt.getTime()) : 0;
  await recordGlobalAlertSignal("outbox-lag", outboxLagMs).catch(() => undefined);
  // Console trace S16-OPS-008: worker job completion signal records bounded batch/outcome counts without event payloads.
  logger.info("job.completed", { step: "S16-OPS-008", workerId, jobType: "live_model_projection", batches, claimed, completed, failed, status: failed ? "partial" : "completed" });
  // Console trace S16-OPS-009: outbox-lag signal records only oldest pending age and worker identity.
  logger.info("outbox.lag", { step: "S16-OPS-009", workerId, durationMs: outboxLagMs, status: outboxLagMs >= 60_000 ? "warning" : "ok" });
  // Console trace S12-WORKER-008: worker process exit reports bounded operational totals only.
  logger.info("live_model.worker_process_completed", { step: "S12-WORKER-008", workerId, batches, claimed, completed, failed });
} finally {
  await getPrisma().$disconnect();
}
