import { describe, expect, it } from "vitest";
import { storyReferenceInputSchema } from "@/domains/references/domain/story-reference";

const first = "00000000-0000-4000-8000-000000000001";
const second = "00000000-0000-4000-8000-000000000002";

describe("non-causal StoryReference contract", () => {
  it("accepts active heterogeneous S4 endpoints", () => {
    expect(storyReferenceInputSchema.parse({
      expectedStructuralVersion: 1,
      sourceType: "CHAPTER",
      sourceId: first,
      targetType: "SCENE",
      targetId: second,
      relationshipKey: "foreshadows",
      provenanceType: "CHAPTER_PROSE"
    }).relationshipKey).toBe("foreshadows");
  });

  it("rejects self references and later-domain endpoints while accepting active Capture", () => {
    expect(storyReferenceInputSchema.safeParse({ expectedStructuralVersion: 1, sourceType: "CHAPTER", sourceId: first, targetType: "CHAPTER", targetId: first }).success).toBe(false);
    expect(storyReferenceInputSchema.safeParse({ expectedStructuralVersion: 1, sourceType: "NOTE", sourceId: first, targetType: "CHAPTER", targetId: second }).success).toBe(false);
    expect(storyReferenceInputSchema.safeParse({ expectedStructuralVersion: 1, sourceType: "CHAPTER", sourceId: first, targetType: "MILESTONE", targetId: second }).success).toBe(true);
    expect(storyReferenceInputSchema.safeParse({ expectedStructuralVersion: 1, sourceType: "CHAPTER", sourceId: first, targetType: "CAPTURE", targetId: second }).success).toBe(true);
  });
});
