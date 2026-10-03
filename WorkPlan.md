# Mythra V2 Work Plan

## 1. Authority, purpose, and execution contract

This is the implementation plan for **Mythra V2 Product + Engineering Implementation Bible, version 2.2, dated 12 August 2026** (the **Bible**). The Bible is the product and engineering authority. This file sequences its practical implications; it does not replace, weaken, or reinterpret them, except for the narrowly scoped, user-authorized post-freeze implementation rulings in section 3.1.

The repository was empty when this plan was created. Consequently, every path below is an intended implementation path rather than a claim that code already exists. Actual paths, code, test results, deviations, and Git evidence must be recorded in `Path.md` as work occurs.

If this plan and the Bible ever disagree:

1. Stop implementation at the affected gate.
2. Treat the Bible as authoritative unless the discrepancy is exactly covered by a ruling in section 3.1; those rulings override only their named ambiguity or commercial decision.
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

The six delivery phases are project-management containers only. The Bible's original capability phases 0–17 remain eighteen mandatory, dependency-ordered execution sub-gates. Consolidation reduces management overhead but never merges, skips, weakens, or defers an original writing-flow gate.

The execution state machine is strict: **Sub-gate 0 → Sub-gate 1 → ... → Sub-gate 17**. Work on the next original capability may not start until the preceding sub-gate is verified, audited, committed, pushed, and remotely confirmed. Work may prepare a dormant interface for a later capability, but it may not activate, advertise, or claim support for that capability before its own sub-gate.

For every sub-gate:

1. Start from the immediately preceding verified and pushed Sub-gate (Sub-gate 0 starts from the verified planning baseline).
2. Create/update the Sub-gate entry in `Path.md` before coding with predecessor evidence, intended slice, and baseline commit.
3. Implement only the current original capability through thin routes, domain services, repositories, and screen-oriented read models; later-capability interfaces remain dormant.
4. Run focused, integration, E2E, accessibility, performance, security, migration, recovery, observability, and writing-flow checks required by that sub-gate.
5. Compare actual work against the sub-gate row in section 4.1, its containing delivery phase, and the Bible source sections listed for that phase.
6. Record all files, code behavior, commands, results, screenshots/artifacts where applicable, gaps, and deviations in `Path.md`.
7. Fix every in-scope audit gap before calling the Sub-gate complete.
8. Commit the sub-gate as its own auditable capability boundary (additional safety commits are allowed).
9. Push the completed sub-gate to `https://github.com/InfernusReal/Mythra-V2` and verify the remote commit. Record branch, commit, and remote verification in `Path.md`.
10. When the last sub-gate inside a delivery phase passes, run and record the macro-phase summary gate; this summary cannot substitute for any sub-gate evidence.

No sub-gate advances merely because code compiles. Its original writing-flow gate and the global acceptance contract must pass.

## 2. Product constitution that binds every sub-gate and phase

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

The six delivery phases preserve all eight compounding systems as named product capabilities: Zero-friction continuation, Contextual Writing Field, Progressive Structure, Live Story Model, Causal Story Fabric, Instant Capture, Invisible reliability, and Future Story Intelligence. Consolidation changes delivery boundaries only; it does not collapse or remove any system.

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
- the superseded Entry/Pro split for deterministic V2 features; USD 15 Mythra Core includes full deterministic V2 access, while USD 25 Mythra Intelligence remains unavailable until a real AI product exists.

## 3. Implementation baseline and repository shape

The implementation will be a TypeScript modular monolith using a server-capable React framework, PostgreSQL through Prisma, a ProseMirror-compatible editor behind a Mythra adapter, IndexedDB for the local draft journal, object storage behind an adapter, and a durable transactional outbox/worker. Exact supported versions are pinned at implementation time and recorded in an architecture decision; they are not guessed in this planning document.

### 3.1 Authorized implementation rulings and commercial errata

These decisions were authorized after V2.2 was frozen. They are deliberately isolated so the plan does not silently mutate the source specification.

1. **Semantic-coordinate ruling.** The implementation ladder is `Series/Project → Plot → Plot Outline → Volume → Volume Outline → Milestone/Thread → Chapter Outline → Chapter → Scene → Prose`. `PlotOutline` and `VolumeOutline` are first-class semantic coordinates. `Milestone/Thread` is a cross-cutting relevance/dependency coordinate, never an ownership parent. `ChapterOutline → Chapter` is abstraction order for zoom, not a requirement that an outline exist before a writable chapter. Projects skip absent optional coordinates without placeholders. This ruling resolves the ambiguity between Bible sections 3.1/3.4 and the shorter ladder in 4.8.
2. **Narrative Directive contract clarification.** Because and Consequences are first-class Relevant Now outputs in Bible section 4.9. `NarrativeDirectiveProjection` therefore includes explicit `becauseItems[]` and `consequenceItems[]` collections in addition to the fields listed in Bible section 7.6. They are provenance-aware, deterministic, optional when no direct causal data exists, and never hidden inside `rankedContextItems[]`.
3. **Pricing Decision ADR.** Phase 5 must create `docs/adr/0005-pricing-and-entitlements.md` and implement **Mythra Core at USD 15/month with full deterministic V2 access**. **Mythra Intelligence at USD 25/month is future-only and may become sellable only when the AI product exists**; V2 may reserve its plan/entitlement keys but must not charge for or enable nonexistent AI. This commercial erratum replaces the frozen `$10 Entry / $25 Pro` non-AI tier split only. Data safety, configurable pricing, entitlement centralization, usage accounting, quota transparency, and downgrade protections from Bible section 22 remain binding.

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

### 4.1 Mandatory original-capability sub-gates

The following gates are the controlling implementation sequence. “Pass” means the capability satisfies its stated writing-flow exit, the global acceptance contract, its focused tests/observability/migration safety, a complete `Path.md` entry, and remote Git verification. A macro phase is incomplete until every sub-gate assigned to it has passed in order.

| Sub-gate | Original capability | Delivery phase | Mandatory capability scope | Writing-flow exit gate |
| --- | --- | --- | --- | --- |
| **Sub-gate 0** | Foundation | 1 | Repository baseline, auth adapter, User/Workspace, PostgreSQL/Prisma, structured logger, stable errors, test harness, theme tokens, shell skeleton | User authenticates and reaches an empty Mythra shell; no story workflow is claimed. |
| **Sub-gate 1** | Project + Chapter + Editor Core | 1 | Minimal project/chapter creation, versioned structured editor document, chapter route, local editor state | Project title → New Chapter → typing in a minimal UI. Sub-gate 0 evidence is verified first. |
| **Sub-gate 2** | Durability | 1 | IndexedDB journal, autosave, optimistic version protocol, conflict safety, manual checkpoint, recovery | Never-lose-text tests pass under reload, browser close, offline/network failure, retry, and conflict. Sub-gate 1 is verified first. |
| **Sub-gate 3** | Continuation | 1 | Continuation read model, session restoration, active chapter, one-click resume | A returning author reaches the exact active chapter, cursor/scroll anchor, and working state immediately. Sub-gate 2 is verified first. |
| **Sub-gate 4** | Structure Core | 2 | Volumes, Plot Outline, Volume Outline, Chapter Outline, ordering, bulk chapter scaffold, ruled Semantic Zoom coordinates | A planner structures the story without making any structural layer mandatory. Sub-gate 3 is verified first. |
| **Sub-gate 5** | Milestones | 2 | Many-to-many chapter links, roles, target ranges, dependencies, progress projections | Serialized planning works without milestone ownership constraints. Sub-gate 4 is verified first. |
| **Sub-gate 6** | Causal Story Fabric Core | 2 | StoryChange, active endpoint adapters, CausalRelation semantics, cause/effect composer, bounded neighborhood/impact, chronology sanity | The author records A because of B / A causes C and traces Why now?/What changes? without AI, mandatory plotting, or unavailable-domain endpoints. Sub-gate 5 is verified first. |
| **Sub-gate 7** | Contextual Writing Field v1 | 3 | Context shell, chapter outline/milestone/causal cards, pin/Peek, resolver API | Planning and direct causal context are inspected/edited without leaving the chapter. Sub-gate 6 is verified first. |
| **Sub-gate 8** | Capture | 3 | Global overlay, local/offline queue, inbox, attachments, conversions, causal Capture actions and adapter activation | Idea capture completes without route change and can later become structured/causal state. Sub-gate 7 is verified first. |
| **Sub-gate 9** | Universe | 3 | Entity templates/types, quick create, custom fields, relations, backlinks, entity-state snapshots/Peek and adapter activation | Characters, world facts, and state transitions live in the contextual environment. Sub-gate 8 is verified first. |
| **Sub-gate 10** | Search + Language | 3 | Universal SearchDocument, command palette, deterministic dictionary/synonyms, causal Why/Depends actions | Project, word, and explicit causal context are retrieved without external tools. Sub-gate 9 is verified first. |
| **Sub-gate 11** | Timeline + Research | 3 | Timeline modes, event links, research/notes/files, context cards, chronology-causality integration and timeline adapter activation | Chronology/reference workflows join the environment without conflating before/after with because/therefore. Sub-gate 10 is verified first. |
| **Sub-gate 12** | Live Story Model | 4 | Transactional outbox, rebuilds, structural versions, causal/directive/semantic-coordinate propagation jobs | One canonical decision reliably updates dependent structural, contextual, directive, and causal views with truthful freshness. Sub-gate 11 is verified first. |
| **Sub-gate 13** | Revisions + Snapshots + Export | 4 | History/restore, project snapshots, full archive including causal data, import basics | Long-term trust, reversibility, restore safety, and portability gates pass. Sub-gate 12 is verified first. |
| **Sub-gate 14** | Billing + Quotas | 5 | Provider adapter, centralized entitlements, usage accounting, USD 15 Mythra Core pricing ADR, dormant future Intelligence keys, downgrade/data safety | Mythra Core can charge without risking author data or withholding deterministic V2 features. Sub-gate 13 is verified first. |
| **Sub-gate 15** | Performance + Accessibility + Mobile | 5 | Virtualization/profiling, bounded causal performance, mobile editor/context, accessibility audit, IME hardening | Large projects and global input paths are production-ready. Sub-gate 14 is verified first. |
| **Sub-gate 16** | Launch Analytics + Operations | 5 | Friction/causal-tool metrics, alerts, content-safe admin, backup drills, launch funnel | Mythra learns safely from real paying users and can be operated/recovered without content exposure. Sub-gate 15 is verified first. |
| **Sub-gate 17** | AI Seam — no AI required | 6 | MCP-compatible tool layer, causal read/propose tools, Suggestion model, permissions, bounded readers | A future agent uses hierarchy, chronology, and author-approved causality without DB access, silent mutation, or architecture rewrite. Sub-gate 16 is verified first. |

