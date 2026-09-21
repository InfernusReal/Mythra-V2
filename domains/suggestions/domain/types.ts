import { z } from "zod";

export const suggestionStatuses = ["open", "accepted", "modified", "rejected", "intentional"] as const;
export const resolvedSuggestionStatuses = ["accepted", "modified", "rejected", "intentional"] as const;
export type SuggestionStatus = (typeof suggestionStatuses)[number];
export type ResolvedSuggestionStatus = (typeof resolvedSuggestionStatuses)[number];

const stableKey = z.string().trim().min(1).max(120).regex(/^[a-zA-Z][a-zA-Z0-9_.:-]*$/u);
const targetIdentitySchema = z.object({
  type: stableKey,
  id: z.string().trim().min(1).max(128),
  blockId: z.string().trim().min(1).max(128).optional(),
}).strict();

export const evidenceReferenceSchema = targetIdentitySchema.extend({
  relationship: z.enum(["supports", "contradicts", "context", "causal_path", "author_approved"]),
}).strict();

const proposedActionSchema = z.object({
  actionType: z.enum(["manual", "structure_patch", "causal_relation", "note", "capture", "prose_replacement"]),
  target: targetIdentitySchema.optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
}).strict().superRefine((value, context) => {
  if (JSON.stringify(value.payload).length > 50_000) context.addIssue({ code: "custom", message: "A proposed action payload exceeds the 50,000-character bound." });
});

export const suggestionCreateSchema = z.object({
  sourceAgent: stableKey,
  idempotencyKey: z.string().trim().min(1).max(80),
  category: stableKey,
  targetType: stableKey.optional(),
  targetId: z.string().trim().min(1).max(128).optional(),
  sourceBlockId: z.string().trim().min(1).max(128).optional(),
  finding: z.string().trim().min(1).max(20_000),
  evidenceReferences: z.array(evidenceReferenceSchema).max(100).default([]),
  proposedActions: z.array(proposedActionSchema).max(50).default([]),
  confidence: z.number().finite().min(0).max(1).optional(),
}).strict().superRefine((value, context) => {
  if ((value.targetType === undefined) !== (value.targetId === undefined)) context.addIssue({ code: "custom", message: "Suggestion target type and ID must be supplied together." });
});

export const suggestionResolveSchema = z.object({
  expectedVersion: z.number().int().positive(),
  status: z.enum(resolvedSuggestionStatuses),
  authorNote: z.string().trim().min(1).max(20_000).optional(),
}).strict().superRefine((value, context) => {
  if (value.status === "modified" && !value.authorNote) context.addIssue({ code: "custom", message: "A modified decision requires an author note." });
});

export const suggestionListSchema = z.object({
  status: z.enum(suggestionStatuses).optional(),
  sourceAgent: stableKey.optional(),
  cursor: z.string().max(512).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).strict();

export type SuggestionCreateInput = z.infer<typeof suggestionCreateSchema>;
export type SuggestionResolveInput = z.infer<typeof suggestionResolveSchema>;
export type EvidenceReference = z.infer<typeof evidenceReferenceSchema>;
export type ProposedAction = z.infer<typeof proposedActionSchema>;

export interface SuggestionReadModel {
  id: string;
  projectId: string;
  sourceAgent: string;
  category: string;
  targetType: string | null;
  targetId: string | null;
  sourceBlockId: string | null;
  finding: string;
  evidenceReferences: EvidenceReference[];
  proposedActions: ProposedAction[];
  confidence: number | null;
  status: SuggestionStatus;
  authorNote: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface SuggestionCreateResult {
  suggestion: SuggestionReadModel;
  replayed: boolean;
}

export function encodeSuggestionCursor(createdAt: string, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt, id }), "utf8").toString("base64url");
}

export function decodeSuggestionCursor(cursor: string): { createdAt: Date; id: string } {
  try {
    const parsed = z.object({ createdAt: z.string().datetime(), id: z.string().uuid() }).strict().parse(JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")));
    return { createdAt: new Date(parsed.createdAt), id: parsed.id };
  } catch {
    throw new z.ZodError([{ code: "custom", path: ["cursor"], message: "Suggestion cursor is invalid.", input: cursor }]);
  }
}
