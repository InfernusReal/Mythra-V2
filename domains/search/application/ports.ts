import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { SearchQuery, SearchReadModel } from "../domain/types";

export interface SearchRepository {
  synchronize(actor: SessionActor, projectId: string): Promise<{ insertedOrUpdated: number; removed: number; sourceCount: number; capped: boolean; projectStructuralVersion: number }>;
  search(actor: SessionActor, projectId: string, query: SearchQuery): Promise<Omit<SearchReadModel, "providerStates" | "synchronized">>;
}

export interface CausalSearchReader {
  getNeighborhood(actor: SessionActor, projectId: string, raw: unknown, requestId: string): Promise<unknown>;
}
