"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  localizedContextTitle,
  localizedEnumLabel,
  localizedEnumLabelOrValue,
  localizedErrorMessage,
} from "@/lib/i18n/messages";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/core";
import type { ContextFieldDescriptor } from "@/domains/context/domain/types";
import { useContextField } from "@/lib/context/use-context-field";
import { useFocusPreservingOverlay } from "@/lib/editor/use-focus-preserving-overlay";
import { contextCardRegistry } from "./ContextCards";
import { PeekOverlay } from "./PeekOverlay";
import { RelevantNow } from "./RelevantNow";
import {
  MOBILE_WRITING_ACTION,
  type MobileWritingAction,
} from "@/lib/editor/mobile-actions";
import { recordClientOperationalEvent } from "@/lib/observability/client-operations";
import { markWritingInterruption } from "@/lib/observability/writing-session";
import { matchesCommandShortcut } from "@/lib/commands/registry";
import { useCommandHandlers } from "@/lib/commands/use-command-handlers";
import { useModalKeyboard } from "@/lib/editor/use-modal-keyboard";

type Envelope<T> = { data?: T; error?: { message: string } };
export function ContextualWritingField({
  editor,
  projectId,
  chapterId,
}: {
  editor: Editor | null;
  projectId: string;
  chapterId: string;
}) {
  const { messages } = useLocale();
  const context = useContextField(editor, chapterId, projectId, messages);
  const { capture, restore } = useFocusPreservingOverlay(editor);
  const [mounted, setMounted] = useState(false);
  const slot = mounted ? document.getElementById("context-field-slot") : null;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [peek, setPeek] = useState<ContextFieldDescriptor | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [referenceQuery, setReferenceQuery] = useState("");
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const openMobile = useCallback(
    (input: "keyboard" | "touch" | "pointer") => {
      capture();
      markWritingInterruption("OPEN", "context");
      setMobileOpen(true);
      recordClientOperationalEvent({
        projectId,
        eventName: "context.opened",
        dimensions: { source: `mobile_${input}` },
      });
      // Console trace S16-FRICTION-014: compact Context opening records only project identity and enumerated input mode.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S16-FRICTION-014",
          event: "friction.context_mobile_opened",
          projectId,
          input,
        }),
      );
    },
    [capture, projectId],
  );
  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    markWritingInterruption("CLOSE", "context");
    restore();
  }, [restore]);
  const mobileRef = useRef<HTMLElement>(null);
  useModalKeyboard(mobileRef, mobileOpen, closeMobile);
  const openPeek = useCallback(
    (descriptor: ContextFieldDescriptor) => {
      capture();
      markWritingInterruption("OPEN", "context");
      setPeek(descriptor);
      void context.refresh({ type: descriptor.type, id: descriptor.source.id });
      recordClientOperationalEvent({
        projectId,
        eventName: "context.peeked",
        dimensions: { source: descriptor.type.toLocaleLowerCase() },
      });
      // Console trace S16-FRICTION-008: Peek analytics records only the stable descriptor identity and enumerated card type.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S16-FRICTION-008",
          event: "friction.context_peeked",
          descriptorId: descriptor.id,
          cardType: descriptor.type,
        }),
      );
      // Console trace S7-UI-001: Peek opened in place with descriptor identity only; history and author content are unchanged.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S7-UI-001",
          event: "context.peek_opened",
          projectId,
          chapterId,
          descriptorId: descriptor.id,
          cardType: descriptor.type,
          historyLength: window.history.length,
        }),
      );
    },
    [capture, chapterId, context, projectId],
  );
  const closePeek = useCallback(() => {
    setPeek(null);
    markWritingInterruption("CLOSE", "context");
    restore();
  }, [restore]);
  useCommandHandlers([
    {
      id: "context.toggle",
      projectId,
      chapterId,
      available: () => Boolean(editor),
      execute: () => {
        if (mobileOpen) closeMobile();
        else openMobile("keyboard");
      },
    },
    {
      id: "structure.outline",
      projectId,
      chapterId,
      available: () =>
        Boolean(
          editor &&
          context.model?.descriptors.some(
            (item) => item.type === "CHAPTER_OUTLINE",
          ),
        ),
      execute: () => {
        const descriptor = context.model?.descriptors.find(
          (item) => item.type === "CHAPTER_OUTLINE",
        );
        if (!descriptor) return false;
        openPeek(descriptor);
      },
    },
    {
      id: "milestone.toggle",
      projectId,
      chapterId,
      available: () =>
        Boolean(
          editor &&
          context.model?.descriptors.some((item) => item.type === "MILESTONE"),
        ),
      execute: () => {
        const descriptor = context.model?.descriptors.find(
          (item) => item.type === "MILESTONE",
        );
        if (!descriptor) return false;
        openPeek(descriptor);
      },
    },
  ]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.isComposing ||
        event.keyCode === 229 ||
        document.querySelector(".command-dialog") ||
        (!mobileOpen && !peek && document.querySelector('[aria-modal="true"]'))
      )
        return;
      if (matchesCommandShortcut(event, "context.toggle")) {
        event.preventDefault();
        if (mobileOpen) closeMobile();
        else openMobile("keyboard");
      }
      if (matchesCommandShortcut(event, "structure.outline")) {
        const descriptor = context.model?.descriptors.find(
          (item) => item.type === "CHAPTER_OUTLINE",
        );
        if (descriptor) {
          event.preventDefault();
          openPeek(descriptor);
        }
      }
      if (matchesCommandShortcut(event, "milestone.toggle")) {
        const descriptor = context.model?.descriptors.find(
          (item) => item.type === "MILESTONE",
        );
        if (descriptor) {
          event.preventDefault();
          openPeek(descriptor);
        }
      }
      if (event.key === "Escape" && (peek || mobileOpen)) {
        if (peek) closePeek();
        if (mobileOpen) closeMobile();
      }
      if (event.key === "Tab" && mobileOpen) {
        const sheet = document.querySelector<HTMLElement>(".context-mobile");
        const focusable = [
          ...(sheet?.querySelectorAll<HTMLElement>(
            "button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled)",
          ) ?? []),
        ];
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first && last) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === last &&
          first
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const action = (event: Event) => {
      if ((event as CustomEvent<MobileWritingAction>).detail !== "context")
        return;
      openMobile("touch");
      // Console trace S15-MOBILE-006: mobile Context sheet open records stable coordinates only.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S15-MOBILE-006",
          event: "responsive.context_sheet_opened",
          projectId,
          chapterId,
        }),
      );
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(MOBILE_WRITING_ACTION, action);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(MOBILE_WRITING_ACTION, action);
    };
  }, [
    chapterId,
    closeMobile,
    closePeek,
    context.model,
    mobileOpen,
    openMobile,
    openPeek,
    peek,
    projectId,
  ]);
  const mutate = async (body: object) => {
    const response = await fetch(
      `/api/v2/projects/${projectId}/context/preferences`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const envelope = (await response.json()) as Envelope<unknown>;
    if (!response.ok)
      throw new Error(
        localizedErrorMessage(
          messages,
          envelope.error,
          messages.preferenceCouldNotBeSaved,
        ),
      );
    await context.refresh();
  };
  const edit = async (descriptor: ContextFieldDescriptor, value: string) => {
    if (!context.model) return;
    const sourceType = descriptor.type;
    const field = sourceType === "CHAPTER_OUTLINE" ? "purpose" : "intentText";
    const response = await fetch(
      `/api/v2/projects/${projectId}/context/sources`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceType,
          sourceId: descriptor.source.id,
          expectedVersion: descriptor.source.version,
          expectedStructuralVersion: context.model.projectStructuralVersion,
          field,
          value,
        }),
      },
    );
    const envelope = (await response.json()) as Envelope<unknown>;
    if (!response.ok)
      throw new Error(
        localizedErrorMessage(
          messages,
          envelope.error,
          messages.sourceCouldNotBeSaved,
        ),
      );
    // Console trace S7-UI-002: inline author-approved source edit completed; edited value is excluded from telemetry.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S7-UI-002",
        event: "context.source_edit_completed",
        projectId,
        chapterId,
        sourceType,
        sourceId: descriptor.source.id,
      }),
    );
    await context.refresh();
  };
  const invoke = (descriptor: ContextFieldDescriptor, action: string) => {
    setMessage(null);
    if (action === "PEEK") return openPeek(descriptor);
    if (action === "HIDE_SESSION") return context.hide(descriptor.id);
    if (action === "MORE") return void context.refresh(undefined, 20);
    if (action === "PIN" || action === "UNPIN")
      void mutate({
        action,
        cardType: descriptor.type,
        sourceId: descriptor.source.id,
      }).catch((error) =>
        setMessage(
          error instanceof Error
            ? error.message
            : messages.preferenceCouldNotBeSaved,
        ),
      );
    if (action === "MUTE_TYPE")
      void mutate({ action: "MUTE", cardType: descriptor.type }).catch(
        (error) =>
          setMessage(
            error instanceof Error
              ? error.message
              : messages.preferenceCouldNotBeSaved,
          ),
      );
  };
  const openFull = useCallback(
    (descriptor: ContextFieldDescriptor) => {
      markWritingInterruption("OPEN", "context");
      recordClientOperationalEvent({
        projectId,
        eventName: "context.opened",
        dimensions: { source: descriptor.type.toLocaleLowerCase() },
      });
      // Console trace S16-FRICTION-009: full Context navigation records only the stable descriptor identity and enumerated card type.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S16-FRICTION-009",
          event: "friction.context_opened",
          descriptorId: descriptor.id,
          cardType: descriptor.type,
        }),
      );
    },
    [projectId],
  );
  const visible =
    context.model?.descriptors.filter(
      (descriptor) =>
        descriptor.type !== "REFERENCE" ||
        !referenceQuery ||
        `${localizedContextTitle(messages, descriptor)} ${localizedEnumLabelOrValue(messages, descriptor.summary)}`
          .toLocaleLowerCase()
          .includes(referenceQuery.toLocaleLowerCase()),
    ) ?? [];
  const pinned = visible.filter((descriptor) => descriptor.pinned);
  const field = context.model ? (
    <section
      className="context-field"
      aria-label={messages.contextualWritingField}
    >
      <header>
        <div>
          <p className="eyebrow">{messages.writingContext}</p>
          <h2>
            {context.model.state === "SELECTION"
              ? messages.selection
              : context.model.state === "PEEK"
                ? messages.peek
                : context.model.state === "CAUSAL_PEEK"
                  ? messages.causalPeek
                  : messages.chapter}
          </h2>
        </div>
        <span>
          {context.loading
            ? messages.refreshing
            : `v${context.model.projectStructuralVersion}`}
        </span>
      </header>
      {pinned.length ? (
        <nav className="pin-bar" aria-label={messages.pinnedContext}>
          {pinned.map((descriptor) => (
            <button key={descriptor.id} onClick={() => openPeek(descriptor)}>
              {localizedContextTitle(messages, descriptor)}
            </button>
          ))}
        </nav>
      ) : null}
      <RelevantNow
        directive={context.model.directive}
        onPeek={(id) => {
          const descriptor = context.model?.descriptors.find(
            (item) => item.id === id,
          );
          if (descriptor) openPeek(descriptor);
        }}
      />
      <div className="context-preferences">
        <button
          onClick={() =>
            void mutate({
              action: "SET_DIRECTIVE",
              enabled: !context.model?.preferences.directiveEnabled,
            })
          }
        >
          {context.model.preferences.directiveEnabled
            ? messages.disableRelevantNow
            : messages.enableRelevantNow}
        </button>
        {context.model.preferences.mutedTypes.map((type) => (
          <button
            key={type}
            onClick={() => void mutate({ action: "UNMUTE", cardType: type })}
          >
            {messages.unmute} {localizedEnumLabel(messages, type)}
          </button>
        ))}
      </div>
      <label className="context-reference-search">
        {messages.searchExistingReferences}
        <input
          value={referenceQuery}
          onChange={(event) => setReferenceQuery(event.target.value)}
        />
      </label>
      {message || context.error ? (
        <p role="status">{message ?? context.error}</p>
      ) : null}
      <div className="context-card-list">
        {visible.map((descriptor) => {
          const Card = contextCardRegistry[descriptor.type];
          return (
            <article
              className="context-card"
              key={descriptor.id}
              data-pinned={descriptor.pinned}
            >
              <header>
                <h3>{localizedContextTitle(messages, descriptor)}</h3>
                <span>
                  {descriptor.pinned
                    ? messages.pinned
                    : localizedEnumLabel(messages, descriptor.reason)}
                </span>
              </header>
              <Card descriptor={descriptor} />
              <div className="context-card-actions">
                {descriptor.actions
                  .filter((action) =>
                    [
                      "PEEK",
                      "PIN",
                      "UNPIN",
                      "HIDE_SESSION",
                      "MUTE_TYPE",
                      "MORE",
                    ].includes(action.type),
                  )
                  .map((action) => (
                    <button
                      key={action.type}
                      onClick={() => invoke(descriptor, action.type)}
                    >
                      {localizedEnumLabel(messages, action.type)}
                    </button>
                  ))}
                {descriptor.actions
                  .filter((action) => action.type === "OPEN")
                  .map((action) =>
                    action.type === "OPEN" ? (
                      <a
                        key={action.type}
                        href={action.href}
                        onClick={() => openFull(descriptor)}
                      >
                        {messages.open}
                      </a>
                    ) : null,
                  )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  ) : (
    <section className="context-field" aria-busy="true">
      <p>{context.error ?? messages.resolvingContext}</p>
    </section>
  );
  return (
    <>
      <button
        className="context-compact-trigger"
        aria-haspopup="dialog"
        onClick={() => {
          openMobile("pointer");
          // Console trace S15-MOBILE-008: compact Context sheet open records stable coordinates only.
          console.log(
            JSON.stringify({
              level: "info",
              step: "S15-MOBILE-008",
              event: "responsive.context_sheet_opened",
              projectId,
              chapterId,
              input: "pointer",
            }),
          );
        }}
      >
        {messages.relevantNow}
      </button>
      {slot ? createPortal(field, slot) : null}
      {mobileOpen ? (
        <div className="context-mobile-backdrop" role="presentation">
          <section
            ref={mobileRef}
            className="context-mobile"
            role="dialog"
            aria-modal="true"
            aria-label={messages.writingContext}
          >
            <button autoFocus onClick={closeMobile}>
              {messages.returnToChapter}
            </button>
            {field}
          </section>
        </div>
      ) : null}
      {peek ? (
        <PeekOverlay
          descriptor={peek}
          projectId={projectId}
          structuralVersion={context.model?.projectStructuralVersion ?? 0}
          onClose={closePeek}
          onEdit={edit}
          onIntentional={() => {
            context.hide(peek.id);
            closePeek();
          }}
        />
      ) : null}
    </>
  );
}
