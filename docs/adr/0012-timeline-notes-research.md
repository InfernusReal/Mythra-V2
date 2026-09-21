# ADR 0012: Flexible chronology, durable Notes, and private Research

## Status

Accepted for Sub-gate 11.

## Context

Mythra needs story chronology, author Notes, and Research in the writing environment without equating order with causality, forcing a Gregorian calendar, turning Captures into notebooks, exposing binary objects publicly, or letting support failures block manuscript work.

## Decision

- Store Timeline Events as canonical project-owned records with separate author display labels and mode-specific decimal coordinates for absolute, approximate, relative, ordinal, and range modes. Relative anchors are bounded and acyclic. Ordinal values are ordering facts, not causal-sanity story-time coordinates.
- Store typed Timeline links to Entity, Milestone, Chapter, or another event. These links create references only; they never create `CausalRelation`, containment, chapter order, or prose.
- Store durable freeform Notes with normalized tags and explicit backlinks. Notes have no notebook hierarchy. Promotion is idempotent, preserves a `NotePromotion` provenance record, and advances the project structural version.
- Store Research variants for Note, URL, user-authored Excerpt, Citation, and File. URL and citation records never trigger implicit fetching. Research links are explicit project-owned references.
- Keep file objects private. Validate a 10 MiB allow-list boundary, hash and reserve metadata, scan before `CLEAN`, delete rejected bytes, and expose only an actor/project/asset-bound HMAC token valid for five minutes. Raw keys and tokens are excluded from logs and read models.
- Activate Timeline Event, Note, and Research Search/Context providers and Note/Timeline Capture conversions only after the canonical sources exist. Activate Timeline Event causality resolution only for explicit endpoints; chronology checks remain neutral for ordinal or otherwise non-comparable anchors.
- Cache only bounded recent Chapter Search results for offline lookup and mark cached Context projections stale. Disable non-queueable Structure writes while offline and label export, snapshot, and billing unavailable. Local manuscript writing and queued Capture remain usable.

## Consequences

PostgreSQL remains canonical for chronology, Notes, Research metadata, and link/provenance records. Search and Context remain projections. Local filesystem object storage and deterministic scanning are development/test adapters; production supplies replaceable private storage and scanner infrastructure without changing service contracts. S12 may consume the emitted invalidation keys but S11 does not claim a durable propagation worker.
