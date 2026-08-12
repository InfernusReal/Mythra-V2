# Mythra V2 Work Plan

## 1. Authority, purpose, and execution contract

This is the implementation plan for **Mythra V2 Product + Engineering Implementation Bible, version 2.2, dated 12 August 2026** (the **Bible**). The Bible is the product and engineering authority. This file sequences its practical implications; it does not replace, weaken, or reinterpret them.

The repository was empty when this plan was created. Consequently, every path below is an intended implementation path rather than a claim that code already exists. Actual paths, code, test results, deviations, and Git evidence must be recorded in `Path.md` as work occurs.

If this plan and the Bible ever disagree:

1. Stop implementation at the affected gate.
2. Treat the Bible as authoritative.
3. Correct `WorkPlan.md` before writing more product code.
4. Record the discrepancy, correction, and evidence in `Path.md`.
5. Re-run the coverage and contradiction audits in section 12.
6. Commit and push the corrected plan before continuing the affected phase.

### 1.1 Completion language

- **Planned** means specified here but not implemented.
- **Implemented** means code exists but has not necessarily passed its phase gate.
- **Verified** means the required automated and manual evidence exists and the phase gate passes.
- **Deferred** is allowed only where the Bible expressly marks a capability as future, optional, scale-triggered, or post-retention.
- **Omitted** is never an acceptable state for a V2 requirement. A requirement that does not produce a user-facing surface must still appear as an invariant, schema seam, adapter, test, operational control, or explicit non-goal.

### 1.2 Phase and Git protocol

The Bible's original capability phases 0–17 are consolidated into six dependency-ordered delivery phases. This reduces handoff count without merging unrelated acceptance gates.

For every phase:

1. Start from the last verified and pushed phase.
2. Update the phase entry in `Path.md` before coding with the intended slice and baseline commit.
3. Implement the whole phase scope through thin routes, domain services, repositories, and screen-oriented read models.
4. Run focused, integration, E2E, accessibility, performance, security, migration, and recovery checks required by that phase.
5. Compare actual work against this plan and the Bible source sections listed for the phase.
6. Record all files, code behavior, commands, results, screenshots/artifacts where applicable, gaps, and deviations in `Path.md`.
7. Fix every in-scope audit gap before calling the phase complete.
8. Commit the phase as one auditable capability boundary (additional safety commits are allowed).
9. Push the completed phase to `https://github.com/InfernusReal/Mythra-V2` and verify the remote commit. Record branch, commit, and remote verification in `Path.md`.

No phase advances merely because code compiles. The writing-flow gate and the global acceptance contract must pass.

## 2. Product constitution that binds every phase

Every design, schema, endpoint, component, job, warning, quota, and test must preserve these Bible laws:

1. **Writing is sovereign.** No supporting surface blocks access to a writable manuscript except a genuine contractual or data-integrity condition.
2. **The manuscript is the center of gravity.** Common writing-adjacent actions remain reachable from the writing context; deep pages are optional and return to the exact chapter context.
3. **Structure is power, not admission.** Title plus chapter is a valid project. Plot, volumes, outlines, scenes, milestones, entities, timelines, and causality remain optional.
4. **One decision propagates.** Canonical state is written once; rebuildable projections update synchronously when cheap or asynchronously with honest freshness state.
5. **Never lose text.** Local-first journaling, optimistic concurrency, recovery, checkpoints, snapshots, backups, and export are product behavior.
6. **Guidance is peripheral.** Warnings and suggestions do not interrupt prose with modal literary policing.
7. **The author can disagree.** Creative constraints are soft, suppressible, or intentional unless the author explicitly makes a production constraint hard or data integrity requires enforcement.
8. **No artificial lock-in.** Author content and relationships remain exportable and understandable.
9. **Minimal surface, deep system.** The UI stays calm while the domain model supports high complexity and very large projects.
10. **AI is augmentation.** V2 works without model calls. Future intelligence diagnoses, explains, suggests, and waits for author approval.
11. **Causality is power, not paperwork.** Only author-declared causal meaning is canonical; a project with no causal objects remains a complete calm writing app.

Every feature must also pass the Bible's friction test: shorten the path to writing, avoid unnecessary route changes, infer/propagate/defer maintenance work, and measurably protect writing flow.

### 2.1 Orthogonal truth invariant

The code and UI must never conflate:

- **Hierarchy:** where material is organized.
- **Chronology:** when events occur in story time; manuscript reveal order can differ.
- **Causality:** why a change happens or what it enables, blocks, motivates, reveals, transforms, or resolves.

Sequence is not causation. Containment is not dependency. Co-occurrence is not a causal edge. `StoryReference`, timeline relations, ownership relations, and `CausalRelation` remain semantically separate.

### 2.2 V2-wide anti-goals

The implementation must not introduce:

- mandatory scenes, outlines, milestones, causal graphs, world completeness, or pre-writing setup;
- chapter ownership by a milestone or volume ownership of project-wide world facts;
- a fixed five-layer world schema;
- graph-first planning or a global causal hairball as the default;
- default hard word stops, chapter caps, completeness blocks, or literary scores;
- automatic prose rewriting after structural or causal changes;
- causal inference from prose, ordering, containment, mentions, foreshadowing, or co-occurrence;
- AI-created canonical relations without explicit approval;
- raw database access from routes/UI or direct database access from future agent tools;
- canonical client-side story truth or projection-only facts that cannot be rebuilt;
- last-write-wins conflict handling across devices;
- manuscript/capture/note/selected prose in logs or product analytics;
- a theme marketplace, theme builder, social network, marketplace, forum, competition platform, publisher portal, rights system, or generative-AI dependency in V2;
- premature microservices, real-time coauthoring, competitor-specific import breadth, community surfaces, or China-specific deployment claims before their stated validation gates.

## 3. Implementation baseline and repository shape

The implementation will be a TypeScript modular monolith using a server-capable React framework, PostgreSQL through Prisma, a ProseMirror-compatible editor behind a Mythra adapter, IndexedDB for the local draft journal, object storage behind an adapter, and a durable transactional outbox/worker. Exact supported versions are pinned at implementation time and recorded in an architecture decision; they are not guessed in this planning document.

The baseline repository will converge on this shape:

```text
/
  WorkPlan.md
  Path.md
  README.md
  package.json
  lockfile
  tsconfig.json
  framework.config.*
  eslint.config.*
  vitest.config.*
  playwright.config.*
  .env.example
  .gitignore
  .github/workflows/
  docs/
    adr/
    architecture/
    api/
    operations/
    security/
    portability/
  prisma/
    schema.prisma
    migrations/
    seed.ts
  public/
  src/
    app/                         # route composition only
    components/
      shell/
      editor/
      context-field/
      structure/
      universe/
      timeline/
      capture/
      search/
      billing/
      recovery/
      admin/
    features/
      project/
      chapters/
      outlines/
      milestones/
      causality/
      entities/
      references/
      revisions/
      export/
    lib/
      api/
      auth/
      commands/
      editor/
      indexed-db/
      i18n/
      observability/
      storage/
      telemetry/
      theming/
    modules/
      accounts/
      workspaces/
      projects/
      writing/
      structure/
      milestones/
      causality/
      entities/
      references/
      timeline/
      capture/
      context/
      search/
      revisions/
      export/
      storage/
      billing/
      entitlements/
      analytics/
      jobs/
      audit/
      suggestions/
      tools/
    styles/
      tokens.css
      themes.css
      editor.css
  tests/
    unit/
    repository/
    integration/
    e2e/
    accessibility/
    visual/
    load/
    fixtures/
```

