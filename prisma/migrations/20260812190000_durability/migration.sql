-- Sub-gate 2 forward migration: optimistic draft saves, checkpoints, and explicit conflicts.
CREATE TYPE "ChapterRevisionKind" AS ENUM ('CHECKPOINT', 'CONFLICT_SERVER');
CREATE TYPE "DraftConflictStatus" AS ENUM ('OPEN', 'RESOLVED');
CREATE TYPE "DraftConflictResolution" AS ENUM ('KEEP_LOCAL', 'KEEP_SERVER', 'DUPLICATE_RECOVERY');

CREATE TABLE "ChapterRevision" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "chapterId" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "kind" "ChapterRevisionKind" NOT NULL,
  "label" VARCHAR(240),
  "clientSaveId" UUID,
  "bodyDocument" JSONB NOT NULL,
  "bodyText" TEXT NOT NULL,
  "wordCount" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChapterRevision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ChapterRevision_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ChapterRevision_version_positive" CHECK ("version" > 0),
  CONSTRAINT "ChapterRevision_wordCount_nonnegative" CHECK ("wordCount" >= 0)
);
CREATE INDEX "ChapterRevision_chapterId_createdAt_idx" ON "ChapterRevision"("chapterId", "createdAt" DESC);
CREATE INDEX "ChapterRevision_chapterId_version_idx" ON "ChapterRevision"("chapterId", "version");
CREATE UNIQUE INDEX "ChapterRevision_clientSaveId_key" ON "ChapterRevision"("clientSaveId");

CREATE TABLE "DraftConflict" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "chapterId" UUID NOT NULL,
  "clientSaveId" UUID NOT NULL,
  "baseVersion" INTEGER NOT NULL,
  "serverVersion" INTEGER NOT NULL,
  "localDocument" JSONB NOT NULL,
  "serverDocument" JSONB NOT NULL,
  "status" "DraftConflictStatus" NOT NULL DEFAULT 'OPEN',
  "resolution" "DraftConflictResolution",
  "resolvedVersion" INTEGER,
  "recoveryChapterId" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMPTZ(3),
  CONSTRAINT "DraftConflict_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DraftConflict_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "DraftConflict_versions_valid" CHECK ("baseVersion" > 0 AND "serverVersion" > "baseVersion")
);
CREATE UNIQUE INDEX "DraftConflict_chapterId_clientSaveId_key" ON "DraftConflict"("chapterId", "clientSaveId");
CREATE INDEX "DraftConflict_chapterId_status_createdAt_idx" ON "DraftConflict"("chapterId", "status", "createdAt" DESC);

CREATE TABLE "ChapterSaveReceipt" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "chapterId" UUID NOT NULL,
  "clientSaveId" UUID NOT NULL,
  "bodyHash" CHAR(64) NOT NULL,
  "baseVersion" INTEGER NOT NULL,
  "resultingVersion" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChapterSaveReceipt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ChapterSaveReceipt_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ChapterSaveReceipt_versions_valid" CHECK ("baseVersion" > 0 AND "resultingVersion" = "baseVersion" + 1)
);
CREATE UNIQUE INDEX "ChapterSaveReceipt_chapterId_clientSaveId_key" ON "ChapterSaveReceipt"("chapterId", "clientSaveId");
CREATE INDEX "ChapterSaveReceipt_chapterId_createdAt_idx" ON "ChapterSaveReceipt"("chapterId", "createdAt" DESC);
