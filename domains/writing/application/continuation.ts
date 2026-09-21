import { z } from "zod";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { Logger } from "@/lib/observability/logger";
import { writingPositionSchema, type ContinuationRepository, type ProjectContinuationReadModel, type WritingPosition } from "./continuation-ports";

export class ContinuationService {
  constructor(private readonly repository: ContinuationRepository, private readonly logger: Logger) {}

  async get(actor: SessionActor, projectId: string, requestId: string): Promise<ProjectContinuationReadModel | null> {
    const result = await this.repository.getProjectContinuation(actor, z.string().uuid().parse(projectId));
    // Console trace S3-CONTINUATION-001: bounded project continuation was resolved; titles and manuscript content are excluded.
    this.logger.info("continuation.read_model", { step: "S3-CONTINUATION-001", requestId, workspaceId: actor.workspaceId, projectId, found: Boolean(result), activeChapterId: result?.activeChapter?.id, recentChapterCount: result?.recentChapters.length ?? 0, panelMode: result?.session.contextPanelMode });
    return result;
  }

  async save(actor: SessionActor, projectId: string, input: unknown, requestId: string): Promise<WritingPosition> {
    const position = writingPositionSchema.parse(input);
    const result = await this.repository.saveWritingPosition(actor, z.string().uuid().parse(projectId), position);
    // Console trace S3-CONTINUATION-002: writing-position metadata was stored; document and selection text are excluded.
    this.logger.info("continuation.saved", { step: "S3-CONTINUATION-002", requestId, workspaceId: actor.workspaceId, projectId, activeChapterId: result.activeChapterId, blockId: result.blockId, cursorOffset: result.cursorOffset, anchorPos: result.selectionAnchor, headPos: result.selectionHead, scrollTop: result.scrollTop, panelMode: result.contextPanelMode, pinCount: result.pinIds.length, positionAt: result.capturedAt });
    return result;
  }
}
