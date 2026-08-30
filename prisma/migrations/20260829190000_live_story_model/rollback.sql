DROP TABLE IF EXISTS "LiveModelWarning";
DROP TABLE IF EXISTS "LiveModelProjection";
DROP TABLE IF EXISTS "LiveModelEventDelivery";

DROP INDEX IF EXISTS "OutboxEvent_status_availableAt_leasedUntil_idx";
ALTER TABLE "OutboxEvent"
  DROP CONSTRAINT IF EXISTS "OutboxEvent_schemaVersion_check",
  DROP COLUMN IF EXISTS "deadLetteredAt",
  DROP COLUMN IF EXISTS "lastErrorAt",
  DROP COLUMN IF EXISTS "lastErrorCode",
  DROP COLUMN IF EXISTS "leasedUntil",
  DROP COLUMN IF EXISTS "leaseOwner",
  DROP COLUMN IF EXISTS "schemaVersion";
CREATE INDEX IF NOT EXISTS "OutboxEvent_status_availableAt_idx" ON "OutboxEvent"("status", "availableAt");

DROP TYPE IF EXISTS "LiveModelWarningType";
DROP TYPE IF EXISTS "ProjectionFreshness";
DROP TYPE IF EXISTS "LiveModelProjectionKind";
