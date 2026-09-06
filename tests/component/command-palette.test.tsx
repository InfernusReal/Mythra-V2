import "fake-indexeddb/auto";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { ThemeProvider } from "@/components/theming/ThemeProvider";
import { QuickCaptureOverlay } from "@/components/capture/QuickCaptureOverlay";
import { CausalComposer } from "@/components/editor/CausalComposer";
import { ProjectCreator } from "@/components/projects/ProjectCreator";
import { PortabilityPanel } from "@/components/portability/PortabilityPanel";
import { registerCommandHandlers, notifyCommandContextChanged } from "@/lib/commands/runtime";
import { commandHistoryKey, readCommandHistory, recordCommandUse } from "@/lib/commands/ranking";
import { dispatchMobileWritingAction } from "@/lib/editor/mobile-actions";
import { emptyCausality } from "@/tests/fixtures/causality";
import type { SearchReadModel } from "@/domains/search/domain/types";
import type { Editor } from "@tiptap/core";

const route = vi.hoisted(() => ({ pathname: "/app", push: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname, useRouter: () => ({ push: route.push }) }));
const projectId = "b0000000-0000-4000-8000-000000000001";
const chapterId = "b0000000-0000-4000-8000-000000000002";
const blockId = "b0000000-0000-4000-8000-000000000003";
const resultKey = `CHAPTER:${chapterId}`;
const searchModel: SearchReadModel = { projectId, projectStructuralVersion: 4, providerStates: [], synchronized: { insertedOrUpdated: 0, removed: 0, sourceCount: 1, capped: false }, page: { returned: 1, limit: 40, nextCursor: null, total: 1 }, groups: [{ type: "CHAPTER", label: "Chapters", total: 1, hasMore: false, results: [{ id: chapterId, sourceId: chapterId, sourceKey: resultKey, documentType: "CHAPTER", blockId: null, title: "Save checkpoint", snippet: "Private manuscript text", sourceVersion: 1, sourceUpdatedAt: "2026-09-05T00:00:00Z", indexedAt: "2026-09-05T00:00:00Z", freshness: "CURRENT", rank: 1000, explicitReference: false, currentContext: false, matchReasons: ["exact"], actions: [{ kind: "PEEK", label: "Peek" }, { kind: "COPY", label: "Copy" }], metadata: {} }] }] };
const disposals: Array<() => void> = [];
const envelope = (data: unknown) => ({ ok: true, json: async () => ({ data }) });
const openPalette = () => fireEvent.keyDown(window, { key: "k", ctrlKey: true });
const input = () => screen.getByRole("textbox", { name: "Search commands and project objects" });
const rows = () => [...screen.getByRole("list", { name: "Commands and project objects" }).children].map((row) => row.getAttribute("data-palette-key"));
function Palette({ children, chapter = true }: { children?: React.ReactNode; chapter?: boolean }) {
  return <ThemeProvider><div data-search-project-id={projectId} data-search-chapter-id={chapter ? chapterId : undefined}>{children}</div><CommandPalette /></ThemeProvider>;
}

beforeEach(() => {
  route.pathname = "/app"; route.push.mockReset(); localStorage.clear();
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  vi.stubGlobal("fetch", vi.fn(async (url: RequestInfo | URL) => String(url).includes("/preferences/theme") ? envelope({ theme: "light" }) : envelope(searchModel)));
});
afterEach(() => { act(() => { while (disposals.length) disposals.pop()!(); }); vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); });