Each stable domain uses `*.types.ts`, `*.schema.ts`, `*.service.ts`, `*.repository.ts`, and a `*.mapper.ts` when read-model transformation is nontrivial. Routes validate transport input and delegate. Services own invariants and actor/workspace/project authorization. Repositories own persistence and never orchestrate unrelated domains ad hoc. Application services and domain events handle cross-domain behavior.

The Bible's schema and API catalogs are minimum contracts, not illustrative suggestions. Across the owning phases, migrations must include every important field and relationship in sections 17.1–17.7, indexes in 17.8, endpoints in 18.2, response/error envelopes in 18.3, and idempotency cases in 18.4. If an implementation renames a storage field, its mapper, exported representation, test, and `Path.md` evidence must prove equivalent semantics.

## 4. Consolidated roadmap

| Work-plan phase | Bible roadmap phases preserved | Coherent capability | Exit result |
| --- | --- | --- | --- |
| 1. Trusted Writing Foundation | 0–3 | Foundation, authentication, minimal project/chapter/editor, durability, continuation | A new author writes within seconds; a returning author resumes exact work; reload/network/conflict paths do not lose recoverable text. |
| 2. Progressive and Causal Story Core | 4–6 | Structure, outlines, milestones, semantic coordinates, Story Changes, explicit causal relations and bounded traces | Discovery and architect workflows share one model; causal power is optional; hierarchy/chronology/causality remain distinct. |
| 3. In-Flow Author Environment | 7–11 | Contextual Writing Field, Instant Capture, Universe, search/language, timeline, notes and research | Common supporting work happens through stable Peek/Capture/context interactions without losing the manuscript position. |
| 4. Live Model, Automation, History, and Portability | 12–13 | Durable propagation, directives, rebuildable projections, deterministic automation, revisions, snapshots, import/export | One decision propagates; state is repairable; author work is reversible and portable. |
| 5. Commercial and Production Readiness | 14–16 | Billing/quotas, performance, mobile, accessibility, localization, security, analytics, operations and deployment | Mythra can charge and operate safely for large/global projects without risking prose or privacy. |
| 6. Agent Seam and Paid Launch Validation | 17 + launch gate | MCP-compatible bounded application tools, suggestion/approval seams, final doctrine audit and launch validation | Future agents can assist without direct DB access or silent mutation; every V2 launch condition is evidenced. |

The consolidation is contiguous: no original capability phase is skipped, reordered ahead of its prerequisites, or mapped to more than one completion owner.

## 5. Phase 1 — Trusted Writing Foundation

**Bible roadmap coverage:** phases 0–3.
**Primary source coverage:** sections 0–2, 8, 9, 13–19, 23–27, 29, 31–32, 34–36; appendices B–D where foundational.

### 5.1 Scope

#### Repository, architecture, and identity

- Initialize the TypeScript/server-capable React repository, supported runtime pins, lint/type/test/build commands, CI, environment validation, and local disposable PostgreSQL development path.
- Record ADRs for framework/runtime, auth adapter, editor adapter, persistence, object storage boundary, jobs/outbox boundary, testing, and deployment assumptions.
- Implement external-auth adapter seams while keeping internal `User`, `Workspace`, `WorkspaceMember`, `UserPreference`, session actor, workspace role, and ownership models independent from provider IDs.
- Create a workspace on first authenticated use. Resolve user, workspace, and role before domain services execute.
- Enforce workspace/project ownership in repository queries or immediately preceding guards, including child identifiers. Never fetch an object by ID and assume ownership.
- Establish stable mutation envelopes and error codes: `VALIDATION`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `QUOTA_EXCEEDED`, `RATE_LIMITED`, `DEPENDENCY_UNAVAILABLE`, `RETRYABLE`, `INTEGRITY_ERROR`, `INTERNAL`.
- Implement structured, content-safe logging with request/correlation IDs. Establish metrics/tracing seams without collecting prose.

#### Minimal product and shell

- Implement the 48px desktop command bar, 48px collapsed rail, calm manuscript-centered canvas, save indicator, status strip seam, theme menu, and empty shell. No dashboard widgets in the shell.
- Implement mandatory Light and Dark token sets exactly from the Bible; include Cream/Parchment tokens without requiring that optional theme to ship in this phase.
- Keep editor typography independent from application theme. Respect readable width, body size/line-height ranges, neutral borders, restrained accent use, reduced motion, visible focus, and non-color status labels.
- Establish responsive layouts: persistent context region only as a reserved desktop seam; overlay/drawer/sheet behavior for smaller screens is completed in Phase 5.
- Establish i18n resource boundaries on day one: no product strings in domain logic, Unicode data, locale-aware primitives, longer-label tolerance, and localized entity-template seam.

#### Minimal project, chapter, and editor core

- Implement `POST /api/v2/projects`, minimal project creation with only a title required, and a dominant **Write first chapter** action. Description, genre, premise, length, volumes, world schema, and outline remain optional.
- Implement chapter creation with optional placement, a chapter route/read model, and versioned `ChapterDocument` JSON with stable `blockId` values, derived plain text, word count, and document schema version.
- Put the ProseMirror-compatible engine behind a Mythra adapter. Domain services consume the versioned `ChapterDocument` contract, never editor-library types.
- Load one active chapter, never the whole manuscript DOM. Maintain a tiny prose toolbar and externalize writer-specific tools.
- Implement reference-mark schema support without forcing reference UI yet. Visible prose remains author-chosen text; renaming an entity will never rewrite prose.
- Implement core keyboard plumbing: command palette, Capture reservation, checkpoint save, outline/milestone/context toggles, Focus mode, and Escape focus restoration. Unavailable later-phase commands may be hidden, not dead controls.
- Implement Focus mode without disabling autosave, recovery, command palette, or the future Capture path.
- Implement advisory word targets and delta display. An author-configured hard character stop may exist only as an explicit chapter/project opt-in, never as the default.
- Implement compact Project / optional Volume / Chapter breadcrumbs without adding a second navigation row; preserve nearby-object switching and Return-to-Chapter history seams.

#### Durability, offline writing, conflicts, and continuation

- Implement editor memory state plus debounced IndexedDB draft journal. Local draft state is authoritative between a keystroke and acknowledged server save.
- Implement save states `CLEAN`, `DIRTY_LOCAL`, `SAVING`, `OFFLINE_DIRTY`, `CONFLICT`, and `RECOVERABLE_LOCAL` with non-alarmist status copy.
- Implement versioned autosave using `baseVersion` and `clientSaveId`; duplicate retries are idempotent. The server increments a monotonically increasing chapter version only on a valid base version.
- Preserve local content on conflict and offer Compare, Keep Local as New Version, Keep Server, and Duplicate as Recovery Copy. Never silently use last-write-wins.
- Implement explicit checkpoint save. Checkpoint current state on session boundaries, significant intervals, destructive seams, and author labels; do not create permanent revisions per keystroke.
- Restore active chapter, block/cursor anchor, scroll anchor, context-panel mode seam, pin IDs seam, and timestamp independently from product analytics.
- Implement `ProjectContinuationReadModel` and Project Home with dominant Continue Writing, recent chapter context, empty-project behavior, and one-click restoration.
- Follow the editor loading order: shell/local content, canonical read model/version comparison, stable hydration, independent context seed seam, journal/autosave start, session restoration; secondary analytics and projections load last.
- Offline active-chapter writing remains fully available. Basic Capture will be queued in Phase 3; unavailable server-only functions must be plainly labeled.

