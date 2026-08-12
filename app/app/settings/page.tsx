import { AppShell } from "@/components/shell/AppShell";
import { ThemeMenu } from "@/components/shell/ThemeMenu";
import { requireActor } from "@/lib/auth/runtime";

export default async function SettingsPage() {
  await requireActor();
  return <AppShell><section className="settings-panel"><h1>Preferences</h1><ThemeMenu /></section></AppShell>;
}
