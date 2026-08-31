import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaIdentityRepository } from "../domains/accounts/infrastructure/prisma-identity-repository";
import { PrismaBillingRepository } from "../domains/billing/infrastructure/prisma-billing-repository";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
const WEBHOOK_ATTEMPTS = 32;
const WEBHOOK_CONCURRENCY = 4;
const DISTINCT_USAGE_EVENTS = 200;
const USAGE_CONCURRENCY = 2;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
async function runBatched<T, R>(items: readonly T[], width: number, operation: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let offset = 0; offset < items.length; offset += width) results.push(...await Promise.all(items.slice(offset, offset + width).map((item, localIndex) => operation(item, offset + localIndex))));
  return results;
}
try {
  const suffix = randomUUID(); const identity = await new PrismaIdentityRepository(prisma).resolveOrProvision({ provider: "s14-stress", subject: suffix, email: `${suffix}@example.test`, emailVerified: true }, suffix); const repository = new PrismaBillingRepository(prisma);
  const providerEventId = `stress-${suffix}`; const event = { providerEventId, eventType: "subscription.updated" as const, workspaceId: identity.workspaceId, providerCustomerId: `customer-${suffix}`, providerSubscriptionId: `subscription-${suffix}`, planKey: "core" as const, status: "active" as const, currentPeriodStart: new Date("2026-09-01T00:00:00Z"), currentPeriodEnd: new Date("2026-10-01T00:00:00Z"), cancelAtPeriodEnd: false, providerVersion: 1n }; const digest = createHash("sha256").update(JSON.stringify({ providerEventId })).digest("hex");
  // Console trace S14-STRESS-001: real PostgreSQL replay/usage stress begins with only bounded operation counts and workspace identity.
  console.log(JSON.stringify({ level: "info", step: "S14-STRESS-001", event: "billing_database.stress_started", workspaceId: identity.workspaceId, webhookAttempts: WEBHOOK_ATTEMPTS, webhookPeakConcurrency: WEBHOOK_CONCURRENCY, distinctUsageEvents: DISTINCT_USAGE_EVENTS, duplicateUsageAttempts: DISTINCT_USAGE_EVENTS, usagePeakConcurrency: USAGE_CONCURRENCY }));
  const started = performance.now();
  const webhookResults = await runBatched(Array.from({ length: WEBHOOK_ATTEMPTS }, (_, index) => index), WEBHOOK_CONCURRENCY, (index) => repository.applyProviderEvent(event, "FIXTURE", digest, `stress-webhook-${index}`));
  const usageInputs = Array.from({ length: DISTINCT_USAGE_EVENTS }, (_, index) => ({ resource: "snapshotBytes" as const, quantity: 2048, idempotencyKey: `stress-snapshot-${index}`, sourceType: "ProjectSnapshot", sourceId: `snapshot-${index}` }));
  const usageResults = await runBatched([...usageInputs, ...usageInputs], USAGE_CONCURRENCY, (input) => repository.recordUsage(identity.workspaceId, input));
  const elapsedMs = performance.now() - started;
  const webhookRows = await prisma.billingWebhookEvent.count({ where: { workspaceId: identity.workspaceId, providerEventId } }); const auditRows = await prisma.auditEvent.count({ where: { workspaceId: identity.workspaceId, kind: "BILLING_CHANGE", targetId: event.providerSubscriptionId } }); const usageRows = await prisma.usageEvent.count({ where: { workspaceId: identity.workspaceId, resource: "SNAPSHOT_BYTES" } }); const usage = await repository.readUsage(identity.workspaceId, new Date("2026-08-01T00:00:00Z"));
  const nonReplayWebhooks = webhookResults.filter((result) => !result.replayed).length; const nonReplayUsage = usageResults.filter((result) => !result.replayed).length;
  if (webhookRows !== 1 || auditRows !== 1 || nonReplayWebhooks !== 1 || usageRows !== DISTINCT_USAGE_EVENTS || nonReplayUsage !== DISTINCT_USAGE_EVENTS || usage.snapshotBytes !== DISTINCT_USAGE_EVENTS * 2048 || elapsedMs > 30_000) throw new Error(`S14 PostgreSQL concurrency stress failed: ${JSON.stringify({ webhookRows, auditRows, nonReplayWebhooks, usageRows, nonReplayUsage, snapshotUsageBytes: usage.snapshotBytes, elapsedMs: Math.round(elapsedMs) })}`);
  // Console trace S14-STRESS-002: stress completion proves exactly-once effects, exact aggregation and elapsed time without content.
  console.log(JSON.stringify({ level: "info", step: "S14-STRESS-002", event: "billing_database.stress_passed", workspaceId: identity.workspaceId, webhookRows, auditRows, nonReplayWebhooks, usageRows, nonReplayUsage, snapshotUsageBytes: usage.snapshotBytes, elapsedMs: Math.round(elapsedMs) }));
} finally { await prisma.$disconnect(); }