#### Safety, tests, and operational baseline

- Add TLS/secure cookie/CSRF configuration seams, secrets validation, rate-limit boundary, audit event model, archive-versus-delete patterns, grace-window fields, and content-safe logs.
- Add `Project`, `Chapter`, `ChapterRevision`, `DraftConflict`, `AuditEvent`, and reserved `OutboxEvent` persistence needed by the vertical slice; include indexes and optimistic constraints.
- Add migration and rich-document migration harnesses. Document additive/two-phase SQL migration policy and pure/testable document migrations.
- Add unit, service, repository, component, E2E, offline, conflict, accessibility, theme, IME, and visual-regression harnesses.

### 5.2 Files created or materially implemented

- Root/runtime: `README.md`, `package.json`, lockfile, TypeScript/framework/lint/test/Playwright configs, `.env.example`, `.gitignore`, CI workflows.
- Decisions/docs: `docs/adr/0001-stack.md`, `0002-auth.md`, `0003-editor-document.md`, `0004-persistence-and-jobs.md`, `docs/architecture/module-boundaries.md`, `docs/security/content-handling.md`, `docs/operations/migrations.md`.
- Persistence: `prisma/schema.prisma`, initial account/workspace/project/chapter/durability/audit/outbox migrations, `prisma/seed.ts`.
- Routes/screens: authentication callback/session surfaces, app shell, project creation, project home, chapter editor, preferences/theme endpoints.
- Components: shell components; `ChapterEditor`, `EditorCanvas`, minimal toolbar, `WordTarget`, `FocusMode`, `SaveIndicator`, `ConflictBanner`, `RecoveryDrawer`, `RevisionDiff`, restore actions.
- Libraries: auth/session/ownership, editor adapter/document schema/migrations, IndexedDB journal, autosave state machine, API envelope/errors, logger/metrics/tracing, theming/i18n.
- Domains: accounts, workspaces, projects, writing, revisions, audit, jobs contracts using the standard domain file pattern.
- Tests/fixtures: all Phase 1 test layers and large-document/Unicode/IME/offline/conflict fixtures.

### 5.3 How the code will be produced

1. Define transport schemas and domain types before route components.
2. Write schema migrations and repository constraints with real-PostgreSQL tests.
3. Implement services with actor/workspace/project context and stable error mapping.
4. Expose screen-oriented read models and thin routes.
5. Build the editor adapter and local journal as independently tested state machines.
6. Wire optimistic autosave and conflict recovery before visual polish.
7. Build shell/editor UI from tokens, then verify keyboard, themes, responsive baseline, IME, and no layout shift.
8. Implement telemetry last and assert content redaction.

### 5.4 Exit gate

- Authentication reaches a calm Mythra shell.
- Project title → new chapter → first keystroke requires no structural setup.
- Reload, browser close before server acknowledgement, offline continuation, and two-device conflict tests retain recoverable text and both conflict variants.
- Continue Writing restores exact active chapter and writing position.
- Context/search/billing/telemetry failures do not block the writable editor.
- Light and Dark, keyboard navigation, reduced motion, Unicode/IME, content-safe logging, ownership, and migration rollback tests pass.
- `Path.md` contains implementation evidence, audit results, commit, push, and remote verification.

## 6. Phase 2 — Progressive and Causal Story Core

**Bible roadmap coverage:** phases 4–6.
**Primary source coverage:** sections 3, 5, 7, 10, 12.1/12.5, 16–18, 20, 26, 35, 37; appendices B, C, and E.

### 6.1 Scope

#### Canonical hierarchy and progressive structure

- Implement `Plot`, `PlotOutline`, `Volume`, `VolumeOutline`, `ChapterOutline`, optional `Scene`, `Milestone`, `ChapterMilestoneLink`, `MilestoneDependency`, `NarrativeIntent`, and generalized non-causal `StoryReference`.
- Preserve ownership versus relevance: volumes contain ordered chapters; milestones relate many-to-many; scenes are optional lenses; entities and references are cross-cutting.
- Allow chapters with no volume or outline; create missing outline records only when actual outline content exists.
- Implement rich/freeform chapter outlines plus optional purpose, emotional movement, revealed information, entities, locations, milestone links, word targets, and scene stubs.
- Implement Discovery, Guided, and Architect as presentation modes over one schema, not restrictive project types.
- Implement deterministic scaffolding: N volumes, chapter ranges, milestone placeholders, cadence-derived soft dates, bulk chapter-outline placeholders, advisory allocation expectations, and preview-before-apply rebalance.
- Implement after-the-fact conversions/grouping while preserving provenance/backlinks: prose-first chapters into volumes, notes/captures into later objects, outline blocks into optional scenes.
- Keep creative constraints soft unless author-configured hard; warnings never become default gates.
- Allow Narrative Intent on plot, volume, milestone, chapter, optional scene, paragraph selection, and entity arc with plain text first and optional tension/revelation/emotion/pacing/ambiguity/atmosphere/custom categories.

#### Structure workspace, Narrative Semantic Zoom, and semantic coordinate

- Build one Structure workspace with Outline, Volumes, Milestones, Chapters, Relationships, Semantic Zoom, and Causal lenses.
- Add inline edit/create, transactional reordering, renumber/dependency preview, collapse/expansion persistence, promote/demote with reference preservation, and bulk scaffold.
- Implement milestone ordered/range view as default, optional dependency graph, chapter matrix, semantic roles (`introduce`, `develop`, `escalate`, `turn`, `resolve`, `custom`), weights, ranges, and derived progress.
- Implement `SemanticCoordinateProjection` shape and coordinate-preserving zoom from project/plot through volume, milestone/thread, chapter, outline, optional scene, and prose block. Skip absent levels.
- Preserve the active anchor, cursor, scroll, selection, and future pinned context across reversible zoom. Provide accessible controls; gestures are never required.
- Virtualize/cluster large structure neighborhoods and use edge filtering/budgets. Never render every graph edge by default.

#### Causal Story Fabric core

