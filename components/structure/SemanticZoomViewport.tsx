"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { StructureOverview } from "@/domains/structure/application/ports";
import type { MilestoneOverview } from "@/domains/milestones/application/ports";
import type { NarrativeIntentTargetType } from "@/domains/structure/domain/types";
import { buildSemanticCoordinate } from "@/domains/structure/domain/semantic-coordinate";

interface Envelope<T> { data?: T; error?: { message: string } }

export function SemanticZoomViewport({ model, milestones, onAnchor, onChanged }: { model: StructureOverview; milestones: MilestoneOverview; onAnchor(type: string, id: string): void; onChanged(): void }) {
  const [chapterId, setChapterId] = useState(model.chapters[0]?.id ?? "");
  const [targetType, setTargetType] = useState<NarrativeIntentTargetType>(model.plot ? "PLOT" : "CHAPTER");
  const [targetId, setTargetId] = useState(model.plot?.id ?? model.chapters[0]?.id ?? "");
  const [intent, setIntent] = useState("");
  const [category, setCategory] = useState("ATMOSPHERE");
  const [customCategory, setCustomCategory] = useState("");
  const [blockId, setBlockId] = useState("");
  const [selectionAnchor, setSelectionAnchor] = useState(0);
  const [selectionHead, setSelectionHead] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const chapter = model.chapters.find((candidate) => candidate.id === chapterId);
  const volume = model.volumes.find((candidate) => candidate.id === chapter?.volumeId);
  const outline = model.chapterOutlines.find((candidate) => candidate.chapterId === chapter?.id);
  const milestoneThreadIds = milestones.links.filter((link) => link.chapterId === chapter?.id).map((link) => link.milestoneId);
  const coordinate = buildSemanticCoordinate({ projectId: model.project.id, plotId: model.plot?.id, plotOutlineId: model.plot?.outlineId, volumeId: volume?.id, volumeOutlineId: volume?.outlineId, milestoneThreadIds, chapterOutlineId: outline?.id, chapterId: chapter?.id });
  const targets = useMemo(() => ({
    PLOT: model.plot ? [{ id: model.plot.id, label: model.plot.title }] : [],
    VOLUME: model.volumes.map((item) => ({ id: item.id, label: item.title })),
    MILESTONE: milestones.milestones.map((item) => ({ id: item.id, label: item.title })),
    CHAPTER: model.chapters.map((item) => ({ id: item.id, label: item.title })),
    SCENE: model.scenes.map((item) => ({ id: item.id, label: item.title })),
    PARAGRAPH_SELECTION: model.chapters.map((item) => ({ id: item.id, label: item.title })),
    ENTITY_ARC: model.entityArcs.map((item) => ({ id: item.id, label: item.name }))
  }), [model, milestones]);

  const selectChapter = (id: string) => {
    setChapterId(id); if (!id) return;
    // Console trace S4-UI-010: Semantic Zoom anchor changed using stable identity only.
    console.log(JSON.stringify({ level: "info", step: "S4-UI-010", event: "structure.semantic_anchor_changed", projectId: model.project.id, anchorType: "CHAPTER", anchorId: id }));
    onAnchor("CHAPTER", id);
  };

  const changeTargetType = (next: NarrativeIntentTargetType) => {
    setTargetType(next); setTargetId(targets[next][0]?.id ?? "");
  };

  const createIntent = async (event: FormEvent) => {
    event.preventDefault(); if (!targetId) return; setError(null);
    // Console trace S4-UI-013: Narrative Intent submitted without logging the intent text or selection content.
    console.log(JSON.stringify({ level: "info", step: "S4-UI-013", event: "structure.intent_submitted", projectId: model.project.id, targetType, category }));
    const selection = targetType === "PARAGRAPH_SELECTION" ? { blockId, selectionAnchor, selectionHead } : {};
    const response = await fetch(`/api/v2/projects/${model.project.id}/structure/intents`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ expectedStructuralVersion: model.project.structuralVersion, targetType, targetId, category, ...(category === "CUSTOM" ? { customCategory } : {}), ...selection, intentText: intent }) });
    const envelope = await response.json() as Envelope<unknown>;
    if (!response.ok || !envelope.data) { setError(envelope.error?.message ?? "The intent could not be saved."); return; }
    setIntent(""); onChanged();
  };

  return (
    <div className="structure-stack" data-testid="semantic-zoom-lens">
      <section className="structure-card" aria-labelledby="semantic-zoom-title"><h2 id="semantic-zoom-title">Semantic Zoom</h2><label>Active chapter<select value={chapterId} onChange={(event) => selectChapter(event.currentTarget.value)}><option value="">Project only</option>{model.chapters.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><ol className="semantic-path">{coordinate.orderedPath.map((step) => <li key={`${step.level}-${step.id}`}><span>{step.level.replaceAll("_", " ")}</span><small>{step.relationship}</small></li>)}</ol><p className="structure-help">Optional levels are skipped. Milestone/Thread appears only as cross-cutting relevance, never ownership containment.</p></section>
      <form className="structure-card" onSubmit={(event) => void createIntent(event)}><h2>Narrative Intent</h2><div className="structure-fields"><label>Target type<select value={targetType} onChange={(event) => changeTargetType(event.currentTarget.value as NarrativeIntentTargetType)}>{(["PLOT", "VOLUME", "MILESTONE", "CHAPTER", "SCENE", "PARAGRAPH_SELECTION", "ENTITY_ARC"] as const).map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label><label>Target<select value={targetId} required onChange={(event) => setTargetId(event.currentTarget.value)}>{targets[targetType].map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>Category<select value={category} onChange={(event) => setCategory(event.currentTarget.value)}>{["TENSION", "REVELATION", "EMOTION", "PACING", "AMBIGUITY", "ATMOSPHERE", "CUSTOM"].map((item) => <option key={item}>{item}</option>)}</select></label>{category === "CUSTOM" ? <label>Custom category<input value={customCategory} required maxLength={80} onChange={(event) => setCustomCategory(event.currentTarget.value)} /></label> : null}</div>{targetType === "PARAGRAPH_SELECTION" ? <div className="structure-fields"><label>Stable block ID<input value={blockId} required maxLength={128} onChange={(event) => setBlockId(event.currentTarget.value)} /></label><label>Selection start<input type="number" min="0" value={selectionAnchor} onChange={(event) => setSelectionAnchor(event.currentTarget.valueAsNumber)} /></label><label>Selection end<input type="number" min="0" value={selectionHead} onChange={(event) => setSelectionHead(event.currentTarget.valueAsNumber)} /></label></div> : null}<label>Intent<textarea value={intent} required maxLength={20000} onChange={(event) => setIntent(event.currentTarget.value)} /></label>{error ? <p role="alert" className="form-error">{error}</p> : null}<button disabled={!targetId}>Save intent</button></form>
      <section className="structure-card" aria-labelledby="intent-list-title"><h2 id="intent-list-title">Active intents</h2>{model.intents.length ? <p>{model.intents.length} intent targets are attached in this bounded view.</p> : <p className="structure-empty">No Narrative Intent is required.</p>}</section>
    </div>
  );
}
