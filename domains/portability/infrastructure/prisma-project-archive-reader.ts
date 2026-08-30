import type { PrismaClient } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { errors } from "@/lib/contracts/errors";
import { MYTHRA_REPRESENTATION_VERSION, archiveCollectionNames, normalizeJson, type JsonRecord, type ProjectArchive } from "../domain/representations";

const COLLECTION_LIMIT = 100_000;
const TOTAL_RECORD_LIMIT = 250_000;

function records(value: unknown): JsonRecord[] { return normalizeJson(value) as JsonRecord[]; }

export class PrismaProjectArchiveReader {
  constructor(private readonly prisma: PrismaClient) {}

  async build(actor: SessionActor, projectId: string, generatedAt: Date): Promise<ProjectArchive> {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId }, select: { id: true, workspaceId: true, title: true, description: true, status: true, structuralVersion: true, activeChapterId: true, createdAt: true, updatedAt: true, archivedAt: true } });
    if (!project) throw errors.notFound();
    const take = COLLECTION_LIMIT + 1;
    const [chapters, chapterRevisions, plot, plotOutlines, volumes, volumeOutlines, chapterOutlines, scenes, narrativeIntents, storyReferences, objectRevisions, milestones, chapterMilestoneLinks, milestoneDependencies, storyChanges, causalRelations, captures, captureAttachments, captureConversions, captureRevisions, entityTypes, entityFieldDefinitions, storyEntities, entityFieldValues, relationTypes, entityRelations, entityStateSnapshots, entityRevisions, timelineEvents, timelineEventLinks, notes, notePromotions, researchItems, researchItemLinks, storedAssets] = await Promise.all([
      this.prisma.chapter.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.chapterRevision.findMany({ where: { chapter: { projectId } }, orderBy: { id: "asc" }, take }),
      this.prisma.plot.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.plotOutline.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.volume.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.volumeOutline.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.chapterOutline.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.scene.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.narrativeIntent.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.storyReference.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.objectRevision.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.milestone.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.chapterMilestoneLink.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.milestoneDependency.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.storyChange.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.causalRelation.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.capture.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.captureAttachment.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.captureConversion.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.captureRevision.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.entityType.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.entityFieldDefinition.findMany({ where: { entityType: { projectId } }, orderBy: { id: "asc" }, take }),
      this.prisma.storyEntity.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.entityFieldValue.findMany({ where: { entity: { projectId } }, orderBy: { id: "asc" }, take }),
      this.prisma.relationType.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.entityRelation.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.entityStateSnapshot.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.entityRevision.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.timelineEvent.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.timelineEventLink.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.note.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.notePromotion.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.researchItem.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.researchItemLink.findMany({ where: { projectId }, orderBy: { id: "asc" }, take }),
      this.prisma.storedAsset.findMany({ where: { projectId }, orderBy: { id: "asc" }, take })
    ]);
    const source = { chapters, chapterRevisions, plot, plotOutlines, volumes, volumeOutlines, chapterOutlines, scenes, narrativeIntents, storyReferences, objectRevisions, milestones, chapterMilestoneLinks, milestoneDependencies, storyChanges, causalRelations, captures, captureAttachments, captureConversions, captureRevisions, entityTypes, entityFieldDefinitions, storyEntities, entityFieldValues, relationTypes, entityRelations, entityStateSnapshots, entityRevisions, timelineEvents, timelineEventLinks, notes, notePromotions, researchItems, researchItemLinks, storedAssets };
    let total = 0;
    for (const name of archiveCollectionNames) {
      const collection = source[name]; total += collection.length;
      if (collection.length > COLLECTION_LIMIT) throw errors.validation(`Archive collection exceeds the ${COLLECTION_LIMIT} record bound.`);
    }
    if (total > TOTAL_RECORD_LIMIT) throw errors.validation(`Archive exceeds the ${TOTAL_RECORD_LIMIT} record bound.`);
    const manuscriptMarkdown = chapters.sort((left, right) => left.sequenceIndex - right.sequenceIndex).map((chapter) => `# ${chapter.title}\n\n${chapter.bodyText}`).join("\n\n");
    return { representation: "mythra.project-archive", representationVersion: MYTHRA_REPRESENTATION_VERSION, generatedAt: generatedAt.toISOString(), project: normalizeJson(project) as JsonRecord, collections: Object.fromEntries(archiveCollectionNames.map((name) => [name, records(source[name])])) as ProjectArchive["collections"], manuscriptMarkdown };
  }
}
