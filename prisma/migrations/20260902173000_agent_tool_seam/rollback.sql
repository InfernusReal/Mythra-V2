DROP TABLE IF EXISTS "Suggestion";
DROP TYPE IF EXISTS "SuggestionStatus";
DROP INDEX IF EXISTS "Note_projectId_createdById_toolIdempotencyKey_key";
ALTER TABLE "Note" DROP COLUMN IF EXISTS "toolIdempotencyKey";

-- PostgreSQL audit enum labels are retained because removing enum values requires
-- rewriting the shared AuditEvent type and could invalidate predecessor audit rows.
