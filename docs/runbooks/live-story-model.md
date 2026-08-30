# Live Story Model operations

The Live Story Model is derived, versioned state. PostgreSQL canonical domain tables remain authoritative. Deleting or repairing a projection cannot delete manuscript or story facts.

## Worker contract

Run `npm run worker:live-model`. A batch claims at most 50 due events with `FOR UPDATE SKIP LOCKED`, leases each row for 30 seconds, and commits a unique delivery record with the projection updates. Duplicate delivery is harmless. A crashed lease becomes claimable after expiry. Retries start at one second, double per attempt, cap at five minutes, and dead-letter after attempt eight.

Workers accept event schema version 1 and explicit rolling aliases. Unsupported event types or schema versions are retained and retried/dead-lettered; they are never silently marked complete. Deploy additive migration `20260829190000_live_story_model` before starting a new worker. Old application processes can continue to insert the pre-S12 outbox shape because all new columns have compatible defaults.

## Status and lag

`GET /api/v2/projects/:id/live-model` is ownership-scoped and reports versions, freshness, queue counts, lag, and neutral warnings without returning projection payloads. Fresh means the projection structural version matches the canonical project. Updating or Stale is consequential and must remain visible. Unavailable supporting state never disables the chapter editor, local journal, autosave, Capture, or canonical structure.

## One-project repair

Run:

```text
npm run repair:live-model -- <project-uuid> <active-member-user-uuid>
```

The command reads one owned project from canonical tables, synchronizes SearchDocument rows, rebuilds all projections with the same deterministic builders used by events, rejects older versions, resolves warnings that no longer apply, removes orphan projection rows, and records counts/digest only. It does not edit prose and does not create canonical facts.

A rebuild also records idempotent Live Model delivery coverage for up to 10,000 supported, same-project outbox rows created before the rebuild began. Status excludes those covered rows immediately; the worker later recognizes each delivery and completes the underlying outbox row without projecting it again. Unsupported schema/event versions remain uncovered and visible for retry or dead-letter handling.

The Project Home repair button invokes the same ownership-scoped operation. For large projects, prefer the CLI/worker path rather than tying repair to a browser request.

## Dead-letter recovery

Inspect only safe columns: event ID/type/schema version, project/workspace identifiers, attempts, lease, stable error code, and timestamps. Do not print `payload`. Fix the unsupported deployment or canonical integrity issue, set the event to `PENDING`, clear `deadLetteredAt`, `leaseOwner`, and `leasedUntil`, and set `availableAt` to the intended retry time in an audited operation. The unique delivery row prevents duplicate projection effects.

## Migration and rollback

The forward migration is additive. Exercise `npm run db:rollback:live-model` only on an isolated database and only before S13 depends on the new tables. Production rollback is application-first: stop new workers, deploy code that ignores S12 columns/tables, retain projection/delivery evidence, and remove the additive schema only after verification. Never roll back by deleting canonical domain tables.

## Content safety

Worker, API, repair, metric, and CLI logs allow identifiers, types, versions, counts, durations, freshness, outcomes, and stable error codes only. Never log manuscript text, rich documents, selected prose, Capture text, Note/research bodies, author labels/titles, or raw outbox/projection JSON.
