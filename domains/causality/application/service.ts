import { z } from "zod";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { Logger } from "@/lib/observability/logger";
import { causalRelationLifecycleSchema, causalRelationWriteSchema, chronologyQuerySchema, endpointSchema, storyChangeWriteSchema, traversalQuerySchema } from "../domain/types";
import type { CausalityRepository } from "./ports";

export class CausalityService {
  constructor(private readonly repository: CausalityRepository, private readonly logger: Logger) {}

  async getOverview(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const input = z.object({ nodeBudget: z.coerce.number().int().optional(), edgeBudget: z.coerce.number().int().optional() }).parse(raw);
    const budget = { nodeBudget: Math.min(500, Math.max(1, input.nodeBudget ?? 200)), edgeBudget: Math.min(750, Math.max(0, input.edgeBudget ?? 300)) };
    const result = await this.repository.getOverview(actor, projectId, budget);
    // Console trace S6-TRAVERSAL-001: bounded causal overview resolved with aggregate counts only.
    this.logger.info("causality.overview_resolved", { step: "S6-TRAVERSAL-001", requestId, workspaceId: actor.workspaceId, projectId, found: Boolean(result), nodeCount: result?.page.returnedNodes ?? 0, edgeCount: result?.page.returnedEdges ?? 0 });
    return result;
  }

  async writeStoryChange(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const result = await this.repository.writeStoryChange(actor, projectId, storyChangeWriteSchema.parse(raw));
    // Console trace S6-CHANGE-001: Story Change committed without authored title, description or time values.
    this.logger.info("causality.story_change_written", { step: "S6-CHANGE-001", requestId, workspaceId: actor.workspaceId, projectId, storyChangeId: result.object.id, kind: result.object.kind, version: result.object.version, structuralVersion: result.projectStructuralVersion });
    return result;
  }

  async createRelation(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const result = await this.repository.createRelation(actor, projectId, causalRelationWriteSchema.parse(raw));
    // Console trace S6-RELATION-001: relation committed with discriminants, states and identities only.
    this.logger.info("causality.relation_created", { step: "S6-RELATION-001", requestId, workspaceId: actor.workspaceId, projectId, relationId: result.object.id, sourceType: result.object.source.type, targetType: result.object.target.type, relationType: result.object.relationType, state: result.object.state, hard: result.object.isHard, idempotent: Boolean(result.idempotent), structuralVersion: result.projectStructuralVersion });
    return result;
  }

  async lifecycleRelation(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const input = causalRelationLifecycleSchema.parse(raw);
    const result = await this.repository.lifecycleRelation(actor, projectId, input.action === "REATTACH" ? { ...input, source: input.source, target: input.target } : input);
    // Console trace S6-RELATION-002: explicit relation preservation choice committed without authored content.
    this.logger.info("causality.relation_lifecycle", { step: "S6-RELATION-002", requestId, workspaceId: actor.workspaceId, projectId, relationId: result.object.id, action: input.action, state: result.object.state, archived: Boolean(result.object.archivedAt), structuralVersion: result.projectStructuralVersion });
    return result;
  }

  private traversalInput(raw: unknown) {
    const input = traversalQuerySchema.parse(raw);
    return { endpoint: endpointSchema.parse({ type: input.endpointType, id: input.endpointId, ...(input.blockId ? { blockId: input.blockId } : {}) }), direction: input.direction, states: input.states, relationTypes: input.relationTypes, maxDepth: input.maxDepth, nodeBudget: input.nodeBudget, edgeBudget: input.edgeBudget, pathBudget: input.pathBudget };
  }

  async getNeighborhood(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const result = await this.repository.getNeighborhood(actor, projectId, this.traversalInput(raw));
    // Console trace S6-TRAVERSAL-002: neighborhood returned with budgets and aggregate provenance-safe facts.
    this.logger.info("causality.neighborhood_resolved", { step: "S6-TRAVERSAL-002", requestId, workspaceId: actor.workspaceId, projectId, nodeCount: result.nodeCount, edgeCount: result.edgeCount, pathCount: result.paths.length, truncated: result.truncated });
    return result;
  }

  async traceImpact(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const result = await this.repository.traceImpact(actor, projectId, this.traversalInput(raw));
    // Console trace S6-TRAVERSAL-003: impact trace returned with bounded counts and no inferred mutation.
    this.logger.info("causality.impact_resolved", { step: "S6-TRAVERSAL-003", requestId, workspaceId: actor.workspaceId, projectId, nodeCount: result.nodeCount, edgeCount: result.edgeCount, pathCount: result.paths.length, truncated: result.truncated });
    return result;
  }

  async validateChronology(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const input = chronologyQuerySchema.parse(raw); const result = await this.repository.validateChronology(actor, projectId, input.relationId);
    // Console trace S6-CHRONOLOGY-001: neutral chronology result recorded without authored time values or prose.
    this.logger.info("causality.chronology_validated", { step: "S6-CHRONOLOGY-001", requestId, workspaceId: actor.workspaceId, projectId, relationId: input.relationId, status: result.chronology.status, basis: result.chronology.basis, warningCount: result.chronology.warnings.length });
    return result;
  }
}
