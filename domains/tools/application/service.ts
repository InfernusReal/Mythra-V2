import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { Logger } from "@/lib/observability/logger";
import { asAppError, errors } from "@/lib/contracts/errors";
import {
  agentToolDefinitions,
  agentToolPermission,
  backlinksToolSchema,
  causalRelationProposalSchema,
  chapterOutlineToolSchema,
  chapterTextToolSchema,
  entityListToolSchema,
  entityToolSchema,
  milestoneToolSchema,
  parseAgentToolArguments,
  projectMapToolSchema,
  storyChangeToolSchema,
  structurePatchProposalSchema,
  timelineWindowToolSchema,
  volumeOutlineToolSchema,
  type AgentToolName,
  type ToolPermissionLevel,
} from "../domain/contracts";
import { assertToolPermission } from "../domain/permissions";
import type {
  AgentToolAuditRepository,
  AgentToolReadModel,
  CaptureToolWriter,
  CausalityToolReader,
  NoteToolWriter,
  SearchToolReader,
  SuggestionToolService,
  UniverseToolReader,
} from "./ports";

export interface AgentToolDependencies {
  readModel: AgentToolReadModel;
  search: SearchToolReader;
  universe: UniverseToolReader;
  causality: CausalityToolReader;
  notes: NoteToolWriter;
  captures: CaptureToolWriter;
  suggestions: SuggestionToolService;
  audit: AgentToolAuditRepository;
  logger: Logger;
}

function resultMetadata(result: unknown): { resultCount?: number; truncated?: boolean } {
  if (!result || typeof result !== "object") return {};
  const record = result as Record<string, unknown>;
  const page = record.page && typeof record.page === "object" ? record.page as Record<string, unknown> : undefined;
  const resultCount = typeof page?.returned === "number" ? page.returned : Array.isArray(record.items) ? record.items.length : typeof record.nodeCount === "number" ? record.nodeCount : undefined;
  const truncated = typeof page?.truncated === "boolean" ? page.truncated : typeof record.truncated === "boolean" ? record.truncated : undefined;
  return { resultCount, truncated };
}

export class AgentToolService {
  constructor(private readonly dependencies: AgentToolDependencies) {}

  async list(actor: SessionActor, projectId: string, requestId: string) {
    await this.dependencies.readModel.authorize(actor, projectId);
    const tools = agentToolDefinitions();
    // Console trace S17-TOOLS-001: tool discovery records only the stable request identity and definition count.
    this.dependencies.logger.info("agent_tools.listed", { step: "S17-TOOLS-001", requestId, workspaceId: actor.workspaceId, projectId, toolCount: tools.length });
    return { tools };
  }

