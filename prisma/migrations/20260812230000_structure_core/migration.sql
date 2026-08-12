CREATE TYPE "StructurePresentationMode" AS ENUM ('DISCOVERY', 'GUIDED', 'ARCHITECT');
CREATE TYPE "StructureLens" AS ENUM ('OUTLINE', 'VOLUMES', 'CHAPTERS', 'RELATIONSHIPS', 'SEMANTIC_ZOOM');
CREATE TYPE "NarrativeIntentTargetType" AS ENUM ('PLOT', 'VOLUME', 'CHAPTER', 'SCENE', 'PARAGRAPH_SELECTION');
CREATE TYPE "NarrativeIntentCategory" AS ENUM ('TENSION', 'REVELATION', 'EMOTION', 'PACING', 'AMBIGUITY', 'ATMOSPHERE', 'CUSTOM');
CREATE TYPE "StoryReferenceEndpointType" AS ENUM ('PLOT', 'PLOT_OUTLINE', 'VOLUME', 'VOLUME_OUTLINE', 'CHAPTER_OUTLINE', 'CHAPTER', 'SCENE', 'NARRATIVE_INTENT', 'MANUSCRIPT_BLOCK', 'MILESTONE', 'ENTITY', 'TIMELINE_EVENT', 'NOTE', 'CAPTURE');
CREATE TYPE "StructureObjectType" AS ENUM ('PLOT', 'PLOT_OUTLINE', 'VOLUME', 'VOLUME_OUTLINE', 'CHAPTER_OUTLINE', 'CHAPTER', 'SCENE', 'NARRATIVE_INTENT', 'STORY_REFERENCE');
CREATE TYPE "StructureProvenanceType" AS ENUM ('DIRECT', 'CHAPTER_PROSE', 'OUTLINE_BLOCK', 'NOTE', 'CAPTURE');

ALTER TABLE "Chapter"
  ADD COLUMN "volumeId" UUID,
  ADD COLUMN "volumeSequenceIndex" INTEGER;

CREATE TABLE "Plot" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "title" VARCHAR(240) NOT NULL,
  "summary" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "Plot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Plot_version_positive" CHECK ("version" > 0)
);

CREATE TABLE "PlotOutline" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "plotId" UUID NOT NULL,
  "document" JSONB NOT NULL,
  "plainText" TEXT NOT NULL DEFAULT '',
  "purpose" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "PlotOutline_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlotOutline_version_positive" CHECK ("version" > 0)
);

CREATE TABLE "Volume" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "plotId" UUID NOT NULL,
  "sequenceIndex" INTEGER NOT NULL,
  "displayNumber" VARCHAR(32),
  "title" VARCHAR(240) NOT NULL,
  "summary" TEXT,
  "targetWords" INTEGER,
  "hardTargetWordsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "Volume_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Volume_sequence_nonnegative" CHECK ("sequenceIndex" >= 0),
  CONSTRAINT "Volume_target_positive" CHECK ("targetWords" IS NULL OR "targetWords" > 0),
  CONSTRAINT "Volume_hard_target_explicit" CHECK (NOT "hardTargetWordsEnabled" OR "targetWords" IS NOT NULL),
  CONSTRAINT "Volume_version_positive" CHECK ("version" > 0)
);

CREATE TABLE "VolumeOutline" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "volumeId" UUID NOT NULL,
  "document" JSONB NOT NULL,
  "plainText" TEXT NOT NULL DEFAULT '',
  "purpose" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "VolumeOutline_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VolumeOutline_version_positive" CHECK ("version" > 0)
);

CREATE TABLE "ChapterOutline" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "volumeId" UUID,
  "chapterId" UUID,
  "sequenceIndex" INTEGER NOT NULL,
  "title" VARCHAR(240) NOT NULL,
  "document" JSONB NOT NULL,
  "plainText" TEXT NOT NULL DEFAULT '',
  "purpose" TEXT,
  "emotionalMovement" TEXT,
  "revealedInformation" JSONB NOT NULL DEFAULT '[]',
  "entityReferenceKeys" JSONB NOT NULL DEFAULT '[]',
  "locationReferenceKeys" JSONB NOT NULL DEFAULT '[]',
  "milestoneReferenceKeys" JSONB NOT NULL DEFAULT '[]',
  "targetWords" INTEGER,
  "hardTargetWordsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "sceneStubs" JSONB NOT NULL DEFAULT '[]',
  "isPlaceholder" BOOLEAN NOT NULL DEFAULT false,
  "provenanceType" "StructureProvenanceType" NOT NULL DEFAULT 'DIRECT',
  "provenanceSourceId" VARCHAR(128),
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "ChapterOutline_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ChapterOutline_sequence_nonnegative" CHECK ("sequenceIndex" >= 0),
  CONSTRAINT "ChapterOutline_target_positive" CHECK ("targetWords" IS NULL OR "targetWords" > 0),
  CONSTRAINT "ChapterOutline_hard_target_explicit" CHECK (NOT "hardTargetWordsEnabled" OR "targetWords" IS NOT NULL),
  CONSTRAINT "ChapterOutline_version_positive" CHECK ("version" > 0)
);

