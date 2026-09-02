import { AppShell } from "@/components/shell/AppShell";
import { requireActor } from "@/lib/auth/runtime";
import { operationsService } from "@/lib/operations/runtime";
import { requireWorkspaceRole } from "@/lib/security/authorization";
import { AdminOperationsPanel } from "@/components/operations/AdminOperationsPanel";
import { getEnv } from "@/lib/env";
import { featureFlags } from "@/lib/operations/feature-flags";

export default async function AdminPage() {
  const actor = requireWorkspaceRole(await requireActor(), "ADMIN");
  const snapshot = await operationsService().adminSnapshot(actor);
  return <AppShell><AdminOperationsPanel snapshot={snapshot} recoveryEnabled={featureFlags(getEnv(), actor.workspaceId).adminRecovery} /></AppShell>;
}
