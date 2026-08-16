UPDATE "StructureViewState" SET "activeLens" = 'OUTLINE' WHERE "activeLens"::text = 'CAUSAL';
DELETE FROM "ObjectRevision" WHERE "objectType"::text IN ('STORY_CHANGE', 'CAUSAL_RELATION');
DROP TABLE IF EXISTS "CausalRelation";
DROP TABLE IF EXISTS "StoryChange";
DROP TYPE IF EXISTS "CausalProvenanceType";
DROP TYPE IF EXISTS "CausalRelationState";
DROP TYPE IF EXISTS "CausalRelationType";
DROP TYPE IF EXISTS "CausalEndpointType";
DROP TYPE IF EXISTS "StoryChangeKind";

ALTER TYPE "StructureLens" RENAME TO "StructureLens_s6";
CREATE TYPE "StructureLens" AS ENUM ('OUTLINE', 'VOLUMES', 'CHAPTERS', 'RELATIONSHIPS', 'SEMANTIC_ZOOM', 'MILESTONES');
ALTER TABLE "StructureViewState" ALTER COLUMN "activeLens" DROP DEFAULT;
ALTER TABLE "StructureViewState" ALTER COLUMN "activeLens" TYPE "StructureLens" USING ("activeLens"::text::"StructureLens");
ALTER TABLE "StructureViewState" ALTER COLUMN "activeLens" SET DEFAULT 'OUTLINE';
DROP TYPE "StructureLens_s6";

ALTER TYPE "StructureObjectType" RENAME TO "StructureObjectType_s6";
CREATE TYPE "StructureObjectType" AS ENUM ('PLOT', 'PLOT_OUTLINE', 'VOLUME', 'VOLUME_OUTLINE', 'CHAPTER_OUTLINE', 'CHAPTER', 'SCENE', 'NARRATIVE_INTENT', 'STORY_REFERENCE', 'MILESTONE', 'CHAPTER_MILESTONE_LINK', 'MILESTONE_DEPENDENCY');
ALTER TABLE "ObjectRevision" ALTER COLUMN "objectType" TYPE "StructureObjectType" USING ("objectType"::text::"StructureObjectType");
DROP TYPE "StructureObjectType_s6";
