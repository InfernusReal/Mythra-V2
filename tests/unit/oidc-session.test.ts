// @vitest-environment node
import { createServer, type Server } from "node:http";
import { exportJWK, generateKeyPair, SignJWT, type JWTPayload } from "jose";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticateUser } from "@/domains/accounts/application/authenticate";
import { OidcAuthAdapter } from "@/domains/accounts/infrastructure/oidc-auth-adapter";
import { MemoryIdentityRepository } from "@/domains/accounts/infrastructure/memory-identity-repository";
import { readSessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { errors } from "@/lib/contracts/errors";
import { parseEnv, type AppEnv } from "@/lib/env";
import { createLogger } from "@/lib/observability/logger";
import { InMemoryMetricsSink } from "@/lib/observability/metrics";
import { POST } from "@/app/api/v2/auth/oidc/route";

const runtime = vi.hoisted(() => ({ env: {} as AppEnv, authenticate: vi.fn(), rateLimit: vi.fn(), alertSignal: vi.fn() }));
vi.mock("@/lib/auth/runtime", () => ({ createAuthenticateUser: runtime.authenticate }));
vi.mock("@/lib/http/api-rate-limit", () => ({ assertPublicApiRateLimit: runtime.rateLimit }));
vi.mock("@/lib/env", async (original) => ({ ...await original<typeof import("@/lib/env")>(), getEnv: () => runtime.env }));
vi.mock("@/lib/operations/runtime", () => ({ recordGlobalAlertSignal: runtime.alertSignal }));

const origin = "https://mythra.example.test";
const issuer = "https://identity.example.test";
const audience = "mythra-test-client";
const secret = "s18-oidc-test-only-session-secret-32-characters";
let server: Server;
let signingKey: Awaited<ReturnType<typeof generateKeyPair>>["privateKey"];
let adapter: OidcAuthAdapter;
let identities: MemoryIdentityRepository;
let logs: ReturnType<typeof vi.spyOn>;

function token(changes: JWTPayload = {}) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ iss: issuer, aud: audience, sub: "external-author", iat: now, exp: now + 300, email: "private@example.test", name: "Private Author", email_verified: true, ...changes })
    .setProtectedHeader({ alg: "RS256", kid: "s18-test-key" }).sign(signingKey);
}
function request(credential?: string, requestOrigin: string | null = origin) {
  return new Request(`${origin}/api/v2/auth/oidc?returnTo=https://untrusted.example.test`, { method: "POST", headers: { ...(requestOrigin ? { origin: requestOrigin } : {}), ...(credential ? { authorization: `Bearer ${credential}` } : {}) } });
}

beforeAll(async () => {
  const pair = await generateKeyPair("RS256"); signingKey = pair.privateKey;
  const jwk = { ...await exportJWK(pair.publicKey), kid: "s18-test-key", alg: "RS256", use: "sig" };
  server = createServer((_request, response) => { response.writeHead(200, { "content-type": "application/json" }); response.end(JSON.stringify({ keys: [jwk] })); });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Synthetic JWKS address unavailable.");
  adapter = new OidcAuthAdapter(`http://127.0.0.1:${address.port}/jwks`, issuer, audience);
});
afterAll(async () => { server?.closeAllConnections(); if (server) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); vi.restoreAllMocks(); });
beforeEach(() => {
  vi.restoreAllMocks();
  logs = vi.spyOn(console, "log").mockImplementation(() => undefined);
  runtime.env = { ...parseEnv({ NODE_ENV: "test", DATABASE_URL: "postgresql://unused", AUTH_MODE: "oidc", AUTH_ISSUER: issuer, AUTH_AUDIENCE: audience, AUTH_JWKS_URL: `${issuer}/jwks`, SESSION_SECRET: secret, APP_ORIGIN: origin }), MYTHRA_ENV: "preview" };
  identities = new MemoryIdentityRepository();
  runtime.authenticate.mockReset().mockImplementation(() => new AuthenticateUser(adapter, identities, createLogger({ service: "s18-test" }), new InMemoryMetricsSink()));
  runtime.rateLimit.mockReset().mockResolvedValue(undefined);
  runtime.alertSignal.mockReset().mockResolvedValue(undefined);
});

