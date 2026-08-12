import { z } from "zod";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { storyReferenceInputSchema } from "@/domains/references/domain/story-reference";
import type { Logger } from "@/lib/observability/logger";
import { previewReorder } from "../domain/invariants";
import { planStructureScaffold, scaffoldInputSchema, verifyScaffoldPlan } from "../domain/scaffold";
import { clampStructureBudget, narrativeIntentInputSchema, structureViewStateInputSchema } from "../domain/types";
import type { ChapterOutlineInput, StructureRepository, StructureViewStateModel } from "./ports";

const versioned = { expectedStructuralVersion: z.number().int().positive() } as const;
const plotInput = z.object({ ...versioned, title: z.string().trim().min(1).max(240), summary: z.string().trim().max(20_000).optional() }).strict();
const updatePlotInput = plotInput.extend({ plotId: z.string().uuid() }).strict();
const plotOutlineInput = z.object({ ...versioned, plotId: z.string().uuid(), title: z.string().trim().min(1).max(240), document: z.object({ type: z.literal("doc"), content: z.array(z.unknown()) }).passthrough(), plainText: z.string().max(200_000), purpose: z.string().trim().max(4_000).optional() }).strict();
const volumeInput = z.object({ ...versioned, plotId: z.string().uuid(), sequenceIndex: z.number().int().nonnegative(), displayNumber: z.string().trim().min(1).max(32).optional(), title: z.string().trim().min(1).max(240), summary: z.string().trim().max(20_000).optional(), targetWords: z.number().int().positive().max(100_000_000).optional(), hardTargetWordsEnabled: z.boolean().default(false) }).strict().superRefine((value, context) => { if (value.hardTargetWordsEnabled && value.targetWords === undefined) context.addIssue({ code: "custom", message: "Hard target requires target words." }); });
const updateVolumeInput = z.object({ ...versioned, volumeId: z.string().uuid(), displayNumber: z.string().trim().min(1).max(32).optional(), title: z.string().trim().min(1).max(240), summary: z.string().trim().max(20_000).optional(), targetWords: z.number().int().positive().max(100_000_000).optional(), hardTargetWordsEnabled: z.boolean().default(false) }).strict().superRefine((value, context) => { if (value.hardTargetWordsEnabled && value.targetWords === undefined) context.addIssue({ code: "custom", message: "Hard target requires target words." }); });
const volumeOutlineInput = plotOutlineInput.omit({ plotId: true }).extend({ volumeId: z.string().uuid() }).strict();
const chapterOutlineInput = z.object({
  ...versioned,
  outlineId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
  volumeId: z.string().uuid().optional(),
  sequenceIndex: z.number().int().nonnegative(),
  title: z.string().trim().min(1).max(240),
  document: z.object({ type: z.literal("doc"), content: z.array(z.unknown()) }).passthrough(),
  plainText: z.string().max(200_000).default(""),
  purpose: z.string().trim().max(4_000).optional(),
  emotionalMovement: z.string().trim().max(4_000).optional(),
  revealedInformation: z.array(z.string().trim().min(1).max(1_000)).max(500).default([]),
  entityReferenceKeys: z.array(z.string().uuid()).max(500).default([]),
  locationReferenceKeys: z.array(z.string().uuid()).max(500).default([]),
  milestoneReferenceKeys: z.array(z.string().uuid()).max(500).default([]),
  targetWords: z.number().int().positive().max(10_000_000).optional(),
  hardTargetWordsEnabled: z.boolean().default(false),
  sceneStubs: z.array(z.object({ id: z.string().uuid(), title: z.string().trim().min(1).max(240) }).strict()).max(1_000).default([]),
  isPlaceholder: z.boolean().default(false)
}).strict().superRefine((value, context) => { if (value.hardTargetWordsEnabled && value.targetWords === undefined) context.addIssue({ code: "custom", message: "Hard target requires target words." }); });
const sceneInput = z.object({ ...versioned, chapterOutlineId: z.string().uuid(), blockId: z.string().trim().min(1).max(128), sequenceIndex: z.number().int().nonnegative(), title: z.string().trim().min(1).max(240), outlineDocument: z.object({ type: z.literal("doc"), content: z.array(z.unknown()) }).passthrough(), outlineText: z.string().max(200_000), purpose: z.string().trim().max(4_000).optional(), targetWords: z.number().int().positive().max(10_000_000).optional(), hardTargetWordsEnabled: z.boolean().default(false) }).strict().superRefine((value, context) => { if (value.hardTargetWordsEnabled && value.targetWords === undefined) context.addIssue({ code: "custom", message: "Hard target requires target words." }); });
const assignChapterInput = z.object({ ...versioned, chapterId: z.string().uuid(), volumeId: z.string().uuid().nullable(), volumeSequenceIndex: z.number().int().nonnegative().nullable() }).strict().superRefine((value, context) => { if ((value.volumeId === null) !== (value.volumeSequenceIndex === null)) context.addIssue({ code: "custom", message: "Volume and volume order must be set or cleared together." }); });
const reparentOutlineInput = z.object({ ...versioned, chapterOutlineId: z.string().uuid(), volumeId: z.string().uuid().nullable(), sequenceIndex: z.number().int().nonnegative() }).strict();
const reorderInput = z.object({ ...versioned, orderedIds: z.array(z.string().uuid()).min(1).max(1_000) }).strict();

