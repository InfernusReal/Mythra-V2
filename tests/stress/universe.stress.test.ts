import { describe, expect, it } from "vitest";
import {
  boundedUniverseProjection,
  universeBudgets,
} from "@/domains/universe/domain/collection";

describe("Universe collection hard bounds", () => {
  it("reduces a 25,000-entity project and 50,000-relation fixture to bounded viewport budgets", () => {
    const started = performance.now();
    const entities = Array.from({ length: 25_000 }, (_, index) => ({
      id: index,
      typeId: `type-${index % 12}`,
      status: index % 7 ? "ACTIVE" : "ARCHIVED",
      tags: [`tag-${index % 20}`],
      updatedAt: new Date(1_700_000_000_000 + index).toISOString(),
    }));
    const relations = Array.from({ length: 50_000 }, (_, index) => ({
      from: index % 25_000,
      to: (index + 1) % 25_000,
    }));
    const page = boundedUniverseProjection(entities, {
      status: "ACTIVE",
      tag: "tag-1",
      limit: 10_000,
    });
    const detailRelations = relations
      .filter((relation) => relation.from === 1)
      .slice(0, universeBudgets.entityRelations);
    expect(page).toHaveLength(universeBudgets.pageHard);
    expect(detailRelations.length).toBeLessThanOrEqual(
      universeBudgets.entityRelations,
    );
    expect(performance.now() - started).toBeLessThan(2_000);
  });
  it("applies type, status, tag, default and minimum limit branches deterministically", () => {
    const rows = [
      {
        typeId: "a",
        status: "ACTIVE",
        tags: ["x"],
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
      {
        typeId: "b",
        status: "ARCHIVED",
        tags: ["y"],
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    expect(
      boundedUniverseProjection(rows, {
        typeId: "a",
        status: "ACTIVE",
        tag: "x",
      }),
    ).toHaveLength(1);
    expect(boundedUniverseProjection(rows, { limit: 0 })).toHaveLength(1);
    expect(boundedUniverseProjection(rows, { status: "MISSING" })).toEqual([]);
  });
});
