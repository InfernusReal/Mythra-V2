import type { PrismaClient } from "@/app/generated/prisma/client";
import { Prisma } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { errors } from "@/lib/contracts/errors";
import { advanceAlertObservation, alertRules, alertSignalForOperationalEvent, evaluateAlert, StructuredLogAlertDelivery, type AlertDelivery, type AlertRule } from "@/lib/observability/alerts";
import { logger } from "@/lib/observability/logger";
import type { OperationalEvent } from "@/lib/observability/operations";
import type { AdminOperationsSnapshot, OperationsRepository } from "../application/ports";

export class PrismaOperationsRepository implements OperationsRepository {
  constructor(private readonly prisma: PrismaClient, private readonly alertDelivery: AlertDelivery = new StructuredLogAlertDelivery(logger.child({ module: "operational-alerts" }))) {}

  async record(input: OperationalEvent): Promise<void> {
    const occurredAt = input.occurredAt ?? new Date();
    const deliveryId = await this.prisma.$transaction(async (transaction) => {
      if (input.projectId && !await transaction.project.findFirst({ where: { id: input.projectId, workspaceId: input.workspaceId }, select: { id: true } })) throw errors.notFound();
      await transaction.operationalEvent.create({ data: { workspaceId: input.workspaceId, actorUserId: input.actorUserId, projectId: input.projectId, eventName: input.eventName, routeKey: input.routeKey, durationMs: input.durationMs, numericValue: input.numericValue === undefined ? undefined : BigInt(input.numericValue), safeDimensions: input.dimensions, occurredAt } });
      const rule = alertRules.find((candidate) => candidate.eventName === input.eventName);
      if (!rule) return null;
      return this.evaluateAlertTransition(transaction, rule, `workspace:${input.workspaceId}`, input.workspaceId, alertSignalForOperationalEvent(rule, input), occurredAt);
    });
    if (deliveryId) await this.deliverOne(deliveryId, "inline-event", new Date()).catch(() => undefined);
  }

  async recordGlobalAlertSignal(ruleKey: string, signal: number, occurredAt = new Date()): Promise<void> {
    const rule = alertRules.find((candidate) => candidate.key === ruleKey);
    if (!rule) throw errors.validation("Unknown operational alert rule.");
    const deliveryId = await this.prisma.$transaction((transaction) => this.evaluateAlertTransition(transaction, rule, "global", null, signal, occurredAt));
    if (deliveryId) await this.deliverOne(deliveryId, "inline-system", new Date()).catch(() => undefined);
  }

  private async evaluateAlertTransition(transaction: Prisma.TransactionClient, rule: AlertRule, scopeKey: string, workspaceId: string | null, signal: number, occurredAt: Date): Promise<string | null> {
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${scopeKey}:${rule.key}`}, 0))::text AS "lockResult"`;
    const current = await transaction.operationalAlertState.findUnique({ where: { scopeKey_ruleKey: { scopeKey, ruleKey: rule.key } } });
    const observation = advanceAlertObservation(rule, signal, current ? { observed: current.observed, windowStartedAt: current.windowStartedAt } : undefined, occurredAt);
    const next = evaluateAlert(rule, observation.observed, current?.state === "FIRING" ? "FIRING" : "OK");
    const transitioned = next.state !== (current?.state ?? "OK");
    const transitionVersion = (current?.transitionVersion ?? 0) + (transitioned ? 1 : 0);
    const state = await transaction.operationalAlertState.upsert({
      where: { scopeKey_ruleKey: { scopeKey, ruleKey: rule.key } },
      create: { scopeKey, workspaceId, ruleKey: rule.key, eventName: rule.eventName, state: next.state, observed: observation.observed, severity: rule.severity, runbook: rule.runbook, windowStartedAt: observation.windowStartedAt, evaluatedAt: occurredAt, firedAt: next.state === "FIRING" ? occurredAt : null, transitionVersion },
      update: { state: next.state, observed: observation.observed, severity: rule.severity, runbook: rule.runbook, windowStartedAt: observation.windowStartedAt, evaluatedAt: occurredAt, transitionVersion, ...(transitioned && next.state === "FIRING" ? { firedAt: occurredAt } : {}), ...(transitioned && next.state === "OK" ? { recoveredAt: occurredAt } : {}) }
    });
    if (!transitioned) return null;
    const delivery = await transaction.operationalAlertDelivery.create({ data: { alertStateId: state.id, transitionVersion, transitionState: next.state, observed: observation.observed } });
    return delivery.id;
  }

  private async claimDelivery(workerId: string, now: Date, deliveryId?: string) {
    return this.prisma.$transaction(async (transaction) => {
      const ready = { OR: [{ status: { in: ["PENDING", "FAILED"] }, availableAt: { lte: now } }, { status: "DELIVERING", leasedUntil: { lte: now } }] };
      const candidate = await transaction.operationalAlertDelivery.findFirst({ where: { ...(deliveryId ? { id: deliveryId } : {}), ...ready }, orderBy: [{ availableAt: "asc" }, { id: "asc" }], select: { id: true } });
      if (!candidate) return null;
      const claimed = await transaction.operationalAlertDelivery.updateMany({ where: { id: candidate.id, ...ready }, data: { status: "DELIVERING", attempts: { increment: 1 }, leaseOwner: workerId, leasedUntil: new Date(now.getTime() + 30_000), lastErrorCode: null } });
      if (claimed.count !== 1) return null;
      return transaction.operationalAlertDelivery.findUniqueOrThrow({ where: { id: candidate.id }, include: { alertState: true } });
    });
  }

