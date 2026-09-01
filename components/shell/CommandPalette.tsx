"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { SearchReadModel, SearchResult } from "@/domains/search/domain/types";
import type { SearchEditorResultDetail } from "@/lib/search/editor-events";
import { SEARCH_EDITOR_RESULT } from "@/lib/search/editor-events";
import { SearchPeek } from "@/components/search/SearchPeek";
import { SearchResultGroups } from "@/components/search/SearchResultGroups";
import { ThemeMenu } from "./ThemeMenu";
import { MOBILE_WRITING_ACTION, type MobileWritingAction } from "@/lib/editor/mobile-actions";

type Envelope<T> = { data?: T; error?: { message: string } };
type PaletteContext = { projectId: string | null; chapterId: string | null };
type RecentEntry = { sourceKey: string; usedAt: string };
const recentKey = "mythra.search.recent.v1";

function contextFromDocument(pathname: string | null): PaletteContext {
  const node = document.querySelector<HTMLElement>("[data-search-project-id]");
  const routeProject = pathname?.match(/\/app\/projects\/([0-9a-f-]{36})/iu)?.[1] ?? null;
  return { projectId: node?.dataset.searchProjectId ?? routeProject, chapterId: node?.dataset.searchChapterId ?? null };
}

function recentEntries(): RecentEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(recentKey) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is RecentEntry => Boolean(item && typeof item === "object" && "sourceKey" in item && typeof item.sourceKey === "string" && "usedAt" in item && typeof item.usedAt === "string")).slice(0, 30) : [];
  } catch { return []; }
}

function prioritizeRecent(model: SearchReadModel): SearchReadModel {
  const recent = new Map(recentEntries().map((entry, index) => [entry.sourceKey, index]));
  return { ...model, groups: model.groups.map((group) => ({ ...group, results: [...group.results].sort((left, right) => (recent.get(left.sourceKey) ?? 999) - (recent.get(right.sourceKey) ?? 999) || right.rank - left.rank || left.sourceKey.localeCompare(right.sourceKey)) })) };
}

