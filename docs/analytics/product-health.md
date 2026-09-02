# Product health and friction metrics

All events use `lib/observability/operations.ts`. The schema accepts an enumerated event name, stable workspace/actor identifiers, optional route key, bounded duration/value, and allow-listed enum dimensions. It rejects arbitrary payloads and authored content.

| Metric | Operational definition | Content-safe evidence |
| --- | --- | --- |
| Activation | First session with a durable save and positive UWT | save count, focused milliseconds, timestamps |
| Retention | Meaningful writing session at/after 30, 90, and 180 days | project/workspace IDs and dates |
| Project depth | Counts of active chapters, structure objects, entities, milestones and causal relations | bounded counts only |
| Core conversion | Subscription reaches `CORE` + `ACTIVE`/`TRIALING` | plan/status enums |
| Export pattern | Verified export grouped by scope/format | enum and count/bytes |
| Recovery | Resolved conflict, restored snapshot or completed safe recovery | action/status/count |
| UWT | Focused editor intervals excluding idle, navigation and modal interruption | durations only |
| Intelligence interest | Explicit future-interest event | separate `intelligence.interest`; never active plan/revenue |

Friction events cover editor writable/first keystroke, Continue, route changes, Peek/Open, Capture open, Search return, recovery, editor-only sessions and causal trace. Query terms, results, titles, prose and content-derived strings are prohibited. SQL/dashboard consumers group only allow-listed columns and retain 30/90/180-day project cohorts; access is restricted to operational roles.

The executable dashboard contract is `docs/analytics/operations-dashboard.sql`. Project-scoped events carry an optional `projectId` that the repository validates against the authenticated workspace before storage. Retention is derived independently at 30, 90, and 180 days from durable-save activation and later writing-session events; no content or scheduled aggregate producer is required.
