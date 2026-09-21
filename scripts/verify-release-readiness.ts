import "dotenv/config";
import { alertRules, evaluateAlert } from "../lib/observability/alerts";
import { monthlyCostModel } from "../lib/operations/cost-model";
import { assertWorkerCompatibility, environmentProfiles } from "../lib/operations/environments";

const cost = monthlyCostModel({ writerCount: 500, databaseUsd: 240, objectStorageUsd: 80, bandwidthUsd: 120, workerUsd: 180, observabilityUsd: 130, snapshotCount: 2_000, snapshotBytes: 50_000_000_000 });
const rehearsed = alertRules.map((rule) => ({ key: rule.key, fired: evaluateAlert(rule, rule.threshold).state === "FIRING", recovered: evaluateAlert(rule, rule.recoveryThreshold, "FIRING").state === "OK" }));
assertWorkerCompatibility(1, Number(process.env.WORKER_SCHEMA_VERSION ?? 1));
if (Object.values(environmentProfiles).some((profile) => !profile.isolatedCredentials) || rehearsed.some((item) => !item.fired || !item.recovered)) throw new Error("Release readiness rehearsal failed.");
// Console trace S16-RELEASE-001: release rehearsal records environment, alert, worker, and aggregate cost facts only.
console.log(JSON.stringify({ level: "info", step: "S16-RELEASE-001", event: "operations.release_readiness_verified", environmentCount: Object.keys(environmentProfiles).length, alertCount: rehearsed.length, alertsFiredAndRecovered: true, workerSchemaVersion: Number(process.env.WORKER_SCHEMA_VERSION ?? 1), writerCount: 500, totalMonthlyUsd: cost.totalUsd, costPerWriterUsd: cost.costPerWriterUsd, costPerSnapshotUsd: cost.costPerSnapshotUsd, averageSnapshotBytes: cost.averageSnapshotBytes }));
