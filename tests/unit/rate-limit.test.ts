import { describe, expect, it } from "vitest";
import { FixedWindowRateLimiter } from "@/lib/http/rate-limit";

describe("rate limiter", () => {
  it("limits within a window and resets after it", () => {
    const limiter = new FixedWindowRateLimiter(2, 1000);
    limiter.assertAllowed("actor", 0);
    limiter.assertAllowed("actor", 1);
    expect(() => limiter.assertAllowed("actor", 2)).toThrow(/Too many requests/);
    expect(() => limiter.assertAllowed("actor", 1000)).not.toThrow();
  });
});
