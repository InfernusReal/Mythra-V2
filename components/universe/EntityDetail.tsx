"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  localizedEntityTemplateFieldLabel,
  localizedEntityTemplateName,
  formatNumber,
  interpolateMessage,
  localizedEnumLabel,
  localizedEnumLabelOrValue,
  localizedErrorMessage,
  localizedRelationTemplateLabel,
  type MessageCatalog,
} from "@/lib/i18n/messages";

import { useState } from "react";
import type { UniverseCatalog } from "@/domains/universe/application/ports";
import type { UniverseEntityDetail } from "@/domains/universe/domain/types";

type Envelope<T> = { data?: T; error?: { message: string } };
async function send<T>(
  messages: MessageCatalog,
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
    throw new Error(
      localizedErrorMessage(
        messages,
        payload.error,
        messages.universeOperationFailed,
      ),
    );
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
  const { messages, locale } = useLocale();
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
  const entityType = catalog.entityTypes.find(
    (type) => type.id === detail.entity.typeId,
  );
  const fieldLabel = (field: Readonly<{ key: string; label: string }>) =>
    localizedEntityTemplateFieldLabel(
      messages,
      entityType?.systemKey,
      field.key,
      field.label,
    );
  const relationLabel = (
    item: UniverseEntityDetail["outgoing"][number],
    direction: "forward" | "reverse",
  ) => {
    const type = catalog.relationTypes.find(
      (candidate) => candidate.id === item.relationTypeId,
    );
    return localizedRelationTemplateLabel(
      messages,
      type?.systemKey,
      direction,
      item.label,
    );
  };
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
  const update = async (body: Record<string, unknown>) => {
    const result = await send<{
      entity: UniverseEntityDetail["entity"];
      projectStructuralVersion: number;
    }>(
      messages,
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
      setMessage(messages.entityDetailsUpdated);
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
        error instanceof Error ? error.message : messages.entityUpdateFailed,
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
      setMessage(messages.customFieldsUpdated);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : messages.customFieldUpdateFailed,
      );
    }
  };
  const relation = async () => {
    try {
      const result = await send<{ projectStructuralVersion: number }>(
        messages,
        `/api/v2/projects/${projectId}/universe/relations`,
        {
          fromEntityId: detail.entity.id,
          toEntityId: otherId,
          relationTypeId,
          expectedStructuralVersion: structuralVersion,
        },
      );
      setStructuralVersion(result.projectStructuralVersion);
      setMessage(messages.relationCreatedRefreshToViewIt);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : messages.relationFailed,
      );
    }
  };
  const snapshot = async () => {
    try {
      const state = JSON.parse(stateText) as Record<string, unknown>;
      const result = await send<{
        snapshotId: string;
        projectStructuralVersion: number;
      }>(
        messages,
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
      setMessage(messages.historicalStateAdded);
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
          : messages.stateMustBeAValidJsonObject,
      );
    }
  };
  return (
    <article className="entity-detail">
      <header className="entity-header">
        <div>
          <p className="eyebrow">
            {localizedEntityTemplateName(
              messages,
              entityType?.systemKey,
              detail.entity.typeName,
            )}
          </p>
          <h1>{detail.entity.name}</h1>
        </div>
        <a
          href={
            returnChapterId
              ? `/app/chapters/${returnChapterId}`
              : `/app/projects/${projectId}/universe`
          }
        >
          {returnChapterId
            ? messages.returnToChapter
            : messages.returnToUniverse}
        </a>
      </header>
      {detail.entity.summary ? (
        <p className="entity-summary">{detail.entity.summary}</p>
      ) : null}
      <dl className="entity-facts">
        <div>
          <dt>{messages.aliases}</dt>
          <dd>{detail.entity.aliases.join(", ") || messages.none}</dd>
        </div>
        <div>
          <dt>{messages.tags}</dt>
          <dd>{detail.entity.tags.join(", ") || messages.none}</dd>
        </div>
        <div>
          <dt>{messages.version}</dt>
          <dd>{formatNumber(locale, detail.entity.version)}</dd>
        </div>
      </dl>
      <form
        className="entity-common-form"
        onSubmit={(event) => {
          event.preventDefault();
          void saveCommon();
        }}
      >
        <label>
          {" "}
          {messages.name}{" "}
          <input
            required
            maxLength={240}
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
          />
        </label>
        <label>
          {" "}
          {messages.summary}{" "}
          <textarea
            maxLength={20_000}
            value={editSummary}
            onChange={(event) => setEditSummary(event.target.value)}
          />
        </label>
        <button>{messages.saveEntityDetails}</button>
      </form>
      <section className="entity-section entity-custom-fields">
        <h2>{messages.customFields}</h2>
        {detail.entity.fieldValues.length ? (
          <dl>
            {detail.entity.fieldValues.map((field) => (
              <div key={field.fieldDefinitionId}>
                <dt>{fieldLabel(field)}</dt>
                <dd>
                  {typeof field.value === "string"
                    ? field.value
                    : JSON.stringify(field.value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>{messages.noCustomValuesCompletenessIsOptional}</p>
        )}
        {entityType?.fields.length ? (
          <form
            className="entity-fields-form"
            onSubmit={(event) => {
              event.preventDefault();
              void saveFields();
            }}
          >
            {entityType.fields.map((field) => (
              <label key={field.id}>
                {fieldLabel(field)}
                {field.fieldType === "IMAGE" || field.fieldType === "FILE" ? (
                  <input
                    disabled
                    value={messages.availableAfterPrivateStorageActivation}
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
                    <option value="">{messages.unset}</option>
                    <option value="true">{messages.true}</option>
                    <option value="false">{messages.false}</option>
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
                  {localizedEnumLabel(messages, field.fieldType)}{" "}
                  {field.requiredByUser
                    ? messages.requiredByProjectConfiguration
                    : messages.optional}
                </small>
              </label>
            ))}
            <button>{messages.saveCustomFields}</button>
          </form>
        ) : null}
      </section>
      <section className="entity-section entity-relations">
        <h2>{messages.relations}</h2>
        <ul>
          {detail.outgoing.map((item) => (
            <li key={item.id}>
              {relationLabel(item, "forward")}: {item.otherName}
            </li>
          ))}
          {detail.incoming.map((item) => (
            <li key={item.id}>
              {relationLabel(item, "reverse")}: {item.otherName}
            </li>
          ))}
        </ul>
        <form
          className="entity-relation-form"
          onSubmit={(event) => {
            event.preventDefault();
            void relation();
          }}
        >
          <label>
            {" "}
            {messages.relation}{" "}
            <select
              value={relationTypeId}
              onChange={(event) => setRelationTypeId(event.target.value)}
            >
              {catalog.relationTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {localizedRelationTemplateLabel(
                    messages,
                    type.systemKey,
                    "forward",
                    type.forwardLabel,
                  )}{" "}
                  /{" "}
                  {localizedRelationTemplateLabel(
                    messages,
                    type.systemKey,
                    "reverse",
                    type.reverseLabel,
                  )}
                </option>
              ))}
            </select>
          </label>
          <label>
            {" "}
            {messages.otherEntityId}{" "}
            <input
              required
              value={otherId}
              onChange={(event) => setOtherId(event.target.value)}
            />
          </label>
          <button>{messages.addRelation}</button>
        </form>
      </section>
      <section className="entity-section entity-history">
        <h2>{messages.historicalStates}</h2>
        <ol>
          {detail.snapshots.map((snapshot) => (
            <li key={snapshot.id}>
              <strong>
                {localizedEnumLabel(messages, snapshot.anchorType)}
              </strong>{" "}
              {messages.position} {formatNumber(locale, snapshot.orderIndex)}
              <pre>{JSON.stringify(snapshot.state, null, 2)}</pre>
            </li>
          ))}
        </ol>
        <form
          className="entity-history-form"
          onSubmit={(event) => {
            event.preventDefault();
            void snapshot();
          }}
        >
          <label>
            {" "}
            {messages.stateJson}{" "}
            <textarea
              required
              value={stateText}
              onChange={(event) => setStateText(event.target.value)}
              placeholder={messages.locationHarbor}
            />
          </label>
          <button>{messages.addImmutableState}</button>
        </form>
      </section>
      <section className="entity-section entity-backlinks">
        <h2>{messages.backlinksb4278c6a}</h2>
        <p>
          {interpolateMessage(
            detail.backlinks.length === 1
              ? messages.explicitReferenceCountOne
              : messages.explicitReferenceCountOther,
            { count: formatNumber(locale, detail.backlinks.length) },
          )}
        </p>
        <ul>
          {detail.backlinks.map((backlink, index) => (
            <li key={`${backlink.sourceType}:${backlink.sourceId}:${index}`}>
              {localizedEnumLabelOrValue(messages, backlink.sourceType)} ·{" "}
              {localizedEnumLabelOrValue(messages, backlink.relationshipKey)} ·{" "}
              {backlink.sourceId}
            </li>
          ))}
        </ul>
      </section>
      {message ? <p role="status">{message}</p> : null}
      <small>
        {messages.projectStructureVersion}{" "}
        {formatNumber(locale, structuralVersion)}
      </small>
    </article>
  );
}
