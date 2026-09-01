"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isTheme, type Theme } from "@/lib/theming/theme";

interface ThemeContextValue { theme: Theme; setTheme(theme: Theme): void }
const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme): void {
  const resolved = theme === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    : theme;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const preferenceVersion = useRef(0);
  const [theme, updateTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    const stored = window.localStorage.getItem("mythra.theme");
    return isTheme(stored) ? stored : "system";
  });
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!pathname?.startsWith("/app")) return;
    const version = preferenceVersion.current;
    void fetch("/api/v2/preferences/theme").then(async (response) => {
      if (!response.ok) return;
      const envelope = await response.json() as { data?: { theme?: unknown } };
      if (preferenceVersion.current !== version || !isTheme(envelope.data?.theme)) return;
      localStorage.setItem("mythra.theme", envelope.data.theme);
      updateTheme(envelope.data.theme);
      applyTheme(envelope.data.theme);
      // Console trace S0-THEME-002: the canonical preference hydrated the local theme cache; only the enum value is emitted.
      console.log(JSON.stringify({ level: "info", step: "S0-THEME-002", event: "theme.preference_hydrated", theme: envelope.data.theme }));
    }).catch(() => {
      // Console trace S0-THEME-003: preference hydration failed without blocking the locally cached theme.
      console.log(JSON.stringify({ level: "warn", step: "S0-THEME-003", event: "theme.preference_hydration_unavailable" }));
    });
  }, [pathname]);

  const setTheme = useCallback((next: Theme) => {
    preferenceVersion.current += 1;
    localStorage.setItem("mythra.theme", next);
    updateTheme(next);
    applyTheme(next);
    // Console trace S0-THEME-001: theme preference changed; only the theme key is emitted.
    console.log(JSON.stringify({ level: "info", step: "S0-THEME-001", event: "theme.changed", theme: next }));
    if (next === "cream") {
      // Console trace S15-THEME-001: optional Cream activation records only the stable theme key.
      console.log(JSON.stringify({ level: "info", step: "S15-THEME-001", event: "theme.cream_activated", theme: next }));
    }
    void fetch("/api/v2/preferences/theme", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ theme: next }) }).then((response) => {
      if (!response.ok) throw new Error("Preference persistence failed.");
      // Console trace S0-THEME-004: the canonical preference acknowledged the already-applied local theme.
      console.log(JSON.stringify({ level: "info", step: "S0-THEME-004", event: "theme.preference_acknowledged", theme: next }));
    }).catch(() => {
      // Console trace S0-THEME-005: server preference persistence failed; the local theme remains applied and writable work is unaffected.
      console.log(JSON.stringify({ level: "warn", step: "S0-THEME-005", event: "theme.preference_local_retained", theme: next }));
    });
  }, []);
  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider.");
  return value;
}
