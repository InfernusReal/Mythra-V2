import { describe, expect, it } from "vitest";
import { normalizeSearchText, scoreSearchResult } from "@/domains/search/domain/types";

describe("Search and Language stress", () => {
  it("scores 25,000 mixed projection documents repeatedly within the bounded source contract", () => {
    const documents = Array.from({ length: 25_000 }, (_, index) => ({ title: normalizeSearchText(index % 5 === 0 ? `Hero ${index}` : `Chapter ${index}`), text: normalizeSearchText(`Chapter ${index} contains ${index % 7 === 0 ? "hero return" : "ordinary context"}`), updatedAt: new Date(1_700_000_000_000 + index) }));
    const started = performance.now(); let matches = 0;
    for (const query of ["hero", "return", "chapter 24999", "ordinary context"]) for (const document of documents) { const result = scoreSearchResult({ normalizedQuery: query, normalizedTitle: document.title, normalizedText: document.text, aliases: [], currentContext: false, explicitReference: false, similarity: document.text.includes(query) ? 1 : 0, sourceUpdatedAt: document.updatedAt, now: new Date(1_800_000_000_000) }); if (result.score > 0) matches += 1; }
    const elapsed = performance.now() - started;
    expect(matches).toBeGreaterThan(25_000); expect(elapsed).toBeLessThan(2_000);
  });
});
