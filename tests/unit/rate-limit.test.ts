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

  it("bounds subject cardinality and releases expired buckets", () => {
    const limiter = new FixedWindowRateLimiter(2, 1_000, 1);
    limiter.assertAllowed("first", 0);
    expect(() => limiter.assertAllowed("second", 1)).toThrow(/Too many requests/u);
    expect(() => limiter.assertAllowed("second", 1_000)).not.toThrow();
  });
});
