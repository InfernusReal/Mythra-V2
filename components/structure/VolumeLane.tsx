"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";

import { useRef, useState, type FormEvent } from "react";
import type { StructureOverview } from "@/domains/structure/application/ports";
import {
  formatNumber,
  interpolateMessage,
  localizedErrorMessage,
} from "@/lib/i18n/messages";

interface Envelope<T> {
  data?: T;
  error?: { message: string };
}

export function VolumeLane({
  model,
  onChanged,
}: {
  model: StructureOverview;
  onChanged(): void;
}) {
  const { messages, locale } = useLocale();
  const [title, setTitle] = useState(
    interpolateMessage(messages.defaultVolumeTitle, {
      number: formatNumber(locale, model.volumes.length + 1),
    }),
  );
  const [targetWords, setTargetWords] = useState<number | "">("");
  const [editingVolumeId, setEditingVolumeId] = useState<string | null>(null);
  const [outlineVolumeId, setOutlineVolumeId] = useState(
    model.volumes[0]?.id ?? "",
  );
  const [volumeOutlineText, setVolumeOutlineText] = useState("");
  const [preview, setPreview] = useState<{
    orderedIds: string[];
    renumbered: Array<{ id: string; from: number; to: number }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reorderPreviewBusy, setReorderPreviewBusy] = useState(false);
  const [reorderApplyBusy, setReorderApplyBusy] = useState(false);
  const reorderTrigger = useRef<HTMLButtonElement>(null);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!model.plot) return;
    setBusy(true);
    setError(null);
    // Console trace S4-UI-008: inline volume create/edit submitted with order and hard-target state only.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S4-UI-008",
        event: "structure.inline_volume_submitted",
        projectId: model.project.id,
        sequenceIndex: model.volumes.length,
        hardTargetEnabled: false,
        operation: editingVolumeId ? "update" : "create",
      }),
    );
    const response = await fetch(
      `/api/v2/projects/${model.project.id}/structure/volumes`,
      {
        method: editingVolumeId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedStructuralVersion: model.project.structuralVersion,
          ...(editingVolumeId
            ? { volumeId: editingVolumeId }
            : { plotId: model.plot.id, sequenceIndex: model.volumes.length }),
          title,
          ...(targetWords === "" ? {} : { targetWords }),
          hardTargetWordsEnabled: false,
        }),
      },
    );
    const envelope = (await response.json()) as Envelope<unknown>;
    setBusy(false);
    if (!response.ok || !envelope.data) {
      setError(
        localizedErrorMessage(
          messages,
          envelope.error,
          messages.theVolumeCouldNotBeCreated,
        ),
      );
      return;
    }
    setEditingVolumeId(null);
    onChanged();
  };

  const editVolume = (volume: StructureOverview["volumes"][number]) => {
    setEditingVolumeId(volume.id);
    setTitle(volume.title);
    setTargetWords(volume.targetWords ?? "");
    // Console trace S4-UI-021: inline volume edit mode opened using stable identity only.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S4-UI-021",
        event: "structure.inline_volume_edit_opened",
        projectId: model.project.id,
        volumeId: volume.id,
      }),
    );
  };

  const writeVolumeOutline = async (event: FormEvent) => {
    event.preventDefault();
    if (!outlineVolumeId) return;
    setBusy(true);
    setError(null);
    // Console trace S4-UI-022: inline volume-outline write submitted without outline text telemetry.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S4-UI-022",
        event: "structure.inline_volume_outline_submitted",
        projectId: model.project.id,
        volumeId: outlineVolumeId,
      }),
    );
    const response = await fetch(
      `/api/v2/projects/${model.project.id}/structure/outlines/volume`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedStructuralVersion: model.project.structuralVersion,
          volumeId: outlineVolumeId,
          title: messages.defaultVolumeOutlineTitle,
          document: { type: "doc", content: [] },
          plainText: volumeOutlineText,
        }),
      },
    );
    const envelope = (await response.json()) as Envelope<unknown>;
    setBusy(false);
    if (!response.ok || !envelope.data) {
      setError(
        localizedErrorMessage(
          messages,
          envelope.error,
          messages.theVolumeOutlineCouldNotBeSaved,
        ),
      );
      return;
    }
    onChanged();
  };

  const moveLastFirst = async () => {
    if (model.volumes.length < 2) return;
    setReorderPreviewBusy(true);
    setError(null);
    // Console trace S4-UI-005: volume reorder preview requested using stable IDs only.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S4-UI-005",
        event: "structure.reorder_preview_requested",
        projectId: model.project.id,
        objectCount: model.volumes.length,
      }),
    );
    const response = await fetch(
      `/api/v2/projects/${model.project.id}/structure/reorder/preview`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          currentIds: model.volumes.map((volume) => volume.id),
          movedId: model.volumes.at(-1)!.id,
          targetIndex: 0,
        }),
      },
    );
    const envelope = (await response.json()) as Envelope<
      typeof preview extends infer T ? Exclude<T, null> : never
    >;
    setReorderPreviewBusy(false);
    if (!response.ok || !envelope.data) {
      setError(
        localizedErrorMessage(
          messages,
          envelope.error,
          messages.theReorderPreviewCouldNotBeCreated,
        ),
      );
      return;
    }
    setPreview(envelope.data);
  };

  const apply = async () => {
    if (!preview) return;
    setReorderApplyBusy(true);
    setError(null);
    // Console trace S4-UI-006: reviewed volume reorder confirmed with stable IDs only.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S4-UI-006",
        event: "structure.reorder_apply_confirmed",
        projectId: model.project.id,
        objectCount: preview.orderedIds.length,
      }),
    );
    const response = await fetch(
      `/api/v2/projects/${model.project.id}/structure/reorder/apply`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedStructuralVersion: model.project.structuralVersion,
          orderedIds: preview.orderedIds,
        }),
      },
    );
    const envelope = (await response.json()) as Envelope<unknown>;
    setReorderApplyBusy(false);
    if (!response.ok || !envelope.data) {
      setError(
        localizedErrorMessage(
          messages,
          envelope.error,
          messages.theReorderCouldNotBeApplied,
        ),
      );
      return;
    }
    setPreview(null);
    reorderTrigger.current?.focus();
    onChanged();
  };

  return (
    <div className="structure-stack" data-testid="volumes-lens">
      {!model.plot ? (
        <p className="structure-empty">
          {messages.createAPlotInTheOutlineLensBeforeAddingAVolume}
        </p>
      ) : (
        <form
          className="structure-card"
          onSubmit={(event) => void create(event)}
        >
          <h2>
            {editingVolumeId
              ? messages.editVolumeInline
              : messages.createVolumeInline}
          </h2>
          <div className="structure-fields">
            <label>
              {messages.title}
              <input
                value={title}
                required
                maxLength={240}
                onChange={(event) => setTitle(event.currentTarget.value)}
              />
            </label>
            <label>
              {messages.advisoryWordsf0522a41}
              <input
                type="number"
                min="1"
                value={targetWords}
                onChange={(event) =>
                  setTargetWords(
                    event.currentTarget.value
                      ? event.currentTarget.valueAsNumber
                      : "",
                  )
                }
              />
            </label>
          </div>
          <button disabled={busy}>
            {editingVolumeId
              ? messages.saveVolumeInline
              : messages.createVolume}
          </button>
        </form>
      )}
      {model.volumes.length ? (
        <form
          className="structure-card"
          onSubmit={(event) => void writeVolumeOutline(event)}
        >
          <h2>{messages.createOrEditVolumeOutline}</h2>
          <div className="structure-fields">
            <label>
              {messages.volume}
              <select
                value={outlineVolumeId}
                onChange={(event) =>
                  setOutlineVolumeId(event.currentTarget.value)
                }
              >
                {model.volumes.map((volume) => (
                  <option key={volume.id} value={volume.id}>
                    {volume.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {messages.freeformVolumeOutline}
              <textarea
                value={volumeOutlineText}
                maxLength={200000}
                onChange={(event) =>
                  setVolumeOutlineText(event.currentTarget.value)
                }
              />
            </label>
          </div>
          <button disabled={busy}>{messages.saveVolumeOutlineInline}</button>
        </form>
      ) : null}
      <section className="structure-card" aria-labelledby="volume-lane-title">
        <div className="structure-heading">
          <h2 id="volume-lane-title">{messages.volumeLane}</h2>
          <button
            ref={reorderTrigger}
            type="button"
            disabled={
              reorderPreviewBusy || reorderApplyBusy || model.volumes.length < 2
            }
            onClick={() => void moveLastFirst()}
          >
            {reorderPreviewBusy
              ? messages.calculatingReorder
              : messages.previewMovingLastFirst}
          </button>
        </div>
        {model.volumes.length ? (
          <ol className="volume-lane">
            {model.volumes.map((volume) => (
              <li key={volume.id}>
                <strong>
                  {volume.displayNumber ??
                    formatNumber(locale, volume.sequenceIndex + 1)}
                  .{" "}
                  {volume.title}
                </strong>
                <span>
                  {formatNumber(locale, volume.chapterCount)}{" "}
                  {messages.chapters0e87c62b}{" "}
                  {volume.targetWords === null
                    ? messages.no1ea442a1
                    : formatNumber(locale, volume.targetWords)}{" "}
                  {messages.advisoryWords}{" "}
                  <button type="button" onClick={() => editVolume(volume)}>
                    {messages.editInline}
                  </button>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="structure-empty">
            {messages.noVolumesChaptersRemainValidAtProjectLevel}
          </p>
        )}
      </section>
      {error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : null}
      {preview ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reorder-preview-title"
          className="structure-preview"
        >
          <h3 id="reorder-preview-title">{messages.renumberPreview}</h3>
          <p>
            {formatNumber(locale, preview.renumbered.length)}{" "}
            {
              messages.volumesWillReceiveANewDisplayOrderReferencesRetainStableIds
            }
          </p>
          <div className="structure-actions">
            <button
              type="button"
              disabled={reorderApplyBusy}
              onClick={() => void apply()}
            >
              {reorderApplyBusy
                ? messages.applyingReorder
                : messages.applyReorder}
            </button>
            <button
              type="button"
              disabled={reorderApplyBusy}
              onClick={() => {
                setPreview(null);
                reorderTrigger.current?.focus();
              }}
            >
              {messages.cancel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
