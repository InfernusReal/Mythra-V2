"use client";

import type { ReactNode } from "react";
import { CommandPalette } from "./CommandPalette";
import { ThemeMenu } from "./ThemeMenu";
import { SaveIndicator } from "@/components/editor/SaveIndicator";
import { DegradedNetworkStatus } from "./DegradedNetworkStatus";
import { MobileNavigationSheet } from "./MobileNavigationSheet";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { NavigationAnalytics } from "@/components/operations/NavigationAnalytics";

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
          <span aria-hidden="true">H</span>
          <span className="sr-only">{messages.home}</span>
        </a>
        <a href="/app" title={messages.projects}>
          <span aria-hidden="true">P</span>
          <span className="sr-only">{messages.projects}</span>
        </a>
        <a href="/app/settings" title={messages.settings}>
          <span aria-hidden="true">S</span>
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
