-- Sub-gate 2 rollback. Export unresolved local/server variants before executing.
DROP TABLE IF EXISTS "ChapterSaveReceipt";
DROP TABLE IF EXISTS "DraftConflict";
DROP TABLE IF EXISTS "ChapterRevision";
DROP TYPE IF EXISTS "DraftConflictResolution";
DROP TYPE IF EXISTS "DraftConflictStatus";
DROP TYPE IF EXISTS "ChapterRevisionKind";
