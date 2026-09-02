import type { PrismaClient } from "@/app/generated/prisma/client";
import { getEnv } from "@/lib/env";
import { assertWorkerCompatibility } from "./environments";

export interface HealthSnapshot { status: "ok" | "degraded"; releaseVersion: string; database: "ok" | "unavailable"; databaseSaturationPercent: number | null; workerCompatibility: "ok" | "incompatible" }

export async function readinessSnapshot(prisma: PrismaClient): Promise<HealthSnapshot> {
  const env = getEnv();
  let database: HealthSnapshot["database"] = "ok";
  let databaseSaturationPercent: number | null = null;
  let workerCompatibility: HealthSnapshot["workerCompatibility"] = "ok";
  try {
    const rows = await prisma.$queryRaw<Array<{ activeConnections: bigint; maxConnections: bigint }>>`SELECT (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database())::bigint AS "activeConnections", current_setting('max_connections')::bigint AS "maxConnections"`;
    const row = rows[0];
    if (!row || row.maxConnections <= 0n) throw new Error("Database capacity is unavailable.");
    databaseSaturationPercent = Math.min(100, Math.round(Number(row.activeConnections * 10_000n / row.maxConnections) / 100));
  } catch { database = "unavailable"; }
  try { assertWorkerCompatibility(1, env.WORKER_SCHEMA_VERSION); } catch { workerCompatibility = "incompatible"; }
  return { status: database === "ok" && databaseSaturationPercent !== null && databaseSaturationPercent < 85 && workerCompatibility === "ok" ? "ok" : "degraded", releaseVersion: env.RELEASE_VERSION, database, databaseSaturationPercent, workerCompatibility };
}
