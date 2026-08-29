import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { errors } from "@/lib/contracts/errors";
import type { TimelineRepository } from "../application/ports";
import type { TimelineEventReadModel, TimelineLinkTargetType, TimelineMode } from "../domain/types";

type Tx = Prisma.TransactionClient;
const eventSelect = { id: true, title: true, description: true, mode: true, displayLabel: true, calendarKey: true, sortStart: true, sortEnd: true, relativeToEventId: true, relativeOffset: true, ordinalValue: true, version: true, updatedAt: true, links: { where: { archivedAt: null }, orderBy: { createdAt: "asc" as const }, take: 100, select: { id: true, targetType: true, targetId: true, label: true } } } as const;
const number = (value: Prisma.Decimal | null) => value === null ? null : Number(value);
const view = (row: { id: string; title: string; description: string | null; mode: string; displayLabel: string; calendarKey: string | null; sortStart: Prisma.Decimal | null; sortEnd: Prisma.Decimal | null; relativeToEventId: string | null; relativeOffset: Prisma.Decimal | null; ordinalValue: Prisma.Decimal | null; version: number; updatedAt: Date; links: Array<{ id: string; targetType: string; targetId: string; label: string | null }> }): TimelineEventReadModel => ({ ...row, mode: row.mode as TimelineMode, sortStart: number(row.sortStart), sortEnd: number(row.sortEnd), relativeOffset: number(row.relativeOffset), ordinalValue: number(row.ordinalValue), updatedAt: row.updatedAt.toISOString(), links: row.links.map((link) => ({ ...link, targetType: link.targetType as TimelineLinkTargetType })) });

