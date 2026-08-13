DELETE FROM "NarrativeIntent" WHERE "targetType"::text = 'MILESTONE';
UPDATE "StructureViewState" SET "activeLens" = 'OUTLINE' WHERE "activeLens"::text = 'MILESTONES';
UPDATE "StructureViewState" SET "activeAnchorType" = NULL, "activeAnchorId" = NULL WHERE "activeAnchorType"::text = 'MILESTONE';
DELETE FROM "StoryReference" WHERE "sourceType"::text = 'MILESTONE' OR "targetType"::text = 'MILESTONE';
DELETE FROM "ObjectRevision" WHERE "objectType"::text IN ('MILESTONE', 'CHAPTER_MILESTONE_LINK', 'MILESTONE_DEPENDENCY');

DROP TABLE IF EXISTS "MilestoneDependency";
DROP TABLE IF EXISTS "ChapterMilestoneLink";
DROP TABLE IF EXISTS "Milestone";
DROP TYPE IF EXISTS "MilestoneDependencyState";
DROP TYPE IF EXISTS "MilestoneRole";
DROP TYPE IF EXISTS "MilestoneStatus";

ALTER TYPE "StructureLens" RENAME TO "StructureLens_s5";
CREATE TYPE "StructureLens" AS ENUM ('OUTLINE', 'VOLUMES', 'CHAPTERS', 'RELATIONSHIPS', 'SEMANTIC_ZOOM');
ALTER TABLE "StructureViewState" ALTER COLUMN "activeLens" DROP DEFAULT;
ALTER TABLE "StructureViewState" ALTER COLUMN "activeLens" TYPE "StructureLens" USING ("activeLens"::text::"StructureLens");
ALTER TABLE "StructureViewState" ALTER COLUMN "activeLens" SET DEFAULT 'OUTLINE';
DROP TYPE "StructureLens_s5";

ALTER TYPE "NarrativeIntentTargetType" RENAME TO "NarrativeIntentTargetType_s5";
ALTER TABLE "NarrativeIntent" DROP CONSTRAINT "NarrativeIntent_selection_valid";
CREATE TYPE "NarrativeIntentTargetType" AS ENUM ('PLOT', 'VOLUME', 'CHAPTER', 'SCENE', 'PARAGRAPH_SELECTION');
ALTER TABLE "NarrativeIntent" ALTER COLUMN "targetType" TYPE "NarrativeIntentTargetType" USING ("targetType"::text::"NarrativeIntentTargetType");
ALTER TABLE "NarrativeIntent" ADD CONSTRAINT "NarrativeIntent_selection_valid" CHECK (
  ("targetType" = 'PARAGRAPH_SELECTION' AND "blockId" IS NOT NULL AND "selectionAnchor" >= 0 AND "selectionHead" >= 0)
  OR ("targetType" <> 'PARAGRAPH_SELECTION' AND "blockId" IS NULL AND "selectionAnchor" IS NULL AND "selectionHead" IS NULL)
);
DROP TYPE "NarrativeIntentTargetType_s5";

ALTER TYPE "StructureObjectType" RENAME TO "StructureObjectType_s5";
CREATE TYPE "StructureObjectType" AS ENUM ('PLOT', 'PLOT_OUTLINE', 'VOLUME', 'VOLUME_OUTLINE', 'CHAPTER_OUTLINE', 'CHAPTER', 'SCENE', 'NARRATIVE_INTENT', 'STORY_REFERENCE');
ALTER TABLE "ObjectRevision" ALTER COLUMN "objectType" TYPE "StructureObjectType" USING ("objectType"::text::"StructureObjectType");
DROP TYPE "StructureObjectType_s5";
