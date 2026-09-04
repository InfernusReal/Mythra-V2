# Agent Tool Boundaries

The transport and tool application service depend inward on ports and domain contracts. They do not import Prisma, issue SQL, or interpret proposal payloads into canonical mutations. `lib/tools/http.ts` handles session, origin, rate-limit, validation, and JSON-RPC translation; `domains/tools/application/service.ts` enforces permission and dispatches; infrastructure adapters are the only S17 tool components allowed to query PostgreSQL.

Dedicated readers enforce the active actor, workspace membership, active project, child-object project identity, and fixed response budgets. Existing Search, Universe, and Causality application services are reused through ports and retain their own ownership and budget checks. Not-found behavior masks cross-workspace existence.

Structure and causal proposal calls persist only a `Suggestion`. Accepting, modifying, rejecting, or marking it intentional records the author decision but does not execute its proposed action. Canonical hierarchy, chronology, causality, and prose remain owned by their existing domain services. Notes and Captures are the only active metadata writes and require explicit confirmation before their existing application services run.

Tool or suggestion failure is isolated from project, chapter, editor, autosave, recovery, export, and billing routes. A zero-AI deployment therefore retains every deterministic Core capability.