export class StructureService {
  constructor(private readonly repository: StructureRepository, private readonly logger: Logger) {}

  async getOverview(actor: SessionActor, projectId: string, rawBudget: unknown, requestId: string) {
    const budget = clampStructureBudget(z.object({ pageSize: z.coerce.number().optional(), nodeBudget: z.coerce.number().optional(), edgeBudget: z.coerce.number().optional(), rangeStart: z.coerce.number().optional() }).parse(rawBudget));
    const result = await this.repository.getOverview(actor, projectId, budget);
    // Console trace S4-STRUCTURE-001: bounded Structure overview resolved without logging author-entered fields.
    this.logger.info("structure.overview_resolved", { step: "S4-STRUCTURE-001", requestId, workspaceId: actor.workspaceId, projectId, found: Boolean(result), returnedNodes: result?.page.returnedNodes ?? 0, returnedEdges: result?.page.returnedEdges ?? 0 });
    return result;
  }

  async createPlot(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const result = await this.repository.createPlot(actor, projectId, plotInput.parse(raw));
    // Console trace S4-STRUCTURE-002: explicit plot creation committed with structural version only.
    this.logger.info("structure.plot_created", { step: "S4-STRUCTURE-002", requestId, workspaceId: actor.workspaceId, projectId, plotId: result.object.id, structuralVersion: result.projectStructuralVersion });
    return result;
  }

  async updatePlot(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const result = await this.repository.updatePlot(actor, projectId, updatePlotInput.parse(raw));
    // Console trace S4-STRUCTURE-009: inline plot edit committed with revision and content-free telemetry.
    this.logger.info("structure.plot_updated", { step: "S4-STRUCTURE-009", requestId, workspaceId: actor.workspaceId, projectId, plotId: result.object.id, objectVersion: result.object.version, structuralVersion: result.projectStructuralVersion });
    return result;
  }

  async upsertPlotOutline(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const result = await this.repository.upsertPlotOutline(actor, projectId, plotOutlineInput.parse(raw));
    // Console trace S4-STRUCTURE-003: plot-outline write committed; outline payload is excluded.
    this.logger.info("structure.plot_outline_written", { step: "S4-STRUCTURE-003", requestId, workspaceId: actor.workspaceId, projectId, outlineId: result.object.id, objectVersion: result.object.version, structuralVersion: result.projectStructuralVersion });
    return result;
  }

