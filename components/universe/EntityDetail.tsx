"use client";

import { useState } from "react";
import type { UniverseCatalog } from "@/domains/universe/application/ports";
import type { UniverseEntityDetail } from "@/domains/universe/domain/types";

type Envelope<T> = { data?: T; error?: { message: string } };
async function send<T>(
  url: string,
  body: unknown,
  method = "POST",
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as Envelope<T>;
  if (!response.ok || !payload.data)
    throw new Error(payload.error?.message ?? "Universe operation failed.");
  return payload.data;
}

export function EntityDetail({
  projectId,
  initialDetail,
  catalog,
  initialStructuralVersion,
  returnChapterId,
}: {
  projectId: string;
  initialDetail: UniverseEntityDetail;
  catalog: UniverseCatalog;
  initialStructuralVersion: number;
  returnChapterId?: string;
}) {
  const [detail, setDetail] = useState(initialDetail);
  const [structuralVersion, setStructuralVersion] = useState(
    initialStructuralVersion,
  );
  const [message, setMessage] = useState("");
  const [otherId, setOtherId] = useState("");
  const [relationTypeId, setRelationTypeId] = useState(
    catalog.relationTypes[0]?.id ?? "",
  );
  const [stateText, setStateText] = useState("");
  const [editName, setEditName] = useState(initialDetail.entity.name);
  const [editSummary, setEditSummary] = useState(
    initialDetail.entity.summary ?? "",
  );
  const [fieldDrafts, setFieldDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initialDetail.entity.fieldValues.map((field) => [
        field.fieldDefinitionId,
        typeof field.value === "string"
          ? field.value
          : JSON.stringify(field.value),
      ]),
    ),
  );
  const entityType = catalog.entityTypes.find(
    (type) => type.id === detail.entity.typeId,
  );
  const update = async (body: Record<string, unknown>) => {
    const result = await send<{
      entity: UniverseEntityDetail["entity"];
      projectStructuralVersion: number;
    }>(
      `/api/v2/projects/${projectId}/universe/entities/${detail.entity.id}`,
      {
        expectedEntityVersion: detail.entity.version,
        expectedStructuralVersion: structuralVersion,
        ...body,
      },
      "PATCH",
    );
    setStructuralVersion(result.projectStructuralVersion);
    setDetail((current) => ({ ...current, entity: result.entity }));
    return result;
  };
  const saveCommon = async () => {
    try {
      const result = await update({
        name: editName,
        summary: editSummary || null,
      });
      setMessage("Entity details updated.");
      // Console trace S9-UI-004: inline entity update emits identity/version metadata without authored fields.
      console.log(
        JSON.stringify({
          level: "info",
          event: "universe.ui_entity_updated",
          step: "S9-UI-004",
          projectId,
          sourceId: result.entity.id,
          entityVersion: result.entity.version,
          structuralVersion: result.projectStructuralVersion,
        }),
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Entity update failed.",
      );
    }
  };
  const saveFields = async () => {
    try {
      const values = (entityType?.fields ?? []).flatMap((field) => {
        const raw = fieldDrafts[field.id]?.trim() ?? "";
        if (!raw) return [];
        if (field.fieldType === "IMAGE" || field.fieldType === "FILE")
          return [];
        let value: unknown = raw;
        if (field.fieldType === "NUMBER") value = Number(raw);
        else if (field.fieldType === "BOOLEAN") value = raw === "true";
        else if (
          ["RICH_TEXT", "MULTI_SELECT", "REFERENCE_LIST"].includes(
            field.fieldType,
          )
        )
          value = JSON.parse(raw);
        return [{ fieldDefinitionId: field.id, value }];
      });
      await update({ values });
      setMessage("Custom fields updated.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Custom field update failed.",
      );
    }
  };
  const relation = async () => {
    try {
      const result = await send<{ projectStructuralVersion: number }>(
        `/api/v2/projects/${projectId}/universe/relations`,
        {
          fromEntityId: detail.entity.id,
          toEntityId: otherId,
          relationTypeId,
          expectedStructuralVersion: structuralVersion,
        },
      );
      setStructuralVersion(result.projectStructuralVersion);
      setMessage("Relation created. Refresh to view it.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Relation failed.");
    }
  };
  const snapshot = async () => {
    try {
      const state = JSON.parse(stateText) as Record<string, unknown>;
      const result = await send<{
        snapshotId: string;
        projectStructuralVersion: number;
      }>(
        `/api/v2/projects/${projectId}/universe/entities/${detail.entity.id}/snapshots`,
        {
          anchorType: "UNANCHORED",
          state,
          orderIndex: detail.snapshots.length,
          expectedStructuralVersion: structuralVersion,
        },
      );
      setStructuralVersion(result.projectStructuralVersion);
      setDetail((current) => ({
        ...current,
        snapshots: [
          ...current.snapshots,
          {
            id: result.snapshotId,
            anchorType: "UNANCHORED",
            anchorId: null,
            state,
            note: null,
            orderIndex: current.snapshots.length,
            sourceEntityVersion: current.entity.version,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
      setStateText("");
      setMessage("Historical state added.");
      // Console trace S9-UI-002: state Peek/history UI completion excludes state JSON and note content.
      console.log(
        JSON.stringify({
          level: "info",
          event: "universe.ui_state_created",
          step: "S9-UI-002",
          projectId,
          sourceId: detail.entity.id,
          targetId: result.snapshotId,
          structuralVersion: result.projectStructuralVersion,
        }),
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "State must be a valid JSON object.",
      );
    }
  };
  return (
    <article className="entity-detail">
      <header>
        <div>
          <p className="eyebrow">{detail.entity.typeName}</p>
          <h1>{detail.entity.name}</h1>
        </div>
        <a
          href={
            returnChapterId
              ? `/app/chapters/${returnChapterId}`
              : `/app/projects/${projectId}/universe`
          }
        >
          {returnChapterId ? "Return to Chapter" : "Return to Universe"}
        </a>
      </header>
      {detail.entity.summary ? <p>{detail.entity.summary}</p> : null}
      <dl>
        <div>
          <dt>Aliases</dt>
          <dd>{detail.entity.aliases.join(", ") || "None"}</dd>
        </div>
        <div>
          <dt>Tags</dt>
          <dd>{detail.entity.tags.join(", ") || "None"}</dd>
        </div>
        <div>
          <dt>Version</dt>
          <dd>{detail.entity.version}</dd>
        </div>
      </dl>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void saveCommon();
        }}
      >
        <label>
          Name
          <input
            required
            maxLength={240}
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
          />
        </label>
        <label>
          Summary
          <textarea
            maxLength={20_000}
            value={editSummary}
            onChange={(event) => setEditSummary(event.target.value)}
          />
        </label>
        <button>Save entity details</button>
      </form>
      <section>
        <h2>Custom fields</h2>
        {detail.entity.fieldValues.length ? (
          <dl>
            {detail.entity.fieldValues.map((field) => (
              <div key={field.fieldDefinitionId}>
                <dt>{field.label}</dt>
                <dd>
                  {typeof field.value === "string"
                    ? field.value
                    : JSON.stringify(field.value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>No custom values. Completeness is optional.</p>
        )}
        {entityType?.fields.length ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void saveFields();
            }}
          >
            {entityType.fields.map((field) => (
              <label key={field.id}>
                {field.label}
                {field.fieldType === "IMAGE" || field.fieldType === "FILE" ? (
                  <input
                    disabled
                    value="Available after private storage activation"
                    readOnly
                  />
                ) : field.fieldType === "BOOLEAN" ? (
                  <select
                    value={fieldDrafts[field.id] ?? ""}
                    onChange={(event) =>
                      setFieldDrafts((current) => ({
                        ...current,
                        [field.id]: event.target.value,
                      }))
                    }
                  >
                    <option value="">Unset</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : (
                  <textarea
                    value={fieldDrafts[field.id] ?? ""}
                    onChange={(event) =>
                      setFieldDrafts((current) => ({
                        ...current,
                        [field.id]: event.target.value,
                      }))
                    }
                    aria-describedby={`field-help-${field.id}`}
                  />
                )}
                <small id={`field-help-${field.id}`}>
                  {field.fieldType}
                  {field.requiredByUser
                    ? " · required by project configuration"
                    : " · optional"}
                </small>
              </label>
            ))}
            <button>Save custom fields</button>
          </form>
        ) : null}
      </section>
      <section>
        <h2>Relations</h2>
        <ul>
          {[...detail.outgoing, ...detail.incoming].map((item) => (
            <li key={item.id}>
              {item.label}: {item.otherName}
            </li>
          ))}
        </ul>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void relation();
          }}
        >
          <label>
            Relation
            <select
              value={relationTypeId}
              onChange={(event) => setRelationTypeId(event.target.value)}
            >
              {catalog.relationTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.forwardLabel} / {type.reverseLabel}
                </option>
              ))}
            </select>
          </label>
          <label>
            Other entity ID
            <input
              required
              value={otherId}
              onChange={(event) => setOtherId(event.target.value)}
            />
          </label>
          <button>Add relation</button>
        </form>
      </section>
      <section>
        <h2>Historical states</h2>
        <ol>
          {detail.snapshots.map((snapshot) => (
            <li key={snapshot.id}>
              <strong>{snapshot.anchorType}</strong> · position{" "}
              {snapshot.orderIndex}
              <pre>{JSON.stringify(snapshot.state, null, 2)}</pre>
            </li>
          ))}
        </ol>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void snapshot();
          }}
        >
          <label>
            State JSON
            <textarea
              required
              value={stateText}
              onChange={(event) => setStateText(event.target.value)}
              placeholder={'{"location":"harbor"}'}
            />
          </label>
          <button>Add immutable state</button>
        </form>
      </section>
      <section>
        <h2>Backlinks</h2>
        <p>{detail.backlinks.length} explicit reference(s).</p>
        <ul>
          {detail.backlinks.map((backlink, index) => (
            <li key={`${backlink.sourceType}:${backlink.sourceId}:${index}`}>
              {backlink.sourceType} · {backlink.relationshipKey} ·{" "}
              {backlink.sourceId}
            </li>
          ))}
        </ul>
      </section>
      {message ? <p role="status">{message}</p> : null}
      <small>Project structure version {structuralVersion}</small>
    </article>
  );
}
