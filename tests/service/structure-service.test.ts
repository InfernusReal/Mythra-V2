import { afterEach, describe, expect, it, vi } from "vitest";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { StructureRepository } from "@/domains/structure/application/ports";
import { StructureService } from "@/domains/structure/application/service";
import { createLogger } from "@/lib/observability/logger";

const actor: SessionActor = { userId: "00000000-0000-4000-8000-000000000001", workspaceId: "00000000-0000-4000-8000-000000000002", role: "OWNER", sessionId: "session" };
const projectId = "00000000-0000-4000-8000-000000000003";
const plotId = "00000000-0000-4000-8000-000000000004";

afterEach(() => vi.restoreAllMocks());

function repository(overrides: Partial<StructureRepository> = {}): StructureRepository {
  return {
    assertProjectAccess: vi.fn().mockResolvedValue(undefined),
    getOverview: vi.fn(),
    createPlot: vi.fn(),
    updatePlot: vi.fn(),
    upsertPlotOutline: vi.fn(),
    createVolume: vi.fn(),
    updateVolume: vi.fn(),
    upsertVolumeOutline: vi.fn(),
    upsertChapterOutline: vi.fn(),
    createSceneFromOutlineBlock: vi.fn(),
    createNarrativeIntent: vi.fn(),
    createStoryReference: vi.fn(),
    assignChapterToVolume: vi.fn(),
    reparentChapterOutline: vi.fn(),
    reorderVolumes: vi.fn(),
    applyScaffold: vi.fn(),
    saveViewState: vi.fn(),
    ...overrides
  };
}

