# Deployment and release controls

## Environments

`local`, `preview`, `staging`, and `production` are distinct profiles in `lib/operations/environments.ts`. Credentials, databases, object-storage roots, billing secrets, session keys and recovery keys are never shared. Preview and staging contain synthetic content only. Production requires HTTPS, database TLS, OIDC, the HTTP billing adapter and an independent recovery secret.

## Release order

1. Build the immutable release and record `RELEASE_VERSION` plus worker schema version.
2. Restore the newest backup into an isolated target and compare aggregate fingerprints.
3. Apply migrations to an isolated clone; run all DB verifiers. Destructive changes use expand → migrate/backfill → contract in separate releases.
4. Deploy compatible workers before or with web code. Adjacent schema versions are the maximum supported skew.
5. Enable the editor-save canary for a deterministic workspace percentage. Observe save error/latency, conflict rate, outbox lag and DB saturation.
6. Promote only while alert rules remain `OK`. Roll back the release or set canary percentage to zero on threshold breach; do not roll back a destructive schema change.
7. Verify live/readiness endpoints, export, private storage and backup schedule after promotion.

Feature flags are kill switches, not entitlement checks. `adminRecovery` is off by default. Migration credentials are not application credentials. Production admin/recovery access is OWNER/ADMIN-only and is audited.
