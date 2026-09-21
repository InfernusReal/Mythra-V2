import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { TimelineWorkspace } from "@/components/timeline/TimelineWorkspace";
import { requireActor } from "@/lib/auth/runtime";
import { timelineService } from "@/lib/timeline/runtime";
export default async function TimelinePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ returnChapterId?: string }> }) { const actor = await requireActor(); const { id } = await params; const query = await searchParams; const model = await timelineService().list(actor, id, { limit: 100 }, randomUUID()).catch(() => null); if (!model) notFound(); return <AppShell><div style={{ width: "100%", minWidth: 0 }} data-search-project-id={id} data-search-chapter-id={query.returnChapterId}><TimelineWorkspace projectId={id} initialEvents={model.events} initialStructuralVersion={model.projectStructuralVersion} returnChapterId={query.returnChapterId} /></div></AppShell>; }
