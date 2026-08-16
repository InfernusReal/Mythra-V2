import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { AppShell } from "@/components/shell/AppShell";
import { StartFirstChapter } from "@/components/projects/StartFirstChapter";
import { QuickCaptureOverlay } from "@/components/capture/QuickCaptureOverlay";
import { requireActor } from "@/lib/auth/runtime";
import { logger } from "@/lib/observability/logger";
import { continuationService } from "@/lib/writing/runtime";

export default async function ProjectHomePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const model = await continuationService().get(actor, id, randomUUID());
  if (!model) notFound();
  // Console trace S3-HOME-001: Project Home rendered from the bounded continuation model; titles/content are excluded.
  logger.info("continuation.project_home_rendered", { step: "S3-HOME-001", workspaceId: actor.workspaceId, projectId: id, activeChapterId: model.activeChapter?.id, recentChapterCount: model.recentChapters.length });
  return (
    <AppShell>
      <QuickCaptureOverlay editor={null} projectId={model.project.id} />
      <section className="project-home" aria-labelledby="project-home-title">
        <p className="eyebrow">Project</p>
        <h1 id="project-home-title">{model.project.title}</h1>
        <a className="structure-link" href={`/app/projects/${model.project.id}/structure`}>Open Structure</a>
        <a className="structure-link" href={`/app/projects/${model.project.id}/captures`}>Open Capture Inbox</a>
        {model.activeChapter ? (
          <>
            <a className="continue-writing" href={`/app/chapters/${model.activeChapter.id}`}>Continue Writing</a>
            <p className="continuation-fact">Return to {model.activeChapter.title} at the last saved writing position.</p>
          </>
        ) : (
          <section className="empty-project" aria-labelledby="empty-project-title">
            <h2 id="empty-project-title">No chapters yet</h2>
            <p>Start writing without an outline or structural setup.</p>
            <StartFirstChapter projectId={model.project.id} />
          </section>
        )}
        {model.recentChapters.length ? (
          <section className="recent-chapters" aria-labelledby="recent-chapters-title">
            <h2 id="recent-chapters-title">Recent chapters</h2>
            <ol>
              {model.recentChapters.map((chapter) => <li key={chapter.id}><a href={`/app/chapters/${chapter.id}`}>{chapter.title}</a><span>{chapter.wordCount} words</span></li>)}
            </ol>
          </section>
        ) : null}
      </section>
    </AppShell>
  );
}
