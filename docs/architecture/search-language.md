# Search and Language architecture

## Canonical and projection boundaries

`SearchService` coordinates a typed `SearchProviderRegistry`, read-through `SearchRepository`, and existing bounded Causal traversal service. `SearchDocument` is disposable private projection data. It never owns story state. Synchronization collects canonical sources through Sub-gate 9, upserts changed stable source keys, deletes stale actor-visible projection rows, and reports explicit synchronization counts and project structural version.

Active sources are chapters/manuscript blocks, chapter/plot/volume outlines, milestones, entities and aliases, Story Changes, fixed causal relation types, Universe relation types, StoryReferences, and actor-owned non-dismissed Captures. Timeline events, Notes, and Research remain registered as `DEPENDENCY_UNAVAILABLE` and collect nothing.

PostgreSQL supplies generated English `tsvector` search plus GIN full-text and trigram indexes. The application computes a stable score from exact, prefix, phrase, all-token, fuzzy, explicit-reference, current-context, and recency evidence, then orders by score and source key. Queries cap at 160 characters; pages cap at 100; groups cap at 20; source synchronization caps at 25,000 and batches at 200.

## Action semantics

Peek is local and history-preserving. Open is explicit navigation. Copy is explicit. Insert and Attach create a non-causal StoryReference only after project/child ownership and optimistic structural-version checks. Block jump records editor selection and scroll coordinates and exposes an exact Return action. Why and Depends call the existing structured causal traversal with an explicit endpoint; result text is never parsed into causal truth.

`Cmd/Ctrl+K` combines current commands with grouped project objects. It stores only recent stable source keys and timestamps locally, never the query or result content. Debounced requests are abortable and sequence-checked so stale responses cannot replace current results.

## Language semantics

`LanguageService` validates and normalizes a bounded selection, reads per-user saved state, and invokes a replaceable dictionary provider. `WordNetDictionaryProvider` uses local WordNet data, deterministic sorting, at most eight senses, twelve synonyms per sense, three examples, sixteen antonyms, and a 500-entry process cache. Unsupported locales return no entry. Provider exceptions yield `UNAVAILABLE`; writing and every editor command remain usable.

The editor bridge reads an explicit Tiptap selection, never an idle prose window. Replacement is a single `insertContentAt` transaction, respects an author-defined hard character stop, and remains in native undo history. Saved-vocabulary mutations are idempotent under the database uniqueness key `(userId, projectId, normalizedTerm, locale)`.

## Privacy and activation

Search documents and saved vocabulary are private workspace/project data. Every repository path proves actor membership and child ownership; Capture projection rows additionally require actor ownership. Logs and UI console traces omit all query, lexical, selected, result, Capture, and manuscript content. Search and Language context descriptors are registered in Sub-gate 10 but produce no unsolicited cards: the command/full-search surface owns Search, and an explicit editor selection owns Language.
