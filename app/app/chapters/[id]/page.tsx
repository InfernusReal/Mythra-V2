import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { ChapterEditor } from "@/components/editor/ChapterEditor";
import { requireActor } from "@/lib/auth/runtime";
import { writingService } from "@/lib/writing/runtime";
import { randomUUID } from "node:crypto";

export default async function ChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor(); const { id } = await params;
  const model = await writingService().getEditor(actor, id, randomUUID());
  if (!model) notFound();
  return <AppShell saveStatus="Local draft"><ChapterEditor model={model} /></AppShell>;
}
