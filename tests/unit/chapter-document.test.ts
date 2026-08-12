import { describe, expect, it } from "vitest";
import { deriveChapterText, emptyChapterDocument, exceedsExplicitHardStop, normalizeChapterDocument, wordTargetDelta } from "@/domains/writing/domain/chapter-document";
import { migrateChapterDocument } from "@/domains/writing/domain/document-migrations";

describe("ChapterDocument v1", () => {
  it("creates stable block identity and derives Unicode words", () => {
    const document = emptyChapterDocument();
    document.content[0]!.content = [{ type: "text", text: "Hello \u4e16\u754c \u0645\u0631\u062d\u0628\u0627" }];
    expect(document.content[0]!.attrs.blockId).toMatch(/^[0-9a-f-]{36}$/);
    expect(deriveChapterText(document)).toEqual({ plainText: "Hello \u4e16\u754c \u0645\u0631\u062d\u0628\u0627", wordCount: 3 });
  });

  it("supports invisible story reference marks without changing visible text", () => {
    const document = emptyChapterDocument();
    document.content[0]!.content = [{
      type: "text",
      text: "Alias",
      marks: [{ type: "storyReference", attrs: { referenceId: "f14278a4-18d1-401f-9714-1ae313c1b4b0", referenceType: "entity" } }]
    }];
    expect(deriveChapterText(normalizeChapterDocument(document)).plainText).toBe("Alias");
  });

  it("rejects duplicate block IDs and unknown document versions", () => {
    const document = emptyChapterDocument();
    document.content.push({ ...document.content[0]! });
    expect(() => normalizeChapterDocument(document)).toThrow(/unique/);
    expect(() => migrateChapterDocument({ schemaVersion: 2, type: "doc", content: [] })).toThrow(/Unsupported/);
  });

  it("keeps word targets advisory and hard stops disabled unless explicitly configured", () => {
    expect(wordTargetDelta(800, null)).toBeNull();
    expect(wordTargetDelta(800, 1_000)).toBe(200);
    expect(wordTargetDelta(1_200, 1_000)).toBe(-200);
    expect(exceedsExplicitHardStop(10, 0, 100, null)).toBe(false);
    expect(exceedsExplicitHardStop(10, 5, 6, 10)).toBe(true);
    expect(exceedsExplicitHardStop(10, 5, 5, 10)).toBe(false);
  });
});