describe("S18 authoritative palette integration", () => {
  it("renders mounted registry commands and objects in one recent/contextual order", async () => {
    disposals.push(registerCommandHandlers([{ id: "editor.checkpoint", projectId, chapterId, execute: () => true }]));
    recordCommandUse(projectId, resultKey, 100);
    render(<Palette />); openPalette();
    fireEvent.change(input(), { target: { value: "save" } });
    await screen.findByRole("button", { name: "Peek" });
    expect(rows()).toEqual([resultKey, "command:editor.checkpoint"]);
    fireEvent.click(screen.getByRole("button", { name: /Save checkpointMod\+S/ }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(readCommandHistory()[0]!.key).toBe("command:editor.checkpoint"));
    openPalette(); fireEvent.change(input(), { target: { value: "save" } }); await screen.findByRole("button", { name: "Peek" });
    expect(rows()).toEqual(["command:editor.checkpoint", resultKey]);
    expect(localStorage.getItem(commandHistoryKey)).not.toContain("Private manuscript text");
    expect(localStorage.getItem(commandHistoryKey)).not.toContain("save");
  });

  it("updates selection availability and rejects a command whose handler disappears", async () => {
    let selected = false;
    const action = vi.fn();
    const dispose = registerCommandHandlers([{ id: "entity.selection", projectId, chapterId, available: () => selected, execute: action }]);
    disposals.push(dispose);
    render(<Palette />); openPalette();
    expect(screen.queryByRole("button", { name: "Create Entity from Selection" })).not.toBeInTheDocument();
    act(() => { selected = true; notifyCommandContextChanged(); });
    const command = screen.getByRole("button", { name: "Create Entity from Selection" });
    selected = false; // Execute revalidates, even if state changed after the last rendered availability snapshot.
    fireEvent.click(command);
    await screen.findByText(/no longer available/);
    expect(action).not.toHaveBeenCalled(); expect(readCommandHistory()).toEqual([]);
  });

  it("supports arrows, Enter, Escape, exact input selection, and Tab containment", async () => {
    const action = vi.fn();
    disposals.push(registerCommandHandlers([{ id: "editor.focus", projectId, chapterId, execute: action }, { id: "capture.open", projectId, execute: action }]));
    render(<Palette><label>Origin<input defaultValue="Private origin" /></label></Palette>);
    const origin = screen.getByRole("textbox", { name: "Origin" }) as HTMLInputElement;
    origin.focus(); origin.setSelectionRange(2, 7, "backward");
    openPalette(); fireEvent.keyDown(input(), { key: "ArrowDown" });
    expect(document.activeElement).toHaveAttribute("data-palette-option", "true");
    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
    expect(document.activeElement).toHaveTextContent("Quick Capture");
    fireEvent.keyDown(document.activeElement!, { key: "ArrowUp" });
    expect(document.activeElement).toHaveTextContent("Toggle Focus");
    const close = screen.getByRole("button", { name: "Close" }); close.focus();
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toHaveTextContent("Open Universe");
    fireEvent.keyDown(document.activeElement!, { key: "Tab" }); expect(close).toHaveFocus();
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(origin).toHaveFocus());
    expect([origin.selectionStart, origin.selectionEnd, origin.selectionDirection]).toEqual([2, 7, "backward"]);
    openPalette(); fireEvent.change(input(), { target: { value: "toggle focus" } });
    fireEvent.keyDown(input(), { key: "Enter" });
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    await waitFor(() => expect(origin).toHaveFocus());
  });

  it("ignores composition and wrong modifiers, including Escape during IME", () => {
    render(<Palette />);
    for (const extra of [{ isComposing: true }, { keyCode: 229 }, { altKey: true }, { shiftKey: true }]) fireEvent.keyDown(window, { key: "k", ctrlKey: true, ...extra });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    openPalette(); fireEvent.keyDown(window, { key: "Escape", isComposing: true });
    expect(screen.getByRole("dialog")).toBeVisible();
  });

  it("uses project route context while hiding chapter/selection actions off the editor", () => {
    route.pathname = `/app/projects/${projectId}/timeline`;
    render(<ThemeProvider><CommandPalette /></ThemeProvider>); openPalette();
    expect(screen.getByRole("link", { name: "Open Universe" })).toHaveAttribute("href", `/app/projects/${projectId}/universe`);
    for (const name of [/Toggle Focus/, /Save checkpoint/, /Entity from Selection/, /Peek chapter outline/]) expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
  });

  it("does not credit failed actions to history or log private errors", async () => {
    disposals.push(registerCommandHandlers([{ id: "editor.checkpoint", projectId, chapterId, execute: async () => { throw new Error("Private error payload"); } }]));
    render(<Palette />); openPalette(); fireEvent.click(screen.getByRole("button", { name: /Save checkpoint/ }));
    await screen.findByText(/no longer available/);
    expect(readCommandHistory()).toEqual([]);
    expect(vi.mocked(console.log).mock.calls.flat().join(" ")).not.toContain("Private error payload");
  });

  it("hands off to real Capture in place and traps Escape/Tab without reopening the palette", async () => {
    render(<Palette><button>Manuscript origin</button><QuickCaptureOverlay projectId={projectId} chapterId={chapterId} editor={null} /></Palette>);
    const origin = screen.getByRole("button", { name: "Manuscript origin" }); origin.focus();
    act(() => dispatchMobileWritingAction("search"));
    fireEvent.click(screen.getByRole("button", { name: /Quick Capture/ }));
    await screen.findByRole("dialog", { name: "Capture" });
    expect(screen.queryByRole("dialog", { name: "Command palette" })).not.toBeInTheDocument();
    const thought = screen.getByRole("textbox", { name: "Thought" }); thought.focus();
    fireEvent.keyDown(thought, { key: "Tab", shiftKey: true });
    expect(screen.getByRole("button", { name: "Return to Chapter" })).toHaveFocus();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.queryByRole("dialog", { name: "Command palette" })).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" }); await waitFor(() => expect(origin).toHaveFocus());
  });

  it.each([["Add cause", "BECAUSE"], ["Add consequence", "CAUSES"]])("%s opens the existing causal phrase without a canonical write", async (label, phrase) => {
    const setTextSelection = vi.fn(); const focus = vi.fn();
    const editor = { state: { selection: { from: 4, to: 9, anchor: 9, head: 4, $from: { parent: { attrs: { blockId } } } } }, commands: { setTextSelection, focus } } as unknown as Editor;
    vi.stubGlobal("fetch", vi.fn(async (url: RequestInfo | URL) => String(url).includes("/causality?") ? envelope(emptyCausality) : envelope({ theme: "light" })));
    render(<Palette><CausalComposer editor={editor} projectId={projectId} chapterId={chapterId} /></Palette>);
    openPalette(); fireEvent.click(screen.getByRole("button", { name: label }));
    await screen.findByRole("dialog", { name: "Connect this manuscript moment" });
    expect(screen.getByRole("combobox", { name: "Phrase" })).toHaveValue(phrase);
    expect(vi.mocked(fetch).mock.calls.every((call) => call[1]?.method !== "POST")).toBe(true);
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(setTextSelection).toHaveBeenCalledWith({ from: 9, to: 4 }));
  });

  it("focuses the existing project form without implicitly creating anything", async () => {
    render(<ThemeProvider><ProjectCreator /><CommandPalette /></ThemeProvider>);
    openPalette(); fireEvent.click(screen.getByRole("button", { name: "Create project" }));
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Project title" })).toHaveFocus());
    expect(vi.mocked(fetch).mock.calls.every((call) => call[1]?.method !== "POST")).toBe(true);
    expect(route.push).not.toHaveBeenCalled();
  });

  it("does not expose snapshot/export commands when the mounted panel is offline", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: RequestInfo | URL) => String(url).endsWith("/portability") ? envelope({ snapshots: [], artifacts: [], imports: [] }) : envelope({ theme: "light" })));
    render(<Palette chapter={false}><PortabilityPanel projectId={projectId} online={false} /></Palette>);
    openPalette(); const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "Create verified snapshot" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Export manuscript" })).not.toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls.every((call) => call[1]?.method !== "POST")).toBe(true);
  });

  it("preserves object Peek and successful Copy recency without content logging", async () => {
    const user = userEvent.setup();
    render(<Palette />); openPalette(); fireEvent.change(input(), { target: { value: "private" } });
    await screen.findByRole("button", { name: "Peek" });
    const copy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(copy).toHaveBeenCalledWith("Save checkpoint\nPrivate manuscript text");
    expect(readCommandHistory()[0]!.key).toBe(resultKey);
    await user.click(screen.getByRole("button", { name: "Peek" }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("dialog", { name: "Command palette" })).toBeVisible();
    expect(vi.mocked(console.log).mock.calls.flat().join(" ")).not.toContain("Private manuscript text");
  });

  it("has no serious or critical accessibility issue in the mixed surface", async () => {
    disposals.push(registerCommandHandlers([{ id: "editor.focus", projectId, chapterId, execute: () => true }]));
    const { container } = render(<Palette />); openPalette();
    const report = await axe.run(container);
    expect(report.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([]);
  });
});
