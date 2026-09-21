import { getRequestI18n } from "@/lib/i18n/request";
import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { ResearchWorkspace } from "@/components/research/ResearchWorkspace";
import { requireActor } from "@/lib/auth/runtime";
import { noteService } from "@/lib/notes/runtime";
import { researchService } from "@/lib/research/runtime";
export default async function ResearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    returnChapterId?: string;
    noteCursor?: string;
    researchCursor?: string;
  }>;
}) {
  const { messages } = await getRequestI18n();
  const actor = await requireActor();
  const { id } = await params;
  const query = await searchParams;
  const loaded = await Promise.all([
    noteService().list(
      actor,
      id,
      { limit: 100, cursor: query.noteCursor },
      randomUUID(),
    ),
    researchService().list(
      actor,
      id,
      { limit: 100, cursor: query.researchCursor },
      randomUUID(),
    ),
  ]).catch(() => null);
  if (!loaded) notFound();
  const href = (key: "noteCursor" | "researchCursor", cursor?: string) => {
    const next = new URLSearchParams();
    for (const field of [
      "returnChapterId",
      "noteCursor",
      "researchCursor",
    ] as const)
      if (query[field]) next.set(field, query[field]);
    if (cursor) next.set(key, cursor);
    else next.delete(key);
    return `/app/projects/${id}/research${next.size ? `?${next}` : ""}`;
  };
  return (
    <AppShell>
      <div
        data-search-project-id={id}
        data-search-chapter-id={query.returnChapterId}
      >
        <ResearchWorkspace
          key={`${query.noteCursor ?? "first"}:${query.researchCursor ?? "first"}`}
          projectId={id}
          initialNotes={loaded[0].notes}
          initialItems={loaded[1].items}
          initialStructuralVersion={loaded[0].projectStructuralVersion}
          returnChapterId={query.returnChapterId}
        />
        {query.noteCursor || loaded[0].nextCursor ? (
          <nav aria-label={messages.noteResultPages}>
            {query.noteCursor ? (
              <a href={href("noteCursor")}>{messages.firstNotePage}</a>
            ) : null}
            {loaded[0].nextCursor ? (
              <a href={href("noteCursor", loaded[0].nextCursor)}>
                {messages.nextNotePage}
              </a>
            ) : null}
          </nav>
        ) : null}
        {query.researchCursor || loaded[1].nextCursor ? (
          <nav aria-label={messages.researchResultPages}>
            {query.researchCursor ? (
              <a href={href("researchCursor")}>{messages.firstResearchPage}</a>
            ) : null}
            {loaded[1].nextCursor ? (
              <a href={href("researchCursor", loaded[1].nextCursor)}>
                {messages.nextResearchPage}
              </a>
            ) : null}
          </nav>
        ) : null}
      </div>
    </AppShell>
  );
}
