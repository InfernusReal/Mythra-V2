# Agent Tool Content and Permission Policy

Author sessions receive `Read`, `Propose`, and `Write-metadata`. They never receive `Restricted write`. `create_note` and `create_capture` additionally require schema-level `authorConfirmed: true` and retry identities. `replace_prose_range` has a second unconditional service denial, so configuration, role, entitlement, or forged grants cannot enable it in V2.

Every tool call records a durable content-safe audit row with tool name, permission, outcome, duration, stable error code, result count, and truncation flag where applicable. Suggestion audits store identity, category, lifecycle state, counts, and presence flags. Tool arguments, outputs, findings, evidence text, proposed values, prose, Notes, Captures, titles, descriptions, search terms, credentials, and author notes are forbidden from logs, traces, analytics, and audit metadata.

The existing telemetry privacy guard rejects unsafe keys and secret-shaped values. Authored output is returned only to the authenticated project caller and only within the requested response budget. No external agent credential or model provider is introduced by V2.
