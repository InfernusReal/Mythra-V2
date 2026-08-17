"use client";

import type { Editor } from "@tiptap/core";
import { useEffect, useRef, useState } from "react";
import type { LanguageLookup } from "@/domains/language/domain/types";
import type { SearchEditorActionDetail, SearchEditorResultDetail } from "@/lib/search/editor-events";
import { SEARCH_EDITOR_ACTION, SEARCH_EDITOR_RESULT } from "@/lib/search/editor-events";

type Envelope<T> = { data?: T; error?: { message: string } };
type Selection = { from: number; to: number; blockId: string; text: string };

function editorSelection(editor: Editor): Selection | null {
  const { from, to } = editor.state.selection;
  if (from === to) return null;
  const text = editor.state.doc.textBetween(from, to, " ").trim();
  if (!text) return null;
  const resolved = editor.state.doc.resolve(from);
  for (let depth = resolved.depth; depth >= 0; depth -= 1) {
    const blockId = resolved.node(depth).attrs.blockId;
    if (typeof blockId === "string" && blockId) return { from, to, blockId, text };
  }
  return null;
}

function blockPosition(editor: Editor, blockId: string): number | null {
  let found: number | null = null;
  editor.state.doc.descendants((node, position) => {
    if (node.attrs.blockId === blockId) { found = position + 1; return false; }
    return found === null;
  });
  return found;
}

function notify(detail: SearchEditorResultDetail): void {
  window.dispatchEvent(new CustomEvent<SearchEditorResultDetail>(SEARCH_EDITOR_RESULT, { detail }));
}

