# S15 Performance, Scale, and Responsive Baseline

## Decision

Mythra V2 remains a modular monolith for the measured 0–500-writer stage. Phase 1–4 stress suites completed before S15 changes with 13 files and 25 tests passing in 9.93 seconds. No measured result justifies Redis, a search cluster, read replicas, table partitioning, or service extraction.

## Enforced budgets

| Flow | Budget | Enforcement |
| --- | ---: | --- |
| Local editor input | p95 ≤ 50 ms | Browser interaction timing; the Tiptap update and IndexedDB journal do not await a network request. |
| Quick Capture open | p95 < 100 ms | Browser timing from action dispatch to focused textarea. |
| Warm route | p95 ≤ 1,000 ms | Browser navigation timing on authenticated cached routes. |
| Context apply | p95 ≤ 1,500 ms | Cancellable request with sequence and context-key last-request-wins checks. |
| Context layout shift | CLS ≤ 0.05 | Reserved wide region and fixed compact/mobile sheet geometry. |
| Dense rendered list | ≤ 80 mounted rows | Deterministic shared virtual-window primitive plus server-side range limits. |
| Causal traversal | depth 12, 500 nodes, 750 edges, 500 paths | Domain validation and stress fixtures. |

The executable constants are in `lib/performance/budgets.ts`. Query-budget assertions fail closed in `lib/performance/query-budget.ts`; repository reads remain aggregate selects or bounded batches rather than per-row loops.

## Existing bounded paths retained

- Editor reads one active chapter document with bounded neighboring navigation and projections.
- Structure routes clamp rows to 250, nodes to 500, and edges to 750.
- Search, Capture, Timeline, portability, and causal endpoints retain server-owned cursor/range limits.
- Binary payloads continue through private object-storage ports. Snapshot, export, projection rebuild, and outbox processing remain job boundaries.
- Universe is the first profiled dense client collection to use the shared accessible virtual list. Other list surfaces remain below their server page caps and therefore do not receive speculative client virtualization.

## Staged scaling triggers

| Stage | Evidence required before change | Candidate change | Rollback criterion |
| --- | --- | --- | --- |
| 0–500 writers | Current budgets pass | Modular monolith, PostgreSQL, bounded jobs/object storage | Not applicable; current baseline. |
| 500–2,000 writers | Sustained p95 budget breach with DB/cache attribution | Targeted Redis cache or worker concurrency adjustment | Remove if hit rate is below 70% or operational error rate rises. |
| 2,000–10,000 writers | Search latency/index growth breach after query/index tuning | Dedicated search read model; read replica for proven read saturation | Revert routing if correctness drift or replica lag breaches freshness SLO. |
| Above 10,000 writers | Sustained write contention/table-maintenance evidence | Partition only measured hot tables; extract only independently scaling services | Roll back if throughput gain is below 20% or failure isolation worsens. |

These are decision thresholds, not claims that the scale has been reached.

## S15 implementation profile

- Shared window calculation is deterministic for million-row logical collections and mounts no more than 80 rows.
- Context refresh aborts the superseded request, rejects stale sequence/context keys, and never blocks editor input.
- Mobile writing controls use a safe-area action bar; navigation and Context use focus-returning sheets.
- Save announcements are coalesced for stable terminal states and never announce routine keystrokes.
- Light, Dark, and Cream share tokenized contrast/focus behavior; Arabic selects RTL document direction and long resource labels.
- Regional capability reports are server-safe facts. China entries remain `REQUIRES_VERIFICATION` or `UNAVAILABLE` and `complianceClaimed` is always false.