- Implement `StoryChange` for event, decision, revelation, state change, setup, payoff, condition, outcome, and custom causal identity when another canonical object is unsuitable.
- Support canonical causal endpoints for milestones, chapter outlines, scenes, timeline events, narrative-intent targets, entity-state snapshots, capture-derived objects, selected manuscript block anchors, and Story Changes. Heterogeneous endpoint types are valid inside one project.
- Implement dedicated `CausalRelation` storage with explicit supported endpoint enums, block anchors where allowed, relation type, condition, strength/importance metadata, status, note, provenance, version, and project ownership.
- Ship the canonical relation vocabulary: `causes`, `enables`, `requires`, `motivates`, `triggers`, `escalates`, `prevents/blocks`, `reveals`, `transforms`, and `resolves`.
- Reject self-edges and cross-project endpoints; make duplicate active edges idempotent; support active/tentative/retired states; preserve relations on endpoint archive through reattach/retire/archive choices.
- Reject or explicitly override hard `requires` cycles without temporal progression/mutual-state semantics. Permit temporally sequenced feedback loops.
- Implement chronology sanity only when story-time anchors exist. Warnings remain neutral; chapter/manuscript order never substitutes for story time; reveals use knowledge/discovery semantics.
- Implement application services `createRelation`, `getNeighborhood`, `traceImpact`, and `validateChronology` behind the causality domain boundary.
- Implement bounded, budgeted, indexed upstream/downstream/impact traversal with direct edges first, status/filter controls, complete path provenance, and “potentially affected” language. Tracing never mutates prose or downstream objects.
- Build inline cause/effect composer from writing and Structure context, one-line Story Change creation, causal trace/impact lists, accessible graph alternative, and optional local graph for Architect mode.
- A zero-causality project exposes no empty causal dashboard or warning.

#### API, events, and durability seams

- Implement explicit project/structure/milestone/story-change/causal application endpoints from the Bible, including causal CRUD/neighborhood/impact endpoints and the stable mutation envelope.
- Increment `projectStructuralVersion` on structure/causality writes. Emit transactional outbox records for downstream invalidation even though the full projection worker arrives in Phase 4.
- Apply indexes for order, milestone links, StoryReference source/target, StoryChange anchors/status, and CausalRelation directions/type/status/duplicate guards.
- Make all list and neighborhood endpoints paginated/range/budget bounded.
- Create revisions for causal objects through the generic object-revision seam.

### 6.2 Files created or materially implemented

- Migrations/schema for every Phase 2 canonical table, constraints, indexes, structural version, and endpoint enum.
- Domains: `structure`, `milestones`, `references`, and `causality` with types/schemas/services/repositories/mappers and focused invariant tests.
- Features/components: Structure lenses, outline tree, volume lane, milestone range/dependency views, chapter matrix/planning grid, bulk scaffold, semantic zoom viewport, causal composer/lens/trace/impact/accessible list.
- Read models/projections: structure overview, milestone progress, semantic coordinate, bounded causal neighborhood, causal impact.
- APIs: structure, outlines, volumes, chapters, milestones, Story Changes, causal relations, neighborhoods, and impact.
- Docs: schema semantics, causal vocabulary, hierarchy/chronology/causality boundary, migration strategy, API contracts, graph budgets.
- Tests: allocation/order property tests, milestone cycles, causal idempotency/cycles/chronology/path provenance/budgets, large-project viewport/load tests, and editor-focus restoration.

### 6.3 How the code will be produced

1. Encode ownership and semantic boundaries as database constraints plus domain types.
2. Implement canonical writes and revisions before projections or UI.
3. Write property tests for ordering/range normalization and graph invariants before building drag/drop or graph surfaces.
4. Build bounded traversal as a server-owned read model; never load the full graph into client state.
5. Build one Structure shell and add lenses over shared objects.
6. Add editor-context causal actions through the same focus-preserving overlay contract used by future Peek/Capture.
7. Validate that structure can be absent and causality can be absent in every service, route, empty state, and E2E path.

### 6.4 Exit gate

- A discovery writer can keep writing with zero plot, volume, outline, scene, milestone, timeline, or causal object.
- A planner can scaffold/reorder large chapter ranges with previews and preserved references.
- Milestones are many-to-many and role-based; hard dependency cycles are handled exactly by invariant.
- An author can create A because of B / A causes C from writing or Structure context, then trace bounded Why now?/What changes? paths with provenance.
- No causal action changes prose, infers meaning, or loses the writing position.
- Flashback/reveal chronology cases avoid false chapter-order errors.
- All Phase 2 tests, global acceptance checks, `Path.md` evidence, audit, commit, and push pass.

## 7. Phase 3 — In-Flow Author Environment

**Bible roadmap coverage:** phases 7–11.
**Primary source coverage:** sections 4, 6, 8.5–8.10, 9–12, 15, 18, 21, 27; appendix A and relevant appendix E interactions.

### 7.1 Scope

#### Contextual Writing Field and Peek/Open semantics

- Implement the attention-aware field as a desktop region and smaller-screen overlay seam without treating it as a generic sidebar.
- Implement deterministic precedence: pinned context, explicit selection, explicit Peek, idle-safe cursor-local context, chapter context, project fallback.
- Stabilize automatic changes: no per-keystroke refresh, cursor idle debounce, continuous-typing suspension, no manuscript scroll movement, cancellable requests, and stale response discard by `contextKey`.
- Implement `ContextFieldDescriptor` registry and typed cards for chapter outline, milestone, entity, timeline, capture, language, reference, and causal context.
- Implement Chapter, Selection, Entity Peek, Milestone Peek, Outline, Search, Capture, and Causal Peek states with exact exit/focus behavior.
- Peek never changes browser history or discards selection/cursor; Open is intentional deep navigation. Deep pages provide Return to Chapter.
- Add pin/unpin, session hide, project-level card mute, inline safe edits, freshness markers, and card caps/More links.
- Use appendix A resolver inputs, ordering, and stability key exactly. Direct causal context precedes general references; indirect paths stay behind explicit actions.

#### Compiled Narrative Directive v1

- Add the concise Relevant Now surface with Purpose, Advance, Preserve, Reader Outcome, Next, Relevant Context, optional Because, and optional Consequences.
- Compile only from author-owned data. Use source provenance on every line and provide Peek to source.
- Rank explicit chapter links/pins, direct causal links, milestone roles, outline references, temporal proximity, entity references, and author pins without flooding.
- Allow session dismissal, pinning, source edit, intentional deviation, and disabling. Never express creative drift as a red error.
- Until Phase 4 installs durable propagation workers, compile synchronously/read-through with explicit structural version and freshness; never display confidently stale directives.

#### Zero-friction Capture

- Implement global `Cmd/Ctrl+Shift+Space`, tiny overlay, raw-save-first behavior, exact focus/selection/scroll restoration, and perceptually instant return.
- Record route, chapter, outline, block, selection, entity context, timestamp, project, and user automatically. Plain text remains valid; quick targets are optional.
- Implement local/offline queue and idempotent server sync.
- Implement unprocessed, filed, converted, deferred, and dismissed lifecycles; keyboard/bulk inbox triage; attach/detach; convert while retaining source/provenance; defer/restore/retention behavior.
- Implement conversion to entity, milestone, chapter note, timeline event, and Story Change. Add optional Because of/This causes relation actions without parsing arbitrary prose into canonical causality.

#### Universe and references

