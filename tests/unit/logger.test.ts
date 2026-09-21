import { afterEach, describe, expect, it, vi } from "vitest";
import { createLogger } from "@/lib/observability/logger";

afterEach(() => vi.restoreAllMocks());

describe("content-safe logger", () => {
  it("emits one structured console record", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    createLogger({ service: "test" }).info("operation.complete", { requestId: "request-123", durationMs: 12 });
    expect(consoleSpy).toHaveBeenCalledOnce();
    expect(JSON.parse(String(consoleSpy.mock.calls[0]?.[0]))).toMatchObject({
      level: "info", event: "operation.complete", service: "test", requestId: "request-123", durationMs: 12
    });
  });

  it.each(["body", "prose", "content", "documentJson", "selectedText", "captureValue", "noteBody"])(
    "rejects sensitive metadata key %s", (key) => {
      expect(() => createLogger().info("unsafe", { [key]: "secret" })).toThrow(/Unsafe log metadata key rejected/);
    }
  );

  it("supports every structured level and inherited safe metadata", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const log = createLogger({ service: "test" }).child({ module: "foundation" });
    log.debug("debug.event");
    log.warn("warn.event");
    log.error("error.event");
    expect(consoleSpy).toHaveBeenCalledTimes(3);
    expect(String(consoleSpy.mock.calls[2]?.[0])).toContain('"module":"foundation"');
  });
});
