import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Editor } from "@tiptap/core";
import { RelevantNow } from "@/components/context/RelevantNow";
import { PeekOverlay } from "@/components/context/PeekOverlay";
import {
  CausalContextCard,
  ChapterOutlineCard,
  ExistingReferenceCard,
  MilestoneContextCard,
  NarrativeIntentCard,
  contextCardRegistry,
} from "@/components/context/ContextCards";
import type {
  ContextFieldDescriptor,
  NarrativeDirectiveProjection,
} from "@/domains/context/domain/types";
import { useFocusPreservingOverlay } from "@/lib/editor/use-focus-preserving-overlay";

const id = (value: number) =>
  `30000000-0000-4000-8000-${value.toString().padStart(12, "0")}`;
const source = { type: "CAUSAL" as const, id: id(1), version: 1 };
const directive: NarrativeDirectiveProjection = {
  chapterId: id(2),
  chapterVersion: 2,
  projectStructuralVersion: 8,
  freshnessVersion: 8,
  stale: false,
  disabled: false,
  purposeItems: [
    {
      id: "purpose",
      text: "Purpose value",
      source: { type: "CHAPTER_OUTLINE", id: id(3), version: 1 },
      peekDescriptorId: `CHAPTER_OUTLINE:${id(3)}`,
      rank: 100,
    },
  ],
  advanceItems: [
    {
      id: "advance",
      text: "Advance value",
      source: { type: "MILESTONE", id: id(4), version: 1 },
      peekDescriptorId: `MILESTONE:${id(4)}`,
      rank: 80,
    },
  ],
  preserveItems: [
    {
      id: "preserve",
      text: "Preserve value",
      source: { type: "NARRATIVE_INTENT", id: id(5), version: 1 },
      peekDescriptorId: `NARRATIVE_INTENT:${id(5)}`,
      rank: 70,
    },
  ],
  readerOutcomeItems: [
    {
      id: "outcome",
      text: "Outcome value",
      source: { type: "NARRATIVE_INTENT", id: id(6), version: 1 },
      peekDescriptorId: `NARRATIVE_INTENT:${id(6)}`,
      rank: 70,
    },
  ],
  nextItems: [
    {
      id: "next",
      text: "Next value",
      source: { type: "NARRATIVE_INTENT", id: id(7), version: 1 },
      peekDescriptorId: `NARRATIVE_INTENT:${id(7)}`,
      rank: 60,
    },
  ],
  relevantContextItems: [
    {
      id: "context",
      text: "Context value",
      source: { type: "REFERENCE", id: id(8), version: 1 },
      peekDescriptorId: `REFERENCE:${id(8)}`,
      rank: 50,
    },
  ],
  becauseItems: [
    {
      id: "because",
      text: "Because value",
      source,
      peekDescriptorId: `CAUSAL:${id(1)}`,
      rank: 90,
    },
  ],
  consequenceItems: [
    {
      id: "consequence",
      text: "Consequence value",
      source,
      peekDescriptorId: `CAUSAL:${id(1)}`,
      rank: 90,
    },
  ],
};

afterEach(() => vi.restoreAllMocks());

