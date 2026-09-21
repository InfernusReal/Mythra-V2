import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { BacklinksInput, ChapterOutlineInput, ChapterTextInput, MilestoneInput, TimelineWindowInput, ToolPermissionLevel, VolumeOutlineInput } from "../domain/contracts";

export interface AgentToolReadModel {
  authorize(actor: SessionActor, projectId: string): Promise<void>;
  getProjectMap(actor: SessionActor, projectId: string, perCollectionLimit: number): Promise<unknown>;
  getPlot(actor: SessionActor, projectId: string): Promise<unknown>;
  getVolumeOutline(actor: SessionActor, projectId: string, input: VolumeOutlineInput): Promise<unknown>;
  getMilestone(actor: SessionActor, projectId: string, input: MilestoneInput): Promise<unknown>;
  getChapterOutline(actor: SessionActor, projectId: string, input: ChapterOutlineInput): Promise<unknown>;
  getChapterText(actor: SessionActor, projectId: string, input: ChapterTextInput): Promise<unknown>;
  getTimelineWindow(actor: SessionActor, projectId: string, input: TimelineWindowInput): Promise<unknown>;
  getBacklinks(actor: SessionActor, projectId: string, input: BacklinksInput): Promise<unknown>;
  getStoryChange(actor: SessionActor, projectId: string, storyChangeId: string): Promise<unknown>;
}

export interface AgentToolAuditRepository {
  record(actor: SessionActor, projectId: string, input: { toolName: string; permission: ToolPermissionLevel; outcome: "SUCCESS" | "DENIED" | "FAILED"; correlationId: string; durationMs: number; errorCode?: string; resultCount?: number; truncated?: boolean }): Promise<void>;
}

export interface SearchToolReader { query(actor: SessionActor, projectId: string, raw: unknown, requestId: string): Promise<unknown> }
export interface UniverseToolReader { list(actor: SessionActor, projectId: string, raw: unknown, requestId: string): Promise<unknown>; detail(actor: SessionActor, projectId: string, entityId: string, requestId: string): Promise<unknown> }
export interface CausalityToolReader { getNeighborhood(actor: SessionActor, projectId: string, raw: unknown, requestId: string): Promise<unknown>; traceImpact(actor: SessionActor, projectId: string, raw: unknown, requestId: string): Promise<unknown> }
export interface NoteToolWriter { write(actor: SessionActor, projectId: string, raw: unknown, requestId: string): Promise<unknown> }
export interface CaptureToolWriter { create(actor: SessionActor, raw: unknown, requestId: string): Promise<unknown> }
export interface SuggestionToolService { create(actor: SessionActor, projectId: string, raw: unknown, requestId: string): Promise<unknown> }
