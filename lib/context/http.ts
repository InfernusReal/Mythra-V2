import { NextResponse } from "next/server";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { optionalActor } from "@/lib/auth/runtime";
import { failure, success } from "@/lib/contracts/envelope";
import { asAppError, errors } from "@/lib/contracts/errors";
import { requestIdFrom } from "@/lib/http/request-context";
import { logger } from "@/lib/observability/logger";

export async function contextApi<T>(request: Request, routeKey: string, operation: (actor: SessionActor, requestId: string) => Promise<T>): Promise<NextResponse> {
  const requestId = requestIdFrom(request.headers);
  try { const actor = await optionalActor(); if (!actor) throw errors.unauthenticated(); const data = await operation(actor, requestId);
    // Console trace S7-API-001: Context API operation completed with route, method, and status only.
    logger.info("context.api_completed", { step: "S7-API-001", requestId, workspaceId: actor.workspaceId, routeKey, method: request.method, status: 200 });
    return NextResponse.json(success(data, requestId));
  } catch (error) { const safe = error instanceof Error && error.name === "ZodError" ? errors.validation() : asAppError(error);
    // Console trace S7-API-002: Context API failure recorded with a stable code and no author/request content.
    logger.warn("context.api_failed", { step: "S7-API-002", requestId, routeKey, method: request.method, status: safe.status, errorCode: safe.code });
    return NextResponse.json(failure(safe.code, safe.message, requestId, safe.safeDetails), { status: safe.status }); }
}
