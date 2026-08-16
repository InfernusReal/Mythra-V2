import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { CausalityService } from "@/domains/causality/application/service";
import type { CausalityRepository } from "@/domains/causality/application/ports";
import type { Logger } from "@/lib/observability/logger";

const actor: SessionActor = { userId: randomUUID(), workspaceId: randomUUID(), sessionId: randomUUID(), role: "OWNER" };
const projectId = randomUUID(), sourceId = randomUUID(), targetId = randomUUID(), relationId = randomUUID();
function setup() {
  const repository = {
    assertProjectAccess: vi.fn(), getOverview: vi.fn().mockResolvedValue(null),
    writeStoryChange: vi.fn().mockResolvedValue({ object: { id: sourceId, kind: "EVENT", title: "Authored", description: null, storyTime: null, discoveryTime: null, anchor: null, isPlaceholder: false, version: 1, archivedAt: null }, projectStructuralVersion: 2 }),
    createRelation: vi.fn().mockResolvedValue({ object: { id: relationId, source: { type: "STORY_CHANGE", id: sourceId }, target: { type: "STORY_CHANGE", id: targetId }, relationType: "CAUSES", condition: null, strength: 1, importance: 50, state: "ACTIVE", isHard: false, temporalProgression: false, mutualStateSemantics: false, note: null, provenanceType: "DIRECT", provenanceNote: null, version: 1, archivedAt: null }, projectStructuralVersion: 3 }),
    lifecycleRelation: vi.fn().mockResolvedValue({ object: { id: relationId, source: { type: "STORY_CHANGE", id: sourceId }, target: { type: "STORY_CHANGE", id: targetId }, relationType: "CAUSES", condition: null, strength: 1, importance: 50, state: "RETIRED", isHard: false, temporalProgression: false, mutualStateSemantics: false, note: null, provenanceType: "DIRECT", provenanceNote: null, version: 2, archivedAt: null }, projectStructuralVersion: 4 }),
    getNeighborhood: vi.fn().mockResolvedValue({ root: { type: "STORY_CHANGE", id: sourceId, label: "Root", archived: false }, paths: [], nodeCount: 1, edgeCount: 0, truncated: false, language: "potentially affected" }),
    traceImpact: vi.fn().mockResolvedValue({ root: { type: "STORY_CHANGE", id: sourceId, label: "Root", archived: false }, paths: [], nodeCount: 1, edgeCount: 0, truncated: false, language: "potentially affected" }),
    validateChronology: vi.fn().mockResolvedValue({ relation: { id: relationId }, chronology: { status: "INSUFFICIENT_INFORMATION", warnings: [], basis: "NONE" } })
  } as unknown as CausalityRepository;
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), child: vi.fn() } as unknown as Logger;
  return { repository, logger, service: new CausalityService(repository, logger) };
}

describe("CausalityService", () => {
  it("clamps overview and traversal budgets and logs only safe metadata", async () => {
    const { service, repository, logger } = setup(); await service.getOverview(actor, projectId, { nodeBudget: 5_000, edgeBudget: -1 }, "req");
    expect(repository.getOverview).toHaveBeenCalledWith(actor, projectId, { nodeBudget: 500, edgeBudget: 0 });
    await service.getNeighborhood(actor, projectId, { endpointType: "STORY_CHANGE", endpointId: sourceId, nodeBudget: 500, edgeBudget: 750, pathBudget: 500, maxDepth: 12 }, "req");
    expect(repository.getNeighborhood).toHaveBeenCalledWith(actor, projectId, expect.objectContaining({ nodeBudget: 500, edgeBudget: 750, pathBudget: 500, maxDepth: 12 }));
    expect(JSON.stringify(vi.mocked(logger.info).mock.calls)).not.toContain("Authored");
  });

  it("writes all canonical commands and delegates impact/chronology", async () => {
    const { service, repository } = setup();
    await service.writeStoryChange(actor, projectId, { expectedStructuralVersion: 1, kind: "EVENT", title: "Secret", isPlaceholder: false }, "req");
    await service.createRelation(actor, projectId, { expectedStructuralVersion: 2, source: { type: "STORY_CHANGE", id: sourceId }, target: { type: "STORY_CHANGE", id: targetId }, relationType: "CAUSES" }, "req");
    await service.lifecycleRelation(actor, projectId, { action: "RETIRE", expectedStructuralVersion: 3, relationId }, "req");
    await service.traceImpact(actor, projectId, { endpointType: "STORY_CHANGE", endpointId: sourceId, direction: "DOWNSTREAM" }, "req");
    await service.validateChronology(actor, projectId, { relationId }, "req");
    expect(repository.writeStoryChange).toHaveBeenCalledOnce(); expect(repository.createRelation).toHaveBeenCalledOnce(); expect(repository.lifecycleRelation).toHaveBeenCalledOnce(); expect(repository.traceImpact).toHaveBeenCalledOnce(); expect(repository.validateChronology).toHaveBeenCalledWith(actor, projectId, relationId);
  });

  it("rejects reserved endpoint and invalid block inputs before persistence when structurally invalid", async () => {
    const { service, repository } = setup();
    await expect(service.createRelation(actor, projectId, { expectedStructuralVersion: 1, source: { type: "MANUSCRIPT_BLOCK", id: sourceId }, target: { type: "STORY_CHANGE", id: targetId }, relationType: "CAUSES" }, "req")).rejects.toBeDefined();
    expect(repository.createRelation).not.toHaveBeenCalled();
  });
});
