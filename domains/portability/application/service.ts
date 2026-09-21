import { createHash, randomUUID } from "node:crypto";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { Logger } from "@/lib/observability/logger";
import { errors } from "@/lib/contracts/errors";
import { previewImport, type SupportedImportFormat } from "../domain/import";
import { buildManifest, normalizeJson, safeCopyId, sha256, verifyArchive, type ArchiveManifest, type JsonRecord, type ProjectArchive } from "../domain/representations";
import type { ExportFormat, ExportScope, PortabilityDependencies } from "./ports";
import { recordOperationalEvent, type OperationalEventSink } from "@/lib/observability/operations";

const EXPORT_TTL_MS = 24 * 60 * 60 * 1_000;
const IMPORT_TTL_MS = 7 * 24 * 60 * 60 * 1_000;
const SNAPSHOT_RETENTION_MS = 90 * 24 * 60 * 60 * 1_000;

function stableCode(caught: unknown): string { return caught instanceof Error && /^[A-Z0-9_:.-]{3,80}$/.test(caught.message) ? caught.message.slice(0, 80) : "PORTABILITY_OPERATION_FAILED"; }
function artifactContentType(format: ExportFormat): string { return format === "TEXT" ? "text/plain; charset=utf-8" : format === "MARKDOWN" ? "text/markdown; charset=utf-8" : "application/vnd.mythra.project+json"; }
function asText(value: unknown): string { return typeof value === "string" ? value : ""; }
function userOwnedArchive(archive: ProjectArchive): ProjectArchive {
  const sanitized = normalizeJson(archive) as JsonRecord as unknown as ProjectArchive;
  sanitized.collections.storedAssets = sanitized.collections.storedAssets.map((asset) => Object.fromEntries(Object.entries(asset).filter(([key]) => key !== "storageKey")));
  return sanitized;
}

export class PortabilityService {
  constructor(private readonly dependencies: PortabilityDependencies, private readonly logger: Logger, private readonly operations?: OperationalEventSink) {}

  private async recordOperationSafe(actor: SessionActor, projectId: string, eventName: "backup.status" | "export.status" | "recovery.incident" | "storage.failure", dimensions: Record<string, string>, durationMs?: number): Promise<void> {
    if (!this.operations) return;
    await recordOperationalEvent(this.operations, { workspaceId: actor.workspaceId, actorUserId: actor.userId, projectId, eventName, durationMs, dimensions }).catch(() => undefined);
  }

  private async recordUsageSafe(actor: SessionActor, input: { resource: "snapshotBytes" | "exportGenerationBytes" | "bandwidthBytes"; quantity: number; idempotencyKey: string; sourceType: string; sourceId?: string }): Promise<void> {
    if (!this.dependencies.recordUsage) return;
    try {
      await this.dependencies.recordUsage(actor, input);
      // Console trace S14-METER-001: portability cost accounting completion records only resource/quantity/source identity.
      this.logger.info("portability.cost_accounted", { step: "S14-METER-001", workspaceId: actor.workspaceId, resource: input.resource, quantity: input.quantity, sourceType: input.sourceType, sourceId: input.sourceId ?? null });
    } catch {
      // Console trace S14-METER-002: metering failure degrades independently and never invalidates an owned export or verified snapshot.
      this.logger.warn("portability.cost_accounting_failed", { step: "S14-METER-002", workspaceId: actor.workspaceId, resource: input.resource, quantity: input.quantity, sourceType: input.sourceType, sourceId: input.sourceId ?? null, errorCode: "USAGE_ACCOUNTING_UNAVAILABLE" });
    }
  }

  async status(actor: SessionActor, projectId: string) {
    const result = await this.dependencies.repository.status(actor, projectId);
    // Console trace S13-API-001: portability status reports bounded artifact states and counts without archive or manuscript content.
    this.logger.info("portability.status_read", { step: "S13-API-001", projectId, snapshotCount: result.snapshots.length, artifactCount: result.artifacts.length, importCount: result.imports.length });
    return result;
  }

