import { Prisma, type ContextCardType as PrismaContextCardType, type PrismaClient } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { errors } from "@/lib/contracts/errors";
import type { ContextRepository, ContextSnapshot } from "../application/ports";
import { activeContextCardTypes, type ContextCardType, type ContextQuery } from "../domain/types";

type Transaction = Prisma.TransactionClient;
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const activeTypeSet = new Set<string>(activeContextCardTypes);
const cardTypes = (value: unknown): ContextCardType[] => Array.isArray(value) ? value.filter((item): item is ContextCardType => typeof item === "string" && activeTypeSet.has(item)) : [];

async function ownedProject(tx: Transaction, actor: SessionActor, projectId: string, expectedStructuralVersion?: number) {
  const project = await tx.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE", ...(expectedStructuralVersion ? { structuralVersion: expectedStructuralVersion } : {}) }, select: { id: true, structuralVersion: true } });
  if (project) return project;
  const visible = await tx.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, status: "ACTIVE" }, select: { id: true } });
  if (visible && expectedStructuralVersion) throw errors.conflict("The source changed. Refresh the Contextual Writing Field before editing.");
  throw errors.notFound();
}

async function labels(tx: Transaction, projectId: string, endpoints: Array<{ type: string; id: string }>): Promise<Map<string, string>> {
  const result = new Map<string, string>(); const ids = (type: string) => [...new Set(endpoints.filter((endpoint) => endpoint.type === type).map((endpoint) => endpoint.id))];
  const [outlines, milestones, scenes, intents, changes, chapters] = await Promise.all([
    tx.chapterOutline.findMany({ where: { projectId, id: { in: ids("CHAPTER_OUTLINE") }, archivedAt: null }, select: { id: true, title: true } }),
    tx.milestone.findMany({ where: { projectId, id: { in: ids("MILESTONE") }, archivedAt: null }, select: { id: true, title: true } }),
    tx.scene.findMany({ where: { projectId, id: { in: ids("SCENE") }, archivedAt: null }, select: { id: true, title: true } }),
    tx.narrativeIntent.findMany({ where: { projectId, id: { in: ids("NARRATIVE_INTENT") }, archivedAt: null }, select: { id: true, intentText: true } }),
    tx.storyChange.findMany({ where: { projectId, id: { in: ids("STORY_CHANGE") }, archivedAt: null }, select: { id: true, title: true } }),
    tx.chapter.findMany({ where: { projectId, id: { in: [...ids("CHAPTER"), ...ids("MANUSCRIPT_BLOCK")] }, archivedAt: null }, select: { id: true, title: true } })
  ]);
  for (const row of outlines) result.set(`CHAPTER_OUTLINE:${row.id}`, row.title);
  for (const row of milestones) result.set(`MILESTONE:${row.id}`, row.title);
  for (const row of scenes) result.set(`SCENE:${row.id}`, row.title);
  for (const row of intents) result.set(`NARRATIVE_INTENT:${row.id}`, row.intentText);
  for (const row of changes) result.set(`STORY_CHANGE:${row.id}`, row.title);
  for (const row of chapters) { result.set(`CHAPTER:${row.id}`, row.title); result.set(`MANUSCRIPT_BLOCK:${row.id}`, row.title); }
  return result;
}

async function contextSourceExists(tx: Transaction, projectId: string, cardType: ContextCardType, sourceId: string): Promise<boolean> {
  if (cardType === "CHAPTER_OUTLINE") return Boolean(await tx.chapterOutline.findFirst({ where: { id: sourceId, projectId, archivedAt: null }, select: { id: true } }));
  if (cardType === "MILESTONE") return Boolean(await tx.milestone.findFirst({ where: { id: sourceId, projectId, archivedAt: null }, select: { id: true } }));
  if (cardType === "CAUSAL") return Boolean(await tx.causalRelation.findFirst({ where: { id: sourceId, projectId, archivedAt: null }, select: { id: true } }));
  if (cardType === "REFERENCE") return Boolean(await tx.storyReference.findFirst({ where: { id: sourceId, projectId, archivedAt: null }, select: { id: true } }));
  return Boolean(await tx.narrativeIntent.findFirst({ where: { id: sourceId, projectId, archivedAt: null }, select: { id: true } }));
}