- Implement `EntityType`, localized system templates, project custom types, `EntityFieldDefinition`, `StoryEntity`, field values, directional relation types, entity relations, and optional entity state snapshots.
- Ship Character, Location, Faction/Organization, Culture/Religion, Power/Magic System, Item/Artifact, Species, Technology, Event, Lore/Concept, Organization, and Custom templates as optional resources.
- Support stable common fields and text/rich text/number/boolean/date/select/multi-select/reference/reference-list/URL fields. Defer binary image/file field implementation only to the research/storage work in the same phase or record a Bible-sanctioned later-phase file boundary.
- Implement selection-to-entity quick create requiring only type and optional note. Keep visible prose unchanged and add an invisible reference/backlink.
- Implement full entity details, custom fields, relations/reverse labels, all required backlinks, and historical state snapshots. State transitions can serve as explicit causal endpoints.

#### Timeline, notes, research, search, and language

- Implement timeline exact/absolute, approximate, relative, ordinal, and range modes without Gregorian assumptions; store display labels beside sortable mode-specific values.
- Link timeline events to entities, milestones, chapters, other events, and causal sanity checks without implying causation.
- Implement durable tagged/backlinked Notes distinct from raw Captures; allow promotion into structural objects without inventing notebook hierarchy.
- Implement Research items for notes, URLs, user-authored excerpts, citations, and files behind storage/upload validation. Surface linked research in context.
- Implement `SearchDocument` projection and universal search over chapters, all outlines, milestones, entities/aliases, Story Changes/relation types, timeline events, notes, research text, and captures using PostgreSQL full-text plus normalized/fuzzy matching.
- Group and rank by current context, exactness, recency, and explicit references. Add Peek, Open, insert/attach reference, copy, block jump/return, and structured causal Why/Depends actions.
- Integrate commands and objects in `Cmd/Ctrl+K`, prioritized by recency/current context.
- Implement deterministic dictionary/synonym/antonym/saved-vocabulary selection card with single-click replacement preserving undo; never auto-correct style or encourage synonym spam.
- Complete degraded-network behavior: recently cached/local chapter search is limited and labeled; cached context cards show staleness; structure mutations are disabled unless safely idempotent/queueable; export, snapshot, and billing actions remain unavailable until the server returns.

### 7.2 Files created or materially implemented

- Context domain/resolver/read models, directive compiler v1, context descriptor types, resolver endpoints, card registry, cards, Peek overlay, pin bar, causal trace Peek, and tests.
- Capture schema/migrations/domain/API, IndexedDB queue, overlay, inbox, row, conversion/attachment actions, and sync tests.
- Entity/template/field/relation/state schema and domain, Universe routes, lists/filters/details/quick create/field renderer/relation editor/backlinks.
- Timeline, note, research, storage metadata, StoryReference, and SearchDocument migrations/domains/routes/components.
- Search service/API/palette/full page; dictionary provider adapter, language card, selection actions.
- Context cards for every required type and Return-to-Chapter/session restoration utilities.
- Upload validation/scanning boundary and signed private asset access adapter.
- E2E/visual/a11y/load tests for focus restoration, context stability, Capture offline sync/conversion, backlinks, timelines, search, language undo, and large collections.

### 7.3 How the code will be produced

1. Define screen-oriented descriptor/read-model contracts and provider adapters first.
2. Implement source domains and indexes before resolver composition.
3. Test resolver ordering/stability with deterministic fixtures and stale-response races.
4. Reuse one focus-preserving overlay controller for Peek, Capture, selection actions, and causal composers.
5. Implement raw Capture save before optional filing UI.
6. Build Universe/timeline/research/search as server-owned canonical data with context cards as projections.
7. Add upload and language providers behind replaceable adapters; failures degrade their card only.
8. Verify every common action from the editor requires zero full-route navigation.

### 7.4 Exit gate

- The Contextual Writing Field remains stable during continuous typing and obeys exact precedence/contextKey rules.
- Chapter outline, milestones, direct causal context, entities, timeline, captures, research, and language can be inspected or safely edited with Peek and exact focus restoration.
- Capture saves raw text first, works offline, and can remain unprocessed forever or convert idempotently with provenance.
- Universe schema is flexible/minimal, backlinks are complete, and historical state is not simulated by overwriting the current entity.
- Timeline and causality remain distinct; search covers every required object; language replacement preserves undo.
- Common planned-author writing uses no full-route navigation.
- All Phase 3 tests, global acceptance checks, `Path.md` evidence, audit, commit, and push pass.

## 8. Phase 4 — Live Model, Automation, History, and Portability

**Bible roadmap coverage:** phases 12–13.
**Primary source coverage:** sections 7, 16.4–16.6, 18–21, 26–28, 31–32, 34.1–36; appendices B–C and E.6.

### 8.1 Scope

#### Durable Live Story Model

- Complete the transactional outbox worker: claim safely, retry with backoff, run idempotent handlers, mark processed, expose lag/failure metrics, and remain rolling-deployment compatible.
- Implement rebuildable, versioned projections: continuation, chapter context, milestone progress, volume health, entity backlinks, timeline window, SearchDocument, quota seam, causal neighborhood/impact adjacency as measured, `NarrativeDirectiveProjection`, and `SemanticCoordinateProjection`.
- Preserve the Bible's complete directive projection contract: structural/source versions, chapter, Purpose, Advance, Preserve, Reader Outcome, Next, ranked context, per-item provenance, generation time, and freshness. Preserve the complete semantic coordinate contract: active anchor, project/plot/volume/milestone/chapter/outline/scene/Story Change/block coordinates, ancestor path, neighborhood summaries, and structural version.
- Implement project structural version and per-projection freshness markers/source object versions. Mutation responses carry canonical versions and invalidation keys.
- Implement synchronous updates where cheap and async jobs where safe. After a structural write the UI either has the new projection or an honest Updating/stale state; stale results can never replace current data.
- Implement one-project repair/rebuild commands from canonical tables. No projection-only canonical facts.
- Implement the complete domain event catalog and directive invalidation set from Bible sections 7.4 and 7.6, including create/update/delete causal events and all structural source changes.

#### Deterministic automation

- Implement chapter range scaffold, milestone allocation/progress/density, writing queue, context resolution, backlink maintenance, word/cadence summaries, previewed structure rebalance, Capture context, snapshot scheduling, directive compilation, causal neighborhood/impact, and causality/chronology sanity.
- Implement warning taxonomy exactly as neutral, suppressible facts: range drift, density, orphan structure, broken reference, timeline order conflict, quota approach, backup health, causal-temporal conflict, hard prerequisite loop, and orphan causal endpoint.
- Never implement literary scoring or automatic story meaning.

#### Revisions, snapshots, backup, restore, and destructive safety

- Complete `ObjectRevision`, `ChapterRevision`, `ProjectSnapshot`, backup manifests, integrity hashes, object-storage archives, retention controls, and storage accounting.
- Checkpoint before destructive/high-impact operations. Archive before delete; show backlinks and bounded causal impact with path provenance; offer move/reattach/retire options.
- Restore never destroys current state: checkpoint it first, then restore to current or safe copy as selected.
- Run scheduled/manual snapshots, verify integrity, expose backup health, and practice restore into a safe copy.
- Distinguish internal backup artifacts from user-owned export artifacts.

#### Import, export, and portability

