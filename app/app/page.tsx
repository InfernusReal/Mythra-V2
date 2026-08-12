import { AppShell } from "@/components/shell/AppShell";
import { requireActor } from "@/lib/auth/runtime";
import { logger } from "@/lib/observability/logger";

export default async function EmptyAppPage() {
  const actor = await requireActor();
  // Console trace S0-SHELL-001: authenticated empty shell rendered; no story workflow is claimed.
  logger.info("shell.rendered", { step: "S0-SHELL-001", userId: actor.userId, workspaceId: actor.workspaceId });
  return (
    <AppShell>
      <section className="empty-shell" aria-labelledby="empty-title">
        <p className="eyebrow">Foundation</p>
        <h1 id="empty-title">Your writing space is ready</h1>
        <p>The foundation is active. Story creation begins in the next verified capability.</p>
      </section>
    </AppShell>
  );
}
