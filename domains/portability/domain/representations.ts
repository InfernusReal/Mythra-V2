import { createHash } from "node:crypto";

export const MYTHRA_REPRESENTATION_VERSION = "2.2.1" as const;
export const archiveCollectionNames = [
  "chapters", "chapterRevisions", "plot", "plotOutlines", "volumes", "volumeOutlines", "chapterOutlines", "scenes",
  "narrativeIntents", "storyReferences", "objectRevisions", "milestones", "chapterMilestoneLinks", "milestoneDependencies",
  "storyChanges", "causalRelations", "captures", "captureAttachments", "captureConversions", "captureRevisions", "entityTypes",
  "entityFieldDefinitions", "storyEntities", "entityFieldValues", "relationTypes", "entityRelations", "entityStateSnapshots",
  "entityRevisions", "timelineEvents", "timelineEventLinks", "notes", "notePromotions", "researchItems", "researchItemLinks", "storedAssets"
] as const;
export type ArchiveCollectionName = (typeof archiveCollectionNames)[number];
export type JsonRecord = Record<string, unknown>;

export interface ProjectArchive {
  representation: "mythra.project-archive";
  representationVersion: typeof MYTHRA_REPRESENTATION_VERSION;
  generatedAt: string;
  project: JsonRecord;
  collections: Record<ArchiveCollectionName, JsonRecord[]>;
  manuscriptMarkdown: string;
}

export interface ArchiveManifest {
  representationVersion: typeof MYTHRA_REPRESENTATION_VERSION;
  projectId: string;
  structuralVersion: number;
  collectionCounts: Record<ArchiveCollectionName, number>;
  collectionIdDigests: Record<ArchiveCollectionName, string>;
  archiveSha256: string;
  sizeBytes: number;
}

export function normalizeJson(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeJson);
  if (value && typeof value === "object") {
    const candidate = value as { toJSON?: () => unknown };
    if (typeof candidate.toJSON === "function") return normalizeJson(candidate.toJSON());
    return Object.fromEntries(Object.entries(value as JsonRecord).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, normalizeJson(item)]));
  }
  return value;
}

export function stableJsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(normalizeJson(value)));
}

export function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function idsDigest(rows: readonly JsonRecord[]): string {
  const identities = rows.map((row) => typeof row.id === "string" ? row.id : "").sort();
  return sha256(new TextEncoder().encode(identities.join("\n")));
}

export function buildManifest(archive: ProjectArchive): { manifest: ArchiveManifest; bytes: Uint8Array } {
  const bytes = stableJsonBytes(archive);
  const collectionCounts = {} as Record<ArchiveCollectionName, number>;
  const collectionIdDigests = {} as Record<ArchiveCollectionName, string>;
  for (const name of archiveCollectionNames) {
    collectionCounts[name] = archive.collections[name].length;
    collectionIdDigests[name] = idsDigest(archive.collections[name]);
  }
  return { bytes, manifest: { representationVersion: MYTHRA_REPRESENTATION_VERSION, projectId: String(archive.project.id), structuralVersion: Number(archive.project.structuralVersion), collectionCounts, collectionIdDigests, archiveSha256: sha256(bytes), sizeBytes: bytes.byteLength } };
}

export function verifyArchive(bytes: Uint8Array, expected?: ArchiveManifest): ProjectArchive {
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new Error("ARCHIVE_JSON_INVALID"); }
  if (!parsed || typeof parsed !== "object") throw new Error("ARCHIVE_SHAPE_INVALID");
  const archive = parsed as ProjectArchive;
  if (archive.representation !== "mythra.project-archive" || archive.representationVersion !== MYTHRA_REPRESENTATION_VERSION) throw new Error("ARCHIVE_VERSION_UNSUPPORTED");
  if (!archive.project || !archive.collections) throw new Error("ARCHIVE_SHAPE_INVALID");
  for (const name of archiveCollectionNames) if (!Array.isArray(archive.collections[name])) throw new Error(`ARCHIVE_COLLECTION_MISSING:${name}`);
  const rebuilt = buildManifest(archive).manifest;
  if (expected && (rebuilt.archiveSha256 !== expected.archiveSha256 || rebuilt.sizeBytes !== expected.sizeBytes)) throw new Error("ARCHIVE_INTEGRITY_MISMATCH");
  if (expected) for (const name of archiveCollectionNames) if (rebuilt.collectionCounts[name] !== expected.collectionCounts[name] || rebuilt.collectionIdDigests[name] !== expected.collectionIdDigests[name]) throw new Error(`ARCHIVE_COMPLETENESS_MISMATCH:${name}`);
  return archive;
}

export function assertManifestCompleteness(manifest: ArchiveManifest, expectedCounts: Partial<Record<ArchiveCollectionName, number>>): void {
  for (const name of archiveCollectionNames) {
    const expected = expectedCounts[name];
    if (expected !== undefined && manifest.collectionCounts[name] !== expected) throw new Error(`ARCHIVE_SOURCE_COUNT_MISMATCH:${name}`);
  }
}

export function safeCopyId(sourceProjectId: string, sourceId: string): string {
  const hex = createHash("sha256").update(`${sourceProjectId}:${sourceId}:safe-copy`).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
