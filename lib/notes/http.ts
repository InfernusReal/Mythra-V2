import type { SessionActor } from "@/domains/accounts/domain/identity";
import { optionalActor } from "@/lib/auth/runtime";
import { failure, success } from "@/lib/contracts/envelope";
import { asAppError, errors } from "@/lib/contracts/errors";
import { requestIdFrom } from "@/lib/http/request-context";
import { logger } from "@/lib/observability/logger";
import { getEnv } from "@/lib/env";
import { assertSameOrigin } from "@/lib/http/csrf";
import { FixedWindowRateLimiter } from "@/lib/http/rate-limit";
const limiter = new FixedWindowRateLimiter(process.env.NODE_ENV === "production" ? 120 : 10_000, 60_000);
export async function notesHttp(request: Request, routeKey: string, operation: (actor: SessionActor, requestId: string) => Promise<unknown>, status = 200) { const requestId = requestIdFrom(request.headers); try { const actor = await optionalActor(); if (!actor) throw errors.unauthenticated(); if (request.method !== "GET") { assertSameOrigin(request, getEnv().APP_ORIGIN); limiter.assertAllowed(`${actor.userId}:${routeKey}`); } const data = await operation(actor, requestId);
  // Console trace S11-API-003: Note transport success logs request identity only; Note titles/bodies/tags are excluded.
  logger.info("notes.api_completed", { step: "S11-API-003", requestId, workspaceId: actor.workspaceId, routeKey, method: request.method, status }); return Response.json(success(data, requestId), { status }); } catch (caught) { const error = caught instanceof Error && caught.name === "ZodError" ? errors.validation() : asAppError(caught);
  // Console trace S11-API-004: Note transport failure excludes request and authored Note content.
  logger.warn("notes.api_failed", { step: "S11-API-004", requestId, routeKey, method: request.method, status: error.status, errorCode: error.code, causeName: caught instanceof Error ? caught.name : "Unknown" }); return Response.json(failure(error.code, error.message, requestId, error.safeDetails), { status: error.status }); } }