  private async putImmutable(key: string, bytes: Uint8Array, contentType: string): Promise<void> {
    // Console trace S13-STORAGE-001: immutable private write begins with byte count and digest only.
    this.logger.info("portability.storage_put_started", { step: "S13-STORAGE-001", storageKeyHash: createHash("sha256").update(key).digest("hex"), sizeBytes: bytes.byteLength, sha256: sha256(bytes) });
    try { await this.dependencies.storage.putPrivate({ key, bytes, contentType }); }
    catch {
      const existing = await this.dependencies.storage.getPrivate(key).catch(() => null);
      if (!existing || sha256(existing) !== sha256(bytes)) throw new Error("IMMUTABLE_STORAGE_CONFLICT");
    }
    // Console trace S13-STORAGE-002: immutable private write completion discloses no object key or signed credential.
    this.logger.info("portability.storage_put_completed", { step: "S13-STORAGE-002", sizeBytes: bytes.byteLength, sha256: sha256(bytes) });
  }

  async createSnapshot(actor: SessionActor, projectId: string, idempotencyKey: string) {
    const startedAt = performance.now();
    // Console trace S13-SNAPSHOT-001: owned snapshot build begins with stable identity and idempotency metadata only.
    this.logger.info("portability.snapshot_started", { step: "S13-SNAPSHOT-001", projectId, idempotencyKeyHash: sha256(new TextEncoder().encode(idempotencyKey)) });
    const now = this.dependencies.now(); const archive = await this.dependencies.buildArchive(actor, projectId, now); let { manifest, bytes } = buildManifest(archive);
    await this.dependencies.authorizeCost?.(actor, "snapshotBytes", manifest.sizeBytes);
    const reserved = await this.dependencies.repository.reserveSnapshot(actor, projectId, { idempotencyKey, structuralVersion: manifest.structuralVersion, retentionUntil: new Date(now.getTime() + SNAPSHOT_RETENTION_MS) });
    if (reserved.replayed && reserved.status === "VERIFIED") {
      const persisted = await this.dependencies.repository.snapshot(actor, projectId, reserved.id);
      if (!persisted?.storageKey || !persisted.manifest) throw errors.integrity();
      const persistedManifest = persisted.manifest as ArchiveManifest;
      verifyArchive(await this.dependencies.storage.getPrivate(persisted.storageKey), persistedManifest);
      return { snapshotId: reserved.id, replayed: true, manifest: persistedManifest };
    }
    if (reserved.attempts >= 8) throw errors.conflict("Snapshot retry budget exhausted; create a new snapshot request.");
    const storageKey = `${actor.workspaceId}/${projectId}/snapshots/${reserved.id}.mythra.json`;
    if (reserved.replayed && reserved.status === "FAILED") {
      const existing = await this.dependencies.storage.getPrivate(storageKey).catch(() => null);
      if (existing) { const recovered = verifyArchive(existing); const rebuilt = buildManifest(recovered); manifest = rebuilt.manifest; bytes = existing; }
    }
    // Console trace S13-MANIFEST-001: complete archive manifest records only source counts, structural version, bytes and hash.
    this.logger.info("portability.manifest_built", { step: "S13-MANIFEST-001", projectId, structuralVersion: manifest.structuralVersion, collectionCount: Object.keys(manifest.collectionCounts).length, recordCount: Object.values(manifest.collectionCounts).reduce((sum, count) => sum + count, 0), sizeBytes: manifest.sizeBytes, sha256: manifest.archiveSha256 });
    try {
      await this.putImmutable(storageKey, bytes, "application/vnd.mythra.project+json");
      const stored = await this.dependencies.storage.getPrivate(storageKey); verifyArchive(stored, manifest);
      await this.dependencies.repository.completeSnapshot(actor, projectId, reserved.id, { storageKey, manifest, sha256: manifest.archiveSha256, sizeBytes: manifest.sizeBytes });
      await this.recordUsageSafe(actor, { resource: "snapshotBytes", quantity: manifest.sizeBytes, idempotencyKey: `snapshot:${reserved.id}`, sourceType: "ProjectSnapshot", sourceId: reserved.id });
      // Console trace S13-SNAPSHOT-002: verified snapshot completion contains integrity, version and size evidence only.
      this.logger.info("portability.snapshot_verified", { step: "S13-SNAPSHOT-002", projectId, snapshotId: reserved.id, structuralVersion: manifest.structuralVersion, sizeBytes: manifest.sizeBytes, sha256: manifest.archiveSha256 });
      await this.recordOperationSafe(actor, projectId, "backup.status", { status: "verified", resource: "project_snapshot" }, Math.max(0, Math.round(performance.now() - startedAt)));
      return { snapshotId: reserved.id, replayed: reserved.replayed, manifest };
    } catch (caught) { const code = stableCode(caught); await this.dependencies.repository.failSnapshot(actor, projectId, reserved.id, code); await this.recordOperationSafe(actor, projectId, "backup.status", { status: "failed", errorCode: code, resource: "project_snapshot" }, Math.max(0, Math.round(performance.now() - startedAt)));
      // Console trace S16-OPS-005: snapshot failure signal records only stable project/error/status dimensions and duration.
      this.logger.error("backup.status", { step: "S16-OPS-005", workspaceId: actor.workspaceId, projectId, status: "failed", errorCode: code, durationMs: Math.max(0, Math.round(performance.now() - startedAt)) }); throw errors.retryable(); }
  }

