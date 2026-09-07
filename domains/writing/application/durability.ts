import { z } from "zod";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { Logger } from "@/lib/observability/logger";
import { recordOperationalEvent, type OperationalEventSink } from "@/lib/observability/operations";
import { chapterDocumentSchema } from "../domain/chapter-document";
import type { ConflictResolutionResult, DraftConflictReadModel, DraftSaveAcknowledgement, DurabilityRepository } from "./durability-ports";

export const draftSaveInput = z.object({
  baseVersion: z.number().int().positive(),
  clientSaveId: z.string().uuid(),
  document: chapterDocumentSchema
}).strict();
export const checkpointInput = draftSaveInput.extend({ label: z.string().trim().min(1).max(240).optional() }).strict();
export const conflictResolutionInput = z.object({ resolution: z.enum(["KEEP_LOCAL", "KEEP_SERVER", "DUPLICATE_RECOVERY"]) }).strict();

export class DurabilityService {
  constructor(private readonly repository: DurabilityRepository, private readonly logger: Logger, private readonly billing?: { authorizeCost(actor: SessionActor, resource: "revisionStorageBytes", requested: number, action: "HIGH_COST_WRITE"): Promise<unknown>; recordUsage(actor: SessionActor, input: { resource: "revisionStorageBytes"; quantity: number; idempotencyKey: string; sourceType: string; sourceId?: string }): Promise<unknown> }, private readonly operations?: OperationalEventSink, private readonly isCanaryWorkspace: (workspaceId: string) => boolean = () => false) {}

  async save(actor: SessionActor, chapterId: string, input: unknown, requestId: string): Promise<DraftSaveAcknowledgement> {
    const parsed = draftSaveInput.parse(input);
    const startedAt = performance.now();
    let result: DraftSaveAcknowledgement;
    try {
      result = await this.repository.saveDraft(actor, chapterId, parsed);
    } catch (caught) {
      if (this.operations) await recordOperationalEvent(this.operations, { workspaceId: actor.workspaceId, actorUserId: actor.userId, eventName: "writing.save", durationMs: Math.max(0, Math.round(performance.now() - startedAt)), dimensions: { outcome: "failure" } }).catch(() => undefined);
      // Console trace S18-ALERT-002: rejected save emits only workspace/chapter identity and bounded timing before preserving the original failure.
      this.logger.warn("operations.save_failure_recorded", { step: "S18-ALERT-002", requestId, workspaceId: actor.workspaceId, chapterId, durationMs: Math.max(0, Math.round(performance.now() - startedAt)), outcome: "failure" });
      throw caught;
    }
    const durationMs = Math.max(0, Math.round(performance.now() - startedAt));
    const releaseStage = this.isCanaryWorkspace(actor.workspaceId) ? "editor_save_canary" : "editor_save_stable";
    if (this.operations) await recordOperationalEvent(this.operations, { workspaceId: actor.workspaceId, actorUserId: actor.userId, projectId: result.projectId, eventName: "writing.save", durationMs, dimensions: { outcome: "success", featureFlag: releaseStage } }).catch(() => undefined);
    // Console trace S16-OPS-001: durable-save operations signal records timing/outcome and stable identities without document data.
    this.logger.info("operations.save_recorded", { step: "S16-OPS-001", requestId, workspaceId: actor.workspaceId, chapterId, durationMs, outcome: "success", featureFlag: releaseStage });
    // Console trace S2-SAVE-001: acknowledged versioned draft save; document and prose are excluded.
    this.logger.info("draft.saved", { step: "S2-SAVE-001", requestId, workspaceId: actor.workspaceId, chapterId, version: result.version, clientSaveId: result.clientSaveId, idempotentReplay: result.idempotentReplay, wordCount: result.wordCount });
    return result;
  }

  async checkpoint(actor: SessionActor, chapterId: string, input: unknown, requestId: string) {
    const parsed = checkpointInput.parse(input);
    const sizeBytes = new TextEncoder().encode(JSON.stringify(parsed.document)).byteLength;
    await this.billing?.authorizeCost(actor, "revisionStorageBytes", sizeBytes, "HIGH_COST_WRITE");
    const result = await this.repository.checkpoint(actor, chapterId, parsed);
    if (!result.idempotentReplay && this.billing) {
      try {
        await this.billing.recordUsage(actor, { resource: "revisionStorageBytes", quantity: sizeBytes, idempotencyKey: `revision:${result.revisionId}`, sourceType: "ChapterRevision", sourceId: result.revisionId });
        // Console trace S14-METER-005: checkpoint storage accounting records bytes and revision identity without document content.
        this.logger.info("checkpoint.cost_accounted", { step: "S14-METER-005", workspaceId: actor.workspaceId, chapterId, revisionId: result.revisionId, quantity: sizeBytes });
      } catch {
        // Console trace S14-METER-006: metering failure does not invalidate a durable checkpoint already accepted by storage.
        this.logger.warn("checkpoint.cost_accounting_failed", { step: "S14-METER-006", workspaceId: actor.workspaceId, chapterId, revisionId: result.revisionId, quantity: sizeBytes, errorCode: "USAGE_ACCOUNTING_UNAVAILABLE" });
      }
    }
    // Console trace S2-CHECKPOINT-001: explicit checkpoint completed; label and document are excluded.
    this.logger.info("checkpoint.saved", { step: "S2-CHECKPOINT-001", requestId, workspaceId: actor.workspaceId, chapterId, revisionId: result.revisionId, version: result.version, idempotentReplay: result.idempotentReplay });
    return result;
  }

  async getConflict(actor: SessionActor, conflictId: string, requestId: string): Promise<DraftConflictReadModel | null> {
    const result = await this.repository.getConflict(actor, conflictId);
    // Console trace S2-CONFLICT-001: conflict variants resolved for an authorized actor; variant content is excluded from logs.
    this.logger.info("draft_conflict.read", { step: "S2-CONFLICT-001", requestId, workspaceId: actor.workspaceId, conflictId, found: Boolean(result), serverVersion: result?.serverVersion });
    return result;
  }

  async resolveConflict(actor: SessionActor, conflictId: string, input: unknown, requestId: string): Promise<ConflictResolutionResult> {
    const { resolution } = conflictResolutionInput.parse(input);
    const result = await this.repository.resolveConflict(actor, conflictId, resolution);
    if (this.operations) await recordOperationalEvent(this.operations, { workspaceId: actor.workspaceId, actorUserId: actor.userId, eventName: "conflict.detected", numericValue: 1, dimensions: { outcome: "resolved", action: resolution } }).catch(() => undefined);
    // Console trace S16-OPS-002: conflict recovery signal records resolution enum and stable identities without conflict variants.
    this.logger.info("operations.conflict_recorded", { step: "S16-OPS-002", requestId, workspaceId: actor.workspaceId, conflictId, outcome: "resolved", resolution });
    // Console trace S2-CONFLICT-002: author-selected conflict resolution completed; no variant content is emitted.
    this.logger.info("draft_conflict.resolved", { step: "S2-CONFLICT-002", requestId, workspaceId: actor.workspaceId, conflictId, chapterId: result.chapterId, version: result.version, resolution, recoveryChapterId: result.recoveryChapterId });
    return result;
  }
}
