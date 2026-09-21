import "dotenv/config";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaIdentityRepository } from "../domains/accounts/infrastructure/prisma-identity-repository";
import { BillingService } from "../domains/billing/application/service";
import { createPlanCatalog, type BillingCatalogConfig } from "../domains/billing/domain/catalog";
import { FixtureBillingProviderAdapter, signFixtureWebhook } from "../domains/billing/infrastructure/provider-adapters";
import { PrismaBillingRepository } from "../domains/billing/infrastructure/prisma-billing-repository";
import { PrismaWritingRepository } from "../domains/writing/infrastructure/prisma-writing-repository";
import { createLogger } from "../lib/observability/logger";
import { InMemoryMetricsSink } from "../lib/observability/metrics";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
const secret = "s14-database-webhook-secret-at-least-32-characters";
const config: BillingCatalogConfig = { coreAmountUsdCents: 1500, intelligenceAmountUsdCents: 2500, coreProviderPriceRef: "core-db", limits: { binaryStorageBytes: 10_000, snapshotBytes: 10_000, revisionStorageBytes: 10_000, exportGenerationBytes: 10_000, databaseRows: 10_000, bandwidthBytes: 10_000, futureAiUnits: 0 } };

async function rejected(operation: Promise<unknown>): Promise<boolean> { try { await operation; return false; } catch { return true; } }
function event(workspaceId: string, runId: string, providerEventId: string, version: number, planKey: "core" | "intelligence" = "core", status: "active" | "incomplete" = "active") { return { providerEventId: `${providerEventId}-${runId}`, eventType: "subscription.updated", workspaceId, providerCustomerId: `customer-${runId}`, providerSubscriptionId: `subscription-${runId}`, planKey, status, currentPeriodStart: "2026-09-01T00:00:00.000Z", currentPeriodEnd: "2026-10-01T00:00:00.000Z", cancelAtPeriodEnd: false, providerVersion: String(version) }; }

async function verify() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const suffix = randomUUID(); const identities = new PrismaIdentityRepository(prisma);
    const owner = await identities.resolveOrProvision({ provider: "s14", subject: `owner-${suffix}`, email: `owner-${suffix}@example.test`, emailVerified: true }, suffix);
    const outsider = await identities.resolveOrProvision({ provider: "s14", subject: `outsider-${suffix}`, email: `outsider-${suffix}@example.test`, emailVerified: true }, suffix);
    const unverified = await identities.resolveOrProvision({ provider: "s14", subject: `unverified-${suffix}`, email: `unverified-${suffix}@example.test`, emailVerified: false }, suffix);
    const actor = { ...owner, sessionId: randomUUID() }; const crossWorkspaceActor = { ...outsider, workspaceId: owner.workspaceId, sessionId: randomUUID() }; const unverifiedActor = { ...unverified, sessionId: randomUUID() };
    const repository = new PrismaBillingRepository(prisma); const provider = new FixtureBillingProviderAdapter(secret, "http://127.0.0.1:3000"); const metrics = new InMemoryMetricsSink(); const service = new BillingService(repository, provider, createPlanCatalog(config), config, createLogger({ service: "s14-verifier" }), metrics, () => new Date("2026-09-01T12:00:00.000Z"));
    const checkout = await service.createCheckout(actor, { planKey: "core", idempotencyKey: `database-checkout-${suffix}`, successUrl: "http://127.0.0.1/success", cancelUrl: "http://127.0.0.1/cancel" });
    const raw = new TextEncoder().encode(JSON.stringify(event(actor.workspaceId, suffix, "event-current", 2)));
    const applied = await service.handleWebhook(raw, signFixtureWebhook(raw, secret), "request-current"); const replay = await service.handleWebhook(raw, signFixtureWebhook(raw, secret), "request-replay");
    const oldRaw = new TextEncoder().encode(JSON.stringify(event(actor.workspaceId, suffix, "event-old", 1))); const old = await service.handleWebhook(oldRaw, signFixtureWebhook(oldRaw, secret), "request-old");
    const usageIdempotencyKey = `snapshot:database:${suffix}`; const firstUsage = await service.recordUsage(actor, { resource: "snapshotBytes", quantity: 2048, idempotencyKey: usageIdempotencyKey, sourceType: "ProjectSnapshot", sourceId: randomUUID() }); const replayUsage = await service.recordUsage(actor, { resource: "snapshotBytes", quantity: 2048, idempotencyKey: usageIdempotencyKey, sourceType: "ProjectSnapshot" });
    const status = await service.status(actor); const allowed = await service.authorizeCost(actor, "snapshotBytes", 1, "HIGH_COST_WRITE"); const quotaRejected = await rejected(service.authorizeCost(actor, "snapshotBytes", 8_000, "HIGH_COST_WRITE")); const ownedExportAllowed = await service.authorizeCost(actor, "snapshotBytes", Number.MAX_SAFE_INTEGER, "EXPORT_OWNED");
    const crossWorkspaceRejected = await rejected(repository.readState(crossWorkspaceActor));
    const unverifiedCheckoutRejected = await rejected(service.createCheckout(unverifiedActor, { planKey: "core", idempotencyKey: `database-unverified-${suffix}`, successUrl: "http://127.0.0.1/success", cancelUrl: "http://127.0.0.1/cancel" }));
    const futureCheckoutRejected = await rejected(service.createCheckout(actor, { planKey: "intelligence", idempotencyKey: `database-future-${suffix}`, successUrl: "http://127.0.0.1/success", cancelUrl: "http://127.0.0.1/cancel" }));
    const activeIntelligenceRejected = await rejected(prisma.billingSubscription.update({ where: { workspaceId: actor.workspaceId }, data: { planKey: "INTELLIGENCE", status: "ACTIVE" } }));
    const shape = await prisma.$queryRaw<Array<{ table_count: bigint; index_count: bigint; quantity_check: bigint }>>`SELECT (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('BillingCustomer','BillingSubscription','BillingWebhookEvent','UsageEvent'))::bigint AS table_count, (SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('BillingCustomer','BillingSubscription','BillingWebhookEvent','UsageEvent'))::bigint AS index_count, (SELECT COUNT(*) FROM pg_constraint WHERE conname='UsageEvent_quantity_check')::bigint AS quantity_check`;
    const subscription = await prisma.billingSubscription.findUniqueOrThrow({ where: { workspaceId: actor.workspaceId } }); const auditCount = await prisma.auditEvent.count({ where: { workspaceId: actor.workspaceId, kind: "BILLING_CHANGE" } }); const usageCount = await prisma.usageEvent.count({ where: { workspaceId: actor.workspaceId, resource: "SNAPSHOT_BYTES" } });
    if (!checkout.checkoutUrl || applied.replayed || !replay.replayed || !old.outOfOrder || firstUsage.replayed || !replayUsage.replayed || status.entitlements.usage.snapshotBytes !== 2048 || !allowed.allowed || !quotaRejected || !ownedExportAllowed.exempt || !crossWorkspaceRejected || !unverifiedCheckoutRejected || !futureCheckoutRejected || !activeIntelligenceRejected || subscription.providerVersion !== 2n || auditCount !== 2 || usageCount !== 1 || Number(shape[0]?.table_count ?? 0) !== 4 || Number(shape[0]?.index_count ?? 0) < 11 || Number(shape[0]?.quantity_check ?? 0) !== 1) throw new Error("S14 database proof failed.");
    // Console trace S14-DB-001: database proof reports bounded commercial, idempotency, ownership, quota and schema facts only.
    console.log(JSON.stringify({ level: "info", step: "S14-DB-001", event: "billing_database.verified", workspaceId: actor.workspaceId, coreAmountUsdCents: 1500, intelligenceDormant: true, webhookReplay: replay.replayed, outOfOrderIgnored: old.outOfOrder, providerVersion: subscription.providerVersion.toString(), billingAuditCount: auditCount, usageEventCount: usageCount, snapshotUsageBytes: status.entitlements.usage.snapshotBytes, quotaRejected, ownedExportAllowed: ownedExportAllowed.exempt, crossWorkspaceRejected, unverifiedCheckoutRejected, futureCheckoutRejected, activeIntelligenceRejected, tableCount: Number(shape[0]!.table_count), indexCount: Number(shape[0]!.index_count), metricCount: metrics.points.length }));
  } finally { await prisma.$disconnect(); }
}

