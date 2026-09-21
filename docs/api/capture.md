# Capture API

All routes require an authenticated workspace actor, use the standard response envelope, validate inputs, and enforce project plus creating-author ownership in the repository. Capture content is never logged.

## Create and synchronize

`POST /api/v2/captures`

The body contains `clientCaptureId`, `projectId`, raw text, route, optional chapter/outline/block and selection coordinates, entity-context IDs, and capture timestamp. Text is limited to 20,000 characters. Replaying the same author/client identity returns the original Capture with `replayed: true`.

## List and detail

`GET /api/v2/projects/:projectId/captures` accepts lifecycle, cursor, limit, and due-only filters. Limit defaults to 50 and cannot exceed 100. `GET /api/v2/projects/:projectId/captures/:captureId` returns one private Capture with bounded attachment and conversion counts.

## Lifecycle

`PATCH /api/v2/projects/:projectId/captures` accepts at most 100 Capture IDs and one of `FILE`, `DEFER`, `DISMISS`, or `RESTORE`. Deferral requires an ISO due time. Restore clears deferral and dismissal retention fields. No lifecycle action deletes source text.

## Attachments

`POST /api/v2/projects/:projectId/captures/:captureId/attachments` creates an idempotent chapter or chapter-outline reference. `DELETE` on the same route takes `attachmentId`. Target identity is validated inside the same project. A Capture has at most 100 attachments.

## Conversions

`POST /api/v2/projects/:projectId/captures/:captureId/conversions` requires an active conversion type, idempotency key, expected structural version, and optional explicit target. Active S8 types are Milestone, Story Change, chapter attachment, outline attachment, and Capture-derived causal identity. Entity, Note, and Timeline Event remain unavailable.

An optional causal action is valid only with a Capture-derived conversion. It specifies `BECAUSE_OF` or `THIS_CAUSES`, an active endpoint identity, and a relation type. The response returns the final structural version after both explicit writes. A retry with the same conversion key returns the original conversion identity.
