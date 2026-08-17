# Universe architecture

The canonical path is `UniverseService` → `UniverseRepository` → PostgreSQL. Server components and context cards consume bounded read models; they do not become competing truth.

## Invariants and bounds

- Same-workspace project ownership is resolved before every operation. Child IDs are revalidated against the same project.
- Entity lists default to 50 and hard-cap at 100. Values/types cap at 100, outgoing relations at 500, state snapshots at 1,000, and returned backlinks at 100.
- Field kinds are validated by definition. Rich text requires `{ schemaVersion: 1, type: "doc" }` and a 50,000-character serialized bound. URLs accept HTTP(S). Select values must be configured. References require active same-project entities.
- Mutations use optimistic project/entity versions where an existing client snapshot is involved. Updates record the complete prior entity and field-value state. Outbox payloads contain identities, counts, stable types, and versions only.
- The selection action sends selected text as authored entity input over the private API but never logs it. Server creation plus StoryReference is atomic. Only after success does the client apply the mark; failure leaves the manuscript unchanged.
- State JSON and notes remain canonical private values. Logs and outbox never contain them.

## Activation boundaries

Sub-gate 9 activates Entity context cards, Capture-to-Entity conversion, and the `ENTITY_STATE` causal resolver because their canonical rows and ownership checks now exist. Timeline Event, Note, Research, SearchDocument, universal Search, and binary fields remain unavailable until their owning gates.

The system catalog is localized with stable English fallback resources. Project custom types retain author-provided labels. Neither changes authored values during locale changes.
