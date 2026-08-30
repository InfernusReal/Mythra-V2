import { describe, expect, it, vi } from "vitest";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { PortabilityService } from "@/domains/portability/application/service";
import type { PortabilityRepository } from "@/domains/portability/application/ports";
import type { Logger } from "@/lib/observability/logger";
import type { PrivateObjectStorage } from "@/lib/storage/object-storage";
import { projectArchiveFixture } from "@/tests/fixtures/portability";

const actor: SessionActor = { userId: "00000000-0000-4000-a000-000000000003", workspaceId: "00000000-0000-4000-a000-000000000002", role: "OWNER", sessionId: "test" };
const projectId = "00000000-0000-4000-a000-000000000001";
const logger: Logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), child: () => logger };

class MemoryStorage implements PrivateObjectStorage {
  readonly values = new Map<string, Uint8Array>();
  async putPrivate(input: { key: string; bytes: Uint8Array }) { if (this.values.has(input.key)) throw new Error("exists"); this.values.set(input.key, input.bytes.slice()); }
  async getPrivate(key: string) { const value = this.values.get(key); if (!value) throw new Error("missing"); return value.slice(); }
  async deletePrivate(key: string) { this.values.delete(key); }
  async createSignedDownloadUrl() { return new URL("https://invalid.example"); }
}

class MemoryRepository implements PortabilityRepository {
  snapshots = new Map<string, { id: string; status: string; storageKey: string | null; manifest: unknown; sha256: string | null; sizeBytes: bigint | null }>();
  artifacts = new Map<string, { id: string; status: string; storageKey: string | null; manifest: unknown; sha256: string | null; sizeBytes: bigint | null; expiresAt: Date | null }>();
  importConfirmed = false; safeRestored = false; currentRestored = false; snapshotCompletionFailures = 0; artifactCompletionFailures = 0;
  async status() { return { snapshots: [], artifacts: [], imports: [] }; }
  async reserveSnapshot(_actor: SessionActor, _projectId: string, input: { idempotencyKey: string }) { const existing = this.snapshots.get(input.idempotencyKey); if (existing) return { id: existing.id, replayed: true, status: existing.status, attempts: 1 }; const value = { id: `10000000-0000-4000-a000-${this.snapshots.size.toString().padStart(12, "0")}`, status: "PENDING", storageKey: null, manifest: null, sha256: null, sizeBytes: null }; this.snapshots.set(input.idempotencyKey, value); return { id: value.id, replayed: false, status: value.status, attempts: 1 }; }
  async completeSnapshot(_actor: SessionActor, _projectId: string, snapshotId: string, input: { storageKey: string; manifest: unknown; sha256: string; sizeBytes: number }) { if (this.snapshotCompletionFailures > 0) { this.snapshotCompletionFailures -= 1; throw new Error("DATABASE_COMPLETION_FAILED"); } const value = [...this.snapshots.values()].find((item) => item.id === snapshotId)!; Object.assign(value, { status: "VERIFIED", storageKey: input.storageKey, manifest: input.manifest, sha256: input.sha256, sizeBytes: BigInt(input.sizeBytes) }); }
  async failSnapshot(_actor: SessionActor, _projectId: string, snapshotId: string) { const value = [...this.snapshots.values()].find((item) => item.id === snapshotId); if (value) value.status = "FAILED"; }
  async reserveArtifact(_actor: SessionActor, _projectId: string, input: { idempotencyKey: string }) { const existing = this.artifacts.get(input.idempotencyKey); if (existing) return { id: existing.id, replayed: true, status: existing.status, storageKey: existing.storageKey, attempts: 1 }; const value = { id: `20000000-0000-4000-a000-${this.artifacts.size.toString().padStart(12, "0")}`, status: "PENDING", storageKey: null, manifest: null, sha256: null, sizeBytes: null, expiresAt: new Date("2027-01-01T00:00:00.000Z") }; this.artifacts.set(input.idempotencyKey, value); return { id: value.id, replayed: false, status: value.status, storageKey: null, attempts: 1 }; }
  async completeArtifact(_actor: SessionActor, _projectId: string, artifactId: string, input: { storageKey: string; manifest: unknown; sha256: string; sizeBytes: number }) { if (this.artifactCompletionFailures > 0) { this.artifactCompletionFailures -= 1; throw new Error("DATABASE_COMPLETION_FAILED"); } const value = [...this.artifacts.values()].find((item) => item.id === artifactId)!; Object.assign(value, { status: "VERIFIED", storageKey: input.storageKey, manifest: input.manifest, sha256: input.sha256, sizeBytes: BigInt(input.sizeBytes) }); }
  async failArtifact(_actor: SessionActor, _projectId: string, artifactId: string) { const value = [...this.artifacts.values()].find((item) => item.id === artifactId); if (value) value.status = "FAILED"; }
  async artifact(_actor: SessionActor, _projectId: string, artifactId: string) { return [...this.artifacts.values()].find((item) => item.id === artifactId) ?? null; }
  async snapshot(_actor: SessionActor, _projectId: string, snapshotId: string) { return [...this.snapshots.values()].find((item) => item.id === snapshotId) ?? null; }
  async createImportPreview(_actor: SessionActor, _projectId: string, input: { preview: Awaited<ReturnType<PortabilityService["createImportPreview"]>>["preview"] }) { return { id: "30000000-0000-4000-a000-000000000001", replayed: false, preview: input.preview }; }
  async confirmImport() { this.importConfirmed = true; return { chapterIds: ["40000000-0000-4000-a000-000000000001"] }; }
  async restoreSafeCopy() { this.safeRestored = true; return { projectId: "50000000-0000-4000-a000-000000000001", chapterCount: 1, restoredCollectionCount: 3 }; }
  async checkpointAndRestoreCurrent() { this.currentRestored = true; return { projectId, chapterCount: 1 }; }
  async destructivePreview() { return { backlinks: [], causalImpact: [], truncated: false, options: ["MOVE", "REATTACH", "RETIRE"] as const }; }
}

