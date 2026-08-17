import type { SessionActor } from "@/domains/accounts/domain/identity";
import { dormantSearchDocumentTypes, type SearchDocumentType, type SearchProjectionDocument } from "./types";

export interface SearchProviderContext {
  actor: SessionActor;
  projectId: string;
  projectStructuralVersion: number;
  limit: number;
}

export interface SearchProvider {
  readonly types: readonly SearchDocumentType[];
  readonly state: "ACTIVE" | "DEPENDENCY_UNAVAILABLE";
  collect(context: SearchProviderContext): Promise<SearchProjectionDocument[]>;
}

export class SearchProviderRegistry {
  private readonly providers = new Map<SearchDocumentType, SearchProvider>();

  register(provider: SearchProvider): void {
    for (const type of provider.types) {
      if (this.providers.has(type)) throw new Error(`Search provider already registered for ${type}.`);
      this.providers.set(type, provider);
    }
  }

  provider(type: SearchDocumentType): SearchProvider | null {
    return this.providers.get(type) ?? null;
  }

  states(): Array<{ type: SearchDocumentType; state: "ACTIVE" | "DEPENDENCY_UNAVAILABLE" }> {
    return [...this.providers.entries()].map(([type, provider]) => ({ type, state: provider.state })).sort((left, right) => left.type.localeCompare(right.type));
  }
}

export function dormantS11SearchProvider(): SearchProvider {
  return {
    types: dormantSearchDocumentTypes,
    state: "DEPENDENCY_UNAVAILABLE",
    async collect() { return []; },
  };
}
