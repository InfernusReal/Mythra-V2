import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { Logger } from "@/lib/observability/logger";
import { decodeSuggestionCursor, suggestionCreateSchema, suggestionListSchema, suggestionResolveSchema } from "../domain/types";
import type { SuggestionRepository } from "./ports";

export class SuggestionService {
  constructor(private readonly repository: SuggestionRepository, private readonly logger: Logger) {}

  async create(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const input = suggestionCreateSchema.parse(raw);
    const result = await this.repository.create(actor, projectId, input, requestId);
    const suggestion = result.suggestion;
    // Console trace S17-SUGGESTION-001: proposal persistence logs stable identity, category, counts and confidence presence only.
    this.logger.info("suggestion.created", { step: "S17-SUGGESTION-001", requestId, workspaceId: actor.workspaceId, projectId, suggestionId: suggestion.id, category: suggestion.category, evidenceCount: suggestion.evidenceReferences.length, actionCount: suggestion.proposedActions.length, hasConfidence: suggestion.confidence !== null, replayed: result.replayed });
    return result;
  }

  async get(actor: SessionActor, projectId: string, suggestionId: string, requestId: string) {
    const suggestion = await this.repository.get(actor, projectId, suggestionId);
    // Console trace S17-SUGGESTION-002: one authorized proposal read logs identity and lifecycle metadata without authored fields.
    this.logger.info("suggestion.loaded", { step: "S17-SUGGESTION-002", requestId, workspaceId: actor.workspaceId, projectId, suggestionId, status: suggestion.status, version: suggestion.version });
    return suggestion;
  }

  async list(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const input = suggestionListSchema.parse(raw);
    const result = await this.repository.list(actor, projectId, {
      status: input.status,
      sourceAgent: input.sourceAgent,
      cursor: input.cursor ? decodeSuggestionCursor(input.cursor) : undefined,
      limit: input.limit,
    });
    // Console trace S17-SUGGESTION-003: bounded proposal page logs filters and counts without findings, notes, evidence or actions.
    this.logger.info("suggestion.page_loaded", { step: "S17-SUGGESTION-003", requestId, workspaceId: actor.workspaceId, projectId, status: input.status, hasAgentFilter: Boolean(input.sourceAgent), returned: result.suggestions.length, hasMore: Boolean(result.nextCursor) });
    return result;
  }

  async resolve(actor: SessionActor, projectId: string, suggestionId: string, raw: unknown, requestId: string) {
    const input = suggestionResolveSchema.parse(raw);
    const suggestion = await this.repository.resolve(actor, projectId, suggestionId, input, requestId);
    // Console trace S17-SUGGESTION-004: explicit author decision logs status, identity and version without the author note or proposed content.
    this.logger.info("suggestion.resolved", { step: "S17-SUGGESTION-004", requestId, workspaceId: actor.workspaceId, projectId, suggestionId, status: suggestion.status, version: suggestion.version, hasAuthorNote: suggestion.authorNote !== null });
    return suggestion;
  }
}
