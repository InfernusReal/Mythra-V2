import type { ChapterDocument } from "@/domains/writing/domain/chapter-document";
import { deriveChapterText } from "@/domains/writing/domain/chapter-document";

export function RevisionDiff({ localDocument, serverDocument }: { localDocument: ChapterDocument; serverDocument: ChapterDocument }) {
  return (
    <div className="revision-compare" aria-label="Revision comparison">
      <article><h3>Local draft</h3><pre>{deriveChapterText(localDocument).plainText}</pre></article>
      <article><h3>Saved version</h3><pre>{deriveChapterText(serverDocument).plainText}</pre></article>
    </div>
  );
}
