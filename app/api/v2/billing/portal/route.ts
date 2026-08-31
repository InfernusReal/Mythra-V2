import { billingHttp } from "@/lib/billing/http";
import { billingService } from "@/lib/billing/runtime";
import { getEnv } from "@/lib/env";

export async function POST(request: Request) {
  return billingHttp(request, "billing.portal", async (actor) => billingService().createPortal(actor, `${getEnv().APP_ORIGIN}/app/settings/billing`));
}
