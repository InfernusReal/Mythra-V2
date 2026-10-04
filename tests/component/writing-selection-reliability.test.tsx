import { act, renderHook } from "@testing-library/react";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFocusPreservingOverlay } from "@/lib/editor/use-focus-preserving-overlay";
import { captureWritingSelection } from "@/lib/editor/writing-selection";
import { NodeSelection } from "@tiptap/pm/state";

const editors: Editor[] = [];
beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
  window.history.replaceState(null, "", "/app/chapters/synthetic");
});
afterEach(() => {
  editors.splice(0).forEach((editor) => editor.destroy());
  document.querySelectorAll("[data-reliability-editor]").forEach((node) => node.remove());
  window.getSelection()?.removeAllRanges();
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});

function fixture() {
  const element = document.createElement("div");
  element.dataset.reliabilityEditor = "true"; document.body.append(element);
  const editor = new Editor({ element, extensions: [StarterKit], content: "<p>Synthetic writing selection fixture</p>" });
  editors.push(editor);
  editor.commands.setTextSelection({ from: 20, to: 12 }); editor.view.focus();
  const text = editor.view.dom.querySelector("p")!.firstChild!;
  return { editor, text };
}

describe("command/Capture writing-position reliability", () => {
  it("captures the browser's final backwards step before the engine selectionchange notification", () => {
    const { editor, text } = fixture();
    const before = editor.getJSON();
    window.getSelection()!.setBaseAndExtent(text, 19, text, 10);
    expect(editor.state.selection.head).toBe(12);
    const { result } = renderHook(() => useFocusPreservingOverlay(editor));
    let snapshot: ReturnType<typeof result.current.capture> | undefined;
    act(() => { snapshot = result.current.capture(); });
    expect(snapshot).toMatchObject({ from: 20, to: 11 });
    expect(editor.state.selection.head).toBe(12);
    expect(editor.getJSON()).toEqual(before);
  });

  it("does not restore an old overlay snapshot into a different route", () => {
    const { editor } = fixture();
    const focus = vi.spyOn(editor.commands, "focus");
    const { result } = renderHook(() => useFocusPreservingOverlay(editor));
    act(() => { result.current.capture(); });
    window.history.replaceState(null, "", "/app/projects/other");
    act(() => { result.current.restore(); });
    expect(focus).not.toHaveBeenCalled();
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it.each([[3, 17], [17, 3], [5, 5]])("preserves native direction and caret without changing document/history: %i → %i", (anchor, head) => {
    const { editor, text } = fixture();
    const before = editor.getJSON(); const doc = editor.state.doc;
    window.getSelection()!.setBaseAndExtent(text, anchor, text, head);
    expect(captureWritingSelection(editor)).toEqual({ anchor: anchor + 1, head: head + 1, source: "dom", engineBehind: true });
    expect(editor.state.doc).toBe(doc); expect(editor.getJSON()).toEqual(before);
    expect(editor.commands.undo()).toBe(false);
  });
  it("maps a native selection across multiple text blocks", () => {
    const { editor } = fixture();
    editor.commands.setContent("<p>First</p><p>Second</p>"); editor.view.focus();
    const paragraphs = editor.view.dom.querySelectorAll("p");
    window.getSelection()!.setBaseAndExtent(paragraphs[1]!.firstChild!, 4, paragraphs[0]!.firstChild!, 2);
    expect(captureWritingSelection(editor)).toMatchObject({ anchor: 12, head: 3, source: "dom" });
  });
  it("uses engine coordinates when native selection is absent or outside the editor", () => {
    const { editor } = fixture();
    window.getSelection()!.removeAllRanges();
    expect(captureWritingSelection(editor)).toMatchObject({ source: "engine", anchor: 20, head: 12 });
    const external = document.createTextNode("External"); document.body.append(external);
    window.getSelection()!.setBaseAndExtent(external, 1, external, 4);
    expect(captureWritingSelection(editor).source).toBe("engine"); external.remove();
  });
  it("does not read native selection during composition or a non-text selection", () => {
    const { editor, text } = fixture();
    window.getSelection()!.setBaseAndExtent(text, 19, text, 10);
    const composing = vi.spyOn(editor.view, "composing", "get").mockReturnValue(true);
    expect(captureWritingSelection(editor).source).toBe("engine"); composing.mockRestore();
    editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 0)));
    expect(captureWritingSelection(editor).source).toBe("engine");
  });
  it.each(["throw", "negative", "oversized", "fraction", "boundary"])("retains valid engine coordinates when public DOM mapping is invalid: %s", (failure) => {
    const { editor } = fixture();
    vi.spyOn(editor.view, "posAtDOM").mockImplementation(() => {
      if (failure === "throw") throw new Error("Synthetic unmapped node");
      return failure === "negative" ? -1 : failure === "oversized" ? 1_000_000 : failure === "fraction" ? 1.5 : 0;
    });
    expect(captureWritingSelection(editor)).toMatchObject({ source: "engine", anchor: 20, head: 12 });
  });
  it("retains engine coordinates when blurred or disconnected", () => {
    const { editor } = fixture();
    editor.view.dom.blur(); expect(captureWritingSelection(editor).source).toBe("engine");
    editor.view.dom.remove(); expect(captureWritingSelection(editor).source).toBe("engine");
  });
  it("does not restore a destroyed editor", () => {
    const { editor } = fixture(); const { result } = renderHook(() => useFocusPreservingOverlay(editor));
    act(() => { result.current.capture(); }); editor.destroy();
    act(() => { result.current.restore(); }); expect(window.scrollTo).not.toHaveBeenCalled();
    expect(captureWritingSelection(editor).source).toBe("engine");
  });
  it("restores selection while explicitly disabling Tiptap's later scrollIntoView", () => {
    const { editor } = fixture(); const { result } = renderHook(() => useFocusPreservingOverlay(editor));
    act(() => { result.current.capture(); });
    const focus = vi.fn(); const command = editor.commands;
    vi.spyOn(editor, "commands", "get").mockReturnValue({ ...command, focus });
    act(() => { result.current.restore(); });
    expect(focus).toHaveBeenCalledWith(undefined, { scrollIntoView: false });
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
});
