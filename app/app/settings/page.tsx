import { getRequestI18n } from "@/lib/i18n/request";
import { AppShell } from "@/components/shell/AppShell";
import { ThemeMenu } from "@/components/shell/ThemeMenu";
import { requireActor } from "@/lib/auth/runtime";

export default async function SettingsPage() {
  const { messages } = await getRequestI18n();
  const actor = await requireActor();
  return (
    <AppShell>
      <section className="settings-panel">
        <h1>{messages.preferences}</h1>
        <ThemeMenu />
        <p>
          <a className="primary-link" href="/app/settings/billing">
            {messages.planUsageAndInvoices}
          </a>
        </p>
        {actor.role === "OWNER" || actor.role === "ADMIN" ? (
          <p>
            <a className="primary-link" href="/app/admin">
              {messages.restrictedOperations}
            </a>
          </p>
        ) : null}
      </section>
    </AppShell>
  );
}
