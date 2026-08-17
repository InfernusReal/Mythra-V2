CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE "SearchDocumentType" AS ENUM (
  'CHAPTER',
  'CHAPTER_OUTLINE',
  'PLOT_OUTLINE',
  'VOLUME_OUTLINE',
  'MILESTONE',
  'ENTITY',
  'STORY_CHANGE',
  'CAUSAL_RELATION_TYPE',
  'UNIVERSE_RELATION_TYPE',
  'STORY_REFERENCE',
  'CAPTURE',
  'TIMELINE_EVENT',
  'NOTE',
  'RESEARCH'
);

CREATE TABLE "SearchDocument" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspaceId" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "ownerUserId" UUID,
  "documentType" "SearchDocumentType" NOT NULL,
  "sourceId" UUID NOT NULL,
  "sourceKey" VARCHAR(320) NOT NULL,
  "blockId" VARCHAR(128),
  "title" VARCHAR(500) NOT NULL,
  "bodyText" TEXT NOT NULL DEFAULT '',
  "normalizedText" TEXT NOT NULL DEFAULT '',
  "aliasesText" TEXT NOT NULL DEFAULT '',
  "metadataJson" JSONB NOT NULL DEFAULT '{}',
  "sourceVersion" INTEGER NOT NULL,
  "projectStructuralVersion" INTEGER NOT NULL,
  "freshnessKey" VARCHAR(160) NOT NULL,
  "sourceUpdatedAt" TIMESTAMPTZ(3) NOT NULL,
  "indexedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "searchVector" TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("aliasesText", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("bodyText", '')), 'B')
  ) STORED,
  CONSTRAINT "SearchDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SearchDocument_sourceKey_check" CHECK (length(btrim("sourceKey")) > 0),
  CONSTRAINT "SearchDocument_sourceVersion_check" CHECK ("sourceVersion" > 0),
  CONSTRAINT "SearchDocument_projectStructuralVersion_check" CHECK ("projectStructuralVersion" > 0)
);

CREATE UNIQUE INDEX "SearchDocument_projectId_sourceKey_key" ON "SearchDocument"("projectId", "sourceKey");
CREATE INDEX "SearchDocument_workspaceId_projectId_documentType_idx" ON "SearchDocument"("workspaceId", "projectId", "documentType");
CREATE INDEX "SearchDocument_projectId_ownerUserId_documentType_sourceUpdatedAt_idx" ON "SearchDocument"("projectId", "ownerUserId", "documentType", "sourceUpdatedAt" DESC);
CREATE INDEX "SearchDocument_projectId_freshnessKey_idx" ON "SearchDocument"("projectId", "freshnessKey");
CREATE INDEX "SearchDocument_searchVector_idx" ON "SearchDocument" USING GIN ("searchVector");
CREATE INDEX "SearchDocument_normalizedText_trgm_idx" ON "SearchDocument" USING GIN ("normalizedText" gin_trgm_ops);
CREATE INDEX "SearchDocument_aliasesText_trgm_idx" ON "SearchDocument" USING GIN ("aliasesText" gin_trgm_ops);

ALTER TABLE "SearchDocument" ADD CONSTRAINT "SearchDocument_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SearchDocument" ADD CONSTRAINT "SearchDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SearchDocument" ADD CONSTRAINT "SearchDocument_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SavedVocabularyTerm" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "term" VARCHAR(160) NOT NULL,
  "normalizedTerm" VARCHAR(160) NOT NULL,
  "locale" VARCHAR(35) NOT NULL DEFAULT 'en',
  "definition" TEXT,
  "partOfSpeech" VARCHAR(64),
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavedVocabularyTerm_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SavedVocabularyTerm_term_check" CHECK (length(btrim("term")) BETWEEN 1 AND 160),
  CONSTRAINT "SavedVocabularyTerm_normalizedTerm_check" CHECK (length(btrim("normalizedTerm")) BETWEEN 1 AND 160),
  CONSTRAINT "SavedVocabularyTerm_version_check" CHECK ("version" > 0)
);

CREATE UNIQUE INDEX "SavedVocabularyTerm_userId_projectId_normalizedTerm_locale_key" ON "SavedVocabularyTerm"("userId", "projectId", "normalizedTerm", "locale");
CREATE INDEX "SavedVocabularyTerm_workspaceId_projectId_userId_updatedAt_idx" ON "SavedVocabularyTerm"("workspaceId", "projectId", "userId", "updatedAt" DESC);

ALTER TABLE "SavedVocabularyTerm" ADD CONSTRAINT "SavedVocabularyTerm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedVocabularyTerm" ADD CONSTRAINT "SavedVocabularyTerm_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedVocabularyTerm" ADD CONSTRAINT "SavedVocabularyTerm_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
