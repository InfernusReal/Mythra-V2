import { z } from "zod";
import { normalizeSearchText } from "@/domains/search/domain/types";

export const languageLookupSchema = z.object({
  selection: z.string().trim().min(1).max(160).refine((value) => value.split(/\s+/u).length <= 6, "Select at most six words."),
  locale: z.string().trim().min(2).max(35).default("en"),
}).strict();

export const vocabularyMutationSchema = z.object({
  action: z.enum(["SAVE", "REMOVE"]),
  term: z.string().trim().min(1).max(160),
  locale: z.string().trim().min(2).max(35).default("en"),
  definition: z.string().max(4_000).optional(),
  partOfSpeech: z.string().trim().max(64).optional(),
}).strict();

export interface LanguageSense {
  partOfSpeech: "noun" | "verb" | "adjective" | "adverb" | "other";
  definition: string;
  nuance: string | null;
  synonyms: string[];
  examples: string[];
}

export interface LanguageLookup {
  state: "READY" | "NOT_FOUND" | "UNAVAILABLE";
  term: string;
  normalizedTerm: string;
  locale: string;
  senses: LanguageSense[];
  antonyms: string[];
  saved: boolean;
  message?: string;
}

export function normalizeLanguageTerm(value: string): string {
  return normalizeSearchText(value).replaceAll(" ", "_");
}