export class PrismaContextRepository implements ContextRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async load(actor: SessionActor, chapterId: string, query: ContextQuery): Promise<ContextSnapshot | null> {
    return this.prisma.$transaction(async (tx) => {
      const chapter = await tx.chapter.findFirst({ where: { id: chapterId, archivedAt: null, project: { workspaceId: actor.workspaceId, status: "ACTIVE" } }, select: { id: true, version: true, projectId: true, project: { select: { structuralVersion: true } }, outline: { where: { archivedAt: null }, select: { id: true, title: true, purpose: true, emotionalMovement: true, plainText: true, version: true } } } });
      if (!chapter) return null;
      const [preference, pins, milestoneRows, referenceRows, intentRows] = await Promise.all([
        tx.contextPreference.findUnique({ where: { userId_projectId: { userId: actor.userId, projectId: chapter.projectId } }, select: { mutedTypes: true, directiveEnabled: true } }),
        tx.contextPin.findMany({ where: { userId: actor.userId, projectId: chapter.projectId }, orderBy: { createdAt: "asc" }, take: 100, select: { cardType: true, sourceId: true } }),
        tx.chapterMilestoneLink.findMany({ where: { projectId: chapter.projectId, chapterId, archivedAt: null, milestone: { archivedAt: null } }, orderBy: [{ weight: "desc" }, { createdAt: "asc" }], take: 50, select: { role: true, weight: true, milestone: { select: { id: true, title: true, description: true, version: true } } } }),
        tx.storyReference.findMany({ where: { projectId: chapter.projectId, archivedAt: null, OR: [{ sourceType: "CHAPTER", sourceId: chapterId }, { sourceType: "MANUSCRIPT_BLOCK", sourceId: chapterId }, { targetType: "CHAPTER", targetId: chapterId }, { targetType: "MANUSCRIPT_BLOCK", targetId: chapterId }] }, orderBy: { updatedAt: "desc" }, take: 50, select: { id: true, sourceType: true, sourceId: true, sourceBlockId: true, targetType: true, targetId: true, targetBlockId: true, relationshipKey: true, version: true } }),
        tx.narrativeIntent.findMany({ where: { projectId: chapter.projectId, archivedAt: null, OR: [{ targetType: "CHAPTER", targetId: chapterId }, { targetType: "PARAGRAPH_SELECTION", targetId: chapterId }] }, orderBy: { updatedAt: "desc" }, take: 50, select: { id: true, targetType: true, targetId: true, blockId: true, category: true, customCategory: true, intentText: true, version: true } })
      ]);
      const pinnedByType = (type: ContextCardType) => pins.filter((pin) => pin.cardType === type).map((pin) => pin.sourceId);
      const [extraOutlines, extraMilestones, extraReferences, extraIntents] = await Promise.all([
        tx.chapterOutline.findMany({ where: { projectId: chapter.projectId, id: { in: pinnedByType("CHAPTER_OUTLINE").filter((id) => id !== chapter.outline?.id) }, archivedAt: null }, take: 100, select: { id: true, title: true, purpose: true, emotionalMovement: true, plainText: true, version: true } }),
        tx.milestone.findMany({ where: { projectId: chapter.projectId, id: { in: pinnedByType("MILESTONE").filter((id) => !milestoneRows.some((row) => row.milestone.id === id)) }, archivedAt: null }, take: 100, select: { id: true, title: true, description: true, version: true } }),
        tx.storyReference.findMany({ where: { projectId: chapter.projectId, id: { in: pinnedByType("REFERENCE").filter((id) => !referenceRows.some((row) => row.id === id)) }, archivedAt: null }, take: 100, select: { id: true, sourceType: true, sourceId: true, sourceBlockId: true, targetType: true, targetId: true, targetBlockId: true, relationshipKey: true, version: true } }),
        tx.narrativeIntent.findMany({ where: { projectId: chapter.projectId, id: { in: pinnedByType("NARRATIVE_INTENT").filter((id) => !intentRows.some((row) => row.id === id)) }, archivedAt: null }, take: 100, select: { id: true, targetType: true, targetId: true, blockId: true, category: true, customCategory: true, intentText: true, version: true } })
      ]);
      const allMilestones = [...milestoneRows.map((row) => ({ id: row.milestone.id, title: row.milestone.title, description: row.milestone.description, role: row.role, weight: row.weight, version: row.milestone.version })), ...extraMilestones.map((row) => ({ ...row, role: "PINNED", weight: 0 }))];
      const allReferences = [...referenceRows, ...extraReferences]; const allIntents = [...intentRows, ...extraIntents];
      const outlineIds = [...new Set([...(chapter.outline ? [chapter.outline.id] : []), ...extraOutlines.map((row) => row.id)])];
      const milestoneIds = [...new Set(allMilestones.map((row) => row.id))];
      const anchors: Array<{ type: string; id: string; blockId?: string }> = [
        ...outlineIds.map((id) => ({ type: "CHAPTER_OUTLINE", id })), ...milestoneIds.map((id) => ({ type: "MILESTONE", id })),
        ...(query.cursorBlockId ? [{ type: "MANUSCRIPT_BLOCK", id: chapterId, blockId: query.cursorBlockId }] : []),
        ...(query.activeCausalType && query.activeCausalId ? [{ type: query.activeCausalType, id: query.activeCausalId, ...(query.activeCausalBlockId ? { blockId: query.activeCausalBlockId } : {}) }] : [])
      ];
      const causalOr = anchors.flatMap((anchor) => [{ sourceType: anchor.type as never, sourceId: anchor.id, sourceBlockId: anchor.blockId ?? null }, { targetType: anchor.type as never, targetId: anchor.id, targetBlockId: anchor.blockId ?? null }]);
      const causalRows = await tx.causalRelation.findMany({ where: { projectId: chapter.projectId, archivedAt: null, state: { in: ["ACTIVE", "TENTATIVE"] }, OR: [{ id: { in: pinnedByType("CAUSAL") } }, ...causalOr] }, orderBy: [{ importance: "desc" }, { updatedAt: "desc" }], take: 50, select: { id: true, sourceType: true, sourceId: true, sourceBlockId: true, targetType: true, targetId: true, targetBlockId: true, relationType: true, importance: true, version: true } });
      const allEndpoints = [...allReferences.map((row) => ({ type: String(row.targetType), id: row.targetId })), ...causalRows.flatMap((row) => [{ type: String(row.sourceType), id: row.sourceId }, { type: String(row.targetType), id: row.targetId }])];
      const labelMap = await labels(tx, chapter.projectId, allEndpoints);
      const anchorKey = new Set(anchors.map((anchor) => `${anchor.type}:${anchor.id}:${anchor.blockId ?? ""}`));
      const causal = causalRows.flatMap((row) => {
        const sourceKey = `${row.sourceType}:${row.sourceId}:${row.sourceBlockId ?? ""}`; const targetKey = `${row.targetType}:${row.targetId}:${row.targetBlockId ?? ""}`;
        const directions: ContextSnapshot["causal"] = [];
        if (anchorKey.has(targetKey) || pinnedByType("CAUSAL").includes(row.id)) directions.push({ id: row.id, relationType: row.relationType, direction: "UPSTREAM", endpointType: row.sourceType, endpointId: row.sourceId, endpointBlockId: row.sourceBlockId, endpointLabel: labelMap.get(`${row.sourceType}:${row.sourceId}`) ?? row.sourceType, anchorType: row.targetType, anchorId: row.targetId, anchorBlockId: row.targetBlockId, importance: row.importance, version: row.version });
        if (anchorKey.has(sourceKey)) directions.push({ id: row.id, relationType: row.relationType, direction: "DOWNSTREAM", endpointType: row.targetType, endpointId: row.targetId, endpointBlockId: row.targetBlockId, endpointLabel: labelMap.get(`${row.targetType}:${row.targetId}`) ?? row.targetType, anchorType: row.sourceType, anchorId: row.sourceId, anchorBlockId: row.sourceBlockId, importance: row.importance, version: row.version });
        return directions;
      });
      return {
        projectId: chapter.projectId, projectStructuralVersion: chapter.project.structuralVersion, chapterId, chapterVersion: chapter.version,
        outline: chapter.outline, extraOutlines,
        milestones: allMilestones,
        references: allReferences.map((row) => ({ ...row, sourceType: String(row.sourceType), targetType: String(row.targetType), targetLabel: labelMap.get(`${row.targetType}:${row.targetId}`) ?? String(row.targetType) })),
        causal,
        intents: allIntents.map((row) => ({ ...row, targetType: String(row.targetType), category: row.category ? String(row.category) : null })),
        pins: pins.map((pin) => ({ cardType: pin.cardType as ContextCardType, sourceId: pin.sourceId })),
        preferences: { mutedTypes: cardTypes(preference?.mutedTypes), directiveEnabled: preference?.directiveEnabled ?? true }
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 10_000 });
  }

