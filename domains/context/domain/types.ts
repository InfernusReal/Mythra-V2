import { z } from "zod";

export const activeContextCardTypes = [
  "CHAPTER_OUTLINE",
  "MILESTONE",
  "CAUSAL",
  "REFERENCE",
  "NARRATIVE_INTENT",
  "CAPTURE",
  "ENTITY",
  "SEARCH",
  "LANGUAGE",
  "TIMELINE",
  "NOTE",
  "RESEARCH",
] as const;
export type ContextCardType = (typeof activeContextCardTypes)[number];
export type ContextFieldState =
  | "CHAPTER"
  | "SELECTION"
  | "PEEK"
  | "OUTLINE"
  | "REFERENCE_SEARCH"
  | "CAUSAL_PEEK"
  | "SEARCH"
  | "LANGUAGE";

export interface ContextSource {
  type: ContextCardType;
  id: string;
  version: number;
  blockId?: string;
}

export type ContextAction =
  | { type: "PEEK"; label?: string }
  | { type: "OPEN"; label?: string; href: string }
  | { type: "PIN" | "UNPIN" | "HIDE_SESSION" | "MUTE_TYPE"; label?: string }
  | { type: "EDIT_SOURCE" | "MARK_INTENTIONAL"; label?: string }
  | {
      type: "WHY_NOW" | "WHAT_CHANGES";
      label?: string;
      endpointType: string;
      endpointId: string;
      blockId?: string;
    }
  | { type: "MORE"; label?: string; href?: string };

export interface ContextFieldDescriptor {
  id: string;
  type: ContextCardType;
  priority: number;
  source: ContextSource;
  title: string;
  summary: string;
  payload: Readonly<Record<string, unknown>>;
  actions: ContextAction[];
  freshnessVersion: number;
  pinnable: boolean;
  pinned: boolean;
  stale: boolean;
  reason: "PINNED" | "SELECTION" | "PEEK" | "CURSOR" | "CHAPTER" | "PROJECT";
}

export interface DirectiveItem {
  id: string;
  text: string;
  leadingCode?: string;
  textCode?: string;
  source: ContextSource;
  peekDescriptorId: string;
  rank: number;
}

export interface NarrativeDirectiveProjection {
  chapterId: string;
  chapterVersion: number;
  projectStructuralVersion: number;
  freshnessVersion: number;
  stale: boolean;
  disabled: boolean;
  purposeItems: DirectiveItem[];
  advanceItems: DirectiveItem[];
  preserveItems: DirectiveItem[];
  readerOutcomeItems: DirectiveItem[];
  nextItems: DirectiveItem[];
  relevantContextItems: DirectiveItem[];
  becauseItems: DirectiveItem[];
  consequenceItems: DirectiveItem[];
}

export interface ContextFieldReadModel {
  contextKey: string;
  requestedContextKey: string | null;
  state: ContextFieldState;
  chapterId: string;
  chapterVersion: number;
  projectId: string;
  projectStructuralVersion: number;
  descriptors: ContextFieldDescriptor[];
  directive: NarrativeDirectiveProjection;
  preferences: { mutedTypes: ContextCardType[]; directiveEnabled: boolean };
  pinKeys: string[];
  page: {
    cardCap: number;
    returnedCards: number;
    totalEligibleCards: number;
    hasMore: boolean;
  };
}

export const contextQuerySchema = z
  .object({
    cursorBlockId: z.string().uuid().optional(),
    selectedIds: z.array(z.string().uuid()).max(50).default([]),
    peekType: z.enum(activeContextCardTypes).optional(),
    peekId: z.string().uuid().optional(),
    activeCausalType: z
      .enum([
        "MILESTONE",
        "CHAPTER_OUTLINE",
        "SCENE",
        "NARRATIVE_INTENT",
        "MANUSCRIPT_BLOCK",
        "STORY_CHANGE",
        "CAPTURE_DERIVED",
        "ENTITY_STATE",
        "TIMELINE_EVENT",
      ])
      .optional(),
    activeCausalId: z.string().uuid().optional(),
    activeCausalBlockId: z.string().uuid().optional(),
    requestedContextKey: z.string().min(16).max(128).optional(),
    cardCap: z.coerce.number().int().min(1).max(20).default(8),
  })
  .strict()
  .superRefine((value, context) => {
    if ((value.peekType === undefined) !== (value.peekId === undefined))
      context.addIssue({
        code: "custom",
        message: "Peek type and ID must be provided together.",
      });
    if (
      (value.activeCausalType === undefined) !==
      (value.activeCausalId === undefined)
    )
      context.addIssue({
        code: "custom",
        message: "Causal anchor type and ID must be provided together.",
      });
    if (
      value.activeCausalType === "MANUSCRIPT_BLOCK" &&
      !value.activeCausalBlockId
    )
      context.addIssue({
        code: "custom",
        message: "A manuscript-block causal anchor requires a block ID.",
      });
  });

export type ContextQuery = z.infer<typeof contextQuerySchema>;

export const contextPreferenceMutationSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("PIN"),
      cardType: z.enum(activeContextCardTypes),
      sourceId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      action: z.literal("UNPIN"),
      cardType: z.enum(activeContextCardTypes),
      sourceId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      action: z.literal("MUTE"),
      cardType: z.enum(activeContextCardTypes),
    })
    .strict(),
  z
    .object({
      action: z.literal("UNMUTE"),
      cardType: z.enum(activeContextCardTypes),
    })
    .strict(),
  z
    .object({ action: z.literal("SET_DIRECTIVE"), enabled: z.boolean() })
    .strict(),
]);

export const contextSourceEditSchema = z.discriminatedUnion("sourceType", [
  z
    .object({
      sourceType: z.literal("CHAPTER_OUTLINE"),
      sourceId: z.string().uuid(),
      expectedVersion: z.number().int().positive(),
      expectedStructuralVersion: z.number().int().positive(),
      field: z.literal("purpose"),
      value: z.string().trim().max(4_000),
    })
    .strict(),
  z
    .object({
      sourceType: z.literal("NARRATIVE_INTENT"),
      sourceId: z.string().uuid(),
      expectedVersion: z.number().int().positive(),
      expectedStructuralVersion: z.number().int().positive(),
      field: z.literal("intentText"),
      value: z.string().trim().min(1).max(20_000),
    })
    .strict(),
]);

export function descriptorId(type: ContextCardType, sourceId: string): string {
  return `${type}:${sourceId}`;
}
