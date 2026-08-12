import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { SessionActor } from "@/domains/accounts/domain/identity";

export const SESSION_COOKIE = "mythra_session";
const sessionSchema = z.object({
  userId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
  sessionId: z.string().uuid(),
  issuedAt: z.number().int(),
  expiresAt: z.number().int()
});

type SessionPayload = z.infer<typeof sessionSchema>;

function signature(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSessionToken(actor: SessionActor, secret: string, now = Date.now()): string {
  const payload: SessionPayload = { ...actor, issuedAt: now, expiresAt: now + 8 * 60 * 60 * 1000 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded, secret)}`;
}

export function readSessionToken(token: string, secret: string, now = Date.now()): SessionActor | null {
  const [encoded, provided] = token.split(".");
  if (!encoded || !provided) return null;
  const expected = signature(encoded, secret);
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const payload = sessionSchema.parse(JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")));
    if (payload.expiresAt <= now) return null;
    return { userId: payload.userId, workspaceId: payload.workspaceId, role: payload.role, sessionId: payload.sessionId };
  } catch {
    return null;
  }
}

export function anonymousSessionId(): string {
  return randomUUID();
}