An implementation run may touch only the current sub-gate plus non-active scaffolding required by it. Scaffolding for a later endpoint/provider must be inert, reject unsupported activation, and receive no “implemented” or “verified” status until its own row passes.

## 5. Phase 1 — Trusted Writing Foundation

**Bible roadmap coverage:** phases 0–3.
**Primary source coverage:** sections 0–2, 8, 9, 13–19, 23–27, 29, 31–32, 34–36; appendices B–D where foundational.
**Mandatory capability sequence:** Sub-gate 0 → Sub-gate 1 → Sub-gate 2 → Sub-gate 3. Each receives a separate gate result, `Path.md` entry, commit, push, and remote verification.

### 5.1 Scope

#### Repository, architecture, and identity — Sub-gate 0

- Initialize the TypeScript/server-capable React repository, supported runtime pins, lint/type/test/build commands, CI, environment validation, and local disposable PostgreSQL development path.
- Record ADRs for framework/runtime, auth adapter, editor adapter, persistence, object storage boundary, jobs/outbox boundary, testing, and deployment assumptions.
- Implement external-auth adapter seams while keeping internal `User`, `Workspace`, `WorkspaceMember`, `UserPreference`, session actor, workspace role, and ownership models independent from provider IDs.
- Create a workspace on first authenticated use. Resolve user, workspace, and role before domain services execute.
- Enforce workspace/project ownership in repository queries or immediately preceding guards, including child identifiers. Never fetch an object by ID and assume ownership.
- Establish stable mutation envelopes and error codes: `VALIDATION`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `QUOTA_EXCEEDED`, `RATE_LIMITED`, `DEPENDENCY_UNAVAILABLE`, `RETRYABLE`, `INTEGRITY_ERROR`, `INTERNAL`.
- Implement structured, content-safe logging with request/correlation IDs. Establish metrics/tracing seams without collecting prose.

#### Minimal product and shell — Sub-gate 0

- Implement the 48px desktop command bar, 48px collapsed rail, calm manuscript-centered canvas, save indicator, status strip seam, theme menu, and empty shell. No dashboard widgets in the shell.
- Implement mandatory Light and Dark token sets exactly from the Bible; include Cream/Parchment tokens without requiring that optional theme to ship in this phase.
- Keep editor typography independent from application theme. Respect readable width, body size/line-height ranges, neutral borders, restrained accent use, reduced motion, visible focus, and non-color status labels.
- Establish responsive layouts: persistent context region only as a reserved desktop seam; overlay/drawer/sheet behavior for smaller screens is completed in Phase 5.
- Establish i18n resource boundaries on day one: no product strings in domain logic, Unicode data, locale-aware primitives, longer-label tolerance, and localized entity-template seam.

#### Minimal project, chapter, and editor core — Sub-gate 1

- Implement `POST /api/v2/projects`, minimal project creation with only a title required, and a dominant **Write first chapter** action. Description, genre, premise, length, volumes, world schema, and outline remain optional.
- Implement chapter creation with optional placement, a chapter route/read model, and versioned `ChapterDocument` JSON with stable `blockId` values, derived plain text, word count, and document schema version.
- Put the ProseMirror-compatible engine behind a Mythra adapter. Domain services consume the versioned `ChapterDocument` contract, never editor-library types.
- Load one active chapter, never the whole manuscript DOM. Maintain a tiny prose toolbar and externalize writer-specific tools.
- Implement reference-mark schema support without forcing reference UI yet. Visible prose remains author-chosen text; renaming an entity will never rewrite prose.
- Implement core keyboard plumbing: command palette, Capture reservation, checkpoint save, outline/milestone/context toggles, Focus mode, and Escape focus restoration. Unavailable later-phase commands may be hidden, not dead controls.
- Implement Focus mode without disabling autosave, recovery, command palette, or the future Capture path.
- Implement advisory word targets and delta display. An author-configured hard character stop may exist only as an explicit chapter/project opt-in, never as the default.
- Implement compact Project / optional Volume / Chapter breadcrumbs without adding a second navigation row; preserve nearby-object switching and Return-to-Chapter history seams.

#### Durability, offline writing, and conflicts — Sub-gate 2

- Implement editor memory state plus debounced IndexedDB draft journal. Local draft state is authoritative between a keystroke and acknowledged server save.
- Implement save states `CLEAN`, `DIRTY_LOCAL`, `SAVING`, `OFFLINE_DIRTY`, `CONFLICT`, and `RECOVERABLE_LOCAL` with non-alarmist status copy.
- Implement versioned autosave using `baseVersion` and `clientSaveId`; duplicate retries are idempotent. The server increments a monotonically increasing chapter version only on a valid base version.
- Preserve local content on conflict and offer Compare, Keep Local as New Version, Keep Server, and Duplicate as Recovery Copy. Never silently use last-write-wins.
- Implement explicit checkpoint save. Checkpoint current state on session boundaries, significant intervals, destructive seams, and author labels; do not create permanent revisions per keystroke.

#### Continuation — Sub-gate 3

- Restore active chapter, block/cursor anchor, scroll anchor, context-panel mode seam, pin IDs seam, and timestamp independently from product analytics.
- Implement `ProjectContinuationReadModel` and Project Home with dominant Continue Writing, recent chapter context, empty-project behavior, and one-click restoration.
- Follow the editor loading order: shell/local content, canonical read model/version comparison, stable hydration, independent context seed seam, journal/autosave start, session restoration; secondary analytics and projections load last.
- Offline active-chapter writing remains fully available. Basic Capture will be queued in Phase 3; unavailable server-only functions must be plainly labeled.

#### Safety, tests, and operational baseline — staged by sub-gate

- Add TLS/secure cookie/CSRF configuration seams, secrets validation, rate-limit boundary, audit event model, archive-versus-delete patterns, grace-window fields, and content-safe logs.
- Stage persistence by capability: identity/`AuditEvent`/reserved `OutboxEvent` foundations in Sub-gate 0; `Project` and `Chapter` in Sub-gate 1; `ChapterRevision` and `DraftConflict` in Sub-gate 2; continuation/session state in Sub-gate 3. Each migration is independently reversible and cannot claim a later gate.
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

1. Complete Sub-gate 0 transport/domain foundations, identity, shell, migrations, safety harnesses, and content-safe telemetry; verify and push it.
2. Complete Sub-gate 1 Project/Chapter/editor schemas, repositories, services, read model, thin routes, adapter, and minimal UI; verify and push it.
3. Complete Sub-gate 2 local journal, optimistic autosave, conflict/recovery state machines, checkpoints, repository constraints, and failure tests; verify and push it.
4. Complete Sub-gate 3 continuation/session read models and exact restoration; verify and push it.
5. Within each sub-gate, define transport schemas/domain types before routes, exercise real PostgreSQL constraints, and build UI only over verified services/read models.

### 5.4 Exit gate

- Authentication reaches a calm Mythra shell.
- Project title → new chapter → first keystroke requires no structural setup.
- Reload, browser close before server acknowledgement, offline continuation, and two-device conflict tests retain recoverable text and both conflict variants.
- Continue Writing restores exact active chapter and writing position.
- Context/search/billing/telemetry failures do not block the writable editor.
- Light and Dark, keyboard navigation, reduced motion, Unicode/IME, content-safe logging, ownership, and migration rollback tests pass.
- Sub-gates 0, 1, 2, and 3 each have distinct passing evidence, audit, commit, push, and remote verification in `Path.md`; only then may the Phase 1 macro gate pass.

## 6. Phase 2 — Progressive and Causal Story Core

**Bible roadmap coverage:** phases 4–6.
**Primary source coverage:** sections 3, 5, 7, 10, 12.1/12.5, 16–18, 20, 26, 35, 37; appendices B, C, and E; Semantic Zoom order follows the authorized section 3.1 ruling.
**Mandatory capability sequence:** Sub-gate 4 → Sub-gate 5 → Sub-gate 6. Sub-gate 4 cannot start until Sub-gate 3 is verified; each receives separate evidence and remote Git proof.

### 6.1 Scope

#### Canonical hierarchy and progressive structure — Sub-gate 4

- Implement `Plot`, `PlotOutline`, `Volume`, `VolumeOutline`, `ChapterOutline`, optional `Scene`, `NarrativeIntent`, and generalized non-causal `StoryReference`. Milestone persistence belongs to Sub-gate 5.
- Preserve ownership versus relevance: volumes contain ordered chapters; scenes are optional lenses; references are cross-cutting. Define the milestone relationship seam without creating milestone-owned chapters.
- Allow chapters with no volume or outline; create missing outline records only when actual outline content exists.
- Implement rich/freeform chapter outlines plus optional purpose, emotional movement, revealed information, entities, locations, milestone links, word targets, and scene stubs.
- Implement Discovery, Guided, and Architect as presentation modes over one schema, not restrictive project types.
- Implement deterministic Structure Core scaffolding: N volumes, chapter ranges, bulk chapter-outline placeholders, advisory allocation expectations, and preview-before-apply rebalance. Milestone placeholders, milestone cadence dates, and milestone allocation begin only in Sub-gate 5.
- Implement the after-the-fact operations whose source domains already exist: prose-first chapters into volumes and outline blocks into optional scenes, preserving provenance/backlinks. Define dormant conversion interfaces for future Notes and Capture sources, but do not activate or claim those conversions before Sub-gates 8 and 11 create the canonical source domains.
- Keep creative constraints soft unless author-configured hard; warnings never become default gates.
- Allow Narrative Intent on currently existing plot, volume, chapter, optional scene, and paragraph-selection targets with plain text first and optional tension/revelation/emotion/pacing/ambiguity/atmosphere/custom categories. Register milestone and entity-arc target adapters only in Sub-gates 5 and 9.

#### Structure workspace, Narrative Semantic Zoom, and semantic coordinate — Sub-gate 4

