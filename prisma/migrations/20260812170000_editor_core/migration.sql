-- Sub-gate 1 forward migration: minimal Project, Chapter, and editor document core.
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETION_PENDING');
CREATE TYPE "ChapterStatus" AS ENUM ('DRAFT', 'REVISED', 'FINAL', 'ARCHIVED');

CREATE TABLE "Project" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspaceId" UUID NOT NULL,
  "title" VARCHAR(240) NOT NULL,
  "description" TEXT,
  "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
  "structuralVersion" INTEGER NOT NULL DEFAULT 1,
  "activeChapterId" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "archivedAt" TIMESTAMPTZ(3),
  "purgeAfter" TIMESTAMPTZ(3),
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Project_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Project_structuralVersion_positive" CHECK ("structuralVersion" > 0)
);
CREATE UNIQUE INDEX "Project_activeChapterId_key" ON "Project"("activeChapterId");
CREATE INDEX "Project_workspaceId_status_updatedAt_idx" ON "Project"("workspaceId", "status", "updatedAt" DESC);

CREATE TABLE "Chapter" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "sequenceIndex" INTEGER NOT NULL,
  "displayNumber" VARCHAR(32),
  "title" VARCHAR(240) NOT NULL,
  "bodyDocument" JSONB NOT NULL,
  "bodyText" TEXT NOT NULL DEFAULT '',
  "wordCount" INTEGER NOT NULL DEFAULT 0,
  "documentSchemaVersion" INTEGER NOT NULL DEFAULT 1,
  "status" "ChapterStatus" NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 1,
  "targetWords" INTEGER,
  "hardCharacterStop" INTEGER,
  "hardStopEnabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Chapter_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Chapter_sequenceIndex_nonnegative" CHECK ("sequenceIndex" >= 0),
  CONSTRAINT "Chapter_wordCount_nonnegative" CHECK ("wordCount" >= 0),
  CONSTRAINT "Chapter_documentSchemaVersion_positive" CHECK ("documentSchemaVersion" > 0),
  CONSTRAINT "Chapter_version_positive" CHECK ("version" > 0),
  CONSTRAINT "Chapter_targetWords_positive" CHECK ("targetWords" IS NULL OR "targetWords" > 0),
  CONSTRAINT "Chapter_hardStop_valid" CHECK (("hardStopEnabled" = false) OR ("hardCharacterStop" IS NOT NULL AND "hardCharacterStop" > 0))
);
CREATE UNIQUE INDEX "Chapter_projectId_sequenceIndex_key" ON "Chapter"("projectId", "sequenceIndex");
CREATE INDEX "Chapter_projectId_status_updatedAt_idx" ON "Chapter"("projectId", "status", "updatedAt" DESC);

ALTER TABLE "Project" ADD CONSTRAINT "Project_activeChapterId_fkey" FOREIGN KEY ("activeChapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
