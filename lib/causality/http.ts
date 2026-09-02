import { NextResponse } from "next/server";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { optionalActor } from "@/lib/auth/runtime";
import { failure, success } from "@/lib/contracts/envelope";
import { asAppError, errors } from "@/lib/contracts/errors";
import { requestIdFrom } from "@/lib/http/request-context";
import { logger } from "@/lib/observability/logger";
import { assertApiRateLimit } from "@/lib/http/api-rate-limit";

export async function causalityApi<T>(request: Request, routeKey: string, status: number, operation: (actor: SessionActor, requestId: string) => Promise<T>): Promise<NextResponse> {
  const requestId = requestIdFrom(request.headers);
  try {
    const actor = await optionalActor(); if (!actor) throw errors.unauthenticated(); await assertApiRateLimit(actor, routeKey); const data = await operation(actor, requestId);
    // Console trace S6-API-001: causal API operation completed with route, method and status only.
    logger.info("causality.api_completed", { step: "S6-API-001", requestId, workspaceId: actor.workspaceId, routeKey, method: request.method, status });
    return NextResponse.json(success(data, requestId), { status });
  } catch (error) {
    const safe = error instanceof Error && error.name === "ZodError" ? errors.validation() : asAppError(error);
    // Console trace S6-API-002: causal API failure recorded with stable code and no request content.
    logger.warn("causality.api_failed", { step: "S6-API-002", requestId, routeKey, method: request.method, status: safe.status, errorCode: safe.code });
    return NextResponse.json(failure(safe.code, safe.message, requestId, safe.safeDetails), { status: safe.status });
  }
}
