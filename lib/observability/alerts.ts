import type { OperationalEvent } from "./operations";

export type AlertSeverity = "warning" | "critical";
export interface AlertRule { key: string; eventName: OperationalEvent["eventName"]; severity: AlertSeverity; threshold: number; windowMinutes: number; runbook: string; recoveryThreshold: number }
export interface AlertState { key: string; state: "OK" | "FIRING"; observed: number; severity: AlertSeverity; runbook: string }

export const alertRules: readonly AlertRule[] = Object.freeze([
  { key: "save-failures", eventName: "writing.save", severity: "critical", threshold: 5, windowMinutes: 5, runbook: "docs/runbooks/incidents.md#save-failures", recoveryThreshold: 1 },
  { key: "outbox-lag", eventName: "outbox.lag", severity: "warning", threshold: 60_000, windowMinutes: 5, runbook: "docs/runbooks/incidents.md#outbox-lag", recoveryThreshold: 10_000 },
  { key: "backup-failure", eventName: "backup.status", severity: "critical", threshold: 1, windowMinutes: 1_440, runbook: "docs/runbooks/backup-restore.md", recoveryThreshold: 0 },
  { key: "auth-failures", eventName: "auth.failure", severity: "warning", threshold: 20, windowMinutes: 5, runbook: "docs/runbooks/incidents.md#authentication", recoveryThreshold: 5 },
  { key: "storage-failures", eventName: "storage.failure", severity: "critical", threshold: 3, windowMinutes: 5, runbook: "docs/runbooks/incidents.md#storage", recoveryThreshold: 0 },
  { key: "database-saturation", eventName: "database.saturation", severity: "critical", threshold: 85, windowMinutes: 5, runbook: "docs/runbooks/incidents.md#database", recoveryThreshold: 70 }
]);

export function evaluateAlert(rule: AlertRule, observed: number, previous: AlertState["state"] = "OK"): AlertState {
  const firing = previous === "FIRING" ? observed > rule.recoveryThreshold : observed >= rule.threshold;
  return { key: rule.key, state: firing ? "FIRING" : "OK", observed, severity: rule.severity, runbook: rule.runbook };
}
