"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";

import { useState } from "react";
import type {
  ResolvedSuggestionStatus,
  SuggestionReadModel,
  SuggestionStatus,
} from "@/domains/suggestions/domain/types";
import { clientTrace } from "@/lib/observability/client-trace";
import {
  formatNumber,
  interpolateMessage,
  localizedErrorMessage,
} from "@/lib/i18n/messages";

type Envelope<T> = { data?: T; error?: { message: string } };

export function SuggestionInbox({
  projectId,
  initialSuggestions,
  initialCursor,
}: {
  projectId: string;
  initialSuggestions: SuggestionReadModel[];
  initialCursor: string | null;
}) {
  const { messages, locale } = useLocale();
  const statusLabels: Record<SuggestionStatus, string> = {
    open: messages.suggestionStatusOpen,
    accepted: messages.suggestionStatusAccepted,
    modified: messages.suggestionStatusModified,
    rejected: messages.suggestionStatusRejected,
    intentional: messages.suggestionStatusIntentional,
  };
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const decide = async (
    suggestion: SuggestionReadModel,
    decision: ResolvedSuggestionStatus,
  ) => {
    const authorNote = notes[suggestion.id]?.trim();
    if (decision === "modified" && !authorNote) {
      setStatus(messages.aModifiedDecisionRequiresAnAuthorNote);
      return;
    }
    setBusyId(suggestion.id);
    const response = await fetch(
      `/api/v2/projects/${projectId}/suggestions/${suggestion.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedVersion: suggestion.version,
          status: decision,
          ...(authorNote ? { authorNote } : {}),
        }),
      },
    );
    const payload = (await response.json()) as Envelope<SuggestionReadModel>;
    setBusyId(null);
    if (!response.ok || !payload.data) {
      setStatus(
        localizedErrorMessage(
          messages,
          payload.error,
          messages.theSuggestionDecisionCouldNotBeSaved,
        ),
      );
      return;
    }
    setSuggestions((current) =>
      current.map((item) => (item.id === suggestion.id ? payload.data! : item)),
    );
    setStatus(
      interpolateMessage(messages.suggestionMarkedWithoutStoryChange, {
        status: statusLabels[decision],
      }),
    );
    // Console trace S17-SUGGESTION-UI-001: author decision interaction records proposal identity, status and version only.
    clientTrace("suggestion.ui_resolved", {
      step: "S17-SUGGESTION-UI-001",
      projectId,
      suggestionId: suggestion.id,
      suggestionStatus: decision,
      version: payload.data.version,
    });
  };

  return (
    <section className="suggestion-inbox" aria-labelledby="suggestion-title">
      <header>
        <div>
          <p className="eyebrow">{messages.authorControlledReview}</p>
          <h1 id="suggestion-title">{messages.suggestions16c1d601}</h1>
        </div>
        <a href={`/app/projects/${projectId}`}>
          {messages.returnToProjectHome}
        </a>
      </header>
      <p>
        {
          messages.agentsMayDiagnoseExplainAndProposeYourDecisionIsRecordedHereNo
        }
      </p>
      <p className="suggestion-cursor">
        {messages.initialPage} {formatNumber(locale, suggestions.length)}{" "}
        {messages.suggestions}
        {initialCursor
          ? messages.additionalResultsAvailableThroughTheBoundedApi
          : ""}
        .
      </p>
      {suggestions.length ? (
        <ol>
          {suggestions.map((suggestion) => (
            <li key={suggestion.id} data-status={suggestion.status}>
              <header>
                <div>
                  <strong>{suggestion.category}</strong>
                  <small>{suggestion.sourceAgent}</small>
                </div>
                <span>{statusLabels[suggestion.status]}</span>
              </header>
              <p>{suggestion.finding}</p>
              <dl>
                <div>
                  <dt>{messages.evidence}</dt>
                  <dd>
                    {formatNumber(locale, suggestion.evidenceReferences.length)}
                  </dd>
                </div>
                <div>
                  <dt>{messages.actions}</dt>
                  <dd>
                    {formatNumber(locale, suggestion.proposedActions.length)}
                  </dd>
                </div>
                <div>
                  <dt>{messages.confidence}</dt>
                  <dd>
                    {suggestion.confidence === null
                      ? messages.notAsserted
                      : formatNumber(locale, suggestion.confidence, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                  </dd>
                </div>
              </dl>
              {suggestion.status === "open" ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void decide(suggestion, "accepted");
                  }}
                >
                  <label>
                    {messages.authorNote}
                    <textarea
                      maxLength={20000}
                      value={notes[suggestion.id] ?? ""}
                      onChange={(event) =>
                        setNotes((current) => ({
                          ...current,
                          [suggestion.id]: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <div>
                    <button disabled={busyId === suggestion.id} type="submit">
                      {messages.acceptFinding}
                    </button>
                    <button
                      disabled={busyId === suggestion.id}
                      type="button"
                      onClick={() => void decide(suggestion, "modified")}
                    >
                      {messages.acceptWithModification}
                    </button>
                    <button
                      disabled={busyId === suggestion.id}
                      type="button"
                      onClick={() => void decide(suggestion, "rejected")}
                    >
                      {messages.reject}
                    </button>
                    <button
                      disabled={busyId === suggestion.id}
                      type="button"
                      onClick={() => void decide(suggestion, "intentional")}
                    >
                      {messages.markIntentional}
                    </button>
                  </div>
                </form>
              ) : suggestion.authorNote ? (
                <p>
                  <strong>{messages.authorNote08ec632d}</strong>{" "}
                  {suggestion.authorNote}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p>{messages.noSuggestionsRequireReview}</p>
      )}
      <p role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}
