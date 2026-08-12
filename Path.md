# Mythra V2 Pathway Execution Ledger

## 1. Purpose and authority

`Path.md` is the canonical, evidence-backed **Pathway V2 execution ledger** required by the Bible's phase acceptance template. “Path”, “Pathway V2 entry”, and “execution ledger” refer to this file; no separate `Pathway.md` is required.

- The Bible defines the product and engineering truth.
- `WorkPlan.md` defines the approved implementation sequence.
- `Path.md` records what actually happened.

This file must never claim that planned work is implemented. Every implementation statement must point to repository files, tests, commands/results, migrations, screenshots/artifacts, or remote Git evidence. If actual work diverges from `WorkPlan.md`, the sub-gate/phase entry must state the divergence, why it occurred, whether the Bible or an authorized ruling permits it, and whether the plan was corrected.

Entries are chronological. Corrections are appended or explicitly marked; implementation history is evidence, not product authority.

## 2. Mandatory update protocol

For each implementation run, original-capability sub-gate, and delivery phase:

1. Record date/time, delivery phase, Sub-gate number, predecessor-gate evidence, baseline branch/commit, intended slice, and source sections before coding.
2. Record every created, modified, moved, or deleted file and its purpose.
3. Describe code behavior and implementation method at the same depth as the corresponding `WorkPlan.md` sub-gate and containing phase.
4. Record schema/migrations, API/contracts, UI/interaction, state ownership, security/privacy, observability, accessibility, performance, recovery, and operational effects.
5. Record every validation command and exact pass/fail/blocked result. Never convert a skipped check into a pass.
6. Compare actual work side by side with the sub-gate row, containing phase scope, global acceptance contract, Bible coverage matrix, authorized rulings, and anti-goals.
7. Classify each item as `Verified`, `Implemented-not-verified`, `Planned-later`, `Bible-optional`, `Bible-future`, or `Gap`.
8. Fix every in-scope `Gap` before sub-gate completion. If blocked, leave the sub-gate and containing phase incomplete.
9. Record the final diff scope, commit hash/message, pushed branch, GitHub remote, and remote verification.
10. Do not start the next original capability until the current Sub-gate is verified, audited, committed, pushed, and remotely confirmed. A macro-phase summary never substitutes for predecessor evidence.

## 3. Delivery phase and capability status

| Phase | Bible roadmap mapping | Status | Evidence entry | Remote state |
| --- | --- | --- | --- | --- |
| Planning baseline | Plan/ledger creation and source audit | Superseded by correction | Entry P0 below | Historical commits on `main` |
| Planning correction audit | Gates/dependencies/directive/zoom/pricing cleanup | Verified | Entry P1 below | Pushed and remotely verified on `agent/workplan-subgates-audit` |
| 1. Trusted Writing Foundation | 0–3 | **Passed - macro audit and CI reconciliation complete** | Entries S0, S1, S2, S3, Phase 1 macro audit 8.1–8.9, and correction 8.10 | Final ledger `543fe83345d1ec2066a21010046e9a6025175c2e` remotely verified; CI run `31612678269` passed all steps |
| 2. Progressive and Causal Story Core | 4–6 | **In progress — Sub-gate 4 technical pass; evidence closure in progress** | Entry S4 below | S4 content `b5a18a4289d2555a2891d53973c78fd4a0b85aa8`; CI run `31623924571`, job `94205355140`, passed; ledger remote check pending |
| 3. In-Flow Author Environment | 7–11 | Not started | — | — |
| 4. Live Model, Automation, History, and Portability | 12–13 | Not started | — | — |
| 5. Commercial and Production Readiness | 14–16 | Not started | — | — |
| 6. Agent Seam and Paid Launch Validation | 17 + launch | Not started | — | — |

### 3.1 Mandatory capability sub-gate status

| Sub-gate | Capability | Delivery phase | Status | Predecessor evidence | Pathway entry | Remote evidence |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Foundation | 1 | Passed | None | Entry S0 | Content `8459d6601885e019c56f1c3d757c1d4f5645f618` and evidence `d0421ab61964aa406f6664f7e92bf156c67b463c` pushed/remotely verified |
| 1 | Project + Chapter + Editor Core | 1 | Passed | Sub-gate 0 evidence `d0421ab61964aa406f6664f7e92bf156c67b463c` verified | Entry S1 | Content `0883070a6ba7cc04c285c1adce3652107a5d1511` and evidence `bee0dae6b77faa59d33f6ecf2a425afcec847243` pushed/remotely verified |
| 2 | Durability | 1 | Passed | Sub-gate 1 evidence `bee0dae6b77faa59d33f6ecf2a425afcec847243` verified | Entry S2 | Content `674ff4895a0cab50f8b6f30fbe800bbc97e52568` and evidence `8e011bef6409656e5a1c443355b3ccf35dd5462d` pushed/remotely verified |
| 3 | Continuation | 1 | Passed | Sub-gate 2 evidence `8e011bef6409656e5a1c443355b3ccf35dd5462d` verified | Entry S3 | Content `dd27be8b5f2a6be9a1e2235da47dcb34b490cc61` and evidence `d98b27a7238d2ec72c5af4e94beef68958e19625` pushed/remotely verified |
| 4 | Structure Core | 2 | **Technical pass; evidence closure in progress** | Sub-gate 3 evidence `d98b27a7238d2ec72c5af4e94beef68958e19625`, Phase 1 final ledger `543fe83345d1ec2066a21010046e9a6025175c2e`, and CI run `31612678269` verified | Entry S4 | Plan `abcd402382aa1c8f391a68276c8a0330b06d9d29`; content `b5a18a4289d2555a2891d53973c78fd4a0b85aa8`; CI `31623924571`/`94205355140` passed; ledger remote check pending |
| 5 | Milestones | 2 | Locked; not started | Sub-gate 4 evidence-ledger commit and remote CI required | Entry S5 required before code | No S5 application code |
| 6 | Causal Story Fabric Core | 2 | Not started | Sub-gate 5 required | — | — |
| 7 | Contextual Writing Field v1 | 3 | Not started | Sub-gate 6 required | — | — |
| 8 | Capture | 3 | Not started | Sub-gate 7 required | — | — |
| 9 | Universe | 3 | Not started | Sub-gate 8 required | — | — |
| 10 | Search + Language | 3 | Not started | Sub-gate 9 required | — | — |
| 11 | Timeline + Research | 3 | Not started | Sub-gate 10 required | — | — |
| 12 | Live Story Model | 4 | Not started | Sub-gate 11 required | — | — |
| 13 | Revisions + Snapshots + Export | 4 | Not started | Sub-gate 12 required | — | — |
| 14 | Billing + Quotas | 5 | Not started | Sub-gate 13 required | — | — |
| 15 | Performance + Accessibility + Mobile | 5 | Not started | Sub-gate 14 required | — | — |
| 16 | Launch Analytics + Operations | 5 | Not started | Sub-gate 15 required | — | — |
| 17 | AI Seam — no AI required | 6 | Not started | Sub-gate 16 required | — | — |

The next product capability is Sub-gate 5, but it remains locked until this S4 evidence-ledger update is committed, pushed, and remotely verified. Sub-gates 0–3 are closed; S4 has a technical pass with evidence closure in progress; every later row remains locked until its immediate predecessor's Pathway entry and remote commit are verified.

## 4. Entry S0 — Foundation

### 4.1 Run identity and authorization

- **Date/time and timezone:** 12 August 2026, Asia/Karachi; implementation remains in progress until the audit and remote evidence below are complete.
- **Work-plan phase:** Phase 1 — Trusted Writing Foundation.
- **Mandatory Sub-gate:** 0 — Foundation.
- **Predecessor evidence:** planning correction branch was remotely verified at `eee9cf73d9eef893a7f27190a57ca84047a35cc0`; no product capability precedes Sub-gate 0.
- **Baseline branch/commit:** `agent/workplan-subgates-audit` at `eee9cf73d9eef893a7f27190a57ca84047a35cc0`.
- **Bible scope:** sections 0–2, 13–18, 23–27, 29, 31–34, 36; roadmap Phase 0 and acceptance template 33.1.
- **Intended slice:** repository/runtime baseline, identity and workspace foundation, PostgreSQL/Prisma migration, structured content-safe observability, stable errors, safety seams, themes, and authenticated empty shell. No Project, Chapter, editor, durability, or continuation capability is authorized in this gate.
- **Pre-existing changes:** clean tracked worktree at the baseline commit. The source PDF is external and read-only.

### 4.2 Plan before completion

- Pin the server-capable React/TypeScript/PostgreSQL stack and record architecture decisions.
- Establish provider-independent identity contracts and first-use workspace provisioning.
- Ensure every session actor contains internal user, workspace, role, and session identifiers before domain execution.
- Establish ownership-scoped repository conventions, stable error/envelope contracts, CSRF/rate-limit/security seams, and reserved audit/outbox persistence.
- Build the exact Light/Dark token system, optional Cream tokens, 48px command bar, 48px rail, responsive empty shell, accessible command palette, theme preference, and i18n boundary.
- Add lint, type, unit, service, component, stress, accessibility, E2E, migration, and build harnesses. A capability is not complete merely because it compiles.
- **Instrumentation rule:** every operational step log is identified by an adjacent `Console trace <STEP-ID>` comment. All server instrumentation flows through one structured `console.log` transport that rejects content-bearing metadata keys. Client/bootstrap diagnostics may use direct `console.log` only with allow-listed non-content metadata.
- **Risk controls:** no manuscript content exists in Sub-gate 0; logging nevertheless enforces the future content boundary. Development authentication is rejected in production. No later-domain route, model, control, or status may be activated.
- **Migration/rollback:** `20260812090000_foundation` is independently reversible through its reviewed `rollback.sql` only before Sub-gate 1 data exists.
- **Performance/stress intent:** exercise 10,000 structured log operations, 10,000 independent rate-limit keys, and 10,000 signed-session validations; record timings during the gate audit.

### 4.3 Chronology correction

The source review, runtime decision, and intended Sub-gate 0 boundary were stated in the active task commentary before files were created. This `Path.md` entry itself was added after the first implementation patch rather than before it. That is a procedural deviation from the WorkPlan protocol and is recorded without backdating. It is not classified as resolved merely by writing this paragraph: the Sub-gate remains in progress, every created file will be enumerated, and the final conformance audit must determine and document the repair before Sub-gate 0 can pass. Subsequent sub-gates must have their Path entry committed before product code begins.

### 4.4 Current status

- **Capability status:** Passed: implemented, audited, committed, pushed, and remotely verified.
- **Application claims:** Sub-gate 0 Foundation only. Sub-gates 1–3 remain locked and no Project, Chapter, editor, IndexedDB, autosave, revision, conflict, or continuation persistence exists.
- **Validation:** all local static, unit, service, component, stress, PostgreSQL migration/rollback, authenticated E2E, responsive, theme, accessibility, and production-build checks pass. Detailed evidence follows.
- **Git evidence:** content commit `8459d6601885e019c56f1c3d757c1d4f5645f618` matches the remote branch; this ledger evidence commit follows separately.

### 4.5 Files and implementation evidence

| Area/files | Action and implemented behavior | WorkPlan/Bible ownership |
| --- | --- | --- |
| `package.json`, `package-lock.json`, TypeScript/Next/ESLint/Vitest/Playwright/Prisma configs, `.env.example`, `.gitignore` | Pinned Node-compatible production/test stack, strict compiler/linting, coverage budgets, E2E projects, environment contract, generated/build artifact exclusions. Next.js generated `AGENTS.md`/`CLAUDE.md` with current framework instructions; they are retained as generated project guidance. | WorkPlan 5.1 repository baseline; Bible 15, 31–32. |
| `.github/workflows/ci.yml`, `README.md` | Reproducible install, Prisma generation, audit-quality lint/type/coverage/build pipeline and local setup documentation. | WorkPlan 5.1/5.2; Bible 31–32. |
| `docs/adr/0001-stack.md` through `0004-persistence-and-jobs.md` | Recorded runtime, provider-independent auth, editor-document boundary for the next gate, PostgreSQL/local journal/object storage/outbox decisions without activating later domains. | WorkPlan 5.1/5.2; Bible 8.2, 15–16, 19, 23. |
| `docs/architecture/module-boundaries.md`, `docs/security/content-handling.md`, `docs/operations/migrations.md` | Enforced inward dependency direction, thin routes, sensitive-content doctrine, additive/two-phase SQL policy, separate rich-document migration policy, and Sub-gate 0 rollback limits. | WorkPlan 5.1/5.2; Bible 16, 24, 32. |
| `prisma/schema.prisma`, migration/rollback, `prisma/seed.ts` | Added internal User, ExternalIdentity, Workspace owner/billing/security boundary, active membership/role/status, preferences including editor/accessibility values, AuditEvent, and dormant OutboxEvent. Added constraints/indexes and independent rollback. No later capability model exists. | WorkPlan Sub-gate 0 staged persistence; Bible 17.1, 23, 24. |
| `domains/accounts/*`, `lib/auth/*`, `lib/db/prisma.ts` | ExternalAuthAdapter with OIDC and non-production development providers, atomically idempotent first-use provisioning, concurrency recovery, signed internal session, active membership/workspace archive enforcement, and resolved SessionActor before app-domain work. | WorkPlan Sub-gate 0 identity; Bible 23.1–23.3. |
| `lib/contracts/*`, `lib/http/*` | Stable error catalog, safe envelopes, correlation IDs, same-origin mutation guard, and fixed-window rate-limit boundary. No raw runtime error is returned by the auth route. | WorkPlan Sub-gate 0 safety; Bible 16.3, 18.3, 24, 36.2. |
| `lib/observability/*`, `lib/storage/object-storage.ts` | Structured content-safe log transport, metric/trace seams, and private object-storage boundary. Logger rejects body/text/prose/content/document/capture/note/manuscript/selection metadata keys. | WorkPlan Sub-gate 0 observability/storage seams; Bible 24–26. |
| `app/*`, `components/*`, `lib/theming/*`, `lib/i18n/messages.ts`, `proxy.ts` | Signed-session sign-in path, authenticated empty shell, exact 48px desktop command bar and rail, reserved context region, responsive single-column/mobile bottom rail, command palette with Escape focus restoration, save-status seam, exact Light/Dark and specified Cream tokens, apply-before-paint theme bootstrap, visible focus, reduced motion, i18n boundary. No dashboard/story workflow controls. | WorkPlan Sub-gate 0 shell; Bible 13–15, 29, 34. |
| `tests/*`, `scripts/verify-foundation-db.ts` | 32 focused tests with coverage, 30,000-operation stress suite, real PostgreSQL ownership/idempotency/concurrency verification, rollback/deploy verification, four applicable browser passes across desktop/mobile, axe serious/critical accessibility scan, exact geometry, Light/Dark and visual screenshots. | WorkPlan safety/test baseline and Sub-gate 0 exit; Bible 31, 33.1. |

### 4.6 Console instrumentation ledger

Every operational log site has an adjacent identifying comment. Server runtime steps call the structured logger, whose sole literal `console.log` is `lib/observability/logger.ts`; direct calls are limited to safe client/bootstrap or verification processes.

| Step | Comment line | Call/transport line | Safe metadata and purpose |
| --- | --- | --- | --- |
| `S0-LOG-001` | `lib/observability/logger.ts:15` | literal `console.log` at line 16 | Single JSON transport after forbidden-key validation; level/event/timestamp plus allow-listed scalar metadata. |
| `S0-AUTH-001` | `domains/accounts/application/authenticate.ts:17` | logger call at line 18 → `S0-LOG-001` line 16 | Correlation ID and provider only; begins verification without credential emission. |
| `S0-AUTH-002` | `domains/accounts/application/authenticate.ts:28` | logger call begins line 29 → `S0-LOG-001` line 16 | Internal user/workspace/role and first-use boolean after provisioning. |
| `S0-AUTH-003` | `app/api/v2/auth/development/route.ts:32` | logger call line 33 → `S0-LOG-001` line 16 | Request/user/workspace identifiers after signed session issuance. |
| `S0-AUTH-004` | `app/api/v2/auth/development/route.ts:37` | logger call line 38 → `S0-LOG-001` line 16 | Request ID and stable error code only. |
| `S0-SHELL-001` | `app/app/page.tsx:7` | logger call line 8 → `S0-LOG-001` line 16 | User/workspace identifiers; proves the authenticated empty shell boundary. |
| `S0-THEME-001` | `components/theming/ThemeProvider.tsx:31` | literal `console.log` line 32 | Theme key only after a user preference change. |
| `S0-SEED-001` | `prisma/seed.ts:10` | literal `console.log` line 11 | Connectivity event only; no seeded author content. |
| `S0-DB-001` | `scripts/verify-foundation-db.ts:65` | literal `console.log` begins line 66 | Counts/concurrency result/cross-workspace false after real PostgreSQL verification. |
| `S0-DB-002` | `scripts/verify-foundation-db.ts:91` | literal `console.log` line 92 | Remaining application table count after rollback. |

The audit found exactly five literal production/verification `console.log` sites, each with the adjacent comment above; the five server operational logger calls resolve to the single guarded transport. Tests deliberately spy on console output but add no runtime instrumentation.

### 4.7 Validation and stress evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Dependency security | Pass | `npm audit --audit-level=low`: zero vulnerabilities after pinning compatible TypeScript/jsdom and overriding patched `esbuild` 0.28.1. |
| Prisma generation/schema | Pass | Prisma Client 7.9.1 generated; `prisma validate` reported a valid PostgreSQL schema. |
| Static quality | Pass | ESLint zero warnings; strict `tsc --noEmit` pass. |
| Unit/service/component/contract coverage | Pass | 9 files, 32 tests; 95.5% statements, 88.75% branches, 95.16% functions, 97.51% lines. |
| Stress | Pass | 10,000 structured log writes, 10,000 independent limiter buckets, and 10,000 session validations; 3/3 tests passed. |
| Real database behavior | Pass | Disposable Prisma Postgres/PGlite: idempotent first use, two isolated workspaces, active membership guard, cross-workspace denial, one audit event, and eight concurrent provisioning attempts converging to one identity/workspace. |
| Migration recovery | Pass | Verify → full reviewed rollback (`remainingTables: 0`) → `prisma migrate deploy` → verify all passed. Initial optional `pgcrypto` dependency failed on PGlite and was removed because supported PostgreSQL provides `gen_random_uuid()` natively. |
| Production build | Pass | Next.js 16.3 compiled, type checked, generated seven pages, and produced the expected static/dynamic route map. |
| Browser writing-flow gate | Pass | Isolated server run returned code 0: four applicable tests passed and two cross-viewport duplicates were explicitly skipped; authenticated author reached the empty shell in Light/Dark desktop and mobile. |
| Accessibility/keyboard | Pass | Ctrl/Cmd palette path, Escape focus restoration, semantic navigation/dialog/status, and axe scan with zero serious/critical violations in desktop and mobile projects. |
| Visual/responsive | Pass | Manual inspection of `foundation-light.png`, `foundation-dark.png`, and `foundation-mobile.png`: no clipping/overlap, exact neutral themes, 48px desktop geometry, mobile bottom navigation; developer indicator disabled after inspection. |
| Scope/whitespace | Pass | `git diff --check` clean; schema audit found no Project/Chapter/revision/conflict/session-state model; no later capability is claimed. |

### 4.8 Side-by-side Sub-gate 0 conformance audit

| Requirement | Actual evidence | Classification | Action |
| --- | --- | --- | --- |
| Supported TypeScript/server React baseline, commands, CI, environment validation | Pinned package/lock/config/CI; audit, lint, type, tests, build pass | Verified | None. |
| ADRs and module boundaries | Four ADRs plus architecture/security/migration documents | Verified | None. |
| External auth seam and internal identity | OIDC/development adapters; internal identity and session actor; real repository tests | Verified | None. |
| First-use workspace, role before domain services | Atomic repository provisioning and `requireActor`; E2E authenticated shell | Verified | None. |
| Ownership and child-ID discipline | Active `(workspaceId,userId)` membership query and cross-workspace denial; later child domains absent | Verified for current domain | Repeat at every later repository gate. |
| Stable errors/envelopes | Full code catalog and transport tests | Verified | None. |
| Content-safe logs and telemetry seams | Forbidden-key logger tests, metadata-only step ledger, metrics/trace seams | Verified | None. |
| 48px calm empty shell, no dashboard/story workflow | CSS geometry plus desktop/mobile E2E and visual inspection | Verified | None. |
| Exact Light/Dark tokens; Cream-ready | Token audit matches Bible 13.2; E2E theme switching | Verified | Cream remains specified but optional, as allowed. |
| Editor typography independent | Separate `--editor-font` token and preference fields; no editor yet | Verified seam | Concrete editor consumption belongs to Sub-gate 1. |
| Responsive/accessibility/i18n boundary | Desktop/tablet/mobile CSS, focus/reduced motion/ARIA, axe/E2E, messages module | Verified | Deep mobile editor behavior belongs to Sub-gates 1–3/15. |
| Security/operations baseline | Security headers, signed strict cookie, CSRF/rate-limit boundaries, safe secrets schema, audit model, archive/grace fields | Verified | Managed TLS/encryption/secret-store deployment is environment-owned and documented, not falsely claimed locally. |
| Migration/test harnesses and rollback | Real forward/rollback/forward database cycle; 32 tests, E2E, stress, coverage | Verified | None. |
| Writing-flow exit: authenticate to empty shell, no story workflow | Development-provider E2E exercises production-shaped adapter/service/repository/session/shell path | Verified | Production provider credentials are deployment configuration; adapter contract/build are verified. |

