import { describe, expect, it } from "vitest";
import { boundedAutocompleteLimit } from "@/domains/universe/application/autocomplete";
import {
  entityTemplates,
  relationTemplates,
} from "@/domains/universe/domain/templates";
import {
  activeEntityFieldTypes,
  entityCreateSchema,
  entityQuickCreateSchema,
  entitySnapshotCreateSchema,
  entityTypeCreateSchema,
} from "@/domains/universe/domain/types";

const id = (n: number) =>
  `90000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
describe("Universe domain", () => {
  it("ships every optional canonical template with stable keys and no completeness requirement", () => {
    expect(entityTemplates.map((item) => item.key)).toEqual([
      "character",
      "location",
      "faction",
      "organization",
      "culture",
      "religion",
      "power_system",
      "item",
      "species",
      "technology",
      "event",
      "lore",
      "custom",
    ]);
    expect(new Set(entityTemplates.map((item) => item.key)).size).toBe(13);
    expect(
      entityTemplates.find((item) => item.key === "custom")?.fields,
    ).toEqual([]);
    expect(relationTemplates).toHaveLength(7);
  });
  it("validates minimal creation, all active field kinds, and user-owned custom schemas", () => {
    expect(
      entityCreateSchema.parse({
        typeId: id(1),
        name: "Minimal",
        expectedStructuralVersion: 1,
      }),
    ).toMatchObject({ aliases: [], tags: [], values: [] });
    expect(activeEntityFieldTypes).toEqual([
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
    ]);
    expect(
      entityTypeCreateSchema.parse({
        key: "custom_people",
        name: "Custom people",
        expectedStructuralVersion: 1,
        fields: [
          {
            key: "motive",
            label: "Motive",
            fieldType: "TEXT",
            requiredByUser: false,
            orderIndex: 0,
            config: {},
          },
        ],
      }).fields,
    ).toHaveLength(1);
  });
  it("requires valid selection coordinates and matching immutable state anchors", () => {
    const quick = {
      typeId: id(1),
      name: "Visible name",
      chapterId: id(2),
      blockId: "block",
      selectionAnchor: 4,
      selectionHead: 12,
      expectedStructuralVersion: 1,
    };
    expect(entityQuickCreateSchema.parse(quick).selectionHead).toBe(12);
    expect(
      entityQuickCreateSchema.safeParse({ ...quick, selectionHead: 3 }).success,
    ).toBe(false);
    expect(
      entitySnapshotCreateSchema.safeParse({
        anchorType: "UNANCHORED",
        anchorId: id(2),
        state: {},
        orderIndex: 0,
        expectedStructuralVersion: 1,
      }).success,
    ).toBe(false);
    expect(
      entitySnapshotCreateSchema.safeParse({
        anchorType: "CHAPTER",
        state: {},
        orderIndex: 0,
        expectedStructuralVersion: 1,
      }).success,
    ).toBe(false);
    expect(
      entitySnapshotCreateSchema.safeParse({
        anchorType: "UNANCHORED",
        state: {},
        orderIndex: 0,
        expectedStructuralVersion: 1,
      }).success,
    ).toBe(true);
  });
  it("keeps the future at-mention provider seam strictly bounded", () => {
    expect(boundedAutocompleteLimit(0)).toBe(1);
    expect(boundedAutocompleteLimit(12.9)).toBe(12);
    expect(boundedAutocompleteLimit(500)).toBe(20);
  });
});
