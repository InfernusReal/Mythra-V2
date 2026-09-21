import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { AgentToolService, type AgentToolDependencies } from "@/domains/tools/application/service";

const actor: SessionActor = { userId: randomUUID(), workspaceId: randomUUID(), sessionId: randomUUID(), role: "OWNER" };
const projectId = randomUUID();
const endpoint = () => ({ type: "MILESTONE" as const, id: randomUUID() });

function setup() {
  const dependencies = {
    readModel: { authorize: vi.fn().mockResolvedValue(undefined), getProjectMap: vi.fn().mockResolvedValue({ page: { returned: 1 } }), getPlot: vi.fn(), getVolumeOutline: vi.fn(), getMilestone: vi.fn(), getChapterOutline: vi.fn(), getChapterText: vi.fn(), getTimelineWindow: vi.fn(), getBacklinks: vi.fn(), getStoryChange: vi.fn() },
    search: { query: vi.fn() }, universe: { list: vi.fn(), detail: vi.fn() }, causality: { getNeighborhood: vi.fn(), traceImpact: vi.fn() }, notes: { write: vi.fn().mockResolvedValue({ note: { id: randomUUID() }, replayed: false }) }, captures: { create: vi.fn().mockResolvedValue({ capture: { id: randomUUID() }, replayed: false }) }, suggestions: { create: vi.fn().mockResolvedValue({ suggestion: { id: randomUUID() }, replayed: false }) }, audit: { record: vi.fn().mockResolvedValue(undefined) }, logger: { info: vi.fn(), warn: vi.fn() },
  } as unknown as AgentToolDependencies;
  return { dependencies, service: new AgentToolService(dependencies) };
}

