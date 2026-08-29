# Universe API

All routes use the authenticated V2 envelope and return stable errors without authored request data.

| Route | Methods | Contract |
| --- | --- | --- |
| `/api/v2/projects/{projectId}/universe` | `GET`, `POST` | Bounded type/status/tag/cursor list; minimal or field-complete entity create. |
| `/api/v2/projects/{projectId}/universe/types` | `GET`, `POST` | Localized system/project catalog; project custom type with typed field definitions. |
| `/api/v2/projects/{projectId}/universe/quick-create` | `POST` | Atomic entity plus manuscript-block StoryReference from a stable selection coordinate. |
| `/api/v2/projects/{projectId}/universe/relations` | `POST` | Idempotent explicit directional relation. |
| `/api/v2/projects/{projectId}/universe/entities/{entityId}` | `GET`, `PATCH` | Bounded detail/backlinks/history and optimistic complete-revision update. |
| `/api/v2/projects/{projectId}/universe/entities/{entityId}/snapshots` | `POST` | Immutable state snapshot with optional canonical anchor. |

`TIMELINE_EVENT` causal anchors are active from Sub-gate 11. Universe binary field controls remain dependency-unavailable; S11 Research files use the separate validated private-storage contract rather than silently changing Entity field semantics. Cross-workspace and cross-project IDs return `NOT_FOUND` to avoid resource disclosure.
