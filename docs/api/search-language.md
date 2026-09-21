# Search and Language API

All routes require an authenticated actor, use the V2 success/error envelope, validate project ownership, and return stable errors without echoing authored request data.

| Route | Method | Contract |
| --- | --- | --- |
| `/api/v2/projects/{projectId}/search` | `GET` | Read-through universal search. Accepts bounded `query`, `limit`, stable offset cursor, optional chapter/block context, and optional active type filters. Returns grouped ranked results, provider states, synchronization metadata, and structural version. |
| `/api/v2/projects/{projectId}/search/causal` | `POST` | Explicit `WHY`/`DEPENDS` expansion for a structured causal endpoint. Reuses existing depth/node/edge budgets and path provenance. |
| `/api/v2/projects/{projectId}/language` | `POST` | Local dictionary lookup for an explicit selection of at most six words/160 characters and a locale. Returns `READY`, `NOT_FOUND`, or `UNAVAILABLE`, deterministic senses/antonyms, and saved state. |
| `/api/v2/projects/{projectId}/vocabulary` | `GET` | Returns at most 100 actor-owned saved vocabulary entries for the project. |
| `/api/v2/projects/{projectId}/vocabulary` | `PATCH` | Idempotent `SAVE` or `REMOVE` for a bounded term/locale and optional definition/part of speech. |

Search actions expose only supported action metadata. Timeline Event, Note, and Research provider states are active from Sub-gate 11. Language failures do not alter editor state or disable writing.
