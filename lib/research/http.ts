import type { SessionActor } from "@/domains/accounts/domain/identity";
import { optionalActor } from "@/lib/auth/runtime";
import { failure, success } from "@/lib/contracts/envelope";
import { asAppError, errors } from "@/lib/contracts/errors";
import { requestIdFrom } from "@/lib/http/request-context";
import { logger } from "@/lib/observability/logger";
import { getEnv } from "@/lib/env";
import { assertSameOrigin } from "@/lib/http/csrf";
import { FixedWindowRateLimiter } from "@/lib/http/rate-limit";
const limiter = new FixedWindowRateLimiter(process.env.NODE_ENV === "production" ? 60 : 10_000, 60_000);
export async function researchHttp(request: Request, routeKey: string, operation: (actor: SessionActor, requestId: string) => Promise<unknown>, status = 200) { const requestId = requestIdFrom(request.headers); try { const actor = await optionalActor(); if (!actor) throw errors.unauthenticated(); if (request.method !== "GET") { assertSameOrigin(request, getEnv().APP_ORIGIN); limiter.assertAllowed(`${actor.userId}:${routeKey}`); } const data = await operation(actor, requestId);
  // Console trace S11-API-005: Research transport success logs safe route metadata only and excludes URLs/citations/excerpts/files.
  logger.info("research.api_completed", { step: "S11-API-005", requestId, workspaceId: actor.workspaceId, routeKey, method: request.method, status }); return Response.json(success(data, requestId), { status }); } catch (caught) { const error = caught instanceof Error && caught.name === "ZodError" ? errors.validation() : asAppError(caught);
  // Console trace S11-API-006: Research transport failure logs stable code/cause class without authored or binary data.
  logger.warn("research.api_failed", { step: "S11-API-006", requestId, routeKey, method: request.method, status: error.status, errorCode: error.code, causeName: caught instanceof Error ? caught.name : "Unknown" }); return Response.json(failure(error.code, error.message, requestId, error.safeDetails), { status: error.status }); } }
