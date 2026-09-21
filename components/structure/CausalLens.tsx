"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  formatNumber,
  localizedCausalEndpointLabel,
  localizedEnumLabel,
  localizedErrorMessage,
} from "@/lib/i18n/messages";

import { useMemo, useState } from "react";
import type {
  CausalOverview,
  CausalTraversalProjection,
} from "@/domains/causality/application/ports";
import type { ChronologyResult } from "@/domains/causality/domain/chronology";
import type { StructureOverview } from "@/domains/structure/application/ports";
import type { PresentationMode } from "@/domains/structure/domain/types";

type Envelope<T> = { data?: T; error?: { message: string } };

export function CausalLens({
  structure,
  model,
  presentationMode,
  onChanged,
}: {
  structure: StructureOverview;
  model: CausalOverview;
  presentationMode: PresentationMode;
  onChanged: () => void;
}) {
  const { messages, locale } = useLocale();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [trace, setTrace] = useState<CausalTraversalProjection | null>(null);
  const [chronology, setChronology] = useState<
    Record<string, ChronologyResult>
  >({});
  const [primaryId, setPrimaryId] = useState(
    model.endpoints[0]
      ? `${model.endpoints[0].type}:${model.endpoints[0].id}`
      : "",
  );
  const [secondaryId, setSecondaryId] = useState(
    model.endpoints[1]
      ? `${model.endpoints[1].type}:${model.endpoints[1].id}`
      : primaryId,
  );
  const endpoints = useMemo(
    () =>
      new Map(model.endpoints.map((item) => [`${item.type}:${item.id}`, item])),
    [model.endpoints],
  );

  const request = async <T,>(url: string, init: RequestInit): Promise<T> => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(url, init);
      const envelope = (await response.json()) as Envelope<T>;
      if (!response.ok || !envelope.data)
        throw new Error(
          localizedErrorMessage(
            messages,
            envelope.error,
            messages.theCausalOperationFailed,
          ),
        );
      return envelope.data;
    } finally {
      setBusy(false);
    }
  };

  const createChange = async (form: FormData) => {
    try {
      await request(
        `/api/v2/projects/${structure.project.id}/causality/story-changes`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            expectedStructuralVersion: model.projectStructuralVersion,
            kind: form.get("kind"),
            title: form.get("title"),
            storyTime: form.get("storyTime")
              ? Number(form.get("storyTime"))
              : undefined,
            discoveryTime: form.get("discoveryTime")
              ? Number(form.get("discoveryTime"))
              : undefined,
            isPlaceholder: false,
          }),
        },
      );
      // Console trace S6-UI-001: one-line Story Change creation completed without logging authored text or time values.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S6-UI-001",
          event: "causality.story_change_created",
          projectId: structure.project.id,
          kind: form.get("kind"),
        }),
      );
      onChanged();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : messages.theStoryChangeCouldNotBeCreated,
      );
    }
  };

  const compose = async (form: FormData) => {
    const primary = endpoints.get(primaryId);
    const secondary = endpoints.get(secondaryId);
    if (!primary || !secondary)
      return setMessage(messages.chooseTwoAvailableStoryEndpoints);
    const mode = String(form.get("phrase"));
    const source = mode === "BECAUSE" ? secondary : primary;
    const target = mode === "BECAUSE" ? primary : secondary;
    try {
      await request(
        `/api/v2/projects/${structure.project.id}/causality/relations`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            expectedStructuralVersion: model.projectStructuralVersion,
            source: { type: source.type, id: source.id },
            target: { type: target.type, id: target.id },
            relationType: form.get("relationType"),
            condition: form.get("condition") || undefined,
            strength: Number(form.get("strength")),
            importance: Number(form.get("importance")),
            state: form.get("state"),
            isHard: form.get("hard") === "on",
            temporalProgression: form.get("temporal") === "on",
            mutualStateSemantics: form.get("mutual") === "on",
            note: form.get("note") || undefined,
            provenanceType: "DIRECT",
            provenanceNote: form.get("provenanceNote") || undefined,
          }),
        },
      );
      // Console trace S6-UI-002: cause/effect phrase committed with endpoint types and relation metadata only.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S6-UI-002",
          event: "causality.composed",
          projectId: structure.project.id,
          phrase: mode,
          sourceType: source.type,
          targetType: target.type,
          relationType: form.get("relationType"),
        }),
      );
      onChanged();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : messages.theCausalRelationCouldNotBeCreated,
      );
    }
  };

  const traceFrom = async (direction: "UPSTREAM" | "DOWNSTREAM") => {
    const root = endpoints.get(primaryId);
    if (!root) return setMessage(messages.chooseAnAvailableStoryEndpoint);
    try {
      const result = await request<CausalTraversalProjection>(
        `/api/v2/projects/${structure.project.id}/causality/${direction === "UPSTREAM" ? "neighborhood" : "impact"}?endpointType=${root.type}&endpointId=${root.id}&direction=${direction}&maxDepth=4&nodeBudget=200&edgeBudget=300&pathBudget=200`,
        { method: "GET" },
      );
      setTrace(result);
      // Console trace S6-UI-003: bounded Why-now/What-changes trace displayed with aggregate facts only.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S6-UI-003",
          event: "causality.trace_displayed",
          projectId: structure.project.id,
          direction,
          pathCount: result.paths.length,
          truncated: result.truncated,
        }),
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : messages.theCausalTraceCouldNotBeLoaded,
      );
    }
  };

  const lifecycle = async (
    relationId: string,
    action: "REATTACH" | "RETIRE" | "ARCHIVE",
  ) => {
    const source = endpoints.get(primaryId);
    const target = endpoints.get(secondaryId);
    if (action === "REATTACH" && (!source || !target))
      return setMessage(messages.chooseAAndBBeforeReattachingTheRelation);
    try {
      await request(
        `/api/v2/projects/${structure.project.id}/causality/relations/lifecycle`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            expectedStructuralVersion: model.projectStructuralVersion,
            relationId,
            action,
            ...(action === "REATTACH"
              ? {
                  source: { type: source!.type, id: source!.id },
                  target: { type: target!.type, id: target!.id },
                }
              : {}),
          }),
        },
      );
      // Console trace S6-UI-004: explicit causal evidence lifecycle choice completed.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S6-UI-004",
          event: "causality.lifecycle_selected",
          projectId: structure.project.id,
          relationId,
          action,
        }),
      );
      onChanged();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : messages.theRelationCouldNotBeUpdated,
      );
    }
  };

  const checkChronology = async (relationId: string) => {
    try {
      const result = await request<{ chronology: ChronologyResult }>(
        `/api/v2/projects/${structure.project.id}/causality/chronology`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ relationId }),
        },
      );
      setChronology((current) => ({
        ...current,
        [relationId]: result.chronology,
      }));
      // Console trace S6-UI-008: neutral chronology result displayed without story-time values or authored content.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S6-UI-008",
          event: "causality.chronology_displayed",
          projectId: structure.project.id,
          relationId,
          status: result.chronology.status,
          basis: result.chronology.basis,
          warningCount: result.chronology.warnings.length,
        }),
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : messages.chronologyCouldNotBeChecked,
      );
    }
  };

  return (
    <section className="causal-lens" aria-labelledby="causal-lens-title">
      <header className="causal-intro">
        <p className="eyebrow">{messages.causalStoryFabric}</p>
        <h2 id="causal-lens-title">{messages.becauseAndConsequence}</h2>
        <p>
          {
            messages.recordOnlyTheRelationshipsYouMeanCausalityIsOptionalAndNeverInferred
          }
        </p>
      </header>
      {message ? <p role="alert">{message}</p> : null}
      <form action={createChange} className="causal-form">
        <h3>{messages.oneLineStoryChange}</h3>
        <label>
          {messages.kind}
          <select name="kind">
            <option value="EVENT">{messages.event}</option>
            <option value="DECISION">{messages.decision}</option>
            <option value="REVELATION">{messages.revelation}</option>
            <option value="STATE_CHANGE">{messages.stateChange}</option>
            <option value="SETUP">{messages.setup}</option>
            <option value="PAYOFF">{messages.payoff}</option>
            <option value="CONDITION">{messages.condition}</option>
            <option value="OUTCOME">{messages.outcome}</option>
            <option value="CUSTOM">{messages.custom}</option>
          </select>
        </label>
        <label>
          {messages.change}
          <input name="title" required maxLength={240} />
        </label>
        <label>
          {messages.storyTimeOptional}
          <input name="storyTime" type="number" step="any" />
        </label>
        <label>
          {messages.discoveryTimeRevelations}
          <input name="discoveryTime" type="number" step="any" />
        </label>
        <button disabled={busy} type="submit">
          {messages.addStoryChange}
        </button>
      </form>
      {model.endpoints.length >= 2 ? (
        <form action={compose} className="causal-form causal-relation-form">
          <h3>{messages.causeAndEffect}</h3>
          <label>
            A
            <select
              value={primaryId}
              onChange={(event) => setPrimaryId(event.currentTarget.value)}
            >
              {model.endpoints.map((item) => (
                <option
                  key={`${item.type}:${item.id}`}
                  value={`${item.type}:${item.id}`}
                >
                  {localizedCausalEndpointLabel(messages, locale, item)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {messages.phrase}
            <select name="phrase">
              <option value="BECAUSE">{messages.aBecauseOfB}</option>
              <option value="CAUSES">{messages.aCausesB}</option>
            </select>
          </label>
          <label>
            B
            <select
              value={secondaryId}
              onChange={(event) => setSecondaryId(event.currentTarget.value)}
            >
              {model.endpoints.map((item) => (
                <option
                  key={`${item.type}:${item.id}`}
                  value={`${item.type}:${item.id}`}
                >
                  {localizedCausalEndpointLabel(messages, locale, item)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {messages.relationship}
            <select name="relationType">
              <option value="CAUSES">{messages.causes}</option>
              <option value="ENABLES">{messages.enables}</option>
              <option value="REQUIRES">{messages.requires}</option>
              <option value="MOTIVATES">{messages.motivates}</option>
              <option value="TRIGGERS">{messages.triggers}</option>
              <option value="ESCALATES">{messages.escalates}</option>
              <option value="PREVENTS_BLOCKS">{messages.preventsBlocks}</option>
              <option value="REVEALS">{messages.reveals}</option>
              <option value="TRANSFORMS">{messages.transforms}</option>
              <option value="RESOLVES">{messages.resolves}</option>
            </select>
          </label>
          <label>
            {messages.state}
            <select name="state">
              <option value="ACTIVE">{messages.active}</option>
              <option value="TENTATIVE">{messages.tentative}</option>
              <option value="RETIRED">{messages.retired}</option>
            </select>
          </label>
          <label>
            {messages.conditionOptional}
            <input name="condition" maxLength={4000} />
          </label>
          <label>
            {messages.noteOptional}
            <textarea name="note" maxLength={8000} />
          </label>
          <label>
            {messages.provenanceNoteOptional}
            <input name="provenanceNote" maxLength={4000} />
          </label>
          <label>
            {messages.strength}
            <input
              name="strength"
              type="number"
              min="0"
              max="1"
              step="0.1"
              defaultValue="1"
            />
          </label>
          <label>
            {messages.importance}
            <input
              name="importance"
              type="number"
              min="0"
              max="100"
              defaultValue="50"
            />
          </label>
          <fieldset>
            <legend>{messages.requiresCycleSemantics}</legend>
            <label>
              <input name="hard" type="checkbox" /> {messages.hardRequires}
            </label>
            <label>
              <input name="temporal" type="checkbox" />{" "}
              {messages.temporalProgression}
            </label>
            <label>
              <input name="mutual" type="checkbox" />{" "}
              {messages.mutualStateSemantics}
            </label>
          </fieldset>
          <button disabled={busy} type="submit">
            {messages.recordCausalRelation}
          </button>
        </form>
      ) : null}
      {model.endpoints.length ? (
        <div className="causal-trace-actions">
          <button disabled={busy} onClick={() => void traceFrom("UPSTREAM")}>
            {messages.whyNow}
          </button>
          <button disabled={busy} onClick={() => void traceFrom("DOWNSTREAM")}>
            {messages.whatChanges}
          </button>
        </div>
      ) : null}
      {model.relations.length ? (
        <section className="causal-relations" aria-labelledby="causal-list-title">
          <h3 id="causal-list-title">{messages.causalRelationships}</h3>
          <p>
            {
              messages.toReattachAnArchivedEndpointChooseReplacementAAndBAboveThen
            }
          </p>
          <ol className="causal-list">
            {model.relations.map((relation) => {
              const source = endpoints.get(
                `${relation.source.type}:${relation.source.id}`,
              );
              const target = endpoints.get(
                `${relation.target.type}:${relation.target.id}`,
              );
              const check = chronology[relation.id];
              return (
                <li key={relation.id}>
                  <strong>
                    {source
                      ? localizedCausalEndpointLabel(messages, locale, source)
                      : localizedEnumLabel(messages, relation.source.type)}
                  </strong>{" "}
                  <span>
                    {localizedEnumLabel(messages, relation.relationType)}
                  </span>{" "}
                  <strong>
                    {target
                      ? localizedCausalEndpointLabel(messages, locale, target)
                      : localizedEnumLabel(messages, relation.target.type)}
                  </strong>
                  <small>
                    {localizedEnumLabel(messages, relation.state)}{" "}
                    {messages.provenance}{" "}
                    {localizedEnumLabel(messages, relation.provenanceType)}
                  </small>
                  {relation.condition ? (
                    <p>
                      {messages.conditiond0343c6d} {relation.condition}
                    </p>
                  ) : null}
                  {relation.note ? (
                    <p>
                      {messages.note1150f054} {relation.note}
                    </p>
                  ) : null}
                  <div className="causal-relation-actions">
                    <button onClick={() => void checkChronology(relation.id)}>
                      {messages.checkChronology}
                    </button>
                    <button
                      onClick={() => void lifecycle(relation.id, "REATTACH")}
                    >
                      {messages.reattachToAAndB}
                    </button>
                    <button
                      onClick={() => void lifecycle(relation.id, "RETIRE")}
                    >
                      {messages.retire}
                    </button>
                    <button
                      onClick={() => void lifecycle(relation.id, "ARCHIVE")}
                    >
                      {messages.archiveRelation}
                    </button>
                  </div>
                  {check ? (
                    <p role="status">
                      {localizedEnumLabel(messages, check.status)}{" "}
                      {messages.using}{" "}
                      {localizedEnumLabel(messages, check.basis)}.
                      {check.warnings
                        .map(
                          (warning) =>
                            ` ${localizedEnumLabel(messages, warning.code)}`,
                        )
                        .join("")}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}
      {presentationMode === "ARCHITECT" && model.relations.length ? (
        <section className="causal-graph" aria-labelledby="local-graph-title">
          <h3 id="local-graph-title">{messages.localGraph}</h3>
          <div className="causal-local-graph" aria-hidden="true">
            {model.relations.slice(0, 12).map((relation) => (
              <span key={relation.id}>
                {localizedEnumLabel(messages, relation.source.type)} →{" "}
                {localizedEnumLabel(messages, relation.target.type)}
              </span>
            ))}
          </div>
          <p>{messages.theRelationshipListAboveIsTheAccessibleEquivalent}</p>
        </section>
      ) : null}
      {trace ? (
        <section className="causal-trace" aria-labelledby="causal-trace-title">
          <h3 id="causal-trace-title">
            {trace.paths[0]?.direction === "UPSTREAM"
              ? messages.whyNow
              : messages.whatChanges}
          </h3>
          <p>
            {formatNumber(locale, trace.paths.length)}{" "}
            {messages.potentiallyAffectedPathsWithin}{" "}
            {formatNumber(locale, trace.nodeCount)} {messages.nodesAnd}{" "}
            {formatNumber(locale, trace.edgeCount)} {messages.inspectedEdges}
            {trace.truncated ? messages.resultsStoppedAtTheDeclaredBudget : ""}
          </p>
          <ol className="causal-list">
            {trace.paths.map((path, index) => (
              <li key={`${path.direction}:${path.endpoint.id}:${index}`}>
                <strong>
                  {localizedCausalEndpointLabel(
                    messages,
                    locale,
                    path.endpoint,
                  )}
                </strong>
                <small>
                  {messages.depth} {formatNumber(locale, path.depth)};{" "}
                  {path.steps
                    .map(
                      (step) =>
                        `${localizedEnumLabel(messages, step.relationType)} [${localizedEnumLabel(messages, step.provenanceType)}]`,
                    )
                    .join(" → ")}
                </small>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </section>
  );
}