describe("AgentToolService", () => {
  it("authorizes discovery and dispatches bounded reads through a read model", async () => {
    const { service, dependencies } = setup();
    const listed = await service.list(actor, projectId, "req-list");
    expect(listed.tools).toHaveLength(20);
    expect(dependencies.readModel.authorize).toHaveBeenCalledWith(actor, projectId);
    await service.call(actor, projectId, ["READ"], "get_project_map", { perCollectionLimit: 25 }, "req-read");
    expect(dependencies.readModel.getProjectMap).toHaveBeenCalledWith(actor, projectId, 25);
    expect(dependencies.audit.record).toHaveBeenCalledWith(actor, projectId, expect.objectContaining({ toolName: "get_project_map", outcome: "SUCCESS" }));
  });

  it("stores structure and causal proposals only as Suggestions", async () => {
    const { service, dependencies } = setup();
    await service.call(actor, projectId, ["PROPOSE"], "propose_structure_patch", { sourceAgent: "review.agent", idempotencyKey: "structure-1", finding: "Structure mismatch", expectedStructuralVersion: 4, targetType: "MILESTONE", targetId: randomUUID(), operations: [{ operation: "replace", targetType: "MILESTONE", path: "/title", value: "Proposed" }] }, "req-structure");
    const source = endpoint(), target = endpoint();
    await service.call(actor, projectId, ["PROPOSE"], "propose_causal_relation", { sourceAgent: "review.agent", idempotencyKey: "causal-1", finding: "Missing causal bridge", expectedStructuralVersion: 4, source, target, relationType: "CAUSES" }, "req-causal");
    expect(dependencies.suggestions.create).toHaveBeenNthCalledWith(1, actor, projectId, expect.objectContaining({ category: "structure_patch", proposedActions: [expect.objectContaining({ actionType: "structure_patch" })] }), "req-structure");
    expect(dependencies.suggestions.create).toHaveBeenNthCalledWith(2, actor, projectId, expect.objectContaining({ category: "causal_relation", proposedActions: [expect.objectContaining({ actionType: "causal_relation" })] }), "req-causal");
    expect(dependencies.causality).not.toHaveProperty("createRelation");
  });

  it("requires explicit confirmation, strips the confirmation field, and preserves idempotency", async () => {
    const { service, dependencies } = setup();
    await expect(service.call(actor, projectId, ["WRITE_METADATA"], "create_note", { authorConfirmed: false, idempotencyKey: "note-1", title: "Private", body: "Private" }, "req-invalid")).rejects.toMatchObject({ code: "VALIDATION" });
    await service.call(actor, projectId, ["WRITE_METADATA"], "create_note", { authorConfirmed: true, idempotencyKey: "note-1", title: "Private", body: "Private" }, "req-note");
    expect(dependencies.notes.write).toHaveBeenCalledWith(actor, projectId, expect.objectContaining({ toolIdempotencyKey: "note-1" }), "req-note");
  });

  it("denies prose replacement even if a caller injects a restricted grant and audits denial", async () => {
    const { service, dependencies } = setup();
    await expect(service.call(actor, projectId, ["RESTRICTED_WRITE"], "replace_prose_range", { authorConfirmed: true, chapterId: randomUUID(), start: 0, length: 1, replacement: "x" }, "req-denied")).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(dependencies.audit.record).toHaveBeenCalledWith(actor, projectId, expect.objectContaining({ toolName: "replace_prose_range", permission: "RESTRICTED_WRITE", outcome: "DENIED" }));
  });

  it("dispatches every remaining read, direct proposal, and confirmed Capture contract", async () => {
    const { service, dependencies } = setup(); const objectId = randomUUID();
    const calls: Array<[Parameters<AgentToolService["call"]>[3], unknown]> = [
      ["get_plot", {}],
      ["get_volume_outline", { volumeId: objectId }],
      ["get_milestone", { milestoneId: objectId }],
      ["get_chapter_outline", { outlineId: objectId }],
      ["get_chapter_text", { chapterId: objectId }],
      ["search_project", { query: "bridge" }],
      ["get_entities", {}],
      ["get_entity", { entityId: objectId }],
      ["get_timeline_window", { anchorEventId: objectId }],
      ["get_backlinks", { targetType: "CHAPTER", targetId: objectId }],
      ["get_causal_neighborhood", { endpointType: "MILESTONE", endpointId: objectId }],
      ["trace_causal_impact", { endpointType: "MILESTONE", endpointId: objectId }],
      ["get_story_change", { storyChangeId: objectId }],
    ];
    for (const [name, input] of calls) await service.call(actor, projectId, ["READ"], name, input, `req-${name}`);
    await service.call(actor, projectId, ["PROPOSE"], "create_suggestion", { sourceAgent: "review.agent", idempotencyKey: "direct-1", category: "continuity", finding: "Review this." }, "req-direct");
    await service.call(actor, projectId, ["WRITE_METADATA"], "create_capture", { authorConfirmed: true, clientCaptureId: "capture-1", rawText: "Private", route: "/app", entityContext: [], capturedAt: new Date().toISOString() }, "req-capture");
    expect(dependencies.readModel.getPlot).toHaveBeenCalled(); expect(dependencies.readModel.getVolumeOutline).toHaveBeenCalled(); expect(dependencies.readModel.getMilestone).toHaveBeenCalled(); expect(dependencies.readModel.getChapterOutline).toHaveBeenCalled(); expect(dependencies.readModel.getChapterText).toHaveBeenCalled(); expect(dependencies.search.query).toHaveBeenCalled(); expect(dependencies.universe.list).toHaveBeenCalled(); expect(dependencies.universe.detail).toHaveBeenCalled(); expect(dependencies.readModel.getTimelineWindow).toHaveBeenCalled(); expect(dependencies.readModel.getBacklinks).toHaveBeenCalled(); expect(dependencies.causality.getNeighborhood).toHaveBeenCalled(); expect(dependencies.causality.traceImpact).toHaveBeenCalled(); expect(dependencies.readModel.getStoryChange).toHaveBeenCalled(); expect(dependencies.suggestions.create).toHaveBeenCalled(); expect(dependencies.captures.create).toHaveBeenCalledWith(actor, expect.not.objectContaining({ authorConfirmed: true }), "req-capture");
  });
});
