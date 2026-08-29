import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { ResearchWorkspace } from "@/components/research/ResearchWorkspace";
import { requireActor } from "@/lib/auth/runtime";
import { noteService } from "@/lib/notes/runtime";
import { researchService } from "@/lib/research/runtime";
export default async function ResearchPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ returnChapterId?: string }> }) { const actor = await requireActor(); const { id } = await params; const query = await searchParams; const loaded = await Promise.all([noteService().list(actor, id, { limit: 100 }, randomUUID()), researchService().list(actor, id, { limit: 100 }, randomUUID())]).catch(() => null); if (!loaded) notFound(); return <AppShell><div data-search-project-id={id} data-search-chapter-id={query.returnChapterId}><ResearchWorkspace projectId={id} initialNotes={loaded[0].notes} initialItems={loaded[1].items} initialStructuralVersion={loaded[0].projectStructuralVersion} returnChapterId={query.returnChapterId} /></div></AppShell>; }
