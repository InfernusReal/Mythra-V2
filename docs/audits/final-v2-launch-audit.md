# Mythra V2 final launch audit

## Determination and evidence boundary

The deterministic V2 implementation satisfies the six delivery phases and mandatory Sub-gates 0–17 in order. Sub-gate 17 product commit `8cf9d688ef803390e9a8893bef8daccf2c856fe1` passed CI and both Security paths; reconciliation commit `c0875f3a40b699c0ddb51d3e113d68efaade4ce8` passed CI `33854471888`/`100964471416` and Security PR `33854472140`/`100964472772`. Push Security run `33854467968` initially received npm-registry HTTP 503 at the audit endpoint; the unchanged-SHA rerun job `100967690564` passed dependency audit, security tests, and committed-secret rejection.

This audit distinguishes implementation readiness from real-market evidence. The repository establishes the required ten-unrelated-paying-writer validation plan; it does not claim that the future day-7/day-30 cohort has already occurred. That cohort is the first post-launch commercial validation target, not one of the eleven launchability conditions.

## Audit findings and corrections

The final audit found three evidence-contract gaps and corrected all three before the Phase 6 decision:

1. The existing launch taxonomy stopped at 30/90/180-day retention and did not explicitly represent Week 1 retention, voluntary structure adoption, Capture processing, causal value/friction, autosave trust, Core value sentiment, or external-tool escape. The operational event allow-list, content-safe dimension allow-list, product-health definitions, dashboard SQL, documentation, and tests now cover those measures. Feedback remains controlled-code metadata; no authored response enters analytics.
2. The S6 database verifier still queried superseded lowercase causality outbox names even though the canonical application emits `StoryChangeUpdated`, `CausalRelationCreated`, `CausalRelationUpdated`, and `CausalRelationDeleted`. Both aggregate and concurrent-write assertions now use the canonical names. A fresh 17-migration PostgreSQL run passed with 14 content-redacted causal events, unchanged prose, and one winner plus one conflict under simultaneous writes.
3. The physical restore drill stripped Prisma's `schema` query option but not its pool-only connection options, which native `pg_dump` rejects. Native-tool URL normalization now removes all Prisma-only parameters. The corrected drill passed on a uniquely named real PostgreSQL audit database with 66 tables, 17 migrations, two workspaces, one project, one chapter, and 21 audit rows; the isolated restore and source audit databases were removed afterward.

These were verification and measurement-contract defects, not omitted user-facing V2 capabilities. No gap remains open. The audit preserves failed attempts as evidence instead of reclassifying them as passes.

## Bible section 31.2: fourteen critical scenarios

| ID | Required scenario | Executed evidence | Result |
| --- | --- | --- | --- |
| 1 | No-setup project/chapter, first keystroke, autosave, reload exact content | `editor-core.spec.ts` first-keystroke flow; `durability.spec.ts` Unicode autosave/reload | Pass |
| 2 | Offline write, close/reopen offline, recover, reconnect/save | `durability.spec.ts` IndexedDB close-before-ack and offline reconnect flows | Pass |
| 3 | Two-device conflict, no overwrite, both variants recoverable | `durability.spec.ts` explicit two-context conflict and Keep Local flow | Pass |
| 4 | Capture during writing, cursor restored, inbox source context | `capture.spec.ts` local-first overlay/replay and Inbox flows | Pass |
| 5 | Entity from selected prose, backlink, visible text unchanged | `universe.spec.ts` selection quick-create/focus/prose-preservation flow | Pass |
| 6 | Move chapter between volumes; order/projection update; references survive | `structure-core.spec.ts` reviewed scaffold/reorder and identity-preservation flow; structure invariant/database tests verify stable referenced IDs | Pass |
| 7 | Move milestone target; projections update once; no duplicate handling | `milestones.spec.ts` reviewed range/reorder flow; idempotency and Live Model outbox tests verify one effect | Pass |
| 8 | Downgrade over quota remains readable/exportable; expensive work gated | billing E2E plus billing service/database downgrade and cost-driver tests | Pass |
| 9 | Snapshot, corrupt simulated state, restore safe copy | `portability.spec.ts` verified snapshot and safe-copy restore; backup drill verifies isolated recovery | Pass |
| 10 | Full export manifest contains all author-created content | `portability.spec.ts`; representation and 25,000-object/1,000-chapter stress round-trips | Pass |
| 11 | Convert Capture to Story Change, link Because, return exact cursor/route | Capture conversion E2E plus editor causal-composer exact-position E2E | Pass |
| 12 | Causal mutation refreshes directive/context at new structuralVersion; stale cannot win | causality mutation E2E, Live Model repair E2E, context-key and stale-candidate tests | Pass |
| 13 | Impact direct/indirect paths with provenance; no downstream mutation | causality trace E2E plus bounded traversal/stress tests and canonical-before/after assertions | Pass |
| 14 | Chronology conflict warns neutrally, supports correction/override, editor writable | causality chronology E2E, story/discovery-time unit cases, Live Model neutral-warning E2E | Pass |

The final full Playwright invocation ran 128 project/test combinations: 66 applicable tests passed, 62 device-routing skips were intentional, and zero failed. Skips are paired desktop/mobile routing, not omitted capability tests.

## Bible section 31.3: visual-regression matrix

