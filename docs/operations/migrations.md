# Migration and repair policy

Every schema change is version controlled and assigned to one original capability sub-gate.

## SQL changes

1. Prefer additive changes.
2. For destructive evolution, add and dual-write, backfill, verify, switch reads/writes, then remove only in a later verified release.
3. Run migrations against disposable PostgreSQL and a representative fixture before deployment.
4. Preserve a reviewed `rollback.sql` or explicit forward-repair procedure beside each migration.
5. Never roll back across a later migration without dependency review and a verified backup.

## Rich documents

ChapterDocument migrations are pure application functions with explicit source and target versions. They do not run implicitly inside SQL migrations. Unknown future versions fail safely without modifying the stored document.

## Sub-gate 0 rollback

The foundation rollback drops only the reserved outbox, audit, preference, membership, workspace, external identity, and user structures in reverse dependency order. It is valid only before Sub-gate 1 data exists.
