-- Sub-gate 0 forward migration: identity, workspace, preferences, audit, and reserved outbox.
-- gen_random_uuid() is built into supported PostgreSQL versions; no optional extension is required.

CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE "WorkspaceMemberStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');
CREATE TYPE "AuditEventKind" AS ENUM ('AUTHENTICATION', 'OWNERSHIP_CHANGE', 'ARCHIVE', 'DELETE_REQUEST', 'RESTORE', 'EXPORT_REQUEST');
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE "User" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" VARCHAR(320) NOT NULL,
  "displayName" VARCHAR(160),
  "locale" VARCHAR(35) NOT NULL DEFAULT 'en',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "deletionRequestedAt" TIMESTAMPTZ(3),
  "purgeAfter" TIMESTAMPTZ(3),
  "deletedAt" TIMESTAMPTZ(3),
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_deletionRequestedAt_purgeAfter_idx" ON "User"("deletionRequestedAt", "purgeAfter");

CREATE TABLE "ExternalIdentity" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "provider" VARCHAR(64) NOT NULL,
  "providerSubject" VARCHAR(255) NOT NULL,
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExternalIdentity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ExternalIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ExternalIdentity_provider_providerSubject_key" ON "ExternalIdentity"("provider", "providerSubject");
CREATE INDEX "ExternalIdentity_userId_idx" ON "ExternalIdentity"("userId");

CREATE TABLE "Workspace" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ownerUserId" UUID NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "planKey" VARCHAR(64) NOT NULL DEFAULT 'core',
  "regionKey" VARCHAR(64),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "archivedAt" TIMESTAMPTZ(3),
  "purgeAfter" TIMESTAMPTZ(3),
  CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Workspace_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "Workspace_archivedAt_purgeAfter_idx" ON "Workspace"("archivedAt", "purgeAfter");
CREATE INDEX "Workspace_ownerUserId_idx" ON "Workspace"("ownerUserId");

CREATE TABLE "WorkspaceMember" (
  "workspaceId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
  "status" "WorkspaceMemberStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("workspaceId", "userId"),
  CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "WorkspaceMember_userId_workspaceId_idx" ON "WorkspaceMember"("userId", "workspaceId");

CREATE TABLE "UserPreference" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "locale" VARCHAR(35) NOT NULL DEFAULT 'en',
  "theme" VARCHAR(16) NOT NULL DEFAULT 'system',
  "editorFont" VARCHAR(64) NOT NULL DEFAULT 'serif',
  "fontSize" INTEGER NOT NULL DEFAULT 18,
  "lineHeight" DOUBLE PRECISION NOT NULL DEFAULT 1.62,
  "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserPreference_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "UserPreference_userId_workspaceId_key" ON "UserPreference"("userId", "workspaceId");
CREATE INDEX "UserPreference_workspaceId_idx" ON "UserPreference"("workspaceId");

CREATE TABLE "AuditEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspaceId" UUID NOT NULL,
  "actorUserId" UUID,
  "kind" "AuditEventKind" NOT NULL,
  "targetType" VARCHAR(80) NOT NULL,
  "targetId" VARCHAR(128),
  "correlationId" VARCHAR(128) NOT NULL,
  "safeMetadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuditEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "AuditEvent_workspaceId_createdAt_idx" ON "AuditEvent"("workspaceId", "createdAt" DESC);
CREATE INDEX "AuditEvent_correlationId_idx" ON "AuditEvent"("correlationId");

CREATE TABLE "OutboxEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspaceId" UUID NOT NULL,
  "aggregateType" VARCHAR(80) NOT NULL,
  "aggregateId" VARCHAR(128) NOT NULL,
  "eventType" VARCHAR(120) NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMPTZ(3),
  CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OutboxEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "OutboxEvent_attempts_nonnegative" CHECK ("attempts" >= 0)
);
CREATE INDEX "OutboxEvent_status_availableAt_idx" ON "OutboxEvent"("status", "availableAt");
CREATE INDEX "OutboxEvent_workspaceId_createdAt_idx" ON "OutboxEvent"("workspaceId", "createdAt" DESC);
