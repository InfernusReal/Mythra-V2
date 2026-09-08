"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  formatNumber,
  interpolateMessage,
  localizedEnumLabel,
  localizedErrorMessage,
} from "@/lib/i18n/messages";

import { useMemo, useState, type FormEvent } from "react";
import type { StructureOverview } from "@/domains/structure/application/ports";
import type { MilestoneOverview } from "@/domains/milestones/application/ports";
import type { NarrativeIntentTargetType } from "@/domains/structure/domain/types";
import {
  buildSemanticCoordinate,
  moveSemanticZoom,
  orderedAvailableSemanticLevels,
  resolveSemanticZoomLevel,
  type SemanticLevel,
  type SemanticZoomDirection,
} from "@/domains/structure/domain/semantic-coordinate";

interface Envelope<T> {
  data?: T;
  error?: { message: string };
}
interface SemanticAnchor {
  level: SemanticLevel;
  endpointType: string | null;
  id: string;
  label: string;
}

export function SemanticZoomViewport({
  model,
  milestones,
  onAnchor,
  onChanged,
}: {
  model: StructureOverview;
  milestones: MilestoneOverview;
  onAnchor(type: string, id: string): void;
  onChanged(): void;
}) {
  const { messages, locale } = useLocale();
  const semanticLevelLabels: Record<SemanticLevel, string> = {
    SERIES_PROJECT: messages.seriesProject,
    PLOT: messages.plot,
    PLOT_OUTLINE: messages.plotOutlineTitle,
    VOLUME: messages.volume,
    VOLUME_OUTLINE: messages.volumeOutlineTitle,
    MILESTONE_THREAD: messages.milestoneThread,
    CHAPTER_OUTLINE: messages.chapterOutlineTitle,
    CHAPTER: messages.chapter,
    SCENE: messages.scene,
    PROSE: messages.prose,
  };
  const semanticAnchors = useMemo<SemanticAnchor[]>(
    () => [
      ...(model.plot
        ? [
            {
              level: "PLOT" as const,
              endpointType: "PLOT",
              id: model.plot.id,
              label: model.plot.title,
            },
            ...(model.plot.outlineId
              ? [
                  {
                    level: "PLOT_OUTLINE" as const,
                    endpointType: "PLOT_OUTLINE",
                    id: model.plot.outlineId,
                    label: interpolateMessage(messages.outlineForTitle, {
                      title: model.plot.title,
                    }),
                  },
                ]
              : []),
          ]
        : []),
      ...model.volumes.flatMap((item) => [
        {
          level: "VOLUME" as const,
          endpointType: "VOLUME",
          id: item.id,
          label: item.title,
        },
        ...(item.outlineId
          ? [
              {
                level: "VOLUME_OUTLINE" as const,
                endpointType: "VOLUME_OUTLINE",
                id: item.outlineId,
                label: interpolateMessage(messages.outlineForTitle, {
                  title: item.title,
                }),
              },
            ]
          : []),
      ]),
      ...milestones.milestones.map((item) => ({
        level: "MILESTONE_THREAD" as const,
        endpointType: "MILESTONE",
        id: item.id,
        label: item.title,
      })),
      ...model.chapterOutlines.map((item) => ({
        level: "CHAPTER_OUTLINE" as const,
        endpointType: "CHAPTER_OUTLINE",
        id: item.id,
        label: item.title,
      })),
      ...model.chapters.map((item) => ({
        level: "CHAPTER" as const,
        endpointType: "CHAPTER",
        id: item.id,
        label: item.title,
      })),
      ...model.scenes.map((item) => ({
        level: "SCENE" as const,
        endpointType: "SCENE",
        id: item.id,
        label: item.title,
      })),
    ],
    [
      milestones.milestones,
      model.chapterOutlines,
      model.chapters,
      model.plot,
      model.scenes,
      model.volumes,
      messages.outlineForTitle,
    ],
  );
  const initialAnchor = semanticAnchors.find(
    (item) =>
      item.endpointType === model.viewState.activeAnchorType &&
      item.id === model.viewState.activeAnchorId,
  ) ??
    semanticAnchors.find(
      (item) =>
        item.endpointType === "CHAPTER" &&
        item.id === model.project.activeChapterId,
    ) ??
    semanticAnchors.find((item) => item.endpointType === "CHAPTER") ??
    semanticAnchors.find((item) => item.endpointType === "PLOT") ??
    semanticAnchors[0] ?? {
      level: "SERIES_PROJECT",
      endpointType: null,
      id: model.project.id,
      label: model.project.title,
    };
  const [anchorKey, setAnchorKey] = useState(
    `${initialAnchor.endpointType ?? "PROJECT"}:${initialAnchor.id}`,
  );
  const anchor =
    semanticAnchors.find(
      (item) => `${item.endpointType}:${item.id}` === anchorKey,
    ) ?? initialAnchor;
  const [targetType, setTargetType] = useState<NarrativeIntentTargetType>(
    model.plot ? "PLOT" : "CHAPTER",
  );
  const [targetId, setTargetId] = useState(
    model.plot?.id ?? model.chapters[0]?.id ?? "",
  );
  const [intent, setIntent] = useState("");
  const [category, setCategory] = useState("ATMOSPHERE");
  const [customCategory, setCustomCategory] = useState("");
  const [blockId, setBlockId] = useState("");
  const [selectionAnchor, setSelectionAnchor] = useState(0);
  const [selectionHead, setSelectionHead] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const anchorChapterId =
    anchor.endpointType === "CHAPTER"
      ? anchor.id
      : anchor.endpointType === "SCENE"
        ? model.scenes.find((item) => item.id === anchor.id)?.chapterId
        : anchor.endpointType === "CHAPTER_OUTLINE"
          ? model.chapterOutlines.find((item) => item.id === anchor.id)
              ?.chapterId
          : anchor.endpointType === "MILESTONE"
            ? milestones.links.find((item) => item.milestoneId === anchor.id)
                ?.chapterId
            : anchor.endpointType === "VOLUME"
              ? model.chapters.find((item) => item.volumeId === anchor.id)?.id
              : anchor.endpointType === "VOLUME_OUTLINE"
                ? model.chapters.find(
                    (item) =>
                      item.volumeId ===
                      model.volumes.find(
                        (volume) => volume.outlineId === anchor.id,
                      )?.id,
                  )?.id
                : undefined;
  const chapter =
    model.chapters.find((candidate) => candidate.id === anchorChapterId) ??
    model.chapters.find(
      (candidate) => candidate.id === model.project.activeChapterId,
    ) ??
    model.chapters[0];
  const volume =
    model.volumes.find(
      (candidate) =>
        candidate.id ===
        (anchor.endpointType === "VOLUME" ? anchor.id : chapter?.volumeId),
    ) ??
    model.volumes.find(
      (candidate) =>
        candidate.outlineId ===
        (anchor.endpointType === "VOLUME_OUTLINE" ? anchor.id : null),
    ) ??
    model.volumes[0];
  const outline =
    model.chapterOutlines.find(
      (candidate) =>
        candidate.id ===
        (anchor.endpointType === "CHAPTER_OUTLINE" ? anchor.id : null),
    ) ??
    model.chapterOutlines.find(
      (candidate) => candidate.chapterId === chapter?.id,
    );
  const scene =
    model.scenes.find(
      (candidate) =>
        candidate.id === (anchor.endpointType === "SCENE" ? anchor.id : null),
    ) ?? model.scenes.find((candidate) => candidate.chapterId === chapter?.id);
  const milestoneThreadIds =
    anchor.endpointType === "MILESTONE"
      ? [anchor.id]
      : milestones.links
          .filter((link) => link.chapterId === chapter?.id)
          .map((link) => link.milestoneId);
  const coordinate = buildSemanticCoordinate({
    projectId: model.project.id,
    plotId: model.plot?.id,
    plotOutlineId: model.plot?.outlineId,
    volumeId: volume?.id,
    volumeOutlineId: volume?.outlineId,
    milestoneThreadIds,
    chapterOutlineId: outline?.id,
    chapterId: chapter?.id,
    sceneId: scene?.id,
  });
  const availableLevels = orderedAvailableSemanticLevels([
    ...coordinate.orderedPath.map((step) => step.level),
    ...(chapter ? ["PROSE" as const] : []),
  ]);
  const [zoomLevel, setZoomLevel] = useState<SemanticLevel>(() =>
    availableLevels.includes(initialAnchor.level)
      ? initialAnchor.level
      : (availableLevels.at(-1) ?? "SERIES_PROJECT"),
  );
  const resolvedZoomLevel = resolveSemanticZoomLevel(
    availableLevels,
    zoomLevel,
  );
  const targets = useMemo(
    () => ({
      PLOT: model.plot ? [{ id: model.plot.id, label: model.plot.title }] : [],
      VOLUME: model.volumes.map((item) => ({ id: item.id, label: item.title })),
      MILESTONE: milestones.milestones.map((item) => ({
        id: item.id,
        label: item.title,
      })),
      CHAPTER: model.chapters.map((item) => ({
        id: item.id,
        label: item.title,
      })),
      SCENE: model.scenes.map((item) => ({ id: item.id, label: item.title })),
      PARAGRAPH_SELECTION: model.chapters.map((item) => ({
        id: item.id,
        label: item.title,
      })),
      ENTITY_ARC: model.entityArcs.map((item) => ({
        id: item.id,
        label: item.name,
      })),
    }),
    [model, milestones],
  );

  const selectAnchor = (next: SemanticAnchor) => {
    if (!next.endpointType) return;
    setAnchorKey(`${next.endpointType}:${next.id}`);
    // Console trace S4-UI-010: Semantic Zoom anchor changed using canonical type and stable identity only.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S4-UI-010",
        event: "structure.semantic_anchor_changed",
        projectId: model.project.id,
        anchorType: next.endpointType,
        anchorId: next.id,
      }),
    );
    onAnchor(next.endpointType, next.id);
  };

  const selectChapter = (id: string) => {
    const next = semanticAnchors.find(
      (item) => item.endpointType === "CHAPTER" && item.id === id,
    );
    if (next) selectAnchor(next);
  };

  const changeZoom = (next: SemanticLevel) => {
    if (next === resolvedZoomLevel || !availableLevels.includes(next)) return;
    // Console trace S18-ZOOM-001: reversible abstraction change records levels and stable anchor identity without story content.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S18-ZOOM-001",
        event: "structure.semantic_zoom_changed",
        projectId: model.project.id,
        fromLevel: resolvedZoomLevel,
        toLevel: next,
        anchorType: anchor.endpointType ?? "PROJECT",
        anchorId: anchor.id,
      }),
    );
    setZoomLevel(next);
  };

  const moveZoom = (direction: SemanticZoomDirection) =>
    changeZoom(moveSemanticZoom(availableLevels, resolvedZoomLevel, direction));

  const traceEditorDescent = (
    entryLevel: "SCENE" | "PROSE",
    chapterId: string,
  ) => {
    // Console trace S18-ZOOM-002: semantic editor descent records level and stable identities without manuscript or structure text.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S18-ZOOM-002",
        event: "structure.semantic_editor_descent",
        projectId: model.project.id,
        entryLevel,
        chapterId,
        anchorType: anchor.endpointType ?? "PROJECT",
        anchorId: anchor.id,
      }),
    );
  };

  const nodesAtLevel = semanticAnchors.filter(
    (item) => item.level === resolvedZoomLevel,
  );
  const currentZoomIndex = availableLevels.indexOf(resolvedZoomLevel);

  const changeTargetType = (next: NarrativeIntentTargetType) => {
    setTargetType(next);
    setTargetId(targets[next][0]?.id ?? "");
  };

  const createIntent = async (event: FormEvent) => {
    event.preventDefault();
    if (!targetId) return;
    setError(null);
    // Console trace S4-UI-013: Narrative Intent submitted without logging the intent text or selection content.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S4-UI-013",
        event: "structure.intent_submitted",
        projectId: model.project.id,
        targetType,
        category,
      }),
    );
    const selection =
      targetType === "PARAGRAPH_SELECTION"
        ? { blockId, selectionAnchor, selectionHead }
        : {};
    const response = await fetch(
      `/api/v2/projects/${model.project.id}/structure/intents`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedStructuralVersion: model.project.structuralVersion,
          targetType,
          targetId,
          category,
          ...(category === "CUSTOM" ? { customCategory } : {}),
          ...selection,
          intentText: intent,
        }),
      },
    );
    const envelope = (await response.json()) as Envelope<unknown>;
    if (!response.ok || !envelope.data) {
      setError(
        localizedErrorMessage(
          messages,
          envelope.error,
          messages.theIntentCouldNotBeSaved,
        ),
      );
      return;
    }
    setIntent("");
    onChanged();
  };

  return (
    <div className="structure-stack" data-testid="semantic-zoom-lens">
      <section className="structure-card" aria-labelledby="semantic-zoom-title">
        <h2 id="semantic-zoom-title">{messages.semanticZoom}</h2>
        <p role="status">
          {messages.youAreHere} {anchor.label} (
          {semanticLevelLabels[anchor.level]})
        </p>
        <label>
          {messages.activeChapter}
          <select
            value={chapter?.id ?? ""}
            disabled={!model.chapters.length}
            onChange={(event) => selectChapter(event.currentTarget.value)}
          >
            {!model.chapters.length ? (
              <option value="">{messages.noChapterAvailable}</option>
            ) : null}
            {model.chapters.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <nav className="semantic-path" aria-label={messages.semanticZoomLevels}>
          {availableLevels.map((level) => (
            <button
              type="button"
              key={level}
              aria-current={resolvedZoomLevel === level ? "page" : undefined}
              onClick={() => changeZoom(level)}
            >
              {semanticLevelLabels[level]}
            </button>
          ))}
        </nav>
        <div className="structure-actions">
          <button
            type="button"
            disabled={currentZoomIndex <= 0}
            onClick={() => moveZoom("OUT")}
          >
            {messages.zoomOut}
          </button>
          <button
            type="button"
            disabled={
              currentZoomIndex < 0 ||
              currentZoomIndex >= availableLevels.length - 1
            }
            onClick={() => moveZoom("IN")}
          >
            {messages.zoomIn}
          </button>
        </div>
        <p>
          {messages.viewingAt} {semanticLevelLabels[resolvedZoomLevel]}
        </p>
        <div aria-labelledby="semantic-neighborhood-title">
          <h3 id="semantic-neighborhood-title">
            {messages.boundedNeighborhood}
          </h3>
          {resolvedZoomLevel === "SERIES_PROJECT" ? (
            <p>{model.project.title}</p>
          ) : null}
          {resolvedZoomLevel === "PROSE" && chapter ? (
            <a
              href={`/app/chapters/${chapter.id}`}
              onClick={() => traceEditorDescent("PROSE", chapter.id)}
            >
              {messages.open} {chapter.title} {messages.inEditor}
            </a>
          ) : null}
          {resolvedZoomLevel !== "SERIES_PROJECT" &&
          resolvedZoomLevel !== "PROSE" ? (
            <ul className="structure-list">
              {nodesAtLevel.map((item) => (
                <li key={`${item.endpointType}-${item.id}`}>
                  <button
                    type="button"
                    aria-pressed={
                      item.id === anchor.id &&
                      item.endpointType === anchor.endpointType
                    }
                    onClick={() => selectAnchor(item)}
                  >
                    {messages.setAnchorTo} {item.label}
                  </button>
                  {item.level === "SCENE"
                    ? (() => {
                        const sceneChapterId = model.scenes.find(
                          (candidate) => candidate.id === item.id,
                        )?.chapterId;
                        const sceneChapter = model.chapters.find(
                          (candidate) => candidate.id === sceneChapterId,
                        );
                        return sceneChapter ? (
                          <a
                            href={`/app/chapters/${sceneChapter.id}`}
                            onClick={() =>
                              traceEditorDescent("SCENE", sceneChapter.id)
                            }
                          >
                            {messages.open} {item.label} {messages.inEditor}
                          </a>
                        ) : null;
                      })()
                    : null}
                </li>
              ))}
            </ul>
          ) : null}
          {resolvedZoomLevel !== "SERIES_PROJECT" &&
          resolvedZoomLevel !== "PROSE" &&
          !nodesAtLevel.length ? (
            <p className="structure-empty">
              {messages.noObjectIsPresentAtThisOptionalLevelInTheBoundedView}
            </p>
          ) : null}
        </div>
        <p className="structure-help">
          {
            messages.zoomChangesAbstractionWithoutChangingTheSelectedAnchorOptionalLevelsAreSkipped
          }
        </p>
      </section>
      <form
        className="structure-card"
        onSubmit={(event) => void createIntent(event)}
      >
        <h2>{messages.narrativeIntent}</h2>
        <div className="structure-fields">
          <label>
            {messages.targetType}
            <select
              value={targetType}
              onChange={(event) =>
                changeTargetType(
                  event.currentTarget.value as NarrativeIntentTargetType,
                )
              }
            >
              {(
                [
                  "PLOT",
                  "VOLUME",
                  "MILESTONE",
                  "CHAPTER",
                  "SCENE",
                  "PARAGRAPH_SELECTION",
                  "ENTITY_ARC",
                ] as const
              ).map((item) => (
                <option key={item} value={item}>
                  {localizedEnumLabel(messages, item)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {messages.target}
            <select
              value={targetId}
              required
              onChange={(event) => setTargetId(event.currentTarget.value)}
            >
              {targets[targetType].map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {messages.category}
            <select
              value={category}
              onChange={(event) => setCategory(event.currentTarget.value)}
            >
              {[
                "TENSION",
                "REVELATION",
                "EMOTION",
                "PACING",
                "AMBIGUITY",
                "ATMOSPHERE",
                "CUSTOM",
              ].map((item) => (
                <option key={item} value={item}>
                  {localizedEnumLabel(messages, item)}
                </option>
              ))}
            </select>
          </label>
          {category === "CUSTOM" ? (
            <label>
              {messages.customCategory}
              <input
                value={customCategory}
                required
                maxLength={80}
                onChange={(event) =>
                  setCustomCategory(event.currentTarget.value)
                }
              />
            </label>
          ) : null}
        </div>
        {targetType === "PARAGRAPH_SELECTION" ? (
          <div className="structure-fields">
            <label>
              {messages.stableBlockId}
              <input
                value={blockId}
                required
                maxLength={128}
                onChange={(event) => setBlockId(event.currentTarget.value)}
              />
            </label>
            <label>
              {messages.selectionStart}
              <input
                type="number"
                min="0"
                value={selectionAnchor}
                onChange={(event) =>
                  setSelectionAnchor(event.currentTarget.valueAsNumber)
                }
              />
            </label>
            <label>
              {messages.selectionEnd}
              <input
                type="number"
                min="0"
                value={selectionHead}
                onChange={(event) =>
                  setSelectionHead(event.currentTarget.valueAsNumber)
                }
              />
            </label>
          </div>
        ) : null}
        <label>
          {messages.intent}
          <textarea
            value={intent}
            required
            maxLength={20000}
            onChange={(event) => setIntent(event.currentTarget.value)}
          />
        </label>
        {error ? (
          <p role="alert" className="form-error">
            {error}
          </p>
        ) : null}
        <button disabled={!targetId}>{messages.saveIntent}</button>
      </form>
      <section className="structure-card" aria-labelledby="intent-list-title">
        <h2 id="intent-list-title">{messages.activeIntents}</h2>
        {model.intents.length ? (
          <p>
            {formatNumber(locale, model.intents.length)}{" "}
            {messages.intentTargetsAreAttachedInThisBoundedView}
          </p>
        ) : (
          <p className="structure-empty">
            {messages.noNarrativeIntentIsRequired}
          </p>
        )}
      </section>
    </div>
  );
}
