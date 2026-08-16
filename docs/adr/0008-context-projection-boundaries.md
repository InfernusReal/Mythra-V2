# ADR 0008: Context projection boundaries

## Status

Accepted for Sub-gate 7.

## Decision

The Contextual Writing Field is a deterministic, rebuildable read projection over canonical author-owned records. Canonical context remains in its source domain. Pins and per-project card mutes are preferences; session hides and directive disablement are ephemeral client state. No card or directive output becomes story truth.

Provider registration controls capability activation. Sub-gate 7 registers only chapter outline, milestone, direct causal, existing-reference, and Narrative Intent providers. Later provider discriminants may exist in interfaces, but no later provider can resolve until its canonical domain, ownership checks, revisions, and export seam exist.

`becauseItems[]` and `consequenceItems[]` are explicit first-class fields in every Narrative Directive representation. They cannot be folded into generic ranked context.

Peek is a reversible overlay operation that preserves browser history, route, manuscript selection, focus, and scroll. Open is intentional navigation. Indirect causal traversal is never automatic; it remains behind an explicit bounded action.

## Consequences

Context reads can fail or become stale without blocking writing. Resolver results are deterministic and testable. Later domains plug into the registry without modifying the compiler or transport architecture. The synchronous read-through implementation remains valid until Phase 4 introduces durable projection workers because every response exposes structural version and freshness.
