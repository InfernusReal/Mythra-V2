DELETE FROM "NarrativeIntent" WHERE "targetType"::text = 'ENTITY_ARC';

ALTER TYPE "NarrativeIntentTargetType" RENAME TO "NarrativeIntentTargetType_s18";
ALTER TABLE "NarrativeIntent" DROP CONSTRAINT "NarrativeIntent_selection_valid";
CREATE TYPE "NarrativeIntentTargetType" AS ENUM ('PLOT', 'VOLUME', 'CHAPTER', 'SCENE', 'PARAGRAPH_SELECTION', 'MILESTONE');
ALTER TABLE "NarrativeIntent" ALTER COLUMN "targetType" TYPE "NarrativeIntentTargetType" USING ("targetType"::text::"NarrativeIntentTargetType");
ALTER TABLE "NarrativeIntent" ADD CONSTRAINT "NarrativeIntent_selection_valid" CHECK (
  ("targetType" = 'PARAGRAPH_SELECTION' AND "blockId" IS NOT NULL AND "selectionAnchor" >= 0 AND "selectionHead" >= 0)
  OR ("targetType" <> 'PARAGRAPH_SELECTION' AND "blockId" IS NULL AND "selectionAnchor" IS NULL AND "selectionHead" IS NULL)
);
DROP TYPE "NarrativeIntentTargetType_s18";
