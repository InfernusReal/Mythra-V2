import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { CausalityService } from "@/domains/causality/application/service";
import type { Logger } from "@/lib/observability/logger";
import type { CaptureRepository } from "./ports";
import { captureAttachmentSchema, captureConversionSchema, captureCreateSchema, captureLifecycleSchema, captureListSchema } from "../domain/types";
import { captureConversionRegistry } from "../domain/conversion-registry";

export class CaptureService {
  constructor(private readonly repository: CaptureRepository, private readonly logger: Logger, private readonly causality?: CausalityService) {}
  async create(actor: SessionActor, raw: unknown, requestId: string) { const input = captureCreateSchema.parse(raw); const result = await this.repository.create(actor, input);
    // Console trace S8-CAPTURE-001: raw Capture save completed with identity and coordinate metadata only; raw text is excluded.
    this.logger.info("capture.saved", { step: "S8-CAPTURE-001", requestId, workspaceId: actor.workspaceId, projectId: input.projectId, sourceId: result.capture.id, clientOperationId: input.clientCaptureId, chapterId: input.chapterId, hasBlockAnchor: Boolean(input.blockId), selectedLength: input.selectionAnchor === undefined ? 0 : input.selectionHead! - input.selectionAnchor, replayed: result.replayed }); return result; }
  async get(actor: SessionActor, projectId: string, captureId: string, requestId: string) { const result = await this.repository.get(actor, projectId, captureId);
    // Console trace S8-CAPTURE-007: one private Capture detail loaded with identity/version counts only.
    this.logger.info("capture.detail_loaded", { step: "S8-CAPTURE-007", requestId, workspaceId: actor.workspaceId, projectId, sourceId: captureId, version: result.capture.version, attachmentCount: result.capture.attachmentCount, conversionCount: result.capture.conversionCount }); return result; }
  async list(actor: SessionActor, projectId: string, raw: unknown, requestId: string) { const query = captureListSchema.parse(raw); const result = await this.repository.list(actor, projectId, query);
    // Console trace S8-CAPTURE-002: bounded private Capture inbox loaded with counts and lifecycle filter only.
    this.logger.info("capture.inbox_loaded", { step: "S8-CAPTURE-002", requestId, workspaceId: actor.workspaceId, projectId, lifecycle: query.lifecycle, returned: result.captures.length, hasMore: Boolean(result.nextCursor) }); return result; }
  async lifecycle(actor: SessionActor, projectId: string, raw: unknown, requestId: string) { const input = captureLifecycleSchema.parse(raw); const result = await this.repository.lifecycle(actor, projectId, input);
    // Console trace S8-CAPTURE-003: Capture lifecycle mutation completed without raw Capture content.
    this.logger.info("capture.lifecycle_mutated", { step: "S8-CAPTURE-003", requestId, workspaceId: actor.workspaceId, projectId, action: input.action, requested: input.captureIds.length, updated: result.updated }); return result; }
  async attach(actor: SessionActor, projectId: string, captureId: string, raw: unknown, requestId: string) { const input = captureAttachmentSchema.parse(raw); const result = await this.repository.attach(actor, projectId, captureId, input);
    // Console trace S8-CAPTURE-004: explicit Capture attachment completed with endpoint identity only.
    this.logger.info("capture.attached", { step: "S8-CAPTURE-004", requestId, workspaceId: actor.workspaceId, projectId, sourceId: captureId, targetType: input.targetType, targetId: input.targetId, replayed: result.replayed }); return result; }
  async detach(actor: SessionActor, projectId: string, captureId: string, attachmentId: string, requestId: string) { const result = await this.repository.detach(actor, projectId, captureId, attachmentId);
    // Console trace S8-CAPTURE-005: explicit Capture detachment completed with identities only.
    this.logger.info("capture.detached", { step: "S8-CAPTURE-005", requestId, workspaceId: actor.workspaceId, projectId, sourceId: captureId, attachmentId, detached: result.detached }); return result; }
  async convert(actor: SessionActor, projectId: string, captureId: string, raw: unknown, requestId: string) { const input = captureConversionSchema.parse(raw); captureConversionRegistry.ensureActive(input.conversionType); const result = await this.repository.convert(actor, projectId, captureId, input);
    let projectStructuralVersion = result.projectStructuralVersion;
    if (input.causalAction && input.conversionType === "CAPTURE_DERIVED_CAUSAL" && this.causality) { const derived = { type: "CAPTURE_DERIVED" as const, id: result.id }; const other = { type: input.causalAction.endpointType, id: input.causalAction.endpointId, ...(input.causalAction.endpointBlockId ? { blockId: input.causalAction.endpointBlockId } : {}) }; const relation = await this.causality.createRelation(actor, projectId, { expectedStructuralVersion: result.projectStructuralVersion, source: input.causalAction.direction === "THIS_CAUSES" ? derived : other, target: input.causalAction.direction === "THIS_CAUSES" ? other : derived, relationType: input.causalAction.relationType, strength: 1, importance: 50, state: "ACTIVE", isHard: false, temporalProgression: false, mutualStateSemantics: false, provenanceType: "CAPTURE_CONVERSION" }, requestId); projectStructuralVersion = relation.projectStructuralVersion; }
    // Console trace S8-CAPTURE-006: idempotent Capture conversion completed with target/provenance identities only.
    this.logger.info("capture.converted", { step: "S8-CAPTURE-006", requestId, workspaceId: actor.workspaceId, projectId, sourceId: captureId, conversionType: result.conversionType, targetType: result.targetType, targetId: result.targetId, replayed: result.replayed, causalRequested: Boolean(input.causalAction), structuralVersion: projectStructuralVersion }); return { ...result, projectStructuralVersion }; }
  activeConversionTypes() { return captureConversionRegistry.activeTypes(); }
}
