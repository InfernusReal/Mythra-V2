import { z } from "zod";
import { causalEndpointTypes, causalProvenanceTypes, causalRelationStates, causalRelationTypes, endpointSchema, traversalQuerySchema } from "@/domains/causality/domain/types";
import { evidenceReferenceSchema, suggestionCreateSchema } from "@/domains/suggestions/domain/types";
import { searchQuerySchema } from "@/domains/search/domain/types";
import { timelineModes } from "@/domains/timeline/domain/types";

const storyReferenceEndpointTypes = ["PLOT", "PLOT_OUTLINE", "VOLUME", "VOLUME_OUTLINE", "CHAPTER_OUTLINE", "CHAPTER", "SCENE", "NARRATIVE_INTENT", "MANUSCRIPT_BLOCK", "MILESTONE", "ENTITY", "TIMELINE_EVENT", "NOTE", "CAPTURE"] as const;

export const agentToolNames = [
  "get_project_map",
  "get_plot",
  "get_volume_outline",
  "get_milestone",
  "get_chapter_outline",
  "get_chapter_text",
  "search_project",
  "get_entities",
  "get_entity",
  "get_timeline_window",
  "get_backlinks",
  "get_causal_neighborhood",
  "trace_causal_impact",
  "get_story_change",
  "create_suggestion",
  "propose_structure_patch",
  "create_note",
  "create_capture",
  "propose_causal_relation",
  "replace_prose_range",
] as const;

export type AgentToolName = (typeof agentToolNames)[number];
export const toolPermissionLevels = ["READ", "PROPOSE", "WRITE_METADATA", "RESTRICTED_WRITE"] as const;
export type ToolPermissionLevel = (typeof toolPermissionLevels)[number];

const emptySchema = z.object({}).strict();
const uuid = z.string().uuid();
const textWindow = { start: z.coerce.number().int().min(0).default(0), length: z.coerce.number().int().min(1).max(8_000).default(4_000) } as const;
const proposalIdentity = { sourceAgent: z.string().trim().min(1).max(120).regex(/^[a-zA-Z][a-zA-Z0-9_.:-]*$/u), idempotencyKey: z.string().trim().min(1).max(80), finding: z.string().trim().min(1).max(20_000), evidenceReferences: z.array(evidenceReferenceSchema).max(100).default([]), confidence: z.number().finite().min(0).max(1).optional() } as const;