- Build one Structure workspace shell in Sub-gate 4 with active Outline, Volumes, Chapters, Relationships, and Semantic Zoom lenses. Register the Milestones lens in Sub-gate 5 and Causal lens in Sub-gate 6; dormant lens slots render no fake empty product.
- Add inline edit/create, transactional reordering, renumber/dependency preview, collapse/expansion persistence, promote/demote with reference preservation, and bulk scaffold.
- Lock `SemanticCoordinateProjection` and the frontend ladder to `Series/Project → Plot → Plot Outline → Volume → Volume Outline → Milestone/Thread → Chapter Outline → Chapter → Scene → Prose`. Add `plotOutlineId?` and `volumeOutlineId?` to the coordinate contract and retain the ordered ancestor/semantic path. `Milestone/Thread` remains cross-cutting rather than an ownership parent; `ChapterOutline → Chapter` is abstraction order, not a writing prerequisite. Skip absent optional levels.
- Preserve the active anchor, cursor, scroll, selection, and future pinned context across reversible zoom. Provide accessible controls; gestures are never required.
- Virtualize/cluster large structure neighborhoods and use edge filtering/budgets. Never render every graph edge by default.

#### Milestones — Sub-gate 5

- Implement `Milestone`, `ChapterMilestoneLink`, and `MilestoneDependency` only after Sub-gate 4 has passed.
- Implement milestone ordered/range view as default, optional dependency graph, chapter matrix, semantic roles (`introduce`, `develop`, `escalate`, `turn`, `resolve`, `custom`), weights, ranges, and derived progress.
- Add milestone placeholders, target ranges, cadence-derived soft dates, advisory allocation, and previewed rebalance to the established structure scaffold.
- Register milestone Narrative Intent targets and the Milestone/Thread semantic coordinate as cross-cutting relevance/dependency projections, never ownership containment.

#### Causal Story Fabric core — Sub-gate 6

- Implement `StoryChange` for event, decision, revelation, state change, setup, payoff, condition, outcome, and custom causal identity when another canonical object is unsuitable.
- Define the complete causal endpoint enum and resolver/adapter registry for milestones, chapter outlines, scenes, timeline events, narrative-intent targets, entity-state snapshots, capture-derived objects, selected manuscript block anchors, and Story Changes. In Sub-gate 6, activate only the domains that exist: milestones, chapter outlines, scenes, Narrative Intent targets, manuscript block anchors, and Story Changes. Heterogeneous active endpoint types are valid inside one project.
- Reserve `timeline_event`, `entity_state`, and `capture_derived` endpoint discriminants and typed adapter interfaces in Sub-gate 6, but reject relation creation for them with a stable unsupported/dependency-unavailable result until Phase 3 registers their canonical resolvers. A reserved enum value is not implemented capability.
- Implement dedicated `CausalRelation` storage with explicit supported endpoint enums, active-adapter validation, block anchors where allowed, relation type, condition, strength/importance metadata, status, note, provenance, version, and project ownership.
- Ship the canonical relation vocabulary: `causes`, `enables`, `requires`, `motivates`, `triggers`, `escalates`, `prevents/blocks`, `reveals`, `transforms`, and `resolves`.
- Reject self-edges and cross-project endpoints; make duplicate active edges idempotent; support active/tentative/retired states; preserve relations on endpoint archive through reattach/retire/archive choices.
- Reject or explicitly override hard `requires` cycles without temporal progression/mutual-state semantics. Permit temporally sequenced feedback loops.
- Implement chronology sanity against currently resolvable story-time anchors only. Timeline-backed checks remain dormant until Sub-gate 11 registers the timeline endpoint adapter. Warnings remain neutral; chapter/manuscript order never substitutes for story time; reveals use knowledge/discovery semantics.
- Implement application services `createRelation`, `getNeighborhood`, `traceImpact`, and `validateChronology` behind the causality domain boundary.
- Implement bounded, budgeted, indexed upstream/downstream/impact traversal with direct edges first, status/filter controls, complete path provenance, and “potentially affected” language. Tracing never mutates prose or downstream objects.
- Build inline cause/effect composer from writing and Structure context, one-line Story Change creation, causal trace/impact lists, accessible graph alternative, and optional local graph for Architect mode.
- A zero-causality project exposes no empty causal dashboard or warning.

#### API, events, and durability seams

- Add endpoints in sub-gate order: Structure Core in Sub-gate 4, milestones in Sub-gate 5, then Story Change/causal CRUD/neighborhood/impact over active endpoint adapters in Sub-gate 6. Every endpoint uses the stable mutation envelope.
- Increment `projectStructuralVersion` on structure/causality writes. Emit transactional outbox records for downstream invalidation even though the full projection worker arrives in Phase 4.
- Apply indexes for order, milestone links, StoryReference source/target, StoryChange anchors/status, and CausalRelation directions/type/status/duplicate guards.
- Make all list and neighborhood endpoints paginated/range/budget bounded.
- Create revisions for causal objects through the generic object-revision seam.

### 6.2 Files created or materially implemented

- Migrations/schema for every Phase 2 canonical table, constraints, indexes, structural version, and endpoint enum.
- Domains: `structure`, `milestones`, `references`, and `causality` with types/schemas/services/repositories/mappers and focused invariant tests.
- Features/components: Structure lenses, outline tree, volume lane, milestone range/dependency views, chapter matrix/planning grid, bulk scaffold, semantic zoom viewport, causal composer/lens/trace/impact/accessible list.
- Read models/projections: structure overview, milestone progress, semantic coordinate, bounded causal neighborhood, causal impact.
- APIs: structure, outlines, volumes, chapters, milestones, Story Changes, causal relations, neighborhoods, and impact over active endpoints only.
- Docs: schema semantics, ruled Semantic Zoom ladder, causal vocabulary, endpoint adapter lifecycle, hierarchy/chronology/causality boundary, migration strategy, API contracts, graph budgets.
- Tests: allocation/order property tests, milestone cycles, causal idempotency/cycles/path provenance/budgets, rejection of inactive future endpoints, ruled semantic-coordinate paths, large-project viewport/load tests, and editor-focus restoration. Timeline chronology integration tests belong to Sub-gate 11.

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
- Sub-gates 4, 5, and 6 each pass separately with `Path.md` and remote Git evidence; only then do the Phase 2 summary tests/audit pass and Sub-gate 7 become eligible.

## 7. Phase 3 — In-Flow Author Environment

**Bible roadmap coverage:** phases 7–11.
**Primary source coverage:** sections 4, 6, 8.5–8.10, 9–12, 15, 18, 21, 27; appendix A and relevant appendix E interactions.
**Mandatory capability sequence:** Sub-gate 7 → Sub-gate 8 → Sub-gate 9 → Sub-gate 10 → Sub-gate 11. Sub-gate 7 cannot start until Sub-gate 6 is verified; each receives separate evidence and remote Git proof.

### 7.1 Scope

#### Contextual Writing Field and Peek/Open semantics

- Implement the attention-aware field as a desktop region and smaller-screen overlay seam without treating it as a generic sidebar.
- Implement deterministic precedence: pinned context, explicit selection, explicit Peek, idle-safe cursor-local context, chapter context, project fallback.
- Stabilize automatic changes: no per-keystroke refresh, cursor idle debounce, continuous-typing suspension, no manuscript scroll movement, cancellable requests, and stale response discard by `contextKey`.
- Implement the extensible `ContextFieldDescriptor` registry in Sub-gate 7 and activate typed cards only for domains then present: chapter outline, milestone, causal context, and existing references. Capture, entity, search/language, timeline, and research providers register in Sub-gates 8, 9, 10, and 11 respectively.
- Implement Chapter, Selection, Milestone Peek, Outline, existing-reference Search, and Causal Peek states in Sub-gate 7 with exact exit/focus behavior. Entity Peek, full Search, Capture, Language, Timeline, and Research states become active only with their owning sub-gates.
- Peek never changes browser history or discards selection/cursor; Open is intentional deep navigation. Deep pages provide Return to Chapter.
- Add pin/unpin, session hide, project-level card mute, inline safe edits, freshness markers, and card caps/More links.
- Use appendix A resolver inputs, ordering, and stability key exactly. Direct causal context precedes general references; indirect paths stay behind explicit actions.

#### Compiled Narrative Directive v1

- Add the concise Relevant Now surface with Purpose, Advance, Preserve, Reader Outcome, Next, Relevant Context, optional Because, and optional Consequences.
- Represent causal directive outputs explicitly as `becauseItems[]` and `consequenceItems[]` from the first compiler contract. Do not encode them indirectly inside generic ranked context.
- Compile only from author-owned data. Use source provenance on every line and provide Peek to source.
- Rank explicit chapter links/pins, direct causal links, milestone roles, outline references, temporal proximity, entity references, and author pins without flooding.
- Allow session dismissal, pinning, source edit, intentional deviation, and disabling. Never express creative drift as a red error.
- Until Phase 4 installs durable propagation workers, compile synchronously/read-through with explicit structural version and freshness; never display confidently stale directives.

#### Zero-friction Capture

- Implement global `Cmd/Ctrl+Shift+Space`, tiny overlay, raw-save-first behavior, exact focus/selection/scroll restoration, and perceptually instant return.
- Record route, chapter, outline, block, selection, entity context, timestamp, project, and user automatically. Plain text remains valid; quick targets are optional.
- Implement local/offline queue and idempotent server sync.
- Implement unprocessed, filed, converted, deferred, and dismissed lifecycles; keyboard/bulk inbox triage; attach/detach; convert while retaining source/provenance; defer/restore/retention behavior.
- Implement a typed, idempotent Capture conversion registry. In Sub-gate 8 activate targets already present (milestone, Story Change, existing chapter/outline attachment, and capture-derived causal identity); keep entity, durable Note, and timeline-event targets dormant until their owning domains register adapters.
- Register the `capture_derived` causal endpoint resolver in Sub-gate 8 only after the canonical Capture/conversion record exists. Add optional Because of/This causes actions without parsing arbitrary prose into canonical causality.

#### Universe and references

- Implement `EntityType`, localized system templates, project custom types, `EntityFieldDefinition`, `StoryEntity`, field values, directional relation types, entity relations, and optional entity state snapshots.
- Ship Character, Location, Faction/Organization, Culture/Religion, Power/Magic System, Item/Artifact, Species, Technology, Event, Lore/Concept, Organization, and Custom templates as optional resources.
- Support stable common fields and text/rich text/number/boolean/date/select/multi-select/reference/reference-list/URL fields. Defer binary image/file field implementation only to the research/storage work in the same phase or record a Bible-sanctioned later-phase file boundary.
- Implement selection-to-entity quick create requiring only type and optional note. Keep visible prose unchanged and add an invisible reference/backlink.
- Implement full entity details, custom fields, relations/reverse labels, all required backlinks, and historical state snapshots. State transitions can serve as explicit causal endpoints.
- In Sub-gate 9 register entity Capture conversion and the `entity_state` causal endpoint resolver only after `StoryEntity` and `EntityStateSnapshot` persistence, ownership, revisions, and export seams exist.

