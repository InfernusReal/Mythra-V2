import { createHash } from "node:crypto";
import { Prisma, type PrismaClient } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { causalRelationTypes } from "@/domains/causality/domain/types";
import { normalizeChapterDocument } from "@/domains/writing/domain/chapter-document";
import { errors } from "@/lib/contracts/errors";
import type { SearchRepository } from "../application/ports";
import type {
  SearchProvider,
  SearchProviderContext,
} from "../domain/provider-registry";
import {
  activeSearchDocumentTypes,
  normalizeSearchText,
  scoreSearchResult,
  searchOffset,
  type ActiveSearchDocumentType,
  type SearchAction,
  type SearchDocumentType,
  type SearchProjectionDocument,
  type SearchQuery,
  type SearchReadModel,
  type SearchResult,
} from "../domain/types";

const SOURCE_LIMIT = 25_000;
const GROUP_LIMIT = 20;
const BATCH_SIZE = 200;

type JsonRecord = Record<string, unknown>;

interface SearchRow {
  id: string;
  documentType: SearchDocumentType;
  sourceId: string;
  sourceKey: string;
  blockId: string | null;
  title: string;
  bodyText: string;
  aliasesText: string;
  metadataJson: unknown;
  sourceVersion: number;
  projectStructuralVersion: number;
  sourceUpdatedAt: Date;
  indexedAt: Date;
  similarity: number;
  explicitReference: boolean;
  currentContext: boolean;
  totalCount: bigint | number;
  groupTotal: bigint | number;
}

