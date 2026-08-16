import type { Prisma, PrismaClient } from "@/app/generated/prisma/client";
import { chapterDocumentSchema } from "@/domains/writing/domain/chapter-document";
import { errors } from "@/lib/contracts/errors";
import { CausalEndpointRegistry, reservedAdapter, type CausalEndpointAdapter, type ResolvedCausalEndpoint } from "../domain/endpoint-registry";
import type { ActiveCausalEndpointType, CausalEndpoint } from "../domain/types";

type Client = PrismaClient | Prisma.TransactionClient;

function result(endpoint: CausalEndpoint, projectId: string, label: string, archivedAt: Date | null, storyTime: number | null = null, discoveryTime: number | null = null): ResolvedCausalEndpoint {
  return { endpoint, projectId, label, archived: archivedAt !== null, storyTime, discoveryTime };
}

function activeAdapter(type: ActiveCausalEndpointType, client: Client): CausalEndpointAdapter {
  return { type, availability: "ACTIVE", async resolve(projectId, endpoint) {
    if (type === "MILESTONE") {
      const row = await client.milestone.findFirst({ where: { id: endpoint.id, projectId }, select: { title: true, archivedAt: true } });
      if (!row) throw errors.notFound(); return result(endpoint, projectId, row.title, row.archivedAt);
    }
    if (type === "CHAPTER_OUTLINE") {
      const row = await client.chapterOutline.findFirst({ where: { id: endpoint.id, projectId }, select: { title: true, archivedAt: true } });
      if (!row) throw errors.notFound(); return result(endpoint, projectId, row.title, row.archivedAt);
    }
    if (type === "SCENE") {
      const row = await client.scene.findFirst({ where: { id: endpoint.id, projectId }, select: { title: true, archivedAt: true } });
      if (!row) throw errors.notFound(); return result(endpoint, projectId, row.title, row.archivedAt);
    }
    if (type === "NARRATIVE_INTENT") {
      const row = await client.narrativeIntent.findFirst({ where: { id: endpoint.id, projectId }, select: { category: true, customCategory: true, archivedAt: true } });
      if (!row) throw errors.notFound(); return result(endpoint, projectId, row.customCategory ?? row.category?.toLowerCase() ?? "Narrative intent", row.archivedAt);
    }
    if (type === "MANUSCRIPT_BLOCK") {
      const row = await client.chapter.findFirst({ where: { id: endpoint.id, projectId }, select: { title: true, bodyDocument: true, archivedAt: true } });
      if (!row) throw errors.notFound();
      const document = chapterDocumentSchema.safeParse(row.bodyDocument);
      if (!document.success || !document.data.content.some((block) => block.attrs.blockId === endpoint.blockId)) throw errors.notFound();
      return result(endpoint, projectId, `${row.title} · manuscript block`, row.archivedAt);
    }
    const row = await client.storyChange.findFirst({ where: { id: endpoint.id, projectId }, select: { title: true, storyTime: true, discoveryTime: true, archivedAt: true } });
    if (!row) throw errors.notFound();
    return result(endpoint, projectId, row.title, row.archivedAt, row.storyTime === null ? null : Number(row.storyTime), row.discoveryTime === null ? null : Number(row.discoveryTime));
  } } as CausalEndpointAdapter;
}

export function createPrismaEndpointRegistry(client: Client): CausalEndpointRegistry {
  return new CausalEndpointRegistry([
    activeAdapter("MILESTONE", client), activeAdapter("CHAPTER_OUTLINE", client), activeAdapter("SCENE", client),
    activeAdapter("NARRATIVE_INTENT", client), activeAdapter("MANUSCRIPT_BLOCK", client), activeAdapter("STORY_CHANGE", client),
    reservedAdapter("TIMELINE_EVENT"), reservedAdapter("ENTITY_STATE"), reservedAdapter("CAPTURE_DERIVED")
  ]);
}