#### Search and language — Sub-gate 10

- Implement `SearchDocument` and universal search over all domains verified through Sub-gate 9: chapters, outlines, milestones, entities/aliases, Story Changes/relation types, references, and captures. Define search-provider interfaces for timeline events, notes, and research, but activate them only in Sub-gate 11.
- Group and rank by current context, exactness, recency, and explicit references. Add Peek, Open, insert/attach reference, copy, block jump/return, and structured causal Why/Depends actions.
- Integrate commands and objects in `Cmd/Ctrl+K`, prioritized by recency/current context.
- Implement deterministic dictionary/synonym/antonym/saved-vocabulary selection card with single-click replacement preserving undo; never auto-correct style or encourage synonym spam.

#### Timeline, notes, and research — Sub-gate 11

- Implement timeline exact/absolute, approximate, relative, ordinal, and range modes without Gregorian assumptions; store display labels beside sortable mode-specific values.
- Link timeline events to entities, milestones, chapters, other events, and causal sanity checks without implying causation.
- Implement durable tagged/backlinked Notes distinct from raw Captures; allow promotion into structural objects without inventing notebook hierarchy.
- Implement Research items for notes, URLs, user-authored excerpts, citations, and files behind storage/upload validation. Surface linked research in context.
- Register durable Note/timeline Capture conversion targets, timeline/research/Note context and search providers, and the `timeline_event` causal endpoint resolver. Only then enable timeline-backed chronology sanity checks and directive invalidations.
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
- Sub-gates 7, 8, 9, 10, and 11 each pass separately with active-provider checks, `Path.md`, and remote Git evidence; only then do the Phase 3 summary tests/audit pass and Sub-gate 12 become eligible.

## 8. Phase 4 — Live Model, Automation, History, and Portability

**Bible roadmap coverage:** phases 12–13.
**Primary source coverage:** sections 7, 16.4–16.6, 18–21, 26–28, 31–32, 34.1–36; appendices B–C and E.6; directive fields include the authorized section 3.1 clarification.
**Mandatory capability sequence:** Sub-gate 12 → Sub-gate 13. Sub-gate 12 cannot start until Sub-gate 11 is verified; each receives separate evidence and remote Git proof.

### 8.1 Scope

#### Durable Live Story Model and deterministic automation — Sub-gate 12

- Complete the transactional outbox worker: claim safely, retry with backoff, run idempotent handlers, mark processed, expose lag/failure metrics, and remain rolling-deployment compatible.
- Implement rebuildable, versioned projections: continuation, chapter context, milestone progress, volume health, entity backlinks, timeline window, SearchDocument, quota seam, causal neighborhood/impact adjacency as measured, `NarrativeDirectiveProjection`, and `SemanticCoordinateProjection`.
- Preserve the complete directive projection contract: `projectStructuralVersion`, `chapterId`, `sourceObjectVersions`, `purpose`, `advanceItems[]`, `preserveItems[]`, `readerOutcomeItems[]`, `nextItems[]`, explicit `becauseItems[]`, explicit `consequenceItems[]`, `rankedContextItems[]`, provenance per item, `generatedAt`, and freshness state. Preserve the ruled semantic coordinate contract: active anchor; project, plot, Plot Outline, volume, Volume Outline, cross-cutting milestone/thread, Chapter Outline, chapter, optional scene, Story Change, and block coordinates; ordered ancestor/semantic path; neighborhood summaries; and structural version.
- Implement project structural version and per-projection freshness markers/source object versions. Mutation responses carry canonical versions and invalidation keys.
- Implement synchronous updates where cheap and async jobs where safe. After a structural write the UI either has the new projection or an honest Updating/stale state; stale results can never replace current data.
- Implement one-project repair/rebuild commands from canonical tables. No projection-only canonical facts.
- Implement the complete domain event catalog and directive invalidation set from Bible sections 7.4 and 7.6, including create/update/delete causal events and all structural source changes.

#### Deterministic automation catalog — Sub-gate 12

- Implement chapter range scaffold, milestone allocation/progress/density, writing queue, context resolution, backlink maintenance, word/cadence summaries, previewed structure rebalance, Capture context, snapshot scheduling, directive compilation, causal neighborhood/impact, and causality/chronology sanity.
- Implement warning taxonomy exactly as neutral, suppressible facts: range drift, density, orphan structure, broken reference, timeline order conflict, quota approach, backup health, causal-temporal conflict, hard prerequisite loop, and orphan causal endpoint.
- Never implement literary scoring or automatic story meaning.

#### Revisions, snapshots, backup, restore, and destructive safety — Sub-gate 13

- Complete `ObjectRevision`, `ChapterRevision`, `ProjectSnapshot`, backup manifests, integrity hashes, object-storage archives, retention controls, and storage accounting.
- Checkpoint before destructive/high-impact operations. Archive before delete; show backlinks and bounded causal impact with path provenance; offer move/reattach/retire options.
- Restore never destroys current state: checkpoint it first, then restore to current or safe copy as selected.
- Run scheduled/manual snapshots, verify integrity, expose backup health, and practice restore into a safe copy.
- Distinguish internal backup artifacts from user-owned export artifacts.

#### Import, export, and portability — Sub-gate 13

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
- Sub-gates 12 and 13 each pass separately with `Path.md` and remote Git evidence; only then do the Phase 4 summary tests/backup drill/audit pass and Sub-gate 14 become eligible.

## 9. Phase 5 — Commercial and Production Readiness

**Bible roadmap coverage:** phases 14–16.
**Primary source coverage:** sections 13–14, 15.7–15.8, 19.4–19.6, 22–26, 29, 31–32, 36, 38.3–39.3 as operational constraints; pricing and tier names follow the authorized section 3.1 commercial erratum.
**Mandatory capability sequence:** Sub-gate 14 → Sub-gate 15 → Sub-gate 16. Sub-gate 14 cannot start until Sub-gate 13 is verified; each receives separate evidence and remote Git proof.

### 9.1 Scope

#### Billing, entitlements, and quotas — Sub-gate 14

- Implement provider-neutral customer/subscription adapter, verified idempotent webhook handling, invoices/provider portal link, and configuration-driven **USD 15/month Mythra Core** pricing with full deterministic V2 access.
- Reserve **USD 25/month Mythra Intelligence** configuration and entitlement keys as dormant future schema only. Do not expose checkout, activation, usage charges, or feature claims until the AI product exists and receives its own approved implementation gate.
- Centralize feature flags and numeric limits in `EntitlementSnapshot`; frontend uses the same keys while backend enforcement is authoritative. All deterministic V2 feature keys resolve enabled for an active Core subscription; quotas may control actual cost drivers without recreating a hidden Entry/Pro feature split.
- Implement actual cost-driver accounting: binary storage, snapshots, revisions, export generation, row growth, bandwidth seams, and future AI seam. Avoid arbitrary tiny prose limits.
- Gate creation/high-cost writes, never basic read or export of owned work. Downgrades preserve prose and metadata, allow grace, and do not immediately delete history or data.
- Implement transparent plan/usage UI and stable quota errors with actionable resource details.

#### Performance, scale, responsive, accessibility, and localization — Sub-gate 15

- Profile and meet the Bible interaction budgets: network-independent keystrokes, Capture <100ms perceived, non-shifting Peek hydration, cancellable context, near-instant cached routes, virtualized large lists/structure/graphs.
- Enforce pagination/range bounds, active-chapter-only editor loads, N+1 prevention, background heavy work, object storage for binaries, and causal depth/node/edge budgets.
- Validate staged infrastructure posture from 0–500 through measured later scale stages; add Redis/search/read replicas/partitioning/service extraction only when profiling justifies them.
- Complete responsive behavior: wide desktop rail/editor/persistent field; compact desktop/tablet overlay field; mobile single-column editor, bottom action bar, navigation/context sheets, autosave, Capture, search, outline/entity Peek, and possible simplified deep structure edits.
- Complete WCAG-appropriate contrast, keyboard reachability, visible focus, semantic labels, no color-only meaning, reduced motion, controlled save announcements, resizable panels/text, graph list alternatives, IME/international input, RTL/long-label visual checks where supported.
- Complete Light/Dark and optional Cream visual regression, restrained UI geometry, mobile/compact/wide states, long titles, and international strings.
- Complete i18n resource extraction and region adapters for payments, messaging, storage, analytics, and future AI. Do not claim China legal/hosting/payment compliance without expansion-time verification.

#### Security, privacy, observability, deployment, and operations — Sub-gate 16 completion over earlier baselines

- Harden TLS/session/CSRF, rate limits, authorization, upload type/size validation and malware-scan boundary, signed URLs, audit trails, secrets, dependency scanning, destructive controls, and cross-workspace isolation.
- Enforce the privacy doctrine: manuscript/world content is sensitive; analytics uses metadata; no content in logs, traces, alerts, or routine admin surfaces.
- Implement logs/metrics/traces/alerts for save/context/search latency, errors, conflicts, jobs/outbox lag, backups, DB saturation, auth/storage failures, and export pipelines.
- Implement friction analytics without prose: time to writable editor/first keystroke, Continue usage, route changes, Peek vs Open, Capture timing, search return time, recovery incidents, editor-only sessions, causal trace friction, and 30/90/180-day project retention.
- Implement product health metrics: activation as first meaningful writing session, author retention, project depth, Core paid conversion, export patterns, recovery, and Uninterrupted Writing Time. Track future Intelligence interest separately from an active/sellable plan.
- Implement local/preview/staging/production environments, synthetic staging data, separate credentials, versioned migrations, two-phase destructive migrations, feature flags, canary editor-save rollout, rollback criteria, backup verification, migration dry runs, worker compatibility, and restricted admin access.
- Implement minimal content-safe admin surface: user/workspace, plan/status, quotas, export/snapshot jobs, non-content audit logs, and safe recovery actions.
- Run backup restore drills, security checks, dependency scans, load tests, cost-per-writer/snapshot measurements, and launch alert rehearsals.

### 9.2 Files created or materially implemented

