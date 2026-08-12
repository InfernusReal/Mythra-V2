import { randomUUID } from "node:crypto";
import { z } from "zod";

const referenceMark = z.object({
  type: z.literal("storyReference"),
  attrs: z.object({ referenceId: z.string().uuid(), referenceType: z.string().min(1).max(80) })
});
const textNode = z.object({ type: z.literal("text"), text: z.string(), marks: z.array(referenceMark).optional() });
const paragraphNode = z.object({
  type: z.enum(["paragraph", "heading"]),
  attrs: z.object({ blockId: z.string().uuid(), level: z.number().int().min(1).max(3).optional() }),
  content: z.array(textNode).optional()
});
export const chapterDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  type: z.literal("doc"),
  content: z.array(paragraphNode)
});
export type ChapterDocument = z.infer<typeof chapterDocumentSchema>;

export function emptyChapterDocument(): ChapterDocument {
  return { schemaVersion: 1, type: "doc", content: [{ type: "paragraph", attrs: { blockId: randomUUID() } }] };
}

export function deriveChapterText(document: ChapterDocument): { plainText: string; wordCount: number } {
  const plainText = document.content.map((block) => block.content?.map((node) => node.text).join("") ?? "").join("\n");
  const words = plainText.trim() ? plainText.trim().split(/\s+/u) : [];
  return { plainText, wordCount: words.length };
}

export function wordTargetDelta(wordCount: number, targetWords: number | null): number | null {
  return targetWords === null ? null : targetWords - wordCount;
}

export function exceedsExplicitHardStop(currentLength: number, selectedLength: number, insertedLength: number, hardStop: number | null): boolean {
  return hardStop !== null && currentLength - selectedLength + insertedLength > hardStop;
}

export function normalizeChapterDocument(input: unknown): ChapterDocument {
  const parsed = chapterDocumentSchema.parse(input);
  const seen = new Set<string>();
  for (const block of parsed.content) {
    if (seen.has(block.attrs.blockId)) throw new Error("ChapterDocument blockId values must be unique.");
    seen.add(block.attrs.blockId);
  }
  return parsed;
}