- Implement chapter, volume, full manuscript, and versioned full project archive export.
- Export human-readable manuscript plus structured JSON/Markdown for all outlines, milestones, entities, entity states, entity relations, StoryReferences, Story Changes, CausalRelations, timelines, notes, research metadata, captures, narrative intents, and stable labels/IDs.
- Preserve causal endpoint identities, types, relation semantics, status, conditions, notes, and provenance.
- Make export jobs immutable, expiring, idempotent, retryable artifacts with signed short-lived downloads.
- Implement plain text, Markdown, and reliable modern word-processing import with chapter-split preview and original-file preservation.
- Version and document every stable object representation. Implement round-trip validation.
- Add V1 migration seam: chapter→milestone ownership becomes links; world nodes become StoryEntities; scenes remain optional references; no missing outlines or causal facts are invented.

### 8.2 Files created or materially implemented

- Jobs/outbox repository, worker, handlers, idempotency/retry/dead-letter/repair tooling, domain event catalog, and observability.
- Projection stores/builders for every listed read model plus rebuild CLI/admin-safe commands.
- Full directive compiler and semantic coordinate projection with deterministic ordering/golden tests.
- Revision/snapshot/backup/restore services, storage adapter, manifests/hash validation, recovery UI, and operational runbooks.
- Export/import domains, job routes/status/download UI, archive schemas/version docs, format adapters, and round-trip fixtures.
- Warning engine and suppress/override metadata.
- Integration/E2E/load tests for event propagation, duplicate delivery, staleness, repair, corruption/restore, destructive checkpointing, import/export completeness, and causal round trip.

### 8.3 How the code will be produced

1. Enumerate canonical source events and version rules; write idempotency and stale-projection tests first.
2. Build one projection at a time behind rebuildable interfaces and compare incremental output with full rebuild output.
3. Add freshness contracts to all affected UI before enabling asynchronous handlers.
4. Implement deterministic directive precedence as pure functions with golden fixtures.
5. Implement archive manifest/schema and completeness checker before format generators.
6. Build backup/restore with deliberate corruption tests and safe-copy restores.
7. Load-test large sparse/dense causal projects and thousand-chapter exports under strict budgets.

### 8.4 Exit gate

- Moving one structural or causal fact updates every affected projection exactly once or exposes truthful freshness until completion.
- Full projection rebuild matches incremental state and repairs a corrupted projection.
- No event loss occurs between canonical transaction and projection handling; duplicate delivery is harmless.
- Revisions/checkpoints/snapshots restore without destroying the previous current state.
- Export completeness checker proves every author-created object and relationship is represented; import/export causal round trip passes.
- Destructive previews show backlinks and bounded causal impact without auto-mutating prose.
- All Phase 4 tests, backup drill, global acceptance checks, `Path.md` evidence, audit, commit, and push pass.

## 9. Phase 5 — Commercial and Production Readiness

**Bible roadmap coverage:** phases 14–16.
**Primary source coverage:** sections 13–14, 15.7–15.8, 19.4–19.6, 22–26, 29, 31–32, 36, 38.3–39.3 as operational constraints.

### 9.1 Scope

#### Billing, entitlements, and quotas

- Implement provider-neutral customer/subscription adapter, verified idempotent webhook handling, configuration-driven Entry (~USD 10/month) and Pro (~USD 25/month) price references, invoices/provider portal link, and no AI usage charges.
- Centralize feature flags and numeric limits in `EntitlementSnapshot`; frontend uses the same keys while backend enforcement is authoritative.
- Implement actual cost-driver accounting: binary storage, snapshots, revisions, export generation, row growth, bandwidth seams, and future AI seam. Avoid arbitrary tiny prose limits.
- Gate creation/high-cost writes, never basic read or export of owned work. Downgrades preserve prose and metadata, allow grace, and do not immediately delete history or data.
- Implement transparent plan/usage UI and stable quota errors with actionable resource details.

#### Performance, scale, responsive, accessibility, and localization

- Profile and meet the Bible interaction budgets: network-independent keystrokes, Capture <100ms perceived, non-shifting Peek hydration, cancellable context, near-instant cached routes, virtualized large lists/structure/graphs.
- Enforce pagination/range bounds, active-chapter-only editor loads, N+1 prevention, background heavy work, object storage for binaries, and causal depth/node/edge budgets.
- Validate staged infrastructure posture from 0–500 through measured later scale stages; add Redis/search/read replicas/partitioning/service extraction only when profiling justifies them.
- Complete responsive behavior: wide desktop rail/editor/persistent field; compact desktop/tablet overlay field; mobile single-column editor, bottom action bar, navigation/context sheets, autosave, Capture, search, outline/entity Peek, and possible simplified deep structure edits.
- Complete WCAG-appropriate contrast, keyboard reachability, visible focus, semantic labels, no color-only meaning, reduced motion, controlled save announcements, resizable panels/text, graph list alternatives, IME/international input, RTL/long-label visual checks where supported.
- Complete Light/Dark and optional Cream visual regression, restrained UI geometry, mobile/compact/wide states, long titles, and international strings.
- Complete i18n resource extraction and region adapters for payments, messaging, storage, analytics, and future AI. Do not claim China legal/hosting/payment compliance without expansion-time verification.

#### Security, privacy, observability, deployment, and operations

- Harden TLS/session/CSRF, rate limits, authorization, upload type/size validation and malware-scan boundary, signed URLs, audit trails, secrets, dependency scanning, destructive controls, and cross-workspace isolation.
- Enforce the privacy doctrine: manuscript/world content is sensitive; analytics uses metadata; no content in logs, traces, alerts, or routine admin surfaces.
- Implement logs/metrics/traces/alerts for save/context/search latency, errors, conflicts, jobs/outbox lag, backups, DB saturation, auth/storage failures, and export pipelines.
- Implement friction analytics without prose: time to writable editor/first keystroke, Continue usage, route changes, Peek vs Open, Capture timing, search return time, recovery incidents, editor-only sessions, causal trace friction, and 30/90/180-day project retention.
- Implement product health metrics: activation as first meaningful writing session, author retention, project depth, Pro conversion, export patterns, recovery, and Uninterrupted Writing Time.
- Implement local/preview/staging/production environments, synthetic staging data, separate credentials, versioned migrations, two-phase destructive migrations, feature flags, canary editor-save rollout, rollback criteria, backup verification, migration dry runs, worker compatibility, and restricted admin access.
- Implement minimal content-safe admin surface: user/workspace, plan/status, quotas, export/snapshot jobs, non-content audit logs, and safe recovery actions.
- Run backup restore drills, security checks, dependency scans, load tests, cost-per-writer/snapshot measurements, and launch alert rehearsals.

### 9.2 Files created or materially implemented

- Billing/provider/entitlement/usage domains, webhook/API routes, config, pricing/usage/settings screens, and downgrade/quota tests.
- Responsive/mobile shell/editor/context/structure components and styles; complete theme/a11y/i18n resources.
- Security middleware, rate limiters, upload scanner adapter, signed asset/export access, audit coverage, dependency/security workflows, privacy tests.
- Telemetry schemas/instrumentation/dashboards-as-code or documented queries, content-redaction assertions, alert rules, and friction metric definitions.
- Deployment/preview/staging/production configs, feature flags, migration/rollback/recovery/admin runbooks, worker compatibility checks, and internal admin routes/components.
- Performance/load/accessibility/visual/IME/RTL/large-project fixtures and reports.

### 9.3 How the code will be produced

