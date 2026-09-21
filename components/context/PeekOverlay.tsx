"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  interpolateMessage,
  formatNumber,
  localizedContextTitle,
  localizedEnumLabel,
  localizedErrorMessage,
} from "@/lib/i18n/messages";

import { useRef, useState } from "react";
import { useModalKeyboard } from "@/lib/editor/use-modal-keyboard";
import type { ContextFieldDescriptor } from "@/domains/context/domain/types";
import type { CausalTraversalProjection } from "@/domains/causality/application/ports";
import { contextCardRegistry } from "./ContextCards";

export function PeekOverlay({
  descriptor,
  projectId,
  structuralVersion,
  onClose,
  onEdit,
  onIntentional,
}: {
  descriptor: ContextFieldDescriptor;
  projectId: string;
  structuralVersion: number;
  onClose: () => void;
  onEdit: (descriptor: ContextFieldDescriptor, value: string) => Promise<void>;
  onIntentional: () => void;
}) {
  const { messages, locale } = useLocale();
  const dialogRef = useRef<HTMLElement>(null);
  useModalKeyboard(dialogRef, true, onClose);
  const Card = contextCardRegistry[descriptor.type];
  const editable =
    descriptor.type === "CHAPTER_OUTLINE" ||
    descriptor.type === "NARRATIVE_INTENT";
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(descriptor.summary);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trace, setTrace] = useState<CausalTraversalProjection | null>(null);
  const traceAction = async (direction: "UPSTREAM" | "DOWNSTREAM") => {
    const action = descriptor.actions.find(
      (candidate) =>
        candidate.type ===
        (direction === "UPSTREAM" ? "WHY_NOW" : "WHAT_CHANGES"),
    );
    if (
      !action ||
      (action.type !== "WHY_NOW" && action.type !== "WHAT_CHANGES")
    )
      return;
    setBusy(true);
    setError(null);
    const params = new URLSearchParams({
      endpointType: action.endpointType,
      endpointId: action.endpointId,
      direction,
      maxDepth: "4",
      nodeBudget: "50",
      edgeBudget: "75",
      pathBudget: "50",
    });
    if (action.blockId) params.set("blockId", action.blockId);
    try {
      const response = await fetch(
        `/api/v2/projects/${projectId}/causality/neighborhood?${params}`,
      );
      const envelope = (await response.json()) as {
        data?: CausalTraversalProjection;
        error?: { message: string };
      };
      if (!response.ok || !envelope.data)
        throw new Error(
          localizedErrorMessage(
            messages,
            envelope.error,
            messages.causalTraceIsUnavailable,
          ),
        );
      setTrace(envelope.data);
      // Console trace S7-UI-003: explicit causal expansion completed with bounded counts and no story content.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S7-UI-003",
          event: "context.causal_trace_expanded",
          projectId,
          direction,
          nodeCount: envelope.data.nodeCount,
          edgeCount: envelope.data.edgeCount,
          truncated: envelope.data.truncated,
        }),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : messages.causalTraceIsUnavailable,
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="peek-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="peek-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="peek-title"
      >
        <header>
          <div>
            <p className="eyebrow">{messages.peek}</p>
            <h2 id="peek-title">
              {localizedContextTitle(messages, descriptor)}
            </h2>
          </div>
          <button autoFocus onClick={onClose}>
            {messages.returnToChapter}
          </button>
        </header>
        <Card descriptor={descriptor} />
        <p className="freshness">
          {descriptor.stale
            ? messages.stale
            : interpolateMessage(messages.freshAtStructureVersion, {
                version: structuralVersion,
              })}
        </p>
        {error ? <p role="alert">{error}</p> : null}
        {descriptor.type === "CAUSAL" ? (
          <div className="causal-trace-actions">
            <button
              disabled={busy}
              onClick={() => void traceAction("UPSTREAM")}
            >
              {messages.whyNow}
            </button>
            <button
              disabled={busy}
              onClick={() => void traceAction("DOWNSTREAM")}
            >
              {messages.whatChanges}
            </button>
          </div>
        ) : null}
        {trace ? (
          <ol className="causal-list">
            {trace.paths.map((path, index) => (
              <li key={`${path.endpoint.type}:${path.endpoint.id}:${index}`}>
                {localizedEnumLabel(messages, path.direction)} {messages.depth}{" "}
                {formatNumber(locale, path.depth)} ·{" "}
                {path.steps
                  .map((step) =>
                    localizedEnumLabel(messages, step.relationType),
                  )
                  .join(" → ")}
              </li>
            ))}
          </ol>
        ) : null}
        {editable ? (
          <div>
            {editing ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setBusy(true);
                  setError(null);
                  void onEdit(descriptor, value)
                    .then(() => {
                      setEditing(false);
                      onClose();
                    })
                    .catch((caught) =>
                      setError(
                        caught instanceof Error
                          ? caught.message
                          : messages.sourceCouldNotBeSaved,
                      ),
                    )
                    .finally(() => setBusy(false));
                }}
              >
                <label>
                  {messages.authorSource}
                  <textarea
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                  />
                </label>
                <button disabled={busy} type="submit">
                  {messages.saveSource}
                </button>
              </form>
            ) : (
              <>
                <button onClick={() => setEditing(true)}>
                  {messages.editSource}
                </button>
                <button onClick={onIntentional}>
                  {messages.markIntentional}
                </button>
              </>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
