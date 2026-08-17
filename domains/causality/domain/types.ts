import { z } from "zod";

export const storyChangeKinds = ["EVENT", "DECISION", "REVELATION", "STATE_CHANGE", "SETUP", "PAYOFF", "CONDITION", "OUTCOME", "CUSTOM"] as const;
export const causalEndpointTypes = ["MILESTONE", "CHAPTER_OUTLINE", "SCENE", "TIMELINE_EVENT", "NARRATIVE_INTENT", "ENTITY_STATE", "CAPTURE_DERIVED", "MANUSCRIPT_BLOCK", "STORY_CHANGE"] as const;
export const activeCausalEndpointTypes = ["MILESTONE", "CHAPTER_OUTLINE", "SCENE", "NARRATIVE_INTENT", "MANUSCRIPT_BLOCK", "STORY_CHANGE", "CAPTURE_DERIVED", "ENTITY_STATE"] as const;
export const reservedCausalEndpointTypes = ["TIMELINE_EVENT"] as const;
export const causalRelationTypes = ["CAUSES", "ENABLES", "REQUIRES", "MOTIVATES", "TRIGGERS", "ESCALATES", "PREVENTS_BLOCKS", "REVEALS", "TRANSFORMS", "RESOLVES"] as const;
export const causalRelationStates = ["ACTIVE", "TENTATIVE", "RETIRED"] as const;
export const causalProvenanceTypes = ["DIRECT", "CHAPTER_PROSE", "OUTLINE_BLOCK", "CAPTURE_CONVERSION"] as const;

export type CausalEndpointType = typeof causalEndpointTypes[number];
export type ActiveCausalEndpointType = typeof activeCausalEndpointTypes[number];
export type CausalRelationType = typeof causalRelationTypes[number];
export type CausalRelationState = typeof causalRelationStates[number];
export type CausalProvenanceType = typeof causalProvenanceTypes[number];

export const endpointSchema = z.object({
  type: z.enum(causalEndpointTypes),
  id: z.string().uuid(),
  blockId: z.string().uuid().optional()
}).strict().superRefine((value, context) => {
  if (value.type === "MANUSCRIPT_BLOCK" && !value.blockId) context.addIssue({ code: "custom", message: "A manuscript-block endpoint requires a stable block ID." });
  if (value.type !== "MANUSCRIPT_BLOCK" && value.blockId !== undefined) context.addIssue({ code: "custom", message: "Block IDs are valid only for manuscript-block endpoints." });
});

export type CausalEndpoint = z.infer<typeof endpointSchema>;

export const storyChangeWriteSchema = z.object({
  expectedStructuralVersion: z.number().int().positive(),
  storyChangeId: z.string().uuid().optional(),
  kind: z.enum(storyChangeKinds),
  title: z.string().trim().min(1).max(240),
  description: z.string().max(20_000).optional(),
  storyTime: z.number().finite().min(-1_000_000_000).max(1_000_000_000).optional(),
  discoveryTime: z.number().finite().min(-1_000_000_000).max(1_000_000_000).optional(),
  anchor: endpointSchema.optional(),
  isPlaceholder: z.boolean().default(false)
}).strict().superRefine((value, context) => {
  if (value.anchor?.type === "STORY_CHANGE") context.addIssue({ code: "custom", message: "A Story Change cannot use another Story Change as its anchor." });
  if (value.kind === "REVELATION" && value.discoveryTime === undefined && value.storyTime !== undefined) context.addIssue({ code: "custom", message: "A revelation with story time also requires discovery time." });
});

export const causalRelationWriteSchema = z.object({
  expectedStructuralVersion: z.number().int().positive(),
  source: endpointSchema,
  target: endpointSchema,
  relationType: z.enum(causalRelationTypes),
  condition: z.string().max(4_000).optional(),
  strength: z.number().finite().min(0).max(1).default(1),
  importance: z.number().int().min(0).max(100).default(50),
  state: z.enum(causalRelationStates).default("ACTIVE"),
  isHard: z.boolean().default(false),
  temporalProgression: z.boolean().default(false),
  mutualStateSemantics: z.boolean().default(false),
  note: z.string().max(8_000).optional(),
  provenanceType: z.enum(causalProvenanceTypes).default("DIRECT"),
  provenanceNote: z.string().max(4_000).optional()
}).strict().superRefine((value, context) => {
  if (endpointKey(value.source) === endpointKey(value.target)) context.addIssue({ code: "custom", message: "A causal relation cannot connect an endpoint to itself." });
  if (value.isHard && value.relationType !== "REQUIRES") context.addIssue({ code: "custom", message: "Only a requires relation may be hard." });
  if ((value.temporalProgression || value.mutualStateSemantics) && (!value.isHard || value.relationType !== "REQUIRES")) context.addIssue({ code: "custom", message: "Cycle semantics are valid only for hard requires relations." });
});

export const causalRelationLifecycleSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("REATTACH"), expectedStructuralVersion: z.number().int().positive(), relationId: z.string().uuid(), source: endpointSchema, target: endpointSchema }).strict(),
  z.object({ action: z.literal("RETIRE"), expectedStructuralVersion: z.number().int().positive(), relationId: z.string().uuid() }).strict(),
  z.object({ action: z.literal("ARCHIVE"), expectedStructuralVersion: z.number().int().positive(), relationId: z.string().uuid() }).strict()
]).superRefine((value, context) => {
  if (value.action === "REATTACH" && endpointKey(value.source) === endpointKey(value.target)) context.addIssue({ code: "custom", message: "A causal relation cannot be reattached to itself." });
});

export const traversalQuerySchema = z.object({
  endpointType: z.enum(causalEndpointTypes), endpointId: z.string().uuid(), blockId: z.string().uuid().optional(),
  direction: z.enum(["UPSTREAM", "DOWNSTREAM", "BOTH"]).default("BOTH"),
  states: z.array(z.enum(causalRelationStates)).min(1).max(3).default(["ACTIVE"]),
  relationTypes: z.array(z.enum(causalRelationTypes)).max(10).optional(),
  maxDepth: z.coerce.number().int().min(1).max(12).default(4),
  nodeBudget: z.coerce.number().int().min(1).max(500).default(200),
  edgeBudget: z.coerce.number().int().min(1).max(750).default(300),
  pathBudget: z.coerce.number().int().min(1).max(500).default(200)
}).strict().superRefine((value, context) => {
  const endpoint = { type: value.endpointType, id: value.endpointId, ...(value.blockId ? { blockId: value.blockId } : {}) };
  const parsed = endpointSchema.safeParse(endpoint);
  if (!parsed.success) for (const issue of parsed.error.issues) context.addIssue({ code: "custom", message: issue.message });
});

export const chronologyQuerySchema = z.object({ relationId: z.string().uuid() }).strict();

export function endpointKey(endpoint: CausalEndpoint): string { return `${endpoint.type}:${endpoint.id}:${endpoint.blockId ?? ""}`; }
