DROP TABLE IF EXISTS "ImportSession";
DROP TABLE IF EXISTS "PortabilityArtifact";
DROP TABLE IF EXISTS "ProjectSnapshot";

ALTER TABLE "ObjectRevision"
  DROP COLUMN IF EXISTS "createdById",
  DROP COLUMN IF EXISTS "snapshotHash",
  DROP COLUMN IF EXISTS "representationVersion";

DROP TYPE IF EXISTS "ImportSessionStatus";
DROP TYPE IF EXISTS "ProjectSnapshotStatus";
DROP TYPE IF EXISTS "PortabilityArtifactStatus";
DROP TYPE IF EXISTS "PortabilityArtifactFormat";
DROP TYPE IF EXISTS "PortabilityArtifactScope";
DROP TYPE IF EXISTS "PortabilityArtifactPurpose";

-- PostgreSQL enum values are retained for rolling-deployment safety. Removing
-- ChapterRevisionKind values requires a table rewrite and is not rollback-safe.
