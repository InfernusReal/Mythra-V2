import { describe, expect, it } from "vitest";
import { descendingCursorWhere, encodeListCursor, listCursorSchema } from "@/lib/contracts/list-cursor";
import { captureListSchema } from "@/domains/capture/domain/types";
import { noteListSchema } from "@/domains/notes/domain/types";
import { researchListSchema } from "@/domains/research/domain/types";

const id = "a0000000-0000-4000-8000-000000000001";
const date = new Date("2026-09-05T00:00:00.000Z");

describe("descending timestamp/identity list cursors", () => {
  it("retains the tie-breaker and accepts legacy timestamps without widening bounds", () => {
    const cursor = encodeListCursor({ id }, date);
    expect(descendingCursorWhere("updatedAt", cursor)).toEqual({ OR: [{ updatedAt: { lt: date } }, { updatedAt: date, id: { lt: id } }] });
    expect(descendingCursorWhere("capturedAt", date.toISOString())).toEqual({ capturedAt: { lt: date } });
    expect(descendingCursorWhere("updatedAt")).toEqual({});
    for (const schema of [captureListSchema, noteListSchema, researchListSchema]) {
      expect(schema.parse({ cursor }).cursor).toBe(cursor);
      expect(schema.parse({ cursor: date.toISOString() }).cursor).toBe(date.toISOString());
      expect(schema.safeParse({ cursor, limit: 101 }).success).toBe(false);
    }
  });
  it("rejects invalid or content-bearing cursors", () => {
    for (const cursor of ["private text", `${date.toISOString()}|prose`, `${date.toISOString()}|${id}|extra`, `${date.toISOString()}|`, "x".repeat(81), "2026-02-31T00:00:00Z"]) expect(listCursorSchema.safeParse(cursor).success).toBe(false);
  });
});
