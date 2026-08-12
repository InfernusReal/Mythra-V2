import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { AppShell } from "@/components/shell/AppShell";
import { StructureWorkspace } from "@/components/structure/StructureWorkspace";
import { requireActor } from "@/lib/auth/runtime";
import { logger } from "@/lib/observability/logger";
import { structureService } from "@/lib/structure/runtime";

export default async function StructurePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ rangeStart?: string; pageSize?: string; nodeBudget?: string; edgeBudget?: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const range = await searchParams;
  const model = await structureService().getOverview(actor, id, range, randomUUID());
  if (!model) notFound();
  // Console trace S4-UI-014: authenticated Structure workspace rendered from the bounded server read model.
  logger.info("structure.workspace_rendered", { step: "S4-UI-014", workspaceId: actor.workspaceId, projectId: id, structuralVersion: model.project.structuralVersion, rangeStart: model.page.rangeStart, returnedNodes: model.page.returnedNodes, returnedEdges: model.page.returnedEdges });
  return <AppShell><StructureWorkspace initialModel={model} /></AppShell>;
}
