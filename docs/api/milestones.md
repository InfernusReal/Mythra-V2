# Milestones API contract

All routes are under `/api/v2/projects/:projectId/milestones`, require an authenticated workspace actor, and use the stable success/error envelope. Canonical writes require `expectedStructuralVersion`.

| Method/path | Contract | Bound or invariant |
| --- | --- | --- |
| `GET /milestones` | Ordered milestones, role links, dependency edges, derived progress | `nodeBudget<=500`, displayed `edgeBudget<=750`, progress inputs `<=50,000`; overflow flags returned |
| `POST /milestones` | Create ordered/ranged milestone | Same project; unique sequence; complete ordered range; resultant revision/outbox/version |
| `PUT /milestones` | Edit milestone by `milestoneId` | Stable identity; optimistic project version; nullable advisory fields may be cleared |
| `POST /milestones/links` | Attach Chapter with semantic role and weight | Same project; custom label rule; exact active duplicate is idempotent |
| `POST /milestones/dependencies` | Create active/tentative/retired dependency | Same project; non-self; active hard cycle rejected; graph verification capped at 5,000 edges |
| `PUT /milestones/dependencies` | Edit dependency by `dependencyId` | Same cycle and ownership checks; full revision stored |
| `POST /milestones/reorder/preview` | Preview moving one stable ID | Ownership checked; complete unique order, at most 500 IDs |
| `POST /milestones/reorder/apply` | Atomic two-pass sequence rewrite | Exact complete current ID set; revisions/outbox/version |
| `POST /milestones/scaffold/preview` | Deterministic placeholder/rebalance allocation | Ownership checked; `milestoneCount<=500`, `chapterCount<=10,000`; cadence requires date and interval |
| `POST /milestones/scaffold/apply` | Atomically apply reviewed allocation | Exact plan token, expected structural version, and existing-count match |

Milestone Narrative Intent targets continue through `/structure/intents`; Milestone Story References continue through `/structure/references`. Both resolve the endpoint against the same Project. `CONFLICT` identifies stale versions or previews, `INTEGRITY_ERROR` identifies hard cycles or database invariants, `DEPENDENCY_UNAVAILABLE` identifies an over-budget cycle proof, and inaccessible identities return `NOT_FOUND`.

No milestone route reads or changes manuscript body content. Logs exclude milestone title, description, thread label, dependency note, Narrative Intent text, and prose.
