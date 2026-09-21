"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useRef, useState, type FormEvent } from "react";
import { useCommandHandlers } from "@/lib/commands/use-command-handlers";
import { finiteInputNumber } from "@/lib/forms/numeric-input";
import { useNetworkStatus } from "@/lib/offline/use-network-status";
import type {
  MilestoneOverview,
  MilestoneSummary,
} from "@/domains/milestones/application/ports";
import type { StructureOverview } from "@/domains/structure/application/ports";
import {
  formatDate,
  formatNumber,
  interpolateMessage,
  localizedEnumLabel,
  localizedEnumLabelOrValue,
  localizedErrorMessage,
} from "@/lib/i18n/messages";

interface Envelope<T> {
  data?: T;
  error?: { message: string };
}
interface ScaffoldPlan {
  expectedStructuralVersion: number;
  allocations: Array<{
    sequenceIndex: number;
    chapterStart: number;
    chapterEnd: number;
    targetWords: number | null;
    targetDate: string | null;
  }>;
  placeholderCount: number;
  planToken: string;
  warnings: string[];
}
interface ReorderPlan {
  orderedIds: string[];
  changes: Array<{ id: string; from: number; to: number }>;
}
type MilestoneView = "RANGE" | "DEPENDENCIES" | "MATRIX";

