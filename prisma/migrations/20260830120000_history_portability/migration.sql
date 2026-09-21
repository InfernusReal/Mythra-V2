ALTER TYPE "ChapterRevisionKind" ADD VALUE IF NOT EXISTS 'RESTORE_CHECKPOINT';
ALTER TYPE "ChapterRevisionKind" ADD VALUE IF NOT EXISTS 'DESTRUCTIVE_CHECKPOINT';

CREATE TYPE "PortabilityArtifactPurpose" AS ENUM ('INTERNAL_BACKUP', 'USER_EXPORT', 'IMPORT_ORIGINAL');
CREATE TYPE "PortabilityArtifactScope" AS ENUM ('CHAPTER', 'VOLUME', 'MANUSCRIPT', 'FULL_PROJECT');
CREATE TYPE "PortabilityArtifactFormat" AS ENUM ('TEXT', 'MARKDOWN', 'DOCX', 'MYTHRA_JSON');
CREATE TYPE "PortabilityArtifactStatus" AS ENUM ('PENDING', 'PROCESSING', 'VERIFIED', 'FAILED', 'EXPIRED');
CREATE TYPE "ProjectSnapshotStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');
CREATE TYPE "ImportSessionStatus" AS ENUM ('PREVIEW_READY', 'CONFIRMED', 'FAILED', 'EXPIRED');

ALTER TABLE "ObjectRevision"
  ADD COLUMN "representationVersion" VARCHAR(24) NOT NULL DEFAULT '2.2.1',
  ADD COLUMN "snapshotHash" CHAR(64),
  ADD COLUMN "createdById" UUID;

CREATE TABLE "ProjectSnapshot" (
  "id" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "createdById" UUID NOT NULL,
  "status" "ProjectSnapshotStatus" NOT NULL DEFAULT 'PENDING',
  "representationVersion" VARCHAR(24) NOT NULL DEFAULT '2.2.1',
  "structuralVersion" INTEGER NOT NULL,
  "storageKey" VARCHAR(320),
  "manifest" JSONB,
  "sha256" CHAR(64),
  "sizeBytes" BIGINT,
  "idempotencyKey" VARCHAR(96) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastErrorCode" VARCHAR(80),
  "requestedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMPTZ(3),
  "verifiedAt" TIMESTAMPTZ(3),
  "retentionUntil" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "ProjectSnapshot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProjectSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ProjectSnapshot_attempts_check" CHECK ("attempts" >= 0 AND "attempts" <= 8),
  CONSTRAINT "ProjectSnapshot_sizeBytes_check" CHECK ("sizeBytes" IS NULL OR "sizeBytes" >= 0)
);

CREATE TABLE "PortabilityArtifact" (
  "id" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "snapshotId" UUID,
  "createdById" UUID NOT NULL,
  "purpose" "PortabilityArtifactPurpose" NOT NULL,
  "scope" "PortabilityArtifactScope" NOT NULL,
  "format" "PortabilityArtifactFormat" NOT NULL,
  "status" "PortabilityArtifactStatus" NOT NULL DEFAULT 'PENDING',
  "representationVersion" VARCHAR(24) NOT NULL DEFAULT '2.2.1',
  "sourceObjectId" UUID,
  "storageKey" VARCHAR(320),
  "manifest" JSONB,
  "sha256" CHAR(64),
  "sizeBytes" BIGINT,
  "idempotencyKey" VARCHAR(96) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastErrorCode" VARCHAR(80),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMPTZ(3),
  "verifiedAt" TIMESTAMPTZ(3),
  "expiresAt" TIMESTAMPTZ(3),
  CONSTRAINT "PortabilityArtifact_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PortabilityArtifact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PortabilityArtifact_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ProjectSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PortabilityArtifact_attempts_check" CHECK ("attempts" >= 0 AND "attempts" <= 8),
  CONSTRAINT "PortabilityArtifact_sizeBytes_check" CHECK ("sizeBytes" IS NULL OR "sizeBytes" >= 0),
  CONSTRAINT "PortabilityArtifact_expiry_check" CHECK ("purpose" <> 'USER_EXPORT' OR "expiresAt" IS NOT NULL)
);

CREATE TABLE "ImportSession" (
  "id" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "createdById" UUID NOT NULL,
  "format" "PortabilityArtifactFormat" NOT NULL,
  "status" "ImportSessionStatus" NOT NULL DEFAULT 'PREVIEW_READY',
  "representationVersion" VARCHAR(24) NOT NULL DEFAULT '2.2.1',
  "originalStorageKey" VARCHAR(320) NOT NULL,
  "originalSha256" CHAR(64) NOT NULL,
  "originalSizeBytes" BIGINT NOT NULL,
  "preview" JSONB NOT NULL,
  "idempotencyKey" VARCHAR(96) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmedAt" TIMESTAMPTZ(3),
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "ImportSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ImportSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ImportSession_size_check" CHECK ("originalSizeBytes" > 0)
);

CREATE UNIQUE INDEX "ProjectSnapshot_storageKey_key" ON "ProjectSnapshot"("storageKey");
CREATE UNIQUE INDEX "ProjectSnapshot_projectId_idempotencyKey_key" ON "ProjectSnapshot"("projectId", "idempotencyKey");
CREATE INDEX "ProjectSnapshot_projectId_status_requestedAt_idx" ON "ProjectSnapshot"("projectId", "status", "requestedAt" DESC);
CREATE INDEX "ProjectSnapshot_status_retentionUntil_idx" ON "ProjectSnapshot"("status", "retentionUntil");
CREATE UNIQUE INDEX "PortabilityArtifact_storageKey_key" ON "PortabilityArtifact"("storageKey");
CREATE UNIQUE INDEX "PortabilityArtifact_projectId_idempotencyKey_key" ON "PortabilityArtifact"("projectId", "idempotencyKey");
CREATE INDEX "PortabilityArtifact_projectId_purpose_status_createdAt_idx" ON "PortabilityArtifact"("projectId", "purpose", "status", "createdAt" DESC);
CREATE INDEX "PortabilityArtifact_status_expiresAt_idx" ON "PortabilityArtifact"("status", "expiresAt");
CREATE UNIQUE INDEX "ImportSession_originalStorageKey_key" ON "ImportSession"("originalStorageKey");
CREATE UNIQUE INDEX "ImportSession_projectId_idempotencyKey_key" ON "ImportSession"("projectId", "idempotencyKey");
CREATE INDEX "ImportSession_projectId_status_createdAt_idx" ON "ImportSession"("projectId", "status", "createdAt" DESC);
CREATE INDEX "ImportSession_status_expiresAt_idx" ON "ImportSession"("status", "expiresAt");
