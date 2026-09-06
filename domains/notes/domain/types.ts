import { z } from "zod";
import { listCursorSchema } from "@/lib/contracts/list-cursor";

export const noteWriteSchema = z.object({
  noteId: z.string().uuid().optional(), expectedVersion: z.number().int().positive().optional(), title: z.string().trim().min(1).max(200), body: z.string().max(100_000),
  tags: z.array(z.string().trim().min(1).max(64)).max(32).default([]), sourceCaptureId: z.string().uuid().optional(),
  toolIdempotencyKey: z.string().trim().min(1).max(80).optional(),
}).strict();
export const noteListSchema = z.object({ tag: z.string().trim().min(1).max(64).optional(), cursor: listCursorSchema.optional(), limit: z.coerce.number().int().min(1).max(100).default(50) }).strict();
export const notePromotionSchema = z.object({ noteId: z.string().uuid(), targetType: z.enum(["MILESTONE", "STORY_CHANGE", "CHAPTER_OUTLINE"]), idempotencyKey: z.string().min(1).max(80), expectedStructuralVersion: z.number().int().positive(), title: z.string().trim().min(1).max(240).optional() }).strict();

export function normalizeNoteTags(tags: readonly string[]): string[] {
  return [...new Set(tags.map((tag) => tag.normalize("NFKC").toLocaleLowerCase("en").replace(/\s+/gu, " ").trim()).filter(Boolean))].sort().slice(0, 32);
}

export interface NoteReadModel { id: string; title: string; body: string; tags: string[]; sourceCaptureId: string | null; version: number; updatedAt: string; backlinkCount: number; }
