# Backup and restore runbook

The managed database must provide encrypted point-in-time recovery plus daily immutable backups in a separate failure domain. Object storage requires versioning/retention aligned with database snapshots. A backup is not healthy until restore is proven.

For each release and monthly thereafter:

1. Freeze the drill source point and record release/migration identifiers.
2. Restore into an isolated database with independent credentials and no public traffic.
3. Compare table/migration/workspace/project/chapter/audit aggregate fingerprints and run every DB verifier.
4. Verify a synthetic project export and private object checksum. Never read real prose into logs or support tools.
5. Destroy the isolated restore target after the evidence is retained.

`npm run drill:backup-restore` performs a local PostgreSQL custom-format dump/restore into a validated random database name and deletes it in `finally`. Managed-provider PITR must still be rehearsed in staging; the local drill does not claim provider recovery compliance.
