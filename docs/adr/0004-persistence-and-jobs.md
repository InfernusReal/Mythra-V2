# ADR 0004: Persistence, storage, and jobs

Status: Accepted

## Decision

PostgreSQL is canonical server storage. Prisma repositories encapsulate ownership-scoped queries and transaction boundaries. IndexedDB is the Phase 1 local recovery journal, never long-term canonical truth. Binary storage is hidden behind an object-storage interface. Durable asynchronous work uses a transactional outbox; Sub-gate 0 reserves its persistence without activating later projections.

## Consequences

No route queries Prisma directly. Outbox payloads are versioned and content-minimized. Binary data does not enter PostgreSQL when object storage is appropriate. Later service extraction is driven by measured bottlenecks.
