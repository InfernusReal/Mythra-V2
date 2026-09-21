"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { localizedErrorMessage } from "@/lib/i18n/messages";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import type {
  CausalMutationResult,
  CausalOverview,
  StoryChangeSummary,
} from "@/domains/causality/application/ports";
import { recordClientOperationalEvent } from "@/lib/observability/client-operations";
import { markWritingInterruption } from "@/lib/observability/writing-session";
import { useCommandHandlers } from "@/lib/commands/use-command-handlers";
import { useModalKeyboard } from "@/lib/editor/use-modal-keyboard";

type Envelope<T> = { data?: T; error?: { message: string } };

export function CausalComposer({
  editor,
  projectId,
  chapterId,
}: {
  editor: Editor | null;
  projectId: string;
  chapterId: string;
}) {
  const { messages } = useLocale();
  const [open, setOpen] = useState(false);
  const [overview, setOverview] = useState<CausalOverview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [position, setPosition] = useState<{
    from: number;
    to: number;
    scrollTop: number;
    scrollLeft: number;
    blockId: string;
  } | null>(null);
  const [initialPhrase, setInitialPhrase] = useState<"BECAUSE" | "CAUSES">(
    "BECAUSE",
  );

  const restore = (saved = position) => {
    setOpen(false);
    markWritingInterruption("CLOSE", "causality");
    if (!saved || !editor) return;
    requestAnimationFrame(() => {
      editor.commands.setTextSelection({ from: saved.from, to: saved.to });
      editor.commands.focus();
      window.scrollTo(saved.scrollLeft, saved.scrollTop);
    });
  };
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalKeyboard(dialogRef, open, () => restore(), !busy);
  const show = async (phrase: "BECAUSE" | "CAUSES" = "BECAUSE") => {
    const startedAt = performance.now();
    if (!editor) return false;
    setInitialPhrase(phrase);
    const { from, to, $from } = editor.state.selection;
    const blockId =
      typeof $from.parent.attrs.blockId === "string"
        ? $from.parent.attrs.blockId
        : null;
    if (!blockId) {
      setMessage(messages.placeTheCursorInAManuscriptParagraphFirst);
      return false;
    }
    const saved = {
      from: editor.state.selection.anchor ?? from,
      to: editor.state.selection.head ?? to,
      scrollTop: window.scrollY,
      scrollLeft: window.scrollX,
      blockId,
    };
    setPosition(saved);
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/v2/projects/${projectId}/causality?nodeBudget=50&edgeBudget=50`,
      );
      const envelope = (await response.json()) as Envelope<CausalOverview>;
      if (!response.ok || !envelope.data)
        throw new Error(
          localizedErrorMessage(
            messages,
            envelope.error,
            messages.causalContextIsUnavailable,
          ),
        );
      setOverview(envelope.data);
      markWritingInterruption("OPEN", "causality");
      setOpen(true);
      const durationMs = Math.max(0, Math.round(performance.now() - startedAt));
      recordClientOperationalEvent({
        projectId,
        eventName: "causality.trace",
        durationMs,
        dimensions: { action: "open", outcome: "success" },
        numericValue:
          envelope.data.page.returnedNodes + envelope.data.page.returnedEdges,
      });
      // Console trace S16-FRICTION-011: causal trace-open timing records bounded graph counts and outcome without Story Change or manuscript text.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S16-FRICTION-011",
          event: "friction.causal_trace_opened",
          projectId,
          chapterId,
          durationMs,
          nodeCount: envelope.data.page.returnedNodes,
          edgeCount: envelope.data.page.returnedEdges,
        }),
      );
      // Console trace S6-UI-006: writing-context causal composer opened with selection positions and no selected text.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S6-UI-006",
          event: "causality.writer_composer_opened",
          projectId,
          chapterId,
          selectionAnchor: from,
          selectionHead: to,
          blockId,
        }),
      );
      return true;
    } catch (error) {
      const durationMs = Math.max(0, Math.round(performance.now() - startedAt));
      recordClientOperationalEvent({
        projectId,
        eventName: "causality.trace",
        durationMs,
        dimensions: { action: "open", outcome: "failure" },
      });
      // Console trace S16-FRICTION-013: failed causal trace timing records only duration and failure class; the error message and content are excluded.
      console.log(
        JSON.stringify({
          level: "warn",
          step: "S16-FRICTION-013",
          event: "friction.causal_trace_failed",
          projectId,
          chapterId,
          durationMs,
          causeName: error instanceof Error ? error.name : "UnknownError",
        }),
      );
      setMessage(
        error instanceof Error
          ? error.message
          : messages.causalContextIsUnavailable,
      );
      restore(saved);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const canCompose = () =>
    Boolean(
      editor &&
        !editor.isDestroyed &&
        !busy &&
        !open &&
        typeof editor.state.selection.$from.parent.attrs.blockId === "string",
    );
  useCommandHandlers([
    {
      id: "causality.cause",
      projectId,
      chapterId,
      available: canCompose,
      execute: () => show("BECAUSE"),
    },
    {
      id: "causality.consequence",
      projectId,
      chapterId,
      available: canCompose,
      execute: () => show("CAUSES"),
    },
  ]);

  const compose = async (form: FormData) => {
    if (!overview || !position || !editor) return;
    const startedAt = performance.now();
    setBusy(true);
    setMessage(null);
    try {
      const changeResponse = await fetch(
        `/api/v2/projects/${projectId}/causality/story-changes`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            expectedStructuralVersion: overview.projectStructuralVersion,
            kind: form.get("kind"),
            title: form.get("title"),
            isPlaceholder: false,
            anchor: {
              type: "MANUSCRIPT_BLOCK",
              id: chapterId,
              blockId: position.blockId,
            },
          }),
        },
      );
      const changeEnvelope = (await changeResponse.json()) as Envelope<
        CausalMutationResult<StoryChangeSummary>
      >;
      if (!changeResponse.ok || !changeEnvelope.data)
        throw new Error(
          localizedErrorMessage(
            messages,
            changeEnvelope.error,
            messages.theStoryChangeCouldNotBeCreated,
          ),
        );
      const block = {
        type: "MANUSCRIPT_BLOCK",
        id: chapterId,
        blockId: position.blockId,
      };
      const change = {
        type: "STORY_CHANGE",
        id: changeEnvelope.data.object.id,
      };
      const because = form.get("phrase") === "BECAUSE";
      const relationResponse = await fetch(
        `/api/v2/projects/${projectId}/causality/relations`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            expectedStructuralVersion:
              changeEnvelope.data.projectStructuralVersion,
            source: because ? change : block,
            target: because ? block : change,
            relationType: "CAUSES",
            strength: 1,
            importance: 50,
            state: "ACTIVE",
            isHard: false,
            temporalProgression: false,
            mutualStateSemantics: false,
            provenanceType: "CHAPTER_PROSE",
          }),
        },
      );
      const relationEnvelope =
        (await relationResponse.json()) as Envelope<unknown>;
      if (!relationResponse.ok || !relationEnvelope.data)
        throw new Error(
          localizedErrorMessage(
            messages,
            relationEnvelope.error,
            messages.theCausalRelationCouldNotBeCreated,
          ),
        );
      const durationMs = Math.max(0, Math.round(performance.now() - startedAt));
      recordClientOperationalEvent({
        projectId,
        eventName: "causality.trace",
        durationMs,
        dimensions: { action: "compose", outcome: "success" },
      });
      // Console trace S16-FRICTION-012: causal composition timing records only duration, stable coordinates, and success outcome.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S16-FRICTION-012",
          event: "friction.causal_trace_composed",
          projectId,
          chapterId,
          durationMs,
          blockId: position.blockId,
        }),
      );
      // Console trace S6-UI-007: writing-context causal phrase committed and focus restoration requested without prose.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S6-UI-007",
          event: "causality.writer_composed",
          projectId,
          chapterId,
          blockId: position.blockId,
          phrase: form.get("phrase"),
          selectionAnchor: position.from,
          selectionHead: position.to,
        }),
      );
      restore();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : messages.theCausalPhraseCouldNotBeRecorded,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="editor-causal-action">
      <button disabled={!editor || busy} onClick={() => void show()}>
        {messages.addCauseOrConsequence}
      </button>
      {message ? <p role="alert">{message}</p> : null}
      {open ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="writer-causal-title"
          className="causal-dialog"
        >
          <form action={compose} className="causal-form">
            <h2 id="writer-causal-title">
              {messages.connectThisManuscriptMoment}
            </h2>
            <label>
              {messages.phrase}
              <select name="phrase" defaultValue={initialPhrase}>
                <option value="BECAUSE">{messages.thisHappensBecause}</option>
                <option value="CAUSES">{messages.thisCauses}</option>
              </select>
            </label>
            <label>
              {messages.storyChange}
              <input name="title" required maxLength={240} autoFocus />
            </label>
            <label>
              {messages.kind}
              <select name="kind">
                <option value="EVENT">{messages.event}</option>
                <option value="DECISION">{messages.decision}</option>
                <option value="REVELATION">{messages.revelation}</option>
                <option value="STATE_CHANGE">{messages.stateChange}</option>
                <option value="SETUP">{messages.setup}</option>
                <option value="PAYOFF">{messages.payoff}</option>
                <option value="CONDITION">{messages.condition}</option>
                <option value="OUTCOME">{messages.outcome}</option>
                <option value="CUSTOM">{messages.custom}</option>
              </select>
            </label>
            <button disabled={busy} type="submit">
              {messages.recordRelationship}
            </button>
            <button disabled={busy} type="button" onClick={() => restore()}>
              {messages.cancelAndReturnToWriting}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