Doctrine questions for Sub-gate 0 all resolve safely: no structure/scenes/world/Capture/causality exists; no milestone ownership exists; no chronology/reference fact becomes causality; no prose can be auto-edited; client theme state is preference state, not story truth; no projection exists; no billing/quota exists; support systems cannot block a nonexistent editor; content-safe logging is enforced; no unbounded project/graph query exists; no AI exists; no later endpoint/provider is activated; directive and Semantic Zoom contracts are untouched; pricing is untouched; no non-V2 scope was added.

### 4.9 Deviations, repairs, and remaining gate work

- **Chronology deviation:** the Path entry was added after initial code patches. Repair: the entry records the deviation and full actual implementation rather than claiming pre-code chronology. It does not alter product behavior. Future entries must be committed before their product code; this control will be enforced before Sub-gate 1.
- **Toolchain repair:** TypeScript 7 was current but unsupported by the current Next ESLint stack; pinned supported TypeScript 6.0.3. jsdom 30 required a newer Node patch than the available supported Node 22.15 runtime; pinned jsdom 29.1.1. No product contract changed.
- **Migration repair:** removed unnecessary `pgcrypto` extension after disposable PostgreSQL rejected it; forward/rollback/forward verification then passed.
- **E2E harness repair:** port conflict, concurrent PGlite prepared-statement limits, and child-process shutdown made earlier runs non-passing. The final isolated single-worker hidden-server run returned exit code 0. The repository added concurrency recovery for first-use identity and verified eight concurrent attempts independently.
- **Remaining local gaps:** none for Sub-gate 0.
- **Remaining local or remote gaps:** none for Sub-gate 0. Sub-gate 1 becomes eligible only after this evidence-only ledger commit is pushed and remotely verified.

### 4.10 Git and remote evidence

- **Scoped diff:** only Phase 1/Sub-gate 0 application foundation, tests, generated Next guidance, and this ledger entry; `WorkPlan.md` is unchanged.
- **Branch:** `agent/workplan-subgates-audit`.
- **Content commit:** `8459d6601885e019c56f1c3d757c1d4f5645f618` — `Implement Sub-gate 0 foundation`.
- **Push:** `agent/workplan-subgates-audit` advanced from `eee9cf7` to `8459d66` on `https://github.com/InfernusReal/Mythra-V2.git`.
- **Remote verification:** local `HEAD` and `refs/heads/agent/workplan-subgates-audit` both resolved to `8459d6601885e019c56f1c3d757c1d4f5645f618` immediately after push.
- **Evidence-ledger commit:** `d0421ab61964aa406f6664f7e92bf156c67b463c` (`Record Sub-gate 0 evidence`), pushed and remotely verified; the next entry records it as S1's predecessor proof.
- **Rollback/revert point:** baseline `eee9cf73d9eef893a7f27190a57ca84047a35cc0` until the content commit exists.

## 5. Entry S1 — Project + Chapter + Editor Core

### 5.1 Pre-code identity and authorization

- **Date/time and timezone:** 12 August 2026, Asia/Karachi; recorded before Sub-gate 1 product code.
- **Work-plan phase:** Phase 1 — Trusted Writing Foundation.
- **Mandatory Sub-gate:** 1 — Project + Chapter + Editor Core.
- **Predecessor proof:** Sub-gate 0 content commit `8459d6601885e019c56f1c3d757c1d4f5645f618`; evidence commit and remote branch head `d0421ab61964aa406f6664f7e92bf156c67b463c`, verified with `git ls-remote`.
- **Baseline branch/commit:** `agent/workplan-subgates-audit` at `d0421ab61964aa406f6664f7e92bf156c67b463c`.
- **Bible scope:** sections 1–2, 8, 9, 13–18, 23–26, 29, 31, 33–36; roadmap Phase 1 and acceptance template 33.1; Appendix B document rules.
- **Authorized capability:** minimal Project title creation, optional-placement Chapter creation, versioned structured ChapterDocument with stable block IDs/reference-mark support, one active chapter route/read model, Mythra editor adapter, minimal toolbar, Focus mode, advisory word target, compact breadcrumbs, and reserved/hide-only keyboard seams.
- **Explicit exclusions:** no IndexedDB journal, autosave/version conflict UI, ChapterRevision/DraftConflict, recovery, continuation/session restoration, structure, Capture, or later-domain activation. Those remain locked to Sub-gates 2+.

### 5.2 Plan before code

- Add a separately reversible Project/Chapter migration with ownership, ordering, active-chapter, document-version, word-count, target, and explicit hard-stop opt-in fields; do not add durability tables.
- Define transport schemas and ChapterDocument domain invariants before routes. Keep Tiptap/ProseMirror types inside the editor adapter.
- Implement ownership-scoped repositories and services for minimal project creation, chapter creation with optional placement, one-chapter editor read, and metadata update. Routes remain thin and use stable envelopes.
- Implement Project title → dominant Write first chapter → New Chapter → immediate typing in a centered manuscript. Load one active chapter only.
- Add stable paragraph IDs, derived plain text/word count, invisible reference-mark schema support, tiny formatting toolbar, Focus mode, advisory target/delta, Project/optional Volume/Chapter breadcrumb, Return-to-Chapter history seam, and hidden rather than dead later commands.
- Every operational boundary receives a `Console trace S1-*` adjacent comment and content-safe structured log call. Editor input/prose/document JSON must never be logged.
- Verify SQL forward/rollback/forward, workspace isolation including indirect chapter IDs, domain/document migrations, route/service behavior, Unicode/IME, keyboard/focus, Light/Dark/mobile visuals, active-chapter-only loading, performance with a large document fixture, and the exact writing-flow exit.

### 5.3 Pre-code status

- **Code status:** not started when this entry was written.
- **Gate state:** eligible but locked until this entry is committed, pushed, and remotely verified.
- **Planned Git boundary:** separate Sub-gate 1 content commit and evidence-ledger commit after all gaps are repaired.

### 5.4 Files changed and exact responsibility

| File | Action | Responsibility and WorkPlan mapping |
| --- | --- | --- |
| `prisma/schema.prisma` | Modified | Added canonical `Project`/`Chapter`, statuses, workspace ownership, ordering, active chapter, versioned document, derived text/count, advisory target, explicit hard-stop, archive/grace fields, constraints, and indexes for section 5.1 Sub-gate 1. |
| `prisma/migrations/20260812170000_editor_core/migration.sql` | Created | Independently deployable Project/Chapter forward migration with database checks and ownership/ordering indexes. |
| `prisma/migrations/20260812170000_editor_core/rollback.sql` | Created | Capability-only rollback; removes Project/Chapter structures without touching Sub-gate 0 identity/audit/outbox state. |
| `domains/writing/domain/chapter-document.ts` | Created | Versioned `ChapterDocument` v1, UUID `blockId`, invisible `storyReference`, normalization, uniqueness, derived plain text/word count, advisory delta, and opt-in hard-stop calculation. |
| `domains/writing/domain/document-migrations.ts` | Created | Pure, testable rich-document migration dispatcher; rejects unknown document versions. |
| `domains/writing/application/ports.ts` | Created | Editor read model and repository interfaces independent from Prisma and Tiptap, including bounded adjacent-chapter IDs. |
| `domains/writing/application/commands.ts` | Created | Strict transport-independent schemas and orchestration for minimal projects, chapters, project listing, and one-chapter editor reads. |
| `domains/writing/infrastructure/prisma-writing-repository.ts` | Created | Workspace-scoped persistence, indirect child ownership guards, Project/Chapter transaction, active-chapter assignment, bounded listing, and adjacent navigation queries. |
| `lib/writing/runtime.ts` | Created | Composition root for repository/service construction. |
| `lib/editor/adapter.ts` | Created | `MythraEditorAdapter` boundary and validated Tiptap conversion; domain code imports no editor-library types. |
| `lib/commands/registry.ts` | Created | Central shortcut ownership registry: Sub-gate 0/1 commands active, future checkpoint/outline/milestone/context/Capture commands reserved and hidden. |
| `app/api/v2/projects/route.ts` | Created | Thin authenticated `POST /api/v2/projects` with stable success/error envelope and title-required validation. |
| `app/api/v2/projects/[id]/chapters/route.ts` | Created | Thin authenticated chapter create route with optional placement and stable envelopes. |
| `app/api/v2/chapters/[id]/editor/route.ts` | Created | Authenticated one-chapter editor read endpoint; returns 401/404 envelopes rather than navigation redirects. |
| `app/app/page.tsx` | Modified | Project home slice with dominant **Write first chapter**, no structural prerequisites, bounded project summaries, and return-to-active-chapter link. |
| `app/app/chapters/[id]/page.tsx` | Created | Server-owned chapter route that resolves actor and exactly one editor read model. |
| `components/projects/ProjectCreator.tsx` | Created | Title-first project/chapter flow, factual recoverable error display, content-safe transition trace, and editor navigation. |
| `components/editor/ChapterEditor.tsx` | Created | ProseMirror-compatible Tiptap editor, stable block extensions, reference mark, local state, tiny toolbar, counts/targets, hard stop, Focus/Escape, breadcrumbs, nearby switching, and content-safe client traces. |
| `components/shell/AppShell.tsx` | Modified | Allows the editor to report truthful `Local draft` status instead of `No document open`. |
| `components/shell/CommandPalette.tsx` | Modified | Preserves exact prior focus across keyboard/mouse open-close and adds content-safe lifecycle traces. |
| `app/globals.css` | Modified | Centered editor geometry, independent editor typography, toolbar/status/breadcrumb/switcher styling, focus mode, error status, and responsive behavior. |
| `package.json` | Modified | Added explicit editor database verification and rollback commands. No dependency version changed. |
| `scripts/verify-editor-core-db.ts` | Created | Real PostgreSQL verification for defaults, placement, active chapter, adjacent navigation, indirect read/write ownership, and rollback isolation. |
| `tests/unit/chapter-document.test.ts` | Created | Unicode, stable IDs, references, document versions, targets, and hard-stop invariants. |
| `tests/unit/command-registry.test.ts` | Created | Shortcut uniqueness, owner Sub-gates, and hidden future-command enforcement. |
| `tests/service/writing-service.test.ts` | Created | Title-required/optional-description schema, rejection of premature structural fields, one-read-model delegation, and title redaction. |
| `tests/stress/chapter-document.stress.test.ts` | Created | 10,000-block validation/derivation budget test. |
| `tests/e2e/editor-core.spec.ts` | Created | Exact title-to-keystroke flow, Unicode, toolbar/undo preservation, Focus/Escape, command focus, accessibility, content-redacted console, unauthenticated envelope, Dark/mobile visual. |
| `tests/e2e/foundation.spec.ts` | Modified | Preserved Sub-gate 0 shell/theme/mobile coverage after the legitimate Sub-gate 1 project action became available. |

No lockfile was regenerated because no dependency version changed. Prisma Client generation used the committed schema as input; generated output remains ignored and was reviewed indirectly through typecheck/build and real database execution.

### 5.5 Code and behavior implemented

- **Canonical domain and persistence:** `Project` is workspace-owned and title-required; description is optional. `Chapter` is project-owned with explicit sequence placement, status, schema/version fields, `bodyDocument`, derived `bodyText`/`wordCount`, advisory `targetWords`, disabled-by-default hard stop, archive field, and positive/nonnegative SQL checks. `activeChapterId` points to the most recently created chapter. No Sub-gate 2 tables exist.
- **Document contract:** the only supported persisted document is `ChapterDocument` schema version 1. Paragraph/heading blocks require unique UUID `blockId` values. Text nodes may contain `storyReference` marks whose IDs/types are metadata; plain-text derivation proves marks do not change visible prose. Unknown versions and duplicate IDs fail before editor use.
- **Ownership and bounds:** all Project writes include `workspaceId`; chapter creation first resolves `(projectId, workspaceId, ACTIVE)`; editor lookup traverses `Chapter -> Project.workspaceId`; project lists are capped at 50 by the service and 100 by repository defense. The read model loads one chapter plus two adjacent IDs, never a manuscript DOM.
- **Transaction boundary:** chapter insert and Project `activeChapterId` update occur in one Prisma transaction. Adjacent IDs are selected by ordered, indexed, same-project queries. S1 does not emit outbox events because no downstream derived domain is active.
- **API contract:** all three S1 endpoints resolve a session actor, return the established envelope, map invalid input to `VALIDATION`, absence/indirect ownership to `NOT_FOUND`, and unauthenticated calls to `UNAUTHENTICATED`. No raw error, document, title, or prose is returned in an error body.
- **Editor boundary and state:** only `lib/editor/adapter.ts` knows Tiptap JSON. The writing domain consumes `ChapterDocument`. The editor keeps the current document in memory only, labels it `Local draft`, and makes no durability claim. Stable block extensions preserve/create IDs without making references visible.
- **Writing flow:** Project Home always offers the title field and dominant **Write first chapter**. Successful creation opens `/app/chapters/{id}` and places a writable centered manuscript behind a tiny Bold/Italic/Undo/Redo toolbar. No genre, premise, volume, outline, scene, world, milestone, Capture, or causal setup is required.
- **Targets and limits:** word count and target delta are advisory. A character limit is enforced only when both the canonical `hardStopEnabled` flag and a positive `hardCharacterStop` exist; defaults are false/null. Rejected typing/paste retains current prose and shows a textual alert.
- **Navigation/focus:** breadcrumbs contain Project / Chapter; the optional Volume slot remains absent until its canonical domain exists. Nearby previous/next switching is bounded. Home links back to the active chapter. `Ctrl/Cmd+K` and `Ctrl/Cmd+Shift+F` are active; Escape restores manuscript focus. Future checkpoint, outline, milestone, context, and Capture shortcuts are registered as `reserved` with their owning Sub-gates and expose no dead controls.
- **Theme/accessibility/i18n:** Light/Dark/system theme behavior remains intact; editor typography uses `--editor-font`; visible focus, semantic toolbar/status/alert/navigation roles, multiline textbox naming, reduced-motion baseline, Unicode CJK/Arabic input, desktop and mobile layouts pass. Full IME hardening remains correctly owned by Sub-gate 15.
- **Failure behavior:** project/chapter failures remain on the form with a factual alert. Support/context/search/billing domains are absent and therefore cannot block typing. S1 local text is not promised across reload; IndexedDB/autosave/recovery/conflict handling remains locked to Sub-gate 2.
- **Truth separation:** Project/Chapter/document are canonical. Word count/plain text are declared derived fields and are recomputed on future durable writes. No hierarchy beyond Project/Chapter, chronology, causality, projection, analytics, AI, billing, quota, or entitlement was introduced.

### 5.6 Console trace ledger with exact source lines

Every operational trace has an immediately adjacent identifying comment. Direct browser/verifier records call `console.log`; server service records call the content-filtering logger and terminate at the single literal `console.log` transport in `lib/observability/logger.ts` comment line 15 / call line 16.

| Step | Comment line | Log call line | Event and content-safety proof |
| --- | --- | --- | --- |
| `S1-PROJECT-001` | `domains/writing/application/commands.ts:15` | `:16` via logger transport `lib/observability/logger.ts:16` | `project.created`; IDs/request only, title/description excluded. |
| `S1-CHAPTER-001` | `domains/writing/application/commands.ts:24` | `:25` via logger transport | `chapter.created`; IDs/version only, title/document excluded. |
| `S1-EDITOR-001` | `domains/writing/application/commands.ts:31` | `:32` via logger transport | `editor.read_model`; ID/found/version only. |
| `S1-FLOW-001` | `components/projects/ProjectCreator.tsx:39` | `:40` | First-chapter-ready IDs only. |
| `S1-EDITOR-CLIENT-001` | `components/editor/ChapterEditor.tsx:86` | `:87` | Editor ready; chapter ID/version only. |
| `S1-EDITOR-CLIENT-002` | `components/editor/ChapterEditor.tsx:93` | `:94` | Local change; only word/character counts, never text. |
| `S1-EDITOR-CLIENT-004` | `components/editor/ChapterEditor.tsx:103` | `:104` | Hard-stop typing rejection; configured limit only. |
| `S1-EDITOR-CLIENT-005` | `components/editor/ChapterEditor.tsx:114` | `:115` | Hard-stop paste rejection; clipboard omitted. |
| `S1-EDITOR-CLIENT-006` | `components/editor/ChapterEditor.tsx:127` | `:128` | Keyboard Focus toggle; boolean only. |
| `S1-EDITOR-CLIENT-007` | `components/editor/ChapterEditor.tsx:135` | `:136` | Escape focus-restoration request; chapter ID only. |
| `S1-EDITOR-CLIENT-003` | `components/editor/ChapterEditor.tsx:146` | `:147` | Button Focus toggle; boolean only. |
| `S1-COMMAND-001` | `components/shell/CommandPalette.tsx:14` | `:15` | Command palette opened; no selection/content. |
| `S1-COMMAND-002` | `components/shell/CommandPalette.tsx:20` | `:21` | Command palette closed; no selection/content. |
| `S1-DB-001` | `scripts/verify-editor-core-db.ts:61` | `:62` | Real constraint/ownership/placement verification; synthetic IDs/counts/version only. |
| `S1-DB-002` | `scripts/verify-editor-core-db.ts:90` | `:91` | Capability-only rollback verification; table count only. |

Automated evidence: the E2E captures all browser console records and asserts that neither its unique project title nor multilingual prose appears; the service test spies on the logger transport and asserts the private title is absent; the logger deny-list tests still reject `body`, `prose`, `content`, `documentJson`, `selectedText`, `captureValue`, and `noteBody` keys.

### 5.7 Validation and stress evidence

| Command/check | Result | Evidence and notes |
| --- | --- | --- |
| `npm.cmd run lint` | Pass | ESLint zero warnings after adding the exact hook dependency. |
| `npm.cmd run typecheck` | Pass | TypeScript `--noEmit`; adapter/domain/repository/API/UI contracts agree. |
| `npm.cmd run test:coverage` | Pass | 13 files, 42 tests; 94.32% statements, 85.71% branches, 94.73% functions, 96.09% lines. |
| `npm.cmd run test:stress` | Pass | 4 tests; includes 10,000 unique blocks under a 2,000 ms budget plus Sub-gate 0 logger/rate/session stress. |
| `npm.cmd run build` | Pass | Production Turbopack build, TypeScript, page collection, and eight static pages; S1 routes emitted as dynamic server routes. |
| `npm.cmd audit --audit-level=high` | Pass | Registry advisory audit: `found 0 vulnerabilities`. Initial sandboxed registry failure was rerun with approved network access. |
| `npm.cmd run db:validate` | Pass | Prisma schema valid. |
| `db:verify:editor -> db:rollback:editor -> db:verify:foundation -> db:deploy -> db:verify:editor` | Pass | Real PostgreSQL: S1 constraints/read-write isolation/defaults/placement/navigation pass; rollback leaves zero S1 tables; S0 still passes; S1 forward redeploy and repeat verification pass. |
| `npm.cmd run test:e2e` with isolated external server | Pass | 8 applicable passes, 4 intentional cross-project skips across desktop Chromium and Pixel 7. Covers title-to-keystroke, Unicode, toolbar/undo retention, focus, command return, accessibility, 401 envelope, Light/Dark/mobile. |
| Visual review | Pass | Inspected `test-results/editor-core-light.png` and `editor-core-mobile.png` at original resolution: centered prose, truthful status, compact navigation/toolbar, readable Dark mobile, no collision or clipping. Artifacts remain ignored. |
| Console/privacy scan | Pass | Every literal `console.log` in source has an adjacent `Console trace` comment; S1 E2E/service redaction assertions pass. |
| `git diff --check` and scoped status review | Pass | No whitespace errors; exactly the 29 S1 product/test files entered content commit. |

Test-repair history is retained honestly: the first browser run exposed a cold Turbopack compile exceeding the original five-second URL assertion and a hidden mobile theme control in the test. The assertion was raised to 20 seconds for cold compilation and the existing hidden select was exercised with Playwright's forced test option. A visual review then found the shell's inherited `No document open` label and an undo grouping risk; the product now shows `Local draft`, the test separates history groups by 600 ms, and it asserts original prose survives Undo. The final complete matrix passed.

### 5.8 Side-by-side WorkPlan conformance audit

