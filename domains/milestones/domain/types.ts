import { createHash } from "node:crypto";
import { z } from "zod";
import { errors } from "@/lib/contracts/errors";

export const milestoneRoles = ["INTRODUCE", "DEVELOP", "ESCALATE", "TURN", "RESOLVE", "CUSTOM"] as const;
export const milestoneStatuses = ["PLANNED", "IN_PROGRESS", "COMPLETED", "ARCHIVED"] as const;
export const milestoneDependencyStates = ["ACTIVE", "TENTATIVE", "RETIRED"] as const;

export const milestoneWriteSchema = z.object({
  expectedStructuralVersion: z.number().int().positive(),
  milestoneId: z.string().uuid().optional(),
  sequenceIndex: z.number().int().nonnegative(),
  title: z.string().trim().min(1).max(240),
  description: z.string().max(20_000).optional(),
  threadLabel: z.string().trim().min(1).max(120).optional(),
  targetChapterStart: z.number().int().nonnegative().optional(),
  targetChapterEnd: z.number().int().nonnegative().optional(),
  targetWords: z.number().int().positive().max(100_000_000).optional(),
  targetDate: z.string().date().optional(),
  status: z.enum(milestoneStatuses).default("PLANNED"),
  isPlaceholder: z.boolean().default(false)
}).strict().superRefine((value, context) => {
  const hasStart = value.targetChapterStart !== undefined;
  const hasEnd = value.targetChapterEnd !== undefined;
  if (hasStart !== hasEnd || (hasStart && value.targetChapterEnd! < value.targetChapterStart!)) context.addIssue({ code: "custom", message: "Milestone target range must be complete and ordered." });
});

export const chapterMilestoneLinkSchema = z.object({
  expectedStructuralVersion: z.number().int().positive(),
  chapterId: z.string().uuid(),
  milestoneId: z.string().uuid(),
  role: z.enum(milestoneRoles),
  customRole: z.string().trim().min(1).max(80).optional(),
  weight: z.number().finite().min(0).max(1_000_000).default(1)
}).strict().superRefine((value, context) => {
  if (value.role === "CUSTOM" && !value.customRole) context.addIssue({ code: "custom", message: "Custom role requires a label." });
  if (value.role !== "CUSTOM" && value.customRole !== undefined) context.addIssue({ code: "custom", message: "Custom label is valid only for custom role." });
});

export const milestoneDependencySchema = z.object({
  expectedStructuralVersion: z.number().int().positive(),
  dependencyId: z.string().uuid().optional(),
  sourceMilestoneId: z.string().uuid(),
  targetMilestoneId: z.string().uuid(),
  state: z.enum(milestoneDependencyStates).default("ACTIVE"),
  isHard: z.boolean().default(false),
  note: z.string().max(4_000).optional()
}).strict().superRefine((value, context) => {
  if (value.sourceMilestoneId === value.targetMilestoneId) context.addIssue({ code: "custom", message: "A milestone cannot depend on itself." });
});

export const milestoneReorderPreviewSchema = z.object({
  currentIds: z.array(z.string().uuid()).min(1).max(500),
  movedId: z.string().uuid(),
  targetIndex: z.number().int().nonnegative()
}).strict().superRefine((value, context) => {
  if (new Set(value.currentIds).size !== value.currentIds.length || !value.currentIds.includes(value.movedId) || value.targetIndex >= value.currentIds.length) context.addIssue({ code: "custom", message: "Milestone reorder input must contain one complete unique order." });
});

export const milestoneReorderApplySchema = z.object({ expectedStructuralVersion: z.number().int().positive(), orderedIds: z.array(z.string().uuid()).min(1).max(500) }).strict().superRefine((value, context) => {
  if (new Set(value.orderedIds).size !== value.orderedIds.length) context.addIssue({ code: "custom", message: "Milestone order contains duplicate identities." });
});

export function planMilestoneReorder(raw: unknown) {
  const input = milestoneReorderPreviewSchema.parse(raw);
  const orderedIds = input.currentIds.filter((id) => id !== input.movedId);
  orderedIds.splice(input.targetIndex, 0, input.movedId);
  return { orderedIds, changes: orderedIds.flatMap((id, index) => input.currentIds[index] === id ? [] : [{ id, from: input.currentIds.indexOf(id), to: index }]) };
}

export interface MilestoneScaffoldAllocation {
  sequenceIndex: number;
  chapterStart: number;
  chapterEnd: number;
  targetWords: number | null;
  targetDate: string | null;
}

export const milestoneScaffoldInputSchema = z.object({
  expectedStructuralVersion: z.number().int().positive(),
  milestoneCount: z.number().int().min(1).max(500),
  chapterStart: z.number().int().min(1).max(100_000),
  chapterCount: z.number().int().min(1).max(10_000),
  advisoryProjectTargetWords: z.number().int().positive().max(1_000_000_000).optional(),
  cadenceStartDate: z.string().date().optional(),
  cadenceDays: z.number().int().min(1).max(3_650).optional()
}).strict().superRefine((value, context) => {
  if ((value.cadenceStartDate === undefined) !== (value.cadenceDays === undefined)) context.addIssue({ code: "custom", message: "Cadence requires both a start date and day interval." });
});

export type MilestoneScaffoldInput = z.infer<typeof milestoneScaffoldInputSchema>;

function allocationSize(total: number, count: number, index: number): number {
  return Math.floor(total / count) + (index < total % count ? 1 : 0);
}

export function planMilestoneScaffold(raw: unknown) {
  const input = milestoneScaffoldInputSchema.parse(raw);
  let cursor = input.chapterStart;
  const allocations: MilestoneScaffoldAllocation[] = [];
  for (let index = 0; index < input.milestoneCount; index += 1) {
    const size = allocationSize(input.chapterCount, input.milestoneCount, index);
    const chapterStart = cursor;
    const chapterEnd = Math.max(chapterStart, cursor + size - 1);
    cursor += size;
    const targetWords = input.advisoryProjectTargetWords === undefined ? null : allocationSize(input.advisoryProjectTargetWords, input.milestoneCount, index);
    const targetDate = input.cadenceStartDate && input.cadenceDays ? new Date(`${input.cadenceStartDate}T00:00:00.000Z`).valueOf() + index * input.cadenceDays * 86_400_000 : null;
    allocations.push({ sequenceIndex: index, chapterStart, chapterEnd, targetWords, targetDate: targetDate === null ? null : new Date(targetDate).toISOString().slice(0, 10) });
  }
  const canonical = JSON.stringify({ input, allocations });
  return { expectedStructuralVersion: input.expectedStructuralVersion, allocations, placeholderCount: allocations.length, planToken: createHash("sha256").update(canonical).digest("hex"), warnings: input.milestoneCount > input.chapterCount ? ["Some advisory ranges overlap because milestone count exceeds chapter count."] : [] };
}

export type MilestoneScaffoldPlan = ReturnType<typeof planMilestoneScaffold>;

export function verifyMilestoneScaffold(input: MilestoneScaffoldInput, token: string) {
  const plan = planMilestoneScaffold(input);
  if (plan.planToken !== token) throw errors.conflict("The milestone allocation preview is stale or was modified.");
  return plan;
}

export interface WeightedChapterProgress { weight: number; ratio: number }

export function weightedMilestoneProgress(items: readonly WeightedChapterProgress[]): number {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) return 0;
  return items.reduce((sum, item) => sum + item.weight * Math.min(1, Math.max(0, item.ratio)), 0) / totalWeight;
}
