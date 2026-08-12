"use client";

import { useState } from "react";
import type { StructureOverview } from "@/domains/structure/application/ports";

interface Envelope<T> { data?: T; error?: { message: string } }

export function ChapterPlanningGrid({ model, onChanged }: { model: StructureOverview; onChanged(): void }) {
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const assign = async (chapterId: string, volumeId: string) => {
    setBusyId(chapterId); setError(null);
    const volume = model.volumes.find((candidate) => candidate.id === volumeId);
    const volumeSequenceIndex = volume ? model.chapters.filter((chapter) => chapter.volumeId === volume.id).length : null;
    // Console trace S4-UI-011: chapter membership changed from the planning grid without reading manuscript content.
    console.log(JSON.stringify({ level: "info", step: "S4-UI-011", event: "structure.chapter_membership_submitted", projectId: model.project.id, chapterId, assigned: Boolean(volume) }));
    const response = await fetch(`/api/v2/projects/${model.project.id}/structure/chapters/membership`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ expectedStructuralVersion: model.project.structuralVersion, chapterId, volumeId: volume?.id ?? null, volumeSequenceIndex }) });
    const envelope = await response.json() as Envelope<unknown>; setBusyId(null);
    if (!response.ok || !envelope.data) { setError(envelope.error?.message ?? "Chapter membership could not be changed."); return; }
    onChanged();
  };

  return (
    <section className="structure-card planning-grid" aria-labelledby="chapter-grid-title" data-testid="chapters-lens">
      <h2 id="chapter-grid-title">Chapter planning</h2>
      <p className="structure-help">Metadata is optional and editable here. Manuscript content remains in the editor.</p>
      {error ? <p role="alert" className="form-error">{error}</p> : null}
      {model.chapters.length ? <div className="planning-table" role="table" aria-label="Chapter planning grid"><div className="planning-row planning-header" role="row"><span role="columnheader">Chapter</span><span role="columnheader">Outline</span><span role="columnheader">Volume</span><span role="columnheader">Scenes</span></div>{model.chapters.map((chapter) => <div className="planning-row" role="row" key={chapter.id}><span role="cell"><a href={`/app/chapters/${chapter.id}`}>{chapter.displayNumber ?? chapter.sequenceIndex + 1}. {chapter.title}</a></span><span role="cell">{chapter.outlineId ? "Present" : "Optional"}</span><span role="cell"><select aria-label={`Volume for ${chapter.title}`} disabled={busyId === chapter.id} value={chapter.volumeId ?? ""} onChange={(event) => void assign(chapter.id, event.currentTarget.value)}><option value="">Project level</option>{model.volumes.map((volume) => <option key={volume.id} value={volume.id}>{volume.title}</option>)}</select></span><span role="cell">{chapter.sceneCount}</span></div>)}</div> : <p className="structure-empty">No chapters yet. Structure does not block writing the first chapter.</p>}
    </section>
  );
}

