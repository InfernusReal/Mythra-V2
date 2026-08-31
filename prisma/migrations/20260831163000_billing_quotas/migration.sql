CREATE TYPE "BillingProvider" AS ENUM ('FIXTURE', 'HTTP');
CREATE TYPE "BillingPlanKey" AS ENUM ('CORE', 'INTELLIGENCE');
CREATE TYPE "SubscriptionStatus" AS ENUM ('INCOMPLETE', 'TRIALING', 'ACTIVE', 'GRACE', 'PAST_DUE', 'CANCELED');
CREATE TYPE "BillingWebhookStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'REJECTED');
CREATE TYPE "UsageResource" AS ENUM ('BINARY_STORAGE_BYTES', 'SNAPSHOT_BYTES', 'REVISION_STORAGE_BYTES', 'EXPORT_GENERATION_BYTES', 'DATABASE_ROWS', 'BANDWIDTH_BYTES', 'FUTURE_AI_UNITS');

ALTER TYPE "AuditEventKind" ADD VALUE 'BILLING_CHANGE';
ALTER TYPE "AuditEventKind" ADD VALUE 'QUOTA_EVENT';

ALTER TABLE "ExternalIdentity" ADD COLUMN "emailVerifiedAt" TIMESTAMPTZ(3);

CREATE TABLE "BillingCustomer" (
  "id" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "provider" "BillingProvider" NOT NULL,
  "providerCustomerId" VARCHAR(160) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "BillingCustomer_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BillingCustomer_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "BillingSubscription" (
  "id" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "provider" "BillingProvider" NOT NULL,
  "providerSubscriptionId" VARCHAR(160) NOT NULL,
  "planKey" "BillingPlanKey" NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'INCOMPLETE',
  "currentPeriodStart" TIMESTAMPTZ(3),
  "currentPeriodEnd" TIMESTAMPTZ(3),
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "graceEndsAt" TIMESTAMPTZ(3),
  "providerVersion" BIGINT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "BillingSubscription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BillingSubscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "BillingSubscription_intelligence_dormant_check" CHECK ("planKey" <> 'INTELLIGENCE' OR "status" IN ('INCOMPLETE', 'CANCELED')),
  CONSTRAINT "BillingSubscription_grace_check" CHECK ("status" <> 'GRACE' OR "graceEndsAt" IS NOT NULL)
);

CREATE TABLE "BillingWebhookEvent" (
  "id" UUID NOT NULL,
  "workspaceId" UUID,
  "provider" "BillingProvider" NOT NULL,
  "providerEventId" VARCHAR(160) NOT NULL,
  "eventType" VARCHAR(120) NOT NULL,
  "payloadSha256" CHAR(64) NOT NULL,
  "providerVersion" BIGINT NOT NULL DEFAULT 0,
  "status" "BillingWebhookStatus" NOT NULL DEFAULT 'RECEIVED',
  "errorCode" VARCHAR(80),
  "receivedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMPTZ(3),
  CONSTRAINT "BillingWebhookEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BillingWebhookEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "BillingWebhookEvent_digest_check" CHECK ("payloadSha256" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "BillingWebhookEvent_version_check" CHECK ("providerVersion" >= 0)
);

CREATE TABLE "UsageEvent" (
  "id" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "resource" "UsageResource" NOT NULL,
  "quantity" BIGINT NOT NULL,
  "idempotencyKey" VARCHAR(128) NOT NULL,
  "sourceType" VARCHAR(80) NOT NULL,
  "sourceId" VARCHAR(128),
  "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UsageEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "UsageEvent_quantity_check" CHECK ("quantity" >= 0)
);

CREATE UNIQUE INDEX "BillingCustomer_workspaceId_key" ON "BillingCustomer"("workspaceId");
CREATE UNIQUE INDEX "BillingCustomer_provider_providerCustomerId_key" ON "BillingCustomer"("provider", "providerCustomerId");
CREATE UNIQUE INDEX "BillingSubscription_workspaceId_key" ON "BillingSubscription"("workspaceId");
CREATE UNIQUE INDEX "BillingSubscription_provider_providerSubscriptionId_key" ON "BillingSubscription"("provider", "providerSubscriptionId");
CREATE INDEX "BillingSubscription_status_currentPeriodEnd_idx" ON "BillingSubscription"("status", "currentPeriodEnd");
CREATE UNIQUE INDEX "BillingWebhookEvent_provider_providerEventId_key" ON "BillingWebhookEvent"("provider", "providerEventId");
CREATE INDEX "BillingWebhookEvent_workspaceId_receivedAt_idx" ON "BillingWebhookEvent"("workspaceId", "receivedAt" DESC);
CREATE INDEX "BillingWebhookEvent_status_receivedAt_idx" ON "BillingWebhookEvent"("status", "receivedAt");
CREATE UNIQUE INDEX "UsageEvent_workspaceId_resource_idempotencyKey_key" ON "UsageEvent"("workspaceId", "resource", "idempotencyKey");
CREATE INDEX "UsageEvent_workspaceId_resource_occurredAt_idx" ON "UsageEvent"("workspaceId", "resource", "occurredAt");
