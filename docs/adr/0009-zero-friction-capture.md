# ADR 0009: Zero-friction Capture boundaries

## Status

Accepted for Sub-gate 8.

## Decision

Capture is a private, author-owned source domain. Raw text is persisted before any optional filing, attachment, conversion, or causal action. The browser writes the raw record to a bounded IndexedDB queue before the overlay closes; the server uses `(userId, clientCaptureId)` to acknowledge replays idempotently. Network failure never retains focus in the overlay or blocks manuscript persistence.

Capture lifecycle and conversion are separate. Unprocessed text may remain unprocessed forever. Filed, converted, deferred, and dismissed states preserve the source; dismissal records a retention boundary rather than deleting immediately. Attachments are non-causal references. Conversion creates a canonical target plus immutable CaptureConversion provenance and is idempotent by `(captureId, conversionType, idempotencyKey)`.

Sub-gate 8 activates only Milestone, Story Change, chapter attachment, chapter-outline attachment, and Capture-derived causal identity conversions. Entity, Note, and Timeline Event conversions remain dependency-unavailable. `CAPTURE_DERIVED` becomes an active causal endpoint only through a persisted CaptureConversion. Optional `Because of` and `This causes` actions require an explicit endpoint and relation type; no authored text is parsed into causality.

Capture joins the Contextual Writing Field only after its canonical persistence and ownership rules exist. It remains private to the creating author. Universal Search, entity context resolution, durable Notes, Timeline, research files, automatic filing, and AI classification remain later-gate work.

## Consequences

The author can leave the writing surface, browser history, selection, and scroll unchanged while recording a thought. Offline records survive reload and replay on the next online event with bounded exponential retry. Canonical source, reference, conversion, and causal meanings remain distinct and auditable.

## Capability evolution

Sub-gate 9 activated Entity conversion after Universe persistence. Sub-gate 11 activated durable Note and Timeline Event conversions after their canonical repositories existed. Both preserve the original Capture and immutable conversion provenance; neither activation changed the raw-save-first or optional-filing contract.
