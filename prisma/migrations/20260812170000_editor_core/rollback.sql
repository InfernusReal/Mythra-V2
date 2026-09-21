-- Sub-gate 1 rollback. Preserve/export any chapters before executing.
ALTER TABLE "Project" DROP CONSTRAINT IF EXISTS "Project_activeChapterId_fkey";
DROP TABLE IF EXISTS "Chapter";
DROP TABLE IF EXISTS "Project";
DROP TYPE IF EXISTS "ChapterStatus";
DROP TYPE IF EXISTS "ProjectStatus";
