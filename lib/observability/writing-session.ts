"use client";

import { useEffect, type RefObject } from "react";
import { recordClientOperationalEvent } from "./client-operations";

export const WRITING_INTERRUPTION_EVENT = "mythra:writing-interruption";
const idleMilliseconds = 60_000;

export function markWritingInterruption(phase: "OPEN" | "CLOSE", source: "capture" | "context" | "causality" | "search"): void {
  window.dispatchEvent(new CustomEvent(WRITING_INTERRUPTION_EVENT, { detail: { phase, source } }));
}

export function useWritingSessionAnalytics(projectId: string, hasWrittenRef: RefObject<boolean>): void {
  useEffect(() => {
    let activeSince = document.visibilityState === "visible" && document.hasFocus() ? performance.now() : null;
    let uninterruptedMilliseconds = 0;
    const openInterruptions = new Map<string, number>();
    let interrupted = false;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const stop = () => { if (activeSince !== null) uninterruptedMilliseconds += Math.max(0, performance.now() - activeSince); activeSince = null; };
    const start = () => { if (activeSince === null && openInterruptions.size === 0 && document.visibilityState === "visible" && document.hasFocus()) activeSince = performance.now(); };
    const armIdle = () => { if (idleTimer) clearTimeout(idleTimer); idleTimer = setTimeout(stop, idleMilliseconds); };
    const activity = () => { start(); armIdle(); };
    const visibility = () => document.visibilityState === "visible" ? activity() : stop();
    const focus = () => activity();
    const blur = () => stop();
    const auxiliary = (event: Event) => {
      const detail = (event as CustomEvent<{ phase: "OPEN" | "CLOSE"; source: string }>).detail;
      if (detail.phase === "OPEN") { interrupted = true; openInterruptions.set(detail.source, (openInterruptions.get(detail.source) ?? 0) + 1); stop(); }
      else {
        const remaining = Math.max(0, (openInterruptions.get(detail.source) ?? 0) - 1);
        if (remaining) openInterruptions.set(detail.source, remaining); else openInterruptions.delete(detail.source);
        activity();
      }
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("focus", focus);
    window.addEventListener("blur", blur);
    window.addEventListener("keydown", activity);
    window.addEventListener("pointerdown", activity);
    window.addEventListener(WRITING_INTERRUPTION_EVENT, auxiliary);
    armIdle();
    return () => {
      stop();
      if (idleTimer) clearTimeout(idleTimer);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("focus", focus);
      window.removeEventListener("blur", blur);
      window.removeEventListener("keydown", activity);
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener(WRITING_INTERRUPTION_EVENT, auxiliary);
      // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup must read the final keystroke state, not the mount-time value.
      if (!hasWrittenRef.current) return;
      const durationMs = Math.max(0, Math.round(uninterruptedMilliseconds));
      const outcome = interrupted ? "interrupted" : "editor_only";
      recordClientOperationalEvent({ projectId, eventName: "session.writing", durationMs, dimensions: { outcome } });
      if (!interrupted) recordClientOperationalEvent({ projectId, eventName: "session.editor_only", durationMs, dimensions: { outcome: "editor_only" } });
      // Console trace S16-FRICTION-010: writing-session completion emits uninterrupted duration and interruption class without document data.
      console.log(JSON.stringify({ level: "info", step: "S16-FRICTION-010", event: "friction.writing_session_completed", durationMs, outcome }));
    };
  }, [hasWrittenRef, projectId]);
}
