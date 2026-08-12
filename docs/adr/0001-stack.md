# ADR 0001: Phase 1 application stack

Status: Accepted

## Decision

Use Node.js 22 LTS-compatible runtime, Next.js 16 App Router, React 19, strict TypeScript, PostgreSQL, Prisma ORM 7 with the PostgreSQL driver adapter, Vitest, Testing Library, and Playwright. Keep the application a modular monolith with explicit domain, application, infrastructure, and transport boundaries.

## Rationale

This stack provides server-rendered shell delivery, thin HTTP routes, mature React accessibility tooling, version-controlled PostgreSQL migrations, and a direct path from one deployment to separately scalable web and worker processes. It does not introduce premature services.

## Consequences

Node.js 22.12 or newer is required. Server-only infrastructure must never enter client bundles. Every repository query must include ownership scope. Database migrations and rich-document migrations remain separate.