export function MilestoneLens({
  structure,
  model,
  onChanged,
}: {
  structure: StructureOverview;
  model: MilestoneOverview;
  onChanged(): void;
}) {
  const { messages, locale } = useLocale();
  const [view, setView] = useState<MilestoneView>("RANGE");
  const [editing, setEditing] = useState<MilestoneSummary | null>(null);
  const [sequenceIndex, setSequenceIndex] = useState(model.milestones.length);
  const [title, setTitle] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const online = useNetworkStatus();
  useCommandHandlers([
    {
      id: "milestone.create",
      projectId: structure.project.id,
      available: () => !editing && online,
      execute: () => {
        titleRef.current?.focus();
      },
    },
  ]);
  const [description, setDescription] = useState("");
  const [threadLabel, setThreadLabel] = useState("");
  const [chapterStart, setChapterStart] = useState(1);
  const [chapterEnd, setChapterEnd] = useState(1);
  const [targetWords, setTargetWords] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState("PLANNED");
  const [chapterId, setChapterId] = useState(structure.chapters[0]?.id ?? "");
  const [milestoneId, setMilestoneId] = useState(model.milestones[0]?.id ?? "");
  const [role, setRole] = useState("DEVELOP");
  const [customRole, setCustomRole] = useState("");
  const [weight, setWeight] = useState(1);
  const [sourceId, setSourceId] = useState(model.milestones[0]?.id ?? "");
  const [targetId, setTargetId] = useState(model.milestones[1]?.id ?? "");
  const [hard, setHard] = useState(false);
  const [dependencyNote, setDependencyNote] = useState("");
  const [milestoneCount, setMilestoneCount] = useState(
    Math.max(1, model.milestones.length || 4),
  );
  const [chapterCount, setChapterCount] = useState(
    Math.max(1, structure.chapters.length || 12),
  );
  const [advisoryWords, setAdvisoryWords] = useState("");
  const [cadenceStart, setCadenceStart] = useState("");
  const [cadenceDays, setCadenceDays] = useState("");
  const [plan, setPlan] = useState<ScaffoldPlan | null>(null);
  const [reorderPlan, setReorderPlan] = useState<ReorderPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const request = async <T,>(
    url: string,
    method: string,
    body: unknown,
  ): Promise<T | null> => {
    setError(null);
    const response = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (!response.ok || !envelope.data) {
      setError(
        localizedErrorMessage(
          messages,
          envelope.error,
          messages.theMilestoneOperationCouldNotBeCompleted,
        ),
      );
      return null;
    }
    return envelope.data;
  };

  const changeView = (next: MilestoneView) => {
    setView(next);
    // Console trace S5-UI-001: milestone projection view changed without loading an unbounded graph.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S5-UI-001",
        event: "milestone.view_changed",
        projectId: structure.project.id,
        view: next,
      }),
    );
  };

  const beginEdit = (milestone: MilestoneSummary) => {
    setEditing(milestone);
    setSequenceIndex(milestone.sequenceIndex);
    setTitle(milestone.title);
    setDescription(milestone.description ?? "");
    setThreadLabel(milestone.threadLabel ?? "");
    setChapterStart((milestone.targetChapterStart ?? 0) + 1);
    setChapterEnd((milestone.targetChapterEnd ?? 0) + 1);
    setTargetWords(milestone.targetWords?.toString() ?? "");
    setTargetDate(milestone.targetDate ?? "");
    setStatus(milestone.status);
    // Console trace S5-UI-002: milestone edit opened using identity and version metadata only.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S5-UI-002",
        event: "milestone.edit_opened",
        projectId: structure.project.id,
        milestoneId: milestone.id,
        milestoneVersion: milestone.version,
      }),
    );
  };

  const saveMilestone = async (event: FormEvent) => {
    event.preventDefault();
    // Console trace S5-UI-003: milestone write submitted without logging author-authored fields.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S5-UI-003",
        event: "milestone.write_submitted",
        projectId: structure.project.id,
        milestoneId: editing?.id ?? null,
        sequenceIndex,
        status,
      }),
    );
    const result = await request(
      `/api/v2/projects/${structure.project.id}/milestones`,
      editing ? "PUT" : "POST",
      {
        expectedStructuralVersion: structure.project.structuralVersion,
        ...(editing ? { milestoneId: editing.id } : {}),
        sequenceIndex,
        title,
        description: description || undefined,
        threadLabel: threadLabel || undefined,
        targetChapterStart: chapterStart - 1,
        targetChapterEnd: chapterEnd - 1,
        targetWords: targetWords ? Number(targetWords) : undefined,
        targetDate: targetDate || undefined,
        status,
        isPlaceholder: false,
      },
    );
    if (result) {
      setEditing(null);
      setTitle("");
      onChanged();
    }
  };

  const linkChapter = async (event: FormEvent) => {
    event.preventDefault();
    // Console trace S5-UI-004: chapter-to-milestone role link submitted with identities, role and weight only.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S5-UI-004",
        event: "milestone.chapter_link_submitted",
        projectId: structure.project.id,
        chapterId,
        milestoneId,
        role,
        weight,
      }),
    );
    const result = await request(
      `/api/v2/projects/${structure.project.id}/milestones/links`,
      "POST",
      {
        expectedStructuralVersion: structure.project.structuralVersion,
        chapterId,
        milestoneId,
        role,
        ...(role === "CUSTOM" ? { customRole } : {}),
        weight,
      },
    );
    if (result) onChanged();
  };

  const addDependency = async (event: FormEvent) => {
    event.preventDefault();
    // Console trace S5-UI-005: milestone dependency submitted without logging the optional author note.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S5-UI-005",
        event: "milestone.dependency_submitted",
        projectId: structure.project.id,
        sourceMilestoneId: sourceId,
        targetMilestoneId: targetId,
        hard,
      }),
    );
    const result = await request(
      `/api/v2/projects/${structure.project.id}/milestones/dependencies`,
      "POST",
      {
        expectedStructuralVersion: structure.project.structuralVersion,
        sourceMilestoneId: sourceId,
        targetMilestoneId: targetId,
        state: "ACTIVE",
        isHard: hard,
        note: dependencyNote || undefined,
      },
    );
    if (result) onChanged();
  };

  const scaffoldInput = () => ({
    expectedStructuralVersion: structure.project.structuralVersion,
    milestoneCount,
    chapterStart: 1,
    chapterCount,
    ...(advisoryWords
      ? { advisoryProjectTargetWords: Number(advisoryWords) }
      : {}),
    ...(cadenceStart && cadenceDays
      ? { cadenceStartDate: cadenceStart, cadenceDays: Number(cadenceDays) }
      : {}),
  });

  const previewScaffold = async (event: FormEvent) => {
    event.preventDefault();
    // Console trace S5-UI-006: deterministic scaffold preview requested with aggregate allocation settings only.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S5-UI-006",
        event: "milestone.scaffold_preview_requested",
        projectId: structure.project.id,
        milestoneCount,
        chapterCount,
        cadenceEnabled: Boolean(cadenceStart && cadenceDays),
        advisoryWordsEnabled: Boolean(advisoryWords),
      }),
    );
    const result = await request<ScaffoldPlan>(
      `/api/v2/projects/${structure.project.id}/milestones/scaffold/preview`,
      "POST",
      scaffoldInput(),
    );
    if (result) setPlan(result);
  };

  const applyScaffold = async () => {
    if (!plan) return;
    // Console trace S5-UI-007: reviewed scaffold token submitted for atomic apply.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S5-UI-007",
        event: "milestone.scaffold_apply_submitted",
        projectId: structure.project.id,
        milestoneCount: plan.placeholderCount,
      }),
    );
    const result = await request(
      `/api/v2/projects/${structure.project.id}/milestones/scaffold/apply`,
      "POST",
      { input: scaffoldInput(), planToken: plan.planToken },
    );
    if (result) {
      setPlan(null);
      onChanged();
    }
  };

  const previewReorder = async () => {
    if (model.milestones.length < 2) return;
    // Console trace S5-UI-009: milestone reorder preview requested with stable identities and target position only.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S5-UI-009",
        event: "milestone.reorder_preview_requested",
        projectId: structure.project.id,
        objectCount: model.milestones.length,
        targetIndex: 0,
      }),
    );
    const result = await request<ReorderPlan>(
      `/api/v2/projects/${structure.project.id}/milestones/reorder/preview`,
      "POST",
      {
        currentIds: model.milestones.map((item) => item.id),
        movedId: model.milestones.at(-1)!.id,
        targetIndex: 0,
      },
    );
    if (result) setReorderPlan(result);
  };

  const applyReorder = async () => {
    if (!reorderPlan) return;
    // Console trace S5-UI-010: reviewed milestone reorder submitted with stable identities only.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S5-UI-010",
        event: "milestone.reorder_apply_submitted",
        projectId: structure.project.id,
        objectCount: reorderPlan.orderedIds.length,
      }),
    );
    const result = await request(
      `/api/v2/projects/${structure.project.id}/milestones/reorder/apply`,
      "POST",
      {
        expectedStructuralVersion: structure.project.structuralVersion,
        orderedIds: reorderPlan.orderedIds,
      },
    );
    if (result) {
      setReorderPlan(null);
      onChanged();
    }
  };

  return (
    <div className="structure-stack" data-testid="milestones-lens">
      <nav
        className="milestone-view-switcher"
        aria-label={messages.milestoneViews}
      >
        {(["RANGE", "DEPENDENCIES", "MATRIX"] as const).map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={view === item}
            onClick={() => changeView(item)}
          >
            {item === "RANGE"
              ? messages.orderedRanges
              : item === "DEPENDENCIES"
                ? messages.dependencies
                : messages.chapterMatrix}
          </button>
        ))}
      </nav>
      {view === "RANGE" ? (
        <section className="structure-card milestone-overview">
          <div className="structure-heading">
            <div>
              <h2>{messages.milestoneRanges}</h2>
              <p className="structure-help">
                {
                  messages.progressIsAWeightedProjectionOfLinkedChapterTargetsPlanningRangesAnd
                }
              </p>
            </div>
            <div className="structure-actions">
              <span>
                {formatNumber(locale, model.milestones.length)}{" "}
                {messages.milestones}
              </span>
              {model.milestones.length > 1 ? (
                <button type="button" onClick={() => void previewReorder()}>
                  {messages.previewMovingLastFirst}
                </button>
              ) : null}
            </div>
          </div>
          {model.milestones.length ? (
            <ol className="milestone-range-list">
              {model.milestones.map((milestone) => (
                <li key={milestone.id}>
                  <div>
                    <strong>
                      {formatNumber(locale, milestone.sequenceIndex + 1)}.{" "}
                      {milestone.title}
                    </strong>
                    <span>
                      {milestone.threadLabel ?? messages.noThread}{" "}
                      {messages.chaptersd9b70ce2}{" "}
                      {formatNumber(
                        locale,
                        (milestone.targetChapterStart ?? 0) + 1,
                      )}
                      –
                      {formatNumber(
                        locale,
                        (milestone.targetChapterEnd ?? 0) + 1,
                      )}{" "}
                      ·{" "}
                      {formatNumber(
                        locale,
                        Math.round(milestone.progress * 100),
                      )}
                      %
                      {milestone.progressComplete
                        ? ""
                        : messages.boundedEstimate}
                    </span>
                    <progress
                      max="1"
                      value={milestone.progress}
                      aria-label={interpolateMessage(
                        messages.milestoneProgress,
                        { milestone: milestone.title },
                      )}
                    />
                  </div>
                  <button type="button" onClick={() => beginEdit(milestone)}>
                    {messages.edit}
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="structure-empty">
              {messages.noMilestonesWritingAndChapterPlanningRemainAvailable}
            </p>
          )}
        </section>
      ) : null}
      {view === "DEPENDENCIES" ? (
        <section className="structure-card">
          <h2>{messages.dependencyGraphAlternative}</h2>
          <p className="structure-help">
            {
              messages.thisAccessibleListIsTheCanonicalViewHardActiveCyclesAreRejected
            }
          </p>
          {model.dependencies.length ? (
            <ol className="structure-list">
              {model.dependencies.map((dependency) => (
                <li key={dependency.id}>
                  <strong>
                    {model.milestones.find(
                      (item) => item.id === dependency.sourceMilestoneId,
                    )?.title ?? dependency.sourceMilestoneId}{" "}
                    →{" "}
                    {model.milestones.find(
                      (item) => item.id === dependency.targetMilestoneId,
                    )?.title ?? dependency.targetMilestoneId}
                  </strong>
                  <span>
                    {dependency.isHard ? messages.hard : messages.soft} ·{" "}
                    {localizedEnumLabel(messages, dependency.state)}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="structure-empty">
              {messages.noMilestoneDependencies}
            </p>
          )}
        </section>
      ) : null}
      {view === "MATRIX" ? (
        <section className="structure-card">
          <h2>{messages.chapterMatrix}</h2>
          <div
            className="milestone-matrix"
            role="table"
            aria-label={messages.chapterMilestoneMatrix}
          >
            {structure.chapters.map((chapter) => (
              <div role="row" key={chapter.id}>
                <strong role="rowheader">{chapter.title}</strong>
                <span role="cell">
                  {model.links
                    .filter((link) => link.chapterId === chapter.id)
                    .map(
                      (link) =>
                        `${model.milestones.find((item) => item.id === link.milestoneId)?.title ?? messages.milestone}: ${localizedEnumLabelOrValue(messages, link.customRole ?? link.role)} (${formatNumber(locale, link.weight)})`,
                    )
                    .join(", ") || messages.noMilestoneRoles}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <form
        className="structure-card"
        onSubmit={(event) => void saveMilestone(event)}
      >
        <h2>{editing ? messages.editMilestone : messages.createMilestone}</h2>
        <div className="structure-fields">
          <label>
            {messages.order}
            <input
              type="number"
              min="0"
              value={sequenceIndex}
              onChange={(event) =>
                setSequenceIndex(finiteInputNumber(event.currentTarget, 0))
              }
            />
          </label>
          <label>
            {messages.title}
            <input
              ref={titleRef}
              required
              maxLength={240}
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
            />
          </label>
          <label>
            {messages.thread}
            <label className="sr-only" htmlFor="milestone-thread">
              {messages.threadLabel}
            </label>
            <input
              id="milestone-thread"
              maxLength={120}
              value={threadLabel}
              onChange={(event) => setThreadLabel(event.currentTarget.value)}
            />
          </label>
          <label>
            {messages.startChapter}
            <input
              type="number"
              min="1"
              value={chapterStart}
              onChange={(event) =>
                setChapterStart(finiteInputNumber(event.currentTarget, 1))
              }
            />
          </label>
          <label>
            {messages.endChapter}
            <input
              type="number"
              min={chapterStart}
              value={chapterEnd}
              onChange={(event) =>
                setChapterEnd(
                  finiteInputNumber(event.currentTarget, chapterStart),
                )
              }
            />
          </label>
          <label>
            {messages.advisoryWords}
            <input
              type="number"
              min="1"
              value={targetWords}
              onChange={(event) => setTargetWords(event.currentTarget.value)}
            />
          </label>
          <label>
            {messages.softDate}
            <input
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.currentTarget.value)}
            />
          </label>
          <label>
            {messages.status}
            <select
              value={status}
              onChange={(event) => setStatus(event.currentTarget.value)}
            >
              {["PLANNED", "IN_PROGRESS", "COMPLETED", "ARCHIVED"].map(
                (item) => (
                  <option key={item} value={item}>
                    {localizedEnumLabel(messages, item)}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
        <label>
          {messages.description}
          <textarea
            maxLength={20000}
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
          />
        </label>
        <div className="structure-actions">
          <button>
            {editing ? messages.saveMilestone : messages.createMilestone}
          </button>
          {editing ? (
            <button type="button" onClick={() => setEditing(null)}>
              {messages.cancel}
            </button>
          ) : null}
        </div>
      </form>
      <form
        className="structure-card"
        onSubmit={(event) => void linkChapter(event)}
      >
        <h2>{messages.assignChapterRole}</h2>
        <div className="structure-fields">
          <label>
            {messages.chapter}
            <select
              required
              value={chapterId}
              onChange={(event) => setChapterId(event.currentTarget.value)}
            >
              {structure.chapters.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            {messages.milestone}
            <select
              required
              value={milestoneId}
              onChange={(event) => setMilestoneId(event.currentTarget.value)}
            >
              {model.milestones.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            {messages.role}
            <select
              value={role}
              onChange={(event) => setRole(event.currentTarget.value)}
            >
              {[
                "INTRODUCE",
                "DEVELOP",
                "ESCALATE",
                "TURN",
                "RESOLVE",
                "CUSTOM",
              ].map((item) => (
                <option key={item} value={item}>
                  {localizedEnumLabel(messages, item)}
                </option>
              ))}
            </select>
          </label>
          {role === "CUSTOM" ? (
            <label>
              {messages.customRole}
              <input
                required
                maxLength={80}
                value={customRole}
                onChange={(event) => setCustomRole(event.currentTarget.value)}
              />
            </label>
          ) : null}
          <label>
            {messages.weight}
            <input
              type="number"
              min="0"
              step="0.1"
              value={weight}
              onChange={(event) =>
                setWeight(finiteInputNumber(event.currentTarget, 0))
              }
            />
          </label>
        </div>
        <button disabled={!chapterId || !milestoneId}>
          {messages.assignRole}
        </button>
      </form>
      <form
        className="structure-card"
        onSubmit={(event) => void addDependency(event)}
      >
        <h2>{messages.addDependency}</h2>
        <div className="structure-fields">
          <label>
            {messages.source}
            <select
              required
              value={sourceId}
              onChange={(event) => setSourceId(event.currentTarget.value)}
            >
              {model.milestones.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            {messages.dependsOn}
            <select
              required
              value={targetId}
              onChange={(event) => setTargetId(event.currentTarget.value)}
            >
              {model.milestones.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <label className="structure-check">
            <input
              type="checkbox"
              checked={hard}
              onChange={(event) => setHard(event.currentTarget.checked)}
            />
            {messages.hardRequirement}
          </label>
        </div>
        <label>
          {messages.note}
          <textarea
            maxLength={4000}
            value={dependencyNote}
            onChange={(event) => setDependencyNote(event.currentTarget.value)}
          />
        </label>
        <button disabled={!sourceId || !targetId}>
          {messages.addDependency}
        </button>
      </form>
      <form
        className="structure-card"
        onSubmit={(event) => void previewScaffold(event)}
      >
        <h2>{messages.previewMilestoneAllocation}</h2>
        <p className="structure-help">
          {
            messages.thePreviewCreatesPlaceholdersOrRebalancesTheSameMilestoneCountExistingMilestone
          }
        </p>
        <div className="structure-fields">
          <label>
            {messages.milestones39c33dc2}
            <input
              type="number"
              min="1"
              max="500"
              value={milestoneCount}
              onChange={(event) =>
                setMilestoneCount(finiteInputNumber(event.currentTarget, 1))
              }
            />
          </label>
          <label>
            {messages.chapters9831375b}
            <input
              type="number"
              min="1"
              max="10000"
              value={chapterCount}
              onChange={(event) =>
                setChapterCount(finiteInputNumber(event.currentTarget, 1))
              }
            />
          </label>
          <label>
            {messages.advisoryProjectWords}
            <input
              type="number"
              min="1"
              value={advisoryWords}
              onChange={(event) => setAdvisoryWords(event.currentTarget.value)}
            />
          </label>
          <label>
            {messages.cadenceStart}
            <input
              type="date"
              value={cadenceStart}
              onChange={(event) => setCadenceStart(event.currentTarget.value)}
            />
          </label>
          <label>
            {messages.cadenceDays}
            <input
              type="number"
              min="1"
              value={cadenceDays}
              onChange={(event) => setCadenceDays(event.currentTarget.value)}
            />
          </label>
        </div>
        <button>{messages.previewAllocation}</button>
      </form>
      {plan ? (
        <section
          className="structure-preview"
          role="dialog"
          aria-modal="true"
          aria-labelledby="milestone-preview-title"
        >
          <h2 id="milestone-preview-title">
            {messages.reviewMilestoneAllocation}
          </h2>
          {plan.warnings.map((warning) => (
            <p key={warning} className="structure-warning">
              {localizedEnumLabel(messages, warning)}
            </p>
          ))}
          <ol>
            {plan.allocations.map((allocation) => (
              <li key={allocation.sequenceIndex}>
                {messages.milestone}{" "}
                {formatNumber(locale, allocation.sequenceIndex + 1)}
                {messages.chapters}{" "}
                {formatNumber(locale, allocation.chapterStart)}–
                {formatNumber(locale, allocation.chapterEnd)}
                {allocation.targetWords ? (
                  <>
                    {" "}
                    ·{" "}
                    {interpolateMessage(messages.wordCount, {
                      count: formatNumber(locale, allocation.targetWords),
                    })}
                  </>
                ) : null}
                {allocation.targetDate ? (
                  <>
                    {" "}
                    ·{" "}
                    {formatDate(
                      locale,
                      new Date(`${allocation.targetDate}T00:00:00.000Z`),
                      { dateStyle: "medium", timeZone: "UTC" },
                    )}
                  </>
                ) : null}
              </li>
            ))}
          </ol>
          <div className="structure-actions">
            <button type="button" onClick={() => void applyScaffold()}>
              {messages.applyReviewedAllocation}
            </button>
            <button type="button" onClick={() => setPlan(null)}>
              {messages.cancel}
            </button>
          </div>
        </section>
      ) : null}
      {reorderPlan ? (
        <section
          className="structure-preview"
          role="dialog"
          aria-modal="true"
          aria-labelledby="milestone-reorder-title"
        >
          <h2 id="milestone-reorder-title">
            {messages.reviewMilestoneReorder}
          </h2>
          <p>
            {formatNumber(locale, reorderPlan.changes.length)}{" "}
            {
              messages.positionsWillChangeChapterRolesReferencesDependenciesAndStableIdentitiesRemainAt
            }
          </p>
          <ol>
            {reorderPlan.orderedIds.map((id, index) => (
              <li key={id}>
                {formatNumber(locale, index + 1)}.{" "}
                {model.milestones.find((item) => item.id === id)?.title}
              </li>
            ))}
          </ol>
          <div className="structure-actions">
            <button type="button" onClick={() => void applyReorder()}>
              {messages.applyMilestoneReorder}
            </button>
            <button type="button" onClick={() => setReorderPlan(null)}>
              {messages.cancel}
            </button>
          </div>
        </section>
      ) : null}
      {error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
