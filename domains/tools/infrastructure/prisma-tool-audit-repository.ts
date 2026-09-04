import type { PrismaClient } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { assertContentSafeRecord } from "@/lib/security/privacy";
import type { AgentToolAuditRepository } from "../application/ports";

export class PrismaAgentToolAuditRepository implements AgentToolAuditRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async record(actor: SessionActor, projectId: string, input: Parameters<AgentToolAuditRepository["record"]>[2]): Promise<void> {
    const safeMetadata = { toolName: input.toolName, permission: input.permission, outcome: input.outcome, durationMs: input.durationMs, ...(input.errorCode ? { errorCode: input.errorCode } : {}), ...(input.resultCount === undefined ? {} : { resultCount: input.resultCount }), ...(input.truncated === undefined ? {} : { isTruncated: input.truncated }) };
    assertContentSafeRecord(safeMetadata);
    await this.prisma.auditEvent.create({ data: { workspaceId: actor.workspaceId, actorUserId: actor.userId, kind: "AGENT_TOOL_ACCESS", targetType: "ProjectTool", targetId: projectId, correlationId: input.correlationId, safeMetadata } });
  }
}
