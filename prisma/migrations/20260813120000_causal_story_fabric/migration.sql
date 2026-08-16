ALTER TYPE "StructureLens" ADD VALUE 'CAUSAL';
ALTER TYPE "StructureObjectType" ADD VALUE 'STORY_CHANGE';
ALTER TYPE "StructureObjectType" ADD VALUE 'CAUSAL_RELATION';

CREATE TYPE "StoryChangeKind" AS ENUM ('EVENT', 'DECISION', 'REVELATION', 'STATE_CHANGE', 'SETUP', 'PAYOFF', 'CONDITION', 'OUTCOME', 'CUSTOM');
CREATE TYPE "CausalEndpointType" AS ENUM ('MILESTONE', 'CHAPTER_OUTLINE', 'SCENE', 'TIMELINE_EVENT', 'NARRATIVE_INTENT', 'ENTITY_STATE', 'CAPTURE_DERIVED', 'MANUSCRIPT_BLOCK', 'STORY_CHANGE');
CREATE TYPE "CausalRelationType" AS ENUM ('CAUSES', 'ENABLES', 'REQUIRES', 'MOTIVATES', 'TRIGGERS', 'ESCALATES', 'PREVENTS_BLOCKS', 'REVEALS', 'TRANSFORMS', 'RESOLVES');
CREATE TYPE "CausalRelationState" AS ENUM ('ACTIVE', 'TENTATIVE', 'RETIRED');
CREATE TYPE "CausalProvenanceType" AS ENUM ('DIRECT', 'CHAPTER_PROSE', 'OUTLINE_BLOCK', 'CAPTURE_CONVERSION');

CREATE TABLE "StoryChange" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "projectId" UUID NOT NULL,
  "kind" "StoryChangeKind" NOT NULL, "title" VARCHAR(240) NOT NULL, "description" TEXT,
  "storyTime" DECIMAL(20,6), "discoveryTime" DECIMAL(20,6),
  "anchorType" "CausalEndpointType", "anchorId" UUID, "anchorBlockId" VARCHAR(128),
  "isPlaceholder" BOOLEAN NOT NULL DEFAULT false, "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archivedAt" TIMESTAMPTZ(3), CONSTRAINT "StoryChange_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoryChange_anchor_complete_check" CHECK (("anchorType" IS NULL AND "anchorId" IS NULL AND "anchorBlockId" IS NULL) OR ("anchorType" IS NOT NULL AND "anchorId" IS NOT NULL)),
  CONSTRAINT "StoryChange_anchor_block_check" CHECK (("anchorType" = 'MANUSCRIPT_BLOCK' AND "anchorBlockId" IS NOT NULL) OR (("anchorType" IS NULL OR "anchorType" <> 'MANUSCRIPT_BLOCK') AND "anchorBlockId" IS NULL)),
  CONSTRAINT "StoryChange_version_check" CHECK ("version" > 0)
);

CREATE TABLE "CausalRelation" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "projectId" UUID NOT NULL,
  "sourceType" "CausalEndpointType" NOT NULL, "sourceId" UUID NOT NULL, "sourceBlockId" VARCHAR(128),
  "targetType" "CausalEndpointType" NOT NULL, "targetId" UUID NOT NULL, "targetBlockId" VARCHAR(128),
  "relationType" "CausalRelationType" NOT NULL, "condition" TEXT,
  "strength" DOUBLE PRECISION NOT NULL DEFAULT 1, "importance" INTEGER NOT NULL DEFAULT 50,
  "state" "CausalRelationState" NOT NULL DEFAULT 'ACTIVE', "isHard" BOOLEAN NOT NULL DEFAULT false,
  "temporalProgression" BOOLEAN NOT NULL DEFAULT false, "mutualStateSemantics" BOOLEAN NOT NULL DEFAULT false,
  "note" TEXT, "provenanceType" "CausalProvenanceType" NOT NULL DEFAULT 'DIRECT', "provenanceNote" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1, "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "CausalRelation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CausalRelation_nonself_check" CHECK ("sourceType" <> "targetType" OR "sourceId" <> "targetId" OR COALESCE("sourceBlockId", '') <> COALESCE("targetBlockId", '')),
  CONSTRAINT "CausalRelation_source_block_check" CHECK (("sourceType" = 'MANUSCRIPT_BLOCK' AND "sourceBlockId" IS NOT NULL) OR ("sourceType" <> 'MANUSCRIPT_BLOCK' AND "sourceBlockId" IS NULL)),
  CONSTRAINT "CausalRelation_target_block_check" CHECK (("targetType" = 'MANUSCRIPT_BLOCK' AND "targetBlockId" IS NOT NULL) OR ("targetType" <> 'MANUSCRIPT_BLOCK' AND "targetBlockId" IS NULL)),
  CONSTRAINT "CausalRelation_strength_check" CHECK ("strength" >= 0 AND "strength" <= 1),
  CONSTRAINT "CausalRelation_importance_check" CHECK ("importance" >= 0 AND "importance" <= 100),
  CONSTRAINT "CausalRelation_hard_check" CHECK (NOT "isHard" OR "relationType" = 'REQUIRES'),
  CONSTRAINT "CausalRelation_override_check" CHECK ((NOT "temporalProgression" AND NOT "mutualStateSemantics") OR ("isHard" AND "relationType" = 'REQUIRES')),
  CONSTRAINT "CausalRelation_version_check" CHECK ("version" > 0)
);

CREATE INDEX "StoryChange_projectId_kind_archivedAt_updatedAt_idx" ON "StoryChange"("projectId", "kind", "archivedAt", "updatedAt" DESC);
CREATE INDEX "StoryChange_projectId_anchorType_anchorId_archivedAt_idx" ON "StoryChange"("projectId", "anchorType", "anchorId", "archivedAt");
CREATE INDEX "StoryChange_projectId_storyTime_discoveryTime_idx" ON "StoryChange"("projectId", "storyTime", "discoveryTime");
CREATE INDEX "CausalRelation_projectId_sourceType_sourceId_state_archivedAt_idx" ON "CausalRelation"("projectId", "sourceType", "sourceId", "state", "archivedAt");
CREATE INDEX "CausalRelation_projectId_targetType_targetId_state_archivedAt_idx" ON "CausalRelation"("projectId", "targetType", "targetId", "state", "archivedAt");
CREATE INDEX "CausalRelation_projectId_relationType_state_archivedAt_idx" ON "CausalRelation"("projectId", "relationType", "state", "archivedAt");
CREATE INDEX "CausalRelation_projectId_updatedAt_idx" ON "CausalRelation"("projectId", "updatedAt" DESC);
CREATE UNIQUE INDEX "CausalRelation_active_key" ON "CausalRelation"("projectId", "sourceType", "sourceId", COALESCE("sourceBlockId", ''), "targetType", "targetId", COALESCE("targetBlockId", ''), "relationType") WHERE "state" = 'ACTIVE' AND "archivedAt" IS NULL;

ALTER TABLE "StoryChange" ADD CONSTRAINT "StoryChange_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CausalRelation" ADD CONSTRAINT "CausalRelation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
