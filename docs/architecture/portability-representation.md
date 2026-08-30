# Mythra portability representation 2.2.1

`mythra.project-archive` version `2.2.1` is the stable full-project representation. The top-level object contains `representation`, `representationVersion`, `generatedAt`, canonical Project metadata, `collections`, and a human-readable `manuscriptMarkdown` companion.

All canonical collection names are frozen in `domains/portability/domain/representations.ts`. Rows retain stable source IDs in an export. A safe-copy restore creates a deterministic ID map and rewrites object IDs, project IDs, endpoint IDs, block anchors, relation endpoints, and foreign keys without changing relation types, state, conditions, notes, provenance or author-owned values. The source archive remains immutable and therefore preserves the original identities.

The manifest stores the representation version, Project ID, structural version, per-collection counts, a sorted-ID digest per collection, complete archive SHA-256 and byte length. Verification recomputes every field. A missing collection, count/identity mismatch, unsupported version, byte-length mismatch or SHA mismatch fails closed before restore.

Full archives contain canonical data only. Search documents, Live Story Model projections, warnings and local browser caches are rebuildable and are not exported as story truth. Stored research asset metadata is represented and verified; private asset bytes are copied separately during safe-copy restore. Human-readable chapter/volume/manuscript exports are author artifacts and do not replace the full representation.

V1 import mapping is deliberately narrow: chapters remain chapters; former chapter ownership becomes milestone links only when supplied; world nodes become StoryEntities; scenes remain optional; supplied causal relations retain their facts. The seam reports zero invented outlines and zero invented causal relations.
