import { z } from "zod";

export const STRUCTURE_DEFAULT_PAGE_SIZE = 100;
export const STRUCTURE_MAX_PAGE_SIZE = 250;
export const STRUCTURE_DEFAULT_NODE_BUDGET = 200;
export const STRUCTURE_MAX_NODE_BUDGET = 500;
export const STRUCTURE_DEFAULT_EDGE_BUDGET = 300;
export const STRUCTURE_MAX_EDGE_BUDGET = 750;

export const presentationModes = ["DISCOVERY", "GUIDED", "ARCHITECT"] as const;
export const structureLenses = ["OUTLINE", "VOLUMES", "CHAPTERS", "MILESTONES", "RELATIONSHIPS", "SEMANTIC_ZOOM"] as const;
export const narrativeIntentTargetTypes = ["PLOT", "VOLUME", "MILESTONE", "CHAPTER", "SCENE", "PARAGRAPH_SELECTION"] as const;
export const narrativeIntentCategories = ["TENSION", "REVELATION", "EMOTION", "PACING", "AMBIGUITY", "ATMOSPHERE", "CUSTOM"] as const;

export type PresentationMode = (typeof presentationModes)[number];
export type StructureLens = (typeof structureLenses)[number];
export type NarrativeIntentTargetType = (typeof narrativeIntentTargetTypes)[number];
export type NarrativeIntentCategory = (typeof narrativeIntentCategories)[number];

export const outlineDocumentSchema = z.object({
  type: z.literal("doc"),
  content: z.array(z.unknown()).default([])
}).passthrough();

export const outlineFieldsSchema = z.object({
  title: z.string().trim().min(1).max(240),
  document: outlineDocumentSchema,
  plainText: z.string().max(200_000).default(""),
  purpose: z.string().trim().max(4_000).optional(),
  emotionalMovement: z.string().trim().max(4_000).optional(),
  revealedInformation: z.array(z.string().trim().min(1).max(1_000)).max(500).default([]),
  entityReferenceKeys: z.array(z.string().uuid()).max(500).default([]),
  locationReferenceKeys: z.array(z.string().uuid()).max(500).default([]),
  milestoneReferenceKeys: z.array(z.string().uuid()).max(500).default([]),
  targetWords: z.number().int().positive().max(10_000_000).optional(),
  hardTargetWordsEnabled: z.boolean().default(false),
  sceneStubs: z.array(z.object({ id: z.string().uuid(), title: z.string().trim().min(1).max(240) }).strict()).max(1_000).default([])
}).strict().superRefine((value, context) => {
  if (value.hardTargetWordsEnabled && value.targetWords === undefined) {
    context.addIssue({ code: "custom", message: "A hard word target requires an explicit target." });
  }
});

export const narrativeIntentInputSchema = z.object({
  expectedStructuralVersion: z.number().int().positive(),
  targetType: z.enum(narrativeIntentTargetTypes),
  targetId: z.string().uuid(),
  blockId: z.string().trim().min(1).max(128).optional(),
  selectionAnchor: z.number().int().nonnegative().optional(),
  selectionHead: z.number().int().nonnegative().optional(),
  category: z.enum(narrativeIntentCategories).optional(),
  customCategory: z.string().trim().min(1).max(80).optional(),
  intentText: z.string().trim().min(1).max(20_000)
}).strict().superRefine((value, context) => {
  const selection = value.targetType === "PARAGRAPH_SELECTION";
  if (selection && (value.blockId === undefined || value.selectionAnchor === undefined || value.selectionHead === undefined)) {
    context.addIssue({ code: "custom", message: "Paragraph-selection intent requires block and selection anchors." });
  }
  if (!selection && (value.blockId !== undefined || value.selectionAnchor !== undefined || value.selectionHead !== undefined)) {
    context.addIssue({ code: "custom", message: "Selection anchors are valid only for paragraph-selection intent." });
  }
  if (value.category === "CUSTOM" && !value.customCategory) {
    context.addIssue({ code: "custom", message: "Custom intent category requires a label." });
  }
});

export const structureViewStateInputSchema = z.object({
  mode: z.enum(presentationModes),
  activeLens: z.enum(structureLenses),
  expandedIds: z.array(z.string().uuid()).max(2_000),
  activeAnchorType: z.enum(["PLOT", "PLOT_OUTLINE", "VOLUME", "VOLUME_OUTLINE", "MILESTONE", "CHAPTER_OUTLINE", "CHAPTER", "SCENE", "NARRATIVE_INTENT", "MANUSCRIPT_BLOCK"]).nullable().optional(),
  activeAnchorId: z.string().uuid().nullable().optional(),
  cursorOffset: z.number().int().nonnegative().nullable().optional(),
  selectionAnchor: z.number().int().nonnegative().nullable().optional(),
  selectionHead: z.number().int().nonnegative().nullable().optional(),
  scrollTop: z.number().int().nonnegative().nullable().optional(),
  pinIds: z.array(z.string().uuid()).max(100).default([])
}).strict();

export const emptyOutlineDocument = { type: "doc", content: [] } as const;

export interface StructureMutationResult<T> {
  object: T;
  projectStructuralVersion: number;
}

export interface StructureBudget {
  pageSize: number;
  nodeBudget: number;
  edgeBudget: number;
  rangeStart: number;
}

export function clampStructureBudget(input: Partial<StructureBudget>): StructureBudget {
  return {
    pageSize: Math.min(STRUCTURE_MAX_PAGE_SIZE, Math.max(1, input.pageSize ?? STRUCTURE_DEFAULT_PAGE_SIZE)),
    nodeBudget: Math.min(STRUCTURE_MAX_NODE_BUDGET, Math.max(1, input.nodeBudget ?? STRUCTURE_DEFAULT_NODE_BUDGET)),
    edgeBudget: Math.min(STRUCTURE_MAX_EDGE_BUDGET, Math.max(0, input.edgeBudget ?? STRUCTURE_DEFAULT_EDGE_BUDGET)),
    rangeStart: Math.min(1_000_000, Math.max(0, input.rangeStart ?? 0))
  };
}
