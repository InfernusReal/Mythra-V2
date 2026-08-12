import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

const base = {
  DATABASE_URL: "postgresql://example.test/mythra",
  SESSION_SECRET: "01234567890123456789012345678901",
  APP_ORIGIN: "http://localhost:3000"
};

describe("environment validation", () => {
  it("permits local development authentication outside production", () => {
    expect(parseEnv({ ...base, NODE_ENV: "development", AUTH_MODE: "development" })).toMatchObject({ AUTH_MODE: "development" });
  });

  it("rejects development authentication in production", () => {
    expect(() => parseEnv({ ...base, NODE_ENV: "production", AUTH_MODE: "development" })).toThrow(/forbidden/);
  });

  it("requires the complete OIDC provider contract", () => {
    expect(() => parseEnv({ ...base, NODE_ENV: "production", AUTH_MODE: "oidc" })).toThrow(/issuer/);
  });
});
