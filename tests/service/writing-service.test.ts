import { describe, expect, it, vi } from "vitest";
import { WritingService } from "@/domains/writing/application/commands";
import { emptyChapterDocument } from "@/domains/writing/domain/chapter-document";
import type { ChapterEditorReadModel, ProjectSummary, WritingRepository } from "@/domains/writing/application/ports";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { createLogger } from "@/lib/observability/logger";

const actor: SessionActor = {
  userId: "7ef0a1db-1340-4a09-ad0a-a31ce0095cb4",
  workspaceId: "793acbda-7805-452e-b93a-c5af191e49c3",
  role: "OWNER",
  sessionId: "f9188279-42a2-47c7-953c-7936d5697807"
};

const project: ProjectSummary = {
  id: "3e64a9c7-dd41-40bc-8438-1cfd6dc4a384",
  title: "Private project title",
  activeChapterId: null,
  updatedAt: new Date("2026-08-12T00:00:00.000Z")
};

const editor: ChapterEditorReadModel = {
  project: { id: project.id, title: project.title },
  chapter: {
    id: "16b89770-6139-42fb-a1c9-070c8b675795",
    title: "Private chapter title",
    sequenceIndex: 0,
    document: emptyChapterDocument(),
    version: 1,
    wordCount: 0,
    targetWords: null,
    hardStopEnabled: false,
    hardCharacterStop: null
  },
  navigation: { previousChapterId: null, nextChapterId: null }
};

function repository(): WritingRepository {
  return {
    createProject: vi.fn().mockResolvedValue(project),
    listProjects: vi.fn().mockResolvedValue([project]),
    createChapter: vi.fn().mockResolvedValue(editor),
    getEditor: vi.fn().mockResolvedValue(editor)
  };
}

describe("WritingService", () => {
  it("validates title-only project creation and excludes the title from structured logs", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const repo = repository();
    const service = new WritingService(repo, createLogger({ module: "writing" }));

    await expect(service.createProject(actor, { title: "  Private project title  " }, "request-1")).resolves.toEqual(project);
    expect(repo.createProject).toHaveBeenCalledWith(actor, { title: "Private project title" });
    expect(consoleSpy).toHaveBeenCalledOnce();
    expect(String(consoleSpy.mock.calls[0]?.[0])).not.toContain("Private project title");
  });

  it("rejects structural setup fields and invalid chapter placement", async () => {
    const service = new WritingService(repository(), createLogger());
    await expect(service.createProject(actor, { title: "Valid", description: "Optional" }, "request-2")).resolves.toEqual(project);
    await expect(service.createProject(actor, { title: "Valid", genre: "Fantasy" }, "request-2b")).rejects.toThrow();
    await expect(service.createChapter(actor, project.id, { title: "Chapter", sequenceIndex: -1 }, "request-3")).rejects.toThrow();
  });

  it("returns exactly one chapter read model through the repository boundary", async () => {
    const repo = repository();
    const service = new WritingService(repo, createLogger());
    await expect(service.getEditor(actor, editor.chapter.id, "request-4")).resolves.toEqual(editor);
    expect(repo.getEditor).toHaveBeenCalledWith(actor, editor.chapter.id);
  });
});
