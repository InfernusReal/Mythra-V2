import { z } from "zod";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { Logger } from "@/lib/observability/logger";
import type { ChapterEditorReadModel, ProjectSummary, WritingRepository } from "./ports";

export const createProjectInput = z.object({ title: z.string().trim().min(1).max(240), description: z.string().trim().max(2_000).optional() }).strict();
export const createChapterInput = z.object({ title: z.string().trim().min(1).max(240).default("Untitled chapter"), sequenceIndex: z.number().int().min(0).optional() }).strict();

export class WritingService {
  constructor(private readonly repository: WritingRepository, private readonly logger: Logger) {}

  async createProject(actor: SessionActor, input: unknown, requestId: string): Promise<ProjectSummary> {
    const parsed = createProjectInput.parse(input);
    const result = await this.repository.createProject(actor, parsed);
    // Console trace S1-PROJECT-001: minimal project created; title and prose are excluded from telemetry.
    this.logger.info("project.created", { step: "S1-PROJECT-001", requestId, userId: actor.userId, workspaceId: actor.workspaceId, projectId: result.id });
    return result;
  }
  async listProjects(actor: SessionActor): Promise<ProjectSummary[]> { return this.repository.listProjects(actor, 50); }

  async createChapter(actor: SessionActor, projectId: string, input: unknown, requestId: string): Promise<ChapterEditorReadModel> {
    const parsed = createChapterInput.parse(input);
    const result = await this.repository.createChapter(actor, { projectId, ...parsed });
    // Console trace S1-CHAPTER-001: chapter created under an ownership-scoped project; no title/document is logged.
    this.logger.info("chapter.created", { step: "S1-CHAPTER-001", requestId, workspaceId: actor.workspaceId, projectId, chapterId: result.chapter.id, version: result.chapter.version });
    return result;
  }

  async getEditor(actor: SessionActor, chapterId: string, requestId: string): Promise<ChapterEditorReadModel | null> {
    const result = await this.repository.getEditor(actor, chapterId);
    // Console trace S1-EDITOR-001: one active chapter read model resolved; document content is never logged.
    this.logger.info("editor.read_model", { step: "S1-EDITOR-001", requestId, workspaceId: actor.workspaceId, chapterId, found: Boolean(result), version: result?.chapter.version });
    return result;
  }
}
