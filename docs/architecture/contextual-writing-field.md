# Contextual Writing Field v1

Sub-gate 7 implements the Contextual Writing Field as a bounded projection over author-owned canonical data. It is not a canonical domain and it is not a generic navigation sidebar.

## Resolution and stability

The application service reads one consistent source snapshot and passes it to a deterministic provider registry. The original Sub-gate 7 providers are chapter outlines, milestones, direct causal relations, existing references, and Narrative Intent. Sub-gate 8 adds Capture after its canonical persistence, ownership, revision, and API seams pass. Entity, search/language, timeline, Note, and research providers remain unregistered until their owning sub-gates.

Resolution follows pinned context, explicit selection, explicit Peek, idle-safe cursor-local context, chapter context, and project fallback. Within the resulting set, direct causal cards sort before general references. Stable source identity breaks equal-rank ties. The response carries a structural version, source freshness timestamp, and `contextKey`; the client rejects stale responses whose key no longer matches the requested coordinate.

Typing triggers a 300 ms idle debounce. Each new read aborts the preceding request. Continuous typing therefore does not cause a request per keystroke, and projection failures never block the editor.

## Directive contract

`NarrativeDirectiveProjection` contains Purpose, Advance, Preserve, Reader Outcome, Next, Relevant Context, `becauseItems[]`, and `consequenceItems[]`. Every line carries source provenance and a Peek descriptor. Compilation is read-through and uses only author-authored outline, milestone, causal, reference, and Narrative Intent records. It does not infer story meaning or write prose.

## Interaction contract

Desktop renders a dedicated context region; smaller viewports render the same projection in a focus-preserving overlay. Peek uses a portal without changing route or browser history. Before opening it captures active element, selection, scroll coordinate, and route. Escape or the exact `Return to Chapter` action restores that state. Open is a separate, explicit deep-navigation action.

Pin/unpin is durable per project and author. Card-type mute is durable per project and author. Session hide and directive disable remain local session preferences. Inline editing is limited to safe fields exposed by a source; it uses optimistic structural-version checks, writes a complete revision, and emits content-free outbox metadata atomically.

## Bounds, privacy, and degradation

The card cap is validated from 1 through 20; `More` remains an explicit bounded increase. Pins are capped at 100. Repository queries are workspace-scoped and bounded. Causal paths are absent from the initial projection and load only after `Why now?` or `What changes?`, using the existing bounded causal service.

Telemetry records identifiers, discriminants, counts, timing, and stability hashes only. It never records source body text, manuscript content, selection text, directive text, or card summaries. A context failure leaves chapter editing, local journaling, autosave, recovery, and continuation operational.
