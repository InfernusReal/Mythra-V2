import { createHash } from "node:crypto";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { errors } from "@/lib/contracts/errors";
import type { Logger } from "@/lib/observability/logger";
import { recordOperationalEvent, type OperationalEventInput } from "@/lib/observability/operations";
import { requireWorkspaceRole } from "@/lib/security/authorization";
import { issueDestructiveConfirmation, previewDigest, verifyDestructiveConfirmation } from "@/lib/security/destructive-confirmation";
import type { OperationsRepository } from "./ports";

export class OperationsService {
  constructor(private readonly repository: OperationsRepository, private readonly logger: Logger, private readonly recoverySecret: string) {}

  async record(raw: OperationalEventInput): Promise<void> {
    const event = await recordOperationalEvent(this.repository, raw);
    // Console trace S16-TELEMETRY-001: accepted operational event records only typed identity, timing, and enum dimensions.
    this.logger.info("operations.event_recorded", { step: "S16-TELEMETRY-001", workspaceId: event.workspaceId, projectId: event.projectId ?? null, eventName: event.eventName, routeKey: event.routeKey ?? null, durationMs: event.durationMs ?? null, numericValue: event.numericValue ?? null });
  }

  async adminSnapshot(actor: SessionActor) {
    requireWorkspaceRole(actor, "ADMIN");
    const snapshot = await this.repository.adminSnapshot(actor);
    // Console trace S16-ADMIN-001: restricted admin read records bounded metadata counts and never author content.
    this.logger.info("operations.admin_snapshot_read", { step: "S16-ADMIN-001", workspaceId: actor.workspaceId, userId: actor.userId, jobCount: snapshot.jobs.length, auditCount: snapshot.audits.length, operationCount: snapshot.operations.length });
    return snapshot;
  }

  async previewOutboxRecovery(actor: SessionActor, targetId: string, now = Date.now()) {
    requireWorkspaceRole(actor, "ADMIN");
    if (!/^[0-9a-f-]{36}$/iu.test(targetId)) throw errors.validation();
    const digest = previewDigest({ workspaceId: actor.workspaceId, actionKey: "REQUEUE_OUTBOX", targetType: "OUTBOX_EVENT", targetId });
    const expiresAt = new Date(now + 5 * 60_000);
    const recovery = await this.repository.previewRecovery(actor, { actionKey: "REQUEUE_OUTBOX", targetId, previewDigest: digest, expiresAt });
    const token = issueDestructiveConfirmation({ workspaceId: actor.workspaceId, actorUserId: actor.userId, actionKey: "REQUEUE_OUTBOX", targetType: "OUTBOX_EVENT", targetId, previewDigest: digest }, this.recoverySecret, now);
    // Console trace S16-RECOVERY-001: recovery preview records stable target and expiry only; confirmation token is excluded.
    this.logger.info("operations.recovery_previewed", { step: "S16-RECOVERY-001", workspaceId: actor.workspaceId, userId: actor.userId, recoveryId: recovery.id, targetId, expiresAt: expiresAt.toISOString(), replayed: recovery.replayed });
    return { recoveryId: recovery.id, confirmationToken: token, expiresAt: expiresAt.toISOString(), requiredPhrase: "REQUEUE OUTBOX" as const };
  }

  async confirmOutboxRecovery(actor: SessionActor, input: { recoveryId: string; targetId: string; confirmationToken: string; phrase: string }, now = Date.now()) {
    requireWorkspaceRole(actor, "ADMIN");
    if (input.phrase !== "REQUEUE OUTBOX") throw errors.validation("The typed confirmation does not match.");
    const digest = previewDigest({ workspaceId: actor.workspaceId, actionKey: "REQUEUE_OUTBOX", targetType: "OUTBOX_EVENT", targetId: input.targetId });
    verifyDestructiveConfirmation(input.confirmationToken, actor, { actionKey: "REQUEUE_OUTBOX", targetType: "OUTBOX_EVENT", targetId: input.targetId, previewDigest: digest }, this.recoverySecret, now);
    const confirmationDigest = createHash("sha256").update(input.confirmationToken).digest("hex");
    const result = await this.repository.completeRecovery(actor, { recoveryId: input.recoveryId, confirmationDigest });
    if (!result.completed) throw errors.conflict("The recovery preview expired or was already used.");
    // Console trace S16-RECOVERY-002: completed recovery records stable identities and replay-safe outcome without token data.
    this.logger.info("operations.recovery_completed", { step: "S16-RECOVERY-002", workspaceId: actor.workspaceId, userId: actor.userId, recoveryId: input.recoveryId, targetId: input.targetId, completed: true });
    return result;
  }
}
