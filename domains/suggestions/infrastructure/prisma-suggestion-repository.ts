import { Prisma, type PrismaClient, type SuggestionStatus as PrismaSuggestionStatus } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { errors } from "@/lib/contracts/errors";
import { encodeSuggestionCursor, type EvidenceReference, type ProposedAction, type SuggestionCreateInput, type SuggestionReadModel, type SuggestionResolveInput, type SuggestionStatus } from "../domain/types";
import type { SuggestionRepository } from "../application/ports";

type Transaction = Prisma.TransactionClient;
const statusToDatabase: Record<SuggestionStatus, PrismaSuggestionStatus> = { open: "OPEN", accepted: "ACCEPTED", modified: "MODIFIED", rejected: "REJECTED", intentional: "INTENTIONAL" };
const statusFromDatabase = (status: PrismaSuggestionStatus): SuggestionStatus => status.toLocaleLowerCase("en") as SuggestionStatus;
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

const select = { id: true, projectId: true, sourceAgent: true, category: true, targetType: true, targetId: true, sourceBlockId: true, finding: true, evidenceReferences: true, proposedActions: true, confidence: true, status: true, authorNote: true, version: true, createdAt: true, updatedAt: true, resolvedAt: true } as const;
type SuggestionRow = Prisma.SuggestionGetPayload<{ select: typeof select }>;

function view(row: SuggestionRow): SuggestionReadModel {
  return { ...row, evidenceReferences: row.evidenceReferences as unknown as EvidenceReference[], proposedActions: row.proposedActions as unknown as ProposedAction[], status: statusFromDatabase(row.status), createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), resolvedAt: row.resolvedAt?.toISOString() ?? null };
}

async function assertOwnedProject(tx: Transaction, actor: SessionActor, projectId: string) {
  const project = await tx.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE", workspace: { archivedAt: null, members: { some: { userId: actor.userId, status: "ACTIVE" } } } }, select: { id: true } });
  if (!project) throw errors.notFound();
}

export class PrismaSuggestionRepository implements SuggestionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(actor: SessionActor, projectId: string, input: SuggestionCreateInput, correlationId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await assertOwnedProject(tx, actor, projectId);
        const replay = await tx.suggestion.findUnique({ where: { projectId_sourceAgent_idempotencyKey: { projectId, sourceAgent: input.sourceAgent, idempotencyKey: input.idempotencyKey } }, select });
        if (replay) return { suggestion: view(replay), replayed: true };
        const row = await tx.suggestion.create({ data: { workspaceId: actor.workspaceId, projectId, createdByUserId: actor.userId, sourceAgent: input.sourceAgent, idempotencyKey: input.idempotencyKey, category: input.category, targetType: input.targetType, targetId: input.targetId, sourceBlockId: input.sourceBlockId, finding: input.finding, evidenceReferences: json(input.evidenceReferences), proposedActions: json(input.proposedActions), confidence: input.confidence }, select });
        await tx.auditEvent.create({ data: { workspaceId: actor.workspaceId, actorUserId: actor.userId, kind: "SUGGESTION_CHANGE", targetType: "Suggestion", targetId: row.id, correlationId, safeMetadata: { action: "CREATED", category: input.category, evidenceCount: input.evidenceReferences.length, proposedActionCount: input.proposedActions.length, hasTarget: Boolean(input.targetId), hasConfidence: input.confidence !== undefined } } });
        return { suggestion: view(row), replayed: false };
      });
    } catch (caught) {
      if (caught instanceof Prisma.PrismaClientKnownRequestError && caught.code === "P2002") {
        const concurrentWinner = await this.prisma.suggestion.findFirst({
          where: { projectId, workspaceId: actor.workspaceId, sourceAgent: input.sourceAgent, idempotencyKey: input.idempotencyKey, project: { status: "ACTIVE", workspace: { archivedAt: null, members: { some: { userId: actor.userId, status: "ACTIVE" } } } } },
          select,
        });
        if (concurrentWinner) return { suggestion: view(concurrentWinner), replayed: true };
      }
      throw caught;
    }
  }

  async get(actor: SessionActor, projectId: string, suggestionId: string) {
    const row = await this.prisma.suggestion.findFirst({ where: { id: suggestionId, projectId, workspaceId: actor.workspaceId, project: { status: "ACTIVE" }, workspace: { archivedAt: null, members: { some: { userId: actor.userId, status: "ACTIVE" } } } }, select });
    if (!row) throw errors.notFound();
    return view(row);
  }

  async list(actor: SessionActor, projectId: string, query: Parameters<SuggestionRepository["list"]>[2]) {
    return this.prisma.$transaction(async (tx) => {
      await assertOwnedProject(tx, actor, projectId);
      const rows = await tx.suggestion.findMany({ where: { projectId, workspaceId: actor.workspaceId, ...(query.status ? { status: statusToDatabase[query.status] } : {}), ...(query.sourceAgent ? { sourceAgent: query.sourceAgent } : {}), ...(query.cursor ? { OR: [{ createdAt: { lt: query.cursor.createdAt } }, { createdAt: query.cursor.createdAt, id: { lt: query.cursor.id } }] } : {}) }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: query.limit + 1, select });
      const page = rows.slice(0, query.limit);
      const last = page.at(-1);
      return { suggestions: page.map(view), nextCursor: rows.length > query.limit && last ? encodeSuggestionCursor(last.createdAt.toISOString(), last.id) : null };
    });
  }

  async resolve(actor: SessionActor, projectId: string, suggestionId: string, input: SuggestionResolveInput, correlationId: string) {
    return this.prisma.$transaction(async (tx) => {
      await assertOwnedProject(tx, actor, projectId);
      const updated = await tx.suggestion.updateMany({ where: { id: suggestionId, projectId, workspaceId: actor.workspaceId, status: "OPEN", version: input.expectedVersion }, data: { status: statusToDatabase[input.status], authorNote: input.authorNote ?? null, resolvedByUserId: actor.userId, resolvedAt: new Date(), version: { increment: 1 } } });
      if (updated.count !== 1) {
        const visible = await tx.suggestion.findFirst({ where: { id: suggestionId, projectId, workspaceId: actor.workspaceId }, select: { id: true } });
        if (!visible) throw errors.notFound();
        throw errors.conflict("The suggestion was already resolved or changed. Refresh before deciding again.");
      }
      const row = await tx.suggestion.findUniqueOrThrow({ where: { id: suggestionId }, select });
      await tx.auditEvent.create({ data: { workspaceId: actor.workspaceId, actorUserId: actor.userId, kind: "SUGGESTION_CHANGE", targetType: "Suggestion", targetId: row.id, correlationId, safeMetadata: { action: "RESOLVED", status: input.status, version: row.version, hasAuthorNote: input.authorNote !== undefined, canonicalMutationCount: 0 } } });
      return view(row);
    });
  }
}
