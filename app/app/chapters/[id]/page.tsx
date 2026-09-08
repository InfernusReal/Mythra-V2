import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { ChapterEditor } from "@/components/editor/ChapterEditor";
import { requireActor } from "@/lib/auth/runtime";
import { continuationService, writingService } from "@/lib/writing/runtime";
import { randomUUID } from "node:crypto";
import { getRequestI18n } from "@/lib/i18n/request";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireActor();
  const { id } = await params;
  const { messages } = await getRequestI18n();
  const model = await writingService().getEditor(actor, id, randomUUID());
  if (!model) notFound();
  const continuation = await continuationService().get(
    actor,
    model.project.id,
    randomUUID(),
  );
  if (!continuation) notFound();
  return (
    <AppShell saveStatus={messages.savedLocally}>
      <ChapterEditor model={model} initialSession={continuation.session} />
    </AppShell>
  );
}
