"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { CausalTraversalProjection } from "@/domains/causality/application/ports";
import type { SearchActionKind, SearchReadModel, SearchResult } from "@/domains/search/domain/types";
import { dispatchSearchEditorAction } from "@/lib/search/editor-events";
import type { SearchEditorResultDetail } from "@/lib/search/editor-events";
import { SEARCH_EDITOR_RESULT } from "@/lib/search/editor-events";

type Envelope<T> = { data?: T; error?: { message: string } };

export function SearchResultGroups({ model, projectId, chapterId, onPeek, onActionCompleted, renderResults }: { model: SearchReadModel; projectId: string; chapterId?: string; onPeek: (result: SearchResult) => void; onActionCompleted?: (result: SearchResult) => void; renderResults?: (renderResult: (result: SearchResult) => ReactNode) => ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [trace, setTrace] = useState<CausalTraversalProjection | null>(null);
  const [attachedStructuralVersion, setAttachedStructuralVersion] = useState<number | null>(null);
  const structuralVersion = Math.max(model.projectStructuralVersion, attachedStructuralVersion ?? 0);
  useEffect(() => {
    const listener = (event: Event) => setMessage((event as CustomEvent<SearchEditorResultDetail>).detail.message);
    window.addEventListener(SEARCH_EDITOR_RESULT, listener);
    return () => window.removeEventListener(SEARCH_EDITOR_RESULT, listener);
  }, []);
  const invoke = async (result: SearchResult, kind: SearchActionKind) => {
    setMessage(null);
    if (kind === "PEEK") { onPeek(result); return; }
    const action = result.actions.find((candidate) => candidate.kind === kind);
    if (kind === "OPEN" && action?.href) { onActionCompleted?.(result); window.location.assign(action.href); return; }
    if (kind === "COPY") {
      await navigator.clipboard.writeText([result.title, result.snippet].filter(Boolean).join("\n"));
      onActionCompleted?.(result);
      setMessage("Copied.");
      // Console trace S10-UI-004: explicit copy records result identity only and excludes copied content.
      console.log(JSON.stringify({ level: "info", step: "S10-UI-004", event: "search.result_copied", projectId, sourceKey: result.sourceKey }));
      return;
    }
    if (kind === "WHY" || kind === "DEPENDS") {
      if (!action?.endpointType || !action.endpointId) return;
      const response = await fetch(`/api/v2/projects/${projectId}/search/causal`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpointType: action.endpointType, endpointId: action.endpointId, ...(action.blockId ? { blockId: action.blockId } : {}), action: kind }) });
      const envelope = await response.json() as Envelope<CausalTraversalProjection>;
      if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? "Causal context is unavailable.");
      setTrace(envelope.data);
      onActionCompleted?.(result);
      // Console trace S10-UI-005: structured Why/Depends expansion logs only endpoint/count metadata.
      console.log(JSON.stringify({ level: "info", step: "S10-UI-005", event: "search.causal_expanded", projectId, sourceKey: result.sourceKey, action: kind, nodeCount: envelope.data.nodeCount, edgeCount: envelope.data.edgeCount }));
      return;
    }
    if (kind === "ATTACH_REFERENCE") {
      if (!chapterId) { setMessage("Open a chapter to attach this result."); return; }
      const targetType = typeof result.metadata.referenceTargetType === "string" ? result.metadata.referenceTargetType : null;
      const targetId = typeof result.metadata.referenceTargetId === "string" ? result.metadata.referenceTargetId : null;
      if (!targetType || !targetId) { setMessage("This result cannot be attached."); return; }
      const response = await fetch(`/api/v2/projects/${projectId}/structure/references`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ expectedStructuralVersion: structuralVersion, sourceType: "CHAPTER", sourceId: chapterId, targetType, targetId, ...(typeof result.metadata.referenceTargetBlockId === "string" ? { targetBlockId: result.metadata.referenceTargetBlockId } : {}), relationshipKey: "chapter_context", provenanceType: "DIRECT" }) });
      const envelope = await response.json() as Envelope<{ object: { id: string }; projectStructuralVersion: number }>;
      if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? "Result could not be attached.");
      setAttachedStructuralVersion(envelope.data.projectStructuralVersion); setMessage("Result attached to chapter context.");
      onActionCompleted?.(result);
      // Console trace S10-UI-011: full-search attach logs identities/version only and excludes result/manuscript content.
      console.log(JSON.stringify({ level: "info", step: "S10-UI-011", event: "search.result_attached", projectId, chapterId, sourceKey: result.sourceKey, referenceId: envelope.data.object.id, structuralVersion: envelope.data.projectStructuralVersion }));
      return;
    }
    if (kind === "JUMP_TO_BLOCK" && !document.querySelector(".editor-prose")) {
      if (action?.href) { onActionCompleted?.(result); window.location.assign(action.href); }
      return;
    }
    if (["INSERT_REFERENCE", "JUMP_TO_BLOCK"].includes(kind)) {
      if (!chapterId) { setMessage("Open a chapter to use this action."); return; }
      if (!document.querySelector(".editor-prose")) { setMessage("Return to the chapter editor to insert this reference."); return; }
      dispatchSearchEditorAction({ action: kind, result, projectStructuralVersion: structuralVersion });
    }
  };
  const renderResult = (result: SearchResult) => <article className="search-result" data-current-context={result.currentContext}><header><div><strong>{result.title}</strong><small>{result.documentType.replaceAll("_", " ").toLocaleLowerCase()}</small></div><span>{result.matchReasons.join(" · ")}</span></header>{result.snippet ? <p>{result.snippet}</p> : null}<div className="search-result-actions">{result.actions.map((action) => <button type="button" key={action.kind} data-search-option={action.kind === "PEEK" ? "true" : undefined} onClick={() => void invoke(result, action.kind).catch((caught) => setMessage(caught instanceof Error ? caught.message : "Action unavailable."))}>{action.label}</button>)}</div></article>;
  return <div className="search-groups">
    {message ? <p role="status">{message}</p> : null}
    {trace ? <section className="search-trace" aria-label="Causal context"><strong>{trace.language}</strong><span>{trace.paths.length} bounded paths</span><button type="button" onClick={() => setTrace(null)}>Dismiss</button></section> : null}
    {renderResults ? renderResults(renderResult) : model.groups.map((group) => <section key={group.type} className="search-group" aria-labelledby={`search-group-${group.type}`}><header><h3 id={`search-group-${group.type}`}>{group.label}</h3><span>{group.total}{group.hasMore ? "+" : ""}</span></header><ul>{group.results.map((result) => <li key={result.id}>{renderResult(result)}</li>)}</ul></section>)}
  </div>;
}
