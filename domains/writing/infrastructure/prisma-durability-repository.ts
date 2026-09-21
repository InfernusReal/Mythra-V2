import { createHash } from "node:crypto";
import type { PrismaClient } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { AppError, errors } from "@/lib/contracts/errors";
import { deriveChapterText, normalizeChapterDocument, type ChapterDocument } from "../domain/chapter-document";
import type { ConflictResolution, ConflictResolutionResult, DraftConflictReadModel, DraftSaveAcknowledgement, DraftSaveInput, DurabilityRepository } from "../application/durability-ports";

function documentHash(document: ChapterDocument): string {
  return createHash("sha256").update(JSON.stringify(document)).digest("hex");
}

function conflictError(conflictId: string, serverVersion: number): AppError {
  return new AppError("CONFLICT", "The server has a different chapter version. Compare both variants before choosing.", 409, { conflictId, serverVersion });
}

export class PrismaDurabilityRepository implements DurabilityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveDraft(actor: SessionActor, chapterId: string, input: DraftSaveInput): Promise<DraftSaveAcknowledgement> {
    const document = normalizeChapterDocument(input.document);
    const hash = documentHash(document);
    const derived = deriveChapterText(document);

    const outcome = await this.prisma.$transaction(async (tx): Promise<
      { kind: "saved"; acknowledgement: DraftSaveAcknowledgement } |
      { kind: "conflict"; conflictId: string; serverVersion: number }
    > => {
      const projectCoordinate = await tx.chapter.findFirst({ where: { id: chapterId, archivedAt: null, project: { workspaceId: actor.workspaceId, status: "ACTIVE" } }, select: { projectId: true } });
      if (!projectCoordinate) throw errors.notFound();
      const replay = await tx.chapterSaveReceipt.findUnique({ where: { chapterId_clientSaveId: { chapterId, clientSaveId: input.clientSaveId } } });
      if (replay) {
        if (replay.bodyHash.trim() !== hash || replay.baseVersion !== input.baseVersion) throw errors.integrity();
        return { kind: "saved", acknowledgement: { status: "SAVED", chapterId, projectId: projectCoordinate.projectId, version: replay.resultingVersion, clientSaveId: input.clientSaveId, idempotentReplay: true, wordCount: derived.wordCount } };
      }

      const chapter = await tx.chapter.findFirst({
        where: { id: chapterId, archivedAt: null, project: { workspaceId: actor.workspaceId, status: "ACTIVE" } },
        select: { id: true, version: true, bodyDocument: true, projectId: true, project: { select: { structuralVersion: true } } }
      });
      if (!chapter) throw errors.notFound();
      if (input.baseVersion > chapter.version) throw errors.integrity();
      if (input.baseVersion < chapter.version) {
        const conflict = await tx.draftConflict.upsert({
          where: { chapterId_clientSaveId: { chapterId, clientSaveId: input.clientSaveId } },
          create: { chapterId, clientSaveId: input.clientSaveId, baseVersion: input.baseVersion, serverVersion: chapter.version, localDocument: document, serverDocument: normalizeChapterDocument(chapter.bodyDocument) },
          update: {},
          select: { id: true, serverVersion: true }
        });
        return { kind: "conflict", conflictId: conflict.id, serverVersion: conflict.serverVersion };
      }

      const updated = await tx.chapter.updateMany({
        where: { id: chapterId, version: input.baseVersion, project: { workspaceId: actor.workspaceId } },
        data: { bodyDocument: document, bodyText: derived.plainText, wordCount: derived.wordCount, documentSchemaVersion: document.schemaVersion, version: { increment: 1 } }
      });
      if (updated.count !== 1) {
        const concurrent = await tx.chapter.findUniqueOrThrow({ where: { id: chapterId }, select: { version: true, bodyDocument: true } });
        const conflict = await tx.draftConflict.create({ data: { chapterId, clientSaveId: input.clientSaveId, baseVersion: input.baseVersion, serverVersion: concurrent.version, localDocument: document, serverDocument: normalizeChapterDocument(concurrent.bodyDocument) }, select: { id: true, serverVersion: true } });
        return { kind: "conflict", conflictId: conflict.id, serverVersion: conflict.serverVersion };
      }

      const version = input.baseVersion + 1;
      await tx.chapterSaveReceipt.create({ data: { chapterId, clientSaveId: input.clientSaveId, bodyHash: hash, baseVersion: input.baseVersion, resultingVersion: version } });
      await tx.outboxEvent.create({ data: { workspaceId: actor.workspaceId, aggregateType: "Chapter", aggregateId: chapterId, eventType: "ChapterUpdated", payload: { projectId: chapter.projectId, objectType: "CHAPTER", objectId: chapterId, chapterId, version, structuralVersion: chapter.project.structuralVersion } } });
      return { kind: "saved", acknowledgement: { status: "SAVED", chapterId, projectId: projectCoordinate.projectId, version, clientSaveId: input.clientSaveId, idempotentReplay: false, wordCount: derived.wordCount } };
    }, { isolationLevel: "Serializable" });
    if (outcome.kind === "conflict") throw conflictError(outcome.conflictId, outcome.serverVersion);
    return outcome.acknowledgement;
  }

  async checkpoint(actor: SessionActor, chapterId: string, input: DraftSaveInput & { label?: string }) {
    const acknowledgement = await this.saveDraft(actor, chapterId, input);
    const document = normalizeChapterDocument(input.document);
    const derived = deriveChapterText(document);
    const owned = await this.prisma.chapter.findFirst({ where: { id: chapterId, project: { workspaceId: actor.workspaceId } }, select: { id: true, projectId: true, project: { select: { structuralVersion: true } } } });
    if (!owned) throw errors.notFound();
    const { created, revision } = await this.prisma.$transaction(async (tx) => {
      const created = await tx.chapterRevision.createMany({ data: [{ chapterId, version: acknowledgement.version, kind: "CHECKPOINT", label: input.label, clientSaveId: input.clientSaveId, bodyDocument: document, bodyText: derived.plainText, wordCount: derived.wordCount }], skipDuplicates: true });
      const revision = await tx.chapterRevision.findUniqueOrThrow({ where: { clientSaveId: input.clientSaveId } });
      if (created.count) await tx.outboxEvent.create({ data: { workspaceId: actor.workspaceId, aggregateType: "ChapterRevision", aggregateId: revision.id, eventType: "RevisionCheckpointCreated", payload: { projectId: owned.projectId, objectType: "CHAPTER_REVISION", objectId: revision.id, chapterId, version: acknowledgement.version, structuralVersion: owned.project.structuralVersion } } });
      return { created, revision };
    });
    return { revisionId: revision.id, version: acknowledgement.version, idempotentReplay: acknowledgement.idempotentReplay || created.count === 0 };
  }

  async getConflict(actor: SessionActor, conflictId: string): Promise<DraftConflictReadModel | null> {
    const conflict = await this.prisma.draftConflict.findFirst({ where: { id: conflictId, chapter: { project: { workspaceId: actor.workspaceId } } } });
    return conflict ? { id: conflict.id, chapterId: conflict.chapterId, baseVersion: conflict.baseVersion, serverVersion: conflict.serverVersion, localDocument: normalizeChapterDocument(conflict.localDocument), serverDocument: normalizeChapterDocument(conflict.serverDocument), status: conflict.status } : null;
  }

  async resolveConflict(actor: SessionActor, conflictId: string, resolution: ConflictResolution): Promise<ConflictResolutionResult> {
    return this.prisma.$transaction(async (tx) => {
      const conflict = await tx.draftConflict.findFirst({
        where: { id: conflictId, chapter: { project: { workspaceId: actor.workspaceId } } },
        include: { chapter: { include: { project: { select: { workspaceId: true } } } } }
      });
      if (!conflict) throw errors.notFound();
      if (conflict.status === "RESOLVED") {
        if (conflict.resolution !== resolution) throw errors.integrity();
        const resultChapter = conflict.recoveryChapterId
          ? await tx.chapter.findUniqueOrThrow({ where: { id: conflict.recoveryChapterId } })
          : conflict.chapter;
        return { status: "RESOLVED", resolution, chapterId: conflict.chapterId, version: conflict.resolvedVersion ?? resultChapter.version, recoveryChapterId: conflict.recoveryChapterId ?? undefined, document: normalizeChapterDocument(resultChapter.bodyDocument) };
      }

      if (resolution === "KEEP_SERVER") {
        await tx.draftConflict.update({ where: { id: conflict.id }, data: { status: "RESOLVED", resolution, resolvedAt: new Date(), resolvedVersion: conflict.chapter.version } });
        return { status: "RESOLVED", resolution, chapterId: conflict.chapterId, version: conflict.chapter.version, document: normalizeChapterDocument(conflict.chapter.bodyDocument) };
      }

      if (resolution === "KEEP_LOCAL") {
        if (conflict.chapter.version !== conflict.serverVersion) throw conflictError(conflict.id, conflict.chapter.version);
        const serverDocument = normalizeChapterDocument(conflict.serverDocument);
        const serverDerived = deriveChapterText(serverDocument);
        await tx.chapterRevision.create({ data: { chapterId: conflict.chapterId, version: conflict.serverVersion, kind: "CONFLICT_SERVER", bodyDocument: serverDocument, bodyText: serverDerived.plainText, wordCount: serverDerived.wordCount } });
        const localDocument = normalizeChapterDocument(conflict.localDocument);
        const localDerived = deriveChapterText(localDocument);
        const nextVersion = conflict.serverVersion + 1;
        await tx.chapter.update({ where: { id: conflict.chapterId }, data: { bodyDocument: localDocument, bodyText: localDerived.plainText, wordCount: localDerived.wordCount, version: nextVersion } });
        await tx.outboxEvent.create({ data: { workspaceId: actor.workspaceId, aggregateType: "Chapter", aggregateId: conflict.chapterId, eventType: "ChapterUpdated", payload: { projectId: conflict.chapter.projectId, objectType: "CHAPTER", objectId: conflict.chapterId, chapterId: conflict.chapterId, version: nextVersion } } });
        await tx.draftConflict.update({ where: { id: conflict.id }, data: { status: "RESOLVED", resolution, resolvedAt: new Date(), resolvedVersion: nextVersion } });
        return { status: "RESOLVED", resolution, chapterId: conflict.chapterId, version: nextVersion, document: localDocument };
      }

      const localDocument = normalizeChapterDocument(conflict.localDocument);
      const localDerived = deriveChapterText(localDocument);
      const aggregate = await tx.chapter.aggregate({ where: { projectId: conflict.chapter.projectId }, _max: { sequenceIndex: true } });
      const recovery = await tx.chapter.create({ data: { projectId: conflict.chapter.projectId, sequenceIndex: (aggregate._max.sequenceIndex ?? -1) + 1, title: `${conflict.chapter.title} (Recovery copy)`, bodyDocument: localDocument, bodyText: localDerived.plainText, wordCount: localDerived.wordCount } });
      await tx.outboxEvent.create({ data: { workspaceId: actor.workspaceId, aggregateType: "Chapter", aggregateId: recovery.id, eventType: "ChapterUpdated", payload: { projectId: conflict.chapter.projectId, objectType: "CHAPTER", objectId: recovery.id, chapterId: recovery.id, version: recovery.version } } });
      await tx.draftConflict.update({ where: { id: conflict.id }, data: { status: "RESOLVED", resolution, resolvedAt: new Date(), resolvedVersion: conflict.chapter.version, recoveryChapterId: recovery.id } });
      return { status: "RESOLVED", resolution, chapterId: conflict.chapterId, version: conflict.chapter.version, recoveryChapterId: recovery.id, document: normalizeChapterDocument(conflict.chapter.bodyDocument) };
    }, { isolationLevel: "Serializable" });
  }
}
