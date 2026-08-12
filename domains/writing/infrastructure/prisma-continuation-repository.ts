import type { PrismaClient } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { errors } from "@/lib/contracts/errors";
import type { ContinuationChapterSummary, ContinuationRepository, ContextPanelMode, ProjectContinuationReadModel, WritingPosition } from "../application/continuation-ports";

const EMPTY_POSITION: WritingPosition = {
  activeChapterId: null,
  blockId: null,
  cursorOffset: null,
  selectionAnchor: null,
  selectionHead: null,
  scrollTop: null,
  contextPanelMode: "CLOSED",
  pinIds: [],
  capturedAt: new Date(0).toISOString()
};

function chapterSummary(chapter: { id: string; title: string; sequenceIndex: number; wordCount: number; updatedAt: Date }): ContinuationChapterSummary {
  return { ...chapter, updatedAt: chapter.updatedAt.toISOString() };
}

function storedPosition(state: {
  activeChapterId: string | null; blockId: string | null; cursorOffset: number | null; selectionAnchor: number | null;
  selectionHead: number | null; scrollTop: number | null; contextPanelMode: string; pinIds: unknown; capturedAt: Date;
} | undefined): WritingPosition {
  if (!state) return EMPTY_POSITION;
  const pinIds = Array.isArray(state.pinIds) ? state.pinIds.filter((item): item is string => typeof item === "string").slice(0, 50) : [];
  return { ...state, contextPanelMode: state.contextPanelMode as ContextPanelMode, pinIds, capturedAt: state.capturedAt.toISOString() };
}

export class PrismaContinuationRepository implements ContinuationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getProjectContinuation(actor: SessionActor, projectId: string): Promise<ProjectContinuationReadModel | null> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE" },
      select: {
        id: true,
        title: true,
        activeChapterId: true,
        chapters: { where: { archivedAt: null }, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, title: true, sequenceIndex: true, wordCount: true, updatedAt: true } },
        writingSessions: { where: { userId: actor.userId }, take: 1, select: { activeChapterId: true, blockId: true, cursorOffset: true, selectionAnchor: true, selectionHead: true, scrollTop: true, contextPanelMode: true, pinIds: true, capturedAt: true } }
      }
    });
    if (!project) return null;
    const session = storedPosition(project.writingSessions[0]);
    const desiredChapterId = session.activeChapterId ?? project.activeChapterId;
    const fromRecent = project.chapters.find((chapter) => chapter.id === desiredChapterId);
    let activeChapter = fromRecent ?? (desiredChapterId ? await this.prisma.chapter.findFirst({
      where: { id: desiredChapterId, projectId: project.id, archivedAt: null },
      select: { id: true, title: true, sequenceIndex: true, wordCount: true, updatedAt: true }
    }) : project.chapters[0]);
    if (!activeChapter && project.activeChapterId && project.activeChapterId !== desiredChapterId) {
      activeChapter = await this.prisma.chapter.findFirst({
        where: { id: project.activeChapterId, projectId: project.id, archivedAt: null },
        select: { id: true, title: true, sequenceIndex: true, wordCount: true, updatedAt: true }
      });
    }
    activeChapter ??= project.chapters[0];
    return {
      project: { id: project.id, title: project.title },
      activeChapter: activeChapter ? chapterSummary(activeChapter) : null,
      recentChapters: project.chapters.map(chapterSummary),
      session: { ...session, activeChapterId: activeChapter?.id ?? null }
    };
  }

  async saveWritingPosition(actor: SessionActor, projectId: string, position: WritingPosition): Promise<WritingPosition> {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE" }, select: { id: true } });
      if (!project) throw errors.notFound();
      if (position.activeChapterId) {
        const chapter = await tx.chapter.findFirst({ where: { id: position.activeChapterId, projectId: project.id, archivedAt: null }, select: { id: true } });
        if (!chapter) throw errors.notFound();
      }
      const existing = await tx.writingSessionState.findUnique({
        where: { userId_projectId: { userId: actor.userId, projectId } },
        select: { activeChapterId: true, blockId: true, cursorOffset: true, selectionAnchor: true, selectionHead: true, scrollTop: true, contextPanelMode: true, pinIds: true, capturedAt: true }
      });
      if (existing && existing.capturedAt.getTime() > new Date(position.capturedAt).getTime()) return storedPosition(existing);
      const data = {
        workspaceId: actor.workspaceId,
        activeChapterId: position.activeChapterId,
        blockId: position.blockId,
        cursorOffset: position.cursorOffset,
        selectionAnchor: position.selectionAnchor,
        selectionHead: position.selectionHead,
        scrollTop: position.scrollTop,
        contextPanelMode: position.contextPanelMode,
        pinIds: position.pinIds,
        capturedAt: new Date(position.capturedAt)
      };
      const state = await tx.writingSessionState.upsert({
        where: { userId_projectId: { userId: actor.userId, projectId } },
        create: { userId: actor.userId, projectId, ...data },
        update: data,
        select: { activeChapterId: true, blockId: true, cursorOffset: true, selectionAnchor: true, selectionHead: true, scrollTop: true, contextPanelMode: true, pinIds: true, capturedAt: true }
      });
      if (position.activeChapterId) await tx.project.update({ where: { id: project.id }, data: { activeChapterId: position.activeChapterId } });
      return storedPosition(state);
    }, { isolationLevel: "Serializable" });
  }
}
