import { describe, expect, it } from "vitest";
import { deriveChapterText, normalizeChapterDocument } from "@/domains/writing/domain/chapter-document";

describe("ChapterDocument stress bounds", () => {
  it("validates and derives a 10,000-block document without loading another chapter", () => {
    const startedAt = performance.now();
    const content = Array.from({ length: 10_000 }, (_, index) => ({
      type: "paragraph" as const,
      attrs: { blockId: `00000000-0000-4000-8000-${index.toString().padStart(12, "0")}` },
      content: [{ type: "text" as const, text: `word-${index}` }]
    }));
    const document = normalizeChapterDocument({ schemaVersion: 1, type: "doc", content });
    const derived = deriveChapterText(document);

    expect(document.content).toHaveLength(10_000);
    expect(derived.wordCount).toBe(10_000);
    expect(derived.plainText).not.toContain("undefined");
    expect(performance.now() - startedAt).toBeLessThan(2_000);
  });
});
