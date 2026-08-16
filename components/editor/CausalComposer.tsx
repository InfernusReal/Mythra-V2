"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/core";
import type { CausalMutationResult, CausalOverview, StoryChangeSummary } from "@/domains/causality/application/ports";

type Envelope<T> = { data?: T; error?: { message: string } };

export function CausalComposer({ editor, projectId, chapterId }: { editor: Editor | null; projectId: string; chapterId: string }) {
  const [open, setOpen] = useState(false); const [overview, setOverview] = useState<CausalOverview | null>(null); const [message, setMessage] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const [position, setPosition] = useState<{ from: number; to: number; scrollTop: number; blockId: string } | null>(null);

  const restore = (saved = position) => { setOpen(false); if (!saved || !editor) return; requestAnimationFrame(() => { editor.commands.setTextSelection({ from: saved.from, to: saved.to }); editor.commands.focus(); window.scrollTo(0, saved.scrollTop); }); };
  const show = async () => {
    if (!editor) return; const { from, to, $from } = editor.state.selection; const blockId = typeof $from.parent.attrs.blockId === "string" ? $from.parent.attrs.blockId : null;
    if (!blockId) return setMessage("Place the cursor in a manuscript paragraph first."); const saved = { from, to, scrollTop: window.scrollY, blockId }; setPosition(saved); setBusy(true); setMessage(null);
    try { const response = await fetch(`/api/v2/projects/${projectId}/causality?nodeBudget=50&edgeBudget=50`); const envelope = await response.json() as Envelope<CausalOverview>; if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? "Causal context is unavailable."); setOverview(envelope.data); setOpen(true);
      // Console trace S6-UI-006: writing-context causal composer opened with selection positions and no selected text.
      console.log(JSON.stringify({ level: "info", step: "S6-UI-006", event: "causality.writer_composer_opened", projectId, chapterId, selectionAnchor: from, selectionHead: to, blockId }));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Causal context is unavailable."); restore(saved); } finally { setBusy(false); }
  };

  const compose = async (form: FormData) => {
    if (!overview || !position || !editor) return; setBusy(true); setMessage(null);
    try {
      const changeResponse = await fetch(`/api/v2/projects/${projectId}/causality/story-changes`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ expectedStructuralVersion: overview.projectStructuralVersion, kind: form.get("kind"), title: form.get("title"), isPlaceholder: false, anchor: { type: "MANUSCRIPT_BLOCK", id: chapterId, blockId: position.blockId } }) });
      const changeEnvelope = await changeResponse.json() as Envelope<CausalMutationResult<StoryChangeSummary>>; if (!changeResponse.ok || !changeEnvelope.data) throw new Error(changeEnvelope.error?.message ?? "The Story Change could not be created.");
      const block = { type: "MANUSCRIPT_BLOCK", id: chapterId, blockId: position.blockId }; const change = { type: "STORY_CHANGE", id: changeEnvelope.data.object.id }; const because = form.get("phrase") === "BECAUSE";
      const relationResponse = await fetch(`/api/v2/projects/${projectId}/causality/relations`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ expectedStructuralVersion: changeEnvelope.data.projectStructuralVersion, source: because ? change : block, target: because ? block : change, relationType: "CAUSES", strength: 1, importance: 50, state: "ACTIVE", isHard: false, temporalProgression: false, mutualStateSemantics: false, provenanceType: "CHAPTER_PROSE" }) });
      const relationEnvelope = await relationResponse.json() as Envelope<unknown>; if (!relationResponse.ok || !relationEnvelope.data) throw new Error(relationEnvelope.error?.message ?? "The causal relation could not be created.");
      // Console trace S6-UI-007: writing-context causal phrase committed and focus restoration requested without prose.
      console.log(JSON.stringify({ level: "info", step: "S6-UI-007", event: "causality.writer_composed", projectId, chapterId, blockId: position.blockId, phrase: form.get("phrase"), selectionAnchor: position.from, selectionHead: position.to }));
      restore();
    } catch (error) { setMessage(error instanceof Error ? error.message : "The causal phrase could not be recorded."); } finally { setBusy(false); }
  };

  return <div className="editor-causal-action"><button disabled={!editor || busy} onClick={() => void show()}>Add cause or consequence</button>{message ? <p role="alert">{message}</p> : null}{open ? <div role="dialog" aria-modal="true" aria-labelledby="writer-causal-title" className="causal-dialog"><form action={compose} className="causal-form"><h2 id="writer-causal-title">Connect this manuscript moment</h2><label>Phrase<select name="phrase"><option value="BECAUSE">This happens because…</option><option value="CAUSES">This causes…</option></select></label><label>Story Change<input name="title" required maxLength={240} autoFocus /></label><label>Kind<select name="kind"><option>EVENT</option><option>DECISION</option><option>REVELATION</option><option>STATE_CHANGE</option><option>SETUP</option><option>PAYOFF</option><option>CONDITION</option><option>OUTCOME</option><option>CUSTOM</option></select></label><button disabled={busy} type="submit">Record relationship</button><button disabled={busy} type="button" onClick={() => restore()}>Cancel and return to writing</button></form></div> : null}</div>;
}
