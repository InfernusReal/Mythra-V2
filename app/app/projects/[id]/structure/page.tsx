import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { AppShell } from "@/components/shell/AppShell";
import { StructureWorkspace } from "@/components/structure/StructureWorkspace";
import { requireActor } from "@/lib/auth/runtime";
import { logger } from "@/lib/observability/logger";
import { milestoneService } from "@/lib/milestones/runtime";
import { causalityService } from "@/lib/causality/runtime";
import { structureService } from "@/lib/structure/runtime";

export default async function StructurePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ rangeStart?: string; pageSize?: string; nodeBudget?: string; edgeBudget?: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const range = await searchParams;
  const [model, milestones, causality] = await Promise.all([
    structureService().getOverview(actor, id, range, randomUUID()),
    milestoneService().getOverview(actor, id, { nodeBudget: range.nodeBudget, edgeBudget: range.edgeBudget }, randomUUID()),
    causalityService().getOverview(actor, id, { nodeBudget: range.nodeBudget, edgeBudget: range.edgeBudget }, randomUUID())
  ]);
  if (!model || !milestones || !causality) notFound();
  // Console trace S4-UI-014: authenticated Structure workspace rendered from the bounded server read model.
  logger.info("structure.workspace_rendered", { step: "S4-UI-014", workspaceId: actor.workspaceId, projectId: id, structuralVersion: model.project.structuralVersion, rangeStart: model.page.rangeStart, returnedNodes: model.page.returnedNodes, returnedEdges: model.page.returnedEdges });
  // Console trace S5-UI-008: Milestones lens server projection joined to Structure without creative content.
  logger.info("milestone.workspace_projection_joined", { step: "S5-UI-008", workspaceId: actor.workspaceId, projectId: id, milestoneCount: milestones.milestones.length, returnedEdges: milestones.page.returnedEdges });
  // Console trace S6-UI-005: bounded causal projection joined to Structure with aggregate counts only.
  logger.info("causality.workspace_projection_joined", { step: "S6-UI-005", workspaceId: actor.workspaceId, projectId: id, storyChangeCount: causality.storyChanges.length, returnedEdges: causality.page.returnedEdges });
  return <AppShell><StructureWorkspace initialModel={model} initialMilestones={milestones} initialCausality={causality} /></AppShell>;
}
