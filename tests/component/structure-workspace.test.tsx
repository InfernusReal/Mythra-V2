import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StructureOverview } from "@/domains/structure/application/ports";
import { StructureWorkspace } from "@/components/structure/StructureWorkspace";
import { emptyMilestones } from "@/tests/fixtures/milestones";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const id = (suffix: string) => `00000000-0000-4000-8000-${suffix.padStart(12, "0")}`;
const model: StructureOverview = {
  project: { id: id("1"), title: "Project", structuralVersion: 7, activeChapterId: id("5") },
  plot: { id: id("2"), title: "Plot", summary: null, version: 1, outlineId: id("3") },
  volumes: [{ id: id("4"), plotId: id("2"), sequenceIndex: 0, displayNumber: "1", title: "Volume", targetWords: null, hardTargetWordsEnabled: false, version: 1, outlineId: null, chapterCount: 1 }],
  chapterOutlines: [{ id: id("6"), chapterId: id("5"), volumeId: id("4"), sequenceIndex: 0, title: "Outline", plainText: "", purpose: null, emotionalMovement: null, targetWords: null, hardTargetWordsEnabled: false, isPlaceholder: false, version: 1, sceneCount: 0 }],
  chapters: [{ id: id("5"), volumeId: id("4"), volumeSequenceIndex: 0, sequenceIndex: 0, displayNumber: "1", title: "Chapter", outlineId: id("6"), sceneCount: 0 }],
  scenes: [], entityArcs: [], references: [], intents: [],
  viewState: { mode: "DISCOVERY", activeLens: "OUTLINE", expandedIds: [], activeAnchorType: null, activeAnchorId: null, cursorOffset: null, selectionAnchor: null, selectionHead: null, scrollTop: null, pinIds: [] },
  lenses: ["OUTLINE", "VOLUMES", "CHAPTERS", "MILESTONES", "CAUSAL", "RELATIONSHIPS", "SEMANTIC_ZOOM"],
  page: { pageSize: 100, nodeBudget: 200, edgeBudget: 300, rangeStart: 0, nextRangeStart: null, returnedNodes: 4, returnedEdges: 0, hasMoreNodes: false, hasMoreEdges: false }
};

afterEach(() => { vi.restoreAllMocks(); refresh.mockReset(); });

describe("StructureWorkspace", () => {
  it("registers the S5 Milestones and S6 Causal lenses in original-gate order", () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: {} }), { status: 200 }));
    render(<StructureWorkspace initialModel={model} initialMilestones={emptyMilestones} />);
    expect(screen.getByRole("navigation", { name: "Structure lenses" })).toBeVisible();
    for (const label of ["Outline", "Volumes", "Chapters", "Milestones", "Causal", "Relationships", "Semantic Zoom"]) expect(screen.getByRole("button", { name: label })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Causal" })); expect(screen.getByRole("heading", { name: "Because and consequence" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Return to writing" })).toHaveAttribute("href", `/app/chapters/${id("5")}`);
  });

  it("switches presentation and lens without changing canonical objects", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: {} }), { status: 200 }));
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    render(<StructureWorkspace initialModel={model} initialMilestones={emptyMilestones} />);
    fireEvent.change(screen.getByLabelText("Presentation mode"), { target: { value: "ARCHITECT" } });
    fireEvent.click(screen.getByRole("button", { name: "Semantic Zoom" }));
    expect(screen.getByTestId("semantic-zoom-lens")).toBeVisible();
    expect(screen.getByText("PLOT OUTLINE")).toBeVisible();
    expect(screen.getByText("CHAPTER OUTLINE")).toBeVisible();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy.mock.calls.flat().join("\n")).toContain("S4-UI-001");
    expect(consoleSpy.mock.calls.flat().join("\n")).toContain("S4-UI-002");
  });

  it("persists expansion state through the view-state endpoint", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: {} }), { status: 200 }));
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    render(<StructureWorkspace initialModel={model} initialMilestones={emptyMilestones} />);
    fireEvent.click(screen.getByRole("button", { name: "Expand" }));
    expect(screen.getByText(/Order 1/)).toBeVisible();
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining("/view-state"), expect.objectContaining({ method: "PUT" }));
  });
});
