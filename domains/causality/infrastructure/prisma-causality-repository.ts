import { Prisma, type PrismaClient, type StructureObjectType } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { AppError, errors } from "@/lib/contracts/errors";
import { validateCausalChronology } from "../domain/chronology";
import { assertHardRequiresInvariant, traverseCausalGraph, type CausalEdge } from "../domain/graph";
import { createPrismaEndpointRegistry } from "./prisma-endpoint-adapters";
import type { CausalEndpoint, CausalProvenanceType, CausalRelationState, CausalRelationType } from "../domain/types";
import type { CausalEndpointProjection, CausalMutationResult, CausalOverview, CausalRelationSummary, CausalityRepository, StoryChangeSummary } from "../application/ports";

type Transaction = Prisma.TransactionClient;
type RelationRow = { id: string; sourceType: string; sourceId: string; sourceBlockId: string | null; targetType: string; targetId: string; targetBlockId: string | null; relationType: string; condition: string | null; strength: number; importance: number; state: string; isHard: boolean; temporalProgression: boolean; mutualStateSemantics: boolean; note: string | null; provenanceType: string; provenanceNote: string | null; version: number; archivedAt: Date | null };

function json(value: unknown): Prisma.InputJsonValue { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
function endpoint(type: string, id: string, blockId: string | null): CausalEndpoint { return { type, id, ...(blockId ? { blockId } : {}) } as CausalEndpoint; }
function relationSummary(row: RelationRow): CausalRelationSummary { return { id: row.id, source: endpoint(row.sourceType, row.sourceId, row.sourceBlockId), target: endpoint(row.targetType, row.targetId, row.targetBlockId), relationType: row.relationType as CausalRelationType, condition: row.condition, strength: row.strength, importance: row.importance, state: row.state as CausalRelationState, isHard: row.isHard, temporalProgression: row.temporalProgression, mutualStateSemantics: row.mutualStateSemantics, note: row.note, provenanceType: row.provenanceType as CausalProvenanceType, provenanceNote: row.provenanceNote, version: row.version, archivedAt: row.archivedAt?.toISOString() ?? null }; }
function changeSummary(row: { id: string; kind: string; title: string; description: string | null; storyTime: Prisma.Decimal | null; discoveryTime: Prisma.Decimal | null; anchorType: string | null; anchorId: string | null; anchorBlockId: string | null; isPlaceholder: boolean; version: number; archivedAt: Date | null }): StoryChangeSummary { return { id: row.id, kind: row.kind, title: row.title, description: row.description, storyTime: row.storyTime === null ? null : Number(row.storyTime), discoveryTime: row.discoveryTime === null ? null : Number(row.discoveryTime), anchor: row.anchorType && row.anchorId ? endpoint(row.anchorType, row.anchorId, row.anchorBlockId) : null, isPlaceholder: row.isPlaceholder, version: row.version, archivedAt: row.archivedAt?.toISOString() ?? null }; }
function edge(row: RelationRow): CausalEdge { const summary = relationSummary(row); return { id: summary.id, source: summary.source, target: summary.target, relationType: summary.relationType, state: summary.state, isHard: summary.isHard, temporalProgression: summary.temporalProgression, mutualStateSemantics: summary.mutualStateSemantics, provenanceType: summary.provenanceType, provenanceNote: summary.provenanceNote }; }

async function transaction<T>(prisma: PrismaClient, operation: (tx: Transaction) => Promise<T>): Promise<T> {
  try { return await prisma.$transaction(operation, { timeout: 60_000 }); }
  catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : null;
    if (code === "P2002" || code === "P2034") throw errors.conflict();
    if (code === "P2003" || code === "P2014") throw errors.integrity();
    throw error;
  }
}

