# ADR 0015: Current selection capture and early command intent

Status: implemented candidate; acceptance pending. Authority: the user's explicit “Authorized” response and Path 33.1, published before code at `50c93c4`.

## Evidence and decision

The first desktop failure in CI 37126986379 restores eight characters of a nine-character backwards native selection. The trace's last engine notification precedes the last native step. Capture uses the focused editor's current native selection, public `posAtDOM`, valid inline endpoints, and direction-preserving anchor/head. It reads no text and dispatches no transaction. Engine fallback covers unmounted/destroyed/blurred/outside/composing/non-text and unmappable cases. Existing command restoration and manuscript/history persistence stay unchanged.

The mobile failed snapshot contains no palette. Ctrl+K precedes hydration by approximately 390ms. A dependency-free inline beforeInteractive script stores at most one command-open intent in document memory, not storage. No command executes before readiness. The same palette keyboard handler installs in a layout effect, claims a matching-route intent not older than ten seconds once, and returns to its original ownership. A stale/future/different-route intent is discarded. IME, modified combinations, non-application routes and active modals retain their protections. The compiled bootstrap function has no module dependencies; browser tests exercise its serialized production body and real integration.

Shared modal containment installs before paint, without changing keyboard logic or focus order. Overlay capture uses the same read-only snapshot; restoration refuses a changed route/destroyed editor, prevents native focus scrolling, and disables Tiptap's delayed scrollIntoView. The saved explicit scroll remains authoritative.

## Frozen boundaries and limitations

Only five existing leaf sources change: layout adds one sibling inline Script/import; ChapterEditor changes the capture read only; CommandPalette changes keyboard readiness only; overlay changes coordinate capture/safe restoration only; modal keyboard changes effect timing only. Exact substitutions and every other checkpoint file are tested, including synthetic unauthorized edits/deletion. All original tests, thresholds, workflows, registry/ranking/history/navigation, schema/APIs, durability/continuation and dependencies remain unchanged. The existing locale/theme/providers/metadata and DOM hierarchy stay intact.

This is a separately authorized reliability repair, not Phase 7X implementation. The beforeInteractive bridge cannot operate before any JavaScript executes, or after JavaScript fails to load. It does not promise a JavaScript-free command UI. The delayed-hydration additive browser case injects the **exact production bootstrap** as an init script while holding application chunks, then verifies handoff to the actual palette; the unchanged E2E independently tests normal application bootstrap/navigation on both devices.

Aborted-request server exceptions remain separately investigated and retained in Path. No global suppression, dependency/framework patch, API/error-envelope rewrite or passing-clean claim is part of this decision. Required local and exact-source hosted evidence must be complete before acceptance or a Phase 7X baseline gate.
