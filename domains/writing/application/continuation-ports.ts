import type { SessionActor } from "@/domains/accounts/domain/identity";
import { z } from "zod";

export const contextPanelModes = ["CLOSED", "CONTEXT", "PINS"] as const;
export type ContextPanelMode = (typeof contextPanelModes)[number];

const boundedPosition = z.number().int().min(0).max(10_000_000).nullable();
export const writingPositionSchema = z.object({
  activeChapterId: z.string().uuid().nullable(),
  blockId: z.string().uuid().nullable(),
  cursorOffset: boundedPosition,
  selectionAnchor: boundedPosition,
  selectionHead: boundedPosition,
  scrollTop: boundedPosition,
  contextPanelMode: z.enum(contextPanelModes),
  pinIds: z.array(z.string().uuid()).max(50),
  capturedAt: z.string().datetime()
}).strict();
export type WritingPosition = z.infer<typeof writingPositionSchema>;

export interface ContinuationChapterSummary {
  id: string;
  title: string;
  sequenceIndex: number;
  wordCount: number;
  updatedAt: string;
}

export interface ProjectContinuationReadModel {
  project: { id: string; title: string };
  activeChapter: ContinuationChapterSummary | null;
  recentChapters: ContinuationChapterSummary[];
  session: WritingPosition;
}

export interface ContinuationRepository {
  getProjectContinuation(actor: SessionActor, projectId: string): Promise<ProjectContinuationReadModel | null>;
  saveWritingPosition(actor: SessionActor, projectId: string, position: WritingPosition): Promise<WritingPosition>;
}
