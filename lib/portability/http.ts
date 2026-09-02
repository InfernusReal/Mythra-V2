import type { SessionActor } from "@/domains/accounts/domain/identity";
import { optionalActor } from "@/lib/auth/runtime";
import { failure, success } from "@/lib/contracts/envelope";
import { asAppError, errors } from "@/lib/contracts/errors";
import { assertSameOrigin } from "@/lib/http/csrf";
import { assertApiRateLimit } from "@/lib/http/api-rate-limit";
import { requestIdFrom } from "@/lib/http/request-context";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/observability/logger";

export async function portabilityHttp(request: Request, routeKey: string, operation: (actor: SessionActor, requestId: string) => Promise<unknown>) {
  const requestId = requestIdFrom(request.headers);
  try {
    const actor = await optionalActor(); if (!actor) throw errors.unauthenticated();
    if (request.method !== "GET") assertSameOrigin(request, getEnv().APP_ORIGIN);
    await assertApiRateLimit(actor, routeKey, 20);
    const data = await operation(actor, requestId);
    // Console trace S13-API-002: history/portability route completion contains only route, identity and status metadata.
    logger.info("portability.api_completed", { step: "S13-API-002", requestId, workspaceId: actor.workspaceId, routeKey, method: request.method, status: 200 });
    return Response.json(success(data, requestId));
  } catch (caught) {
    const error = caught instanceof Error && caught.name === "ZodError" ? errors.validation() : asAppError(caught);
    // Console trace S13-API-003: route failure exposes a stable code and excludes runtime messages, archive bytes and author content.
    logger.warn("portability.api_failed", { step: "S13-API-003", requestId, routeKey, method: request.method, status: error.status, errorCode: error.code });
    return Response.json(failure(error.code, error.message, requestId, error.safeDetails), { status: error.status });
  }
}
