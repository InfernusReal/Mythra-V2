"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { localizedErrorMessage } from "@/lib/i18n/messages";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import {
  enqueueCapture,
  markCaptureRetry,
  removeQueuedCapture,
  syncCaptureQueue,
  type PendingCapture,
} from "@/lib/indexed-db/capture-queue";
import { useFocusPreservingOverlay } from "@/lib/editor/use-focus-preserving-overlay";
import {
  MOBILE_WRITING_ACTION,
  type MobileWritingAction,
} from "@/lib/editor/mobile-actions";
import { recordClientOperationalEvent } from "@/lib/observability/client-operations";
import { markWritingInterruption } from "@/lib/observability/writing-session";
import { matchesCommandShortcut } from "@/lib/commands/registry";
import { useCommandHandlers } from "@/lib/commands/use-command-handlers";
import { useModalKeyboard } from "@/lib/editor/use-modal-keyboard";

type QuickTarget =
  | "NONE"
  | "MILESTONE"
  | "STORY_CHANGE"
  | "CAPTURE_DERIVED_CAUSAL";
type Envelope<T> = { data?: T; error?: { message: string } };

export function QuickCaptureOverlay({
  editor,
  projectId,
  chapterId,
  outlineId,
  entityContext = [],
}: {
  editor: Editor | null;
  projectId: string;
  chapterId?: string;
  outlineId?: string;
  entityContext?: string[];
}) {
  const { messages } = useLocale();
  const [open, setOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [target, setTarget] = useState<QuickTarget>("NONE");
  const [error, setError] = useState<string | null>(null);
  const { capture, restore } = useFocusPreservingOverlay(editor);
  const close = useCallback(() => {
    setOpen(false);
    setRawText("");
    setTarget("NONE");
    markWritingInterruption("CLOSE", "capture");
    restore();
  }, [restore]);
  const dialogRef = useRef<HTMLElement>(null);
  useModalKeyboard(dialogRef, open, close);
  const openOverlay = useCallback(
    (input: "touch" | "keyboard" = "touch") => {
      const startedAt = performance.now();
      capture();
      markWritingInterruption("OPEN", "capture");
      setOpen(true);
      const durationMs = Math.max(0, Math.round(performance.now() - startedAt));
      recordClientOperationalEvent({
        projectId,
        eventName: "capture.opened",
        durationMs,
        dimensions: { source: input },
      });
      // Console trace S16-FRICTION-003: Capture-open timing records duration and interaction source without Capture or manuscript text.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S16-FRICTION-003",
          event: "friction.capture_opened",
          projectId,
          chapterId,
          durationMs,
          input,
        }),
      );
      // Console trace S15-MOBILE-004: Capture open records writing coordinates and input class while excluding Capture/manuscript content.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S15-MOBILE-004",
          event: "responsive.capture_opened",
          projectId,
          chapterId,
          input,
        }),
      );
    },
    [capture, chapterId, projectId],
  );
  useEffect(() => {
    const synchronize = () => {
      if (typeof indexedDB === "undefined") {
        // Console trace S8-UI-005: local replay was safely unavailable without blocking the mounted writing surface.
        console.log(
          JSON.stringify({
            level: "warn",
            step: "S8-UI-005",
            event: "capture.local_queue_unavailable",
            projectId,
          }),
        );
        return;
      }
      void syncCaptureQueue()
        .then((result) => {
          if (result.synced || result.failed) {
            // Console trace S8-UI-004: connectivity-triggered replay completed with aggregate counts only.
            console.log(
              JSON.stringify({
                level: "info",
                step: "S8-UI-004",
                event: "capture.connectivity_sync_completed",
                projectId,
                synced: result.synced,
                failed: result.failed,
              }),
            );
          }
        })
        .catch((caught: unknown) => {
          // Console trace S8-UI-006: replay infrastructure failure degraded Capture sync without exposing authored text.
          console.log(
            JSON.stringify({
              level: "error",
              step: "S8-UI-006",
              event: "capture.connectivity_sync_failed",
              projectId,
              causeName: caught instanceof Error ? caught.name : "UnknownError",
            }),
          );
        });
    };
    synchronize();
    window.addEventListener("online", synchronize);
    return () => window.removeEventListener("online", synchronize);
  }, [projectId]);
  useCommandHandlers([
    {
      id: "capture.open",
      projectId,
      available: () => !open,
      execute: () => openOverlay("keyboard"),
    },
  ]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.isComposing || event.keyCode === 229) return;
      if (
        matchesCommandShortcut(event, "capture.open") &&
        !document.querySelector('[aria-modal="true"]')
      ) {
        event.preventDefault();
        openOverlay("keyboard");
        // Console trace S8-UI-001: global quick Capture opened with project/chapter identities only; URL query values are excluded.
        console.log(
          JSON.stringify({
            level: "info",
            step: "S8-UI-001",
            event: "capture.overlay_opened",
            projectId,
            chapterId,
          }),
        );
      }
      if (event.key === "Escape" && open) {
        event.preventDefault();
        close();
      }
    };
    const action = (event: Event) => {
      if ((event as CustomEvent<MobileWritingAction>).detail === "capture")
        openOverlay();
    };
    window.addEventListener("keydown", key);
    window.addEventListener(MOBILE_WRITING_ACTION, action);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener(MOBILE_WRITING_ACTION, action);
    };
  }, [chapterId, close, open, openOverlay, projectId]);
  const save = async () => {
    if (!rawText.trim()) return;
    setError(null);
    const selection = editor?.state.selection;
    const from = selection?.from;
    const to = selection?.to;
    const clientCaptureId = crypto.randomUUID();
    const blockId =
      selection && typeof selection.$from.parent.attrs.blockId === "string"
        ? selection.$from.parent.attrs.blockId
        : undefined;
    const record: PendingCapture = {
      clientCaptureId,
      projectId,
      rawText: rawText.trim(),
      route: `${location.pathname}${location.search}${location.hash}`,
      ...(chapterId ? { chapterId } : {}),
      ...(outlineId ? { outlineId } : {}),
      ...(blockId ? { blockId } : {}),
      ...(from !== undefined && to !== undefined
        ? { selectionAnchor: from, selectionHead: to }
        : {}),
      entityContext: entityContext.slice(0, 50),
      capturedAt: new Date().toISOString(),
      attempts: 0,
      nextAttemptAt: 0,
      state: "QUEUED",
    };
    await enqueueCapture(record);
    // Console trace S8-UI-002: raw-first local Capture save completed before optional filing; authored text is excluded.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S8-UI-002",
        event: "capture.raw_first_saved",
        projectId,
        chapterId,
        clientCaptureId,
        quickTarget: target,
        selectedLength: from === undefined || to === undefined ? 0 : to - from,
      }),
    );
    close();
    let rawAcknowledged = false;
    try {
      const body = {
        clientCaptureId: record.clientCaptureId,
        projectId: record.projectId,
        rawText: record.rawText,
        route: record.route,
        chapterId: record.chapterId,
        outlineId: record.outlineId,
        blockId: record.blockId,
        selectionAnchor: record.selectionAnchor,
        selectionHead: record.selectionHead,
        entityContext: record.entityContext,
        capturedAt: record.capturedAt,
      };
      const response = await fetch("/api/v2/captures", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const envelope = (await response.json()) as Envelope<{
        capture: { id: string };
        projectStructuralVersion: number;
      }>;
      if (!response.ok || !envelope.data)
        throw new Error(
          localizedErrorMessage(
            messages,
            envelope.error,
            messages.captureSyncFailed,
          ),
        );
      await removeQueuedCapture(clientCaptureId);
      rawAcknowledged = true;
      if (target !== "NONE") {
        const converted = await fetch(
          `/api/v2/projects/${projectId}/captures/${envelope.data.capture.id}/conversions`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              conversionType: target,
              idempotencyKey: clientCaptureId,
              expectedStructuralVersion: envelope.data.projectStructuralVersion,
              targetBlockId: "",
            }),
          },
        );
        if (!converted.ok)
          throw new Error(
            messages.theCaptureWasSavedButItsOptionalQuickTargetWasNotApplied,
          );
      }
      // Console trace S8-UI-003: server acknowledgement and optional quick target completed with identities only.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S8-UI-003",
          event: "capture.server_acknowledged",
          projectId,
          chapterId,
          clientCaptureId,
          quickTarget: target,
        }),
      );
    } catch (caught) {
      if (!rawAcknowledged) {
        await markCaptureRetry(record);
        setError(messages.captureIsQueuedForRetryWritingRemainsAvailable);
      } else
        setError(
          caught instanceof Error
            ? caught.message
            : messages.theCaptureWasSavedButItsOptionalActionFailed,
        );
    }
  };
  return (
    <>
      {error ? (
        <p className="capture-sync-status" role="status">
          {error}
        </p>
      ) : null}
      {open ? (
        <div className="capture-backdrop" role="presentation">
          <section
            ref={dialogRef}
            className="capture-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="capture-title"
          >
            <h2 id="capture-title">{messages.capture}</h2>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <label>
                {messages.thought}
                <textarea
                  autoFocus
                  maxLength={20_000}
                  value={rawText}
                  onChange={(event) => setRawText(event.target.value)}
                />
              </label>
              <label>
                {messages.optionalQuickTarget}
                <select
                  value={target}
                  onChange={(event) =>
                    setTarget(event.target.value as QuickTarget)
                  }
                >
                  <option value="NONE">{messages.leaveUnprocessed}</option>
                  <option value="MILESTONE">{messages.milestone}</option>
                  <option value="STORY_CHANGE">{messages.storyChange}</option>
                  <option value="CAPTURE_DERIVED_CAUSAL">
                    {messages.causalIdentity}
                  </option>
                </select>
              </label>
              <div className="capture-overlay-actions">
                <button type="submit">{messages.saveCapture}</button>
                <button type="button" onClick={close}>
                  {messages.returnToChapter}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
