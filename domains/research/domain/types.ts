import { z } from "zod";
import { listCursorSchema } from "@/lib/contracts/list-cursor";
import { activeStoryReferenceEndpointTypes } from "@/domains/references/domain/story-reference";

export const researchKinds = ["NOTE", "URL", "EXCERPT", "CITATION", "FILE"] as const;
export type ResearchKind = (typeof researchKinds)[number];
const base = z.object({ title: z.string().trim().min(1).max(200) });
export const researchCreateSchema = z.discriminatedUnion("kind", [
  base.extend({ kind: z.literal("NOTE"), body: z.string().min(1).max(100_000) }).strict(),
  base.extend({ kind: z.literal("URL"), url: z.string().url().max(2048), body: z.string().max(100_000).optional() }).strict(),
  base.extend({ kind: z.literal("EXCERPT"), excerpt: z.string().min(1).max(100_000), citation: z.string().max(10_000).optional() }).strict(),
  base.extend({ kind: z.literal("CITATION"), citation: z.string().min(1).max(10_000), body: z.string().max(100_000).optional() }).strict(),
  base.extend({ kind: z.literal("FILE"), assetId: z.string().uuid() }).strict(),
]);
export const researchListSchema = z.object({ kind: z.enum(researchKinds).optional(), cursor: listCursorSchema.optional(), limit: z.coerce.number().int().min(1).max(100).default(50) }).strict();
export const researchLinkSchema = z.object({ researchItemId: z.string().uuid(), targetType: z.enum(activeStoryReferenceEndpointTypes), targetId: z.string().uuid(), label: z.string().trim().max(160).optional() }).strict();

export const allowedResearchMimeTypes = ["application/pdf", "text/plain", "text/markdown", "image/jpeg", "image/png"] as const;
export const MAX_RESEARCH_FILE_BYTES = 10 * 1024 * 1024;
export interface ResearchItemReadModel { id: string; kind: ResearchKind; title: string; body: string | null; url: string | null; citation: string | null; excerpt: string | null; asset: null | { id: string; displayName: string; contentType: string; sizeBytes: number; scanStatus: string }; version: number; updatedAt: string; }

export function validateResearchFile(input: { displayName: string; contentType: string; sizeBytes: number }): { displayName: string; contentType: (typeof allowedResearchMimeTypes)[number]; sizeBytes: number } {
  const displayName = input.displayName.normalize("NFKC").replace(/[\\/\0-\x1f]/gu, "_").trim().slice(0, 255);
  if (!displayName) throw new Error("A valid file name is required.");
  if (!(allowedResearchMimeTypes as readonly string[]).includes(input.contentType)) throw new Error("This file type is not supported.");
  if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes < 1 || input.sizeBytes > MAX_RESEARCH_FILE_BYTES) throw new Error("Research files must be between 1 byte and 10 MiB.");
  return { displayName, contentType: input.contentType as (typeof allowedResearchMimeTypes)[number], sizeBytes: input.sizeBytes };
}
