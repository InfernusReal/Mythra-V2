"use client";
import { useLocale } from "@/components/i18n/LocaleProvider";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QuickCaptureOverlay } from "@/components/capture/QuickCaptureOverlay";
import type { MilestoneOverview } from "@/domains/milestones/application/ports";
import type { CausalOverview } from "@/domains/causality/application/ports";
import type {
  StructureOverview,
  StructureViewStateModel,
} from "@/domains/structure/application/ports";
import type {
  PresentationMode,
  StructureLens,
} from "@/domains/structure/domain/types";
import { ChapterPlanningGrid } from "./ChapterPlanningGrid";
import { CausalLens } from "./CausalLens";
import { MilestoneLens } from "./MilestoneLens";
import { OutlineLens } from "./OutlineLens";
import { RelationshipLens } from "./RelationshipLens";
import { SemanticZoomViewport } from "./SemanticZoomViewport";
import { StructureLensNav } from "./StructureLensNav";
import { VolumeLane } from "./VolumeLane";
import { useNetworkStatus } from "@/lib/offline/use-network-status";
import { formatNumber } from "@/lib/i18n/messages";

const emptyCausality: CausalOverview = {
  projectStructuralVersion: 1,
  storyChanges: [],
  relations: [],
  endpoints: [],
  page: {
    nodeBudget: 200,
    edgeBudget: 300,
    returnedNodes: 0,
    returnedEdges: 0,
    hasMoreNodes: false,
    hasMoreEdges: false,
  },
};

