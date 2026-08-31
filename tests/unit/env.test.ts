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

  it("requires a real provider contract in production and locks the pricing decision", () => {
    const oidc: NodeJS.ProcessEnv = { ...base, NODE_ENV: "production", AUTH_MODE: "oidc", AUTH_ISSUER: "https://identity.example.com", AUTH_AUDIENCE: "mythra", AUTH_JWKS_URL: "https://identity.example.com/jwks" };
    expect(() => parseEnv(oidc)).toThrow(/Fixture billing/u);
    expect(() => parseEnv({ ...oidc, BILLING_PROVIDER: "http", BILLING_PROVIDER_API_URL: "https://billing.example.com", BILLING_PROVIDER_SECRET: "provider-secret-at-least-32-characters", BILLING_WEBHOOK_SECRET: "webhook-secret-at-least-32-characters", BILLING_CORE_AMOUNT_USD_CENTS: "1000" })).toThrow(/pricing decision/u);
    expect(parseEnv({ ...oidc, BILLING_PROVIDER: "http", BILLING_PROVIDER_API_URL: "https://billing.example.com", BILLING_PROVIDER_SECRET: "provider-secret-at-least-32-characters", BILLING_WEBHOOK_SECRET: "webhook-secret-at-least-32-characters" })).toMatchObject({ BILLING_PROVIDER: "http", BILLING_CORE_AMOUNT_USD_CENTS: 1500 });
  });
});
