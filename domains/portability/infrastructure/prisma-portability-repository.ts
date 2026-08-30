import { Prisma, type PrismaClient } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { deriveChapterText } from "@/domains/writing/domain/chapter-document";
import { errors } from "@/lib/contracts/errors";
import { importedChapterDocument, type ImportPreview } from "../domain/import";
import { archiveCollectionNames, normalizeJson, safeCopyId, type JsonRecord, type ProjectArchive } from "../domain/representations";
import type { PortabilityRepository, PortabilityStatus } from "../application/ports";

interface BulkModel { createMany(args: { data: JsonRecord[]; skipDuplicates?: boolean }): Promise<{ count: number }> }
interface UpsertModel { upsert(args: { where: { id: string }; create: JsonRecord; update: JsonRecord }): Promise<unknown> }

function json(value: unknown): Prisma.InputJsonValue { return value as Prisma.InputJsonValue; }
function asRecord(value: unknown): JsonRecord { return value as JsonRecord; }
function without(row: JsonRecord, ...keys: string[]): JsonRecord { return Object.fromEntries(Object.entries(row).filter(([key]) => !keys.includes(key))); }

function remapValue(value: unknown, ids: ReadonlyMap<string, string>, sourceProjectId: string, targetProjectId: string): unknown {
  if (typeof value === "string") return value === sourceProjectId ? targetProjectId : ids.get(value) ?? value;
  if (Array.isArray(value)) return value.map((item) => remapValue(item, ids, sourceProjectId, targetProjectId));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as JsonRecord).map(([key, item]) => [key, remapValue(item, ids, sourceProjectId, targetProjectId)]));
  return value;
}

const restoreOrder: ReadonlyArray<{ collection: keyof ProjectArchive["collections"]; model: string }> = [
  { collection: "plot", model: "plot" }, { collection: "plotOutlines", model: "plotOutline" }, { collection: "volumes", model: "volume" },
  { collection: "volumeOutlines", model: "volumeOutline" }, { collection: "chapters", model: "chapter" }, { collection: "chapterOutlines", model: "chapterOutline" },
  { collection: "scenes", model: "scene" }, { collection: "narrativeIntents", model: "narrativeIntent" }, { collection: "milestones", model: "milestone" },
  { collection: "chapterMilestoneLinks", model: "chapterMilestoneLink" }, { collection: "milestoneDependencies", model: "milestoneDependency" },
  { collection: "storyChanges", model: "storyChange" }, { collection: "causalRelations", model: "causalRelation" }, { collection: "storyReferences", model: "storyReference" },
  { collection: "captures", model: "capture" }, { collection: "captureAttachments", model: "captureAttachment" }, { collection: "captureConversions", model: "captureConversion" },
  { collection: "captureRevisions", model: "captureRevision" }, { collection: "entityTypes", model: "entityType" }, { collection: "entityFieldDefinitions", model: "entityFieldDefinition" },
  { collection: "storyEntities", model: "storyEntity" }, { collection: "entityFieldValues", model: "entityFieldValue" }, { collection: "relationTypes", model: "relationType" },
  { collection: "entityRelations", model: "entityRelation" }, { collection: "entityStateSnapshots", model: "entityStateSnapshot" }, { collection: "entityRevisions", model: "entityRevision" },
  { collection: "timelineEvents", model: "timelineEvent" }, { collection: "timelineEventLinks", model: "timelineEventLink" }, { collection: "notes", model: "note" },
  { collection: "notePromotions", model: "notePromotion" }, { collection: "storedAssets", model: "storedAsset" }, { collection: "researchItems", model: "researchItem" },
  { collection: "researchItemLinks", model: "researchItemLink" }, { collection: "objectRevisions", model: "objectRevision" }, { collection: "chapterRevisions", model: "chapterRevision" }
];