  async createVolume(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const result = await this.repository.createVolume(actor, projectId, volumeInput.parse(raw));
    // Console trace S4-STRUCTURE-004: ordered volume creation committed without title or summary telemetry.
    this.logger.info("structure.volume_created", { step: "S4-STRUCTURE-004", requestId, workspaceId: actor.workspaceId, projectId, volumeId: result.object.id, sequenceIndex: result.object.sequenceIndex, structuralVersion: result.projectStructuralVersion });
    return result;
  }

  async updateVolume(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const result = await this.repository.updateVolume(actor, projectId, updateVolumeInput.parse(raw));
    // Console trace S4-STRUCTURE-010: inline volume edit committed with revision and no author text in telemetry.
    this.logger.info("structure.volume_updated", { step: "S4-STRUCTURE-010", requestId, workspaceId: actor.workspaceId, projectId, volumeId: result.object.id, objectVersion: result.object.version, structuralVersion: result.projectStructuralVersion });
    return result;
  }

  async upsertVolumeOutline(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const result = await this.repository.upsertVolumeOutline(actor, projectId, volumeOutlineInput.parse(raw));
    // Console trace S4-STRUCTURE-005: volume-outline write committed; outline payload is excluded.
    this.logger.info("structure.volume_outline_written", { step: "S4-STRUCTURE-005", requestId, workspaceId: actor.workspaceId, projectId, outlineId: result.object.id, objectVersion: result.object.version, structuralVersion: result.projectStructuralVersion });
    return result;
  }

  async upsertChapterOutline(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const input = chapterOutlineInput.parse(raw) as ChapterOutlineInput;
    const result = await this.repository.upsertChapterOutline(actor, projectId, input);
    // Console trace S4-STRUCTURE-006: optional chapter-outline write committed without creative metadata.
    this.logger.info("structure.chapter_outline_written", { step: "S4-STRUCTURE-006", requestId, workspaceId: actor.workspaceId, projectId, outlineId: result.object.id, placeholder: result.object.isPlaceholder, structuralVersion: result.projectStructuralVersion });
    return result;
  }

  async previewScaffold(actor: SessionActor, raw: unknown, requestId: string, projectId: string) {
    await this.repository.assertProjectAccess(actor, projectId);
    const plan = planStructureScaffold(scaffoldInputSchema.parse(raw));
    // Console trace S4-SCAFFOLD-001: deterministic scaffold preview produced from counts only.
    this.logger.info("structure.scaffold_previewed", { step: "S4-SCAFFOLD-001", requestId, projectId, volumeCount: plan.allocations.length, placeholderCount: plan.placeholderCount, warningCount: plan.warnings.length });
    return plan;
  }

  async applyScaffold(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const parsed = z.object({ input: scaffoldInputSchema, planToken: z.string().regex(/^[a-f0-9]{64}$/) }).strict().parse(raw);
    const plan = verifyScaffoldPlan(parsed.input, parsed.planToken);
    const result = await this.repository.applyScaffold(actor, projectId, parsed.input, plan);
    // Console trace S4-SCAFFOLD-002: reviewed scaffold applied atomically with aggregate counts only.
    this.logger.info("structure.scaffold_applied", { step: "S4-SCAFFOLD-002", requestId, workspaceId: actor.workspaceId, projectId, volumeCount: result.object.volumeIds.length, placeholderCount: result.object.placeholderCount, assignedChapterCount: result.object.assignedChapterCount, structuralVersion: result.projectStructuralVersion });
    return result;
  }

  async previewVolumeReorder(actor: SessionActor, raw: unknown, requestId: string, projectId: string) {
    await this.repository.assertProjectAccess(actor, projectId);
    const parsed = z.object({ currentIds: z.array(z.string().uuid()).min(1).max(1_000), movedId: z.string().uuid(), targetIndex: z.number().int().nonnegative() }).strict().parse(raw);
    const preview = previewReorder(parsed.currentIds, parsed.movedId, parsed.targetIndex);
    // Console trace S4-ORDER-001: reorder preview produced with identity-preservation fact only.
    this.logger.info("structure.reorder_previewed", { step: "S4-ORDER-001", requestId, projectId, objectCount: preview.orderedIds.length, changedCount: preview.renumbered.length, referencesPreserved: preview.referenceIdsPreserved });
    return preview;
  }