  private async deliverOne(deliveryId: string | undefined, workerId: string, now: Date): Promise<"delivered" | "retried" | null> {
    const claimed = await this.claimDelivery(workerId, now, deliveryId);
    if (!claimed) return null;
    try {
      await this.alertDelivery.deliver({ deliveryId: claimed.id, key: claimed.alertState.ruleKey, state: claimed.transitionState === "FIRING" ? "FIRING" : "OK", observed: claimed.observed, severity: claimed.alertState.severity === "critical" ? "critical" : "warning", runbook: claimed.alertState.runbook, scopeType: claimed.alertState.workspaceId ? "workspace" : "global", workspaceId: claimed.alertState.workspaceId, transitionVersion: claimed.transitionVersion, evaluatedAt: claimed.alertState.evaluatedAt });
      await this.prisma.operationalAlertDelivery.updateMany({ where: { id: claimed.id, status: "DELIVERING", leaseOwner: workerId }, data: { status: "DELIVERED", deliveredAt: new Date(), leaseOwner: null, leasedUntil: null, lastErrorCode: null } });
      return "delivered";
    } catch {
      const delayMs = Math.min(5 * 60_000, 1_000 * (2 ** Math.min(8, Math.max(0, claimed.attempts - 1))));
      await this.prisma.operationalAlertDelivery.updateMany({ where: { id: claimed.id, status: "DELIVERING", leaseOwner: workerId }, data: { status: "FAILED", availableAt: new Date(now.getTime() + delayMs), leaseOwner: null, leasedUntil: null, lastErrorCode: "ALERT_DELIVERY_FAILED" } });
      return "retried";
    }
  }

  private async expireCountWindows(now: Date): Promise<number> {
    let evaluated = 0;
    for (const rule of alertRules.filter((candidate) => candidate.observation === "COUNT_EVENTS" || candidate.observation === "COUNT_FAILURES")) {
      const candidates = await this.prisma.operationalAlertState.findMany({ where: { ruleKey: rule.key, observed: { gt: 0 }, windowStartedAt: { lte: new Date(now.getTime() - rule.windowMinutes * 60_000) } }, orderBy: { id: "asc" }, take: 100, select: { scopeKey: true, workspaceId: true } });
      for (const candidate of candidates) {
        await this.prisma.$transaction((transaction) => this.evaluateAlertTransition(transaction, rule, candidate.scopeKey, candidate.workspaceId, 0, now));
        evaluated += 1;
      }
    }
    return evaluated;
  }

  async deliverPendingAlerts(workerId: string, limit = 50, now = new Date()): Promise<{ expired: number; claimed: number; delivered: number; retried: number }> {
    const boundedLimit = Math.max(1, Math.min(50, Math.round(limit)));
    const expired = await this.expireCountWindows(now);
    let claimed = 0; let delivered = 0; let retried = 0;
    for (let index = 0; index < boundedLimit; index += 1) {
      const outcome = await this.deliverOne(undefined, workerId, now);
      if (!outcome) break;
      claimed += 1;
      if (outcome === "delivered") delivered += 1; else retried += 1;
    }
    return { expired, claimed, delivered, retried };
  }

  async adminSnapshot(actor: SessionActor): Promise<AdminOperationsSnapshot> {
    const workspace = await this.prisma.workspace.findFirst({ where: { id: actor.workspaceId }, select: { id: true, planKey: true, archivedAt: true, _count: { select: { members: true, projects: true } }, subscription: { select: { planKey: true, status: true, graceEndsAt: true } } } });
    if (!workspace) throw errors.notFound();
    const [usage, jobs, exports, snapshots, audits, operations, alerts] = await Promise.all([
      this.prisma.usageEvent.groupBy({ by: ["resource"], where: { workspaceId: actor.workspaceId }, _sum: { quantity: true }, orderBy: { resource: "asc" } }),
      this.prisma.outboxEvent.findMany({ where: { workspaceId: actor.workspaceId }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, eventType: true, status: true, attempts: true, lastErrorCode: true, createdAt: true } }),
      this.prisma.portabilityArtifact.findMany({ where: { project: { workspaceId: actor.workspaceId } }, orderBy: { createdAt: "desc" }, take: 25, select: { id: true, format: true, scope: true, status: true, sizeBytes: true, createdAt: true } }),
      this.prisma.projectSnapshot.findMany({ where: { project: { workspaceId: actor.workspaceId } }, orderBy: { requestedAt: "desc" }, take: 25, select: { id: true, status: true, sizeBytes: true, requestedAt: true } }),
      this.prisma.auditEvent.findMany({ where: { workspaceId: actor.workspaceId }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, kind: true, targetType: true, targetId: true, correlationId: true, createdAt: true } }),
      this.prisma.operationalEvent.findMany({ where: { workspaceId: actor.workspaceId }, orderBy: { occurredAt: "desc" }, take: 100, select: { eventName: true, routeKey: true, durationMs: true, numericValue: true, occurredAt: true } }),
      this.prisma.operationalAlertState.findMany({ where: { OR: [{ workspaceId: actor.workspaceId }, { scopeKey: "global" }] }, orderBy: [{ state: "asc" }, { evaluatedAt: "desc" }], take: 50, select: { ruleKey: true, state: true, observed: true, severity: true, runbook: true, evaluatedAt: true } })
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
      operations: operations.map((item) => ({ ...item, numericValue: item.numericValue === null ? null : Number(item.numericValue), occurredAt: item.occurredAt.toISOString() })),
      alerts: alerts.map((item) => ({ key: item.ruleKey, state: item.state === "FIRING" ? "FIRING" as const : "OK" as const, observed: item.observed, severity: item.severity === "critical" ? "critical" as const : "warning" as const, runbook: item.runbook, evaluatedAt: item.evaluatedAt.toISOString() }))
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
