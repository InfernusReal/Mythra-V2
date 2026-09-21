import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { errors } from "@/lib/contracts/errors";

const schema = z.object({ userId: z.string().uuid(), workspaceId: z.string().uuid(), projectId: z.string().uuid(), artifactId: z.string().uuid(), expiresAt: z.number().int().positive() }).strict();
function signature(encoded: string, secret: string): string { return createHmac("sha256", secret).update(encoded).digest("base64url"); }

export class HmacArtifactAccessTokenService {
  constructor(private readonly secret: string, private readonly ttlMs = 5 * 60 * 1_000) {}
  issue(actor: SessionActor, projectId: string, artifactId: string, now = Date.now()): string { const encoded = Buffer.from(JSON.stringify({ userId: actor.userId, workspaceId: actor.workspaceId, projectId, artifactId, expiresAt: now + this.ttlMs })).toString("base64url"); return `${encoded}.${signature(encoded, this.secret)}`; }
  verify(token: string, actor: SessionActor, projectId: string, artifactId: string, now = Date.now()): void {
    const [encoded, provided] = token.split("."); if (!encoded || !provided) throw errors.forbidden(); const expected = signature(encoded, this.secret); const left = Buffer.from(provided); const right = Buffer.from(expected); if (left.length !== right.length || !timingSafeEqual(left, right)) throw errors.forbidden();
    try { const payload = schema.parse(JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"))); if (payload.expiresAt <= now || payload.userId !== actor.userId || payload.workspaceId !== actor.workspaceId || payload.projectId !== projectId || payload.artifactId !== artifactId) throw errors.forbidden(); }
    catch (caught) { if (caught instanceof Error && caught.name === "AppError") throw caught; throw errors.forbidden(); }
  }
}
