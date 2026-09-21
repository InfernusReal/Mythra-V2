# Milestone architecture

## Canonical and derived state

`Milestone`, `ChapterMilestoneLink`, and `MilestoneDependency` are canonical PostgreSQL rows. Ranges are stored as zero-based chapter indices; the UI translates them to one-based author-facing numbers. Dates use calendar-date semantics and words remain advisory. Chapter progress is derived at read time from final status or `wordCount/targetWords`, clamped to zero through one, then weighted by each link.

The projection performs a bounded milestone query, a bounded progress-link query, and bounded displayed edge queries. It reports separate overflow facts for objects, displayed edges, and progress inputs. Dependency rendering uses an accessible ordered list as the canonical alternative; no client request fetches an unbounded graph.

## Integrity and concurrency

Composite database foreign keys guarantee that link and dependency endpoints share `projectId` with their parent rows. Partial unique indexes make active chapter-role links and active/tentative dependencies idempotent. A check constraint rejects self-dependencies; the domain additionally traverses hard active edges iteratively to reject cycles before insert/update.

All milestone writes resolve actor ownership, compare the expected project structural version, write canonical state and a complete resultant revision, advance the structural version, and append an outbox invalidation in one transaction. A concurrent loser rolls back its inserted canonical row when the compare-and-increment fails.

## Semantic integration

Milestone is active in the generalized non-causal endpoint registry and Narrative Intent target registry from Sub-gate 5. Semantic Coordinate emits linked milestone identities as `MILESTONE_THREAD` relevance steps, never ancestor containment. Chapter ownership remains Project/optional Volume only.

## Failure boundaries

Missing milestone data is valid. A failed milestone request cannot prevent editor loading, typing, local journaling, saving, recovery, or continuation. The S5 rollback deletes milestone-targeted intents/references/revisions, removes only milestone tables and S5 enum values, preserves Structure Core tables, and verifies byte-equivalent chapter prose before removing the migration ledger row.