describe("StructureService", () => {
  it("validates and logs plot writes without title or summary content", async () => {
    const createPlot = vi.fn().mockResolvedValue({ object: { id: plotId, title: "Private title", summary: "Private summary", version: 1, outlineId: null }, projectStructuralVersion: 2 });
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const result = await new StructureService(repository({ createPlot }), createLogger({ service: "test" })).createPlot(actor, projectId, { expectedStructuralVersion: 1, title: "Private title", summary: "Private summary" }, "request");
    expect(result.projectStructuralVersion).toBe(2);
    expect(createPlot).toHaveBeenCalledWith(actor, projectId, expect.objectContaining({ title: "Private title" }));
    const record = String(consoleSpy.mock.calls.at(-1)?.[0]);
    expect(record).toContain("S4-STRUCTURE-002");
    expect(record).not.toContain("Private title");
    expect(record).not.toContain("Private summary");
  });

  it("clamps overview budgets before repository access", async () => {
    const getOverview = vi.fn().mockResolvedValue(null);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    await new StructureService(repository({ getOverview }), createLogger()).getOverview(actor, projectId, { pageSize: "999999", nodeBudget: "999999", edgeBudget: "999999" }, "request");
    expect(getOverview).toHaveBeenCalledWith(actor, projectId, { pageSize: 250, nodeBudget: 500, edgeBudget: 750, rangeStart: 0 });
  });

  it("separates scaffold preview from a token-verified apply", async () => {
    const assertProjectAccess = vi.fn().mockResolvedValue(undefined);
    const applyScaffold = vi.fn().mockResolvedValue({ object: { plotId, volumeIds: [plotId], placeholderCount: 4, assignedChapterCount: 0 }, projectStructuralVersion: 2 });
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const service = new StructureService(repository({ assertProjectAccess, applyScaffold }), createLogger());
    const input = { expectedStructuralVersion: 1, volumeCount: 1, chapterStart: 1, chapterCount: 4, createChapterOutlinePlaceholders: true };
    const preview = await service.previewScaffold(actor, input, "request", projectId);
    await expect(service.applyScaffold(actor, projectId, { input, planToken: preview.planToken }, "request")).resolves.toMatchObject({ projectStructuralVersion: 2 });
    await expect(service.applyScaffold(actor, projectId, { input, planToken: "0".repeat(64) }, "request")).rejects.toThrow("STALE_OR_TAMPERED_SCAFFOLD_PLAN");
    expect(assertProjectAccess).toHaveBeenCalledWith(actor, projectId);
    expect(applyScaffold).toHaveBeenCalledOnce();
  });

  it("blocks reorder preview before calculation when project ownership is unavailable", async () => {
    const unavailable = Object.assign(new Error("Not found"), { code: "NOT_FOUND" });
    const assertProjectAccess = vi.fn().mockRejectedValue(unavailable);
    const service = new StructureService(repository({ assertProjectAccess }), createLogger());
    await expect(service.previewVolumeReorder(actor, { currentIds: [plotId], movedId: plotId, targetIndex: 0 }, "request", projectId)).rejects.toBe(unavailable);
    expect(assertProjectAccess).toHaveBeenCalledWith(actor, projectId);
  });

  it("rejects incomplete paragraph-selection intent before repository access", async () => {
    const createNarrativeIntent = vi.fn();
    const service = new StructureService(repository({ createNarrativeIntent }), createLogger());
    await expect(service.createNarrativeIntent(actor, projectId, { expectedStructuralVersion: 1, targetType: "PARAGRAPH_SELECTION", targetId: plotId, intentText: "Private intent" }, "request")).rejects.toMatchObject({ name: "ZodError" });
    expect(createNarrativeIntent).not.toHaveBeenCalled();
  });

  it("rejects reserved later-domain StoryReference endpoints before repository access", async () => {
    const createStoryReference = vi.fn();
    const service = new StructureService(repository({ createStoryReference }), createLogger());
    await expect(service.createStoryReference(actor, projectId, { expectedStructuralVersion: 1, sourceType: "NOTE", sourceId: plotId, targetType: "PLOT", targetId: "00000000-0000-4000-8000-000000000005" }, "request")).rejects.toMatchObject({ name: "ZodError" });
    expect(createStoryReference).not.toHaveBeenCalled();
  });

  it("saves view preference without requiring a structural version", async () => {
    const state = { mode: "GUIDED" as const, activeLens: "SEMANTIC_ZOOM" as const, expandedIds: [plotId], activeAnchorType: "PLOT", activeAnchorId: plotId, cursorOffset: 3, selectionAnchor: 3, selectionHead: 5, scrollTop: 20, pinIds: [] };
    const saveViewState = vi.fn().mockResolvedValue(state);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    await new StructureService(repository({ saveViewState }), createLogger()).saveViewState(actor, projectId, state, "request");
    expect(saveViewState).toHaveBeenCalledWith(actor, projectId, state);
  });

  it("validates and delegates every active S4 mutation boundary", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const volumeId = "00000000-0000-4000-8000-000000000005";
    const outlineId = "00000000-0000-4000-8000-000000000006";
    const chapterId = "00000000-0000-4000-8000-000000000007";
    const sceneId = "00000000-0000-4000-8000-000000000008";
    const intentId = "00000000-0000-4000-8000-000000000009";
    const referenceId = "00000000-0000-4000-8000-000000000010";
    const delegates = repository({
      updatePlot: vi.fn().mockResolvedValue({ object: { id: plotId, title: "Private", summary: null, version: 2, outlineId: null }, projectStructuralVersion: 2 }),
      upsertPlotOutline: vi.fn().mockResolvedValue({ object: { id: outlineId, version: 1 }, projectStructuralVersion: 2 }),
      createVolume: vi.fn().mockResolvedValue({ object: { id: volumeId, plotId, sequenceIndex: 0, displayNumber: null, title: "Private", targetWords: null, hardTargetWordsEnabled: false, version: 1, outlineId: null, chapterCount: 0 }, projectStructuralVersion: 2 }),
      updateVolume: vi.fn().mockResolvedValue({ object: { id: volumeId, plotId, sequenceIndex: 0, displayNumber: null, title: "Private", targetWords: 1_000, hardTargetWordsEnabled: true, version: 2, outlineId: null, chapterCount: 0 }, projectStructuralVersion: 2 }),
      upsertVolumeOutline: vi.fn().mockResolvedValue({ object: { id: outlineId, version: 1 }, projectStructuralVersion: 2 }),
      upsertChapterOutline: vi.fn().mockResolvedValue({ object: { id: outlineId, chapterId, volumeId, sequenceIndex: 0, title: "Private", plainText: "Private", purpose: null, emotionalMovement: null, targetWords: null, hardTargetWordsEnabled: false, isPlaceholder: false, version: 1, sceneCount: 0 }, projectStructuralVersion: 2 }),
      reorderVolumes: vi.fn().mockResolvedValue({ object: { orderedIds: [volumeId] }, projectStructuralVersion: 2 }),
      assignChapterToVolume: vi.fn().mockResolvedValue({ object: { chapterId, volumeId: null, volumeSequenceIndex: null }, projectStructuralVersion: 2 }),
      reparentChapterOutline: vi.fn().mockResolvedValue({ object: { id: outlineId, chapterId, volumeId: null, sequenceIndex: 0, title: "Private", plainText: "Private", purpose: null, emotionalMovement: null, targetWords: null, hardTargetWordsEnabled: false, isPlaceholder: false, version: 2, sceneCount: 0 }, projectStructuralVersion: 2 }),
      createSceneFromOutlineBlock: vi.fn().mockResolvedValue({ object: { id: sceneId, chapterId, chapterOutlineId: outlineId, sequenceIndex: 0, title: "Private", purpose: null, provenanceType: "OUTLINE_BLOCK", provenanceSourceId: outlineId, provenanceBlockId: "block-1", version: 1 }, projectStructuralVersion: 2 }),
      createNarrativeIntent: vi.fn().mockResolvedValue({ object: { id: intentId, targetType: "PLOT", targetId: plotId, blockId: null, category: null, customCategory: null, version: 1 }, projectStructuralVersion: 2 }),
      createStoryReference: vi.fn().mockResolvedValue({ object: { id: referenceId, sourceType: "PLOT", sourceId: plotId, sourceBlockId: null, targetType: "VOLUME", targetId: volumeId, targetBlockId: null, relationshipKey: "references", provenanceType: "DIRECT", version: 1 }, projectStructuralVersion: 2 })
    });
    const service = new StructureService(delegates, createLogger());
    const document = { type: "doc" as const, content: [] };
    await service.updatePlot(actor, projectId, { expectedStructuralVersion: 1, plotId, title: "Private" }, "request");
    await service.upsertPlotOutline(actor, projectId, { expectedStructuralVersion: 1, plotId, title: "Private", document, plainText: "Private", purpose: "Private" }, "request");
    await service.createVolume(actor, projectId, { expectedStructuralVersion: 1, plotId, sequenceIndex: 0, displayNumber: "I", title: "Private", summary: "Private", hardTargetWordsEnabled: false }, "request");
    await service.updateVolume(actor, projectId, { expectedStructuralVersion: 1, volumeId, title: "Private", targetWords: 1_000, hardTargetWordsEnabled: true }, "request");
    await service.upsertVolumeOutline(actor, projectId, { expectedStructuralVersion: 1, volumeId, title: "Private", document, plainText: "Private" }, "request");
    await service.upsertChapterOutline(actor, projectId, { expectedStructuralVersion: 1, chapterId, volumeId, sequenceIndex: 0, title: "Private", document, plainText: "Private", purpose: "Private", emotionalMovement: "Private", revealedInformation: ["Private"], entityReferenceKeys: [], locationReferenceKeys: [], milestoneReferenceKeys: [], hardTargetWordsEnabled: false, sceneStubs: [], isPlaceholder: false }, "request");
    await service.previewVolumeReorder(actor, { currentIds: [volumeId], movedId: volumeId, targetIndex: 0 }, "request", projectId);
    await service.applyVolumeReorder(actor, projectId, { expectedStructuralVersion: 1, orderedIds: [volumeId] }, "request");
    await service.assignChapterToVolume(actor, projectId, { expectedStructuralVersion: 1, chapterId, volumeId: null, volumeSequenceIndex: null }, "request");
    await service.reparentChapterOutline(actor, projectId, { expectedStructuralVersion: 1, chapterOutlineId: outlineId, volumeId: null, sequenceIndex: 0 }, "request");
    await service.createSceneFromOutlineBlock(actor, projectId, { expectedStructuralVersion: 1, chapterOutlineId: outlineId, blockId: "block-1", sequenceIndex: 0, title: "Private", outlineDocument: document, outlineText: "Private", targetWords: 100, hardTargetWordsEnabled: true }, "request");
    await service.createNarrativeIntent(actor, projectId, { expectedStructuralVersion: 1, targetType: "PLOT", targetId: plotId, intentText: "Private" }, "request");
    await service.createStoryReference(actor, projectId, { expectedStructuralVersion: 1, sourceType: "PLOT", sourceId: plotId, targetType: "VOLUME", targetId: volumeId, relationshipKey: "references", provenanceType: "DIRECT" }, "request");
    expect(delegates.updatePlot).toHaveBeenCalledOnce();
    expect(delegates.createStoryReference).toHaveBeenCalledOnce();
  });

  it("rejects inconsistent hard targets, membership, intent and reference invariants", async () => {
    const service = new StructureService(repository(), createLogger());
    const volumeId = "00000000-0000-4000-8000-000000000005";
    const chapterId = "00000000-0000-4000-8000-000000000006";
    await expect(service.createVolume(actor, projectId, { expectedStructuralVersion: 1, plotId, sequenceIndex: 0, title: "Volume", hardTargetWordsEnabled: true }, "request")).rejects.toMatchObject({ name: "ZodError" });
    await expect(service.assignChapterToVolume(actor, projectId, { expectedStructuralVersion: 1, chapterId, volumeId, volumeSequenceIndex: null }, "request")).rejects.toMatchObject({ name: "ZodError" });
    await expect(service.createNarrativeIntent(actor, projectId, { expectedStructuralVersion: 1, targetType: "PLOT", targetId: plotId, blockId: "invalid", intentText: "Intent" }, "request")).rejects.toMatchObject({ name: "ZodError" });
    await expect(service.createNarrativeIntent(actor, projectId, { expectedStructuralVersion: 1, targetType: "PLOT", targetId: plotId, category: "CUSTOM", intentText: "Intent" }, "request")).rejects.toMatchObject({ name: "ZodError" });
    await expect(service.createStoryReference(actor, projectId, { expectedStructuralVersion: 1, sourceType: "PLOT", sourceId: plotId, targetType: "PLOT", targetId: plotId }, "request")).rejects.toMatchObject({ name: "ZodError" });
  });
});