export const projectMapToolSchema = z.object({ perCollectionLimit: z.coerce.number().int().min(1).max(100).default(50) }).strict();
export const volumeOutlineToolSchema = z.object({ volumeId: uuid, ...textWindow }).strict();
export const milestoneToolSchema = z.object({ milestoneId: uuid, edgeLimit: z.coerce.number().int().min(1).max(100).default(50) }).strict();
export const chapterOutlineToolSchema = z.object({ outlineId: uuid.optional(), chapterId: uuid.optional(), sceneLimit: z.coerce.number().int().min(1).max(100).default(50), ...textWindow }).strict().superRefine((value, context) => {
  if ((value.outlineId === undefined) === (value.chapterId === undefined)) context.addIssue({ code: "custom", message: "Provide exactly one chapter outline ID or chapter ID." });
});
export const chapterTextToolSchema = z.object({ chapterId: uuid, ...textWindow }).strict();
export const entityListToolSchema = z.object({ typeId: uuid.optional(), status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE"), tag: z.string().trim().min(1).max(80).optional(), cursor: z.string().datetime().optional(), limit: z.coerce.number().int().min(1).max(100).default(50) }).strict();
export const entityToolSchema = z.object({ entityId: uuid }).strict();
export const timelineWindowToolSchema = z.object({ anchorEventId: uuid.optional(), mode: z.enum(timelineModes).optional(), before: z.coerce.number().int().min(0).max(50).default(20), after: z.coerce.number().int().min(0).max(50).default(20) }).strict().refine((value) => value.before + value.after + (value.anchorEventId ? 1 : 0) > 0, "Timeline window must request at least one event.");
export const backlinksToolSchema = z.object({ targetType: z.enum(storyReferenceEndpointTypes), targetId: uuid, targetBlockId: z.string().trim().min(1).max(128).optional(), cursor: z.string().datetime().optional(), limit: z.coerce.number().int().min(1).max(100).default(50) }).strict();
export const storyChangeToolSchema = z.object({ storyChangeId: uuid }).strict();

const structurePatchOperationSchema = z.object({ operation: z.enum(["add", "replace", "remove"]), targetType: z.enum(["PLOT", "PLOT_OUTLINE", "VOLUME", "VOLUME_OUTLINE", "MILESTONE", "CHAPTER_OUTLINE", "CHAPTER", "SCENE", "NARRATIVE_INTENT"]), targetId: z.string().uuid().optional(), path: z.string().trim().min(1).max(240), value: z.unknown().optional() }).strict().superRefine((value, context) => {
  if (value.operation !== "remove" && value.value === undefined) context.addIssue({ code: "custom", message: "Add and replace operations require a proposed value." });
  if (JSON.stringify(value.value ?? null).length > 20_000) context.addIssue({ code: "custom", message: "A structure patch value exceeds the 20,000-character bound." });
});
export const structurePatchProposalSchema = z.object({ ...proposalIdentity, expectedStructuralVersion: z.number().int().positive(), targetType: z.enum(["PLOT", "PLOT_OUTLINE", "VOLUME", "VOLUME_OUTLINE", "MILESTONE", "CHAPTER_OUTLINE", "CHAPTER", "SCENE", "NARRATIVE_INTENT"]), targetId: z.string().uuid().optional(), operations: z.array(structurePatchOperationSchema).min(1).max(50) }).strict();

export const causalRelationProposalSchema = z.object({ ...proposalIdentity, expectedStructuralVersion: z.number().int().positive(), source: endpointSchema, target: endpointSchema, relationType: z.enum(causalRelationTypes), condition: z.string().max(4_000).optional(), strength: z.number().finite().min(0).max(1).default(1), importance: z.number().int().min(0).max(100).default(50), state: z.enum(causalRelationStates).default("TENTATIVE"), isHard: z.boolean().default(false), temporalProgression: z.boolean().default(false), mutualStateSemantics: z.boolean().default(false), note: z.string().max(8_000).optional(), provenanceType: z.enum(causalProvenanceTypes).default("DIRECT"), provenanceNote: z.string().max(4_000).optional() }).strict().superRefine((value, context) => {
  if (value.source.type === value.target.type && value.source.id === value.target.id && value.source.blockId === value.target.blockId) context.addIssue({ code: "custom", message: "A causal proposal cannot connect an endpoint to itself." });
  if (value.isHard && value.relationType !== "REQUIRES") context.addIssue({ code: "custom", message: "Only a requires proposal may be hard." });
  if ((value.temporalProgression || value.mutualStateSemantics) && (!value.isHard || value.relationType !== "REQUIRES")) context.addIssue({ code: "custom", message: "Cycle semantics are valid only for hard requires proposals." });
});

export const noteToolSchema = z.object({ authorConfirmed: z.literal(true), idempotencyKey: z.string().trim().min(1).max(80), title: z.string().trim().min(1).max(200), body: z.string().max(100_000), tags: z.array(z.string().trim().min(1).max(64)).max(32).default([]), sourceCaptureId: uuid.optional() }).strict();
export const captureToolSchema = z.object({ authorConfirmed: z.literal(true), clientCaptureId: z.string().min(1).max(80), rawText: z.string().min(1).max(20_000), route: z.string().min(1).max(2_048), chapterId: uuid.optional(), outlineId: uuid.optional(), blockId: z.string().max(128).optional(), selectionAnchor: z.number().int().nonnegative().optional(), selectionHead: z.number().int().nonnegative().optional(), entityContext: z.array(uuid).max(50).default([]), capturedAt: z.string().datetime() }).strict().superRefine((value, context) => {
  if ((value.selectionAnchor === undefined) !== (value.selectionHead === undefined) || (value.selectionAnchor !== undefined && value.selectionHead! < value.selectionAnchor)) context.addIssue({ code: "custom", message: "Capture selection coordinates must form a complete non-negative range." });
});
export const replaceProseRangeToolSchema = z.object({ authorConfirmed: z.literal(true), chapterId: uuid, start: z.number().int().nonnegative(), length: z.number().int().min(1).max(8_000), replacement: z.string().max(8_000) }).strict();

export const agentToolInputSchemas = {
  get_project_map: projectMapToolSchema,
  get_plot: emptySchema,
  get_volume_outline: volumeOutlineToolSchema,
  get_milestone: milestoneToolSchema,
  get_chapter_outline: chapterOutlineToolSchema,
  get_chapter_text: chapterTextToolSchema,
  search_project: searchQuerySchema,
  get_entities: entityListToolSchema,
  get_entity: entityToolSchema,
  get_timeline_window: timelineWindowToolSchema,
  get_backlinks: backlinksToolSchema,
  get_causal_neighborhood: traversalQuerySchema,
  trace_causal_impact: traversalQuerySchema,
  get_story_change: storyChangeToolSchema,
  create_suggestion: suggestionCreateSchema,
  propose_structure_patch: structurePatchProposalSchema,
  create_note: noteToolSchema,
  create_capture: captureToolSchema,
  propose_causal_relation: causalRelationProposalSchema,
  replace_prose_range: replaceProseRangeToolSchema,
} satisfies Record<AgentToolName, z.ZodType>;

const definitions: Readonly<Record<AgentToolName, { description: string; permission: ToolPermissionLevel }>> = Object.freeze({
  get_project_map: { description: "Return a bounded hierarchy and structural summary for one authorized project.", permission: "READ" },
  get_plot: { description: "Read the project plot and bounded author-declared plot-outline intent.", permission: "READ" },
  get_volume_outline: { description: "Read one volume and a bounded window of its author-declared outline.", permission: "READ" },
  get_milestone: { description: "Inspect one milestone with bounded linked chapters and dependencies.", permission: "READ" },
  get_chapter_outline: { description: "Inspect one chapter outline and a bounded set of optional scenes.", permission: "READ" },
  get_chapter_text: { description: "Read one bounded UTF-16 range of chapter text.", permission: "READ" },
  search_project: { description: "Search manuscript and structured project data with a bounded result page.", permission: "READ" },
  get_entities: { description: "List a bounded page of authorized story entities.", permission: "READ" },
  get_entity: { description: "Inspect one entity, state and bounded backlinks in its application read model.", permission: "READ" },
  get_timeline_window: { description: "Inspect a bounded chronology window around an optional timeline event.", permission: "READ" },
  get_backlinks: { description: "Trace a bounded page of explicit non-causal references to an object.", permission: "READ" },
  get_causal_neighborhood: { description: "Read bounded upstream or downstream author-approved causal paths with provenance.", permission: "READ" },
  trace_causal_impact: { description: "Trace potentially affected objects through bounded, path-explained causal evidence.", permission: "READ" },
  get_story_change: { description: "Inspect one lightweight Story Change and its anchor.", permission: "READ" },
  create_suggestion: { description: "Create an evidence-linked, non-destructive Suggestion for author decision.", permission: "PROPOSE" },
  propose_structure_patch: { description: "Store a bounded structural diff as a non-canonical Suggestion.", permission: "PROPOSE" },
  create_note: { description: "Create a Note only after explicit author confirmation.", permission: "WRITE_METADATA" },
  create_capture: { description: "Create a Capture only after explicit author confirmation.", permission: "WRITE_METADATA" },
  propose_causal_relation: { description: "Store a causal relation proposal for author decision without changing canonical relations.", permission: "PROPOSE" },
  replace_prose_range: { description: "Reserved restricted prose write; disabled for every V2 invocation.", permission: "RESTRICTED_WRITE" },
});

export function agentToolPermission(name: AgentToolName): ToolPermissionLevel {
  return definitions[name].permission;
}

export interface AgentToolDefinition {
  name: AgentToolName;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  permission: ToolPermissionLevel;
  annotations: { readOnlyHint: boolean; destructiveHint: boolean; idempotentHint: boolean; openWorldHint: boolean };
}

const objectOutput = (required: string[]) => ({
  type: "object",
  required,
  properties: Object.fromEntries(required.map((key) => [key, {}])),
  additionalProperties: true,
}) as Record<string, unknown>;

const outputSchemas: Readonly<Record<AgentToolName, Record<string, unknown>>> = Object.freeze({
  get_project_map: objectOutput(["id", "title", "structuralVersion", "volumes", "milestones", "chapterOutlines", "chapters", "scenes", "perCollectionLimit"]),
  get_plot: objectOutput(["projectStructuralVersion", "plot"]),
  get_volume_outline: objectOutput(["projectStructuralVersion", "volume", "outline"]),
  get_milestone: objectOutput(["projectStructuralVersion", "milestone"]),
  get_chapter_outline: objectOutput(["projectStructuralVersion", "outline"]),
  get_chapter_text: objectOutput(["projectStructuralVersion", "chapter", "range"]),
  search_project: objectOutput(["projectId", "projectStructuralVersion", "groups", "page"]),
  get_entities: objectOutput(["entities", "nextCursor", "projectStructuralVersion"]),
  get_entity: objectOutput(["detail", "projectStructuralVersion"]),
  get_timeline_window: objectOutput(["projectStructuralVersion", "events", "page"]),
  get_backlinks: objectOutput(["projectStructuralVersion", "backlinks", "page"]),
  get_causal_neighborhood: objectOutput(["root", "paths", "nodeCount", "edgeCount", "truncated", "language"]),
  trace_causal_impact: objectOutput(["root", "paths", "nodeCount", "edgeCount", "truncated", "language"]),
  get_story_change: objectOutput(["projectStructuralVersion", "storyChange"]),
  create_suggestion: objectOutput(["suggestion", "replayed"]),
  propose_structure_patch: objectOutput(["suggestion", "replayed"]),
  create_note: objectOutput(["note", "projectStructuralVersion", "replayed"]),
  create_capture: objectOutput(["capture", "replayed"]),
  propose_causal_relation: objectOutput(["suggestion", "replayed"]),
  replace_prose_range: objectOutput([]),
});

export function agentToolDefinitions(): AgentToolDefinition[] {
  return agentToolNames.map((name) => {
    const definition = definitions[name];
    return { name, title: name.split("_").map((part) => part[0]!.toUpperCase() + part.slice(1)).join(" "), description: definition.description, inputSchema: z.toJSONSchema(agentToolInputSchemas[name], { target: "draft-7" }) as Record<string, unknown>, outputSchema: outputSchemas[name], permission: definition.permission, annotations: { readOnlyHint: definition.permission === "READ", destructiveHint: name === "replace_prose_range", idempotentHint: name === "create_suggestion" || name === "propose_structure_patch" || name === "create_note" || name === "create_capture" || name === "propose_causal_relation", openWorldHint: false } };
  });
}

export function parseAgentToolArguments(name: AgentToolName, value: unknown): unknown {
  return agentToolInputSchemas[name].parse(value);
}

export const agentToolCallSchema = z.object({ name: z.enum(agentToolNames), arguments: z.record(z.string(), z.unknown()).default({}) }).strict();
export const toolProtocolRequestSchema = z.discriminatedUnion("method", [
  z.object({ jsonrpc: z.literal("2.0"), id: z.union([z.string().max(128), z.number().int()]), method: z.literal("tools/list"), params: z.object({}).strict().optional() }).strict(),
  z.object({ jsonrpc: z.literal("2.0"), id: z.union([z.string().max(128), z.number().int()]), method: z.literal("tools/call"), params: agentToolCallSchema }).strict(),
]);

export type ToolProtocolRequest = z.infer<typeof toolProtocolRequestSchema>;
export type StructurePatchProposal = z.infer<typeof structurePatchProposalSchema>;
export type CausalRelationProposal = z.infer<typeof causalRelationProposalSchema>;
export type TimelineWindowInput = z.infer<typeof timelineWindowToolSchema>;
export type BacklinksInput = z.infer<typeof backlinksToolSchema>;
export type ChapterTextInput = z.infer<typeof chapterTextToolSchema>;
export type ChapterOutlineInput = z.infer<typeof chapterOutlineToolSchema>;
export type VolumeOutlineInput = z.infer<typeof volumeOutlineToolSchema>;
export type MilestoneInput = z.infer<typeof milestoneToolSchema>;

export const causalToolEndpointTypes = causalEndpointTypes;
