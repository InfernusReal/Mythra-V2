import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { ChapterDocument } from "../domain/chapter-document";

export interface DraftSaveInput {
  baseVersion: number;
  clientSaveId: string;
  document: ChapterDocument;
}

export interface DraftSaveAcknowledgement {
  status: "SAVED";
  chapterId: string;
  version: number;
  clientSaveId: string;
  idempotentReplay: boolean;
  wordCount: number;
}

export interface DraftConflictReadModel {
  id: string;
  chapterId: string;
  baseVersion: number;
  serverVersion: number;
  localDocument: ChapterDocument;
  serverDocument: ChapterDocument;
  status: "OPEN" | "RESOLVED";
}

export type ConflictResolution = "KEEP_LOCAL" | "KEEP_SERVER" | "DUPLICATE_RECOVERY";

export interface ConflictResolutionResult {
  status: "RESOLVED";
  resolution: ConflictResolution;
  chapterId: string;
  version: number;
  recoveryChapterId?: string;
  document: ChapterDocument;
}

export interface DurabilityRepository {
  saveDraft(actor: SessionActor, chapterId: string, input: DraftSaveInput): Promise<DraftSaveAcknowledgement>;
  checkpoint(actor: SessionActor, chapterId: string, input: DraftSaveInput & { label?: string }): Promise<{ revisionId: string; version: number; idempotentReplay: boolean }>;
  getConflict(actor: SessionActor, conflictId: string): Promise<DraftConflictReadModel | null>;
  resolveConflict(actor: SessionActor, conflictId: string, resolution: ConflictResolution): Promise<ConflictResolutionResult>;
}
