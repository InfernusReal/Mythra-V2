import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { ActiveCaptureConversionType, CaptureConversionResult, CaptureLifecycle, CaptureSummary } from "../domain/types";

export interface CaptureRepository {
  create(actor: SessionActor, input: { clientCaptureId: string; projectId: string; rawText: string; route: string; chapterId?: string; outlineId?: string; blockId?: string; selectionAnchor?: number; selectionHead?: number; entityContext: string[]; capturedAt: string }): Promise<{ capture: CaptureSummary; projectStructuralVersion: number; replayed: boolean }>;
  get(actor: SessionActor, projectId: string, captureId: string): Promise<{ capture: CaptureSummary; projectStructuralVersion: number }>;
  list(actor: SessionActor, projectId: string, query: { lifecycle?: CaptureLifecycle; cursor?: string; limit: number; dueOnly: boolean }): Promise<{ captures: CaptureSummary[]; nextCursor: string | null; projectStructuralVersion: number }>;
  lifecycle(actor: SessionActor, projectId: string, input: { captureIds: string[]; action: "FILE" | "DEFER" | "DISMISS" | "RESTORE"; deferredUntil?: string }): Promise<{ updated: number }>;
  attach(actor: SessionActor, projectId: string, captureId: string, input: { targetType: "CHAPTER" | "CHAPTER_OUTLINE"; targetId: string; targetBlockId: string }): Promise<{ attachmentId: string; replayed: boolean }>;
  detach(actor: SessionActor, projectId: string, captureId: string, attachmentId: string): Promise<{ detached: boolean }>;
  convert(actor: SessionActor, projectId: string, captureId: string, input: { conversionType: ActiveCaptureConversionType; idempotencyKey: string; title?: string; targetId?: string; entityTypeId?: string; targetBlockId: string; expectedStructuralVersion: number }): Promise<CaptureConversionResult>;
}
