import { z } from "zod";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { Logger } from "@/lib/observability/logger";
import { recordOperationalEvent, type OperationalEventSink } from "@/lib/observability/operations";
import { searchQuerySchema } from "../domain/types";
import type { SearchProviderRegistry } from "../domain/provider-registry";
import type { CausalSearchReader, SearchRepository } from "./ports";

const causalActionSchema = z.object({
  endpointType: z.enum(["MILESTONE", "CHAPTER_OUTLINE", "SCENE", "NARRATIVE_INTENT", "MANUSCRIPT_BLOCK", "STORY_CHANGE", "CAPTURE_DERIVED", "ENTITY_STATE", "TIMELINE_EVENT"]),
  endpointId: z.string().uuid(),
  blockId: z.string().uuid().optional(),
  action: z.enum(["WHY", "DEPENDS"]),
}).strict();

export class SearchService {
  constructor(
    private readonly repository: SearchRepository,
    private readonly providers: SearchProviderRegistry,
    private readonly causality: CausalSearchReader,
    private readonly logger: Logger,
    private readonly operations?: OperationalEventSink,
  ) {}

  async query(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const startedAt = performance.now();
    const input = searchQuerySchema.parse(raw);
    const synchronized = await this.repository.synchronize(actor, projectId);
    const result = await this.repository.search(actor, projectId, input);
    const complete = { ...result, providerStates: this.providers.states(), synchronized };
    const durationMs = Math.max(0, Math.round(performance.now() - startedAt));
    if (this.operations) await recordOperationalEvent(this.operations, { workspaceId: actor.workspaceId, actorUserId: actor.userId, eventName: "search.request", durationMs, numericValue: complete.page.returned, dimensions: { outcome: "success" } }).catch(() => undefined);
    // Console trace S16-OPS-004: server Search operations signal records timing/counts and stable identities without query or result content.
    this.logger.info("operations.search_recorded", { step: "S16-OPS-004", requestId, workspaceId: actor.workspaceId, projectId, durationMs, returned: complete.page.returned, outcome: "success" });
    // Console trace S10-SEARCH-001: universal search completed with query-independent counts and provider states only.
    this.logger.info("search.query_completed", {
      step: "S10-SEARCH-001",
      requestId,
      workspaceId: actor.workspaceId,
      projectId,
      returned: complete.page.returned,
      total: complete.page.total,
      groupCount: complete.groups.length,
      synchronizedCount: synchronized.insertedOrUpdated,
      removedCount: synchronized.removed,
      capped: synchronized.capped,
    });
    return complete;
  }

  async causalAction(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const input = causalActionSchema.parse(raw);
    const result = await this.causality.getNeighborhood(actor, projectId, {
      endpointType: input.endpointType,
      endpointId: input.endpointId,
      ...(input.blockId ? { blockId: input.blockId } : {}),
      direction: input.action === "WHY" ? "UPSTREAM" : "DOWNSTREAM",
      states: ["ACTIVE"],
      maxDepth: 4,
      nodeBudget: 200,
      edgeBudget: 300,
      pathBudget: 200,
    }, requestId);
    // Console trace S10-SEARCH-002: explicit causal search action records endpoint identity and direction without query or authored content.
    this.logger.info("search.causal_action_completed", {
      step: "S10-SEARCH-002",
      requestId,
      workspaceId: actor.workspaceId,
      projectId,
      endpointType: input.endpointType,
      endpointId: input.endpointId,
      action: input.action,
    });
    return result;
  }
}
