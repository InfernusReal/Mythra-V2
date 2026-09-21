import { Prisma, type PrismaClient, type StructureObjectType } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { errors } from "@/lib/contracts/errors";
import { assertNoHardDependencyCycle } from "../domain/dependency";
import { weightedMilestoneProgress, type MilestoneScaffoldInput, type MilestoneScaffoldPlan } from "../domain/types";
import type { ChapterMilestoneLinkSummary, MilestoneDependencySummary, MilestoneOverview, MilestoneRepository, MilestoneSummary } from "../application/ports";

type Transaction = Prisma.TransactionClient;

function json(value: unknown): Prisma.InputJsonValue { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }

async function transaction<T>(prisma: PrismaClient, operation: (tx: Transaction) => Promise<T>): Promise<T> {
  try { return await prisma.$transaction(operation, { timeout: 60_000 }); }
  catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : null;
    if (code === "P2002" || code === "P2034") throw errors.conflict();
    if (code === "P2003" || code === "P2014") throw errors.integrity();
    throw error;
  }
}

async function ownedProject(tx: Transaction, actor: SessionActor, projectId: string, expectedStructuralVersion?: number) {
  const project = await tx.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE", ...(expectedStructuralVersion === undefined ? {} : { structuralVersion: expectedStructuralVersion }) }, select: { id: true, structuralVersion: true } });
  if (project) return project;
  const visible = await tx.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE" }, select: { id: true } });
  if (visible && expectedStructuralVersion !== undefined) throw errors.conflict();
  throw errors.notFound();
}