| WorkPlan requirement | Evidence | Classification | Audit action |
| --- | --- | --- | --- |
| `POST /api/v2/projects`; title only required; dominant first-chapter action | Projects route, strict schema with optional description, ProjectCreator E2E | Verified | No structural fields accepted or required. |
| Chapter creation with optional placement | Chapter route/repository, `sequenceIndex`, real DB placement 5 | Verified | Positive/nonnegative and uniqueness constraints retained. |
| Versioned JSON, stable block IDs, derived text/count/schema version | ChapterDocument tests, schema/migration, DB defaults | Verified | Duplicate IDs/unknown versions rejected. |
| ProseMirror-compatible engine behind Mythra adapter | `lib/editor/adapter.ts`; domain has no Tiptap import | Verified | Adapter output revalidated before domain use. |
| One active chapter; never whole manuscript DOM | actor-scoped `getEditor`, single chapter route, active ID, adjacent IDs only | Verified | Stress test constructs one 10,000-block chapter, not multiple chapter DOMs. |
| Tiny toolbar; writer tools externalized | Four controls only | Verified | No later tool surface exposed. |
| Reference mark without visible rewrite | Domain/adapter mark and plain-text equality test | Verified | No entity UI/domain activated. |
| Command/Focus plumbing and hidden future commands | active keyboard E2E plus reserved command registry tests | Verified | Checkpoint/Capture/structure/context remain hidden until owner gates. |
| Focus does not disable command/future durability seams | Focus + command E2E; editor remains mounted; no durability code to disable | Verified | S2 attaches journal/autosave to the same persistent editor boundary. |
| Advisory target and explicit-only hard stop | pure invariant tests, UI delta/status, default false/null, input/paste guard | Verified | No default hard limit. |
| Compact breadcrumb, nearby switching, Return-to-Chapter seam | editor breadcrumb/switcher; Project active-chapter link | Verified | Volume omitted because optional domain does not exist yet. |
| Ownership through indirect child IDs | repository predicates plus real cross-workspace read/write denial | Verified | No fetch-by-ID then trust pattern. |
| Stable envelopes and safe errors | all S1 routes; unauthenticated E2E | Verified | Navigation redirect is not used inside APIs. |
| Independently reversible staged persistence | S1 migration/rollback drill and S0 verification after rollback | Verified | No S2/S3 tables or capability claims. |
| Unicode/keyboard/theme/mobile/a11y/content-safe logs | final E2E, coverage, visual inspection, scans | Verified | Full IME hardening stays in S15 as planned. |
| Sub-gate 0 precedes Sub-gate 1 | predecessor evidence commit remotely verified before S1 pre-code entry and content | Verified | Strict sequence preserved. |

Doctrine answers: no structure, scene, world, Capture, filing, milestone, causality, timeline, reference UI, billing, AI, or quota became mandatory or active. No hierarchy/reference fact became causality. No structural/causal write edits prose. No cache/projection exists as canonical truth. No stale derived view is presented as authoritative; the only client state is explicitly `Local draft`. Support failures cannot block the editor because no support subsystem is invoked. Logs/tests exclude content. Lists and navigation are bounded. No later endpoint, provider, conversion, directive, Semantic Zoom, pricing, entitlement, or proposal capability was activated. No non-V2 scope was added.

### 5.9 Deviations, gaps, repair, and gate result

- **Pre-code plan deviation:** the pre-code text mentioned a metadata update, but WorkPlan Sub-gate 1 requires creation/read/editor only. No premature metadata endpoint was implemented. This narrows execution to the authorized capability and is not a product gap.
- **Audit repairs completed before pass:** stable API authentication envelopes; explicit hard-stop typing/paste enforcement; exact command focus restoration; hidden shortcut registry; nearby navigation read seam; truthful editor save label; responsive breadcrumb truncation; cold-build E2E tolerance; mobile hidden-control test method; undo retention assertion.
- **WorkPlan correction required:** none. Implementation follows the already audited plan without contradiction.
- **Remaining Sub-gate 1 gap:** none.
- **Planned-later, not gaps:** IndexedDB, autosave, checkpoints, conflicts/recovery (Sub-gate 2); continuation/cursor/scroll restoration (Sub-gate 3); optional Volume and Structure (Sub-gate 4); full mobile/accessibility/IME hardening (Sub-gate 15).
- **Gate result:** **PASS — Sub-gate 1 is Verified, committed, pushed, and remotely confirmed.** Sub-gate 2 becomes eligible only after this evidence-ledger commit is also pushed and verified.

### 5.10 Git and remote evidence

- **Branch:** `agent/workplan-subgates-audit`.
- **Pre-code ledger commit:** `c8b4a0859ea2a53c668a3bf87233156d92cbffa6` — `Plan Sub-gate 1 editor core`, pushed and remotely verified before S1 product code.
- **Content commit:** `0883070a6ba7cc04c285c1adce3652107a5d1511` — `Implement Sub-gate 1 editor core`.
- **Commit scope:** 29 files, 1,014 insertions, 14 deletions; `git diff --cached --check` passed.
- **Push result:** remote branch advanced `c8b4a08..0883070`.
- **Remote verification:** local `HEAD` and `git ls-remote origin refs/heads/agent/workplan-subgates-audit` both returned `0883070a6ba7cc04c285c1adce3652107a5d1511` immediately after push.
- **Remote URL:** `https://github.com/InfernusReal/Mythra-V2.git`; existing draft PR #1 tracks this branch.
- **Rollback/revert point:** Sub-gate 0 evidence commit `d0421ab61964aa406f6664f7e92bf156c67b463c`; SQL rollback is `prisma/migrations/20260812170000_editor_core/rollback.sql` after preserving any user chapters.
- **Evidence-ledger commit:** `bee0dae6b77faa59d33f6ecf2a425afcec847243` (`Record Sub-gate 1 evidence`), pushed and remotely verified; the S2 entry records it as predecessor proof.

## 6. Entry S2 — Durability

### 6.1 Pre-code identity and authorization

- **Date/time and timezone:** 12 August 2026, Asia/Karachi; recorded before Sub-gate 2 product code.
- **Work-plan phase:** Phase 1 — Trusted Writing Foundation.
- **Mandatory Sub-gate:** 2 — Durability.
- **Predecessor proof:** Sub-gate 1 content commit `0883070a6ba7cc04c285c1adce3652107a5d1511`; evidence commit and remote branch head `bee0dae6b77faa59d33f6ecf2a425afcec847243`, verified with `git ls-remote`.
- **Baseline branch/commit:** `agent/workplan-subgates-audit` at `bee0dae6b77faa59d33f6ecf2a425afcec847243`.
- **Bible scope:** sections 8.2–8.3, 17.1/17.6, 18.2–18.4, 19.1–19.3, 20, 23–26, 29, 31–36; roadmap Phase 2/Durability and Appendix B document rules.
- **Authorized capability:** local IndexedDB journal, optimistic autosave with `baseVersion`/`clientSaveId`, idempotency, explicit checkpoint revisions, conflict variants, recovery copy, truthful save-state UI, and failure recovery.
- **Explicit exclusions:** no continuation Project Home/session cursor/scroll restoration (Sub-gate 3), structure, context, Capture, or later-domain capability.

### 6.2 Plan before code

- Add independently reversible `ChapterRevision`, `DraftConflict`, and save-idempotency persistence with workspace-indirect ownership, monotonic versions, unique retry keys, checkpoint labels/reasons, and both local/server conflict variants.
- Define save/checkpoint/conflict transport schemas and state-machine types before routes. Server writes must derive `bodyText`/`wordCount` from validated `ChapterDocument`; clients never submit authoritative derived values.
- Implement `PUT /api/v2/chapters/{id}/draft`, checkpoint, conflict-resolution, and recovery-copy operations through services/repositories and the stable envelope/error contract.
- Implement a chapter-scoped IndexedDB journal with debounced writes, pending save IDs, version, selection/scroll seam, bounded retention, and content-safe metadata logging. Local state remains authoritative until server acknowledgment.
- Implement states `CLEAN`, `DIRTY_LOCAL`, `SAVING`, `OFFLINE_DIRTY`, `CONFLICT`, and `RECOVERABLE_LOCAL`; never silently last-write-wins. Offer Compare, Keep Local as New Version, Keep Server, and Duplicate as Recovery Copy.
- Activate `Ctrl/Cmd+S` only when checkpoint behavior is real. Preserve Focus mode and command-palette operation while journal/autosave remains mounted.
- Add adjacent `Console trace S2-*` comments/log calls at every durability transition and boundary; never log document/prose/selection/clipboard values.
- Verify reload, close-before-ack journal survival, offline/network failure/retry, duplicate retry idempotency, two-device version conflict, all four conflict actions, checkpoint revision semantics, ownership, rollback/forward, Unicode/IME, large document, and content redaction.

### 6.3 Pre-code status

- **Code status:** not started when this entry was written.
- **Gate state:** eligible but locked until this pre-code entry is committed, pushed, and remotely verified.
- **Planned Git boundary:** separate Sub-gate 2 content commit and evidence-ledger commit after the never-lose-text gate and conformance audit pass.

### 6.4 Files changed

The content commit changes 30 files (1,218 insertions, 12 deletions). The bounded groups and precise purposes are:

| Files | Action | Purpose and WorkPlan mapping |
| --- | --- | --- |
| `prisma/schema.prisma`; `prisma/migrations/20260812190000_durability/{migration.sql,rollback.sql}` | Modified/created | Add independently reversible `ChapterRevision`, `DraftConflict`, and `ChapterSaveReceipt` durability persistence, constraints, indexes, and relations for Sub-gate 2 only. |
| `domains/writing/application/{durability-ports.ts,durability.ts}`; `domains/writing/infrastructure/prisma-durability-repository.ts`; `lib/writing/runtime.ts` | Created/modified | Define strict durability ports/application orchestration and a workspace-owned, serializable, optimistic/idempotent PostgreSQL implementation. |
| `app/api/v2/chapters/[id]/{draft,checkpoint}/route.ts`; `app/api/v2/draft-conflicts/[id]/route.ts`; `lib/contracts/errors.ts` | Created/modified | Add thin validated save/checkpoint/conflict routes using stable envelopes and explicit retryable/integrity codes. |
| `lib/indexed-db/draft-journal.ts`; `lib/writing/{save-state-machine.ts,use-durable-chapter.ts}` | Created | Add the chapter-scoped IndexedDB journal, explicit save state machine, autosave/retry/checkpoint/conflict lifecycle, and local recovery. |
| `components/editor/{ChapterEditor.tsx,SaveIndicator.tsx}`; `components/shell/AppShell.tsx`; `app/globals.css` | Modified/created | Integrate durability without remounting the editor; provide truthful global state, checkpoint, Compare and all resolution controls; preserve desktop/mobile writing. |
| `domains/writing/domain/chapter-document.ts`; `lib/editor/adapter.ts` | Modified | Preserve the editor/domain boundary while accepting the existing bold, italic, and reference marks in validated `ChapterDocument` JSON. |
| `app/api/v2/auth/development/route.ts` | Modified | Isolate browser-test sign-in traffic from the production limiter: production remains 10 requests/window; nonproduction uses 1,000. |
| `scripts/verify-durability-db.ts`; `package.json` | Created/modified | Add real-PostgreSQL forward/rollback, idempotency, concurrency, conflict, revision, recovery, and ownership verification commands. |
| `tests/e2e/durability.spec.ts`; `tests/service/durability-service.test.ts`; `tests/unit/{draft-journal,save-state-machine,chapter-document}.test.ts`; existing S0/S1 E2Es | Created/modified | Exercise never-lose-text flows, state and bounded-journal behavior, content redaction, Unicode/rich document validity, and regression compatibility. |

Generated SQL was derived from the reviewed Prisma input and then manually checked for UUID/JSONB defaults, unique retry keys, foreign-key actions, check constraints, and reverse dependency order. No S3 continuation table or later-domain table was added.

### 6.5 Code and behavior implemented

- **Canonical durability:** a valid save must carry `baseVersion`, a stable `clientSaveId`, and validated versioned `ChapterDocument`. `bodyText` and `wordCount` are derived server-side. A serializable transaction compares the canonical version and increments it exactly once. A matching retry receipt returns the original result; a reused ID with different content fails integrity validation.
- **Conflict safety:** a stale base creates a durable conflict containing both local and server variants. The conflict is committed before `CONFLICT` is returned. Resolution is author-selected: Keep Server closes without mutation; Keep Local writes a new monotonic version and archives the displaced server form; Duplicate creates a recovery chapter; Compare is an explicit two-pane UI and does not write.
- **Journal/recovery:** one IndexedDB record per chapter is updated after a 75 ms debounce and flushed before every network request. Recent journal storage is bounded to 100 records. Memory and local journal stay authoritative until a matching server acknowledgement; the same pending save ID is reused after a response-loss retry.
- **Save states:** `CLEAN`, `DIRTY_LOCAL`, `SAVING`, `OFFLINE_DIRTY`, `CONFLICT`, and `RECOVERABLE_LOCAL` are explicit transitions. The global command bar displays one calm state label. Offline/network failures retain content and retry on the browser `online` event.
- **Checkpoint policy:** manual `Ctrl/Cmd+S`, author labels, session visibility boundaries, significant 15-minute intervals, and an explicit destructive-action seam create checkpoints. Retries use unique IDs and `skipDuplicates`, preventing permanent revisions per keystroke.
- **Security/ownership/privacy:** every repository operation traverses workspace/project ownership. Neither document variants, prose, selection, clipboard, nor error payloads enter telemetry. Conflict records are inaccessible cross-workspace. Production auth throttling is unchanged.
- **Degraded behavior:** journal or server dependency failure leaves the editor writable and visibly local/offline; context, search, billing, analytics, and continuation were neither imported nor required. Focus mode keeps the same mounted durability hook.
- **UI and accessibility:** checkpoint and conflict controls are native buttons with factual labels. Light/dark desktop and 390 px mobile layouts retain the global status and Commands control. The editor remains keyboard operable and contenteditable; Unicode/rich document input remains accepted.

### 6.6 Console trace inventory

Every S2 transition/boundary has an adjacent identifying comment. Line references are for content commit `674ff4895a0cab50f8b6f30fbe800bbc97e52568`; the comment is on the first line shown and its `console.log`/central logger call is on the following line unless stated.

| Trace | Comment / emission location | What is emitted; content exclusion |
| --- | --- | --- |
| `S2-SAVE-001` | `domains/writing/application/durability.ts:20–21` | Request/workspace/chapter IDs, version, retry ID, replay flag, derived word count; no document/prose. Central logger terminates at `lib/observability/logger.ts:16`. |
| `S2-CHECKPOINT-001` | `domains/writing/application/durability.ts:27–28` | IDs, version, replay flag; no label/document. |
| `S2-CONFLICT-001` | `domains/writing/application/durability.ts:34–35` | Authorized lookup metadata and server version; no variants. |
| `S2-CONFLICT-002` | `domains/writing/application/durability.ts:42–43` | Resolution enum, IDs/version/recovery ID; no variants. |
| `S2-JOURNAL-002` | `lib/indexed-db/draft-journal.ts:46–47` | Read result, state and base version; no journal document. |
| `S2-JOURNAL-001` | `lib/indexed-db/draft-journal.ts:65–66` | Chapter/state/base version/pending-ID boolean; no document. |
| `S2-JOURNAL-003` | `lib/indexed-db/draft-journal.ts:75–76` | Cleared chapter ID only. |
| `S2-CLIENT-003` | `lib/writing/use-durable-chapter.ts:71–72` | Conflict ID/server version; no variants. |
| `S2-CLIENT-001` | `lib/writing/use-durable-chapter.ts:98–99` | Save/checkpoint start IDs and base version; no document. |
| `S2-CLIENT-002` | `lib/writing/use-durable-chapter.ts:120–121` | Acknowledged version/change flag; no document. |
| `S2-CLIENT-004` | `lib/writing/use-durable-chapter.ts:126–127` | Locally retained state metadata; error and document excluded. |
| `S2-CLIENT-007` | `lib/writing/use-durable-chapter.ts:144–145` | Global state transition enum only. |
| `S2-CLIENT-005` | `lib/writing/use-durable-chapter.ts:158–159` | Recovery metadata; recovered document excluded. |
| `S2-CLIENT-008` | `lib/writing/use-durable-chapter.ts:167–168` | Checkpoint lifecycle reason and chapter ID; prose excluded. |
| `S2-CLIENT-006` | `lib/writing/use-durable-chapter.ts:218–219` | Explicit resolution result metadata; documents excluded. |
| `S2-DB-001` | `scripts/verify-durability-db.ts:86–87` | Aggregate verification values and synthetic IDs; no content. |
| `S2-DB-002` | `scripts/verify-durability-db.ts:101–102` | Rollback table counts only. |

The browser E2E collects console output and asserts that its unique manuscript sentinel is absent. Trace comments explicitly state the boundary purpose and exclusion rule; no S2 log uses a document, prose, local/server variant, selection, clipboard, or raw exception as a field.

### 6.7 Validation and stress evidence

| Command/check | Result | Exact evidence |
| --- | --- | --- |
| `npm.cmd run lint` | Pass | ESLint completed with zero warnings/errors. |
| `npm.cmd run typecheck` | Pass | TypeScript no-emit check completed with zero diagnostics. |
| `npm.cmd run test:coverage` | Pass | 16 files/49 tests; statements 91.34%, branches 82.70%, functions 86.20%, lines 94.50%. |
| `npm.cmd run test:stress` | Pass | 2 files/4 tests, including a 10,000-block document and foundation stress. |
| Full Playwright suite | Pass | 24 scenarios: 14 passed and 10 intentional project/browser matrix skips; all S0/S1 regressions and six S2 never-lose-text scenarios passed. |
| S2 E2E: canonical reload | Pass | Structured Unicode draft autosaved and reloaded from canonical server state. |
| S2 E2E: failed acknowledgement/page close | Pass | IndexedDB journal recovered after a failed acknowledgement and new page. |
| S2 E2E: close before server response | Pass | Pending journal survived closing before server acknowledgement. |
| S2 E2E: offline/retry | Pass | Offline edit remained writable/local and synchronized after connectivity returned. |
| S2 E2E: two devices/conflict | Pass | Both variants remained available; Compare and Keep Local produced a new version. |
| S2 E2E: checkpoint/redaction | Pass | `Ctrl+S` created exactly one explicit checkpoint and console text excluded the manuscript sentinel. |
| `npm.cmd run build` | Pass | Production Next build completed; draft, checkpoint, and conflict routes were emitted. |
| `npm.cmd audit --audit-level=high` | Pass | Zero known vulnerabilities. |
| `db:verify:durability -> db:rollback:durability -> db:verify:editor -> db:deploy -> db:verify:durability` | Pass | Forward version 5; receipt replay true; 3 conflict paths; 2 revisions; recovery copy true; same-base concurrency had 2 attempts/1 winner/1 conflict; cross-workspace save false. Rollback removed 0 remaining durability tables and preserved both S1 tables; redeploy and reverify passed. |
| Desktop light visual review | Pass | `test-results/editor-core-light.png`: centered manuscript, global Saved locally, checkpoint toolbar control, Autosave on footer. |
| Mobile dark visual review at 390 px | Pass | `test-results/editor-core-mobile.png`: Mythra, Saved locally, and Commands visible without collision; toolbar/editor readable. |

### 6.8 Side-by-side conformance audit

| WorkPlan requirement | Actual evidence | Classification |
| --- | --- | --- |
| Memory plus debounced IndexedDB journal; local authoritative until acknowledgement | `draft-journal.ts`, `use-durable-chapter.ts`; close/recovery E2Es | Verified |
| Six explicit, calm save states | `save-state-machine.ts`, global `SaveIndicator`; unit/E2E/visual checks | Verified |
| `baseVersion` + `clientSaveId`, monotonic increment, idempotent retry | strict schemas, receipt uniqueness, serializable transaction; DB verifier | Verified |
| Preserve both conflict variants; Compare/Keep Local/Keep Server/Duplicate | conflict persistence, route, UI, three mutation branches; service/DB/E2E checks | Verified |
| Explicit and policy checkpoints, no revision per keystroke | manual/lifecycle/significant/destructive seam logic, unique checkpoint IDs; E2E/DB verifier | Verified |
| Independently reversible S2 persistence only | migration and rollback SQL; full rollback/redeploy drill | Verified |
| Reload, close, offline/network, retry and two-device conflict retain recoverable text | six durability E2Es plus DB concurrency verifier | Verified |
| Logs/traces exclude author content | adjacent trace inventory and sentinel browser assertion | Verified |
| Ownership and failures do not block writing | workspace-scoped queries, cross-workspace DB denial, local/offline states | Verified |
| No continuation or later-domain activation | no session/continuation/structure/context/capture/search/billing model or route in commit | Verified |

Doctrine answers: structure/scenes/world/Capture/causality remain optional and absent; no milestone or causality type exists; no structural or causal write edits prose; PostgreSQL `Chapter` remains canonical and IndexedDB is explicitly a pending/recovery journal; no derived projection was introduced; quota/downgrade/export behavior is untouched; support/context/search/billing/analytics are not imported into the editor; no log or test artifact emits content; reads remain single-chapter or bounded to 100 journals; no AI tool exists; no later endpoint/provider/context card is active; directive/semantic-zoom/pricing rules are unchanged and not instantiated by S2; no non-V2 product scope was added.

### 6.9 Deviations, findings, and repairs

The final implementation has no unresolved WorkPlan deviation. Audit iterations found and repaired the following before the gate result:

