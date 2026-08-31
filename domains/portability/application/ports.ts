import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { PrivateObjectStorage } from "@/lib/storage/object-storage";
import type { ArchiveManifest, ProjectArchive } from "../domain/representations";
import type { ImportPreview, SupportedImportFormat } from "../domain/import";

export type ExportScope = "CHAPTER" | "VOLUME" | "MANUSCRIPT" | "FULL_PROJECT";
export type ExportFormat = "TEXT" | "MARKDOWN" | "MYTHRA_JSON";

export interface ArtifactReadModel { id: string; purpose: string; scope: string; format: string; status: string; sha256: string | null; sizeBytes: string | null; createdAt: string; verifiedAt: string | null; expiresAt: string | null; lastErrorCode: string | null }
export interface SnapshotReadModel { id: string; status: string; structuralVersion: number; sha256: string | null; sizeBytes: string | null; requestedAt: string; verifiedAt: string | null; retentionUntil: string; lastErrorCode: string | null }
export interface PortabilityStatus { snapshots: SnapshotReadModel[]; artifacts: ArtifactReadModel[]; imports: Array<{ id: string; format: string; status: string; chapterCount: number; createdAt: string; expiresAt: string }> }

export interface ReservedSnapshot { id: string; replayed: boolean; status: string; attempts: number }
export interface ReservedArtifact { id: string; replayed: boolean; status: string; storageKey: string | null; attempts: number }

export interface PortabilityRepository {
  status(actor: SessionActor, projectId: string): Promise<PortabilityStatus>;
  reserveSnapshot(actor: SessionActor, projectId: string, input: { idempotencyKey: string; structuralVersion: number; retentionUntil: Date }): Promise<ReservedSnapshot>;
  completeSnapshot(actor: SessionActor, projectId: string, snapshotId: string, input: { storageKey: string; manifest: ArchiveManifest; sha256: string; sizeBytes: number }): Promise<void>;
  failSnapshot(actor: SessionActor, projectId: string, snapshotId: string, code: string): Promise<void>;
  reserveArtifact(actor: SessionActor, projectId: string, input: { idempotencyKey: string; purpose: "INTERNAL_BACKUP" | "USER_EXPORT"; scope: ExportScope; format: ExportFormat; sourceObjectId?: string; snapshotId?: string; expiresAt?: Date }): Promise<ReservedArtifact>;
  completeArtifact(actor: SessionActor, projectId: string, artifactId: string, input: { storageKey: string; manifest: unknown; sha256: string; sizeBytes: number }): Promise<void>;
  failArtifact(actor: SessionActor, projectId: string, artifactId: string, code: string): Promise<void>;
  artifact(actor: SessionActor, projectId: string, artifactId: string): Promise<{ id: string; status: string; storageKey: string | null; sha256: string | null; sizeBytes: bigint | null; expiresAt: Date | null; manifest: unknown } | null>;
  snapshot(actor: SessionActor, projectId: string, snapshotId: string): Promise<{ id: string; status: string; storageKey: string | null; manifest: unknown; sha256: string | null; sizeBytes: bigint | null } | null>;
  createImportPreview(actor: SessionActor, projectId: string, input: { format: SupportedImportFormat; storageKey: string; sha256: string; sizeBytes: number; preview: ImportPreview; idempotencyKey: string; expiresAt: Date }): Promise<{ id: string; replayed: boolean; preview: ImportPreview }>;
  confirmImport(actor: SessionActor, projectId: string, importId: string): Promise<{ chapterIds: string[] }>;
  restoreSafeCopy(actor: SessionActor, archive: ProjectArchive, sourceSnapshotId: string): Promise<{ projectId: string; chapterCount: number; restoredCollectionCount: number }>;
  checkpointAndRestoreCurrent(actor: SessionActor, projectId: string, archive: ProjectArchive, checkpointSnapshotId: string): Promise<{ projectId: string; chapterCount: number }>;
  destructivePreview(actor: SessionActor, projectId: string, objectType: string, objectId: string): Promise<{ backlinks: Array<{ id: string; sourceType: string; sourceId: string; relationshipKey: string }>; causalImpact: Array<{ id: string; sourceType: string; sourceId: string; targetType: string; targetId: string; relationType: string; provenanceType: string }>; truncated: boolean; options: readonly ["MOVE", "REATTACH", "RETIRE"] }>;
}

export interface PortabilityDependencies {
  repository: PortabilityRepository;
  storage: PrivateObjectStorage;
  buildArchive(actor: SessionActor, projectId: string, generatedAt: Date): Promise<ProjectArchive>;
  authorizeCost?(actor: SessionActor, resource: "snapshotBytes", requested: number): Promise<unknown>;
  recordUsage?(actor: SessionActor, input: { resource: "snapshotBytes" | "exportGenerationBytes" | "bandwidthBytes"; quantity: number; idempotencyKey: string; sourceType: string; sourceId?: string }): Promise<unknown>;
  now(): Date;
}