async function project(tx: Tx, actor: SessionActor, projectId: string) { const row = await tx.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE" }, select: { structuralVersion: true } }); if (!row) throw errors.notFound(); return row; }
async function targetExists(tx: Tx, projectId: string, type: string, id: string): Promise<boolean> {
  if (type === "ENTITY") return Boolean(await tx.storyEntity.findFirst({ where: { id, projectId, archivedAt: null, status: "ACTIVE" }, select: { id: true } }));
  if (type === "MILESTONE") return Boolean(await tx.milestone.findFirst({ where: { id, projectId, archivedAt: null }, select: { id: true } }));
  if (type === "CHAPTER") return Boolean(await tx.chapter.findFirst({ where: { id, projectId, archivedAt: null }, select: { id: true } }));
  return Boolean(await tx.timelineEvent.findFirst({ where: { id, projectId, archivedAt: null }, select: { id: true } }));
}

async function assertRelativeAcyclic(tx: Tx, projectId: string, eventId: string, anchorId: string): Promise<void> {
  const visited = new Set<string>([eventId]); let current: string | null = anchorId;
  for (let depth = 0; current && depth < 128; depth += 1) {
    if (visited.has(current)) throw errors.validation("Relative timeline anchors cannot form a cycle.");
    visited.add(current);
    const row: { relativeToEventId: string | null } | null = await tx.timelineEvent.findFirst({ where: { id: current, projectId, archivedAt: null }, select: { relativeToEventId: true } });
    if (!row) throw errors.notFound(); current = row.relativeToEventId;
  }
  if (current) throw errors.validation("Relative timeline anchor depth exceeds the supported budget.");
}

export class PrismaTimelineRepository implements TimelineRepository {
  constructor(private readonly prisma: PrismaClient) {}
  async list(actor: SessionActor, projectId: string, query: { mode?: string; cursor?: string; limit: number }) {
    return this.prisma.$transaction(async (tx) => { const owned = await project(tx, actor, projectId); const rows = await tx.timelineEvent.findMany({ where: { projectId, archivedAt: null, ...(query.mode ? { mode: query.mode as TimelineMode } : {}), ...(query.cursor ? { updatedAt: { lt: new Date(query.cursor) } } : {}) }, orderBy: [{ sortStart: "asc" }, { ordinalValue: "asc" }, { updatedAt: "desc" }, { id: "asc" }], take: query.limit + 1, select: eventSelect }); const page = rows.slice(0, query.limit); return { events: page.map(view), nextCursor: rows.length > query.limit ? page.at(-1)!.updatedAt.toISOString() : null, projectStructuralVersion: owned.structuralVersion }; });
  }
  async write(actor: SessionActor, projectId: string, input: Record<string, unknown>) {
    const typed = input as { eventId?: string; expectedVersion?: number; title: string; description?: string; mode: TimelineMode; displayLabel: string; calendarKey?: string; sortStart?: number; sortEnd?: number; relativeToEventId?: string; relativeOffset?: number; ordinalValue?: number };
    return this.prisma.$transaction(async (tx) => { const owned = await project(tx, actor, projectId); const id = typed.eventId ?? randomUUID(); if (typed.relativeToEventId) await assertRelativeAcyclic(tx, projectId, id, typed.relativeToEventId);
      const data = { title: typed.title, description: typed.description ?? null, mode: typed.mode, displayLabel: typed.displayLabel, calendarKey: typed.calendarKey ?? null, sortStart: typed.sortStart === undefined ? null : new Prisma.Decimal(typed.sortStart), sortEnd: typed.sortEnd === undefined ? null : new Prisma.Decimal(typed.sortEnd), relativeToEventId: typed.relativeToEventId ?? null, relativeOffset: typed.relativeOffset === undefined ? null : new Prisma.Decimal(typed.relativeOffset), ordinalValue: typed.ordinalValue === undefined ? null : new Prisma.Decimal(typed.ordinalValue) };
      let row;
      if (typed.eventId) { if (!typed.expectedVersion) throw errors.validation("Timeline updates require expectedVersion."); const existing = await tx.timelineEvent.findFirst({ where: { id, projectId, version: typed.expectedVersion, archivedAt: null }, select: { id: true } }); if (!existing) throw errors.conflict(); row = await tx.timelineEvent.update({ where: { id }, data: { ...data, version: { increment: 1 } }, select: eventSelect }); }
      else row = await tx.timelineEvent.create({ data: { id, projectId, ...data }, select: eventSelect });
      const bumped = await tx.project.updateMany({ where: { id: projectId, workspaceId: actor.workspaceId, structuralVersion: owned.structuralVersion }, data: { structuralVersion: { increment: 1 } } }); if (bumped.count !== 1) throw errors.conflict(); const structuralVersion = owned.structuralVersion + 1;
      const invalidationKeys = [`timeline:${id}`, `causal-chronology:${projectId}`, `directive:${projectId}`];
      await tx.outboxEvent.create({ data: { workspaceId: actor.workspaceId, aggregateType: "TimelineEvent", aggregateId: id, eventType: "timeline.event_updated", payload: { projectId, eventId: id, version: row.version, structuralVersion, invalidationKeys } } });
      return { event: view(row), projectStructuralVersion: structuralVersion, invalidationKeys };
    }, { timeout: 20_000 });
  }
  async link(actor: SessionActor, projectId: string, input: { eventId: string; targetType: string; targetId: string; label?: string }) {
    return this.prisma.$transaction(async (tx) => { await project(tx, actor, projectId); if (!await tx.timelineEvent.findFirst({ where: { id: input.eventId, projectId, archivedAt: null }, select: { id: true } }) || !await targetExists(tx, projectId, input.targetType, input.targetId)) throw errors.notFound(); const where = { eventId_targetType_targetId: { eventId: input.eventId, targetType: input.targetType as TimelineLinkTargetType, targetId: input.targetId } }; const existing = await tx.timelineEventLink.findUnique({ where, select: { id: true } }); const row = existing ?? await tx.timelineEventLink.create({ data: { projectId, eventId: input.eventId, targetType: input.targetType as TimelineLinkTargetType, targetId: input.targetId, label: input.label ?? null }, select: { id: true } }); return { linkId: row.id, replayed: Boolean(existing) }; });
  }
}