1. Journal recovery initially hydrated without scheduling the recovered content for save; recovery now marks it dirty and schedules autosave, with E2E proof.
2. Response-loss retry initially generated a fresh `clientSaveId`; a pending ID is now retained and reused until acknowledgement.
3. Conflict creation initially threw inside the transaction, which would roll back the conflict record; the transaction now returns an outcome and raises the transport conflict only after commit.
4. Checkpoint retry could race to duplicate creation; `createMany(...skipDuplicates)` plus canonical lookup makes it idempotent.
5. Durability validation exposed that existing bold/italic editor marks were missing from the domain contract; the versioned schema now accepts bold, italic, and reference marks and tests cover them.
6. Browser-suite authentication exhausted the development-only limiter; the production limit remains 10 while nonproduction is isolated at 1,000 for deterministic test traffic.
7. A transient footer label could disagree with the canonical command-bar save state; the footer now states the stable policy `Autosave on`, leaving one truthful state display.
8. Mobile initially hid status and then clipped Commands; compact CSS now keeps both visible, confirmed by isolated mobile E2E and visual inspection.
9. A conflict comparison assertion was globally ambiguous; the test now scopes it to the comparison panel without changing behavior.

`WorkPlan.md` required no correction. At this entry's point in time only Sub-gate 3 remained in Phase 1; sections 7 and 8 now record its completion and the macro pass.

### 6.10 Gate and Git evidence

- **Gate result:** **PASS — Sub-gate 2 never-lose-text durability is implemented and verified.** This is not the Phase 1 macro pass; Sub-gate 3 remains mandatory.
- **Branch:** `agent/workplan-subgates-audit`.
- **Pre-code ledger commit:** `60ed5d3d03130ba508fb7c42809a985a71b54dfb` — `Plan Sub-gate 2 durability`, pushed and remotely verified before S2 product code.
- **Content commit:** `674ff4895a0cab50f8b6f30fbe800bbc97e52568` — `Implement Sub-gate 2 durability`.
- **Commit scope:** 30 files, 1,218 insertions, 12 deletions; staged diff checking passed.
- **Push result:** remote branch advanced `60ed5d3..674ff48`.
- **Remote verification:** local `HEAD` and `git ls-remote origin refs/heads/agent/workplan-subgates-audit` both returned `674ff4895a0cab50f8b6f30fbe800bbc97e52568` immediately after push.
- **Remote URL/PR:** `https://github.com/InfernusReal/Mythra-V2.git`; draft PR #1 tracks this branch.
- **Rollback/revert point:** S1 evidence commit `bee0dae6b77faa59d33f6ecf2a425afcec847243`; SQL rollback is `prisma/migrations/20260812190000_durability/rollback.sql` after preserving user drafts/revisions/conflicts.
- **Evidence-ledger commit:** `8e011bef6409656e5a1c443355b3ccf35dd5462d` (`Record Sub-gate 2 evidence`), pushed and remotely verified; the S3 pre-code entry records it as predecessor proof.

## 7. Entry S3 — Continuation

### 7.1 Pre-code identity and authorization

- **Date/time and timezone:** 12 August 2026, Asia/Karachi; recorded before Sub-gate 3 product code.
- **Work-plan phase:** Phase 1 — Trusted Writing Foundation.
- **Mandatory Sub-gate:** 3 — Continuation.
- **Predecessor proof:** Sub-gate 2 content commit `674ff4895a0cab50f8b6f30fbe800bbc97e52568`; evidence commit and remote branch head `8e011bef6409656e5a1c443355b3ccf35dd5462d`, verified with `git ls-remote`.
- **Baseline branch/commit:** `agent/workplan-subgates-audit` at `8e011bef6409656e5a1c443355b3ccf35dd5462d`.
- **Bible scope:** sections 1.3, 8.2–8.3, 9.1–9.3, 13–19, 23–26, 29, 31–36; roadmap Phase 3/Continuation and acceptance template 33.1.
- **Authorized capability:** exact active-chapter/position restoration, a continuation/session record, `ProjectContinuationReadModel`, Project Home, recent chapter context, empty-project behavior, one-click Continue Writing, independent context mode/pin seams, and offline active-editor preservation.
- **Explicit exclusions:** no Capture, context resolver/cards, structure, search, analytics event collection, outline, milestone, billing, or later endpoint activation.

### 7.2 Plan before code

- Add an independently reversible `WritingSessionState` table keyed by user/project with workspace-owned project and active-chapter validation; store block ID, document selection positions, scroll anchor, context-panel mode seam, bounded pin-ID seam, and `capturedAt` independent of analytics.
- Define `ProjectContinuationReadModel`, strict update transport schema, repository port, service, and content-safe S3 logs before routes/UI. Project reads remain ownership-scoped and recent chapters are bounded.
- Implement `GET/PUT /api/v2/projects/{id}/continuation`. A stale/missing/archived active chapter falls back deterministically to the latest eligible chapter; an empty project returns a factual model with no fabricated destination.
- Implement Project Home at `/app/projects/{id}` with the dominant Continue Writing action, active/recent chapter facts, and an empty-project Write first chapter path. Change the project list to route through Project Home while preserving direct return-to-chapter utility.
- Implement a client continuation controller that persists a minimal local session snapshot synchronously, debounces the server seam, and restores only after stable editor hydration. Restore a stable block/cursor anchor first, bounded selection as fallback, then scroll; start session tracking without changing the S2 journal/canonical content contract.
- Keep context mode and pin IDs inert data seams. They must restore without mounting a resolver or implying that context is available.
- Preserve required load order: server shell/read model; S2 local journal recovery/version comparison; stable editor hydration; inert context seed; autosave/journal; session restoration. No analytics or projection fetch may enter the critical path.
- Add adjacent `Console trace S3-*` comments/log calls at every continuation transition/boundary. Emit IDs, counts, enums, positions, and timestamps only; never prose/document/selection text.
- Verify exact active chapter, cursor/block, scroll and context-seam round trips; one-click return; empty project; local fallback; ownership; bounded recent/pins; failure non-blocking behavior; S0–S2 regression; migration forward/rollback/redeploy; desktop/mobile/theme/keyboard/Unicode; content-redacted console output.

### 7.3 Planned files and budgets

- **Persistence:** `prisma/schema.prisma`, `prisma/migrations/20260812210000_continuation/{migration.sql,rollback.sql}`.
- **Domain/application/infrastructure:** continuation types/ports/service under `domains/writing`, ownership-scoped Prisma repository integration, runtime composition.
- **Routes/screens/components:** continuation API, Project Home route/component, editor session controller, editor integration, bounded layout CSS and project navigation updates.
- **Tests/scripts:** continuation unit/service/E2E suites and a real-PostgreSQL verification/rollback script; existing regression suites remain active.
- **Measurable bounds:** at most 5 recent chapters; at most 50 inert pin IDs; update input positions are nonnegative bounded integers; local storage holds one metadata-only session record per project and no manuscript body; server session writes debounce at 500 ms or slower; no unbounded project/manuscript load.
- **Exit measurement:** a returning author reaches the prior active chapter and restored editor selection/scroll working position through one Project Home action; empty project has an unambiguous first-chapter action; offline edits continue through S2; all verification layers and the Phase 1 macro audit pass.

### 7.4 Pre-code status

- **Code status:** not started when this entry was written.
- **Gate state:** eligible but locked until this pre-code entry is committed, pushed, and remotely verified.
- **Planned Git boundary:** separate S3 content commit, S3 evidence-ledger commit, and Phase 1 side-by-side macro-audit commit after all four original capability gates pass.

### 7.5 Files changed

The S3 content commit changes 23 files (778 insertions, 18 deletions):

| Files | Action | Purpose and WorkPlan mapping |
| --- | --- | --- |
| `prisma/schema.prisma`; `prisma/migrations/20260812210000_continuation/{migration.sql,rollback.sql}` | Modified/created | Add only the independently reversible per-author `WritingSessionState` persistence for active chapter, block/cursor/selection, scroll, inert panel/pin seams, and independent timestamp. |
| `domains/writing/application/{continuation-ports.ts,continuation.ts}`; `domains/writing/infrastructure/prisma-continuation-repository.ts`; `lib/writing/runtime.ts` | Created/modified | Define and implement the bounded `ProjectContinuationReadModel`, strict write contract, content-safe service, ownership guards, newest-write protection, and deterministic fallback. |
| `app/api/v2/projects/[id]/continuation/route.ts` | Created | Add thin authenticated GET/PUT continuation transport with stable envelopes and validation. |
| `lib/writing/use-writing-continuation.ts`; `lib/writing/use-durable-chapter.ts`; `components/editor/ChapterEditor.tsx`; `app/app/chapters/[id]/page.tsx` | Created/modified | Restore only after S2 journal hydration, persist metadata locally/server-side, repair stable block IDs, restore focus/selection/scroll, and leave canonical content/autosave intact. |
| `app/app/projects/[id]/page.tsx`; `components/projects/StartFirstChapter.tsx`; `app/app/page.tsx`; `app/globals.css` | Created/modified | Add Project Home, dominant Continue Writing, bounded recent chapters, empty-project action, and responsive Light/Dark layout. |
| `lib/db/prisma.ts`; `app/layout.tsx` | Modified | Preserve production pool concurrency while serializing the disposable nonproduction PGlite adapter; keep pre-interactive theme bootstrap stable across client navigation. |
| `scripts/verify-continuation-db.ts`; `package.json` | Created/modified | Add real-PostgreSQL continuation verification and rollback commands. |
| `tests/{unit/continuation-contract,service/continuation-service,e2e/continuation}.test/spec.ts` | Created | Verify strict/bounded/redacted contracts, exact return, 503 local fallback, empty project, accessibility, mobile Dark visuals, ownership, freshness and rollback. |

No Capture, context resolver/card, structure, search, analytics, billing, outline, milestone, timeline, entity-state, causal, directive, or Semantic Zoom implementation appears in this commit. `WorkPlan.md` and prior evidence entries were not part of the content commit.

### 7.6 Code and behavior implemented

- **Durable contract:** one `WritingSessionState` per `userId + projectId`; direct foreign keys cover user/workspace/project/chapter, SQL checks positions/modes/pin array, repository guards prove project workspace and chapter project ownership, and a serializable transaction ignores delayed positions older than the stored `capturedAt`.
- **Read model:** `ProjectContinuationReadModel` contains project identity, at most five recent eligible chapters, one active summary or null, and complete session metadata. A stored active chapter outside the recent window is still retrieved exactly. Missing/archived session targets fall back to the project active chapter and then latest eligible recent chapter; an empty project remains empty.
- **Load order:** the server resolves one editor and continuation model. S2 first hydrates canonical/local journal state and reports `durableReady`; only then S3 chooses newer valid local/server metadata, restores block/cursor/selection/scroll, focuses the editor, and starts metadata tracking. No analytics/projection/context fetch is present.
- **Exact local continuation:** localStorage contains one metadata-only record per project, validated through the same strict Zod schema as server input. It contains no chapter document or prose. Local writes are immediate; server writes debounce at 600 ms, retry on `online`, use `keepalive`, and never block editor typing.
- **Stable anchors:** a ProseMirror append transaction assigns a new UUID to missing or duplicate paragraph/heading block IDs before the domain adapter emits a document. This closes the split-paragraph duplicate-ID edge while preserving all existing IDs.
- **Navigation and scroll:** scroll/selection updates maintain the latest snapshot. In-app link intent freezes that snapshot before browser navigation resets scroll. Restoration uses a matching stable block plus cursor offset first, bounded document positions as fallback, then a double-animation-frame scroll restore.
- **Project Home:** `/app/projects/{id}` provides the single visually dominant Continue Writing action, factual last-position copy, recent chapters with word counts, and an empty-project Write first chapter action. The project list now leads through Project Home; editor breadcrumbs return there.
- **Context seam:** `CLOSED | CONTEXT | PINS` and at most 50 UUID pins round-trip as inert metadata only. No resolver, card, source object, or claim of available context exists.
- **Offline/degraded behavior:** S2 keeps active-chapter content writable offline. S3 retains session metadata locally if offline or the continuation endpoint returns 503. A failed continuation dependency never changes save state or blocks canonical autosave.
- **Production/nonproduction database behavior:** production retains a 10-connection pool. The disposable Prisma Dev/PGlite environment uses one connection because its wire emulator mishandles concurrent unnamed prepared statements; this constraint is not applied to production.
- **Privacy/security:** server logs pass the strict forbidden-key guard and client logs include only IDs, numeric positions, enum/state, counts, source, and timestamps. Tests assert manuscript sentinels are absent. Recent chapters and pins are bounded; no whole-manuscript/project graph is loaded.

### 7.7 Console trace inventory

Line references are exact for content commit `dd27be8b5f2a6be9a1e2235da47dcb34b490cc61`; every comment is adjacent to the emission on the next line.

| Trace | Comment / log line | Evidence and exclusion |
| --- | --- | --- |
| `S3-CONTINUATION-001` | `domains/writing/application/continuation.ts:11–12` | Read-model IDs/found/count/panel mode; no titles/documents. Central transport remains `lib/observability/logger.ts:16`. |
| `S3-CONTINUATION-002` | `domains/writing/application/continuation.ts:19–20` | Position numbers/IDs/mode/count/time; no selection text or content. |
| `S3-HOME-001` | `app/app/projects/[id]/page.tsx:14–15` | Project Home IDs and recent count only. |
| `S3-HOME-CLIENT-001` | `components/projects/StartFirstChapter.tsx:17–18` | Project/chapter IDs only. |
| `S3-BLOCK-001` | `components/editor/ChapterEditor.tsx:77–78` | Count of repaired anchors only; no block prose. |
| `S3-CLIENT-001` | `lib/writing/use-writing-continuation.ts:70–71` | Local metadata lookup result/time; no manuscript. |
| `S3-CLIENT-002` | `lib/writing/use-writing-continuation.ts:79–80` | Restored IDs/positions/scroll/source; no selection text. |
| `S3-CLIENT-005` offline | `lib/writing/use-writing-continuation.ts:85–86` | Offline defer reason and IDs only. |
| `S3-CLIENT-004` | `lib/writing/use-writing-continuation.ts:92–93` | Server acknowledgement IDs/time only. |
| `S3-CLIENT-005` dependency | `lib/writing/use-writing-continuation.ts:95–96` | Dependency defer reason; raw error/content excluded. |
| `S3-CLIENT-003` | `lib/writing/use-writing-continuation.ts:104–105` | Local position/mode/count metadata; document and selection text excluded. |
| `S3-CLIENT-007` | `lib/writing/use-writing-continuation.ts:119–120` | Navigation freeze IDs/time only. |
| `S3-CLIENT-006` | `lib/writing/use-writing-continuation.ts:132–133` | Final metadata flush IDs/time only. |
| `S3-DB-001` | `scripts/verify-continuation-db.ts:48–49` | Synthetic IDs, bounds and boolean audit results; no titles/content. |
| `S3-DB-002` | `scripts/verify-continuation-db.ts:63–64` | Rollback table counts only. |

### 7.8 Validation and stress evidence

| Command/check | Result | Exact evidence |
| --- | --- | --- |
| `npm.cmd run db:generate`; `npm.cmd run db:validate` | Pass | Prisma Client 7.9.1 generated; schema valid. |
| `npm.cmd run lint`; `npm.cmd run typecheck` | Pass | Zero ESLint warnings/errors and zero TypeScript diagnostics after final repairs. |
| `npm.cmd run test:coverage` | Pass | 18 files/53 tests; 91.64% statements, 82.22% branches, 86.55% functions, 94.70% lines. |
| `npm.cmd run test:stress` | Pass | 2 files/4 tests, including 10,000-block structured document and foundation stress. |
| S3 Playwright matrix | Pass | 8 entries: 4 applicable passed, 4 intentional platform skips; exact restoration, local 503 fallback, empty project, mobile Dark. |
| Full Phase 1 Playwright matrix after final repairs | Pass | 32 entries: 18 applicable passed, 14 intentional desktop/mobile scope skips; S0–S3 all pass. |
| Exact return assertion | Pass | Same UUID block, same DOM cursor offset, scroll delta <=2 px, restored-editor focus, and one Project Home Continue Writing action. |
| Accessibility | Pass | Project Home and shell/editor axe scans returned zero serious/critical violations; keyboard regression passed. |
| Content redaction | Pass | Browser console did not contain unique manuscript sentinel; service tests rejected content-shaped input and titles never appeared in logs. |
| Visual review | Pass | `continuation-project-home.png`, `continuation-restored-editor.png`, and `continuation-project-home-mobile.png` inspected: dominant action, readable recent facts, no collision/overflow in desktop Light or mobile Dark. |
| Production `npm.cmd run build` under valid OIDC environment | Pass | Compiled/typechecked/prerendered; continuation API, Project Home and chapter routes emitted. Invalid production+development-auth build separately failed as designed. |
| `npm.cmd audit --audit-level=high` | Pass | Registry advisory endpoint returned zero vulnerabilities. |
| `db:verify:continuation -> db:rollback:continuation -> db:verify:durability -> db:deploy -> db:verify:continuation` | Pass | Five-recent/50-pin bounds, exact offset/scroll, unique upsert, stale write ignored, archived fallback, cross-workspace/project denials. Rollback removed S3 table, preserved five S1/S2 tables, redeploy/reverify passed. |

### 7.9 Side-by-side conformance audit

| WorkPlan S3 requirement | Actual evidence | Classification |
| --- | --- | --- |
| Restore active chapter, block/cursor, scroll, context mode, pins and independent timestamp | Schema/contract/hook, DB verifier, exact E2E | Verified |
| `ProjectContinuationReadModel` and dominant Project Home action | Bounded service/read model, Project Home, desktop/mobile visual | Verified |
| Recent context and empty-project behavior | Five-item query bound, factual list and `StartFirstChapter`, E2E | Verified |
| One-click return to exact working state | Continue Writing URL plus exact block/offset/scroll E2E | Verified |
| Required editor load sequence | Server model -> S2 `durableReady` -> context seed -> S3 restore/tracking; code review/E2E | Verified |
| Offline active writing and plainly degraded server-only function | S2 offline regression plus S3 503/local metadata E2E | Verified |
| Independently reversible continuation persistence | S3-only migration/rollback and preservation/redeploy drill | Verified |
| Content-safe, bounded, ownership-scoped behavior | strict logger/schema, 5/50 bounds, ownership verifier, sentinel assertions | Verified |
| No analytics/context/Capture/later capability activation | scoped commit/search/import review | Verified |

Doctrine answers: no structure, scenes, world data, filing, causality, milestone ownership, timeline/reference conflation, causal prose mutation, quota, billing, support dependency, AI/tool, search provider, directive, Semantic Zoom, or future endpoint was introduced. PostgreSQL remains canonical for content; localStorage is metadata-only and IndexedDB remains pending/recovery content. Stale session data cannot overwrite newer data, and stale/archived chapter targets cannot appear authoritative. Reads are one project, five recent chapters, one session, and at most one extra active lookup. Logs/tests exclude prose. USD 15 Core/USD 25 future Intelligence and explicit Because/Consequences rules remain unchanged and outside S3.

### 7.10 Deviations, findings, and repairs

No unresolved WorkPlan deviation remains. Audit iterations found and repaired:

1. Generated Prisma relation metadata was stale inside an already-running dev process; regenerated client plus scoped restart proved the deployed schema/read model.
2. Strict telemetry rejected keys containing `selection`, `context`, or `capture`; service metadata now uses safe `anchorPos`, `headPos`, `panelMode`, and `positionAt` without weakening the guard.
3. ProseMirror paragraph splitting inherited duplicate block IDs; append-transaction repair now guarantees unique stable IDs before domain validation/autosave.
4. Browser navigation could reset scroll before the last snapshot; continuous scroll capture plus navigation freeze now protects the last author position.
5. Prisma Dev/PGlite mishandled concurrent unnamed prepared statements; nonproduction uses a one-connection pool while production explicitly retains ten.
6. The initial response-abort test destabilized the disposable wire emulator; the degraded-path test now returns a deterministic 503, which is the real transport contract under test.
7. Delayed older session writes could overwrite newer state; serializable newest-`capturedAt` protection and DB assertion were added.
8. Archived stored chapter targets initially lacked fallback; deterministic current/latest eligible fallback and DB assertion were added.
9. The first restore assertion could observe initial hydration instead of return hydration; it now requires the restore trace count to increase after Continue Writing.
10. Theme bootstrap placement produced a client-navigation development warning; the existing `beforeInteractive` script remains but is hosted in body according to Next layout behavior.

`WorkPlan.md` required no correction. This sentence records the state at the time of the S3 gate; it is superseded by the completed Phase 1 macro audit and CI reconciliation in section 8.

### 7.11 Gate and Git evidence

- **Gate result:** **PASS — Sub-gate 3 continuation is implemented and verified.** At this entry's point in time Phase 1 awaited its macro audit; section 8 now records the completed macro audit and final remote CI.
- **Branch:** `agent/workplan-subgates-audit`.
- **Pre-code ledger commit:** `43cc745f14be578c99baa19bc56944d9edfea1a8` — `Plan Sub-gate 3 continuation`, pushed and remotely verified before S3 code.
- **Content commit:** `dd27be8b5f2a6be9a1e2235da47dcb34b490cc61` — `Implement Sub-gate 3 continuation`.
- **Commit scope:** 23 files, 778 insertions, 18 deletions; cached diff check passed; `WorkPlan.md`/`Path.md` excluded.
- **Push/remote verification:** remote advanced `43cc745..dd27be8`; local and `git ls-remote` both returned `dd27be8b5f2a6be9a1e2235da47dcb34b490cc61`.
- **Remote/PR:** `https://github.com/InfernusReal/Mythra-V2.git`; draft PR #1 tracks the branch.
- **Rollback/revert point:** S2 evidence `8e011bef6409656e5a1c443355b3ccf35dd5462d`; SQL rollback is `prisma/migrations/20260812210000_continuation/rollback.sql` after exporting metadata if required.
- **Evidence-ledger commit:** `d98b27a7238d2ec72c5af4e94beef68958e19625` (`Record Sub-gate 3 evidence`), pushed and remotely verified; the later Phase 1 audit records it in the immutable chain.

