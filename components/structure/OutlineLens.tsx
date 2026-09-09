"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  formatNumber,
  interpolateMessage,
  localizedErrorMessage,
} from "@/lib/i18n/messages";
import { finiteInputNumber } from "@/lib/forms/numeric-input";

import { useState, type FormEvent } from "react";
import type { StructureOverview } from "@/domains/structure/application/ports";
import { BulkScaffold } from "./BulkScaffold";

interface Envelope<T> {
  data?: T;
  error?: { message: string };
}
const emptyDocument = { type: "doc", content: [] } as const;

export function OutlineLens({
  model,
  expandedIds,
  onExpanded,
  onChanged,
}: {
  model: StructureOverview;
  expandedIds: string[];
  onExpanded(ids: string[]): void;
  onChanged(): void;
}) {
  const { messages, locale } = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [plotTitle, setPlotTitle] = useState(
    model.plot?.title ?? messages.defaultPlotTitle,
  );
  const [plotSummary, setPlotSummary] = useState(model.plot?.summary ?? "");
  const [plotOutlineText, setPlotOutlineText] = useState("");
  const [editingOutlineId, setEditingOutlineId] = useState<string | null>(null);
  const [outlineTitle, setOutlineTitle] = useState(
    messages.defaultChapterOutlineTitle,
  );
  const [outlineText, setOutlineText] = useState("");
  const [outlineSequence, setOutlineSequence] = useState(
    model.chapterOutlines.length,
  );
  const [sceneOutlineId, setSceneOutlineId] = useState(
    model.chapterOutlines[0]?.id ?? "",
  );
  const [sceneBlockId, setSceneBlockId] = useState("");
  const [sceneTitle, setSceneTitle] = useState(messages.defaultSceneTitle);
  const [sceneText, setSceneText] = useState("");

  const writePlot = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const method = model.plot ? "PATCH" : "POST";
    // Console trace S4-UI-007: inline plot create/edit submitted without author-entered fields in telemetry.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S4-UI-007",
        event: "structure.inline_plot_submitted",
        projectId: model.project.id,
        operation: model.plot ? "update" : "create",
      }),
    );
    const response = await fetch(
      `/api/v2/projects/${model.project.id}/structure/plots`,
      {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedStructuralVersion: model.project.structuralVersion,
          ...(model.plot ? { plotId: model.plot.id } : {}),
          title: plotTitle,
          ...(plotSummary ? { summary: plotSummary } : {}),
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
          messages.thePlotCouldNotBeSaved,
        ),
      );
      return;
    }
    onChanged();
  };

  const writePlotOutline = async (event: FormEvent) => {
    event.preventDefault();
    if (!model.plot) return;
    setBusy(true);
    setError(null);
    // Console trace S4-UI-016: inline plot-outline write submitted; outline text is excluded from telemetry.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S4-UI-016",
        event: "structure.inline_plot_outline_submitted",
        projectId: model.project.id,
        plotId: model.plot.id,
      }),
    );
    const response = await fetch(
      `/api/v2/projects/${model.project.id}/structure/outlines/plot`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedStructuralVersion: model.project.structuralVersion,
          plotId: model.plot.id,
          title: interpolateMessage(messages.outlineForTitle, {
            title: model.plot.title,
          }),
          document: emptyDocument,
          plainText: plotOutlineText,
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
          messages.thePlotOutlineCouldNotBeSaved,
        ),
      );
      return;
    }
    onChanged();
  };

  const writeChapterOutline = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    // Console trace S4-UI-009: inline chapter outline submitted; title and outline text are excluded.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S4-UI-009",
        event: "structure.inline_outline_submitted",
        projectId: model.project.id,
        sequenceIndex: outlineSequence,
        operation: editingOutlineId ? "update" : "create",
      }),
    );
    const response = await fetch(
      `/api/v2/projects/${model.project.id}/structure/outlines/chapter`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedStructuralVersion: model.project.structuralVersion,
          ...(editingOutlineId ? { outlineId: editingOutlineId } : {}),
          sequenceIndex: outlineSequence,
          title: outlineTitle,
          document: emptyDocument,
          plainText: outlineText,
          revealedInformation: [],
          entityReferenceKeys: [],
          locationReferenceKeys: [],
          milestoneReferenceKeys: [],
          hardTargetWordsEnabled: false,
          sceneStubs: [],
          isPlaceholder: false,
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
          messages.theOutlineCouldNotBeSaved,
        ),
      );
      return;
    }
    setEditingOutlineId(null);
    setOutlineText("");
    onChanged();
  };

  const editOutline = (
    outline: StructureOverview["chapterOutlines"][number],
  ) => {
    setEditingOutlineId(outline.id);
    setOutlineTitle(outline.title);
    setOutlineText(outline.plainText);
    setOutlineSequence(outline.sequenceIndex);
    // Console trace S4-UI-017: inline chapter-outline edit mode opened using stable identity only.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S4-UI-017",
        event: "structure.inline_outline_edit_opened",
        projectId: model.project.id,
        outlineId: outline.id,
      }),
    );
  };

  const reparent = async (
    outline: StructureOverview["chapterOutlines"][number],
  ) => {
    const volumeId = outline.volumeId ? null : (model.volumes[0]?.id ?? null);
    if (!outline.volumeId && !volumeId) {
      setError(messages.createAVolumeBeforeDemotingAnOutlineIntoIt);
      return;
    }
    // Console trace S4-UI-018: promote/demote submitted with stable outline and destination identity only.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S4-UI-018",
        event: "structure.outline_reparent_submitted",
        projectId: model.project.id,
        outlineId: outline.id,
        assigned: Boolean(volumeId),
      }),
    );
    const response = await fetch(
      `/api/v2/projects/${model.project.id}/structure/outlines/chapter`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedStructuralVersion: model.project.structuralVersion,
          chapterOutlineId: outline.id,
          volumeId,
          sequenceIndex: outline.sequenceIndex,
        }),
      },
    );
    const envelope = (await response.json()) as Envelope<unknown>;
    if (!response.ok || !envelope.data) {
      setError(
        localizedErrorMessage(
          messages,
          envelope.error,
          messages.theOutlineCouldNotBeMoved,
        ),
      );
      return;
    }
    onChanged();
  };

  const convertScene = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    // Console trace S4-UI-019: reviewed outline-block conversion submitted without block or outline text telemetry.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S4-UI-019",
        event: "structure.scene_conversion_submitted",
        projectId: model.project.id,
        chapterOutlineId: sceneOutlineId,
      }),
    );
    const response = await fetch(
      `/api/v2/projects/${model.project.id}/structure/scenes`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedStructuralVersion: model.project.structuralVersion,
          chapterOutlineId: sceneOutlineId,
          blockId: sceneBlockId,
          sequenceIndex: model.scenes.length,
          title: sceneTitle,
          outlineDocument: emptyDocument,
          outlineText: sceneText,
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
          messages.theSceneCouldNotBeCreated,
        ),
      );
      return;
    }
    setSceneText("");
    onChanged();
  };

  const toggleExpanded = (id: string) => {
    const next = expandedIds.includes(id)
      ? expandedIds.filter((value) => value !== id)
      : [...expandedIds, id];
    // Console trace S4-UI-020: outline expansion changed with stable identity only.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S4-UI-020",
        event: "structure.outline_expansion_changed",
        projectId: model.project.id,
        outlineId: id,
        expanded: next.includes(id),
      }),
    );
    onExpanded(next);
  };

  return (
    <div className="structure-stack" data-testid="outline-lens">
      <form
        className="structure-card"
        onSubmit={(event) => void writePlot(event)}
      >
        <h2>{model.plot ? messages.plot : messages.createPlot}</h2>
        <label>
          {messages.plotTitle}
          <input
            value={plotTitle}
            maxLength={240}
            required
            onChange={(event) => setPlotTitle(event.currentTarget.value)}
          />
        </label>
        <label>
          {messages.summary}
          <textarea
            value={plotSummary}
            maxLength={20000}
            onChange={(event) => setPlotSummary(event.currentTarget.value)}
          />
        </label>
        <button disabled={busy}>
          {model.plot ? messages.savePlotInline : messages.createPlotInline}
        </button>
      </form>
      {model.plot ? (
        <form
          className="structure-card"
          onSubmit={(event) => void writePlotOutline(event)}
        >
          <h2>
            {model.plot.outlineId
              ? messages.editPlotOutline
              : messages.createPlotOutline}
          </h2>
          <label>
            {messages.freeformPlotOutline}
            <textarea
              value={plotOutlineText}
              maxLength={200000}
              onChange={(event) =>
                setPlotOutlineText(event.currentTarget.value)
              }
            />
          </label>
          <button disabled={busy}>{messages.savePlotOutlineInline}</button>
        </form>
      ) : null}
      <BulkScaffold
        projectId={model.project.id}
        structuralVersion={model.project.structuralVersion}
        onApplied={onChanged}
      />
      <form
        className="structure-card"
        onSubmit={(event) => void writeChapterOutline(event)}
      >
        <h2>
          {editingOutlineId
            ? messages.editChapterOutlineInline
            : messages.createChapterOutlineInline}
        </h2>
        <div className="structure-fields">
          <label>
            {messages.order}
            <input
              type="number"
              min="0"
              value={outlineSequence}
              onChange={(event) =>
                setOutlineSequence(finiteInputNumber(event.currentTarget, 0))
              }
            />
          </label>
          <label>
            {messages.title}
            <input
              value={outlineTitle}
              required
              maxLength={240}
              onChange={(event) => setOutlineTitle(event.currentTarget.value)}
            />
          </label>
        </div>
        <label>
          {messages.freeformOutline}
          <textarea
            value={outlineText}
            maxLength={200000}
            onChange={(event) => setOutlineText(event.currentTarget.value)}
          />
        </label>
        <button disabled={busy}>
          {editingOutlineId
            ? messages.saveOutlineInline
            : messages.createOutline}
        </button>
      </form>
      {model.chapterOutlines.length ? (
        <form
          className="structure-card"
          onSubmit={(event) => void convertScene(event)}
        >
          <h2>{messages.convertOutlineBlockToOptionalScene}</h2>
          <div className="structure-fields">
            <label>
              {messages.chapterOutline}
              <select
                value={sceneOutlineId}
                onChange={(event) =>
                  setSceneOutlineId(event.currentTarget.value)
                }
              >
                {model.chapterOutlines.map((outline) => (
                  <option key={outline.id} value={outline.id}>
                    {outline.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {messages.stableBlockId}
              <input
                value={sceneBlockId}
                required
                maxLength={128}
                onChange={(event) => setSceneBlockId(event.currentTarget.value)}
              />
            </label>
            <label>
              {messages.sceneTitle}
              <input
                value={sceneTitle}
                required
                maxLength={240}
                onChange={(event) => setSceneTitle(event.currentTarget.value)}
              />
            </label>
          </div>
          <label>
            {messages.sceneOutline}
            <textarea
              value={sceneText}
              maxLength={200000}
              onChange={(event) => setSceneText(event.currentTarget.value)}
            />
          </label>
          <button disabled={busy}>
            {messages.previewedConversionCreateScene}
          </button>
        </form>
      ) : null}
      {error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : null}
      <section className="structure-card" aria-labelledby="outline-tree-title">
        <h2 id="outline-tree-title">{messages.outlineTree}</h2>
        {model.chapterOutlines.length ? (
          <ol className="structure-list">
            {model.chapterOutlines.map((outline) => (
              <li key={outline.id} className="outline-node">
                <div>
                  <button
                    type="button"
                    aria-expanded={expandedIds.includes(outline.id)}
                    onClick={() => toggleExpanded(outline.id)}
                  >
                    {expandedIds.includes(outline.id)
                      ? messages.collapse
                      : messages.expand}
                  </button>
                  <strong>{outline.title}</strong>
                  {expandedIds.includes(outline.id) ? (
                    <p>
                      {messages.order}{" "}
                      {formatNumber(locale, outline.sequenceIndex + 1)}
                      {outline.isPlaceholder ? messages.placeholder : ""}
                      {outline.volumeId
                        ? messages.volumeLinked
                        : messages.projectLevelaf2eee5c}
                      ; {formatNumber(locale, outline.sceneCount)}{" "}
                      {messages.scenes}
                    </p>
                  ) : null}
                </div>
                <div className="structure-actions">
                  <button type="button" onClick={() => editOutline(outline)}>
                    {messages.editInline}
                  </button>
                  <button type="button" onClick={() => void reparent(outline)}>
                    {outline.volumeId
                      ? messages.promoteToProject
                      : messages.demoteToFirstVolume}
                  </button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="structure-empty">
            {messages.noOutlineIsRequiredStartOneOnlyWhenItHelps}
          </p>
        )}
      </section>
    </div>
  );
}