- `docs/adr/0005-pricing-and-entitlements.md` recording the post-V2.2 Pricing Decision, plus billing/provider/entitlement/usage domains, webhook/API routes, config, Core pricing/usage/settings screens, dormant Intelligence keys, and downgrade/quota tests.
- Responsive/mobile shell/editor/context/structure components and styles; complete theme/a11y/i18n resources.
- Security middleware, rate limiters, upload scanner adapter, signed asset/export access, audit coverage, dependency/security workflows, privacy tests.
- Telemetry schemas/instrumentation/dashboards-as-code or documented queries, content-redaction assertions, alert rules, and friction metric definitions.
- Deployment/preview/staging/production configs, feature flags, migration/rollback/recovery/admin runbooks, worker compatibility checks, and internal admin routes/components.
- Performance/load/accessibility/visual/IME/RTL/large-project fixtures and reports.

### 9.3 How the code will be produced

1. Write and approve the Pricing Decision ADR; define Core, dormant Intelligence, entitlement keys, quota semantics, and downgrade invariants once. Test that every deterministic V2 feature remains available to Core before building UI meters.
2. Integrate billing through an adapter and replay-safe webhook fixtures.
3. Profile real Phase 1–4 flows before adding cache/coordination infrastructure.
4. Fix semantic accessibility and keyboard paths at component primitives, then audit screens.
5. Add privacy-safe telemetry through typed event schemas that reject content fields.
6. Practice migrations, rollback, backup restore, and alert response in staging-like conditions.
7. Validate mobile writing on real viewport/input constraints, not screenshots alone.

### 9.4 Exit gate

- USD 15 Mythra Core billing and cost-based quotas operate without withholding deterministic V2 capability or making existing prose unreadable/unexportable; USD 25 Mythra Intelligence remains dormant and unsellable while AI does not exist.
- Large projects, causal neighborhoods, search, context, autosave, and export meet measured budgets.
- Mobile authors can write, save, Capture, search, and Peek; deep structure remains possible.
- Accessibility, IME, theme, localization, ownership, security, privacy, and cross-workspace tests pass.
- Observability detects save/backup/outbox/auth/storage failures without logging content.
- Backup restore, migration dry run/rollback, canary criteria, admin recovery, and operational alerts are verified.
- Sub-gates 14, 15, and 16 each pass separately with `Path.md` and remote Git evidence; only then do the Phase 5 summary tests/audit pass and Sub-gate 17 become eligible.

## 10. Phase 6 — Agent Seam and Paid Launch Validation

**Bible roadmap coverage:** phase 17 and the V2 launch gate.
**Primary source coverage:** sections 30, 33.1, 38–39 and appendices D–E; all previous source sections are re-audited here.
**Mandatory capability sequence:** Sub-gate 17 after verified Sub-gate 16, followed by the final cross-product launch audit. Sub-gate 17 and the launch audit receive separate evidence and remote Git proof.

### 10.1 Scope

#### MCP-compatible application tool seam — Sub-gate 17, no AI dependency

- Expose stable, bounded application-tool contracts over services/read models, never direct database access.
- Implement read tools: project map, plot/volume outline, milestone, chapter outline, bounded chapter text/range, project search, entities/entity, timeline window, backlinks, causal neighborhood, causal impact, and Story Change.
- Implement proposal/write-metadata seams: suggestion creation, structure patch proposal, confirmed note/Capture creation, and causal relation proposal. Prose replacement remains disabled by default and requires explicit author action per change.
- Implement permission levels (`Read`, `Propose`, `Write-metadata`, restricted write), actor/workspace/project authorization, audit records, bounded readers, stable IDs, rate limits, and content/privacy policies.
- Implement `Suggestion` with evidence references, proposed actions, confidence only where appropriate, status (`open`, `accepted`, `modified`, `rejected`, `intentional`), author note, and resolution timestamps.
- Preserve diagnose → explain → suggest → author decides → reevaluate. Author-approved causal paths are privileged evidence; inferred missing links remain proposals and never silently become canonical.
- Add evaluation harness definitions for continuity, POV knowledge, chronology, intent alignment, character state, usefulness, false-positive cost, causal path/attribution correctness, and authorship preservation. No model integration is required to pass V2.

#### Final doctrine, launch, and paid-validation gate — after Sub-gate 17

- Run all fourteen critical E2E scenarios from Bible section 31.2, the separate visual-regression matrix from section 31.3, all causal coherence tests in appendix E.6, and every question in appendix D.
- Verify all eleven launch conditions in section 38.1, including optional usable causality, billing, snapshots/restore, export, and friction instrumentation.
- Establish the first paid validation plan around ten unrelated paying writers who repeatedly return to real projects; do not substitute free signup volume for retention evidence.
- Instrument and review Week 1/month 1 paid retention, time to writing, voluntary structure adoption, context navigation reduction, Capture habit, causal friction/value, autosave trust, Core pricing/value sentiment, future Intelligence interest, and external-tool escape points.
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
- Sub-gate 17 has its own passing `Path.md` and remote Git evidence; the subsequent final launch audit separately holds complete evidence, commit, push, and remote verification.

## 11. Global acceptance contract for every sub-gate and phase

Each original-capability sub-gate must prove all applicable items below, not merely mention them. A macro phase then proves the integrated behavior of its already-passing sub-gates; it cannot absorb or waive their evidence.

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
- The sub-gate is committed, pushed, and verified on the GitHub remote before the next original capability begins. Macro-phase completion is recorded after its final sub-gate.

## 12. Side-by-side audit protocol

The audit is performed after every Sub-gate 0–17, after every macro phase, and once across the entire product in Phase 6.

### 12.1 Coverage audit

1. Take each Bible section/subsection listed in the matrix below.
2. Locate its implementation owner in this work plan.
3. Locate actual implementation evidence in `Path.md` and the repository.
4. Classify it as `Verified`, `Planned-later`, `Bible-optional`, `Bible-future`, or `Gap`.
5. `Gap` blocks Sub-gate and phase completion. `Planned-later` is legal only before its owning Sub-gate.
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
| 4. Contextual Writing Field | composition, precedence, states, Peek/Open, cards, selection, Focus, outline-aware ruled zoom, directive, causal context | Phases 1–3; section 3.1 ruling; propagation in 4 |
| 5. Progressive Structure | three modes/one model, zero setup, deterministic scaffold, after-the-fact structure, soft constraints, optional causality | Phases 1–2 |
| 6. Capture | shortcut, lifecycle/inbox, data contract, causal Capture | Phase 3 |
| 7. Live Story Model | projections, events, consistency, explicit Because/Consequences directives, ruled coordinates, Causal Story Fabric invariants/traversal/impact | Phases 2 and 4; section 3.1 clarification |
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
| 22. Billing/plans/quotas | configurable pricing, entitlements, safe downgrade, and cost accounting; post-freeze Pricing Decision ADR replaces only `$10 Entry / $25 Pro` with `$15 Core / future $25 Intelligence` | Phase 5 and section 3.1 erratum |
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
| 33. Original roadmap | all phases 0–17, their strict predecessor gates, and the acceptance template | Sections 4.1–11 |
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

1. Every original Sub-gate 0–17 is separately `Verified` in strict order in `Path.md` with repository and remote Git evidence, and every six-phase summary gate is also verified.
2. The source coverage audit has no `Gap` and no illegal `Planned-later` status.
3. The contradiction audit has no unresolved conflict.
4. Every original Bible roadmap phase 0–17 has a verified owner and distinct gate result in the consolidation; no later capability started before its predecessor passed.
5. All launch conditions, critical E2E cases, doctrine questions, and causal coherence tests pass.
6. The product remains excellent with zero AI/model calls.
7. The final `WorkPlan.md` and `Path.md` audit is committed and pushed to the GitHub repository, and the remote commit is verified.

The north star remains unchanged: Mythra should make the author forget they are managing writing software; story, structure, causality, chronology, world, memory, and tools remain present around writing only as much as the author chooses to expose.

## 14. Phase 7X — Appearance Renewal and Curated Palettes

**Status:** Planned; no Phase 7X product implementation is claimed by this addendum.
**Authority:** the user's 3 October 2026 appearance-only request and preceding visual-direction discussion. This is a post-release addition after the separately recorded Phase 7, not a replacement for Phases 1–6, original Sub-gates 0–17, or Phase 7's S18–S20.
**Predecessor:** Phase 7 closure `f8fa1d061a91e748642e10387c6318df116f6ca0`; its exact remote CI, clean protected regression, and both Security runs are reconciled in `Path.md` section 30. The implementation baseline remains this product object until a later, explicitly recorded appearance-only slice passes.
**Execution ledger:** `Path.md` remains the Pathway V2 execution ledger. Add 7X entries there; preserve historical evidence, failures, corrections, and closure decisions.
**Outcome:** substantially renew Mythra's appearance, particularly its generic gray/violet Dark presentation, through coherent surface palettes, independently selectable accents, typography treatment, control finish, and restrained motion. The existing product must work and be organized exactly as before.

### 14.1 Narrow visual ruling and immutable product contract

This user-authorized addendum supersedes the requirement to retain the exact original visual color values in section 5.1 and Bible section 13 **only for the new presentation layer**. Original Light/Dark/Cream token values and historical verification remain preserved in their existing source and Git snapshot. Light, Dark, Cream, and System continue to mean the same base modes. Section 2.2's prohibition on a theme marketplace or theme builder remains binding: finite first-party palettes and accent swatches are not an arbitrary theme editor, marketplace, custom CSS facility, or new product platform.

All non-visual authority in sections 1–13 remains binding. No original capability is reopened, renumbered, replaced, removed, or weakened. Phase 7X does not authorize repairs or redesigns of foundations under the label of polish. If a non-visual defect is found, record the evidence and obtain a separately scoped repair authorization; do not silently fix it in a 7X slice.

The following freeze is mandatory, not a design preference:

