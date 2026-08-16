import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/contracts/errors";
import { validateCausalChronology } from "@/domains/causality/domain/chronology";
import { CausalEndpointRegistry, reservedAdapter, type CausalEndpointAdapter, type ResolvedCausalEndpoint } from "@/domains/causality/domain/endpoint-registry";
import { assertHardRequiresInvariant, traverseCausalGraph, wouldCreateForbiddenHardRequiresCycle, type CausalEdge } from "@/domains/causality/domain/graph";
import { causalRelationLifecycleSchema, causalRelationWriteSchema, endpointSchema, storyChangeWriteSchema, traversalQuerySchema, type CausalEndpoint } from "@/domains/causality/domain/types";

const id = () => randomUUID();
const change = (value = id()): CausalEndpoint => ({ type: "STORY_CHANGE", id: value });
const resolved = (endpoint: CausalEndpoint, storyTime: number | null, discoveryTime: number | null): ResolvedCausalEndpoint => ({ endpoint, projectId: id(), label: "safe", archived: false, storyTime, discoveryTime });
const edge = (source: CausalEndpoint, target: CausalEndpoint, overrides: Partial<CausalEdge> = {}): CausalEdge => ({ id: id(), source, target, relationType: "CAUSES", state: "ACTIVE", isHard: false, temporalProgression: false, mutualStateSemantics: false, provenanceType: "DIRECT", provenanceNote: null, ...overrides });