| Dimension | Evidence | Result |
| --- | --- | --- |
| Light, Dark, Cream | foundation/editor, production-readiness, billing, portability, and Suggestion screenshots | Pass |
| Wide, compact, mobile | 1440-wide/1024-compact assertions plus Pixel 7 project; no horizontal overflow | Pass |
| Context open and closed | desktop Context field and mobile context overlay/return screenshots | Pass |
| Selection tools | editor formatting and selected-prose Entity dialog flows | Pass |
| Long titles | responsive project/structure fixtures and overflow assertions | Pass |
| RTL/international | Arabic RTL long-label screenshot, Unicode/IME durability flows, English fallback assertions | Pass |

All screenshots are generated from deterministic Playwright flows into ignored `test-results`; geometry, overflow, theme, direction, focus, and serious/critical axe violations are asserted in code so the check fails before evidence is accepted.

## Appendix E.6: seven causal-first acceptance tests

| ID | Acceptance | Evidence | Result |
| --- | --- | --- | --- |
| E6-1 | Zero causal objects remain calm | zero-causality E2E and optional lens assertions | Pass |
| E6-2 | Contextual relation returns exact prose focus | editor causal-composer E2E | Pass |
| E6-3 | Relation mutation invalidates new-version projections | Live Model/context structuralVersion and stale-candidate tests | Pass |
| E6-4 | Valid flashback does not produce false causal error | story-time/discovery-time chronology unit matrix | Pass |
| E6-5 | Hundreds/thousands of chapters remain bounded with paths | causal stress tests enforce node/edge/path budgets and provenance | Pass |
| E6-6 | Export/import preserves causal identity and semantics | portability representation and full-archive round-trip tests | Pass |
| E6-7 | Agent reads/proposes without DB access or silent mutation | S17 service/E2E/database tests and direct-DB prohibition docs | Pass |

## Appendix D: sixteen doctrine answers

| ID | Answer and repository proof | Result |
| --- | --- | --- |
| D-1 | New author reaches first keystroke from one title action with no structure. | Pass |
| D-2 | Continue restores chapter, block, cursor, selection/scroll metadata and context. | Pass |
| D-3 | Context Peek/edit/trace occurs without route change. | Pass |
| D-4 | Capture saves raw-first without organization and syncs later. | Pass |
| D-5 | Zero structure and zero causality are first-class states. | Pass |
| D-6 | Virtualized/bounded views and 10,000-chapter/25,000-entity stress fixtures prove planning depth. | Pass |
| D-7 | Transactional structuralVersion/outbox projection propagation is deterministic and idempotent. | Pass |
| D-8 | Verified manuscript/full-project exports remain available, including downgrade. | Pass |
| D-9 | Local journal, replay, stale-write conflict and recovery preserve prose under network failure. | Pass |
| D-10 | Hard DOM/read budgets, responsive geometry, accessibility and calm degraded states contain scale complexity. | Pass |
| D-11 | Twenty bounded tools use application/read-model ports and prohibit direct database access. | Pass |
| D-12 | Editor, context, capture, universe, timeline, notes/research, search/language, history and export are integrated around the project. | Pass |
| D-13 | A pantser may permanently ignore causal structure. | Pass |
| D-14 | Why now?/What changes? expose direct-first bounded provenance in the writing field. | Pass |
| D-15 | Separate hierarchy, chronology and explicit causal models prevent false implication. | Pass |
| D-16 | Impact tracing is bounded, path-explained and non-mutating. | Pass |

## Bible section 38.1: eleven launch conditions

| ID | Condition evidence | Result |
| --- | --- | --- |
| L-1 | Registration/auth adapter, no-setup project creation, first chapter/keystroke E2E | Pass |
| L-2 | exact Continue action and context restoration E2E | Pass |
| L-3 | offline journal, reload/reconnect and conflict E2E | Pass |
| L-4 | optional outline-aware semantic coordinate and planning views | Pass |
| L-5 | Context field surfaces/edits outlines, milestones, entities without route changes | Pass |
| L-6 | global local-first Capture and later Inbox conversion | Pass |
| L-7 | Universe, Search, Timeline, history and verified export integrated in one project | Pass |
| L-8 | USD 15 Core provider adapter, webhook idempotency, quotas and downgrade preservation | Pass under authorized pricing erratum |
| L-9 | verified snapshots, safe-copy/current restore, 66-table/17-migration physical local restore, and managed-PITR runbook | Pass for repository implementation; a provider-specific staging PITR exercise remains a mandatory release operation |
| L-10 | content-safe UWT, writing/friction, cohort and reliability instrumentation/query contract | Pass |
| L-11 | optional Story Change/relation/Why now?/What changes? returns to prose without route reconstruction | Pass |

## Full-source contradiction and omission audit

`WorkPlan.md` section 12.3 maps Bible sections 0–39 and Appendices A–E to owning phases. `Path.md` records each original Sub-gate 0–17 with predecessor, file, behavior, validation, repair, commit, push and remote evidence. The final reread found no contradictory active decision: the authorized pricing ADR supersedes historical Entry/Pro amounts; hierarchy, chronology and causality remain orthogonal; `becauseItems[]` and `consequenceItems[]` remain explicit; the outline-aware semantic coordinate remains fixed; all future expansion items remain excluded.

No implementation gap remains in Phase 6. The ten-writer cohort outcome is deliberately recorded as future operational evidence and cannot be marked successful until real day-7/day-30 results exist.
