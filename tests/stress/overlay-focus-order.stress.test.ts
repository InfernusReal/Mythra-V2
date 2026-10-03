import { act, renderHook } from "@testing-library/react";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { expect, it, vi } from "vitest";
import { useFocusPreservingOverlay } from "@/lib/editor/use-focus-preserving-overlay";

it("preserves exact selection, document and undo over 1,000 mobile overlay returns without accumulated frames", () => {
  const element = document.createElement("div"); const overlay = document.createElement("textarea");
  document.body.append(element, overlay);
  let editor: Editor | undefined;
  let frames: FrameRequestCallback[] = []; let scrollX = 0; let scrollY = 0; let maximumPending = 0;
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(navigator, "platform", "get").mockReturnValue("Android");
  vi.spyOn(window, "scrollX", "get").mockImplementation(() => scrollX);
  vi.spyOn(window, "scrollY", "get").mockImplementation(() => scrollY);
  vi.spyOn(window, "scrollTo").mockImplementation((x, y) => { scrollX = Number(x); scrollY = y ?? 0; });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.push(callback); maximumPending = Math.max(maximumPending, frames.length); return frames.length;
  });
  const flush = () => {
    for (let count = 0; frames.length; count++) {
      if (count >= 10) throw new Error("Unbounded focus callbacks");
      const batch = frames; frames = []; batch.forEach((callback) => callback(count));
    }
  };
  try {
    editor = new Editor({ element, extensions: [StarterKit], content: "<p>Synthetic focus stress manuscript only.</p>" });
    const activeEditor = editor; const { result, unmount } = renderHook(() => useFocusPreservingOverlay(activeEditor));
    const documentBefore = activeEditor.getJSON(); const doc = activeEditor.state.doc;
    flush(); maximumPending = 0;
    const failures: number[] = [];
    act(() => {
      for (let index = 0; index < 1000; index++) {
        const anchor = 1 + index % 30; const head = 1 + (index * 7) % 30;
        activeEditor.commands.setTextSelection({ from: anchor, to: head }); activeEditor.view.focus(); flush();
        scrollX = index % 5; scrollY = index % 223;
        result.current.capture(); overlay.focus({ preventScroll: true }); result.current.restore(); flush();
        // Check every cycle; aggregate only failures instead of constructing 6,000 assertion objects.
        if (activeEditor.state.selection.anchor !== anchor || activeEditor.state.selection.head !== head
          || !activeEditor.view.hasFocus() || activeEditor.state.doc !== doc
          || scrollX !== index % 5 || scrollY !== index % 223 || frames.length !== 0) failures.push(index);
      }
    });
    expect(failures).toEqual([]);
    expect(activeEditor.getJSON()).toEqual(documentBefore); expect(activeEditor.commands.undo()).toBe(false);
    expect(maximumPending).toBe(1);
    expect(vi.mocked(console.log).mock.calls.filter(([text]) => String(text).includes('"step":"S7-FOCUS-001"'))).toHaveLength(1000);
    expect(vi.mocked(console.log).mock.calls.filter(([text]) => String(text).includes('"step":"S7-FOCUS-002"'))).toHaveLength(1000);
    unmount(); expect(frames).toHaveLength(0);
  } finally {
    editor?.destroy(); element.remove(); overlay.remove(); window.getSelection()?.removeAllRanges();
    vi.restoreAllMocks(); vi.unstubAllGlobals();
  }
});
