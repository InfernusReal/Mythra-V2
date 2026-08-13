import { z } from "zod";

export const activeStoryReferenceEndpointTypes = [
  "PLOT",
  "PLOT_OUTLINE",
  "VOLUME",
  "VOLUME_OUTLINE",
  "MILESTONE",
  "CHAPTER_OUTLINE",
  "CHAPTER",
  "SCENE",
  "NARRATIVE_INTENT",
  "MANUSCRIPT_BLOCK"
] as const;

export const reservedStoryReferenceEndpointTypes = ["ENTITY", "TIMELINE_EVENT", "NOTE", "CAPTURE"] as const;
export const storyReferenceEndpointTypes = [...activeStoryReferenceEndpointTypes, ...reservedStoryReferenceEndpointTypes] as const;

export const storyReferenceInputSchema = z.object({
  expectedStructuralVersion: z.number().int().positive(),
  sourceType: z.enum(storyReferenceEndpointTypes),
  sourceId: z.string().uuid(),
  sourceBlockId: z.string().trim().min(1).max(128).optional(),
  targetType: z.enum(storyReferenceEndpointTypes),
  targetId: z.string().uuid(),
  targetBlockId: z.string().trim().min(1).max(128).optional(),
  relationshipKey: z.string().trim().min(1).max(80).default("references"),
  provenanceType: z.enum(["DIRECT", "CHAPTER_PROSE", "OUTLINE_BLOCK"]).default("DIRECT"),
  provenanceNote: z.string().max(4_000).optional()
}).strict().superRefine((value, context) => {
  const same = value.sourceType === value.targetType && value.sourceId === value.targetId && value.sourceBlockId === value.targetBlockId;
  if (same) context.addIssue({ code: "custom", message: "A reference cannot target itself." });
  if ((reservedStoryReferenceEndpointTypes as readonly string[]).includes(value.sourceType) || (reservedStoryReferenceEndpointTypes as readonly string[]).includes(value.targetType)) {
    context.addIssue({ code: "custom", message: "The reference endpoint is reserved until its canonical source domain is available." });
  }
});

export type StoryReferenceInput = z.infer<typeof storyReferenceInputSchema>;