export function EditorSearchBridge({ editor, projectId, chapterId, hardStop }: { editor: Editor | null; projectId: string; chapterId: string; hardStop: number | null }) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [lookup, setLookup] = useState<LanguageLookup | null>(null);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [returnAvailable, setReturnAvailable] = useState(false);
  const originRef = useRef<{ from: number; to: number; scrollY: number } | null>(null);
  const selectionIssue = selection && (selection.text.length > 160 || selection.text.split(/\s+/u).length > 6)
    ? "Select at most six words and 160 characters for Language."
    : null;

  useEffect(() => {
    if (!editor) return;
    const update = () => setSelection(editorSelection(editor));
    editor.on("selectionUpdate", update); update();
    return () => { editor.off("selectionUpdate", update); };
  }, [editor]);

  useEffect(() => {
    if (!selection || selectionIssue) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setBusy(true); setLookupMessage(null);
      try {
        const response = await fetch(`/api/v2/projects/${projectId}/language`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ selection: selection.text, locale: "en" }), signal: controller.signal });
        const envelope = await response.json() as Envelope<LanguageLookup>;
        if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? "Language lookup is unavailable.");
        setLookup(envelope.data);
        // Console trace S10-UI-006: selection Language card resolved with counts/state only; selected and lexical content are excluded.
        console.log(JSON.stringify({ level: "info", step: "S10-UI-006", event: "language.card_resolved", projectId, chapterId, state: envelope.data.state, senseCount: envelope.data.senses.length, antonymCount: envelope.data.antonyms.length, selectedLength: selection.to - selection.from }));
      } catch (caught) { if (!controller.signal.aborted) setLookupMessage(caught instanceof Error ? caught.message : "Language lookup is unavailable."); }
      finally { if (!controller.signal.aborted) setBusy(false); }
    }, 220);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [chapterId, projectId, selection, selectionIssue]);

  useEffect(() => {
    if (!editor) return;
    const onAction = (event: Event) => {
      const detail = (event as CustomEvent<SearchEditorActionDetail>).detail;
      const result = detail.result;
      if (!result) return;
      if (detail.action === "JUMP_TO_BLOCK" && result.blockId) {
        originRef.current = { from: editor.state.selection.from, to: editor.state.selection.to, scrollY: window.scrollY };
        const position = blockPosition(editor, result.blockId);
        if (position === null) { notify({ action: detail.action, ok: false, message: "The matching block is no longer available." }); return; }
        editor.commands.setTextSelection(position); editor.commands.focus();
        document.querySelector<HTMLElement>(`[data-block-id="${result.blockId}"]`)?.scrollIntoView({ block: "center" });
        setReturnAvailable(true);
        // Console trace S10-UI-003: block jump stores/restores coordinates without logging block text.
        console.log(JSON.stringify({ level: "info", step: "S10-UI-003", event: "search.block_jumped", projectId, chapterId, blockId: result.blockId, sourceKey: result.sourceKey }));
        notify({ action: detail.action, ok: true, message: "Moved to the matching block. Return to origin is available." });
        return;
      }
      if (detail.action !== "INSERT_REFERENCE" && detail.action !== "ATTACH_REFERENCE") return;
      const targetType = typeof result.metadata.referenceTargetType === "string" ? result.metadata.referenceTargetType : null;
      const targetId = typeof result.metadata.referenceTargetId === "string" ? result.metadata.referenceTargetId : null;
      if (!targetType || !targetId) { notify({ action: detail.action, ok: false, message: "This result cannot be referenced." }); return; }
      const selected = editorSelection(editor);
      const sourceBlockId = selected?.blockId ?? (() => { const resolved = editor.state.selection.$from; for (let depth = resolved.depth; depth >= 0; depth -= 1) { const value = resolved.node(depth).attrs.blockId; if (typeof value === "string" && value) return value; } return null; })();
      const insert = detail.action === "INSERT_REFERENCE";
      if (insert && !sourceBlockId) { notify({ action: detail.action, ok: false, message: "Place the cursor in a manuscript block first." }); return; }
      void (async () => {
        const response = await fetch(`/api/v2/projects/${projectId}/structure/references`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ expectedStructuralVersion: detail.projectStructuralVersion, sourceType: insert ? "MANUSCRIPT_BLOCK" : "CHAPTER", sourceId: chapterId, ...(insert && sourceBlockId ? { sourceBlockId } : {}), targetType, targetId, ...(typeof result.metadata.referenceTargetBlockId === "string" ? { targetBlockId: result.metadata.referenceTargetBlockId } : {}), relationshipKey: insert ? "mentions" : "chapter_context", provenanceType: insert ? "CHAPTER_PROSE" : "DIRECT" }) });
        const envelope = await response.json() as Envelope<{ object: { id: string }; projectStructuralVersion: number }>;
        if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? "Reference could not be created.");
        if (insert) {
          if (selected) editor.chain().focus().setTextSelection({ from: selected.from, to: selected.to }).setMark("storyReference", { referenceId: envelope.data.object.id, referenceType: targetType }).run();
          else editor.chain().focus().insertContent(result.title).setMark("storyReference", { referenceId: envelope.data.object.id, referenceType: targetType }).run();
        }
        // Console trace S10-UI-002: explicit reference action records identities/versions/coordinate presence only and excludes prose/result text.
        console.log(JSON.stringify({ level: "info", step: "S10-UI-002", event: "search.reference_created", projectId, chapterId, action: detail.action, referenceId: envelope.data.object.id, targetType, targetId, hasBlock: Boolean(sourceBlockId), structuralVersion: envelope.data.projectStructuralVersion }));
        notify({ action: detail.action, ok: true, message: insert ? "Reference inserted without changing visible selected text." : "Result attached to chapter context.", projectStructuralVersion: envelope.data.projectStructuralVersion });
      })().catch((caught) => notify({ action: detail.action, ok: false, message: caught instanceof Error ? caught.message : "Reference could not be created." }));
    };
    window.addEventListener(SEARCH_EDITOR_ACTION, onAction);
    return () => window.removeEventListener(SEARCH_EDITOR_ACTION, onAction);
  }, [chapterId, editor, projectId]);

  const replace = (replacement: string) => {
    if (!editor || !selection) return;
    const nextLength = editor.state.doc.textContent.length - (selection.to - selection.from) + replacement.length;
    if (hardStop !== null && nextLength > hardStop) { setLookupMessage(`The explicit ${hardStop}-character limit would be exceeded.`); return; }
    const applied = editor.chain().focus().insertContentAt({ from: selection.from, to: selection.to }, replacement).run();
    if (!applied) { setLookupMessage("Replacement could not be applied."); return; }
    setLookupMessage("Replacement applied. Undo remains available.");
    // Console trace S10-UI-007: one-transaction Language replacement logs coordinate lengths only and excludes original/replacement text.
    console.log(JSON.stringify({ level: "info", step: "S10-UI-007", event: "language.selection_replaced", projectId, chapterId, selectedLength: selection.to - selection.from, replacementLength: replacement.length }));
  };

  const toggleSaved = async () => {
    if (!lookup) return;
    setBusy(true);
    try {
      const first = lookup.senses[0];
      const response = await fetch(`/api/v2/projects/${projectId}/vocabulary`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: lookup.saved ? "REMOVE" : "SAVE", term: lookup.term, locale: lookup.locale, ...(first ? { definition: first.definition, partOfSpeech: first.partOfSpeech } : {}) }) });
      const envelope = await response.json() as Envelope<{ saved: boolean }>;
      if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? "Vocabulary could not be updated.");
      setLookup({ ...lookup, saved: envelope.data.saved });
      // Console trace S10-UI-008: saved-vocabulary action records state only and excludes the term.
      console.log(JSON.stringify({ level: "info", step: "S10-UI-008", event: "language.vocabulary_toggled", projectId, chapterId, saved: envelope.data.saved }));
    } catch (caught) { setLookupMessage(caught instanceof Error ? caught.message : "Vocabulary could not be updated."); }
    finally { setBusy(false); }
  };

  const returnToOrigin = () => {
    if (!editor || !originRef.current) return;
    const origin = originRef.current; originRef.current = null; setReturnAvailable(false);
    editor.commands.setTextSelection({ from: origin.from, to: origin.to }); editor.commands.focus(); window.scrollTo({ top: origin.scrollY });
  };

  const visibleLookup = selectionIssue ? null : lookup;
  return <>{returnAvailable ? <button className="search-return-origin" type="button" onClick={returnToOrigin}>Return to search origin</button> : null}{selection ? <aside className="language-card" aria-label="Language"><header><div><p className="eyebrow">Selection</p><h2>Language</h2></div><button type="button" onClick={() => { setSelection(null); setLookup(null); }}>Dismiss</button></header>{busy && !selectionIssue ? <p role="status">Looking up selection</p> : null}{selectionIssue || lookupMessage ? <p role="status">{selectionIssue ?? lookupMessage}</p> : null}{visibleLookup?.state === "UNAVAILABLE" ? <p>{visibleLookup.message}</p> : null}{visibleLookup?.state === "NOT_FOUND" ? <p>{visibleLookup.message}</p> : null}{visibleLookup?.state === "READY" ? <><button type="button" disabled={busy} onClick={() => void toggleSaved()}>{visibleLookup.saved ? "Remove from saved vocabulary" : "Save vocabulary"}</button>{visibleLookup.senses.map((sense, index) => <section key={`${sense.partOfSpeech}:${sense.definition}:${index}`}><h3>{sense.partOfSpeech}{sense.nuance ? ` · ${sense.nuance}` : ""}</h3><p>{sense.definition}</p>{sense.synonyms.length ? <div className="language-words" aria-label="Synonyms">{sense.synonyms.map((word) => <button type="button" key={word} onClick={() => replace(word)}>{word}</button>)}</div> : null}</section>)}{visibleLookup.antonyms.length ? <section><h3>Antonyms</h3><div className="language-words">{visibleLookup.antonyms.map((word) => <button type="button" key={word} onClick={() => replace(word)}>{word}</button>)}</div></section> : null}</> : null}</aside> : null}</>;
}
