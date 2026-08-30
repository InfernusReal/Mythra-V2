import { describe, expect, it } from "vitest";
import { buildDurableDirective, buildDurableSemanticCoordinate, canReplaceProjection, projectionCandidate, semanticCoordinateOrder } from "@/domains/live-model/domain/projections";

describe("Live Story Model projection contracts", () => {
  const generatedAt = new Date("2026-08-29T00:00:00.000Z");
  const provenance = { sourceType: "CAUSAL_RELATION", sourceId: "relation", sourceVersion: 3 };

  it("keeps Because and Consequences explicit with complete provenance and stable ordering", () => {
    const directive = buildDurableDirective({ projectStructuralVersion: 9, chapterId: "chapter", sourceObjectVersions: { chapter: 4, relation: 3 }, generatedAt: generatedAt.toISOString(), freshness: "FRESH", becauseItems: [{ id: "because:b", label: "B", rank: 8, provenance }, { id: "because:a", label: "A", rank: 9, provenance }], consequenceItems: [{ id: "consequence", label: "C", rank: 10, provenance }] });
    expect(directive.becauseItems.map((item) => item.id)).toEqual(["because:a", "because:b"]);
    expect(directive.consequenceItems[0]?.provenance).toEqual(provenance);
    expect(directive).toMatchObject({ projectStructuralVersion: 9, chapterId: "chapter", sourceObjectVersions: { chapter: 4, relation: 3 }, purpose: null, freshness: "FRESH" });
  });

  it("locks the outline-aware coordinate while milestones remain cross-cutting", () => {
    const coordinate = buildDurableSemanticCoordinate({ projectId: "project", projectStructuralVersion: 11, plotId: "plot", plotOutlineId: "plot-outline", volumeId: "volume", volumeOutlineId: "volume-outline", milestoneThreadIds: ["thread"], chapterOutlineId: "chapter-outline", chapterId: "chapter", sceneId: "scene", storyChangeId: "change", blockId: "block" });
    expect(coordinate.orderedPath.map((item) => item.level)).toEqual([...semanticCoordinateOrder]);
    expect(coordinate.ancestorPath.some((item) => item.level === "MILESTONE_THREAD")).toBe(false);
    expect(coordinate.activeAnchor).toMatchObject({ level: "BLOCK", id: "block" });
  });

  it("rejects older structural and source versions so stale work cannot replace current state", () => {
    const candidate = projectionCandidate({ kind: "CHAPTER_CONTEXT", scopeType: "CHAPTER", scopeId: "chapter", projectStructuralVersion: 5, sourceObjectVersions: { chapter: 3 }, payload: {}, freshness: "FRESH", generatedAt });
    expect(canReplaceProjection({ projectStructuralVersion: 6, sourceObjectVersions: { chapter: 3 } }, candidate)).toBe(false);
    expect(canReplaceProjection({ projectStructuralVersion: 5, sourceObjectVersions: { chapter: 4 } }, candidate)).toBe(false);
    expect(canReplaceProjection({ projectStructuralVersion: 5, sourceObjectVersions: { chapter: 2 } }, candidate)).toBe(true);
    expect(candidate.digest).toMatch(/^[0-9a-f]{64}$/u);
  });

  it("keeps semantic digests stable when operational generation provenance changes", () => {
    const base = { kind: "NARRATIVE_DIRECTIVE" as const, scopeType: "CHAPTER", scopeId: "chapter", projectStructuralVersion: 5, sourceObjectVersions: { chapter: 3 }, freshness: "FRESH" as const };
    const first = projectionCandidate({ ...base, payload: { generatedAt: "2026-08-29T00:00:00.000Z", purposeItems: [] }, generatedAt });
    const second = projectionCandidate({ ...base, payload: { generatedAt: "2026-08-30T00:00:00.000Z", purposeItems: [] }, generatedAt: new Date("2026-08-30T00:00:00.000Z") });
    expect(second.digest).toBe(first.digest);
    expect(second.payload.generatedAt).not.toBe(first.payload.generatedAt);
  });
});
