import { AppShell } from "@/components/shell/AppShell";
import { requireActor } from "@/lib/auth/runtime";
import { logger } from "@/lib/observability/logger";
import { ProjectCreator } from "@/components/projects/ProjectCreator";
import { writingService } from "@/lib/writing/runtime";

export default async function EmptyAppPage() {
  const actor = await requireActor();
  const projects = await writingService().listProjects(actor);
  // Console trace S0-SHELL-001: authenticated empty shell rendered; no story workflow is claimed.
  logger.info("shell.rendered", { step: "S0-SHELL-001", userId: actor.userId, workspaceId: actor.workspaceId });
  return (
    <AppShell>
      <section className="empty-shell" aria-labelledby="empty-title">
        <p className="eyebrow">Writing</p>
        <h1 id="empty-title">{projects.length ? "Your projects" : "Start with a title"}</h1>
        {projects.map((project) => (
          <article className="project-summary" key={project.id}>
            <h2><a href={`/app/projects/${project.id}`}>{project.title}</a></h2>
            <a className="primary-link" href={`/app/projects/${project.id}`}>Open project</a>
          </article>
        ))}
        <section className="new-project" aria-labelledby="new-project-title">
          <h2 id="new-project-title">{projects.length ? "Start another project" : "Write your first chapter"}</h2>
          <p>No outline or structural setup is required.</p>
          <ProjectCreator />
        </section>
      </section>
    </AppShell>
  );
}
