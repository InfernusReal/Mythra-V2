import { z } from "zod";
import { listCursorSchema } from "@/lib/contracts/list-cursor";
import { causalEndpointTypes, causalRelationTypes } from "@/domains/causality/domain/types";

export const captureLifecycles = ["UNPROCESSED", "FILED", "CONVERTED", "DEFERRED", "DISMISSED"] as const;
export const activeCaptureConversionTypes = ["MILESTONE", "STORY_CHANGE", "CHAPTER_ATTACHMENT", "OUTLINE_ATTACHMENT", "CAPTURE_DERIVED_CAUSAL", "ENTITY", "NOTE", "TIMELINE_EVENT"] as const;
export const reservedCaptureConversionTypes = [] as const;
export type CaptureLifecycle = typeof captureLifecycles[number];
export type ActiveCaptureConversionType = typeof activeCaptureConversionTypes[number];

const optionalUuid = z.string().uuid().optional();
export const captureCreateSchema = z.object({
  clientCaptureId: z.string().min(1).max(80), projectId: z.string().uuid(), rawText: z.string().min(1).max(20_000), route: z.string().min(1).max(2048),
  chapterId: optionalUuid, outlineId: optionalUuid, blockId: z.string().max(128).optional(), selectionAnchor: z.number().int().nonnegative().optional(), selectionHead: z.number().int().nonnegative().optional(),
  entityContext: z.array(z.string().uuid()).max(50).default([]), capturedAt: z.string().datetime()
}).strict().superRefine((value, context) => { if ((value.selectionAnchor === undefined) !== (value.selectionHead === undefined) || (value.selectionAnchor !== undefined && value.selectionHead! < value.selectionAnchor)) context.addIssue({ code: "custom", message: "Capture selection coordinates must form a complete non-negative range." }); });

export const captureListSchema = z.object({ lifecycle: z.enum(captureLifecycles).optional(), cursor: listCursorSchema.optional(), limit: z.coerce.number().int().min(1).max(100).default(50), dueOnly: z.coerce.boolean().default(false) }).strict();
export const captureLifecycleSchema = z.object({ captureIds: z.array(z.string().uuid()).min(1).max(100), action: z.enum(["FILE", "DEFER", "DISMISS", "RESTORE"]), deferredUntil: z.string().datetime().optional() }).strict().superRefine((value, context) => { if (value.action === "DEFER" && !value.deferredUntil) context.addIssue({ code: "custom", message: "Deferral requires a due time." }); });
export const captureAttachmentSchema = z.object({ targetType: z.enum(["CHAPTER", "CHAPTER_OUTLINE"]), targetId: z.string().uuid(), targetBlockId: z.string().max(128).default("") }).strict();

const causalActionSchema = z.object({ direction: z.enum(["BECAUSE_OF", "THIS_CAUSES"]), endpointType: z.enum(causalEndpointTypes), endpointId: z.string().uuid(), endpointBlockId: z.string().max(128).optional(), relationType: z.enum(causalRelationTypes).default("CAUSES") }).strict();
export const captureConversionSchema = z.object({
  conversionType: z.enum(activeCaptureConversionTypes), idempotencyKey: z.string().min(1).max(80), title: z.string().trim().min(1).max(240).optional(),
  targetId: optionalUuid, entityTypeId: optionalUuid, targetBlockId: z.string().max(128).default(""), expectedStructuralVersion: z.number().int().positive(), causalAction: causalActionSchema.optional()
}).strict().superRefine((value, context) => { if (value.conversionType === "ENTITY" && !value.entityTypeId) context.addIssue({ code: "custom", message: "Entity conversion requires an entity type." }); });

export interface CaptureSummary { id: string; projectId: string; rawText: string; lifecycle: CaptureLifecycle; route: string; chapterId: string | null; outlineId: string | null; blockId: string | null; selectionAnchor: number | null; selectionHead: number | null; entityContext: string[]; capturedAt: string; deferredUntil: string | null; version: number; attachmentCount: number; conversionCount: number; attachments: Array<{ id: string; targetType: "CHAPTER" | "CHAPTER_OUTLINE"; targetId: string; targetBlockId: string }>; }
export interface CaptureConversionResult { id: string; captureId: string; conversionType: ActiveCaptureConversionType; targetType: string; targetId: string; projectStructuralVersion: number; replayed: boolean; }
