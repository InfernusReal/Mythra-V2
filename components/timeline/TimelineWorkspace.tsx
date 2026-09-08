"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  formatNumber,
  interpolateMessage,
  localizedEnumLabel,
  localizedErrorMessage,
} from "@/lib/i18n/messages";

import { useMemo, useState } from "react";
import type {
  TimelineEventReadModel,
  TimelineLinkTargetType,
  TimelineMode,
} from "@/domains/timeline/domain/types";

type Envelope<T> = { data?: T; error?: { message: string } };

export function TimelineWorkspace({
  projectId,
  initialEvents,
  initialStructuralVersion,
  returnChapterId,
}: {
  projectId: string;
  initialEvents: TimelineEventReadModel[];
  initialStructuralVersion: number;
  returnChapterId?: string;
}) {
  const { messages, locale } = useLocale();
  const [events, setEvents] = useState(initialEvents);
  const [structuralVersion, setStructuralVersion] = useState(
    initialStructuralVersion,
  );
  const [mode, setMode] = useState<TimelineMode>("ORDINAL");
  const [title, setTitle] = useState("");
  const [displayLabel, setDisplayLabel] = useState("");
  const [first, setFirst] = useState("1");
  const [second, setSecond] = useState("2");
  const [anchor, setAnchor] = useState("");
  const [linkEventId, setLinkEventId] = useState("");
  const [targetType, setTargetType] =
    useState<TimelineLinkTargetType>("CHAPTER");
  const [targetId, setTargetId] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [status, setStatus] = useState("");
  const ordered = useMemo(
    () =>
      [...events].sort(
        (a, b) =>
          (a.sortStart ?? a.ordinalValue ?? Number.MAX_SAFE_INTEGER) -
            (b.sortStart ?? b.ordinalValue ?? Number.MAX_SAFE_INTEGER) ||
          a.id.localeCompare(b.id),
      ),
    [events],
  );

  const create = async () => {
    setStatus(messages.savingTimelineEvent);
    const numeric = Number(first);
    const body: Record<string, unknown> = { title, mode, displayLabel };
    if (mode === "ABSOLUTE" || mode === "APPROXIMATE") body.sortStart = numeric;
    if (mode === "ORDINAL") body.ordinalValue = numeric;
    if (mode === "RANGE") {
      body.sortStart = numeric;
      body.sortEnd = Number(second);
    }
    if (mode === "RELATIVE") {
      body.relativeToEventId = anchor;
      body.relativeOffset = numeric;
    }
    const response = await fetch(`/api/v2/projects/${projectId}/timeline`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as Envelope<{
      event: TimelineEventReadModel;
      projectStructuralVersion: number;
    }>;
    if (!response.ok || !payload.data) {
      setStatus(
        localizedErrorMessage(
          messages,
          payload.error,
          messages.timelineEventCouldNotBeSaved,
        ),
      );
      return;
    }
    setEvents((current) => [...current, payload.data!.event]);
    setStructuralVersion(payload.data.projectStructuralVersion);
    setTitle("");
    setDisplayLabel("");
    setStatus(messages.timelineEventSaved);
    // Console trace S11-UI-001: Timeline UI completion logs identity/mode/version only and excludes authored temporal content.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S11-UI-001",
        event: "timeline.ui_event_created",
        projectId,
        sourceId: payload.data.event.id,
        mode: payload.data.event.mode,
        structuralVersion: payload.data.projectStructuralVersion,
      }),
    );
  };

  const link = async () => {
    const response = await fetch(
      `/api/v2/projects/${projectId}/timeline/links`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          eventId: linkEventId,
          targetType,
          targetId,
          ...(linkLabel.trim() ? { label: linkLabel } : {}),
        }),
      },
    );
    const payload = (await response.json()) as Envelope<{
      linkId: string;
      replayed: boolean;
    }>;
    if (!response.ok || !payload.data) {
      setStatus(
        localizedErrorMessage(
          messages,
          payload.error,
          messages.timelineLinkCouldNotBeSaved,
        ),
      );
      return;
    }
    setEvents((current) =>
      current.map((event) =>
        event.id === linkEventId &&
        !event.links.some((item) => item.id === payload.data!.linkId)
          ? {
              ...event,
              links: [
                ...event.links,
                {
                  id: payload.data!.linkId,
                  targetType,
                  targetId,
                  label: linkLabel.trim() || null,
                },
              ],
            }
          : event,
      ),
    );
    setTargetId("");
    setLinkLabel("");
    setStatus(
      payload.data.replayed
        ? messages.timelineLinkAlreadyExisted
        : messages.timelineLinkSavedWithoutCreatingCausality,
    );
    // Console trace S11-UI-006: explicit chronology link logs endpoint identities and replay state only; it never emits or implies a causal relation.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S11-UI-006",
        event: "timeline.ui_link_created",
        projectId,
        sourceId: linkEventId,
        targetType,
        targetId,
        replayed: payload.data.replayed,
      }),
    );
  };

  return (
    <section className="chronicle-workspace" aria-labelledby="timeline-title">
      <header>
        <div>
          <p className="eyebrow">{messages.chronologyNotCausality}</p>
          <h1 id="timeline-title">{messages.timeline}</h1>
        </div>
        <a
          href={
            returnChapterId
              ? `/app/chapters/${returnChapterId}`
              : `/app/projects/${projectId}`
          }
        >
          {returnChapterId
            ? messages.returnToChapter
            : messages.returnToProjectHome}
        </a>
      </header>
      <p>
        {messages.displayLabelsRemainAuthorOwnedSortValuesAreModeSpecificAndDo}{" "}
        {formatNumber(locale, structuralVersion)}.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void create();
        }}
      >
        <label>
          {messages.mode}
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as TimelineMode)}
          >
            {["ABSOLUTE", "APPROXIMATE", "RELATIVE", "ORDINAL", "RANGE"].map(
              (value) => (
                <option key={value} value={value}>
                  {localizedEnumLabel(messages, value)}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          {messages.title}
          <input
            required
            maxLength={200}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label>
          {messages.displayLabel}
          <input
            required
            maxLength={200}
            value={displayLabel}
            onChange={(event) => setDisplayLabel(event.target.value)}
          />
        </label>
        <label>
          {mode === "RELATIVE"
            ? messages.offset
            : mode === "ORDINAL"
              ? messages.order
              : messages.sortableStart}
          <input
            required
            type="number"
            step="any"
            value={first}
            onChange={(event) => setFirst(event.target.value)}
          />
        </label>
        {mode === "RANGE" ? (
          <label>
            {messages.sortableEnd}
            <input
              required
              type="number"
              step="any"
              value={second}
              onChange={(event) => setSecond(event.target.value)}
            />
          </label>
        ) : null}
        {mode === "RELATIVE" ? (
          <label>
            {messages.relativeTo}
            <select
              required
              value={anchor}
              onChange={(event) => setAnchor(event.target.value)}
            >
              <option value="">{messages.chooseEvent}</option>
              {ordered.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button type="submit">{messages.addEvent}</button>
      </form>
      {ordered.length ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void link();
          }}
        >
          <label>
            {messages.timelineEvent}
            <select
              required
              value={linkEventId}
              onChange={(event) => setLinkEventId(event.target.value)}
            >
              <option value="">{messages.chooseEvent}</option>
              {ordered.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            {messages.linkTargetType}
            <select
              value={targetType}
              onChange={(event) => {
                setTargetType(event.target.value as TimelineLinkTargetType);
                setTargetId("");
              }}
            >
              {["ENTITY", "MILESTONE", "CHAPTER", "TIMELINE_EVENT"].map(
                (value) => (
                  <option key={value} value={value}>
                    {localizedEnumLabel(messages, value)}
                  </option>
                ),
              )}
            </select>
          </label>
          {targetType === "TIMELINE_EVENT" ? (
            <label>
              {messages.linkedEvent}
              <select
                required
                value={targetId}
                onChange={(event) => setTargetId(event.target.value)}
              >
                <option value="">{messages.chooseEvent}</option>
                {ordered
                  .filter((item) => item.id !== linkEventId)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
              </select>
            </label>
          ) : (
            <label>
              {messages.targetId}
              <input
                required
                value={targetId}
                onChange={(event) => setTargetId(event.target.value)}
              />
            </label>
          )}
          <label>
            {messages.optionalLinkLabel}
            <input
              maxLength={160}
              value={linkLabel}
              onChange={(event) => setLinkLabel(event.target.value)}
            />
          </label>
          <button type="submit">{messages.linkWithoutCausality}</button>
        </form>
      ) : null}
      <p role="status">{status}</p>
      <ol className="chronicle-list">
        {ordered.map((item) => (
          <li key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <span>{item.displayLabel}</span>
              {item.links.length ? (
                <small>
                  {interpolateMessage(
                    item.links.length === 1
                      ? messages.timelineLinkCountOne
                      : messages.timelineLinkCountOther,
                    { count: formatNumber(locale, item.links.length) },
                  )}
                </small>
              ) : null}
            </div>
            <small>
              {localizedEnumLabel(messages, item.mode)} · v
              {formatNumber(locale, item.version)}
            </small>
          </li>
        ))}
      </ol>
    </section>
  );
}
