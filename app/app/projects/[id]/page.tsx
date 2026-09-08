import { getRequestI18n } from "@/lib/i18n/request";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { AppShell } from "@/components/shell/AppShell";
import { StartFirstChapter } from "@/components/projects/StartFirstChapter";
import { QuickCaptureOverlay } from "@/components/capture/QuickCaptureOverlay";
import { LiveModelFreshness } from "@/components/live-model/LiveModelFreshness";
import { PortabilityPanel } from "@/components/portability/PortabilityPanel";
import { requireActor } from "@/lib/auth/runtime";
import { logger } from "@/lib/observability/logger";
import { continuationService } from "@/lib/writing/runtime";
import { ContinueWritingLink } from "@/components/operations/ContinueWritingLink";
import { formatNumber } from "@/lib/i18n/messages";

export default async function ProjectHomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { messages, locale } = await getRequestI18n();
  const actor = await requireActor();
  const { id } = await params;
  const model = await continuationService().get(actor, id, randomUUID());
  if (!model) notFound();
  // Console trace S3-HOME-001: Project Home rendered from the bounded continuation model; titles/content are excluded.
  logger.info("continuation.project_home_rendered", {
    step: "S3-HOME-001",
    workspaceId: actor.workspaceId,
    projectId: id,
    activeChapterId: model.activeChapter?.id,
    recentChapterCount: model.recentChapters.length,
  });
  return (
    <AppShell>
      <QuickCaptureOverlay editor={null} projectId={model.project.id} />
      <section
        className="project-home"
        aria-labelledby="project-home-title"
        data-search-project-id={model.project.id}
      >
        <p className="eyebrow">{messages.project}</p>
        <h1 id="project-home-title">{model.project.title}</h1>
        <LiveModelFreshness projectId={model.project.id} allowRepair />
        <PortabilityPanel projectId={model.project.id} />
        <a
          className="structure-link"
          href={`/app/projects/${model.project.id}/structure`}
        >
          {messages.openStructure}
        </a>
        <a
          className="structure-link"
          href={`/app/projects/${model.project.id}/captures`}
        >
          {messages.openCaptureInbox}
        </a>
        <a
          className="structure-link"
          href={`/app/projects/${model.project.id}/universe`}
        >
          {messages.openUniverse}
        </a>
        <a
          className="structure-link"
          href={`/app/projects/${model.project.id}/search`}
        >
          {messages.searchProject}
        </a>
        <a
          className="structure-link"
          href={`/app/projects/${model.project.id}/timeline`}
        >
          {messages.openTimeline}
        </a>
        <a
          className="structure-link"
          href={`/app/projects/${model.project.id}/research`}
        >
          {messages.openNotesAndResearch}
        </a>
        <a
          className="structure-link"
          href={`/app/projects/${model.project.id}/suggestions`}
        >
          {messages.reviewSuggestions}
        </a>
        {model.activeChapter ? (
          <>
            <ContinueWritingLink
              projectId={model.project.id}
              chapterId={model.activeChapter.id}
            />
            <p className="continuation-fact">
              {messages.returnTo} {model.activeChapter.title}{" "}
              {messages.atTheLastSavedWritingPosition}
            </p>
          </>
        ) : (
          <section
            className="empty-project"
            aria-labelledby="empty-project-title"
          >
            <h2 id="empty-project-title">{messages.noChaptersYet}</h2>
            <p>{messages.startWritingWithoutAnOutlineOrStructuralSetup}</p>
            <StartFirstChapter projectId={model.project.id} />
          </section>
        )}
        {model.recentChapters.length ? (
          <section
            className="recent-chapters"
            aria-labelledby="recent-chapters-title"
          >
            <h2 id="recent-chapters-title">{messages.recentChapters}</h2>
            <ol>
              {model.recentChapters.map((chapter) => (
                <li key={chapter.id}>
                  <a href={`/app/chapters/${chapter.id}`}>{chapter.title}</a>
                  <span>
                    {formatNumber(locale, chapter.wordCount)} {messages.words}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </section>
    </AppShell>
  );
}
