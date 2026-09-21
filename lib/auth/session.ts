import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { SessionActor } from "@/domains/accounts/domain/identity";

export const SESSION_COOKIE = "mythra_session";
const sessionSchema = z.object({
  version: z.literal(2),
  keyId: z.string().regex(/^[a-zA-Z0-9_-]{1,32}$/),
  userId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
  sessionId: z.string().uuid(),
  issuedAt: z.number().int(),
  expiresAt: z.number().int()
});

type SessionPayload = z.infer<typeof sessionSchema>;
export interface SessionKeyring { current: string; currentKeyId: string; previous?: string; previousKeyId?: string }

function signature(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSessionToken(actor: SessionActor, secretOrKeyring: string | SessionKeyring, now = Date.now()): string {
  const keyring = typeof secretOrKeyring === "string" ? { current: secretOrKeyring, currentKeyId: "v1" } : secretOrKeyring;
  const payload: SessionPayload = { version: 2, keyId: keyring.currentKeyId, ...actor, issuedAt: now, expiresAt: now + 8 * 60 * 60 * 1000 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded, keyring.current)}`;
}

export function readSessionToken(token: string, secretOrKeyring: string | SessionKeyring, now = Date.now()): SessionActor | null {
  const [encoded, provided] = token.split(".");
  if (!encoded || !provided) return null;
  try {
    const payload = sessionSchema.parse(JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")));
    const keyring = typeof secretOrKeyring === "string" ? { current: secretOrKeyring, currentKeyId: "v1" } : secretOrKeyring;
    const candidates = payload.keyId === keyring.currentKeyId
      ? [keyring.current]
      : keyring.previous && payload.keyId === keyring.previousKeyId
        ? [keyring.previous]
        : [];
    const verified = candidates.some((secret) => {
      const left = Buffer.from(provided);
      const right = Buffer.from(signature(encoded, secret));
      return left.length === right.length && timingSafeEqual(left, right);
    });
    if (!verified) return null;
    if (payload.expiresAt <= now) return null;
    return { userId: payload.userId, workspaceId: payload.workspaceId, role: payload.role, sessionId: payload.sessionId };
  } catch {
    return null;
  }
}

export function anonymousSessionId(): string {
  return randomUUID();
}
