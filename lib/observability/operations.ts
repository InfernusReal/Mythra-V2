import { z } from "zod";
import { assertContentSafeRecord, type SafeOperationalRecord } from "@/lib/security/privacy";

export const operationalEventNames = [
  "writing.editor_writable", "writing.first_keystroke", "continuation.used", "navigation.route_changed",
  "context.peeked", "context.opened", "capture.opened", "search.returned", "recovery.incident",
  "session.writing", "session.editor_only", "causality.trace", "project.retained", "writing.save", "context.resolve",
  "search.request", "system.error", "conflict.detected", "job.completed", "outbox.lag", "backup.status",
  "database.saturation", "auth.failure", "storage.failure", "export.status", "intelligence.interest"
] as const;
export type OperationalEventName = typeof operationalEventNames[number];

const dimensionKeys = ["outcome", "status", "source", "action", "planKey", "intervalDays", "depthBand", "errorCode", "resource", "jobType", "stage", "regionKey", "featureFlag", "releaseVersion"] as const;
const dimensionValue = z.union([z.string().regex(/^[a-zA-Z0-9._:-]{1,80}$/), z.number().finite(), z.boolean(), z.null()]);
const dimensionsSchema = z.partialRecord(z.enum(dimensionKeys), dimensionValue);
export const operationalEventSchema = z.object({
  workspaceId: z.string().uuid(),
  actorUserId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  eventName: z.enum(operationalEventNames),
  routeKey: z.string().regex(/^\/[a-zA-Z0-9_/:.*-]{0,119}$/).optional(),
  durationMs: z.number().int().min(0).max(86_400_000).optional(),
  numericValue: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
  dimensions: dimensionsSchema.default({}),
  occurredAt: z.date().optional()
}).strict();
export const clientOperationalEventSchema = operationalEventSchema.omit({ workspaceId: true, actorUserId: true, occurredAt: true });
export type OperationalEventInput = z.input<typeof operationalEventSchema>;
export type OperationalEvent = z.output<typeof operationalEventSchema>;

export interface OperationalEventSink { record(input: OperationalEvent): Promise<void> }

export async function recordOperationalEvent(sink: OperationalEventSink, raw: OperationalEventInput): Promise<OperationalEvent> {
  const event = operationalEventSchema.parse(raw);
  assertContentSafeRecord(event.dimensions as SafeOperationalRecord);
  await sink.record(event);
  return event;
}

export class InMemoryOperationalEventSink implements OperationalEventSink {
  readonly events: OperationalEvent[] = [];
  async record(input: OperationalEvent): Promise<void> { this.events.push(structuredClone(input)); }
}
