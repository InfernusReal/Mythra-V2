import type { SessionActor } from "@/domains/accounts/domain/identity";
import { optionalActor } from "@/lib/auth/runtime";
import { failure, success } from "@/lib/contracts/envelope";
import { asAppError, errors } from "@/lib/contracts/errors";
import { requestIdFrom } from "@/lib/http/request-context";
import { logger } from "@/lib/observability/logger";
import { assertApiRateLimit } from "@/lib/http/api-rate-limit";

export async function searchHttp(request: Request, routeKey: string, operation: (actor: SessionActor, requestId: string) => Promise<unknown>, status = 200) {
  const requestId = requestIdFrom(request.headers);
  try {
    const actor = await optionalActor();
    if (!actor) throw errors.unauthenticated();
    await assertApiRateLimit(actor, routeKey);
    const data = await operation(actor, requestId);
    // Console trace S10-API-001: Search API success emits transport/identity metadata only and excludes query/results.
    logger.info("search.api_completed", { step: "S10-API-001", requestId, workspaceId: actor.workspaceId, routeKey, method: request.method, status });
    return Response.json(success(data, requestId), { status });
  } catch (caught) {
    const error = caught instanceof Error && caught.name === "ZodError" ? errors.validation() : asAppError(caught);
    // Console trace S10-API-002: Search API failure emits stable code/cause class and excludes request/query/authored data.
    logger.warn("search.api_failed", { step: "S10-API-002", requestId, routeKey, method: request.method, status: error.status, errorCode: error.code, causeName: caught instanceof Error ? caught.name : "Unknown" });
    return Response.json(failure(error.code, error.message, requestId, error.safeDetails), { status: error.status });
  }
}
