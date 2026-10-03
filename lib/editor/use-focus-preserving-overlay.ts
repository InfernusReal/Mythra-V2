"use client";

import { useCallback, useRef } from "react";
import type { Editor } from "@tiptap/core";
import { captureWritingSelection } from "./writing-selection";

export interface WritingFocusSnapshot { from: number; to: number; scrollX: number; scrollY: number; route: string }

export function useFocusPreservingOverlay(editor: Editor | null) {
  const snapshotRef = useRef<WritingFocusSnapshot | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const capture = useCallback(() => {
    const selection = editor ? captureWritingSelection(editor) : null;
    const snapshot = { from: selection?.anchor ?? 0, to: selection?.head ?? 0, scrollX: window.scrollX, scrollY: window.scrollY, route: `${window.location.pathname}${window.location.search}${window.location.hash}` };
    snapshotRef.current = snapshot;
    elementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Console trace S7-FOCUS-001: writing position captured using coordinates only; selected prose and URL query values are excluded.
    console.log(JSON.stringify({ level: "info", step: "S7-FOCUS-001", event: "overlay.writing_position_captured", selectionAnchor: snapshot.from, selectionHead: snapshot.to, scrollY: snapshot.scrollY }));
    return snapshot;
  }, [editor]);
  const restore = useCallback((snapshot = snapshotRef.current) => {
    if (!snapshot) return; requestAnimationFrame(() => {
      if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== snapshot.route || editor?.isDestroyed) return;
      if (editor) {
        editor.commands.setTextSelection({ from: snapshot.from, to: snapshot.to });
        // Synchronize selection through non-scrolling view focus before Tiptap can invoke mobile native focus.
        editor.view?.focus();
        editor.commands.focus(undefined, { scrollIntoView: false });
      } else elementRef.current?.focus({ preventScroll: true });
      window.scrollTo(snapshot.scrollX, snapshot.scrollY);
      // Console trace S7-FOCUS-002: exact selection, focus, and scroll restoration completed without navigation or prose telemetry.
      console.log(JSON.stringify({ level: "info", step: "S7-FOCUS-002", event: "overlay.writing_position_restored", selectionAnchor: snapshot.from, selectionHead: snapshot.to, scrollY: snapshot.scrollY, routeUnchanged: `${window.location.pathname}${window.location.search}${window.location.hash}` === snapshot.route }));
    });
  }, [editor]);
  return { capture, restore, current: snapshotRef };
}
