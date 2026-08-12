import { NextResponse } from "next/server";
import { createAuthenticateUser } from "@/lib/auth/runtime";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { asAppError } from "@/lib/contracts/errors";
import { failure } from "@/lib/contracts/envelope";
import { getEnv } from "@/lib/env";
import { assertSameOrigin } from "@/lib/http/csrf";
import { requestIdFrom } from "@/lib/http/request-context";
import { FixedWindowRateLimiter } from "@/lib/http/rate-limit";
import { logger } from "@/lib/observability/logger";

const limiter = new FixedWindowRateLimiter(process.env.NODE_ENV === "production" ? 10 : 1_000, 60_000);

export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers);
  try {
    const env = getEnv();
    if (env.AUTH_MODE !== "development") throw new Error("Route unavailable.");
    assertSameOrigin(request, env.APP_ORIGIN);
    limiter.assertAllowed(request.headers.get("x-forwarded-for") ?? "local");
    const form = await request.formData();
    const credential = String(form.get("credential") ?? "");
    const actor = await createAuthenticateUser().execute(credential, requestId);
    const response = NextResponse.redirect(new URL("/app", env.APP_ORIGIN), 303);
    response.cookies.set(SESSION_COOKIE, createSessionToken(actor, env.SESSION_SECRET), {
      httpOnly: true,
      sameSite: "strict",
      secure: env.NODE_ENV === "production",
      path: "/",
      maxAge: 8 * 60 * 60
    });
    // Console trace S0-AUTH-003: signed internal session issued after identity and workspace resolution.
    logger.info("auth.session_issued", { step: "S0-AUTH-003", requestId, userId: actor.userId, workspaceId: actor.workspaceId });
    return response;
  } catch (error) {
    const safe = asAppError(error);
    // Console trace S0-AUTH-004: authentication failure emits only the stable error code and request identifier.
    logger.warn("auth.failed", { step: "S0-AUTH-004", requestId, errorCode: safe.code });
    return NextResponse.json(failure(safe.code, safe.message, requestId), { status: safe.status });
  }
}
