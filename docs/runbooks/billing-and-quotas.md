# Billing and quota operations

## Production configuration

Set `BILLING_PROVIDER=http`, HTTPS `BILLING_PROVIDER_API_URL`, secret-store values for `BILLING_PROVIDER_SECRET` and `BILLING_WEBHOOK_SECRET`, and the Core provider price reference. Core/Intelligence cents remain 1500/2500 for this ADR version. Production startup rejects fixture billing or incomplete HTTP credentials.

## Webhook incident procedure

1. Confirm failure rate using stable event type/status metadata; do not retrieve manuscript data.
2. Validate clock/provider-version ordering and the configured signing secret.
3. Replay the exact provider event. Unique provider/event identity makes processing idempotent.
4. Inspect `BillingWebhookEvent` status/hash/version and non-content `BILLING_CHANGE` audit rows.
5. Never hand-edit subscription state ahead of a verified provider event. If provider recovery is delayed, preserve writing/read/export and communicate the stale billing state.

## Quota incident procedure

1. Identify the cost resource, usage, limit and requested delta from the stable error.
2. Reconcile `UsageEvent` identifiers against storage/job/revision objects; never inspect prose.
3. Correct duplicate/missing accounting with a new idempotent reconciliation event and audit record.
4. Do not delete author content to resolve overage. Existing content remains readable/exportable; allow grace or increase the configured cost allowance.

## Downgrade and cancellation

Cancellation uses paid-period/grace dates. No cancellation webhook deletes projects, chapters, revisions, snapshots, exports or structured metadata. Permanent account deletion remains the separate recoverable account-lifecycle process.

## Migration and rollback

The migration is additive. Deploy code capable of ignoring the new tables, deploy the migration, then activate billing routes. Rollback drops only S14 tables; additive `AuditEventKind` values remain because removing PostgreSQL enum values requires replacing a shared enum and could invalidate earlier audit rows. Before rollback, verify usage/webhook evidence has been exported for financial reconciliation.
