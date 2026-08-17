# ADR 0011: Search projection and deterministic Language provider

## Status

Accepted for Sub-gate 10.

## Context

Mythra requires universal project retrieval without making browser state canonical or waiting for Phase 4 propagation workers. It also requires selection-scoped dictionary, synonym, antonym, and saved-vocabulary behavior without an external service or generative model. Timeline events, durable Notes, and Research do not exist until Sub-gate 11.

## Decision

- Store a private, rebuildable `SearchDocument` projection in PostgreSQL. Read-through synchronization compares stable source keys and versions before each query; canonical chapter, structure, causal, Universe, reference, and actor-owned Capture rows remain authoritative.
- Use PostgreSQL full-text and trigram indexes with deterministic application ranking for exactness, prefix/phrase/token matches, explicit references, current chapter/block context, and recency. Bound source collection at 25,000, provider batches at 200, each group at 20, and the public result page at 100.
- Activate only types whose canonical sources exist through Sub-gate 9. Register Timeline Event, Note, and Research providers as explicitly dependency-unavailable until Sub-gate 11.
- Treat Peek, Open, copy, reference insertion/attachment, block jump/return, and causal Why/Depends as explicit actions. Search results never create causality from text.
- Use the local MIT-licensed WordNet data supplied by exact dependency `wordpos@2.1.0`. Externalize `wordpos` and `wordnet-db` from Next server bundles so their Node filesystem-backed dictionaries execute through native Node loading.
- Limit Language to six words and 160 characters, cap senses/synonyms/antonyms, sort deterministically, and cache only normalized lexical lookups in server memory. A provider failure degrades only the Language card.
- Apply replacements with one Tiptap transaction and preserve native undo. Saved vocabulary is canonical per user/project/locale and never changes prose automatically.
- Logs contain IDs, versions, state, counts, lengths, action types, and timing metadata only. Queries, result bodies, manuscript text, Captures, selected text, terms, definitions, and replacements are excluded.

## Consequences

Search freshness is truthful read-through freshness during Sub-gate 10 rather than an asynchronous guarantee. Phase 4 can move synchronization behind outbox-driven propagation without changing the query, provider, or read-model contracts. The local English dictionary works without network access; unsupported locales return a deterministic empty result and can later receive adapter implementations.