export function StructureWorkspace({
  initialModel,
  initialMilestones,
  initialCausality = emptyCausality,
  returnChapterId,
}: {
  initialModel: StructureOverview;
  initialMilestones: MilestoneOverview;
  initialCausality?: CausalOverview;
  returnChapterId?: string;
}) {
  const { messages, locale } = useLocale();
  const [lens, setLens] = useState<StructureLens>(
    initialModel.viewState.activeLens,
  );
  const [mode, setMode] = useState<PresentationMode>(
    initialModel.viewState.mode,
  );
  const [expandedIds, setExpandedIds] = useState(
    initialModel.viewState.expandedIds,
  );
  const [anchor, setAnchor] = useState({
    type: initialModel.viewState.activeAnchorType,
    id: initialModel.viewState.activeAnchorId,
  });
  const router = useRouter();
  const online = useNetworkStatus();

  const saveView = (next: Partial<StructureViewStateModel>) => {
    if (!online) return;
    const state: StructureViewStateModel = {
      ...initialModel.viewState,
      mode,
      activeLens: lens,
      activeAnchorType: anchor.type,
      activeAnchorId: anchor.id,
      scrollTop: Math.max(0, Math.round(window.scrollY)),
      ...next,
    };
    void fetch(
      `/api/v2/projects/${initialModel.project.id}/structure/view-state`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(state),
      },
    );
  };

  useEffect(() => {
    if (initialModel.viewState.scrollTop)
      requestAnimationFrame(() =>
        window.scrollTo(0, initialModel.viewState.scrollTop ?? 0),
      );
  }, [initialModel.viewState.scrollTop]);

  const changeLens = (next: StructureLens) => {
    setLens(next);
    // Console trace S4-UI-001: active Structure lens changed within the current registered capability set.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S4-UI-001",
        event: "structure.lens_changed",
        projectId: initialModel.project.id,
        activeLens: next,
      }),
    );
    saveView({ activeLens: next });
  };

  const changeMode = (next: PresentationMode) => {
    setMode(next);
    // Console trace S4-UI-002: presentation mode changed without changing schema or validation.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S4-UI-002",
        event: "structure.presentation_mode_changed",
        projectId: initialModel.project.id,
        mode: next,
      }),
    );
    saveView({ mode: next });
  };

  const changeAnchor = (type: string, id: string) => {
    setAnchor({ type, id });
    saveView({ activeAnchorType: type, activeAnchorId: id });
  };

  const changeExpanded = (ids: string[]) => {
    setExpandedIds(ids);
    saveView({ expandedIds: ids });
  };

  const refresh = () => router.refresh();

  const traceRangeNavigation = (
    direction: "previous" | "next",
    rangeStart: number,
  ) => {
    // Console trace S4-UI-024: author requested another bounded Structure range without loading the full neighborhood.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S4-UI-024",
        event: "structure.range_navigation_requested",
        projectId: initialModel.project.id,
        direction,
        rangeStart,
      }),
    );
  };

  const previousRangeStart = Math.max(
    0,
    initialModel.page.rangeStart - initialModel.page.pageSize,
  );

  return (
    <>
      <QuickCaptureOverlay
        editor={null}
        projectId={initialModel.project.id}
        chapterId={
          anchor.type === "CHAPTER" ? (anchor.id ?? undefined) : undefined
        }
        outlineId={
          anchor.type === "CHAPTER_OUTLINE"
            ? (anchor.id ?? undefined)
            : undefined
        }
      />
      <section
        className={`structure-workspace mode-${mode.toLowerCase()}`}
        aria-labelledby="structure-title"
      >
        {!online ? (
          <p className="degraded-structure" role="status">
            {
              messages.structureChangesAreUnavailableOfflineExistingStructureRemainsReadableManuscriptW
            }
          </p>
        ) : null}
        <fieldset
          className="structure-online-boundary"
          disabled={!online}
          aria-describedby={
            !online ? "structure-offline-description" : undefined
          }
        >
          {!online ? (
            <span id="structure-offline-description" className="sr-only">
              {
                messages.allStructureMutationControlsAreDisabledUntilTheServerReturns
              }
            </span>
          ) : null}
          <header className="structure-header">
            <div>
              <p className="eyebrow">{messages.structure}</p>
              <h1 id="structure-title">{initialModel.project.title}</h1>
              <p>
                {messages.version}{" "}
                {formatNumber(locale, initialModel.project.structuralVersion)}
                {messages.planningRemainsOptional}
              </p>
              <div className="structure-return">
                {returnChapterId ? (
                  <a href={`/app/chapters/${returnChapterId}`}>
                    {messages.returnToChapter}
                  </a>
                ) : initialModel.project.activeChapterId ? (
                  <a
                    href={`/app/chapters/${initialModel.project.activeChapterId}`}
                  >
                    {messages.returnToWriting}
                  </a>
                ) : (
                  <a href={`/app/projects/${initialModel.project.id}`}>
                    {messages.returnToProjectHome}
                  </a>
                )}
              </div>
            </div>
            <label>
              {messages.presentationMode}
              <select
                value={mode}
                onChange={(event) =>
                  changeMode(event.currentTarget.value as PresentationMode)
                }
              >
                <option value="DISCOVERY">{messages.discovery}</option>
                <option value="GUIDED">{messages.guided}</option>
                <option value="ARCHITECT">{messages.architect}</option>
              </select>
            </label>
          </header>
          <StructureLensNav
            lenses={initialModel.lenses}
            active={lens}
            onChange={changeLens}
          />
          <div className="structure-budget" role="status">
            {messages.showing}{" "}
            {formatNumber(locale, initialModel.page.returnedNodes)}{" "}
            {messages.nodesAnd}{" "}
            {formatNumber(locale, initialModel.page.returnedEdges)}{" "}
            {messages.relationshipsWithinServerBudgets}
            {initialModel.page.hasMoreNodes || initialModel.page.hasMoreEdges
              ? messages.refineTheActiveLensToLoadAnotherBoundedRange
              : ""}
          </div>
          {initialModel.page.rangeStart > 0 ||
          initialModel.page.nextRangeStart !== null ? (
            <nav
              className="structure-range-nav"
              aria-label={messages.structureResultRanges}
            >
              {initialModel.page.rangeStart > 0 ? (
                <a
                  href={`?rangeStart=${previousRangeStart}`}
                  onClick={() =>
                    traceRangeNavigation("previous", previousRangeStart)
                  }
                >
                  {messages.previousBoundedRange}
                </a>
              ) : null}
              {initialModel.page.nextRangeStart !== null ? (
                <a
                  href={`?rangeStart=${initialModel.page.nextRangeStart}`}
                  onClick={() =>
                    traceRangeNavigation(
                      "next",
                      initialModel.page.nextRangeStart!,
                    )
                  }
                >
                  {messages.nextBoundedRange}
                </a>
              ) : null}
            </nav>
          ) : null}
          {lens === "OUTLINE" ? (
            <OutlineLens
              model={initialModel}
              expandedIds={expandedIds}
              onExpanded={changeExpanded}
              onChanged={refresh}
            />
          ) : null}
          {lens === "VOLUMES" ? (
            <VolumeLane model={initialModel} onChanged={refresh} />
          ) : null}
          {lens === "CHAPTERS" ? (
            <ChapterPlanningGrid model={initialModel} onChanged={refresh} />
          ) : null}
          {lens === "MILESTONES" ? (
            <MilestoneLens
              structure={initialModel}
              model={initialMilestones}
              onChanged={refresh}
            />
          ) : null}
          {lens === "CAUSAL" ? (
            <CausalLens
              structure={initialModel}
              model={initialCausality}
              presentationMode={mode}
              onChanged={refresh}
            />
          ) : null}
          {lens === "RELATIONSHIPS" ? (
            <RelationshipLens model={initialModel} onChanged={refresh} />
          ) : null}
          {lens === "SEMANTIC_ZOOM" ? (
            <SemanticZoomViewport
              model={initialModel}
              milestones={initialMilestones}
              onAnchor={changeAnchor}
              onChanged={refresh}
            />
          ) : null}
        </fieldset>
      </section>
    </>
  );
}