1. Define entitlement keys and downgrade invariants once; test backend gates before UI meters.
2. Integrate billing through an adapter and replay-safe webhook fixtures.
3. Profile real Phase 1–4 flows before adding cache/coordination infrastructure.
4. Fix semantic accessibility and keyboard paths at component primitives, then audit screens.
5. Add privacy-safe telemetry through typed event schemas that reject content fields.
6. Practice migrations, rollback, backup restore, and alert response in staging-like conditions.
7. Validate mobile writing on real viewport/input constraints, not screenshots alone.

### 9.4 Exit gate

- Entry/Pro billing and quotas operate without making existing prose unreadable or unexportable.
- Large projects, causal neighborhoods, search, context, autosave, and export meet measured budgets.
- Mobile authors can write, save, Capture, search, and Peek; deep structure remains possible.
- Accessibility, IME, theme, localization, ownership, security, privacy, and cross-workspace tests pass.
- Observability detects save/backup/outbox/auth/storage failures without logging content.
- Backup restore, migration dry run/rollback, canary criteria, admin recovery, and operational alerts are verified.
- All Phase 5 tests, global acceptance checks, `Path.md` evidence, audit, commit, and push pass.

## 10. Phase 6 — Agent Seam and Paid Launch Validation

**Bible roadmap coverage:** phase 17 and the V2 launch gate.
**Primary source coverage:** sections 30, 33.1, 38–39 and appendices D–E; all previous source sections are re-audited here.

### 10.1 Scope

#### MCP-compatible application tool seam — no AI dependency

- Expose stable, bounded application-tool contracts over services/read models, never direct database access.
- Implement read tools: project map, plot/volume outline, milestone, chapter outline, bounded chapter text/range, project search, entities/entity, timeline window, backlinks, causal neighborhood, causal impact, and Story Change.
- Implement proposal/write-metadata seams: suggestion creation, structure patch proposal, confirmed note/Capture creation, and causal relation proposal. Prose replacement remains disabled by default and requires explicit author action per change.
- Implement permission levels (`Read`, `Propose`, `Write-metadata`, restricted write), actor/workspace/project authorization, audit records, bounded readers, stable IDs, rate limits, and content/privacy policies.
- Implement `Suggestion` with evidence references, proposed actions, confidence only where appropriate, status (`open`, `accepted`, `modified`, `rejected`, `intentional`), author note, and resolution timestamps.
- Preserve diagnose → explain → suggest → author decides → reevaluate. Author-approved causal paths are privileged evidence; inferred missing links remain proposals and never silently become canonical.
- Add evaluation harness definitions for continuity, POV knowledge, chronology, intent alignment, character state, usefulness, false-positive cost, causal path/attribution correctness, and authorship preservation. No model integration is required to pass V2.

#### Final doctrine, launch, and paid-validation gate

- Run all fourteen critical E2E scenarios from Bible sections 31.2–31.3, all causal coherence tests in appendix E.6, and every question in appendix D.
- Verify all eleven launch conditions in section 38.1, including optional usable causality, billing, snapshots/restore, export, and friction instrumentation.
- Establish the first paid validation plan around ten unrelated paying writers who repeatedly return to real projects; do not substitute free signup volume for retention evidence.
- Instrument and review Week 1/month 1 paid retention, time to writing, voluntary structure adoption, context navigation reduction, Capture habit, causal friction/value, autosave trust, Entry-limit sentiment, and external-tool escape points.
- Keep future integrations, collaboration, publisher workspaces, regional/China-native operations, community, Story Intelligence, model fine-tuning, and specialized narrative models outside V2 until paid retention/economics and applicable regional verification justify them.
- Document founder-led operational posture and hire only against proven bottlenecks.

### 10.2 Files created or materially implemented

- `tools` and `suggestions` domains, permission policy, application tool registry, bounded readers, proposal handlers, audit hooks, and API/MCP-compatible schemas.
- Suggestion migration/repository/service/read model/UI approval surface.
- Tool contract docs, permissions/privacy docs, example requests/responses, conformance tests, and direct-DB-access prohibition checks.
- Evaluation fixtures/harness placeholders that run deterministically without a model.
- Final E2E/doctrine/launch audit reports, paid-validation measurement plan, operational owner/runbook, and updated `README.md`.
- Final complete `Path.md` phase entry with all cross-phase evidence and remote Git verification.

### 10.3 How the code will be produced

1. Reuse application services/read models; do not make an agent-only domain path into canonical tables.
2. Define JSON/tool contracts and permission tests before transport exposure.
3. Add bounded pagination/text windows, causal depth/edge budgets, audit logging, and approval objects.
4. Verify proposals cannot mutate canonical data until an explicit authorized accept action.
5. Run the complete doctrine/launch suite and trace every failure to the owning phase.
6. Fix gaps in their owning domain, update this plan if the plan was deficient, and re-run the full audit.

### 10.4 Exit gate

- A future agent can use hierarchy, chronology, author-approved causality, bounded prose, search, and backlinks without DB access.
- Suggestions and causal/structure proposals remain non-canonical until explicit approval; restricted prose writes require per-change action.
- A zero-AI deployment retains every V2 core capability.
- All critical E2E, doctrine, causal coherence, launch, security, privacy, accessibility, performance, recovery, backup, export, and migration checks pass.
- The final source coverage audit reports no omitted V2 requirement and no contradiction.
- `Path.md` holds the evidence, final audit, commit, push, and remote verification.

## 11. Global acceptance contract for every phase

Each phase must prove all applicable items below, not merely mention them:

- User-visible capability works in Light and Dark; Cream where implemented.
- No mandatory setup path precedes writing except unavoidable integrity/contract enforcement.
- Domain and service rules have focused tests; repositories are tested against real PostgreSQL constraints.
- Critical user paths have E2E coverage; visual geometry has regression evidence.
- Errors degrade supporting systems before writing and preserve manuscript/local recovery state.
- Logging, traces, analytics, admin, and errors contain no manuscript, Capture, note, selection, or rich-document payload.
- Ownership and cross-workspace isolation are enforced for every direct and child object ID.
- Performance measurements meet the active phase budget; lists/graphs are bounded or virtualized.
- Keyboard, focus restoration, screen reader semantics, reduced motion, contrast, resize, Unicode, and IME are checked.
- Migration rollback/repair and projection rebuild paths are documented and exercised where applicable.
- Archive/pre-checkpoint/impact behavior protects destructive operations.
- Creative warnings remain neutral/suppressible; data-integrity rules remain enforceable.
- `Path.md` records actual evidence and explicitly states conformance or deviation.
- The phase is committed, pushed, and verified on the GitHub remote before the next phase begins.

## 12. Side-by-side audit protocol

The audit is performed after every phase and once across the entire product in Phase 6.

### 12.1 Coverage audit

1. Take each Bible section/subsection listed in the matrix below.
2. Locate its implementation owner in this work plan.
3. Locate actual implementation evidence in `Path.md` and the repository.
4. Classify it as `Verified`, `Planned-later`, `Bible-optional`, `Bible-future`, or `Gap`.
5. `Gap` blocks phase completion. `Planned-later` is legal only before its owning phase.
6. For optional/future items, verify the required architectural seam exists when the Bible requires one.

### 12.2 Contradiction audit