  private exportBytes(archive: ProjectArchive, scope: ExportScope, format: ExportFormat, sourceObjectId?: string): Uint8Array {
    if (scope === "FULL_PROJECT") {
      if (format !== "MYTHRA_JSON") throw errors.validation("Full project archives use the versioned Mythra JSON representation.");
      return buildManifest(userOwnedArchive(archive)).bytes;
    }
    const chapters = archive.collections.chapters.filter((chapter) => scope === "MANUSCRIPT" || (scope === "CHAPTER" && chapter.id === sourceObjectId) || (scope === "VOLUME" && chapter.volumeId === sourceObjectId)).sort((left, right) => Number(left.sequenceIndex) - Number(right.sequenceIndex));
    if (!chapters.length) throw errors.notFound();
    const text = chapters.map((chapter) => format === "MARKDOWN" ? `# ${asText(chapter.title)}\n\n${asText(chapter.bodyText)}` : asText(chapter.bodyText)).join("\n\n");
    return new TextEncoder().encode(text);
  }

  async createExport(actor: SessionActor, projectId: string, input: { idempotencyKey: string; scope: ExportScope; format: ExportFormat; sourceObjectId?: string }) {
    const startedAt = performance.now();
    const now = this.dependencies.now();
    // Console trace S13-EXPORT-001: export request logs scope, format and stable identifiers without generated content.
    this.logger.info("portability.export_started", { step: "S13-EXPORT-001", projectId, scope: input.scope, format: input.format, sourceObjectId: input.sourceObjectId ?? null });
    const archive = await this.dependencies.buildArchive(actor, projectId, now); let bytes = this.exportBytes(archive, input.scope, input.format, input.sourceObjectId); let digest = sha256(bytes);
    let fullManifest: unknown = input.scope === "FULL_PROJECT" ? buildManifest(userOwnedArchive(archive)).manifest : { representationVersion: archive.representationVersion, projectId, structuralVersion: archive.project.structuralVersion, scope: input.scope, format: input.format, sourceObjectId: input.sourceObjectId ?? null, sha256: digest, sizeBytes: bytes.byteLength };
    const reserved = await this.dependencies.repository.reserveArtifact(actor, projectId, { idempotencyKey: input.idempotencyKey, purpose: "USER_EXPORT", scope: input.scope, format: input.format, sourceObjectId: input.sourceObjectId, expiresAt: new Date(now.getTime() + EXPORT_TTL_MS) });
    if (reserved.replayed && reserved.status === "VERIFIED") return { artifactId: reserved.id, replayed: true };
    if (reserved.attempts >= 8) throw errors.conflict("Export retry budget exhausted; create a new export request.");
    const extension = input.format === "TEXT" ? "txt" : input.format === "MARKDOWN" ? "md" : "mythra.json"; const storageKey = `${actor.workspaceId}/${projectId}/exports/${reserved.id}.${extension}`;
    if (reserved.replayed && reserved.status === "FAILED") {
      const existing = await this.dependencies.storage.getPrivate(storageKey).catch(() => null);
      if (existing) {
        bytes = existing; digest = sha256(bytes);
        fullManifest = input.scope === "FULL_PROJECT" ? buildManifest(verifyArchive(bytes)).manifest : { representationVersion: archive.representationVersion, projectId, structuralVersion: archive.project.structuralVersion, scope: input.scope, format: input.format, sourceObjectId: input.sourceObjectId ?? null, sha256: digest, sizeBytes: bytes.byteLength };
      }
    }
    try { await this.putImmutable(storageKey, bytes, artifactContentType(input.format)); const stored = await this.dependencies.storage.getPrivate(storageKey); if (sha256(stored) !== digest) throw new Error("ARTIFACT_INTEGRITY_MISMATCH"); await this.dependencies.repository.completeArtifact(actor, projectId, reserved.id, { storageKey, manifest: fullManifest, sha256: digest, sizeBytes: bytes.byteLength }); }
    catch (caught) { const code = stableCode(caught); await this.dependencies.repository.failArtifact(actor, projectId, reserved.id, code); await this.recordOperationSafe(actor, projectId, "export.status", { status: "failed", errorCode: code, resource: "user_export" }, Math.max(0, Math.round(performance.now() - startedAt)));
      // Console trace S16-OPS-006: export failure signal records only stable project/error/status dimensions and duration.
      this.logger.error("export.status", { step: "S16-OPS-006", workspaceId: actor.workspaceId, projectId, status: "failed", errorCode: code, durationMs: Math.max(0, Math.round(performance.now() - startedAt)) }); throw errors.retryable(); }
    await this.recordUsageSafe(actor, { resource: "exportGenerationBytes", quantity: bytes.byteLength, idempotencyKey: `export:${reserved.id}`, sourceType: "PortabilityArtifact", sourceId: reserved.id });
    // Console trace S13-EXPORT-002: immutable export completion logs integrity and expiry facts only.
    this.logger.info("portability.export_verified", { step: "S13-EXPORT-002", projectId, artifactId: reserved.id, scope: input.scope, format: input.format, sizeBytes: bytes.byteLength, sha256: digest, expiresInSeconds: EXPORT_TTL_MS / 1_000 });
    await this.recordOperationSafe(actor, projectId, "export.status", { status: "verified", resource: "user_export" }, Math.max(0, Math.round(performance.now() - startedAt)));
    return { artifactId: reserved.id, replayed: reserved.replayed };
  }

