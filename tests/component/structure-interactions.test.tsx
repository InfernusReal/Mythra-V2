import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BulkScaffold } from "@/components/structure/BulkScaffold";
import { ChapterPlanningGrid } from "@/components/structure/ChapterPlanningGrid";
import { OutlineLens } from "@/components/structure/OutlineLens";
import { RelationshipLens } from "@/components/structure/RelationshipLens";
import { SemanticZoomViewport } from "@/components/structure/SemanticZoomViewport";
import { VolumeLane } from "@/components/structure/VolumeLane";
import type { StructureOverview } from "@/domains/structure/application/ports";
import { emptyMilestones } from "@/tests/fixtures/milestones";

const id = (suffix: string) => `00000000-0000-4000-8000-${suffix.padStart(12, "0")}`;
const model: StructureOverview = {
  project: { id: id("1"), title: "Project", structuralVersion: 7, activeChapterId: id("5") },
  plot: { id: id("2"), title: "Plot", summary: "Summary", version: 1, outlineId: id("3") },
  volumes: [
    { id: id("4"), plotId: id("2"), sequenceIndex: 0, displayNumber: "1", title: "Volume one", targetWords: 10_000, hardTargetWordsEnabled: false, version: 1, outlineId: id("7"), chapterCount: 1 },
    { id: id("8"), plotId: id("2"), sequenceIndex: 1, displayNumber: "2", title: "Volume two", targetWords: null, hardTargetWordsEnabled: false, version: 1, outlineId: null, chapterCount: 0 }
  ],
  chapterOutlines: [{ id: id("6"), chapterId: id("5"), volumeId: id("4"), sequenceIndex: 0, title: "Outline", plainText: "Outline body", purpose: null, emotionalMovement: null, targetWords: null, hardTargetWordsEnabled: false, isPlaceholder: false, version: 1, sceneCount: 1 }],
  chapters: [{ id: id("5"), volumeId: id("4"), volumeSequenceIndex: 0, sequenceIndex: 0, displayNumber: "1", title: "Chapter", outlineId: id("6"), sceneCount: 1 }],
  scenes: [{ id: id("9"), chapterId: id("5"), chapterOutlineId: id("6"), sequenceIndex: 0, title: "Scene", purpose: null, provenanceType: "OUTLINE_BLOCK", provenanceSourceId: id("6"), provenanceBlockId: "block-1", version: 1 }],
  references: [{ id: id("10"), sourceType: "CHAPTER", sourceId: id("5"), sourceBlockId: null, targetType: "CHAPTER_OUTLINE", targetId: id("6"), targetBlockId: null, relationshipKey: "references", provenanceType: "DIRECT", version: 1 }],
  intents: [{ id: id("11"), targetType: "PLOT", targetId: id("2"), blockId: null, category: "TENSION", customCategory: null, version: 1 }],
  viewState: { mode: "DISCOVERY", activeLens: "OUTLINE", expandedIds: [], activeAnchorType: null, activeAnchorId: null, cursorOffset: null, selectionAnchor: null, selectionHead: null, scrollTop: null, pinIds: [] },
  lenses: ["OUTLINE", "VOLUMES", "CHAPTERS", "MILESTONES", "CAUSAL", "RELATIONSHIPS", "SEMANTIC_ZOOM"],
  page: { pageSize: 100, nodeBudget: 200, edgeBudget: 300, rangeStart: 0, nextRangeStart: null, returnedNodes: 8, returnedEdges: 1, hasMoreNodes: false, hasMoreEdges: false }
};

