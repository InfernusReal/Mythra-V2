"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function FocusMode({
  active,
  onChange,
}: {
  active: boolean;
  onChange(): void;
}) {
  const { messages } = useLocale();
  return (
    <button onClick={onChange} aria-pressed={active}>
      {messages.focus}
    </button>
  );
}
