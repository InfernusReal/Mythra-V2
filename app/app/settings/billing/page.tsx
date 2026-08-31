import { BillingPanel } from "@/components/billing/BillingPanel";
import { AppShell } from "@/components/shell/AppShell";
import { requireActor } from "@/lib/auth/runtime";
import { billingService } from "@/lib/billing/runtime";
import { logger } from "@/lib/observability/logger";

export default async function BillingSettingsPage() {
  const actor = await requireActor();
  const state = await billingService().status(actor);
  // Console trace S14-UI-004: billing settings render reports workspace/status only and excludes customer/invoice provider data.
  logger.info("billing.settings_rendered", { step: "S14-UI-004", workspaceId: actor.workspaceId, subscriptionStatus: state.entitlements.subscriptionStatus, providerAvailable: state.providerAvailable });
  return <AppShell><BillingPanel initialState={state} /></AppShell>;
}
