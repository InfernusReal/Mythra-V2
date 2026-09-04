"use client";

import { useState } from "react";
import type { ResolvedSuggestionStatus, SuggestionReadModel, SuggestionStatus } from "@/domains/suggestions/domain/types";
import { clientTrace } from "@/lib/observability/client-trace";

type Envelope<T> = { data?: T; error?: { message: string } };

const statusLabels: Record<SuggestionStatus, string> = { open: "Open", accepted: "Accepted", modified: "Modified", rejected: "Rejected", intentional: "Intentional" };

export function SuggestionInbox({ projectId, initialSuggestions, initialCursor }: { projectId: string; initialSuggestions: SuggestionReadModel[]; initialCursor: string | null }) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const decide = async (suggestion: SuggestionReadModel, decision: ResolvedSuggestionStatus) => {
    const authorNote = notes[suggestion.id]?.trim();
    if (decision === "modified" && !authorNote) { setStatus("A modified decision requires an author note."); return; }
    setBusyId(suggestion.id);
    const response = await fetch(`/api/v2/projects/${projectId}/suggestions/${suggestion.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ expectedVersion: suggestion.version, status: decision, ...(authorNote ? { authorNote } : {}) }) });
    const payload = await response.json() as Envelope<SuggestionReadModel>;
    setBusyId(null);
    if (!response.ok || !payload.data) { setStatus(payload.error?.message ?? "The suggestion decision could not be saved."); return; }
    setSuggestions((current) => current.map((item) => item.id === suggestion.id ? payload.data! : item));
    setStatus(`Suggestion marked ${statusLabels[decision].toLocaleLowerCase("en")}. Canonical story data was not changed.`);
    // Console trace S17-SUGGESTION-UI-001: author decision interaction records proposal identity, status and version only.
    clientTrace("suggestion.ui_resolved", { step: "S17-SUGGESTION-UI-001", projectId, suggestionId: suggestion.id, suggestionStatus: decision, version: payload.data.version });
  };

  return <section className="suggestion-inbox" aria-labelledby="suggestion-title">
    <header><div><p className="eyebrow">Author-controlled review</p><h1 id="suggestion-title">Suggestions</h1></div><a href={`/app/projects/${projectId}`}>Return to Project Home</a></header>
    <p>Agents may diagnose, explain, and propose. Your decision is recorded here; no decision silently changes prose, structure, or causal relations.</p>
    <p className="suggestion-cursor">Initial page: {suggestions.length} suggestions{initialCursor ? "; additional results available through the bounded API" : ""}.</p>
    {suggestions.length ? <ol>{suggestions.map((suggestion) => <li key={suggestion.id} data-status={suggestion.status}>
      <header><div><strong>{suggestion.category.replaceAll("_", " ")}</strong><small>{suggestion.sourceAgent}</small></div><span>{statusLabels[suggestion.status]}</span></header>
      <p>{suggestion.finding}</p>
      <dl><div><dt>Evidence</dt><dd>{suggestion.evidenceReferences.length}</dd></div><div><dt>Actions</dt><dd>{suggestion.proposedActions.length}</dd></div><div><dt>Confidence</dt><dd>{suggestion.confidence === null ? "Not asserted" : suggestion.confidence.toFixed(2)}</dd></div></dl>
      {suggestion.status === "open" ? <form onSubmit={(event) => { event.preventDefault(); void decide(suggestion, "accepted"); }}>
        <label>Author note<textarea maxLength={20000} value={notes[suggestion.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [suggestion.id]: event.target.value }))} /></label>
        <div><button disabled={busyId === suggestion.id} type="submit">Accept finding</button><button disabled={busyId === suggestion.id} type="button" onClick={() => void decide(suggestion, "modified")}>Accept with modification</button><button disabled={busyId === suggestion.id} type="button" onClick={() => void decide(suggestion, "rejected")}>Reject</button><button disabled={busyId === suggestion.id} type="button" onClick={() => void decide(suggestion, "intentional")}>Mark intentional</button></div>
      </form> : suggestion.authorNote ? <p><strong>Author note:</strong> {suggestion.authorNote}</p> : null}
    </li>)}</ol> : <p>No suggestions require review.</p>}
    <p role="status" aria-live="polite">{status}</p>
  </section>;
}
