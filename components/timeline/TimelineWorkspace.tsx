"use client";

import { useMemo, useState } from "react";
import type { TimelineEventReadModel, TimelineLinkTargetType, TimelineMode } from "@/domains/timeline/domain/types";

type Envelope<T> = { data?: T; error?: { message: string } };

export function TimelineWorkspace({ projectId, initialEvents, initialStructuralVersion, returnChapterId }: { projectId: string; initialEvents: TimelineEventReadModel[]; initialStructuralVersion: number; returnChapterId?: string }) {
  const [events, setEvents] = useState(initialEvents);
  const [structuralVersion, setStructuralVersion] = useState(initialStructuralVersion);
  const [mode, setMode] = useState<TimelineMode>("ORDINAL");
  const [title, setTitle] = useState("");
  const [displayLabel, setDisplayLabel] = useState("");
  const [first, setFirst] = useState("1");
  const [second, setSecond] = useState("2");
  const [anchor, setAnchor] = useState("");
  const [linkEventId, setLinkEventId] = useState("");
  const [targetType, setTargetType] = useState<TimelineLinkTargetType>("CHAPTER");
  const [targetId, setTargetId] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [status, setStatus] = useState("");
  const ordered = useMemo(() => [...events].sort((a, b) => (a.sortStart ?? a.ordinalValue ?? Number.MAX_SAFE_INTEGER) - (b.sortStart ?? b.ordinalValue ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id)), [events]);

  const create = async () => {
    setStatus("Saving timeline event");
    const numeric = Number(first);
    const body: Record<string, unknown> = { title, mode, displayLabel };
    if (mode === "ABSOLUTE" || mode === "APPROXIMATE") body.sortStart = numeric;
    if (mode === "ORDINAL") body.ordinalValue = numeric;
    if (mode === "RANGE") { body.sortStart = numeric; body.sortEnd = Number(second); }
    if (mode === "RELATIVE") { body.relativeToEventId = anchor; body.relativeOffset = numeric; }
    const response = await fetch(`/api/v2/projects/${projectId}/timeline`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json() as Envelope<{ event: TimelineEventReadModel; projectStructuralVersion: number }>;
    if (!response.ok || !payload.data) { setStatus(payload.error?.message ?? "Timeline event could not be saved."); return; }
    setEvents((current) => [...current, payload.data!.event]); setStructuralVersion(payload.data.projectStructuralVersion); setTitle(""); setDisplayLabel(""); setStatus("Timeline event saved.");
    // Console trace S11-UI-001: Timeline UI completion logs identity/mode/version only and excludes authored temporal content.
    console.log(JSON.stringify({ level: "info", step: "S11-UI-001", event: "timeline.ui_event_created", projectId, sourceId: payload.data.event.id, mode: payload.data.event.mode, structuralVersion: payload.data.projectStructuralVersion }));
  };

  const link = async () => {
    const response = await fetch(`/api/v2/projects/${projectId}/timeline/links`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ eventId: linkEventId, targetType, targetId, ...(linkLabel.trim() ? { label: linkLabel } : {}) }) });
    const payload = await response.json() as Envelope<{ linkId: string; replayed: boolean }>;
    if (!response.ok || !payload.data) { setStatus(payload.error?.message ?? "Timeline link could not be saved."); return; }
    setEvents((current) => current.map((event) => event.id === linkEventId && !event.links.some((item) => item.id === payload.data!.linkId) ? { ...event, links: [...event.links, { id: payload.data!.linkId, targetType, targetId, label: linkLabel.trim() || null }] } : event));
    setTargetId(""); setLinkLabel(""); setStatus(payload.data.replayed ? "Timeline link already existed." : "Timeline link saved without creating causality.");
    // Console trace S11-UI-006: explicit chronology link logs endpoint identities and replay state only; it never emits or implies a causal relation.
    console.log(JSON.stringify({ level: "info", step: "S11-UI-006", event: "timeline.ui_link_created", projectId, sourceId: linkEventId, targetType, targetId, replayed: payload.data.replayed }));
  };

  return <section className="chronicle-workspace" aria-labelledby="timeline-title">
    <header><div><p className="eyebrow">Chronology, not causality</p><h1 id="timeline-title">Timeline</h1></div><a href={returnChapterId ? `/app/chapters/${returnChapterId}` : `/app/projects/${projectId}`}>{returnChapterId ? "Return to Chapter" : "Return to Project Home"}</a></header>
    <p>Display labels remain author-owned. Sort values are mode-specific and do not assume a Gregorian calendar. Structural version {structuralVersion}.</p>
    <form onSubmit={(event) => { event.preventDefault(); void create(); }}><label>Mode<select value={mode} onChange={(event) => setMode(event.target.value as TimelineMode)}>{["ABSOLUTE", "APPROXIMATE", "RELATIVE", "ORDINAL", "RANGE"].map((value) => <option key={value}>{value}</option>)}</select></label><label>Title<input required maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Display label<input required maxLength={200} value={displayLabel} onChange={(event) => setDisplayLabel(event.target.value)} /></label><label>{mode === "RELATIVE" ? "Offset" : mode === "ORDINAL" ? "Order" : "Sortable start"}<input required type="number" step="any" value={first} onChange={(event) => setFirst(event.target.value)} /></label>{mode === "RANGE" ? <label>Sortable end<input required type="number" step="any" value={second} onChange={(event) => setSecond(event.target.value)} /></label> : null}{mode === "RELATIVE" ? <label>Relative to<select required value={anchor} onChange={(event) => setAnchor(event.target.value)}><option value="">Choose event</option>{ordered.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label> : null}<button type="submit">Add event</button></form>
    {ordered.length ? <form onSubmit={(event) => { event.preventDefault(); void link(); }}><label>Timeline event<select required value={linkEventId} onChange={(event) => setLinkEventId(event.target.value)}><option value="">Choose event</option>{ordered.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>Link target type<select value={targetType} onChange={(event) => { setTargetType(event.target.value as TimelineLinkTargetType); setTargetId(""); }}>{["ENTITY", "MILESTONE", "CHAPTER", "TIMELINE_EVENT"].map((value) => <option key={value}>{value}</option>)}</select></label>{targetType === "TIMELINE_EVENT" ? <label>Linked event<select required value={targetId} onChange={(event) => setTargetId(event.target.value)}><option value="">Choose event</option>{ordered.filter((item) => item.id !== linkEventId).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label> : <label>Target ID<input required value={targetId} onChange={(event) => setTargetId(event.target.value)} /></label>}<label>Optional link label<input maxLength={160} value={linkLabel} onChange={(event) => setLinkLabel(event.target.value)} /></label><button type="submit">Link without causality</button></form> : null}
    <p role="status">{status}</p><ol className="chronicle-list">{ordered.map((item) => <li key={item.id}><div><strong>{item.title}</strong><span>{item.displayLabel}</span>{item.links.length ? <small>{item.links.length} explicit link{item.links.length === 1 ? "" : "s"}</small> : null}</div><small>{item.mode} · v{item.version}</small></li>)}</ol>
  </section>;
}
