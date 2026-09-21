# Zero-friction Capture

## Write path

`Ctrl/Cmd+Shift+Space` snapshots the same focus coordinate used by Peek. Saving first validates the 20,000-character client bound and writes one `PendingCapture` to IndexedDB. The overlay then closes and restores route, browser history, Tiptap selection, focus, and scroll before attempting the server request. A successful acknowledgement removes the local record. Failure marks it for exponential retry, capped at 60 seconds; mount and browser `online` events execute a bounded replay cycle.

The local store contains at most 100 records. It never uses raw text in a key or console event. The queue is support infrastructure: failure cannot affect journaling, autosave, recovery, continuation, or canonical chapter content.

## Canonical model

`Capture` stores the private raw source, capture coordinate, author/project ownership, lifecycle, deferral and retention metadata, and version. `CaptureAttachment` holds explicit chapter or chapter-outline references. `CaptureConversion` holds the idempotency key, canonical target identity, structural version, and source provenance. `CaptureRevision` preserves pre-mutation lifecycle/conversion state. Outbox records include identities and discriminants only.

Repository access is workspace-, project-, and author-scoped. Inbox reads default to 50 and cap at 100; bulk mutations, attachments, and conversions are capped at 100. Creation and conversion replay return the original identity. Conversions increment the project structural version atomically; an optional explicit causal relation performs the next checked structural write and returns its final version.

## Projection and interaction

The Inbox offers bulk and keyboard file/defer/dismiss/restore operations, attach/detach, and active conversion actions. `Because of endpoint` and `This causes endpoint` produce canonical relations only from selected endpoint identity. The Capture context provider is a bounded projection and does not become story truth. Peek and Return-to-Chapter behavior retain the S7 focus contract.

Raw text is permitted only in the private Capture UI, canonical storage, and request payload. Logs, outbox payloads, route labels, errors, and identifiers contain only safe metadata.
