import { afterEach, describe, expect, it, vi } from "vitest";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { MilestoneRepository } from "@/domains/milestones/application/ports";
import { MilestoneService } from "@/domains/milestones/application/service";
import { createLogger } from "@/lib/observability/logger";

const actor: SessionActor = { userId: "00000000-0000-4000-8000-000000000001", workspaceId: "00000000-0000-4000-8000-000000000002", role: "OWNER", sessionId: "session" };
const projectId = "00000000-0000-4000-8000-000000000003";
const first = "00000000-0000-4000-8000-000000000004";
const second = "00000000-0000-4000-8000-000000000005";

function repository(overrides: Partial<MilestoneRepository> = {}): MilestoneRepository {
  return { assertProjectAccess: vi.fn(), getOverview: vi.fn(), createMilestone: vi.fn(), updateMilestone: vi.fn(), linkChapter: vi.fn(), writeDependency: vi.fn(), reorderMilestones: vi.fn(), applyScaffold: vi.fn(), ...overrides };
}

afterEach(() => vi.restoreAllMocks());

describe("MilestoneService", () => {
  it("clamps read budgets and logs aggregate counts", async () => {
    const getOverview = vi.fn().mockResolvedValue(null); const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await new MilestoneService(repository({ getOverview }), createLogger()).getOverview(actor, projectId, { nodeBudget: 9_999, edgeBudget: -1 }, "request");
    expect(getOverview).toHaveBeenCalledWith(actor, projectId, { nodeBudget: 500, edgeBudget: 0 });
    expect(String(consoleSpy.mock.calls.at(-1)?.[0])).toContain("S5-MILESTONE-001");
  });

  it("validates all canonical writes and keeps authored content out of logs", async () => {
    const createMilestone = vi.fn().mockResolvedValue({ object: { id: first, sequenceIndex: 0, title: "Private title", description: "Private description", threadLabel: null, targetChapterStart: 0, targetChapterEnd: 1, targetWords: null, targetDate: null, status: "PLANNED", isPlaceholder: false, version: 1, progress: 0, progressComplete: true, linkedChapterCount: 0 }, projectStructuralVersion: 2 });
    const linkChapter = vi.fn().mockResolvedValue({ object: { id: second, chapterId: second, milestoneId: first, role: "DEVELOP", customRole: null, weight: 2, version: 1 }, projectStructuralVersion: 3 });
    const writeDependency = vi.fn().mockResolvedValue({ object: { id: second, sourceMilestoneId: first, targetMilestoneId: second, state: "ACTIVE", isHard: true, note: "Private note", version: 1 }, projectStructuralVersion: 4 });
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const service = new MilestoneService(repository({ createMilestone, linkChapter, writeDependency }), createLogger());
    await service.writeMilestone(actor, projectId, { expectedStructuralVersion: 1, sequenceIndex: 0, title: "Private title", description: "Private description", targetChapterStart: 0, targetChapterEnd: 1 }, "request");
    await service.linkChapter(actor, projectId, { expectedStructuralVersion: 2, chapterId: second, milestoneId: first, role: "DEVELOP", weight: 2 }, "request");
    await service.writeDependency(actor, projectId, { expectedStructuralVersion: 3, sourceMilestoneId: first, targetMilestoneId: second, isHard: true, note: "Private note" }, "request");
    const logs = consoleSpy.mock.calls.flat().join("\n");
    expect(logs).toContain("S5-MILESTONE-002"); expect(logs).toContain("S5-LINK-001"); expect(logs).toContain("S5-DEPENDENCY-001");
    expect(logs).not.toContain("Private title"); expect(logs).not.toContain("Private description"); expect(logs).not.toContain("Private note");
  });

  it("delegates milestone updates through the explicit update boundary", async () => {
    const updateMilestone = vi.fn().mockResolvedValue({ object: { id: first, sequenceIndex: 1, title: "Revised", description: null, threadLabel: null, targetChapterStart: null, targetChapterEnd: null, targetWords: null, targetDate: null, status: "IN_PROGRESS", isPlaceholder: false, version: 2, progress: 0, progressComplete: true, linkedChapterCount: 0 }, projectStructuralVersion: 3 });
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    await new MilestoneService(repository({ updateMilestone }), createLogger()).writeMilestone(actor, projectId, { expectedStructuralVersion: 2, milestoneId: first, sequenceIndex: 1, title: "Revised", status: "IN_PROGRESS" }, "request");
    expect(updateMilestone).toHaveBeenCalledWith(actor, projectId, expect.objectContaining({ milestoneId: first, status: "IN_PROGRESS" }));
  });

  it("ownership-gates preview and token-gates apply", async () => {
    const assertProjectAccess = vi.fn().mockResolvedValue(undefined);
    const applyScaffold = vi.fn().mockResolvedValue({ object: { milestoneIds: [first], placeholderCount: 1 }, projectStructuralVersion: 2 });
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const service = new MilestoneService(repository({ assertProjectAccess, applyScaffold }), createLogger());
    const input = { expectedStructuralVersion: 1, milestoneCount: 1, chapterStart: 1, chapterCount: 2 };
    const preview = await service.previewScaffold(actor, projectId, input, "request");
    await expect(service.applyScaffold(actor, projectId, { input, planToken: preview.planToken }, "request")).resolves.toMatchObject({ projectStructuralVersion: 2 });
    await expect(service.applyScaffold(actor, projectId, { input, planToken: "0".repeat(64) }, "request")).rejects.toMatchObject({ code: "CONFLICT" });
    expect(assertProjectAccess).toHaveBeenCalledWith(actor, projectId);
  });

  it("ownership-gates reorder preview and delegates reviewed order", async () => {
    const assertProjectAccess = vi.fn().mockResolvedValue(undefined);
    const reorderMilestones = vi.fn().mockResolvedValue({ object: { orderedIds: [second, first] }, projectStructuralVersion: 3 });
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const service = new MilestoneService(repository({ assertProjectAccess, reorderMilestones }), createLogger());
    await expect(service.previewReorder(actor, projectId, { currentIds: [first, second], movedId: second, targetIndex: 0 }, "request")).resolves.toMatchObject({ orderedIds: [second, first] });
    await expect(service.applyReorder(actor, projectId, { expectedStructuralVersion: 2, orderedIds: [second, first] }, "request")).resolves.toMatchObject({ projectStructuralVersion: 3 });
    expect(assertProjectAccess).toHaveBeenCalledWith(actor, projectId);
    expect(reorderMilestones).toHaveBeenCalledWith(actor, projectId, { expectedStructuralVersion: 2, orderedIds: [second, first] });
  });
});
