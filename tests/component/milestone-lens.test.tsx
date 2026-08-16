import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MilestoneLens } from "@/components/structure/MilestoneLens";
import type { MilestoneOverview } from "@/domains/milestones/application/ports";
import type { StructureOverview } from "@/domains/structure/application/ports";

const id = (value: number) => `00000000-0000-4000-8000-${value.toString().padStart(12, "0")}`;
const structure = {
  project: { id: id(1), title: "Project", structuralVersion: 7, activeChapterId: id(4) }, plot: null, volumes: [], chapterOutlines: [],
  chapters: [{ id: id(4), volumeId: null, volumeSequenceIndex: null, sequenceIndex: 0, displayNumber: "1", title: "Chapter one", outlineId: null, sceneCount: 0 }], scenes: [], references: [], intents: [],
  viewState: { mode: "DISCOVERY", activeLens: "MILESTONES", expandedIds: [], activeAnchorType: null, activeAnchorId: null, cursorOffset: null, selectionAnchor: null, selectionHead: null, scrollTop: null, pinIds: [] },
  lenses: ["OUTLINE", "VOLUMES", "CHAPTERS", "MILESTONES", "CAUSAL", "RELATIONSHIPS", "SEMANTIC_ZOOM"],
  page: { pageSize: 100, nodeBudget: 200, edgeBudget: 300, rangeStart: 0, nextRangeStart: null, returnedNodes: 1, returnedEdges: 0, hasMoreNodes: false, hasMoreEdges: false }
} satisfies StructureOverview;
const milestones: MilestoneOverview = {
  milestones: [{ id: id(2), sequenceIndex: 0, title: "Opening turn", description: "Private", threadLabel: "Main", targetChapterStart: 0, targetChapterEnd: 2, targetWords: 3_000, targetDate: "2026-09-01", status: "PLANNED", isPlaceholder: false, version: 1, progress: .5, progressComplete: true, linkedChapterCount: 1 }],
  links: [{ id: id(3), chapterId: id(4), milestoneId: id(2), role: "DEVELOP", customRole: null, weight: 1, version: 1 }], dependencies: [],
  page: { nodeBudget: 200, edgeBudget: 300, progressEdgeBudget: 20_000, returnedNodes: 1, returnedEdges: 1, hasMoreNodes: false, hasMoreEdges: false, hasMoreProgressEdges: false }
};

afterEach(() => vi.restoreAllMocks());

describe("MilestoneLens", () => {
  it("renders ordered ranges, dependency alternative and chapter matrix", () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    render(<MilestoneLens structure={structure} model={milestones} onChanged={vi.fn()} />);
    expect(screen.getByRole("progressbar", { name: "Opening turn progress" })).toHaveAttribute("value", "0.5");
    fireEvent.click(screen.getByRole("button", { name: "Dependencies" }));
    expect(screen.getByText("No milestone dependencies.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Chapter matrix" }));
    expect(screen.getByText(/Opening turn: develop/)).toBeVisible();
  });

  it("submits role links and previews then applies a reviewed scaffold", async () => {
    const changed = vi.fn(); const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => new Response(JSON.stringify({ data: String(url).endsWith("/preview") ? { expectedStructuralVersion: 7, allocations: [{ sequenceIndex: 0, chapterStart: 1, chapterEnd: 1, targetWords: null, targetDate: null }], placeholderCount: 1, planToken: "a".repeat(64), warnings: [] } : {} }), { status: 200 }));
    render(<MilestoneLens structure={structure} model={milestones} onChanged={changed} />);
    fireEvent.click(screen.getByRole("button", { name: "Assign role" }));
    await waitFor(() => expect(changed).toHaveBeenCalledOnce());
    fireEvent.change(screen.getByLabelText("Milestones"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Chapters"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview allocation" }));
    expect(await screen.findByRole("dialog", { name: "Review milestone allocation" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Apply reviewed allocation" }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(3));
    expect(consoleSpy.mock.calls.flat().join("\n")).toContain("S5-UI-007");
  });

  it("reports API failures without discarding the form", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: { message: "Version conflict" } }), { status: 409 }));
    render(<MilestoneLens structure={structure} model={milestones} onChanged={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "New milestone" } });
    fireEvent.click(screen.getByRole("button", { name: "Create milestone" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Version conflict");
  });

  it("opens existing milestones for full-field editing and supports custom roles", async () => {
    const changed = vi.fn(); vi.spyOn(console, "log").mockImplementation(() => undefined);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(JSON.stringify({ data: {} }), { status: 200 }));
    render(<MilestoneLens structure={structure} model={milestones} onChanged={changed} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("heading", { name: "Edit milestone" })).toBeVisible();
    expect(screen.getByLabelText("Title")).toHaveValue("Opening turn");
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save milestone" }));
    await waitFor(() => expect(changed).toHaveBeenCalledOnce());
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "CUSTOM" } });
    fireEvent.change(screen.getByLabelText("Custom role"), { target: { value: "Echo" } });
    fireEvent.click(screen.getByRole("button", { name: "Assign role" }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(changed).toHaveBeenCalledTimes(2));
    expect(String(fetchSpy.mock.calls[0]?.[1]?.body)).toContain('"milestoneId"');
    expect(String(fetchSpy.mock.calls[1]?.[1]?.body)).toContain('"customRole":"Echo"');
  });
});
