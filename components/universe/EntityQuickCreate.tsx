"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  localizedEntityTemplateName,
  localizedErrorMessage,
} from "@/lib/i18n/messages";

import { useCommandHandlers } from "@/lib/commands/use-command-handlers";
import { useRef } from "react";
import { useModalKeyboard } from "@/lib/editor/use-modal-keyboard";

import type { Editor } from "@tiptap/core";
import { useCallback, useEffect, useState } from "react";
import type { UniverseCatalog } from "@/domains/universe/application/ports";
import { useFocusPreservingOverlay } from "@/lib/editor/use-focus-preserving-overlay";
import {
  MOBILE_WRITING_ACTION,
  type MobileWritingAction,
} from "@/lib/editor/mobile-actions";

type Selection = { from: number; to: number; blockId: string; name: string };
type Envelope<T> = { data?: T; error?: { message: string } };

function selectionOf(editor: Editor): Selection | null {
  const { from, to } = editor.state.selection;
  if (from === to) return null;
  const name = editor.state.doc.textBetween(from, to, " ").trim().slice(0, 240);
  if (!name) return null;
  const resolved = editor.state.doc.resolve(from);
  let blockId = "";
  for (let depth = resolved.depth; depth >= 0; depth -= 1) {
    const value = resolved.node(depth).attrs.blockId;
    if (typeof value === "string" && value) {
      blockId = value;
      break;
    }
  }
  return blockId ? { from, to, blockId, name } : null;
}

export function EntityQuickCreate({
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
  const [selection, setSelection] = useState<Selection | null>(null);
  const [catalog, setCatalog] = useState<
    (UniverseCatalog & { projectStructuralVersion: number }) | null
  >(null);
  const [typeId, setTypeId] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const { capture, restore } = useFocusPreservingOverlay(editor);
  useEffect(() => {
    if (!open || catalog) return;
    void fetch(`/api/v2/projects/${projectId}/universe/types`)
      .then((response) => response.json())
      .then(
        (
          payload: Envelope<
            UniverseCatalog & { projectStructuralVersion: number }
          >,
        ) => {
          if (!payload.data)
            throw new Error(
              localizedErrorMessage(
                messages,
                payload.error,
                messages.entityTypesUnavailable,
              ),
            );
          setCatalog(payload.data);
          setTypeId(payload.data.entityTypes[0]?.id ?? "");
        },
      )
      .catch((error) => {
        setMessage(
          error instanceof Error
            ? error.message
            : messages.entityTypesUnavailable,
        );
      });
  }, [catalog, messages, open, projectId]);
  const begin = useCallback(() => {
    if (!editor) return;
    const selected = selectionOf(editor);
    if (!selected) {
      setMessage(messages.selectManuscriptTextBeforeCreatingAnEntity);
      return;
    }
    capture();
    setSelection(selected);
    setOpen(true);
  }, [capture, editor, messages.selectManuscriptTextBeforeCreatingAnEntity]);
  useCommandHandlers([
    {
      id: "entity.selection",
      projectId,
      chapterId,
      available: () =>
        Boolean(editor && !editor.isDestroyed && selectionOf(editor) && !open),
      execute: begin,
    },
  ]);
  useEffect(() => {
    const action = (event: Event) => {
      if ((event as CustomEvent<MobileWritingAction>).detail !== "entity")
        return;
      begin();
      // Console trace S15-MOBILE-007: mobile Entity action records availability without selected manuscript content.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S15-MOBILE-007",
          event: "responsive.entity_action_invoked",
          projectId,
          chapterId,
          selectionAvailable: Boolean(editor && selectionOf(editor)),
        }),
      );
    };
    window.addEventListener(MOBILE_WRITING_ACTION, action);
    return () => window.removeEventListener(MOBILE_WRITING_ACTION, action);
  }, [begin, chapterId, editor, projectId]);
  const close = () => {
    setOpen(false);
    setSelection(null);
    setNote("");
    requestAnimationFrame(() => restore());
  };
  const dialogRef = useRef<HTMLElement>(null);
  useModalKeyboard(dialogRef, open, close);
  const create = async () => {
    if (!editor || !selection || !typeId || !catalog) return;
    try {
      const response = await fetch(
        `/api/v2/projects/${projectId}/universe/quick-create`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            typeId,
            name: selection.name,
            ...(note ? { note } : {}),
            chapterId,
            blockId: selection.blockId,
            selectionAnchor: selection.from,
            selectionHead: selection.to,
            expectedStructuralVersion: catalog.projectStructuralVersion,
          }),
        },
      );
      const payload = (await response.json()) as Envelope<{
        entity: { id: string };
        referenceId: string;
        projectStructuralVersion: number;
      }>;
      if (!response.ok || !payload.data)
        throw new Error(
          localizedErrorMessage(
            messages,
            payload.error,
            messages.entityQuickCreateFailed,
          ),
        );
      editor
        .chain()
        .setTextSelection({ from: selection.from, to: selection.to })
        .setMark("storyReference", {
          referenceId: payload.data.referenceId,
          referenceType: "ENTITY",
        })
        .run();
      // Console trace S9-UI-003: editor entity-reference transaction emits coordinates, identity, and version metadata without selected prose.
      console.log(
        JSON.stringify({
          level: "info",
          event: "universe.ui_selection_reference_created",
          step: "S9-UI-003",
          projectId,
          chapterId,
          sourceId: payload.data.entity.id,
          referenceId: payload.data.referenceId,
          selectedLength: selection.to - selection.from,
          structuralVersion: payload.data.projectStructuralVersion,
        }),
      );
      setCatalog((current) =>
        current
          ? {
              ...current,
              projectStructuralVersion: payload.data!.projectStructuralVersion,
            }
          : current,
      );
      setMessage(messages.entityCreatedAndInvisibleReferenceAttached);
      close();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : messages.entityQuickCreateFailedManuscriptWasNotChanged,
      );
    }
  };
  return (
    <section className="entity-quick-create">
      <button type="button" onClick={begin}>
        {" "}
        {messages.createEntityFromSelection}{" "}
      </button>
      {message ? <span role="status">{message}</span> : null}
      {open ? (
        <div className="peek-backdrop" role="presentation">
          <section
            ref={dialogRef}
            className="peek-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="entity-quick-title"
          >
            <h2 id="entity-quick-title">{messages.createEntity}</h2>
            <p>{messages.visibleManuscriptTextWillNotBeRewritten}</p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void create();
              }}
            >
              <label>
                {" "}
                {messages.type}{" "}
                <select
                  autoFocus
                  value={typeId}
                  onChange={(event) => setTypeId(event.target.value)}
                >
                  {(catalog?.entityTypes ?? []).map((type) => (
                    <option key={type.id} value={type.id}>
                      {localizedEntityTemplateName(
                        messages,
                        type.systemKey,
                        type.name,
                      )}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {" "}
                {messages.optionalNote}{" "}
                <input
                  maxLength={1000}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </label>
              <button disabled={!typeId}>{messages.createAndReference}</button>
              <button type="button" onClick={close}>
                {" "}
                {messages.cancel}{" "}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
