import { describe, expect, it, vi } from "vitest";
import { createSessionToken, readSessionToken } from "@/lib/auth/session";
import { parseEnv } from "@/lib/env";
import { evaluateAlert, alertRules } from "@/lib/observability/alerts";
import { InMemoryOperationalEventSink, operationalEventNames, recordOperationalEvent } from "@/lib/observability/operations";
import { retainedAtDays, uninterruptedWritingTime } from "@/lib/observability/product-health";
import { assertWorkerCompatibility, environmentProfiles } from "@/lib/operations/environments";
import { featureFlags } from "@/lib/operations/feature-flags";
import { assertWorkspaceScope, requireWorkspaceRole } from "@/lib/security/authorization";
import { issueDestructiveConfirmation, previewDigest, verifyDestructiveConfirmation } from "@/lib/security/destructive-confirmation";
import { assertContentSafeRecord } from "@/lib/security/privacy";
import { assertUploadSignature } from "@/lib/security/upload-policy";
import { normalizedRouteKey } from "@/components/operations/NavigationAnalytics";

const actor = { userId: "f14278a4-18d1-401f-9714-1ae313c1b4b0", workspaceId: "a873e0d0-e22f-4cd0-a7f9-484546489adc", role: "OWNER" as const, sessionId: "608b547d-41f8-449c-96c2-27b5fa3b058c" };
const current = "current-session-secret-32-characters-minimum";
const previous = "previous-session-secret-32-characters-minimum";

