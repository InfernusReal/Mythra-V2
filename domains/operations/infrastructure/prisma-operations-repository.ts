import type { PrismaClient } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { errors } from "@/lib/contracts/errors";
import type { OperationalEvent } from "@/lib/observability/operations";
import type { AdminOperationsSnapshot, OperationsRepository } from "../application/ports";

export class PrismaOperationsRepository implements OperationsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async record(input: OperationalEvent): Promise<void> {
    if (input.projectId && !await this.prisma.project.findFirst({ where: { id: input.projectId, workspaceId: input.workspaceId }, select: { id: true } })) throw errors.notFound();
    await this.prisma.operationalEvent.create({ data: { workspaceId: input.workspaceId, actorUserId: input.actorUserId, projectId: input.projectId, eventName: input.eventName, routeKey: input.routeKey, durationMs: input.durationMs, numericValue: input.numericValue === undefined ? undefined : BigInt(input.numericValue), safeDimensions: input.dimensions, occurredAt: input.occurredAt } });
  }

  async adminSnapshot(actor: SessionActor): Promise<AdminOperationsSnapshot> {
    const workspace = await this.prisma.workspace.findFirst({ where: { id: actor.workspaceId }, select: { id: true, planKey: true, archivedAt: true, _count: { select: { members: true, projects: true } }, subscription: { select: { planKey: true, status: true, graceEndsAt: true } } } });
    if (!workspace) throw errors.notFound();
    const [usage, jobs, exports, snapshots, audits, operations] = await Promise.all([
      this.prisma.usageEvent.groupBy({ by: ["resource"], where: { workspaceId: actor.workspaceId }, _sum: { quantity: true }, orderBy: { resource: "asc" } }),
      this.prisma.outboxEvent.findMany({ where: { workspaceId: actor.workspaceId }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, eventType: true, status: true, attempts: true, lastErrorCode: true, createdAt: true } }),
      this.prisma.portabilityArtifact.findMany({ where: { project: { workspaceId: actor.workspaceId } }, orderBy: { createdAt: "desc" }, take: 25, select: { id: true, format: true, scope: true, status: true, sizeBytes: true, createdAt: true } }),
      this.prisma.projectSnapshot.findMany({ where: { project: { workspaceId: actor.workspaceId } }, orderBy: { requestedAt: "desc" }, take: 25, select: { id: true, status: true, sizeBytes: true, requestedAt: true } }),
      this.prisma.auditEvent.findMany({ where: { workspaceId: actor.workspaceId }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, kind: true, targetType: true, targetId: true, correlationId: true, createdAt: true } }),
      this.prisma.operationalEvent.findMany({ where: { workspaceId: actor.workspaceId }, orderBy: { occurredAt: "desc" }, take: 100, select: { eventName: true, routeKey: true, durationMs: true, numericValue: true, occurredAt: true } })
    ]);
    return {
      actor: { userId: actor.userId, role: actor.role },
      workspace: { id: workspace.id, planKey: workspace.planKey, archived: Boolean(workspace.archivedAt), memberCount: workspace._count.members, projectCount: workspace._count.projects },
      subscription: workspace.subscription ? { planKey: workspace.subscription.planKey, status: workspace.subscription.status, graceEndsAt: workspace.subscription.graceEndsAt?.toISOString() ?? null } : null,
      quotas: usage.map((item) => ({ resource: item.resource, quantity: Number(item._sum.quantity ?? 0n) })),
      jobs: jobs.map((item) => ({ id: item.id, jobType: item.eventType, status: item.status, attempts: item.attempts, errorCode: item.lastErrorCode, createdAt: item.createdAt.toISOString() })),
      exports: exports.map((item) => ({ id: item.id, format: item.format, scope: item.scope, status: item.status, sizeBytes: item.sizeBytes === null ? null : Number(item.sizeBytes), createdAt: item.createdAt.toISOString() })),
      snapshots: snapshots.map((item) => ({ id: item.id, status: item.status, sizeBytes: item.sizeBytes === null ? null : Number(item.sizeBytes), createdAt: item.requestedAt.toISOString() })),
      audits: audits.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
      operations: operations.map((item) => ({ ...item, numericValue: item.numericValue === null ? null : Number(item.numericValue), occurredAt: item.occurredAt.toISOString() }))
    };
  }

  async previewRecovery(actor: SessionActor, input: { actionKey: "REQUEUE_OUTBOX"; targetId: string; previewDigest: string; expiresAt: Date }): Promise<{ id: string; replayed: boolean }> {
    const target = await this.prisma.outboxEvent.findFirst({ where: { id: input.targetId, workspaceId: actor.workspaceId, status: "FAILED" }, select: { id: true } });
    if (!target) throw errors.notFound();
    const existing = await this.prisma.recoveryAction.findFirst({ where: { workspaceId: actor.workspaceId, actorUserId: actor.userId, actionKey: input.actionKey, targetId: input.targetId, previewDigest: input.previewDigest, status: "PREVIEWED", expiresAt: { gt: new Date() } }, select: { id: true } });
    if (existing) return { id: existing.id, replayed: true };
    const row = await this.prisma.recoveryAction.create({ data: { workspaceId: actor.workspaceId, actorUserId: actor.userId, actionKey: input.actionKey, targetType: "OUTBOX_EVENT", targetId: input.targetId, previewDigest: input.previewDigest, expiresAt: input.expiresAt }, select: { id: true } });
    return { id: row.id, replayed: false };
  }

  async completeRecovery(actor: SessionActor, input: { recoveryId: string; confirmationDigest: string }): Promise<{ completed: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.recoveryAction.updateMany({ where: { id: input.recoveryId, workspaceId: actor.workspaceId, actorUserId: actor.userId, status: "PREVIEWED", expiresAt: { gt: new Date() } }, data: { status: "COMPLETED", confirmationDigest: input.confirmationDigest, completedAt: new Date() } });
      if (claimed.count !== 1) return { completed: false };
      const recovery = await tx.recoveryAction.findUniqueOrThrow({ where: { id: input.recoveryId }, select: { targetId: true } });
      const updated = await tx.outboxEvent.updateMany({ where: { id: recovery.targetId ?? "", workspaceId: actor.workspaceId, status: "FAILED" }, data: { status: "PENDING", availableAt: new Date(), leaseOwner: null, leasedUntil: null, lastErrorCode: null } });
      if (updated.count !== 1) throw errors.conflict();
      await tx.auditEvent.create({ data: { workspaceId: actor.workspaceId, actorUserId: actor.userId, kind: "ADMIN_RECOVERY", targetType: "OUTBOX_EVENT", targetId: recovery.targetId, correlationId: input.recoveryId, safeMetadata: { actionKey: "REQUEUE_OUTBOX", outcome: "COMPLETED" } } });
      return { completed: true };
    });
  }
}