  async mutatePreference(actor: SessionActor, projectId: string, mutation: { action: "PIN" | "UNPIN" | "MUTE" | "UNMUTE" | "SET_DIRECTIVE"; cardType?: ContextCardType; sourceId?: string; enabled?: boolean }) {
    return this.prisma.$transaction(async (tx) => {
      await ownedProject(tx, actor, projectId);
      const current = await tx.contextPreference.findUnique({ where: { userId_projectId: { userId: actor.userId, projectId } }, select: { mutedTypes: true, directiveEnabled: true } });
      const muted = new Set(cardTypes(current?.mutedTypes));
      if (mutation.action === "MUTE" && mutation.cardType) muted.add(mutation.cardType);
      if (mutation.action === "UNMUTE" && mutation.cardType) muted.delete(mutation.cardType);
      const preference = await tx.contextPreference.upsert({ where: { userId_projectId: { userId: actor.userId, projectId } }, create: { userId: actor.userId, projectId, mutedTypes: json([...muted]), directiveEnabled: mutation.action === "SET_DIRECTIVE" ? Boolean(mutation.enabled) : true }, update: { mutedTypes: json([...muted]), ...(mutation.action === "SET_DIRECTIVE" ? { directiveEnabled: Boolean(mutation.enabled) } : {}) }, select: { mutedTypes: true, directiveEnabled: true } });
      if (mutation.action === "PIN" && mutation.cardType && mutation.sourceId) {
        if (!await contextSourceExists(tx, projectId, mutation.cardType, mutation.sourceId)) throw errors.notFound();
        const existing = await tx.contextPin.findUnique({ where: { userId_projectId_cardType_sourceId: { userId: actor.userId, projectId, cardType: mutation.cardType as PrismaContextCardType, sourceId: mutation.sourceId } }, select: { id: true } });
        if (!existing && await tx.contextPin.count({ where: { userId: actor.userId, projectId } }) >= 100) throw errors.validation("A project may have at most 100 pinned context sources per user.");
        await tx.contextPin.upsert({ where: { userId_projectId_cardType_sourceId: { userId: actor.userId, projectId, cardType: mutation.cardType as PrismaContextCardType, sourceId: mutation.sourceId } }, create: { userId: actor.userId, projectId, cardType: mutation.cardType as PrismaContextCardType, sourceId: mutation.sourceId }, update: {} });
      }
      if (mutation.action === "UNPIN" && mutation.cardType && mutation.sourceId) await tx.contextPin.deleteMany({ where: { userId: actor.userId, projectId, cardType: mutation.cardType as PrismaContextCardType, sourceId: mutation.sourceId } });
      const pinCount = await tx.contextPin.count({ where: { userId: actor.userId, projectId } });
      return { mutedTypes: cardTypes(preference.mutedTypes), directiveEnabled: preference.directiveEnabled, pinCount };
    });
  }

