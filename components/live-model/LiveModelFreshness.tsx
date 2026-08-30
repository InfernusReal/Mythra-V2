"use client";

import { useCallback, useEffect, useState } from "react";

type FreshnessState = "FRESH" | "UPDATING" | "STALE" | "UNAVAILABLE";

interface LiveModelStatus {
  projectStructuralVersion: number;
  projectionCount: number;
  freshCount: number;
  updatingCount: number;
  staleCount: number;
  failedCount: number;
  pendingEventCount: number;
  processingEventCount: number;
  failedEventCount: number;
  lagMilliseconds: number;
  warnings: Array<{ id: string; warningType: string; message: string; sourceType: string; sourceId: string; suppressed: boolean; suppressible: boolean }>;
}

function classify(model: LiveModelStatus | null, unavailable: boolean): FreshnessState {
  if (unavailable || model?.failedCount || model?.failedEventCount) return "UNAVAILABLE";
  if (!model || model.projectionCount === 0 || model.updatingCount || model.pendingEventCount || model.processingEventCount) return "UPDATING";
  if (model.staleCount) return "STALE";
  return "FRESH";
}

const labels: Record<FreshnessState, string> = { FRESH: "Story model current", UPDATING: "Story model updating", STALE: "Story model stale", UNAVAILABLE: "Story model unavailable" };

export function LiveModelFreshness({ projectId, allowRepair = false }: { projectId: string; allowRepair?: boolean }) {
  const [model, setModel] = useState<LiveModelStatus | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`/api/v2/projects/${projectId}/live-model`, { signal, cache: "no-store" });
      if (!response.ok) throw new Error("LIVE_MODEL_STATUS_UNAVAILABLE");
      const envelope = await response.json() as { data: LiveModelStatus };
      setModel(envelope.data); setUnavailable(false);
      // Console trace S12-UI-001: freshness response applies only versions, counts, and safe warning classifications.
      console.log(JSON.stringify({ level: "info", step: "S12-UI-001", event: "live_model.freshness_applied", projectId, structuralVersion: envelope.data.projectStructuralVersion, projectionCount: envelope.data.projectionCount, staleCount: envelope.data.staleCount, pendingEventCount: envelope.data.pendingEventCount, warningCount: envelope.data.warnings.length }));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setUnavailable(true);
      // Console trace S12-UI-002: supporting freshness failure is content-free and never changes editor writability.
      console.log(JSON.stringify({ level: "warn", step: "S12-UI-002", event: "live_model.freshness_unavailable", projectId, errorCode: "DEPENDENCY_UNAVAILABLE" }));
    }
  }, [projectId]);

  useEffect(() => {
    const controller = new AbortController();
    const initial = window.setTimeout(() => void refresh(controller.signal), 0);
    const timer = window.setInterval(() => void refresh(), 15_000);
    return () => { controller.abort(); window.clearTimeout(initial); window.clearInterval(timer); };
  }, [refresh]);

  const rebuild = async () => {
    setBusy(true);
    try {
      const response = await fetch(`/api/v2/projects/${projectId}/live-model/rebuild`, { method: "POST" });
      if (!response.ok) throw new Error("LIVE_MODEL_REBUILD_FAILED");
      // Console trace S12-UI-003: manual one-project repair completed without exposing projection payloads.
      console.log(JSON.stringify({ level: "info", step: "S12-UI-003", event: "live_model.rebuild_completed", projectId }));
      await refresh();
    } catch {
      setUnavailable(true);
      // Console trace S12-UI-004: repair failure is reported as a stable support error while writing remains available.
      console.log(JSON.stringify({ level: "warn", step: "S12-UI-004", event: "live_model.rebuild_failed", projectId, errorCode: "RETRYABLE" }));
    } finally { setBusy(false); }
  };

  const suppress = async (warningId: string) => {
    const response = await fetch(`/api/v2/projects/${projectId}/live-model/warnings/${warningId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ suppressed: true }) });
    if (!response.ok) return;
    // Console trace S12-UI-005: neutral warning suppression records only project and warning identifiers.
    console.log(JSON.stringify({ level: "info", step: "S12-UI-005", event: "live_model.warning_suppressed", projectId, warningId }));
    await refresh();
  };

  const state = classify(model, unavailable);
  const visibleWarnings = model?.warnings.filter((warning) => !warning.suppressed) ?? [];
  return <aside className="live-model-freshness" data-state={state} aria-label="Live Story Model status">
    <div role="status" aria-live="polite"><span aria-hidden="true" className="live-model-dot" /><strong>{labels[state]}</strong>{model ? <small>Structure v{model.projectStructuralVersion} · lag {Math.round(model.lagMilliseconds / 1_000)}s</small> : null}</div>
    {allowRepair && state !== "FRESH" ? <button type="button" disabled={busy} onClick={() => void rebuild()}>{busy ? "Repairing" : "Repair from canonical data"}</button> : null}
    {visibleWarnings.length ? <details><summary>{visibleWarnings.length} factual warning{visibleWarnings.length === 1 ? "" : "s"}</summary><ul>{visibleWarnings.map((warning) => <li key={warning.id}><span>{warning.message}</span>{warning.suppressible ? <button type="button" onClick={() => void suppress(warning.id)}>Suppress</button> : <small>Integrity rule</small>}</li>)}</ul></details> : null}
  </aside>;
}
