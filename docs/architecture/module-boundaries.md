# Module boundaries

Dependencies point inward:

1. `domains/*/domain` contains types and invariants without framework imports.
2. `domains/*/application` orchestrates repositories and policies.
3. `domains/*/infrastructure` implements repository and provider interfaces.
4. `app/*` and `app/api/*` are thin transports and screen composition.
5. `lib/*` contains shared contracts for errors, logging, sessions, telemetry, i18n, and themes.

Routes may validate transport input, resolve a SessionActor, call one application service, and map the result to a stable envelope. Routes and components do not query the database. Client state never becomes canonical server truth.

Cross-domain writes use explicit application orchestration and transactions. The reserved outbox establishes a later reliable-projection seam without claiming projection capability in Sub-gate 0.
