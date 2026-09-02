# Operational incident runbook

Alerts are defined in `lib/observability/alerts.ts` with threshold, window, severity, runbook and hysteresis recovery threshold. `npm run drill:release` proves every rule fires and resolves.

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
