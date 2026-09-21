# History and portability operations

## Snapshot and integrity

Create a manual snapshot through the owned Project Home control or the snapshot route with a stable idempotency key. A snapshot is usable only in `VERIFIED` state. Verification requires immutable private bytes, representation `2.2.1`, manifest completeness, SHA-256 and exact byte length. `FAILED` is retryable with the same key; never relabel failed bytes as verified.

Scheduled processing runs `npm run worker:snapshots`. It selects a bounded set of active projects whose latest verified snapshot is absent or older than 24 hours and uses a daily stable request key. Operational logs contain IDs, counts, sizes, hashes and codes only.

## Restore

Prefer `SAFE_COPY` for drills and investigation. It verifies the source archive, copies private research assets, creates a new owned Project, remaps stable object identities deterministically and restores canonical collections in dependency order. Compare source and restored collection counts before accepting the drill.

`CURRENT` restore is higher impact. The service first creates and verifies a new full snapshot of the current state, then records a `RESTORE_CHECKPOINT` for every current chapter before applying archived canonical rows in one serializable operation. If checkpoint creation or archive verification fails, current state is unchanged. Never remove the checkpoint used by an active restore.

## Export and download

Chapter, volume and manuscript artifacts are Text/Markdown. The full project artifact is the versioned Mythra JSON archive. Artifacts are immutable, idempotent, retryable, private and expire after 24 hours. Download access requires a five-minute HMAC token bound to user, workspace, project and artifact; the artifact expiry and digest are checked again on byte read.

## Import

Text, Markdown and DOCX uploads are stored privately before preview. DOCX uses the maintained Mammoth parser. Preview proposes at most 2,000 chapter splits; no canonical write occurs until explicit confirmation. Confirmation only appends chapters and preserves the original upload for seven days. Expired previews fail closed.

## Failure, retention, and rollback

Storage, manifest, import or restore failures affect only history/portability controls; writing, autosave, local journal and Capture remain available. Internal snapshots retain for 90 days in S13, but automated destructive purge is prohibited. User export artifacts and internal backups are distinct records.

Before S14 depends on these tables, isolated rollback may run `prisma/migrations/20260830120000_history_portability/rollback.sql`. It removes only S13 tables/columns and retains prior Projects, Chapters, ChapterRevisions, ObjectRevisions and Live Model state. PostgreSQL ChapterRevision enum additions remain for rolling-deployment safety.
