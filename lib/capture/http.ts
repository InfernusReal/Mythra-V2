import type { SessionActor } from "@/domains/accounts/domain/identity";
import { optionalActor } from "@/lib/auth/runtime";
import { failure, success } from "@/lib/contracts/envelope";
import { asAppError, errors } from "@/lib/contracts/errors";
import { requestIdFrom } from "@/lib/http/request-context";
import { logger } from "@/lib/observability/logger";

export async function captureHttp(request: Request, routeKey: string, operation: (actor: SessionActor, requestId: string) => Promise<unknown>) { const requestId = requestIdFrom(request.headers); try { const actor = await optionalActor(); if (!actor) throw errors.unauthenticated(); const data = await operation(actor, requestId);
    // Console trace S8-API-001: Capture API operation completed with transport metadata only.
    logger.info("capture.api_completed", { step: "S8-API-001", requestId, workspaceId: actor.workspaceId, routeKey, method: request.method, status: 200 }); return Response.json(success(data, requestId), { status: 200 });
  } catch (caught) { const error = caught instanceof Error && caught.name === "ZodError" ? errors.validation() : asAppError(caught);
    // Console trace S8-API-002: Capture API failure recorded with stable error/transport metadata and no request body.
    logger.warn("capture.api_failed", { step: "S8-API-002", requestId, routeKey, method: request.method, status: error.status, errorCode: error.code, causeName: caught instanceof Error ? caught.name : "Unknown", causeCode: typeof caught === "object" && caught !== null && "code" in caught && typeof caught.code === "string" ? caught.code : undefined }); return Response.json(failure(error.code, error.message, requestId, error.safeDetails), { status: error.status }); } }
