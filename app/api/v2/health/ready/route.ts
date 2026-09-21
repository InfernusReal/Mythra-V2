import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db/prisma";
import { readinessSnapshot } from "@/lib/operations/health";
import { logger } from "@/lib/observability/logger";
import { recordGlobalAlertSignal } from "@/lib/operations/runtime";

export async function GET() {
  const snapshot = await readinessSnapshot(getPrisma());
  await recordGlobalAlertSignal("database-saturation", snapshot.databaseSaturationPercent ?? 0).catch(() => undefined);
  // Console trace S16-HEALTH-001: readiness evaluation records dependency states and release identifier only.
  logger.info("operations.readiness_evaluated", { step: "S16-HEALTH-001", status: snapshot.status, databaseStatus: snapshot.database, databaseSaturationPercent: snapshot.databaseSaturationPercent, workerCompatibility: snapshot.workerCompatibility, releaseVersion: snapshot.releaseVersion });
  if (snapshot.databaseSaturationPercent !== null && snapshot.databaseSaturationPercent >= 85) {
    // Console trace S16-HEALTH-002: database-saturation alert signal records only the bounded connection percentage and release identity.
    logger.error("database.saturation", { step: "S16-HEALTH-002", status: "firing", databaseSaturationPercent: snapshot.databaseSaturationPercent, releaseVersion: snapshot.releaseVersion });
  }
  return NextResponse.json(snapshot, { status: snapshot.status === "ok" ? 200 : 503, headers: { "cache-control": "no-store" } });
}
