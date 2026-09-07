// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseEnv, type AppEnv } from "@/lib/env";

const runtime = vi.hoisted(() => ({
  alertSignal: vi.fn(),
  authenticate: vi.fn(),
  env: {} as AppEnv,
  rateLimit: vi.fn(),
  readiness: vi.fn()
}));

vi.mock("@/lib/auth/runtime", () => ({ createAuthenticateUser: runtime.authenticate }));
vi.mock("@/lib/db/prisma", () => ({ getPrisma: () => ({}) }));
vi.mock("@/lib/env", async (original) => ({ ...await original<typeof import("@/lib/env")>(), getEnv: () => runtime.env }));
vi.mock("@/lib/http/api-rate-limit", () => ({ assertPublicApiRateLimit: runtime.rateLimit }));
vi.mock("@/lib/operations/health", () => ({ readinessSnapshot: runtime.readiness }));
vi.mock("@/lib/operations/runtime", () => ({ recordGlobalAlertSignal: runtime.alertSignal }));

import { POST as developmentSignIn } from "@/app/api/v2/auth/development/route";
import { GET as readiness } from "@/app/api/v2/health/ready/route";

const origin = "http://127.0.0.1:3210";

beforeEach(() => {
  runtime.alertSignal.mockReset().mockResolvedValue(undefined);
  runtime.authenticate.mockReset();
  runtime.rateLimit.mockReset().mockResolvedValue(undefined);
  runtime.readiness.mockReset();
  runtime.env = parseEnv({ NODE_ENV: "test", DATABASE_URL: "postgresql://unused", AUTH_MODE: "development", SESSION_SECRET: "s18-alert-producer-test-session-secret", APP_ORIGIN: origin });
});

describe("S18 operational alert producers", () => {
  it("reports the measured database gauge without changing readiness output", async () => {
    const snapshot = { status: "degraded", database: "available", databaseSaturationPercent: 91, workerCompatibility: "compatible", releaseVersion: "s18-test" };
    runtime.readiness.mockResolvedValue(snapshot);
    const response = await readiness();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual(snapshot);
    expect(runtime.alertSignal).toHaveBeenCalledOnce();
    expect(runtime.alertSignal).toHaveBeenCalledWith("database-saturation", 91);
  });

  it("preserves readiness when alert persistence is unavailable", async () => {
    const snapshot = { status: "ok", database: "available", databaseSaturationPercent: null, workerCompatibility: "compatible", releaseVersion: "s18-test" };
    runtime.readiness.mockResolvedValue(snapshot);
    runtime.alertSignal.mockRejectedValue(new Error("PRIVATE_ALERT_BACKEND_DETAIL"));
    const response = await readiness();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(snapshot);
    expect(runtime.alertSignal).toHaveBeenCalledWith("database-saturation", 0);
  });

  it("reports failed development authentication without changing the safe rejection", async () => {
    runtime.alertSignal.mockRejectedValue(new Error("PRIVATE_ALERT_BACKEND_DETAIL"));
    const response = await developmentSignIn(new Request(`${origin}/api/v2/auth/development`, { method: "POST", headers: { origin: "https://untrusted.example.test" } }));
    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("FORBIDDEN");
    expect(runtime.authenticate).not.toHaveBeenCalled();
    expect(runtime.alertSignal).toHaveBeenCalledOnce();
    expect(runtime.alertSignal).toHaveBeenCalledWith("auth-failures", 1);
  });
});