export function CommandPalette() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<PaletteContext>({ projectId: null, chapterId: null });
  const [query, setQuery] = useState("");
  const [model, setModel] = useState<SearchReadModel | null>(null);
  const [peek, setPeek] = useState<SearchResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const sequenceRef = useRef(0);

  const openPalette = useCallback(() => {
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    returnFocusRef.current = activeElement && activeElement !== document.body ? activeElement : triggerRef.current;
    setContext(contextFromDocument(pathname)); setOpen(true); setMessage(null);
    // Console trace S1-COMMAND-001: command palette opened; editor selection and content are excluded.
    console.log(JSON.stringify({ level: "info", step: "S1-COMMAND-001", event: "command_palette.opened" }));
  }, [pathname]);
  const closePalette = useCallback(() => {
    setOpen(false); setQuery(""); setModel(null); setPeek(null);
    requestAnimationFrame(() => returnFocusRef.current?.focus());
    // Console trace S1-COMMAND-002: command palette closed and prior focus restoration was requested.
    console.log(JSON.stringify({ level: "info", step: "S1-COMMAND-002", event: "command_palette.closed" }));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openPalette(); }
      if (event.key === "Escape" && open) { if (peek) setPeek(null); else closePalette(); }
      if (event.key === "Tab" && open && dialogRef.current) {
        const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled)")];
        if (!focusable.length) return;
        const first = focusable[0]; const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first && last) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last && first) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePalette, open, openPalette, peek]);

  useEffect(() => {
    const action = (event: Event) => {
      if ((event as CustomEvent<MobileWritingAction>).detail !== "search") return;
      openPalette();
      // Console trace S15-MOBILE-005: mobile Search open records the interaction source only.
      console.log(JSON.stringify({ level: "info", step: "S15-MOBILE-005", event: "responsive.search_opened", input: "touch" }));
    };
    window.addEventListener(MOBILE_WRITING_ACTION, action);
    return () => window.removeEventListener(MOBILE_WRITING_ACTION, action);
  }, [openPalette]);

  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<SearchEditorResultDetail>).detail;
      setMessage(detail.message);
      if (detail.projectStructuralVersion) setModel((current) => current ? { ...current, projectStructuralVersion: detail.projectStructuralVersion! } : current);
    };
    window.addEventListener(SEARCH_EDITOR_RESULT, listener);
    return () => window.removeEventListener(SEARCH_EDITOR_RESULT, listener);
  }, []);

  useEffect(() => {
    if (!open || !context.projectId || !query.trim()) return;
    const sequence = ++sequenceRef.current; const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setMessage(null);
      try {
        const params = new URLSearchParams({ query, limit: "40" }); if (context.chapterId) params.set("chapterId", context.chapterId);
        const response = await fetch(`/api/v2/projects/${context.projectId}/search?${params}`, { signal: controller.signal }); const envelope = await response.json() as Envelope<SearchReadModel>;
        if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? "Search is unavailable.");
        if (sequence !== sequenceRef.current) return;
        setModel(prioritizeRecent(envelope.data));
        // Console trace S10-UI-009: command palette search records counts/context presence only and excludes the query/results.
        console.log(JSON.stringify({ level: "info", step: "S10-UI-009", event: "command_palette.search_resolved", projectId: context.projectId, hasChapterContext: Boolean(context.chapterId), returned: envelope.data.page.returned, groupCount: envelope.data.groups.length }));
      } catch (caught) { if (!controller.signal.aborted) setMessage(caught instanceof Error ? caught.message : "Search is unavailable."); }
      finally { if (sequence === sequenceRef.current) setLoading(false); }
    }, 160);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [context.chapterId, context.projectId, open, query]);

  const openPeek = (result: SearchResult) => {
    setPeek(result);
    const recent = recentEntries().filter((entry) => entry.sourceKey !== result.sourceKey);
    localStorage.setItem(recentKey, JSON.stringify([{ sourceKey: result.sourceKey, usedAt: new Date().toISOString() }, ...recent].slice(0, 30)));
    // Console trace S10-UI-010: Search Peek records result identity and history length only; no authored content.
    console.log(JSON.stringify({ level: "info", step: "S10-UI-010", event: "search.peek_opened", projectId: context.projectId, sourceKey: result.sourceKey, historyLength: window.history.length }));
  };

  const moveToResult = (direction: 1 | -1) => {
    const options = [...(dialogRef.current?.querySelectorAll<HTMLButtonElement>("button[data-search-option]") ?? [])];
    if (!options.length) return;
    const current = options.indexOf(document.activeElement as HTMLButtonElement);
    options[(current + direction + options.length) % options.length]?.focus();
  };

  const hasQuery = Boolean(query.trim());
  return <><button ref={triggerRef} className="command-trigger" type="button" onClick={openPalette} aria-haspopup="dialog">Commands <kbd>Ctrl K</kbd></button>{open ? <div className="dialog-backdrop" role="presentation" onMouseDown={closePalette}><section ref={dialogRef} className="command-dialog command-dialog-search" role="dialog" aria-modal="true" aria-labelledby="command-title" onMouseDown={(event) => event.stopPropagation()}><header><h2 id="command-title">Command palette</h2><button type="button" onClick={closePalette}>Close</button></header><label className="command-search">Search commands and project objects<input autoFocus value={query} maxLength={160} onChange={(event) => { const next = event.target.value; setQuery(next); if (!next.trim()) { sequenceRef.current += 1; setModel(null); setLoading(false); setMessage(null); setPeek(null); } }} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); moveToResult(1); } if (event.key === "ArrowUp") { event.preventDefault(); moveToResult(-1); } }} /></label><nav className="command-links" aria-label="Current commands">{context.chapterId ? <a href={`/app/chapters/${context.chapterId}`}>Return to current chapter</a> : null}{context.projectId ? <><a href={`/app/projects/${context.projectId}/search${context.chapterId ? `?returnChapterId=${context.chapterId}` : ""}`}>Open full Search</a><a href={`/app/projects/${context.projectId}/universe${context.chapterId ? `?returnChapterId=${context.chapterId}` : ""}`}>Open Universe</a><a href={`/app/projects/${context.projectId}/structure${context.chapterId ? `?returnChapterId=${context.chapterId}` : ""}`}>Open Structure</a></> : null}</nav><ThemeMenu /><p role="status">{loading && hasQuery ? "Searching" : message ?? (!context.projectId ? "Open a project to search project objects." : hasQuery && model ? `${model.page.returned} objects` : "Type to search all active project domains.")}</p>{peek ? <SearchPeek result={peek} onClose={() => setPeek(null)} /> : hasQuery && model && context.projectId ? <SearchResultGroups model={model} projectId={context.projectId} chapterId={context.chapterId ?? undefined} onPeek={openPeek} /> : null}</section></div> : null}</>;
}
