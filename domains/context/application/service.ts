import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { Logger } from "@/lib/observability/logger";
import { recordOperationalEvent, type OperationalEventSink } from "@/lib/observability/operations";
import type { ContextRepository } from "./ports";
import { DeterministicContextResolver } from "../domain/resolver";
import { contextPreferenceMutationSchema, contextQuerySchema, contextSourceEditSchema } from "../domain/types";

export class ContextService {
  private readonly resolver = new DeterministicContextResolver();
  constructor(private readonly repository: ContextRepository, private readonly logger: Logger, private readonly operations?: OperationalEventSink) {}
  async get(actor: SessionActor, chapterId: string, raw: unknown, requestId: string) {
    const startedAt = performance.now();
    const query = contextQuerySchema.parse(raw); const snapshot = await this.repository.load(actor, chapterId, query); if (!snapshot) return null;
    const result = this.resolver.resolve(snapshot, query);
    const durationMs = Math.max(0, Math.round(performance.now() - startedAt));
    if (this.operations) await recordOperationalEvent(this.operations, { workspaceId: actor.workspaceId, actorUserId: actor.userId, eventName: "context.resolve", durationMs, numericValue: result.page.returnedCards, dimensions: { outcome: "success" } }).catch(() => undefined);
    // Console trace S16-OPS-003: server Context operations signal records timing/counts and stable identities without directive or card content.
    this.logger.info("operations.context_recorded", { step: "S16-OPS-003", requestId, workspaceId: actor.workspaceId, chapterId, durationMs, returnedCards: result.page.returnedCards, outcome: "success" });
    // Console trace S7-CONTEXT-001: bounded context and directive projections resolved with identifiers, counts, and versions only.
    this.logger.info("context.resolved", { step: "S7-CONTEXT-001", requestId, workspaceId: actor.workspaceId, projectId: snapshot.projectId, chapterId, structuralVersion: result.projectStructuralVersion, chapterVersion: result.chapterVersion, returnedCards: result.page.returnedCards, eligibleCards: result.page.totalEligibleCards, stabilityHash: result.contextKey, stale: result.directive.stale });
    return result;
  }
  async mutatePreference(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const mutation = contextPreferenceMutationSchema.parse(raw); const result = await this.repository.mutatePreference(actor, projectId, mutation);
    // Console trace S7-CONTEXT-002: user-scoped context preference committed without story or descriptor content.
    this.logger.info("context.preference_mutated", { step: "S7-CONTEXT-002", requestId, workspaceId: actor.workspaceId, projectId, action: mutation.action, mutedCount: result.mutedTypes.length, pinCount: result.pinCount, directiveEnabled: result.directiveEnabled });
    return result;
  }
  async editSource(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const input = contextSourceEditSchema.parse(raw); const result = await this.repository.editSource(actor, projectId, input);
    // Console trace S7-CONTEXT-003: safe inline source edit committed with versions only; edited author text is excluded.
    this.logger.info("context.source_edited", { step: "S7-CONTEXT-003", requestId, workspaceId: actor.workspaceId, projectId, sourceType: input.sourceType, sourceId: input.sourceId, sourceVersion: result.sourceVersion, structuralVersion: result.projectStructuralVersion });
    return result;
  }
  activeProviderIds(): string[] { return this.resolver.registry.activeProviderIds(); }
}