| Protected foundation | Exact prohibition / unchanged contract |
| --- | --- |
| Architecture and repository topology | Preserve the TypeScript modular monolith, module names, inward dependency direction, domain/application/infrastructure layers, existing files and imports between those layers. No renames, moves, extraction, dependency upgrades, new framework, or generic component/state-management refactor. |
| Canonical data and persistence | `domains/**`, `prisma/**`, storage, migrations, ownership, ordering, revisions, outbox, projection builders, indexes, quotas, and stable IDs remain unchanged. No palette field in `UserPreference`, no database migration, and no cosmetic state in an export or story record. |
| API, identity, and business rules | Freeze `app/api/**`, `proxy.ts`, auth, request/security/envelope code, billing/provider/entitlement behavior, operational alerts, tools, suggestions, regional policies, and all existing request/response contracts. Core remains USD 15/full deterministic access; Intelligence remains dormant. |
| Writing and reliability | Freeze the editor adapter and document schema, `ChapterEditor`, `EditorCanvas`, local journal, save/checkpoint/conflict/recovery state machines, undo, reference marks, hard-stop opt-in, session restoration, and continuation hooks. Palette changes never dispatch editor transactions, remount the editor, reset selection, move scroll, or wait for server persistence. |
| Hierarchy, chronology, and causality | Preserve every canonical object, ownership relationship, Semantic Zoom coordinate and navigation rule, milestone many-to-many semantics, timeline mode, explicit causal relation, provenance, bounded traversal, and independent truth dimension. Colors cannot create a relationship or imply that an unverified proposal is canonical. |
| Navigation and rigid UI structure | Freeze routes, rail destinations, breadcrumbs, tab/lens order, panel positions, primary/secondary action roles, form order, control availability, Peek/Open distinction, and Return-to-Chapter behavior. No feature hiding, relocation, dashboard replacement, progressive-disclosure redesign, new route, or change to default planning/writing flow. |
| Commands and overlays | Freeze `lib/commands/**`, `lib/editor/**`, command IDs/shortcuts/registry/handlers/ranking/history, Search ranking, cancellation, modal priority, focus traps, IME guards, and successful-use semantics. Command Palette and all existing overlay component logic and markup remain unchanged; style their existing selectors. |
| Existing themes and localization | Freeze `lib/theming/theme.ts`, `ThemeProvider.tsx`, canonical preference services/endpoints, `mythra.theme`, locale resolution, and existing translations. New appearance labels may be added without changing existing message values, fallback rules, or language coverage. |
| Existing tests and operations | Preserve existing tests, fixtures, thresholds, skips, retries, timeouts, configuration, package/lockfile, workflows, and release verifiers. Add separate 7X tests and scope checks; never weaken old evidence to accommodate a cosmetic regression. |

Baseline inspection covers **648 tracked files** across 20 domain modules, 109 app files, 55 components, 90 shared-library files, 40 Prisma files, 30 scripts, 131 test files, 53 documentation files, two workflows, 17 root files, and one type declaration file. Full-content scans establish inventory and dependency/contract coverage; targeted source and ledger review establish the boundaries above. This review is not a claim that all product behavior has been freshly runtime-tested. Dependency trees, generated builds, ignored artifacts, credentials, and private local data are not implementation authority and are outside this tracked-source inventory.

### 14.2 Allowed changes and file-level containment

Use an **additive, isolated appearance layer**, not a rewrite of the existing style or theme foundations. The default posture is that every existing tracked file is frozen unless explicitly listed below. A pathname appearing here permits only its stated presentation change, not arbitrary edits to the file.

| File / new file family | Permitted work and produced code |
| --- | --- |
| `WorkPlan.md`, `Path.md` | Append the approved phase and detailed execution/evidence entries; reconcile current dashboards without rewriting historical decisions. Existing WorkPlan sections 1–13 retain their text and semantics. |
| New `app/appearance.css` | Theme-resolved palette/accent tokens and narrowly scoped visual overrides over existing selectors. Preserve existing layout declarations and manuscript metrics. No global hide/reorder, new breakpoint, grid redesign, content injection, or functional pointer/stacking changes. |
| `app/layout.tsx` | Only import the separate appearance stylesheet after `globals.css` and add an isolated cosmetic before-paint bootstrap. Preserve the existing theme bootstrap, provider nesting, metadata, locale calls, HTML direction, route composition, and children exactly. No broader root-layout rewrite. |
| `components/shell/ThemeMenu.tsx` | Retain its current labeled base-mode select, values, `setTheme` handler, and behavior. Add one compact Appearance disclosure in the same theme-control slot, with palette/accent controls inside its bounded popover. No new rail/settings route, command, or menu elsewhere; no displacement of major shell regions. This is the sole authorized addition to the existing interaction surface. |
| New `components/theming/AppearanceControls.tsx` | Self-contained cosmetic chooser with accessible named swatches, independent palette/accent inputs, reset, preview, and exact close/focus return. Its own transient open/selection state cannot enter the manuscript or domain state. |
| New `lib/theming/appearance.ts`, `appearance-storage.ts`, `appearance-bootstrap.ts` | Finite catalog, pure validation/token metadata, bounded browser-only cosmetic persistence and initial application. No server repository, API, domain import, command registration, editor dependency, or replacement for the existing theme provider. |
| `lib/i18n/messages.ts`, `lib/i18n/product-messages.ts` | Add only the keys/resources required for Appearance controls, palette/accent names, reset, and local-device preference explanation. Existing keys, translations, locale types and resolution behavior are frozen. Do not add or advertise a new language. |
| New `docs/adr/0013-appearance-only-palettes.md` | Record this ruling, layer boundaries, palette/accent mapping, local-only persistence, accessibility decisions, bootstrap behavior, and revert strategy. No modification to previous architecture ADRs. |
| New `docs/audits/phase-7x-foundation-baseline.json`, `phase-7x-appearance-audit.md` | Exact baseline paths/hashes, narrowly allowed AST edits, route/action/control/geometry inventory, every surface/state result, comparison evidence, limitations, and final gap register. |
| New `scripts/verify-phase7x-appearance-scope.ts` | Read-only scope checker over the baseline and current diff. Reject deletions/moves, unlisted modifications, foundational AST changes in permitted wiring files, test weakening, and forbidden CSS layout changes. It supplements rather than edits or impersonates the existing release verifiers. |
| New `tests/unit/appearance.test.ts`, `appearance-storage.test.ts`; `tests/component/appearance-controls.test.tsx`; `tests/accessibility/appearance-accessibility.test.tsx`; `tests/stress/appearance.stress.test.ts`; `tests/e2e/appearance.spec.ts`, `appearance-foundation-parity.spec.ts` | Additive catalog/storage/state/contrast/accessibility/stress/browser and negative-regression proof. Reuse the installed test stack; retain every existing test unchanged. Add no production dependency or test-threshold/configuration change. |

All other existing components, pages, `app/globals.css`, domain files, shared runtime hooks, scripts, configs, and migrations remain byte-identical to their implementation baseline. If a new visual requirement cannot be achieved through this allowlist, it is outside Phase 7X until the user separately authorizes a revised boundary. Do not opportunistically widen the allowlist.

Cosmetic overrides may change color, background, border color, visually consistent radii/shadows, UI-only font treatment, icon stroke finish through CSS, and non-layout-changing state transitions. Freeze display/visibility/order, grid/flex structure, breakpoints, major dimensions, hit areas, manuscript width/font/size/line-height, scrolling behavior, stacking priority, and event interception. Preserve the 48px desktop command bar/rail, current wide/compact/mobile arrangement, existing Context reservation, 52px mobile navigation row, and established mobile targets. Changes to type weight or heading treatment must not reorder information or introduce clipping/reflow regressions.

### 14.3 Palette and accent system

The desired identity is a deliberate editorial writing instrument, not a neon dashboard or a collection of unrelated colored cards. Surface identity and interaction accent are separate preferences. Dark must have genuinely distinguishable undertones and layered surfaces, rather than the existing same-gray surfaces with a substituted primary button.

Ship five bounded first-party surface palettes, each with adapted Light, Dark, and Cream variants:

| Palette key | Surface direction | Recommended pairing, not a forced accent |
| --- | --- | --- |
| `aubergine` | Deep aubergine/ink in Dark; restrained corresponding undertone in Light/Cream | Pale citron; signature default |
| `warm-ink` | Warm ink/soot, rather than cold blue-gray | Muted copper |
| `forest` | Forest-black and restrained botanical undertones | Soft mint |
| `burgundy` | Burgundy-black with a controlled warm cast | Dusty rose |
| `neutral` | Deliberately neutral charcoal/paper, with clean surface separation | Author-selected accent |

Provide six independently selectable accent families: `citron`, `copper`, `mint`, `rose`, `iris`, and `ice`. These are finite enums, not arbitrary hex inputs. Changing a palette preserves the separately selected accent; recommended pairings are descriptive. First use/reset selects `aubergine` + `citron` without changing the existing base mode. System continues to resolve through the existing theme implementation; test both of its resolved Light/Dark cases.

For every supported palette/accent/base-mode combination, specify resolved tokens for background, surface, raised surface, subdued surface, text, muted text, border, emphasized border, accent text, primary-action fill, text-on-action, accent-soft, hover/pressed/selected state, focus ring/halo, link, caret, editor selection, and existing graph/list emphasis. Declare **90 resolved color combinations**: five palettes × six accents × three base modes. System is a resolver, not a fourth independent color set.

Do not assume white text on a pale citron/mint/rose button. Separate action foreground/fill from accent-text/decorative tokens and audit actual composed backgrounds, including gradients and translucent surfaces. Preserve semantic danger/warning/success/info meaning, existing status labels, legend/type identity, and disabled/error/selected distinctions. An accent choice must not recolor a destructive action into an ordinary primary action or make a save conflict look successful. Existing charts/graphs receive accessible cosmetic tokens only; their data, edge meaning, topology, algorithms, counts, budgets, and list equivalents remain unchanged.

The original `globals.css` token sets remain the fallback foundation. The separate appearance layer applies the new signature presentation without changing the canonical theme mode. Final hexadecimal values are established in 7X-0/7X-1 through rendered comparison and contrast measurements, then frozen in the new ADR; aesthetic names alone are not an implemented palette or a passing visual gate.

### 14.4 Cosmetic state, persistence, and failure behavior

Store only `{ version: 1, palette, accent }` under the new browser-local key `mythra.appearance.v1`. Validate bounded enum-only input and a small documented size ceiling before parsing. Reject unknown versions, properties, palette IDs, accent IDs, malformed JSON, or oversized values; use the signature default without throwing into the writing surface. Never store project/user IDs, manuscript/selection text, routes, queries, or account/provider data in this record.

This preference is local to the browser/origin, not account-synchronized; explain that limitation in the Appearance UI. Do not change `mythra.theme`, cookies, the preference API, `UserPreference`, server hydration/version guards, or account state. Storage denial/private browsing/quota failure degrades to an in-memory cosmetic preference. Reset removes only the appearance key and restores its defaults, never drafts, Capture queues, command history, base mode, or existing preferences.

