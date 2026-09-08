import { useLocale } from "@/components/i18n/LocaleProvider";
import { formatNumber, interpolateMessage } from "@/lib/i18n/messages";

export function WordTarget({
  wordCount,
  delta,
}: {
  wordCount: number;
  delta: number | null;
}) {
  const { messages, locale } = useLocale();
  return (
    <>
      <span>
        {interpolateMessage(messages.wordCount, {
          count: formatNumber(locale, wordCount),
        })}
      </span>
      {delta !== null ? (
        <span>
          {delta >= 0
            ? interpolateMessage(messages.wordsRemaining, {
                count: formatNumber(locale, delta),
              })
            : interpolateMessage(messages.wordsOverTarget, {
                count: formatNumber(locale, Math.abs(delta)),
              })}
        </span>
      ) : (
        <span>{messages.noTarget}</span>
      )}
    </>
  );
}
