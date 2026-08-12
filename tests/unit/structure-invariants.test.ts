import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/contracts/errors";
import { assertExplicitHardTarget, nextAvailableSequence, previewReorder } from "@/domains/structure/domain/invariants";

describe("Structure Core ordering invariants", () => {
  it("previews transactional reordering without changing reference identities", () => {
    const preview = previewReorder(["chapter-a", "chapter-b", "chapter-c"], "chapter-c", 0);
    expect(preview).toEqual({
      orderedIds: ["chapter-c", "chapter-a", "chapter-b"],
      renumbered: [
        { id: "chapter-c", from: 2, to: 0 },
        { id: "chapter-a", from: 0, to: 1 },
        { id: "chapter-b", from: 1, to: 2 }
      ],
      referenceIdsPreserved: true
    });
  });

  it("rejects duplicate order identities and unavailable destinations", () => {
    expect(() => previewReorder(["a", "a"], "a", 0)).toThrow(AppError);
    expect(() => previewReorder(["a", "b"], "c", 0)).toThrow(AppError);
    expect(() => previewReorder(["a", "b"], "a", 2)).toThrow(AppError);
  });

  it("keeps creative targets advisory unless hard mode is explicit and complete", () => {
    expect(() => assertExplicitHardTarget(undefined, false)).not.toThrow();
    expect(() => assertExplicitHardTarget(2_000, true)).not.toThrow();
    expect(() => assertExplicitHardTarget(undefined, true)).toThrow(AppError);
  });

  it("finds the next stable unused sequence", () => {
    expect(nextAvailableSequence(new Set([0, 1, 3]), 0)).toBe(2);
    expect(nextAvailableSequence(new Set([4]), 2)).toBe(2);
  });
});