async function ownedProject(tx: Transaction, actor: SessionActor, projectId: string, expected?: number) {
  const found = await tx.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE", ...(expected === undefined ? {} : { structuralVersion: expected }) }, select: { structuralVersion: true } });
  if (found) return found;
  if (expected !== undefined && await tx.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE" }, select: { id: true } })) throw errors.conflict();
  throw errors.notFound();
}

async function finish(tx: Transaction, actor: SessionActor, projectId: string, expected: number, eventType: string, objectType: string, objectId: string) {
  const update = await tx.project.updateMany({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE", structuralVersion: expected }, data: { structuralVersion: { increment: 1 } } });
  if (update.count !== 1) throw errors.conflict(); const structuralVersion = expected + 1;
  await tx.outboxEvent.create({ data: { workspaceId: actor.workspaceId, aggregateType: "Project", aggregateId: projectId, eventType, payload: { projectId, objectType, objectId, structuralVersion } } });
  return structuralVersion;
}

async function revise(tx: Transaction, projectId: string, objectType: StructureObjectType, objectId: string, version: number, snapshot: unknown, reason: string) { await tx.objectRevision.create({ data: { projectId, objectType, objectId, version, snapshot: json(snapshot), reason } }); }

const relationSelect = { id: true, sourceType: true, sourceId: true, sourceBlockId: true, targetType: true, targetId: true, targetBlockId: true, relationType: true, condition: true, strength: true, importance: true, state: true, isHard: true, temporalProgression: true, mutualStateSemantics: true, note: true, provenanceType: true, provenanceNote: true, version: true, archivedAt: true } as const;
const changeSelect = { id: true, kind: true, title: true, description: true, storyTime: true, discoveryTime: true, anchorType: true, anchorId: true, anchorBlockId: true, isPlaceholder: true, version: true, archivedAt: true } as const;

async function resolveUsable(tx: Transaction, projectId: string, value: CausalEndpoint) {
  const resolved = await createPrismaEndpointRegistry(tx).resolve(projectId, value);
  if (resolved.projectId !== projectId) throw errors.integrity();
  if (resolved.archived) throw errors.conflict("The selected causal endpoint is archived. Choose reattach, retire, or archive for existing evidence.");
  return resolved;
}

function duplicateWhere(projectId: string, input: { source: CausalEndpoint; target: CausalEndpoint; relationType: CausalRelationType }): Prisma.CausalRelationWhereInput { return { projectId, sourceType: input.source.type, sourceId: input.source.id, sourceBlockId: input.source.blockId ?? null, targetType: input.target.type, targetId: input.target.id, targetBlockId: input.target.blockId ?? null, relationType: input.relationType, state: "ACTIVE", archivedAt: null }; }
function endpointMatch(prefix: "source" | "target", value: CausalEndpoint): Prisma.CausalRelationWhereInput {
  return { [`${prefix}Type`]: value.type, [`${prefix}Id`]: value.id, [`${prefix}BlockId`]: value.blockId ?? null } as Prisma.CausalRelationWhereInput;
}

export class PrismaCausalityRepository implements CausalityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async assertProjectAccess(actor: SessionActor, projectId: string) { if (!await this.prisma.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE" }, select: { id: true } })) throw errors.notFound(); }

  async getOverview(actor: SessionActor, projectId: string, budget: { nodeBudget: number; edgeBudget: number }): Promise<CausalOverview | null> {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE" }, select: { structuralVersion: true } }); if (!project) return null;
    const perType = Math.ceil(budget.nodeBudget / 5) + 1;
    const [changesRaw, milestones, outlines, scenes, intents, relationsRaw] = await Promise.all([
      this.prisma.storyChange.findMany({ where: { projectId, archivedAt: null }, orderBy: { updatedAt: "desc" }, take: perType, select: changeSelect }),
      this.prisma.milestone.findMany({ where: { projectId, archivedAt: null }, orderBy: { sequenceIndex: "asc" }, take: perType, select: { id: true, title: true } }),
      this.prisma.chapterOutline.findMany({ where: { projectId, archivedAt: null }, orderBy: { sequenceIndex: "asc" }, take: perType, select: { id: true, title: true } }),
      this.prisma.scene.findMany({ where: { projectId, archivedAt: null }, orderBy: { sequenceIndex: "asc" }, take: perType, select: { id: true, title: true } }),
      this.prisma.narrativeIntent.findMany({ where: { projectId, archivedAt: null }, orderBy: { updatedAt: "desc" }, take: perType, select: { id: true, category: true, customCategory: true } }),
      this.prisma.causalRelation.findMany({ where: { projectId, archivedAt: null }, orderBy: { createdAt: "asc" }, take: budget.edgeBudget + 1, select: relationSelect })
    ]);
    const changes = changesRaw.map(changeSummary); const relations = relationsRaw.slice(0, budget.edgeBudget).map(relationSummary);
    const pools: CausalEndpointProjection[][] = [
      changes.map((item) => ({ type: "STORY_CHANGE", id: item.id, label: item.title, archived: false })),
      milestones.map((item) => ({ type: "MILESTONE", id: item.id, label: item.title, archived: false })),
      outlines.map((item) => ({ type: "CHAPTER_OUTLINE", id: item.id, label: item.title, archived: false })),
      scenes.map((item) => ({ type: "SCENE", id: item.id, label: item.title, archived: false })),
      intents.map((item) => ({ type: "NARRATIVE_INTENT", id: item.id, label: item.customCategory ?? item.category?.toLowerCase() ?? "Narrative intent", archived: false }))
    ];
    const projected: CausalEndpointProjection[] = [];
    for (let index = 0; projected.length < budget.nodeBudget && pools.some((pool) => index < pool.length); index += 1) for (const pool of pools) if (pool[index] && projected.length < budget.nodeBudget) projected.push(pool[index]!);
    const hasMoreNodes = pools.some((pool) => pool.length >= perType) || pools.reduce((sum, pool) => sum + pool.length, 0) > budget.nodeBudget;
    return { projectStructuralVersion: project.structuralVersion, storyChanges: changes.slice(0, budget.nodeBudget), relations, endpoints: projected, page: { ...budget, returnedNodes: projected.length, returnedEdges: relations.length, hasMoreNodes, hasMoreEdges: relationsRaw.length > budget.edgeBudget } };
  }

  async writeStoryChange(actor: SessionActor, projectId: string, input: Parameters<CausalityRepository["writeStoryChange"]>[2]) {
    return transaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion); if (input.anchor) await resolveUsable(tx, projectId, input.anchor);
      if (input.storyChangeId && !await tx.storyChange.findFirst({ where: { id: input.storyChangeId, projectId, archivedAt: null }, select: { id: true } })) throw errors.notFound();
      const data = { kind: input.kind as never, title: input.title, description: input.description ?? null, storyTime: input.storyTime === undefined ? null : new Prisma.Decimal(input.storyTime), discoveryTime: input.discoveryTime === undefined ? null : new Prisma.Decimal(input.discoveryTime), anchorType: input.anchor?.type ?? null, anchorId: input.anchor?.id ?? null, anchorBlockId: input.anchor?.blockId ?? null, isPlaceholder: input.isPlaceholder };
      const saved = input.storyChangeId ? await tx.storyChange.update({ where: { id: input.storyChangeId, projectId }, data: { ...data, version: { increment: 1 } }, select: changeSelect }) : await tx.storyChange.create({ data: { projectId, ...data }, select: changeSelect });
      const summary = changeSummary(saved); await revise(tx, projectId, "STORY_CHANGE", saved.id, saved.version, summary, input.storyChangeId ? "updated" : "created");
      return { object: summary, projectStructuralVersion: await finish(tx, actor, projectId, input.expectedStructuralVersion, "causality.story_change_changed", "STORY_CHANGE", saved.id) };
    });
  }

  async createRelation(actor: SessionActor, projectId: string, input: Parameters<CausalityRepository["createRelation"]>[2]): Promise<CausalMutationResult<CausalRelationSummary>> {
    const run = () => transaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion); await Promise.all([resolveUsable(tx, projectId, input.source), resolveUsable(tx, projectId, input.target)]);
      const duplicate = await tx.causalRelation.findFirst({ where: duplicateWhere(projectId, input), select: relationSelect });
      if (duplicate) return { object: relationSummary(duplicate), projectStructuralVersion: input.expectedStructuralVersion, idempotent: true };
      if (input.isHard && input.relationType === "REQUIRES" && input.state === "ACTIVE") {
        const existing = await tx.causalRelation.findMany({ where: { projectId, archivedAt: null, state: "ACTIVE", relationType: "REQUIRES", isHard: true }, take: 5_001, select: relationSelect });
        assertHardRequiresInvariant(existing.map(edge), { id: "candidate", source: input.source, target: input.target, relationType: input.relationType, state: input.state, isHard: true, temporalProgression: input.temporalProgression, mutualStateSemantics: input.mutualStateSemantics, provenanceType: input.provenanceType, provenanceNote: input.provenanceNote ?? null });
      }
      const saved = await tx.causalRelation.create({ data: { projectId, sourceType: input.source.type, sourceId: input.source.id, sourceBlockId: input.source.blockId, targetType: input.target.type, targetId: input.target.id, targetBlockId: input.target.blockId, relationType: input.relationType, condition: input.condition, strength: input.strength, importance: input.importance, state: input.state, isHard: input.isHard, temporalProgression: input.temporalProgression, mutualStateSemantics: input.mutualStateSemantics, note: input.note, provenanceType: input.provenanceType, provenanceNote: input.provenanceNote }, select: relationSelect });
      const summary = relationSummary(saved); await revise(tx, projectId, "CAUSAL_RELATION", saved.id, saved.version, summary, "created");
      return { object: summary, projectStructuralVersion: await finish(tx, actor, projectId, input.expectedStructuralVersion, "causality.relation_changed", "CAUSAL_RELATION", saved.id) };
    });
    try { return await run(); } catch (error) {
      if (!(error instanceof AppError) || error.code !== "CONFLICT") throw error;
      await this.assertProjectAccess(actor, projectId); const duplicate = await this.prisma.causalRelation.findFirst({ where: duplicateWhere(projectId, input), select: relationSelect });
      if (!duplicate) throw error; const project = await this.prisma.project.findUniqueOrThrow({ where: { id: projectId }, select: { structuralVersion: true } });
      return { object: relationSummary(duplicate), projectStructuralVersion: project.structuralVersion, idempotent: true };
    }
  }

  async lifecycleRelation(actor: SessionActor, projectId: string, input: Parameters<CausalityRepository["lifecycleRelation"]>[2]) {
    return transaction(this.prisma, async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      const existing = await tx.causalRelation.findFirst({ where: { id: input.relationId, projectId, archivedAt: null }, select: relationSelect }); if (!existing) throw errors.notFound();
      if (input.action === "REATTACH") {
        if (!input.source || !input.target) throw errors.validation(); await Promise.all([resolveUsable(tx, projectId, input.source), resolveUsable(tx, projectId, input.target)]);
        if (existing.isHard && existing.relationType === "REQUIRES" && existing.state === "ACTIVE") {
          const otherEdges = await tx.causalRelation.findMany({ where: { projectId, archivedAt: null, state: "ACTIVE", relationType: "REQUIRES", isHard: true, id: { not: existing.id } }, take: 5_001, select: relationSelect });
          assertHardRequiresInvariant(otherEdges.map(edge), { ...edge(existing), source: input.source, target: input.target });
        }
      }
      const saved = await tx.causalRelation.update({ where: { id: input.relationId, projectId }, data: input.action === "REATTACH" ? { sourceType: input.source!.type, sourceId: input.source!.id, sourceBlockId: input.source!.blockId ?? null, targetType: input.target!.type, targetId: input.target!.id, targetBlockId: input.target!.blockId ?? null, version: { increment: 1 } } : input.action === "RETIRE" ? { state: "RETIRED", version: { increment: 1 } } : { archivedAt: new Date(), version: { increment: 1 } }, select: relationSelect });
      const summary = relationSummary(saved); await revise(tx, projectId, "CAUSAL_RELATION", saved.id, saved.version, summary, input.action.toLowerCase());
      return { object: summary, projectStructuralVersion: await finish(tx, actor, projectId, input.expectedStructuralVersion, "causality.relation_lifecycle", "CAUSAL_RELATION", saved.id) };
    });
  }

  private async traversal(actor: SessionActor, projectId: string, input: Parameters<CausalityRepository["getNeighborhood"]>[2]) {
    await this.assertProjectAccess(actor, projectId); const registry = createPrismaEndpointRegistry(this.prisma); const rootResolved = await registry.resolve(projectId, input.endpoint);
    if (rootResolved.archived) throw errors.notFound();
    const rows: RelationRow[] = []; const rowIds = new Set<string>(); const visited = new Set<string>([`${input.endpoint.type}:${input.endpoint.id}:${input.endpoint.blockId ?? ""}`]); let frontier = [input.endpoint]; let queryOverflow = false;
    for (let depth = 0; depth < input.maxDepth && frontier.length && rows.length < input.edgeBudget && visited.size < input.nodeBudget; depth += 1) {
      const directionPredicates: Prisma.CausalRelationWhereInput[] = [];
      if (input.direction !== "UPSTREAM") directionPredicates.push(...frontier.map((item) => endpointMatch("source", item)));
      if (input.direction !== "DOWNSTREAM") directionPredicates.push(...frontier.map((item) => endpointMatch("target", item)));
      const remaining = input.edgeBudget - rows.length;
      const direct = await this.prisma.causalRelation.findMany({ where: { projectId, archivedAt: null, state: { in: input.states }, ...(input.relationTypes ? { relationType: { in: input.relationTypes } } : {}), OR: directionPredicates }, orderBy: { createdAt: "asc" }, take: remaining + 1, select: relationSelect });
      if (direct.length > remaining) queryOverflow = true;
      const frontierKeys = new Set(frontier.map((item) => `${item.type}:${item.id}:${item.blockId ?? ""}`)); const next: CausalEndpoint[] = [];
      for (const row of direct.slice(0, remaining)) {
        if (!rowIds.has(row.id)) { rowIds.add(row.id); rows.push(row); }
        const current = relationSummary(row); const sourceKey = `${current.source.type}:${current.source.id}:${current.source.blockId ?? ""}`; const targetKey = `${current.target.type}:${current.target.id}:${current.target.blockId ?? ""}`;
        const candidates: CausalEndpoint[] = [];
        if (input.direction !== "UPSTREAM" && frontierKeys.has(sourceKey)) candidates.push(current.target);
        if (input.direction !== "DOWNSTREAM" && frontierKeys.has(targetKey)) candidates.push(current.source);
        for (const candidate of candidates) { const key = `${candidate.type}:${candidate.id}:${candidate.blockId ?? ""}`; if (!visited.has(key)) { if (visited.size >= input.nodeBudget) { queryOverflow = true; break; } visited.add(key); next.push(candidate); } }
      }
      frontier = next;
    }
    if (frontier.length) queryOverflow = true;
    const traversed = traverseCausalGraph(rows.map(edge), input.endpoint, input); const projections = [];
    for (const path of traversed.paths) { const resolved = await registry.resolve(projectId, path.endpoint); projections.push({ ...path, endpoint: { ...path.endpoint, label: resolved.label, archived: resolved.archived } }); }
    return { root: { ...input.endpoint, label: rootResolved.label, archived: rootResolved.archived }, paths: projections, nodeCount: traversed.nodeCount, edgeCount: traversed.edgeCount, truncated: traversed.truncated || queryOverflow, language: "potentially affected" as const };
  }
  getNeighborhood(actor: SessionActor, projectId: string, input: Parameters<CausalityRepository["getNeighborhood"]>[2]) { return this.traversal(actor, projectId, input); }
  traceImpact(actor: SessionActor, projectId: string, input: Parameters<CausalityRepository["traceImpact"]>[2]) { return this.traversal(actor, projectId, input); }

  async validateChronology(actor: SessionActor, projectId: string, relationId: string) {
    await this.assertProjectAccess(actor, projectId); const row = await this.prisma.causalRelation.findFirst({ where: { id: relationId, projectId, archivedAt: null }, select: relationSelect }); if (!row) throw errors.notFound();
    const summary = relationSummary(row); const registry = createPrismaEndpointRegistry(this.prisma); const [source, target] = await Promise.all([registry.resolve(projectId, summary.source), registry.resolve(projectId, summary.target)]);
    return { relation: summary, chronology: validateCausalChronology(source, target, summary.relationType) };
  }
}
