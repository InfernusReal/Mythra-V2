ALTER TYPE "AuditEventKind" ADD VALUE IF NOT EXISTS 'SECURITY_EVENT';
ALTER TYPE "AuditEventKind" ADD VALUE IF NOT EXISTS 'ADMIN_RECOVERY';

CREATE TABLE "OperationalEvent" (
  "id" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "actorUserId" UUID,
  "projectId" UUID,
  "eventName" VARCHAR(120) NOT NULL,
  "routeKey" VARCHAR(120),
  "durationMs" INTEGER,
  "numericValue" BIGINT,
  "safeDimensions" JSONB NOT NULL DEFAULT '{}',
  "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OperationalEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OperationalEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "OperationalEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "OperationalEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "OperationalEvent_workspaceId_eventName_occurredAt_idx" ON "OperationalEvent"("workspaceId", "eventName", "occurredAt" DESC);
CREATE INDEX "OperationalEvent_eventName_occurredAt_idx" ON "OperationalEvent"("eventName", "occurredAt" DESC);
CREATE INDEX "OperationalEvent_projectId_eventName_occurredAt_idx" ON "OperationalEvent"("projectId", "eventName", "occurredAt" DESC);

CREATE TABLE "RateLimitBucket" (
  "keyHash" CHAR(64) NOT NULL,
  "count" INTEGER NOT NULL,
  "limitValue" INTEGER NOT NULL,
  "windowStart" TIMESTAMPTZ(3) NOT NULL,
  "resetAt" TIMESTAMPTZ(3) NOT NULL,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("keyHash"),
  CONSTRAINT "RateLimitBucket_bounds_check" CHECK ("count" >= 0 AND "limitValue" > 0 AND "resetAt" > "windowStart")
);
CREATE INDEX "RateLimitBucket_resetAt_idx" ON "RateLimitBucket"("resetAt");

CREATE TABLE "RecoveryAction" (
  "id" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "actorUserId" UUID NOT NULL,
  "actionKey" VARCHAR(80) NOT NULL,
  "targetType" VARCHAR(80) NOT NULL,
  "targetId" VARCHAR(128),
  "previewDigest" CHAR(64) NOT NULL,
  "confirmationDigest" CHAR(64),
  "status" VARCHAR(32) NOT NULL DEFAULT 'PREVIEWED',
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "completedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecoveryAction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RecoveryAction_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "RecoveryAction_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "RecoveryAction_status_check" CHECK ("status" IN ('PREVIEWED', 'COMPLETED', 'EXPIRED', 'REJECTED'))
);
CREATE INDEX "RecoveryAction_workspaceId_createdAt_idx" ON "RecoveryAction"("workspaceId", "createdAt" DESC);
CREATE INDEX "RecoveryAction_status_expiresAt_idx" ON "RecoveryAction"("status", "expiresAt");
