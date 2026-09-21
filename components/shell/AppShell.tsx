"use client";

import type { ReactNode } from "react";
import { CommandPalette } from "./CommandPalette";
import { ThemeMenu } from "./ThemeMenu";
import { SaveIndicator } from "@/components/editor/SaveIndicator";
import { DegradedNetworkStatus } from "./DegradedNetworkStatus";
import { MobileNavigationSheet } from "./MobileNavigationSheet";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { NavigationAnalytics } from "@/components/operations/NavigationAnalytics";

function RailGlyph({ name }: { name: "home" | "projects" | "settings" }) {
  return (
    <svg
      aria-hidden="true"
      className="rail-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      {name === "home" ? (
        <>
          <path d="M3.75 10.5 12 3.75l8.25 6.75" />
          <path d="M5.75 9.25v10.5h12.5V9.25M9.25 19.75v-6h5.5v6" />
        </>
      ) : name === "projects" ? (
        <>
          <path d="M6.5 4.25h10.75a2 2 0 0 1 2 2v13.5H8.5a2 2 0 0 1-2-2V4.25Z" />
          <path d="M6.5 4.25a2 2 0 0 0-2 2v11.5a2 2 0 0 0 2 2h2M10 8h5.75M10 11.5h5.75" />
        </>
      ) : (
        <>
          <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
          <circle cx="15" cy="7" r="2" />
          <circle cx="9" cy="17" r="2" />
        </>
      )}
    </svg>
  );
}

export function AppShell({
  children,
  saveStatus,
}: {
  children: ReactNode;
  saveStatus?: string;
}) {
  const { messages } = useLocale();
  return (
    <div className="app-shell">
      <NavigationAnalytics />
      <header className="command-bar">
        <strong className="wordmark">{messages.productName}</strong>
        <div className="command-actions">
          <SaveIndicator
            initialStatus={saveStatus ?? messages.saveNotApplicable}
          />
          <CommandPalette />
          <ThemeMenu />
        </div>
      </header>
      <DegradedNetworkStatus />
      <nav className="app-rail" aria-label={messages.primaryNavigation}>
        <a href="/app" aria-current="page" title={messages.home}>
          <RailGlyph name="home" />
          <span className="sr-only">{messages.home}</span>
        </a>
        <a href="/app" title={messages.projects}>
          <RailGlyph name="projects" />
          <span className="sr-only">{messages.projects}</span>
        </a>
        <a href="/app/settings" title={messages.settings}>
          <RailGlyph name="settings" />
          <span className="sr-only">{messages.settings}</span>
        </a>
        <MobileNavigationSheet />
      </nav>
      <main className="shell-main">{children}</main>
      <aside
        className="context-reservation"
        id="context-field-slot"
        aria-label={messages.contextualWritingField}
      />
    </div>
  );
}