Apply root attributes such as `data-appearance-palette` and `data-appearance-accent` atomically. The cosmetic bootstrap and live chooser must share validated catalog semantics; neither may overwrite `data-theme`, `lang`, `dir`, `colorScheme`, the existing bootstrap, or providers. Apply the cached appearance before visible application paint where supported, without hydration mismatch, third-party requests, blocking network work, or concealing the app until hydration. Cross-tab handling uses the one bounded appearance record; it does not synchronize story state.

Appearance changes must not fetch, mutate, reload, navigate, clear a journal, recreate an editor, dispatch a command, close another overlay, or rerun the Context resolver. They may update CSS attributes and the chooser's own state only. Do not add a new global store/provider or bind an appearance effect to every keystroke. Make close/Escape behavior local to this new popover; do not modify the shared modal/keyboard/focus infrastructure. Prove that existing modal priority and exact writing return remain intact.

### 14.5 Surface-by-surface polish without hierarchy changes

All existing major surfaces are included; visual work must not stop at the editor or landing shell. Use existing markup/selectors rather than adding wrappers or rearranging product components.

| Existing surface / owner | Permitted appearance work | Rigid behavior and hierarchy retained |
| --- | --- | --- |
| Entry, Project List, Project Home, shell, settings | Surface depth, restrained wordmark/UI type treatment, existing rail glyph finish, separators, links, form and action finish | Title-only creation, Write/Continue priority, route destinations, existing project order, rail/bar geometry, save/status placement and theme-mode behavior |
| Manuscript, Focus, toolbar, word targets, conflict/recovery | Calm literary chrome, minimal editorial accents, readable selection/caret and truthful state styling | Manuscript typography/measure/line-height and document content; toolbar/control order; focus/cursor/scroll/undo; journal/save/recovery/continuation and advisory-versus-hard rules |
| Context, Relevant Now, pin bar, Peek, Language | Distinct quiet secondary surfaces, provenance/freshness finish, legible selected/pinned states | Card ordering/caps, typing stability, Purpose/Advance/Preserve/Reader Outcome/Next and explicit Because/Consequences, selection actions, pin/mute preferences and Peek/Open return |
| Structure, outlines, volumes, chapter grid, milestones, causality, Semantic Zoom | Precise typographic/control finish, subtle surface differentiation, accessible graph/list emphasis | Existing lenses, rows/columns, order and action placement, optionality, preview/apply, canonical semantics, graph budgets and reversible zoom |
| Universe/entity details/quick create and Timeline | Reference-library finish for Universe; technical time/list finish for Timeline | Flexible schema/fields/relations/backlinks/state, timeline modes/links/reveal semantics, current forms, lists, filters and non-causal meaning |
| Capture overlay/Inbox, Search and Notes/Research | Quiet notebook/list surfaces, existing row/action emphasis, coherent inputs and status treatments | Raw-first/offline Capture, provenance/conversion/triage, query/actions/ranking, flat Notes/Research, private files, all current positions and controls |
| Billing, Portability, Suggestions, Admin/Operations, supporting errors/offline | Operational clarity through type weight, borders, neutral surfaces and semantic statuses | Pricing/quotas/downgrade, checkpoint/restore/import/export confirmations, proposal approval, restricted content-safe admin, permissions and truthful degradation |

Different work modes may have different **visual treatment only**: Writing calm/literary, Structure precise, Timeline technical, Universe reference-library, Research notebook-like, Operations neutral/operational. They share the selected palette/accent. Do not add mode-specific navigation, a new mode switch, inconsistent fonts/sizes in manuscript content, changed information hierarchy, or different capability sets. Existing dense content remains accessible; no control is removed or collapsed to make a screenshot cleaner.

Command Palette polish is CSS-only over its current mixed command/object list: sharper dialog/input/row boundaries, clear existing command/shortcut/object metadata, legible selected/hover/disabled/busy/error states, and consistent keycap styling. Do not regroup, reorder, rename, add commands, change search results/history or shortcut behavior, or create a new execution model. The shared runtime remains authoritative.

Motion is restricted to short color/opacity/shadow transitions, normally 100–180 ms, without layout movement, delayed interaction, animation queues, keystroke/autosave animations, decorative particles, or altered overlay lifecycle. Reduced-motion and forced-colors users receive immediate, legible state changes. Writing/capture/command focus happens immediately and never waits for an animation.

### 14.6 Mandatory ordered 7X sub-gates

These are new appearance gates, not replacements for original Sub-gates 0–17 or Phase 7's S18–S20. Sequence is strict: **7X-0 → 7X-1 → 7X-2 → 7X-3 → 7X-4 → 7X-5 → 7X-6**. Pre-code review, implementation, evidence, audit, commit, push, and exact remote proof are separate recorded steps for each applicable gate. Do not start the next gate because the preceding code merely compiles.

| Gate | Scope, files, and code production | Mandatory exit / negative proof |
| --- | --- | --- |
| **7X-0 — Baseline and appearance contract** | After the prerequisite in 14.11 is resolved, record the exact predecessor and freeze manifest; create the new ADR/audit manifest/scope checker and additive parity tests. Render the actual current product; inventory control order, actions, routes, responsive geometry, major states, and protected AST boundaries. Resolve palette hexadecimal/typographic/state decisions with real-product visual comparisons before styling. No product mutation or new behavior. | Baseline coverage is complete; every allowed edit is bounded; protected-file/AST checks detect deliberate synthetic violations; original capability and Phase 7 proof are independently green. Required manual before-images and explicit design decisions exist. |
| **7X-1 — Curated palettes and accent controls** | Create the new appearance catalog/storage/bootstrap/CSS/control files, the narrowly allowed layout/ThemeMenu integration, new labels, and new unit/component/accessibility/stress/browser tests. Code pure contracts first, isolated state second, then the bounded theme-slot chooser. | All 90 color sets resolve and pass contrast; independent palette/accent choice, reload/reset/cross-tab/storage-denial/default/System cases pass. Existing base preference/API/provider/editor and all non-appearance state are unchanged; no new network request from appearance application. |
| **7X-2 — Shell and writing chrome** | Add scoped visual rules to `app/appearance.css` for entry/project/settings/shell/editor/Context/Relevant Now/Peek/Language. Add affected parity/visual assertions to the new 7X tests; record every selector and consumer. Existing components/pages/handlers stay byte-identical. | Writing-first priority and all major geometry remain unchanged; exact document/block/selection/scroll/undo/save/continue behavior survives palette switching, Focus, Peek, Capture and failures. No controls hidden/reordered, no manuscript metrics changed. |
| **7X-3 — All supporting product surfaces** | Extend only the separate CSS and new tests for Structure/Milestones/Causality/Semantic Zoom, Universe/Timeline, Capture/Search/Notes/Research, Billing/Portability/Suggestions/Admin and every supporting status. Apply the visual-only distinctions in 14.5 without new markup or domain logic. | Every surface has before/after evidence; existing action/control counts/order and route/payload contracts match baseline. Optionality, chronology/causality separation, provenance, privacy, bounds, safe destructive actions, and commercial rules remain intact. |
| **7X-4 — Command presentation and motion** | Finish current command-dialog/keycap/result/state selectors and shared visual-only transitions in the appearance stylesheet. Add presentation/focus/reduced-motion/forced-colors parity tests; do not modify CommandPalette or shared command/overlay sources. | Registry/ranking/context/history/output/keyboard/IME/modal behavior match baseline. No new command, grouping, hidden result, shortcut or delayed interaction; original command suites and clean desktop/mobile execution pass. |
| **7X-5 — Cross-product accessibility, visual and stress audit** | Complete new 7X audit/test files, run all existing applicable gates and the comprehensive matrix in 14.8, inspect actual rendered before/after artifacts, and fix only in-scope appearance defects in their owning slice. Product source outside the allowlist stays frozen. | No appearance/compliance gap; zero unexpected page/hydration/console errors, root overflow, contrast/focus/target regressions, disabled-mode mismatch, or foundational diff. All measurements meet existing budgets and tests/thresholds remain intact. |
| **7X-6 — Final conformity and delivery seal** | Reconcile `Path.md`, the new ADR/audit report, final hashes/diff, every requirement-to-evidence row, exact remote checks and retained failures. Verification/documentation only; no late creative or foundational change. | Scope checker, full positive/negative proof, all applicable local checks, clean protected browser gate, exact hosted CI/Security and independently accepted closure ledger pass. Only then may Phase 7X be Verified. |

7X-5 does not waive the evidence gates on earlier slices. A discovered palette/geometry/interaction regression returns to its owning appearance slice. An actual foundational defect or dependency advisory remains outside this authority: record it and stop the affected gate for separate authorization rather than changing frozen code, dependencies, or safety rules.

### 14.7 How implementation will be produced

1. Read this entire phase, relevant existing WorkPlan/Path entries, AGENTS.md, and the installed Next.js guides before any implementation. For layout/bootstrap work, use the actual version's styling/Script/hydration documentation in `node_modules/next/dist/docs/`; do not assume older framework behavior.
2. Establish a clean exact-hash baseline and manifest. Check every planned file against 14.2 before editing. Review existing CSS and actual screen states before choosing token overrides; do not invent a replacement product from screenshots.
3. Define finite palette/accent types, mode-resolved token roles, and bounded storage/bootstrap behavior as pure, testable contracts. Keep these independent of base-theme persistence and all domain services.
4. Write additive tests for invalid inputs, storage failure, account-theme independence, no network/editor effects, exact focus return, and unchanged protected source before enabling the chooser. Validate token mappings and actual contrast before approving a default.
5. Integrate only the named cosmetic hooks. Apply root attributes/CSS without remounting product components. Preserve existing component source and DOM semantics; reuse existing styling selectors. Do not refactor shared styling to make cosmetic work easier.
6. Polish one gate's current surfaces at a time. List all selectors, inherited consumers, and semantic tokens changed; inspect actual Light/Dark/Cream and worst-case mobile/RTL states, not just a design mockup.
7. For each gate, run the relevant unchanged functional suites plus new appearance tests, scope/AST/hash checks, manual visual/keyboard review, and the required remote checks. Fix every in-scope gap and record rejected/failed evidence instead of overwriting it.
8. Update Path with actual files, code method, boundaries, exact log/comment lines, test commands/results, screenshot paths, omissions/contradictions, and Git proof. Commit/push each completed gate and its evidence reconciliation; preserve the preceding verified rollback object. No deployment, production-data mutation, schema operation, or release tag is authorized here.

