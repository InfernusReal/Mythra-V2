import { describe, expect, it } from "vitest";
import type { ContextSnapshot } from "@/domains/context/application/ports";
import { DeterministicContextResolver, makeContextKey } from "@/domains/context/domain/resolver";
import { contextQuerySchema } from "@/domains/context/domain/types";

const ids = { project: "10000000-0000-4000-8000-000000000001", chapter: "10000000-0000-4000-8000-000000000002", block: "10000000-0000-4000-8000-000000000003", outline: "10000000-0000-4000-8000-000000000004", milestone: "10000000-0000-4000-8000-000000000005", reference: "10000000-0000-4000-8000-000000000006", target: "10000000-0000-4000-8000-000000000007", relation: "10000000-0000-4000-8000-000000000008", intent: "10000000-0000-4000-8000-000000000009" };
const snapshot: ContextSnapshot = {
  projectId: ids.project, projectStructuralVersion: 12, chapterId: ids.chapter, chapterVersion: 4,
  outline: { id: ids.outline, title: "Chapter plan", purpose: "Find the proof", emotionalMovement: "doubt to resolve", plainText: "", version: 2 }, extraOutlines: [],
  milestones: [{ id: ids.milestone, title: "Proof discovered", description: null, role: "TURN", weight: 1, version: 1 }],
  references: [{ id: ids.reference, sourceType: "MANUSCRIPT_BLOCK", sourceId: ids.chapter, sourceBlockId: ids.block, targetType: "MILESTONE", targetId: ids.target, targetBlockId: null, relationshipKey: "foreshadows", targetLabel: "Later reveal", version: 1 }],
  causal: [{ id: ids.relation, relationType: "ENABLES", direction: "UPSTREAM", endpointType: "STORY_CHANGE", endpointId: ids.target, endpointBlockId: null, endpointLabel: "Archive opened", anchorType: "MANUSCRIPT_BLOCK", anchorId: ids.chapter, anchorBlockId: ids.block, importance: 100, version: 1 }],
  intents: [{ id: ids.intent, targetType: "CHAPTER", targetId: ids.chapter, blockId: null, category: "TENSION", customCategory: null, intentText: "Do not reveal the architect", version: 1 }],
  pins: [], preferences: { mutedTypes: [], directiveEnabled: true }
};

describe("Contextual Writing Field resolver", () => {
  it("obeys cursor, outline, milestone, direct-causal, then general-reference ordering", () => {
    const query = contextQuerySchema.parse({ cursorBlockId: ids.block, selectedIds: [] }); const result = new DeterministicContextResolver().resolve(snapshot, query);
    expect(result.descriptors.map((item) => item.type)).toEqual(["REFERENCE", "CHAPTER_OUTLINE", "MILESTONE", "CAUSAL", "NARRATIVE_INTENT"]);
  });
  it("places pins first even when the card type is muted", () => {
    const input = { ...snapshot, pins: [{ cardType: "CAUSAL" as const, sourceId: ids.relation }], preferences: { mutedTypes: ["CAUSAL" as const], directiveEnabled: true } };
    const result = new DeterministicContextResolver().resolve(input, contextQuerySchema.parse({ selectedIds: [] })); expect(result.descriptors[0]).toMatchObject({ id: `CAUSAL:${ids.relation}`, pinned: true, priority: 1000 });
  });
  it("keeps Because and Consequences first-class and provenance-backed", () => {
    const downstream = { ...snapshot.causal[0]!, id: "10000000-0000-4000-8000-000000000010", direction: "DOWNSTREAM" as const, endpointLabel: "Confrontation enabled" };
    const result = new DeterministicContextResolver().resolve({ ...snapshot, causal: [...snapshot.causal, downstream] }, contextQuerySchema.parse({ selectedIds: [] }));
    expect(result.directive.becauseItems).toHaveLength(1); expect(result.directive.consequenceItems).toHaveLength(1); expect(result.directive.becauseItems[0]!.source.type).toBe("CAUSAL");
  });
  it("caps cards and exposes More without losing the eligible count", () => {
    const result = new DeterministicContextResolver().resolve(snapshot, contextQuerySchema.parse({ selectedIds: [], cardCap: 2 })); expect(result.descriptors).toHaveLength(2); expect(result.page).toMatchObject({ totalEligibleCards: 5, hasMore: true }); expect(result.descriptors[1]!.actions.at(-1)?.type).toBe("MORE");
  });
  it("derives a stable key from every Appendix A stability coordinate", () => {
    const base = contextQuerySchema.parse({ cursorBlockId: ids.block, selectedIds: [ids.target] }); const first = makeContextKey(snapshot, base); expect(makeContextKey(snapshot, base)).toBe(first); expect(makeContextKey(snapshot, { ...base, selectedIds: [] })).not.toBe(first); expect(makeContextKey({ ...snapshot, chapterVersion: 5 }, base)).not.toBe(first); expect(makeContextKey({ ...snapshot, pins: [{ cardType: "MILESTONE", sourceId: ids.milestone }] }, base)).not.toBe(first);
  });
  it("marks an explicitly mismatched requested context key stale", () => {
    const result = new DeterministicContextResolver().resolve(snapshot, contextQuerySchema.parse({ selectedIds: [], requestedContextKey: "0".repeat(64) })); expect(result.directive.stale).toBe(true); expect(result.contextKey).not.toBe(result.requestedContextKey);
  });
  it("registers canonical providers through Timeline, Note and Research after S11", () => { expect(new DeterministicContextResolver().registry.activeProviderIds()).toEqual(["chapter-outline", "milestone", "direct-causal", "existing-reference", "narrative-intent", "capture", "entity", "timeline", "note", "research", "search", "language"]); });
});
