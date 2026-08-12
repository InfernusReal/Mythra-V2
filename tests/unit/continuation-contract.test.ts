import { describe, expect, it } from "vitest";
import { writingPositionSchema } from "@/domains/writing/application/continuation-ports";

const id = "16b89770-6139-42fb-a1c9-070c8b675795";
const valid = { activeChapterId: id, blockId: id, cursorOffset: 0, selectionAnchor: 1, selectionHead: 1, scrollTop: 0, contextPanelMode: "CLOSED", pinIds: [], capturedAt: "2026-08-12T12:00:00.000Z" };

describe("writing-position contract", () => {
  it("accepts the complete independent continuation seam", () => {
    expect(writingPositionSchema.parse(valid)).toEqual(valid);
    expect(writingPositionSchema.parse({ ...valid, contextPanelMode: "PINS", pinIds: Array.from({ length: 50 }, () => id) }).pinIds).toHaveLength(50);
  });

  it("rejects negative/unbounded positions, excess pins, content, and unknown modes", () => {
    expect(writingPositionSchema.safeParse({ ...valid, cursorOffset: -1 }).success).toBe(false);
    expect(writingPositionSchema.safeParse({ ...valid, scrollTop: 10_000_001 }).success).toBe(false);
    expect(writingPositionSchema.safeParse({ ...valid, pinIds: Array.from({ length: 51 }, () => id) }).success).toBe(false);
    expect(writingPositionSchema.safeParse({ ...valid, manuscript: "not metadata" }).success).toBe(false);
    expect(writingPositionSchema.safeParse({ ...valid, contextPanelMode: "ACTIVE_RESOLVER" }).success).toBe(false);
  });
});
