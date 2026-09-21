import { describe, expect, it } from "vitest";
import { affectedProjectionKinds, canonicalDomainEventTypes, directiveInvalidationEvents, eventCatalogDigest, normalizeDomainEvent } from "@/domains/live-model/domain/events";

describe("Live Story Model event catalog", () => {
  const stored = { id: "10000000-0000-4000-8000-000000000001", workspaceId: "10000000-0000-4000-8000-000000000002", aggregateType: "Project", aggregateId: "10000000-0000-4000-8000-000000000003", schemaVersion: 1, payload: { projectId: "10000000-0000-4000-8000-000000000003", structuralVersion: 7, objectType: "CAUSAL_RELATION", objectId: "10000000-0000-4000-8000-000000000004" }, createdAt: new Date("2026-08-29T00:00:00.000Z") };

  it("enumerates every Bible 7.4 event and the causal create/update/delete invalidation set", () => {
    expect(canonicalDomainEventTypes).toHaveLength(14);
    expect(canonicalDomainEventTypes).toEqual(expect.arrayContaining(["ProjectCreated", "VolumeReordered", "ChapterUpdated", "ChapterOutlineUpdated", "MilestoneLinkedToChapter", "EntityUpdated", "ReferenceCreated", "TimelineEventUpdated", "CaptureFiled", "RevisionCheckpointCreated", "StoryChangeUpdated", "CausalRelationCreated", "CausalRelationUpdated", "CausalRelationDeleted"]));
    expect(directiveInvalidationEvents).toEqual(expect.arrayContaining(["CausalRelationCreated", "CausalRelationUpdated", "CausalRelationDeleted"]));
    expect(eventCatalogDigest()).toMatch(/^[0-9a-f]{64}$/u);
  });

  it("normalizes rolling-compatible legacy names without losing original event identity", () => {
    const normalized = normalizeDomainEvent({ ...stored, eventType: "causality.relation_changed" });
    expect(normalized).toMatchObject({ type: "CausalRelationUpdated", originalType: "causality.relation_changed", structuralVersion: 7, objectType: "CAUSAL_RELATION" });
    expect(affectedProjectionKinds(normalized.type)).toEqual(expect.arrayContaining(["NARRATIVE_DIRECTIVE", "CAUSAL_NEIGHBORHOOD", "CAUSAL_IMPACT"]));
  });

  it("rejects unsupported schema versions and event types instead of silently discarding them", () => {
    expect(() => normalizeDomainEvent({ ...stored, eventType: "CausalRelationUpdated", schemaVersion: 2 })).toThrow("EVENT_SCHEMA_UNSUPPORTED");
    expect(() => normalizeDomainEvent({ ...stored, eventType: "future.unknown" })).toThrow("EVENT_TYPE_UNSUPPORTED");
  });
});
