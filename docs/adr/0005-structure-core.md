# ADR 0005: Structure Core ownership, projections, and writes

Status: accepted for Sub-gate 4.

## Decision

Structure Core is an optional set of canonical PostgreSQL objects inside the existing modular monolith. A Project may have one Plot, zero or one Plot Outline, zero or more ordered Volumes, optional Volume Outlines, optional Chapter Outlines, optional Scenes, Narrative Intents, and non-causal Story References. Existing Chapters remain valid with no structure relationship.

Containment and relevance are different contracts. A Volume may contain an ordered chapter membership. A Chapter never belongs to a milestone. `StoryReference` records relevance and provenance only; it does not assert containment, chronology, or causality.

Discovery, Guided, and Architect are view preferences over the same schema. `StructureViewState` belongs to a user/project pair and does not increment `Project.structuralVersion`. Story writes require the expected structural version, execute in one database transaction, compare-and-increment that version, add a resultant-state `ObjectRevision`, and add a content-free outbox invalidation.

## Semantic Coordinate ruling

The implementation coordinate is:

`Series/Project → Plot → Plot Outline → Volume → Volume Outline → Milestone/Thread → Chapter Outline → Chapter → Scene → Prose`

Optional levels are omitted when absent. Milestone/Thread is a cross-cutting relevance step and never enters the ownership ancestor path. Chapter Outline precedes Chapter as an abstraction level but is not a prerequisite for creating or writing a Chapter.

## Consequences

- A discovery writer can write indefinitely with zero structure rows.
- Structure support can fail without blocking editor load, typing, local journal, save, recovery, or continuation.
- Scaffolding and reorder are deterministic previews followed by version-checked apply operations.
- Creative targets are advisory unless a target and explicit hard-mode flag are both present.
- Note and Capture conversion ports exist but return `DEPENDENCY_UNAVAILABLE` until their canonical later gates.
- Milestone persistence/UI begins only in Sub-gate 5. Causal persistence/UI begins only in Sub-gate 6.

