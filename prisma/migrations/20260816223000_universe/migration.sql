ALTER TABLE "CaptureConversion" ALTER COLUMN "conversionType" TYPE VARCHAR(40) USING "conversionType"::text;
DROP TYPE "CaptureConversionType";

CREATE TYPE "EntityFieldType" AS ENUM ('TEXT','RICH_TEXT','NUMBER','BOOLEAN','DATE','SELECT','MULTI_SELECT','REFERENCE','REFERENCE_LIST','URL','IMAGE','FILE');
CREATE TYPE "StoryEntityStatus" AS ENUM ('ACTIVE','ARCHIVED');
CREATE TYPE "EntityStateAnchorType" AS ENUM ('UNANCHORED','CHAPTER','VOLUME','MILESTONE','TIMELINE_EVENT');

CREATE TABLE "EntityType" (
  "id" UUID PRIMARY KEY,
  "projectId" UUID,
  "systemKey" VARCHAR(80),
  "key" VARCHAR(80) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "description" TEXT,
  "icon" VARCHAR(80),
  "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  "locale" VARCHAR(35) NOT NULL DEFAULT 'en',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "EntityType_scope_check" CHECK (("projectId" IS NULL) = ("systemKey" IS NOT NULL)),
  CONSTRAINT "EntityType_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "EntityType_systemKey_key" ON "EntityType"("systemKey");
CREATE UNIQUE INDEX "EntityType_projectId_key_key" ON "EntityType"("projectId","key");
CREATE INDEX "EntityType_projectId_archivedAt_name_idx" ON "EntityType"("projectId","archivedAt","name");
CREATE INDEX "EntityType_locale_systemKey_idx" ON "EntityType"("locale","systemKey");

CREATE TABLE "EntityFieldDefinition" (
  "id" UUID PRIMARY KEY,
  "entityTypeId" UUID NOT NULL,
  "key" VARCHAR(80) NOT NULL,
  "label" VARCHAR(120) NOT NULL,
  "fieldType" "EntityFieldType" NOT NULL,
  "requiredByUser" BOOLEAN NOT NULL DEFAULT false,
  "orderIndex" INTEGER NOT NULL,
  "configJson" JSONB NOT NULL DEFAULT '{}',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "EntityFieldDefinition_order_check" CHECK ("orderIndex" >= 0 AND "orderIndex" < 100),
  CONSTRAINT "EntityFieldDefinition_entityTypeId_fkey" FOREIGN KEY ("entityTypeId") REFERENCES "EntityType"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "EntityFieldDefinition_entityTypeId_key_key" ON "EntityFieldDefinition"("entityTypeId","key");
CREATE UNIQUE INDEX "EntityFieldDefinition_entityTypeId_orderIndex_key" ON "EntityFieldDefinition"("entityTypeId","orderIndex");
CREATE INDEX "EntityFieldDefinition_entityTypeId_archivedAt_orderIndex_idx" ON "EntityFieldDefinition"("entityTypeId","archivedAt","orderIndex");

CREATE TABLE "StoryEntity" (
  "id" UUID PRIMARY KEY,
  "projectId" UUID NOT NULL,
  "entityTypeId" UUID NOT NULL,
  "createdById" UUID NOT NULL,
  "name" VARCHAR(240) NOT NULL,
  "aliasesJson" JSONB NOT NULL DEFAULT '[]',
  "summary" TEXT,
  "status" "StoryEntityStatus" NOT NULL DEFAULT 'ACTIVE',
  "tagsJson" JSONB NOT NULL DEFAULT '[]',
  "icon" VARCHAR(80),
  "colorToken" VARCHAR(80),
  "metadataJson" JSONB NOT NULL DEFAULT '{}',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "StoryEntity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "StoryEntity_entityTypeId_fkey" FOREIGN KEY ("entityTypeId") REFERENCES "EntityType"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "StoryEntity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "StoryEntity_projectId_entityTypeId_status_name_idx" ON "StoryEntity"("projectId","entityTypeId","status","name");
CREATE INDEX "StoryEntity_projectId_updatedAt_idx" ON "StoryEntity"("projectId","updatedAt" DESC);

CREATE TABLE "EntityFieldValue" (
  "id" UUID PRIMARY KEY,
  "entityId" UUID NOT NULL,
  "fieldDefinitionId" UUID NOT NULL,
  "valueJson" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "EntityFieldValue_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "StoryEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EntityFieldValue_fieldDefinitionId_fkey" FOREIGN KEY ("fieldDefinitionId") REFERENCES "EntityFieldDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "EntityFieldValue_entityId_fieldDefinitionId_key" ON "EntityFieldValue"("entityId","fieldDefinitionId");
CREATE INDEX "EntityFieldValue_fieldDefinitionId_entityId_idx" ON "EntityFieldValue"("fieldDefinitionId","entityId");

CREATE TABLE "RelationType" (
  "id" UUID PRIMARY KEY,
  "projectId" UUID,
  "systemKey" VARCHAR(80),
  "key" VARCHAR(80) NOT NULL,
  "forwardLabel" VARCHAR(120) NOT NULL,
  "reverseLabel" VARCHAR(120) NOT NULL,
  "directional" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "RelationType_scope_check" CHECK (("projectId" IS NULL) = ("systemKey" IS NOT NULL)),
  CONSTRAINT "RelationType_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RelationType_systemKey_key" ON "RelationType"("systemKey");
CREATE UNIQUE INDEX "RelationType_projectId_key_key" ON "RelationType"("projectId","key");
CREATE INDEX "RelationType_projectId_archivedAt_forwardLabel_idx" ON "RelationType"("projectId","archivedAt","forwardLabel");

CREATE TABLE "EntityRelation" (
  "id" UUID PRIMARY KEY,
  "projectId" UUID NOT NULL,
  "fromEntityId" UUID NOT NULL,
  "toEntityId" UUID NOT NULL,
  "relationTypeId" UUID NOT NULL,
  "note" TEXT,
  "validFrom" VARCHAR(160),
  "validTo" VARCHAR(160),
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "EntityRelation_no_self_check" CHECK ("fromEntityId" <> "toEntityId"),
  CONSTRAINT "EntityRelation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EntityRelation_fromEntityId_fkey" FOREIGN KEY ("fromEntityId") REFERENCES "StoryEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EntityRelation_toEntityId_fkey" FOREIGN KEY ("toEntityId") REFERENCES "StoryEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EntityRelation_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "RelationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "EntityRelation_fromEntityId_toEntityId_relationTypeId_key" ON "EntityRelation"("fromEntityId","toEntityId","relationTypeId");
CREATE INDEX "EntityRelation_projectId_fromEntityId_archivedAt_idx" ON "EntityRelation"("projectId","fromEntityId","archivedAt");
CREATE INDEX "EntityRelation_projectId_toEntityId_archivedAt_idx" ON "EntityRelation"("projectId","toEntityId","archivedAt");

CREATE TABLE "EntityStateSnapshot" (
  "id" UUID PRIMARY KEY,
  "projectId" UUID NOT NULL,
  "entityId" UUID NOT NULL,
  "anchorType" "EntityStateAnchorType" NOT NULL DEFAULT 'UNANCHORED',
  "anchorId" UUID,
  "stateJson" JSONB NOT NULL,
  "note" TEXT,
  "orderIndex" INTEGER NOT NULL,
  "sourceEntityVersion" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "EntityStateSnapshot_anchor_check" CHECK (("anchorType" = 'UNANCHORED' AND "anchorId" IS NULL) OR ("anchorType" <> 'UNANCHORED' AND "anchorId" IS NOT NULL)),
  CONSTRAINT "EntityStateSnapshot_order_check" CHECK ("orderIndex" >= 0 AND "orderIndex" < 1000),
  CONSTRAINT "EntityStateSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EntityStateSnapshot_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "StoryEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "EntityStateSnapshot_entityId_orderIndex_key" ON "EntityStateSnapshot"("entityId","orderIndex");
CREATE INDEX "EntityStateSnapshot_projectId_entityId_archivedAt_orderIndex_idx" ON "EntityStateSnapshot"("projectId","entityId","archivedAt","orderIndex");
CREATE INDEX "EntityStateSnapshot_projectId_anchorType_anchorId_archivedAt_idx" ON "EntityStateSnapshot"("projectId","anchorType","anchorId","archivedAt");

CREATE TABLE "EntityRevision" (
  "id" UUID PRIMARY KEY,
  "projectId" UUID NOT NULL,
  "entityId" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "reason" VARCHAR(80) NOT NULL,
  "createdById" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EntityRevision_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EntityRevision_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "StoryEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EntityRevision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "EntityRevision_entityId_version_key" ON "EntityRevision"("entityId","version");
CREATE INDEX "EntityRevision_projectId_entityId_createdAt_idx" ON "EntityRevision"("projectId","entityId","createdAt" DESC);
