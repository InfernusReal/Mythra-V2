import { Editor } from "@tiptap/core";
import Paragraph from "@tiptap/extension-paragraph";
import StarterKit from "@tiptap/starter-kit";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditorSearchBridge } from "@/components/language/EditorSearchBridge";
import { SearchPeek } from "@/components/search/SearchPeek";
import { SearchResultGroups } from "@/components/search/SearchResultGroups";
import { SearchWorkspace } from "@/components/search/SearchWorkspace";
import type { SearchReadModel } from "@/domains/search/domain/types";
import {
  SEARCH_EDITOR_ACTION,
  SEARCH_EDITOR_RESULT,
} from "@/lib/search/editor-events";

const projectId = "a0000000-0000-4000-8000-000000000001";
const chapterId = "a0000000-0000-4000-8000-000000000002";
const blockId = "a0000000-0000-4000-8000-000000000003";
const model: SearchReadModel = {
  projectId,
  projectStructuralVersion: 4,
  providerStates: [
    { type: "CHAPTER", state: "ACTIVE" },
    { type: "NOTE", state: "DEPENDENCY_UNAVAILABLE" },
  ],
  synchronized: {
    insertedOrUpdated: 1,
    removed: 0,
    sourceCount: 1,
    capped: false,
  },
  page: { returned: 1, limit: 60, nextCursor: null, total: 1 },
  groups: [
    {
      type: "CHAPTER",
      label: "Chapters",
      total: 1,
      hasMore: false,
      results: [
        {
          id: "a0000000-0000-4000-8000-000000000004",
          documentType: "CHAPTER",
          sourceId: chapterId,
          sourceKey: `CHAPTER:${chapterId}:${blockId}`,
          blockId,
          title: "Arrival",
          snippet: "The private manuscript excerpt.",
          sourceVersion: 2,
          sourceUpdatedAt: new Date().toISOString(),
          indexedAt: new Date().toISOString(),
          freshness: "CURRENT",
          rank: 1000,
          matchReasons: ["exact", "current_context"],
          explicitReference: false,
          currentContext: true,
          actions: [
            { kind: "PEEK", label: "Peek" },
            { kind: "COPY", label: "Copy" },
          ],
          metadata: { href: `/app/chapters/${chapterId}` },
        },
      ],
    },
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Search and Language UI", () => {
  it("debounces universal search, groups results and opens a history-preserving Peek", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ data: model }) }),
    );
    render(
      <SearchWorkspace projectId={projectId} returnChapterId={chapterId} />,
    );
    await userEvent.type(screen.getByRole("textbox"), "Arrival");
    expect(
      await screen.findByRole("heading", { name: "Chapters" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("The private manuscript excerpt."),
    ).toBeInTheDocument();
    const historyLength = window.history.length;
    await userEvent.click(screen.getByRole("button", { name: "Peek" }));
    expect(screen.getByRole("dialog", { name: "Arrival" })).toBeInTheDocument();
    expect(window.history.length).toBe(historyLength);
  });
  it("replaces a selection in one editor transaction and preserves native undo", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            data: {
              state: "READY",
              term: "good",
              normalizedTerm: "good",
              locale: "en",
              saved: false,
              antonyms: ["bad"],
              senses: [
                {
                  partOfSpeech: "adjective",
                  definition: "of high quality",
                  nuance: "adj.all",
                  synonyms: ["excellent"],
                  examples: [],
                },
              ],
            },
          }),
        }),
    );
    const BlockParagraph = Paragraph.extend({
      addAttributes() {
        return { blockId: { default: blockId } };
      },
    });
    const editor = new Editor({
      extensions: [StarterKit.configure({ paragraph: false }), BlockParagraph],
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            attrs: { blockId },
            content: [{ type: "text", text: "good path" }],
          },
        ],
      },
    });
    render(
      <EditorSearchBridge
        editor={editor}
        projectId={projectId}
        chapterId={chapterId}
        hardStop={null}
      />,
    );
    editor.commands.setTextSelection({ from: 1, to: 5 });
    expect(
      await screen.findByRole("button", { name: "excellent" }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "excellent" }));
    expect(editor.getText()).toBe("excellent path");
    expect(editor.commands.undo()).toBe(true);
    expect(editor.getText()).toBe("good path");
    editor.destroy();
  });
  it("blocks a replacement that exceeds the author's explicit hard stop", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            data: {
              state: "READY",
              term: "good",
              normalizedTerm: "good",
              locale: "en",
              saved: false,
              antonyms: [],
              senses: [
                {
                  partOfSpeech: "adjective",
                  definition: "quality",
                  nuance: null,
                  synonyms: ["extraordinary"],
                  examples: [],
                },
              ],
            },
          }),
        }),
    );
    const BlockParagraph = Paragraph.extend({
      addAttributes() {
        return { blockId: { default: blockId } };
      },
    });
    const editor = new Editor({
      extensions: [StarterKit.configure({ paragraph: false }), BlockParagraph],
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            attrs: { blockId },
            content: [{ type: "text", text: "good path" }],
          },
        ],
      },
    });
    render(
      <EditorSearchBridge
        editor={editor}
        projectId={projectId}
        chapterId={chapterId}
        hardStop={10}
      />,
    );
    editor.commands.setTextSelection({ from: 1, to: 5 });
    await userEvent.click(
      await screen.findByRole("button", { name: "extraordinary" }),
    );
    expect(editor.getText()).toBe("good path");
    expect(
      screen.getByText(/explicit 10-character limit/u),
    ).toBeInTheDocument();
    editor.destroy();
  });
  it("discards stale search responses", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    let resolveFirst!: (value: unknown) => void;
    const first = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(first)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            ...model,
            groups: [
              {
                ...model.groups[0]!,
                results: [{ ...model.groups[0]!.results[0]!, title: "Second" }],
              },
            ],
          },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);
    render(<SearchWorkspace projectId={projectId} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "First" } });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fireEvent.change(input, { target: { value: "Second" } });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    resolveFirst({ ok: true, json: async () => ({ data: model }) });
    expect(await screen.findByText("Second")).toBeInTheDocument();
  });
  it("executes bounded result actions and relays editor actions without navigation", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    const actionResult = {
      ...model.groups[0]!.results[0]!,
      actions: [
        { kind: "PEEK" as const, label: "Peek" },
        { kind: "OPEN" as const, label: "Open" },
        { kind: "COPY" as const, label: "Copy" },
        {
          kind: "WHY" as const,
          label: "Why does this happen?",
          endpointType: "STORY_CHANGE",
          endpointId: projectId,
        },
        {
          kind: "DEPENDS" as const,
          label: "What depends on this?",
          endpointType: "STORY_CHANGE",
          endpointId: projectId,
        },
        { kind: "ATTACH_REFERENCE" as const, label: "Attach to chapter" },
        { kind: "INSERT_REFERENCE" as const, label: "Insert reference" },
        { kind: "JUMP_TO_BLOCK" as const, label: "Jump to block", blockId },
      ],
      metadata: {
        referenceTargetType: "CHAPTER",
        referenceTargetId: chapterId,
      },
    };
    const actionModel = {
      ...model,
      groups: [{ ...model.groups[0]!, results: [actionResult] }],
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) =>
      String(input).includes("/search/causal")
        ? {
            ok: true,
            json: async () => ({
              data: {
                language: "POTENTIALLY_AFFECTED",
                paths: [],
                nodeCount: 1,
                edgeCount: 0,
              },
            }),
          }
        : {
            ok: true,
            json: async () => ({
              data: { object: { id: projectId }, projectStructuralVersion: 5 },
            }),
          },
    );
    vi.stubGlobal("fetch", fetchMock);
    const editorActions: string[] = [];
    window.addEventListener(
      SEARCH_EDITOR_ACTION,
      (event) =>
        editorActions.push(
          (event as CustomEvent<{ action: string }>).detail.action,
        ),
      { once: false },
    );
    const onPeek = vi.fn();
    render(
      <>
        <div className="editor-prose" />
        <SearchResultGroups
          model={actionModel}
          projectId={projectId}
          chapterId={chapterId}
          onPeek={onPeek}
        />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Peek" }));
    expect(onPeek).toHaveBeenCalledWith(actionResult);
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
    await userEvent.click(
      screen.getByRole("button", { name: "Why does this happen?" }),
    );
    expect(await screen.findByText("Potentially affected")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    await userEvent.click(
      screen.getByRole("button", { name: "What depends on this?" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/search/causal"),
      expect.anything(),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Attach to chapter" }),
    );
    expect(
      await screen.findByText("Result attached to chapter context."),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: "Insert reference" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Jump to block" }),
    );
    expect(editorActions).toEqual(["INSERT_REFERENCE", "JUMP_TO_BLOCK"]);
    window.dispatchEvent(
      new CustomEvent(SEARCH_EDITOR_RESULT, {
        detail: {
          action: "INSERT_REFERENCE",
          ok: true,
          message: "Editor action complete.",
          projectStructuralVersion: 6,
        },
      }),
    );
    expect(await screen.findByText("Editor action complete.")).toBeVisible();
  });
  it("reports unavailable result actions when chapter or reference coordinates are absent", async () => {
    const result = {
      ...model.groups[0]!.results[0]!,
      actions: [
        { kind: "ATTACH_REFERENCE" as const, label: "Attach to chapter" },
        { kind: "INSERT_REFERENCE" as const, label: "Insert reference" },
      ],
      metadata: {},
    };
    const minimalModel = {
      ...model,
      groups: [{ ...model.groups[0]!, results: [result] }],
    };
    const { rerender } = render(
      <SearchResultGroups
        model={minimalModel}
        projectId={projectId}
        onPeek={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Attach to chapter" }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Open a chapter");
    rerender(
      <SearchResultGroups
        model={minimalModel}
        projectId={projectId}
        chapterId={chapterId}
        onPeek={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Attach to chapter" }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("cannot be attached");
    await userEvent.click(
      screen.getByRole("button", { name: "Insert reference" }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Return to the chapter editor",
    );
  });
  it("saves and removes vocabulary and rejects invalid selection/action coordinates", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) =>
        String(input).includes("/vocabulary")
          ? {
              ok: true,
              json: async () => ({
                data: {
                  saved: JSON.parse(String(init?.body)).action === "SAVE",
                },
              }),
            }
          : {
              ok: true,
              json: async () => ({
                data: {
                  state: "READY",
                  term: "good",
                  normalizedTerm: "good",
                  locale: "en",
                  saved: false,
                  antonyms: [],
                  senses: [
                    {
                      partOfSpeech: "adjective",
                      definition: "quality",
                      nuance: null,
                      synonyms: ["sound"],
                      examples: [],
                    },
                  ],
                },
              }),
            },
    );
    vi.stubGlobal("fetch", fetchMock);
    const BlockParagraph = Paragraph.extend({
      addAttributes() {
        return { blockId: { default: blockId } };
      },
    });
    const editor = new Editor({
      extensions: [StarterKit.configure({ paragraph: false }), BlockParagraph],
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            attrs: { blockId },
            content: [
              { type: "text", text: "good one two three four five six" },
            ],
          },
        ],
      },
    });
    render(
      <EditorSearchBridge
        editor={editor}
        projectId={projectId}
        chapterId={chapterId}
        hardStop={null}
      />,
    );
    editor.commands.setTextSelection({ from: 1, to: 5 });
    await userEvent.click(
      await screen.findByRole("button", { name: "Save vocabulary" }),
    );
    expect(
      await screen.findByRole("button", {
        name: "Remove from saved vocabulary",
      }),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: "Remove from saved vocabulary" }),
    );
    expect(
      await screen.findByRole("button", { name: "Save vocabulary" }),
    ).toBeVisible();
    const messages: string[] = [];
    const onResult = (event: Event) =>
      messages.push((event as CustomEvent<{ message: string }>).detail.message);
    window.addEventListener(SEARCH_EDITOR_RESULT, onResult);
    act(() =>
      window.dispatchEvent(
        new CustomEvent(SEARCH_EDITOR_ACTION, {
          detail: {
            action: "JUMP_TO_BLOCK",
            result: { ...model.groups[0]!.results[0]!, blockId: "missing" },
            projectStructuralVersion: 4,
          },
        }),
      ),
    );
    expect(messages.at(-1)).toMatch(/no longer available/u);
    act(() =>
      window.dispatchEvent(
        new CustomEvent(SEARCH_EDITOR_ACTION, {
          detail: {
            action: "INSERT_REFERENCE",
            result: { ...model.groups[0]!.results[0]!, metadata: {} },
            projectStructuralVersion: 4,
          },
        }),
      ),
    );
    expect(messages.at(-1)).toMatch(/cannot be referenced/u);
    window.removeEventListener(SEARCH_EDITOR_RESULT, onResult);
    editor.commands.setTextSelection({
      from: 1,
      to: editor.state.doc.content.size - 1,
    });
    expect(await screen.findByText(/at most six words/u)).toBeVisible();
    editor.destroy();
  });
  it("degrades dictionary states independently and permits dismissal without changing prose", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const responses = [
      {
        ok: true,
        data: {
          state: "UNAVAILABLE",
          term: "good",
          normalizedTerm: "good",
          locale: "en",
          saved: false,
          senses: [],
          antonyms: [],
          message: "Dictionary data is temporarily unavailable.",
        },
      },
      {
        ok: true,
        data: {
          state: "NOT_FOUND",
          term: "path",
          normalizedTerm: "path",
          locale: "en",
          saved: false,
          senses: [],
          antonyms: [],
          message: "No deterministic dictionary entry was found.",
        },
      },
      { ok: false, error: { message: "Language lookup is unavailable." } },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => {
        const next = responses.shift()!;
        return {
          ok: next.ok,
          json: async () =>
            next.data ? { data: next.data } : { error: next.error },
        };
      }),
    );
    const BlockParagraph = Paragraph.extend({
      addAttributes() {
        return { blockId: { default: blockId } };
      },
    });
    const editor = new Editor({
      extensions: [StarterKit.configure({ paragraph: false }), BlockParagraph],
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            attrs: { blockId },
            content: [{ type: "text", text: "good path remains" }],
          },
        ],
      },
    });
    render(
      <EditorSearchBridge
        editor={editor}
        projectId={projectId}
        chapterId={chapterId}
        hardStop={null}
      />,
    );
    editor.commands.setTextSelection({ from: 1, to: 5 });
    expect(
      await screen.findByText(
        "Dictionary data is temporarily unavailable. Writing remains available.",
      ),
    ).toBeVisible();
    editor.commands.setTextSelection({ from: 6, to: 10 });
    expect(
      await screen.findByText("No deterministic dictionary entry was found."),
    ).toBeVisible();
    editor.commands.setTextSelection({ from: 11, to: 18 });
    expect(
      await screen.findByText("Language lookup is unavailable."),
    ).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(
      screen.queryByRole("complementary", { name: "Language" }),
    ).not.toBeInTheDocument();
    expect(editor.getText()).toBe("good path remains");
    editor.destroy();
  });
  it("reports Search transport failure, clears transient state and renders an empty Peek fallback", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: false,
          json: async () => ({ error: { message: "Search failed safely." } }),
        }),
    );
    const { rerender } = render(<SearchWorkspace projectId={projectId} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "failure" } });
    expect(await screen.findByText("Search is unavailable.")).toBeVisible();
    fireEvent.change(input, { target: { value: "" } });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Enter a project term",
    );
    rerender(
      <SearchPeek
        result={{
          ...model.groups[0]!.results[0]!,
          snippet: "",
          matchReasons: [],
        }}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("No text preview.")).toBeVisible();
    expect(screen.getByText("Current")).toBeVisible();
  });
  it("does nothing when Language has no mounted editor", () => {
    const { container } = render(
      <EditorSearchBridge
        editor={null}
        projectId={projectId}
        chapterId={chapterId}
        hardStop={null}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
  it("contains failures inside individual Search result actions", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error("clipboard denied")),
      },
    });
    const failed = {
      ...model.groups[0]!.results[0]!,
      actions: [
        { kind: "WHY" as const, label: "Why unavailable" },
        {
          kind: "DEPENDS" as const,
          label: "Depends unavailable",
          endpointType: "STORY_CHANGE",
          endpointId: projectId,
        },
        { kind: "COPY" as const, label: "Copy" },
        { kind: "ATTACH_REFERENCE" as const, label: "Attach" },
      ],
      metadata: {
        referenceTargetType: "CHAPTER",
        referenceTargetId: chapterId,
      },
    };
    const failedModel = {
      ...model,
      groups: [{ ...model.groups[0]!, results: [failed] }],
    };
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: false,
          json: async () => ({
            error: { message: "Bounded action unavailable." },
          }),
        }),
    );
    render(
      <SearchResultGroups
        model={failedModel}
        projectId={projectId}
        chapterId={chapterId}
        onPeek={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Why does this happen?" }),
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "What depends on this?" }),
    );
    expect(
      await screen.findByText("Causal context is unavailable."),
    ).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(
      await screen.findByText("Copy could not be completed."),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: "Attach to chapter" }),
    );
    expect(
      await screen.findByText("Result could not be attached."),
    ).toBeVisible();
  });
});
