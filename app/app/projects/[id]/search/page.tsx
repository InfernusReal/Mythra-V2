import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { AppShell } from "@/components/shell/AppShell";
import { SearchWorkspace } from "@/components/search/SearchWorkspace";
import { requireActor } from "@/lib/auth/runtime";
import { continuationService } from "@/lib/writing/runtime";

export default async function SearchPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ returnChapterId?: string }> }) {
  const actor = await requireActor(); const { id } = await params; const query = await searchParams;
  if (!await continuationService().get(actor, id, randomUUID())) notFound();
  return <AppShell><SearchWorkspace projectId={id} returnChapterId={query.returnChapterId} /></AppShell>;
}
