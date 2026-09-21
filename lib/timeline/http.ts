import type { SessionActor } from "@/domains/accounts/domain/identity";
import { optionalActor } from "@/lib/auth/runtime";
import { failure, success } from "@/lib/contracts/envelope";
import { asAppError, errors } from "@/lib/contracts/errors";
import { requestIdFrom } from "@/lib/http/request-context";
import { logger } from "@/lib/observability/logger";
import { getEnv } from "@/lib/env";
import { assertSameOrigin } from "@/lib/http/csrf";
import { assertApiRateLimit } from "@/lib/http/api-rate-limit";
export async function timelineHttp(request: Request, routeKey: string, operation: (actor: SessionActor, requestId: string) => Promise<unknown>, status = 200) { const requestId = requestIdFrom(request.headers); try { const actor = await optionalActor(); if (!actor) throw errors.unauthenticated(); if (request.method !== "GET") assertSameOrigin(request, getEnv().APP_ORIGIN); await assertApiRateLimit(actor, routeKey); const data = await operation(actor, requestId);
  // Console trace S11-API-001: Timeline transport success excludes authored temporal labels/descriptions and returns only safe request metadata to logs.
  logger.info("timeline.api_completed", { step: "S11-API-001", requestId, workspaceId: actor.workspaceId, routeKey, method: request.method, status }); return Response.json(success(data, requestId), { status }); } catch (caught) { const error = caught instanceof Error && caught.name === "ZodError" ? errors.validation() : asAppError(caught);
  // Console trace S11-API-002: Timeline transport failure logs stable code/cause class without request bodies.
  logger.warn("timeline.api_failed", { step: "S11-API-002", requestId, routeKey, method: request.method, status: error.status, errorCode: error.code, causeName: caught instanceof Error ? caught.name : "Unknown" }); return Response.json(failure(error.code, error.message, requestId, error.safeDetails), { status: error.status }); } }
