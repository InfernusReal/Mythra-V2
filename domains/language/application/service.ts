import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { Logger } from "@/lib/observability/logger";
import { languageLookupSchema, normalizeLanguageTerm, vocabularyMutationSchema, type LanguageLookup } from "../domain/types";
import type { DictionaryProvider, VocabularyRepository } from "./ports";

export class LanguageService {
  constructor(private readonly dictionary: DictionaryProvider, private readonly vocabulary: VocabularyRepository, private readonly logger: Logger) {}

  async lookup(actor: SessionActor, projectId: string, raw: unknown, requestId: string): Promise<LanguageLookup> {
    const input = languageLookupSchema.parse(raw);
    const normalizedTerm = normalizeLanguageTerm(input.selection);
    const saved = await this.vocabulary.isSaved(actor, projectId, normalizedTerm, input.locale);
    try {
      const result = await this.dictionary.lookup(normalizedTerm, input.locale);
      const state = result.senses.length ? "READY" : "NOT_FOUND";
      // Console trace S10-LANGUAGE-001: dictionary lookup records outcome/counts only; selection, definitions and lexical content are excluded.
      this.logger.info("language.lookup_completed", { step: "S10-LANGUAGE-001", requestId, workspaceId: actor.workspaceId, projectId, state, senseCount: result.senses.length, antonymCount: result.antonyms.length, saved });
      return { state, term: input.selection, normalizedTerm, locale: input.locale, senses: result.senses, antonyms: result.antonyms, saved, ...(state === "NOT_FOUND" ? { message: "No deterministic dictionary entry was found." } : {}) };
    } catch (caught) {
      // Console trace S10-LANGUAGE-002: provider-local degradation records a safe cause class and never the selected text.
      this.logger.warn("language.provider_unavailable", { step: "S10-LANGUAGE-002", requestId, workspaceId: actor.workspaceId, projectId, causeName: caught instanceof Error ? caught.name : "Unknown" });
      return { state: "UNAVAILABLE", term: input.selection, normalizedTerm, locale: input.locale, senses: [], antonyms: [], saved, message: "Dictionary data is temporarily unavailable. Writing remains available." };
    }
  }

  async mutateVocabulary(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const input = vocabularyMutationSchema.parse(raw);
    const result = await this.vocabulary.mutate(actor, projectId, { ...input, normalizedTerm: normalizeLanguageTerm(input.term) });
    // Console trace S10-LANGUAGE-003: vocabulary mutation logs identity/version metadata only and excludes term/definition content.
    this.logger.info("language.vocabulary_mutated", { step: "S10-LANGUAGE-003", requestId, workspaceId: actor.workspaceId, projectId, action: input.action, saved: result.saved, version: result.version ?? 0 });
    return result;
  }

  async listVocabulary(actor: SessionActor, projectId: string, requestId: string) {
    const result = await this.vocabulary.list(actor, projectId, 100);
    // Console trace S10-LANGUAGE-004: saved vocabulary listing emits only the bounded count.
    this.logger.info("language.vocabulary_listed", { step: "S10-LANGUAGE-004", requestId, workspaceId: actor.workspaceId, projectId, count: result.length });
    return result;
  }
}
