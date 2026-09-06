"use client";

import { useMemo, useRef, useState } from "react";
import { useCommandHandlers } from "@/lib/commands/use-command-handlers";
import type { UniverseCatalog } from "@/domains/universe/application/ports";
import type { UniverseEntitySummary } from "@/domains/universe/domain/types";
import { VirtualList } from "@/components/performance/VirtualList";

type Props = {
  projectId: string;
  initialEntities: UniverseEntitySummary[];
  initialCatalog: UniverseCatalog;
  initialStructuralVersion: number;
  returnChapterId?: string;
};
type Envelope<T> = { data?: T; error?: { message: string } };

async function send<T>(
  url: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = (await response.json()) as Envelope<T>;
  if (!response.ok || !payload.data)
    throw new Error(payload.error?.message ?? "Universe operation failed.");
  return payload.data;
}

export function UniverseWorkspace({
  projectId,
  initialEntities,
  initialCatalog,
  initialStructuralVersion,
  returnChapterId,
}: Props) {
  const [entities, setEntities] = useState(initialEntities);
  const [catalog, setCatalog] = useState(initialCatalog);
  const [structuralVersion, setStructuralVersion] = useState(
    initialStructuralVersion,
  );
  const [typeId, setTypeId] = useState(initialCatalog.entityTypes[0]?.id ?? "");
  const [name, setName] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  useCommandHandlers([{ id: "entity.create", projectId, execute: () => { nameRef.current?.focus(); } }]);
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [customTypeKey, setCustomTypeKey] = useState("");
  const [customTypeName, setCustomTypeName] = useState("");
  const visible = useMemo(
    () =>
      entities.filter((entity) => !typeFilter || entity.typeId === typeFilter),
    [entities, typeFilter],
  );
  const create = async () => {
    if (!name.trim() || !typeId) return;
    setStatus("Creating entity…");
    try {
      const result = await send<{
        entity: UniverseEntitySummary;
        projectStructuralVersion: number;
      }>(`/api/v2/projects/${projectId}/universe`, "POST", {
        typeId,
        name,
        ...(summary ? { summary } : {}),
        aliases: [],
        tags: [],
        values: [],
        expectedStructuralVersion: structuralVersion,
      });
      setEntities((current) => [result.entity, ...current]);
      setStructuralVersion(result.projectStructuralVersion);
      setName("");
      setSummary("");
      setStatus("Entity created.");
      // Console trace S9-UI-001: Universe create UI completion emits identity/version metadata and no authored values.
      console.log(
        JSON.stringify({
          level: "info",
          event: "universe.ui_entity_created",
          step: "S9-UI-001",
          projectId,
          sourceId: result.entity.id,
          structuralVersion: result.projectStructuralVersion,
        }),
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Entity creation failed.",
      );
    }
  };
  const refreshCatalog = async () => {
    const result = await send<
      UniverseCatalog & { projectStructuralVersion: number }
    >(`/api/v2/projects/${projectId}/universe/types`, "GET");
    setCatalog(result);
    setStructuralVersion(result.projectStructuralVersion);
    if (!typeId) setTypeId(result.entityTypes[0]?.id ?? "");
  };
  const createType = async () => {
    if (!customTypeKey.trim() || !customTypeName.trim()) return;
    try {
      const result = await send<{
        typeId: string;
        projectStructuralVersion: number;
      }>(`/api/v2/projects/${projectId}/universe/types`, "POST", {
        key: customTypeKey,
        name: customTypeName,
        fields: [],
        expectedStructuralVersion: structuralVersion,
      });
      setStructuralVersion(result.projectStructuralVersion);
      setCustomTypeKey("");
      setCustomTypeName("");
      await refreshCatalog();
      setTypeId(result.typeId);
      setStatus("Custom type created.");
      // Console trace S9-UI-005: custom type UI completion excludes author labels and schema content.
      console.log(
        JSON.stringify({
          level: "info",
          event: "universe.ui_type_created",
          step: "S9-UI-005",
          projectId,
          typeId: result.typeId,
          structuralVersion: result.projectStructuralVersion,
        }),
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Custom type creation failed.",
      );
    }
  };
  return (
    <section className="universe-workspace" aria-labelledby="universe-title">
      <header>
        <div>
          <p className="eyebrow">Optional world context</p>
          <h1 id="universe-title">Universe</h1>
        </div>
        <a
          href={
            returnChapterId
              ? `/app/chapters/${returnChapterId}`
              : `/app/projects/${projectId}`
          }
        >
          {returnChapterId ? "Return to Chapter" : "Return to Project Home"}
        </a>
      </header>
      <p>
        Entities require only a type and name. Templates and fields remain
        optional.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void create();
        }}
      >
        <label>
          Type
          <select
            value={typeId}
            onFocus={() => {
              if (!catalog.entityTypes.length) void refreshCatalog();
            }}
            onChange={(event) => setTypeId(event.target.value)}
          >
            {catalog.entityTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Name
          <input
            ref={nameRef}
            required
            maxLength={240}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          Optional summary
          <textarea
            maxLength={20_000}
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
          />
        </label>
        <button type="submit">Create entity</button>
      </form>
      {status ? <p role="status">{status}</p> : null}
      <details>
        <summary>Create a project custom type</summary>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void createType();
          }}
        >
          <label>
            Stable key
            <input
              required
              pattern="[a-z][a-z0-9_]*"
              maxLength={80}
              value={customTypeKey}
              onChange={(event) => setCustomTypeKey(event.target.value)}
            />
          </label>
          <label>
            Type name
            <input
              required
              maxLength={120}
              value={customTypeName}
              onChange={(event) => setCustomTypeName(event.target.value)}
            />
          </label>
          <button>Create custom type</button>
        </form>
      </details>
      <label>
        Filter by type
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="">All types</option>
          {catalog.entityTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </label>
      {visible.length ? <VirtualList items={visible} getKey={(entity) => entity.id} label="Universe entities" className="universe-list" rowHeight={144} renderItem={(entity) => (
            <a
              href={`/app/projects/${projectId}/universe/${entity.id}${returnChapterId ? `?returnChapterId=${returnChapterId}` : ""}`}
            >
              <strong>{entity.name}</strong>
              <span>{entity.typeName}</span>
              {entity.summary ? <p>{entity.summary}</p> : null}
            </a>
      )} /> : null}
      {visible.length === 0 ? (
        <p>
          No entities match this view. Writing remains available without
          Universe setup.
        </p>
      ) : null}
    </section>
  );
}
