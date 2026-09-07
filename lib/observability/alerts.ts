import type { OperationalEvent } from "./operations";
import type { Logger } from "./logger";

export type AlertSeverity = "warning" | "critical";
export type AlertObservationPolicy = "COUNT_FAILURES" | "COUNT_EVENTS" | "LATEST_FAILURE" | "LATEST_VALUE";
export interface AlertRule { key: string; eventName: OperationalEvent["eventName"]; severity: AlertSeverity; threshold: number; windowMinutes: number; runbook: string; recoveryThreshold: number; observation: AlertObservationPolicy }
export interface AlertState { key: string; state: "OK" | "FIRING"; observed: number; severity: AlertSeverity; runbook: string }
export interface AlertObservation { observed: number; windowStartedAt: Date }
export interface AlertDeliveryInput extends AlertState { deliveryId: string; transitionVersion: number; scopeType: "global" | "workspace"; workspaceId: string | null; evaluatedAt: Date }
export interface AlertDelivery { deliver(input: AlertDeliveryInput): Promise<void> }

export const alertRules: readonly AlertRule[] = Object.freeze([
  { key: "save-failures", eventName: "writing.save", severity: "critical", threshold: 5, windowMinutes: 5, runbook: "docs/runbooks/incidents.md#save-failures", recoveryThreshold: 1, observation: "COUNT_FAILURES" },
  { key: "outbox-lag", eventName: "outbox.lag", severity: "warning", threshold: 60_000, windowMinutes: 5, runbook: "docs/runbooks/incidents.md#outbox-lag", recoveryThreshold: 10_000, observation: "LATEST_VALUE" },
  { key: "backup-failure", eventName: "backup.status", severity: "critical", threshold: 1, windowMinutes: 1_440, runbook: "docs/runbooks/backup-restore.md", recoveryThreshold: 0, observation: "LATEST_FAILURE" },
  { key: "auth-failures", eventName: "auth.failure", severity: "warning", threshold: 20, windowMinutes: 5, runbook: "docs/runbooks/incidents.md#authentication", recoveryThreshold: 5, observation: "COUNT_EVENTS" },
  { key: "storage-failures", eventName: "storage.failure", severity: "critical", threshold: 3, windowMinutes: 5, runbook: "docs/runbooks/incidents.md#storage", recoveryThreshold: 0, observation: "COUNT_EVENTS" },
  { key: "database-saturation", eventName: "database.saturation", severity: "critical", threshold: 85, windowMinutes: 5, runbook: "docs/runbooks/incidents.md#database", recoveryThreshold: 70, observation: "LATEST_VALUE" }
]);

export function alertSignalForOperationalEvent(rule: AlertRule, event: Pick<OperationalEvent, "eventName" | "dimensions" | "numericValue" | "durationMs">): number {
  if (event.eventName !== rule.eventName) return 0;
  if (rule.observation === "COUNT_FAILURES") return event.dimensions.outcome === "failure" ? 1 : 0;
  if (rule.observation === "COUNT_EVENTS") return 1;
  if (rule.observation === "LATEST_FAILURE") return event.dimensions.status === "failed" ? 1 : 0;
  return Math.max(0, Math.min(2_147_483_647, Math.round(event.numericValue ?? event.durationMs ?? 0)));
}

export function advanceAlertObservation(rule: AlertRule, signal: number, previous: AlertObservation | undefined, occurredAt: Date): AlertObservation {
  const boundedSignal = Math.max(0, Math.min(2_147_483_647, Math.round(signal)));
  if (rule.observation === "LATEST_FAILURE" || rule.observation === "LATEST_VALUE") return { observed: boundedSignal, windowStartedAt: occurredAt };
  if (!previous || occurredAt.getTime() - previous.windowStartedAt.getTime() >= rule.windowMinutes * 60_000) return { observed: boundedSignal, windowStartedAt: occurredAt };
  return { observed: Math.min(2_147_483_647, previous.observed + boundedSignal), windowStartedAt: previous.windowStartedAt };
}

export function evaluateAlert(rule: AlertRule, observed: number, previous: AlertState["state"] = "OK"): AlertState {
  const firing = previous === "FIRING" ? observed > rule.recoveryThreshold : observed >= rule.threshold;
  return { key: rule.key, state: firing ? "FIRING" : "OK", observed, severity: rule.severity, runbook: rule.runbook };
}

export class StructuredLogAlertDelivery implements AlertDelivery {
  constructor(private readonly logger: Logger) {}

  async deliver(input: AlertDeliveryInput): Promise<void> {
    const method = input.state === "OK" ? "info" : input.severity === "critical" ? "error" : "warn";
    // Console trace S18-ALERT-001: delivered alert transition records rule/state, bounded observation, scope, runbook and idempotent delivery coordinates only.
    this.logger[method]("operations.alert_transition_delivered", { step: "S18-ALERT-001", deliveryId: input.deliveryId, ruleKey: input.key, state: input.state, observed: input.observed, severity: input.severity, runbook: input.runbook, scopeType: input.scopeType, workspaceId: input.workspaceId, transitionVersion: input.transitionVersion, evaluatedAt: input.evaluatedAt.toISOString() });
  }
}
