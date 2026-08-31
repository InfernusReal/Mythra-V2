import { Prisma, type PrismaClient } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { errors } from "@/lib/contracts/errors";
import type { BillingRepository, BillingState } from "../application/ports";
import type { ProviderSubscriptionEvent, UsageInput, UsageResource } from "../domain/types";

const providerToDb = { FIXTURE: "FIXTURE", HTTP: "HTTP" } as const;
const planToDb = { core: "CORE", intelligence: "INTELLIGENCE" } as const;
const planFromDb = { CORE: "core", INTELLIGENCE: "intelligence" } as const;
const statusToDb = { incomplete: "INCOMPLETE", trialing: "TRIALING", active: "ACTIVE", grace: "GRACE", past_due: "PAST_DUE", canceled: "CANCELED" } as const;
const statusFromDb = { INCOMPLETE: "incomplete", TRIALING: "trialing", ACTIVE: "active", GRACE: "grace", PAST_DUE: "past_due", CANCELED: "canceled" } as const;
const resourceToDb = { binaryStorageBytes: "BINARY_STORAGE_BYTES", snapshotBytes: "SNAPSHOT_BYTES", revisionStorageBytes: "REVISION_STORAGE_BYTES", exportGenerationBytes: "EXPORT_GENERATION_BYTES", databaseRows: "DATABASE_ROWS", bandwidthBytes: "BANDWIDTH_BYTES", futureAiUnits: "FUTURE_AI_UNITS" } as const;
const resourceFromDb = Object.fromEntries(Object.entries(resourceToDb).map(([domain, database]) => [database, domain])) as Record<(typeof resourceToDb)[UsageResource], UsageResource>;

function safeNumber(value: bigint): number {
  return value > BigInt(Number.MAX_SAFE_INTEGER) ? Number.MAX_SAFE_INTEGER : Number(value);
}

function stateFromRecord(record: { providerCustomerId: string | null; providerSubscriptionId: string | null; planKey: "CORE" | "INTELLIGENCE" | null; status: keyof typeof statusFromDb | null; currentPeriodEnd: Date | null; graceEndsAt: Date | null; cancelAtPeriodEnd: boolean | null; providerVersion: bigint | null }): BillingState {
  return {
    providerCustomerId: record.providerCustomerId,
    providerSubscriptionId: record.providerSubscriptionId,
    planKey: record.planKey ? planFromDb[record.planKey] : "core",
    status: record.status ? statusFromDb[record.status] : "incomplete",
    currentPeriodEnd: record.currentPeriodEnd,
    graceEndsAt: record.graceEndsAt,
    cancelAtPeriodEnd: record.cancelAtPeriodEnd ?? false,
    providerVersion: record.providerVersion ?? 0n
  };
}

