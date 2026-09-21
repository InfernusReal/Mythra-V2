import { getRequestI18n } from "@/lib/i18n/request";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { AppShell } from "@/components/shell/AppShell";
import { CaptureInbox } from "@/components/capture/CaptureInbox";
import { requireActor } from "@/lib/auth/runtime";
import { captureService } from "@/lib/capture/runtime";

export default async function CaptureInboxPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnChapterId?: string; cursor?: string }>;
}) {
  const { messages } = await getRequestI18n();
  const actor = await requireActor();
  const { id } = await params;
  const query = await searchParams;
  const model = await captureService()
    .list(
      actor,
      id,
      { limit: 50, dueOnly: false, cursor: query.cursor },
      randomUUID(),
    )
    .catch(() => null);
  if (!model) notFound();
  const href = (cursor?: string) => {
    const next = new URLSearchParams();
    if (query.returnChapterId)
      next.set("returnChapterId", query.returnChapterId);
    if (cursor) next.set("cursor", cursor);
    return `/app/projects/${id}/captures${next.size ? `?${next}` : ""}`;
  };
  return (
    <AppShell>
      <CaptureInbox
        key={query.cursor ?? "first"}
        projectId={id}
        initialCaptures={model.captures}
        initialStructuralVersion={model.projectStructuralVersion}
        returnChapterId={query.returnChapterId}
      />
      {query.cursor || model.nextCursor ? (
        <nav aria-label={messages.captureResultPages}>
          {query.cursor ? (
            <a href={href()}>{messages.firstCapturePage}</a>
          ) : null}
          {model.nextCursor ? (
            <a href={href(model.nextCursor)}>{messages.nextCapturePage}</a>
          ) : null}
        </nav>
      ) : null}
    </AppShell>
  );
}
