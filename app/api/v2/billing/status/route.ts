import { billingHttp } from "@/lib/billing/http";
import { billingService } from "@/lib/billing/runtime";

export async function GET(request: Request) {
  return billingHttp(request, "billing.status", async (actor) => billingService().status(actor));
}
