# Sensitive content handling

Manuscripts, notes, captures, selected prose, document JSON, and derived plain text are sensitive content.

- Never emit sensitive content to logs, traces, analytics, audit metadata, errors, support surfaces, fixtures copied from users, or URLs.
- Structured logs accept an allow-list of identifiers, counts, versions, durations, route names, step identifiers, result codes, and booleans.
- The logger rejects keys associated with body, text, prose, content, document, capture, or note material.
- Correlation IDs connect safe telemetry without revealing content.
- Database and object storage must use encryption at rest in managed environments. Network transport requires TLS outside local development.
- Routine administration must operate on metadata, not author content.
- Operational schemas allow only enumerated events/dimensions; nested or arbitrary payloads, query strings, filenames, credentials, tokens, signed URLs, newline-bearing values and content-family keys are rejected before emission.
- Restricted admin queries use explicit field selects and never retrieve canonical authored fields.

The required console instrumentation is implemented only through the structured logger transport or explicitly safe bootstrap diagnostics. Each call is comment-tagged and records metadata only.
