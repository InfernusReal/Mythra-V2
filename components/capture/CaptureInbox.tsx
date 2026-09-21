"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";

import { useState } from "react";
import {
  activeCausalEndpointTypes,
  type ActiveCausalEndpointType,
} from "@/domains/causality/domain/types";
import type {
  CaptureLifecycle,
  CaptureSummary,
} from "@/domains/capture/domain/types";
import {
  formatDateTime,
  formatNumber,
  interpolateMessage,
  localizedEntityTemplateName,
  localizedEnumLabel,
  localizedErrorMessage,
} from "@/lib/i18n/messages";

type Envelope<T> = { data?: T; error?: { message: string } };
export function CaptureInbox({
  projectId,
  initialCaptures,
  initialStructuralVersion,
  returnChapterId,
}: {
  projectId: string;
  initialCaptures: CaptureSummary[];
  initialStructuralVersion: number;
  returnChapterId?: string;
}) {
  const { messages, locale } = useLocale();
  const [captures, setCaptures] = useState(initialCaptures);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [structuralVersion, setStructuralVersion] = useState(
    initialStructuralVersion,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [attachmentTarget, setAttachmentTarget] = useState<
    Record<string, string>
  >({});
  const [causalTarget, setCausalTarget] = useState<Record<string, string>>({});
  const [causalEndpointType, setCausalEndpointType] = useState<
    Record<string, ActiveCausalEndpointType>
  >({});
  const [entityTypes, setEntityTypes] = useState<
    Array<{ id: string; name: string; systemKey: string | null }>
  >([]);
  const [entityTypeId, setEntityTypeId] = useState("");
  const request = async <T,>(url: string, method: string, body?: unknown) => {
    const response = await fetch(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (!response.ok || !envelope.data)
      throw new Error(
        localizedErrorMessage(
          messages,
          envelope.error,
          messages.captureActionFailed,
        ),
      );
    return envelope.data;
  };
  const loadEntityTypes = async () => {
    if (entityTypes.length) return;
    try {
      const catalog = await request<{
        entityTypes: Array<{
          id: string;
          name: string;
          systemKey: string | null;
        }>;
      }>(`/api/v2/projects/${projectId}/universe/types`, "GET");
      setEntityTypes(catalog.entityTypes);
      setEntityTypeId(catalog.entityTypes[0]?.id ?? "");
    } catch {
      setMessage(messages.entityConversionTypesAreTemporarilyUnavailable);
    }
  };
  const lifecycle = async (
    action: "FILE" | "DEFER" | "DISMISS" | "RESTORE",
    ids = [...selected],
  ) => {
    if (!ids.length) return;
    const body = {
      captureIds: ids,
      action,
      ...(action === "DEFER"
        ? { deferredUntil: new Date(Date.now() + 86_400_000).toISOString() }
        : {}),
    };
    await request(`/api/v2/projects/${projectId}/captures`, "PATCH", body);
    const next: Record<typeof action, CaptureLifecycle> = {
      FILE: "FILED",
      DEFER: "DEFERRED",
      DISMISS: "DISMISSED",
      RESTORE: "UNPROCESSED",
    };
    setCaptures((current) =>
      current.map((item) =>
        ids.includes(item.id) ? { ...item, lifecycle: next[action] } : item,
      ),
    );
    setSelected(new Set());
    setMessage(
      interpolateMessage(
        ids.length === 1
          ? messages.captureItemsUpdatedOne
          : messages.captureItemsUpdatedOther,
        { count: formatNumber(locale, ids.length) },
      ),
    );
    // Console trace S8-INBOX-001: keyboard/bulk Capture triage completed with counts only.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S8-INBOX-001",
        event: "capture.inbox_triaged",
        projectId,
        action,
        count: ids.length,
      }),
    );
  };
  const convert = async (
    captureId: string,
    conversionType:
      "MILESTONE" | "STORY_CHANGE" | "CAPTURE_DERIVED_CAUSAL" | "ENTITY",
    direction?: "BECAUSE_OF" | "THIS_CAUSES",
  ) => {
    const endpointId = causalTarget[captureId];
    const result = await request<{ projectStructuralVersion: number }>(
      `/api/v2/projects/${projectId}/captures/${captureId}/conversions`,
      "POST",
      {
        conversionType,
        idempotencyKey: crypto.randomUUID(),
        expectedStructuralVersion: structuralVersion,
        targetBlockId: "",
        ...(conversionType === "ENTITY" ? { entityTypeId } : {}),
        ...(direction && endpointId
          ? {
              causalAction: {
                direction,
                endpointType: causalEndpointType[captureId] ?? "STORY_CHANGE",
                endpointId,
                relationType: "CAUSES",
              },
            }
          : {}),
      },
    );
    setStructuralVersion(result.projectStructuralVersion);
    setCaptures((current) =>
      current.map((item) =>
        item.id === captureId
          ? {
              ...item,
              lifecycle: "CONVERTED",
              conversionCount: item.conversionCount + 1,
            }
          : item,
      ),
    );
    // Console trace S8-INBOX-002: explicit conversion completed with identity/type/version only.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S8-INBOX-002",
        event: "capture.inbox_converted",
        projectId,
        captureId,
        conversionType,
        structuralVersion: result.projectStructuralVersion,
      }),
    );
  };
  const attach = async (captureId: string) => {
    const targetId = attachmentTarget[captureId];
    if (!targetId) return;
    const result = await request<{ attachmentId: string }>(
      `/api/v2/projects/${projectId}/captures/${captureId}/attachments`,
      "POST",
      { targetType: "CHAPTER", targetId, targetBlockId: "" },
    );
    setCaptures((current) =>
      current.map((item) =>
        item.id === captureId
          ? {
              ...item,
              attachments: [
                ...item.attachments,
                {
                  id: result.attachmentId,
                  targetType: "CHAPTER",
                  targetId,
                  targetBlockId: "",
                },
              ],
              attachmentCount: item.attachmentCount + 1,
            }
          : item,
      ),
    );
  };
  const detach = async (captureId: string, attachmentId: string) => {
    await request(
      `/api/v2/projects/${projectId}/captures/${captureId}/attachments?attachmentId=${attachmentId}`,
      "DELETE",
    );
    setCaptures((current) =>
      current.map((item) =>
        item.id === captureId
          ? {
              ...item,
              attachments: item.attachments.filter(
                (attachment) => attachment.id !== attachmentId,
              ),
              attachmentCount: Math.max(0, item.attachmentCount - 1),
            }
          : item,
      ),
    );
  };
  return (
    <section
      className="capture-inbox"
      aria-labelledby="capture-inbox-title"
      onKeyDown={(event) => {
        if (
          event.nativeEvent.isComposing ||
          event.keyCode === 229 ||
          event.ctrlKey ||
          event.metaKey ||
          event.altKey ||
          event.shiftKey
        )
          return;
        if (
          event.target instanceof Element &&
          event.target.closest(
            'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]),textarea,select,[contenteditable]:not([contenteditable="false"])',
          )
        )
          return;
        if (event.key === "f") void lifecycle("FILE");
        if (event.key === "d") void lifecycle("DEFER");
        if (event.key === "x") void lifecycle("DISMISS");
        if (event.key === "r") void lifecycle("RESTORE");
      }}
    >
      <header className="capture-inbox-header">
        <div>
          <p className="eyebrow">{messages.rawThoughtsRemainValid}</p>
          <h1 id="capture-inbox-title">{messages.captureInbox}</h1>
        </div>
        {returnChapterId ? (
          <a href={`/app/chapters/${returnChapterId}`}>
            {messages.returnToChapter}
          </a>
        ) : (
          <a href={`/app/projects/${projectId}`}>
            {messages.returnToProjectHome}
          </a>
        )}
      </header>
      <div className="capture-bulk" aria-label={messages.captureBulkActions}>
        <button onClick={() => void lifecycle("FILE")}>
          {messages.fileSelected}
        </button>
        <button onClick={() => void lifecycle("DEFER")}>
          {messages.deferSelected}
        </button>
        <button onClick={() => void lifecycle("DISMISS")}>
          {" "}
          {messages.dismissSelected}{" "}
        </button>
        <button onClick={() => void lifecycle("RESTORE")}>
          {" "}
          {messages.restoreSelected}{" "}
        </button>
        <label>
          {" "}
          {messages.entityConversionType}{" "}
          <select
            value={entityTypeId}
            onFocus={() => void loadEntityTypes()}
            onChange={(event) => setEntityTypeId(event.target.value)}
          >
            <option value="">{messages.chooseType}</option>
            {entityTypes.map((type) => (
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
      </div>
      {message ? <p role="status">{message}</p> : null}
      <ol className="capture-list">
        {captures.map((capture) => (
          <li key={capture.id} className="capture-row">
            <label className="capture-select">
              <input
                type="checkbox"
                checked={selected.has(capture.id)}
                onChange={(event) =>
                  setSelected((current) => {
                    const next = new Set(current);
                    if (event.target.checked) next.add(capture.id);
                    else next.delete(capture.id);
                    return next;
                  })
                }
              />{" "}
              {messages.selectCapture}{" "}
            </label>
            <p className="capture-text">{capture.rawText}</p>
            <small className="capture-meta">
              {localizedEnumLabel(messages, capture.lifecycle)} ·{" "}
              {formatDateTime(locale, new Date(capture.capturedAt))} ·{" "}
              {interpolateMessage(
                capture.attachmentCount === 1
                  ? messages.captureAttachmentCountOne
                  : messages.captureAttachmentCountOther,
                { count: formatNumber(locale, capture.attachmentCount) },
              )}{" "}
              {interpolateMessage(
                capture.conversionCount === 1
                  ? messages.captureConversionCountOne
                  : messages.captureConversionCountOther,
                { count: formatNumber(locale, capture.conversionCount) },
              )}{" "}
            </small>
            <div className="capture-lifecycle-actions">
              <button onClick={() => void lifecycle("FILE", [capture.id])}>
                {" "}
                {messages.file}{" "}
              </button>
              <button onClick={() => void lifecycle("DEFER", [capture.id])}>
                {" "}
                {messages.defer}{" "}
              </button>
              <button onClick={() => void lifecycle("DISMISS", [capture.id])}>
                {" "}
                {messages.dismiss}{" "}
              </button>
              <button onClick={() => void lifecycle("RESTORE", [capture.id])}>
                {" "}
                {messages.restore}{" "}
              </button>
            </div>
            <div className="capture-conversion-actions">
              <button onClick={() => void convert(capture.id, "MILESTONE")}>
                {" "}
                {messages.convertToMilestone}{" "}
              </button>
              <button onClick={() => void convert(capture.id, "STORY_CHANGE")}>
                {" "}
                {messages.convertToStoryChange}{" "}
              </button>
              <button
                onClick={() =>
                  void convert(capture.id, "CAPTURE_DERIVED_CAUSAL")
                }
              >
                {" "}
                {messages.createCausalIdentity}{" "}
              </button>
              <button
                disabled={!entityTypeId}
                onClick={() => void convert(capture.id, "ENTITY")}
              >
                {" "}
                {messages.convertToEntity}{" "}
              </button>
            </div>
            <fieldset className="capture-causal-actions">
              <legend>{messages.optionalExplicitCausalAction}</legend>
              <label>
                {" "}
                {messages.endpointType}{" "}
                <select
                  value={causalEndpointType[capture.id] ?? "STORY_CHANGE"}
                  onChange={(event) =>
                    setCausalEndpointType((current) => ({
                      ...current,
                      [capture.id]: event.target
                        .value as ActiveCausalEndpointType,
                    }))
                  }
                >
                  {activeCausalEndpointTypes
                    .filter((type) => type !== "CAPTURE_DERIVED")
                    .map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                {" "}
                {messages.endpointId}{" "}
                <input
                  value={causalTarget[capture.id] ?? ""}
                  onChange={(event) =>
                    setCausalTarget((current) => ({
                      ...current,
                      [capture.id]: event.target.value,
                    }))
                  }
                />
              </label>
              <button
                disabled={!causalTarget[capture.id]}
                onClick={() =>
                  void convert(
                    capture.id,
                    "CAPTURE_DERIVED_CAUSAL",
                    "BECAUSE_OF",
                  )
                }
              >
                {" "}
                {messages.becauseOfEndpoint}{" "}
              </button>
              <button
                disabled={!causalTarget[capture.id]}
                onClick={() =>
                  void convert(
                    capture.id,
                    "CAPTURE_DERIVED_CAUSAL",
                    "THIS_CAUSES",
                  )
                }
              >
                {" "}
                {messages.thisCausesEndpoint}{" "}
              </button>
            </fieldset>
            <form
              className="capture-attachment-form"
              onSubmit={(event) => {
                event.preventDefault();
                void attach(capture.id);
              }}
            >
              <label>
                {" "}
                {messages.attachToChapterId}{" "}
                <input
                  value={attachmentTarget[capture.id] ?? ""}
                  onChange={(event) =>
                    setAttachmentTarget((current) => ({
                      ...current,
                      [capture.id]: event.target.value,
                    }))
                  }
                />
              </label>
              <button>{messages.attach}</button>
            </form>
            {capture.attachments.length ? (
              <ul className="capture-attachment-list">
                {capture.attachments.map((attachment) => (
                  <li key={attachment.id}>
                    {localizedEnumLabel(messages, attachment.targetType)}{" "}
                    {attachment.targetId}{" "}
                    <button
                      onClick={() => void detach(capture.id, attachment.id)}
                    >
                      {" "}
                      {messages.detach}{" "}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
