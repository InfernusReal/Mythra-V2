# Causality API

All routes require a workspace-scoped actor and return the standard `{ data, meta }` or `{ error, meta }` envelope. Mutation requests include `expectedStructuralVersion`; successful non-idempotent writes increment Project structural version, store a complete revision, and append a content-free outbox event in the same transaction.

## Routes

- `GET /api/v2/projects/:id/causality`: bounded Story Changes, relations and active endpoint choices. Query: `nodeBudget` (1–500), `edgeBudget` (0–750).
- `POST|PUT /api/v2/projects/:id/causality/story-changes`: create/update one Story Change.
- `POST /api/v2/projects/:id/causality/relations`: create one relation. Exact active duplicates return the existing identity and do not increment structural version.
- `PATCH /api/v2/projects/:id/causality/relations/lifecycle`: explicit `REATTACH`, `RETIRE`, or `ARCHIVE`.
- `GET /api/v2/projects/:id/causality/neighborhood`: upstream/downstream/both traversal.
- `GET /api/v2/projects/:id/causality/impact`: bounded impact traversal; the response language field is `potentially affected`.
- `POST /api/v2/projects/:id/causality/chronology`: neutral chronology check for one relation.

Traversal query fields are `endpointType`, `endpointId`, optional `blockId`, `direction`, repeated `state`, repeated `relationType`, `maxDepth` (1–12), `nodeBudget` (1–500), `edgeBudget` (1–750), and `pathBudget` (1–500). Every returned path contains ordered steps with relation ID, relation type, endpoints, provenance type and provenance note. `truncated` is true whenever any declared ceiling stops discovery.

`MANUSCRIPT_BLOCK` uses the Chapter UUID as endpoint ID plus a stable UUID `blockId`. No other endpoint accepts a block ID. Reserved endpoints return HTTP 503 with stable `DEPENDENCY_UNAVAILABLE`. Cross-project and missing endpoints are not exposed. Authored titles, descriptions, conditions, notes, provenance notes, Intent text, selected text and prose never appear in logs or outbox payloads.
