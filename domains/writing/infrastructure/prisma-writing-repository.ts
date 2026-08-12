import type { PrismaClient } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { errors } from "@/lib/contracts/errors";
import { emptyChapterDocument, normalizeChapterDocument } from "../domain/chapter-document";
import type { ChapterEditorReadModel, ProjectSummary, WritingRepository } from "../application/ports";

export class PrismaWritingRepository implements WritingRepository {
  constructor(private readonly prisma: PrismaClient) {}
  async createProject(actor: SessionActor, input: { title: string; description?: string }): Promise<ProjectSummary> {
    return this.prisma.project.create({ data: { workspaceId: actor.workspaceId, ...input }, select: { id: true, title: true, activeChapterId: true, updatedAt: true } });
  }
  async listProjects(actor: SessionActor, limit: number): Promise<ProjectSummary[]> {
    return this.prisma.project.findMany({ where: { workspaceId: actor.workspaceId, status: "ACTIVE" }, orderBy: { updatedAt: "desc" }, take: Math.min(100, limit), select: { id: true, title: true, activeChapterId: true, updatedAt: true } });
  }
  async createChapter(actor: SessionActor, input: { projectId: string; title: string; sequenceIndex?: number }): Promise<ChapterEditorReadModel> {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findFirst({ where: { id: input.projectId, workspaceId: actor.workspaceId, status: "ACTIVE" }, select: { id: true, title: true } });
      if (!project) throw errors.notFound();
      const aggregate = await tx.chapter.aggregate({ where: { projectId: project.id }, _max: { sequenceIndex: true } });
      const sequenceIndex = input.sequenceIndex ?? (aggregate._max.sequenceIndex ?? -1) + 1;
      const document = emptyChapterDocument();
      const chapter = await tx.chapter.create({ data: { projectId: project.id, title: input.title, sequenceIndex, bodyDocument: document }, select: { id: true, title: true, sequenceIndex: true, bodyDocument: true, version: true, wordCount: true, targetWords: true, hardStopEnabled: true, hardCharacterStop: true } });
      await tx.project.update({ where: { id: project.id }, data: { activeChapterId: chapter.id } });
      const [previous, next] = await Promise.all([
        tx.chapter.findFirst({ where: { projectId: project.id, archivedAt: null, sequenceIndex: { lt: chapter.sequenceIndex } }, orderBy: { sequenceIndex: "desc" }, select: { id: true } }),
        tx.chapter.findFirst({ where: { projectId: project.id, archivedAt: null, sequenceIndex: { gt: chapter.sequenceIndex } }, orderBy: { sequenceIndex: "asc" }, select: { id: true } })
      ]);
      return {
        project,
        chapter: { ...chapter, document: normalizeChapterDocument(chapter.bodyDocument) },
        navigation: { previousChapterId: previous?.id ?? null, nextChapterId: next?.id ?? null }
      };
    });
  }
  async getEditor(actor: SessionActor, chapterId: string): Promise<ChapterEditorReadModel | null> {
    const chapter = await this.prisma.chapter.findFirst({ where: { id: chapterId, archivedAt: null, project: { workspaceId: actor.workspaceId, status: "ACTIVE" } }, select: { id: true, title: true, sequenceIndex: true, bodyDocument: true, version: true, wordCount: true, targetWords: true, hardStopEnabled: true, hardCharacterStop: true, project: { select: { id: true, title: true } } } });
    if (!chapter) return null;
    const [previous, next] = await Promise.all([
      this.prisma.chapter.findFirst({ where: { projectId: chapter.project.id, archivedAt: null, sequenceIndex: { lt: chapter.sequenceIndex } }, orderBy: { sequenceIndex: "desc" }, select: { id: true } }),
      this.prisma.chapter.findFirst({ where: { projectId: chapter.project.id, archivedAt: null, sequenceIndex: { gt: chapter.sequenceIndex } }, orderBy: { sequenceIndex: "asc" }, select: { id: true } })
    ]);
    return {
      project: chapter.project,
      chapter: { ...chapter, document: normalizeChapterDocument(chapter.bodyDocument) },
      navigation: { previousChapterId: previous?.id ?? null, nextChapterId: next?.id ?? null }
    };
  }
}
