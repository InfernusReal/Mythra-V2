import { getRequestI18n } from "@/lib/i18n/request";
import { AppShell } from "@/components/shell/AppShell";
import { requireActor } from "@/lib/auth/runtime";
import { logger } from "@/lib/observability/logger";
import { ProjectCreator } from "@/components/projects/ProjectCreator";
import { writingService } from "@/lib/writing/runtime";

export default async function EmptyAppPage() {
  const { messages } = await getRequestI18n();
  const actor = await requireActor();
  const projects = await writingService().listProjects(actor);
  // Console trace S0-SHELL-001: authenticated empty shell rendered; no story workflow is claimed.
  logger.info("shell.rendered", {
    step: "S0-SHELL-001",
    userId: actor.userId,
    workspaceId: actor.workspaceId,
  });
  return (
    <AppShell>
      <section className="empty-shell" aria-labelledby="empty-title">
        <p className="eyebrow">{messages.writing}</p>
        <h1 id="empty-title">
          {projects.length ? messages.yourProjects : messages.startWithATitle}
        </h1>
        {projects.map((project) => (
          <article className="project-summary" key={project.id}>
            <h2>
              <a href={`/app/projects/${project.id}`}>{project.title}</a>
            </h2>
            <a className="primary-link" href={`/app/projects/${project.id}`}>
              {messages.openProject}
            </a>
          </article>
        ))}
        <section className="new-project" aria-labelledby="new-project-title">
          <h2 id="new-project-title">
            {projects.length
              ? messages.startAnotherProject
              : messages.writeYourFirstChapter}
          </h2>
          <p>{messages.noOutlineOrStructuralSetupIsRequired}</p>
          <ProjectCreator />
        </section>
      </section>
    </AppShell>
  );
}
