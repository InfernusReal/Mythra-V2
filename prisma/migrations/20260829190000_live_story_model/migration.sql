CREATE TYPE "LiveModelProjectionKind" AS ENUM (
  'CONTINUATION', 'CHAPTER_CONTEXT', 'MILESTONE_PROGRESS', 'VOLUME_HEALTH',
  'ENTITY_BACKLINKS', 'TIMELINE_WINDOW', 'SEARCH_DOCUMENT', 'QUOTA_SEAM',
  'CAUSAL_NEIGHBORHOOD', 'CAUSAL_IMPACT', 'NARRATIVE_DIRECTIVE', 'SEMANTIC_COORDINATE'
);
CREATE TYPE "ProjectionFreshness" AS ENUM ('FRESH', 'UPDATING', 'STALE', 'FAILED');
CREATE TYPE "LiveModelWarningType" AS ENUM (
  'RANGE_DRIFT', 'DENSITY', 'ORPHAN_STRUCTURE', 'BROKEN_REFERENCE',
  'TIMELINE_ORDER_CONFLICT', 'QUOTA_APPROACH', 'BACKUP_HEALTH',
  'CAUSAL_TEMPORAL_CONFLICT', 'HARD_PREREQUISITE_LOOP', 'ORPHAN_CAUSAL_ENDPOINT'
);

ALTER TABLE "OutboxEvent"
  ADD COLUMN "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "leaseOwner" VARCHAR(128),
  ADD COLUMN "leasedUntil" TIMESTAMPTZ(3),
  ADD COLUMN "lastErrorCode" VARCHAR(80),
  ADD COLUMN "lastErrorAt" TIMESTAMPTZ(3),
  ADD COLUMN "deadLetteredAt" TIMESTAMPTZ(3);
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "OutboxEvent_schemaVersion_check" CHECK ("schemaVersion" > 0);
DROP INDEX IF EXISTS "OutboxEvent_status_availableAt_idx";
CREATE INDEX "OutboxEvent_status_availableAt_leasedUntil_idx" ON "OutboxEvent"("status", "availableAt", "leasedUntil");

CREATE TABLE "LiveModelEventDelivery" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "eventId" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "handlerKey" VARCHAR(120) NOT NULL,
  "eventSchemaVersion" INTEGER NOT NULL,
  "projectStructuralVersion" INTEGER NOT NULL,
  "outputDigest" VARCHAR(64) NOT NULL,
  "processedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LiveModelEventDelivery_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LiveModelEventDelivery_versions_check" CHECK ("eventSchemaVersion" > 0 AND "projectStructuralVersion" > 0),
  CONSTRAINT "LiveModelEventDelivery_digest_check" CHECK ("outputDigest" ~ '^[0-9a-f]{64}$')
);
CREATE UNIQUE INDEX "LiveModelEventDelivery_eventId_key" ON "LiveModelEventDelivery"("eventId");
CREATE INDEX "LiveModelEventDelivery_projectId_projectStructuralVersion_processedAt_idx" ON "LiveModelEventDelivery"("projectId", "projectStructuralVersion", "processedAt" DESC);
ALTER TABLE "LiveModelEventDelivery" ADD CONSTRAINT "LiveModelEventDelivery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "OutboxEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LiveModelEventDelivery" ADD CONSTRAINT "LiveModelEventDelivery_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "LiveModelProjection" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "kind" "LiveModelProjectionKind" NOT NULL,
  "scopeType" VARCHAR(80) NOT NULL,
  "scopeId" VARCHAR(128) NOT NULL,
  "projectStructuralVersion" INTEGER NOT NULL,
  "sourceObjectVersions" JSONB NOT NULL DEFAULT '{}',
  "payload" JSONB NOT NULL,
  "digest" VARCHAR(64) NOT NULL,
  "freshness" "ProjectionFreshness" NOT NULL DEFAULT 'FRESH',
  "generatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "invalidatedAt" TIMESTAMPTZ(3),
  "lastEventId" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LiveModelProjection_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LiveModelProjection_version_check" CHECK ("projectStructuralVersion" > 0),
  CONSTRAINT "LiveModelProjection_digest_check" CHECK ("digest" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "LiveModelProjection_sources_check" CHECK (jsonb_typeof("sourceObjectVersions") = 'object'),
  CONSTRAINT "LiveModelProjection_payload_check" CHECK (jsonb_typeof("payload") = 'object')
);
CREATE UNIQUE INDEX "LiveModelProjection_projectId_kind_scopeType_scopeId_key" ON "LiveModelProjection"("projectId", "kind", "scopeType", "scopeId");
CREATE INDEX "LiveModelProjection_projectId_freshness_projectStructuralVersion_idx" ON "LiveModelProjection"("projectId", "freshness", "projectStructuralVersion");
CREATE INDEX "LiveModelProjection_projectId_kind_generatedAt_idx" ON "LiveModelProjection"("projectId", "kind", "generatedAt" DESC);
ALTER TABLE "LiveModelProjection" ADD CONSTRAINT "LiveModelProjection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "LiveModelWarning" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "warningKey" VARCHAR(320) NOT NULL,
  "warningType" "LiveModelWarningType" NOT NULL,
  "sourceType" VARCHAR(80) NOT NULL,
  "sourceId" VARCHAR(128) NOT NULL,
  "relatedType" VARCHAR(80),
  "relatedId" VARCHAR(128),
  "facts" JSONB NOT NULL DEFAULT '{}',
  "projectStructuralVersion" INTEGER NOT NULL,
  "suppressedAt" TIMESTAMPTZ(3),
  "suppressedById" UUID,
  "resolvedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LiveModelWarning_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LiveModelWarning_version_check" CHECK ("projectStructuralVersion" > 0),
  CONSTRAINT "LiveModelWarning_facts_check" CHECK (jsonb_typeof("facts") = 'object')
);
CREATE UNIQUE INDEX "LiveModelWarning_projectId_warningKey_key" ON "LiveModelWarning"("projectId", "warningKey");
CREATE INDEX "LiveModelWarning_projectId_warningType_resolvedAt_suppressedAt_idx" ON "LiveModelWarning"("projectId", "warningType", "resolvedAt", "suppressedAt");
CREATE INDEX "LiveModelWarning_projectId_projectStructuralVersion_idx" ON "LiveModelWarning"("projectId", "projectStructuralVersion");
ALTER TABLE "LiveModelWarning" ADD CONSTRAINT "LiveModelWarning_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
