# Timeline, Notes, and Research API

All routes require an authenticated actor, project ownership, bounded Zod validation, stable V2 envelopes, and content-redacted traces. Binary download is the only non-JSON success response.

| Route | Method | Contract |
| --- | --- | --- |
| `/api/v2/projects/{projectId}/timeline` | `GET` | Bounded mode/cursor list with display labels, typed coordinates, explicit links, and project structural version. |
| `/api/v2/projects/{projectId}/timeline` | `POST` | Create or optimistic-update one validated mode; returns event, new structural version, and S12-owned invalidation keys. |
| `/api/v2/projects/{projectId}/timeline/links` | `POST` | Idempotently link an event to an active same-project Entity, Milestone, Chapter, or Timeline Event without creating causality. |
| `/api/v2/projects/{projectId}/notes` | `GET` | Bounded tag/cursor list with normalized tags and backlink counts. |
| `/api/v2/projects/{projectId}/notes` | `POST` | Create or optimistic-update a durable Note, optionally retaining Capture provenance. |
| `/api/v2/projects/{projectId}/notes/promotions` | `POST` | Idempotently promote into Milestone, Story Change, or Chapter Outline with provenance and structural version. |
| `/api/v2/projects/{projectId}/research` | `GET` | Bounded kind/cursor list; FILE rows appear only when the private asset is clean. |
| `/api/v2/projects/{projectId}/research` | `POST` | Create a validated NOTE, URL, EXCERPT, CITATION, or clean FILE item. No URL is fetched. |
| `/api/v2/projects/{projectId}/research/links` | `POST` | Idempotently link Research to an active same-project Story Reference endpoint. |
| `/api/v2/projects/{projectId}/research/assets` | `POST` | Multipart upload with allow-list, 10 MiB, hash, private write, scan, and clean/rejected state. |
| `/api/v2/projects/{projectId}/research/assets/{assetId}/access` | `POST` | Authorizes a clean linked asset and returns a signed relative URL valid for five minutes. |
| `/api/v2/projects/{projectId}/research/assets/{assetId}` | `GET` | Requires both current authentication and the signed `access` token; returns private no-store bytes or a stable JSON error. |

No route returns a storage key. Logs exclude Note/Research bodies, queries, URLs, citations, excerpts, file names, tokens, keys, and bytes.