async function rollback() {
  const seedPrisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try { const suffix = randomUUID(); const identity = await new PrismaIdentityRepository(seedPrisma).resolveOrProvision({ provider: "s14-rollback", subject: suffix, email: `${suffix}@example.test`, emailVerified: true }, suffix); const actor = { ...identity, sessionId: randomUUID() }; const writing = new PrismaWritingRepository(seedPrisma); const project = await writing.createProject(actor, { title: "S14 rollback predecessor" }); await writing.createChapter(actor, { projectId: project.id, title: "Preserved chapter" }); }
  finally { await seedPrisma.$disconnect(); }
  const sql = await readFile(new URL("../prisma/migrations/20260831163000_billing_quotas/rollback.sql", import.meta.url), "utf8"); const client = new Client({ connectionString }); await client.connect();
  try {
    const before = await client.query<{ projects: string; chapters: string; audits: string }>(`SELECT (SELECT COUNT(*) FROM "Project")::text AS projects, (SELECT COUNT(*) FROM "Chapter")::text AS chapters, (SELECT COUNT(*) FROM "AuditEvent")::text AS audits`);
    await client.query(sql);
    const after = await client.query<{ projects: string; chapters: string; audits: string }>(`SELECT (SELECT COUNT(*) FROM "Project")::text AS projects, (SELECT COUNT(*) FROM "Chapter")::text AS chapters, (SELECT COUNT(*) FROM "AuditEvent")::text AS audits`);
    const remaining = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('BillingCustomer','BillingSubscription','BillingWebhookEvent','UsageEvent')`);
    const assuranceColumns = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM information_schema.columns WHERE table_schema='public' AND table_name='ExternalIdentity' AND column_name='emailVerifiedAt'`);
    if (JSON.stringify(before.rows[0]) !== JSON.stringify(after.rows[0]) || remaining.rows[0]?.count !== "0" || assuranceColumns.rows[0]?.count !== "0") throw new Error("S14 rollback crossed its capability boundary.");
    await client.query(`DELETE FROM "_prisma_migrations" WHERE migration_name='20260831163000_billing_quotas'`);
    // Console trace S14-DB-002: rollback proof records only S14 schema removal and preserved predecessor row counts.
    console.log(JSON.stringify({ level: "info", step: "S14-DB-002", event: "billing_database.rollback_verified", remainingS14Tables: 0, remainingAssuranceColumns: 0, preservedProjectRows: Number(after.rows[0]!.projects), preservedChapterRows: Number(after.rows[0]!.chapters), preservedAuditRows: Number(after.rows[0]!.audits) }));
  } finally { await client.end(); }
}

const command = process.argv[2] ?? "verify";
if (command === "verify") await verify(); else if (command === "rollback") await rollback(); else throw new Error("Expected verify or rollback command.");