const success = (data: unknown = {}) => Promise.resolve(new Response(JSON.stringify({ data }), { status: 200 }));
const failure = (message: string) => Promise.resolve(new Response(JSON.stringify({ error: { message } }), { status: 409 }));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Structure interaction surfaces", () => {
  it("requires a scaffold preview and applies its exact returned token", async () => {
    const changed = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => success({ planToken: "a".repeat(64), expectedStructuralVersion: 7, allocations: [{ sequenceIndex: 0, chapterStart: 1, chapterEnd: 4, chapterCount: 4, advisoryTargetWords: 90_000 }], placeholderCount: 4, warnings: ["Advisory only"] }))
      .mockImplementationOnce(() => success({ projectStructuralVersion: 8 }));
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    render(<BulkScaffold projectId={model.project.id} structuralVersion={7} onApplied={changed} />);
    fireEvent.change(screen.getByLabelText("Volumes"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Chapter count"), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview scaffold" }));
    const dialog = await screen.findByRole("dialog", { name: "Scaffold preview" });
    expect(dialog).toHaveTextContent("Advisory only");
    fireEvent.click(within(dialog).getByRole("button", { name: "Apply reviewed scaffold" }));
    await waitFor(() => expect(changed).toHaveBeenCalledOnce());
    expect(fetchSpy.mock.calls[1]?.[1]?.body).toContain("a".repeat(64));
  });

  it("reports scaffold preview failures and permits cancellation", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() => failure("Preview conflict")).mockImplementationOnce(() => success({ planToken: "b".repeat(64), expectedStructuralVersion: 7, allocations: [], placeholderCount: 0, warnings: [] }));
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    render(<BulkScaffold projectId={model.project.id} structuralVersion={7} onApplied={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Advisory project words"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview scaffold" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Preview conflict");
    fireEvent.click(screen.getByRole("button", { name: "Preview scaffold" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("covers plot, outline, reparent and scene conversion writes", async () => {
    const changed = vi.fn();
    vi.spyOn(globalThis, "fetch").mockImplementation(() => success());
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    render(<OutlineLens model={model} expandedIds={[]} onExpanded={vi.fn()} onChanged={changed} />);
    fireEvent.change(screen.getByLabelText("Plot title"), { target: { value: "Edited" } });
    fireEvent.click(screen.getByRole("button", { name: "Save plot inline" }));
    await waitFor(() => expect(changed).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByLabelText("Freeform plot outline"), { target: { value: "Plot outline" } });
    fireEvent.click(screen.getByRole("button", { name: "Save plot outline inline" }));
    await waitFor(() => expect(changed).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole("button", { name: "Edit inline" }));
    fireEvent.change(screen.getByLabelText("Freeform outline"), { target: { value: "Edited outline" } });
    fireEvent.click(screen.getByRole("button", { name: "Save outline inline" }));
    await waitFor(() => expect(changed).toHaveBeenCalledTimes(3));
    fireEvent.click(screen.getByRole("button", { name: "Promote to project" }));
    await waitFor(() => expect(changed).toHaveBeenCalledTimes(4));
    fireEvent.change(screen.getByLabelText("Stable block ID"), { target: { value: "block-2" } });
    fireEvent.change(screen.getByLabelText("Scene outline"), { target: { value: "Scene content" } });
    fireEvent.click(screen.getByRole("button", { name: "Previewed conversion: create scene" }));
    await waitFor(() => expect(changed).toHaveBeenCalledTimes(5));
  });

  it("surfaces outline write failures without emitting private content", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => failure("Write rejected"));
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    render(<OutlineLens model={model} expandedIds={[id("6")]} onExpanded={vi.fn()} onChanged={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Plot title"), { target: { value: "Private payload" } });
    fireEvent.click(screen.getByRole("button", { name: "Save plot inline" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Write rejected");
    expect(consoleSpy.mock.calls.flat().join("\n")).not.toContain("Private payload");
    fireEvent.click(screen.getByRole("button", { name: "Collapse" }));
  });

  it("creates and edits volumes, writes outlines, then previews and applies reorder", async () => {
    const changed = vi.fn();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => success())
      .mockImplementationOnce(() => success())
      .mockImplementationOnce(() => success({ orderedIds: [id("8"), id("4")], renumbered: [{ id: id("8"), from: 1, to: 0 }] }))
      .mockImplementationOnce(() => success());
    render(<VolumeLane model={model} onChanged={changed} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Edit inline" })[0]!);
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Updated volume" } });
    fireEvent.click(screen.getByRole("button", { name: "Save volume inline" }));
    await waitFor(() => expect(changed).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByLabelText("Freeform volume outline"), { target: { value: "Outline" } });
    fireEvent.click(screen.getByRole("button", { name: "Save volume outline inline" }));
    await waitFor(() => expect(changed).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole("button", { name: "Preview moving last first" }));
    const dialog = await screen.findByRole("dialog", { name: "Renumber preview" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Apply reorder" }));
    await waitFor(() => expect(changed).toHaveBeenCalledTimes(3));
  });

  it("reports volume failures and cancels reorder preview", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() => failure("Volume rejected")).mockImplementationOnce(() => success({ orderedIds: [id("8"), id("4")], renumbered: [] }));
    render(<VolumeLane model={model} onChanged={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Create volume" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Volume rejected");
    fireEvent.click(screen.getByRole("button", { name: "Preview moving last first" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("assigns and clears prose-first chapter membership", async () => {
    const changed = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => success());
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    render(<ChapterPlanningGrid model={model} onChanged={changed} />);
    fireEvent.change(screen.getByLabelText("Volume for Chapter"), { target: { value: "" } });
    await waitFor(() => expect(changed).toHaveBeenCalledOnce());
    expect(fetchSpy.mock.calls[0]?.[1]?.body).toContain('"volumeId":null');
  });

  it("assigns a chapter to a volume and surfaces membership failure", async () => {
    const changed = vi.fn();
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() => success()).mockImplementationOnce(() => failure("Membership rejected"));
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const unassigned = { ...model, chapters: [{ ...model.chapters[0]!, volumeId: null, volumeSequenceIndex: null }] };
    render(<ChapterPlanningGrid model={unassigned} onChanged={changed} />);
    fireEvent.change(screen.getByLabelText("Volume for Chapter"), { target: { value: id("4") } });
    await waitFor(() => expect(changed).toHaveBeenCalledOnce());
    fireEvent.change(screen.getByLabelText("Volume for Chapter"), { target: { value: "" } });
    expect(await screen.findByRole("alert")).toHaveTextContent("Membership rejected");
  });

  it("creates non-causal references and renders bounded existing references", async () => {
    const changed = vi.fn();
    vi.spyOn(globalThis, "fetch").mockImplementation(() => success());
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    render(<RelationshipLens model={model} onChanged={changed} />);
    fireEvent.change(screen.getByLabelText("Source type"), { target: { value: "PLOT" } });
    fireEvent.change(screen.getByLabelText("Source ID"), { target: { value: id("2") } });
    fireEvent.change(screen.getByLabelText("Target ID"), { target: { value: id("6") } });
    fireEvent.change(screen.getByLabelText("Relationship key"), { target: { value: "supports" } });
    fireEvent.click(screen.getByRole("button", { name: "Create reference" }));
    await waitFor(() => expect(changed).toHaveBeenCalledOnce());
    expect(screen.getByText((_, element) => element?.tagName === "STRONG" && element.textContent === "CHAPTER → CHAPTER_OUTLINE")).toBeVisible();
  });

  it("renders optional empty states and reference errors", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => failure("Reference rejected"));
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const empty = { ...model, plot: null, volumes: [], chapterOutlines: [], chapters: [], scenes: [], references: [], intents: [] };
    const { rerender } = render(<ChapterPlanningGrid model={empty} onChanged={vi.fn()} />);
    expect(screen.getByText(/Structure does not block writing/)).toBeVisible();
    rerender(<VolumeLane model={empty} onChanged={vi.fn()} />);
    expect(screen.getByText(/Create a plot/)).toBeVisible();
    expect(screen.getByText(/No volumes/)).toBeVisible();
    rerender(<RelationshipLens model={empty} onChanged={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Source ID"), { target: { value: id("2") } });
    fireEvent.change(screen.getByLabelText("Target ID"), { target: { value: id("6") } });
    fireEvent.click(screen.getByRole("button", { name: "Create reference" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Reference rejected");
    expect(screen.getByText(/relationship dashboard is not required/)).toBeVisible();
  });

  it("creates a first plot and blocks demotion when no volume exists", async () => {
    const changed = vi.fn();
    vi.spyOn(globalThis, "fetch").mockImplementation(() => success());
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const noPlot = { ...model, plot: null, volumes: [], chapterOutlines: [{ ...model.chapterOutlines[0]!, volumeId: null }] };
    render(<OutlineLens model={noPlot} expandedIds={[]} onExpanded={vi.fn()} onChanged={changed} />);
    fireEvent.change(screen.getByLabelText("Summary"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Create plot inline" }));
    await waitFor(() => expect(changed).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole("button", { name: "Demote to first volume" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Create a volume");
  });

  it("changes semantic anchors and submits paragraph-selection custom intent", async () => {
    const anchored = vi.fn(); const changed = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => success());
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    render(<SemanticZoomViewport model={model} milestones={emptyMilestones} onAnchor={anchored} onChanged={changed} />);
    fireEvent.change(screen.getByLabelText("Active chapter"), { target: { value: id("5") } });
    fireEvent.change(screen.getByLabelText("Target type"), { target: { value: "PARAGRAPH_SELECTION" } });
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "CUSTOM" } });
    fireEvent.change(screen.getByLabelText("Custom category"), { target: { value: "Voice" } });
    fireEvent.change(screen.getByLabelText("Stable block ID"), { target: { value: "block-1" } });
    fireEvent.change(screen.getByLabelText("Selection start"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Selection end"), { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText("Intent"), { target: { value: "Private intent" } });
    fireEvent.click(screen.getByRole("button", { name: "Save intent" }));
    await waitFor(() => expect(changed).toHaveBeenCalledOnce());
    expect(anchored).toHaveBeenCalledWith("CHAPTER", id("5"));
    expect(fetchSpy.mock.calls[0]?.[1]?.body).toContain('"selectionAnchor":2');
  });

  it("handles project-only zoom and failed ordinary intent", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => failure("Intent rejected"));
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const empty = { ...model, plot: null, volumes: [], chapterOutlines: [], chapters: [], scenes: [], intents: [] };
    const { rerender } = render(<SemanticZoomViewport model={empty} milestones={emptyMilestones} onAnchor={vi.fn()} onChanged={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Save intent" })).toBeDisabled();
    rerender(<SemanticZoomViewport model={model} milestones={emptyMilestones} onAnchor={vi.fn()} onChanged={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Target type"), { target: { value: "SCENE" } });
    fireEvent.change(screen.getByLabelText("Intent"), { target: { value: "Private" } });
    fireEvent.click(screen.getByRole("button", { name: "Save intent" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Intent rejected");
    expect(screen.getByText(/1 intent targets/)).toBeVisible();
  });
});
