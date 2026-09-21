# Timeline, Notes, Research, and degraded-mode architecture

## Canonical boundaries

`TimelineEvent`, `TimelineEventLink`, `Note`, `NotePromotion`, `StoredAsset`, `ResearchItem`, and `ResearchItemLink` are PostgreSQL truth. Repositories enforce workspace/project ownership, active-source status, bounded pages, optimistic versions where applicable, idempotent promotion/link identities, and structural-version invalidations. Search documents, Context descriptors, browser offline caches, and directive views are derived and cannot overwrite these sources.

Timeline modes retain an author-owned `displayLabel`. Absolute, approximate, and range events carry sortable numeric coordinates; relative events resolve through an explicit anchor and offset with a 128-node visited budget; ordinal events carry order only. A typed event link never implies causality. The Timeline causal adapter resolves only an explicitly selected event and exposes a comparable story-time coordinate only when one exists.

Notes are durable project references distinct from actor-private raw Capture. Normalized tags are a bounded flat set, not a hierarchy. Backlinks use explicit references. Promotion creates the selected structural object and a provenance row atomically. Capture conversion retains its original Capture and conversion provenance for both Note and Timeline targets.

Research variants are discriminated and mutually constrained. Text and URL metadata remains in PostgreSQL; bytes remain in private object storage. Upload reserves a SHA-256 identity, writes privately, invokes the scanner, and activates file Research only for `CLEAN`. Access is two-step: an authenticated authorization call issues a five-minute HMAC URL, and the download route revalidates the session, actor, project, asset, signature, and expiry before reading bytes.

## Projection activation and degradation

The S11 Search provider collects Timeline Event, Note, and Research sources under the existing 25,000-source and 200-row batch bounds. Context resolution includes linked or pinned Timeline, Note, and Research cards after existing direct causal/reference precedence and marks cached fallbacks stale. Timeline writes emit outbox invalidation keys for chronology, directive, and Timeline consumers; S12 remains responsible for persistent worker processing.

The browser capability matrix keeps manuscript journal writes and queued Capture available offline. Search stores at most 50 recent Chapter results and never exposes Note, Research, Capture, entity, or other project data through degraded lookup. One bounded Context model per chapter may be cached and every card/directive is marked stale on fallback. Structure mutation controls are disabled until online; export, snapshot, and billing are explicitly labeled unavailable because their server-owned gates do not yet exist.
