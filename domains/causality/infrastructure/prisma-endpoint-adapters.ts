import type { Prisma, PrismaClient } from "@/app/generated/prisma/client";
import { chapterDocumentSchema } from "@/domains/writing/domain/chapter-document";
import { errors } from "@/lib/contracts/errors";
import {
  CausalEndpointRegistry,
  type CausalEndpointAdapter,
  type ResolvedCausalEndpoint,
} from "../domain/endpoint-registry";
import type { ActiveCausalEndpointType, CausalEndpoint } from "../domain/types";

type Client = PrismaClient | Prisma.TransactionClient;

async function timelineCoordinate(
  client: Client,
  projectId: string,
  eventId: string,
  visited = new Set<string>(),
): Promise<number | null> {
  if (visited.has(eventId) || visited.size >= 128) return null;
  visited.add(eventId);
  const row = await client.timelineEvent.findFirst({
    where: { id: eventId, projectId, archivedAt: null },
    select: {
      mode: true,
      sortStart: true,
      ordinalValue: true,
      relativeToEventId: true,
      relativeOffset: true,
    },
  });
  if (!row) return null;
  if (row.mode === "ORDINAL") return null;
  if (
    row.mode === "ABSOLUTE" ||
    row.mode === "APPROXIMATE" ||
    row.mode === "RANGE"
  )
    return row.sortStart === null ? null : Number(row.sortStart);
  if (!row.relativeToEventId || row.relativeOffset === null) return null;
  const anchor = await timelineCoordinate(
    client,
    projectId,
    row.relativeToEventId,
    visited,
  );
  return anchor === null ? null : anchor + Number(row.relativeOffset);
}

function result(
  endpoint: CausalEndpoint,
  projectId: string,
  label: string,
  archivedAt: Date | null,
  storyTime: number | null = null,
  discoveryTime: number | null = null,
  presentation?: { labelCode: string; labelOrdinal?: number },
): ResolvedCausalEndpoint {
  return {
    endpoint,
    projectId,
    label,
    ...(presentation?.labelCode ? { labelCode: presentation.labelCode } : {}),
    ...(presentation?.labelOrdinal !== undefined
      ? { labelOrdinal: presentation.labelOrdinal }
      : {}),
    archived: archivedAt !== null,
    storyTime,
    discoveryTime,
  };
}

function activeAdapter(
  type: ActiveCausalEndpointType,
  client: Client,
): CausalEndpointAdapter {
  return {
    type,
    availability: "ACTIVE",
    async resolve(projectId, endpoint) {
      if (type === "MILESTONE") {
        const row = await client.milestone.findFirst({
          where: { id: endpoint.id, projectId },
          select: { title: true, archivedAt: true },
        });
        if (!row) throw errors.notFound();
        return result(endpoint, projectId, row.title, row.archivedAt);
      }
      if (type === "CHAPTER_OUTLINE") {
        const row = await client.chapterOutline.findFirst({
          where: { id: endpoint.id, projectId },
          select: { title: true, archivedAt: true },
        });
        if (!row) throw errors.notFound();
        return result(endpoint, projectId, row.title, row.archivedAt);
      }
      if (type === "SCENE") {
        const row = await client.scene.findFirst({
          where: { id: endpoint.id, projectId },
          select: { title: true, archivedAt: true },
        });
        if (!row) throw errors.notFound();
        return result(endpoint, projectId, row.title, row.archivedAt);
      }
      if (type === "NARRATIVE_INTENT") {
        const row = await client.narrativeIntent.findFirst({
          where: { id: endpoint.id, projectId },
          select: { category: true, customCategory: true, archivedAt: true },
        });
        if (!row) throw errors.notFound();
        return result(
          endpoint,
          projectId,
          row.customCategory ?? "",
          row.archivedAt,
          null,
          null,
          {
            labelCode: row.customCategory
              ? "NARRATIVE_INTENT"
              : (row.category ?? "NARRATIVE_INTENT"),
          },
        );
      }
      if (type === "MANUSCRIPT_BLOCK") {
        const row = await client.chapter.findFirst({
          where: { id: endpoint.id, projectId },
          select: { title: true, bodyDocument: true, archivedAt: true },
        });
        if (!row) throw errors.notFound();
        const document = chapterDocumentSchema.safeParse(row.bodyDocument);
        if (
          !document.success ||
          !document.data.content.some(
            (block) => block.attrs.blockId === endpoint.blockId,
          )
        )
          throw errors.notFound();
        return result(
          endpoint,
          projectId,
          row.title,
          row.archivedAt,
          null,
          null,
          {
            labelCode: "MANUSCRIPT_BLOCK",
          },
        );
      }
      if (type === "CAPTURE_DERIVED") {
        const row = await client.captureConversion.findFirst({
          where: {
            id: endpoint.id,
            projectId,
            conversionType: "CAPTURE_DERIVED_CAUSAL",
          },
          select: { capture: { select: { lifecycle: true } } },
        });
        if (!row) throw errors.notFound();
        return result(
          endpoint,
          projectId,
          "",
          row.capture.lifecycle === "DISMISSED" ? new Date(0) : null,
          null,
          null,
          { labelCode: "CAPTURE_DERIVED" },
        );
      }
      if (type === "ENTITY_STATE") {
        const row = await client.entityStateSnapshot.findFirst({
          where: { id: endpoint.id, projectId },
          select: {
            orderIndex: true,
            archivedAt: true,
            entity: { select: { name: true, archivedAt: true, status: true } },
          },
        });
        if (!row) throw errors.notFound();
        return result(
          endpoint,
          projectId,
          row.entity.name,
          row.archivedAt ??
            row.entity.archivedAt ??
            (row.entity.status === "ARCHIVED" ? new Date(0) : null),
          null,
          null,
          { labelCode: "ENTITY_STATE", labelOrdinal: row.orderIndex + 1 },
        );
      }
      if (type === "TIMELINE_EVENT") {
        const row = await client.timelineEvent.findFirst({
          where: { id: endpoint.id, projectId },
          select: { title: true, archivedAt: true },
        });
        if (!row) throw errors.notFound();
        const coordinate = await timelineCoordinate(
          client,
          projectId,
          endpoint.id,
        );
        return result(
          endpoint,
          projectId,
          row.title,
          row.archivedAt,
          coordinate,
          coordinate,
        );
      }
      const row = await client.storyChange.findFirst({
        where: { id: endpoint.id, projectId },
        select: {
          title: true,
          storyTime: true,
          discoveryTime: true,
          archivedAt: true,
        },
      });
      if (!row) throw errors.notFound();
      return result(
        endpoint,
        projectId,
        row.title,
        row.archivedAt,
        row.storyTime === null ? null : Number(row.storyTime),
        row.discoveryTime === null ? null : Number(row.discoveryTime),
      );
    },
  } as CausalEndpointAdapter;
}

export function createPrismaEndpointRegistry(
  client: Client,
): CausalEndpointRegistry {
  return new CausalEndpointRegistry([
    activeAdapter("MILESTONE", client),
    activeAdapter("CHAPTER_OUTLINE", client),
    activeAdapter("SCENE", client),
    activeAdapter("NARRATIVE_INTENT", client),
    activeAdapter("MANUSCRIPT_BLOCK", client),
    activeAdapter("STORY_CHANGE", client),
    activeAdapter("CAPTURE_DERIVED", client),
    activeAdapter("ENTITY_STATE", client),
    activeAdapter("TIMELINE_EVENT", client),
  ]);
}
