"use client";

import { useEffect, useRef, useState } from "react";
import type { SearchReadModel, SearchResult } from "@/domains/search/domain/types";
import { SearchPeek } from "./SearchPeek";
import { SearchResultGroups } from "./SearchResultGroups";

type Envelope<T> = { data?: T; error?: { message: string } };

export function SearchWorkspace({ projectId, returnChapterId }: { projectId: string; returnChapterId?: string }) {
  const [query, setQuery] = useState("");
  const [model, setModel] = useState<SearchReadModel | null>(null);
  const [peek, setPeek] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(0);
  useEffect(() => {
    if (!query.trim()) return;
    const sequence = ++requestRef.current;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setError(null);
      try {
        const params = new URLSearchParams({ query, limit: "60" }); if (returnChapterId) params.set("chapterId", returnChapterId);
        const response = await fetch(`/api/v2/projects/${projectId}/search?${params}`, { signal: controller.signal });
        const envelope = await response.json() as Envelope<SearchReadModel>;
        if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? "Search is unavailable.");
        if (sequence !== requestRef.current) return;
        setModel(envelope.data);
        // Console trace S10-UI-001: full Search resolved with counts only; query/result content is excluded.
        console.log(JSON.stringify({ level: "info", step: "S10-UI-001", event: "search.workspace_resolved", projectId, returned: envelope.data.page.returned, total: envelope.data.page.total, groupCount: envelope.data.groups.length }));
      } catch (caught) { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Search is unavailable."); }
      finally { if (sequence === requestRef.current) setLoading(false); }
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [projectId, query, returnChapterId]);
  const hasQuery = Boolean(query.trim());
  return <section className="search-workspace" data-search-project-id={projectId} data-search-chapter-id={returnChapterId} aria-labelledby="search-title"><header><div><p className="eyebrow">Project retrieval</p><h1 id="search-title">Search</h1></div>{returnChapterId ? <a href={`/app/chapters/${returnChapterId}`}>Return to Chapter</a> : <a href={`/app/projects/${projectId}`}>Return to Project</a>}</header><label className="search-input">Search chapters, outlines, milestones, entities, Story Changes, relations, references, and captures<input autoFocus value={query} maxLength={160} onChange={(event) => { const next = event.target.value; setQuery(next); if (!next.trim()) { requestRef.current += 1; setModel(null); setError(null); setLoading(false); setPeek(null); } }} /></label><p role="status">{loading && hasQuery ? "Searching" : hasQuery ? error ?? (model ? `${model.page.returned} results shown` : "Search is ready.") : "Enter a project term or phrase."}</p>{hasQuery && model?.providerStates.filter((provider) => provider.state !== "ACTIVE").length ? <p className="search-provider-note">Timeline events, Notes, and Research activate in the next capability gate.</p> : null}{hasQuery && model ? <SearchResultGroups model={model} projectId={projectId} chapterId={returnChapterId} onPeek={setPeek} /> : null}{peek ? <SearchPeek result={peek} onClose={() => setPeek(null)} /> : null}</section>;
}
