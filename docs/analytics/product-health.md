# Product health and friction metrics

All events use `lib/observability/operations.ts`. The schema accepts an enumerated event name, stable workspace/actor identifiers, optional route key, bounded duration/value, and allow-listed enum dimensions. It rejects arbitrary payloads and authored content.

| Metric | Operational definition | Content-safe evidence |
| --- | --- | --- |
| Activation | First session with a durable save and positive UWT | save count, focused milliseconds, timestamps |
| Retention | Meaningful writing session at/after 7, 30, 90, and 180 days | project/workspace IDs and dates |
| Project depth | Counts of active chapters, structure objects, entities, milestones and causal relations | bounded counts only |
| Core conversion | Subscription reaches `CORE` + `ACTIVE`/`TRIALING` | plan/status enums |
| Export pattern | Verified export grouped by scope/format | enum and count/bytes |
| Recovery | Resolved conflict, restored snapshot or completed safe recovery | action/status/count |
| UWT | Focused editor intervals excluding idle, navigation and modal interruption | durations only |
| Intelligence interest | Explicit future-interest event | separate `intelligence.interest`; never active plan/revenue |
| Voluntary structure adoption | First explicit structure action; no setup prerequisite | `structure.adopted` with coded surface |
| Context navigation reduction | In-place Peek/Open count compared with full route changes | existing context/navigation events |
| Capture habit | Distinct Capture-active days and later processing actions | `capture.opened`, `capture.processed` |
| Causal value/friction | Bounded trace timing plus coded helpful/neutral/burdensome response | `causality.trace`, `causality.feedback` |
| Autosave trust | Coded trust response reviewed beside save/conflict/recovery outcomes | `autosave.trust_feedback` and existing reliability events |
| Core price/value sentiment | Controlled response codes for the USD 15 Core offer | `core.value_feedback`; no authored response text |
| External-tool escape | Controlled reason code for a writing-adjacent task completed elsewhere | `external_tool.escape`; no external URL or content |

Friction events cover editor writable/first keystroke, Continue, route changes, Peek/Open, Capture open, Search return, recovery, editor-only sessions and causal trace. Query terms, results, titles, prose and content-derived strings are prohibited. SQL/dashboard consumers group only allow-listed columns and retain 7/30/90/180-day project cohorts; access is restricted to operational roles.

The executable dashboard contract is `docs/analytics/operations-dashboard.sql`. Project-scoped events carry an optional `projectId` that the repository validates against the authenticated workspace before storage. Retention is derived independently at 7, 30, 90, and 180 days from durable-save activation and later writing-session events; no content or scheduled aggregate producer is required. Paid-cohort feedback uses only controlled `sentimentCode`, `reasonCode`, `surfaceKey`, and `cohortKey` dimensions; free signup volume is not a success substitute.
