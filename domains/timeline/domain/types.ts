import { z } from "zod";

export const timelineModes = ["ABSOLUTE", "APPROXIMATE", "RELATIVE", "ORDINAL", "RANGE"] as const;
export const timelineLinkTargetTypes = ["ENTITY", "MILESTONE", "CHAPTER", "TIMELINE_EVENT"] as const;
export type TimelineMode = (typeof timelineModes)[number];
export type TimelineLinkTargetType = (typeof timelineLinkTargetTypes)[number];

const coordinate = z.number().finite().min(-1_000_000_000_000).max(1_000_000_000_000);
export const timelineEventWriteSchema = z.object({
  eventId: z.string().uuid().optional(),
  expectedVersion: z.number().int().positive().optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(20_000).optional(),
  mode: z.enum(timelineModes),
  displayLabel: z.string().trim().min(1).max(200),
  calendarKey: z.string().trim().min(1).max(80).optional(),
  sortStart: coordinate.optional(),
  sortEnd: coordinate.optional(),
  relativeToEventId: z.string().uuid().optional(),
  relativeOffset: coordinate.optional(),
  ordinalValue: coordinate.optional(),
}).strict().superRefine((value, context) => {
  const issue = (message: string) => context.addIssue({ code: "custom", message });
  if ((value.mode === "ABSOLUTE" || value.mode === "APPROXIMATE") && value.sortStart === undefined) issue("Absolute and approximate events require a sortable value.");
  if (value.mode === "RELATIVE" && (!value.relativeToEventId || value.relativeOffset === undefined)) issue("Relative events require an anchor event and offset.");
  if (value.mode === "ORDINAL" && value.ordinalValue === undefined) issue("Ordinal events require an ordinal value.");
  if (value.mode === "RANGE" && (value.sortStart === undefined || value.sortEnd === undefined || value.sortEnd < value.sortStart)) issue("Range events require an ordered start and end.");
  if (value.eventId && value.relativeToEventId === value.eventId) issue("A timeline event cannot be relative to itself.");
  if (value.mode !== "RANGE" && value.sortEnd !== undefined) issue("Only range events may store a range end.");
  if (value.mode !== "RELATIVE" && (value.relativeToEventId || value.relativeOffset !== undefined)) issue("Only relative events may store a relative anchor.");
  if (value.mode !== "ORDINAL" && value.ordinalValue !== undefined) issue("Only ordinal events may store an ordinal value.");
});

export const timelineLinkSchema = z.object({ eventId: z.string().uuid(), targetType: z.enum(timelineLinkTargetTypes), targetId: z.string().uuid(), label: z.string().trim().max(160).optional() }).strict().superRefine((value, context) => {
  if (value.targetType === "TIMELINE_EVENT" && value.targetId === value.eventId) context.addIssue({ code: "custom", message: "An event cannot link to itself." });
});
export const timelineListSchema = z.object({ mode: z.enum(timelineModes).optional(), cursor: z.string().datetime().optional(), limit: z.coerce.number().int().min(1).max(100).default(50) }).strict();

export interface TimelineEventReadModel {
  id: string; title: string; description: string | null; mode: TimelineMode; displayLabel: string; calendarKey: string | null;
  sortStart: number | null; sortEnd: number | null; relativeToEventId: string | null; relativeOffset: number | null; ordinalValue: number | null;
  version: number; updatedAt: string; links: Array<{ id: string; targetType: TimelineLinkTargetType; targetId: string; label: string | null }>;
}
export function comparableCoordinate(event: Pick<TimelineEventReadModel, "mode" | "sortStart" | "ordinalValue">): number | null {
  if (event.mode === "ORDINAL") return event.ordinalValue;
  if (event.mode === "ABSOLUTE" || event.mode === "APPROXIMATE" || event.mode === "RANGE") return event.sortStart;
  return null;
}
