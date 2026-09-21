import { getEnv } from "@/lib/env";
import { assertSameOrigin } from "./csrf";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export function assertUnsafeRequestAllowed(request: Request, options: { providerSignatureVerified?: boolean } = {}): void {
  if (safeMethods.has(request.method.toUpperCase())) return;
  if (options.providerSignatureVerified) return;
  assertSameOrigin(request, getEnv().APP_ORIGIN);
}

export function retryAfterSeconds(resetAt: number, now = Date.now()): number {
  return Math.max(1, Math.ceil((resetAt - now) / 1_000));
}
