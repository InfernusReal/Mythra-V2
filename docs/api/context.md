# Context API

All routes require an authenticated workspace actor, validate input with Zod, return the standard API envelope, and enforce project ownership inside the repository.

## Read chapter context

`GET /api/v2/chapters/:chapterId/context`

Optional query fields are `selectionStart`, `selectionEnd`, `cursorOffset`, `peekType`, `peekSourceId`, `peekBlockId`, and `cardCap`. The response contains the resolver coordinate, `contextKey`, structural version, freshness timestamp, typed descriptors, pin identities, durable card preferences, and the complete Narrative Directive v1 contract.

Only the S7 providers are active. A request cannot create or return Capture, entity, timeline, Note, research, or language-backed cards.

## Update context preferences

`PUT /api/v2/projects/:projectId/context/preferences`

The body supplies the full muted card-type list. Pinning uses the same route with `POST`; unpinning uses `DELETE`. Pin bodies use typed source identity and optional block identity. Pins are ownership-validated against an active S7 provider and capped at 100.

## Edit a safe source field

`PATCH /api/v2/projects/:projectId/context/sources`

The body contains source type, source identity, optional block identity, field, value, and `expectedStructuralVersion`. Only the source/field combinations declared editable by the provider are accepted. The write uses optimistic concurrency and atomically records the canonical update, a complete object revision, a project structural-version increment, and content-free outbox metadata.

## Error and caching behavior

Validation, authentication, authorization, conflict, and not-found failures use the repository-wide stable error catalog. Responses are private and non-cacheable at shared intermediaries. Clients abort superseded requests and discard any response whose returned `contextKey` does not match the coordinate that initiated it.
