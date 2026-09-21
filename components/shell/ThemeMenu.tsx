"use client";

import { useTheme } from "@/components/theming/ThemeProvider";
import type { Theme } from "@/lib/theming/theme";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const { messages } = useLocale();
  const labels: Record<Theme, string> = { light: messages.light, dark: messages.dark, cream: messages.cream, system: messages.system };
  return (
    <label className="theme-menu">
      <span>{messages.theme}</span>
      <select aria-label={messages.theme} value={theme} onChange={(event) => setTheme(event.target.value as Theme)}>
        {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
  );
}
