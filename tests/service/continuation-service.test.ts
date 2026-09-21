import { describe, expect, it, vi } from "vitest";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { ContinuationService } from "@/domains/writing/application/continuation";
import type { ContinuationRepository, ProjectContinuationReadModel, WritingPosition } from "@/domains/writing/application/continuation-ports";
import { createLogger } from "@/lib/observability/logger";

const actor: SessionActor = { userId: "7ef0a1db-1340-4a09-ad0a-a31ce0095cb4", workspaceId: "793acbda-7805-452e-b93a-c5af191e49c3", role: "OWNER", sessionId: "f9188279-42a2-47c7-953c-7936d5697807" };
const chapterId = "16b89770-6139-42fb-a1c9-070c8b675795";
const projectId = "3e64a9c7-dd41-40bc-8438-1cfd6dc4a384";
const position: WritingPosition = { activeChapterId: chapterId, blockId: "5cf2fd2a-3601-4fcb-a18f-0b61cf9dce20", cursorOffset: 9, selectionAnchor: 10, selectionHead: 10, scrollTop: 420, contextPanelMode: "CLOSED", pinIds: [], capturedAt: "2026-08-12T12:00:00.000Z" };
const model: ProjectContinuationReadModel = { project: { id: projectId, title: "Private project title" }, activeChapter: { id: chapterId, title: "Private chapter title", sequenceIndex: 0, wordCount: 4, updatedAt: position.capturedAt }, recentChapters: [], session: position };

function repository(): ContinuationRepository {
  return { getProjectContinuation: vi.fn().mockResolvedValue(model), saveWritingPosition: vi.fn().mockResolvedValue(position) };
}

describe("ContinuationService", () => {
  it("validates and stores bounded writing-position metadata", async () => {
    const repo = repository();
    const service = new ContinuationService(repo, createLogger());
    await expect(service.save(actor, projectId, position, "request-s3-1")).resolves.toEqual(position);
    expect(repo.saveWritingPosition).toHaveBeenCalledWith(actor, projectId, position);
    await expect(service.save(actor, projectId, { ...position, pinIds: Array.from({ length: 51 }, () => chapterId) }, "request-s3-2")).rejects.toThrow();
    await expect(service.save(actor, projectId, { ...position, manuscript: "must reject" }, "request-s3-3")).rejects.toThrow();
  });

  it("logs continuation metadata without project/chapter titles or manuscript text", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const service = new ContinuationService(repository(), createLogger());
    await service.get(actor, projectId, "request-s3-4");
    await service.save(actor, projectId, position, "request-s3-5");
    const output = consoleSpy.mock.calls.flat().join("\n");
    expect(output).toContain("S3-CONTINUATION-001");
    expect(output).toContain("S3-CONTINUATION-002");
    expect(output).not.toContain("Private project title");
    expect(output).not.toContain("Private chapter title");
    expect(output).not.toContain("must reject");
  });
});
