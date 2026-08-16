# ADR 0007: Causal Story Fabric boundaries

Status: accepted for Sub-gate 6.

## Decision

`CausalRelation` is the only canonical causal edge. It is not ownership, containment, chronology, sequence, co-occurrence, `StoryReference`, or `MilestoneDependency`. A relation always belongs to one Project and connects two typed, project-owned endpoints validated through the causal endpoint registry.

The complete endpoint enum exists now so persisted discriminants remain stable. Only `MILESTONE`, `CHAPTER_OUTLINE`, `SCENE`, `NARRATIVE_INTENT`, `MANUSCRIPT_BLOCK`, and `STORY_CHANGE` are active. `TIMELINE_EVENT`, `ENTITY_STATE`, and `CAPTURE_DERIVED` are reserved adapters that return `DEPENDENCY_UNAVAILABLE` until their canonical Phase 3 domains register resolvers. Enum presence is not product capability.

The vocabulary is `CAUSES`, `ENABLES`, `REQUIRES`, `MOTIVATES`, `TRIGGERS`, `ESCALATES`, `PREVENTS_BLOCKS`, `REVEALS`, `TRANSFORMS`, and `RESOLVES`. Relations may be active, tentative, or retired. Only `REQUIRES` may be hard. A hard active requires cycle is rejected unless the new edge explicitly records temporal progression or mutual-state semantics. Those flags document author intent; they do not infer it.

Story Changes provide causal identity only when no better canonical object exists. Supported kinds are event, decision, revelation, state change, setup, payoff, condition, outcome, and custom. Story time and discovery time are optional explicit coordinates. Chapter order is never substituted for story time. `REVEALS` uses discovery time; unavailable coordinates produce neutral insufficient-information results.

An endpoint archive never silently destroys evidence. The author chooses reattach, retire, or archive relation. Reattachment revalidates project ownership, block identity, active availability, self-edge prevention, duplicates, and hard-cycle rules.

## Consequences

Traversal is bounded, server-owned, direct-edge-first, filterable, and carries every relation ID/type/provenance step. Results use “potentially affected” language and never mutate prose or endpoints. The optional Architect graph is local and always paired with an accessible ordered list. A zero-causality project has no dashboard or warning and remains fully writable.
