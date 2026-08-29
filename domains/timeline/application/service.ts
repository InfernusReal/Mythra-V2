import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { Logger } from "@/lib/observability/logger";
import { timelineEventWriteSchema, timelineLinkSchema, timelineListSchema } from "../domain/types";
import type { TimelineRepository } from "./ports";

export class TimelineService {
  constructor(private readonly repository: TimelineRepository, private readonly logger: Logger) {}
  async list(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const input = timelineListSchema.parse(raw); const result = await this.repository.list(actor, projectId, input);
    // Console trace S11-TIMELINE-001: bounded timeline retrieval logs filters/counts only and excludes authored labels/descriptions/time displays.
    this.logger.info("timeline.page_loaded", { step: "S11-TIMELINE-001", requestId, workspaceId: actor.workspaceId, projectId, hasModeFilter: Boolean(input.mode), returned: result.events.length, hasMore: Boolean(result.nextCursor) });
    return result;
  }
  async write(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const input = timelineEventWriteSchema.parse(raw); const result = await this.repository.write(actor, projectId, input);
    // Console trace S11-TIMELINE-002: timeline mutation logs mode/identity/version/invalidation metadata only.
    this.logger.info("timeline.event_written", { step: "S11-TIMELINE-002", requestId, workspaceId: actor.workspaceId, projectId, sourceId: result.event.id, mode: input.mode, version: result.event.version, structuralVersion: result.projectStructuralVersion, invalidationCount: result.invalidationKeys.length });
    return result;
  }
  async link(actor: SessionActor, projectId: string, raw: unknown, requestId: string) {
    const input = timelineLinkSchema.parse(raw); const result = await this.repository.link(actor, projectId, input);
    // Console trace S11-TIMELINE-003: explicit event link logs endpoint identities only; no chronology or causality is inferred.
    this.logger.info("timeline.link_written", { step: "S11-TIMELINE-003", requestId, workspaceId: actor.workspaceId, projectId, sourceId: input.eventId, targetType: input.targetType, targetId: input.targetId, replayed: result.replayed });
    return result;
  }
}
