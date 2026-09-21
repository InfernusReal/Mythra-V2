import { describe, expect, it } from "vitest";
import { languageLookupSchema, normalizeLanguageTerm, vocabularyMutationSchema } from "@/domains/language/domain/types";
import { WordNetDictionaryProvider } from "@/domains/language/infrastructure/wordnet-dictionary-provider";

describe("Language domain", () => {
  it("normalizes bounded selections and rejects synonym-spam-sized phrases", () => {
    expect(normalizeLanguageTerm("Élan vital")).toBe("elan_vital");
    expect(languageLookupSchema.parse({ selection: "good" })).toMatchObject({ locale: "en" });
    expect(languageLookupSchema.safeParse({ selection: "one two three four five six seven" }).success).toBe(false);
    expect(vocabularyMutationSchema.safeParse({ action: "SAVE", term: "good", locale: "en" }).success).toBe(true);
  });
  it("returns deterministic local WordNet definitions, synonyms and antonyms", async () => {
    const provider = new WordNetDictionaryProvider();
    const first = await provider.lookup("good", "en"); const cached = await provider.lookup("good", "en");
    expect(first.senses.length).toBeGreaterThan(0); expect(first.senses.some((sense) => sense.synonyms.length > 0)).toBe(true); expect(first.antonyms.length).toBeGreaterThan(0); expect(cached).toBe(first);
    expect(await provider.lookup("good", "ur")).toEqual({ senses: [], antonyms: [] });
  });
});
