# Causal Story Fabric

The S6 module follows `domain → application → infrastructure → thin transport → server projection → optional UI`.

## Canonical write path

1. Zod validates vocabulary, endpoint shape, metadata bounds and self/hard semantics.
2. Project ownership and optimistic structural version are checked.
3. The registry resolves both endpoints through active adapters. Reserved types fail closed.
4. Hard active requires edges load at most 5,001 relevant edges; more than 5,000 fails closed. The iterative proof rejects an unqualified cycle.
5. The canonical object, complete resultant `ObjectRevision`, Project version increment and content-free `OutboxEvent` commit atomically.
6. An active unique guard resolves concurrent exact duplicates to the existing relation.

## Read path and budgets

Overview uses a fair per-type query-row allocation and caps returned endpoint nodes at 500 and edges at 750. Neighborhood/impact reads cap depth at 12, nodes at 500, edges at 750 and paths at 500. Traversal is breadth-first so direct relations precede deeper paths. The client receives no unbounded graph and all overflow is explicit.

The Structure lens exposes one-line Story Changes, A because of B / A causes B, canonical metadata, trace lists, chronology checks and all archive choices. Discovery/Guided modes use the accessible list only. Architect may additionally render a bounded local visualization, marked decorative because the list contains the full accessible information.

The writing composer records a stable manuscript-block endpoint, selection offsets and scroll position without reading/logging selected text. It creates causal objects only, restores selection/focus/scroll, and never sends a document write. Editor load, typing, local journal, save, recovery and continuation do not depend on causality.

## Failure and privacy boundaries

No causal object is required for writing. Causal route, adapter, traversal or chronology failures do not affect editor durability. Unknown chronology is neutral. Trace language is non-assertive and no trace changes downstream state. Operational logs contain identifiers/discriminants/counts/bounds/results only; authored content is confined to canonical tables and complete revision snapshots.