describe("Contextual Writing Field components", () => {
  it("renders every directive collection, including explicit Because and Consequences", () => {
    const peek = vi.fn();
    render(<RelevantNow directive={directive} onPeek={peek} />);
    for (const heading of [
      "Purpose",
      "Advance",
      "Preserve",
      "Reader outcome",
      "Next",
      "Relevant context",
      "Because",
      "Consequences",
    ])
      expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Because value" }));
    expect(peek).toHaveBeenCalledWith(`CAUSAL:${id(1)}`);
  });

  it("exposes renderers through canonical S11 Timeline, Note and Research", () => {
    expect(Object.keys(contextCardRegistry)).toEqual([
      "CHAPTER_OUTLINE",
      "MILESTONE",
      "CAUSAL",
      "REFERENCE",
      "NARRATIVE_INTENT",
      "CAPTURE",
      "ENTITY",
      "SEARCH",
      "LANGUAGE",
      "TIMELINE",
      "NOTE",
      "RESEARCH",
    ]);
  });

  it("renders card-specific metadata and the disabled directive state", () => {
    const descriptor = (
      type: ContextFieldDescriptor["type"],
      payload: Record<string, unknown>,
    ): ContextFieldDescriptor => ({
      id: `${type}:${id(20)}`,
      type,
      priority: 1,
      source: { type, id: id(20), version: 1 },
      title: type,
      summary: `${type} summary`,
      payload,
      actions: [],
      freshnessVersion: 1,
      pinnable: true,
      pinned: false,
      stale: false,
      reason: "CHAPTER",
    });
    const { rerender } = render(
      <ChapterOutlineCard
        descriptor={descriptor("CHAPTER_OUTLINE", {
          emotionalMovement: "calm to alarm",
        })}
      />,
    );
    expect(screen.getByText("Movement: calm to alarm")).toBeVisible();
    rerender(
      <MilestoneContextCard
        descriptor={descriptor("MILESTONE", { role: "TURN" })}
      />,
    );
    expect(screen.getByText("Role: Turn")).toBeVisible();
    rerender(
      <CausalContextCard
        descriptor={{
          ...descriptor("CAUSAL", {
            direction: "DOWNSTREAM",
            relationType: "CAUSES",
          }),
          summary: "Archive opened",
        }}
      />,
    );
    expect(screen.getByText("Causes: Archive opened")).toBeVisible();
    expect(screen.getByText("Direct consequence")).toBeVisible();
    rerender(
      <ExistingReferenceCard
        descriptor={descriptor("REFERENCE", { targetType: "MILESTONE" })}
      />,
    );
    expect(screen.getByText("Milestone")).toBeVisible();
    rerender(
      <NarrativeIntentCard
        descriptor={descriptor("NARRATIVE_INTENT", { category: "TENSION" })}
      />,
    );
    expect(screen.getByText("Tension")).toBeVisible();
    rerender(
      <RelevantNow
        directive={{ ...directive, disabled: true }}
        onPeek={vi.fn()}
      />,
    );
    expect(screen.getByText("Disabled for this project.")).toBeVisible();
  });

  it("expands indirect causal context only after an explicit bounded action", async () => {
    const descriptor: ContextFieldDescriptor = {
      id: `CAUSAL:${id(1)}`,
      type: "CAUSAL",
      priority: 550,
      source,
      title: "Because",
      summary: "ENABLES: Archive opened",
      payload: { direction: "UPSTREAM" },
      actions: [
        {
          type: "WHY_NOW",
          label: "Why now?",
          endpointType: "STORY_CHANGE",
          endpointId: id(9),
        },
        {
          type: "WHAT_CHANGES",
          label: "What changes?",
          endpointType: "STORY_CHANGE",
          endpointId: id(9),
        },
      ],
      freshnessVersion: 8,
      pinnable: true,
      pinned: false,
      stale: false,
      reason: "CURSOR",
    };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            root: {
              type: "STORY_CHANGE",
              id: id(9),
              label: "Root",
              archived: false,
            },
            paths: [
              {
                endpoint: {
                  type: "STORY_CHANGE",
                  id: id(10),
                  label: "Effect",
                  archived: false,
                },
                direction: "UPSTREAM",
                depth: 2,
                steps: [
                  {
                    relationId: id(11),
                    relationType: "CAUSES",
                    from: { type: "STORY_CHANGE", id: id(9) },
                    to: { type: "STORY_CHANGE", id: id(10) },
                    provenanceType: "DIRECT",
                    provenanceNote: null,
                  },
                ],
              },
            ],
            nodeCount: 2,
            edgeCount: 1,
            truncated: false,
            language: "POTENTIALLY_AFFECTED",
          },
        }),
        { status: 200 },
      ),
    );
    render(
      <PeekOverlay
        descriptor={descriptor}
        projectId={id(12)}
        structuralVersion={8}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onIntentional={vi.fn()}
      />,
    );
    expect(screen.queryByText(/depth 2/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Why now?" }));
    expect(await screen.findByText(/depth 2/)).toBeVisible();
    expect(fetchSpy.mock.calls[0]?.[0]).toContain("maxDepth=4");
    expect(fetchSpy.mock.calls[0]?.[0]).toContain("nodeBudget=50");
  });

  it("reports a failed explicit causal trace without closing Peek", async () => {
    const descriptor: ContextFieldDescriptor = {
      id: `CAUSAL:${id(31)}`,
      type: "CAUSAL",
      priority: 1,
      source,
      title: "Consequence",
      summary: "CAUSES: alarm",
      payload: { direction: "DOWNSTREAM" },
      actions: [
        {
          type: "WHAT_CHANGES",
          label: "What changes?",
          endpointType: "MANUSCRIPT_BLOCK",
          endpointId: id(32),
          blockId: id(33),
        },
      ],
      freshnessVersion: 8,
      pinnable: true,
      pinned: false,
      stale: true,
      reason: "PEEK",
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ error: { message: "Trace temporarily unavailable" } }),
        { status: 503 },
      ),
    );
    render(
      <PeekOverlay
        descriptor={descriptor}
        projectId={id(34)}
        structuralVersion={8}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onIntentional={vi.fn()}
      />,
    );
    expect(screen.getByText("Stale")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "What changes?" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Causal trace is unavailable.",
    );
    expect(screen.getByRole("dialog")).toBeVisible();
  });

  it("commits an editable source and exposes intentional deviation", async () => {
    const descriptor: ContextFieldDescriptor = {
      id: `CHAPTER_OUTLINE:${id(40)}`,
      type: "CHAPTER_OUTLINE",
      priority: 1,
      source: { type: "CHAPTER_OUTLINE", id: id(40), version: 1 },
      title: "Outline",
      summary: "Original purpose",
      payload: {},
      actions: [],
      freshnessVersion: 8,
      pinnable: true,
      pinned: false,
      stale: false,
      reason: "CHAPTER",
    };
    const edit = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn();
    const intentional = vi.fn();
    render(
      <PeekOverlay
        descriptor={descriptor}
        projectId={id(41)}
        structuralVersion={8}
        onClose={close}
        onEdit={edit}
        onIntentional={intentional}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Mark intentional" }));
    expect(intentional).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Edit source" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Author source" }), {
      target: { value: "Revised purpose" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save source" }));
    await waitFor(() =>
      expect(edit).toHaveBeenCalledWith(descriptor, "Revised purpose"),
    );
    expect(close).toHaveBeenCalledOnce();
  });

  it("captures and restores the exact selection, focus, scroll, and unchanged route", async () => {
    const setTextSelection = vi.fn();
    const focus = vi.fn();
    const selection = { from: 7, to: 15 };
    const editor = {
      state: { selection },
      commands: { setTextSelection, focus },
    } as unknown as Editor;
    const scroll = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => undefined);
    Object.defineProperty(window, "scrollX", { configurable: true, value: 4 });
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 222,
    });
    window.history.replaceState(null, "", "/app/chapters/example?mode=write");
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const { result } = renderHook(() => useFocusPreservingOverlay(editor));
    act(() => {
      result.current.capture();
      selection.from = 1;
      selection.to = 1;
      result.current.restore();
    });
    await waitFor(() => expect(focus).toHaveBeenCalled());
    expect(setTextSelection).toHaveBeenCalledWith({ from: 7, to: 15 });
    expect(scroll).toHaveBeenCalledWith(4, 222);
    expect(`${window.location.pathname}${window.location.search}`).toBe(
      "/app/chapters/example?mode=write",
    );
  });
});
