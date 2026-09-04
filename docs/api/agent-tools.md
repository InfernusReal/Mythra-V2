# Agent Application Tool API

The V2 agent seam is a project-scoped, MCP-compatible JSON-RPC endpoint at `POST /api/v2/projects/{projectId}/tools`. It accepts only `tools/list` and `tools/call`. The browser session authenticates the author, unsafe requests must be same-origin, and the durable per-actor rate limit is 60 requests per window.

`tools/list` returns the stable tool name, title, description, draft-7 JSON input schema, output schema, permission, and read-only/destructive/idempotent/open-world annotations. Successful calls return MCP text content plus the same bounded object as `structuredContent`; the JSON-RPC transport wraps that result as `{ "jsonrpc": "2.0", "id": ..., "result": ... }`. Failures return a stable JSON-RPC code plus `requestId` and application error code; raw runtime errors are never returned.

## V2 registry

| Permission | Tools |
| --- | --- |
| Read | `get_project_map`, `get_plot`, `get_volume_outline`, `get_milestone`, `get_chapter_outline`, `get_chapter_text`, `search_project`, `get_entities`, `get_entity`, `get_timeline_window`, `get_backlinks`, `get_causal_neighborhood`, `trace_causal_impact`, `get_story_change` |
| Propose | `create_suggestion`, `propose_structure_patch`, `propose_causal_relation` |
| Write-metadata | `create_note`, `create_capture` |
| Restricted write | `replace_prose_range` |

Hierarchy collections cap at 100 rows per branch. Prose and outline requests cap at 8,000 UTF-16 units. Timeline requests cap at 101 events, backlinks at 100 rows, search at 100 results, and causal traversal retains its depth/node/edge/path limits.

## Examples

```json
{"jsonrpc":"2.0","id":"list-1","method":"tools/list","params":{}}
```

```json
{"jsonrpc":"2.0","id":"chapter-1","method":"tools/call","params":{"name":"get_chapter_text","arguments":{"chapterId":"00000000-0000-4000-8000-000000000001","start":0,"length":4000}}}
```

```json
{"jsonrpc":"2.0","id":"proposal-1","method":"tools/call","params":{"name":"create_suggestion","arguments":{"sourceAgent":"continuity.agent","idempotencyKey":"chapter-1-review-1","category":"continuity","finding":"Review the cited continuity evidence.","evidenceReferences":[],"proposedActions":[]}}}
```

`replace_prose_range` is discoverable as a reserved contract but always returns forbidden in V2, even if a caller attempts to inject a restricted permission. A future prose-write implementation requires a new reviewed gate and explicit author action for each change.