async function finish(tx: Transaction, actor: SessionActor, projectId: string, expected: number, eventType: string, objectType: string, objectId: string) {
  const updated = await tx.project.updateMany({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE", structuralVersion: expected }, data: { structuralVersion: { increment: 1 } } });
  if (updated.count !== 1) throw errors.conflict();
  const structuralVersion = expected + 1;
  await tx.outboxEvent.create({ data: { workspaceId: actor.workspaceId, aggregateType: "Project", aggregateId: projectId, eventType, payload: { projectId, objectType, objectId, structuralVersion } } });
  return structuralVersion;
}

async function revise(tx: Transaction, projectId: string, objectType: StructureObjectType, objectId: string, version: number, snapshot: unknown, reason: string) {
  await tx.objectRevision.create({ data: { projectId, objectType, objectId, version, snapshot: json(snapshot), reason } });
}

function dateValue(value: Date | null): string | null { return value ? value.toISOString().slice(0, 10) : null; }
function milestoneSummary(row: { id: string; sequenceIndex: number; title: string; description: string | null; threadLabel: string | null; targetChapterStart: number | null; targetChapterEnd: number | null; targetWords: number | null; targetDate: Date | null; status: string; isPlaceholder: boolean; version: number }, links: Array<{ weight: number; chapter: { status: string; wordCount: number; targetWords: number | null } }> = [], progressComplete = true): MilestoneSummary {
  const progress = weightedMilestoneProgress(links.map((link) => ({ weight: link.weight, ratio: link.chapter.status === "FINAL" ? 1 : link.chapter.targetWords ? link.chapter.wordCount / link.chapter.targetWords : 0 })));
  return { ...row, targetDate: dateValue(row.targetDate), progress, progressComplete, linkedChapterCount: links.length };
}
function linkSummary(row: { id: string; chapterId: string; milestoneId: string; role: string; customRole: string | null; weight: number; version: number }): ChapterMilestoneLinkSummary { return row; }
function dependencySummary(row: { id: string; sourceMilestoneId: string; targetMilestoneId: string; state: string; isHard: boolean; note: string | null; version: number }): MilestoneDependencySummary { return row; }

export class PrismaMilestoneRepository implements MilestoneRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async assertProjectAccess(actor: SessionActor, projectId: string): Promise<void> {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE" }, select: { id: true } });
    if (!project) throw errors.notFound();
  }

  async getOverview(actor: SessionActor, projectId: string, budget: { nodeBudget: number; edgeBudget: number }): Promise<MilestoneOverview | null> {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE" }, select: { id: true } });
    if (!project) return null;
    const milestonesRaw = await this.prisma.milestone.findMany({ where: { projectId, archivedAt: null }, orderBy: { sequenceIndex: "asc" }, take: budget.nodeBudget + 1, select: { id: true, sequenceIndex: true, title: true, description: true, threadLabel: true, targetChapterStart: true, targetChapterEnd: true, targetWords: true, targetDate: true, status: true, isPlaceholder: true, version: true } });
    const visibleMilestones = milestonesRaw.slice(0, budget.nodeBudget);
    const progressEdgeBudget = Math.min(50_000, Math.max(100, budget.nodeBudget * 100));
    const progressLinksRaw = visibleMilestones.length === 0 ? [] : await this.prisma.chapterMilestoneLink.findMany({ where: { projectId, milestoneId: { in: visibleMilestones.map((milestone) => milestone.id) }, archivedAt: null }, orderBy: { createdAt: "asc" }, take: progressEdgeBudget + 1, select: { milestoneId: true, weight: true, chapter: { select: { status: true, wordCount: true, targetWords: true } } } });
    const hasMoreProgressEdges = progressLinksRaw.length > progressEdgeBudget;
    const progressLinks = progressLinksRaw.slice(0, progressEdgeBudget);
    const progressByMilestone = new Map<string, typeof progressLinks>();
    for (const link of progressLinks) progressByMilestone.set(link.milestoneId, [...(progressByMilestone.get(link.milestoneId) ?? []), link]);
    const edgeTake = budget.edgeBudget + 1;
    const [linksRaw, dependenciesRaw] = await Promise.all([
      this.prisma.chapterMilestoneLink.findMany({ where: { projectId, archivedAt: null }, orderBy: { createdAt: "asc" }, take: edgeTake, select: { id: true, chapterId: true, milestoneId: true, role: true, customRole: true, weight: true, version: true } }),
      this.prisma.milestoneDependency.findMany({ where: { projectId, archivedAt: null }, orderBy: { createdAt: "asc" }, take: edgeTake, select: { id: true, sourceMilestoneId: true, targetMilestoneId: true, state: true, isHard: true, note: true, version: true } })
    ]);
    let remainingEdges = budget.edgeBudget;
    const links = linksRaw.slice(0, remainingEdges).map(linkSummary); remainingEdges -= links.length;
    const dependencies = dependenciesRaw.slice(0, remainingEdges).map(dependencySummary);
    return { milestones: visibleMilestones.map((row) => milestoneSummary(row, progressByMilestone.get(row.id) ?? [], !hasMoreProgressEdges)), links, dependencies, page: { ...budget, progressEdgeBudget, returnedNodes: Math.min(milestonesRaw.length, budget.nodeBudget), returnedEdges: links.length + dependencies.length, hasMoreNodes: milestonesRaw.length > budget.nodeBudget, hasMoreEdges: linksRaw.length > links.length || dependenciesRaw.length > dependencies.length, hasMoreProgressEdges } };
  }

  async createMilestone(actor: SessionActor, projectId: string, input: Parameters<MilestoneRepository["createMilestone"]>[2]) {
    return transaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      const created = await tx.milestone.create({ data: { projectId, sequenceIndex: input.sequenceIndex, title: input.title, description: input.description, threadLabel: input.threadLabel, targetChapterStart: input.targetChapterStart, targetChapterEnd: input.targetChapterEnd, targetWords: input.targetWords, targetDate: input.targetDate ? new Date(`${input.targetDate}T00:00:00.000Z`) : undefined, status: input.status, isPlaceholder: input.isPlaceholder }, select: { id: true, sequenceIndex: true, title: true, description: true, threadLabel: true, targetChapterStart: true, targetChapterEnd: true, targetWords: true, targetDate: true, status: true, isPlaceholder: true, version: true } });
      await revise(tx, projectId, "MILESTONE", created.id, created.version, created, "created");
      return { object: milestoneSummary(created), projectStructuralVersion: await finish(tx, actor, projectId, input.expectedStructuralVersion, "milestone.changed", "MILESTONE", created.id) };
    });
  }

  async updateMilestone(actor: SessionActor, projectId: string, input: Parameters<MilestoneRepository["updateMilestone"]>[2]) {
    return transaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      const found = await tx.milestone.findFirst({ where: { id: input.milestoneId, projectId, archivedAt: null }, select: { id: true } }); if (!found) throw errors.notFound();
      const saved = await tx.milestone.update({ where: { id: input.milestoneId }, data: { sequenceIndex: input.sequenceIndex, title: input.title, description: input.description ?? null, threadLabel: input.threadLabel ?? null, targetChapterStart: input.targetChapterStart ?? null, targetChapterEnd: input.targetChapterEnd ?? null, targetWords: input.targetWords ?? null, targetDate: input.targetDate ? new Date(`${input.targetDate}T00:00:00.000Z`) : null, status: input.status, isPlaceholder: input.isPlaceholder, version: { increment: 1 } }, select: { id: true, sequenceIndex: true, title: true, description: true, threadLabel: true, targetChapterStart: true, targetChapterEnd: true, targetWords: true, targetDate: true, status: true, isPlaceholder: true, version: true } });
      await revise(tx, projectId, "MILESTONE", saved.id, saved.version, saved, "updated");
      return { object: milestoneSummary(saved), projectStructuralVersion: await finish(tx, actor, projectId, input.expectedStructuralVersion, "milestone.changed", "MILESTONE", saved.id) };
    });
  }

  async linkChapter(actor: SessionActor, projectId: string, input: Parameters<MilestoneRepository["linkChapter"]>[2]) {
    return transaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      const [chapter, milestone] = await Promise.all([tx.chapter.findFirst({ where: { id: input.chapterId, projectId, archivedAt: null }, select: { id: true } }), tx.milestone.findFirst({ where: { id: input.milestoneId, projectId, archivedAt: null }, select: { id: true } })]);
      if (!chapter || !milestone) throw errors.notFound();
      const duplicate = await tx.chapterMilestoneLink.findFirst({ where: { projectId, chapterId: input.chapterId, milestoneId: input.milestoneId, role: input.role, customRole: input.customRole ?? null, archivedAt: null }, select: { id: true, chapterId: true, milestoneId: true, role: true, customRole: true, weight: true, version: true } });
      if (duplicate) return { object: linkSummary(duplicate), projectStructuralVersion: input.expectedStructuralVersion };
      const created = await tx.chapterMilestoneLink.create({ data: { projectId, chapterId: input.chapterId, milestoneId: input.milestoneId, role: input.role, customRole: input.customRole, weight: input.weight }, select: { id: true, chapterId: true, milestoneId: true, role: true, customRole: true, weight: true, version: true } });
      await revise(tx, projectId, "CHAPTER_MILESTONE_LINK", created.id, created.version, created, "created");
      return { object: linkSummary(created), projectStructuralVersion: await finish(tx, actor, projectId, input.expectedStructuralVersion, "milestone.chapter_linked", "CHAPTER_MILESTONE_LINK", created.id) };
    });
  }

  async writeDependency(actor: SessionActor, projectId: string, input: Parameters<MilestoneRepository["writeDependency"]>[2]) {
    return transaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      const endpoints = await tx.milestone.count({ where: { id: { in: [input.sourceMilestoneId, input.targetMilestoneId] }, projectId, archivedAt: null } }); if (endpoints !== 2) throw errors.notFound();
      if (input.dependencyId && !await tx.milestoneDependency.findFirst({ where: { id: input.dependencyId, projectId, archivedAt: null }, select: { id: true } })) throw errors.notFound();
      if (!input.dependencyId) {
        const duplicate = await tx.milestoneDependency.findFirst({ where: { projectId, sourceMilestoneId: input.sourceMilestoneId, targetMilestoneId: input.targetMilestoneId, isHard: input.isHard, state: { in: ["ACTIVE", "TENTATIVE"] }, archivedAt: null }, select: { id: true, sourceMilestoneId: true, targetMilestoneId: true, state: true, isHard: true, note: true, version: true } });
        if (duplicate) return { object: dependencySummary(duplicate), projectStructuralVersion: input.expectedStructuralVersion };
      }
      if (input.isHard && input.state === "ACTIVE") {
        const edges = await tx.milestoneDependency.findMany({ where: { projectId, archivedAt: null, isHard: true, state: "ACTIVE", ...(input.dependencyId ? { id: { not: input.dependencyId } } : {}) }, take: 5_001, select: { sourceMilestoneId: true, targetMilestoneId: true, isHard: true, state: true } });
        if (edges.length > 5_000) throw errors.dependencyUnavailable();
        assertNoHardDependencyCycle(edges, input.sourceMilestoneId, input.targetMilestoneId);
      }
      const saved = input.dependencyId ? await tx.milestoneDependency.update({ where: { id: input.dependencyId, projectId }, data: { sourceMilestoneId: input.sourceMilestoneId, targetMilestoneId: input.targetMilestoneId, state: input.state, isHard: input.isHard, note: input.note, version: { increment: 1 } }, select: { id: true, sourceMilestoneId: true, targetMilestoneId: true, state: true, isHard: true, note: true, version: true } }) : await tx.milestoneDependency.create({ data: { projectId, sourceMilestoneId: input.sourceMilestoneId, targetMilestoneId: input.targetMilestoneId, state: input.state, isHard: input.isHard, note: input.note }, select: { id: true, sourceMilestoneId: true, targetMilestoneId: true, state: true, isHard: true, note: true, version: true } });
      await revise(tx, projectId, "MILESTONE_DEPENDENCY", saved.id, saved.version, saved, input.dependencyId ? "updated" : "created");
      return { object: dependencySummary(saved), projectStructuralVersion: await finish(tx, actor, projectId, input.expectedStructuralVersion, "milestone.dependency_changed", "MILESTONE_DEPENDENCY", saved.id) };
    });
  }

  async reorderMilestones(actor: SessionActor, projectId: string, input: Parameters<MilestoneRepository["reorderMilestones"]>[2]) {
    return transaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      const current = await tx.milestone.findMany({ where: { projectId, archivedAt: null }, orderBy: { sequenceIndex: "asc" }, take: 501, select: { id: true, version: true, title: true, description: true, threadLabel: true, targetChapterStart: true, targetChapterEnd: true, targetWords: true, targetDate: true, status: true, isPlaceholder: true } });
      if (current.length > 500 || current.length !== input.orderedIds.length || new Set(input.orderedIds).size !== input.orderedIds.length || current.some((item) => !input.orderedIds.includes(item.id))) throw errors.conflict("The milestone order changed after preview.");
      for (let index = 0; index < input.orderedIds.length; index += 1) await tx.milestone.update({ where: { id: input.orderedIds[index]! }, data: { sequenceIndex: -1 - index } });
      for (let index = 0; index < input.orderedIds.length; index += 1) {
        const saved = await tx.milestone.update({ where: { id: input.orderedIds[index]! }, data: { sequenceIndex: index, version: { increment: 1 } }, select: { id: true, sequenceIndex: true, title: true, description: true, threadLabel: true, targetChapterStart: true, targetChapterEnd: true, targetWords: true, targetDate: true, status: true, isPlaceholder: true, version: true } });
        await revise(tx, projectId, "MILESTONE", saved.id, saved.version, saved, "reordered");
      }
      return { object: { orderedIds: input.orderedIds }, projectStructuralVersion: await finish(tx, actor, projectId, input.expectedStructuralVersion, "milestone.reordered", "MILESTONE", projectId) };
    });
  }

  async applyScaffold(actor: SessionActor, projectId: string, input: MilestoneScaffoldInput, plan: MilestoneScaffoldPlan) {
    return transaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      const existing = await tx.milestone.findMany({ where: { projectId, archivedAt: null }, orderBy: { sequenceIndex: "asc" }, select: { id: true } });
      if (existing.length && existing.length !== plan.allocations.length) throw errors.conflict("The milestone preview no longer matches the current count.");
      const milestones = existing.length ? await Promise.all(plan.allocations.map((allocation, index) => tx.milestone.update({ where: { id: existing[index]!.id }, data: { targetChapterStart: allocation.chapterStart - 1, targetChapterEnd: allocation.chapterEnd - 1, targetWords: allocation.targetWords, targetDate: allocation.targetDate ? new Date(`${allocation.targetDate}T00:00:00.000Z`) : null, version: { increment: 1 } }, select: { id: true, sequenceIndex: true, title: true, description: true, threadLabel: true, targetChapterStart: true, targetChapterEnd: true, targetWords: true, targetDate: true, status: true, isPlaceholder: true, version: true } }))) : await Promise.all(plan.allocations.map((allocation) => tx.milestone.create({ data: { projectId, sequenceIndex: allocation.sequenceIndex, title: `Milestone ${allocation.sequenceIndex + 1}`, targetChapterStart: allocation.chapterStart - 1, targetChapterEnd: allocation.chapterEnd - 1, targetWords: allocation.targetWords ?? undefined, targetDate: allocation.targetDate ? new Date(`${allocation.targetDate}T00:00:00.000Z`) : undefined, isPlaceholder: true }, select: { id: true, sequenceIndex: true, title: true, description: true, threadLabel: true, targetChapterStart: true, targetChapterEnd: true, targetWords: true, targetDate: true, status: true, isPlaceholder: true, version: true } })));
      for (const milestone of milestones) await revise(tx, projectId, "MILESTONE", milestone.id, milestone.version, milestone, existing.length ? "scaffold_rebalanced" : "scaffold_created");
      const structuralVersion = await finish(tx, actor, projectId, input.expectedStructuralVersion, "milestone.scaffold_applied", "MILESTONE", projectId);
      return { object: { milestoneIds: milestones.map((item) => item.id), placeholderCount: existing.length ? 0 : milestones.length }, projectStructuralVersion: structuralVersion };
    });
  }
}