  async editSource(actor: SessionActor, projectId: string, input: { sourceType: "CHAPTER_OUTLINE" | "NARRATIVE_INTENT"; sourceId: string; expectedVersion: number; expectedStructuralVersion: number; field: "purpose" | "intentText"; value: string }) {
    return this.prisma.$transaction(async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      let sourceVersion: number;
      if (input.sourceType === "CHAPTER_OUTLINE" && input.field === "purpose") {
        const current = await tx.chapterOutline.findFirst({ where: { id: input.sourceId, projectId, version: input.expectedVersion, archivedAt: null }, select: { id: true, version: true, purpose: true } }); if (!current) throw errors.conflict();
        await tx.objectRevision.create({ data: { projectId, objectType: "CHAPTER_OUTLINE", objectId: current.id, version: current.version, snapshot: json(current), reason: "context-inline-edit" } });
        const updated = await tx.chapterOutline.update({ where: { id: current.id }, data: { purpose: input.value || null, version: { increment: 1 } }, select: { version: true } }); sourceVersion = updated.version;
      } else if (input.sourceType === "NARRATIVE_INTENT" && input.field === "intentText") {
        const current = await tx.narrativeIntent.findFirst({ where: { id: input.sourceId, projectId, version: input.expectedVersion, archivedAt: null }, select: { id: true, version: true, intentText: true } }); if (!current) throw errors.conflict();
        await tx.objectRevision.create({ data: { projectId, objectType: "NARRATIVE_INTENT", objectId: current.id, version: current.version, snapshot: json(current), reason: "context-inline-edit" } });
        const updated = await tx.narrativeIntent.update({ where: { id: current.id }, data: { intentText: input.value, version: { increment: 1 } }, select: { version: true } }); sourceVersion = updated.version;
      } else throw errors.validation();
      const projectStructuralVersion = input.expectedStructuralVersion + 1;
      const bumped = await tx.project.updateMany({ where: { id: projectId, workspaceId: actor.workspaceId, structuralVersion: input.expectedStructuralVersion }, data: { structuralVersion: { increment: 1 } } }); if (bumped.count !== 1) throw errors.conflict();
      await tx.outboxEvent.create({ data: { workspaceId: actor.workspaceId, aggregateType: "Project", aggregateId: projectId, eventType: "context.source_updated", payload: { projectId, sourceType: input.sourceType, sourceId: input.sourceId, sourceVersion, structuralVersion: projectStructuralVersion } } });
      return { sourceId: input.sourceId, sourceVersion, projectStructuralVersion };
    });
  }
}
