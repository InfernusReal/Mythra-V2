import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { ChapterDocument } from "../domain/chapter-document";

export interface ProjectSummary { id: string; title: string; activeChapterId: string | null; updatedAt: Date }
export interface ChapterEditorReadModel {
  project: { id: string; title: string };
  chapter: { id: string; title: string; sequenceIndex: number; document: ChapterDocument; version: number; wordCount: number; targetWords: number | null; hardStopEnabled: boolean; hardCharacterStop: number | null };
  navigation: { previousChapterId: string | null; nextChapterId: string | null };
}
export interface WritingRepository {
  createProject(actor: SessionActor, input: { title: string; description?: string }): Promise<ProjectSummary>;
  listProjects(actor: SessionActor, limit: number): Promise<ProjectSummary[]>;
  createChapter(actor: SessionActor, input: { projectId: string; title: string; sequenceIndex?: number }): Promise<ChapterEditorReadModel>;
  getEditor(actor: SessionActor, chapterId: string): Promise<ChapterEditorReadModel | null>;
}