  async artifactBytes(actor: SessionActor, projectId: string, artifactId: string) {
    const artifact = await this.dependencies.repository.artifact(actor, projectId, artifactId);
    if (!artifact || artifact.status !== "VERIFIED" || !artifact.storageKey || !artifact.sha256 || !artifact.sizeBytes) throw errors.notFound();
    if (artifact.expiresAt && artifact.expiresAt <= this.dependencies.now()) throw errors.conflict("The export artifact expired.");
    const bytes = await this.dependencies.storage.getPrivate(artifact.storageKey); if (sha256(bytes) !== artifact.sha256 || BigInt(bytes.byteLength) !== artifact.sizeBytes) throw errors.integrity();
    await this.recordUsageSafe(actor, { resource: "bandwidthBytes", quantity: bytes.byteLength, idempotencyKey: `download:${artifact.id}:${randomUUID()}`, sourceType: "PortabilityDownload", sourceId: artifact.id });
    // Console trace S13-STORAGE-003: authenticated artifact read verifies size and digest without logging bytes, key or token.
    this.logger.info("portability.artifact_read_verified", { step: "S13-STORAGE-003", projectId, artifactId, sizeBytes: bytes.byteLength, sha256: artifact.sha256 });
    return bytes;
  }

  async createImportPreview(actor: SessionActor, projectId: string, input: { format: SupportedImportFormat; bytes: Uint8Array; idempotencyKey: string }) {
    // Console trace S13-IMPORT-001: import parsing begins with format, byte count and digest only.
    this.logger.info("portability.import_preview_started", { step: "S13-IMPORT-001", projectId, format: input.format, sizeBytes: input.bytes.byteLength, sha256: sha256(input.bytes) });
    const preview = await previewImport(input.format, input.bytes); const now = this.dependencies.now(); const digest = sha256(input.bytes); const key = `${actor.workspaceId}/${projectId}/imports/${digest}.original`;
    await this.putImmutable(key, input.bytes, input.format === "DOCX" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : input.format === "MARKDOWN" ? "text/markdown" : "text/plain");
    const result = await this.dependencies.repository.createImportPreview(actor, projectId, { format: input.format, storageKey: key, sha256: digest, sizeBytes: input.bytes.byteLength, preview, idempotencyKey: input.idempotencyKey, expiresAt: new Date(now.getTime() + IMPORT_TTL_MS) });
    // Console trace S13-IMPORT-002: preview completion reports bounded chapter and warning counts, never imported text or titles.
    this.logger.info("portability.import_preview_ready", { step: "S13-IMPORT-002", projectId, importId: result.id, format: input.format, chapterCount: preview.chapters.length, warningCount: preview.warningCodes.length, replayed: result.replayed });
    return { importId: result.id, preview: result.preview, replayed: result.replayed };
  }

