"use client";

import { useEffect, useRef, useState } from "react";
import type { SearchReadModel, SearchResult } from "@/domains/search/domain/types";
import { SearchPeek } from "./SearchPeek";
import { SearchResultGroups } from "./SearchResultGroups";
import { cacheChapterSearch, readCachedChapterSearch } from "@/lib/offline/degraded-mode";
import { useNetworkStatus } from "@/lib/offline/use-network-status";

type Envelope<T> = { data?: T; error?: { message: string } };

export function SearchWorkspace({ projectId, returnChapterId }: { projectId: string; returnChapterId?: string }) {
  const [query, setQuery] = useState("");
  const [model, setModel] = useState<SearchReadModel | null>(null);
  const [peek, setPeek] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [offlineLimited, setOfflineLimited] = useState(false);
  const online = useNetworkStatus();
  const requestRef = useRef(0);
  useEffect(() => {
    if (!query.trim()) return;
    const sequence = ++requestRef.current;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setError(null);
      try {
        if (!online) {
          const cached = readCachedChapterSearch(projectId, query);
          setModel(cached); setOfflineLimited(true); setError(cached ? null : "No recently cached chapters match this search.");
          // Console trace S11-OFFLINE-001: degraded Search records only cache/result counts and excludes query and authored result content.
          console.log(JSON.stringify({ level: "info", step: "S11-OFFLINE-001", event: "search.offline_chapter_cache_resolved", projectId, returned: cached?.page.returned ?? 0, cacheAvailable: Boolean(cached) }));
          return;
        }
        const params = new URLSearchParams({ query, limit: "60" }); if (returnChapterId) params.set("chapterId", returnChapterId);
        const response = await fetch(`/api/v2/projects/${projectId}/search?${params}`, { signal: controller.signal });
        const envelope = await response.json() as Envelope<SearchReadModel>;
        if (!response.ok || !envelope.data) { setModel(null); setOfflineLimited(false); setError(envelope.error?.message ?? "Search is unavailable."); return; }
        if (sequence !== requestRef.current) return;
        setModel(envelope.data); setOfflineLimited(false); cacheChapterSearch(projectId, envelope.data);
        // Console trace S10-UI-001: full Search resolved with counts only; query/result content is excluded.
        console.log(JSON.stringify({ level: "info", step: "S10-UI-001", event: "search.workspace_resolved", projectId, returned: envelope.data.page.returned, total: envelope.data.page.total, groupCount: envelope.data.groups.length }));
      } catch (caught) { if (!controller.signal.aborted) { const cached = readCachedChapterSearch(projectId, query); setModel(cached); setOfflineLimited(Boolean(cached)); setError(cached ? null : caught instanceof Error ? caught.message : "Search is unavailable."); } }
      finally { if (sequence === requestRef.current) setLoading(false); }
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [online, projectId, query, returnChapterId]);
  const hasQuery = Boolean(query.trim());
  return <section className="search-workspace" data-search-project-id={projectId} data-search-chapter-id={returnChapterId} aria-labelledby="search-title"><header><div><p className="eyebrow">Project retrieval</p><h1 id="search-title">Search</h1></div>{returnChapterId ? <a href={`/app/chapters/${returnChapterId}`}>Return to Chapter</a> : <a href={`/app/projects/${projectId}`}>Return to Project</a>}</header><label className="search-input">Search chapters, outlines, milestones, entities, Story Changes, relations, references, captures, timeline events, Notes, and Research<input autoFocus value={query} maxLength={160} onChange={(event) => { const next = event.target.value; setQuery(next); if (!next.trim()) { requestRef.current += 1; setModel(null); setError(null); setLoading(false); setPeek(null); setOfflineLimited(false); } }} /></label><p role="status">{loading && hasQuery ? "Searching" : hasQuery ? error ?? (model ? `${model.page.returned} results shown` : "Search is ready.") : "Enter a project term or phrase."}</p>{offlineLimited ? <p className="search-provider-note">Offline limited search: results come only from recently cached chapters and may be stale.</p> : null}{hasQuery && model ? <SearchResultGroups model={model} projectId={projectId} chapterId={returnChapterId} onPeek={setPeek} /> : null}{peek ? <SearchPeek result={peek} onClose={() => setPeek(null)} /> : null}</section>;
}