CREATE TABLE "Scene" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "chapterId" UUID,
  "chapterOutlineId" UUID,
  "sequenceIndex" INTEGER NOT NULL,
  "title" VARCHAR(240) NOT NULL,
  "outlineDocument" JSONB NOT NULL,
  "outlineText" TEXT NOT NULL DEFAULT '',
  "purpose" TEXT,
  "targetWords" INTEGER,
  "hardTargetWordsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "provenanceType" "StructureProvenanceType" NOT NULL DEFAULT 'DIRECT',
  "provenanceSourceId" VARCHAR(128),
  "provenanceBlockId" VARCHAR(128),
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "Scene_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Scene_parent_required" CHECK ("chapterId" IS NOT NULL OR "chapterOutlineId" IS NOT NULL),
  CONSTRAINT "Scene_sequence_nonnegative" CHECK ("sequenceIndex" >= 0),
  CONSTRAINT "Scene_target_positive" CHECK ("targetWords" IS NULL OR "targetWords" > 0),
  CONSTRAINT "Scene_hard_target_explicit" CHECK (NOT "hardTargetWordsEnabled" OR "targetWords" IS NOT NULL),
  CONSTRAINT "Scene_version_positive" CHECK ("version" > 0)
);

CREATE TABLE "NarrativeIntent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "targetType" "NarrativeIntentTargetType" NOT NULL,
  "targetId" UUID NOT NULL,
  "blockId" VARCHAR(128),
  "selectionAnchor" INTEGER,
  "selectionHead" INTEGER,
  "category" "NarrativeIntentCategory",
  "customCategory" VARCHAR(80),
  "intentText" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "NarrativeIntent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NarrativeIntent_text_nonempty" CHECK (length(btrim("intentText")) > 0),
  CONSTRAINT "NarrativeIntent_selection_valid" CHECK (
    ("targetType" = 'PARAGRAPH_SELECTION' AND "blockId" IS NOT NULL AND "selectionAnchor" >= 0 AND "selectionHead" >= 0)
    OR ("targetType" <> 'PARAGRAPH_SELECTION' AND "blockId" IS NULL AND "selectionAnchor" IS NULL AND "selectionHead" IS NULL)
  ),
  CONSTRAINT "NarrativeIntent_custom_category_valid" CHECK (("category" = 'CUSTOM' AND "customCategory" IS NOT NULL) OR "category" IS DISTINCT FROM 'CUSTOM'),
  CONSTRAINT "NarrativeIntent_version_positive" CHECK ("version" > 0)
);

CREATE TABLE "StoryReference" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "sourceType" "StoryReferenceEndpointType" NOT NULL,
  "sourceId" UUID NOT NULL,
  "sourceBlockId" VARCHAR(128),
  "targetType" "StoryReferenceEndpointType" NOT NULL,
  "targetId" UUID NOT NULL,
  "targetBlockId" VARCHAR(128),
  "relationshipKey" VARCHAR(80) NOT NULL DEFAULT 'references',
  "provenanceType" "StructureProvenanceType" NOT NULL DEFAULT 'DIRECT',
  "provenanceNote" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "StoryReference_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoryReference_not_self" CHECK ("sourceType" <> "targetType" OR "sourceId" <> "targetId" OR COALESCE("sourceBlockId", '') <> COALESCE("targetBlockId", '')),
  CONSTRAINT "StoryReference_key_nonempty" CHECK (length(btrim("relationshipKey")) > 0),
  CONSTRAINT "StoryReference_version_positive" CHECK ("version" > 0)
);

