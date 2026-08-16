CREATE TYPE "CaptureLifecycle" AS ENUM ('UNPROCESSED', 'FILED', 'CONVERTED', 'DEFERRED', 'DISMISSED');
CREATE TYPE "CaptureAttachmentTargetType" AS ENUM ('CHAPTER', 'CHAPTER_OUTLINE');
CREATE TYPE "CaptureConversionType" AS ENUM ('MILESTONE', 'STORY_CHANGE', 'CHAPTER_ATTACHMENT', 'OUTLINE_ATTACHMENT', 'CAPTURE_DERIVED_CAUSAL');

ALTER TABLE "ContextPin" ALTER COLUMN "cardType" TYPE VARCHAR(40) USING "cardType"::text;
DROP TYPE "ContextCardType";

CREATE TABLE "Capture" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "userId" UUID NOT NULL, "projectId" UUID NOT NULL,
  "clientCaptureId" VARCHAR(80) NOT NULL, "rawText" TEXT NOT NULL, "lifecycle" "CaptureLifecycle" NOT NULL DEFAULT 'UNPROCESSED',
  "route" VARCHAR(2048) NOT NULL, "chapterId" UUID, "outlineId" UUID, "blockId" VARCHAR(128),
  "selectionAnchor" INTEGER, "selectionHead" INTEGER, "entityContext" JSONB NOT NULL DEFAULT '[]', "capturedAt" TIMESTAMPTZ(3) NOT NULL,
  "deferredUntil" TIMESTAMPTZ(3), "dismissedAt" TIMESTAMPTZ(3), "purgeAfter" TIMESTAMPTZ(3), "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Capture_pkey" PRIMARY KEY ("id"), CONSTRAINT "Capture_selection_check" CHECK (("selectionAnchor" IS NULL AND "selectionHead" IS NULL) OR ("selectionAnchor" >= 0 AND "selectionHead" >= "selectionAnchor"))
);
CREATE UNIQUE INDEX "Capture_userId_clientCaptureId_key" ON "Capture"("userId", "clientCaptureId");
CREATE INDEX "Capture_projectId_userId_lifecycle_capturedAt_idx" ON "Capture"("projectId", "userId", "lifecycle", "capturedAt" DESC);
CREATE INDEX "Capture_projectId_chapterId_capturedAt_idx" ON "Capture"("projectId", "chapterId", "capturedAt" DESC);
CREATE INDEX "Capture_projectId_deferredUntil_idx" ON "Capture"("projectId", "deferredUntil");

CREATE TABLE "CaptureAttachment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "captureId" UUID NOT NULL, "projectId" UUID NOT NULL,
  "targetType" "CaptureAttachmentTargetType" NOT NULL, "targetId" UUID NOT NULL, "targetBlockId" VARCHAR(128) NOT NULL DEFAULT '', "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CaptureAttachment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CaptureAttachment_captureId_targetType_targetId_targetBlockId_key" ON "CaptureAttachment"("captureId", "targetType", "targetId", "targetBlockId");
CREATE INDEX "CaptureAttachment_projectId_targetType_targetId_idx" ON "CaptureAttachment"("projectId", "targetType", "targetId");

CREATE TABLE "CaptureConversion" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "captureId" UUID NOT NULL, "projectId" UUID NOT NULL, "userId" UUID NOT NULL,
  "conversionType" "CaptureConversionType" NOT NULL, "idempotencyKey" VARCHAR(80) NOT NULL, "targetType" VARCHAR(80) NOT NULL, "targetId" UUID NOT NULL, "projectStructuralVersion" INTEGER NOT NULL,
  "provenance" JSONB NOT NULL, "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "CaptureConversion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CaptureConversion_captureId_conversionType_idempotencyKey_key" ON "CaptureConversion"("captureId", "conversionType", "idempotencyKey");
CREATE INDEX "CaptureConversion_projectId_conversionType_targetId_idx" ON "CaptureConversion"("projectId", "conversionType", "targetId");

CREATE TABLE "CaptureRevision" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "captureId" UUID NOT NULL, "projectId" UUID NOT NULL, "version" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL, "reason" VARCHAR(80) NOT NULL, "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "CaptureRevision_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CaptureRevision_captureId_version_key" ON "CaptureRevision"("captureId", "version");
CREATE INDEX "CaptureRevision_projectId_captureId_createdAt_idx" ON "CaptureRevision"("projectId", "captureId", "createdAt" DESC);

ALTER TABLE "Capture" ADD CONSTRAINT "Capture_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Capture" ADD CONSTRAINT "Capture_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CaptureAttachment" ADD CONSTRAINT "CaptureAttachment_captureId_fkey" FOREIGN KEY ("captureId") REFERENCES "Capture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CaptureAttachment" ADD CONSTRAINT "CaptureAttachment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CaptureConversion" ADD CONSTRAINT "CaptureConversion_captureId_fkey" FOREIGN KEY ("captureId") REFERENCES "Capture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CaptureConversion" ADD CONSTRAINT "CaptureConversion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CaptureConversion" ADD CONSTRAINT "CaptureConversion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CaptureRevision" ADD CONSTRAINT "CaptureRevision_captureId_fkey" FOREIGN KEY ("captureId") REFERENCES "Capture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CaptureRevision" ADD CONSTRAINT "CaptureRevision_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