### 14.8 Verification, stress, accessibility, and visual matrix

Appearance completion requires both positive proof of better presentation and negative proof of unchanged foundations. A source inventory, passing build, screenshot, or happy-path demonstration alone is insufficient.

- **Foundation parity:** manifest/hash verification for every frozen existing file; AST comparison for the narrowly permitted layout/ThemeMenu/message additions; zero deletions/moves/unlisted modifications; route/import/dependency/schema/command inventories identical. Verify the existing base-select values and handler, layout providers/metadata/locale/bootstrap, and existing message values specifically. Enforce stylesheet layout-property prohibitions rather than relying on file names alone.
- **Every color combination:** automated contrast and token/state checks for all 90 sets, including actual text/action foreground, muted/placeholder text, focus/selection, hovered/pressed/disabled surfaces, graph/list markers, and destructive/status controls. Normal text must reach at least 4.5:1; large text and necessary non-text/focus boundaries at least 3:1. Color never carries meaning alone. Verify translucent/gradient final backgrounds in the browser, not only nominal palette hex values.
- **Actual-product renders:** cover all 16 existing page routes and existing editor/context/Peek/Capture/entity/language/command/mobile overlays, not a separate showcase. Recreate at least the coverage of S19-L's 109 actual states and add chooser/default/non-default/cross-tab/denied-storage/hydration states. Preserve the coverage dimensions, not stale fixture values or an unexamined screenshot count. Save full-resolution before/after images and inspect the complete set; contact sheets are supplemental.
- **Theme and locale dimensions:** Light, Dark, Cream, System resolving Light/Dark; every palette's recommended pairing on all surface families; worst-contrast non-default accents; English LTR, supported Arabic RTL and long labels. Execute token/contrast checks on every combination; declare which representative rendered screenshots cover which combination rather than falsely claiming the entire screenshot Cartesian product.
- **Viewport and preferences:** current wide 1440px, compact 1024px/720px, mobile 412px/320px, existing breakpoint boundaries 767/768 and 1279/1280, normal and 200% text, browser zoom/reflow, reduced motion, forced colors, keyboard-only and touch. Preserve existing resize/scroll affordances, 44px mobile targets, visible focus, no root horizontal overflow, no concealed/truncated action, and no shifted manuscript/Context layout. Compare matched major-region bounds against baseline with at most 2px rounding tolerance; no intentional major geometry change is allowed.
- **State coverage:** empty/populated/loading/selected/hover/focus/pressed/disabled, truthful stale/updating, offline/queued save or Capture, dependency failures, conflict/recovery, destructive confirmation and success/error paths. Audit the active modal subtree when intentionally dimmed inert background would otherwise produce misleading contrast results; retain full-document audits for non-modal states. Do not hide legitimate error states to produce clean screenshots.
- **Interaction parity:** new author writes without setup; returning author resumes exact position; all existing commands and object actions still execute through current handlers. Switch palette/accent during continuous typing, dirty save, offline work, selection, Focus, Peek and Capture; compare document bytes/version/selection/scroll, undo history, history length, network requests and side effects. Allow only expected changes from the existing action itself. Appearance-only actions create zero canonical writes and zero additional network requests.
- **Stress and performance:** cycle all 90 sets repeatedly, run at least 1,000 cosmetic changes including reset and malformed/denied-storage cases, and confirm bounded storage/listeners/memory and no leaked popovers, duplicates, uncaught errors or unnecessary editor remounts. Repeat with existing large-project fixtures. Retain `lib/performance/budgets.ts`: local input p95 ≤50ms, Capture p95 <100ms, warm route p95 ≤1,000ms, Context p95 ≤1,500ms, CLS ≤0.05, existing list/graph budgets. Measure appearance apply p95 ≤50ms over at least 100 changes on a disclosed test device; never weaken the inherited budgets to get a visual pass.
- **Required commands:** `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run test:a11y`, `npm run test:stress`, `npm run test:security`, `npm audit --audit-level=high`, `npm run audit:launch`, `npm run build` with the documented production-shaped environment, all applicable existing E2Es, the new appearance/parity tests, the new scope checker, and the reconciled release-verification gate described in 14.11. Execute existing native PostgreSQL/protected S18 verifiers and recovery/portability checks against a disposable synthetic database at the final gate; never use private author data or run destructive verification on the author's working database.
- **Remote proof:** exact implementation and evidence objects must resolve on GitHub; required CI verification, clean protected `s18-regression`, and applicable Security triggers must pass on those objects. Record counts, legitimate project skips, retries, timing, artifacts and failures. A retry-dependent/flaky protected browser result is not a clean pass, and absence of a configured workflow on a documentation-only branch is not a passing CI result.

### 14.9 Console instrumentation and Path evidence

Preserve all existing instrumentation and identifying comments. New real cosmetic lifecycle boundaries require adjacent `// Console trace 7X-...: ...` comments and content-safe `console.log(JSON.stringify(...))` statements: preference restored/applied, intentional change/reset, and bounded degraded-storage/bootstrap handling where executable. Emit only validated palette/accent/version enums, booleans, counts, and measured durations. No authored text, queries, selected prose, route/query strings, IDs, raw storage contents, credentials, or raw exceptions. Do not log on every render/keystroke, duplicate an existing event, or add meaningless console calls to CSS and pure token helpers.

For each changed executable file, Path must record the trace ID, literal identifying comment, **one-based comment line and console call line in the final file at the cited commit**, event and allowed metadata, and verification of forbidden-content exclusion. Re-index moved lines and distinguish immutable historical indices from current ones. CSS-only slices explicitly record that no new operational lifecycle/log exists; this is not missing instrumentation.

Each gate's Path entry must cover predecessor/branch/commit; exact scope and files; produced code and implementation method; frozen schema/API/editor/state/ownership/security/operations boundaries; new cosmetic state and degradation; tokens/selectors/consumers; screenshots and manual findings; accessibility/performance/stress/functional results; failures/repairs; a requirement-by-requirement table for 14.1–14.12; classification and remaining gaps; and exact commit/push/remote proof. Keep the main phase dashboard and separate 7X gate table current. Planned code, visuals and logs remain Planned until evidence exists.

### 14.10 Side-by-side audit and exit definition

Before declaring any gate complete, compare its actual diff and evidence against its row in 14.6, the freeze/allowlist, palette/state contracts, every affected surface, global acceptance in section 11, contradiction audit in section 12, prior Phase 7 evidence, and user-authorized visual ruling. Report `Verified`, `Implemented-not-verified`, `Planned-later`, or `Gap`; do not label an existing capability freshly Verified merely because its source hash matches.

Phase 7X is Verified only when all seven ordered gates and their remote evidence pass, every surface and allowed combination is accounted for, all new appearance preferences work without changing the existing base preference contract, every foundational freeze is proved, and no in-scope visual, accessibility, performance, privacy, writing-flow, documentation, evidence, or contradiction gap remains. The final report must explicitly answer: what changed visually; how it was implemented; which files changed; what remained frozen; how all palette/accent combinations were audited; whether any command/workflow/hierarchy changed; exact console/comment locations; stress/functional/accessibility evidence; failed attempts and repairs; and commit/remote verification.

No final seal is earned by styling alone. Preserve the same excellent zero-AI writing product, its complete deterministic capabilities, and all launch/recovery/portability/security assurances. If a gate needs authority outside 14.2, keep it incomplete and state the precise blocker.

### 14.11 Historical release verifier compatibility prerequisite

The existing `scripts/verify-phase7-release-seal.ts` hashes the **entire current** WorkPlan and requires SHA-256 `87372ec08c80951e8321379019aab4e622f916dd3e62c09fbe2c60705ce44aa9`. `.github/workflows/ci.yml` runs that verifier unconditionally. Appending the explicitly requested Phase 7X necessarily changes this hash, even though the prior sections and all product code remain intact. A separate new scope checker cannot make that existing CI command pass.

This is a known plan-version/verification prerequisite, not permission to change a foundation or proof that the old Phase 7 release was invalid. Its frozen historical snapshot and exact passing commit remain in Git. **Before 7X-0 implementation starts, obtain separate user authorization for a verification-only plan-version reconciliation** that retains the old hash as the historical Phase 7 baseline, verifies original plan content, validates the new append-only phase, and runs required current-code checks without deleting, bypassing, or weakening the release test. No runtime, domain, database, command, navigation, dependency, or product semantic change may accompany that separate work.

The current request authorizes this documented plan addition, not editing the existing verifier/workflow. Until that separate prerequisite is resolved and remotely verified, the Phase 7X implementation gates stay Not started/Locked. Do not report current `audit:release-seal` as passing, silently replace its hash, remove its CI invocation, or treat branch push alone as full release verification. Keep the documentation plan on a separate branch so the previously green sealed branch remains unchanged.

**Additional current Security prerequisite discovered during plan publication:** push Security run `37121259584` on documentation commit `7e1f30463a5d02c3fce350421689d610f875ff90` failed at `npm audit --audit-level=high`. Its final audit reported ten affected dependency entries: two moderate, seven high and one critical, including a critical advisory reported against the installed Next.js version. This is the audit's classification, not a finding that a particular Mythra route is exploitable. The package/lockfile are unchanged from the historical sealed baseline. Security tests and committed-secret rejection were skipped after that failed step, not passed.

Before implementation, separately authorize and complete a bounded dependency-security review/remediation and exact-hash hosted recheck, without altering product architecture or workflows. Such dependency changes are outside this phase's frozen allowlist and must not be performed as palette work. The historical green Phase 7 result remains evidence for its recorded date/commit, not a guarantee that the unchanged dependency set passes a later advisory database. Both this Security prerequisite and the plan-version prerequisite must be resolved; neither is waived by documentation publication.

### 14.12 Rollback and final protected outcome

Before every implementation slice, record the preceding accepted Git object. A 7X rollback is a scoped revert of cosmetic additions and their named integration hooks; it never needs SQL, document migration, canonical-data restoration, or erasure of author preferences/drafts. Reset affects only `mythra.appearance.v1`; disabling/removing the layer returns to the unchanged original theme/style foundation.

At final delivery, recheck the complete protected manifest, all allowed AST differences, all prior plan text, every original sub-gate/Phase 7 historical owner, and the complete 7X Path/dashboard. Push the audited implementation and evidence, verify exact remote objects and required checks, and leave every underlying foundation, rigid UI hierarchy, writing workflow, and product meaning as it was before Phase 7X.
