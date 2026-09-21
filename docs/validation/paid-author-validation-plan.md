# First paid-author validation plan

## Decision and cohort

The first commercial validation cohort is exactly ten unrelated writers paying USD 15 per month for Mythra Core and repeatedly using the same real writing projects. Employees, contractors, household members, gifted access, refunded accounts, test workspaces, and free users do not count. Mythra Intelligence remains unavailable and cannot be counted as revenue. This plan does not fabricate cohort results; cohort recruitment and observed retention begin only after production launch.

Each qualified writer must consent to content-safe product telemetry, create or import an authentic active project, complete a durable writing session, and have a distinct payer identity. Operational analysis uses opaque workspace/project identifiers and controlled codes only. Manuscript, Capture, Note, Research, entity, query, title, file-name, and free-text survey content is prohibited from analytics.

## Measures and exact evidence

| Question | Measure | Event/query | Review cadence |
| --- | --- | --- | --- |
| Do paid writers return? | Same-project meaningful writing at day 7 and day 30 | `writing.save`, `session.writing`; 7/30-day cohorts in `docs/analytics/operations-dashboard.sql` | Daily cohort completeness; weekly decision review |
| How quickly do they write? | Sign-in/editor-writable to first keystroke and first durable save | `writing.editor_writable`, `writing.first_keystroke`, `writing.save` durations | Per session and cohort median/p95 |
| Is structure voluntary and useful? | Explicit adoption after prose-first access | `structure.adopted` with controlled `surfaceKey` | Weekly |
| Does Context reduce navigation? | Peek/Open interactions compared with full route changes | `context.peeked`, `context.opened`, `navigation.route_changed` | Weekly |
| Does Capture become habitual? | Distinct Capture-active days and later processed count | `capture.opened`, `capture.processed` | Weekly |
| Is causality leverage or paperwork? | Trace use/latency plus helpful/neutral/burdensome code | `causality.trace`, `causality.feedback` | Weekly and interview review |
| Do writers trust autosave? | Save success, conflicts, recoveries, and trust code | `writing.save`, `conflict.detected`, `recovery.incident`, `autosave.trust_feedback` | Daily reliability; weekly sentiment |
| Is Core worth USD 15? | Active/trialing paid Core plus controlled value code | subscription state, `core.value_feedback` | Weekly |
| Is future Intelligence desired? | Explicit interest, separate from current revenue | `intelligence.interest` | Monthly; no activation |
| Why do writers leave Mythra? | Controlled writing-adjacent escape reason | `external_tool.escape` | Weekly roadmap triage |

All cohort-coded feedback uses `cohortKey=first-paid-ten`; `sentimentCode`, `reasonCode`, and `surfaceKey` are controlled values. Interview notes, if retained, belong in a separately authorized research system and are never joined to manuscript data or copied into operational events.

## Qualification, review, and decisions

The cohort register contains payer eligibility, activation date, opaque workspace/project IDs, day-7 eligibility, day-30 eligibility, cancellation/refund state, and evidence completeness. It contains no authored material. A writer is retained only when the same project records a meaningful writing session at or after the applicable threshold. Opening the app, receiving email, or using a different test project is insufficient.

At day 7, review activation latency, recoverability, early return, Capture/context behavior, and any reliability incident. At day 30, review ten-writer cohort retention, repeated same-project use, Core value sentiment, external-tool escape categories, and whether optional structure/causality helped rather than obstructed writing. Free signup volume is reported separately and cannot change the paid-retention decision.

Scale distribution only after the ten-writer cohort has complete day-30 evidence and no unresolved manuscript-loss, privacy, billing, export, or restore incident. If retention is weak, fix the observed writing-flow bottleneck before adding distribution or future capabilities. Regional expansion, collaboration, publisher workspaces, community, and Story Intelligence remain out of scope.
