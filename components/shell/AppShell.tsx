import type { ReactNode } from "react";
import { CommandPalette } from "./CommandPalette";
import { ThemeMenu } from "./ThemeMenu";
import { SaveIndicator } from "@/components/editor/SaveIndicator";

export function AppShell({ children, saveStatus = "No document open" }: { children: ReactNode; saveStatus?: string }) {
  return (
    <div className="app-shell">
      <header className="command-bar">
        <strong className="wordmark">Mythra</strong>
        <div className="command-actions">
          <SaveIndicator initialStatus={saveStatus} />
          <CommandPalette />
          <ThemeMenu />
        </div>
      </header>
      <nav className="app-rail" aria-label="Primary navigation">
        <a href="/app" aria-current="page" title="Home"><span aria-hidden="true">H</span><span className="sr-only">Home</span></a>
        <a href="/app/settings" title="Settings"><span aria-hidden="true">S</span><span className="sr-only">Settings</span></a>
      </nav>
      <main className="shell-main">{children}</main>
      <aside className="context-reservation" aria-hidden="true" />
    </div>
  );
}
