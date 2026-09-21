# Billing, entitlement, and quota contracts

All authenticated responses use the V2 success/error envelope and re-authorize the workspace actor. Checkout/customer creation additionally requires OWNER/ADMIN membership backed by a persisted verified-email provider assurance. Mutations require same-origin CSRF validation and rate limiting.

## Endpoints

- `GET /api/v2/billing/status` returns public catalog fields, `EntitlementSnapshot`, up to twelve minimized invoices, provider availability and cancellation-at-period-end state.
- `POST /api/v2/billing/checkout` accepts `{ planKey, idempotencyKey }`. Only `core` is sellable. Return and cancel URLs are server-derived.
- `POST /api/v2/billing/portal` creates a short-lived provider portal for an existing owned billing customer.
- `POST /api/v2/billing/webhooks` accepts a bounded raw body plus `x-mythra-billing-signature: v1=<sha256-hmac>`. It has no session dependency; signature verification, schema validation, unique provider event identity and provider-version ordering are mandatory.

`intelligence` checkout or an active Intelligence webhook is rejected. Provider references, customer IDs, subscription IDs and signatures are never returned by the status DTO.

## Stable quota error

`QUOTA_EXCEEDED` uses HTTP 409 and includes only:

```json
{
  "resource": "snapshotBytes",
  "used": 10737418240,
  "limit": 10737418240,
  "requested": 2048,
  "action": "HIGH_COST_WRITE"
}
```

The error must be rendered as a resource-specific limit with options. It cannot block an owned read or export.

## Metering seams

Usage events are non-negative, workspace-scoped and idempotent by workspace/resource/key. Current seams record clean binary storage, snapshot bytes, revision-storage bytes, export-generation bytes, database row creation and download bandwidth. Metering failure is logged by stable code and degrades independently after a successful owned export/download/checkpoint.