## 8. Entry Phase 1 - Trusted Writing Foundation macro conformance audit

### 8.1 Run identity, authority, and immutable sequence

- **Audit date:** 2026-08-12 (Asia/Karachi).
- **Authorized scope:** delivery Phase 1 and original capability Sub-gates 0-3 only.
- **Source owners:** `WorkPlan.md` sections 2.2, 5.1-5.4, 11.1-11.2 and the Bible's original phases 0-3, durability, continuation, security, accessibility, testing, deployment, and acceptance contracts.
- **Baseline:** S3 evidence commit `d98b27a7238d2ec72c5af4e94beef68958e19625`, already pushed and remotely verified.
- **Audit-repair content:** `0a98d61338cc941764122165afffd324851be0d3` (`Close Phase 1 audit gaps`), 21 files, 320 insertions, 39 deletions. Push succeeded; local HEAD and `git ls-remote` both returned the full SHA.
- **Branch/PR:** `agent/workplan-subgates-audit`; draft PR #1, `https://github.com/InfernusReal/Mythra-V2/pull/1`.
- **Capability lock:** Sub-gate 4 has not started. No Structure, Milestone, causal, context resolver/card, Capture, Universe, Search, Timeline, billing, analytics collection, or AI source/domain/route was activated.

The pushed commit order proves the mandatory predecessor chain:

| Capability | Pre-code ledger | Content | Evidence | Predecessor proof |
| --- | --- | --- | --- | --- |
| S0 Foundation | foundation plan preceded content | `8459d6601885e019c56f1c3d757c1d4f5645f618` | `d0421ab61964aa406f6664f7e92bf156c67b463c` | no predecessor |
| S1 Editor Core | `c8b4a0859ea2a53c668a3bf87233156d92cbffa6` | `0883070a6ba7cc04c285c1adce3652107a5d1511` | `bee0dae6b77faa59d33f6ecf2a425afcec847243` | S0 evidence predates S1 plan/content |
| S2 Durability | `60ed5d3d03130ba508fb7c42809a985a71b54dfb` | `674ff4895a0cab50f8b6f30fbe800bbc97e52568` | `8e011bef6409656e5a1c443355b3ccf35dd5462d` | S1 evidence predates S2 plan/content |
| S3 Continuation | `43cc745f14be578c99baa19bc56944d9edfea1a8` | `dd27be8b5f2a6be9a1e2235da47dcb34b490cc61` | `d98b27a7238d2ec72c5af4e94beef68958e19625` | S2 evidence predates S3 plan/content |
| Phase 1 audit repair | macro audit followed S3 evidence | `0a98d61338cc941764122165afffd324851be0d3` | Macro ledger `b71a7b08bd7fe97f3fb62902cc39c5406265eb87` | repaired only Phase 1 requirements |
| Post-audit CI reconciliation | macro ledger exposed the final component/CI gaps | Code `88861d08d07ba1c53be5c4add4141d3a1c096a38`; workflow `095524d56fa2b5fe2d83c44bd4bfb5f48b901cbe` | Final correction ledger `543fe83345d1ec2066a21010046e9a6025175c2e`; CI `31612678269` | all remote checks passed before S4 eligibility |

### 8.2 Completed scope side by side with WorkPlan section 5.1

| WorkPlan scope | Actual implementation and evidence | Result |
| --- | --- | --- |
| TypeScript/server React foundation and pinned rails | Next.js 16, React 19, strict TypeScript, zero-warning ESLint, Vitest coverage, Playwright dual viewport, PostgreSQL/Prisma 7, deterministic environment schema, CI | Verified |
| Architecture and platform boundaries | Eight ADRs freeze runtime/auth/editor/persistence/storage/jobs/testing/deployment; `domains/*` owns semantics, `lib/*` owns adapters/composition, routes remain transport composition | Verified |
| Identity and first workspace | External identity seam, internal User/Workspace/active Member/role/session, idempotent first-use provisioning, signed secure session, production OIDC and development-only adapter | Verified by S0 service/session/DB tests |
| Stable API and safety | `/api/v2`, stable envelopes/request IDs, origin/CSRF guard, secure cookies, rate-limit seam, archive/grace semantics, content-safe logger | Verified by API/security/unit tests |
| Calm shell | Exact 48px command bar/rail, calm centered canvas, save/status seams, authenticated empty state, reserved desktop context seam, mobile single column/bottom rail | Verified by foundation E2E and screenshots |
| Theme/accessibility/i18n baseline | Exact Light/Dark and Cream tokens, apply-before-paint cache, owned persisted theme endpoint, editor typography independence, visible focus, non-color labels, reduced motion, message boundary, Unicode and IME baseline | Verified by service/E2E/axe/computed-style tests |
| Title to first keystroke | Title-only Project creation and direct `Write first chapter`; optional structure remains absent | Verified by S1 service/DB/E2E |
| Canonical Project/Chapter/editor core | Stable UUID Project/Chapter/document/block IDs, chapter ordering, active chapter, document version, derived text/word count, TipTap adapter | Verified |
| Minimal author UI | One-chapter editor, breadcrumbs/switcher, Bold/Italic/Undo/Redo, Focus/Escape, command palette, checkpoint, word target and opt-in hard stop | Verified by keyboard/E2E/unit tests |
| Hidden future commands | Checkpoint active; Capture/outline/milestone/context are registry reservations only and render no dead controls | Verified by registry tests/source audit |
| Never-lose-text durability | IndexedDB pending/recovery journal, explicit state machine, 750ms autosave, idempotent receipts, optimistic versions, conflict variants/actions, checkpoints/revisions | Verified by S2 unit/service/DB/E2E |
| Named durability components | `ConflictBanner`, `RecoveryDrawer`, `RevisionDiff`, `RestoreActions`, `SaveIndicator` are explicit modules; degraded recovery remains factual and writable | Verified |
| Exact continuation | Owned session restores active chapter, stable block/cursor/selection, scroll, inert context mode/pins and timestamp only after durability is ready | Verified by exact S3 DB/E2E |
| Project Home | Dominant Continue Writing, five-item bounded recent context, archived/stale fallback, empty-project action | Verified |
| Reversible persistence | Four forward migrations and four reviewed rollbacks; every sub-gate preserves predecessors | Verified on real PostgreSQL |
| Failure isolation | Typing/IndexedDB never wait for network; continuation/theme retain local state on dependency failure; context/search/billing are absent; telemetry is local content-safe transport/no-op metrics | Verified |

### 8.3 WorkPlan section 5.2 file inventory

- **Schema/migrations:** `prisma/schema.prisma`, four migration/rollback pairs, seed and all four DB verifier scripts exist.
- **Accounts/auth:** types, ports, authenticate/preferences services, OIDC/development adapters, memory/Prisma repositories, session/runtime and callback/preference surfaces exist.
- **Writing:** Project/Chapter/document/durability/continuation domain, application ports/services, Prisma repository and editor adapter exist.
- **Routes/screens:** sign-in, app home/shell, Project creation/Home, chapter editor, settings, and project/chapter/editor/draft/checkpoint/conflict/continuation/preferences APIs exist.
- **Named components:** shell, `ChapterEditor`, `EditorCanvas`, `EditorToolbar`, `WordTarget`, `FocusMode`, `SaveIndicator`, `ConflictBanner`, `RecoveryDrawer`, `RevisionDiff`, `RestoreActions` exist as modules.
- **Client durability:** draft journal, save state machine, durable chapter hook and continuation hook exist.
- **Platform seams:** env/config, envelopes/errors, CSRF/rate limit, logger/metrics, storage, jobs/outbox and ownership-scoped repositories exist.
- **Tests/fixtures:** unit/service/component/E2E/stress layers cover Unicode, IME composition, offline, conflict, accessibility, themes, exact continuation and a 10,000-block document. Deterministic fixtures are built inside tests rather than stored as mutable prose files.

### 8.4 Coding-method conformance

1. Each original capability was planned, committed, pushed and remotely verified before its successor began.
2. Domain schemas/types and repository/application ports preceded route/UI composition.
3. PostgreSQL is canonical. IndexedDB is pending/recovery manuscript state; localStorage is metadata/theme cache, never canonical prose.
4. Server components resolve bounded read models; client components own interaction, local durability and focus/position restoration.
5. Every write uses actor/workspace/project ownership, strict Zod contracts, stable envelopes and content-redacted instrumentation.
6. Each migration has an independent rollback and was exercised against real PostgreSQL.
7. The audit implemented missing named files/endpoints and executable proof; it did not reinterpret or narrow the WorkPlan.

### 8.5 Audit findings and completed repairs

| Finding before repair | Repair in `0a98d61` | Closure evidence |
| --- | --- | --- |
| Unicode passed but no executed composition-event baseline | Added `compositionstart` -> Japanese insertion -> `compositionend` -> PostgreSQL acknowledgement -> reload | targeted and final editor-core E2E pass |
| Reduced-motion CSS existed without browser execution | Added `reducedMotion: reduce` emulation and computed 0.01ms/auto assertions | foundation E2E pass |
| WorkPlan-named editor/durability modules were inline | Extracted eight named production components without changing canonical flow | lint/typecheck/full E2E pass |
| Recovery state had no explicit drawer | Added recovery/storage-degradation notice, dismiss action and redacted traces | recovery E2Es pass |
| Preference row/settings existed but named theme endpoint did not | Added strict `ManagePreferences`, owned GET/PUT repository/API, server hydration and local-first failure isolation | service test, persisted-theme E2E, production route |
| Preference hydration requested `/sign-in`, causing 401 console noise | Restricted canonical hydration to authenticated `/app`; local prepaint remains global | foundation rerun pass |
| Dark `#8B82FF` used as white-text action fill measured 3.11:1 | Preserved required accent/focus token; added `#5B4FE9` action fill with 5.62:1 contrast | deterministic Dark axe pass on desktop/mobile |
| Two production-build attempts omitted required `DATABASE_URL` | Operator invocation corrected with the full production/OIDC environment | final optimized build pass; not a product defect |

No in-scope gap remains. `WorkPlan.md` required no textual correction because the findings were implementation/evidence omissions, not plan contradictions.

### 8.6 Final validation and stress evidence

| Check | Final result |
| --- | --- |
| lint/typecheck | Pass: zero-warning ESLint and strict `tsc --noEmit` |
| coverage | Pass after CI correction: 19 files, 55 tests; 88.54% statements, 76.47% branches, 85.15% functions, 91.61% lines |
| stress | Pass: 2 files/4 tests including 10,000-block document and concurrent boundaries |
| final full E2E | Pass: 36 entries, 20 applicable passes, 16 explicit cross-device de-duplication skips, zero failures |
| production build | Pass: compile/type/page/static generation; all S0-S3 routes plus `/api/v2/preferences/theme` emitted |
| continuation rollback drill | Pass: recent=5, session=1, cursor=14, scroll=777, pins=50, stale ignored, archived fallback; rollback left zero continuation tables and preserved five predecessor tables; deploy/reverify passed |
| durability after rollback | Pass: version=5, receipt replay, 3 conflicts, 2 revisions, recovery, 2 same-base attempts -> 1 winner/1 conflict, cross-workspace save=false |
| dependency audit | Pass: `found 0 vulnerabilities` |
| diff/trace audit | Pass: `git diff --check`; all direct console calls have adjacent trace comments |
| visual review | Pass: Light/Dark/mobile shell, editor and Project Home/restored-editor screenshots were inspected for hierarchy, focus, contrast and responsive layout |

The 16 E2E skips are deliberate matrix de-duplication, not missing coverage: desktop persistence scenarios execute once in Chromium, mobile layout/theme cases execute on Pixel 7, and shared API/accessibility cases execute where declared.

### 8.7 Authoritative final console/log instrumentation ledger

Final source has **47 direct `console.log` calls** (including the structured transport), **13 structured `this.logger.*` call sites**, and **60 instrumented execution call sites**. A literal-path source audit proved every direct console call has an immediately preceding `// Console trace ...` comment: `TRACE_COMMENT_AUDIT=PASS`. This supersedes historical line numbers shifted by the component extraction.

| File | Comment -> call lines | Steps and comment contract |
| --- | --- | --- |
| `components/editor/ChapterEditor.tsx` | 83-84, 113-114, 121-122, 131-132, 142-143, 169-170, 181-182, 192-193 | `S3-BLOCK-001`; `S1-EDITOR-CLIENT-001/002/004/005/006/007/003`; comments identify repair/editor/focus/hard-stop steps and exclude prose/clipboard |
| `components/editor/RecoveryDrawer.tsx` | 7-8 | `S2-CLIENT-009`; recovery acknowledgement, content excluded |
| `components/projects/ProjectCreator.tsx` | 39-40 | `S1-FLOW-001`; navigation, title/document excluded |
| `components/projects/StartFirstChapter.tsx` | 17-18 | `S3-HOME-CLIENT-001`; empty project writable, content excluded |
| `components/shell/CommandPalette.tsx` | 14-15, 20-21 | `S1-COMMAND-001/002`; open/close/focus, selection/content excluded |
| `components/theming/ThemeProvider.tsx` | 40-41, 43-44, 53-54, 57-58, 60-61 | `S0-THEME-002/003/001/004/005`; hydration/change/ack/degraded retention, enum only |
| `domains/accounts/application/authenticate.ts` | 17-18, 28-29 | structured `S0-AUTH-001/002`; credential excluded |
| `domains/accounts/application/preferences.ts` | 13-14, 21-22 | structured `S0-PREFERENCE-001/002`; owned enum read/write only |
| `domains/writing/application/commands.ts` | 15-16, 24-25, 31-32 | structured `S1-PROJECT-001`, `S1-CHAPTER-001`, `S1-EDITOR-001`; title/document excluded |
| `domains/writing/application/continuation.ts` | 11-12, 19-20 | structured `S3-CONTINUATION-001/002`; bounded position metadata only |
| `domains/writing/application/durability.ts` | 20-21, 27-28, 34-35, 42-43 | structured `S2-SAVE-001`, `S2-CHECKPOINT-001`, `S2-CONFLICT-001/002`; content/variants excluded |
| `lib/indexed-db/draft-journal.ts` | 46-47, 65-66, 75-76 | `S2-JOURNAL-002/001/003`; metadata-only read/write/clear |
| `lib/observability/logger.ts` | 15-16 | `S0-LOG-001`; sole structured console transport after forbidden-key validation |
| `lib/writing/use-durable-chapter.ts` | 80-81, 107-108, 129-130, 135-136, 153-154, 168-169, 174-175, 181-182, 232-233 | `S2-CLIENT-003/001/002/004/007/005/010/008/006`; all durability and degraded transitions, content excluded |
| `lib/writing/use-writing-continuation.ts` | 70-71, 79-80, 85-86, 92-93, 95-96, 104-105, 119-120, 132-133 | `S3-CLIENT-001/002/005/004/005/003/007/006`; metadata restore/save/degraded/freeze/flush, content excluded |
| `scripts/verify-continuation-db.ts` | 48-49, 63-64 | `S3-DB-001/002`; bounded ownership/position/rollback facts |
| `scripts/verify-durability-db.ts` | 86-87, 101-102 | `S2-DB-001/002`; idempotency/concurrency/conflict/rollback facts |
| `scripts/verify-editor-core-db.ts` | 61-62, 90-91 | `S1-DB-001/002`; constraints/ownership/rollback facts |
| `scripts/verify-foundation-db.ts` | 65-66, 91-92 | `S0-DB-001/002`; identity/ownership/rollback facts |

### 8.8 Phase 1 exit-gate proof

| WorkPlan section 5.4 requirement | Evidence | Result |
| --- | --- | --- |
| Authentication -> calm shell/first workspace | auth service/DB plus foundation E2E | Verified |
| Title -> one chapter -> keystroke without setup | exact editor-core E2E plus S1 service/DB | Verified |
| Reload/close-before-ack/offline/two-device retain text | durability E2E plus IndexedDB/service/DB concurrency | Verified |
| Continue restores exact chapter/block/cursor/scroll | equality assertions and scroll delta <=2px plus DB session round trip | Verified |
| Context/search/billing/telemetry failure cannot block editor | later domains absent; no critical-path imports; local-first degraded tests; local logger/no-op metrics | Verified |
| Light/Dark, keyboard, reduced motion, Unicode/IME, logs, ownership, rollback pass | deterministic Dark axe, focus, computed motion, IME reload, trace audit, ownership DB tests, rollback/deploy drill | Verified |
| S0-S3 distinct evidence/remote commits | immutable SHA chain in 8.1 | Verified |

### 8.9 Doctrine, scope, and final determination

- Structure, scenes, world data, Capture filing and causality remain absent/optional; S4 remains the next locked owner.
- No milestone exists; no hierarchy/timeline/reference fact can become causal; no structural/causal write can edit prose.
- PostgreSQL remains canonical. IndexedDB is a pending/recovery journal; localStorage is metadata/theme cache only.
- Stale continuation writes are rejected and archived targets fall back deterministically.
- Billing/quota/downgrade/export are inactive; existing prose cannot be gated.
- Support failures cannot block typing; no context/search/billing import exists, and theme/continuation/durability retain local state.
- Forbidden-key logger tests and metadata-only traces prevent content leakage; reads are explicitly bounded.
- No AI, future endpoint/provider, directive, Semantic Zoom, pricing/entitlement or non-V2 capability was activated.
- `becauseItems[]`, `consequenceItems[]`, ruled Semantic Zoom order and USD 15 Core/USD 25 future Intelligence remain unaltered plan contracts.

**Phase result: PASS - Phase 1 Trusted Writing Foundation is complete.** S0-S3 and the macro exit gate are implemented, tested, audited and remotely backed; no in-scope compliance gap remains. The content rollback point is S3 evidence `d98b27a7238d2ec72c5af4e94beef68958e19625`; audit repair is `0a98d61338cc941764122165afffd324851be0d3`; the macro ledger is `b71a7b08bd7fe97f3fb62902cc39c5406265eb87`. Section 8.10 records the post-audit code, CI configuration, final ledger, and successful CI evidence. Sub-gate 4 is eligible but has not started.

### 8.10 Post-audit CI correction and evidence reconciliation

The initial Phase 1 macro ledger was pushed as `b71a7b08bd7fe97f3fb62902cc39c5406265eb87`. The next GitHub Actions run disproved one statement in section 8.6: the coverage result quoted there came from the audit-repair state before the last `usePathname` guard change. This section is an explicit correction; it does not erase the failed evidence.

| Event | Evidence | Classification and action |
| --- | --- | --- |
| GitHub coverage failure on the audit branch | 18/19 files and 52/55 tests passed; all three `tests/component/shell.test.tsx` cases failed at `ThemeProvider.tsx` because the routerless test environment returned `null` from `usePathname()` and code invoked `pathname.startsWith` | **Gap.** The Phase 1 PASS and prior 89.23/76.82/85.93/92.46 coverage figures became unsupported pending repair. |
| Nullable pathname repair | `ThemeProvider` now uses `if (!pathname?.startsWith("/app")) return;`; commit `88861d08d07ba1c53be5c4add4141d3a1c096a38`, pushed and remotely SHA-verified | **Verified repair.** The authenticated preference request remains restricted to `/app`; null/non-app contexts retain local prepaint behavior without requesting the endpoint. |
| Exact local coverage rerun | `npm.cmd run test:coverage`: 19/19 files and 55/55 tests passed; statements 88.54%, branches 76.47%, functions 85.15%, lines 91.61% | **Verified.** These are the authoritative final coverage values and replace the premature values above. |
| Local regression after nullable repair | lint and strict typecheck passed; stress 2 files/4 tests; full Playwright 36 entries with 20 applicable passes/16 intentional device-scope skips; production/OIDC build passed | **Verified.** No S0-S3 regression. |
| First remote rerun after code repair | GitHub Actions run `31612142657`: dependency install, Prisma generation, lint, typecheck and coverage all passed; build failed because CI configured `AUTH_MODE=development` while `next build` correctly set production mode | **CI configuration gap, not application regression.** Security invariant remained intact; development auth was not allowed in production. |
| CI production-auth repair | `.github/workflows/ci.yml` now builds with `AUTH_MODE=oidc`, complete issuer/audience/JWKS variables, HTTPS origin and deployment-form SSL URL; commit `095524d56fa2b5fe2d83c44bd4bfb5f48b901cbe`, pushed and remotely SHA-verified | **Verified repair.** The workflow tests the deployment security posture instead of weakening `lib/env.ts`. |
| Final remote verification | GitHub Actions run `31612422399`, job `94166827455`, head SHA `095524d56fa2b5fe2d83c44bd4bfb5f48b901cbe`: all steps passed in 1m38s, including `npm ci`, `db:generate`, lint, typecheck, coverage and build | **PASS.** Remote CI is green. The action runner emitted a nonblocking Node 20 action-runtime deprecation annotation for `actions/checkout@v4` and `actions/setup-node@v4`; it did not fail or skip any step and is recorded for later workflow-maintenance ownership. |
| Final correction ledger and remote recheck | `Path.md` correction commit `543fe83345d1ec2066a21010046e9a6025175c2e`; GitHub Actions run `31612678269`, job `94167700949`: all install, generation, lint, typecheck, 55-test coverage and build steps passed in 1m20s | **PASS.** Canonical dashboard and correction evidence are remotely verified at the same green branch state. |

