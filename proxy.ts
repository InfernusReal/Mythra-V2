import { NextResponse, type NextRequest } from "next/server";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
const providerPaths = new Set(["/api/v2/billing/webhooks"]);

export function proxy(request: NextRequest) {
  if (!safeMethods.has(request.method) && !providerPaths.has(request.nextUrl.pathname)) {
    const allowed = process.env.APP_ORIGIN;
    const origin = request.headers.get("origin");
    const anonymousNonBrowserClient = origin === null && !request.cookies.has("mythra_session");
    if (!anonymousNonBrowserClient && (!allowed || origin !== allowed)) {
      // Console trace S16-CSRF-001: rejected unsafe request records method and fixed pathname only; headers and payload are excluded.
      console.log(JSON.stringify({ level: "warn", step: "S16-CSRF-001", event: "security.unsafe_origin_rejected", method: request.method, routeKey: request.nextUrl.pathname }));
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "The request origin is not allowed." } }, { status: 403 });
    }
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/v2/:path*" };
