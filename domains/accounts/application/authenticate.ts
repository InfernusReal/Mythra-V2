import { randomUUID } from "node:crypto";
import type { Logger } from "@/lib/observability/logger";
import type { MetricsSink } from "@/lib/observability/metrics";
import type { ExternalAuthAdapter, IdentityRepository } from "./ports";
import type { SessionActor } from "../domain/identity";

export class AuthenticateUser {
  constructor(
    private readonly auth: ExternalAuthAdapter,
    private readonly identities: IdentityRepository,
    private readonly logger: Logger,
    private readonly metrics: MetricsSink
  ) {}

  async execute(credential: string, correlationId: string): Promise<SessionActor> {
    const startedAt = performance.now();
    // Console trace S0-AUTH-001: authentication begins with identifiers only; credential values are never logged.
    this.logger.info("auth.verification_started", { step: "S0-AUTH-001", correlationId, provider: this.auth.provider });
    const principal = await this.auth.verifyCredential(credential);
    const identity = await this.identities.resolveOrProvision(principal, correlationId);
    const actor: SessionActor = { ...identity, sessionId: randomUUID() };
    this.metrics.record({
      name: "authentication.duration",
      value: performance.now() - startedAt,
      unit: "milliseconds",
      attributes: { provider: this.auth.provider, result: "success" }
    });
    // Console trace S0-AUTH-002: internal identity and first workspace resolution completed.
    this.logger.info("auth.actor_resolved", {
      step: "S0-AUTH-002",
      correlationId,
      userId: actor.userId,
      workspaceId: actor.workspaceId,
      role: actor.role,
      createdWorkspace: identity.createdWorkspace
    });
    return actor;
  }
}
