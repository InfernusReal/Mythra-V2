import { z } from "zod";
import { entityTemplates } from "./templates";

export const entityFieldTypes = [
  "TEXT",
  "RICH_TEXT",
  "NUMBER",
  "BOOLEAN",
  "DATE",
  "SELECT",
  "MULTI_SELECT",
  "REFERENCE",
  "REFERENCE_LIST",
  "URL",
  "IMAGE",
  "FILE",
] as const;
export const activeEntityFieldTypes = entityFieldTypes.filter(
  (type) => type !== "IMAGE" && type !== "FILE",
) as Exclude<(typeof entityFieldTypes)[number], "IMAGE" | "FILE">[];
export const entityStateAnchorTypes = [
  "UNANCHORED",
  "CHAPTER",
  "VOLUME",
  "MILESTONE",
  "TIMELINE_EVENT",
] as const;
export const activeEntityStateAnchorTypes = [
  "UNANCHORED",
  "CHAPTER",
  "VOLUME",
  "MILESTONE",
] as const;
export type EntityFieldType = (typeof entityFieldTypes)[number];
export type EntityStateAnchorType = (typeof entityStateAnchorTypes)[number];

const key = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z][a-z0-9_]*$/);
const uuid = z.string().uuid();
const aliases = z.array(z.string().trim().min(1).max(240)).max(100).default([]);
const tags = z.array(z.string().trim().min(1).max(80)).max(100).default([]);
const value = z
  .object({ fieldDefinitionId: uuid, value: z.unknown() })
  .strict();

export const universeListSchema = z
  .object({
    typeId: uuid.optional(),
    status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE"),
    tag: z.string().max(80).optional(),
    cursor: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();
export const entityCreateSchema = z
  .object({
    typeId: uuid,
    name: z.string().trim().min(1).max(240),
    aliases,
    summary: z.string().max(20_000).optional(),
    tags,
    icon: z.string().max(80).optional(),
    colorToken: z.string().max(80).optional(),
    values: z.array(value).max(100).default([]),
    expectedStructuralVersion: z.number().int().positive(),
  })
  .strict();
export const entityQuickCreateSchema = z
  .object({
    typeId: uuid,
    name: z.string().trim().min(1).max(240),
    note: z.string().trim().max(1_000).optional(),
    chapterId: uuid,
    blockId: z.string().min(1).max(128),
    selectionAnchor: z.number().int().nonnegative(),
    selectionHead: z.number().int().nonnegative(),
    expectedStructuralVersion: z.number().int().positive(),
  })
  .strict()
  .refine(
    (input) => input.selectionHead >= input.selectionAnchor,
    "Selection coordinates are invalid.",
  );
export const entityUpdateSchema = z
  .object({
    expectedEntityVersion: z.number().int().positive(),
    expectedStructuralVersion: z.number().int().positive(),
    name: z.string().trim().min(1).max(240).optional(),
    aliases: aliases.optional(),
    summary: z.string().max(20_000).nullable().optional(),
    tags: tags.optional(),
    icon: z.string().max(80).nullable().optional(),
    colorToken: z.string().max(80).nullable().optional(),
    values: z.array(value).max(100).optional(),
    status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  })
  .strict();
export const fieldDefinitionSchema = z
  .object({
    key,
    label: z.string().trim().min(1).max(120),
    fieldType: z.enum(entityFieldTypes),
    requiredByUser: z.boolean().default(false),
    orderIndex: z.number().int().min(0).max(99),
    config: z.record(z.string(), z.unknown()).default({}),
  })
  .strict();
export const entityTypeCreateSchema = z
  .object({
    key,
    name: z.string().trim().min(1).max(120),
    description: z.string().max(2_000).optional(),
    icon: z.string().max(80).optional(),
    fields: z.array(fieldDefinitionSchema).max(100).default([]),
    expectedStructuralVersion: z.number().int().positive(),
  })
  .strict();
export const relationTypeCreateSchema = z
  .object({
    key,
    forwardLabel: z.string().trim().min(1).max(120),
    reverseLabel: z.string().trim().min(1).max(120),
    directional: z.boolean().default(true),
    expectedStructuralVersion: z.number().int().positive(),
  })
  .strict();
export const entityRelationCreateSchema = z
  .object({
    fromEntityId: uuid,
    toEntityId: uuid,
    relationTypeId: uuid,
    note: z.string().max(5_000).optional(),
    validFrom: z.string().max(160).optional(),
    validTo: z.string().max(160).optional(),
    expectedStructuralVersion: z.number().int().positive(),
  })
  .strict()
  .refine(
    (input) => input.fromEntityId !== input.toEntityId,
    "An entity cannot relate to itself.",
  );
export const entitySnapshotCreateSchema = z
  .object({
    anchorType: z.enum(entityStateAnchorTypes).default("UNANCHORED"),
    anchorId: uuid.optional(),
    state: z.record(z.string(), z.unknown()),
    note: z.string().max(5_000).optional(),
    orderIndex: z.number().int().min(0).max(999),
    expectedStructuralVersion: z.number().int().positive(),
  })
  .strict()
  .superRefine((input, context) => {
    if ((input.anchorType === "UNANCHORED") === Boolean(input.anchorId))
      context.addIssue({
        code: "custom",
        message: "Snapshot anchor identity does not match its type.",
      });
  });

export type UniverseEntitySummary = {
  id: string;
  projectId: string;
  typeId: string;
  typeKey: string;
  typeName: string;
  name: string;
  aliases: string[];
  summary: string | null;
  status: "ACTIVE" | "ARCHIVED";
  tags: string[];
  icon: string | null;
  colorToken: string | null;
  version: number;
  updatedAt: string;
  fieldValues: Array<{
    fieldDefinitionId: string;
    key: string;
    label: string;
    fieldType: EntityFieldType;
    value: unknown;
  }>;
};
export type UniverseBacklink = {
  sourceType: string;
  sourceId: string;
  sourceBlockId: string | null;
  relationshipKey: string;
  provenanceType: string;
  createdAt: string;
};
export type UniverseEntityDetail = {
  entity: UniverseEntitySummary;
  outgoing: Array<{
    id: string;
    otherId: string;
    otherName: string;
    label: string;
    relationTypeId: string;
    note: string | null;
  }>;
  incoming: Array<{
    id: string;
    otherId: string;
    otherName: string;
    label: string;
    relationTypeId: string;
    note: string | null;
  }>;
  snapshots: Array<{
    id: string;
    anchorType: EntityStateAnchorType;
    anchorId: string | null;
    state: Record<string, unknown>;
    note: string | null;
    orderIndex: number;
    sourceEntityVersion: number;
    createdAt: string;
  }>;
  backlinks: UniverseBacklink[];
  backlinkCounts: Record<string, number>;
  backlinkPages: Record<
    string,
    { returned: number; total: number; nextCursor: string | null }
  >;
};
export const systemTemplateKeys = entityTemplates.map(
  (template) => template.key,
);
