# Agent Tool Operations Runbook

## Signals

Investigate elevated `agent_tools.protocol_failed`, `agent_tools.call_failed`, denied-write, rate-limit, database, or latency signals using request, actor, workspace, project, tool, permission, status, and error-code metadata. Do not request or copy manuscript, Note, Capture, finding, evidence, or proposal content into an operational system.

## Response

1. Confirm whether failure is authentication, origin, ownership, rate limit, validation, restricted permission, database availability, or a bounded-reader defect.
2. Preserve the fail-closed restricted-write rule. Do not grant `RESTRICTED_WRITE` or bypass `authorConfirmed` to restore service.
3. Disable or isolate the supporting tool endpoint if necessary. Keep the editor, local journal, autosave, recovery, snapshots, and export paths available.
4. For proposal retries, retain the original `(projectId, sourceAgent, idempotencyKey)`. For confirmed Note or Capture retries, retain the original operation identity.
5. Rebuild no canonical story data from Suggestions. A proposal remains non-canonical regardless of its resolution status.
6. Verify the repair with schema/permission tests, ownership masking, content-redaction tests, PostgreSQL forward/rollback proof, and the S17 browser scenario before release.

## Recovery boundary

The S17 rollback removes the Suggestion table/status enum and Note tool-idempotency column while preserving predecessor author rows. PostgreSQL audit enum labels remain because removing shared enum values would require rewriting existing audit history. Rollback is a release operation and must follow the migration and backup runbooks.