The corrected determination is **PASS** only after commits `88861d08d07ba1c53be5c4add4141d3a1c096a38` and `095524d56fa2b5fe2d83c44bd4bfb5f48b901cbe`, correction ledger `543fe83345d1ec2066a21010046e9a6025175c2e`, and successful final remote run `31612678269`. No application test, build step, or Phase 1 gate remains failed.

## 9. Entry S4 — Structure Core

### 9.1 Run identity and authorization

- **Date/time and timezone:** 12 August 2026, Asia/Karachi; pre-code entry recorded before any S4 application or migration change.
- **Work-plan phase:** Phase 2 — Progressive and Causal Story Core.
- **Mandatory Sub-gate:** 4 — Structure Core.
- **Predecessor evidence:** Sub-gate 3 content `dd27be8b5f2a6be9a1e2235da47dcb34b490cc61`, evidence `d98b27a7238d2ec72c5af4e94beef68958e19625`, Phase 1 final ledger `543fe83345d1ec2066a21010046e9a6025175c2e`, and GitHub Actions run `31612678269` all passed and were remotely verified. S4 is therefore eligible.
- **Bible roadmap/source:** phase 4; sections 3, 5, 10, 12.1, 12.5, 16–18, 20, 26, 31, 33, 35, 37; appendices B and C. Text was re-extracted from the supplied 84-page v2.2 PDF and rendered pages 9, 15, 30, 31, 43–48, 70–71, 74, and 84 were checked for hierarchy, workspace, Semantic Zoom, schema/API, gate, and doctrine meaning.
- **Authorized ruling:** the coordinate is `Series/Project → Plot → Plot Outline → Volume → Volume Outline → Milestone/Thread → Chapter Outline → Chapter → Scene → Prose`; absent optional levels are skipped, `Milestone/Thread` is cross-cutting rather than an ownership parent, and Chapter Outline is an abstraction lens rather than a prerequisite to writing a Chapter.
- **Baseline branch/commit:** `agent/workplan-subgates-audit` at `44c883bd264b7a06c8c6843dd2da91e0108ff355` (`Refresh Path status and evidence tables`), clean working tree before this ledger edit.
- **Intended slice:** only the complete S4 Structure Core. Milestone persistence/UI, causal objects/relations, timeline, entities, Notes, Capture, Search, contextual cards, billing, automation workers, and AI remain locked to their later gates.
- **Pre-existing changes:** none. PDF renders under ignored `tmp/` are evidence intermediates and will not enter product commits.

### 9.2 Plan before code

#### Canonical scope and invariants

1. Add `Plot`, optional `PlotOutline`, ordered `Volume`, optional `VolumeOutline`, optional/unattached-placeholder `ChapterOutline`, optional `Scene`, `NarrativeIntent`, generalized non-causal `StoryReference`, generic `ObjectRevision`, and per-user `StructureViewState` persistence.
2. Extend `Chapter` with optional volume membership while keeping prose-first chapters valid with no plot setup, volume, outline, scene, intent, or reference. A chapter does not need a `ChapterOutline`; outline rows are created only by explicit content entry or explicit bulk placeholder creation.
3. Keep containment and relevance separate: a volume owns ordered chapter membership; a scene is an optional lens connected to a chapter/outline; `StoryReference` represents cross-cutting relevance and backlinks; no S4 table or operation gives a milestone ownership over a chapter.
4. Store freeform outline document/text and optional purpose, emotional movement, revealed-information list, entity/location reference keys, future milestone-link keys, soft word target, scene stubs, provenance, and version. Entity/location/milestone values are unresolved reference keys in S4, not fabricated later-domain objects.
5. Treat Discovery, Guided, and Architect as persisted presentation preferences over one schema. They never change validation, create required setup, or fork the project type.
6. Implement deterministic volume/chapter-range and chapter-outline-placeholder scaffold planning, advisory allocation expectations, and preview-before-apply rebalance. S4 generates no milestone placeholder, cadence date, or milestone allocation.
7. Implement explicit prose-first chapter assignment to volumes and outline-block-to-scene conversion with source provenance and reversible backlinks. Define typed dormant `note` and `capture` conversion ports that return dependency-unavailable until their canonical gates; expose no active UI for them.
8. Keep target words and other creative constraints advisory by default; an author must explicitly enable any supported hard limit. S4 warnings do not reject ordinary creative writes.
9. Support Narrative Intent for plot, volume, chapter, scene, and paragraph selection with plain text plus tension, revelation, emotion, pacing, ambiguity, atmosphere, or custom category. Milestone and entity-arc adapters do not exist in S4.
10. Implement the ruled Semantic Coordinate projection with optional `plotOutlineId`/`volumeOutlineId`, ordered ancestors, cross-cutting relevance, optional-level skipping, and stable prose/selection anchor metadata.
11. Increment the existing canonical `Project.structuralVersion` in the same database transaction as every S4 structure/reference/intent write; emit a content-free transactional outbox invalidation; create an `ObjectRevision` snapshot before mutable-object replacement.

#### UI, state, performance, and writing-flow plan

- Build one `/app/projects/[id]/structure` workspace with active Outline, Volumes, Chapters, Relationships, and Semantic Zoom lenses. Milestones and Causal lenses are absent until S5/S6; no disabled or fake empty lens is rendered.
- Use inline create/edit controls, explicit keyboard-operable move/promote/demote actions, and preview dialogs for reorder/renumber/rebalance. Drag gestures may be added only as a redundant affordance; no requirement depends on them.
- Persist collapse/expansion, selected lens/mode, active semantic anchor, cursor, selection, scroll position, and future pin IDs by `(userId, projectId)`. Reversible zoom restores the recorded position and never mutates prose.
- Return bounded overview pages and neighborhood slices. Default and maximum node/edge budgets will be encoded as constants; large lists use windowed range slices and grouped overflow summaries instead of rendering an entire structure graph.
- Preserve the existing editor and Project Home paths. Structure support failure cannot block opening, typing, local journaling, saving, recovery, or continuation.

#### Planned files

| File or area | Action | Planned responsibility |
| --- | --- | --- |
| `prisma/schema.prisma` and `prisma/migrations/20260812*_structure_core/{migration,rollback}.sql` | Modify/create | S4 enums, canonical tables, ownership constraints, ordering/reference/revision/outbox indexes, chapter volume seam, and reviewed reversal. |
| `domains/structure/domain/{types,invariants,semantic-coordinate,scaffold}.ts` | Create | Canonical S4 types, optionality/ownership/order rules, ruled coordinate builder, deterministic allocation/rebalance planning. |
| `domains/references/domain/story-reference.ts` | Create | General non-causal source/target vocabulary, block anchors, provenance/backlink contract, and validation. |
| `domains/structure/application/{ports,service,conversion}.ts` | Create | Ownership-scoped commands/queries, previews and apply operations, revisions/outbox orchestration, and dormant future conversion interfaces. |
| `domains/structure/infrastructure/prisma-structure-repository.ts` | Create | Bounded Prisma reads and transactional writes with structural-version compare/increment and child-ID workspace guards. |
| `lib/structure/runtime.ts` | Create | Composition root for the S4 service and logger. |
| `app/api/v2/projects/[id]/structure/**/route.ts` and `app/api/v2/structure/**/route.ts` | Create | Bounded overview, explicit object writes, preview/apply scaffold/reorder, view-state, intent/reference, and scene conversion routes using stable envelopes. |
| `components/structure/*.tsx` | Create | Shared Structure shell, active lens navigation, outline tree, volume lane, chapter grid, scaffold/reorder previews, Semantic Zoom viewport, relationship list, and inline intent/scene controls. |
| `app/app/projects/[id]/structure/page.tsx` and existing navigation surfaces | Create/modify | Authenticated server-owned read model and discoverable, optional navigation into Structure without obstructing Continue Writing. |
| `docs/adr/0005-structure-core.md`, `docs/architecture/structure-core.md`, `docs/api/structure.md` | Create | Schema semantics, ruled ladder, reference/causality boundary, adapter lifecycle, API contracts, budgets, failure/recovery and migration strategy. |
| `scripts/verify-structure-core-db.ts` and `package.json` | Create/modify | Real PostgreSQL ownership, optionality, ordering, version/outbox/revision, constraint and rollback verification commands. |
| `tests/unit`, `tests/service`, `tests/component`, `tests/stress`, `tests/e2e` S4 files | Create | Property/invariant/service/UI/load/writing-position tests and the S4 writing-flow gate. |

The final file ledger will replace this forecast with every actual created, modified, generated, or deleted path and explain any difference.

#### API and mutation plan

- `GET /api/v2/projects/:id/structure` returns one bounded structure read model with cursor/range/budget metadata and active lenses only.
- Explicit POST/PATCH operations create/update plot, outlines, volumes, scenes, intents, and references. Chapter membership, promote/demote, and ordering changes require `expectedStructuralVersion` and return the stable mutation envelope.
- `/scaffold/preview` and `/scaffold/apply`, plus `/reorder/preview` and `/reorder/apply`, separate advisory calculation from canonical mutation. Apply requests carry a deterministic plan token/hash and expected version so a stale preview cannot be committed.
- View-state persistence is user preference state, not story truth. It cannot increment the project structural version or enter story revisions.
- All child identifiers are resolved through the actor workspace and project before mutation. Lists and Semantic Zoom neighborhoods enforce page/node/edge ceilings server-side.

#### Console instrumentation plan

Every operational transition receives an adjacent `// Console trace S4-...` comment and a safe call. Server code uses the existing structured logger transport; browser-only interactions use direct `console.log` with IDs/counts/mode names only. No title, outline prose, Narrative Intent text, manuscript text, revealed information, note, provenance note, or user-entered reference label may be logged. The final S4 entry will list the exact comment and call/transport line for every site after formatting stabilizes, and an automated adjacency/content audit must pass before the gate is called complete.

Planned step families are: `S4-STRUCTURE` read/write; `S4-SCAFFOLD` preview/apply; `S4-ORDER` preview/apply; `S4-SCENE` conversion; `S4-INTENT`; `S4-REFERENCE`; `S4-ZOOM`; `S4-VIEW`; `S4-DB`; and `S4-UI`. Rejected and stale operations log stable error codes and identifiers only through the existing content-safe request boundary.

#### Migration, recovery, and measurable validation

- Forward migration adds S4 objects and optional Chapter membership without rewriting existing prose rows. Rollback removes only S4 objects/columns after an explicit verification run; existing Phase 1 Project, Chapter body, revision, conflict, receipt, and session-state data must remain readable and byte-equivalent.
- Property tests will cover randomized unique ordering, rebalance determinism, optional-level Semantic Coordinates, no required outline, reference preservation, and idempotent preview/apply behavior.
- Service/repository tests will cover cross-workspace and cross-project denial, stale structural version rejection, atomic version+outbox+revision writes, bounded pagination, content-safe logs, and dormant Note/Capture conversion rejection.
- Stress targets: at least 10,000 chapters/outline placeholders distributed across volumes in domain planning tests; bounded server read model never exceeds its declared node/edge/page budgets; repeated reorder/scaffold plans remain deterministic; no quadratic all-edge client payload is produced.
- UI/E2E targets: zero-structure author continues writing; planner opens active S4 lenses, scaffolds/reorders via preview, preserves expansion/zoom position, and returns to editor with exact chapter plus cursor/selection/scroll restored. Keyboard-only and axe serious/critical checks, Light/Dark, desktop/mobile, reduced motion, and focus restoration must pass.
- Quality gates: Prisma generate/validate, migration forward/rollback/forward and real DB verification, lint, strict typecheck, unit/service/component/stress/E2E, coverage, production build, `git diff --check`, generated-client review, and remote GitHub Actions.

### 9.3 Pre-code conformance audit

| S4 requirement | Planned evidence | Current classification | Gate action |
| --- | --- | --- | --- |
| Structure remains optional for discovery writing | Nullable relationships, zero-structure read model, existing writing E2E regression | Planned; exact | Must pass before S4 completion. |
| Canonical hierarchy and ownership/relevance split | DB FKs plus domain invariants and reference model | Planned; exact | Milestone ownership is prohibited. |
| Freeform/rich optional outlines and optional metadata | JSON document/text plus optional fields/reference keys | Planned; exact | Do not materialize empty outline rows implicitly. |
| Three presentation modes, one schema | Per-user view-state enum only | Planned; exact | Mode cannot alter validation. |
| Deterministic scaffold and preview-before-apply | Pure planner plus versioned apply token | Planned; exact | No milestone data in S4 planner. |
| Existing-domain after-the-fact operations | chapter-to-volume and outline-block-to-scene with backlinks | Planned; exact | Note/Capture stay dormant. |
| Narrative Intent active targets only | plot/volume/chapter/scene/paragraph adapters | Planned; exact | Milestone/entity-arc rejected. |
| One Structure shell with active lenses only | five S4 lenses; no dormant lens UI | Planned; exact | S5/S6 add their own lenses later. |
| Ruled Semantic Zoom and position preservation | coordinate projection plus persisted view state/editor return test | Planned; exact | Milestone remains cross-cutting. |
| Bounded large-project rendering | server budgets, slices, overflow clusters, stress assertions | Planned; exact | Full graph payload is forbidden. |
| Transactional durability seams | version compare/increment, outbox and revisions in each story-write transaction | Planned; exact | View-state excluded from story version. |
| S4 writing-flow exit gate | zero-setup writing plus large planner and exact focus restoration | Planned; exact | No S5 code may start until verified/pushed. |

No plan contradiction or dependency inversion was found. S4 does not activate milestones, causal relations, timeline events, entity states, Capture-derived objects, Notes, billing, or AI. It adds no prose mutation path. `becauseItems[]`/`consequenceItems[]`, future pricing, and later endpoint contracts are unaffected. At this pre-code point all S4 items remain **Planned**, not implemented; the gate remains **in progress**.

### 9.4 Pre-code Git evidence

- **Intended commit scope:** `Path.md` only.
- **Application code status:** unchanged from baseline `44c883bd264b7a06c8c6843dd2da91e0108ff355`.
- **Plan commit/push/remote CI:** commit `abcd402382aa1c8f391a68276c8a0330b06d9d29` (`Plan Structure Core sub-gate`) was pushed to `agent/workplan-subgates-audit`; GitHub Actions run `31615214091`, job `94176213553`, passed. No S4 application file existed in that commit.
- **Rollback point:** baseline `44c883bd264b7a06c8c6843dd2da91e0108ff355`.

### 9.5 Actual implementation and file ledger

#### Schema, migration, and canonical state

| Files | Actual implementation | Compliance effect |
| --- | --- | --- |
| `prisma/schema.prisma` | Added `Plot`, `PlotOutline`, `Volume`, `VolumeOutline`, `ChapterOutline`, optional `Scene`, `NarrativeIntent`, generalized non-causal `StoryReference`, generic `ObjectRevision`, and per-user `StructureViewState`; added optional `Chapter.volumeId`/`volumeSequenceIndex`; added S4 endpoint, target, mode, lens, provenance and object enums plus ownership/order/index relations. | Implements the complete S4 canonical object set while leaving Chapter valid without any structure. No Milestone or causal table exists. |
| `prisma/migrations/20260812230000_structure_core/migration.sql` | Creates the S4 enums/tables, same-project composite foreign keys, uniqueness/check constraints, active-reference idempotency index, ordering indexes, revision/outbox-compatible structure and optional Chapter columns. | Database constraints enforce project ownership, one active plot/outline identity, valid optional membership, stable active reference identity and bounded query indexes. |
| `prisma/migrations/20260812230000_structure_core/rollback.sql` | Removes only S4 tables/enums and the two optional Chapter membership columns in dependency order. | Real rollback proof preserved all Phase 1 tables and byte-equivalent prose. |

#### Domain, application, repository, and API

| Files | Actual implementation | Compliance effect |
| --- | --- | --- |
| `domains/structure/domain/types.ts`, `invariants.ts`, `scaffold.ts`, `semantic-coordinate.ts` | Strict schemas for optional outlines/intents/view state, explicit hard-target rule, bounded budgets/range cursor, stable reorder preview, deterministic SHA-256 scaffold plans up to 100 volumes/10,000 chapters, and the exact ruled semantic ladder with absent levels skipped. | Creative limits are soft unless explicitly hard; preview calculations are deterministic; large reads are bounded; Milestone/Thread is relevance, never an ownership ancestor. |
| `domains/references/domain/story-reference.ts` | Defines active S4 endpoints (`PLOT`, outline/volume/chapter/scene/intent/manuscript-block types), reserved later endpoints, self-reference rejection, block anchors, provenance and strict dependency-unavailable behavior for later domains. | Relevance stays separate from containment/chronology/causality and no future source is falsely active. |
| `domains/structure/application/ports.ts`, `service.ts`, `conversion.ts` | Defines the complete S4 repository/read-model contracts; validates and logs all explicit writes; separates ownership-guarded preview from token/version apply; defines dormant Note/Capture conversion ports that return dependency unavailable. | Thin application boundary, no implicit structure creation except explicit scaffold, and no premature Note/Capture capability. |
| `domains/structure/infrastructure/prisma-structure-repository.ts` | Implements workspace/project-owned bounded reads; cursor-like range slices; transactional create/update/reparent/reorder/scaffold/intent/reference/scene writes; optimistic structural-version compare/increment; full object revisions; transactional outbox events; duplicate-reference idempotency; provenance backlink creation; cross-project endpoint validation. | Canonical truth changes atomically; view preferences do not advance story truth; stale/concurrent operations conflict; child IDs cannot cross workspaces/projects. |
| `lib/structure/runtime.ts`, `lib/structure/http.ts` | Composes the repository/service and applies authentication, stable success/error envelopes, request IDs and content-safe route completion/failure traces. | All S4 routes share the Phase 1 security/error/logging contract. |
| `app/api/v2/projects/[id]/structure/route.ts` and 14 nested route files | Adds bounded overview; plot/volume/outline/chapter-membership/scene/intent/reference writes; scaffold preview/apply; reorder preview/apply; view-state persistence. | Every endpoint is authenticated; previews verify project access; mutations validate expected structural version; no S5/S6 endpoint exists. |

#### UI, navigation, state ownership, and writing flow

| Files | Actual implementation | Compliance effect |
| --- | --- | --- |
| `app/app/projects/[id]/structure/page.tsx`, `components/structure/StructureWorkspace.tsx`, `StructureLensNav.tsx` | Server-owned bounded Structure read model, five active S4 lenses only, one Discovery/Guided/Architect schema, persisted mode/lens/anchor/scroll/selection/pin state, accessible bounded-range navigation, return-to-writing link. | One workspace shell; no fake Milestones/Causal tabs; range controls avoid full-neighborhood loads; structure remains optional. |
| `components/structure/OutlineLens.tsx`, `BulkScaffold.tsx` | Inline plot/plot-outline/chapter-outline create/edit, collapse persistence, stable-ID promote/demote, explicit outline-block-to-scene conversion, deterministic scaffold preview dialog and reviewed-token apply. | Rich/freeform planning is explicit; conversion preserves provenance/backlink; reorder/scaffold cannot bypass preview. |
| `components/structure/VolumeLane.tsx`, `ChapterPlanningGrid.tsx` | Inline ordered volume/volume-outline operations, separate reorder preview/apply busy states, prose-first Chapter assignment/clearing, advisory targets and project-level empty state. | Volume ownership is optional; manuscript content is never loaded or edited by planning operations. |
| `components/structure/RelationshipLens.tsx`, `SemanticZoomViewport.tsx` | Non-causal reference composer/list, exact semantic path projection, active anchor selection, Narrative Intent for plot/volume/chapter/scene/paragraph selection and all S4 categories. | Relevance and intent remain explicit; Milestone/entity targets are absent until their canonical gates. |
| `components/editor/ChapterEditor.tsx`, `app/app/projects/[id]/page.tsx`, `components/shell/AppShell.tsx`, `app/globals.css` | Adds optional Structure navigation from editor/Project Home, Projects rail entry, responsive five-lens wrap, bounded-range controls, mobile/Dark styling and unchanged editor path. | Structure support cannot block typing, durability or continuation; final E2E proves exact position restoration. |

#### Documentation, verification, and tests