CREATE TABLE "ObjectRevision" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "objectType" "StructureObjectType" NOT NULL,
  "objectId" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "reason" VARCHAR(120),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ObjectRevision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ObjectRevision_version_positive" CHECK ("version" > 0)
);

CREATE TABLE "StructureViewState" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "mode" "StructurePresentationMode" NOT NULL DEFAULT 'DISCOVERY',
  "activeLens" "StructureLens" NOT NULL DEFAULT 'OUTLINE',
  "expandedIds" JSONB NOT NULL DEFAULT '[]',
  "activeAnchorType" "StoryReferenceEndpointType",
  "activeAnchorId" UUID,
  "cursorOffset" INTEGER,
  "selectionAnchor" INTEGER,
  "selectionHead" INTEGER,
  "scrollTop" INTEGER,
  "pinIds" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "StructureViewState_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StructureViewState_offsets_nonnegative" CHECK (
    ("cursorOffset" IS NULL OR "cursorOffset" >= 0) AND
    ("selectionAnchor" IS NULL OR "selectionAnchor" >= 0) AND
    ("selectionHead" IS NULL OR "selectionHead" >= 0) AND
    ("scrollTop" IS NULL OR "scrollTop" >= 0)
  )
);

CREATE UNIQUE INDEX "Plot_projectId_key" ON "Plot"("projectId");
CREATE UNIQUE INDEX "Plot_id_projectId_key" ON "Plot"("id", "projectId");
CREATE INDEX "Plot_projectId_archivedAt_idx" ON "Plot"("projectId", "archivedAt");
CREATE UNIQUE INDEX "PlotOutline_projectId_key" ON "PlotOutline"("projectId");
CREATE UNIQUE INDEX "PlotOutline_plotId_key" ON "PlotOutline"("plotId");
CREATE INDEX "PlotOutline_projectId_archivedAt_idx" ON "PlotOutline"("projectId", "archivedAt");
CREATE UNIQUE INDEX "Volume_projectId_sequenceIndex_key" ON "Volume"("projectId", "sequenceIndex");
CREATE UNIQUE INDEX "Volume_id_projectId_key" ON "Volume"("id", "projectId");
CREATE INDEX "Volume_plotId_sequenceIndex_idx" ON "Volume"("plotId", "sequenceIndex");
CREATE INDEX "Volume_projectId_archivedAt_sequenceIndex_idx" ON "Volume"("projectId", "archivedAt", "sequenceIndex");
CREATE UNIQUE INDEX "VolumeOutline_volumeId_key" ON "VolumeOutline"("volumeId");
CREATE INDEX "VolumeOutline_projectId_archivedAt_idx" ON "VolumeOutline"("projectId", "archivedAt");
CREATE UNIQUE INDEX "Chapter_id_projectId_key" ON "Chapter"("id", "projectId");
CREATE UNIQUE INDEX "Chapter_volumeId_volumeSequenceIndex_key" ON "Chapter"("volumeId", "volumeSequenceIndex");
CREATE INDEX "Chapter_projectId_volumeId_volumeSequenceIndex_idx" ON "Chapter"("projectId", "volumeId", "volumeSequenceIndex");
CREATE UNIQUE INDEX "ChapterOutline_chapterId_key" ON "ChapterOutline"("chapterId");
CREATE UNIQUE INDEX "ChapterOutline_projectId_sequenceIndex_key" ON "ChapterOutline"("projectId", "sequenceIndex");
CREATE UNIQUE INDEX "ChapterOutline_id_projectId_key" ON "ChapterOutline"("id", "projectId");
CREATE INDEX "ChapterOutline_projectId_volumeId_sequenceIndex_idx" ON "ChapterOutline"("projectId", "volumeId", "sequenceIndex");
CREATE INDEX "ChapterOutline_projectId_archivedAt_sequenceIndex_idx" ON "ChapterOutline"("projectId", "archivedAt", "sequenceIndex");
CREATE INDEX "Scene_projectId_sequenceIndex_idx" ON "Scene"("projectId", "sequenceIndex");
CREATE INDEX "Scene_chapterId_sequenceIndex_idx" ON "Scene"("chapterId", "sequenceIndex");
CREATE INDEX "Scene_chapterOutlineId_sequenceIndex_idx" ON "Scene"("chapterOutlineId", "sequenceIndex");
CREATE INDEX "Scene_projectId_archivedAt_sequenceIndex_idx" ON "Scene"("projectId", "archivedAt", "sequenceIndex");
CREATE INDEX "NarrativeIntent_projectId_targetType_targetId_archivedAt_idx" ON "NarrativeIntent"("projectId", "targetType", "targetId", "archivedAt");
CREATE INDEX "NarrativeIntent_projectId_updatedAt_idx" ON "NarrativeIntent"("projectId", "updatedAt" DESC);
CREATE INDEX "StoryReference_projectId_sourceType_sourceId_archivedAt_idx" ON "StoryReference"("projectId", "sourceType", "sourceId", "archivedAt");
CREATE INDEX "StoryReference_projectId_targetType_targetId_archivedAt_idx" ON "StoryReference"("projectId", "targetType", "targetId", "archivedAt");
CREATE INDEX "StoryReference_projectId_relationshipKey_archivedAt_idx" ON "StoryReference"("projectId", "relationshipKey", "archivedAt");
CREATE UNIQUE INDEX "StoryReference_active_identity_key" ON "StoryReference" (
  "projectId", "sourceType", "sourceId", COALESCE("sourceBlockId", ''),
  "targetType", "targetId", COALESCE("targetBlockId", ''), "relationshipKey"
) WHERE "archivedAt" IS NULL;
CREATE UNIQUE INDEX "ObjectRevision_objectType_objectId_version_key" ON "ObjectRevision"("objectType", "objectId", "version");
CREATE INDEX "ObjectRevision_projectId_objectType_objectId_createdAt_idx" ON "ObjectRevision"("projectId", "objectType", "objectId", "createdAt" DESC);
CREATE UNIQUE INDEX "StructureViewState_userId_projectId_key" ON "StructureViewState"("userId", "projectId");
CREATE INDEX "StructureViewState_projectId_activeLens_idx" ON "StructureViewState"("projectId", "activeLens");

