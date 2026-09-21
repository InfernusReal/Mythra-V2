# Structure Core API contract

All routes are under `/api/v2/projects/:projectId/structure`, require an authenticated workspace member, and return the standard success or error envelope. Mutation bodies are strict JSON. Except for view state and pure previews, a mutation requires `expectedStructuralVersion`.

| Method/path | Contract | Bound or invariant |
| --- | --- | --- |
| `GET /structure` | Bounded shared read model and active lenses | `pageSize<=250`, `nodeBudget<=500`, `edgeBudget<=750`, clamped `rangeStart` and nullable `nextRangeStart` |
| `POST/PATCH /structure/plots` | Create or inline-edit Plot | One active Plot per Project; revision/outbox/version |
| `PUT /structure/outlines/plot` | Create or replace Plot Outline content | Explicit content only; no implicit empty row |
| `POST/PATCH /structure/volumes` | Create or inline-edit ordered Volume | Project/Plot ownership and explicit hard-target rule |
| `PUT /structure/outlines/volume` | Create or replace Volume Outline content | Volume must belong to Project |
| `PUT /structure/outlines/chapter` | Create or update Chapter Outline | Optional chapter/volume; metadata lists bounded |
| `PATCH /structure/outlines/chapter` | Promote/demote while preserving ID | References remain attached to stable outline ID |
| `PATCH /structure/chapters/membership` | Assign or clear prose-first Chapter volume | Does not read or mutate body/revision version |
| `POST /structure/scenes` | Convert outline block into optional Scene | Source provenance plus non-causal backlink |
| `POST /structure/intents` | Create Narrative Intent | Active S4 target adapter and selection validation |
| `POST /structure/references` | Create non-causal Story Reference | Same project, non-self, active S4 endpoint types |
| `POST /structure/scaffold/preview` | Deterministic allocation plan after ownership guard | Up to 100 volumes and 10,000 chapters |
| `POST /structure/scaffold/apply` | Apply exact reviewed token | Hash and expected structural version must match |
| `POST /structure/reorder/preview` | Renumber impact after ownership guard | Up to 1,000 stable IDs; no mutation |
| `POST /structure/reorder/apply` | Transactional volume reorder | Complete unique current ID set required |
| `PUT /structure/view-state` | Save mode/lens/expansion/anchor/position/pins | Preference only; no story version/outbox/revision |

Errors use the frozen code catalog. Validation is `VALIDATION`; missing or cross-workspace resources are `NOT_FOUND`; stale preview/apply is `CONFLICT`; unavailable later-domain adapters are `DEPENDENCY_UNAVAILABLE`; database/domain invariant conflicts are `INTEGRITY_ERROR`.

No S4 route creates a milestone, causal relation, timeline event, entity, Note, or Capture. No route edits manuscript prose.
