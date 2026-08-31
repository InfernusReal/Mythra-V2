import { AppShell } from "@/components/shell/AppShell";
import { ThemeMenu } from "@/components/shell/ThemeMenu";
import { requireActor } from "@/lib/auth/runtime";

export default async function SettingsPage() {
  await requireActor();
  return <AppShell><section className="settings-panel"><h1>Preferences</h1><ThemeMenu /><p><a className="primary-link" href="/app/settings/billing">Plan, usage, and invoices</a></p></section></AppShell>;
}