describe("causality domain", () => {
  it("accepts exact endpoint and relation vocabulary and enforces block/self/hard rules", () => {
    const chapterId = id(), blockId = id();
    expect(endpointSchema.parse({ type: "MANUSCRIPT_BLOCK", id: chapterId, blockId })).toEqual({ type: "MANUSCRIPT_BLOCK", id: chapterId, blockId });
    expect(() => endpointSchema.parse({ type: "MANUSCRIPT_BLOCK", id: chapterId })).toThrow();
    expect(() => endpointSchema.parse({ type: "MILESTONE", id: chapterId, blockId })).toThrow();
    expect(() => causalRelationWriteSchema.parse({ expectedStructuralVersion: 1, source: change(chapterId), target: change(chapterId), relationType: "CAUSES" })).toThrow();
    expect(() => causalRelationWriteSchema.parse({ expectedStructuralVersion: 1, source: change(), target: change(), relationType: "CAUSES", isHard: true })).toThrow();
    expect(causalRelationWriteSchema.parse({ expectedStructuralVersion: 1, source: change(), target: change(), relationType: "REQUIRES", isHard: true, temporalProgression: true }).temporalProgression).toBe(true);
  });

  it("validates Story Change revelation/anchor rules and lifecycle choices", () => {
    expect(storyChangeWriteSchema.parse({ expectedStructuralVersion: 1, kind: "EVENT", title: "Change", isPlaceholder: false }).kind).toBe("EVENT");
    expect(() => storyChangeWriteSchema.parse({ expectedStructuralVersion: 1, kind: "REVELATION", title: "Reveal", storyTime: 1 })).toThrow();
    expect(() => storyChangeWriteSchema.parse({ expectedStructuralVersion: 1, kind: "EVENT", title: "Loop", anchor: change() })).toThrow();
    expect(causalRelationLifecycleSchema.parse({ action: "RETIRE", expectedStructuralVersion: 1, relationId: id() }).action).toBe("RETIRE");
    expect(causalRelationLifecycleSchema.parse({ action: "REATTACH", expectedStructuralVersion: 1, relationId: id(), source: change(), target: change() }).action).toBe("REATTACH");
    const same = change(); expect(() => causalRelationLifecycleSchema.parse({ action: "REATTACH", expectedStructuralVersion: 1, relationId: id(), source: same, target: same })).toThrow();
  });

  it("registers all active/reserved adapters and rejects unavailable capability consistently", async () => {
    const active = ["MILESTONE", "CHAPTER_OUTLINE", "SCENE", "NARRATIVE_INTENT", "MANUSCRIPT_BLOCK", "STORY_CHANGE"] as const;
    const adapters = active.map((type): CausalEndpointAdapter => ({ type, availability: "ACTIVE", async resolve(projectId, endpoint) { return { endpoint, projectId, label: type, archived: false, storyTime: null, discoveryTime: null }; } }));
    const registry = new CausalEndpointRegistry([...adapters, reservedAdapter("TIMELINE_EVENT"), reservedAdapter("ENTITY_STATE"), reservedAdapter("CAPTURE_DERIVED")]);
    expect(registry.availability("SCENE")).toBe("ACTIVE"); expect(registry.availability("TIMELINE_EVENT")).toBe("RESERVED");
    await expect(registry.resolve(id(), { type: "TIMELINE_EVENT", id: id() })).rejects.toMatchObject({ code: "DEPENDENCY_UNAVAILABLE", status: 503 });
    expect(() => new CausalEndpointRegistry(adapters)).toThrow("Missing causal endpoint adapter");
    expect(() => new CausalEndpointRegistry([...adapters, adapters[0]!, reservedAdapter("TIMELINE_EVENT"), reservedAdapter("ENTITY_STATE"), reservedAdapter("CAPTURE_DERIVED")])).toThrow("Duplicate");
  });

  it("rejects non-semantic hard requires cycles but permits explicit progression or mutual state", () => {
    const a = change(), b = change(), c = change(); const existing = [edge(a, b, { relationType: "REQUIRES", isHard: true }), edge(b, c, { relationType: "REQUIRES", isHard: true })];
    const candidate = edge(c, a, { relationType: "REQUIRES", isHard: true });
    expect(wouldCreateForbiddenHardRequiresCycle(existing, candidate)).toBe(true); expect(() => assertHardRequiresInvariant(existing, candidate)).toThrow(AppError);
    expect(wouldCreateForbiddenHardRequiresCycle(existing, { ...candidate, temporalProgression: true })).toBe(false);
    expect(wouldCreateForbiddenHardRequiresCycle(existing, { ...candidate, mutualStateSemantics: true })).toBe(false);
    expect(wouldCreateForbiddenHardRequiresCycle(existing, { ...candidate, state: "TENTATIVE" })).toBe(false);
    expect(() => wouldCreateForbiddenHardRequiresCycle([...existing, ...Array.from({ length: 5_000 }, () => existing[0]!)], candidate)).toThrowError(expect.objectContaining({ code: "DEPENDENCY_UNAVAILABLE" }));
  });

  it("traverses direct edges first with complete provenance and explicit truncation", () => {
    const a = change(), b = change(), c = change(), d = change(); const edges = [edge(a, b, { provenanceType: "CHAPTER_PROSE", provenanceNote: "selected block" }), edge(b, c), edge(c, d)];
    const result = traverseCausalGraph(edges, a, { direction: "DOWNSTREAM", maxDepth: 3, nodeBudget: 4, edgeBudget: 3, pathBudget: 3 });
    expect(result.paths.map((path) => path.depth)).toEqual([1, 2, 3]); expect(result.paths[1]?.steps.map((step) => step.relationId)).toEqual([edges[0]!.id, edges[1]!.id]); expect(result.paths[0]?.steps[0]?.provenanceType).toBe("CHAPTER_PROSE");
    expect(traverseCausalGraph(edges, a, { direction: "DOWNSTREAM", maxDepth: 8, nodeBudget: 2, edgeBudget: 2, pathBudget: 1 }).truncated).toBe(true);
    expect(traverseCausalGraph(edges, d, { direction: "UPSTREAM", maxDepth: 1, nodeBudget: 10, edgeBudget: 10, pathBudget: 10 }).paths[0]?.endpoint).toEqual(c);
  });

  it("uses story time normally, discovery time for reveals, and remains neutral without anchors", () => {
    const a = change(), b = change();
    expect(validateCausalChronology(resolved(a, 2, null), resolved(b, 1, null), "CAUSES")).toMatchObject({ status: "WARNING", basis: "STORY_TIME", warnings: [{ code: "CAUSE_AFTER_EFFECT" }] });
    expect(validateCausalChronology(resolved(a, null, 2), resolved(b, null, 1), "REVEALS")).toMatchObject({ status: "WARNING", basis: "DISCOVERY_TIME", warnings: [{ code: "REVEAL_BEFORE_DISCOVERY" }] });
    expect(validateCausalChronology(resolved(a, null, null), resolved(b, null, null), "CAUSES")).toEqual({ status: "INSUFFICIENT_INFORMATION", warnings: [], basis: "NONE" });
    expect(validateCausalChronology(resolved(a, 1, null), resolved(b, 2, null), "CAUSES").status).toBe("CONSISTENT");
  });

  it("clamps traversal schema to declared exact ceilings", () => {
    const parsed = traversalQuerySchema.parse({ endpointType: "STORY_CHANGE", endpointId: id(), direction: "BOTH", states: ["ACTIVE", "TENTATIVE"], maxDepth: 12, nodeBudget: 500, edgeBudget: 750, pathBudget: 500 });
    expect(parsed).toMatchObject({ maxDepth: 12, nodeBudget: 500, edgeBudget: 750, pathBudget: 500 });
    expect(() => traversalQuerySchema.parse({ endpointType: "STORY_CHANGE", endpointId: id(), nodeBudget: 501 })).toThrow();
  });
});
