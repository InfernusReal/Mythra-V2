# Mythra V2

Mythra V2 is a local-first, context-aware long-form writing environment implemented from the Product + Engineering Implementation Bible v2.2.

## Runtime

- Node.js 22.12 or newer
- PostgreSQL 16 or a current Prisma Postgres development server
- npm 11 or compatible package manager

## Local setup

1. Copy `.env.example` to `.env` and replace every placeholder secret.
2. Install dependencies with `npm install`.
3. Start disposable local PostgreSQL with `npm run db:dev`, or supply a PostgreSQL `DATABASE_URL`.
4. Run `npm run db:generate` and `npm run db:deploy`.
5. Start the application with `npm run dev`.

Development authentication is isolated behind the external-auth adapter and is rejected in production. Set `AUTH_MODE=oidc` and valid issuer, audience, and JWKS values outside local development.

## Verification

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:coverage`
- `npm run build`
- `npm run test:e2e`

## Agent application seam

The zero-AI V2 build exposes a project-scoped, MCP-compatible application-tool seam for bounded reads, non-canonical proposals, and explicitly confirmed Note/Capture writes. Prose replacement is disabled. See `docs/api/agent-tools.md`, `docs/architecture/agent-tool-boundaries.md`, `docs/security/agent-tool-content-policy.md`, `docs/evaluations/future-agent-harness.md`, and `docs/runbooks/agent-tool-operations.md`.

Implementation evidence, gate status, deviations, and remote Git verification are recorded in `Path.md`.