ALTER TABLE "Plot" ADD CONSTRAINT "Plot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlotOutline" ADD CONSTRAINT "PlotOutline_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlotOutline" ADD CONSTRAINT "PlotOutline_plotId_projectId_fkey" FOREIGN KEY ("plotId", "projectId") REFERENCES "Plot"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Volume" ADD CONSTRAINT "Volume_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Volume" ADD CONSTRAINT "Volume_plotId_projectId_fkey" FOREIGN KEY ("plotId", "projectId") REFERENCES "Plot"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VolumeOutline" ADD CONSTRAINT "VolumeOutline_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VolumeOutline" ADD CONSTRAINT "VolumeOutline_volumeId_projectId_fkey" FOREIGN KEY ("volumeId", "projectId") REFERENCES "Volume"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_volumeId_projectId_fkey" FOREIGN KEY ("volumeId", "projectId") REFERENCES "Volume"("id", "projectId") ON DELETE SET NULL ("volumeId") ON UPDATE CASCADE;
ALTER TABLE "ChapterOutline" ADD CONSTRAINT "ChapterOutline_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChapterOutline" ADD CONSTRAINT "ChapterOutline_volumeId_projectId_fkey" FOREIGN KEY ("volumeId", "projectId") REFERENCES "Volume"("id", "projectId") ON DELETE SET NULL ("volumeId") ON UPDATE CASCADE;
ALTER TABLE "ChapterOutline" ADD CONSTRAINT "ChapterOutline_chapterId_projectId_fkey" FOREIGN KEY ("chapterId", "projectId") REFERENCES "Chapter"("id", "projectId") ON DELETE SET NULL ("chapterId") ON UPDATE CASCADE;
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_chapterId_projectId_fkey" FOREIGN KEY ("chapterId", "projectId") REFERENCES "Chapter"("id", "projectId") ON DELETE SET NULL ("chapterId") ON UPDATE CASCADE;
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_chapterOutlineId_projectId_fkey" FOREIGN KEY ("chapterOutlineId", "projectId") REFERENCES "ChapterOutline"("id", "projectId") ON DELETE SET NULL ("chapterOutlineId") ON UPDATE CASCADE;
ALTER TABLE "NarrativeIntent" ADD CONSTRAINT "NarrativeIntent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoryReference" ADD CONSTRAINT "StoryReference_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ObjectRevision" ADD CONSTRAINT "ObjectRevision_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StructureViewState" ADD CONSTRAINT "StructureViewState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StructureViewState" ADD CONSTRAINT "StructureViewState_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
