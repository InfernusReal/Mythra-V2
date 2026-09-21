import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { errors } from "@/lib/contracts/errors";

const payloadSchema = z.object({
  version: z.literal(1),
  workspaceId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actionKey: z.string().regex(/^[A-Z][A-Z0-9_]{1,79}$/u),
  targetType: z.string().regex(/^[A-Z][A-Z0-9_]{1,79}$/u),
  targetId: z.string().max(128).nullable(),
  previewDigest: z.string().regex(/^[a-f0-9]{64}$/u),
  expiresAt: z.number().int().positive()
}).strict();

export type DestructivePreview = z.infer<typeof payloadSchema>;

function signature(encoded: string, secret: string): string {
  return createHmac("sha256", secret).update(encoded).digest("base64url");
}

export function previewDigest(input: Readonly<Record<string, string | number | boolean | null>>): string {
  const ordered = Object.fromEntries(Object.entries(input).sort(([left], [right]) => left.localeCompare(right)));
  return createHash("sha256").update(JSON.stringify(ordered)).digest("hex");
}

export function issueDestructiveConfirmation(input: Omit<DestructivePreview, "version" | "expiresAt">, secret: string, now = Date.now(), ttlMs = 5 * 60_000): string {
  const payload: DestructivePreview = { version: 1, ...input, expiresAt: now + ttlMs };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded, secret)}`;
}

export function verifyDestructiveConfirmation(token: string, actor: SessionActor, expected: { actionKey: string; targetType: string; targetId: string | null; previewDigest: string }, secret: string, now = Date.now()): DestructivePreview {
  const [encoded, provided] = token.split(".");
  if (!encoded || !provided) throw errors.forbidden();
  const expectedSignature = signature(encoded, secret);
  const left = Buffer.from(provided);
  const right = Buffer.from(expectedSignature);
  if (left.length !== right.length || !timingSafeEqual(left, right)) throw errors.forbidden();
  try {
    const payload = payloadSchema.parse(JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")));
    if (payload.expiresAt <= now || payload.workspaceId !== actor.workspaceId || payload.actorUserId !== actor.userId || payload.actionKey !== expected.actionKey || payload.targetType !== expected.targetType || payload.targetId !== expected.targetId || payload.previewDigest !== expected.previewDigest) throw errors.forbidden();
    return payload;
  } catch (caught) {
    if (caught instanceof Error && caught.name === "AppError") throw caught;
    throw errors.forbidden();
  }
}
