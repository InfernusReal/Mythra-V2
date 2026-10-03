import type { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";

export interface WritingSelection {
  anchor: number;
  head: number;
  source: "dom" | "engine";
  engineBehind: boolean;
}

/** Read only: native selectionchange may not have reached ProseMirror before a modal opens. */
export function captureWritingSelection(editor: Editor): WritingSelection {
  const selection = editor.state.selection;
  const fallback: WritingSelection = {
    anchor: selection.anchor ?? selection.from,
    head: selection.head ?? selection.to,
    source: "engine",
    engineBehind: false,
  };
  if (editor.isDestroyed || !(selection instanceof TextSelection)) return fallback;
  try {
    const view = editor.view;
    if (!view?.dom.isConnected || view.composing || !view.hasFocus()) return fallback;
    const native = view.dom.ownerDocument.getSelection();
    if (!native?.anchorNode || !native.focusNode || native.rangeCount !== 1 ||
      !view.dom.contains(native.anchorNode) || !view.dom.contains(native.focusNode)) return fallback;
    const anchor = view.posAtDOM(native.anchorNode, native.anchorOffset);
    const head = view.posAtDOM(native.focusNode, native.focusOffset);
    const doc = editor.state.doc;
    if (!Number.isInteger(anchor) || !Number.isInteger(head) || anchor < 0 || head < 0 ||
      anchor > doc.content.size || head > doc.content.size ||
      !doc.resolve(anchor).parent.inlineContent || !doc.resolve(head).parent.inlineContent) return fallback;
    return { anchor, head, source: "dom", engineBehind: anchor !== fallback.anchor || head !== fallback.head };
  } catch {
    // Detached/unmounted views or an unmappable native endpoint retain the last valid engine coordinate.
    return fallback;
  }
}
