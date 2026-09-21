# Structure Core architecture

## Canonical objects

`Plot`, `PlotOutline`, `Volume`, `VolumeOutline`, `ChapterOutline`, `Scene`, `NarrativeIntent`, and `StoryReference` are project-owned canonical records. `ObjectRevision` is a generic resultant-state history seam. `StructureViewState` is user preference state, not story truth.

Chapter Outline stores a rich JSON document and searchable plain text plus optional purpose, emotional movement, revealed information, entity/location/future-milestone reference keys, word target, explicit hard-target flag, scene stubs, placeholder state, provenance, and version. Empty outline records are never synthesized by an ordinary chapter write. An explicit scaffold request may create placeholders because the author reviewed that plan.

Scene is an optional lens. Converting an outline block creates a Scene with source outline/block provenance and a `derived_from` Story Reference backlink. The source outline is not deleted or rewritten. Manuscript prose is not read or changed.

Narrative Intent supports plot, volume, chapter, scene, and paragraph-selection targets. Paragraph selections require a stable block ID and numeric selection anchors. Its categories are tension, revelation, emotion, pacing, ambiguity, atmosphere, or custom. Milestone and entity-arc targets are not registered in S4.

## Transaction contract

Every canonical S4 mutation:

1. resolves the Project through the actor workspace;
2. resolves every child ID through the same Project;
3. requires `expectedStructuralVersion`;
4. performs canonical writes, resultant-state revision, version compare/increment, and outbox insert atomically;
5. returns the new structural version.

Duplicate active Story References are idempotent and do not advance the structural version. A stale preview returns `CONFLICT`. Unknown child IDs return `NOT_FOUND`. Reserved later-domain endpoints return `DEPENDENCY_UNAVAILABLE` at their typed seam or fail S4 input validation before repository access.

The adapter is not assigned an explicit isolation-level option because the local Prisma PostgreSQL runtime rejects late isolation commands. Correctness does not depend on a label: optimistic compare-and-increment, database uniqueness, and one atomic transaction are the concurrency mechanism. Real concurrent-write tests must prove one winner and one conflict.

## Bounded projections

The Structure overview is a rebuildable read model assembled from canonical rows. The client never becomes canonical. Server constants cap a page at 250 objects, a neighborhood at 500 nodes, and relationships at 750 edges. Default budgets are 100, 200, and 300. Results report returned counts and overflow facts. UI lists use bounded server slices and horizontal planning ranges; a full project graph is never loaded.

The active S4 lenses are Outline, Volumes, Chapters, Relationships, and Semantic Zoom. Milestones and Causal are not rendered as disabled, empty, or dormant product UI.

## Failure and recovery

Structure routes are outside editor durability and continuation dependencies. A failed structure request leaves the prior canonical version unchanged. A failed preference save leaves only view presentation stale. The reviewed rollback removes S4 tables/types and nullable Chapter membership columns while preserving all Phase 1 tables and byte-equivalent Chapter document/text values.

## Logging and privacy

Every operational step has an adjacent `Console trace S4-*` comment. Server operations use the guarded structured-console transport. Client operations use direct structured `console.log`. Allowed metadata consists of request/workspace/project/object IDs, enum keys, counts, versions, status codes, and booleans. Titles, summaries, outline documents/text, intent text, revealed information, provenance notes, block contents, selected text, and manuscript prose are excluded.

