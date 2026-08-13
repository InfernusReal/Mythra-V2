ALTER TYPE "StructureLens" ADD VALUE 'MILESTONES';
ALTER TYPE "NarrativeIntentTargetType" ADD VALUE 'MILESTONE';
ALTER TYPE "StructureObjectType" ADD VALUE 'MILESTONE';
ALTER TYPE "StructureObjectType" ADD VALUE 'CHAPTER_MILESTONE_LINK';
ALTER TYPE "StructureObjectType" ADD VALUE 'MILESTONE_DEPENDENCY';

CREATE TYPE "MilestoneStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "MilestoneRole" AS ENUM ('INTRODUCE', 'DEVELOP', 'ESCALATE', 'TURN', 'RESOLVE', 'CUSTOM');
CREATE TYPE "MilestoneDependencyState" AS ENUM ('ACTIVE', 'TENTATIVE', 'RETIRED');

CREATE TABLE "Milestone" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "sequenceIndex" INTEGER NOT NULL,
  "title" VARCHAR(240) NOT NULL,
  "description" TEXT,
  "threadLabel" VARCHAR(120),
  "targetChapterStart" INTEGER,
  "targetChapterEnd" INTEGER,
  "targetWords" INTEGER,
  "targetDate" DATE,
  "status" "MilestoneStatus" NOT NULL DEFAULT 'PLANNED',
  "isPlaceholder" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Milestone_range_check" CHECK (("targetChapterStart" IS NULL AND "targetChapterEnd" IS NULL) OR ("targetChapterStart" >= 0 AND "targetChapterEnd" >= "targetChapterStart")),
  CONSTRAINT "Milestone_targetWords_check" CHECK ("targetWords" IS NULL OR "targetWords" > 0),
  CONSTRAINT "Milestone_version_check" CHECK ("version" > 0)
);

CREATE TABLE "ChapterMilestoneLink" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "chapterId" UUID NOT NULL,
  "milestoneId" UUID NOT NULL,
  "role" "MilestoneRole" NOT NULL,
  "customRole" VARCHAR(80),
  "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "ChapterMilestoneLink_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ChapterMilestoneLink_custom_role_check" CHECK (("role" = 'CUSTOM' AND length(trim("customRole")) > 0) OR ("role" <> 'CUSTOM' AND "customRole" IS NULL)),
  CONSTRAINT "ChapterMilestoneLink_weight_check" CHECK ("weight" >= 0 AND "weight" <= 1000000),
  CONSTRAINT "ChapterMilestoneLink_version_check" CHECK ("version" > 0)
);

CREATE TABLE "MilestoneDependency" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "sourceMilestoneId" UUID NOT NULL,
  "targetMilestoneId" UUID NOT NULL,
  "state" "MilestoneDependencyState" NOT NULL DEFAULT 'ACTIVE',
  "isHard" BOOLEAN NOT NULL DEFAULT false,
  "note" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "MilestoneDependency_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MilestoneDependency_nonself_check" CHECK ("sourceMilestoneId" <> "targetMilestoneId"),
  CONSTRAINT "MilestoneDependency_version_check" CHECK ("version" > 0)
);

CREATE UNIQUE INDEX "Milestone_projectId_sequenceIndex_key" ON "Milestone"("projectId", "sequenceIndex");
CREATE UNIQUE INDEX "Milestone_id_projectId_key" ON "Milestone"("id", "projectId");
CREATE INDEX "Milestone_projectId_status_sequenceIndex_idx" ON "Milestone"("projectId", "status", "sequenceIndex");
CREATE INDEX "Milestone_projectId_targetChapterStart_targetChapterEnd_idx" ON "Milestone"("projectId", "targetChapterStart", "targetChapterEnd");
CREATE INDEX "Milestone_projectId_archivedAt_sequenceIndex_idx" ON "Milestone"("projectId", "archivedAt", "sequenceIndex");
CREATE UNIQUE INDEX "ChapterMilestoneLink_active_key" ON "ChapterMilestoneLink"("projectId", "chapterId", "milestoneId", "role", COALESCE("customRole", '')) WHERE "archivedAt" IS NULL;
CREATE INDEX "ChapterMilestoneLink_projectId_milestoneId_archivedAt_idx" ON "ChapterMilestoneLink"("projectId", "milestoneId", "archivedAt");
CREATE INDEX "ChapterMilestoneLink_projectId_chapterId_archivedAt_idx" ON "ChapterMilestoneLink"("projectId", "chapterId", "archivedAt");
CREATE INDEX "ChapterMilestoneLink_projectId_role_archivedAt_idx" ON "ChapterMilestoneLink"("projectId", "role", "archivedAt");
CREATE UNIQUE INDEX "MilestoneDependency_active_key" ON "MilestoneDependency"("projectId", "sourceMilestoneId", "targetMilestoneId", "isHard") WHERE "state" IN ('ACTIVE', 'TENTATIVE') AND "archivedAt" IS NULL;
CREATE INDEX "MilestoneDependency_projectId_sourceMilestoneId_state_archivedAt_idx" ON "MilestoneDependency"("projectId", "sourceMilestoneId", "state", "archivedAt");
CREATE INDEX "MilestoneDependency_projectId_targetMilestoneId_state_archivedAt_idx" ON "MilestoneDependency"("projectId", "targetMilestoneId", "state", "archivedAt");

ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChapterMilestoneLink" ADD CONSTRAINT "ChapterMilestoneLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChapterMilestoneLink" ADD CONSTRAINT "ChapterMilestoneLink_chapter_project_fkey" FOREIGN KEY ("chapterId", "projectId") REFERENCES "Chapter"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChapterMilestoneLink" ADD CONSTRAINT "ChapterMilestoneLink_milestone_project_fkey" FOREIGN KEY ("milestoneId", "projectId") REFERENCES "Milestone"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MilestoneDependency" ADD CONSTRAINT "MilestoneDependency_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MilestoneDependency" ADD CONSTRAINT "MilestoneDependency_source_project_fkey" FOREIGN KEY ("sourceMilestoneId", "projectId") REFERENCES "Milestone"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MilestoneDependency" ADD CONSTRAINT "MilestoneDependency_target_project_fkey" FOREIGN KEY ("targetMilestoneId", "projectId") REFERENCES "Milestone"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;