  async applyVolumeReorder(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const result = await this.repository.reorderVolumes(actor, projectId, reorderInput.parse(raw));
    // Console trace S4-ORDER-002: transactional reorder committed with stable object identities.
    this.logger.info("structure.reorder_applied", { step: "S4-ORDER-002", requestId, workspaceId: actor.workspaceId, projectId, objectCount: result.object.orderedIds.length, structuralVersion: result.projectStructuralVersion });
    return result;
  }

  async assignChapterToVolume(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const result = await this.repository.assignChapterToVolume(actor, projectId, assignChapterInput.parse(raw));
    // Console trace S4-STRUCTURE-007: prose-first chapter membership changed without reading or mutating prose.
    this.logger.info("structure.chapter_membership_changed", { step: "S4-STRUCTURE-007", requestId, workspaceId: actor.workspaceId, projectId, chapterId: result.object.chapterId, assigned: result.object.volumeId !== null, structuralVersion: result.projectStructuralVersion });
    return result;
  }

  async reparentChapterOutline(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const result = await this.repository.reparentChapterOutline(actor, projectId, reparentOutlineInput.parse(raw));
    // Console trace S4-STRUCTURE-008: promote/demote reparent preserved the outline identity and references.
    this.logger.info("structure.chapter_outline_reparented", { step: "S4-STRUCTURE-008", requestId, workspaceId: actor.workspaceId, projectId, outlineId: result.object.id, assigned: result.object.volumeId !== null, structuralVersion: result.projectStructuralVersion });
    return result;
  }

  async createSceneFromOutlineBlock(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const result = await this.repository.createSceneFromOutlineBlock(actor, projectId, sceneInput.parse(raw));
    // Console trace S4-SCENE-001: outline block converted to an optional scene with provenance; creative payload is excluded.
    this.logger.info("structure.scene_converted", { step: "S4-SCENE-001", requestId, workspaceId: actor.workspaceId, projectId, sceneId: result.object.id, sourceOutlineId: result.object.chapterOutlineId, structuralVersion: result.projectStructuralVersion });
    return result;
  }

  async createNarrativeIntent(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const result = await this.repository.createNarrativeIntent(actor, projectId, narrativeIntentInputSchema.parse(raw));
    // Console trace S4-INTENT-001: Narrative Intent attached to an active S4 target without logging intent text.
    this.logger.info("structure.intent_created", { step: "S4-INTENT-001", requestId, workspaceId: actor.workspaceId, projectId, intentId: result.object.id, targetType: result.object.targetType, structuralVersion: result.projectStructuralVersion });
    return result;
  }

  async createStoryReference(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const result = await this.repository.createStoryReference(actor, projectId, storyReferenceInputSchema.parse(raw));
    // Console trace S4-REFERENCE-001: generalized non-causal reference committed with endpoint types and IDs only.
    this.logger.info("structure.reference_created", { step: "S4-REFERENCE-001", requestId, workspaceId: actor.workspaceId, projectId, referenceId: result.object.id, sourceType: result.object.sourceType, targetType: result.object.targetType, structuralVersion: result.projectStructuralVersion });
    return result;
  }

  async saveViewState(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const state = structureViewStateInputSchema.parse(raw) as StructureViewStateModel;
    const result = await this.repository.saveViewState(actor, projectId, state);
    // Console trace S4-VIEW-001: presentation and position preferences persisted separately from story truth.
    this.logger.info("structure.view_state_saved", { step: "S4-VIEW-001", requestId, workspaceId: actor.workspaceId, projectId, mode: result.mode, activeLens: result.activeLens, expandedCount: result.expandedIds.length, pinCount: result.pinIds.length });
    return result;
  }
}
