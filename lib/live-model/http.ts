import type { SessionActor } from "@/domains/accounts/domain/identity";
import { optionalActor } from "@/lib/auth/runtime";
import { failure, success } from "@/lib/contracts/envelope";
import { asAppError, errors } from "@/lib/contracts/errors";
import { requestIdFrom } from "@/lib/http/request-context";
import { logger } from "@/lib/observability/logger";
import { getEnv } from "@/lib/env";
import { assertSameOrigin } from "@/lib/http/csrf";
import { FixedWindowRateLimiter } from "@/lib/http/rate-limit";

const limiter = new FixedWindowRateLimiter(process.env.NODE_ENV === "production" ? 30 : 10_000, 60_000);

export async function liveModelHttp(request: Request, routeKey: string, operation: (actor: SessionActor, requestId: string) => Promise<unknown>) {
  const requestId = requestIdFrom(request.headers);
  try {
    const actor = await optionalActor();
    if (!actor) throw errors.unauthenticated();
    if (request.method !== "GET") {
      assertSameOrigin(request, getEnv().APP_ORIGIN);
      limiter.assertAllowed(`${actor.userId}:${routeKey}`);
    }
    const data = await operation(actor, requestId);
    // Console trace S12-API-002: Live Model route completion contains route/identity/status metadata only.
    logger.info("live_model.api_completed", { step: "S12-API-002", requestId, workspaceId: actor.workspaceId, routeKey, method: request.method, status: 200 });
    return Response.json(success(data, requestId));
  } catch (caught) {
    const error = caught instanceof Error && caught.name === "ZodError" ? errors.validation() : asAppError(caught);
    // Console trace S12-API-003: Live Model route failure maps to a stable code and excludes raw runtime/content data.
    logger.warn("live_model.api_failed", { step: "S12-API-003", requestId, routeKey, method: request.method, status: error.status, errorCode: error.code });
    return Response.json(failure(error.code, error.message, requestId, error.safeDetails), { status: error.status });
  }
}
