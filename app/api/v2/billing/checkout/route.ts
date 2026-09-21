import { z } from "zod";
import { billingHttp } from "@/lib/billing/http";
import { billingService } from "@/lib/billing/runtime";
import { getEnv } from "@/lib/env";

const schema = z.object({ planKey: z.enum(["core", "intelligence"]), idempotencyKey: z.string().min(8).max(96) }).strict();

export async function POST(request: Request) {
  return billingHttp(request, "billing.checkout", async (actor) => {
    const input = schema.parse(await request.json());
    const origin = getEnv().APP_ORIGIN;
    return billingService().createCheckout(actor, { ...input, successUrl: `${origin}/app/settings/billing?checkout=success`, cancelUrl: `${origin}/app/settings/billing?checkout=canceled` });
  });
}
