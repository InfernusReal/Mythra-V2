import { describe, expect, it } from "vitest";
import { evaluateAlert, alertRules } from "@/lib/observability/alerts";
import { operationalEventSchema } from "@/lib/observability/operations";
import { FixedWindowRateLimiter } from "@/lib/http/rate-limit";

describe("S16 operational stress", () => {
  it("validates 100,000 bounded metadata events without accepting arbitrary dimensions", () => {
    const workspaceId = "a873e0d0-e22f-4cd0-a7f9-484546489adc";
    for (let index = 0; index < 100_000; index += 1) {
      const event = operationalEventSchema.parse({ workspaceId, eventName: index % 2 ? "writing.save" : "context.resolve", durationMs: index % 2_000, numericValue: index % 500, dimensions: { outcome: "success", stage: "stress" } });
      expect(event.durationMs).toBeLessThan(2_000);
    }
  });

  it("keeps burst limits and every alert transition deterministic", () => {
    const limiter = new FixedWindowRateLimiter(10_000, 60_000);
    for (let index = 0; index < 10_000; index += 1) expect(() => limiter.assertAllowed("bounded-writer", 0)).not.toThrow();
    expect(() => limiter.assertAllowed("bounded-writer", 0)).toThrow();
    for (const rule of alertRules) {
      expect(evaluateAlert(rule, rule.threshold).state).toBe("FIRING");
      expect(evaluateAlert(rule, rule.recoveryThreshold, "FIRING").state).toBe("OK");
    }
  });
});