export class PrismaBillingRepository implements BillingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async assertCanManageBilling(actor: SessionActor): Promise<void> {
    if (actor.role !== "OWNER" && actor.role !== "ADMIN") throw errors.forbidden();
    const workspace = await this.prisma.workspace.findFirst({ where: { id: actor.workspaceId, members: { some: { userId: actor.userId, status: "ACTIVE", role: { in: ["OWNER", "ADMIN"] }, user: { externalIdentities: { some: { emailVerifiedAt: { not: null } } } } } } }, select: { id: true } });
    if (!workspace) throw errors.forbidden();
  }

  async readState(actor: SessionActor): Promise<BillingState> {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: actor.workspaceId, members: { some: { userId: actor.userId, status: "ACTIVE" } } },
      select: {
        billingCustomer: { select: { providerCustomerId: true } },
        subscription: { select: { providerSubscriptionId: true, planKey: true, status: true, currentPeriodEnd: true, graceEndsAt: true, cancelAtPeriodEnd: true, providerVersion: true } }
      }
    });
    if (!workspace) throw errors.forbidden();
    return stateFromRecord({ providerCustomerId: workspace.billingCustomer?.providerCustomerId ?? null, providerSubscriptionId: workspace.subscription?.providerSubscriptionId ?? null, planKey: workspace.subscription?.planKey ?? null, status: workspace.subscription?.status ?? null, currentPeriodEnd: workspace.subscription?.currentPeriodEnd ?? null, graceEndsAt: workspace.subscription?.graceEndsAt ?? null, cancelAtPeriodEnd: workspace.subscription?.cancelAtPeriodEnd ?? null, providerVersion: workspace.subscription?.providerVersion ?? null });
  }

  async readUsage(workspaceId: string, periodStart: Date): Promise<Readonly<Partial<Record<UsageResource, number>>>> {
    const groups = await this.prisma.usageEvent.groupBy({ by: ["resource"], where: { workspaceId, occurredAt: { gte: periodStart } }, _sum: { quantity: true } });
    return Object.fromEntries(groups.map((group) => [resourceFromDb[group.resource], safeNumber(group._sum.quantity ?? 0n)]));
  }

  async upsertCustomer(actor: SessionActor, provider: "FIXTURE" | "HTTP", providerCustomerId: string): Promise<void> {
    if (actor.role !== "OWNER" && actor.role !== "ADMIN") throw errors.forbidden();
    await this.prisma.$transaction(async (transaction) => {
      const workspace = await transaction.workspace.findFirst({ where: { id: actor.workspaceId, members: { some: { userId: actor.userId, status: "ACTIVE", role: { in: ["OWNER", "ADMIN"] }, user: { externalIdentities: { some: { emailVerifiedAt: { not: null } } } } } } }, select: { id: true } });
      if (!workspace) throw errors.forbidden();
      await transaction.billingCustomer.upsert({ where: { workspaceId: actor.workspaceId }, create: { workspaceId: actor.workspaceId, provider: providerToDb[provider], providerCustomerId }, update: { provider: providerToDb[provider], providerCustomerId } });
    });
  }

  async applyProviderEvent(event: ProviderSubscriptionEvent, provider: "FIXTURE" | "HTTP", payloadSha256: string, correlationId: string): Promise<{ replayed: boolean; outOfOrder: boolean }> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const existing = await transaction.billingWebhookEvent.findUnique({ where: { provider_providerEventId: { provider: providerToDb[provider], providerEventId: event.providerEventId } }, select: { status: true } });
        if (existing) return { replayed: true, outOfOrder: false };
        const workspace = await transaction.workspace.findUnique({ where: { id: event.workspaceId }, select: { id: true, subscription: { select: { providerVersion: true } } } });
        if (!workspace) throw errors.notFound();
        const outOfOrder = (workspace.subscription?.providerVersion ?? -1n) >= event.providerVersion;
        await transaction.billingWebhookEvent.create({ data: { workspaceId: event.workspaceId, provider: providerToDb[provider], providerEventId: event.providerEventId, eventType: event.eventType, payloadSha256, providerVersion: event.providerVersion, status: "RECEIVED" } });
        if (!outOfOrder) {
          await transaction.billingCustomer.upsert({ where: { workspaceId: event.workspaceId }, create: { workspaceId: event.workspaceId, provider: providerToDb[provider], providerCustomerId: event.providerCustomerId }, update: { provider: providerToDb[provider], providerCustomerId: event.providerCustomerId } });
          await transaction.billingSubscription.upsert({ where: { workspaceId: event.workspaceId }, create: { workspaceId: event.workspaceId, provider: providerToDb[provider], providerSubscriptionId: event.providerSubscriptionId, planKey: planToDb[event.planKey], status: statusToDb[event.status], currentPeriodStart: event.currentPeriodStart, currentPeriodEnd: event.currentPeriodEnd, cancelAtPeriodEnd: event.cancelAtPeriodEnd, graceEndsAt: event.status === "grace" ? event.currentPeriodEnd : null, providerVersion: event.providerVersion }, update: { provider: providerToDb[provider], providerSubscriptionId: event.providerSubscriptionId, planKey: planToDb[event.planKey], status: statusToDb[event.status], currentPeriodStart: event.currentPeriodStart, currentPeriodEnd: event.currentPeriodEnd, cancelAtPeriodEnd: event.cancelAtPeriodEnd, graceEndsAt: event.status === "grace" ? event.currentPeriodEnd : null, providerVersion: event.providerVersion } });
        }
        await transaction.billingWebhookEvent.update({ where: { provider_providerEventId: { provider: providerToDb[provider], providerEventId: event.providerEventId } }, data: { status: "PROCESSED", processedAt: new Date() } });
        await transaction.auditEvent.create({ data: { workspaceId: event.workspaceId, kind: "BILLING_CHANGE", targetType: "BillingSubscription", targetId: event.providerSubscriptionId, correlationId, safeMetadata: { eventType: event.eventType, planKey: event.planKey, status: event.status, providerVersion: event.providerVersion.toString(), outOfOrder } } });
        return { replayed: false, outOfOrder };
      });
    } catch (caught) {
      if (caught instanceof Prisma.PrismaClientKnownRequestError && caught.code === "P2002") return { replayed: true, outOfOrder: false };
      throw caught;
    }
  }

  async recordUsage(workspaceId: string, input: UsageInput): Promise<{ replayed: boolean }> {
    try {
      await this.prisma.usageEvent.create({ data: { workspaceId, resource: resourceToDb[input.resource], quantity: BigInt(input.quantity), idempotencyKey: input.idempotencyKey, sourceType: input.sourceType, sourceId: input.sourceId } });
      return { replayed: false };
    } catch (caught) {
      if (caught instanceof Prisma.PrismaClientKnownRequestError && caught.code === "P2002") return { replayed: true };
      throw caught;
    }
  }
}
