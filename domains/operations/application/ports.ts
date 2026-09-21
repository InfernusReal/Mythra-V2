import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { OperationalEvent, OperationalEventSink } from "@/lib/observability/operations";

export interface AdminOperationsSnapshot {
  actor: { userId: string; role: SessionActor["role"] };
  workspace: { id: string; planKey: string; archived: boolean; memberCount: number; projectCount: number };
  subscription: { planKey: string; status: string; graceEndsAt: string | null } | null;
  quotas: Array<{ resource: string; quantity: number }>;
  jobs: Array<{ id: string; jobType: string; status: string; attempts: number; errorCode: string | null; createdAt: string }>;
  exports: Array<{ id: string; format: string; scope: string; status: string; sizeBytes: number | null; createdAt: string }>;
  snapshots: Array<{ id: string; status: string; sizeBytes: number | null; createdAt: string }>;
  audits: Array<{ id: string; kind: string; targetType: string; targetId: string | null; correlationId: string; createdAt: string }>;
  operations: Array<{ eventName: string; routeKey: string | null; durationMs: number | null; numericValue: number | null; occurredAt: string }>;
  alerts: Array<{ key: string; state: "OK" | "FIRING"; observed: number; severity: "warning" | "critical"; runbook: string; evaluatedAt: string }>;
}

export interface OperationsRepository extends OperationalEventSink {
  record(input: OperationalEvent): Promise<void>;
  recordGlobalAlertSignal(ruleKey: string, signal: number, occurredAt?: Date): Promise<void>;
  deliverPendingAlerts(workerId: string, limit?: number, now?: Date): Promise<{ expired: number; claimed: number; delivered: number; retried: number }>;
  adminSnapshot(actor: SessionActor): Promise<AdminOperationsSnapshot>;
  previewRecovery(actor: SessionActor, input: { actionKey: "REQUEUE_OUTBOX"; targetId: string; previewDigest: string; expiresAt: Date }): Promise<{ id: string; replayed: boolean }>;
  completeRecovery(actor: SessionActor, input: { recoveryId: string; confirmationDigest: string }): Promise<{ completed: boolean }>;
}
