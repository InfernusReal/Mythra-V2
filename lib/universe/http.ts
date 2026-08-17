import type { SessionActor } from "@/domains/accounts/domain/identity";
import { optionalActor } from "@/lib/auth/runtime";
import { failure, success } from "@/lib/contracts/envelope";
import { asAppError, errors } from "@/lib/contracts/errors";
import { requestIdFrom } from "@/lib/http/request-context";
import { logger } from "@/lib/observability/logger";

export async function universeHttp(
  request: Request,
  routeKey: string,
  operation: (actor: SessionActor, requestId: string) => Promise<unknown>,
  status = 200,
) {
  const requestId = requestIdFrom(request.headers);
  try {
    const actor = await optionalActor();
    if (!actor) throw errors.unauthenticated();
    const data = await operation(actor, requestId);
    // Console trace S9-API-001: Universe API success emits transport and identity metadata only.
    logger.info("universe.api_completed", {
      step: "S9-API-001",
      requestId,
      workspaceId: actor.workspaceId,
      routeKey,
      method: request.method,
      status,
    });
    return Response.json(success(data, requestId), { status });
  } catch (caught) {
    const error =
      caught instanceof Error && caught.name === "ZodError"
        ? errors.validation()
        : asAppError(caught);
    // Console trace S9-API-002: Universe API failure excludes request bodies and authored entity data.
    logger.warn("universe.api_failed", {
      step: "S9-API-002",
      requestId,
      routeKey,
      method: request.method,
      status: error.status,
      errorCode: error.code,
      causeName: caught instanceof Error ? caught.name : "Unknown",
    });
    return Response.json(
      failure(error.code, error.message, requestId, error.safeDetails),
      { status: error.status },
    );
  }
}