  async call(actor: SessionActor, projectId: string, grants: readonly ToolPermissionLevel[], name: AgentToolName, raw: unknown, requestId: string) {
    const startedAt = performance.now();
    const permission = agentToolPermission(name);
    try {
      assertToolPermission(grants, permission);
      if (name === "replace_prose_range") throw errors.forbidden();
      const input = parseAgentToolArguments(name, raw);
      let result: unknown;
      switch (name) {
        case "get_project_map": result = await this.dependencies.readModel.getProjectMap(actor, projectId, projectMapToolSchema.parse(input).perCollectionLimit); break;
        case "get_plot": result = await this.dependencies.readModel.getPlot(actor, projectId); break;
        case "get_volume_outline": result = await this.dependencies.readModel.getVolumeOutline(actor, projectId, volumeOutlineToolSchema.parse(input)); break;
        case "get_milestone": result = await this.dependencies.readModel.getMilestone(actor, projectId, milestoneToolSchema.parse(input)); break;
        case "get_chapter_outline": result = await this.dependencies.readModel.getChapterOutline(actor, projectId, chapterOutlineToolSchema.parse(input)); break;
        case "get_chapter_text": result = await this.dependencies.readModel.getChapterText(actor, projectId, chapterTextToolSchema.parse(input)); break;
        case "search_project": result = await this.dependencies.search.query(actor, projectId, input, requestId); break;
        case "get_entities": result = await this.dependencies.universe.list(actor, projectId, entityListToolSchema.parse(input), requestId); break;
        case "get_entity": result = await this.dependencies.universe.detail(actor, projectId, entityToolSchema.parse(input).entityId, requestId); break;
        case "get_timeline_window": result = await this.dependencies.readModel.getTimelineWindow(actor, projectId, timelineWindowToolSchema.parse(input)); break;
        case "get_backlinks": result = await this.dependencies.readModel.getBacklinks(actor, projectId, backlinksToolSchema.parse(input)); break;
        case "get_causal_neighborhood": result = await this.dependencies.causality.getNeighborhood(actor, projectId, input, requestId); break;
        case "trace_causal_impact": result = await this.dependencies.causality.traceImpact(actor, projectId, input, requestId); break;
        case "get_story_change": result = await this.dependencies.readModel.getStoryChange(actor, projectId, storyChangeToolSchema.parse(input).storyChangeId); break;
        case "create_suggestion": result = await this.dependencies.suggestions.create(actor, projectId, input, requestId); break;
        case "propose_structure_patch": {
          const proposal = structurePatchProposalSchema.parse(input);
          result = await this.dependencies.suggestions.create(actor, projectId, {
            sourceAgent: proposal.sourceAgent,
            idempotencyKey: proposal.idempotencyKey,
            category: "structure_patch",
            ...(proposal.targetId ? { targetType: proposal.targetType, targetId: proposal.targetId } : {}),
            finding: proposal.finding,
            evidenceReferences: proposal.evidenceReferences,
            proposedActions: [{ actionType: "structure_patch", ...(proposal.targetId ? { target: { type: proposal.targetType, id: proposal.targetId } } : {}), payload: { expectedStructuralVersion: proposal.expectedStructuralVersion, operations: proposal.operations } }],
            confidence: proposal.confidence,
          }, requestId);
          break;
        }
        case "create_note": {
          const confirmed = input as { authorConfirmed: true; idempotencyKey: string; title: string; body: string; tags: string[]; sourceCaptureId?: string };
          result = await this.dependencies.notes.write(actor, projectId, { title: confirmed.title, body: confirmed.body, tags: confirmed.tags, sourceCaptureId: confirmed.sourceCaptureId, toolIdempotencyKey: confirmed.idempotencyKey }, requestId);
          break;
        }
        case "create_capture": {
          const capture = { ...(input as Record<string, unknown>) };
          delete capture.authorConfirmed;
          result = await this.dependencies.captures.create(actor, { ...capture, projectId }, requestId);
          break;
        }
        case "propose_causal_relation": {
          const proposal = causalRelationProposalSchema.parse(input);
          result = await this.dependencies.suggestions.create(actor, projectId, {
            sourceAgent: proposal.sourceAgent,
            idempotencyKey: proposal.idempotencyKey,
            category: "causal_relation",
            targetType: proposal.source.type,
            targetId: proposal.source.id,
            sourceBlockId: proposal.source.blockId,
            finding: proposal.finding,
            evidenceReferences: proposal.evidenceReferences,
            proposedActions: [{ actionType: "causal_relation", target: proposal.target, payload: { expectedStructuralVersion: proposal.expectedStructuralVersion, source: proposal.source, target: proposal.target, relationType: proposal.relationType, condition: proposal.condition, strength: proposal.strength, importance: proposal.importance, state: proposal.state, isHard: proposal.isHard, temporalProgression: proposal.temporalProgression, mutualStateSemantics: proposal.mutualStateSemantics, note: proposal.note, provenanceType: proposal.provenanceType, provenanceNote: proposal.provenanceNote } }],
            confidence: proposal.confidence,
          }, requestId);
          break;
        }
        default: throw errors.validation("Unknown tool.");
      }
      const durationMs = Math.max(0, Math.round(performance.now() - startedAt));
      const metadata = resultMetadata(result);
      await this.dependencies.audit.record(actor, projectId, { toolName: name, permission, outcome: "SUCCESS", correlationId: requestId, durationMs, ...metadata });
      // Console trace S17-TOOLS-002: a successful tool invocation records permission, timing and bounded result metadata without arguments or authored output.
      this.dependencies.logger.info("agent_tools.call_completed", { step: "S17-TOOLS-002", requestId, workspaceId: actor.workspaceId, projectId, toolName: name, permission, durationMs, resultCount: metadata.resultCount, isTruncated: metadata.truncated });
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result, isError: false };
    } catch (caught) {
      const error = caught instanceof Error && caught.name === "ZodError" ? errors.validation() : asAppError(caught);
      const durationMs = Math.max(0, Math.round(performance.now() - startedAt));
      await this.dependencies.audit.record(actor, projectId, { toolName: name, permission, outcome: error.code === "FORBIDDEN" ? "DENIED" : "FAILED", correlationId: requestId, durationMs, errorCode: error.code }).catch(() => undefined);
      // Console trace S17-TOOLS-003: a failed or denied invocation records only stable routing, timing and safe error classification.
      this.dependencies.logger.warn("agent_tools.call_failed", { step: "S17-TOOLS-003", requestId, workspaceId: actor.workspaceId, projectId, toolName: name, permission, durationMs, errorCode: error.code, causeName: caught instanceof Error ? caught.name : "Unknown", causeCode: typeof caught === "object" && caught !== null && "code" in caught && typeof caught.code === "string" ? caught.code : undefined });
      throw error;
    }
  }
}
