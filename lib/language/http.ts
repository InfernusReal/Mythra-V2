import type { SessionActor } from "@/domains/accounts/domain/identity";
import { optionalActor } from "@/lib/auth/runtime";
import { failure, success } from "@/lib/contracts/envelope";
import { asAppError, errors } from "@/lib/contracts/errors";
import { requestIdFrom } from "@/lib/http/request-context";
import { logger } from "@/lib/observability/logger";

export async function languageHttp(request: Request, routeKey: string, operation: (actor: SessionActor, requestId: string) => Promise<unknown>) {
  const requestId = requestIdFrom(request.headers);
  try {
    const actor = await optionalActor();
    if (!actor) throw errors.unauthenticated();
    const data = await operation(actor, requestId);
    // Console trace S10-API-003: Language API success logs transport identity only; selection/definitions/terms are excluded.
    logger.info("language.api_completed", { step: "S10-API-003", requestId, workspaceId: actor.workspaceId, routeKey, method: request.method, status: 200 });
    return Response.json(success(data, requestId));
  } catch (caught) {
    const error = caught instanceof Error && caught.name === "ZodError" ? errors.validation() : asAppError(caught);
    // Console trace S10-API-004: Language API failure excludes selected and lexical content.
    logger.warn("language.api_failed", { step: "S10-API-004", requestId, routeKey, method: request.method, status: error.status, errorCode: error.code, causeName: caught instanceof Error ? caught.name : "Unknown" });
    return Response.json(failure(error.code, error.message, requestId, error.safeDetails), { status: error.status });
  }
}
