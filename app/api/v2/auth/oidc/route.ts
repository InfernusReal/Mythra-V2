import { NextResponse } from "next/server";
import { createAuthenticateUser } from "@/lib/auth/runtime";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { asAppError, errors } from "@/lib/contracts/errors";
import { failure, success } from "@/lib/contracts/envelope";
import { getEnv } from "@/lib/env";
import { assertSameOrigin } from "@/lib/http/csrf";
import { assertPublicApiRateLimit } from "@/lib/http/api-rate-limit";
import { requestIdFrom } from "@/lib/http/request-context";
import { logger } from "@/lib/observability/logger";

export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers);
  try {
    const env = getEnv();
    if (env.AUTH_MODE !== "oidc") throw errors.notFound();
    assertSameOrigin(request, env.APP_ORIGIN);
    await assertPublicApiRateLimit("auth.oidc", request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local", 10);
    const authorization = request.headers.get("authorization") ?? "";
    if (authorization.length > 8192) throw errors.unauthenticated();
    const credential = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/iu.exec(authorization)?.[1];
    if (!credential) throw errors.unauthenticated();
    const actor = await createAuthenticateUser().execute(credential, requestId);
    const response = NextResponse.json(success({ redirectTo: "/app" }, requestId), { headers: { "cache-control": "no-store" } });
    response.cookies.set(SESSION_COOKIE, createSessionToken(actor, { current: env.SESSION_SECRET, currentKeyId: env.SESSION_KEY_ID }), {
      httpOnly: true,
      sameSite: "lax",
      secure: env.MYTHRA_ENV !== "local" || env.NODE_ENV === "production",
      path: "/",
      maxAge: 8 * 60 * 60
    });
    // Console trace S18-AUTH-001: OIDC session issuance records internal identities and signing-key ID only, never credentials or provider claims.
    logger.info("auth.session_issued", { step: "S18-AUTH-001", requestId, userId: actor.userId, workspaceId: actor.workspaceId, keyId: env.SESSION_KEY_ID });
    return response;
  } catch (error) {
    const safe = asAppError(error);
    // Console trace S18-AUTH-002: failed OIDC exchange records a stable error code and request ID, never tokens, claims, headers or raw errors.
    logger.warn("auth.failure", { step: "S18-AUTH-002", requestId, errorCode: safe.code });
    return NextResponse.json(failure(safe.code, safe.message, requestId), { status: safe.status, headers: { "cache-control": "no-store" } });
  }
}
