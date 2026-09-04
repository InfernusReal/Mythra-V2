import { Prisma, type PrismaClient } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { errors } from "@/lib/contracts/errors";
import type { AgentToolReadModel } from "../application/ports";
import type { BacklinksInput, ChapterOutlineInput, ChapterTextInput, MilestoneInput, TimelineWindowInput, VolumeOutlineInput } from "../domain/contracts";

async function assertProject(prisma: PrismaClient, actor: SessionActor, projectId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE", workspace: { archivedAt: null, members: { some: { userId: actor.userId, status: "ACTIVE" } } } }, select: { id: true, structuralVersion: true } });
  if (!project) throw errors.notFound();
  return project;
}

const textSlice = (value: string, length: number) => ({ text: value.slice(0, length), returnedLength: Math.min(value.length, length), truncated: value.length > length });
const decimal = (value: Prisma.Decimal | null): number | null => value === null ? null : Number(value);

export class PrismaAgentToolReadModel implements AgentToolReadModel {
  constructor(private readonly prisma: PrismaClient) {}

  async authorize(actor: SessionActor, projectId: string): Promise<void> {
    await assertProject(this.prisma, actor, projectId);
  }

  async getProjectMap(actor: SessionActor, projectId: string, perCollectionLimit: number) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE", workspace: { archivedAt: null, members: { some: { userId: actor.userId, status: "ACTIVE" } } } }, select: { id: true, title: true, structuralVersion: true, activeChapterId: true, plot: { where: { archivedAt: null }, select: { id: true, title: true, version: true, outline: { where: { archivedAt: null }, select: { id: true, version: true } } } }, volumes: { where: { archivedAt: null }, orderBy: [{ sequenceIndex: "asc" }, { id: "asc" }], take: perCollectionLimit + 1, select: { id: true, title: true, sequenceIndex: true, version: true, outline: { where: { archivedAt: null }, select: { id: true, version: true } }, _count: { select: { chapters: { where: { archivedAt: null } }, chapterOutlines: { where: { archivedAt: null } } } } } }, milestones: { where: { archivedAt: null }, orderBy: [{ sequenceIndex: "asc" }, { id: "asc" }], take: perCollectionLimit + 1, select: { id: true, title: true, sequenceIndex: true, status: true, version: true } }, chapterOutlines: { where: { archivedAt: null }, orderBy: [{ sequenceIndex: "asc" }, { id: "asc" }], take: perCollectionLimit + 1, select: { id: true, chapterId: true, volumeId: true, title: true, sequenceIndex: true, version: true } }, chapters: { where: { archivedAt: null }, orderBy: [{ sequenceIndex: "asc" }, { id: "asc" }], take: perCollectionLimit + 1, select: { id: true, volumeId: true, title: true, sequenceIndex: true, status: true, version: true } }, scenes: { where: { archivedAt: null }, orderBy: [{ sequenceIndex: "asc" }, { id: "asc" }], take: perCollectionLimit + 1, select: { id: true, chapterId: true, chapterOutlineId: true, title: true, sequenceIndex: true, version: true } } } });
    if (!project) throw errors.notFound();
    const bounded = <T>(rows: T[]) => ({ items: rows.slice(0, perCollectionLimit), returned: Math.min(rows.length, perCollectionLimit), truncated: rows.length > perCollectionLimit });
    return { id: project.id, title: project.title, structuralVersion: project.structuralVersion, activeChapterId: project.activeChapterId, plot: project.plot, volumes: bounded(project.volumes), milestones: bounded(project.milestones), chapterOutlines: bounded(project.chapterOutlines), chapters: bounded(project.chapters), scenes: bounded(project.scenes), perCollectionLimit };
  }

  async getPlot(actor: SessionActor, projectId: string) {
    const project = await assertProject(this.prisma, actor, projectId);
    const plot = await this.prisma.plot.findFirst({ where: { projectId, archivedAt: null }, select: { id: true, title: true, summary: true, version: true, outline: { where: { archivedAt: null }, select: { id: true, purpose: true, version: true } } } });
    if (!plot) throw errors.notFound();
    const range = plot.outline ? (await this.prisma.$queryRaw<Array<{ totalLength: number; textWindow: string }>>(Prisma.sql`SELECT char_length("plainText")::integer AS "totalLength", substring("plainText" FROM 1 FOR 8001) AS "textWindow" FROM "PlotOutline" WHERE "id" = ${plot.outline.id}::uuid AND "archivedAt" IS NULL LIMIT 1`))[0] : undefined;
    const outline = plot.outline && range ? { id: plot.outline.id, purpose: plot.outline.purpose, version: plot.outline.version, ...textSlice(range.textWindow, 8_000), totalLength: range.totalLength } : null;
    return { projectStructuralVersion: project.structuralVersion, plot: { id: plot.id, title: plot.title, summary: plot.summary, version: plot.version, outline } };
  }

  async getVolumeOutline(actor: SessionActor, projectId: string, input: VolumeOutlineInput) {
    const project = await assertProject(this.prisma, actor, projectId);
    const volume = await this.prisma.volume.findFirst({ where: { id: input.volumeId, projectId, archivedAt: null }, select: { id: true, title: true, summary: true, sequenceIndex: true, version: true, outline: { where: { archivedAt: null }, select: { id: true, purpose: true, version: true } } } });
    if (!volume?.outline) throw errors.notFound();
    const range = (await this.prisma.$queryRaw<Array<{ totalLength: number; textWindow: string }>>(Prisma.sql`SELECT char_length("plainText")::integer AS "totalLength", substring("plainText" FROM ${input.start + 1}::integer FOR ${input.length + 1}::integer) AS "textWindow" FROM "VolumeOutline" WHERE "id" = ${volume.outline.id}::uuid AND "archivedAt" IS NULL LIMIT 1`))[0];
    if (!range) throw errors.notFound();
    return { projectStructuralVersion: project.structuralVersion, volume: { id: volume.id, title: volume.title, summary: volume.summary, sequenceIndex: volume.sequenceIndex, version: volume.version }, outline: { id: volume.outline.id, purpose: volume.outline.purpose, version: volume.outline.version, range: { start: input.start, ...textSlice(range.textWindow, input.length), totalLength: range.totalLength } } };
  }

  async getMilestone(actor: SessionActor, projectId: string, input: MilestoneInput) {
    const project = await assertProject(this.prisma, actor, projectId);
    const milestone = await this.prisma.milestone.findFirst({ where: { id: input.milestoneId, projectId, archivedAt: null }, select: { id: true, title: true, description: true, threadLabel: true, sequenceIndex: true, targetChapterStart: true, targetChapterEnd: true, targetWords: true, targetDate: true, status: true, version: true, chapterLinks: { where: { archivedAt: null }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: input.edgeLimit + 1, select: { id: true, chapterId: true, role: true, customRole: true, weight: true, version: true } }, incomingDependencies: { where: { archivedAt: null }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: input.edgeLimit + 1, select: { id: true, sourceMilestoneId: true, state: true, isHard: true, version: true } }, outgoingDependencies: { where: { archivedAt: null }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: input.edgeLimit + 1, select: { id: true, targetMilestoneId: true, state: true, isHard: true, version: true } } } });
    if (!milestone) throw errors.notFound();
    const bounded = <T>(rows: T[]) => ({ items: rows.slice(0, input.edgeLimit), returned: Math.min(rows.length, input.edgeLimit), truncated: rows.length > input.edgeLimit });
    return { projectStructuralVersion: project.structuralVersion, milestone: { ...milestone, targetDate: milestone.targetDate?.toISOString().slice(0, 10) ?? null, chapterLinks: bounded(milestone.chapterLinks), incomingDependencies: bounded(milestone.incomingDependencies), outgoingDependencies: bounded(milestone.outgoingDependencies) } };
  }

  async getChapterOutline(actor: SessionActor, projectId: string, input: ChapterOutlineInput) {
    const project = await assertProject(this.prisma, actor, projectId);
    const outline = await this.prisma.chapterOutline.findFirst({ where: { projectId, archivedAt: null, ...(input.outlineId ? { id: input.outlineId } : { chapterId: input.chapterId }) }, select: { id: true, chapterId: true, volumeId: true, sequenceIndex: true, title: true, purpose: true, emotionalMovement: true, revealedInformation: true, entityReferenceKeys: true, locationReferenceKeys: true, milestoneReferenceKeys: true, targetWords: true, isPlaceholder: true, version: true, scenes: { where: { archivedAt: null }, orderBy: [{ sequenceIndex: "asc" }, { id: "asc" }], take: input.sceneLimit + 1, select: { id: true, chapterId: true, sequenceIndex: true, title: true, purpose: true, version: true } } } });
    if (!outline) throw errors.notFound();
    const range = (await this.prisma.$queryRaw<Array<{ totalLength: number; textWindow: string }>>(Prisma.sql`SELECT char_length("plainText")::integer AS "totalLength", substring("plainText" FROM ${input.start + 1}::integer FOR ${input.length + 1}::integer) AS "textWindow" FROM "ChapterOutline" WHERE "id" = ${outline.id}::uuid AND "archivedAt" IS NULL LIMIT 1`))[0];
    if (!range) throw errors.notFound();
    const scenes = outline.scenes.slice(0, input.sceneLimit);
    return { projectStructuralVersion: project.structuralVersion, outline: { ...outline, textRange: { start: input.start, ...textSlice(range.textWindow, input.length), totalLength: range.totalLength }, scenes: { items: scenes, returned: scenes.length, truncated: outline.scenes.length > input.sceneLimit } } };
  }

  async getChapterText(actor: SessionActor, projectId: string, input: ChapterTextInput) {
    const rows = await this.prisma.$queryRaw<Array<{ id: string; title: string; version: number; documentSchemaVersion: number; structuralVersion: number; totalLength: number; textWindow: string }>>(Prisma.sql`
      SELECT chapter."id", chapter."title", chapter."version", chapter."documentSchemaVersion", project."structuralVersion",
             char_length(chapter."bodyText")::integer AS "totalLength",
             substring(chapter."bodyText" FROM ${input.start + 1}::integer FOR ${input.length + 1}::integer) AS "textWindow"
      FROM "Chapter" chapter
      JOIN "Project" project ON project."id" = chapter."projectId"
      JOIN "Workspace" workspace ON workspace."id" = project."workspaceId"
      JOIN "WorkspaceMember" member ON member."workspaceId" = workspace."id" AND member."userId" = ${actor.userId}::uuid AND member."status" = 'ACTIVE'
      WHERE chapter."id" = ${input.chapterId}::uuid AND chapter."projectId" = ${projectId}::uuid AND chapter."archivedAt" IS NULL
        AND project."workspaceId" = ${actor.workspaceId}::uuid AND project."status" = 'ACTIVE' AND workspace."archivedAt" IS NULL
      LIMIT 1
    `);
    const row = rows[0];
    if (!row) throw errors.notFound();
    return { projectStructuralVersion: row.structuralVersion, chapter: { id: row.id, title: row.title, version: row.version, documentSchemaVersion: row.documentSchemaVersion }, range: { start: input.start, ...textSlice(row.textWindow, input.length), totalLength: row.totalLength } };
  }

  async getTimelineWindow(actor: SessionActor, projectId: string, input: TimelineWindowInput) {
    const project = await assertProject(this.prisma, actor, projectId);
    const modeFilter = input.mode ? Prisma.sql`AND event."mode" = ${input.mode}::"TimelineMode"` : Prisma.empty;
    const anchorFilter = input.anchorEventId ? Prisma.sql`, anchor WHERE ordered.position BETWEEN anchor.position - ${input.before} AND anchor.position + ${input.after}` : Prisma.sql`WHERE position <= ${input.before + input.after}`;
    const anchorCte = input.anchorEventId ? Prisma.sql`, anchor AS (SELECT position FROM ordered WHERE "id" = ${input.anchorEventId}::uuid)` : Prisma.empty;
    const rows = await this.prisma.$queryRaw<Array<{ id: string; title: string; description: string | null; mode: string; displayLabel: string; calendarKey: string | null; sortStart: Prisma.Decimal | null; sortEnd: Prisma.Decimal | null; relativeToEventId: string | null; relativeOffset: Prisma.Decimal | null; ordinalValue: Prisma.Decimal | null; version: number; updatedAt: Date; position: bigint }>>(Prisma.sql`
      WITH ordered AS (
        SELECT event."id", event."title", event."description", event."mode", event."displayLabel", event."calendarKey", event."sortStart", event."sortEnd", event."relativeToEventId", event."relativeOffset", event."ordinalValue", event."version", event."updatedAt",
               row_number() OVER (ORDER BY event."sortStart" ASC NULLS LAST, event."ordinalValue" ASC NULLS LAST, event."updatedAt" DESC, event."id" ASC) AS position
        FROM "TimelineEvent" event
        WHERE event."projectId" = ${projectId}::uuid AND event."archivedAt" IS NULL ${modeFilter}
      ) ${anchorCte}
      SELECT ordered.* FROM ordered ${anchorFilter} ORDER BY position ASC LIMIT 101
    `);
    if (input.anchorEventId && !rows.some((row) => row.id === input.anchorEventId)) throw errors.notFound();
    const eventIds = rows.map((row) => row.id);
    const links = eventIds.length ? await this.prisma.timelineEventLink.findMany({ where: { projectId, eventId: { in: eventIds }, archivedAt: null }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: 501, select: { id: true, eventId: true, targetType: true, targetId: true, label: true } }) : [];
    const byEvent = new Map<string, typeof links>();
    for (const link of links) byEvent.set(link.eventId, [...(byEvent.get(link.eventId) ?? []), link]);
    return { projectStructuralVersion: project.structuralVersion, events: rows.map((row) => ({ id: row.id, title: row.title, description: row.description, mode: row.mode, displayLabel: row.displayLabel, calendarKey: row.calendarKey, sortStart: decimal(row.sortStart), sortEnd: decimal(row.sortEnd), relativeToEventId: row.relativeToEventId, relativeOffset: decimal(row.relativeOffset), ordinalValue: decimal(row.ordinalValue), version: row.version, updatedAt: row.updatedAt.toISOString(), links: (byEvent.get(row.id) ?? []).slice(0, 20).map((link) => ({ id: link.id, targetType: link.targetType, targetId: link.targetId, label: link.label })), linksTruncated: (byEvent.get(row.id)?.length ?? 0) > 20 })), page: { returned: rows.length, before: input.before, after: input.after, anchorEventId: input.anchorEventId ?? null, linkBudget: 500, linksTruncated: links.length > 500 } };
  }

  async getBacklinks(actor: SessionActor, projectId: string, input: BacklinksInput) {
    const project = await assertProject(this.prisma, actor, projectId);
    const rows = await this.prisma.storyReference.findMany({ where: { projectId, archivedAt: null, targetType: input.targetType, targetId: input.targetId, targetBlockId: input.targetBlockId ?? null, ...(input.cursor ? { createdAt: { lt: new Date(input.cursor) } } : {}) }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: input.limit + 1, select: { id: true, sourceType: true, sourceId: true, sourceBlockId: true, targetType: true, targetId: true, targetBlockId: true, relationshipKey: true, provenanceType: true, version: true, createdAt: true } });
    const page = rows.slice(0, input.limit);
    return { projectStructuralVersion: project.structuralVersion, backlinks: page.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })), page: { returned: page.length, limit: input.limit, nextCursor: rows.length > input.limit ? page.at(-1)!.createdAt.toISOString() : null, truncated: rows.length > input.limit } };
  }

  async getStoryChange(actor: SessionActor, projectId: string, storyChangeId: string) {
    const project = await assertProject(this.prisma, actor, projectId);
    const change = await this.prisma.storyChange.findFirst({ where: { id: storyChangeId, projectId, archivedAt: null }, select: { id: true, kind: true, title: true, description: true, storyTime: true, discoveryTime: true, anchorType: true, anchorId: true, anchorBlockId: true, isPlaceholder: true, version: true, updatedAt: true } });
    if (!change) throw errors.notFound();
    return { projectStructuralVersion: project.structuralVersion, storyChange: { ...change, storyTime: decimal(change.storyTime), discoveryTime: decimal(change.discoveryTime), updatedAt: change.updatedAt.toISOString() } };
  }
}
