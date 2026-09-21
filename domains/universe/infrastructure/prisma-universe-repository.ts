import { Prisma, type PrismaClient } from "@/app/generated/prisma/client";
import type { SessionActor } from "@/domains/accounts/domain/identity";
import { errors } from "@/lib/contracts/errors";
import {
  getMessages,
  localizedEntityTemplateFieldLabel,
  localizedEntityTemplateName,
  localizedRelationTemplateLabel,
} from "@/lib/i18n/messages";
import type { UniverseCatalog, UniverseRepository } from "../application/ports";
import { entityTemplates, relationTemplates } from "../domain/templates";
import type {
  EntityFieldType,
  EntityStateAnchorType,
  UniverseBacklink,
  UniverseEntitySummary,
} from "../domain/types";

type Tx = Prisma.TransactionClient;
type EntityRow = Prisma.StoryEntityGetPayload<{
  include: {
    entityType: true;
    fieldValues: { include: { fieldDefinition: true } };
  };
}>;
const json = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const strings = (value: unknown, cap = 100): string[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .slice(0, cap)
    : [];
const object = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const serializedSize = (value: unknown) => JSON.stringify(value).length;
const backlinkSourceTypes = [
  "PLOT",
  "PLOT_OUTLINE",
  "VOLUME",
  "VOLUME_OUTLINE",
  "CHAPTER_OUTLINE",
  "CHAPTER",
  "SCENE",
  "NARRATIVE_INTENT",
  "MANUSCRIPT_BLOCK",
  "MILESTONE",
  "ENTITY",
  "TIMELINE_EVENT",
  "NOTE",
  "CAPTURE",
] as const;

async function ownedProject(
  tx: Tx,
  actor: SessionActor,
  projectId: string,
  expected?: number,
) {
  const row = await tx.project.findFirst({
    where: {
      id: projectId,
      workspaceId: actor.workspaceId,
      status: "ACTIVE",
      ...(expected ? { structuralVersion: expected } : {}),
    },
    select: { id: true, structuralVersion: true },
  });
  if (row) return row;
  if (
    expected &&
    (await tx.project.findFirst({
      where: {
        id: projectId,
        workspaceId: actor.workspaceId,
        status: "ACTIVE",
      },
      select: { id: true },
    }))
  )
    throw errors.conflict();
  throw errors.notFound();
}

async function bump(
  tx: Tx,
  actor: SessionActor,
  projectId: string,
  expected: number,
) {
  const changed = await tx.project.updateMany({
    where: {
      id: projectId,
      workspaceId: actor.workspaceId,
      status: "ACTIVE",
      structuralVersion: expected,
    },
    data: { structuralVersion: { increment: 1 } },
  });
  if (changed.count !== 1) throw errors.conflict();
  return expected + 1;
}

async function ensureCatalog(tx: Tx): Promise<void> {
  const canonicalMessages = getMessages("en");
  for (const template of entityTemplates) {
    const templateName = localizedEntityTemplateName(
      canonicalMessages,
      template.key,
      template.key,
    );
    const type = await tx.entityType.upsert({
      where: { systemKey: template.key },
      create: {
        systemKey: template.key,
        key: template.key,
        name: templateName,
        icon: template.icon,
        locale: "en",
        schemaVersion: 1,
      },
      update: {
        name: templateName,
        icon: template.icon,
        locale: "en",
        schemaVersion: 1,
      },
      select: { id: true },
    });
    for (const [orderIndex, field] of template.fields.entries())
      await tx.entityFieldDefinition.upsert({
        where: { entityTypeId_key: { entityTypeId: type.id, key: field.key } },
        create: {
          entityTypeId: type.id,
          key: field.key,
          label: localizedEntityTemplateFieldLabel(
            canonicalMessages,
            template.key,
            field.key,
            field.key,
          ),
          fieldType: field.fieldType,
          orderIndex,
          configJson: json(field.config ?? {}),
        },
        update: {
          label: localizedEntityTemplateFieldLabel(
            canonicalMessages,
            template.key,
            field.key,
            field.key,
          ),
          fieldType: field.fieldType,
          orderIndex,
          configJson: json(field.config ?? {}),
          archivedAt: null,
        },
      });
  }
  for (const relation of relationTemplates)
    await tx.relationType.upsert({
      where: { systemKey: relation.key },
      create: {
        systemKey: relation.key,
        key: relation.key,
        forwardLabel: localizedRelationTemplateLabel(
          canonicalMessages,
          relation.key,
          "forward",
          relation.key,
        ),
        reverseLabel: localizedRelationTemplateLabel(
          canonicalMessages,
          relation.key,
          "reverse",
          relation.key,
        ),
        directional: relation.directional,
      },
      update: {
        forwardLabel: localizedRelationTemplateLabel(
          canonicalMessages,
          relation.key,
          "forward",
          relation.key,
        ),
        reverseLabel: localizedRelationTemplateLabel(
          canonicalMessages,
          relation.key,
          "reverse",
          relation.key,
        ),
        directional: relation.directional,
        archivedAt: null,
      },
    });
}

async function typeForProject(tx: Tx, projectId: string, typeId: string) {
  const type = await tx.entityType.findFirst({
    where: {
      id: typeId,
      archivedAt: null,
      OR: [{ projectId }, { projectId: null, systemKey: { not: null } }],
    },
    include: {
      fieldDefinitions: {
        where: { archivedAt: null },
        orderBy: { orderIndex: "asc" },
        take: 100,
      },
    },
  });
  if (!type) throw errors.notFound();
  return type;
}

async function validateValues(
  tx: Tx,
  projectId: string,
  typeId: string,
  values: Array<{ fieldDefinitionId: string; value: unknown }>,
  enforceRequired: boolean,
) {
  const type = await typeForProject(tx, projectId, typeId);
  const byId = new Map(type.fieldDefinitions.map((field) => [field.id, field]));
  if (
    new Set(values.map((item) => item.fieldDefinitionId)).size !== values.length
  )
    throw errors.validation(
      "An entity may contain one value per field definition.",
    );
  const referenceIds: string[] = [];
  for (const item of values) {
    const field = byId.get(item.fieldDefinitionId);
    if (!field)
      throw errors.validation(
        "A field does not belong to the selected entity type.",
      );
    const config = object(field.configJson);
    const fail = () => {
      throw errors.validation(`Field ${field.key} has an invalid value.`);
    };
    if (
      field.fieldType === "TEXT" &&
      (typeof item.value !== "string" || item.value.length > 20_000)
    )
      fail();
    if (
      field.fieldType === "RICH_TEXT" &&
      (serializedSize(item.value) > 50_000 ||
        object(item.value).schemaVersion !== 1 ||
        object(item.value).type !== "doc")
    )
      fail();
    if (
      field.fieldType === "NUMBER" &&
      (typeof item.value !== "number" || !Number.isFinite(item.value))
    )
      fail();
    if (field.fieldType === "BOOLEAN" && typeof item.value !== "boolean")
      fail();
    if (
      field.fieldType === "DATE" &&
      (typeof item.value !== "string" || Number.isNaN(Date.parse(item.value)))
    )
      fail();
    if (
      field.fieldType === "SELECT" &&
      (typeof item.value !== "string" ||
        !strings(config.options).includes(item.value))
    )
      fail();
    if (
      field.fieldType === "MULTI_SELECT" &&
      (!Array.isArray(item.value) ||
        item.value.length > 100 ||
        !item.value.every(
          (entry) =>
            typeof entry === "string" &&
            strings(config.options).includes(entry),
        ))
    )
      fail();
    if (field.fieldType === "REFERENCE") {
      if (typeof item.value !== "string") fail();
      else referenceIds.push(item.value);
    }
    if (field.fieldType === "REFERENCE_LIST") {
      if (
        !Array.isArray(item.value) ||
        item.value.length > 100 ||
        !item.value.every((entry) => typeof entry === "string")
      )
        fail();
      else referenceIds.push(...(item.value as string[]));
    }
    if (field.fieldType === "URL") {
      try {
        const url = new URL(String(item.value));
        if (!(["http:", "https:"] as string[]).includes(url.protocol)) fail();
      } catch {
        fail();
      }
    }
    if (field.fieldType === "IMAGE" || field.fieldType === "FILE")
      throw errors.dependencyUnavailable();
  }
  if (
    enforceRequired &&
    type.fieldDefinitions.some(
      (field) =>
        field.requiredByUser &&
        !values.some((value) => value.fieldDefinitionId === field.id),
    )
  )
    throw errors.validation("A user-required custom field is missing.");
  if (referenceIds.length) {
    const count = await tx.storyEntity.count({
      where: {
        id: { in: [...new Set(referenceIds)] },
        projectId,
        status: "ACTIVE",
        archivedAt: null,
      },
    });
    if (count !== new Set(referenceIds).size)
      throw errors.validation(
        "Entity references must target active entities in the same project.",
      );
  }
  return type;
}

function summary(row: EntityRow): UniverseEntitySummary {
  return {
    id: row.id,
    projectId: row.projectId,
    typeId: row.entityTypeId,
    typeKey: row.entityType.key,
    typeName: row.entityType.name,
    name: row.name,
    aliases: strings(row.aliasesJson),
    summary: row.summary,
    status: row.status,
    tags: strings(row.tagsJson),
    icon: row.icon,
    colorToken: row.colorToken,
    version: row.version,
    updatedAt: row.updatedAt.toISOString(),
    fieldValues: row.fieldValues.map((value) => ({
      fieldDefinitionId: value.fieldDefinitionId,
      key: value.fieldDefinition.key,
      label: value.fieldDefinition.label,
      fieldType: value.fieldDefinition.fieldType as EntityFieldType,
      value: value.valueJson,
    })),
  };
}

const includeEntity = {
  entityType: true,
  fieldValues: {
    include: { fieldDefinition: true },
    orderBy: { fieldDefinition: { orderIndex: "asc" as const } },
    take: 100,
  },
} as const;

async function ownedEntity(
  tx: Tx,
  actor: SessionActor,
  projectId: string,
  entityId: string,
  version?: number,
) {
  const row = await tx.storyEntity.findFirst({
    where: {
      id: entityId,
      projectId,
      archivedAt: null,
      ...(version ? { version } : {}),
      project: { workspaceId: actor.workspaceId, status: "ACTIVE" },
    },
    include: includeEntity,
  });
  if (row) return row;
  const visible = version
    ? await tx.storyEntity.findFirst({
        where: {
          id: entityId,
          projectId,
          archivedAt: null,
          project: { workspaceId: actor.workspaceId, status: "ACTIVE" },
        },
        select: { id: true },
      })
    : null;
  if (visible) throw errors.conflict();
  throw errors.notFound();
}

async function writeValues(
  tx: Tx,
  entityId: string,
  values: Array<{ fieldDefinitionId: string; value: unknown }>,
) {
  await tx.entityFieldValue.deleteMany({ where: { entityId } });
  if (values.length)
    await tx.entityFieldValue.createMany({
      data: values.map((value) => ({
        entityId,
        fieldDefinitionId: value.fieldDefinitionId,
        valueJson: json(value.value),
      })),
    });
}

export class PrismaUniverseRepository implements UniverseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async catalog(actor: SessionActor, projectId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const project = await ownedProject(tx, actor, projectId);
        await ensureCatalog(tx);
        const [types, relationTypes] = await Promise.all([
          tx.entityType.findMany({
            where: {
              archivedAt: null,
              OR: [{ projectId }, { projectId: null }],
            },
            orderBy: [{ projectId: "desc" }, { name: "asc" }],
            take: 100,
            include: {
              fieldDefinitions: {
                where: { archivedAt: null },
                orderBy: { orderIndex: "asc" },
                take: 100,
              },
            },
          }),
          tx.relationType.findMany({
            where: {
              archivedAt: null,
              OR: [{ projectId }, { projectId: null }],
            },
            orderBy: { forwardLabel: "asc" },
            take: 100,
          }),
        ]);
        const catalog: UniverseCatalog = {
          entityTypes: types.map((type) => ({
            id: type.id,
            key: type.key,
            systemKey: type.systemKey,
            name: type.name,
            description: type.description,
            icon: type.icon,
            locale: type.locale,
            fields: type.fieldDefinitions.map((field) => ({
              id: field.id,
              key: field.key,
              label: field.label,
              fieldType: field.fieldType,
              requiredByUser: field.requiredByUser,
              orderIndex: field.orderIndex,
              config: field.configJson,
            })),
          })),
          relationTypes: relationTypes.map((type) => ({
            id: type.id,
            key: type.key,
            systemKey: type.systemKey,
            forwardLabel: type.forwardLabel,
            reverseLabel: type.reverseLabel,
            directional: type.directional,
          })),
        };
        return {
          ...catalog,
          projectStructuralVersion: project.structuralVersion,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
        timeout: 20_000,
      },
    );
  }

  async list(
    actor: SessionActor,
    projectId: string,
    query: {
      typeId?: string;
      status: "ACTIVE" | "ARCHIVED";
      tag?: string;
      cursor?: string;
      limit: number;
    },
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const project = await ownedProject(tx, actor, projectId);
        const rows = await tx.storyEntity.findMany({
          where: {
            projectId,
            status: query.status,
            archivedAt: null,
            ...(query.typeId ? { entityTypeId: query.typeId } : {}),
            ...(query.tag ? { tagsJson: { array_contains: [query.tag] } } : {}),
            ...(query.cursor
              ? { updatedAt: { lt: new Date(query.cursor) } }
              : {}),
          },
          orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
          take: query.limit + 1,
          include: includeEntity,
        });
        const page = rows.slice(0, query.limit);
        return {
          entities: page.map(summary),
          nextCursor:
            rows.length > query.limit
              ? page.at(-1)!.updatedAt.toISOString()
              : null,
          projectStructuralVersion: project.structuralVersion,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
        timeout: 20_000,
      },
    );
  }

  async create(
    actor: SessionActor,
    projectId: string,
    raw: Record<string, unknown>,
  ) {
    const input = raw as {
      typeId: string;
      name: string;
      aliases: string[];
      summary?: string;
      tags: string[];
      icon?: string;
      colorToken?: string;
      values: Array<{ fieldDefinitionId: string; value: unknown }>;
      expectedStructuralVersion: number;
    };
    return this.prisma.$transaction(
      async (tx) => {
        await ownedProject(
          tx,
          actor,
          projectId,
          input.expectedStructuralVersion,
        );
        await validateValues(tx, projectId, input.typeId, input.values, true);
        const created = await tx.storyEntity.create({
          data: {
            projectId,
            entityTypeId: input.typeId,
            createdById: actor.userId,
            name: input.name,
            aliasesJson: json(input.aliases),
            summary: input.summary,
            tagsJson: json(input.tags),
            icon: input.icon,
            colorToken: input.colorToken,
          },
          include: includeEntity,
        });
        await writeValues(tx, created.id, input.values);
        const projectStructuralVersion = await bump(
          tx,
          actor,
          projectId,
          input.expectedStructuralVersion,
        );
        await tx.outboxEvent.create({
          data: {
            workspaceId: actor.workspaceId,
            aggregateType: "StoryEntity",
            aggregateId: created.id,
            eventType: "universe.entity_created",
            payload: {
              projectId,
              entityId: created.id,
              entityTypeId: input.typeId,
              valueCount: input.values.length,
              structuralVersion: projectStructuralVersion,
            },
          },
        });
        return {
          entity: summary(
            await tx.storyEntity.findUniqueOrThrow({
              where: { id: created.id },
              include: includeEntity,
            }),
          ),
          projectStructuralVersion,
        };
      },
      { timeout: 20_000 },
    );
  }

  async quickCreate(
    actor: SessionActor,
    projectId: string,
    raw: Record<string, unknown>,
  ) {
    const input = raw as {
      typeId: string;
      name: string;
      note?: string;
      chapterId: string;
      blockId: string;
      selectionAnchor: number;
      selectionHead: number;
      expectedStructuralVersion: number;
    };
    return this.prisma.$transaction(
      async (tx) => {
        await ownedProject(
          tx,
          actor,
          projectId,
          input.expectedStructuralVersion,
        );
        await validateValues(tx, projectId, input.typeId, [], false);
        if (
          !(await tx.chapter.findFirst({
            where: { id: input.chapterId, projectId, archivedAt: null },
            select: { id: true },
          }))
        )
          throw errors.notFound();
        const entity = await tx.storyEntity.create({
          data: {
            projectId,
            entityTypeId: input.typeId,
            createdById: actor.userId,
            name: input.name,
            summary: input.note,
            metadataJson: json({ source: "SELECTION_QUICK_CREATE" }),
          },
          include: includeEntity,
        });
        const reference = await tx.storyReference.create({
          data: {
            projectId,
            sourceType: "MANUSCRIPT_BLOCK",
            sourceId: input.chapterId,
            sourceBlockId: input.blockId,
            targetType: "ENTITY",
            targetId: entity.id,
            relationshipKey: "mentions",
            provenanceType: "CHAPTER_PROSE",
            provenanceNote: `selection:${input.selectionAnchor}-${input.selectionHead}`,
          },
          select: { id: true },
        });
        const projectStructuralVersion = await bump(
          tx,
          actor,
          projectId,
          input.expectedStructuralVersion,
        );
        await tx.outboxEvent.create({
          data: {
            workspaceId: actor.workspaceId,
            aggregateType: "StoryEntity",
            aggregateId: entity.id,
            eventType: "universe.entity_quick_created",
            payload: {
              projectId,
              entityId: entity.id,
              entityTypeId: input.typeId,
              referenceId: reference.id,
              chapterId: input.chapterId,
              blockId: input.blockId,
              structuralVersion: projectStructuralVersion,
            },
          },
        });
        return {
          entity: summary(entity),
          referenceId: reference.id,
          projectStructuralVersion,
        };
      },
      { timeout: 20_000 },
    );
  }

  async detail(actor: SessionActor, projectId: string, entityId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const project = await ownedProject(tx, actor, projectId);
        const entity = await ownedEntity(tx, actor, projectId, entityId);
        const [outgoing, incoming, snapshots] = await Promise.all([
          tx.entityRelation.findMany({
            where: { projectId, fromEntityId: entityId, archivedAt: null },
            orderBy: { updatedAt: "desc" },
            take: 500,
            include: {
              toEntity: { select: { id: true, name: true } },
              relationType: true,
            },
          }),
          tx.entityRelation.findMany({
            where: { projectId, toEntityId: entityId, archivedAt: null },
            orderBy: { updatedAt: "desc" },
            take: 500,
            include: {
              fromEntity: { select: { id: true, name: true } },
              relationType: true,
            },
          }),
          tx.entityStateSnapshot.findMany({
            where: { projectId, entityId, archivedAt: null },
            orderBy: { orderIndex: "asc" },
            take: 1000,
          }),
        ]);
        const referencePages = await Promise.all(
          backlinkSourceTypes
            .filter((sourceType) => sourceType !== "CAPTURE")
            .map(async (sourceType) => {
              const where = {
                projectId,
                archivedAt: null,
                sourceType,
                targetType: "ENTITY" as const,
                targetId: entityId,
              };
              const [rows, total] = await Promise.all([
                tx.storyReference.findMany({
                  where,
                  orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                  take: 101,
                  select: {
                    sourceType: true,
                    sourceId: true,
                    sourceBlockId: true,
                    relationshipKey: true,
                    provenanceType: true,
                    createdAt: true,
                  },
                }),
                tx.storyReference.count({ where }),
              ]);
              const page = rows.slice(0, 100).map(
                (row): UniverseBacklink => ({
                  sourceType: String(row.sourceType),
                  sourceId: row.sourceId,
                  sourceBlockId: row.sourceBlockId,
                  relationshipKey: row.relationshipKey,
                  provenanceType: row.provenanceType,
                  createdAt: row.createdAt.toISOString(),
                }),
              );
              return {
                sourceType,
                page,
                total,
                nextCursor: rows.length > 100 ? page.at(-1)!.createdAt : null,
              };
            }),
        );
        const captureWhere = {
          projectId,
          entityContext: { array_contains: [entityId] },
        };
        const [captureRows, captureTotal] = await Promise.all([
          tx.capture.findMany({
            where: captureWhere,
            orderBy: [{ capturedAt: "desc" }, { id: "desc" }],
            take: 101,
            select: { id: true, capturedAt: true },
          }),
          tx.capture.count({ where: captureWhere }),
        ]);
        const capturePage: UniverseBacklink[] = captureRows
          .slice(0, 100)
          .map((row) => ({
            sourceType: "CAPTURE",
            sourceId: row.id,
            sourceBlockId: null,
            relationshipKey: "context",
            provenanceType: "CAPTURE_COORDINATE",
            createdAt: row.capturedAt.toISOString(),
          }));
        const backlinks = [
          ...referencePages.flatMap((group) => group.page),
          ...capturePage,
        ];
        const backlinkCounts = Object.fromEntries([
          ...referencePages
            .filter((group) => group.total)
            .map((group) => [group.sourceType, group.total]),
          ...(captureTotal ? [["CAPTURE", captureTotal] as const] : []),
        ]);
        const backlinkPages = Object.fromEntries([
          ...referencePages
            .filter((group) => group.total)
            .map((group) => [
              group.sourceType,
              {
                returned: group.page.length,
                total: group.total,
                nextCursor: group.nextCursor,
              },
            ]),
          ...(captureTotal
            ? [
                [
                  "CAPTURE",
                  {
                    returned: capturePage.length,
                    total: captureTotal,
                    nextCursor:
                      captureRows.length > 100
                        ? capturePage.at(-1)!.createdAt
                        : null,
                  },
                ] as const,
              ]
            : []),
        ]);
        return {
          detail: {
            entity: summary(entity),
            outgoing: outgoing.map((row) => ({
              id: row.id,
              otherId: row.toEntity.id,
              otherName: row.toEntity.name,
              label: row.relationType.forwardLabel,
              relationTypeId: row.relationTypeId,
              note: row.note,
            })),
            incoming: incoming.map((row) => ({
              id: row.id,
              otherId: row.fromEntity.id,
              otherName: row.fromEntity.name,
              label: row.relationType.reverseLabel,
              relationTypeId: row.relationTypeId,
              note: row.note,
            })),
            snapshots: snapshots.map((row) => ({
              id: row.id,
              anchorType: row.anchorType as EntityStateAnchorType,
              anchorId: row.anchorId,
              state: object(row.stateJson),
              note: row.note,
              orderIndex: row.orderIndex,
              sourceEntityVersion: row.sourceEntityVersion,
              createdAt: row.createdAt.toISOString(),
            })),
            backlinks,
            backlinkCounts,
            backlinkPages,
          },
          projectStructuralVersion: project.structuralVersion,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
        timeout: 20_000,
      },
    );
  }

  async update(
    actor: SessionActor,
    projectId: string,
    entityId: string,
    raw: Record<string, unknown>,
  ) {
    const input = raw as {
      expectedEntityVersion: number;
      expectedStructuralVersion: number;
      name?: string;
      aliases?: string[];
      summary?: string | null;
      tags?: string[];
      icon?: string | null;
      colorToken?: string | null;
      values?: Array<{ fieldDefinitionId: string; value: unknown }>;
      status?: "ACTIVE" | "ARCHIVED";
    };
    return this.prisma.$transaction(async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      const current = await ownedEntity(
        tx,
        actor,
        projectId,
        entityId,
        input.expectedEntityVersion,
      );
      if (input.values)
        await validateValues(
          tx,
          projectId,
          current.entityTypeId,
          input.values,
          true,
        );
      await tx.entityRevision.create({
        data: {
          projectId,
          entityId,
          version: current.version,
          snapshot: json({
            ...summary(current),
            fieldValues: current.fieldValues.map((value) => ({
              fieldDefinitionId: value.fieldDefinitionId,
              value: value.valueJson,
            })),
          }),
          reason: "entity-update",
          createdById: actor.userId,
        },
      });
      await tx.storyEntity.update({
        where: { id: entityId },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.aliases !== undefined
            ? { aliasesJson: json(input.aliases) }
            : {}),
          ...(input.summary !== undefined ? { summary: input.summary } : {}),
          ...(input.tags !== undefined ? { tagsJson: json(input.tags) } : {}),
          ...(input.icon !== undefined ? { icon: input.icon } : {}),
          ...(input.colorToken !== undefined
            ? { colorToken: input.colorToken }
            : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          version: { increment: 1 },
        },
      });
      if (input.values) await writeValues(tx, entityId, input.values);
      const projectStructuralVersion = await bump(
        tx,
        actor,
        projectId,
        input.expectedStructuralVersion,
      );
      await tx.outboxEvent.create({
        data: {
          workspaceId: actor.workspaceId,
          aggregateType: "StoryEntity",
          aggregateId: entityId,
          eventType: "universe.entity_updated",
          payload: {
            projectId,
            entityId,
            version: current.version + 1,
            structuralVersion: projectStructuralVersion,
          },
        },
      });
      return {
        entity: summary(
          await tx.storyEntity.findUniqueOrThrow({
            where: { id: entityId },
            include: includeEntity,
          }),
        ),
        projectStructuralVersion,
      };
    });
  }

  async createType(
    actor: SessionActor,
    projectId: string,
    raw: Record<string, unknown>,
  ) {
    const input = raw as {
      key: string;
      name: string;
      description?: string;
      icon?: string;
      fields: Array<{
        key: string;
        label: string;
        fieldType: EntityFieldType;
        requiredByUser: boolean;
        orderIndex: number;
        config: Record<string, unknown>;
      }>;
      expectedStructuralVersion: number;
    };
    return this.prisma.$transaction(async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      if (
        (await tx.entityType.count({
          where: { projectId, archivedAt: null },
        })) >= 100
      )
        throw errors.validation(
          "A project may have at most 100 custom entity types.",
        );
      const created = await tx.entityType.create({
        data: {
          projectId,
          key: input.key,
          name: input.name,
          description: input.description,
          icon: input.icon,
          locale: "en",
          fieldDefinitions: {
            create: input.fields.map((field) => ({
              key: field.key,
              label: field.label,
              fieldType: field.fieldType,
              requiredByUser: field.requiredByUser,
              orderIndex: field.orderIndex,
              configJson: json(field.config),
            })),
          },
        },
        select: { id: true },
      });
      const projectStructuralVersion = await bump(
        tx,
        actor,
        projectId,
        input.expectedStructuralVersion,
      );
      return { typeId: created.id, projectStructuralVersion };
    });
  }

  async createRelationType(
    actor: SessionActor,
    projectId: string,
    raw: Record<string, unknown>,
  ) {
    const input = raw as {
      key: string;
      forwardLabel: string;
      reverseLabel: string;
      directional: boolean;
      expectedStructuralVersion: number;
    };
    return this.prisma.$transaction(async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      if (
        (await tx.relationType.count({
          where: { projectId, archivedAt: null },
        })) >= 100
      )
        throw errors.validation(
          "A project may have at most 100 custom relation types.",
        );
      const created = await tx.relationType.create({
        data: {
          projectId,
          key: input.key,
          forwardLabel: input.forwardLabel,
          reverseLabel: input.reverseLabel,
          directional: input.directional,
        },
        select: { id: true },
      });
      const projectStructuralVersion = await bump(
        tx,
        actor,
        projectId,
        input.expectedStructuralVersion,
      );
      await tx.outboxEvent.create({
        data: {
          workspaceId: actor.workspaceId,
          aggregateType: "RelationType",
          aggregateId: created.id,
          eventType: "universe.relation_type_created",
          payload: {
            projectId,
            relationTypeId: created.id,
            directional: input.directional,
            structuralVersion: projectStructuralVersion,
          },
        },
      });
      return { relationTypeId: created.id, projectStructuralVersion };
    });
  }

  async createRelation(
    actor: SessionActor,
    projectId: string,
    raw: Record<string, unknown>,
  ) {
    const input = raw as {
      fromEntityId: string;
      toEntityId: string;
      relationTypeId: string;
      note?: string;
      validFrom?: string;
      validTo?: string;
      expectedStructuralVersion: number;
    };
    return this.prisma.$transaction(async (tx) => {
      const project = await ownedProject(
        tx,
        actor,
        projectId,
        input.expectedStructuralVersion,
      );
      const entities = await tx.storyEntity.count({
        where: {
          id: { in: [input.fromEntityId, input.toEntityId] },
          projectId,
          status: "ACTIVE",
          archivedAt: null,
        },
      });
      if (entities !== 2) throw errors.notFound();
      if (
        !(await tx.relationType.findFirst({
          where: {
            id: input.relationTypeId,
            archivedAt: null,
            OR: [{ projectId }, { projectId: null }],
          },
          select: { id: true },
        }))
      )
        throw errors.notFound();
      if (
        (await tx.entityRelation.count({
          where: {
            projectId,
            fromEntityId: input.fromEntityId,
            archivedAt: null,
          },
        })) >= 500
      )
        throw errors.validation(
          "An entity may have at most 500 outgoing relations.",
        );
      const existing = await tx.entityRelation.findUnique({
        where: {
          fromEntityId_toEntityId_relationTypeId: {
            fromEntityId: input.fromEntityId,
            toEntityId: input.toEntityId,
            relationTypeId: input.relationTypeId,
          },
        },
        select: { id: true },
      });
      if (existing)
        return {
          relationId: existing.id,
          replayed: true,
          projectStructuralVersion: project.structuralVersion,
        };
      const relation = await tx.entityRelation.create({
        data: {
          projectId,
          fromEntityId: input.fromEntityId,
          toEntityId: input.toEntityId,
          relationTypeId: input.relationTypeId,
          note: input.note,
          validFrom: input.validFrom,
          validTo: input.validTo,
        },
        select: { id: true },
      });
      const projectStructuralVersion = await bump(
        tx,
        actor,
        projectId,
        input.expectedStructuralVersion,
      );
      return {
        relationId: relation.id,
        replayed: false,
        projectStructuralVersion,
      };
    });
  }

  async createSnapshot(
    actor: SessionActor,
    projectId: string,
    entityId: string,
    raw: Record<string, unknown>,
  ) {
    const input = raw as {
      anchorType: EntityStateAnchorType;
      anchorId?: string;
      state: Record<string, unknown>;
      note?: string;
      orderIndex: number;
      expectedStructuralVersion: number;
    };
    return this.prisma.$transaction(async (tx) => {
      await ownedProject(tx, actor, projectId, input.expectedStructuralVersion);
      const entity = await ownedEntity(tx, actor, projectId, entityId);
      if (serializedSize(input.state) > 50_000)
        throw errors.validation(
          "Entity state must be at most 50,000 serialized characters.",
        );
      if (
        (await tx.entityStateSnapshot.count({
          where: { projectId, entityId, archivedAt: null },
        })) >= 1000
      )
        throw errors.validation(
          "An entity may have at most 1,000 state snapshots.",
        );
      if (input.anchorType === "TIMELINE_EVENT")
        throw errors.dependencyUnavailable();
      if (input.anchorId) {
        const exists =
          input.anchorType === "CHAPTER"
            ? await tx.chapter.findFirst({
                where: { id: input.anchorId, projectId, archivedAt: null },
                select: { id: true },
              })
            : input.anchorType === "VOLUME"
              ? await tx.volume.findFirst({
                  where: { id: input.anchorId, projectId, archivedAt: null },
                  select: { id: true },
                })
              : input.anchorType === "MILESTONE"
                ? await tx.milestone.findFirst({
                    where: { id: input.anchorId, projectId, archivedAt: null },
                    select: { id: true },
                  })
                : null;
        if (!exists) throw errors.notFound();
      }
      const snapshot = await tx.entityStateSnapshot.create({
        data: {
          projectId,
          entityId,
          anchorType: input.anchorType,
          anchorId: input.anchorId,
          stateJson: json(input.state),
          note: input.note,
          orderIndex: input.orderIndex,
          sourceEntityVersion: entity.version,
        },
        select: { id: true },
      });
      const projectStructuralVersion = await bump(
        tx,
        actor,
        projectId,
        input.expectedStructuralVersion,
      );
      await tx.outboxEvent.create({
        data: {
          workspaceId: actor.workspaceId,
          aggregateType: "EntityStateSnapshot",
          aggregateId: snapshot.id,
          eventType: "universe.entity_state_created",
          payload: {
            projectId,
            entityId,
            snapshotId: snapshot.id,
            anchorType: input.anchorType,
            anchorId: input.anchorId ?? null,
            orderIndex: input.orderIndex,
            structuralVersion: projectStructuralVersion,
          },
        },
      });
      return { snapshotId: snapshot.id, projectStructuralVersion };
    });
  }
}
