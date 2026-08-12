"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChapterDocument } from "@/domains/writing/domain/chapter-document";
import type { ConflictResolution, DraftConflictReadModel } from "@/domains/writing/application/durability-ports";
import { DebouncedDraftJournal, deleteDraftJournal, readDraftJournal, type DraftJournalRecord } from "@/lib/indexed-db/draft-journal";
import { reduceSaveState, saveStateLabels, type SaveState } from "./save-state-machine";
import { SAVE_STATUS_EVENT } from "@/components/editor/SaveIndicator";

interface ErrorEnvelope { error?: { code: string; message: string; details?: { conflictId?: string; serverVersion?: number } } }
interface SuccessEnvelope<T> { data?: T; error?: { message: string } }

export interface DurabilityController {
  ready: boolean;
  state: SaveState;
  label: string;
  conflict: DraftConflictReadModel | null;
  compareOpen: boolean;
  setCompareOpen(value: boolean): void;
  onDocumentChange(document: ChapterDocument): void;
  checkpoint(label?: string): Promise<void>;
  resolveConflict(resolution: ConflictResolution): Promise<void>;
}

export function useDurableChapter(input: {
  chapterId: string;
  initialDocument: ChapterDocument;
  initialVersion: number;
  applyDocument(document: ChapterDocument): void;
}): DurabilityController {
  const chapterId = input.chapterId;
  const [state, setState] = useState<SaveState>("CLEAN");
  const [ready, setReady] = useState(false);
  const [conflict, setConflict] = useState<DraftConflictReadModel | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const router = useRouter();
  const versionRef = useRef(input.initialVersion);
  const documentRef = useRef(input.initialDocument);
  const generationRef = useRef(0);
  const saveInFlightRef = useRef(false);
  const pendingSaveRef = useRef<{ clientSaveId: string; generation: number; baseVersion: number; document: ChapterDocument; checkpointLabel?: string } | null>(null);
  const queuedCheckpointRef = useRef<string | null>(null);
  const dirtySinceCheckpointRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const journalRef = useRef(new DebouncedDraftJournal());
  const applyDocumentRef = useRef(input.applyDocument);
  const conflictRef = useRef<DraftConflictReadModel | null>(null);
  const performSaveRef = useRef<(label?: string) => Promise<void>>(async () => undefined);
  useEffect(() => {
    applyDocumentRef.current = input.applyDocument;
  }, [input.applyDocument]);

  const journalRecord = useCallback((journalState: DraftJournalRecord["state"], clientSaveId: string | null): DraftJournalRecord => ({
    chapterId,
    document: documentRef.current,
    baseVersion: versionRef.current,
    clientSaveId,
    state: journalState,
    updatedAt: Date.now(),
    selectionAnchor: null,
    scrollTop: null
  }), [chapterId]);

  const loadConflict = useCallback(async (conflictId: string) => {
    const response = await fetch(`/api/v2/draft-conflicts/${conflictId}`);
    const envelope = await response.json() as SuccessEnvelope<DraftConflictReadModel>;
    if (!envelope.data) throw new Error(envelope.error?.message ?? "Conflict variants could not be loaded.");
    setConflict(envelope.data);
    conflictRef.current = envelope.data;
    setState((current) => reduceSaveState(current, { type: "CONFLICT_DETECTED" }));
    journalRef.current.schedule(journalRecord("CONFLICT", null));
    // Console trace S2-CLIENT-003: explicit conflict state entered; prose variants are excluded.
    console.log(JSON.stringify({ level: "info", step: "S2-CLIENT-003", event: "autosave.conflict_loaded", chapterId, conflictId, serverVersion: envelope.data.serverVersion }));
  }, [chapterId, journalRecord]);

  const performSave = useCallback(async (checkpointLabel?: string) => {
    if (saveInFlightRef.current) {
      if (checkpointLabel) queuedCheckpointRef.current = checkpointLabel;
      return;
    }
    if (conflictRef.current) return;
    if (!navigator.onLine) {
      setState((current) => reduceSaveState(current, { type: "NETWORK_FAILED" }));
      journalRef.current.schedule(journalRecord("OFFLINE_DIRTY", null));
      return;
    }
    saveInFlightRef.current = true;
    const generation = generationRef.current;
    const reusable = pendingSaveRef.current;
    const pending = reusable && reusable.generation === generation && reusable.baseVersion === versionRef.current && reusable.checkpointLabel === checkpointLabel
      ? reusable
      : { clientSaveId: crypto.randomUUID(), generation, baseVersion: versionRef.current, document: documentRef.current, checkpointLabel };
    pendingSaveRef.current = pending;
    const { clientSaveId, document } = pending;
    let conflictDetected = false;
    setState((current) => reduceSaveState(current, { type: "SAVE_STARTED" }));
    journalRef.current.schedule(journalRecord("SAVING", clientSaveId));
    await journalRef.current.flush();
    // Console trace S2-CLIENT-001: versioned save request started; only IDs/version are emitted.
    console.log(JSON.stringify({ level: "info", step: "S2-CLIENT-001", event: checkpointLabel === undefined ? "autosave.started" : "checkpoint.started", chapterId, baseVersion: versionRef.current, clientSaveId }));
    try {
      const endpoint = checkpointLabel === undefined ? "draft" : "checkpoint";
      const response = await fetch(`/api/v2/chapters/${chapterId}/${endpoint}`, {
        method: checkpointLabel === undefined ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ baseVersion: versionRef.current, clientSaveId, document, ...(checkpointLabel ? { label: checkpointLabel } : {}) })
      });
      const envelope = await response.json() as SuccessEnvelope<{ version: number }> & ErrorEnvelope;
      if (response.status === 409 && envelope.error?.details?.conflictId) {
        conflictDetected = true;
        pendingSaveRef.current = null;
        await loadConflict(envelope.error.details.conflictId);
        return;
      }
      if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? "The draft could not be saved.");
      versionRef.current = envelope.data.version;
      pendingSaveRef.current = null;
      const changedDuringSave = generationRef.current !== generation;
      setState((current) => reduceSaveState(current, { type: "SAVE_ACKNOWLEDGED", changedDuringSave }));
      if (!changedDuringSave) await deleteDraftJournal(chapterId);
      // Console trace S2-CLIENT-002: server acknowledgement applied; no manuscript content is emitted.
      console.log(JSON.stringify({ level: "info", step: "S2-CLIENT-002", event: checkpointLabel === undefined ? "autosave.acknowledged" : "checkpoint.acknowledged", chapterId, version: envelope.data.version, changedDuringSave }));
      if (checkpointLabel !== undefined) dirtySinceCheckpointRef.current = false;
    } catch {
      setState((current) => reduceSaveState(current, { type: "NETWORK_FAILED" }));
      journalRef.current.schedule(journalRecord("OFFLINE_DIRTY", generationRef.current === generation ? clientSaveId : null));
      // Console trace S2-CLIENT-004: network/dependency failure retained the local journal; error text/content are excluded.
      console.log(JSON.stringify({ level: "warn", step: "S2-CLIENT-004", event: "autosave.local_retained", chapterId, baseVersion: versionRef.current, clientSaveId }));
      if (navigator.onLine) autosaveTimerRef.current = setTimeout(() => { void performSaveRef.current(checkpointLabel); }, 1_000);
    } finally {
      saveInFlightRef.current = false;
      const queuedCheckpoint = queuedCheckpointRef.current;
      queuedCheckpointRef.current = null;
      if (queuedCheckpoint) setTimeout(() => { void performSaveRef.current(queuedCheckpoint); }, 0);
      if (generationRef.current !== generation && !conflictDetected) autosaveTimerRef.current = setTimeout(() => { void performSaveRef.current(); }, 250);
    }
  }, [chapterId, journalRecord, loadConflict]);

  useEffect(() => {
    performSaveRef.current = performSave;
  }, [performSave]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(SAVE_STATUS_EVENT, { detail: { label: saveStateLabels[state] } }));
    // Console trace S2-CLIENT-007: global save indicator received a state transition; document content is excluded.
    console.log(JSON.stringify({ level: "info", step: "S2-CLIENT-007", event: "save_indicator.changed", chapterId, state }));
  }, [chapterId, state]);

  useEffect(() => {
    let cancelled = false;
    const journal = journalRef.current;
    void readDraftJournal(chapterId).then((record) => {
      if (cancelled || !record) return;
      documentRef.current = record.document;
      versionRef.current = record.baseVersion;
      if (record.clientSaveId) pendingSaveRef.current = { clientSaveId: record.clientSaveId, generation: generationRef.current, baseVersion: record.baseVersion, document: record.document };
      applyDocumentRef.current(record.document);
      setState((current) => reduceSaveState(current, { type: "LOCAL_RECOVERED" }));
      // Console trace S2-CLIENT-005: recoverable local draft applied; content is excluded.
      console.log(JSON.stringify({ level: "info", step: "S2-CLIENT-005", event: "autosave.local_recovered", chapterId, baseVersion: record.baseVersion, priorState: record.state }));
      queuedCheckpointRef.current = "Recovered session boundary";
      autosaveTimerRef.current = setTimeout(() => { void performSaveRef.current(); }, 250);
    }).catch(() => setState("RECOVERABLE_LOCAL")).finally(() => setReady(true));
    const onOnline = () => { void performSaveRef.current(); };
    const onBeforeUnload = () => { void journal.flush(); };
    const checkpointFor = (reason: string) => {
      if (!dirtySinceCheckpointRef.current) return;
      // Console trace S2-CLIENT-008: checkpoint policy triggered for a lifecycle boundary; prose is excluded.
      console.log(JSON.stringify({ level: "info", step: "S2-CLIENT-008", event: "checkpoint.policy_triggered", chapterId, reason }));
      void performSaveRef.current(reason);
    };
    const onVisibilityChange = () => { if (document.visibilityState === "hidden") checkpointFor("Session boundary"); };
    const onDestructiveAction = () => checkpointFor("Before destructive action");
    const significantInterval = setInterval(() => checkpointFor("Significant interval"), 15 * 60 * 1_000);
    window.addEventListener("online", onOnline);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("mythra:before-destructive-action", onDestructiveAction);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      void journal.flush();
      window.removeEventListener("online", onOnline);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("mythra:before-destructive-action", onDestructiveAction);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearInterval(significantInterval);
    };
  }, [chapterId]);

  const onDocumentChange = useCallback((document: ChapterDocument) => {
    documentRef.current = document;
    generationRef.current += 1;
    dirtySinceCheckpointRef.current = true;
    setState((current) => reduceSaveState(current, { type: "EDIT" }));
    journalRef.current.schedule(journalRecord(navigator.onLine ? "DIRTY_LOCAL" : "OFFLINE_DIRTY", null));
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => { void performSaveRef.current(); }, 750);
  }, [journalRecord]);

  const checkpoint = useCallback(async (label = "Manual checkpoint") => {
    await performSave(label);
  }, [performSave]);

  const resolveConflict = useCallback(async (resolution: ConflictResolution) => {
    if (!conflict) return;
    const response = await fetch(`/api/v2/draft-conflicts/${conflict.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ resolution }) });
    const envelope = await response.json() as SuccessEnvelope<{ version: number; document: ChapterDocument; recoveryChapterId?: string }>;
    if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? "The conflict could not be resolved.");
    versionRef.current = envelope.data.version;
    documentRef.current = envelope.data.document;
    applyDocumentRef.current(envelope.data.document);
    await deleteDraftJournal(chapterId);
    setConflict(null);
    conflictRef.current = null;
    pendingSaveRef.current = null;
    setCompareOpen(false);
    setState((current) => reduceSaveState(current, { type: "CONFLICT_RESOLVED" }));
    // Console trace S2-CLIENT-006: author-selected resolution applied; documents are excluded.
    console.log(JSON.stringify({ level: "info", step: "S2-CLIENT-006", event: "autosave.conflict_resolved", chapterId, conflictId: conflict.id, resolution, version: envelope.data.version, recoveryChapterId: envelope.data.recoveryChapterId }));
    if (envelope.data.recoveryChapterId) router.push(`/app/chapters/${envelope.data.recoveryChapterId}`);
  }, [chapterId, conflict, router]);

  return { ready, state, label: saveStateLabels[state], conflict, compareOpen, setCompareOpen, onDocumentChange, checkpoint, resolveConflict };
}
