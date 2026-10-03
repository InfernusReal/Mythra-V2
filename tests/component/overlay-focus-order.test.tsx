import { act, renderHook } from "@testing-library/react";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { useFocusPreservingOverlay } from "@/lib/editor/use-focus-preserving-overlay";

const editors: Editor[] = [];
let frames: FrameRequestCallback[];
let position: { x: number; y: number };
let nativeFocus: MockInstance<(options?: FocusOptions) => void>;

beforeEach(() => {
  frames = []; position = { x: 4, y: 98 };
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(window, "scrollX", "get").mockImplementation(() => position.x);
  vi.spyOn(window, "scrollY", "get").mockImplementation(() => position.y);
  vi.spyOn(window, "scrollTo").mockImplementation((x, y) => { position = { x: Number(x), y: y ?? 0 }; });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.push(callback); return frames.length; });
  window.history.replaceState(null, "", "/app/chapters/synthetic-focus-order");
  const original = HTMLElement.prototype.focus;
  nativeFocus = vi.spyOn(HTMLElement.prototype, "focus").mockImplementation(function (this: HTMLElement, options?: FocusOptions) {
    original.call(this, options);
    // Model the browser's deferred native-focus scrolling, not a revised expected coordinate.
    if (this.isContentEditable || this.classList.contains("ProseMirror")) {
      if (!options?.preventScroll) requestAnimationFrame(() => { position.y = 536; });
    }
  });
});
afterEach(() => {
  editors.splice(0).forEach((editor) => editor.destroy());
  document.body.replaceChildren(); window.getSelection()?.removeAllRanges();
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});

function flushFrames() {
  for (let count = 0; frames.length; count++) {
    if (count >= 10) throw new Error("Unbounded focus scheduling");
    const batch = frames; frames = []; act(() => batch.forEach((callback) => callback(count)));
  }
}
function fixture(anchor = 20, head = 11) {
  const element = document.createElement("div"); document.body.append(element);
  const editor = new Editor({ element, extensions: [StarterKit], content: "<p>Synthetic writing return only.</p>" }); editors.push(editor);
  editor.commands.setTextSelection({ from: anchor, to: head }); editor.view.focus(); flushFrames();
  position = { x: 4, y: 98 }; nativeFocus.mockClear();
  const hook = renderHook(() => useFocusPreservingOverlay(editor));
  act(() => { hook.result.current.capture(); });
  const overlay = document.createElement("textarea"); document.body.append(overlay); overlay.focus({ preventScroll: true });
  return { editor, ...hook };
}

describe("separately authorized non-scrolling overlay focus order", () => {
  it.each(["Android", "iPhone", "Linux x86_64"])("retains exact writing scroll after every queued frame on %s", (platform) => {
    vi.spyOn(navigator, "platform", "get").mockReturnValue(platform);
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(platform);
    const { editor, result } = fixture(); const documentBefore = editor.getJSON();
    act(() => { result.current.restore(); }); flushFrames();
    expect(position).toEqual({ x: 4, y: 98 });
    expect(editor.view.hasFocus()).toBe(true);
    expect(editor.state.selection).toMatchObject({ anchor: 20, head: 11 });
    expect(editor.getJSON()).toEqual(documentBefore); expect(editor.commands.undo()).toBe(false);
    expect(nativeFocus.mock.calls.every(([options]) => options?.preventScroll === true)).toBe(true);
    expect(frames).toHaveLength(0);
  });
  it("proves the original mobile command's unguarded focus creates a later scroll jump", () => {
    vi.spyOn(navigator, "platform", "get").mockReturnValue("Android");
    const { editor } = fixture();
    act(() => requestAnimationFrame(() => {
      editor.commands.setTextSelection({ from: 20, to: 11 });
      editor.commands.focus(undefined, { scrollIntoView: false });
      window.scrollTo(4, 98);
    }));
    flushFrames();
    expect(position).toEqual({ x: 4, y: 536 });
    expect(nativeFocus.mock.calls.some(([options]) => !options?.preventScroll)).toBe(true);
  });
  it.each([[3, 17], [17, 3], [5, 5]])("restores native selection direction %i to %i without a document transaction", (anchor, head) => {
    const { editor, result } = fixture(anchor, head); const doc = editor.state.doc;
    const commands = editor.commands; const focus = vi.fn(commands.focus);
    vi.spyOn(editor, "commands", "get").mockReturnValue({ ...commands, focus });
    act(() => { result.current.restore(); }); flushFrames();
    expect(editor.state.selection).toMatchObject({ anchor, head });
    expect(editor.state.doc).toBe(doc); expect(position).toEqual({ x: 4, y: 98 });
    expect(focus).toHaveBeenCalledWith(undefined, { scrollIntoView: false });
  });
  it.each(["route", "destroyed"])("does not restore a stale %s target", (condition) => {
    const { editor, result } = fixture();
    act(() => { result.current.restore(); });
    if (condition === "route") window.history.replaceState(null, "", "/app/projects/other?private=excluded#excluded");
    else editor.destroy();
    position = { x: 2, y: 45 }; nativeFocus.mockClear(); flushFrames();
    expect(position).toEqual({ x: 2, y: 45 }); expect(nativeFocus).not.toHaveBeenCalled();
  });
  it("preserves non-editor focus and scroll restoration", () => {
    const link = document.createElement("a"); link.href = "#synthetic"; document.body.append(link); link.focus({ preventScroll: true });
    const { result } = renderHook(() => useFocusPreservingOverlay(null));
    act(() => { result.current.capture(); }); link.blur(); position.y = 400;
    act(() => { result.current.restore(); }); flushFrames();
    expect(document.activeElement).toBe(link); expect(position).toEqual({ x: 4, y: 98 });
  });
  it("does not schedule any restoration without a snapshot", () => {
    const { result } = renderHook(() => useFocusPreservingOverlay(null));
    act(() => { result.current.restore(); });
    expect(frames).toHaveLength(0); expect(window.scrollTo).not.toHaveBeenCalled();
  });
  it("preserves an existing undo entry rather than only an empty history", () => {
    const { editor, result } = fixture(); const original = editor.getJSON();
    editor.commands.insertContent("Synthetic edit"); editor.view.focus(); flushFrames();
    act(() => { result.current.capture(); }); editor.view.dom.blur(); const authored = editor.getJSON();
    act(() => { result.current.restore(); }); flushFrames();
    expect(editor.getJSON()).toEqual(authored);
    // jsdom has no Range layout; isolate undo's optional viewport scroll, not its real document/history transaction.
    editor.view.setProps({ handleScrollToSelection: () => true });
    expect(editor.commands.undo()).toBe(true);
    expect(editor.getJSON()).toEqual(original);
  });
  it("reports coordinates only after restoration without content, route or query telemetry", () => {
    const { result } = fixture(); act(() => { result.current.restore(); }); flushFrames();
    const entries = vi.mocked(console.log).mock.calls.map(([text]) => JSON.parse(String(text)) as Record<string, unknown>);
    const restored = entries.find((entry) => entry.step === "S7-FOCUS-002");
    expect(restored).toEqual({ level: "info", step: "S7-FOCUS-002", event: "overlay.writing_position_restored", selectionAnchor: 20, selectionHead: 11, scrollY: 98, routeUnchanged: true });
    expect(JSON.stringify(entries)).not.toMatch(/Synthetic writing|synthetic-focus-order|private=|536/);
  });
});
