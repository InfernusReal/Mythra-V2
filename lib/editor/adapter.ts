import type { JSONContent } from "@tiptap/core";
import { normalizeChapterDocument, type ChapterDocument } from "@/domains/writing/domain/chapter-document";

export interface MythraEditorAdapter {
  toEngine(document: ChapterDocument): JSONContent;
  fromEngine(content: JSONContent): ChapterDocument;
}

export const tiptapAdapter: MythraEditorAdapter = {
  toEngine: (document) => ({ type: document.type, content: document.content }),
  fromEngine: (content) => normalizeChapterDocument({
    schemaVersion: 1,
    type: "doc",
    content: (content.content ?? []).map((node) => ({
      ...node,
      attrs: { ...node.attrs, blockId: typeof node.attrs?.blockId === "string" ? node.attrs.blockId : crypto.randomUUID() }
    }))
  })
};
