"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  localizedEnumLabel,
  localizedSearchResultTitle,
} from "@/lib/i18n/messages";

import type { SearchResult } from "@/domains/search/domain/types";

export function SearchPeek({
  result,
  onClose,
}: {
  result: SearchResult;
  onClose: () => void;
}) {
  const { messages } = useLocale();
  return (
    <section
      className="search-peek"
      role="dialog"
      aria-modal="false"
      aria-labelledby="search-peek-title"
    >
      <header>
        <div>
          <p className="eyebrow">{messages.peek}</p>
          <h3 id="search-peek-title">
            {localizedSearchResultTitle(messages, result)}
          </h3>
        </div>
        <button type="button" autoFocus onClick={onClose}>
          {messages.returnToResults}
        </button>
      </header>
      <p>{result.snippet || messages.noTextPreview}</p>
      <dl>
        <div>
          <dt>{messages.type}</dt>
          <dd>{localizedEnumLabel(messages, result.documentType)}</dd>
        </div>
        <div>
          <dt>{messages.match}</dt>
          <dd>
            {result.matchReasons
              .map((reason) => localizedEnumLabel(messages, reason))
              .join(", ")}
          </dd>
        </div>
        <div>
          <dt>{messages.freshness}</dt>
          <dd>{localizedEnumLabel(messages, result.freshness)}</dd>
        </div>
      </dl>
    </section>
  );
}
