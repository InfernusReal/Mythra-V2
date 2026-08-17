import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { EntityDetail } from "@/components/universe/EntityDetail";
import { requireActor } from "@/lib/auth/runtime";
import { universeService } from "@/lib/universe/runtime";

export default async function EntityPage({ params, searchParams }: { params: Promise<{ id: string; entityId: string }>; searchParams: Promise<{ returnChapterId?: string }> }) { const actor = await requireActor(); const { id, entityId } = await params; const query = await searchParams; const [model, catalog] = await Promise.all([universeService().detail(actor, id, entityId, randomUUID()), universeService().catalog(actor, id, randomUUID())]).catch(() => [null, null] as const); if (!model || !catalog) notFound(); return <AppShell><EntityDetail projectId={id} initialDetail={model.detail} catalog={catalog} initialStructuralVersion={model.projectStructuralVersion} returnChapterId={query.returnChapterId} /></AppShell>; }
