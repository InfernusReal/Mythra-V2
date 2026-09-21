import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { Logger } from "@/lib/observability/logger";
import { noteListSchema, notePromotionSchema, noteWriteSchema } from "../domain/types";
import type { NoteRepository } from "./ports";
export class NoteService {
  constructor(private readonly repository: NoteRepository, private readonly logger: Logger) {}
  async list(actor: SessionActor, projectId: string, raw: unknown, requestId: string) { const input = noteListSchema.parse(raw); const result = await this.repository.list(actor, projectId, input);
    // Console trace S11-NOTE-001: bounded durable Note retrieval logs filter/count metadata only and excludes private Note content/titles/tags.
    this.logger.info("note.page_loaded", { step: "S11-NOTE-001", requestId, workspaceId: actor.workspaceId, projectId, hasTagFilter: Boolean(input.tag), returned: result.notes.length, hasMore: Boolean(result.nextCursor) }); return result; }
  async write(actor: SessionActor, projectId: string, raw: unknown, requestId: string) { const input = noteWriteSchema.parse(raw); const result = await this.repository.write(actor, projectId, input);
    // Console trace S11-NOTE-002: durable Note mutation records identity/version/count metadata only.
    this.logger.info("note.written", { step: "S11-NOTE-002", requestId, workspaceId: actor.workspaceId, projectId, sourceId: result.note.id, version: result.note.version, tagCount: result.note.tags.length, hasSourceProvenance: Boolean(result.note.sourceCaptureId), replayed: Boolean(result.replayed) }); return result; }
  async promote(actor: SessionActor, projectId: string, raw: unknown, requestId: string) { const input = notePromotionSchema.parse(raw); const result = await this.repository.promote(actor, projectId, input);
    // Console trace S11-NOTE-003: idempotent Note promotion logs provenance/target identities only and never Note content.
    this.logger.info("note.promoted", { step: "S11-NOTE-003", requestId, workspaceId: actor.workspaceId, projectId, sourceId: input.noteId, targetType: result.targetType, targetId: result.targetId, replayed: result.replayed, structuralVersion: result.projectStructuralVersion }); return result; }
}
