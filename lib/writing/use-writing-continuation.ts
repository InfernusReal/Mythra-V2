"use client";

import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/core";
import { writingPositionSchema, type WritingPosition } from "@/domains/writing/application/continuation-ports";

const SERVER_DEBOUNCE_MS = 600;

function storageKey(projectId: string): string { return `mythra.continuation.${projectId}`; }

function parseLocal(value: string | null): WritingPosition | null {
  if (!value) return null;
  try {
    const parsed = writingPositionSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}

function capturePosition(editor: Editor, chapterId: string, seed: WritingPosition): WritingPosition {
  const { anchor, head, $anchor } = editor.state.selection;
  const block = $anchor.depth >= 1 ? $anchor.node(1) : null;
  const blockStart = $anchor.depth >= 1 ? $anchor.before(1) + 1 : 0;
  return {
    activeChapterId: chapterId,
    blockId: typeof block?.attrs.blockId === "string" ? block.attrs.blockId : null,
    cursorOffset: Math.max(0, anchor - blockStart),
    selectionAnchor: anchor,
    selectionHead: head,
    scrollTop: Math.max(0, Math.round(window.scrollY)),
    contextPanelMode: seed.contextPanelMode,
    pinIds: seed.pinIds.slice(0, 50),
    capturedAt: new Date().toISOString()
  };
}

function restorePosition(editor: Editor, position: WritingPosition): { from: number; to: number } {
  const maximum = editor.state.doc.content.size;
  let from = Math.min(maximum, Math.max(0, position.selectionAnchor ?? 0));
  let to = Math.min(maximum, Math.max(0, position.selectionHead ?? from));
  if (position.blockId && position.cursorOffset !== null && from === to) {
    editor.state.doc.descendants((node, nodePosition) => {
      if (node.attrs.blockId !== position.blockId) return true;
      from = Math.min(nodePosition + node.nodeSize - 1, nodePosition + 1 + position.cursorOffset!);
      to = from;
      return false;
    });
  }
  editor.commands.setTextSelection({ from, to });
  editor.commands.focus(undefined, { scrollIntoView: false });
  requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: position.scrollTop ?? 0, behavior: "auto" })));
  return { from, to };
}

export function useWritingContinuation(input: {
  editor: Editor | null;
  durableReady: boolean;
  projectId: string;
  chapterId: string;
  initialSession: WritingPosition;
}) {
  const seedRef = useRef(input.initialSession);
  const latestRef = useRef(input.initialSession);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigatingRef = useRef(false);

  useEffect(() => {
    const editor = input.editor;
    if (!editor || !input.durableReady) return;
    const local = parseLocal(localStorage.getItem(storageKey(input.projectId)));
    // Console trace S3-CLIENT-001: local continuation metadata lookup completed; manuscript content is excluded.
    console.log(JSON.stringify({ level: "info", step: "S3-CLIENT-001", event: "continuation.local_read", projectId: input.projectId, chapterId: input.chapterId, found: Boolean(local), capturedAt: local?.capturedAt }));
    const server = input.initialSession.activeChapterId === input.chapterId ? input.initialSession : null;
    const localForChapter = local?.activeChapterId === input.chapterId ? local : null;
    const chosen = localForChapter && (!server || Date.parse(localForChapter.capturedAt) > Date.parse(server.capturedAt)) ? localForChapter : server;
    if (chosen) {
      seedRef.current = chosen;
      latestRef.current = chosen;
      const restored = restorePosition(editor, chosen);
      // Console trace S3-CLIENT-002: stable block/cursor and scroll metadata were restored; selection text is excluded.
      console.log(JSON.stringify({ level: "info", step: "S3-CLIENT-002", event: "continuation.restored", projectId: input.projectId, chapterId: input.chapterId, blockId: chosen.blockId, from: restored.from, to: restored.to, scrollTop: chosen.scrollTop, source: chosen === localForChapter ? "local" : "server" }));
    }

    const syncServer = async () => {
      if (!navigator.onLine) {
        // Console trace S3-CLIENT-005: server continuation was unavailable while local metadata remained durable; content is excluded.
        console.log(JSON.stringify({ level: "warn", step: "S3-CLIENT-005", event: "continuation.server_deferred", projectId: input.projectId, chapterId: input.chapterId, reason: "offline" }));
        return;
      }
      try {
        const response = await fetch(`/api/v2/projects/${input.projectId}/continuation`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(latestRef.current), keepalive: true });
        if (!response.ok) throw new Error("continuation rejected");
        // Console trace S3-CLIENT-004: continuation metadata reached the server; no document or selection text is emitted.
        console.log(JSON.stringify({ level: "info", step: "S3-CLIENT-004", event: "continuation.server_saved", projectId: input.projectId, chapterId: input.chapterId, capturedAt: latestRef.current.capturedAt }));
      } catch {
        // Console trace S3-CLIENT-005: server continuation failure retained the local metadata snapshot; raw error/content are excluded.
        console.log(JSON.stringify({ level: "warn", step: "S3-CLIENT-005", event: "continuation.server_deferred", projectId: input.projectId, chapterId: input.chapterId, reason: "dependency" }));
      }
    };

    const capture = () => {
      if (navigatingRef.current) return;
      latestRef.current = capturePosition(editor, input.chapterId, seedRef.current);
      localStorage.setItem(storageKey(input.projectId), JSON.stringify(latestRef.current));
      // Console trace S3-CLIENT-003: metadata-only local continuation snapshot persisted; document and selection text are excluded.
      console.log(JSON.stringify({ level: "info", step: "S3-CLIENT-003", event: "continuation.local_saved", projectId: input.projectId, chapterId: input.chapterId, blockId: latestRef.current.blockId, cursorOffset: latestRef.current.cursorOffset, selectionAnchor: latestRef.current.selectionAnchor, selectionHead: latestRef.current.selectionHead, scrollTop: latestRef.current.scrollTop, contextPanelMode: latestRef.current.contextPanelMode, pinCount: latestRef.current.pinIds.length, capturedAt: latestRef.current.capturedAt }));
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => { void syncServer(); }, SERVER_DEBOUNCE_MS);
    };
    const onSelection = () => capture();
    const onScroll = () => capture();
    const onOnline = () => { void syncServer(); };
    const onBeforeUnload = () => capture();
    const onNavigationIntent = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!target) return;
      navigatingRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      void syncServer();
      // Console trace S3-CLIENT-007: the author position was frozen before in-app navigation could reset scroll; content is excluded.
      console.log(JSON.stringify({ level: "info", step: "S3-CLIENT-007", event: "continuation.navigation_position_frozen", projectId: input.projectId, chapterId: input.chapterId, positionAt: latestRef.current.capturedAt }));
    };
    editor.on("selectionUpdate", onSelection);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("online", onOnline);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onNavigationIntent, true);
    requestAnimationFrame(() => requestAnimationFrame(() => capture()));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      latestRef.current = capturePosition(editor, input.chapterId, seedRef.current);
      localStorage.setItem(storageKey(input.projectId), JSON.stringify(latestRef.current));
      // Console trace S3-CLIENT-006: final local session metadata was flushed during teardown; content is excluded.
      console.log(JSON.stringify({ level: "info", step: "S3-CLIENT-006", event: "continuation.local_flushed", projectId: input.projectId, chapterId: input.chapterId, capturedAt: latestRef.current.capturedAt }));
      editor.off("selectionUpdate", onSelection);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onNavigationIntent, true);
    };
  }, [input.chapterId, input.durableReady, input.editor, input.initialSession, input.projectId]);
}
