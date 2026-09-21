import { createHash } from "node:crypto";

export const LIVE_MODEL_EVENT_SCHEMA_VERSION = 1;

export const canonicalDomainEventTypes = [
  "ProjectCreated",
  "VolumeReordered",
  "ChapterUpdated",
  "ChapterOutlineUpdated",
  "MilestoneLinkedToChapter",
  "EntityUpdated",
  "ReferenceCreated",
  "TimelineEventUpdated",
  "CaptureFiled",
  "RevisionCheckpointCreated",
  "StoryChangeUpdated",
  "CausalRelationCreated",
  "CausalRelationUpdated",
  "CausalRelationDeleted",
] as const;

export type CanonicalDomainEventType = (typeof canonicalDomainEventTypes)[number];

export const directiveInvalidationEvents = [
  "ChapterUpdated",
  "ChapterOutlineUpdated",
  "MilestoneLinkedToChapter",
  "EntityUpdated",
  "ReferenceCreated",
  "TimelineEventUpdated",
  "CaptureFiled",
  "StoryChangeUpdated",
  "CausalRelationCreated",
  "CausalRelationUpdated",
  "CausalRelationDeleted",
] as const satisfies readonly CanonicalDomainEventType[];

export const allProjectionKinds = [
  "CONTINUATION",
  "CHAPTER_CONTEXT",
  "MILESTONE_PROGRESS",
  "VOLUME_HEALTH",
  "ENTITY_BACKLINKS",
  "TIMELINE_WINDOW",
  "SEARCH_DOCUMENT",
  "QUOTA_SEAM",
  "CAUSAL_NEIGHBORHOOD",
  "CAUSAL_IMPACT",
  "NARRATIVE_DIRECTIVE",
  "SEMANTIC_COORDINATE",
] as const;

export type LiveModelProjectionKind = (typeof allProjectionKinds)[number];

const legacyEventAliases: Readonly<Record<string, CanonicalDomainEventType>> = {
  "project.created": "ProjectCreated",
  "structure.plot.changed": "ProjectCreated",
  "structure.plot_outline.changed": "ChapterOutlineUpdated",
  "structure.volume.changed": "VolumeReordered",
  "structure.volume_outline.changed": "VolumeReordered",
  "structure.chapter_outline.changed": "ChapterOutlineUpdated",
  "structure.chapter_outline.reparented": "ChapterOutlineUpdated",
  "structure.scene.changed": "ChapterOutlineUpdated",
  "structure.intent.changed": "ChapterOutlineUpdated",
  "structure.reference.changed": "ReferenceCreated",
  "structure.chapter_membership.changed": "ChapterUpdated",
  "structure.volumes.reordered": "VolumeReordered",
  "structure.scaffold.applied": "ProjectCreated",
  "milestone.changed": "MilestoneLinkedToChapter",
  "milestone.chapter_linked": "MilestoneLinkedToChapter",
  "milestone.dependency_changed": "MilestoneLinkedToChapter",
  "milestone.reordered": "MilestoneLinkedToChapter",
  "milestone.scaffold_applied": "MilestoneLinkedToChapter",
  "universe.entity_created": "EntityUpdated",
  "universe.entity_quick_created": "EntityUpdated",
  "universe.entity_updated": "EntityUpdated",
  "universe.entity_state_created": "EntityUpdated",
  "universe.relation_type_created": "EntityUpdated",
  "context.source_updated": "ChapterOutlineUpdated",
  "capture.saved": "CaptureFiled",
  "capture.converted": "CaptureFiled",
  "timeline.event_updated": "TimelineEventUpdated",
  "note.updated": "ReferenceCreated",
  "note.promoted": "ReferenceCreated",
  "causality.story_change_changed": "StoryChangeUpdated",
  "causality.relation_changed": "CausalRelationUpdated",
  "causality.relation_lifecycle": "CausalRelationDeleted",
  "writing.chapter_updated": "ChapterUpdated",
  "writing.revision_checkpoint_created": "RevisionCheckpointCreated",
};

export interface StoredDomainEvent {
  id: string;
  workspaceId: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  schemaVersion: number;
  payload: unknown;
  createdAt: Date;
}

export interface NormalizedDomainEvent {
  id: string;
  workspaceId: string;
  projectId: string;
  type: CanonicalDomainEventType;
  originalType: string;
  schemaVersion: number;
  structuralVersion: number | null;
  objectType: string;
  objectId: string;
  createdAt: Date;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("EVENT_PAYLOAD_INVALID");
  return value as Record<string, unknown>;
}

export function normalizeDomainEvent(event: StoredDomainEvent): NormalizedDomainEvent {
  if (event.schemaVersion !== LIVE_MODEL_EVENT_SCHEMA_VERSION) throw new Error("EVENT_SCHEMA_UNSUPPORTED");
  const payload = record(event.payload);
  const projectId = typeof payload.projectId === "string" ? payload.projectId : event.aggregateType === "Project" ? event.aggregateId : null;
  if (!projectId) throw new Error("EVENT_PROJECT_MISSING");
  const type = (canonicalDomainEventTypes as readonly string[]).includes(event.eventType)
    ? event.eventType as CanonicalDomainEventType
    : legacyEventAliases[event.eventType];
  if (!type) throw new Error("EVENT_TYPE_UNSUPPORTED");
  const structuralVersion = typeof payload.structuralVersion === "number" && Number.isInteger(payload.structuralVersion) && payload.structuralVersion > 0
    ? payload.structuralVersion
    : null;
  const objectType = typeof payload.objectType === "string" ? payload.objectType : event.aggregateType;
  const objectId = typeof payload.objectId === "string" ? payload.objectId : event.aggregateId;
  return { id: event.id, workspaceId: event.workspaceId, projectId, type, originalType: event.eventType, schemaVersion: event.schemaVersion, structuralVersion, objectType, objectId, createdAt: event.createdAt };
}

export function affectedProjectionKinds(type: CanonicalDomainEventType): readonly LiveModelProjectionKind[] {
  if (type === "RevisionCheckpointCreated") return ["CONTINUATION", "QUOTA_SEAM"];
  if (type === "CaptureFiled") return ["CHAPTER_CONTEXT", "SEARCH_DOCUMENT", "QUOTA_SEAM", "NARRATIVE_DIRECTIVE"];
  if (type === "EntityUpdated") return ["CHAPTER_CONTEXT", "ENTITY_BACKLINKS", "SEARCH_DOCUMENT", "NARRATIVE_DIRECTIVE"];
  if (type === "TimelineEventUpdated") return ["CHAPTER_CONTEXT", "TIMELINE_WINDOW", "SEARCH_DOCUMENT", "CAUSAL_NEIGHBORHOOD", "CAUSAL_IMPACT", "NARRATIVE_DIRECTIVE"];
  if (type.startsWith("CausalRelation") || type === "StoryChangeUpdated") return ["CHAPTER_CONTEXT", "SEARCH_DOCUMENT", "CAUSAL_NEIGHBORHOOD", "CAUSAL_IMPACT", "NARRATIVE_DIRECTIVE", "SEMANTIC_COORDINATE"];
  return allProjectionKinds;
}

export function eventCatalogDigest(): string {
  return createHash("sha256").update(JSON.stringify({ canonicalDomainEventTypes, directiveInvalidationEvents, legacyEventAliases })).digest("hex");
}

export function isDirectiveInvalidation(type: CanonicalDomainEventType): boolean {
  return (directiveInvalidationEvents as readonly CanonicalDomainEventType[]).includes(type);
}
