"use client";

import { useCallback, useRef } from "react";
import type { Editor } from "@tiptap/core";

export interface WritingFocusSnapshot { from: number; to: number; scrollX: number; scrollY: number; route: string }

export function useFocusPreservingOverlay(editor: Editor | null) {
  const snapshotRef = useRef<WritingFocusSnapshot | null>(null);
  const capture = useCallback(() => {
    if (!editor) return null; const snapshot = { from: editor.state.selection.from, to: editor.state.selection.to, scrollX: window.scrollX, scrollY: window.scrollY, route: `${window.location.pathname}${window.location.search}${window.location.hash}` };
    snapshotRef.current = snapshot;
    // Console trace S7-FOCUS-001: writing position captured using coordinates and route only; selected prose is excluded.
    console.log(JSON.stringify({ level: "info", step: "S7-FOCUS-001", event: "overlay.writing_position_captured", selectionAnchor: snapshot.from, selectionHead: snapshot.to, scrollY: snapshot.scrollY, route: snapshot.route }));
    return snapshot;
  }, [editor]);
  const restore = useCallback((snapshot = snapshotRef.current) => {
    if (!editor || !snapshot) return; requestAnimationFrame(() => { editor.commands.setTextSelection({ from: snapshot.from, to: snapshot.to }); editor.commands.focus(); window.scrollTo(snapshot.scrollX, snapshot.scrollY);
      // Console trace S7-FOCUS-002: exact selection, focus, and scroll restoration completed without navigation or prose telemetry.
      console.log(JSON.stringify({ level: "info", step: "S7-FOCUS-002", event: "overlay.writing_position_restored", selectionAnchor: snapshot.from, selectionHead: snapshot.to, scrollY: snapshot.scrollY, routeUnchanged: `${window.location.pathname}${window.location.search}${window.location.hash}` === snapshot.route }));
    });
  }, [editor]);
  return { capture, restore, current: snapshotRef };
}
