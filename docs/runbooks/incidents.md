# Operational incident runbook

Alerts are defined in `lib/observability/alerts.ts` with threshold, window, severity, runbook and hysteresis recovery threshold. `npm run drill:release` proves every rule fires and resolves.

## Alert state and delivery

Operational events update durable alert state in the same PostgreSQL transaction that accepts the event. Save, backup and storage rules are isolated by workspace. Authentication, outbox-lag and database-saturation rules use the explicit global scope because their producers run before or outside a workspace session. Alert state and delivery rows contain only stable rule/scope identifiers, bounded numeric observations, transition state/version, timestamps, severity, retry metadata and a runbook reference; they must never contain manuscript, world, Capture, Note, Research, credentials, claims, raw errors or object-storage keys.

One delivery row is created for each state transition. Stable `FIRING` or `OK` observations do not create duplicate deliveries. The inline attempt uses the provider-neutral structured-log adapter. Failed attempts remain durable with the fixed `ALERT_DELIVERY_FAILED` code, exponential backoff capped at five minutes and a 30-second claim lease. Run `npm run worker:alerts` as a recurring worker to reclaim expired leases, retry eligible deliveries and expire fixed-count windows. Worker failure does not change the primary save, authentication, readiness, backup, storage or projection outcome.

Use the restricted Workspace Operations screen to inspect the current workspace plus global alert states. Use `npm run db:verify:alerts` only against an isolated verification database to prove all six live rules, transition uniqueness, concurrency, retry, recovery, scope isolation and content exclusion. Use `npm run db:rollback:alerts` only against a disposable database; it removes only the two alert tables and its migration record while preserving predecessor operational events and workspaces.

## Save failures

Stop canary expansion, inspect stable error codes and DB readiness, preserve local journals, and restore service before retrying. Never request manuscript content.

## Outbox lag

Check worker compatibility, leases, retry/dead-letter counts and DB saturation. An ADMIN may preview and explicitly confirm a single failed-event requeue; the action is replay-safe and audited.

## Authentication

Check issuer/JWKS reachability, session key identifier and rate-limit counts. Rotate using current plus one previous key; revoke the previous key after the bounded session lifetime.

## Storage

Stop new uploads if scanning or private storage is unavailable. Quarantine/delete unclean objects, validate checksums and never issue public object URLs.

## Database

Stop canary expansion at 85% saturation, identify connection/query pressure, keep writes durable, and scale only from measured evidence. Restore is the last resort and follows the backup runbook.