| Files | Actual implementation | Compliance effect |
| --- | --- | --- |
| `docs/adr/0005-structure-core.md`, `docs/architecture/structure-core.md`, `docs/api/structure.md`, `docs/operations/migrations.md` | Records optionality, ownership/relevance split, exact semantic coordinate, active/reserved endpoint lifecycle, APIs, budgets, revision/outbox behavior and rollback boundary. | Maintainers have explicit rules preventing S5/S6/future-domain activation and semantic collapse. |
| `scripts/verify-structure-core-db.ts`, `package.json` | Adds `db:verify:structure` and `db:rollback:structure`; verifies real PostgreSQL optionality, full writes/revisions/outbox, idempotency, ownership denial, bounded reads, deterministic scaffold, concurrent winner and isolated rollback. | Supplies database and recovery evidence rather than relying on mocks. |
| `tests/unit/*structure*`, `semantic-coordinate.test.ts`, `story-reference.test.ts` | Tests order/range invariants, deterministic allocation, exact ladder, active/reserved reference vocabulary and dormant conversions. | Domain doctrine and future-boundary rules are executable. |
| `tests/service/structure-service.test.ts`, `tests/component/structure-*.test.tsx`, `tests/stress/structure-core.stress.test.ts` | Tests validation/delegation/privacy, every active UI mutation/empty/error state, 10,000-chapter planning, 10,000 stable-ID reorder and hostile budget clamps. | Coverage thresholds pass without reduction; performance and content-safe boundaries are tested. |
| `tests/e2e/structure-core.spec.ts` | Tests zero-structure writing, reviewed scaffold/reorder, exact editor block/offset/scroll restoration, active-lens accessibility/no future lens, responsive mobile Dark Semantic Zoom and visual captures. | Direct writing-flow exit proof for S4. |

No file was deleted. Generated Prisma client, `.next`, coverage, Playwright report, screenshots and temporary PDF renders remain ignored build/evidence artifacts and were not committed.

### 9.6 Implementation method and architectural proof

1. Database and domain constraints were implemented before UI: nullable membership protects discovery writing; composite same-project foreign keys and repository ownership guards protect isolation; partial uniqueness protects active reference idempotency.
2. Every story mutation runs in one Prisma transaction. The canonical object/relation write, full `ObjectRevision`, optimistic `Project.structuralVersion` increment and content-free `OutboxEvent` either commit together or roll back together. `StructureViewState` is explicitly outside this story-truth transaction contract because it is user preference state.
3. Scaffold and reorder are two-step commands. Preview is pure after an ownership check; apply recomputes/verifies the deterministic plan token and expected version. Reorder applies only a complete unique current stable-ID set, temporarily shifts order indexes transactionally, then writes revisions.
4. The shared server projection is range/page/node/edge bounded. `rangeStart` is clamped to 1,000,000, queries use `skip`/`take`, the read model returns `nextRangeStart`, and the client exposes keyboard/pointer-operable previous/next ranges rather than materializing the full graph.
5. Semantic Zoom is built from a ruled ordered path, not containment inference. `PlotOutline` and `VolumeOutline` are first-class; optional coordinates disappear when absent; Milestone/Thread is documented as a future cross-cutting relevance step and never appears as an ownership parent.
6. UI state is local/persisted preference; canonical structure returns from the server after writes. `router.refresh()` rehydrates the new version. Existing continuation capture/restore remains the source of editor block/cursor/selection/scroll truth.
7. Failures degrade to stable errors or local form alerts. The editor, local journal, autosave, recovery, continuation and existing prose do not depend on Structure availability.

Alternatives rejected were required up-front planning, milestone-owned chapters, using a generic relationship as causality, client-owned full graphs, immediate apply without preview, and activating Note/Capture/timeline/entity endpoints from enum presence alone. Each would violate an explicit Bible or authorized WorkPlan boundary.

### 9.7 Console trace ledger with exact comment and call lines

Every row below has the exact adjacent identifying comment line and operational call line in content commit `b5a18a4`. Server service/page/API rows call the existing guarded structured logger transport; UI and DB-verifier rows use literal `console.log`. The comment text states the privacy constraint; only IDs, enums, counts, booleans, versions, route/status/error codes and positions are emitted.

| Step | File | Comment line → call line | Adjacent comment purpose |
| --- | --- | --- | --- |
| `S4-STRUCTURE-001` | `domains/structure/application/service.ts` | 48 → 49 | Bounded overview resolved without author-entered fields. |
| `S4-STRUCTURE-002` | same | 55 → 56 | Plot creation committed with structural version only. |
| `S4-STRUCTURE-009` | same | 62 → 63 | Plot edit committed without title/summary telemetry. |
| `S4-STRUCTURE-003` | same | 69 → 70 | Plot-outline write; payload excluded. |
| `S4-STRUCTURE-004` | same | 76 → 77 | Ordered volume create without title/summary telemetry. |
| `S4-STRUCTURE-010` | same | 83 → 84 | Volume edit with revision, no author text. |
| `S4-STRUCTURE-005` | same | 90 → 91 | Volume-outline write; payload excluded. |
| `S4-STRUCTURE-006` | same | 98 → 99 | Optional chapter-outline write without creative metadata. |
| `S4-SCAFFOLD-001` | same | 106 → 107 | Deterministic count-only preview. |
| `S4-SCAFFOLD-002` | same | 115 → 116 | Reviewed atomic apply with aggregate counts only. |
| `S4-ORDER-001` | same | 124 → 125 | Identity-preserving reorder preview. |
| `S4-ORDER-002` | same | 131 → 132 | Transactional reorder with stable identities. |
| `S4-STRUCTURE-007` | same | 138 → 139 | Prose-first membership change without reading prose. |
| `S4-STRUCTURE-008` | same | 145 → 146 | Promote/demote preserving outline identity/references. |
| `S4-SCENE-001` | same | 152 → 153 | Outline-block conversion; creative payload excluded. |
| `S4-INTENT-001` | same | 159 → 160 | Active-target intent without intent text. |
| `S4-REFERENCE-001` | same | 166 → 167 | Non-causal reference with endpoint identity/types only. |
| `S4-VIEW-001` | same | 174 → 175 | Preference state persisted separately from story truth. |
| `S4-API-001` | `lib/structure/http.ts` | 15 → 16 | Route/status-only successful operation. |
| `S4-API-002` | same | 20 → 21 | Stable error code without request payload. |
| `S4-UI-014` | `app/app/projects/[id]/structure/page.tsx` | 15 → 16 | Authenticated bounded workspace render. |
| `S4-UI-015` | `components/editor/ChapterEditor.tsx` | 208 → 209 | Editor-to-Structure navigation after continuation capture. |
| `S4-UI-001` | `components/structure/StructureWorkspace.tsx` | 32 → 33 | Active S4 lens change; dormant lenses unavailable. |
| `S4-UI-002` | same | 39 → 40 | Presentation mode change without schema change. |
| `S4-UI-024` | same | 55 → 56 | Bounded range navigation request. |
| `S4-UI-003` | `components/structure/BulkScaffold.tsx` | 30 → 31 | Count-only scaffold preview request. |
| `S4-UI-004` | same | 42 → 43 | Author confirms reviewed token; aggregate counts only. |
| `S4-UI-007` | `components/structure/OutlineLens.tsx` | 28 → 29 | Plot create/edit without author fields. |
| `S4-UI-016` | same | 38 → 39 | Plot-outline write without outline text. |
| `S4-UI-009` | same | 48 → 49 | Chapter-outline write without title/text. |
| `S4-UI-017` | same | 58 → 59 | Edit mode opened using stable identity only. |
| `S4-UI-018` | same | 65 → 66 | Promote/demote with identity/destination only. |
| `S4-UI-019` | same | 75 → 76 | Scene conversion without block/outline text. |
| `S4-UI-020` | same | 85 → 86 | Expansion state with identity/boolean only. |
| `S4-UI-008` | `components/structure/VolumeLane.tsx` | 23 → 24 | Volume create/edit with order/hard-target state only. |
| `S4-UI-021` | same | 33 → 34 | Volume edit mode with stable identity only. |
| `S4-UI-022` | same | 39 → 40 | Volume-outline write without outline text. |
| `S4-UI-005` | same | 49 → 50 | Reorder preview with stable IDs/count only. |
| `S4-UI-006` | same | 59 → 60 | Reviewed reorder confirmation with count only. |
| `S4-UI-011` | `components/structure/ChapterPlanningGrid.tsx` | 16 → 17 | Membership change without manuscript content. |
| `S4-UI-012` | `components/structure/RelationshipLens.tsx` | 19 → 20 | Reference submission with endpoint identity/types only. |
| `S4-UI-010` | `components/structure/SemanticZoomViewport.tsx` | 35 → 36 | Semantic anchor change with stable identity only. |
| `S4-UI-013` | same | 46 → 47 | Intent submission without text/selection content. |
| `S4-DB-001` | `scripts/verify-structure-core-db.ts` | 82 → 83 | Real DB aggregate verification without content emission. |
| `S4-DB-002` | same | 100 → 101 | Structure-only rollback/prose preservation counts. |

The final source scan found **45 S4 trace sites**. All 45 comments are immediately above their call. Service/UI privacy tests additionally submit sentinel private text and assert it is absent from emitted records. No S4 trace contains title, summary, document, outline text, intent text, revealed information, manuscript body, selection content or provenance note.

### 9.8 Validation, stress, recovery, and visual evidence

| Command/check | Result | Exact evidence |
| --- | --- | --- |
| `npm run db:generate` / `npm run db:validate` | Pass | Prisma Client 7.9.1 generated; schema valid. |
| `npm run typecheck` / `npm run lint` | Pass | Strict TypeScript passed; ESLint passed with zero warnings. |
| `npm run test` | Pass | 28 test files, 97 tests passed after S4 interaction coverage additions. |
| `npm run test:stress` | Pass | 3 stress files, 7 tests: deterministic 10,000-placeholder allocation, 10,000 stable-ID reorder, hostile budget clamps plus Phase 1 stress. |
| `npm run test:coverage` | Pass | 90.39% statements (885/979), 78.22% branches (431/551), 87.16% functions (258/296), 95.32% lines (713/748); frozen 80/75/80/80 thresholds unchanged. |
| Production build with complete inert OIDC environment | Pass | Next.js 16.3 compiled, typechecked, prerendered and listed all 15 S4 API routes plus `/app/projects/[id]/structure`. An initial environment-less build failed only the frozen production-auth schema; rerun supplied OIDC-shaped variables and passed without changing security code. |
| `npm run db:rollback:structure` | Pass | `S4-DB-002`: 0 S4 tables, 0 S4 Chapter columns, 6 prior tables preserved, 1 sampled prose row byte-equivalent. |
| `npm run db:deploy` | Pass | Cleanly reapplied `20260812230000_structure_core` after rollback. |
| `npm run db:verify:structure` | Pass | `S4-DB-001`: project version 11; volumes 2; chapters 3; outline 1; scene 1; references 2; outbox 10; revisions 12; complete snapshots true; duplicate idempotent; cross-workspace read/write false; unknown endpoint false; scaffold 2 volumes/5 placeholders; bounded 3 nodes/0 edges; concurrent winners 1/conflicts 1. |
| `npm run test:e2e -- tests/e2e/structure-core.spec.ts` | Pass | 5 applicable tests passed; 5 intentional cross-project duplicates skipped. Zero structure, reviewed scaffold/reorder, exact writing restoration, accessibility/active lenses and mobile Dark mode all passed. |
| Exact writing-position proof | Pass | Same chapter URL, same stable block ID, same selection offset and scroll delta ≤2 after editor → Structure → editor; `S3-CLIENT-002` restoration trace observed. |
| Accessibility/keyboard | Pass | All five active lenses are buttons; no Milestones/Causal control; normal pointer/keyboard-operable range/lens controls; axe serious/critical violations `[]`. |
| Visual responsive/theme audit | Pass | Manually inspected `test-results/structure-core-desktop.png` and `structure-core-mobile-dark.png`. Desktop bounded form layout and mobile wrapped lens navigation/Semantic Zoom show no clipping, collision or unreachable control. A detected mobile overlap was fixed by adding `max-width/min-width` containment and wrapping lenses, then rerun passed with a normal click. |
| Content/trace audit | Pass | `rg` adjacency scan listed all 45 trace comments/calls; sentinel UI/service tests prove private fields absent; guarded logger still rejects content-bearing metadata keys. |
| Git scope | Pass with recorded formatting note | Content commit contains 58 S4 files/changes and 3,282 insertions; no generated/test-result/PDF artifact. `git diff --check` reported only redundant blank-line-at-EOF warnings on several new files, not whitespace errors; lint/build/CI passed. This style cleanup is nonfunctional and is not an S4 compliance gap. |
| Remote CI | Pass | GitHub Actions run `31623924571`, job `94205355140`, head `b5a18a4289d2555a2891d53973c78fd4a0b85aa8`; install, Prisma generation, lint, typecheck, 97-test coverage and production build all passed in 2m1s. Nonblocking action-runtime Node 20 deprecation annotation remains workflow-maintenance work. |

### 9.9 Side-by-side S4 conformance audit

| WorkPlan S4 requirement | Actual evidence | Classification | Audit action/result |
| --- | --- | --- | --- |
| Complete S4 canonical objects, no Milestone persistence | Schema/migration/repository contain Plot/outlines/Volume/Scene/Intent/Reference/revision/view only | Verified | Schema search confirms no `Milestone`/`CausalRelation`; none added. |
| Optional chapters/volumes/outlines/scenes | Nullable Chapter membership; zero-structure DB/service/E2E | Verified | Writer saved/returned to prose with every structure collection empty. |
| Ownership versus relevance | Composite FKs, membership versus `StoryReference`, semantic docs/tests | Verified | No relationship or milestone owns Chapter. |
| Rich/freeform optional outlines and metadata | JSON document + plain text + optional purpose/emotion/reveals/keys/target/stubs | Verified | No row created by ordinary chapter writing; explicit write/scaffold only. |
| Discovery/Guided/Architect one schema | `StructureViewState.mode` and UI presentation only | Verified | Mode tests show same canonical model/validation. |
| Deterministic S4 scaffold, no milestones | SHA-256 planner, reviewed token/version apply, 10,000 property/stress and E2E | Verified | No milestone placeholder/date/allocation field exists. |
| Existing-domain conversions with provenance/backlinks | Chapter membership and outline-block Scene transaction/revision/backlink | Verified | Dormant Note/Capture port returns dependency unavailable. |
| Soft creative constraints | Optional target + explicit `hardTargetWordsEnabled` validation | Verified | Ordinary advisory target never gates writing. |
| Narrative Intent on all active S4 targets/categories | Strict target/category schema, endpoint validation, Semantic Zoom form/tests | Verified | Milestone/entity targets absent; paragraph requires block/range. |
| Five active lenses only | Lens tuple/nav/E2E contains Outline/Volumes/Chapters/Relationships/Semantic Zoom | Verified | Milestones/Causal queries return no control. |
| Inline create/edit, previewed reorder, persistence, promote/demote | S4 components/routes/service/repository and component/E2E tests | Verified | Stable IDs preserve references; view state persists expansion and position. |
| Exact ruled Semantic Zoom | Coordinate builder/tests/UI/docs include both outline levels and cross-cutting Milestone ruling | Verified | Optional coordinates skipped; Chapter Outline does not gate Chapter. |
| Preserve anchor/cursor/scroll/selection/pins | View-state schema/repository plus existing continuation and exact E2E | Verified | Return restores stable block/offset/scroll; pins stored bounded. |
| Bounded/virtualized or clustered neighborhoods | Server range/page/node/edge ceilings, `nextRangeStart`, explicit range UI, stress | Verified | No endpoint/client loads full structure/graph by default. |
| Stable envelopes, structural version, outbox, revisions | Shared HTTP boundary and real DB counts/full snapshots/concurrency | Verified | Preference write explicitly excluded from story version. |
| S4 separate evidence/remote gate | Plan/content commits and two green remote runs | Verified | S5 remains code-locked until this evidence commit is remotely green. |

Doctrine audit answers: no new path makes structure/scenes/intent/reference mandatory; no milestone exists or owns a chapter; hierarchy/reference facts never become causality; no structural write edits prose; view state/read models remain noncanonical; refresh follows every successful write; no billing/quota path exists; Structure failure cannot block editor/durability/continuation; content is excluded from logs/errors/tests; all aggregate reads are bounded; no AI or later endpoint/conversion/card/provider was activated; directive `becauseItems[]`/`consequenceItems[]` are untouched; Semantic Zoom uses the ruled outline-aware order; pricing is untouched; no non-V2 scope was added.

### 9.10 Deviations, findings, and repairs

- **Resolved preview ownership gap:** initial preview routes authenticated but did not verify the project before pure calculation. Added `StructureRepository.assertProjectAccess`, called it in both preview services, changed routes to pass the actor, and added rejection tests. This restores the global ownership rule without changing deterministic preview semantics.
- **Resolved pagination/range gap:** the first overview implementation enforced page/node/edge maxima but exposed only the first range. Added clamped `rangeStart`, repository `skip/take`, `nextRangeStart`, server query propagation, accessible previous/next UI and stress tests. This satisfies the explicit list/range requirement.
- **Resolved view-anchor ambiguity:** the initial view-state validator accepted any short anchor type and cast it to the database enum. Replaced it with the exact active S4 endpoint enum so reserved/unknown values fail validation before persistence.
- **Resolved scaffold/reorder UI race:** separate preview/apply busy states and explicit response assertions ensure apply controls do not disappear or block each other and test failures distinguish HTTP errors from server-render refresh latency.
- **Resolved mobile interaction defect:** a narrow-screen horizontal lens strip visually exposed Semantic Zoom but allowed neighboring content to intercept pointer input. The workspace now has explicit min/max width containment and the lens row wraps on mobile; normal pointer click and visual rerun pass.
- **Coverage gate repair:** first S4 coverage run passed all 82 then-current tests but failed frozen coverage thresholds. Added meaningful service and interaction tests for every active mutation, privacy, errors, empty optionality and bounds; final 97-test coverage passes without lowering thresholds.
- **Build invocation repair:** environment-less production build failed the already-correct production authentication schema. No code was weakened; a complete inert OIDC-shaped build environment was supplied and the build passed, matching CI.
- **No WorkPlan correction required:** all repairs implement existing WorkPlan/global requirements. The S4 design did not reveal a Bible contradiction or authorized-ruling change.
- **Planned later, not gaps:** milestone objects/lens/roles/dependencies/progress/scaffold additions are S5; causal objects/adapters/lens/traversal are S6; Note/Capture/entity/timeline conversions/endpoints remain dormant for their later gates; phase-level macro exit remains incomplete until S5 and S6 pass.
- **Remaining S4 gaps:** none.

### 9.11 Gate and Git evidence

- **Gate result:** **TECHNICAL PASS; EVIDENCE CLOSURE IN PROGRESS — Sub-gate 4 Structure Core is implemented, stress tested, side-by-side audited, and its content commit is pushed/remotely verified.** S4 becomes formally Passed and S5 becomes eligible only after this evidence-ledger commit is pushed and its remote CI is green.
- **Branch:** `agent/workplan-subgates-audit`.
- **Pre-code plan:** `abcd402382aa1c8f391a68276c8a0330b06d9d29` (`Plan Structure Core sub-gate`); CI run `31615214091`, job `94176213553`, passed.
- **Content commit:** `b5a18a4289d2555a2891d53973c78fd4a0b85aa8` (`Implement Structure Core sub-gate`), 58 changed/new files and 3,282 insertions.
- **Push:** `abcd402..b5a18a4  agent/workplan-subgates-audit -> agent/workplan-subgates-audit` succeeded.
- **Remote:** `https://github.com/InfernusReal/Mythra-V2.git`; draft PR `#1` remains the review surface.
- **Remote verification:** GitHub Actions run `31623924571`, job `94205355140`, exact head SHA `b5a18a4289d2555a2891d53973c78fd4a0b85aa8`, passed all steps in 2m1s.
- **Content rollback/revert point:** predecessor evidence `543fe83345d1ec2066a21010046e9a6025175c2e`; S4 plan-only point `abcd402382aa1c8f391a68276c8a0330b06d9d29`; database-only reversal is the reviewed S4 rollback SQL and was proven independently.
- **Evidence-ledger commit:** pending this update; its hash, push and remote run are recorded in the S5 predecessor proof after successful remote verification because a commit cannot contain its own hash.

## 5. Entry P0 — Planning baseline and source audit

### 4.1 Run identity

- **Date:** 12 August 2026
- **Repository workspace:** `C:\Users\Saif malik\OneDrive\Documents\Desktop\Documents\ChatGPT\Mythra-Final`
- **GitHub target:** `https://github.com/InfernusReal/Mythra-V2`
- **Source:** `Mythra_V2_Product_Engineering_Implementation_Bible_v2.2.docx.pdf`
- **Source version/date:** 2.2 / 12 August 2026
- **Source extent:** 84 pages
- **Baseline Git state:** local repository on unborn `master`; no commits, files, or remotes
- **GitHub state:** private empty repository, authenticated user has administrator permission, no default branch

### 4.2 Intended work

Create an exhaustive implementation plan and a durable evidence ledger before application code is written. Consolidate the Bible's original phases without dropping any product, UX, frontend, backend, data, reliability, billing, automation, security, operations, testing, portability, accessibility, localization, scaling, or future-agent obligation.

### 4.3 Source-study evidence

