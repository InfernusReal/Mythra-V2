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

## Sub-gate 4 rollback

`20260812230000_structure_core/rollback.sql` removes only Structure Core tables, enums, indexes, foreign keys, and the nullable `Chapter.volumeId`/`volumeSequenceIndex` seam. Before executing it, stop Structure writes and retain a database backup. The verification script compares a pre-rollback Chapter body document/text row byte-for-byte, confirms all six Phase 1 tables remain, removes the S4 migration ledger row only after checks pass, and then requires a forward redeploy before service resumes.

Because milestones and causality are later migrations, never apply the S4 rollback beneath S5 or S6. Use a forward repair when later capability data exists.

## Sub-gate 5 rollback

`20260813000000_milestones/rollback.sql` removes only Milestone, ChapterMilestoneLink, MilestoneDependency, milestone-targeted intents/references/revisions, and the S5 enum additions. Stop S5 writes and retain a backup before execution. `npm run db:rollback:milestones` verifies that the three S5 tables are gone, eight representative Structure Core tables remain, and a sampled Chapter document/text row is byte-equivalent; only then does it remove the S5 migration ledger row. Run `npm run db:deploy` and `npm run db:verify:milestones` before resuming service.

Never apply the S5 rollback beneath Sub-gate 6 causal data. Use a forward repair once causal endpoints can reference milestones.

## Sub-gate 6 rollback

`20260813120000_causal_story_fabric/rollback.sql` removes only StoryChange, CausalRelation, their five enums, revisions, and S6 enum values. Stop S6 writes and retain a backup before execution. `npm run db:rollback:causality` verifies that both S6 tables are gone, all eleven representative S0–S5 canonical tables remain, and a sampled Chapter document/text/version row is byte-equivalent; only then does it remove the S6 migration ledger row. Run `npm run db:deploy` and `npm run db:verify:causality` before resuming service.

The verifier also proves active/reserved endpoint registration, heterogeneous edges, active duplicate idempotency, hard-cycle rejection and explicit temporal feedback, discovery-time reveal checks, complete path provenance and budgets, reattach/retire/archive preservation, complete revisions, content-free outbox, concurrent-write convergence, workspace/project isolation and prose preservation. Never apply this rollback beneath Phase 3 endpoint data; use a reviewed forward repair instead.

## Sub-gate 10 rollback

`20260817180000_search_language/rollback.sql` removes only `SavedVocabularyTerm`, `SearchDocument`, and `SearchDocumentType`. The shared `pg_trgm` extension remains installed because later or independently deployed indexes may use it. Stop Search/vocabulary writes and retain a backup before running `npm run db:rollback:search-language`.

The verifier seeds representative canonical data, validates all eleven active types, generated full-text/trigram indexes, exact alias ordering, StoryReference projection, actor-only Capture visibility, cross-workspace rejection, vocabulary idempotency/versioning, and content-free logs. Rollback proves the S10 tables are absent while representative Chapter, Capture, and StoryEntity tables and rows remain. It removes the S10 migration-ledger row only after those checks pass. Reapply with `npm run db:deploy`, regenerate the Prisma client if the schema changed, and rerun `npm run db:verify:search-language` before resuming service.

Never apply the S10 rollback beneath Sub-gate 11 Search provider data. Use a reviewed forward repair after Timeline, Note, or Research documents depend on the projection schema.
# Universe migration and rollback

`20260816223000_universe` changes Capture conversion discrimination from a closed PostgreSQL enum to the already application-bounded string registry, then adds entity types/fields/values, entities, relations, snapshots, and revisions. Apply with `prisma migrate deploy`, run `npm run db:verify:universe`, and retain the emitted `S9-DB-001` record.

Before rollback, confirm no newer gate depends on Universe. Run `npm run db:rollback:universe`; it removes Entity context pins, Entity conversions, Entity State causal relations, and Entity StoryReferences before dropping S9 tables and restoring the S8 conversion enum. The verifier proves a sampled Chapter and Capture are byte-equivalent. Reapply with `prisma migrate deploy`, regenerate the client, and rerun `npm run db:verify:universe`.
