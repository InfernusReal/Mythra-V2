import { z } from "zod";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { Logger } from "@/lib/observability/logger";
import { chapterMilestoneLinkSchema, milestoneDependencySchema, milestoneReorderApplySchema, milestoneScaffoldInputSchema, milestoneWriteSchema, planMilestoneReorder, planMilestoneScaffold, verifyMilestoneScaffold } from "../domain/types";
import type { MilestoneRepository } from "./ports";

export class MilestoneService {
  constructor(private readonly repository: MilestoneRepository, private readonly logger: Logger) {}

  async getOverview(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const parsed = z.object({ nodeBudget: z.coerce.number().int().optional(), edgeBudget: z.coerce.number().int().optional() }).parse(raw);
    const budget = { nodeBudget: Math.min(500, Math.max(1, parsed.nodeBudget ?? 200)), edgeBudget: Math.min(750, Math.max(0, parsed.edgeBudget ?? 300)) };
    const result = await this.repository.getOverview(actor, projectId, budget);
    // Console trace S5-MILESTONE-001: bounded milestone projection resolved with aggregate counts only.
    this.logger.info("milestone.overview_resolved", { step: "S5-MILESTONE-001", requestId, workspaceId: actor.workspaceId, projectId, found: Boolean(result), milestoneCount: result?.milestones.length ?? 0, edgeCount: result?.page.returnedEdges ?? 0 });
    return result;
  }

  async writeMilestone(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const input = milestoneWriteSchema.parse(raw);
    const result = input.milestoneId ? await this.repository.updateMilestone(actor, projectId, { ...input, milestoneId: input.milestoneId }) : await this.repository.createMilestone(actor, projectId, input);
    // Console trace S5-MILESTONE-002: milestone write committed without title, description, thread label or dates.
    this.logger.info("milestone.written", { step: "S5-MILESTONE-002", requestId, workspaceId: actor.workspaceId, projectId, milestoneId: result.object.id, sequenceIndex: result.object.sequenceIndex, status: result.object.status, structuralVersion: result.projectStructuralVersion });
    return result;
  }

  async linkChapter(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const result = await this.repository.linkChapter(actor, projectId, chapterMilestoneLinkSchema.parse(raw));
    // Console trace S5-LINK-001: many-to-many chapter link committed with role, weight and identities only.
    this.logger.info("milestone.chapter_linked", { step: "S5-LINK-001", requestId, workspaceId: actor.workspaceId, projectId, linkId: result.object.id, chapterId: result.object.chapterId, milestoneId: result.object.milestoneId, role: result.object.role, weight: result.object.weight, structuralVersion: result.projectStructuralVersion });
    return result;
  }

  async writeDependency(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const result = await this.repository.writeDependency(actor, projectId, milestoneDependencySchema.parse(raw));
    // Console trace S5-DEPENDENCY-001: milestone dependency committed without the optional note.
    this.logger.info("milestone.dependency_written", { step: "S5-DEPENDENCY-001", requestId, workspaceId: actor.workspaceId, projectId, dependencyId: result.object.id, sourceMilestoneId: result.object.sourceMilestoneId, targetMilestoneId: result.object.targetMilestoneId, state: result.object.state, hard: result.object.isHard, structuralVersion: result.projectStructuralVersion });
    return result;
  }

  async previewReorder(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    await this.repository.assertProjectAccess(actor, projectId);
    const plan = planMilestoneReorder(raw);
    // Console trace S5-REORDER-001: milestone reorder preview produced from stable identities and positions only.
    this.logger.info("milestone.reorder_previewed", { step: "S5-REORDER-001", requestId, workspaceId: actor.workspaceId, projectId, objectCount: plan.orderedIds.length, changedCount: plan.changes.length });
    return plan;
  }

  async applyReorder(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const result = await this.repository.reorderMilestones(actor, projectId, milestoneReorderApplySchema.parse(raw));
    // Console trace S5-REORDER-002: reviewed milestone order committed with aggregate count only.
    this.logger.info("milestone.reorder_applied", { step: "S5-REORDER-002", requestId, workspaceId: actor.workspaceId, projectId, objectCount: result.object.orderedIds.length, structuralVersion: result.projectStructuralVersion });
    return result;
  }

  async previewScaffold(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    await this.repository.assertProjectAccess(actor, projectId);
    const plan = planMilestoneScaffold(raw);
    // Console trace S5-SCAFFOLD-001: milestone allocation preview produced from counts and cadence presence only.
    this.logger.info("milestone.scaffold_previewed", { step: "S5-SCAFFOLD-001", requestId, workspaceId: actor.workspaceId, projectId, milestoneCount: plan.allocations.length, warningCount: plan.warnings.length });
    return plan;
  }

  async applyScaffold(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const parsed = z.object({ input: milestoneScaffoldInputSchema, planToken: z.string().regex(/^[a-f0-9]{64}$/) }).strict().parse(raw);
    const plan = verifyMilestoneScaffold(parsed.input, parsed.planToken);
    const result = await this.repository.applyScaffold(actor, projectId, parsed.input, plan);
    // Console trace S5-SCAFFOLD-002: reviewed milestone scaffold committed with aggregate counts only.
    this.logger.info("milestone.scaffold_applied", { step: "S5-SCAFFOLD-002", requestId, workspaceId: actor.workspaceId, projectId, milestoneCount: result.object.milestoneIds.length, placeholderCount: result.object.placeholderCount, structuralVersion: result.projectStructuralVersion });
    return result;
  }
}
