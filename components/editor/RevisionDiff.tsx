import { useLocale } from "@/components/i18n/LocaleProvider";
import type { ChapterDocument } from "@/domains/writing/domain/chapter-document";
import { deriveChapterText } from "@/domains/writing/domain/chapter-document";

export function RevisionDiff({
  localDocument,
  serverDocument,
}: {
  localDocument: ChapterDocument;
  serverDocument: ChapterDocument;
}) {
  const { messages } = useLocale();
  return (
    <div className="revision-compare" aria-label={messages.revisionComparison}>
      <article>
        <h3>{messages.localDraft}</h3>
        <pre>{deriveChapterText(localDocument).plainText}</pre>
      </article>
      <article>
        <h3>{messages.savedVersion}</h3>
        <pre>{deriveChapterText(serverDocument).plainText}</pre>
      </article>
    </div>
  );
}