function stableUuid(value: string): string {
  const bytes = createHash("sha256").update(value).digest().subarray(0, 16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function jsonText(value: unknown): string {
  const values: string[] = [];
  const visit = (entry: unknown): void => {
    if (typeof entry === "string") values.push(entry);
    else if (typeof entry === "number" || typeof entry === "boolean")
      values.push(String(entry));
    else if (Array.isArray(entry)) entry.forEach(visit);
    else if (entry && typeof entry === "object")
      Object.values(entry).forEach(visit);
  };
  visit(value);
  return values.join(" ");
}

function metadata(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function referenceTarget(
  type: ActiveSearchDocumentType,
  sourceId: string,
  blockId?: string,
): JsonRecord {
  if (type === "CHAPTER")
    return {
      referenceTargetType: blockId ? "MANUSCRIPT_BLOCK" : "CHAPTER",
      referenceTargetId: sourceId,
      ...(blockId ? { referenceTargetBlockId: blockId } : {}),
    };
  const mapping: Partial<Record<ActiveSearchDocumentType, string>> = {
    CHAPTER_OUTLINE: "CHAPTER_OUTLINE",
    PLOT_OUTLINE: "PLOT_OUTLINE",
    VOLUME_OUTLINE: "VOLUME_OUTLINE",
    MILESTONE: "MILESTONE",
    ENTITY: "ENTITY",
    CAPTURE: "CAPTURE",
    TIMELINE_EVENT: "TIMELINE_EVENT",
    NOTE: "NOTE",
  };
  return mapping[type]
    ? { referenceTargetType: mapping[type], referenceTargetId: sourceId }
    : {};
}

function resultActions(row: SearchRow): SearchAction[] {
  const data = metadata(row.metadataJson);
  const actions: SearchAction[] = [{ kind: "PEEK" }];
  if (typeof data.href === "string")
    actions.push({ kind: "OPEN", href: data.href });
  if (typeof data.referenceTargetType === "string") {
    actions.push({ kind: "INSERT_REFERENCE" }, { kind: "ATTACH_REFERENCE" });
  }
  if (row.title || row.bodyText) actions.push({ kind: "COPY" });
  if (
    row.documentType === "CHAPTER" &&
    row.blockId &&
    typeof data.href === "string"
  )
    actions.push({
      kind: "JUMP_TO_BLOCK",
      href: `${data.href}#block-${row.blockId}`,
      blockId: row.blockId,
    });
  if (typeof data.causalEndpointType === "string") {
    const base = {
      endpointType: data.causalEndpointType,
      endpointId: row.sourceId,
      ...(row.blockId ? { blockId: row.blockId } : {}),
    };
    actions.push({ kind: "WHY", ...base }, { kind: "DEPENDS", ...base });
  }
  return actions;
}

function snippet(bodyText: string, query: string): string {
  const compact = bodyText.replace(/\s+/gu, " ").trim();
  if (!compact) return "";
  const at = normalizeSearchText(compact).indexOf(query);
  const start = at < 0 ? 0 : Math.max(0, at - 60);
  return `${start > 0 ? "…" : ""}${compact.slice(start, start + 220)}${compact.length > start + 220 ? "…" : ""}`;
}

export class PrismaSearchRepository
  implements SearchRepository, SearchProvider
{
  readonly types = activeSearchDocumentTypes;
  readonly state = "ACTIVE" as const;

  constructor(private readonly prisma: PrismaClient) {}

  private async project(actor: SessionActor, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId: actor.workspaceId,
        archivedAt: null,
        status: "ACTIVE",
      },
      select: {
        id: true,
        workspaceId: true,
        structuralVersion: true,
        updatedAt: true,
      },
    });
    if (!project) throw errors.notFound();
    return project;
  }

  async collect(
    context: SearchProviderContext,
  ): Promise<SearchProjectionDocument[]> {
    const documents: SearchProjectionDocument[] = [];
    const append = (items: SearchProjectionDocument[]): void => {
      if (documents.length + items.length > context.limit)
        throw errors.validation(
          "The project exceeds the bounded SearchDocument synchronization limit.",
        );
      documents.push(...items);
    };
    const take = context.limit + 1;
    const project = await this.project(context.actor, context.projectId);

    const chapters = await this.prisma.chapter.findMany({
      where: {
        projectId: context.projectId,
        archivedAt: null,
        status: { not: "ARCHIVED" },
      },
      select: {
        id: true,
        title: true,
        bodyDocument: true,
        version: true,
        updatedAt: true,
      },
      orderBy: { sequenceIndex: "asc" },
      take,
    });
    append(
      chapters.flatMap((chapter) =>
        normalizeChapterDocument(chapter.bodyDocument).content.map((block) => {
          const text = block.content?.map((node) => node.text).join("") ?? "";
          return {
            documentType: "CHAPTER" as const,
            sourceId: chapter.id,
            sourceKey: `CHAPTER:${chapter.id}:${block.attrs.blockId}`,
            blockId: block.attrs.blockId,
            title: chapter.title,
            bodyText: text,
            aliases: [],
            metadata: {
              href: `/app/chapters/${chapter.id}`,
              chapterId: chapter.id,
              ...referenceTarget("CHAPTER", chapter.id, block.attrs.blockId),
              causalEndpointType: "MANUSCRIPT_BLOCK",
            },
            sourceVersion: chapter.version,
            sourceUpdatedAt: chapter.updatedAt,
          };
        }),
      ),
    );

    const chapterOutlines = await this.prisma.chapterOutline.findMany({
      where: { projectId: context.projectId, archivedAt: null },
      select: {
        id: true,
        chapterId: true,
        title: true,
        plainText: true,
        purpose: true,
        emotionalMovement: true,
        revealedInformation: true,
        version: true,
        updatedAt: true,
      },
      orderBy: { sequenceIndex: "asc" },
      take,
    });
    append(
      chapterOutlines.map((item) => ({
        documentType: "CHAPTER_OUTLINE",
        sourceId: item.id,
        sourceKey: `CHAPTER_OUTLINE:${item.id}`,
        title: item.title,
        bodyText: [
          item.purpose,
          item.emotionalMovement,
          item.plainText,
          jsonText(item.revealedInformation),
        ]
          .filter(Boolean)
          .join(" "),
        aliases: [],
        metadata: {
          href: `/app/projects/${context.projectId}/structure`,
          chapterId: item.chapterId,
          ...referenceTarget("CHAPTER_OUTLINE", item.id),
          causalEndpointType: "CHAPTER_OUTLINE",
        },
        sourceVersion: item.version,
        sourceUpdatedAt: item.updatedAt,
      })),
    );

    const plotOutlines = await this.prisma.plotOutline.findMany({
      where: { projectId: context.projectId, archivedAt: null },
      include: { plot: { select: { title: true } } },
      take,
    });
    append(
      plotOutlines.map((item) => ({
        documentType: "PLOT_OUTLINE",
        sourceId: item.id,
        sourceKey: `PLOT_OUTLINE:${item.id}`,
        title: item.plot.title,
        bodyText: [item.purpose, item.plainText].filter(Boolean).join(" "),
        aliases: [],
        metadata: {
          href: `/app/projects/${context.projectId}/structure`,
          ...referenceTarget("PLOT_OUTLINE", item.id),
        },
        sourceVersion: item.version,
        sourceUpdatedAt: item.updatedAt,
      })),
    );

    const volumeOutlines = await this.prisma.volumeOutline.findMany({
      where: { projectId: context.projectId, archivedAt: null },
      include: { volume: { select: { title: true } } },
      take,
    });
    append(
      volumeOutlines.map((item) => ({
        documentType: "VOLUME_OUTLINE",
        sourceId: item.id,
        sourceKey: `VOLUME_OUTLINE:${item.id}`,
        title: item.volume.title,
        bodyText: [item.purpose, item.plainText].filter(Boolean).join(" "),
        aliases: [],
        metadata: {
          href: `/app/projects/${context.projectId}/structure`,
          ...referenceTarget("VOLUME_OUTLINE", item.id),
        },
        sourceVersion: item.version,
        sourceUpdatedAt: item.updatedAt,
      })),
    );

    const milestones = await this.prisma.milestone.findMany({
      where: {
        projectId: context.projectId,
        archivedAt: null,
        status: { not: "ARCHIVED" },
      },
      take,
    });
    append(
      milestones.map((item) => ({
        documentType: "MILESTONE",
        sourceId: item.id,
        sourceKey: `MILESTONE:${item.id}`,
        title: item.title,
        bodyText: [item.description, item.threadLabel, item.status]
          .filter(Boolean)
          .join(" "),
        aliases: item.threadLabel ? [item.threadLabel] : [],
        metadata: {
          href: `/app/projects/${context.projectId}/structure`,
          ...referenceTarget("MILESTONE", item.id),
          causalEndpointType: "MILESTONE",
        },
        sourceVersion: item.version,
        sourceUpdatedAt: item.updatedAt,
      })),
    );

    const entities = await this.prisma.storyEntity.findMany({
      where: {
        projectId: context.projectId,
        archivedAt: null,
        status: "ACTIVE",
      },
      include: { fieldValues: { select: { valueJson: true } } },
      take,
    });
    append(
      entities.map((item) => ({
        documentType: "ENTITY",
        sourceId: item.id,
        sourceKey: `ENTITY:${item.id}`,
        title: item.name,
        bodyText: [
          item.summary,
          jsonText(item.fieldValues.map((field) => field.valueJson)),
          jsonText(item.tagsJson),
        ]
          .filter(Boolean)
          .join(" "),
        aliases: Array.isArray(item.aliasesJson)
          ? item.aliasesJson.filter(
              (alias): alias is string => typeof alias === "string",
            )
          : [],
        metadata: {
          href: `/app/projects/${context.projectId}/universe/${item.id}`,
          ...referenceTarget("ENTITY", item.id),
        },
        sourceVersion: item.version,
        sourceUpdatedAt: item.updatedAt,
      })),
    );

    const changes = await this.prisma.storyChange.findMany({
      where: { projectId: context.projectId, archivedAt: null },
      take,
    });
    append(
      changes.map((item) => ({
        documentType: "STORY_CHANGE",
        sourceId: item.id,
        sourceKey: `STORY_CHANGE:${item.id}`,
        title: item.title,
        bodyText: [item.description, item.kind].filter(Boolean).join(" "),
        aliases: [],
        metadata: {
          href: `/app/projects/${context.projectId}/structure`,
          causalEndpointType: "STORY_CHANGE",
        },
        sourceVersion: item.version,
        sourceUpdatedAt: item.updatedAt,
      })),
    );

    append(
      causalRelationTypes.map((type) => ({
        documentType: "CAUSAL_RELATION_TYPE",
        sourceId: stableUuid(`${context.projectId}:causal:${type}`),
        sourceKey: `CAUSAL_RELATION_TYPE:${type}`,
        title: type,
        bodyText: "",
        aliases: [type],
        metadata: {
          relationType: type,
          href: `/app/projects/${context.projectId}/structure`,
        },
        sourceVersion: context.projectStructuralVersion,
        sourceUpdatedAt: project.updatedAt,
      })),
    );

    const relationTypes = await this.prisma.relationType.findMany({
      where: {
        OR: [{ projectId: null }, { projectId: context.projectId }],
        archivedAt: null,
      },
      take,
    });
    append(
      relationTypes.map((item) => ({
        documentType: "UNIVERSE_RELATION_TYPE",
        sourceId: item.id,
        sourceKey: `UNIVERSE_RELATION_TYPE:${item.id}`,
        title: item.forwardLabel,
        bodyText: [item.reverseLabel, item.key].join(" "),
        aliases: [item.reverseLabel, item.key],
        metadata: {
          relationTypeId: item.id,
          href: `/app/projects/${context.projectId}/universe`,
        },
        sourceVersion: 1,
        sourceUpdatedAt: item.updatedAt,
      })),
    );

    const references = await this.prisma.storyReference.findMany({
      where: { projectId: context.projectId, archivedAt: null },
      take,
    });
    append(
      references.map((item) => ({
        documentType: "STORY_REFERENCE",
        sourceId: item.id,
        sourceKey: `STORY_REFERENCE:${item.id}`,
        title: item.relationshipKey,
        bodyText: [item.sourceType, item.targetType, item.provenanceNote]
          .filter(Boolean)
          .join(" "),
        aliases: [item.sourceType, item.targetType],
        metadata: {
          href: `/app/projects/${context.projectId}/structure`,
          sourceType: item.sourceType,
          targetType: item.targetType,
        },
        sourceVersion: item.version,
        sourceUpdatedAt: item.updatedAt,
      })),
    );

    const captures = await this.prisma.capture.findMany({
      where: {
        projectId: context.projectId,
        userId: context.actor.userId,
        lifecycle: { not: "DISMISSED" },
      },
      take,
    });
    append(
      captures.map((item) => ({
        documentType: "CAPTURE",
        sourceId: item.id,
        sourceKey: `CAPTURE:${item.id}`,
        ownerUserId: item.userId,
        blockId: item.blockId ?? undefined,
        title: "CAPTURE",
        bodyText: item.rawText,
        aliases: [item.lifecycle],
        metadata: {
          href: `/app/projects/${context.projectId}/captures`,
          chapterId: item.chapterId,
          ...referenceTarget("CAPTURE", item.id),
        },
        sourceVersion: item.version,
        sourceUpdatedAt: item.updatedAt,
      })),
    );

    const timelineEvents = await this.prisma.timelineEvent.findMany({
      where: { projectId: context.projectId, archivedAt: null },
      take,
    });
    append(
      timelineEvents.map((item) => ({
        documentType: "TIMELINE_EVENT",
        sourceId: item.id,
        sourceKey: `TIMELINE_EVENT:${item.id}`,
        title: item.title,
        bodyText: [
          item.description,
          item.displayLabel,
          item.calendarKey,
          item.mode,
        ]
          .filter(Boolean)
          .join(" "),
        aliases: [item.displayLabel, item.mode],
        metadata: {
          href: `/app/projects/${context.projectId}/timeline`,
          ...referenceTarget("TIMELINE_EVENT", item.id),
          causalEndpointType: "TIMELINE_EVENT",
        },
        sourceVersion: item.version,
        sourceUpdatedAt: item.updatedAt,
      })),
    );

    const notes = await this.prisma.note.findMany({
      where: { projectId: context.projectId, archivedAt: null },
      take,
    });
    append(
      notes.map((item) => ({
        documentType: "NOTE",
        sourceId: item.id,
        sourceKey: `NOTE:${item.id}`,
        title: item.title,
        bodyText: [item.body, jsonText(item.normalizedTags)].join(" "),
        aliases: Array.isArray(item.normalizedTags)
          ? item.normalizedTags.filter(
              (tag): tag is string => typeof tag === "string",
            )
          : [],
        metadata: {
          href: `/app/projects/${context.projectId}/research`,
          ...referenceTarget("NOTE", item.id),
        },
        sourceVersion: item.version,
        sourceUpdatedAt: item.updatedAt,
      })),
    );

    const researchItems = await this.prisma.researchItem.findMany({
      where: {
        projectId: context.projectId,
        archivedAt: null,
        OR: [
          { kind: { not: "FILE" } },
          { asset: { scanStatus: "CLEAN", archivedAt: null } },
        ],
      },
      include: { asset: { select: { displayName: true } } },
      take,
    });
    append(
      researchItems.map((item) => ({
        documentType: "RESEARCH",
        sourceId: item.id,
        sourceKey: `RESEARCH:${item.id}`,
        title: item.title,
        bodyText: [
          item.body,
          item.url,
          item.citation,
          item.excerpt,
          item.asset?.displayName,
          item.kind,
        ]
          .filter(Boolean)
          .join(" "),
        aliases: [item.kind],
        metadata: {
          href: `/app/projects/${context.projectId}/research`,
          researchKind: item.kind,
        },
        sourceVersion: item.version,
        sourceUpdatedAt: item.updatedAt,
      })),
    );

    return documents;
  }

  async synchronize(actor: SessionActor, projectId: string) {
    const project = await this.project(actor, projectId);
    const documents = await this.collect({
      actor,
      projectId,
      projectStructuralVersion: project.structuralVersion,
      limit: SOURCE_LIMIT,
    });
    const existing = await this.prisma.searchDocument.findMany({
      where: {
        projectId,
        workspaceId: actor.workspaceId,
        OR: [{ ownerUserId: null }, { ownerUserId: actor.userId }],
      },
      select: { id: true, sourceKey: true, freshnessKey: true },
    });
    const existingByKey = new Map(
      existing.map((item) => [item.sourceKey, item]),
    );
    const activeKeys = new Set(documents.map((item) => item.sourceKey));
    const staleIds = existing
      .filter((item) => !activeKeys.has(item.sourceKey))
      .map((item) => item.id);
    const changed = documents.filter(
      (item) =>
        existingByKey.get(item.sourceKey)?.freshnessKey !==
        `${item.sourceVersion}:${item.sourceUpdatedAt.toISOString()}`,
    );

    for (let index = 0; index < staleIds.length; index += BATCH_SIZE)
      await this.prisma.searchDocument.deleteMany({
        where: { id: { in: staleIds.slice(index, index + BATCH_SIZE) } },
      });
    for (let index = 0; index < changed.length; index += BATCH_SIZE) {
      const batch = changed.slice(index, index + BATCH_SIZE);
      await this.prisma.$transaction(
        batch.map((item) =>
          this.prisma.searchDocument.upsert({
            where: {
              projectId_sourceKey: { projectId, sourceKey: item.sourceKey },
            },
            create: {
              workspaceId: actor.workspaceId,
              projectId,
              ownerUserId: item.ownerUserId,
              documentType: item.documentType,
              sourceId: item.sourceId,
              sourceKey: item.sourceKey,
              blockId: item.blockId,
              title: item.title.slice(0, 500),
              bodyText: item.bodyText,
              normalizedText: normalizeSearchText(
                `${item.title} ${item.bodyText}`,
              ),
              aliasesText: item.aliases.map(normalizeSearchText).join(" "),
              metadataJson: item.metadata as Prisma.InputJsonValue,
              sourceVersion: item.sourceVersion,
              projectStructuralVersion: project.structuralVersion,
              freshnessKey: `${item.sourceVersion}:${item.sourceUpdatedAt.toISOString()}`,
              sourceUpdatedAt: item.sourceUpdatedAt,
            },
            update: {
              ownerUserId: item.ownerUserId,
              documentType: item.documentType,
              sourceId: item.sourceId,
              blockId: item.blockId,
              title: item.title.slice(0, 500),
              bodyText: item.bodyText,
              normalizedText: normalizeSearchText(
                `${item.title} ${item.bodyText}`,
              ),
              aliasesText: item.aliases.map(normalizeSearchText).join(" "),
              metadataJson: item.metadata as Prisma.InputJsonValue,
              sourceVersion: item.sourceVersion,
              projectStructuralVersion: project.structuralVersion,
              freshnessKey: `${item.sourceVersion}:${item.sourceUpdatedAt.toISOString()}`,
              sourceUpdatedAt: item.sourceUpdatedAt,
              indexedAt: new Date(),
            },
          }),
        ),
      );
    }
    return {
      insertedOrUpdated: changed.length,
      removed: staleIds.length,
      sourceCount: documents.length,
      capped: false,
      projectStructuralVersion: project.structuralVersion,
    };
  }

  async search(
    actor: SessionActor,
    projectId: string,
    query: SearchQuery,
  ): Promise<Omit<SearchReadModel, "providerStates" | "synchronized">> {
    const project = await this.project(actor, projectId);
    const normalized = normalizeSearchText(query.query);
    if (!normalized)
      throw errors.validation("Search requires letters or numbers.");
    const offset = searchOffset(query.cursor);
    const types = (query.types ?? activeSearchDocumentTypes).filter(
      (type): type is ActiveSearchDocumentType =>
        (activeSearchDocumentTypes as readonly string[]).includes(type),
    );
    const rows = await this.prisma.$queryRaw<SearchRow[]>(Prisma.sql`
      WITH matched AS (
        SELECT d.*,
          GREATEST(similarity(d."normalizedText", ${normalized}), similarity(d."aliasesText", ${normalized})) AS similarity,
          EXISTS (
            SELECT 1 FROM "StoryReference" r
            WHERE r."projectId" = d."projectId" AND r."archivedAt" IS NULL
              AND (${query.chapterId ?? null}::uuid IS NOT NULL)
              AND ((r."sourceId" = ${query.chapterId ?? null}::uuid AND r."targetId" = d."sourceId") OR (r."targetId" = ${query.chapterId ?? null}::uuid AND r."sourceId" = d."sourceId"))
          ) AS "explicitReference",
          (d."sourceId" = ${query.chapterId ?? null}::uuid OR d."metadataJson"->>'chapterId' = ${query.chapterId ?? ""}) AS "currentContext"
        FROM "SearchDocument" d
        WHERE d."workspaceId" = ${actor.workspaceId}::uuid AND d."projectId" = ${projectId}::uuid
          AND (d."ownerUserId" IS NULL OR d."ownerUserId" = ${actor.userId}::uuid)
          AND d."documentType"::text IN (${Prisma.join(types)})
          AND (d."searchVector" @@ plainto_tsquery('simple', ${normalized}) OR d."normalizedText" LIKE ${`%${normalized}%`} OR d."aliasesText" LIKE ${`%${normalized}%`} OR d."normalizedText" % ${normalized} OR d."aliasesText" % ${normalized})
      ), ranked AS (
        SELECT matched.*,
          ROW_NUMBER() OVER (PARTITION BY "documentType" ORDER BY
            CASE WHEN lower("title") = ${normalized} OR ${normalized} = ANY(regexp_split_to_array("aliasesText", '\\s+')) THEN 1000
                 WHEN "normalizedText" LIKE ${`${normalized}%`} OR "aliasesText" LIKE ${`${normalized}%`} THEN 700
                 WHEN "normalizedText" LIKE ${`%${normalized}%`} THEN 500 ELSE 0 END
            + round(similarity * 250)::int
            + CASE WHEN "explicitReference" THEN 200 ELSE 0 END
            + CASE WHEN "currentContext" THEN 150 ELSE 0 END
            + CASE WHEN "sourceUpdatedAt" >= now() - interval '7 days' THEN 50 WHEN "sourceUpdatedAt" >= now() - interval '30 days' THEN 20 ELSE 0 END DESC,
            "sourceUpdatedAt" DESC, "sourceKey" ASC) AS "groupRank",
          COUNT(*) OVER (PARTITION BY "documentType") AS "groupTotal",
          COUNT(*) OVER () AS "totalCount"
        FROM matched
      )
      SELECT "id", "documentType", "sourceId", "sourceKey", "blockId", "title", "bodyText", "aliasesText", "metadataJson", "sourceVersion", "projectStructuralVersion", "sourceUpdatedAt", "indexedAt", similarity, "explicitReference", "currentContext", "totalCount", "groupTotal"
      FROM ranked WHERE "groupRank" <= ${GROUP_LIMIT}
      ORDER BY
        CASE WHEN lower("title") = ${normalized} THEN 1000 WHEN "normalizedText" LIKE ${`${normalized}%`} THEN 700 WHEN "normalizedText" LIKE ${`%${normalized}%`} THEN 500 ELSE 0 END
        + round(similarity * 250)::int + CASE WHEN "explicitReference" THEN 200 ELSE 0 END + CASE WHEN "currentContext" THEN 150 ELSE 0 END DESC,
        "sourceUpdatedAt" DESC, "sourceKey" ASC
      OFFSET ${offset} LIMIT ${query.limit}
    `);
    const now = new Date();
    const results = rows.map((row): SearchResult => {
      const aliases = row.aliasesText.split(" ").filter(Boolean);
      const scored = scoreSearchResult({
        normalizedQuery: normalized,
        normalizedTitle: normalizeSearchText(row.title),
        normalizedText: normalizeSearchText(`${row.title} ${row.bodyText}`),
        aliases,
        currentContext: row.currentContext,
        explicitReference: row.explicitReference,
        similarity: Number(row.similarity),
        sourceUpdatedAt: row.sourceUpdatedAt,
        now,
      });
      return {
        id: row.id,
        documentType: row.documentType,
        sourceId: row.sourceId,
        sourceKey: row.sourceKey,
        blockId: row.blockId,
        title: row.title,
        snippet: snippet(row.bodyText, normalized),
        sourceVersion: row.sourceVersion,
        sourceUpdatedAt: row.sourceUpdatedAt.toISOString(),
        indexedAt: row.indexedAt.toISOString(),
        freshness: "CURRENT",
        rank: scored.score,
        matchReasons: scored.reasons,
        explicitReference: row.explicitReference,
        currentContext: row.currentContext,
        actions: resultActions(row),
        metadata: metadata(row.metadataJson),
      };
    });
    const groups = [...new Set(results.map((item) => item.documentType))].map(
      (type) => {
        const grouped = results.filter((item) => item.documentType === type);
        const total = Number(
          rows.find((row) => row.documentType === type)?.groupTotal ??
            grouped.length,
        );
        return {
          type,
          total,
          results: grouped,
          hasMore: total > grouped.length,
        };
      },
    );
    const total = Number(rows[0]?.totalCount ?? 0);
    return {
      projectId,
      projectStructuralVersion: project.structuralVersion,
      groups,
      page: {
        returned: results.length,
        limit: query.limit,
        nextCursor:
          offset + results.length <
          Math.min(total, GROUP_LIMIT * activeSearchDocumentTypes.length)
            ? `offset:${offset + results.length}`
            : null,
        total,
      },
    };
  }
}