function service() { const repository = new MemoryRepository(); const storage = new MemoryStorage(); const instance = new PortabilityService({ repository, storage, buildArchive: async () => projectArchiveFixture(), now: () => new Date("2026-08-30T12:00:00.000Z") }, logger); return { instance, repository, storage }; }

describe("PortabilityService", () => {
  it("creates, verifies and idempotently replays immutable snapshots and full exports", async () => {
    const { instance, storage } = service(); const first = await instance.createSnapshot(actor, projectId, "snapshot-key"); const replay = await instance.createSnapshot(actor, projectId, "snapshot-key"); expect(first.replayed).toBe(false); expect(replay.replayed).toBe(true); expect(replay.manifest.archiveSha256).toBe(first.manifest.archiveSha256);
    const exported = await instance.createExport(actor, projectId, { idempotencyKey: "export-key", scope: "FULL_PROJECT", format: "MYTHRA_JSON" }); const bytes = await instance.artifactBytes(actor, projectId, exported.artifactId); expect(bytes.byteLength).toBeGreaterThan(100); expect(storage.values.size).toBe(2); expect(new TextDecoder().decode(bytes)).not.toContain("storageKey");
  });

  it("exports bounded manuscript text and preserves import originals until explicit confirmation", async () => {
    const { instance, repository, storage } = service(); await instance.createExport(actor, projectId, { idempotencyKey: "manuscript-key", scope: "MANUSCRIPT", format: "MARKDOWN" }); const preview = await instance.createImportPreview(actor, projectId, { format: "MARKDOWN", bytes: new TextEncoder().encode("# Imported\nBody"), idempotencyKey: "import-key" }); expect(preview.preview.chapters).toHaveLength(1); expect(repository.importConfirmed).toBe(false); await instance.confirmImport(actor, projectId, preview.importId); expect(repository.importConfirmed).toBe(true); expect([...storage.values.keys()].some((key) => key.includes("/imports/"))).toBe(true);
  });

  it("verifies snapshots before safe-copy/current restore and archives before destructive preview", async () => {
    const { instance, repository } = service(); const snapshot = await instance.createSnapshot(actor, projectId, "restore-source"); const safe = await instance.restore(actor, projectId, snapshot.snapshotId, "SAFE_COPY"); expect(safe.mode).toBe("SAFE_COPY"); expect(repository.safeRestored).toBe(true);
    const current = await instance.restore(actor, projectId, snapshot.snapshotId, "CURRENT"); expect(current.mode).toBe("CURRENT"); if (current.mode !== "CURRENT") throw new Error("Expected current restore."); expect(repository.currentRestored).toBe(true); expect(current.checkpointSnapshotId).toBeTruthy();
    const preview = await instance.destructivePreview(actor, projectId, { objectType: "CHAPTER", objectId: "10000000-0000-4000-a000-000000000001", idempotencyKey: "destructive-key" }); expect(preview.checkpointSnapshotId).toBeTruthy(); expect(preview.options).toEqual(["MOVE", "REATTACH", "RETIRE"]);
  });

  it("fails closed for invalid scopes, expired/corrupt artifacts and empty imports", async () => {
    const { instance, repository, storage } = service(); await expect(instance.createExport(actor, projectId, { idempotencyKey: "invalid-full", scope: "FULL_PROJECT", format: "MARKDOWN" })).rejects.toMatchObject({ code: "VALIDATION" }); await expect(instance.createExport(actor, projectId, { idempotencyKey: "missing-chapter", scope: "CHAPTER", format: "TEXT", sourceObjectId: "90000000-0000-4000-a000-000000000001" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    const exported = await instance.createExport(actor, projectId, { idempotencyKey: "expiring", scope: "MANUSCRIPT", format: "TEXT" }); const row = [...repository.artifacts.values()].find((item) => item.id === exported.artifactId)!; row.expiresAt = new Date("2026-01-01T00:00:00.000Z"); await expect(instance.artifactBytes(actor, projectId, exported.artifactId)).rejects.toMatchObject({ code: "CONFLICT" }); row.expiresAt = new Date("2027-01-01T00:00:00.000Z"); storage.values.set(row.storageKey!, new TextEncoder().encode("corrupt")); await expect(instance.artifactBytes(actor, projectId, exported.artifactId)).rejects.toMatchObject({ code: "INTEGRITY_ERROR" });
    await expect(instance.createImportPreview(actor, projectId, { format: "TEXT", bytes: new Uint8Array(), idempotencyKey: "empty-import" })).rejects.toThrow("IMPORT_SIZE_INVALID");
  });

  it("recovers immutable bytes when database completion fails after object storage succeeds", async () => {
    const { instance, repository, storage } = service(); repository.snapshotCompletionFailures = 1; await expect(instance.createSnapshot(actor, projectId, "recover-snapshot")).rejects.toMatchObject({ code: "RETRYABLE" }); const storedSnapshot = [...storage.values.values()][0]!.slice(); const retriedSnapshot = await instance.createSnapshot(actor, projectId, "recover-snapshot"); expect(retriedSnapshot.replayed).toBe(true); expect([...storage.values.values()][0]).toEqual(storedSnapshot);
    repository.artifactCompletionFailures = 1; await expect(instance.createExport(actor, projectId, { idempotencyKey: "recover-export", scope: "FULL_PROJECT", format: "MYTHRA_JSON" })).rejects.toMatchObject({ code: "RETRYABLE" }); const storedExport = [...storage.values.values()][1]!.slice(); const retriedExport = await instance.createExport(actor, projectId, { idempotencyKey: "recover-export", scope: "FULL_PROJECT", format: "MYTHRA_JSON" }); expect(retriedExport.replayed).toBe(true); expect([...storage.values.values()][1]).toEqual(storedExport);
  });
});
