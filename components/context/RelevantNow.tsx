"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  formatNumber,
  interpolateMessage,
  localizedEnumLabelOrValue,
} from "@/lib/i18n/messages";

import type { NarrativeDirectiveProjection } from "@/domains/context/domain/types";

export function RelevantNow({
  directive,
  onPeek,
}: {
  directive: NarrativeDirectiveProjection;
  onPeek: (id: string) => void;
}) {
  const { messages, locale } = useLocale();
  const sections = [
    [messages.purpose, "purposeItems"],
    [messages.advance, "advanceItems"],
    [messages.preserve, "preserveItems"],
    [messages.readerOutcome, "readerOutcomeItems"],
    [messages.next, "nextItems"],
    [messages.relevantContext, "relevantContextItems"],
    [messages.because, "becauseItems"],
    [messages.consequences, "consequenceItems"],
  ] as const;
  if (directive.disabled)
    return (
      <section className="relevant-now">
        <h2>{messages.relevantNow}</h2>
        <p>{messages.disabledForThisProject}</p>
      </section>
    );
  return (
    <section className="relevant-now" aria-label={messages.relevantNow}>
      <header>
        <h2>{messages.relevantNow}</h2>
        <span>
          {directive.stale
            ? messages.staleRefreshRequired
            : interpolateMessage(messages.freshAtStructureVersion, {
                version: formatNumber(locale, directive.freshnessVersion),
              })}
        </span>
      </header>
      {sections.map(([label, key]) =>
        directive[key].length ? (
          <div key={key}>
            <h3>{label}</h3>
            <ul>
              {directive[key].map((item) => (
                <li key={item.id}>
                  <button onClick={() => onPeek(item.peekDescriptorId)}>
                    {item.leadingCode
                      ? `${localizedEnumLabelOrValue(messages, item.leadingCode)}: `
                      : ""}
                    {item.textCode
                      ? localizedEnumLabelOrValue(messages, item.textCode)
                      : item.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
    </section>
  );
}