- Read extracted text for every page 1–84, in order.
- Visually rendered and inspected representative source pages covering:
  - cover/version and thesis (page 1);
  - eight compounding systems and operational loop (page 7);
  - Contextual Writing Field composition/precedence (page 12);
  - frontend module map (page 37);
  - backend architecture/module map (page 40);
  - database schema table (page 43);
  - complete original implementation roadmap and acceptance template (pages 70–71);
  - screen-by-screen implementation table and loading sequence (page 72);
  - context resolver inputs/order/stability (page 79);
  - final doctrine checklist and causal doctrine (page 82);
  - causal acceptance tests and final north star (page 84).
- Confirmed that visual table/diagram structure agrees with text extraction on the implementation-critical pages.
- Identified Bible roadmap phases 0–17 and consolidated them in contiguous order as `0–3`, `4–6`, `7–11`, `12–13`, `14–16`, and `17 + launch`.

### 4.4 Files created

#### `WorkPlan.md`

Produced:

- authority/conflict rules and completion language;
- automatic per-phase audit/commit/push protocol;
- all eleven non-negotiable laws and the friction test;
- hierarchy/chronology/causality invariant;
- V2-wide anti-goals and future boundaries;
- baseline modular-monolith repository map;
- six detailed implementation phases with source coverage, scope, anticipated files, coding method, and exit gates;
- global acceptance contract;
- side-by-side coverage and contradiction audit protocol;
- source coverage matrix for Bible sections 0–39 and appendices A–E;
- complete-product definition.

#### `Path.md`

Produced:

- actual-versus-planned evidence doctrine;
- mandatory per-run update protocol;
- phase status ledger;
- this planning/source-study entry;
- reusable detailed phase-entry and final-audit templates below.

### 4.5 Application code produced

None. The repository had no application baseline and this run is limited to studying the source and creating the plan/ledger. No product capability may be marked implemented from this entry.

### 4.6 Conformance with `WorkPlan.md`

| Check | Status | Evidence |
| --- | --- | --- |
| Bible is authoritative | Verified | `WorkPlan.md` section 1 conflict rule |
| Practical workload divided into coherent phases | Verified | Six-phase contiguous mapping in `WorkPlan.md` section 4 |
| Nothing in original roadmap phases 0–17 omitted | Verified at planning level | Every original phase has exactly one macro-phase owner |
| Every Bible top-level section mapped | Verified at planning level | `WorkPlan.md` section 12.3 maps 0–39 and A–E |
| Each phase explains scope | Verified | `Scope` subsection in phases 1–6 |
| Each phase explains files | Verified | `Files created or materially implemented` in phases 1–6 |
| Each phase explains code/method | Verified | `How the code will be produced` in phases 1–6 |
| Each phase has acceptance gate | Verified | `Exit gate` in phases 1–6 plus global contract |
| Path ledger requires deep implementation evidence | Verified | `Path.md` sections 1–2 and templates |
| Automatic phase audit/commit/push required | Verified | `WorkPlan.md` sections 1.2/11 and `Path.md` section 2 |
| No application behavior falsely claimed | Verified | Section 4.5 explicitly records none |

### 4.7 Gaps, deviations, and corrections

- **No product-code gap is evaluated yet.** Application implementation has not started.
- **Repository initialization:** the supplied GitHub repository is empty. The planning commit must establish its first branch/default history; its final branch, commit, push, and remote verification will be appended to this entry after success.
- **Source naming:** the Bible calls for a “Pathway V2 entry”; the user requested `Path.md`. This file explicitly serves as that Pathway V2 ledger, so the naming difference does not change the requirement.
- **Technology versions:** intentionally not invented. The Bible requires exact versions to be pinned at implementation time; Phase 1 owns that ADR and lockfile evidence.

### 4.8 Validation performed

- **Complete-source review:** extracted and read PDF pages 1–84 in order; separately rendered the implementation-critical pages listed in section 4.3 and visually confirmed their tables/diagrams. Result: pass.
- **Source heading audit:** extracted major headings from the PDF and confirmed source sections 0–39 and appendices A–E are present. Result: pass.
- **Plan coverage audit:** verified a source coverage row for each numbered section 0–39 and each appendix A–E. Result: pass; no missing owner.
- **Roadmap consolidation audit:** verified six macro-phase headings and contiguous original-phase mappings `0–3`, `4–6`, `7–11`, `12–13`, `14–16`, and `17 + launch`. Result: pass; phases 0–17 are neither skipped nor multiply owned.
- **Requirement vocabulary audit:** checked the plan for every implementation-critical system/domain term, including Uninterrupted Writing Time, all eight compounding systems, Narrative Semantic Zoom, directive/coordinate projections, durability, billing, security, operations, internationalization, and agent seams. Initial implied-only findings were corrected as described in section 4.7; final result: pass.
- **Markdown structural audit:** six phase headings, balanced code fence count, required blank lines after headings, and no missing required-term findings. Result: pass.
- **Contradiction audit:** reviewed optionality versus integrity, milestone links versus ownership, hierarchy/chronology/causality, canonical state versus projections, synchronous truth versus eventual freshness, creative softness versus hard integrity, downgrade/quota versus read/export, Peek/Open focus, no-AI core versus proposal tools, content privacy, bounded queries, and V2 versus future scope. Result: pass; no unresolved contradiction.
- **Scoped Git audit:** only `WorkPlan.md` and `Path.md` were staged. `git diff --cached --check` initially found six Markdown hard-break trailing spaces; they were removed and the check then passed. No QA render or source PDF entered the commit.
- **Remote audit:** after push, `git rev-parse HEAD` and `git ls-remote origin refs/heads/main` returned the same full commit; GitHub reported a non-empty repository with default branch `main`. Result: pass.

### 4.9 Git evidence

- **Status:** planning content committed, pushed, and remotely verified
- **Branch:** `main`, created as the initial/default branch because the supplied repository had no refs
- **Content commit:** `3991251f1212b2e83e0681a0819e38c5ae6e337f` — `Plan Mythra V2 implementation`
- **Committed scope:** `WorkPlan.md` and `Path.md`, 1,077 inserted lines; no application code or PDF intermediates
- **Remote:** `https://github.com/InfernusReal/Mythra-V2.git`
- **Push:** `main -> main`, upstream tracking established
- **Remote verification:** local `HEAD` and `refs/heads/main` both resolved to `3991251f1212b2e83e0681a0819e38c5ae6e337f`; GitHub default branch resolved to `main`
- **Audit-ledger commit:** this evidence update is committed and verified immediately after the content commit; its hash is reported in the final handoff because a commit cannot contain its own hash.

## 5. Entry P1 — Original-gate restoration and implementation-ruling audit

### 5.1 Run identity

- **Date:** 12 August 2026
- **Delivery phase:** planning correction; no product phase or capability started
- **Sub-gate:** none; all Sub-gates 0–17 remain `Not started`
- **Baseline branch/commit:** `main` at `09fbb8b143ac2e28e128803d6868a633a169d621`
- **Correction branch:** `agent/workplan-subgates-audit`
- **Source:** Mythra V2 Product + Engineering Implementation Bible v2.2 plus user-authorized post-freeze implementation/commercial decisions
- **Intended scope:** amend only `WorkPlan.md` and `Path.md`; produce no application code

### 5.2 Source verification

- Re-read and visually inspected Bible pages 15–16 for the literal Semantic Zoom ladder and the eight Relevant Now outputs, including Because and Consequences.
- Re-read and visually inspected page 23 for the section 7.6 projection fields and section 7.7.1 eligible causal nodes. Confirmed the projection list omits explicit Because/Consequences even though section 4.9 makes them first-class outputs.
- Re-read and visually inspected pages 67–68. Confirmed all fourteen critical E2E scenarios belong to section 31.2 and visual regression is the separate section 31.3.
- Re-read and visually inspected pages 70–71. Confirmed phases 0–17 are coherent capability phases with distinct writing-flow gates and that the Pathway V2 entry is part of every gate's acceptance evidence.

### 5.3 Findings accepted and corrections made

| Finding | Classification | Correction |
| --- | --- | --- |
| Six macro gates could mask original phases 0–17 | Gap | Restored Sub-gates 0–17 as the controlling execution state machine; every predecessor requires separate evidence, audit, commit, push, and remote verification. |
| Phase 2 claimed causal endpoints whose domains arrive in Phase 3 | Gap | Phase 2 now defines the full enum/adapter interfaces but activates only milestone, chapter-outline, scene, Narrative Intent, manuscript-block, and Story Change endpoints. Future endpoint creation is rejected until its adapter is registered. |
| Notes/Capture after-the-fact conversions were referenced before their sources existed | Gap | Phase 2 keeps dormant conversion interfaces only. Phase 3 activates Capture, entity, Note, and timeline conversions in Sub-gates 8, 9, and 11 respectively. |
| Phase 3's combined scope could also bypass internal sub-gate dependencies | Derived gap | Context cards, Capture targets, Search providers, entity-state endpoints, and timeline endpoints now activate only in their owning ordered sub-gates. Search + Language is explicitly before Timeline + Research. |
| Because/Consequences absent from the “complete” durable field list | Specification clarification | Added explicit `becauseItems[]` and `consequenceItems[]` to both initial and durable `NarrativeDirectiveProjection` contracts. |
| Semantic Zoom ladder omitted Plot/Volume Outlines and placed Chapter before Chapter Outline | Authorized implementation ruling | Locked `Series/Project → Plot → Plot Outline → Volume → Volume Outline → Milestone/Thread → Chapter Outline → Chapter → Scene → Prose`, with milestones cross-cutting and optional levels skippable. |
| Frozen `$10 Entry / $25 Pro` pricing is commercially superseded | Authorized commercial erratum | Required Pricing Decision ADR: USD 15 Mythra Core with full deterministic V2; dormant future USD 25 Mythra Intelligence only when AI exists. Removed non-AI Entry/Pro gating and analytics assumptions. |
| `Path.md` versus “Pathway V2 entry” terminology | Cleanup | Declared `Path.md` the canonical Pathway V2 execution ledger in its title and authority section. |
| E2E source wording cited 31.2–31.3 together | Cleanup | Corrected to fourteen E2Es in 31.2 plus a separate visual-regression matrix in 31.3. |

### 5.4 Files changed and application code

- **`WorkPlan.md`:** restored mandatory sub-gates, staged domain/provider activation, locked directive and Semantic Zoom contracts, applied the pricing erratum, and tightened gate/audit/completion language.
- **`Path.md`:** strengthened Pathway authority, added the Sub-gate 0–17 status ledger, updated the execution protocol, and added this correction entry.
- **Application code/migrations/configuration:** none. No Mythra capability is implemented or verified by this planning correction.

### 5.5 Conformance audit

| Check | Status | Evidence |
| --- | --- | --- |
| Exactly eighteen original capability rows exist | Verified locally | `WorkPlan.md` section 4.1 contains Sub-gate 0 through Sub-gate 17 exactly once. |
| Predecessor gating is mandatory | Verified locally | `WorkPlan.md` sections 1.2, 4.1, phase headers, exit gates, global contract, and definition of complete. |
| Pathway tracks every sub-gate | Verified locally | `Path.md` section 3.1 contains all eighteen locked status rows. |
| Phase 2 exposes no nonexistent active endpoint | Verified locally | Active adapter list is limited to domains available by Sub-gate 6; future discriminants reject creation. |
| Phase 3 provider order is internally possible | Verified locally | Sub-gates 7–11 register context/conversion/search/causal adapters only after canonical source domains exist. |
| Because and Consequences are first-class | Verified locally | `becauseItems[]` and `consequenceItems[]` appear in v1 and durable projection contracts. |
| Semantic coordinate is unambiguous | Verified locally | One ruled ladder, outline IDs, cross-cutting milestone semantics, optional-skip behavior, and coordinate tests are specified. |
| Pricing cannot regress to two non-AI tiers | Verified locally | Core/Intelligence erratum, anti-goal, ADR requirement, billing scope, metrics, exit gate, and coverage matrix agree. |
| E2E/visual section references are exact | Verified locally | E2Es cite 31.2; visual regression cites 31.3 separately. |
| Product implementation status remained honest at P1 audit time | Verified historically | At that planning-audit commit every capability row was `Not started`; the canonical dashboard in section 3 now supersedes that point-in-time status and records S0–S3/Phase 1 complete. |

### 5.6 Validation and contradiction audit

- **Markdown structure:** six macro-phase headings, balanced code fences, correct blank lines after headings, and `git diff --check` with no whitespace errors. Result: pass.
- **Sub-gate uniqueness:** `WorkPlan.md` contains exactly eighteen control rows and `Path.md` exactly eighteen status rows; both sets are unique and complete from 0 through 17. Result: pass.
- **Predecessor chain:** every WorkPlan control row 1–17 explicitly references the immediately preceding Sub-gate. Result: pass; no missing predecessor reference.
- **Source coverage regression:** all numbered source rows 0–39 and appendices A–E remain present. Result: pass.
- **Dependency-order audit:** Phase 2 activates only existing causal endpoints and rejects reserved future types; Phase 3 registers Capture, entity-state, Search/context, and timeline providers only after their canonical domains exist. Result: pass.
- **Semantic/directive exactness:** the ruled ladder appears identically in the authority ruling and Phase 2; `becauseItems[]` and `consequenceItems[]` appear in the authority ruling, v1 compiler, and durable projection. Result: pass.
- **Pricing audit:** executable Phase 5 scope, metrics, files, method, and exit gate use USD 15 Core/full deterministic access and dormant future USD 25 Intelligence. The old `$10 Entry / $25 Pro` phrase remains only inside explicitly labeled superseded/erratum history. Result: pass.
- **Testing citation audit:** executable plan cites fourteen E2Es in section 31.2 and visual regression separately in 31.3. The combined citation remains only in this historical finding row. Result: pass.
- **Scope audit:** working tree contains modifications only to `WorkPlan.md` and `Path.md`; no application/source/config/migration file and no PDF render remains. Result: pass.
- **Remote verification:** pass. Local content commit and `refs/heads/agent/workplan-subgates-audit` both resolved to `0963fb09fb6f959ad0f1e5bbabe1fbc89b1fb4ad` after push.

### 5.7 Git evidence

- **Status:** audited, committed, pushed, and remotely verified
- **Branch:** `agent/workplan-subgates-audit`
- **Remote:** `https://github.com/InfernusReal/Mythra-V2.git`
- **Content commit:** `0963fb09fb6f959ad0f1e5bbabe1fbc89b1fb4ad` — `Restore original capability gates`
- **Push:** upstream tracking established for `origin/agent/workplan-subgates-audit`; Git reported a new remote branch.
- **Remote verification:** `git ls-remote origin refs/heads/agent/workplan-subgates-audit` returned `0963fb09fb6f959ad0f1e5bbabe1fbc89b1fb4ad`, exactly matching the local content commit.
- **Audit-ledger commit:** this evidence update is committed and pushed immediately after the verified content commit; its hash is reported in the final handoff because a commit cannot contain its own hash.
- **Pull request:** draft PR [#1 — Restore original Mythra V2 capability gates](https://github.com/InfernusReal/Mythra-V2/pull/1) opened against `main` after the evidence commit; GitHub reported two commits and exactly two changed files at creation.
- **Authentication note:** Git push succeeded through configured Git credentials. The cached local `gh` token was invalid, but the authenticated GitHub connector created the draft PR without weakening remote verification.

## 6. Reusable implementation entry template

Copy this section for every bounded implementation run. Do not delete fields; use `Not applicable` with a reason when a category genuinely does not apply.

### Entry [phase/run ID] — [capability]

#### A. Run identity and authorization

- Date/time and timezone:
- Work-plan phase:
- Mandatory Sub-gate:
- Predecessor Sub-gate commit/remote verification:
- Bible roadmap phase(s):
- Bible sections/subsections:
- Baseline branch/commit:
- Intended capability slice:
- In-scope files/domains:
- Pre-existing unrelated changes and preservation decision:

#### B. Plan before code

- Exact scope from `WorkPlan.md`:
- Dependencies already verified:
- Assumptions:
- Risks to writing flow/data/privacy:
- Planned migrations and rollback:
- Planned tests and measurable budgets:

#### C. Files changed

For every file:

| File | Action | Purpose | Work-plan item | Bible source |
| --- | --- | --- | --- | --- |
| absolute/repo path | created/modified/moved/deleted | precise role | section/item | section/subsection |

For generated migrations/lockfiles, record the generator, inputs, and review result. For deletion, record impact and recovery path.

#### D. Code and behavior implemented

Describe each applicable layer in depth:

- Canonical domain types and invariants:
- Database tables/columns/constraints/indexes/migrations:
- Repository queries, ownership guards, and transaction boundaries:
- Services/application orchestration and domain events:
- Read models/projections/freshness/rebuild behavior:
- API/server action contracts, validation, envelopes, idempotency:
- Client/server state ownership and caching:
- UI components, routes, interaction/focus/keyboard behavior:
- Editor/document schema/local journal/autosave/recovery impact:
- Offline/degraded behavior:
- Security/privacy/rate limit/audit effects:
- Observability/analytics and proof that content is excluded:
- Accessibility/IME/i18n/responsive/theme effects:
- Performance bounds/virtualization/pagination/job behavior:
- Import/export/backup/migration/rollback effects:
- Feature flags/entitlements/quotas/downgrade behavior:
- Explicitly unchanged behavior and anti-goals protected:

#### E. Implementation method

- Why this design satisfies the Bible:
- Alternatives considered:
- Why any implementation-specific choice does not narrow the Bible:
- How failure degrades without blocking writing:
- How canonical truth and projections remain separated:
- How hierarchy, chronology, causality, and reference semantics remain separated:

#### F. Validation evidence

| Command/check | Result | Evidence/artifact | Notes |
| --- | --- | --- | --- |
| exact command or manual protocol | pass/fail/skipped/blocked | output/path/link | timings, environment, limitations |

Include applicable:

- lint/type/build;
- unit/service/repository/integration/property tests;
- E2E and exact writing-position recovery;
- visual/theme/responsive regression;
- accessibility/keyboard/screen reader/IME;
- offline/network/conflict/recovery;
- security/ownership/rate limit/content-redaction;
- migration forward/backward/repair;
- load/performance/budget;
- snapshot/backup/restore/export round trip;
- idempotency/event replay/projection rebuild;
- manual writing-flow/friction test.

#### G. Side-by-side conformance audit

| Requirement | Work-plan owner | Actual evidence | Classification | Action |
| --- | --- | --- | --- | --- |
| precise requirement | section | file/test/result | Verified / Implemented-not-verified / Planned-later / Bible-optional / Bible-future / Gap | fix or rationale |

Also answer:

- Did any new path make structure, scenes, world data, Capture filing, or causality mandatory?
- Did any milestone become a chapter owner?
- Did any hierarchy/timeline/reference fact become causality implicitly?
- Did any causal/structural write auto-edit prose?
- Did any client cache/projection become canonical truth?
- Could stale derived data appear authoritative after a write?
- Could a quota/downgrade block reading or exporting existing prose?
- Could a support failure block the editor?
- Could logs, analytics, traces, errors, admin, or tests leak content?
- Could a query load an unbounded project/graph?
- Did an AI/tool proposal become canonical without approval?
- Did the current Sub-gate activate a later endpoint, conversion target, context card, search provider, or billing capability before its canonical source domain and predecessor gate existed?
- Does every directive representation preserve explicit `becauseItems[]` and `consequenceItems[]` rather than folding them into generic context?
- Does Semantic Zoom preserve the ruled outline-aware coordinate order while keeping milestones cross-cutting and structure optional?
- Does billing preserve USD 15 Core/full deterministic V2 and keep USD 25 Intelligence dormant until AI exists?
- Did implementation add non-V2 product scope?

#### H. Deviations, gaps, and repair

- Deviation from plan:
- Bible compatibility:
- Root cause:
- Files/tests corrected:
- `WorkPlan.md` correction required and completed:
- Remaining gaps and owner:
- Phase status after audit:

#### I. Git and remote evidence

- Final scoped `git status`/diff review:
- Branch:
- Commit hash/message:
- Push command/result:
- Remote URL:
- Remote branch/commit verification:
- PR URL/status if a PR is used:
- Rollback/revert point:

## 7. Final V2 audit template

The final Phase 6 entry must include this additional audit.

### 7.1 Original roadmap coverage

List Bible phases 0–17 individually with macro-phase owner, predecessor-gate evidence, files, tests, and distinct verified remote commit. Prove from timestamps/commits that no later original capability started before its predecessor passed.

### 7.2 Full source coverage

List Bible sections 0–39 and appendices A–E individually. No row may remain `Planned-later` for V2 requirements. Optional/future rows must cite the source language and implemented seam/non-goal.

### 7.3 Critical scenarios

Record results for all fourteen Bible E2E scenarios from section 31.2, the separate visual-regression matrix from section 31.3, appendix E.6 causal tests, and appendix D doctrine questions.

### 7.4 Contradiction report

Record the searches/reviews used to test optionality, ownership, truth dimensions, freshness, recovery, quota/export, privacy, scale bounds, no-AI core, and future scope. Every conflict must cite its fix commit.

### 7.5 Launch evidence

Record all eleven section 38.1 launch conditions, backup/restore drill, billing/downgrade behavior, friction instrumentation, security/privacy review, accessibility/mobile/IME review, and the ten-paying-author validation measurement plan.

### 7.6 Final Git proof

Record the commit containing the final audited `WorkPlan.md` and `Path.md`, push result, remote commit verification, and release/tag state if used.
