import type { SessionActor } from "@/domains/accounts/domain/identity";
import { optionalActor } from "@/lib/auth/runtime";
import { failure, success } from "@/lib/contracts/envelope";
import { asAppError, errors } from "@/lib/contracts/errors";
import { getEnv } from "@/lib/env";
import { assertSameOrigin } from "@/lib/http/csrf";
import { assertApiRateLimit } from "@/lib/http/api-rate-limit";
import { requestIdFrom } from "@/lib/http/request-context";
import { logger } from "@/lib/observability/logger";

export async function billingHttp(request: Request, routeKey: string, operation: (actor: SessionActor, requestId: string) => Promise<unknown>) {
  const requestId = requestIdFrom(request.headers);
  try {
    const actor = await optionalActor();
    if (!actor) throw errors.unauthenticated();
    if (request.method !== "GET") assertSameOrigin(request, getEnv().APP_ORIGIN);
    await assertApiRateLimit(actor, routeKey, 20);
    const data = await operation(actor, requestId);
    // Console trace S14-API-001: authenticated billing route completion records only identity, route and HTTP state.
    logger.info("billing.api_completed", { step: "S14-API-001", requestId, workspaceId: actor.workspaceId, routeKey, method: request.method, status: 200 });
    return Response.json(success(data, requestId));
  } catch (caught) {
    const error = caught instanceof Error && caught.name === "ZodError" ? errors.validation() : asAppError(caught);
    // Console trace S14-API-002: billing route failure uses stable error codes and excludes provider/manuscript content.
    logger.warn("billing.api_failed", { step: "S14-API-002", requestId, routeKey, method: request.method, status: error.status, errorCode: error.code });
    return Response.json(failure(error.code, error.message, requestId, error.safeDetails), { status: error.status });
  }
}
