"use client";

import { useRef, useState } from "react";

interface ScaffoldPlan {
  planToken: string;
  expectedStructuralVersion: number;
  allocations: Array<{ sequenceIndex: number; chapterStart: number; chapterEnd: number; chapterCount: number; advisoryTargetWords: number | null }>;
  placeholderCount: number;
  warnings: string[];
}

interface Envelope<T> { data?: T; error?: { message: string } }

export function BulkScaffold({ projectId, structuralVersion, onApplied }: { projectId: string; structuralVersion: number; onApplied(): void }) {
  const [volumeCount, setVolumeCount] = useState(3);
  const [chapterCount, setChapterCount] = useState(30);
  const [chapterStart, setChapterStart] = useState(1);
  const [targetWords, setTargetWords] = useState<number | "">(90_000);
  const [placeholders, setPlaceholders] = useState(true);
  const [plan, setPlan] = useState<ScaffoldPlan | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [applyBusy, setApplyBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const input = { expectedStructuralVersion: structuralVersion, volumeCount, chapterStart, chapterCount, createChapterOutlinePlaceholders: placeholders, ...(targetWords === "" ? {} : { advisoryProjectTargetWords: targetWords }) };

  const preview = async () => {
    setPreviewBusy(true); setError(null);
    // Console trace S4-UI-003: scaffold preview requested with bounded counts and no creative text.
    console.log(JSON.stringify({ level: "info", step: "S4-UI-003", event: "structure.scaffold_preview_requested", projectId, volumeCount, chapterCount, placeholderRequested: placeholders }));
    const response = await fetch(`/api/v2/projects/${projectId}/structure/scaffold/preview`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
    const envelope = await response.json() as Envelope<ScaffoldPlan>;
    setPreviewBusy(false);
    if (!response.ok || !envelope.data) { setError(envelope.error?.message ?? "The scaffold preview could not be produced."); return; }
    setPlan(envelope.data);
  };

  const apply = async () => {
    if (!plan) return;
    setApplyBusy(true); setError(null);
    // Console trace S4-UI-004: author confirmed the reviewed scaffold plan token.
    console.log(JSON.stringify({ level: "info", step: "S4-UI-004", event: "structure.scaffold_apply_confirmed", projectId, volumeCount: plan.allocations.length, placeholderCount: plan.placeholderCount }));
    const response = await fetch(`/api/v2/projects/${projectId}/structure/scaffold/apply`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ input, planToken: plan.planToken }) });
    const envelope = await response.json() as Envelope<unknown>;
    setApplyBusy(false);
    if (!response.ok || !envelope.data) { setError(envelope.error?.message ?? "The scaffold could not be applied."); return; }
    setPlan(null); triggerRef.current?.focus(); onApplied();
  };

  return (
    <section className="structure-card" aria-labelledby="scaffold-title">
      <h2 id="scaffold-title">Bulk scaffold</h2>
      <p className="structure-help">Create advisory volume ranges and optional chapter-outline placeholders. Review is required before apply.</p>
      <div className="structure-fields">
        <label>Volumes<input type="number" min="1" max="100" value={volumeCount} onChange={(event) => setVolumeCount(event.currentTarget.valueAsNumber)} /></label>
        <label>First chapter<input type="number" min="1" max="100000" value={chapterStart} onChange={(event) => setChapterStart(event.currentTarget.valueAsNumber)} /></label>
        <label>Chapter count<input type="number" min="1" max="10000" value={chapterCount} onChange={(event) => setChapterCount(event.currentTarget.valueAsNumber)} /></label>
        <label>Advisory project words<input type="number" min="1" value={targetWords} onChange={(event) => setTargetWords(event.currentTarget.value ? event.currentTarget.valueAsNumber : "")} /></label>
      </div>
      <label className="structure-check"><input type="checkbox" checked={placeholders} onChange={(event) => setPlaceholders(event.currentTarget.checked)} /> Create chapter-outline placeholders</label>
      {error ? <p role="alert" className="form-error">{error}</p> : null}
      <button ref={triggerRef} type="button" disabled={previewBusy || applyBusy} onClick={() => void preview()}>{previewBusy ? "Calculating..." : "Preview scaffold"}</button>
      {plan ? (
        <div role="dialog" aria-modal="true" aria-labelledby="scaffold-preview-title" className="structure-preview">
          <h3 id="scaffold-preview-title">Scaffold preview</h3>
          <ol>{plan.allocations.map((allocation) => <li key={allocation.sequenceIndex}>Volume {allocation.sequenceIndex + 1}: chapters {allocation.chapterStart}–{allocation.chapterEnd} ({allocation.chapterCount}); {allocation.advisoryTargetWords ?? "no"} advisory words</li>)}</ol>
          {plan.warnings.map((warning) => <p key={warning} className="structure-warning">{warning}</p>)}
          <div className="structure-actions"><button type="button" disabled={applyBusy} onClick={() => void apply()}>{applyBusy ? "Applying..." : "Apply reviewed scaffold"}</button><button type="button" disabled={applyBusy} onClick={() => { setPlan(null); triggerRef.current?.focus(); }}>Cancel</button></div>
        </div>
      ) : null}
    </section>
  );
}
