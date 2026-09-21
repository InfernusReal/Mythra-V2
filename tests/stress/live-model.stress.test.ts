import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";
import { runDeterministicAutomations } from "@/domains/live-model/domain/automation";
import { buildDurableDirective, buildDurableSemanticCoordinate, canReplaceProjection, projectionCandidate } from "@/domains/live-model/domain/projections";

describe("Live Story Model stress budgets", () => {
  it("evaluates 10,000 chapters and 2,000 milestones deterministically within a bounded CPU budget", () => {
    const chapters = Array.from({ length: 10_000 }, (_, index) => ({ id: `chapter-${String(index).padStart(5, "0")}`, sequenceIndex: index, volumeId: index % 20 ? `volume-${index % 20}` : null, wordCount: 1_000, targetWords: 1_500, status: index % 4 ? "DRAFT" : "FINAL", updatedAt: new Date("2026-08-30T00:00:00.000Z") }));
    const milestones = Array.from({ length: 2_000 }, (_, index) => ({ id: `milestone-${String(index).padStart(4, "0")}`, targetChapterStart: index * 5, targetChapterEnd: index * 5 + 4, status: "IN_PROGRESS", linkedChapterIds: [`chapter-${String(index * 5).padStart(5, "0")}`] }));
    const input = { projectStructuralVersion: 99, chapters, milestones, referenceCounts: {}, captureCounts: {}, causalNodeCount: 100_000, causalEdgeCount: 100_000, snapshotProviderAvailable: false, lastVerifiedSnapshotAt: null, now: new Date("2026-08-30T00:00:00.000Z") };
    const started = process.cpuUsage(); const first = runDeterministicAutomations(input); const consumed = process.cpuUsage(started); const durationCpuMs = (consumed.user + consumed.system) / 1_000; const second = runDeterministicAutomations(input);
    expect(second).toEqual(first); expect(first.writingQueue).toHaveLength(7_500); expect(first.structureRebalancePreview).toHaveLength(10_000); expect(durationCpuMs).toBeLessThan(5_000);
  });

  it("caps directive collections and preserves the ruled coordinate under high input density", () => {
    const items = Array.from({ length: 25_000 }, (_, index) => ({ id: `item-${String(index).padStart(5, "0")}`, label: `Label ${index}`, rank: index % 100, provenance: { sourceType: "STORY_REFERENCE", sourceId: `source-${index}`, sourceVersion: 1 } }));
    const directive = buildDurableDirective({ projectStructuralVersion: 5, chapterId: "chapter", sourceObjectVersions: { chapter: 5 }, generatedAt: "2026-08-30T00:00:00.000Z", freshness: "FRESH", purposeItems: items, becauseItems: items, consequenceItems: items, rankedContextItems: items });
    expect(directive.purpose).toEqual(directive.purposeItems[0]); expect(directive.purposeItems).toHaveLength(8); expect(directive.becauseItems).toHaveLength(8); expect(directive.consequenceItems).toHaveLength(8); expect(directive.rankedContextItems).toHaveLength(8);
    const coordinate = buildDurableSemanticCoordinate({ projectId: "project", projectStructuralVersion: 5, plotId: "plot", plotOutlineId: "plot-outline", volumeId: "volume", volumeOutlineId: "volume-outline", milestoneThreadIds: Array.from({ length: 1_000 }, (_, index) => `thread-${index}`), chapterOutlineId: "outline", chapterId: "chapter", sceneId: "scene", storyChangeId: "change", blockId: "block" });
    expect(coordinate.ancestorPath).toHaveLength(10); expect(coordinate.crossCuttingMilestoneThreadIds).toHaveLength(1_000); expect(coordinate.ancestorPath.some((item) => item.level === "MILESTONE_THREAD")).toBe(false);
  });

  it("rejects 100,000 stale candidates without accepting an older source version", () => {
    const current = { projectStructuralVersion: 10, sourceObjectVersions: { chapter: 10 } }; const started = performance.now(); let rejected = 0;
    for (let index = 0; index < 100_000; index += 1) { const candidate = projectionCandidate({ kind: "CHAPTER_CONTEXT", scopeType: "CHAPTER", scopeId: `chapter-${index}`, projectStructuralVersion: 10, sourceObjectVersions: { chapter: 9 }, payload: { index }, freshness: "FRESH", generatedAt: new Date("2026-08-30T00:00:00.000Z") }); if (!canReplaceProjection(current, candidate)) rejected += 1; }
    expect(rejected).toBe(100_000); expect(performance.now() - started).toBeLessThan(4_000);
  });
});
