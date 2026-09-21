import type { SessionActor } from "@/domains/accounts/domain/identity";

export interface EntityAutocompleteItem {
  id: string;
  typeId: string;
  label: string;
  aliases: string[];
}
export interface EntityAutocompleteProvider {
  suggest(
    actor: SessionActor,
    projectId: string,
    query: string,
    limit: number,
  ): Promise<EntityAutocompleteItem[]>;
}

export function boundedAutocompleteLimit(limit: number): number {
  return Math.min(20, Math.max(1, Math.trunc(limit)));
}
