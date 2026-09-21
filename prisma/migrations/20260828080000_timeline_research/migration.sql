CREATE TYPE "TimelineMode" AS ENUM ('ABSOLUTE', 'APPROXIMATE', 'RELATIVE', 'ORDINAL', 'RANGE');
CREATE TYPE "TimelineLinkTargetType" AS ENUM ('ENTITY', 'MILESTONE', 'CHAPTER', 'TIMELINE_EVENT');
CREATE TYPE "ResearchItemKind" AS ENUM ('NOTE', 'URL', 'EXCERPT', 'CITATION', 'FILE');
CREATE TYPE "AssetScanStatus" AS ENUM ('PENDING', 'CLEAN', 'INFECTED', 'REJECTED', 'ERROR');

CREATE TABLE "TimelineEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "projectId" UUID NOT NULL, "title" VARCHAR(200) NOT NULL, "description" TEXT,
  "mode" "TimelineMode" NOT NULL, "displayLabel" VARCHAR(200) NOT NULL, "calendarKey" VARCHAR(80),
  "sortStart" DECIMAL(30,6), "sortEnd" DECIMAL(30,6), "relativeToEventId" UUID, "relativeOffset" DECIMAL(30,6), "ordinalValue" DECIMAL(30,6),
  "version" INTEGER NOT NULL DEFAULT 1, "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TimelineEvent_title_check" CHECK (length(btrim("title")) BETWEEN 1 AND 200),
  CONSTRAINT "TimelineEvent_displayLabel_check" CHECK (length(btrim("displayLabel")) BETWEEN 1 AND 200),
  CONSTRAINT "TimelineEvent_version_check" CHECK ("version" > 0),
  CONSTRAINT "TimelineEvent_mode_values_check" CHECK (
    ("mode" IN ('ABSOLUTE','APPROXIMATE') AND "sortStart" IS NOT NULL AND "sortEnd" IS NULL AND "relativeToEventId" IS NULL AND "relativeOffset" IS NULL AND "ordinalValue" IS NULL) OR
    ("mode" = 'RELATIVE' AND "sortStart" IS NULL AND "sortEnd" IS NULL AND "relativeToEventId" IS NOT NULL AND "relativeOffset" IS NOT NULL AND "ordinalValue" IS NULL) OR
    ("mode" = 'ORDINAL' AND "sortStart" IS NULL AND "sortEnd" IS NULL AND "relativeToEventId" IS NULL AND "relativeOffset" IS NULL AND "ordinalValue" IS NOT NULL) OR
    ("mode" = 'RANGE' AND "sortStart" IS NOT NULL AND "sortEnd" IS NOT NULL AND "sortEnd" >= "sortStart" AND "relativeToEventId" IS NULL AND "relativeOffset" IS NULL AND "ordinalValue" IS NULL)
  ),
  CONSTRAINT "TimelineEvent_relative_self_check" CHECK ("relativeToEventId" IS NULL OR "relativeToEventId" <> "id")
);
CREATE INDEX "TimelineEvent_projectId_archivedAt_mode_sortStart_ordinalValue_idx" ON "TimelineEvent"("projectId", "archivedAt", "mode", "sortStart", "ordinalValue");
CREATE INDEX "TimelineEvent_projectId_relativeToEventId_archivedAt_idx" ON "TimelineEvent"("projectId", "relativeToEventId", "archivedAt");
CREATE INDEX "TimelineEvent_projectId_updatedAt_idx" ON "TimelineEvent"("projectId", "updatedAt" DESC);
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_relativeToEventId_fkey" FOREIGN KEY ("relativeToEventId") REFERENCES "TimelineEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "TimelineEventLink" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "projectId" UUID NOT NULL, "eventId" UUID NOT NULL, "targetType" "TimelineLinkTargetType" NOT NULL, "targetId" UUID NOT NULL, "label" VARCHAR(160),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "archivedAt" TIMESTAMPTZ(3), CONSTRAINT "TimelineEventLink_pkey" PRIMARY KEY ("id"), CONSTRAINT "TimelineEventLink_self_check" CHECK ("targetType" <> 'TIMELINE_EVENT' OR "targetId" <> "eventId")
);
CREATE UNIQUE INDEX "TimelineEventLink_eventId_targetType_targetId_key" ON "TimelineEventLink"("eventId", "targetType", "targetId");
CREATE INDEX "TimelineEventLink_projectId_targetType_targetId_archivedAt_idx" ON "TimelineEventLink"("projectId", "targetType", "targetId", "archivedAt");
CREATE INDEX "TimelineEventLink_projectId_eventId_archivedAt_idx" ON "TimelineEventLink"("projectId", "eventId", "archivedAt");
ALTER TABLE "TimelineEventLink" ADD CONSTRAINT "TimelineEventLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TimelineEventLink" ADD CONSTRAINT "TimelineEventLink_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TimelineEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Note" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "projectId" UUID NOT NULL, "createdById" UUID NOT NULL, "title" VARCHAR(200) NOT NULL, "body" TEXT NOT NULL, "normalizedTags" JSONB NOT NULL DEFAULT '[]', "sourceCaptureId" UUID,
  "version" INTEGER NOT NULL DEFAULT 1, "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "Note_pkey" PRIMARY KEY ("id"), CONSTRAINT "Note_title_check" CHECK (length(btrim("title")) BETWEEN 1 AND 200), CONSTRAINT "Note_body_check" CHECK (length("body") <= 100000), CONSTRAINT "Note_tags_check" CHECK (jsonb_typeof("normalizedTags") = 'array' AND jsonb_array_length("normalizedTags") <= 32), CONSTRAINT "Note_version_check" CHECK ("version" > 0)
);
CREATE INDEX "Note_projectId_archivedAt_updatedAt_idx" ON "Note"("projectId", "archivedAt", "updatedAt" DESC);
CREATE INDEX "Note_projectId_createdById_archivedAt_idx" ON "Note"("projectId", "createdById", "archivedAt");
CREATE INDEX "Note_sourceCaptureId_idx" ON "Note"("sourceCaptureId");
ALTER TABLE "Note" ADD CONSTRAINT "Note_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Note" ADD CONSTRAINT "Note_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "NotePromotion" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "projectId" UUID NOT NULL, "noteId" UUID NOT NULL, "targetType" VARCHAR(40) NOT NULL, "targetId" UUID NOT NULL, "idempotencyKey" VARCHAR(80) NOT NULL, "projectStructuralVersion" INTEGER NOT NULL, "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotePromotion_pkey" PRIMARY KEY ("id"), CONSTRAINT "NotePromotion_target_check" CHECK ("targetType" IN ('MILESTONE','STORY_CHANGE','CHAPTER_OUTLINE')), CONSTRAINT "NotePromotion_version_check" CHECK ("projectStructuralVersion" > 0)
);
CREATE UNIQUE INDEX "NotePromotion_noteId_targetType_idempotencyKey_key" ON "NotePromotion"("noteId", "targetType", "idempotencyKey");
CREATE INDEX "NotePromotion_projectId_targetType_targetId_idx" ON "NotePromotion"("projectId", "targetType", "targetId");
ALTER TABLE "NotePromotion" ADD CONSTRAINT "NotePromotion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NotePromotion" ADD CONSTRAINT "NotePromotion_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "StoredAsset" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "projectId" UUID NOT NULL, "createdById" UUID NOT NULL, "storageKey" VARCHAR(320) NOT NULL, "displayName" VARCHAR(255) NOT NULL, "contentType" VARCHAR(120) NOT NULL, "sizeBytes" BIGINT NOT NULL, "sha256" CHAR(64) NOT NULL,
  "scanStatus" "AssetScanStatus" NOT NULL DEFAULT 'PENDING', "scanMessage" VARCHAR(160), "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "scannedAt" TIMESTAMPTZ(3), "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "StoredAsset_pkey" PRIMARY KEY ("id"), CONSTRAINT "StoredAsset_size_check" CHECK ("sizeBytes" BETWEEN 1 AND 10485760), CONSTRAINT "StoredAsset_hash_check" CHECK ("sha256" ~ '^[0-9a-f]{64}$')
);
CREATE UNIQUE INDEX "StoredAsset_storageKey_key" ON "StoredAsset"("storageKey");
CREATE UNIQUE INDEX "StoredAsset_projectId_sha256_key" ON "StoredAsset"("projectId", "sha256");
CREATE INDEX "StoredAsset_workspaceId_projectId_scanStatus_archivedAt_idx" ON "StoredAsset"("workspaceId", "projectId", "scanStatus", "archivedAt");
ALTER TABLE "StoredAsset" ADD CONSTRAINT "StoredAsset_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoredAsset" ADD CONSTRAINT "StoredAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoredAsset" ADD CONSTRAINT "StoredAsset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ResearchItem" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "projectId" UUID NOT NULL, "createdById" UUID NOT NULL, "kind" "ResearchItemKind" NOT NULL, "title" VARCHAR(200) NOT NULL, "body" TEXT, "url" VARCHAR(2048), "citation" TEXT, "excerpt" TEXT, "assetId" UUID,
  "version" INTEGER NOT NULL DEFAULT 1, "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "ResearchItem_pkey" PRIMARY KEY ("id"), CONSTRAINT "ResearchItem_title_check" CHECK (length(btrim("title")) BETWEEN 1 AND 200), CONSTRAINT "ResearchItem_version_check" CHECK ("version" > 0),
  CONSTRAINT "ResearchItem_kind_check" CHECK (
    ("kind" = 'NOTE' AND "body" IS NOT NULL AND length("body") BETWEEN 1 AND 100000 AND "url" IS NULL AND "excerpt" IS NULL AND "assetId" IS NULL) OR
    ("kind" = 'URL' AND "url" IS NOT NULL AND length("url") <= 2048 AND "excerpt" IS NULL AND "assetId" IS NULL) OR
    ("kind" = 'EXCERPT' AND "excerpt" IS NOT NULL AND length("excerpt") BETWEEN 1 AND 100000 AND "url" IS NULL AND "assetId" IS NULL) OR
    ("kind" = 'CITATION' AND "citation" IS NOT NULL AND length("citation") BETWEEN 1 AND 10000 AND "url" IS NULL AND "excerpt" IS NULL AND "assetId" IS NULL) OR
    ("kind" = 'FILE' AND "assetId" IS NOT NULL AND "body" IS NULL AND "url" IS NULL AND "citation" IS NULL AND "excerpt" IS NULL)
  )
);
CREATE UNIQUE INDEX "ResearchItem_assetId_key" ON "ResearchItem"("assetId");
CREATE INDEX "ResearchItem_projectId_kind_archivedAt_updatedAt_idx" ON "ResearchItem"("projectId", "kind", "archivedAt", "updatedAt" DESC);
CREATE INDEX "ResearchItem_projectId_createdById_archivedAt_idx" ON "ResearchItem"("projectId", "createdById", "archivedAt");
ALTER TABLE "ResearchItem" ADD CONSTRAINT "ResearchItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ResearchItem" ADD CONSTRAINT "ResearchItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ResearchItem" ADD CONSTRAINT "ResearchItem_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "StoredAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ResearchItemLink" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "projectId" UUID NOT NULL, "researchItemId" UUID NOT NULL, "targetType" "StoryReferenceEndpointType" NOT NULL, "targetId" UUID NOT NULL, "label" VARCHAR(160), "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "ResearchItemLink_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ResearchItemLink_researchItemId_targetType_targetId_key" ON "ResearchItemLink"("researchItemId", "targetType", "targetId");
CREATE INDEX "ResearchItemLink_projectId_targetType_targetId_archivedAt_idx" ON "ResearchItemLink"("projectId", "targetType", "targetId", "archivedAt");
ALTER TABLE "ResearchItemLink" ADD CONSTRAINT "ResearchItemLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ResearchItemLink" ADD CONSTRAINT "ResearchItemLink_researchItemId_fkey" FOREIGN KEY ("researchItemId") REFERENCES "ResearchItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
