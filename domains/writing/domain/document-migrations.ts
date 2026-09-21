import { normalizeChapterDocument, type ChapterDocument } from "./chapter-document";

export function migrateChapterDocument(input: unknown): ChapterDocument {
  if (!input || typeof input !== "object") throw new Error("ChapterDocument must be an object.");
  const version = "schemaVersion" in input ? (input as { schemaVersion: unknown }).schemaVersion : undefined;
  if (version !== 1) throw new Error(`Unsupported ChapterDocument schema version: ${String(version)}`);
  return normalizeChapterDocument(input);
}
