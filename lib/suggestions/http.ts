import type { SessionActor } from "@/domains/accounts/domain/identity";
import { optionalActor } from "@/lib/auth/runtime";
import { failure, success } from "@/lib/contracts/envelope";
import { asAppError, errors } from "@/lib/contracts/errors";
import { assertApiRateLimit } from "@/lib/http/api-rate-limit";
import { requestIdFrom } from "@/lib/http/request-context";
import { assertUnsafeRequestAllowed } from "@/lib/http/request-security";
import { logger } from "@/lib/observability/logger";

export async function suggestionsHttp(request: Request, routeKey: string, operation: (actor: SessionActor, requestId: string) => Promise<unknown>, status = 200) {
  const requestId = requestIdFrom(request.headers);
  try {
    assertUnsafeRequestAllowed(request);
    const actor = await optionalActor();
    if (!actor) throw errors.unauthenticated();
    await assertApiRateLimit(actor, routeKey, 60);
    const data = await operation(actor, requestId);
    // Console trace S17-SUGGESTION-API-001: suggestion transport success records route and identity metadata without proposal content.
    logger.info("suggestion.api_completed", { step: "S17-SUGGESTION-API-001", requestId, workspaceId: actor.workspaceId, routeKey, methodType: request.method, status });
    return Response.json(success(data, requestId), { status });
  } catch (caught) {
    const error = caught instanceof Error && caught.name === "ZodError" ? errors.validation() : asAppError(caught);
    // Console trace S17-SUGGESTION-API-002: suggestion transport failure records safe routing and error classification only.
    logger.warn("suggestion.api_failed", { step: "S17-SUGGESTION-API-002", requestId, routeKey, methodType: request.method, status: error.status, errorCode: error.code, causeName: caught instanceof Error ? caught.name : "Unknown" });
    return Response.json(failure(error.code, error.message, requestId, error.safeDetails), { status: error.status });
  }
}
