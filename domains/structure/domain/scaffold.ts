import { createHash } from "node:crypto";
import { z } from "zod";

export const scaffoldInputSchema = z.object({
  expectedStructuralVersion: z.number().int().positive(),
  volumeCount: z.number().int().min(1).max(100),
  chapterStart: z.number().int().min(1).max(100_000),
  chapterCount: z.number().int().min(1).max(10_000),
  createChapterOutlinePlaceholders: z.boolean().default(true),
  advisoryProjectTargetWords: z.number().int().positive().max(100_000_000).optional()
}).strict();

export type ScaffoldInput = z.infer<typeof scaffoldInputSchema>;

export interface VolumeAllocation {
  sequenceIndex: number;
  chapterStart: number;
  chapterEnd: number;
  chapterCount: number;
  advisoryTargetWords: number | null;
}

export interface StructureScaffoldPlan {
  planToken: string;
  expectedStructuralVersion: number;
  allocations: VolumeAllocation[];
  placeholderCount: number;
  warnings: string[];
}

function balancedCounts(total: number, buckets: number): number[] {
  const minimum = Math.floor(total / buckets);
  const remainder = total % buckets;
  return Array.from({ length: buckets }, (_, index) => minimum + (index < remainder ? 1 : 0));
}

export function planStructureScaffold(raw: ScaffoldInput): StructureScaffoldPlan {
  const input = scaffoldInputSchema.parse(raw);
  const counts = balancedCounts(input.chapterCount, input.volumeCount);
  const wordCounts = input.advisoryProjectTargetWords ? balancedCounts(input.advisoryProjectTargetWords, input.volumeCount) : null;
  let chapterCursor = input.chapterStart;
  const allocations = counts.map((chapterCount, sequenceIndex) => {
    const chapterStart = chapterCursor;
    const chapterEnd = chapterCount === 0 ? chapterStart - 1 : chapterStart + chapterCount - 1;
    chapterCursor = chapterEnd + 1;
    return { sequenceIndex, chapterStart, chapterEnd, chapterCount, advisoryTargetWords: wordCounts?.[sequenceIndex] ?? null };
  });
  const unsigned = {
    expectedStructuralVersion: input.expectedStructuralVersion,
    allocations,
    placeholderCount: input.createChapterOutlinePlaceholders ? input.chapterCount : 0
  };
  return {
    planToken: createHash("sha256").update(JSON.stringify(unsigned)).digest("hex"),
    ...unsigned,
    warnings: input.volumeCount > input.chapterCount ? ["Some volumes have no allocated chapter range; this is advisory and may be applied."] : []
  };
}

export function verifyScaffoldPlan(input: ScaffoldInput, planToken: string): StructureScaffoldPlan {
  const plan = planStructureScaffold(input);
  if (plan.planToken !== planToken) throw new Error("STALE_OR_TAMPERED_SCAFFOLD_PLAN");
  return plan;
}

