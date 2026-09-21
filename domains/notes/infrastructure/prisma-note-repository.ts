import { descendingCursorWhere, encodeListCursor } from "@/lib/contracts/list-cursor";
import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { errors } from "@/lib/contracts/errors";
import type { NoteRepository } from "../application/ports";
import { normalizeNoteTags, type NoteReadModel } from "../domain/types";

type Tx = Prisma.TransactionClient;
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const tags = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 32) : [];
const noteSelect = { id: true, title: true, body: true, normalizedTags: true, sourceCaptureId: true, version: true, updatedAt: true } as const;
async function project(tx: Tx, actor: SessionActor, projectId: string, expected?: number) { const row = await tx.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE", ...(expected === undefined ? {} : { structuralVersion: expected }) }, select: { structuralVersion: true } }); if (row) return row; if (expected !== undefined && await tx.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE" }, select: { id: true } })) throw errors.conflict(); throw errors.notFound(); }
const view = (row: { id: string; title: string; body: string; normalizedTags: unknown; sourceCaptureId: string | null; version: number; updatedAt: Date }, backlinkCount = 0): NoteReadModel => ({ id: row.id, title: row.title, body: row.body, tags: tags(row.normalizedTags), sourceCaptureId: row.sourceCaptureId, version: row.version, updatedAt: row.updatedAt.toISOString(), backlinkCount });

