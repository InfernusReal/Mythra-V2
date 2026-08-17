import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { LanguageSense } from "../domain/types";

export interface DictionaryProvider {
  lookup(term: string, locale: string): Promise<{ senses: LanguageSense[]; antonyms: string[] }>;
}

export interface VocabularyRepository {
  isSaved(actor: SessionActor, projectId: string, normalizedTerm: string, locale: string): Promise<boolean>;
  mutate(actor: SessionActor, projectId: string, input: { action: "SAVE" | "REMOVE"; term: string; normalizedTerm: string; locale: string; definition?: string; partOfSpeech?: string }): Promise<{ saved: boolean; version: number | null }>;
  list(actor: SessionActor, projectId: string, limit: number): Promise<Array<{ id: string; term: string; normalizedTerm: string; locale: string; definition: string | null; partOfSpeech: string | null; version: number; updatedAt: string }>>;
}
