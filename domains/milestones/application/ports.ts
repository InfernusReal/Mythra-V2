import type { SessionActor } from "@/domains/accounts/domain/identity";
import type { MilestoneScaffoldInput, MilestoneScaffoldPlan } from "../domain/types";

export interface MilestoneSummary { id: string; sequenceIndex: number; title: string; description: string | null; threadLabel: string | null; targetChapterStart: number | null; targetChapterEnd: number | null; targetWords: number | null; targetDate: string | null; status: string; isPlaceholder: boolean; version: number; progress: number; progressComplete: boolean; linkedChapterCount: number }
export interface ChapterMilestoneLinkSummary { id: string; chapterId: string; milestoneId: string; role: string; customRole: string | null; weight: number; version: number }
export interface MilestoneDependencySummary { id: string; sourceMilestoneId: string; targetMilestoneId: string; state: string; isHard: boolean; note: string | null; version: number }
export interface MilestoneOverview { milestones: MilestoneSummary[]; links: ChapterMilestoneLinkSummary[]; dependencies: MilestoneDependencySummary[]; page: { nodeBudget: number; edgeBudget: number; progressEdgeBudget: number; returnedNodes: number; returnedEdges: number; hasMoreNodes: boolean; hasMoreEdges: boolean; hasMoreProgressEdges: boolean } }
export interface MilestoneMutationResult<T> { object: T; projectStructuralVersion: number }

export interface MilestoneRepository {
  assertProjectAccess(actor: SessionActor, projectId: string): Promise<void>;
  getOverview(actor: SessionActor, projectId: string, budget: { nodeBudget: number; edgeBudget: number }): Promise<MilestoneOverview | null>;
  createMilestone(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; sequenceIndex: number; title: string; description?: string; threadLabel?: string; targetChapterStart?: number; targetChapterEnd?: number; targetWords?: number; targetDate?: string; status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED"; isPlaceholder: boolean }): Promise<MilestoneMutationResult<MilestoneSummary>>;
  updateMilestone(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; milestoneId: string; sequenceIndex: number; title: string; description?: string; threadLabel?: string; targetChapterStart?: number; targetChapterEnd?: number; targetWords?: number; targetDate?: string; status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED"; isPlaceholder: boolean }): Promise<MilestoneMutationResult<MilestoneSummary>>;
  linkChapter(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; chapterId: string; milestoneId: string; role: "INTRODUCE" | "DEVELOP" | "ESCALATE" | "TURN" | "RESOLVE" | "CUSTOM"; customRole?: string; weight: number }): Promise<MilestoneMutationResult<ChapterMilestoneLinkSummary>>;
  writeDependency(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; dependencyId?: string; sourceMilestoneId: string; targetMilestoneId: string; state: "ACTIVE" | "TENTATIVE" | "RETIRED"; isHard: boolean; note?: string }): Promise<MilestoneMutationResult<MilestoneDependencySummary>>;
  reorderMilestones(actor: SessionActor, projectId: string, input: { expectedStructuralVersion: number; orderedIds: string[] }): Promise<MilestoneMutationResult<{ orderedIds: string[] }>>;
  applyScaffold(actor: SessionActor, projectId: string, input: MilestoneScaffoldInput, plan: MilestoneScaffoldPlan): Promise<MilestoneMutationResult<{ milestoneIds: string[]; placeholderCount: number }>>;
}
