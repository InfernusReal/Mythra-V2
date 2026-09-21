import { describe, expect, it, vi } from "vitest";
import { createLogger } from "@/lib/observability/logger";
import { FixedWindowRateLimiter } from "@/lib/http/rate-limit";
import { createSessionToken, readSessionToken } from "@/lib/auth/session";

describe("Sub-gate 0 stress", () => {
  it("emits 10,000 safe structured steps without mutation", () => {
    const sink = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const testLogger = createLogger({ service: "stress" });
    for (let index = 0; index < 10_000; index += 1) testLogger.info("stress.step", { step: "S0-STRESS-001", index });
    expect(sink).toHaveBeenCalledTimes(10_000);
  });

  it("tracks 10,000 independent rate-limit buckets", () => {
    const limiter = new FixedWindowRateLimiter(1, 1000);
    for (let index = 0; index < 10_000; index += 1) limiter.assertAllowed(`actor-${index}`, 0);
    expect(() => limiter.assertAllowed("actor-9999", 1)).toThrow();
  });

  it("validates 10,000 signed session reads", () => {
    const secret = "01234567890123456789012345678901";
    const actor = { userId: "f14278a4-18d1-401f-9714-1ae313c1b4b0", workspaceId: "a873e0d0-e22f-4cd0-a7f9-484546489adc", role: "OWNER" as const, sessionId: "608b547d-41f8-449c-96c2-27b5fa3b058c" };
    const token = createSessionToken(actor, secret, 0);
    for (let index = 0; index < 10_000; index += 1) expect(readSessionToken(token, secret, index)).toEqual(actor);
  });
});
