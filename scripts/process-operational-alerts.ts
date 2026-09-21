import "dotenv/config";
import { hostname } from "node:os";
import { getPrisma } from "@/lib/db/prisma";
import { operationsRepository } from "@/lib/operations/runtime";

const workerId = `${hostname()}:${process.pid}:operational-alerts`;
try {
  const result = await operationsRepository().deliverPendingAlerts(workerId, 50);
  // Console trace S18-ALERT-003: bounded alert worker completion records only expiry, claim, delivery and retry counts.
  console.log(JSON.stringify({ level: result.retried ? "warn" : "info", step: "S18-ALERT-003", event: "operations.alert_worker_completed", workerId, expiredCount: result.expired, claimedCount: result.claimed, deliveredCount: result.delivered, retriedCount: result.retried }));
} finally {
  await getPrisma().$disconnect();
}
