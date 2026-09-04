import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { NoteReadModel } from "../domain/types";
export interface NoteRepository {
  list(actor: SessionActor, projectId: string, query: { tag?: string; cursor?: string; limit: number }): Promise<{ notes: NoteReadModel[]; nextCursor: string | null; projectStructuralVersion: number }>;
  write(actor: SessionActor, projectId: string, input: Record<string, unknown>): Promise<{ note: NoteReadModel; projectStructuralVersion: number; replayed?: boolean }>;
  promote(actor: SessionActor, projectId: string, input: { noteId: string; targetType: string; idempotencyKey: string; expectedStructuralVersion: number; title?: string }): Promise<{ promotionId: string; targetType: string; targetId: string; projectStructuralVersion: number; replayed: boolean }>;
}
