# ADR 0010: Flexible Universe and explicit entity state

## Decision

Universe uses project-owned `StoryEntity` records whose type can be a localized immutable system template or a project custom type. An entity requires only a type and trimmed name. Suggested fields are resources, not completeness gates.

Typed values are stored separately and validated against the selected type. Reference values resolve only active entities in the same project. Image and file field discriminants are reserved but return dependency unavailable until the private upload boundary is active in Sub-gate 11.

Entity relations are explicit directional edges. Reverse labels are presentation data, not duplicate truth. `EntityStateSnapshot` is immutable historical state with an optional explicit anchor. Current entity edits cannot simulate history by rewriting snapshots. A snapshot becomes causal only when an author explicitly uses its `ENTITY_STATE` endpoint.

Backlinks come only from explicit StoryReference, Capture context, and entity relation records. Names and prose are never scanned to invent links.

## Consequences

- Renaming an entity never rewrites manuscript prose or aliases.
- Selection quick-create adds an invisible StoryReference mark in one editor transaction and preserves visible text.
- System keys and schema versions remain stable while presentation labels can localize.
- Search, Timeline, Notes, Research, binary storage, propagation workers, and AI inference remain owned by later gates.
