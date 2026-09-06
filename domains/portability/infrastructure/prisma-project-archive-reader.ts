import type { Prisma, PrismaClient } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { errors } from "@/lib/contracts/errors";
import { MYTHRA_REPRESENTATION_VERSION, archiveCollectionNames, normalizeJson, type JsonRecord, type ProjectArchive } from "../domain/representations";

const COLLECTION_LIMIT = 100_000;
const TOTAL_RECORD_LIMIT = 250_000;

function records(value: unknown): JsonRecord[] { return normalizeJson(value) as JsonRecord[]; }

export class PrismaProjectArchiveReader {
  constructor(private readonly prisma: PrismaClient) {}

  async build(actor: SessionActor, projectId: string, generatedAt: Date): Promise<ProjectArchive> {
    return this.prisma.$transaction((tx) => this.buildSnapshot(tx, actor, projectId, generatedAt), { isolationLevel: "RepeatableRead", maxWait: 5000, timeout: 30000 });
  }

  private async buildSnapshot(prisma: Prisma.TransactionClient, actor: SessionActor, projectId: string, generatedAt: Date): Promise<ProjectArchive> {
    const project = await prisma.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId }, select: { id: true, workspaceId: true, title: true, description: true, status: true, structuralVersion: true, activeChapterId: true, createdAt: true, updatedAt: true, archivedAt: true } });
    if (!project) throw errors.notFound();
    const take = COLLECTION_LIMIT + 1;
    const [chapters, chapterRevisions, plot, plotOutlines, volumes, volumeOutlines, chapterOutlines, scenes, narrativeIntents, storyReferences, objectRevisions, milestones, chapterMilestoneLinks, milestoneDependencies, storyChanges, causalRelations, captures, captureAttachments, captureConversions, captureRevisions, entityTypes, entityFieldDefinitions, storyEntities, entityFieldValues, relationTypes, entityRelations, entityStateSnapshots, entityRevisions, timelineEvents, timelineEventLinks, notes, notePromotions, researchItems, researchItemLinks, storedAssets] = await Promise.all([
      prisma.chapter.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.chapterRevision.findMany({ where: { chapter: { projectId } }, orderBy: { id: "asc" }, take }),
      prisma.plot.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.plotOutline.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.volume.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.volumeOutline.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.chapterOutline.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.scene.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.narrativeIntent.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.storyReference.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.objectRevision.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.milestone.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.chapterMilestoneLink.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.milestoneDependency.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.storyChange.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.causalRelation.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.capture.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.captureAttachment.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.captureConversion.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.captureRevision.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.entityType.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.entityFieldDefinition.findMany({ where: { entityType: { projectId } }, orderBy: { id: "asc" }, take }),
      prisma.storyEntity.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.entityFieldValue.findMany({ where: { entity: { projectId } }, orderBy: { id: "asc" }, take }),
      prisma.relationType.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.entityRelation.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.entityStateSnapshot.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.entityRevision.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.timelineEvent.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.timelineEventLink.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.note.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.notePromotion.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.researchItem.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.researchItemLink.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      prisma.storedAsset.findMany({ where: { projectId }, orderBy: { id: "asc" }, take })
    ]);
    const source = { chapters, chapterRevisions, plot, plotOutlines, volumes, volumeOutlines, chapterOutlines, scenes, narrativeIntents, storyReferences, objectRevisions, milestones, chapterMilestoneLinks, milestoneDependencies, storyChanges, causalRelations, captures, captureAttachments, captureConversions, captureRevisions, entityTypes, entityFieldDefinitions, storyEntities, entityFieldValues, relationTypes, entityRelations, entityStateSnapshots, entityRevisions, timelineEvents, timelineEventLinks, notes, notePromotions, researchItems, researchItemLinks, storedAssets };
    let total = 0;
    for (const name of archiveCollectionNames) {
      const collection = source[name]; total += collection.length;
      if (collection.length > COLLECTION_LIMIT) throw errors.validation(`Archive collection exceeds the ${COLLECTION_LIMIT} record bound.`);
    }
    if (total > TOTAL_RECORD_LIMIT) throw errors.validation(`Archive exceeds the ${TOTAL_RECORD_LIMIT} record bound.`);
    // Console trace S18-ARCHIVE-001: consistent archive completion records counts and version only, excluding all project content.
    console.log(JSON.stringify({ level: "info", step: "S18-ARCHIVE-001", event: "archive.snapshot_read", structuralVersion: project.structuralVersion, collectionCount: archiveCollectionNames.length, recordCount: total }));
    const manuscriptMarkdown = chapters.sort((left, right) => left.sequenceIndex - right.sequenceIndex).map((chapter) => `# ${chapter.title}\n\n${chapter.bodyText}`).join("\n\n");
    return { representation: "mythra.project-archive", representationVersion: MYTHRA_REPRESENTATION_VERSION, generatedAt: generatedAt.toISOString(), project: normalizeJson(project) as JsonRecord, collections: Object.fromEntries(archiveCollectionNames.map((name) => [name, records(source[name])])) as ProjectArchive["collections"], manuscriptMarkdown };
  }
}
