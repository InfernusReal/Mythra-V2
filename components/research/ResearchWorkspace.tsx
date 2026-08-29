"use client";

import { useState } from "react";
import type { NoteReadModel } from "@/domains/notes/domain/types";
import type { ResearchItemReadModel, ResearchKind } from "@/domains/research/domain/types";

type Envelope<T> = { data?: T; error?: { message: string } };

export function ResearchWorkspace({ projectId, initialNotes, initialItems, initialStructuralVersion, returnChapterId }: { projectId: string; initialNotes: NoteReadModel[]; initialItems: ResearchItemReadModel[]; initialStructuralVersion: number; returnChapterId?: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [items, setItems] = useState(initialItems);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [tags, setTags] = useState("");
  const [kind, setKind] = useState<Exclude<ResearchKind, "FILE">>("NOTE");
  const [researchTitle, setResearchTitle] = useState("");
  const [researchValue, setResearchValue] = useState("");
  const [status, setStatus] = useState("");
  const [structuralVersion, setStructuralVersion] = useState(initialStructuralVersion);
  const [promotionNoteId, setPromotionNoteId] = useState("");
  const [promotionType, setPromotionType] = useState<"MILESTONE" | "STORY_CHANGE" | "CHAPTER_OUTLINE">("STORY_CHANGE");

  const createNote = async () => {
    const response = await fetch(`/api/v2/projects/${projectId}/notes`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: noteTitle, body: noteBody, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean) }) });
    const payload = await response.json() as Envelope<{ note: NoteReadModel }>;
    if (!response.ok || !payload.data) { setStatus(payload.error?.message ?? "Note could not be saved."); return; }
    setNotes((current) => [payload.data!.note, ...current]); setNoteTitle(""); setNoteBody(""); setTags(""); setStatus("Durable note saved.");
    // Console trace S11-UI-002: Note UI completion logs identity/version/counts only and excludes Note content.
    console.log(JSON.stringify({ level: "info", step: "S11-UI-002", event: "notes.ui_created", projectId, sourceId: payload.data.note.id, version: payload.data.note.version, tagCount: payload.data.note.tags.length }));
  };

  const createResearch = async () => {
    const field = kind === "URL" ? "url" : kind === "EXCERPT" ? "excerpt" : kind === "CITATION" ? "citation" : "body";
    const response = await fetch(`/api/v2/projects/${projectId}/research`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, title: researchTitle, [field]: researchValue }) });
    const payload = await response.json() as Envelope<{ item: ResearchItemReadModel }>;
    if (!response.ok || !payload.data) { setStatus(payload.error?.message ?? "Research could not be saved."); return; }
    setItems((current) => [payload.data!.item, ...current]); setResearchTitle(""); setResearchValue(""); setStatus("Research item saved.");
    // Console trace S11-UI-003: Research UI completion logs identity/kind/version only and excludes URLs, citations and excerpts.
    console.log(JSON.stringify({ level: "info", step: "S11-UI-003", event: "research.ui_created", projectId, sourceId: payload.data.item.id, kind: payload.data.item.kind, version: payload.data.item.version }));
  };

  const upload = async (file: File) => {
    const form = new FormData(); form.set("file", file);
    const response = await fetch(`/api/v2/projects/${projectId}/research/assets`, { method: "POST", body: form });
    const payload = await response.json() as Envelope<{ assetId: string }>;
    if (!response.ok || !payload.data) { setStatus(payload.error?.message ?? "File validation failed."); return; }
    const itemResponse = await fetch(`/api/v2/projects/${projectId}/research`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "FILE", title: file.name, assetId: payload.data.assetId }) });
    const itemPayload = await itemResponse.json() as Envelope<{ item: ResearchItemReadModel }>;
    if (!itemResponse.ok || !itemPayload.data) { setStatus(itemPayload.error?.message ?? "The validated file could not be added to Research."); return; }
    setItems((current) => [itemPayload.data!.item, ...current]); setStatus("Private file validated, scanned, and added to Research.");
    // Console trace S11-UI-004: upload UI completion logs asset identity/byte count/MIME only and excludes file name/content.
    console.log(JSON.stringify({ level: "info", step: "S11-UI-004", event: "research.ui_asset_ready", projectId, sourceId: payload.data.assetId, researchItemId: itemPayload.data.item.id, sizeBytes: file.size, contentType: file.type }));
  };

  const downloadAsset = async (assetId: string) => {
    const response = await fetch(`/api/v2/projects/${projectId}/research/assets/${assetId}/access`, { method: "POST" });
    const payload = await response.json() as Envelope<{ href: string; expiresInSeconds: number }>;
    if (!response.ok || !payload.data) { setStatus(payload.error?.message ?? "Private file access is unavailable."); return; }
    window.location.assign(payload.data.href);
    // Console trace S11-UI-005: private asset access logs asset identity and token lifetime only; signed URL/token and file metadata are excluded.
    console.log(JSON.stringify({ level: "info", step: "S11-UI-005", event: "research.ui_asset_accessed", projectId, sourceId: assetId, expiresInSeconds: payload.data.expiresInSeconds }));
  };

  const promoteNote = async () => {
    const response = await fetch(`/api/v2/projects/${projectId}/notes/promotions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ noteId: promotionNoteId, targetType: promotionType, idempotencyKey: crypto.randomUUID(), expectedStructuralVersion: structuralVersion }) });
    const payload = await response.json() as Envelope<{ targetId: string; targetType: string; projectStructuralVersion: number; replayed: boolean }>;
    if (!response.ok || !payload.data) { setStatus(payload.error?.message ?? "Note promotion could not be completed."); return; }
    setStructuralVersion(payload.data.projectStructuralVersion); setStatus(`Note promoted to ${payload.data.targetType.toLocaleLowerCase().replace("_", " ")} with source provenance retained.`);
    // Console trace S11-UI-007: Note promotion completion logs source/target/version identity only and excludes Note content.
    console.log(JSON.stringify({ level: "info", step: "S11-UI-007", event: "notes.ui_promoted", projectId, sourceId: promotionNoteId, targetType: payload.data.targetType, targetId: payload.data.targetId, structuralVersion: payload.data.projectStructuralVersion, replayed: payload.data.replayed }));
  };

  return <section className="chronicle-workspace" aria-labelledby="research-title">
    <header><div><p className="eyebrow">Reference without context switching</p><h1 id="research-title">Notes and Research</h1></div><a href={returnChapterId ? `/app/chapters/${returnChapterId}` : `/app/projects/${projectId}`}>{returnChapterId ? "Return to Chapter" : "Return to Project Home"}</a></header>
    <p>Notes are durable references, not Capture inbox entries. Tags and backlinks replace notebook hierarchy.</p>
    <div className="chronicle-columns">
      <section><h2>Notes</h2><form onSubmit={(event) => { event.preventDefault(); void createNote(); }}><label>Title<input required maxLength={200} value={noteTitle} onChange={(event) => setNoteTitle(event.target.value)} /></label><label>Body<textarea maxLength={100000} value={noteBody} onChange={(event) => setNoteBody(event.target.value)} /></label><label>Tags, comma separated<input value={tags} onChange={(event) => setTags(event.target.value)} /></label><button type="submit">Save note</button></form>{notes.length ? <form onSubmit={(event) => { event.preventDefault(); void promoteNote(); }}><label>Note<select required value={promotionNoteId} onChange={(event) => setPromotionNoteId(event.target.value)}><option value="">Choose note</option>{notes.map((note) => <option key={note.id} value={note.id}>{note.title}</option>)}</select></label><label>Promote into<select value={promotionType} onChange={(event) => setPromotionType(event.target.value as typeof promotionType)}><option value="MILESTONE">Milestone</option><option value="STORY_CHANGE">Story Change</option><option value="CHAPTER_OUTLINE">Chapter outline</option></select></label><button type="submit">Promote with provenance</button></form> : null}<ul className="chronicle-list">{notes.map((note) => <li key={note.id}><div><strong>{note.title}</strong><span>{note.tags.join(" · ") || "No tags"}</span></div><small>{note.backlinkCount} backlinks</small></li>)}</ul></section>
      <section><h2>Research</h2><form onSubmit={(event) => { event.preventDefault(); void createResearch(); }}><label>Kind<select value={kind} onChange={(event) => setKind(event.target.value as Exclude<ResearchKind, "FILE">)}>{["NOTE", "URL", "EXCERPT", "CITATION"].map((value) => <option key={value}>{value}</option>)}</select></label><label>Title<input required maxLength={200} value={researchTitle} onChange={(event) => setResearchTitle(event.target.value)} /></label><label>{kind === "URL" ? "URL" : kind === "CITATION" ? "Citation" : kind === "EXCERPT" ? "User-authored excerpt" : "Research note"}<textarea required value={researchValue} onChange={(event) => setResearchValue(event.target.value)} /></label><button type="submit">Add research</button><label>Private file<input type="file" accept=".pdf,.txt,.md,.jpg,.jpeg,.png" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} /></label></form><ul className="chronicle-list">{items.map((item) => <li key={item.id}><div><strong>{item.title}</strong><span>{item.kind}</span></div><small>v{item.version}</small>{item.asset ? <button type="button" onClick={() => void downloadAsset(item.asset!.id)}>Download private file</button> : null}</li>)}</ul></section>
    </div><p role="status">{status}</p>
  </section>;
}
