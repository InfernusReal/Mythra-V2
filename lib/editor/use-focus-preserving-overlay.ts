"use client";

import { useCallback, useRef } from "react";
import type { Editor } from "@tiptap/core";

export interface WritingFocusSnapshot { from: number; to: number; scrollX: number; scrollY: number; route: string }

export function useFocusPreservingOverlay(editor: Editor | null) {
  const snapshotRef = useRef<WritingFocusSnapshot | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const capture = useCallback(() => {
    const snapshot = { from: editor?.state.selection.anchor ?? editor?.state.selection.from ?? 0, to: editor?.state.selection.head ?? editor?.state.selection.to ?? 0, scrollX: window.scrollX, scrollY: window.scrollY, route: `${window.location.pathname}${window.location.search}${window.location.hash}` };
    snapshotRef.current = snapshot;
    elementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Console trace S7-FOCUS-001: writing position captured using coordinates only; selected prose and URL query values are excluded.
    console.log(JSON.stringify({ level: "info", step: "S7-FOCUS-001", event: "overlay.writing_position_captured", selectionAnchor: snapshot.from, selectionHead: snapshot.to, scrollY: snapshot.scrollY }));
    return snapshot;
  }, [editor]);
  const restore = useCallback((snapshot = snapshotRef.current) => {
    if (!snapshot) return; requestAnimationFrame(() => { if (editor) { editor.commands.setTextSelection({ from: snapshot.from, to: snapshot.to }); editor.commands.focus(); } else elementRef.current?.focus(); window.scrollTo(snapshot.scrollX, snapshot.scrollY);
      // Console trace S7-FOCUS-002: exact selection, focus, and scroll restoration completed without navigation or prose telemetry.
      console.log(JSON.stringify({ level: "info", step: "S7-FOCUS-002", event: "overlay.writing_position_restored", selectionAnchor: snapshot.from, selectionHead: snapshot.to, scrollY: snapshot.scrollY, routeUnchanged: `${window.location.pathname}${window.location.search}${window.location.hash}` === snapshot.route }));
    });
  }, [editor]);
  return { capture, restore, current: snapshotRef };
}
