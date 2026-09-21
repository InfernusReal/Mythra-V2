import { describe, expect, it } from "vitest";
import { failure, success } from "@/lib/contracts/envelope";
import { assertSameOrigin } from "@/lib/http/csrf";
import { requestIdFrom } from "@/lib/http/request-context";

describe("HTTP foundation contracts", () => {
  it("creates stable success and failure envelopes", () => {
    expect(success({ id: "safe-id" }, "request-123")).toMatchObject({ data: { id: "safe-id" }, meta: { requestId: "request-123" } });
    expect(failure("CONFLICT", "Changed", "request-456", { version: 2 })).toMatchObject({
      error: { code: "CONFLICT", message: "Changed", details: { version: 2 } }, meta: { requestId: "request-456" }
    });
  });

  it("preserves valid request identifiers and replaces unsafe input", () => {
    expect(requestIdFrom(new Headers({ "x-request-id": "request-safe-123" }))).toBe("request-safe-123");
    expect(requestIdFrom(new Headers({ "x-request-id": "unsafe value" }))).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("accepts only the configured mutation origin", () => {
    expect(() => assertSameOrigin(new Request("http://localhost/action", { headers: { origin: "http://localhost:3000" } }), "http://localhost:3000")).not.toThrow();
    expect(() => assertSameOrigin(new Request("http://localhost/action", { headers: { origin: "https://attacker.example" } }), "http://localhost:3000")).toThrow(/not allowed/);
  });
});
