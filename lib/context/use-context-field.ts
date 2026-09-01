"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import type { ContextCardType, ContextFieldReadModel } from "@/domains/context/domain/types";
import { cacheContextModel, readStaleContextModel } from "@/lib/offline/degraded-mode";
import { useNetworkStatus } from "@/lib/offline/use-network-status";

type Envelope<T> = { data?: T; error?: { message: string } };
const utf8 = new TextEncoder();
async function sha256(value: string): Promise<string> { return [...new Uint8Array(await crypto.subtle.digest("SHA-256", utf8.encode(value)))].map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
function cursor(editor: Editor): { blockId?: string; selectedIds: string[] } {
  const { from, to, $from } = editor.state.selection; const blockId = typeof $from.parent.attrs.blockId === "string" ? $from.parent.attrs.blockId : undefined; const ids = new Set<string>();
  editor.state.doc.nodesBetween(from, Math.max(from, to), (node) => { for (const mark of node.marks) { const id = mark.attrs.referenceId; if (mark.type.name === "storyReference" && typeof id === "string") ids.add(id); } });
  return { ...(blockId ? { blockId } : {}), selectedIds: [...ids].slice(0, 50) };
}
async function expectedKey(model: ContextFieldReadModel, blockId: string | undefined, selectedIds: string[]): Promise<string> {
  return sha256(JSON.stringify({ chapterId: model.chapterId, chapterVersion: model.chapterVersion, structuralVersion: model.projectStructuralVersion, cursorBlockId: blockId ?? null, selectedIds: [...selectedIds].sort(), pins: [...model.pinKeys].sort(), causal: [null, null, null] }));
}

export function useContextField(editor: Editor | null, chapterId: string) {
  const online = useNetworkStatus();
  const [model, setModel] = useState<ContextFieldReadModel | null>(null); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false); const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const abortRef = useRef<AbortController | null>(null); const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null); const sequenceRef = useRef(0); const modelRef = useRef<ContextFieldReadModel | null>(null); const refreshRef = useRef<(peek?: { type: ContextCardType; id: string }, cardCap?: number, acceptFresh?: boolean) => Promise<void>>(async () => undefined);
  useEffect(() => { modelRef.current = model; }, [model]);
  const refresh = useCallback(async (peek?: { type: ContextCardType; id: string }, cardCap = 8, acceptFresh = false) => {
    if (!editor) return; const sequence = ++sequenceRef.current; const current = cursor(editor); const known = modelRef.current; const requestedContextKey = known && !peek && !acceptFresh ? await expectedKey(known, current.blockId, current.selectedIds) : undefined;
    if (abortRef.current && !abortRef.current.signal.aborted) {
      abortRef.current.abort();
      // Console trace S15-CONTEXT-001: superseded context cancellation records only chapter identity and request sequence.
      console.log(JSON.stringify({ level: "info", step: "S15-CONTEXT-001", event: "performance.context_request_cancelled", chapterId, sequence }));
    }
    const controller = new AbortController(); abortRef.current = controller; setLoading(true); setError(null);
    if (!online) { const cached = readStaleContextModel(chapterId); setModel(cached); setError(cached ? "Cached context is stale while offline." : "Context is unavailable offline until it has been cached."); setLoading(false);
      // Console trace S11-OFFLINE-002: offline context fallback records identity/card count only and excludes authored context content.
      console.log(JSON.stringify({ level: "info", step: "S11-OFFLINE-002", event: "context.offline_cache_resolved", chapterId, returnedCards: cached?.descriptors.length ?? 0, cacheAvailable: Boolean(cached) })); return; }
    const params = new URLSearchParams({ cardCap: String(cardCap) }); if (current.blockId) params.set("cursorBlockId", current.blockId); for (const id of current.selectedIds) params.append("selectedId", id); if (peek) { params.set("peekType", peek.type); params.set("peekId", peek.id); } if (requestedContextKey) params.set("requestedContextKey", requestedContextKey);
    // Console trace S7-CLIENT-001: cancellable context refresh started with identity, selection count, and sequence only.
    console.log(JSON.stringify({ level: "info", step: "S7-CLIENT-001", event: "context.refresh_started", chapterId, sequence, hasBlockAnchor: Boolean(current.blockId), selectedObjectCount: current.selectedIds.length, peek: Boolean(peek) }));
    try { const response = await fetch(`/api/v2/chapters/${chapterId}/context?${params}`, { signal: controller.signal }); const envelope = await response.json() as Envelope<ContextFieldReadModel>; if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? "Context is unavailable.");
      if (sequence !== sequenceRef.current || (requestedContextKey && envelope.data.contextKey !== requestedContextKey)) {
        // Console trace S7-CLIENT-002: stale or superseded context response discarded by sequence/contextKey before render.
        console.log(JSON.stringify({ level: "info", step: "S7-CLIENT-002", event: "context.stale_response_discarded", chapterId, sequence, sequenceCurrent: sequence === sequenceRef.current, contextKeyMatched: envelope.data.contextKey === requestedContextKey })); if (sequence === sequenceRef.current) void refreshRef.current(undefined, cardCap, true); return;
      }
      setModel(envelope.data); cacheContextModel(envelope.data);
      // Console trace S7-CLIENT-003: current context response applied with card counts and freshness only.
      console.log(JSON.stringify({ level: "info", step: "S7-CLIENT-003", event: "context.response_applied", chapterId, sequence, returnedCards: envelope.data.page.returnedCards, hasMore: envelope.data.page.hasMore, structuralVersion: envelope.data.projectStructuralVersion }));
    } catch (caught) { if (caught instanceof DOMException && caught.name === "AbortError") return; const cached = readStaleContextModel(chapterId); if (cached) { setModel(cached); setError("Cached context is stale because the server could not be reached."); } else setError(caught instanceof Error ? caught.message : "Context is unavailable."); } finally { if (sequence === sequenceRef.current) setLoading(false); }
  }, [chapterId, editor, online]);
  useEffect(() => { refreshRef.current = refresh; }, [refresh]);
  const schedule = useCallback(() => { if (timerRef.current) clearTimeout(timerRef.current); timerRef.current = setTimeout(() => void refresh(), 300); }, [refresh]);
  useEffect(() => { if (!editor) return; timerRef.current = setTimeout(() => void refresh(), 0); const selection = () => schedule(); const transaction = ({ transaction }: { transaction: { docChanged: boolean } }) => { if (transaction.docChanged) schedule(); }; editor.on("selectionUpdate", selection); editor.on("transaction", transaction); return () => { editor.off("selectionUpdate", selection); editor.off("transaction", transaction); abortRef.current?.abort(); if (timerRef.current) clearTimeout(timerRef.current); }; }, [editor, refresh, schedule]);
  const hide = (id: string) => setHidden((current) => new Set([...current, id]));
  return { model: model ? { ...model, descriptors: model.descriptors.filter((descriptor) => !hidden.has(descriptor.id)) } : null, error, loading, refresh, hide };
}
