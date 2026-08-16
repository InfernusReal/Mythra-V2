import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { AppShell } from "@/components/shell/AppShell";
import { CaptureInbox } from "@/components/capture/CaptureInbox";
import { requireActor } from "@/lib/auth/runtime";
import { captureService } from "@/lib/capture/runtime";

export default async function CaptureInboxPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ returnChapterId?: string }> }) { const actor = await requireActor(); const { id } = await params; const query = await searchParams; const model = await captureService().list(actor, id, { limit: 50, dueOnly: false }, randomUUID()).catch(() => null); if (!model) notFound(); return <AppShell><CaptureInbox projectId={id} initialCaptures={model.captures} initialStructuralVersion={model.projectStructuralVersion} returnChapterId={query.returnChapterId} /></AppShell>; }