describe("S16 security and operations contracts", () => {
  it("rotates versioned sessions without accepting unknown keys or tampering", () => {
    const oldToken = createSessionToken(actor, { current: previous, currentKeyId: "old" }, 1_000);
    expect(readSessionToken(oldToken, { current, currentKeyId: "new", previous, previousKeyId: "old" }, 1_001)).toEqual(actor);
    expect(readSessionToken(oldToken, { current, currentKeyId: "new" }, 1_001)).toBeNull();
    expect(readSessionToken(`${oldToken}x`, { current, currentKeyId: "new", previous, previousKeyId: "old" }, 1_001)).toBeNull();
    expect(readSessionToken(oldToken, { current, currentKeyId: "new", previous, previousKeyId: "unknown" }, 1_001)).toBeNull();
  });

  it("enforces role and workspace isolation without returning cross-workspace state", () => {
    expect(requireWorkspaceRole(actor, "ADMIN")).toBe(actor);
    expect(() => requireWorkspaceRole({ ...actor, role: "MEMBER" }, "ADMIN")).toThrow(/not permitted/u);
    expect(() => assertWorkspaceScope(actor, "212334b8-2328-4713-aa1c-294c5db73af4")).toThrow(/not found/u);
  });

  it("binds destructive confirmation to actor, workspace, target, digest, and expiry", () => {
    const digest = previewDigest({ workspaceId: actor.workspaceId, targetId: actor.userId, count: 1 });
    const input = { workspaceId: actor.workspaceId, actorUserId: actor.userId, actionKey: "REQUEUE_OUTBOX", targetType: "OUTBOX_EVENT", targetId: actor.sessionId, previewDigest: digest };
    const token = issueDestructiveConfirmation(input, current, 1_000, 5_000);
    expect(verifyDestructiveConfirmation(token, actor, { actionKey: input.actionKey, targetType: input.targetType, targetId: input.targetId, previewDigest: digest }, current, 1_001).version).toBe(1);
    expect(() => verifyDestructiveConfirmation(token, actor, { actionKey: input.actionKey, targetType: input.targetType, targetId: input.targetId, previewDigest: digest }, current, 6_000)).toThrow();
    expect(() => verifyDestructiveConfirmation(token, { ...actor, userId: actor.sessionId }, { actionKey: input.actionKey, targetType: input.targetType, targetId: input.targetId, previewDigest: digest }, current, 1_001)).toThrow();
  });

  it("validates detected upload signatures independently of extension and declared type", () => {
    expect(() => assertUploadSignature("application/pdf", new TextEncoder().encode("%PDF-1.7\n"))).not.toThrow();
    expect(() => assertUploadSignature("application/pdf", new TextEncoder().encode("not pdf"))).toThrow(/signature/u);
    expect(() => assertUploadSignature("image/png", new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).not.toThrow();
    expect(() => assertUploadSignature("text/plain", new Uint8Array([0, 1, 2]))).toThrow(/signature/u);
  });

  it("rejects content, query, credentials, nested URL tokens, and unbounded telemetry", async () => {
    expect(() => assertContentSafeRecord({ manuscript: "private" })).toThrow();
    expect(() => assertContentSafeRecord({ message: "private prose" })).toThrow();
    expect(() => assertContentSafeRecord({ title: "private title" })).toThrow();
    expect(() => assertContentSafeRecord({ source: "https://example.test/path?access=secret" })).toThrow();
    expect(() => assertContentSafeRecord({ safeGroup: { safeValue: "ok", documentPayload: "private" } })).toThrow();
    expect(() => assertContentSafeRecord({ safeGroup: ["private"] })).toThrow();
    const sink = new InMemoryOperationalEventSink();
    await recordOperationalEvent(sink, { workspaceId: actor.workspaceId, actorUserId: actor.userId, eventName: "writing.save", durationMs: 12, dimensions: { outcome: "success" } });
    expect(sink.events).toHaveLength(1);
    await expect(recordOperationalEvent(sink, { workspaceId: actor.workspaceId, eventName: "writing.save", dimensions: { unknown: "private" } } as never)).rejects.toThrow();
    expect(normalizedRouteKey(`/app/chapters/${actor.userId}`)).toBe("/app/chapters/:id");
  });

  it("evaluates alert hysteresis and deterministic product health definitions", () => {
    const rule = alertRules.find((item) => item.key === "save-failures")!;
    expect(evaluateAlert(rule, 5).state).toBe("FIRING");
    expect(evaluateAlert(rule, 2, "FIRING").state).toBe("FIRING");
    expect(evaluateAlert(rule, 1, "FIRING").state).toBe("OK");
    expect(uninterruptedWritingTime([{ startedAt: 0, endedAt: 1_000, interrupted: false }, { startedAt: 1_000, endedAt: 2_000, interrupted: true }])).toBe(1_000);
    expect(retainedAtDays(new Date("2026-01-01T00:00:00Z"), [new Date("2026-04-02T00:00:00Z")], 90)).toBe(true);
    expect(retainedAtDays(new Date("2026-01-01T00:00:00Z"), [new Date("2026-01-08T00:00:00Z")], 7)).toBe(true);
    expect(operationalEventNames).toEqual(expect.arrayContaining(["structure.adopted", "capture.processed", "causality.feedback", "autosave.trust_feedback", "core.value_feedback", "external_tool.escape"]));
  });

  it("locks environment separation, independent secrets, worker compatibility, and canary kill switches", () => {
    const deployed = parseEnv({ DATABASE_URL: "postgresql://host/mythra?sslmode=require", NODE_ENV: "production", MYTHRA_ENV: "production", AUTH_MODE: "oidc", AUTH_ISSUER: "https://identity.example", AUTH_AUDIENCE: "mythra", AUTH_JWKS_URL: "https://identity.example/jwks", SESSION_SECRET: current, ADMIN_RECOVERY_SECRET: "admin-recovery-secret-32-characters-minimum", APP_ORIGIN: "https://mythra.example", BILLING_PROVIDER: "http", BILLING_PROVIDER_API_URL: "https://billing.example", BILLING_PROVIDER_SECRET: "billing-provider-secret-32-characters-minimum", BILLING_WEBHOOK_SECRET: "billing-webhook-secret-32-characters-minimum", CANARY_EDITOR_SAVE_PERCENT: "100" });
    expect(environmentProfiles.staging.syntheticDataOnly).toBe(true);
    expect(featureFlags(deployed, actor.workspaceId).canaryEditorSave).toBe(true);
    expect(() => parseEnv({ ...process.env, DATABASE_URL: "postgresql://host/mythra", NODE_ENV: "production", MYTHRA_ENV: "production", AUTH_MODE: "oidc", AUTH_ISSUER: "https://identity.example", AUTH_AUDIENCE: "mythra", AUTH_JWKS_URL: "https://identity.example/jwks", SESSION_SECRET: current, ADMIN_RECOVERY_SECRET: current, APP_ORIGIN: "http://mythra.example", BILLING_PROVIDER: "http", BILLING_PROVIDER_API_URL: "https://billing.example", BILLING_PROVIDER_SECRET: current, BILLING_WEBHOOK_SECRET: current })).toThrow();
    expect(() => assertWorkerCompatibility(1, 3)).toThrow(/incompatible/u);
    expect(() => assertWorkerCompatibility(1, 2)).not.toThrow();
    expect(parseEnv({ DATABASE_URL: "postgresql://host/mythra", NODE_ENV: "test", AUTH_MODE: "development", SESSION_SECRET: current, APP_ORIGIN: "http://localhost:3000", FEATURE_ADMIN_RECOVERY: "false", FEATURE_OPERATIONAL_ANALYTICS: "false" })).toMatchObject({ FEATURE_ADMIN_RECOVERY: false, FEATURE_OPERATIONAL_ANALYTICS: false });
    expect(() => parseEnv({ DATABASE_URL: "postgresql://host/mythra", NODE_ENV: "test", AUTH_MODE: "development", SESSION_SECRET: current, SESSION_PREVIOUS_SECRET: previous, APP_ORIGIN: "http://localhost:3000" })).toThrow(/previous secret and previous key identifier/u);
    vi.restoreAllMocks();
  });
});