export class PrismaPortabilityRepository implements PortabilityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private async owned(actor: SessionActor, projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId }, select: { id: true, structuralVersion: true } });
    if (!project) throw errors.notFound();
    return project;
  }

  async status(actor: SessionActor, projectId: string): Promise<PortabilityStatus> {
    await this.owned(actor, projectId);
    const [snapshots, artifacts, imports] = await Promise.all([
      this.prisma.projectSnapshot.findMany({ where: { projectId }, orderBy: { requestedAt: "desc" }, take: 50 }),
      this.prisma.portabilityArtifact.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 100 }),
      this.prisma.importSession.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 50 })
    ]);
    return {
      snapshots: snapshots.map((item) => ({ id: item.id, status: item.status, structuralVersion: item.structuralVersion, sha256: item.sha256, sizeBytes: item.sizeBytes?.toString() ?? null, requestedAt: item.requestedAt.toISOString(), verifiedAt: item.verifiedAt?.toISOString() ?? null, retentionUntil: item.retentionUntil.toISOString(), lastErrorCode: item.lastErrorCode })),
      artifacts: artifacts.map((item) => ({ id: item.id, purpose: item.purpose, scope: item.scope, format: item.format, status: item.status, sha256: item.sha256, sizeBytes: item.sizeBytes?.toString() ?? null, createdAt: item.createdAt.toISOString(), verifiedAt: item.verifiedAt?.toISOString() ?? null, expiresAt: item.expiresAt?.toISOString() ?? null, lastErrorCode: item.lastErrorCode })),
      imports: imports.map((item) => ({ id: item.id, format: item.format, status: item.status, chapterCount: Array.isArray(item.preview) ? item.preview.length : Number((item.preview as { chapters?: unknown[] }).chapters?.length ?? 0), createdAt: item.createdAt.toISOString(), expiresAt: item.expiresAt.toISOString() }))
    };
  }

  async reserveSnapshot(actor: SessionActor, projectId: string, input: { idempotencyKey: string; structuralVersion: number; retentionUntil: Date }) {
    await this.owned(actor, projectId);
    const existing = await this.prisma.projectSnapshot.findUnique({ where: { projectId_idempotencyKey: { projectId, idempotencyKey: input.idempotencyKey } } });
    if (existing) return { id: existing.id, replayed: true, status: existing.status, attempts: existing.attempts };
    const created = await this.prisma.projectSnapshot.create({ data: { projectId, createdById: actor.userId, idempotencyKey: input.idempotencyKey, structuralVersion: input.structuralVersion, retentionUntil: input.retentionUntil, attempts: 1 } });
    return { id: created.id, replayed: false, status: created.status, attempts: created.attempts };
  }

  async completeSnapshot(actor: SessionActor, projectId: string, snapshotId: string, input: { storageKey: string; manifest: unknown; sha256: string; sizeBytes: number }) {
    const project = await this.owned(actor, projectId);
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.projectSnapshot.updateMany({ where: { id: snapshotId, projectId, status: { in: ["PENDING", "FAILED"] } }, data: { status: "VERIFIED", storageKey: input.storageKey, manifest: json(input.manifest), sha256: input.sha256, sizeBytes: BigInt(input.sizeBytes), completedAt: new Date(), verifiedAt: new Date(), lastErrorCode: null } });
      if (!updated.count) throw errors.conflict("Snapshot state changed before completion.");
      await tx.outboxEvent.create({ data: { workspaceId: actor.workspaceId, aggregateType: "ProjectSnapshot", aggregateId: snapshotId, eventType: "RevisionCheckpointCreated", payload: { projectId, objectType: "PROJECT_SNAPSHOT", objectId: snapshotId, structuralVersion: project.structuralVersion } } });
    });
  }

  async failSnapshot(actor: SessionActor, projectId: string, snapshotId: string, code: string) { await this.owned(actor, projectId); await this.prisma.projectSnapshot.updateMany({ where: { id: snapshotId, projectId, attempts: { lt: 8 } }, data: { status: "FAILED", lastErrorCode: code.slice(0, 80), attempts: { increment: 1 } } }); }

  async reserveArtifact(actor: SessionActor, projectId: string, input: { idempotencyKey: string; purpose: "INTERNAL_BACKUP" | "USER_EXPORT"; scope: "CHAPTER" | "VOLUME" | "MANUSCRIPT" | "FULL_PROJECT"; format: "TEXT" | "MARKDOWN" | "MYTHRA_JSON"; sourceObjectId?: string; snapshotId?: string; expiresAt?: Date }) {
    await this.owned(actor, projectId);
    const existing = await this.prisma.portabilityArtifact.findUnique({ where: { projectId_idempotencyKey: { projectId, idempotencyKey: input.idempotencyKey } } });
    if (existing) return { id: existing.id, replayed: true, status: existing.status, storageKey: existing.storageKey, attempts: existing.attempts };
    const created = await this.prisma.portabilityArtifact.create({ data: { projectId, createdById: actor.userId, idempotencyKey: input.idempotencyKey, purpose: input.purpose, scope: input.scope, format: input.format, sourceObjectId: input.sourceObjectId, snapshotId: input.snapshotId, expiresAt: input.expiresAt, attempts: 1 } });
    return { id: created.id, replayed: false, status: created.status, storageKey: created.storageKey, attempts: created.attempts };
  }

  async completeArtifact(actor: SessionActor, projectId: string, artifactId: string, input: { storageKey: string; manifest: unknown; sha256: string; sizeBytes: number }) { await this.owned(actor, projectId); const result = await this.prisma.portabilityArtifact.updateMany({ where: { id: artifactId, projectId, status: { in: ["PENDING", "PROCESSING", "FAILED"] } }, data: { status: "VERIFIED", storageKey: input.storageKey, manifest: json(input.manifest), sha256: input.sha256, sizeBytes: BigInt(input.sizeBytes), completedAt: new Date(), verifiedAt: new Date(), lastErrorCode: null } }); if (!result.count) throw errors.conflict("Artifact state changed before completion."); }
  async failArtifact(actor: SessionActor, projectId: string, artifactId: string, code: string) { await this.owned(actor, projectId); await this.prisma.portabilityArtifact.updateMany({ where: { id: artifactId, projectId, attempts: { lt: 8 } }, data: { status: "FAILED", lastErrorCode: code.slice(0, 80), attempts: { increment: 1 } } }); }
  async artifact(actor: SessionActor, projectId: string, artifactId: string) { await this.owned(actor, projectId); return this.prisma.portabilityArtifact.findFirst({ where: { id: artifactId, projectId }, select: { id: true, status: true, storageKey: true, sha256: true, sizeBytes: true, expiresAt: true, manifest: true } }); }
  async snapshot(actor: SessionActor, projectId: string, snapshotId: string) { await this.owned(actor, projectId); return this.prisma.projectSnapshot.findFirst({ where: { id: snapshotId, projectId }, select: { id: true, status: true, storageKey: true, manifest: true, sha256: true, sizeBytes: true } }); }

  async createImportPreview(actor: SessionActor, projectId: string, input: { format: "TEXT" | "MARKDOWN" | "DOCX"; storageKey: string; sha256: string; sizeBytes: number; preview: ImportPreview; idempotencyKey: string; expiresAt: Date }) {
    await this.owned(actor, projectId);
    const existing = await this.prisma.importSession.findUnique({ where: { projectId_idempotencyKey: { projectId, idempotencyKey: input.idempotencyKey } } });
    if (existing) return { id: existing.id, replayed: true, preview: existing.preview as unknown as ImportPreview };
    const created = await this.prisma.importSession.create({ data: { projectId, createdById: actor.userId, format: input.format, originalStorageKey: input.storageKey, originalSha256: input.sha256, originalSizeBytes: BigInt(input.sizeBytes), preview: json(input.preview), idempotencyKey: input.idempotencyKey, expiresAt: input.expiresAt } });
    return { id: created.id, replayed: false, preview: input.preview };
  }

  async confirmImport(actor: SessionActor, projectId: string, importId: string) {
    await this.owned(actor, projectId);
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.importSession.findFirst({ where: { id: importId, projectId, status: "PREVIEW_READY", expiresAt: { gt: new Date() } } });
      if (!session) throw errors.conflict("Import preview is unavailable, expired, or already confirmed.");
      const preview = session.preview as unknown as ImportPreview;
      const last = await tx.chapter.aggregate({ where: { projectId }, _max: { sequenceIndex: true } });
      const chapterIds: string[] = [];
      for (let index = 0; index < preview.chapters.length; index += 1) {
        const candidate = preview.chapters[index]!; const bodyDocument = importedChapterDocument(candidate.bodyText); const derived = deriveChapterText(bodyDocument);
        const chapter = await tx.chapter.create({ data: { projectId, sequenceIndex: (last._max.sequenceIndex ?? -1) + index + 1, title: candidate.title, bodyDocument: json(bodyDocument), bodyText: derived.plainText, wordCount: derived.wordCount } });
        chapterIds.push(chapter.id);
      }
      await tx.importSession.update({ where: { id: session.id }, data: { status: "CONFIRMED", confirmedAt: new Date() } });
      await tx.project.update({ where: { id: projectId }, data: { structuralVersion: { increment: 1 }, ...(chapterIds.length ? { activeChapterId: chapterIds[0] } : {}) } });
      return { chapterIds };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async restoreSafeCopy(actor: SessionActor, archive: ProjectArchive, sourceSnapshotId: string) {
    const sourceProjectId = String(archive.project.id); const targetProjectId = safeCopyId(sourceProjectId, sourceSnapshotId);
    const ids = new Map<string, string>();
    for (const name of archiveCollectionNames) for (const row of archive.collections[name]) if (typeof row.id === "string") ids.set(row.id, safeCopyId(sourceProjectId, row.id));
    const mappedCollections = Object.fromEntries(archiveCollectionNames.map((name) => [name, archive.collections[name].map((row) => remapValue(row, ids, sourceProjectId, targetProjectId) as JsonRecord)])) as ProjectArchive["collections"];
    for (const asset of mappedCollections.storedAssets) asset.storageKey = `${actor.workspaceId}/${targetProjectId}/restored/${String(asset.id)}`;
    const existing = await this.prisma.project.findFirst({ where: { id: targetProjectId, workspaceId: actor.workspaceId }, select: { id: true } });
    if (existing) return { projectId: targetProjectId, chapterCount: mappedCollections.chapters.length, restoredCollectionCount: restoreOrder.filter((item) => mappedCollections[item.collection].length > 0).length };
    await this.prisma.$transaction(async (tx) => {
      await tx.project.create({ data: { id: targetProjectId, workspaceId: actor.workspaceId, title: `${String(archive.project.title).slice(0, 220)} (restored copy)`, description: archive.project.description == null ? null : String(archive.project.description), structuralVersion: Number(archive.project.structuralVersion), status: "ACTIVE" } });
      const models = tx as unknown as Record<string, BulkModel>;
      for (const item of restoreOrder) if (mappedCollections[item.collection].length) await models[item.model]!.createMany({ data: mappedCollections[item.collection] });
      const active = typeof archive.project.activeChapterId === "string" ? ids.get(archive.project.activeChapterId) : undefined;
      if (active) await tx.project.update({ where: { id: targetProjectId }, data: { activeChapterId: active } });
    }, { timeout: 60_000 });
    return { projectId: targetProjectId, chapterCount: mappedCollections.chapters.length, restoredCollectionCount: restoreOrder.filter((item) => mappedCollections[item.collection].length > 0).length };
  }

  async checkpointAndRestoreCurrent(actor: SessionActor, projectId: string, archive: ProjectArchive, checkpointSnapshotId: string) {
    await this.owned(actor, projectId);
    if (String(archive.project.id) !== projectId) throw errors.validation("Current-state restore requires an archive of the same project.");
    const chapterRows = archive.collections.chapters;
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.chapter.findMany({ where: { projectId }, orderBy: { id: "asc" } });
      for (const chapter of current) await tx.chapterRevision.create({ data: { chapterId: chapter.id, version: chapter.version, kind: "RESTORE_CHECKPOINT", label: `Restore checkpoint ${checkpointSnapshotId}`, bodyDocument: json(chapter.bodyDocument), bodyText: chapter.bodyText, wordCount: chapter.wordCount } });
      const models = tx as unknown as Record<string, UpsertModel>;
      for (const item of restoreOrder) {
        if (item.collection === "chapterRevisions" || item.collection === "objectRevisions") continue;
        for (const original of archive.collections[item.collection]) {
          const row = asRecord(normalizeJson(original)); const id = String(row.id);
          await models[item.model]!.upsert({ where: { id }, create: row, update: without(row, "id", "createdAt") });
        }
      }
      await tx.project.update({ where: { id: projectId }, data: { structuralVersion: Number(archive.project.structuralVersion), activeChapterId: typeof archive.project.activeChapterId === "string" ? archive.project.activeChapterId : null } });
    }, { timeout: 60_000 });
    return { projectId, chapterCount: chapterRows.length };
  }

  async destructivePreview(actor: SessionActor, projectId: string, objectType: string, objectId: string) {
    await this.owned(actor, projectId);
    const referenceTypes = new Set(["PLOT", "PLOT_OUTLINE", "VOLUME", "VOLUME_OUTLINE", "CHAPTER_OUTLINE", "CHAPTER", "SCENE", "NARRATIVE_INTENT", "MANUSCRIPT_BLOCK", "MILESTONE", "ENTITY", "TIMELINE_EVENT", "NOTE", "CAPTURE"]);
    const causalTypes = new Set(["MILESTONE", "CHAPTER_OUTLINE", "SCENE", "STORY_CHANGE", "ENTITY_STATE", "TIMELINE_EVENT", "NARRATIVE_INTENT", "MANUSCRIPT_BLOCK", "CAPTURE"]);
    const [references, relations] = await Promise.all([
      referenceTypes.has(objectType) ? this.prisma.storyReference.findMany({ where: { projectId, archivedAt: null, OR: [{ sourceType: objectType as never, sourceId: objectId }, { targetType: objectType as never, targetId: objectId }] }, orderBy: { id: "asc" }, take: 101, select: { id: true, sourceType: true, sourceId: true, relationshipKey: true } }) : Promise.resolve([]),
      causalTypes.has(objectType) ? this.prisma.causalRelation.findMany({ where: { projectId, archivedAt: null, OR: [{ sourceType: objectType as never, sourceId: objectId }, { targetType: objectType as never, targetId: objectId }] }, orderBy: [{ importance: "desc" }, { id: "asc" }], take: 301, select: { id: true, sourceType: true, sourceId: true, targetType: true, targetId: true, relationType: true, provenanceType: true } }) : Promise.resolve([])
    ]);
    return { backlinks: references.slice(0, 100), causalImpact: relations.slice(0, 300), truncated: references.length > 100 || relations.length > 300, options: ["MOVE", "REATTACH", "RETIRE"] as const };
  }
}
