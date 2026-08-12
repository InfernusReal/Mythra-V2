"use client";

import { useTheme } from "@/components/theming/ThemeProvider";
import type { Theme } from "@/lib/theming/theme";

const labels: Record<Theme, string> = { light: "Light", dark: "Dark", system: "System" };

export function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  return (
    <label className="theme-menu">
      <span>Theme</span>
      <select aria-label="Theme" value={theme} onChange={(event) => setTheme(event.target.value as Theme)}>
        {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
  );
}
