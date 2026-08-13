"use client";

import { useState, type FormEvent } from "react";
import type { StructureOverview } from "@/domains/structure/application/ports";

interface Envelope<T> { data?: T; error?: { message: string } }
const endpointTypes = ["PLOT", "PLOT_OUTLINE", "VOLUME", "VOLUME_OUTLINE", "MILESTONE", "CHAPTER_OUTLINE", "CHAPTER", "SCENE", "NARRATIVE_INTENT", "MANUSCRIPT_BLOCK"] as const;

export function RelationshipLens({ model, onChanged }: { model: StructureOverview; onChanged(): void }) {
  const [sourceType, setSourceType] = useState<(typeof endpointTypes)[number]>("CHAPTER");
  const [sourceId, setSourceId] = useState("");
  const [targetType, setTargetType] = useState<(typeof endpointTypes)[number]>("CHAPTER_OUTLINE");
  const [targetId, setTargetId] = useState("");
  const [relationshipKey, setRelationshipKey] = useState("references");
  const [error, setError] = useState<string | null>(null);

  const create = async (event: FormEvent) => {
    event.preventDefault(); setError(null);
    // Console trace S4-UI-012: non-causal relationship submitted with endpoint identity only.
    console.log(JSON.stringify({ level: "info", step: "S4-UI-012", event: "structure.reference_submitted", projectId: model.project.id, sourceType, targetType }));
    const response = await fetch(`/api/v2/projects/${model.project.id}/structure/references`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ expectedStructuralVersion: model.project.structuralVersion, sourceType, sourceId, targetType, targetId, relationshipKey, provenanceType: "DIRECT" }) });
    const envelope = await response.json() as Envelope<unknown>;
    if (!response.ok || !envelope.data) { setError(envelope.error?.message ?? "The reference could not be created."); return; }
    onChanged();
  };

  return (
    <div className="structure-stack" data-testid="relationships-lens">
      <form className="structure-card" onSubmit={(event) => void create(event)}><h2>Create non-causal reference</h2><p className="structure-help">References express relevance only. They do not assert cause, chronology, or containment.</p><div className="structure-fields"><label>Source type<select value={sourceType} onChange={(event) => setSourceType(event.currentTarget.value as typeof sourceType)}>{endpointTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label>Source ID<input value={sourceId} required pattern="[0-9a-fA-F-]{36}" onChange={(event) => setSourceId(event.currentTarget.value)} /></label><label>Target type<select value={targetType} onChange={(event) => setTargetType(event.currentTarget.value as typeof targetType)}>{endpointTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label>Target ID<input value={targetId} required pattern="[0-9a-fA-F-]{36}" onChange={(event) => setTargetId(event.currentTarget.value)} /></label><label>Relationship key<input value={relationshipKey} required maxLength={80} onChange={(event) => setRelationshipKey(event.currentTarget.value)} /></label></div>{error ? <p role="alert" className="form-error">{error}</p> : null}<button>Create reference</button></form>
      <section className="structure-card" aria-labelledby="relationship-list-title"><h2 id="relationship-list-title">Relationships</h2>{model.references.length ? <ol className="structure-list">{model.references.map((reference) => <li key={reference.id}><strong>{reference.sourceType} → {reference.targetType}</strong><span>{reference.relationshipKey} · non-causal</span></li>)}</ol> : <p className="structure-empty">No references. A relationship dashboard is not required to write.</p>}</section>
    </div>
  );
}
