import { describe, expect, it } from "vitest";
import { anonymousSessionId, createSessionToken, readSessionToken } from "@/lib/auth/session";

const actor = {
  userId: "f14278a4-18d1-401f-9714-1ae313c1b4b0",
  workspaceId: "a873e0d0-e22f-4cd0-a7f9-484546489adc",
  role: "OWNER" as const,
  sessionId: "608b547d-41f8-449c-96c2-27b5fa3b058c"
};
const secret = "01234567890123456789012345678901";

describe("session tokens", () => {
  it("round trips internal identity", () => {
    expect(readSessionToken(createSessionToken(actor, secret, 1000), secret, 1001)).toEqual(actor);
  });

  it("rejects tampering", () => {
    const token = createSessionToken(actor, secret);
    expect(readSessionToken(`${token}x`, secret)).toBeNull();
  });

  it("rejects expiry", () => {
    expect(readSessionToken(createSessionToken(actor, secret, 0), secret, 9 * 60 * 60 * 1000)).toBeNull();
  });

  it("rejects malformed input and creates anonymous correlation identities", () => {
    expect(readSessionToken("malformed", secret)).toBeNull();
    expect(anonymousSessionId()).toMatch(/^[0-9a-f-]{36}$/);
  });
});