export class PrismaNoteRepository implements NoteRepository {
  constructor(private readonly prisma: PrismaClient) {}
  async list(actor: SessionActor, projectId: string, query: { tag?: string; cursor?: string; limit: number }) { return this.prisma.$transaction(async (tx) => { const owned = await project(tx, actor, projectId); const normalizedTag = query.tag ? normalizeNoteTags([query.tag])[0] : undefined; const rows = await tx.note.findMany({ where: { projectId, archivedAt: null, ...descendingCursorWhere("updatedAt", query.cursor), ...(normalizedTag ? { normalizedTags: { array_contains: normalizedTag } } : {}) }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], take: query.limit + 1, select: noteSelect }); const page = rows.slice(0, query.limit); const counts = page.length ? await tx.storyReference.groupBy({ by: ["targetId"], where: { projectId, targetType: "NOTE", targetId: { in: page.map((row) => row.id) }, archivedAt: null }, _count: true }) : []; const countMap = new Map(counts.map((row) => [row.targetId, row._count])); return { notes: page.map((row) => view(row, countMap.get(row.id) ?? 0)), nextCursor: rows.length > query.limit ? encodeListCursor(page.at(-1)!, page.at(-1)!.updatedAt) : null, projectStructuralVersion: owned.structuralVersion }; }); }
  async write(actor: SessionActor, projectId: string, input: Record<string, unknown>) {
    const typed = input as { noteId?: string; expectedVersion?: number; title: string; body: string; tags: string[]; sourceCaptureId?: string; toolIdempotencyKey?: string };
    try {
      return await this.prisma.$transaction(async (tx) => {
        const owned = await project(tx, actor, projectId);
        if (typed.sourceCaptureId && !await tx.capture.findFirst({ where: { id: typed.sourceCaptureId, projectId, userId: actor.userId }, select: { id: true } })) throw errors.notFound();
        if (!typed.noteId && typed.toolIdempotencyKey) {
          const replay = await tx.note.findUnique({ where: { projectId_createdById_toolIdempotencyKey: { projectId, createdById: actor.userId, toolIdempotencyKey: typed.toolIdempotencyKey } }, select: noteSelect });
          if (replay) return { note: view(replay), projectStructuralVersion: owned.structuralVersion, replayed: true };
        }
        const data = { title: typed.title, body: typed.body, normalizedTags: json(normalizeNoteTags(typed.tags)), sourceCaptureId: typed.sourceCaptureId ?? null };
        let row;
        if (typed.noteId) {
          if (!typed.expectedVersion) throw errors.validation("Note updates require expectedVersion.");
          const updated = await tx.note.updateMany({ where: { id: typed.noteId, projectId, version: typed.expectedVersion, archivedAt: null }, data: { ...data, version: { increment: 1 } } });
          if (updated.count !== 1) throw errors.conflict();
          row = await tx.note.findUnique({ where: { id: typed.noteId }, select: noteSelect });
        } else {
          row = await tx.note.create({ data: { projectId, createdById: actor.userId, toolIdempotencyKey: typed.toolIdempotencyKey, ...data }, select: noteSelect });
        }
        if (!row) throw errors.notFound();
        await tx.outboxEvent.create({ data: { workspaceId: actor.workspaceId, aggregateType: "Note", aggregateId: row.id, eventType: "note.updated", payload: { projectId, noteId: row.id, version: row.version } } });
        return { note: view(row), projectStructuralVersion: owned.structuralVersion, replayed: false };
      });
    } catch (caught) {
      if (!typed.noteId && typed.toolIdempotencyKey && caught instanceof Prisma.PrismaClientKnownRequestError && caught.code === "P2002") {
        const concurrentWinner = await this.prisma.note.findFirst({
          where: { projectId, createdById: actor.userId, toolIdempotencyKey: typed.toolIdempotencyKey, archivedAt: null, project: { workspaceId: actor.workspaceId, status: "ACTIVE" } },
          select: { ...noteSelect, project: { select: { structuralVersion: true } } },
        });
        if (concurrentWinner) return { note: view(concurrentWinner), projectStructuralVersion: concurrentWinner.project.structuralVersion, replayed: true };
      }
      throw caught;
    }
  }
  async promote(actor: SessionActor, projectId: string, input: { noteId: string; targetType: string; idempotencyKey: string; expectedStructuralVersion: number; title?: string }) { return this.prisma.$transaction(async (tx) => { const note = await tx.note.findFirst({ where: { id: input.noteId, projectId, archivedAt: null, project: { workspaceId: actor.workspaceId, status: "ACTIVE" } }, select: { id: true, title: true, body: true } }); if (!note) throw errors.notFound(); const replay = await tx.notePromotion.findUnique({ where: { noteId_targetType_idempotencyKey: { noteId: input.noteId, targetType: input.targetType, idempotencyKey: input.idempotencyKey } }, select: { id: true, targetType: true, targetId: true, projectStructuralVersion: true } }); if (replay) return { promotionId: replay.id, targetType: replay.targetType, targetId: replay.targetId, projectStructuralVersion: replay.projectStructuralVersion, replayed: true }; await project(tx, actor, projectId, input.expectedStructuralVersion); const targetId = randomUUID(); const title = input.title ?? note.title;
      if (input.targetType === "MILESTONE") { const last = await tx.milestone.aggregate({ where: { projectId }, _max: { sequenceIndex: true } }); await tx.milestone.create({ data: { id: targetId, projectId, sequenceIndex: (last._max.sequenceIndex ?? -1) + 1, title, description: note.body, status: "PLANNED" } }); }
      else if (input.targetType === "STORY_CHANGE") await tx.storyChange.create({ data: { id: targetId, projectId, kind: "CUSTOM", title, description: note.body } });
      else { const last = await tx.chapterOutline.aggregate({ where: { projectId }, _max: { sequenceIndex: true } }); await tx.chapterOutline.create({ data: { id: targetId, projectId, sequenceIndex: (last._max.sequenceIndex ?? -1) + 1, title, document: json({ type: "doc", content: [] }), plainText: note.body, provenanceType: "NOTE", provenanceSourceId: note.id } }); }
      if (input.targetType !== "STORY_CHANGE") await tx.storyReference.create({ data: { projectId, sourceType: "NOTE", sourceId: note.id, targetType: input.targetType as "MILESTONE" | "CHAPTER_OUTLINE", targetId, relationshipKey: "promoted_to", provenanceType: "NOTE", provenanceNote: `target:${input.targetType}:${targetId}` } });
      const bumped = await tx.project.updateMany({ where: { id: projectId, workspaceId: actor.workspaceId, structuralVersion: input.expectedStructuralVersion }, data: { structuralVersion: { increment: 1 } } }); if (bumped.count !== 1) throw errors.conflict(); const structuralVersion = input.expectedStructuralVersion + 1; const promotion = await tx.notePromotion.create({ data: { projectId, noteId: note.id, targetType: input.targetType, targetId, idempotencyKey: input.idempotencyKey, projectStructuralVersion: structuralVersion }, select: { id: true } }); await tx.outboxEvent.create({ data: { workspaceId: actor.workspaceId, aggregateType: "Note", aggregateId: note.id, eventType: "note.promoted", payload: { projectId, noteId: note.id, targetType: input.targetType, targetId, structuralVersion } } }); return { promotionId: promotion.id, targetType: input.targetType, targetId, projectStructuralVersion: structuralVersion, replayed: false }; }); }
}