Search this plan and implementation for conflicting rules around:

- mandatory versus optional structure/scenes/causality;
- milestone ownership versus many-to-many links;
- hierarchy/chronology/causality semantics;
- canonical state versus projections/client caches;
- synchronous truth versus eventual freshness;
- soft creative constraints versus integrity constraints;
- archive/recovery/export access versus quotas/downgrades;
- editor focus preservation versus Peek/Open/deep navigation;
- no-AI core versus future proposal tools;
- privacy/content handling versus logs/analytics/admin/evaluations;
- scalable bounded queries versus whole-project loading;
- V2 scope versus future/post-retention expansion.

Any contradiction is fixed in the earliest authoritative layer: domain invariant, this plan, code, tests, and finally `Path.md` evidence.

### 12.3 Source coverage matrix

| Bible source | Practical implication owner | Work-plan owner |
| --- | --- | --- |
| 0. Executive mandate and metrics | writing-first reconstruction, source inheritance, Uninterrupted Writing Time | Global constitution; Phases 1, 5, 6 |
| 1. Product constitution | eleven laws, friction test, boundaries/non-goals | Sections 2 and 11; all phases |
| 2. Eight compounding systems | continuation, field, structure, live model, causality, Capture, reliability, future intelligence | Phases 1–6 respectively |
| 3. Information architecture/story model | hierarchy, ownership/relevance, milestones, outlines, optional scenes, flexible entities, intents, truth dimensions | Phases 2–3 |
| 4. Contextual Writing Field | composition, precedence, states, Peek/Open, cards, selection, Focus, zoom, directive, causal context | Phases 1–3; propagation in 4 |
| 5. Progressive Structure | three modes/one model, zero setup, deterministic scaffold, after-the-fact structure, soft constraints, optional causality | Phases 1–2 |
| 6. Capture | shortcut, lifecycle/inbox, data contract, causal Capture | Phase 3 |
| 7. Live Story Model | projections, events, consistency, directives, coordinates, Causal Story Fabric invariants/traversal/impact | Phases 2 and 4 |
| 8. Manuscript editor | editor performance/schema/toolbar/references/targets/keyboard/session/directive/causal writing | Phases 1–3 |
| 9. Project home/navigation | continuation home, rail, command palette, compact breadcrumbs | Phases 1 and 3 |
| 10. Structure workspace | all lenses, inline/bulk work, semantic zoom, bounded causal trace/impact | Phase 2 |
| 11. Universe | templates, minimal create, backlinks, temporal state, causal evidence | Phase 3 |
| 12. Timeline/research/notes/language | flexible time, research/files, notes, language tools, chronology separation | Phase 3 |
| 13. Visual system | exact theme tokens, typography, geometry, color, empty states | Phase 1; hardened in 5 |
| 14. Responsive/accessibility | breakpoints, mobile writing, complete accessibility/IME | Phase 1 baseline; Phase 5 completion |
| 15. Frontend architecture | module map, state ownership, boundaries, descriptor registry, components, budgets, causal UI state | All implementation phases; primarily 1–3 and 5 |
| 16. Backend architecture | modular monolith, modules, service/read-model/outbox/cache/causality rules | Phases 1–4 |
| 17. Database schema | all account, structure, entity, reference, causal, timeline/note/research/Capture, durability/history tables and indexes | Phases 1–4; billing in 5 |
| 18. API contracts | intent endpoints, envelope, idempotency | Phases 1–4; tool seam in 6 |
| 19. Autosave/recovery/history/backups | local journal, state machine, conflicts, checkpoint policy, snapshots, backup/export distinction | Phases 1 and 4; quotas in 5 |
| 20. Automation | deterministic catalog, warning taxonomy, no literary scores | Phase 4 |
| 21. Search/retrieval | universal projection/search/actions/causal filters | Phase 3; propagation in 4 |
| 22. Billing/plans/quotas | configuration prices, entitlements, safe downgrade, cost accounting | Phase 5 |
| 23. Auth/account/ownership | provider adapter, lifecycle/grace, project-scoped guards | Phases 1 and 5 |
| 24. Security/privacy | prioritized threats, controls, content doctrine | Phase 1 baseline; Phase 5 hardening; Phase 6 tools |
| 25. Observability/analytics | technical signals, friction metrics, health metrics/UWT | Phase 1 baseline; Phase 5 completion; Phase 6 validation |
| 26. Performance/scaling | bounds, jobs/storage, scale stages, cost control | All phases; Phase 5 gate |
| 27. Offline/degraded behavior | write/Capture/cache/structure/server-only capability matrix | Phases 1 and 3 |
| 28. Import/export/portability | import preview, all export scopes, versioned representations/causality | Phase 4 |
| 29. Localization/China readiness | i18n now, region adapters, no premature claims, serialized scale | Phases 1 and 5; future boundary in 6 |
| 30. Future AI/MCP | stable tools/permissions/suggestions/approval/evaluation, no AI requirement | Phase 6 |
| 31. Testing | entire pyramid, 14 critical E2E cases, visual regression | Every phase; final Phase 6 suite |
| 32. DevOps/deployment | environments, safe migrations, rollouts, admin | Phase 1 baseline; Phase 5 completion |
| 33. Original roadmap | all phases 0–17 and acceptance template | Sections 4–11 |
| 34. Screen specification | every named screen, loading order, destructive pattern | Phases 1–5 |
| 35. Backend invariants | project, order, chapter, milestone, entity, reference, Capture, timeline, revision, delete, billing, causality | Phases 1–5; global tests |
| 36. Error/fallback UX | writing survives support failures, stable error copy | All phases |
| 37. V1 removals/retentions | kill rigidity; keep writing-first/recovery/guidance/boundaries/portability/optional causality | Sections 2–3; Phases 1–4 |
| 38. Launch/validation | eleven launch conditions, ten-paying-author target, watch metrics | Phase 6 |
| 39. Future expansion | post-retention sequencing and hiring discipline | Phase 6 explicit future boundary |
| Appendix A | exact context resolver inputs/order/stability | Phase 3 |
| Appendix B | versioned document and V1 structural migration rules | Phases 1, 2, 4 |
| Appendix C | naming/logging/error conventions | Global baseline; Phases 1–6 |
| Appendix D | final doctrine checklist | Every phase; final Phase 6 audit |
| Appendix E | causal doctrine/interactions/anti-goals/examples/acceptance | Phases 2–4; final Phase 6 audit |

## 13. Definition of complete

Mythra V2 is complete only when:

1. Every six-phase exit gate is `Verified` in `Path.md` with repository evidence.
2. The source coverage audit has no `Gap` and no illegal `Planned-later` status.
3. The contradiction audit has no unresolved conflict.
4. Every original Bible roadmap phase 0–17 has a verified owner in the consolidation.
5. All launch conditions, critical E2E cases, doctrine questions, and causal coherence tests pass.
6. The product remains excellent with zero AI/model calls.
7. The final `WorkPlan.md` and `Path.md` audit is committed and pushed to the GitHub repository, and the remote commit is verified.

The north star remains unchanged: Mythra should make the author forget they are managing writing software; story, structure, causality, chronology, world, memory, and tools remain present around writing only as much as the author chooses to expose.
