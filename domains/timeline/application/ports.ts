import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { TimelineEventReadModel } from "../domain/types";

export interface TimelineRepository {
  list(actor: SessionActor, projectId: string, query: { mode?: string; cursor?: string; limit: number }): Promise<{ events: TimelineEventReadModel[]; nextCursor: string | null; projectStructuralVersion: number }>;
  write(actor: SessionActor, projectId: string, input: Record<string, unknown>): Promise<{ event: TimelineEventReadModel; projectStructuralVersion: number; invalidationKeys: string[] }>;
  link(actor: SessionActor, projectId: string, input: { eventId: string; targetType: string; targetId: string; label?: string }): Promise<{ linkId: string; replayed: boolean }>;
}