  async confirmImport(actor: SessionActor, projectId: string, importId: string) {
    const result = await this.dependencies.repository.confirmImport(actor, projectId, importId);
    // Console trace S13-IMPORT-003: confirmed import logs created identities/counts only after explicit preview acceptance.
    this.logger.info("portability.import_confirmed", { step: "S13-IMPORT-003", projectId, importId, chapterCount: result.chapterIds.length });
    return result;
  }

  async restore(actor: SessionActor, projectId: string, snapshotId: string, mode: "SAFE_COPY" | "CURRENT") {
    // Console trace S13-RESTORE-001: restore starts with owned snapshot identity and selected safety mode only.
    this.logger.info("portability.restore_started", { step: "S13-RESTORE-001", projectId, snapshotId, mode });
    const snapshot = await this.dependencies.repository.snapshot(actor, projectId, snapshotId); if (!snapshot || snapshot.status !== "VERIFIED" || !snapshot.storageKey || !snapshot.manifest || !snapshot.sha256 || !snapshot.sizeBytes) throw errors.notFound();
    const bytes = await this.dependencies.storage.getPrivate(snapshot.storageKey); const manifest = snapshot.manifest as unknown as ArchiveManifest; const archive = verifyArchive(bytes, manifest);
    if (mode === "CURRENT") {
      const checkpoint = await this.createSnapshot(actor, projectId, `pre-restore:${snapshotId}:${this.dependencies.now().toISOString()}`);
      const result = await this.dependencies.repository.checkpointAndRestoreCurrent(actor, projectId, archive, checkpoint.snapshotId);
      // Console trace S13-RESTORE-002: current restore completion proves the mandatory checkpoint identity and restored count.
      this.logger.info("portability.restore_current_completed", { step: "S13-RESTORE-002", projectId, snapshotId, checkpointSnapshotId: checkpoint.snapshotId, chapterCount: result.chapterCount });
      await this.recordOperationSafe(actor, projectId, "recovery.incident", { status: "completed", action: "restore_current" });
      return { ...result, mode, checkpointSnapshotId: checkpoint.snapshotId };
    }
    const targetProjectId = safeCopyId(projectId, snapshotId); const copiedKeys: string[] = [];
    try {
      for (const asset of archive.collections.storedAssets) {
        if (typeof asset.storageKey !== "string" || typeof asset.id !== "string") continue;
        const targetKey = `${actor.workspaceId}/${targetProjectId}/restored/${safeCopyId(projectId, asset.id)}`; const assetBytes = await this.dependencies.storage.getPrivate(asset.storageKey); await this.putImmutable(targetKey, assetBytes, typeof asset.contentType === "string" ? asset.contentType : "application/octet-stream"); copiedKeys.push(targetKey);
      }
      const result = await this.dependencies.repository.restoreSafeCopy(actor, archive, snapshotId);
      // Console trace S13-RESTORE-003: safe-copy restore reports new identity and bounded restored counts without canonical content.
      this.logger.info("portability.restore_safe_copy_completed", { step: "S13-RESTORE-003", projectId, snapshotId, safeCopyProjectId: result.projectId, chapterCount: result.chapterCount, restoredCollectionCount: result.restoredCollectionCount, copiedAssetCount: copiedKeys.length });
      await this.recordOperationSafe(actor, projectId, "recovery.incident", { status: "completed", action: "restore_safe_copy" });
      return { ...result, mode };
    } catch (caught) { await Promise.all(copiedKeys.map((key) => this.dependencies.storage.deletePrivate(key).catch(() => undefined))); throw caught; }
  }

  async destructivePreview(actor: SessionActor, projectId: string, input: { objectType: string; objectId: string; idempotencyKey: string }) {
    const checkpoint = await this.createSnapshot(actor, projectId, `destructive:${input.idempotencyKey}`); const preview = await this.dependencies.repository.destructivePreview(actor, projectId, input.objectType, input.objectId);
    // Console trace S13-RESTORE-004: destructive preview proves archive-first ordering and bounded impact counts/provenance only.
    this.logger.info("portability.destructive_preview_ready", { step: "S13-RESTORE-004", projectId, objectType: input.objectType, objectId: input.objectId, checkpointSnapshotId: checkpoint.snapshotId, backlinkCount: preview.backlinks.length, causalImpactCount: preview.causalImpact.length, truncated: preview.truncated });
    return { checkpointSnapshotId: checkpoint.snapshotId, ...preview };
  }
}
