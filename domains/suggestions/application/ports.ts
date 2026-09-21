import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { SuggestionCreateInput, SuggestionCreateResult, SuggestionReadModel, SuggestionResolveInput, SuggestionStatus } from "../domain/types";

export interface SuggestionRepository {
  create(actor: SessionActor, projectId: string, input: SuggestionCreateInput, correlationId: string): Promise<SuggestionCreateResult>;
  get(actor: SessionActor, projectId: string, suggestionId: string): Promise<SuggestionReadModel>;
  list(actor: SessionActor, projectId: string, query: { status?: SuggestionStatus; sourceAgent?: string; cursor?: { createdAt: Date; id: string }; limit: number }): Promise<{ suggestions: SuggestionReadModel[]; nextCursor: string | null }>;
  resolve(actor: SessionActor, projectId: string, suggestionId: string, input: SuggestionResolveInput, correlationId: string): Promise<SuggestionReadModel>;
}
