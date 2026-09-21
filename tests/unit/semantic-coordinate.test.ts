import { describe, expect, it } from "vitest";
import { buildSemanticCoordinate, moveSemanticZoom, orderedAvailableSemanticLevels, resolveSemanticZoomLevel, semanticLadder } from "@/domains/structure/domain/semantic-coordinate";

describe("ruled Semantic Coordinate", () => {
  it("preserves the exact outline-aware ladder and cross-cutting milestone relevance", () => {
    const result = buildSemanticCoordinate({
      projectId: "project",
      plotId: "plot",
      plotOutlineId: "plot-outline",
      volumeId: "volume",
      volumeOutlineId: "volume-outline",
      milestoneThreadIds: ["milestone", "milestone"],
      chapterOutlineId: "chapter-outline",
      chapterId: "chapter",
      sceneId: "scene",
      proseAnchor: { blockId: "paragraph", selectionAnchor: 2, selectionHead: 5 }
    });
    expect(result.orderedPath.map((step) => step.level)).toEqual([...semanticLadder]);
    expect(result.orderedPath.find((step) => step.level === "MILESTONE_THREAD")?.relationship).toBe("RELEVANCE");
    expect(result.ancestorPath.some((step) => step.level === "MILESTONE_THREAD")).toBe(false);
    expect(result.plotOutlineId).toBe("plot-outline");
    expect(result.volumeOutlineId).toBe("volume-outline");
    expect(result.activeLevel).toBe("PROSE");
  });

  it("skips every absent optional level and permits prose-first chapters", () => {
    const result = buildSemanticCoordinate({ projectId: "project", chapterId: "chapter", proseAnchor: { blockId: "body" } });
    expect(result.orderedPath.map((step) => step.level)).toEqual(["SERIES_PROJECT", "CHAPTER", "PROSE"]);
    expect(result.plotOutlineId).toBeNull();
    expect(result.volumeOutlineId).toBeNull();
  });

  it("does not treat Chapter Outline as a prerequisite for Chapter", () => {
    expect(buildSemanticCoordinate({ projectId: "p", plotId: "plot", volumeId: "v", chapterId: "c" }).orderedPath.map((step) => step.level))
      .toEqual(["SERIES_PROJECT", "PLOT", "VOLUME", "CHAPTER"]);
  });

  it("moves reversibly through only available levels in canonical order", () => {
    const levels = orderedAvailableSemanticLevels(["PROSE", "PLOT", "CHAPTER", "SERIES_PROJECT", "PLOT", "SCENE"]);
    expect(levels).toEqual(["SERIES_PROJECT", "PLOT", "CHAPTER", "SCENE", "PROSE"]);
    expect(moveSemanticZoom(levels, "CHAPTER", "OUT")).toBe("PLOT");
    expect(moveSemanticZoom(levels, "PLOT", "IN")).toBe("CHAPTER");
    expect(moveSemanticZoom(levels, "SERIES_PROJECT", "OUT")).toBe("SERIES_PROJECT");
    expect(moveSemanticZoom(levels, "PROSE", "IN")).toBe("PROSE");
    expect(resolveSemanticZoomLevel(["SERIES_PROJECT", "VOLUME", "CHAPTER"], "VOLUME_OUTLINE")).toBe("VOLUME");
  });
});
