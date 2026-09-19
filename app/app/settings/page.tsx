import { getRequestI18n } from "@/lib/i18n/request";
import { AppShell } from "@/components/shell/AppShell";
import { ThemeMenu } from "@/components/shell/ThemeMenu";
import { requireActor } from "@/lib/auth/runtime";

export default async function SettingsPage() {
  const { messages } = await getRequestI18n();
  const actor = await requireActor();
  return (
    <AppShell>
      <section className="settings-panel" aria-labelledby="settings-title">
        <header className="settings-header">
          <h1 id="settings-title">{messages.preferences}</h1>
        </header>
        <div className="settings-theme">
          <ThemeMenu />
        </div>
        <nav
          className="settings-destinations"
          aria-label={messages.preferences}
        >
          <a className="primary-link" href="/app/settings/billing">
            {messages.planUsageAndInvoices}
          </a>
          {actor.role === "OWNER" || actor.role === "ADMIN" ? (
            <a className="primary-link" href="/app/admin">
              {messages.restrictedOperations}
            </a>
          ) : null}
        </nav>
      </section>
    </AppShell>
  );
}
