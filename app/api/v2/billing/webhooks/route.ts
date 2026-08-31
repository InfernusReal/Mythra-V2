import { billingService } from "@/lib/billing/runtime";
import { failure, success } from "@/lib/contracts/envelope";
import { asAppError, errors } from "@/lib/contracts/errors";
import { FixedWindowRateLimiter } from "@/lib/http/rate-limit";
import { requestIdFrom } from "@/lib/http/request-context";
import { logger } from "@/lib/observability/logger";

const limiter = new FixedWindowRateLimiter(process.env.NODE_ENV === "production" ? 120 : 10_000, 60_000);

export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers);
  try {
    const signature = request.headers.get("x-mythra-billing-signature");
    if (!signature) throw errors.forbidden();
    limiter.assertAllowed(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "billing-provider");
    const rawBody = new Uint8Array(await request.arrayBuffer());
    const data = await billingService().handleWebhook(rawBody, signature, requestId);
    // Console trace S14-API-003: webhook HTTP completion records only request identity and replay state.
    logger.info("billing.webhook_api_completed", { step: "S14-API-003", requestId, replayed: data.replayed, outOfOrder: data.outOfOrder, status: 200 });
    return Response.json(success(data, requestId));
  } catch (caught) {
    const error = caught instanceof Error && caught.name === "ZodError" ? errors.validation() : asAppError(caught);
    // Console trace S14-API-004: webhook HTTP failure contains no raw body, signature or provider secret.
    logger.warn("billing.webhook_api_failed", { step: "S14-API-004", requestId, status: error.status, errorCode: error.code });
    return Response.json(failure(error.code, error.message, requestId), { status: error.status });
  }
}
