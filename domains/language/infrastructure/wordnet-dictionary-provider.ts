import WordPOS, { type WordPosSense } from "wordpos";
import type { DictionaryProvider } from "../application/ports";
import type { LanguageSense } from "../domain/types";

const posLabels: Record<string, LanguageSense["partOfSpeech"]> = { n: "noun", v: "verb", a: "adjective", s: "adjective", r: "adverb" };

function displayWord(value: string): string { return value.replaceAll("_", " "); }
function unique(values: string[], limit: number): string[] { return [...new Set(values.map(displayWord).filter(Boolean))].sort((left, right) => left.localeCompare(right)).slice(0, limit); }

export class WordNetDictionaryProvider implements DictionaryProvider {
  private readonly wordpos = new WordPOS({ stopwords: false });
  private readonly cache = new Map<string, { senses: LanguageSense[]; antonyms: string[] }>();

  async lookup(term: string, locale: string) {
    if (!locale.toLocaleLowerCase("en").startsWith("en")) return { senses: [], antonyms: [] };
    const cached = this.cache.get(term);
    if (cached) return cached;
    const raw = (await this.wordpos.lookup(term)) as WordPosSense[];
    const senses = raw.slice(0, 8).map((sense): LanguageSense => ({
      partOfSpeech: posLabels[sense.pos] ?? "other",
      definition: sense.def,
      nuance: sense.lexName || null,
      synonyms: unique(sense.synonyms.filter((word) => word.toLocaleLowerCase("en") !== term.toLocaleLowerCase("en")), 12),
      examples: unique(sense.exp ?? [], 3),
    })).sort((left, right) => left.partOfSpeech.localeCompare(right.partOfSpeech) || left.definition.localeCompare(right.definition));
    const pointers = raw.flatMap((sense) => sense.ptrs.filter((pointer) => pointer.pointerSymbol === "!")).slice(0, 12);
    const antonymSenses = await Promise.all(pointers.map((pointer) => this.wordpos.seek(pointer.synsetOffset, pointer.pos).catch(() => null)));
    const antonyms = unique(antonymSenses.flatMap((sense) => sense?.synonyms ?? []), 16);
    const result = { senses, antonyms };
    if (this.cache.size >= 500) this.cache.delete(this.cache.keys().next().value as string);
    this.cache.set(term, result);
    return result;
  }
}