describe("S18 OIDC internal-session exchange", () => {
  it("verifies real JWKS signatures and reuses identity/workspace with fresh private sessions", async () => {
    const credential = await token();
    const first = await POST(request(credential));
    expect(first.status).toBe(200);
    expect(first.headers.get("cache-control")).toBe("no-store");
    const cookie = first.cookies.get(SESSION_COOKIE)!;
    const actor = readSessionToken(cookie.value, secret)!;
    expect(actor.role).toBe("OWNER");
    expect(cookie).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 28800 });
    expect((await first.json()).data).toEqual({ redirectTo: "/app" });
    const second = await POST(request(credential));
    const next = readSessionToken(second.cookies.get(SESSION_COOKIE)!.value, secret)!;
    expect(next).toMatchObject({ userId: actor.userId, workspaceId: actor.workspaceId, role: actor.role });
    expect(next.sessionId).not.toBe(actor.sessionId);
    await expect(identities.findActor(actor.userId, actor.workspaceId, actor.sessionId)).resolves.toEqual(actor);
    expect(runtime.rateLimit).toHaveBeenCalledWith("auth.oidc", "local", 10);
    expect(runtime.alertSignal).not.toHaveBeenCalled();
    for (const privateValue of [credential, cookie.value, "private@example.test", "Private Author", "external-author"]) expect(JSON.stringify(logs.mock.calls)).not.toContain(privateValue);
  });

  it.each([
    { iss: "https://wrong.example.test" }, { aud: "wrong-client" }, { aud: [audience, "untrusted-client"] }, { azp: "wrong-client" },
    { iss: undefined }, { aud: undefined }, { sub: undefined }, { exp: undefined }, { iat: undefined },
    { exp: 1 }, { iat: 9_999_999_999 }, { iat: 100, exp: 99 }
  ] as JWTPayload[])("rejects invalid claims without issuing or leaking a session: %j", async (changes) => {
    const credential = await token(changes);
    const response = await POST(request(credential));
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(runtime.authenticate).toHaveBeenCalledOnce();
    const body = await response.text();
    expect(body).toContain("UNAUTHENTICATED");
    expect(body + JSON.stringify(logs.mock.calls)).not.toContain(credential);
    expect(runtime.alertSignal).toHaveBeenCalledOnce();
    expect(runtime.alertSignal).toHaveBeenCalledWith("auth-failures", 1);
  });

  it("accepts the sole configured audience array and matching authorized party", async () => {
    await expect(adapter.verifyCredential(await token({ aud: [audience], azp: audience }))).resolves.toMatchObject({ provider: "oidc", subject: "external-author" });
  });

  it("rejects missing, oversized and tampered credentials without cookie or raw-error leakage", async () => {
    const credential = await token();
    const parts = credential.split(".");
    const tampered = `${parts[0]}.${parts[1]}.${parts[2]![0] === "A" ? "B" : "A"}${parts[2]!.slice(1)}`;
    for (const invalid of [undefined, "x".repeat(8193), "not-a-jwt", tampered]) {
      const response = await POST(request(invalid));
      expect(response.status).toBe(401);
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(await response.text()).not.toContain("JWT");
    }
    expect(runtime.alertSignal).toHaveBeenCalledTimes(4);
  });

  it("rejects cross-origin/missing-origin and non-OIDC mode before identity resolution", async () => {
    const credential = await token();
    for (const requestOrigin of ["https://untrusted.example.test", null]) expect((await POST(request(credential, requestOrigin))).status).toBe(403);
    runtime.env.AUTH_MODE = "development";
    const response = await POST(request(credential));
    expect(response.status).toBe(404);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(runtime.authenticate).not.toHaveBeenCalled();
    expect(runtime.rateLimit).not.toHaveBeenCalled();
    expect(runtime.alertSignal).toHaveBeenCalledTimes(3);
  });

  it("fails closed on throttling and dependency failure without storing external credentials", async () => {
    const credential = await token();
    runtime.rateLimit.mockRejectedValueOnce(errors.rateLimited(60));
    expect((await POST(request(credential))).status).toBe(429);
    expect(runtime.authenticate).not.toHaveBeenCalled();
    runtime.authenticate.mockReturnValueOnce({ execute: vi.fn().mockRejectedValue(new Error(`private-provider-error ${credential}`)) });
    const response = await POST(request(credential));
    expect(response.status).toBe(500);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("no-store");
    const evidence = await response.text() + JSON.stringify(logs.mock.calls);
    expect(evidence).not.toContain(credential);
    expect(evidence).not.toContain("private-provider-error");
    expect(runtime.alertSignal).toHaveBeenCalledTimes(2);
    expect(runtime.alertSignal).toHaveBeenCalledWith("auth-failures", 1);
  });

  it("requires deployed issuer/JWKS HTTPS without blocking loopback test configuration", () => {
    const deployed = { NODE_ENV: "test" as const, DATABASE_URL: "postgresql://unused?sslmode=require", AUTH_MODE: "oidc", AUTH_ISSUER: issuer, AUTH_AUDIENCE: audience, AUTH_JWKS_URL: `${issuer}/jwks`, SESSION_SECRET: secret, APP_ORIGIN: origin, MYTHRA_ENV: "preview", BILLING_PROVIDER: "http", BILLING_PROVIDER_API_URL: "https://billing.example.test", BILLING_PROVIDER_SECRET: "s18-billing-test-secret-32-characters", BILLING_WEBHOOK_SECRET: "s18-webhook-test-secret-32-characters" };
    expect(parseEnv(deployed).AUTH_MODE).toBe("oidc");
    for (const field of ["AUTH_ISSUER", "AUTH_JWKS_URL"]) expect(() => parseEnv({ ...deployed, [field]: "http://identity.example.test" })).toThrow(/OIDC.*HTTPS/u);
    expect(parseEnv({ ...deployed, MYTHRA_ENV: "local", AUTH_ISSUER: "http://127.0.0.1", AUTH_JWKS_URL: "http://127.0.0.1/jwks" }).AUTH_MODE).toBe("oidc");
  });
});
