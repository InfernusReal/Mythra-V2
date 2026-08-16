"use client";

import { useMemo, useState } from "react";
import type { CausalOverview, CausalTraversalProjection } from "@/domains/causality/application/ports";
import type { ChronologyResult } from "@/domains/causality/domain/chronology";
import type { StructureOverview } from "@/domains/structure/application/ports";
import type { PresentationMode } from "@/domains/structure/domain/types";

type Envelope<T> = { data?: T; error?: { message: string } };

export function CausalLens({ structure, model, presentationMode, onChanged }: { structure: StructureOverview; model: CausalOverview; presentationMode: PresentationMode; onChanged: () => void }) {
  const [message, setMessage] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [trace, setTrace] = useState<CausalTraversalProjection | null>(null);
  const [chronology, setChronology] = useState<Record<string, ChronologyResult>>({});
  const [primaryId, setPrimaryId] = useState(model.endpoints[0] ? `${model.endpoints[0].type}:${model.endpoints[0].id}` : "");
  const [secondaryId, setSecondaryId] = useState(model.endpoints[1] ? `${model.endpoints[1].type}:${model.endpoints[1].id}` : primaryId);
  const endpoints = useMemo(() => new Map(model.endpoints.map((item) => [`${item.type}:${item.id}`, item])), [model.endpoints]);

  const request = async <T,>(url: string, init: RequestInit): Promise<T> => {
    setBusy(true); setMessage(null);
    try { const response = await fetch(url, init); const envelope = await response.json() as Envelope<T>; if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? "The causal operation failed."); return envelope.data; }
    finally { setBusy(false); }
  };

  const createChange = async (form: FormData) => {
    try {
      await request(`/api/v2/projects/${structure.project.id}/causality/story-changes`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ expectedStructuralVersion: model.projectStructuralVersion, kind: form.get("kind"), title: form.get("title"), storyTime: form.get("storyTime") ? Number(form.get("storyTime")) : undefined, discoveryTime: form.get("discoveryTime") ? Number(form.get("discoveryTime")) : undefined, isPlaceholder: false }) });
      // Console trace S6-UI-001: one-line Story Change creation completed without logging authored text or time values.
      console.log(JSON.stringify({ level: "info", step: "S6-UI-001", event: "causality.story_change_created", projectId: structure.project.id, kind: form.get("kind") }));
      onChanged();
    } catch (error) { setMessage(error instanceof Error ? error.message : "The Story Change could not be created."); }
  };

  const compose = async (form: FormData) => {
    const primary = endpoints.get(primaryId); const secondary = endpoints.get(secondaryId); if (!primary || !secondary) return setMessage("Choose two available story endpoints.");
    const mode = String(form.get("phrase")); const source = mode === "BECAUSE" ? secondary : primary; const target = mode === "BECAUSE" ? primary : secondary;
    try {
      await request(`/api/v2/projects/${structure.project.id}/causality/relations`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ expectedStructuralVersion: model.projectStructuralVersion, source: { type: source.type, id: source.id }, target: { type: target.type, id: target.id }, relationType: form.get("relationType"), condition: form.get("condition") || undefined, strength: Number(form.get("strength")), importance: Number(form.get("importance")), state: form.get("state"), isHard: form.get("hard") === "on", temporalProgression: form.get("temporal") === "on", mutualStateSemantics: form.get("mutual") === "on", note: form.get("note") || undefined, provenanceType: "DIRECT", provenanceNote: form.get("provenanceNote") || undefined }) });
      // Console trace S6-UI-002: cause/effect phrase committed with endpoint types and relation metadata only.
      console.log(JSON.stringify({ level: "info", step: "S6-UI-002", event: "causality.composed", projectId: structure.project.id, phrase: mode, sourceType: source.type, targetType: target.type, relationType: form.get("relationType") }));
      onChanged();
    } catch (error) { setMessage(error instanceof Error ? error.message : "The causal relation could not be created."); }
  };

  const traceFrom = async (direction: "UPSTREAM" | "DOWNSTREAM") => {
    const root = endpoints.get(primaryId); if (!root) return setMessage("Choose an available story endpoint.");
    try {
      const result = await request<CausalTraversalProjection>(`/api/v2/projects/${structure.project.id}/causality/${direction === "UPSTREAM" ? "neighborhood" : "impact"}?endpointType=${root.type}&endpointId=${root.id}&direction=${direction}&maxDepth=4&nodeBudget=200&edgeBudget=300&pathBudget=200`, { method: "GET" }); setTrace(result);
      // Console trace S6-UI-003: bounded Why-now/What-changes trace displayed with aggregate facts only.
      console.log(JSON.stringify({ level: "info", step: "S6-UI-003", event: "causality.trace_displayed", projectId: structure.project.id, direction, pathCount: result.paths.length, truncated: result.truncated }));
    } catch (error) { setMessage(error instanceof Error ? error.message : "The causal trace could not be loaded."); }
  };

  const lifecycle = async (relationId: string, action: "REATTACH" | "RETIRE" | "ARCHIVE") => {
    const source = endpoints.get(primaryId); const target = endpoints.get(secondaryId);
    if (action === "REATTACH" && (!source || !target)) return setMessage("Choose A and B before reattaching the relation.");
    try { await request(`/api/v2/projects/${structure.project.id}/causality/relations/lifecycle`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ expectedStructuralVersion: model.projectStructuralVersion, relationId, action, ...(action === "REATTACH" ? { source: { type: source!.type, id: source!.id }, target: { type: target!.type, id: target!.id } } : {}) }) });
      // Console trace S6-UI-004: explicit causal evidence lifecycle choice completed.
      console.log(JSON.stringify({ level: "info", step: "S6-UI-004", event: "causality.lifecycle_selected", projectId: structure.project.id, relationId, action })); onChanged();
    } catch (error) { setMessage(error instanceof Error ? error.message : "The relation could not be updated."); }
  };

  const checkChronology = async (relationId: string) => {
    try {
      const result = await request<{ chronology: ChronologyResult }>(`/api/v2/projects/${structure.project.id}/causality/chronology`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ relationId }) }); setChronology((current) => ({ ...current, [relationId]: result.chronology }));
      // Console trace S6-UI-008: neutral chronology result displayed without story-time values or authored content.
      console.log(JSON.stringify({ level: "info", step: "S6-UI-008", event: "causality.chronology_displayed", projectId: structure.project.id, relationId, status: result.chronology.status, basis: result.chronology.basis, warningCount: result.chronology.warnings.length }));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Chronology could not be checked."); }
  };

  return <section className="causal-lens" aria-labelledby="causal-lens-title">
    <header><p className="eyebrow">Causal Story Fabric</p><h2 id="causal-lens-title">Because and consequence</h2><p>Record only the relationships you mean. Causality is optional and never inferred from chapter order.</p></header>
    {message ? <p role="alert">{message}</p> : null}
    <form action={createChange} className="causal-form"><h3>One-line Story Change</h3><label>Kind<select name="kind"><option>EVENT</option><option>DECISION</option><option>REVELATION</option><option>STATE_CHANGE</option><option>SETUP</option><option>PAYOFF</option><option>CONDITION</option><option>OUTCOME</option><option>CUSTOM</option></select></label><label>Change<input name="title" required maxLength={240} /></label><label>Story time (optional)<input name="storyTime" type="number" step="any" /></label><label>Discovery time (revelations)<input name="discoveryTime" type="number" step="any" /></label><button disabled={busy} type="submit">Add Story Change</button></form>
    {model.endpoints.length >= 2 ? <form action={compose} className="causal-form"><h3>Cause and effect</h3><label>A<select value={primaryId} onChange={(event) => setPrimaryId(event.currentTarget.value)}>{model.endpoints.map((item) => <option key={`${item.type}:${item.id}`} value={`${item.type}:${item.id}`}>{item.label} ({item.type.toLowerCase().replaceAll("_", " ")})</option>)}</select></label><label>Phrase<select name="phrase"><option value="BECAUSE">A because of B</option><option value="CAUSES">A causes B</option></select></label><label>B<select value={secondaryId} onChange={(event) => setSecondaryId(event.currentTarget.value)}>{model.endpoints.map((item) => <option key={`${item.type}:${item.id}`} value={`${item.type}:${item.id}`}>{item.label} ({item.type.toLowerCase().replaceAll("_", " ")})</option>)}</select></label><label>Relationship<select name="relationType"><option>CAUSES</option><option>ENABLES</option><option>REQUIRES</option><option>MOTIVATES</option><option>TRIGGERS</option><option>ESCALATES</option><option value="PREVENTS_BLOCKS">PREVENTS / BLOCKS</option><option>REVEALS</option><option>TRANSFORMS</option><option>RESOLVES</option></select></label><label>State<select name="state"><option>ACTIVE</option><option>TENTATIVE</option><option>RETIRED</option></select></label><label>Condition (optional)<input name="condition" maxLength={4000} /></label><label>Note (optional)<textarea name="note" maxLength={8000} /></label><label>Provenance note (optional)<input name="provenanceNote" maxLength={4000} /></label><label>Strength<input name="strength" type="number" min="0" max="1" step="0.1" defaultValue="1" /></label><label>Importance<input name="importance" type="number" min="0" max="100" defaultValue="50" /></label><fieldset><legend>Requires-cycle semantics</legend><label><input name="hard" type="checkbox" /> Hard requires</label><label><input name="temporal" type="checkbox" /> Temporal progression</label><label><input name="mutual" type="checkbox" /> Mutual-state semantics</label></fieldset><button disabled={busy} type="submit">Record causal relation</button></form> : null}
    {model.endpoints.length ? <div className="causal-trace-actions"><button disabled={busy} onClick={() => void traceFrom("UPSTREAM")}>Why now?</button><button disabled={busy} onClick={() => void traceFrom("DOWNSTREAM")}>What changes?</button></div> : null}
    {model.relations.length ? <section aria-labelledby="causal-list-title"><h3 id="causal-list-title">Causal relationships</h3><p>To reattach an archived endpoint, choose replacement A and B above, then use Reattach.</p><ol className="causal-list">{model.relations.map((relation) => { const source = endpoints.get(`${relation.source.type}:${relation.source.id}`); const target = endpoints.get(`${relation.target.type}:${relation.target.id}`); const check = chronology[relation.id]; return <li key={relation.id}><strong>{source?.label ?? relation.source.type}</strong> <span>{relation.relationType.toLowerCase().replaceAll("_", " ")}</span> <strong>{target?.label ?? relation.target.type}</strong><small>{relation.state.toLowerCase()} · provenance {relation.provenanceType.toLowerCase().replaceAll("_", " ")}</small>{relation.condition ? <p>Condition: {relation.condition}</p> : null}{relation.note ? <p>Note: {relation.note}</p> : null}<div><button onClick={() => void checkChronology(relation.id)}>Check chronology</button><button onClick={() => void lifecycle(relation.id, "REATTACH")}>Reattach to A and B</button><button onClick={() => void lifecycle(relation.id, "RETIRE")}>Retire</button><button onClick={() => void lifecycle(relation.id, "ARCHIVE")}>Archive relation</button></div>{check ? <p role="status">{check.status.toLowerCase().replaceAll("_", " ")} using {check.basis.toLowerCase().replaceAll("_", " ")}.{check.warnings.map((warning) => ` ${warning.message}`).join("")}</p> : null}</li>; })}</ol></section> : null}
    {presentationMode === "ARCHITECT" && model.relations.length ? <section aria-labelledby="local-graph-title"><h3 id="local-graph-title">Local graph</h3><div className="causal-local-graph" aria-hidden="true">{model.relations.slice(0, 12).map((relation) => <span key={relation.id}>{relation.source.type} → {relation.target.type}</span>)}</div><p>The relationship list above is the accessible equivalent.</p></section> : null}
    {trace ? <section aria-labelledby="causal-trace-title"><h3 id="causal-trace-title">{trace.paths[0]?.direction === "UPSTREAM" ? "Why now?" : "What changes?"}</h3><p>{trace.paths.length} potentially affected paths within {trace.nodeCount} nodes and {trace.edgeCount} inspected edges.{trace.truncated ? " Results stopped at the declared budget." : ""}</p><ol className="causal-list">{trace.paths.map((path, index) => <li key={`${path.direction}:${path.endpoint.id}:${index}`}><strong>{path.endpoint.label}</strong><small>depth {path.depth}; {path.steps.map((step) => `${step.relationType.toLowerCase()} [${step.provenanceType.toLowerCase()}]`).join(" → ")}</small></li>)}</ol></section> : null}
  </section>;
}
