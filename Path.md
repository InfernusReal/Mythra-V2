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
| 2. Progressive and Causal Story Core | 4–6 | **Passed — macro audit and remote ledger proof complete** | Entries S4–S6, Phase 2 macro audit 11.12 and reconciliation 11.14 below | S6 evidence `de56f246c2ccb69340ec1f712260f81f6c737d4d`; CI `31942667487`/`95153984486` passed |
| 3. In-Flow Author Environment | 7–11 | **In progress — S7–S11 Passed; macro audit locally passed and its distinct evidence/remote proof is pending** | Entries S7–S11 and Phase 3 macro audit 17 below | Integrated-verifier correction `e6f53dbff5030f2f9f1407265678f009755072e8`, CI `33242281126`/`99073540416` passed; macro evidence commit/CI pending |
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
| 4 | Structure Core | 2 | **Passed** | Sub-gate 3 evidence `d98b27a7238d2ec72c5af4e94beef68958e19625` verified | Entry S4 | Plan `abcd402382aa1c8f391a68276c8a0330b06d9d29`; content `b5a18a4289d2555a2891d53973c78fd4a0b85aa8`; evidence `ab766a8663a27aaf22a151067f65cd6a52fe37a3`; CI `31624497993`/`94207285676` passed |
| 5 | Milestones | 2 | **Passed** | Sub-gate 4 evidence `ab766a8663a27aaf22a151067f65cd6a52fe37a3` and CI `31624497993`/`94207285676` verified | Entry S5 | Plan `6a4582272cf240dfc4e5dcbdd34881723c65eda2`; content `35d96cfef19a9d99f0bddb1a7af2beb318dd0a07`; evidence `dccf8db53808124d73f7135aa0d495716d0e6bef`; CI `31729273306`/`94545306078` passed |
| 6 | Causal Story Fabric Core | 2 | **Passed** | Sub-gate 5 evidence `dccf8db53808124d73f7135aa0d495716d0e6bef` and CI `31729273306`/`94545306078` verified | Entry S6 | Plan `09c0c88c4c14bc0371357ebee174a0aface6828c`; content `2261ff59b6781034967964fd4e2d5d46f593a3c0`; correction `69226bc15b5fa7ad51a72410907cae304a50c568`; evidence `de56f246c2ccb69340ec1f712260f81f6c737d4d`; CI `31942667487`/`95153984486` passed |
| 7 | Contextual Writing Field v1 | 3 | **Passed** | Sub-gate 6 reconciliation `a9c805da67253241b505d17c6b4c195f0cdfbf94`; CI `31942905552`/`95154541031` passed | Entry S7 | Plan `1787c6f65b60c92c566fadd90cab7dade3e2c893`; content `f1b870fddb55c4619c54a61d0a8e666df800daf9`; evidence `761f2d904651ac00cdcee5dd9ce34ec8fa866ba5`; CI `31948522601`/`95168263910` passed |
| 8 | Capture | 3 | **Passed** | S7 reconciliation `e044932a89e8ccfbb47976e14414250b6505579e`; CI `31949044123`/`95169528820` passed | Entry S8 | Plan `58437457018220b34c26cee1eb5e65ce4c85997f`; content `5bfb6397d457465fae31042aa327e137fa2dd7fe`; correction `3ef1b5641da38220559dd99e20074f03c2762a3a`; evidence `7bd4b85282b189d75e4333187dba009db267ce88`; reconciliation `a6be89f59e0f3da5d6dbbfda7f0f141d0db51137`; CI `31961088692`/`95199073965` passed |
| 9 | Universe | 3 | **Passed** | S8 reconciliation `a6be89f59e0f3da5d6dbbfda7f0f141d0db51137`; CI `31961088692`/`95199073965` passed | Entry S9 | Plan `b3f3e3a9176b501376bd5aef78bb26af054f8d8a`; product `e5131463791a5c20d005ae485f652922c8133876`; evidence `663ec69ea3d4869d43eb7a44de6d805a72ab339b`; CI `32046340519`/`95435025227` passed |
| 10 | Search + Language | 3 | **Passed** | S9 reconciliation `f0f02f06b2fbc80420311deb16d898ec32f1dddd`; CI `32046631131`/`95435939423` passed | Entry S10 | Plan `038946827bce1e9b749ad3df3815b40c63027cda`; product `2a512b6d1409831f433b56853ddd256428b1b36b`; evidence `4287dd2c8665b54f8777e38eb28e4d700646e657`; reconciliation `33ca9b0ce0ba6322a78a485daa69f7b896478c9c`; CI `32056804153`/`95468737816` passed |
| 11 | Timeline + Research | 3 | **Passed** | S10 reconciliation `33ca9b0ce0ba6322a78a485daa69f7b896478c9c`; CI `32056804153`/`95468737816` passed | Entry S11 | Plan `f6d0a35ba982827c42847fbe95099f8cf59fa652`; product `0a388fa8f2b9087b85e2947fbbd8c905d102637e`; initial evidence/reconciliation `397307f2d2fff71f7b6f06f0cd8944775437da30`/`7ad34fc7a8fe67e8fab0844b7e944429f2f0dcd0`; correction `9abbcdb8417ef989cb0f7a78718d104ee1b6e492`, CI `33241370463`/`99071181207`; correction evidence `a545a8a7c400c88cc86d667be961cd43951a2803`, CI `33241852820`/`99072432245` passed |
| 12 | Live Story Model | 4 | Not started | Sub-gate 11 required | — | — |
| 13 | Revisions + Snapshots + Export | 4 | Not started | Sub-gate 12 required | — | — |
| 14 | Billing + Quotas | 5 | Not started | Sub-gate 13 required | — | — |
| 15 | Performance + Accessibility + Mobile | 5 | Not started | Sub-gate 14 required | — | — |
| 16 | Launch Analytics + Operations | 5 | Not started | Sub-gate 15 required | — | — |
| 17 | AI Seam — no AI required | 6 | Not started | Sub-gate 16 required | — | — |

Sub-gates 0–11 and delivery Phases 1–2 are closed after separate local, database, browser, product, evidence, push and remote-CI proof. The S11 macro-review finding was corrected in product commit `9abbcdb8417ef989cb0f7a78718d104ee1b6e492` and recorded in evidence commit `a545a8a7c400c88cc86d667be961cd43951a2803`; both remotely matched and passed CI. This reconciliation changes no product file. Phase 3 remains In progress, and S12 remains locked, until a distinct Phase 3 macro audit is committed, pushed and remotely verified.

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
- **Evidence-ledger commit:** `ab766a8663a27aaf22a151067f65cd6a52fe37a3` (`Record Structure Core evidence`), pushed and remotely verified by GitHub Actions run `31624497993`, job `94207285676`; all CI steps passed in 1m58s. This is the immutable S5 predecessor proof.

## 10. Entry S5 — Milestones

### 10.1 Run identity and authorization

- **Date/time and timezone:** 12 August 2026, Asia/Karachi; recorded before any S5 migration, domain, route, component or test file.
- **Work-plan phase:** Phase 2 — Progressive and Causal Story Core.
- **Mandatory Sub-gate:** 5 — Milestones.
- **Predecessor evidence:** S4 plan `abcd402382aa1c8f391a68276c8a0330b06d9d29`, content `b5a18a4289d2555a2891d53973c78fd4a0b85aa8`, evidence `ab766a8663a27aaf22a151067f65cd6a52fe37a3`; GitHub Actions run `31624497993`, job `94207285676`, passed. S5 is eligible.
- **Baseline branch/commit:** `agent/workplan-subgates-audit` at `ab766a8663a27aaf22a151067f65cd6a52fe37a3`.
- **Bible/WorkPlan scope:** Bible sections 3.3–3.5, 5, 10, 12.1/12.5, 16–18, 20, 26, 31, 33, 35 and appendices B/C; WorkPlan 6.1 Milestones, shared API/durability seams and 6.4 writing-flow gate.
- **Capability boundary:** only `Milestone`, `ChapterMilestoneLink`, `MilestoneDependency`, milestone progress/scaffold additions, Milestones lens, cross-cutting semantic coordinate and Narrative Intent target registration. `StoryChange`, `CausalRelation`, causal endpoints/traversal/lens remain S6 and are prohibited here.

### 10.2 Plan before code

1. Add project-owned `Milestone` with stable identity, kind/thread label, order, optional chapter target range, optional soft target date/cadence projection, advisory target words, status, version and archive state.
2. Add many-to-many `ChapterMilestoneLink` with semantic role exactly `introduce`, `develop`, `escalate`, `turn`, `resolve`, or custom; store custom role label only for custom, nonnegative weight, project ownership and stable identity. A Milestone never owns a Chapter.
3. Add directed `MilestoneDependency` with same-project endpoints, active/tentative/retired state, optional note, version, self-edge rejection, duplicate-active idempotency and hard-dependency cycle detection. Dependency edges are planning prerequisites, not the generalized S6 causal fabric.
4. Derive progress from linked chapter completion/word state and weight; do not store progress as canonical truth. Ordered/range view is default; dependency graph is optional and bounded; chapter matrix exposes roles/weights without changing chapter ownership.
5. Extend the S4 deterministic scaffold with explicit milestone placeholders, target ranges, cadence-derived soft dates and advisory milestone allocation. Preview remains separate from apply; rebalance never invents creative milestone names beyond deterministic placeholders and never mutates prose.
6. Register `MILESTONE` as an active Narrative Intent and non-causal reference endpoint only after persistence and ownership validation exist. Extend Semantic Coordinate with Milestone/Thread as a cross-cutting relevance step, not an ancestor/parent.
7. Register the Milestones lens in the existing shell. Preserve S4 lenses and view state. Provide accessible ordered/range view, optional bounded dependency view, chapter matrix, inline create/edit/link/dependency operations and previewed milestone scaffold/rebalance.
8. Every canonical write must atomically advance `Project.structuralVersion`, write a full `ObjectRevision` and emit content-free outbox invalidation. List/progress/dependency reads remain project-owned and page/node/edge bounded.
9. Add adjacent `Console trace S5-*` comments/logs for service, route, UI, scaffold, dependency, projection and DB transitions. Metadata is limited to IDs, roles, states, counts, dates-as-presence, weights and versions; titles, custom labels, notes and author text are excluded.

### 10.3 Planned files and verification

| Area | Planned change | Required proof |
| --- | --- | --- |
| `prisma/schema.prisma`, `prisma/migrations/20260812*_milestones/{migration,rollback}.sql` | Add milestone/link/dependency enums, tables, constraints and indexes; extend endpoint/intent enums safely | Forward/rollback/forward preserves S4 and prose; same-project constraints and active duplicate guard pass. |
| `domains/milestones/domain/*` | Schemas, role/range/progress/allocation/cycle invariants | Property tests for normalized ranges, weighted progress, duplicate/cycle handling and deterministic allocation. |
| `domains/milestones/application/*`, `infrastructure/*`, runtime/HTTP | Commands, bounded projection, ownership-scoped transactions, revisions/outbox | Service and real DB tests for cross-workspace/project denial, stale version, idempotency and concurrency. |
| S4 structure/reference/semantic-coordinate seams | Activate Milestone endpoint/intent adapter and cross-cutting coordinate only after canonical persistence | Tests prove it is relevance/dependency, never ownership containment. |
| `/api/v2/projects/[id]/milestones/**` | CRUD, link, dependency, progress, scaffold preview/apply | Strict envelopes, expected version, preview token and bounds. |
| `components/milestones/*`, existing Structure shell/lens nav | Ordered range, dependency alternative, chapter matrix, scaffold preview and inline operations | Keyboard/axe/mobile/Dark tests; zero-milestone project has no blocking dashboard. |
| docs/scripts/tests/package commands | Semantics/API/migration docs, real DB verify/rollback, unit/service/component/stress/E2E | Full frozen coverage/build plus S5 writing flow and exact editor return. |

### 10.4 Pre-code conformance and gate lock

| Requirement | Planned evidence | Current classification |
| --- | --- | --- |
| Many-to-many role-based milestones, no ownership | Link table/composite FKs/domain tests/matrix | Planned; exact. |
| Ordered/range default plus optional dependency graph | Bounded projection and accessible view selector | Planned; exact. |
| Target ranges, cadence soft dates, advisory allocation/progress | Pure projection/scaffold with preview apply | Planned; exact. |
| Milestone Narrative Intent and semantic coordinate | Active adapter after persistence; cross-cutting path step | Planned; exact. |
| Version/outbox/revision and bounded APIs | Transaction repository and real DB counters | Planned; exact. |
| No S6 causality | Schema/route/component absence audit | Planned boundary; mandatory. |

- **Application state:** unchanged from S4 evidence baseline; no S5 product file exists.
- **Gate state:** S5 coding remains locked until this pre-code entry is committed, pushed and remotely verified. S6 remains locked until the complete S5 content and evidence chain is remotely verified.
- **Intended pre-code commit scope:** `Path.md` only.

### 10.5 Pre-code checkpoint and implementation chronology

- **Implementation/audit completion:** 13 August 2026, Asia/Karachi.
- The S5 pre-code entry above was committed as `6a4582272cf240dfc4e5dcbdd34881723c65eda2` (`Plan Milestones sub-gate`), pushed to `agent/workplan-subgates-audit`, and remotely verified by GitHub Actions run `31624801137`, job `94208343339`, before S5 product code began.
- Implementation then proceeded in the WorkPlan order: schema/constraints → domain schemas and invariants → transaction repository and full revisions/outbox → application services → thin HTTP routes → bounded server projection → existing Structure shell integration → component/service/domain/stress/browser tests → real PostgreSQL forward/rollback/forward verification → audit repair → content commit/push/CI.
- The content implementation was committed separately as `35d96cfef19a9d99f0bddb1a7af2beb318dd0a07` (`Implement Milestones sub-gate`) and pushed before this evidence section was written. Remote `refs/heads/agent/workplan-subgates-audit` resolved to the exact content SHA.

### 10.6 Files and implementation evidence

| Area/files | Action and implemented behavior | WorkPlan/Bible ownership |
| --- | --- | --- |
| `prisma/schema.prisma`; `prisma/migrations/20260813000000_milestones/migration.sql`; `rollback.sql` | Added `Milestone`, `ChapterMilestoneLink`, `MilestoneDependency`, exact role/status/dependency enums, S5 Structure/Intent/ObjectRevision enum values, range/weight/version/custom-role/self-edge constraints, same-project composite foreign keys, ordered/range/directional indexes, and active duplicate guards. Rollback removes only S5 data/tables/enum additions and repairs dependent enum checks. | WorkPlan 6.1 Milestones and API/durability seams; Bible 3.3–3.5, 5, 16–18, 20. |
| `domains/milestones/domain/types.ts`; `dependency.ts` | Strict write/link/dependency/scaffold/reorder schemas; deterministic chapter/word/cadence allocation and SHA-256 plan token; complete unique reorder preview; weighted clamped progress; iterative hard-active cycle proof. Soft/tentative/retired cycles remain permissible. | WorkPlan 6.1/6.3; Bible milestone roles, ranges, dependency semantics and soft planning doctrine. |
| `domains/milestones/application/ports.ts`; `service.ts` | Defined canonical summaries/repository contract; clamped projection budgets; ownership-gated previews; content-safe write/link/dependency/reorder/scaffold services; stable conflict for tampered plans. | Thin service/domain boundary, bounded API and stable mutation requirements. |
| `domains/milestones/infrastructure/prisma-milestone-repository.ts` | Ownership-scoped reads/writes; optimistic `Project.structuralVersion`; atomic canonical state + full resultant `ObjectRevision` + content-free outbox; idempotent exact links/dependencies; same-project validation; bounded progress/display edges; two-pass reorder avoiding uniqueness collisions; atomic reviewed scaffold/rebalance; concurrent loser rollback. | WorkPlan durability seams, revision seam, graph bounds and transaction discipline. |
| `lib/milestones/runtime.ts`; `http.ts`; `app/api/v2/projects/[id]/milestones/route.ts`; `links/route.ts`; `dependencies/route.ts`; `reorder/{preview,apply}/route.ts`; `scaffold/{preview,apply}/route.ts` | Added runtime composition, authenticated stable-envelope transport, bounded overview, create/update, role link, dependency create/update, reorder preview/apply, and scaffold preview/apply endpoints. Routes contain no domain logic. | WorkPlan `/milestones/**` endpoint order and stable mutation envelope. |
| `domains/references/domain/story-reference.ts`; `domains/structure/domain/types.ts`; `application/ports.ts`; `infrastructure/prisma-structure-repository.ts` | Activated `MILESTONE` only after canonical persistence for non-causal references, Narrative Intent, saved anchor and endpoint resolution; added the Milestones lens while leaving all S6/future endpoints inactive. | Authorized S5 endpoint registration; milestone relevance is not causality or containment. |
| `components/structure/MilestoneLens.tsx`; `StructureWorkspace.tsx`; `StructureLensNav.tsx`; `RelationshipLens.tsx`; `SemanticZoomViewport.tsx`; `app/app/projects/[id]/structure/page.tsx`; `app/globals.css` | Integrated default ordered/range view, bounded accessible dependency-list alternative, chapter-role matrix, inline create/edit/link/dependency, reviewed allocation/rebalance, reviewed atomic reorder, weighted progress, optional zero state, responsive styling, Milestone reference/Intent controls, and server-joined projection. Semantic Zoom emits linked `MILESTONE_THREAD` relevance steps without adding an ownership ancestor. | WorkPlan Structure shell and Milestones lens; ruled semantic coordinate. |
| `docs/adr/0006-milestone-boundaries.md`; `docs/api/milestones.md`; `docs/architecture/milestones.md`; `docs/operations/migrations.md` | Recorded no-ownership decision, graph/cycle rules, bounds, API contracts, semantic integration, complete transaction semantics and verified rollback procedure. | WorkPlan 6.2 documentation outputs. |
| `scripts/verify-milestones-db.ts`; `package.json`; `vitest.config.ts` | Added real PostgreSQL verify/rollback commands. Increased the test timeout from 5s to 15s after instrumented OneDrive runs exceeded 5s; workloads/assertions were not reduced. | WorkPlan database recovery, stress and reproducibility requirements. |
| `tests/unit/milestone-domain.test.ts`; `tests/service/milestone-service.test.ts`; `tests/component/milestone-lens.test.tsx`; `tests/stress/milestones.stress.test.ts`; `tests/e2e/milestones.spec.ts`; `tests/fixtures/milestones.ts` | Added deterministic/property-style allocation, role/range/token/reorder/cycle/progress, service/privacy, UI state/error/review, maximum allocation/5,000-edge, desktop/mobile/axe/writing-flow tests and shared empty projection. | WorkPlan 6.2/6.4 and Bible phase acceptance. |
| `tests/unit/story-reference.test.ts`; `tests/component/structure-workspace.test.tsx`; `structure-interactions.test.tsx`; `tests/e2e/structure-core.spec.ts` | Advanced historical S4 expectations to the authorized S5 state: Milestone endpoint/lens is active and Causal/future endpoints remain absent; preserved Structure regression coverage. | Mandatory sequential capability activation without falsifying prior-gate behavior. |

The content commit contains 45 files and 1,419 insertions/36 deletions. No `StoryChange`, `CausalRelation`, causal adapter registry, Causal lens, timeline event, entity state, Note or Capture canonical object was added.

### 10.7 Canonical behavior, boundaries and recovery

- **Ownership versus relevance:** `Milestone.projectId` owns the milestone. Chapters remain owned by Project/optional Volume. `ChapterMilestoneLink` is the sole chapter–milestone association, permits multiple roles, and never changes `Chapter.projectId`, `volumeId`, prose or outline ownership.
- **Roles and ranges:** roles are exactly introduce/develop/escalate/turn/resolve/custom; custom labels exist only for custom. Stored chapter ranges are zero-based and complete/ordered; the UI presents one-based values. Target words and dates are advisory.
- **Progress:** the repository derives each linked chapter ratio as final=1, otherwise `wordCount/targetWords`, clamps to 0–1, applies link weights, and never stores the result as canonical truth. The read model reports whether its progress-input budget truncated the estimate.
- **Dependencies:** only hard active edges participate in cycle rejection. The iterative proof is capped at 5,000 stored edges; overflow fails closed as dependency unavailable. Self-edges and cross-project endpoints are rejected; active duplicate edges are idempotent.
- **Scaffold/rebalance:** preview is pure, deterministic and ownership checked. Its token covers input and allocation. Apply checks the token, expected structural version and existing milestone count, then creates placeholders or updates only range/word/date allocation fields. It never mutates prose or invents story content beyond `Milestone N` placeholders.
- **Order:** inline sequence is visible, but multi-row movement uses previewed reorder. Apply verifies the complete unique current ID set and performs negative temporary positions followed by final positions in one transaction, preserving stable IDs, links, references and dependencies.
- **Bounds:** overview clamps nodes to 500, displayed links+dependencies to 750, and progress inputs to `min(50,000,nodeBudget×100)`; the client receives overflow facts and never loads an unbounded graph.
- **Durability:** every non-idempotent canonical write records complete resultant state, increments project structural version and appends a content-free outbox event atomically. Exact idempotent duplicates leave the version unchanged.
- **Failure isolation:** zero milestones is valid. Milestone failures are outside editor load/typing/local journal/save/recovery/continuation paths. Real E2E regression proved exact return-to-writing focus after S5 activation.
- **Rollback:** the reviewed S5 rollback deletes milestone-targeted intents/references/revisions, drops only three S5 tables/types and restores earlier enums/checks. It preserved eight representative S4 tables and byte-equivalent sampled Chapter prose, removed the ledger row only after verification, then redeployed and reverified successfully.

### 10.8 Console instrumentation ledger

All 22 S5 operational sites have the identifying comment immediately above the call. Server calls use the guarded logger whose literal transport is `lib/observability/logger.ts`; UI and database-verifier calls use structured literal `console.log`. No title, description, thread/custom label, dependency note, Narrative Intent text, selected text, document or prose is emitted.

| Step | Comment line | Call/transport line | Safe purpose/metadata |
| --- | --- | --- | --- |
| `S5-MILESTONE-001` | `domains/milestones/application/service.ts:14` | logger line 15 | Bounded overview: request/workspace/project, found, counts. |
| `S5-MILESTONE-002` | `domains/milestones/application/service.ts:22` | logger line 23 | Milestone identity/order/status/version; authored fields excluded. |
| `S5-LINK-001` | `domains/milestones/application/service.ts:29` | logger line 30 | Link/chapter/milestone IDs, role, weight, version. |
| `S5-DEPENDENCY-001` | `domains/milestones/application/service.ts:36` | logger line 37 | Dependency endpoint IDs/state/hard/version; note excluded. |
| `S5-REORDER-001` | `domains/milestones/application/service.ts:44` | logger line 45 | Preview object/change counts only. |
| `S5-REORDER-002` | `domains/milestones/application/service.ts:51` | logger line 52 | Applied object count and structural version. |
| `S5-SCAFFOLD-001` | `domains/milestones/application/service.ts:59` | logger line 60 | Preview milestone/warning counts only. |
| `S5-SCAFFOLD-002` | `domains/milestones/application/service.ts:68` | logger line 69 | Applied milestone/placeholder counts/version. |
| `S5-API-001` | `lib/milestones/http.ts:15` | logger line 16 | Successful route key/method/status and safe identifiers. |
| `S5-API-002` | `lib/milestones/http.ts:20` | warning logger line 21 | Failed route/method/status/stable code; body excluded. |
| `S5-UI-001` | `components/structure/MilestoneLens.tsx:52` | literal `console.log` line 53 | Projection view key. |
| `S5-UI-002` | `components/structure/MilestoneLens.tsx:58` | literal line 59 | Edit identity/version. |
| `S5-UI-003` | `components/structure/MilestoneLens.tsx:64` | literal line 65 | Write identity/order/status; form text excluded. |
| `S5-UI-004` | `components/structure/MilestoneLens.tsx:72` | literal line 73 | Chapter/milestone IDs, role, weight. |
| `S5-UI-005` | `components/structure/MilestoneLens.tsx:80` | literal line 81 | Dependency endpoint IDs/hard flag; note excluded. |
| `S5-UI-006` | `components/structure/MilestoneLens.tsx:90` | literal line 91 | Scaffold counts and optional-setting booleans. |
| `S5-UI-007` | `components/structure/MilestoneLens.tsx:98` | literal line 99 | Reviewed allocation aggregate only. |
| `S5-UI-008` | `app/app/projects/[id]/structure/page.tsx:21` | logger line 22 | Server projection join counts only. |
| `S5-UI-009` | `components/structure/MilestoneLens.tsx:106` | literal line 107 | Reorder object count/target index. |
| `S5-UI-010` | `components/structure/MilestoneLens.tsx:114` | literal line 115 | Reviewed reorder object count. |
| `S5-DB-001` | `scripts/verify-milestones-db.ts:77` | literal line 78 | DB invariant results, counts/IDs/booleans; creative fixture content excluded. |
| `S5-DB-002` | `scripts/verify-milestones-db.ts:94` | literal line 95 | Rollback table/prose-row preservation counts. |

### 10.9 Validation, stress and remote evidence

| Check | Result | Exact evidence |
| --- | --- | --- |
| Prisma generation/schema | Pass | Prisma Client 7.9.1 generated; `npm run db:validate` reported the schema valid. Initial validation found S5 relations attached to `User`; corrected them to `Project` before implementation validation continued. |
| Static quality | Pass | `npm run lint`: zero warnings. `npm run typecheck`: strict TypeScript pass. `git diff --check`: clean. |
| Unit/service/component regression | Pass | `npm run test`: 32 files, 114 tests passed. Includes all S0–S5 tests. |
| Coverage | Pass | `npm run test:coverage`: 32 files/114 tests; 87.85% statements, 76.29% branches, 80.61% functions, 94.60% lines, all thresholds passed. Initial 74.79% branch result exposed missing S5 UI branches; tests were expanded without lowering thresholds. |
| Stress/property | Pass | `npm run test:stress`: 4 files/9 tests. Maximum 500 milestones over 10,000 chapters and a 5,000-edge hard-cycle proof passed; the unit property loop preserved range and word totals across 1,000 inputs. |
| PostgreSQL behavior | Pass | `npm run db:verify:milestones`: version 9, 2 milestones, 1 role link, 2 dependencies, progress .5, hard cycle false, duplicate idempotent, reorder identity preserved, cross-workspace/project false, complete revisions true, 6 outbox events, bounded 1/1, 4 scaffold placeholders, one concurrent winner/one conflict. |
| Migration recovery | Pass | Forward deploy → verify → milestone-only rollback (`remainingMilestoneTables:0`, `preservedStructureTables:8`, sampled prose row preserved) → redeploy → verify all passed. The first rollback attempt exposed an enum-backed check constraint; rollback now explicitly drops/recreates that check and passed. |
| Browser S5 flow | Pass | `tests/e2e/milestones.spec.ts`: 4 applicable passed/4 viewport duplicates skipped—zero optionality, reviewed allocation/reorder, many-to-many roles, exact cycle rejection, milestone Intent/Semantic Zoom, axe, desktop/mobile. |
| S4+S5 browser regression | Pass | Combined run: 18 discovered, 9 applicable passed, 9 intentional cross-project viewport skips. S4 zero-structure, scaffold/reorder, exact writing-position restoration, shell accessibility and mobile Dark all remain green after S5. |
| Accessibility and visual QA | Pass | Axe returned zero serious/critical issues. Manual original-resolution inspection of `test-results/milestones-desktop.png` and `milestones-mobile.png` found no clipping/overlap; ordered/matrix controls and forms remain readable at both widths. |
| Production build | Pass | Next.js 16.3 optimized build compiled/type-checked and emitted all expected S5 routes including reorder and scaffold endpoints. |
| Remote Git/CI | Pass | Content SHA `35d96cfef19a9d99f0bddb1a7af2beb318dd0a07` equals remote branch ref. GitHub Actions run `31728512577`, job `94542823434`, exact head SHA, passed checkout/install/generate/lint/typecheck/coverage/build in 2m4s. The only annotation is GitHub’s upstream Node-20 action deprecation notice; the runner forced Node 24 and no job step failed. |

### 10.10 Side-by-side S5/Phase 2 conformance audit

| WorkPlan requirement | Actual evidence | Classification | Audit action |
| --- | --- | --- | --- |
| Start only after S4 passes | S4 evidence/CI precedes S5 plan; plan commit/CI precedes code | Verified | None. |
| `Milestone`, link, dependency persistence | Three canonical tables, enums, constraints, composite FKs and repository | Verified | None. |
| Many-to-many roles; milestone never owns chapter | Link rows and matrix; no Chapter milestone-owner column/relation | Verified | None. |
| Ordered/range default; optional dependency graph and matrix | Default range list, bounded accessible dependency list, matrix selector | Verified | None. |
| Transactional reorder/renumber preview | Audit initially found manual sequence editing insufficient; preview/apply routes, complete-set proof and two-pass atomic rewrite added before pass | Verified after repair | Closed gap. |
| Exact roles, weights, ranges and progress | Enum/schema/checks; weighted read projection and tests | Verified | None. |
| Hard cycles handled exactly | Hard+active iterative cycle proof; soft/tentative/retired loops allowed; DB/E2E tests | Verified | None. |
| Placeholders, cadence soft dates, advisory allocation, previewed rebalance | Deterministic tokenized planner and atomic create/rebalance | Verified | None. |
| Milestone Intent/reference endpoints | Active schema + same-project resolver only after S5 persistence | Verified | None. |
| Milestone/Thread cross-cutting coordinate | Linked IDs emitted as relevance; ancestor path excludes milestone | Verified | None. |
| Version/revision/outbox | Real DB count and complete snapshot checks; concurrency one winner | Verified | None. |
| Bounded APIs/client | Explicit node/display-edge/progress-edge caps and overflow facts | Verified | None. |
| Zero milestones never blocks writing | Empty state plus combined return-to-writing/focus regression | Verified | None. |
| No S6/future capability activation | No causal model/route/lens/adapters; Causal control absent; future reference endpoints still rejected | Verified | None. |
| Logs at each operational step with adjacent comments | 22-site line-accurate ledger above; privacy tests exclude authored content | Verified | None. |
| S5 committed, pushed, remotely confirmed before S6 | Plan and content chain plus passing GitHub CI recorded | Verified for content; evidence commit follows | S6 remains locked until evidence commit remote proof. |

Global doctrine audit: milestones remain optional and non-owning; Narrative Intent/reference facts remain non-causal; no chronology is inferred from chapter order; no action rewrites prose; PostgreSQL remains canonical and client state remains projection/form state; all support failures are outside the writing durability path; logs exclude creative content; graph reads are bounded; no AI, billing, pricing or Phase 3 source domain was introduced. Result: no in-scope compliance gap remains.

### 10.11 Deviations, findings and repairs

- **Component location:** the pre-plan named `components/milestones/*`; actual UI is `components/structure/MilestoneLens.tsx` because the WorkPlan requires one Structure workspace shell and shared lens state. This is an organizational refinement, not a scope change; no duplicate milestone workspace was created.
- **Pre-plan wording:** “kind/thread label” was implemented as the optional `threadLabel` plus explicit role/dependency semantics. The authoritative WorkPlan does not require a separate milestone-kind field, so no unapproved discriminator was invented.
- **Schema relation repair:** first Prisma validation showed Project-owned relations accidentally declared on `User`. They were moved to `Project`; schema validation/generation and real PostgreSQL proofs then passed.
- **Projection repair:** initial nested per-milestone progress selection could expand to an excessive aggregate. It was replaced with one globally bounded progress-edge read and explicit `hasMoreProgressEdges`/`progressComplete` facts.
- **Revision repair:** initial selects omitted milestone description/dependency note and would have produced incomplete resultant revisions. Full canonical fields are now selected for every revision; real DB assertions prove both authored fields are present in stored snapshots while logs omit them.
- **Rollback repair:** the first rollback exposed a PostgreSQL enum/check comparison dependency. The rollback now casts cleanup predicates to text, drops/recreates `NarrativeIntent_selection_valid` around enum replacement, and passed rollback/redeploy/reverify.
- **Ordering repair:** the audit found that editing sequence indices could collide and did not satisfy reviewed transactional reordering. Dedicated preview/apply routes, services, UI dialog, stable-ID plan and two-pass transaction were added and proved in DB/E2E.
- **Coverage repair:** first complete coverage was 74.79% branches, below the unchanged 75% gate. Tests were expanded for update/custom-role/warning/reorder branches; final is 76.29%. No threshold was reduced.
- **Timing repair:** instrumented coverage under OneDrive exceeded Vitest’s 5s per-test default in three already-green workloads. The ceiling is now 15s with identical loops/assertions; final coverage passes. Browser assertions now await the actual reorder response before refreshed-version checks.
- **Remaining gaps:** none within Sub-gate 5. Sub-gate 6 is not implemented and must not start until this evidence commit is pushed and remotely verified.

### 10.12 Git, remote and gate decision

- **Branch/remote:** `agent/workplan-subgates-audit` on `https://github.com/InfernusReal/Mythra-V2.git`; draft PR `#1` remains the review surface.
- **S5 plan commit:** `6a4582272cf240dfc4e5dcbdd34881723c65eda2` (`Plan Milestones sub-gate`), pushed; CI run `31624801137`, job `94208343339`, passed.
- **S5 content commit:** `35d96cfef19a9d99f0bddb1a7af2beb318dd0a07` (`Implement Milestones sub-gate`), pushed and equal to the remote branch before this ledger edit.
- **S5 content CI:** run `31728512577`, job `94542823434`, passed all steps in 2m4s at the exact content SHA.
- **Rollback/revert points:** immutable S4 evidence `ab766a8663a27aaf22a151067f65cd6a52fe37a3`; S5 pre-code `6a4582272cf240dfc4e5dcbdd34881723c65eda2`; S5 content `35d96cfef19a9d99f0bddb1a7af2beb318dd0a07`; database-only reversal is the proven S5 rollback and is prohibited beneath S6 data.
- **Formal S5 decision:** **Passed**. Scope, files, code method, instrumentation, invariants, bounds, accessibility, stress, recovery, writing flow, side-by-side audit and remote proof meet WorkPlan 6.1/6.3/6.4 without an open gap.
- **S6 lock:** this entry must be committed, pushed, and remotely verified as the S5 evidence commit before any S6 product file is created. The Phase 2 macro gate remains incomplete because S6 has not begun.

## 11. Entry S6 — Causal Story Fabric Core

### 11.1 Predecessor gate and run identity

- **Date:** 13 August 2026, Asia/Karachi.
- **Branch/remote:** `agent/workplan-subgates-audit` / `https://github.com/InfernusReal/Mythra-V2.git`; draft PR `#1`.
- **Predecessor proof:** S5 evidence commit `dccf8db53808124d73f7135aa0d495716d0e6bef` is the exact remote branch ref. GitHub Actions run `31729273306`, job `94545306078`, passed checkout, install, Prisma generation, lint, typecheck, coverage, and production build in 1m52s. The sole annotation is GitHub's upstream Node-20 action notice; no job step failed.
- **Authority:** WorkPlan Phase 2, Sub-gate 6, sections 6.1–6.4; Bible Causal Story Fabric, causal doctrine, graph/data/API/accessibility/testing and original capability-phase gate requirements.
- **Gate discipline:** this entry is planning only. S6 product code remains locked until this `Path.md`-only checkpoint is committed, pushed, equals the remote branch ref, and its CI passes. S7 remains locked until the complete S6 content/evidence and Phase 2 macro audit pass remotely.

### 11.2 Exact scope and implementation ruling

- Add canonical `StoryChange` identities for event, decision, revelation, state change, setup, payoff, condition, outcome, and custom only when another canonical object is unsuitable.
- Add a typed endpoint registry covering milestone, chapter outline, scene, timeline event, Narrative Intent, entity-state snapshot, capture-derived object, manuscript block, and Story Change. S6 activates only milestone, chapter outline, scene, Narrative Intent, manuscript block, and Story Change adapters. `TIMELINE_EVENT`, `ENTITY_STATE`, and `CAPTURE_DERIVED` remain reserved and return one stable dependency-unavailable result; enum presence will not be reported as capability.
- Add project-owned `CausalRelation` with two typed endpoints and optional block identifiers, exact relation vocabulary, condition, strength, importance, state, note, provenance, version and archive state. Causality remains distinct from ownership, containment, sequence, `StoryReference`, and milestone dependency.
- Relation vocabulary is exactly causes, enables, requires, motivates, triggers, escalates, prevents/blocks, reveals, transforms, resolves. States are active, tentative and retired. Active exact duplicates are idempotent; self and cross-project edges are rejected.
- Endpoint-archive handling preserves evidence through explicit reattach, retire, or relation-archive commands. No endpoint deletion silently deletes or rewrites a causal relation.
- Hard active `requires` cycles are rejected unless a caller explicitly records temporal progression or mutual-state semantics. Those override facts are canonical and audited; temporally sequenced feedback loops remain valid.
- Chronology checks use only resolvable explicit story-time anchors; Story Changes own optional story-time and revelation knowledge/discovery anchors. Chapter/manuscript order is never treated as time. Unknown time returns neutral insufficient-information output. Revelation checks compare discovery semantics. Timeline-backed checks stay dormant until S11.
- Implement `createRelation`, `getNeighborhood`, `traceImpact`, and `validateChronology` behind the domain boundary. Traversal is server-owned, indexed, budgeted, direct-edge-first, filterable by direction/type/state, carries every relation ID/type/provenance step, says “potentially affected,” and never mutates prose or endpoints.
- Integrate a Causal Structure lens, one-line Story Change creation, A because of B / A causes C composer, Why now? / What changes? trace lists, an always-available accessible list, and an optional local graph only in Architect mode. Zero causality exposes no dashboard, alarm or compulsory setup.
- Add the same focus-preserving causal composer to the writing context without changing document JSON/text/version or losing the selection/focus/scroll position.

### 11.3 Intended files and code production order

| Order | Intended files | Code to be produced and method |
| --- | --- | --- |
| 1 | `prisma/schema.prisma`; `prisma/migrations/20260813120000_causal_story_fabric/{migration.sql,rollback.sql}` | S6 enums, canonical tables, constraints, directional/filter/anchor indexes, active duplicate guard and same-project/project ownership columns. Rollback removes only S6 objects and preserves all S0–S5 data/prose. |
| 2 | `domains/causality/domain/{types,endpoint-registry,graph,chronology}.ts` | Zod inputs/outputs, exact vocabulary/state/provenance, typed active/reserved adapters, endpoint/block rules, iterative bounded traversal/path provenance, hard-cycle invariant and neutral chronology rules. Property/invariant tests are written before UI. |
| 3 | `domains/causality/application/{ports,service}.ts` | Repository and endpoint-resolver ports plus canonical `createRelation`, `getNeighborhood`, `traceImpact`, `validateChronology`, Story Change writes and lifecycle commands. Services clamp budgets and emit structured non-content logs. |
| 4 | `domains/causality/infrastructure/{prisma-causality-repository,prisma-endpoint-adapters}.ts` | Ownership-scoped adapter resolution, canonical transactions, optimistic structural version, complete resultant revisions, content-free outbox, duplicate idempotency, indexed/bounded direct-first reads and safe lifecycle updates. |
| 5 | `lib/causality/{runtime,http}.ts`; `app/api/v2/projects/[id]/causality/**/route.ts` | Runtime composition and thin authenticated routes for Story Changes, relation create/lifecycle, neighborhood, impact and chronology. All writes return the existing stable mutation envelope; unavailable adapters use a stable code/status. |
| 6 | `components/structure/CausalLens.tsx`; existing Structure nav/workspace/page/CSS | Activate the previously dormant Causal lens only now, render composer and bounded list first, optional local Architect graph, filter/overflow/provenance/chronology facts, no empty dashboard. |
| 7 | `components/editor/CausalComposer.tsx`; existing editor page/canvas integration | Focus-preserving writing-context overlay/action that uses selected manuscript-block anchors where valid, creates only causal objects, and restores writing position without prose mutation. |
| 8 | `docs/adr/0007-causal-boundaries.md`; `docs/api/causality.md`; `docs/architecture/causal-story-fabric.md`; migrations operations doc | Exact vocabulary, endpoint activation lifecycle, archive choices, cycle override, chronology ruling, budgets, privacy and rollback contract. |
| 9 | `scripts/verify-causality-db.ts`; package scripts; `tests/{unit,service,component,stress,e2e}/causality*`; S4/S5 regressions | Real PostgreSQL forward/verify/rollback/forward proof; domain/service/component/property/stress/browser/axe tests; reserved endpoint rejection; path provenance and truncation; chronology flashback/reveal cases; zero-causality and exact writing-position regression. |

Implementation order is fixed: schema/constraints → domain invariants and tests → canonical repository/revisions/outbox → services → routes → bounded projection → Structure UI → writing integration → documentation → database/stress/browser proof → side-by-side audit. UI will not drive canonical graph logic and the client will never load the full relation graph.

### 11.4 Planned invariants, budgets, logs and acceptance evidence

- **Bounds:** default neighborhood/impact limits and hard ceilings will be constants in the domain; node, edge, depth, path and query-row budgets will be independently clamped and surfaced with truncation facts. Stress proof will exceed each ceiling and establish no recursion/stack overflow or hidden unbounded follow-up query.
- **Idempotency/concurrency:** a database active-edge guard plus transaction retry/unique-conflict resolution returns the existing relation for exact duplicates. Concurrent conflicting canonical writes produce one winner and one stable conflict without partial revision/outbox rows.
- **Privacy:** logs contain step ID, request/workspace/project IDs, endpoint discriminants, relation state/type, counts, bounds, versions and result codes only. They never contain Story Change title/description, causal condition/note, provenance note, selected text, document JSON/body text, Narrative Intent text or manuscript content.
- **Instrumentation plan:** every operational step receives an adjacent identifying comment and literal `console.log` transport directly or through the guarded logger. Planned families are `S6-CHANGE-*`, `S6-RELATION-*`, `S6-ENDPOINT-*`, `S6-TRAVERSAL-*`, `S6-CHRONOLOGY-*`, `S6-UI-*`, and `S6-DB-*`. The completion entry will record every final ID, file, exact comment line, exact call/transport line and safe fields after formatting fixes line numbers.
- **Database evidence:** prove all active adapters and heterogeneous edges; reserved adapters rejected; self/cross-project rejected; block-anchor rules; exact duplicate idempotency; hard-cycle rejection/override; feedback loop; complete revisions; content-free outbox; lifecycle preservation; bounded traversal ordering/provenance; concurrent loser rollback; no prose mutation; S6 rollback preserving S5 tables/rows and sampled prose bytes.
- **Test evidence:** lint, typecheck, unit/service/component suite, coverage with unchanged thresholds, stress suite, production build, real PostgreSQL cycle, desktop/mobile Chromium E2E, axe, visual inspection, and a combined S4/S5/S6 regression. Flashback and reveal tests must establish that chapter order causes no false chronology warning.
- **Exit proof:** demonstrate A because of B and A causes C from both Structure and writing; bounded Why now?/What changes? with full provenance and “potentially affected” language; optional zero state; exact editor focus/selection/scroll and prose preservation; no inactive-domain pretense; all WorkPlan 6.4 clauses passed. Every discrepancy found during implementation is repaired and recorded before S6 is called passed.

### 11.5 Planned exclusions and pre-code gate state

- Not in S6: Timeline/Entity/EntityState/Note/Capture canonical models, automatic prose inference, AI calls, full-project graph rendering, background projection worker, Contextual Writing Field cards, or S7+ screens. Phase 3 will register future adapters only after their canonical domains exist.
- No milestone dependency is converted into a causal edge; no StoryReference is reinterpreted as causality; no chapter sequence becomes story time; no relation changes prose or downstream state.
- **Intended pre-code commit scope:** `Path.md` only.
- **Gate state:** S6 coding remains locked until this pre-code entry is committed, pushed and remotely verified. Phase 2 macro audit and S7 remain locked until S6 is separately passed with content/evidence/remote proof.

### 11.6 Actual implementation scope and files

The pre-code checkpoint was committed alone as `09c0c88c4c14bc0371357ebee174a0aface6828c`, pushed, confirmed as the exact remote branch ref, and passed GitHub Actions run `31729616092`, job `94546451818`, in 2m04s before the first S6 product file was created. The resulting product commit is `2261ff59b6781034967964fd4e2d5d46f593a3c0` (`Implement Causal Story Fabric sub-gate`, 47 files, 1,409 insertions, 17 deletions). The database-audit correction is `69226bc15b5fa7ad51a72410907cae304a50c568` (`Harden causal block anchor constraint`, two files, eight insertions, two deletions). Both were pushed to `agent/workplan-subgates-audit`; the latter is the exact remote ref and passed CI run `31942297127`, job `95153119172`, in 2m20s.

| Files | Actual code produced | WorkPlan effect |
| --- | --- | --- |
| `prisma/schema.prisma`; `prisma/migrations/20260813120000_causal_story_fabric/{migration.sql,rollback.sql}` | Adds all nine Story Change kinds, all nine endpoint discriminants, ten relation types, three states, provenance, `StoryChange`, `CausalRelation`, project relations, direction/type/status/anchor indexes, exact active-edge unique guard, non-self/block/strength/importance/hard/override/version checks, and S6-only reversal. The final correction makes manuscript-block Story Change anchors require a block ID at the database boundary as well as in Zod. | Canonical S6 storage is independent of containment/reference/milestone dependency and rollback preserves S0–S5. |
| `domains/causality/domain/{types,endpoint-registry,graph,chronology}.ts` | Strict Zod contracts; active/reserved adapter registry; stable dependency-unavailable rejection; iterative hard-cycle check; bounded provenance paths; story-time, discovery-time and neutral chronology rules. | Domain invariants are framework-independent and future endpoint enum presence is not misreported as capability. |
| `domains/causality/application/{ports,service}.ts` | Implements the required `createRelation`, `getNeighborhood`, `traceImpact`, `validateChronology`, bounded overview, Story Change write and relation lifecycle commands. Budgets are parsed/clamped before repository execution; logs are content-safe. | The named application boundary exists exactly as required. |
| `domains/causality/infrastructure/{prisma-causality-repository,prisma-endpoint-adapters}.ts` | Activates Milestone, Chapter Outline, Scene, Narrative Intent, Manuscript Block and Story Change resolution only. Transactions enforce workspace/project ownership, optimistic structural versioning, complete revisions, redacted outbox, active duplicate idempotency, lifecycle choices and indexed frontier traversal. | Heterogeneous active endpoints work; Timeline Event, Entity State and Capture Derived stay reserved until Phase 3. |
| `lib/causality/{runtime,http}.ts`; `app/api/v2/projects/[id]/causality/**/route.ts` | Composes the domain once and exposes bounded overview, Story Change write/update, relation create, reattach/retire/archive, neighborhood, impact and chronology through authenticated thin handlers and stable envelopes/statuses. | Every S6 API is ownership-scoped; no future-domain endpoint is activated. |
| `components/structure/CausalLens.tsx`; Structure page/workspace/nav/CSS changes | Activates Causal only in S6; provides one-line changes, A because of B/A causes B, full vocabulary and metadata, Why now?/What changes?, chronology, accessible ordered list, explicit lifecycle choices and a 12-edge local graph only in the live Architect mode. Zero causality shows only optional creation, not a dashboard/alarm. | Structure context satisfies the direct author flow without loading a full graph. |
| `components/editor/CausalComposer.tsx`; `components/editor/ChapterEditor.tsx` | Captures stable manuscript block ID, exact selection offsets and scroll; creates the explicit Story Change/relation without selected text; restores selection, focus and scroll after success/cancel; leaves document JSON/text/version untouched. | Writing-context causality uses the existing editor boundary and never infers or edits prose. |
| `docs/adr/0007-causal-boundaries.md`; `docs/api/causality.md`; `docs/architecture/causal-story-fabric.md`; `docs/operations/migrations.md` | Records vocabulary, active/reserved lifecycle, graph/chronology boundaries, budgets, privacy, API envelopes, forward/rollback commands and S5 preservation rule. | Operational and architectural decisions are durable and match the implementation. |
| `scripts/verify-causality-db.ts`; package scripts; `tests/{unit,service,component,stress,e2e}`; S4/S5 regression edits | Adds real PostgreSQL forward/rollback verifier; 19 focused causal tests across unit/service/component/stress; five primary browser flows plus cross-viewport skips; fixtures; and updates earlier Structure expectations only to recognize the newly authorized Causal lens. | The capability is tested at invariant, application, browser, migration, concurrency and regression levels. |

### 11.7 Implementation method, state, security and boundedness

- **Canonical writes first:** transactions resolve active endpoints inside the requested project, reject archived/reserved/cross-project objects, save the complete resultant object revision, increment `projectStructuralVersion`, and emit a content-free outbox record. A unique-conflict retry returns the already-created exact active relation; unrelated conflicts remain stable conflicts.
- **Endpoint lifecycle:** the registry contains every enum member. Only the six available adapters are active. The three reserved adapters always produce `DEPENDENCY_UNAVAILABLE`/503. Reattach revalidates endpoints, self-edge and hard-cycle rules; retire preserves the row with `RETIRED`; archive preserves its revision history.
- **Graph safety:** hard active `REQUIRES` uses iterative reachability with a 5,000-edge ceiling. Temporal progression or mutual-state semantics are explicit stored overrides. Neighborhood reads query indexed relations incident to the current frontier at every depth, so 750 older unrelated rows cannot consume a ten-edge direct-neighborhood budget. Hard ceilings are depth 12, nodes 500, edges 750 and paths 500; truncation is surfaced.
- **Chronology:** ordinary relations compare explicit Story Change story time only. `REVEALS` compares discovery time. Missing time is `INSUFFICIENT_INFORMATION`; chapter order is never consulted. Warnings are neutral confirmation language and do not block writes.
- **UI state:** the server owns canonical data and budgets. The client owns temporary form, trace and chronology display state. The audit found and fixed an inherited-state defect by passing the current presentation mode into `CausalLens`; switching to Architect now immediately controls the optional graph. The accessible relation list remains present in every mode.
- **Security/privacy:** every route requires the internal session actor; repositories filter workspace and project. Logs and outbox payloads exclude titles, descriptions, conditions, relation/provenance notes, Narrative Intent text, selected text and manuscript content. Complete authored fields remain only in canonical rows and revision snapshots.
- **Recovery:** S6 rollback drops only `StoryChange`, `CausalRelation` and S6 enums/lens/object values, rebuilds affected enums safely, and preserves eleven S4/S5 canonical tables plus sampled byte-equivalent chapter prose. Re-deploy and verification were run after rollback.

### 11.8 Complete S6 console trace/comment ledger

Every listed operational trace has an adjacent identifying comment. `logger.info`/`logger.warn` reaches the structured guarded `console.log` transport established in S0; explicit client, endpoint-registry and verifier traces call `console.log` directly with non-content fields only.

| Step | File | Comment line | Call/transport line | Safe fields and purpose |
| --- | --- | ---: | ---: | --- |
| S6-TRAVERSAL-001 | `domains/causality/application/service.ts` | 14 | 15 | request/workspace/project, found, node/edge counts; bounded overview complete. |
| S6-CHANGE-001 | same | 21 | 22 | IDs, kind, object/structural versions; Story Change committed. |
| S6-RELATION-001 | same | 28 | 29 | endpoint types, relation type/state/hard/idempotent, IDs/version; relation committed. |
| S6-RELATION-002 | same | 36 | 37 | relation ID, action/state/archive/version; preservation choice committed. |
| S6-TRAVERSAL-002 | same | 48 | 49 | aggregate node/edge/path/truncation; neighborhood complete. |
| S6-TRAVERSAL-003 | same | 55 | 56 | aggregate node/edge/path/truncation; impact complete. |
| S6-CHRONOLOGY-001 | same | 62 | 63 | relation ID, status/basis/warning count; chronology complete without time values. |
| S6-ENDPOINT-002 | `domains/causality/domain/endpoint-registry.ts` | 35 | 36 | project, endpoint type, dependency-unavailable result; reserved adapter rejected. |
| S6-ENDPOINT-001 | same | 40 | 41 | project, endpoint type/ID, archived flag; active endpoint resolved without label/time. |
| S6-API-001 | `lib/causality/http.ts` | 13 | 14 | request/workspace, route, method, status; API success. |
| S6-API-002 | same | 18 | 19 | request, route, method, status, stable error code; API failure. |
| S6-UI-001 | `components/structure/CausalLens.tsx` | 27 | 28 | project and kind; one-line change complete. |
| S6-UI-002 | same | 38 | 39 | project, phrase, endpoint/relation types; cause/effect composition complete. |
| S6-UI-003 | same | 48 | 49 | project, direction, path count, truncation; trace displayed. |
| S6-UI-004 | same | 57 | 58 | project/relation/action; lifecycle choice complete. |
| S6-UI-008 | same | 65 | 66 | project/relation, status/basis/warning count; chronology displayed. |
| S6-UI-005 | `app/app/projects/[id]/structure/page.tsx` | 25 | 26 | workspace/project and aggregate counts; server projection joined. |
| S6-UI-006 | `components/editor/CausalComposer.tsx` | 18 | 19 | project/chapter/block and selection offsets only; composer opened. |
| S6-UI-007 | same | 31 | 32 | project/chapter/block, phrase and selection offsets; relation committed and restore requested. |
| S6-DB-001 | `scripts/verify-causality-db.ts` | 107 | 108 | aggregate invariant results/counts only; forward database proof. |
| S6-DB-002 | same | 121 | 122 | remaining/preserved table and prose-row counts; rollback proof. |

Audit result: 21 S6 trace IDs, 21 adjacent comments, and 21 call/transport sites. A repository search found no S6 log containing authored fields. The exact line numbers above are from correction commit `69226bc15b5fa7ad51a72410907cae304a50c568` before this ledger-only change.

### 11.9 Validation and stress evidence

| Validation | Exact final result | Classification |
| --- | --- | --- |
| `npm run db:validate`; `npm run db:generate` | Prisma 7.9.1 schema valid; client generated successfully. | Verified. |
| `npm run lint` | ESLint completed with zero warnings/errors after removing one unused E2E destructure. | Verified. |
| `npm run typecheck` | `tsc --noEmit` passed after every correction. | Verified. |
| `npm run test` | 37 files, 133 tests passed. | Verified. |
| focused S6 Vitest command | Five files, 19 tests passed for domain, service, lens, composer and stress behavior. | Verified. |
| `npm run test:stress` | Five files, 11 tests passed. S6 proves a 5,000-edge iterative cycle and a 1,000-edge fan-out stops at independently declared node/edge/path ceilings. | Verified. |
| `npm run test:coverage` | 37/133 passed; 87.79% statements, 76.15% branches, 81.33% functions, 94.47% lines; all unchanged thresholds passed. | Verified. |
| final CI-environment `npm run build` | Next.js 16.3.0 production build passed and emitted every causal route. | Verified. |
| `npm run db:rollback:causality` → `npm run db:deploy` → `npm run db:verify:causality` | Rollback reported zero S6 tables, eleven prior-capability tables and one sampled prose row preserved; re-deploy passed. Final forward proof: structural version 16, four changes, six relations, six active adapters resolved, three reserved rejected, missing block anchor rejected, hard cycle rejected, temporal feedback accepted, duplicate idempotent, cross-project/workspace rejected, reveal basis `DISCOVERY_TIME`, three impact paths with full provenance, direct-first adversarial traversal true, complete revisions, 14 redacted outbox events, lifecycle preserved, prose unchanged, one concurrent winner/one conflict. | Verified. |
| `npx playwright test tests/e2e/causality.spec.ts` | Ten discovered; five intended primary flows passed and five explicitly skipped on the non-owning viewport. Passed zero optionality, Structure composition/trace/chronology, reserved/cycle results, exact editor restoration/prose, axe, and mobile usability. | Verified; skips are intentional cross-project deduplication, not passes. |
| integrated Phase 2 Playwright regression | 64 discovered; 34 owning-viewport flows passed, 30 explicitly skipped duplicates; no failure across S4 Structure, S5 Milestones, S6 causality and earlier writing/durability/continuation flows. | Verified. |
| axe and visual inspection | No serious/critical axe violation. `test-results/causality-desktop.png` and `test-results/causality-mobile.png` were inspected: no clipping, overlap, horizontal overflow or hidden primary control; mobile wraps lenses/forms and preserves bottom navigation. | Verified. |
| GitHub Actions | Content run `31941509503`/job `95151288121` passed checkout, install, generation, lint, typecheck, coverage and build in 2m17s. Final constraint correction run `31942297127`/job `95153119172` passed the same steps in 2m20s. The only annotation is GitHub's upstream Node-20 action deprecation notice; no project step failed. | Verified remotely. |

Observed non-passing attempts were retained rather than hidden: the first build invocation lacked required `APP_ORIGIN` and stopped during prerender; rerunning with the repository CI environment passed. The first local E2E rerun encountered a persistent-development-database email identity collision; a run-unique matching development principal passed all flows. Early E2E authoring exposed global route-announcer/strict-locator ambiguity and the locators were scoped to the causal lens/form. The audit then found the live Architect-mode state defect, the global-edge starvation risk and the database block-anchor constraint mismatch; all three were fixed and reverified. Transient Prisma Dev connection termination was recovered by restarting the local ephemeral server; final rollback/deploy/verification passed. None is classified as an open product gap.

### 11.10 Side-by-side S6 conformance audit

| WorkPlan 6.1/6.3/6.4 requirement | Actual evidence | Status | Remaining gap |
| --- | --- | --- | --- |
| All nine Story Change identities | Enum, Zod, schema/migration and UI options contain event, decision, revelation, state change, setup, payoff, condition, outcome, custom. | Verified | None. |
| Complete enum/registry; six active and three reserved | Registry construction requires all nine; PostgreSQL resolves every active heterogeneous type and returns stable 503 for Timeline Event, Entity State and Capture Derived. | Verified | None; future activation remains S8/S9/S11. |
| Dedicated relation storage and exact vocabulary/metadata | Migration, Prisma model, input schema, API and UI include exact ten types, condition, strength, importance, state, note, provenance, version and ownership. | Verified | None. |
| Self/cross-project rejection, active idempotency, lifecycle preservation | Zod plus database non-self check; adapter project filters; unique active guard/retry; reattach/retire/archive revisions; real DB proof. | Verified | None. |
| Hard-cycle rule and feedback semantics | Iterative 5,000-edge check rejects unqualified hard `REQUIRES`; explicit temporal or mutual-state overrides persist; feedback proof passes. | Verified | None. |
| Neutral story/discovery chronology; no chapter-order substitution | Unit/DB/browser tests cover consistent, insufficient, cause-after-effect and reveal discovery warning; implementation never reads chapter order. | Verified | None. Timeline integration correctly remains S11. |
| Required four application services | Named methods exist behind `CausalityService`/repository ports and thin routes. | Verified | None. |
| Indexed, bounded, direct-first traversal and full provenance | Direction indexes; frontier-indexed repository queries; 750-unrelated-before-direct PostgreSQL adversary; independent limits; ordered relation ID/type/provenance steps; `potentially affected` language. | Verified | None. |
| Structure and writing composition | Structure supports both displayed phrases and all metadata; writing supports both phrase directions from a stable block and restores exact cursor/selection/scroll/focus. Browser test confirms stored prose unchanged. | Verified | None. |
| Accessible alternative and optional Architect graph | Ordered semantic list is always primary; graph is `aria-hidden`, max 12 edges and live-mode controlled; axe passes. | Verified | None. |
| Zero causality imposes no dashboard/warning/prerequisite | Empty service/page and desktop/mobile tests render optional one-line creation only; editor remains writable. | Verified | None. |
| Structural version, revisions, outbox, bounds and rollback | Real DB proof covers version 16, complete authored snapshots, content-free 14-event outbox, concurrency convergence, budgets and S6-only rollback. | Verified | None. |
| No prose mutation/inference/AI/future-domain pretense | Repository has no prose write; exact chapter bytes/version survive; no inference or AI call; reserved endpoints reject. | Verified | None. |

### 11.11 Global acceptance, anti-goal and source audit

- **Writing flow:** one writer can remain plot/volume/outline/scene/milestone/timeline/causality-free; S6 controls do not intercept autosave, offline recovery or continuation. The full regression keeps all S0–S5 behavior green.
- **Accessibility/responsiveness:** semantic forms, labels, status/alert regions, keyboard-operable buttons, always-available list and responsive CSS pass component, axe, desktop and Pixel 7 flows. The local graph is never the sole representation.
- **Performance:** no client full-graph load; server overview and traversals are bounded. Direct indexed frontier reads and iterative algorithms prevent hidden recursion and unrelated-row starvation.
- **Reliability/security/privacy:** project/workspace ownership, stable envelopes, optimistic concurrency, transactionally coupled revision/outbox/version, recovery choices, migration rollback and content-safe logs are all proven.
- **Anti-goals:** no containment is inferred from causal edges; milestone dependencies and Story References remain distinct; no chapter sequence becomes time; no automatic prose inference; no required planning; no Phase 3 model/adapter/UI is activated.
- **Bible/source comparison:** the implemented causal doctrine, vocabulary, active/reserved order, author-confirmed relations, optionality, trace language, chronology neutrality, writing-flow exit and evidence template match the V2.2 source and the authorized dependency clarification in WorkPlan 3.1/6. No contradiction or omission was found after the corrections above.

### 11.12 Phase 2 macro exit audit

| WorkPlan 6.4 macro clause | Integrated evidence across S4 → S5 → S6 | Result |
| --- | --- | --- |
| Discovery writer keeps writing with zero planning/causality | S4 zero-structure, S5 zero-milestone and S6 zero-causality paths all pass; editor/durability/continuation regression remains green. | PASS |
| Planner scaffolds/reorders large chapter ranges with preview/reference preservation | S4 content/evidence commits and combined browser/stress regressions remain green; S5 only extends the scaffold through previewed milestone allocations. | PASS |
| Milestones many-to-many, role-based, exact dependency invariant | S5 evidence `dccf8db53808124d73f7135aa0d495716d0e6bef`, PostgreSQL proof and current regression pass. | PASS |
| Author records A because of B / A causes C in writing or Structure and traces bounded paths | S6 Structure and writing composers, DB heterogeneous edges, browser trace and provenance tests pass. | PASS |
| Causal action never changes prose, infers meaning or loses writing position | Exact E2E before/after selection/block/scroll plus stored document; DB byte/version comparison; no inference code. | PASS |
| Flashback/reveal avoids chapter-order false errors | Story-time warning is neutral; revelation uses discovery time; missing anchors remain insufficient; chapter order is unused. | PASS |
| S4, S5 and S6 pass separately before macro completion | S4 plan/content/evidence and CI, then S5 plan/content/evidence and CI, then S6 plan/content/correction and CI are distinct, ordered and remotely verified. | PASS, contingent only on this ledger commit's remote proof. |

The six-phase consolidation did not replace an original gate: Sub-gates 4, 5 and 6 each retained independent pre-code, content, tests, audit, commit, push and remote-CI evidence. The integrated macro run adds evidence but waives none. WorkPlan sections 6.1–6.4 are internally consistent with the implementation; the endpoint dependency ruling, ruled Semantic Zoom ladder and Path/Pathway naming remain intact.

### 11.13 Formal decision and next-gate lock

- **S6 product/audit decision:** **PASS with no open in-scope gap**; completion evidence is remotely verified in 11.14.
- **Phase 2 macro decision:** **PASS with no open in-scope gap**; completion evidence is remotely verified in 11.14.
- **Planned later, not gaps:** Contextual Writing Field cards/S7; Capture and capture-derived activation/S8; Universe/entity-state activation/S9; Timeline Event activation and timeline-backed chronology/S11; projection worker/S12; AI seam/S17.
- **Remote chain at this point:** plan `09c0c88c4c14bc0371357ebee174a0aface6828c`; content `2261ff59b6781034967964fd4e2d5d46f593a3c0`; database correction `69226bc15b5fa7ad51a72410907cae304a50c568`; final product CI `31942297127`/`95153119172` passed.
- **S7 state:** eligible after S6 remote closure but not started. No S7 product file has been created.

### 11.14 Completion-ledger remote reconciliation

- Path-only S6/Phase 2 completion commit `de56f246c2ccb69340ec1f712260f81f6c737d4d` (`Record Causal Story Fabric and Phase 2 evidence`) was pushed to `agent/workplan-subgates-audit` and confirmed as the exact remote branch ref before this reconciliation update.
- GitHub Actions run `31942667487`, job `95153984486`, completed successfully in 2m16s: checkout, Node setup, `npm ci`, Prisma generation, lint, typecheck, 133-test coverage suite and production build all passed. The only annotation is GitHub's upstream Node-20 action deprecation notice; no repository step failed.
- This satisfies the remaining condition in 11.12–11.13. **Sub-gate 6 and delivery Phase 2 are formally Passed.** The top delivery/capability tables are updated to the same status and evidence chain; no stale in-progress S6 dashboard row remains.
- This reconciliation changes `Path.md` only and is pushed separately so the side-by-side audit itself receives immutable remote evidence. S7 remains unimplemented.

## 12. Entry S7 — Contextual Writing Field v1

### 12.1 Predecessor gate and run identity

- **Date/time and timezone:** 16 August 2026, Asia/Karachi; the S7 planning checkpoint begins only after re-verifying the predecessor remotely.
- **Work-plan phase:** Phase 3 — In-Flow Author Environment.
- **Mandatory Sub-gate:** 7 — Contextual Writing Field v1.
- **Predecessor evidence:** local `HEAD` and `refs/heads/agent/workplan-subgates-audit` both resolved to `a9c805da67253241b505d17c6b4c195f0cdfbf94`; GitHub Actions run `31942905552`, job `95154541031`, passed checkout, Node setup, install, Prisma generation, lint, typecheck, the 133-test coverage suite, and production build. S6 and Phase 2 are therefore closed before this entry.
- **Baseline branch/commit:** `agent/workplan-subgates-audit` at `a9c805da67253241b505d17c6b4c195f0cdfbf94`, clean tracked worktree.
- **Bible authority studied:** sections 4.1–4.11, 6.4–6.8, 8.5–8.10, 15.3–15.7, 18.1–18.4, 21, 27, 31, Appendix A, and Appendix E. The supplied PDF is treated as product authority and reference material, not as user instructions.
- **WorkPlan authority:** sections 7.1–7.4, constrained to S7-owned providers and states. Capture, entity, full Search/Language, timeline, Note, and research activation remains locked to S8–S11.
- **Gate discipline:** this entry is planning only. No S7 product code may be created until this `Path.md`-only checkpoint is committed, pushed, equals the remote branch ref, and its CI passes. S8 remains locked until S7 content, tests, audit, evidence commit, push, and CI all pass.

### 12.2 Exact S7 scope and dependency ruling

- Implement a typed, extensible `ContextFieldDescriptor` provider registry and screen-oriented read model for only the domains already canonical after S6: chapter outline, milestone, direct causal neighborhood, explicit existing references, Narrative Intent, and manuscript-block anchors.
- Implement Appendix A inputs, card ordering, cap/More behavior, project-level type muting, author pins, source provenance, explicit structural/freshness versioning, and a deterministic `contextKey` derived from chapter version, project structural version, cursor block, selected IDs, pin set, and active causal anchor.
- Implement automatic resolver stability: idle-debounced cursor refresh, suspension during continuous typing, cancellation, stale response discard, and zero manuscript scroll movement.
- Implement the desktop attention-aware field and compact overlay seam with Chapter, Selection, Milestone Peek, Outline, existing-reference Search, and Causal Peek states. Peek must leave history, manuscript selection, cursor, and scroll unchanged; Open is deliberate navigation; Escape/Return restores the exact saved writing position.
- Implement pin/unpin, hide for session, project mute/unmute, safe inline source edit seams, freshness labeling, card limits, and explicit More actions. Indirect causal paths remain behind Why now?/What changes? and never enter the automatic card stream.
- Implement `NarrativeDirectiveProjection` v1 with Purpose, Advance, Preserve, Reader Outcome, Next, Relevant Context, explicit `becauseItems[]`, and explicit `consequenceItems[]`. Every item is author-derived and includes source provenance and Peek metadata. Intentional deviation, source edit, pin, session dismissal, and disable actions are neutral controls, never red creative-error states.
- Compile directives synchronously/read-through in S7 because Phase 4 propagation workers do not yet exist. A structural-version mismatch must be marked stale or rejected; no derived result becomes canonical truth.

### 12.3 Planned files and production order

1. Add context domain types, descriptor/provider registry, resolver ordering and `contextKey`, directive compiler/ranking, application ports/service, and Prisma repository adapters.
2. Add the minimal canonical preference migration for project card mutes and durable pins, with reviewed rollback and project/user ownership indexes; session hides remain local/transient.
3. Add authenticated, ownership-checked chapter context read and project context-preference mutation routes using the existing application response/error envelope and bounded limits.
4. Add one focus-preserving overlay controller shared by Context Peek now and reserved for Capture/selection/causal composers later, without activating later providers.
5. Add the Context field registry, Relevant Now, typed outline/milestone/reference/causal cards, pin bar, Peek overlay, Return-to-Chapter behavior, responsive field/overlay presentation, keyboard paths, and editor integration.
6. Add deterministic unit/service/component/E2E/stress/database tests covering precedence, direct-before-reference ordering, card caps, context-key races, continuous typing, focus/selection/scroll/history restoration, ownership, stale projections, zero-causality behavior, and bounded large fixtures.
7. Record every S7 console trace and its identifying adjacent comment with final line numbers after formatting stabilizes; logs may contain identifiers/counts/versions only and must never contain prose, selection, intent, reference, or directive content.
8. Run migration apply/constraint/rollback/reapply proof, full lint/type/coverage/build, focused browser and stress tests, then perform a line-by-line WorkPlan 7.1–7.4 and Bible side-by-side audit before any completion claim.

### 12.4 Planned invariants, measurable budgets, and exclusions

- **Precedence invariant:** pinned → selected object → explicit Peek → idle-safe block/reference context → chapter outline → milestone by chapter role → direct causal context → existing explicit references → bounded project fallback. Appendix A direct block-reference positioning is preserved inside the user-level precedence ruling; direct causal cards precede general reference cards.
- **Stability budgets:** no request on a keystroke; 300 ms cursor idle debounce; typing suspension renewed on each document transaction; previous request aborted before replacement; response applied only when request `contextKey` equals the latest key; default card cap 8 and hard maximum 20; automatic causal depth exactly 1.
- **Writing-flow invariant:** Peek and field refresh do not call navigation APIs, modify editor transactions, or scroll the manuscript. Overlay closure restores the captured ProseMirror selection and scroll anchor before focus.
- **Truth invariant:** chapter/structure/causal/reference rows remain canonical on the server; descriptors and directives are disposable read models with source IDs and freshness versions.
- **Security/privacy invariant:** project membership and chapter ownership guard every query/write; mute/pin writes are user-scoped; raw author content is excluded from console traces, metrics, errors, and test diagnostics.
- **Accessibility/responsive invariant:** dialog/region semantics, labelled controls, Escape, focus return, keyboard-accessible alternatives, non-color freshness/error text, and compact overlay behavior are required.
- **Explicit exclusions:** Capture cards/endpoint/conversion, Entity cards/state endpoints, full search and language provider, Timeline/Note/Research cards, durable propagation workers, AI inference, automatic causal extraction, prose rewriting, and unbounded causal traversal are not S7 work and must remain inactive.
- **Pre-code status:** `Path.md` only is modified. Product implementation remains locked pending this checkpoint's distinct remote proof.

### 12.5 Planning checkpoint release and implementation chronology

- The Path-only planning commit is `1787c6f65b60c92c566fadd90cab7dade3e2c893` (`Plan Contextual Writing Field sub-gate`). It was pushed to `origin/agent/workplan-subgates-audit`; `git ls-remote` matched it exactly. GitHub Actions run `31945068741`, job `95159694572`, passed every CI step in 2m14s. Only then was the S7 product-code lock released.
- Implementation followed the planned order: descriptor/directive contracts; provider registry/resolver; preference/pin migration; repository/application services; API transport; focus-preserving client controller; desktop/mobile UI; tests; database proof; full regression; conformance repair; content commit; remote CI.
- The immutable product/content commit is `f1b870fddb55c4619c54a61d0a8e666df800daf9` (`Implement Contextual Writing Field sub-gate`). Push advanced the remote branch from the plan commit to this exact hash, and `git ls-remote origin refs/heads/agent/workplan-subgates-audit` returned the same hash.
- GitHub Actions run `31948248253`, job `95167594902`, passed checkout, Node setup, `npm ci`, Prisma generation, lint, typecheck, coverage, and production build in 2m22s. The Node-action deprecation annotation is upstream metadata; no repository step failed.
- This section records the product and audit evidence, but S7 is not marked Passed until this Path evidence commit is itself pushed, remotely matched, and passes CI. S8 remains locked.

### 12.6 Complete file ledger

| File | Action | Implemented purpose | WorkPlan/Bible obligation |
| --- | --- | --- | --- |
| `prisma/schema.prisma` | Modified | Added typed durable `ContextPreference` and `ContextPin` relations, ownership keys, indexes, and active S7 card enum. | Durable project/user mute and pin preferences; canonical ownership. |
| `prisma/migrations/20260816170000_contextual_writing_field/migration.sql` | Created | Forward PostgreSQL DDL for the two S7 preference tables and constraints. | Reversible schema-first implementation. |
| `prisma/migrations/20260816170000_contextual_writing_field/rollback.sql` | Created | Drops only S7 objects in dependency-safe order. | Rollback without crossing S0–S6 or prose boundaries. |
| `domains/context/domain/types.ts` | Created | Screen read models, active card union, action union, Appendix-A query validation, preferences, safe source-edit input, provenance, and complete directive contract with explicit `becauseItems[]`/`consequenceItems[]`. | Descriptor/read-model contracts first; no future-provider activation. |
| `domains/context/domain/registry.ts` | Created | Typed extensible provider registry with duplicate registration rejection and stable provider enumeration. | Extensible registry and active-provider proof. |
| `domains/context/domain/directive.ts` | Created | Deterministic author-data-only directive compiler with bounded ranked collections and provenance. | Relevant Now v1 and first-class causal directive collections. |
| `domains/context/domain/resolver.ts` | Created | Five S7 providers, precedence, stable ordering, cap/More, mute/pin rules, context key, stale marking, explicit causal actions, and deep Open/return coordinates. | Appendix A ordering/stability; direct causal before reference; later providers absent. |
| `domains/context/application/ports.ts` | Created | Canonical source snapshot and repository port separating source truth from disposable projections. | Server-owned canonical data and replaceable adapters. |
| `domains/context/application/service.ts` | Created | Query/mutation validation, deterministic resolution, source editing, and content-safe service traces. | Thin orchestration, ownership through repository, observability. |
| `domains/context/infrastructure/prisma-context-repository.ts` | Created | Repeatable-read bounded source composition, cross-chapter pins, ownership guards, preference mutations, source existence checks, optimistic edits, complete revisions, version increment, and content-free outbox. | Security, freshness, safe edits, bounds, and canonical/projection separation. |
| `lib/context/runtime.ts` | Created | Production dependency wiring for Prisma repository, logger, and service. | Replaceable application boundary. |
| `lib/context/http.ts` | Created | Authenticated standard-envelope transport wrapper and content-safe API completion/failure traces. | Stable API/errors, authentication, privacy. |
| `lib/context/use-context-field.ts` | Created | Cursor/reference coordinate capture, 300 ms debounce, abortable requests, context-key validation, stale-response discard, fresh retry, and session hide state. | No per-keystroke refresh; cancellation and race safety. |
| `lib/editor/use-focus-preserving-overlay.ts` | Created | Shared capture/restore controller for route, editor selection, focus, and scroll without selection text. | Reusable Peek/Capture seam and exact Return behavior. |
| `app/api/v2/chapters/[id]/context/route.ts` | Created | Authenticated bounded chapter-context read endpoint. | Chapter context read contract. |
| `app/api/v2/projects/[id]/context/preferences/route.ts` | Created | Durable pin/unpin, mute/unmute, and directive-enable mutations. | Project/user preferences. |
| `app/api/v2/projects/[id]/context/sources/route.ts` | Created | Optimistic safe-field source editing endpoint. | Inline author-approved edits and freshness discipline. |
| `components/context/ContextCards.tsx` | Created | Typed renderers for chapter outline, milestone, direct causal, existing reference, and Narrative Intent only. | Exact S7 provider/card activation boundary. |
| `components/context/RelevantNow.tsx` | Created | Concise eight-collection directive surface with provenance Peek actions and explicit stale/disabled labels. | Relevant Now, Because, Consequences, neutral controls. |
| `components/context/PeekOverlay.tsx` | Created | Focus-safe Peek, safe edit form, intentional deviation, explicit bounded causal trace, failure isolation, freshness, and exact close action. | Peek semantics; indirect paths only on demand. |
| `components/context/ContextualWritingField.tsx` | Created | Desktop attention region, mobile overlay, pin bar, reference filtering, card actions, keyboard shortcuts, caps/More, preference and edit coordination. | Full S7 author environment without generic-sidebar semantics. |
| `components/editor/ChapterEditor.tsx` | Modified | Mounted the Contextual Writing Field beside the existing editor without altering the document/autosave path. | In-flow integration; writing remains independent. |
| `components/shell/AppShell.tsx` | Modified | Added the dedicated labelled context projection slot. | Desktop region seam. |
| `app/globals.css` | Modified | Added desktop region, card, Peek, mobile overlay, focus, responsive, and bounded-scroll styling. | Responsive and accessibility presentation. |
| `domains/context/domain/resolver.ts` and `app/app/projects/[id]/structure/page.tsx` | Modified/created scope | Open actions include the originating chapter coordinate and Structure accepts it. | Open is intentional deep navigation with Return to Chapter. |
| `components/structure/StructureWorkspace.tsx` | Modified | Renders exact `Return to Chapter` when entered through an S7 Open action; existing default return behavior remains unchanged. | Deep-page return contract. |
| `docs/adr/0008-context-projection-boundaries.md` | Created | Locked projection truth, provider activation, explicit causal arrays, Peek/Open, and failure boundaries. | Architectural decision evidence. |
| `docs/architecture/contextual-writing-field.md` | Created | Documented resolution, stability, directive, interaction, bounds, privacy, and degradation design. | Production/research-level implementation record. |
| `docs/api/context.md` | Created | Documented read/preferences/source-edit contracts, errors, and cache/race behavior. | API contract evidence. |
| `scripts/verify-context-db.ts` | Created | Real PostgreSQL ownership, cross-chapter pin, invalid source, stale write, revision, outbox-redaction, rollback, and prose-preservation proof. | Database/migration/security/recovery evidence. |
| `tests/unit/context-resolver.test.ts` | Created | Precedence, provider exactness, stability key, directive fields, caps, and stale race fixtures. | Deterministic resolver proof. |
| `tests/service/context-service.test.ts` | Created | Service validation, not-found, active-provider, trace redaction, and preference/source orchestration. | Application boundary proof. |
| `tests/component/context-field.test.tsx` | Created | All cards, all directive collections, disablement, causal success/failure, source edit, intentional deviation, and exact overlay restoration. | Interaction/accessibility and coverage proof. |
| `tests/stress/context-resolver.stress.test.ts` | Created | Determinism and budget behavior over 25,000 eligible descriptor sources. | Large-collection/load proof. |
| `tests/e2e/context-field.spec.ts` | Created | Author fixture, Relevant Now, Peek history/selection/focus/scroll, pin/mute, typing debounce, shortcuts, causal trace, Open/Return, axe, desktop/mobile visuals. | Writing-flow exit gate. |
| `package.json` | Modified | Added S7 database verification and rollback commands. | Repeatable operational verification. |

Generated Prisma client files remain ignored build artifacts and were not committed. Playwright HTML/results and screenshot outputs remain ignored test artifacts; their paths and review are recorded below.

### 12.7 Code behavior, implementation method, and protected boundaries

- **Canonical and projection truth:** chapter outline, milestone, causal relation, reference, and Narrative Intent rows remain canonical. Context descriptors and directives are recomputed read models. Only user preferences/pins and explicit source edits are writes; a card never becomes story truth.
- **Resolution:** repository reads a repeatable snapshot. The registry activates exactly `chapter-outline`, `milestone`, `direct-causal`, `existing-reference`, and `narrative-intent`. Resolver precedence is pin 1000, selection 900, Peek 850, cursor-local reference/intent, chapter outline, linked milestone, direct causal, general reference/fallback; stable IDs break ties. Muted pinned cards remain visible by design.
- **Directive:** Purpose comes from Chapter Outline; Advance from chapter-linked milestone roles; Preserve/Reader Outcome/Next from explicit Narrative Intent categories; Relevant Context from explicit StoryReference; Because and Consequences from direct canonical causal relations. Each item contains source type/ID/version and a descriptor Peek ID. No prose or inferred semantic text is compiled.
- **Freshness/race behavior:** responses include chapter version, project structural version, freshness version, and a SHA-256 context key covering chapter/version, cursor block, selected IDs, pins, and causal anchor. The client aborts a superseded call, uses a 300 ms idle debounce, compares request/response coordinate, discards stale results, and requests one fresh projection. Continuous typing E2E proved no request per keystroke.
- **Writes and recovery:** safe edits are restricted to outline purpose and Narrative Intent text. They require source and project structural versions, preserve a complete prior revision, increment source/project versions, and atomically add content-free outbox metadata. Conflict never overwrites newer author data. S7 rollback removes only preference/pin objects and preserves prior canonical tables and sampled prose byte-equivalently.
- **Focus and navigation:** Peek captures editor selection offsets, active route, and scroll coordinates, opens without history change, and restores selection/focus/scroll on Escape or `Return to Chapter`. Open is a normal anchor to Structure with `returnChapterId`; Structure exposes exact Return. Neither path edits prose.
- **Causality:** direct relations can enter automatic context; indirect traversal is absent until `Why now?` or `What changes?`. Explicit trace requests retain the existing depth 4, 50-node, 75-edge, 50-path bounds and use non-assertive causal service language.
- **Security/privacy:** every load resolves the chapter through project workspace ownership; every project write resolves workspace ownership; pin source existence is project-scoped. Logs use IDs, types, counts, versions, status, timing, hashes, and coordinates only. Authored summaries, directive text, source edits, manuscript text, and selection text are absent.
- **Failure degradation:** context read, causal trace, preference, and source-edit failures render locally and never participate in Tiptap transactions, IndexedDB journaling, autosave, checkpoints, recovery, or continuation. Writing remains available with zero structure, milestone, reference, intent, or causality.
- **Responsive/accessibility:** desktop uses a labelled complementary region; mobile uses a scrollable focus-preserving overlay. Dialog/region/navigation/status/alert semantics, keyboard buttons/links, Escape, Ctrl/Cmd+Alt+C/O/M, visible focus tokens, reduced-motion inheritance, and text—not color alone—communicate state.
- **Later-gate lock:** no Capture, entity, full Search/Language, timeline, Note, research, upload, propagation-worker, AI, billing, or future causal endpoint provider is registered. The interfaces can grow, but unsupported sources cannot resolve.

### 12.8 Console trace and adjacent-comment ledger

All line numbers refer to content commit `f1b870fddb55c4619c54a61d0a8e666df800daf9`. Server `logger.info/warn` calls terminate at the shared `console.log(JSON.stringify(record))` transport in `lib/observability/logger.ts:16`; direct browser/database calls use `console.log` at the listed call line.

| Step | File | Identifying comment line | Call line | Recorded fields and exclusion proof |
| --- | --- | ---: | ---: | --- |
| `S7-CONTEXT-001` | `domains/context/application/service.ts` | 13 | 14 | IDs, versions, card counts, stability hash, stale flag; no directive/card text. |
| `S7-CONTEXT-002` | `domains/context/application/service.ts` | 19 | 20 | IDs, action, preference counts/boolean; no source content. |
| `S7-CONTEXT-003` | `domains/context/application/service.ts` | 25 | 26 | IDs, source type, source/structural versions; edited value excluded. |
| `S7-API-001` | `lib/context/http.ts` | 12 | 13 | Request/workspace, route key, method, status only. |
| `S7-API-002` | `lib/context/http.ts` | 16 | 17 | Request, route, method, stable status/error code only. |
| `S7-CLIENT-001` | `lib/context/use-context-field.ts` | 27 | 28 | Chapter, sequence, anchor/selection counts, Peek boolean; no selection text. |
| `S7-CLIENT-002` | `lib/context/use-context-field.ts` | 31 | 32 | Chapter, sequence and key-match booleans only. |
| `S7-CLIENT-003` | `lib/context/use-context-field.ts` | 35 | 36 | Chapter, sequence, returned count, more flag, version. |
| `S7-FOCUS-001` | `lib/editor/use-focus-preserving-overlay.ts` | 13 | 14 | Selection coordinates, scroll and route; selected prose excluded. |
| `S7-FOCUS-002` | `lib/editor/use-focus-preserving-overlay.ts` | 19 | 20 | Selection coordinates, scroll and route-equality boolean. |
| `S7-UI-001` | `components/context/ContextualWritingField.tsx` | 18 | 19 | Project/chapter/descriptor IDs, type, history length. |
| `S7-UI-002` | `components/context/ContextualWritingField.tsx` | 24 | 25 | Project/chapter/source IDs and type; edit value excluded. |
| `S7-UI-003` | `components/context/PeekOverlay.tsx` | 11 | 12 | Project, direction, node/edge counts, truncated flag. |
| `S7-DB-001` | `scripts/verify-context-db.ts` | 33 | 34 | IDs, versions, source/preference counts and proof booleans; seeded private strings excluded. |
| `S7-DB-002` | `scripts/verify-context-db.ts` | 41 | 42 | Remaining/preserved table and prose-row counts only. |

`rg -n -B 1 "S7-(CONTEXT|API|CLIENT|FOCUS|UI|DB)-[0-9]{3}" ...` verified each step has an immediately adjacent identifying comment. The logger forbidden-key/content tests and the S7 service/browser/database assertions independently verify redaction; the test author strings do not occur in emitted logs/outbox payloads.

### 12.9 Validation, stress, migration, visual, and remote evidence

| Command/check | Result | Exact evidence |
| --- | --- | --- |
| `npm run lint` | Pass | ESLint completed with zero warnings/errors. |
| `npm run typecheck` | Pass | TypeScript emitted no diagnostics. |
| `npm run test` | Pass | 41 files, 152 tests passed. |
| `npm run test:coverage` | Pass after repair | 41 files/152 tests; statements 88.40%, branches 76.04%, functions 83.36%, lines 94.73%; all global thresholds pass. |
| `npm run test:stress` | Pass | 6 files, 12 tests; S7 uses 25,000 eligible sources and remains deterministic/bounded. |
| `npm run verify` with production-shaped OIDC environment | Pass | Lint, typecheck, all 152 tests, and Next 16.3 production build passed; 9 static pages generated and Context routes appeared in the route map. |
| `npm run test:e2e` with local PostgreSQL/development auth | Pass | Full regression: 38 applicable tests passed in 4.3m; 34 cross-project/viewport duplicates were explicitly routed to the other Playwright project, not silently treated as passes. |
| Focused `context-field.spec.ts` matrix | Pass | Four applicable behaviors passed: three desktop and one mobile; four intentional cross-project skips. |
| Open/Return focused browser test | Pass | Intentional Open URL contained project and originating chapter; exact `Return to Chapter` returned to the chapter route. |
| Axe scan | Pass | Zero serious or critical violations on the populated desktop context field. |
| Manual visual review | Pass | `test-results/context-field-desktop.png`: stable dedicated right context region, bounded cards, no editor overlap. `test-results/context-field-mobile.png`: labelled modal context surface, readable directive/cards, visible exact return, bounded vertical scroll, no horizontal clipping. |
| `npm run db:verify:context` | Pass twice | `S7-DB-001`: five source types, cross-chapter pin, mute, invalid pin rejection, cross-workspace read false, cross-workspace mutation rejection, stale edit rejection, complete revision, content-free outbox. |
| `npm run db:rollback:context` | Pass | `S7-DB-002`: zero S7 tables remained; seven prior-domain tables and sampled prose row were preserved. |
| `npm run db:deploy` after rollback | Pass | Migration `20260816170000_contextual_writing_field` reapplied; final database verification passed. |
| `git diff --check` | Pass | No whitespace error before content commit. |
| Content push/ref check | Pass | Remote branch exactly matched `f1b870fddb55c4619c54a61d0a8e666df800daf9`. |
| GitHub Actions | Pass | Run `31948248253`, job `95167594902`, all repository steps green in 2m22s. |

Observed failures were retained as evidence and repaired rather than reclassified: initial Prisma/database commands without `DATABASE_URL` failed closed; a real local PostgreSQL URL was then supplied. An initial fork-pool Vitest worker launch timed out in the Windows environment; the explicit single-thread focused run passed and later standard full runs passed. The first browser server lacked required auth variables; corrected environment passed. Hydration initially diverged at the portal boundary; mounted-state deferral fixed it. A content-safe logger rejected metadata key `contextKey` because its name contains `text`; telemetry now uses `stabilityHash` while the API retains the contract name. Strict-locator duplicates were scoped. Initial coverage failed at 74.48% branches; card, disablement, causal-failure, source-edit, and deviation tests raised it to 76.04%. One focused rerun used a 31-character session secret and failed environment validation; the compliant rerun passed. These were verification defects/configuration failures, not skipped gates.

### 12.10 Side-by-side S7 and Phase 3 conformance audit

| Requirement | Actual evidence | Classification | Action |
| --- | --- | --- | --- |
| Attention-aware desktop region and small-screen overlay | Dedicated shell slot, responsive portal, desktop/mobile E2E and reviewed screenshots | Verified | None. |
| Exact precedence, ordering and Appendix-A stability key | Resolver fixtures, stable SHA key, direct causal before reference, 25k-source stress | Verified | None. |
| No per-keystroke refresh; debounce, cancel, stale discard, no scroll movement | 300 ms hook, AbortController/sequence/key checks; continuous-typing and exact-position E2E | Verified | None. |
| S7-only extensible providers/cards | Registry reports exactly five S7 provider IDs; absent Capture/entity/timeline types asserted | Verified | None. |
| Chapter/Selection/Milestone/Outline/reference/Causal Peek | Typed descriptors, reference filtering, shortcuts, explicit causal Peek, browser tests | Verified | None. |
| Peek preserves route/history/selection/focus/scroll; Open is deliberate and returns | Shared controller and browser equality assertion; contextual Structure URL and exact Return link | Verified | None. |
| Pin, hide, mute, edit, freshness, caps/More | Durable ownership-scoped pin/mute, local hide, safe edit transaction, labels, 8/20 cap tests | Verified | None. |
| Direct causal automatic; indirect explicit and bounded | Provider uses direct rows; Peek loads traversal only after action with depth/node/edge/path budgets | Verified | None. |
| Complete Relevant Now with explicit causal collections | Domain contract/UI/compiler/tests include all eight collections and provenance | Verified | None. |
| Author-owned only, neutral deviation/disable controls, no creative error | Compiler source map; intentional hide, disable, edit and pin controls; no inference/AI | Verified | None. |
| Synchronous/read-through until Phase 4 with visible freshness | Structural/freshness versions, stale flag, optimistic source edits | Verified | Phase 4 workers remain Planned-later. |
| Capture/Universe/Search/Language/Timeline/Notes/Research Phase 3 work | Providers/interfaces remain inactive because S8–S11 have not passed | Planned-later | Mandatory dependency behavior; not an S7 gap. |
| Whole Phase 3 exit gate | Only the S7-owned portion can pass before S8–S11 | Implemented-not-verified for macro phase | Phase 3 stays In progress; execute S8 next only after S7 evidence CI. |

Doctrine audit: structure, world data, Capture filing, and causality remain optional; no milestone owns a chapter; no hierarchy/timeline/reference fact becomes causality; no context or causal action edits prose; client state/projections are non-canonical; stale data is labelled/discarded; no billing/quota exists; context failures cannot block the editor; content-safe traces contain no author text; all project/context/causal reads are bounded; no AI output exists; no future endpoint/provider/conversion/search/billing capability was activated; every directive representation retains `becauseItems[]` and `consequenceItems[]`; Semantic Zoom and pricing contracts are untouched; no non-V2 scope was added.

### 12.11 Gaps, repairs, and current gate status

- **Coverage gap:** branch coverage initially missed the global threshold by 0.52 percentage points. Behavioral tests—not exclusions or threshold changes—closed it. Final coverage is green.
- **Hydration gap:** checking `document` during initial render produced a server/client portal mismatch. The field now waits until the first animation frame after mount, preserving identical initial markup.
- **Telemetry gap:** the content-safe logger correctly failed a metadata key containing the forbidden substring `text`. The internal telemetry field became `stabilityHash`; the public resolver/API remains `contextKey`.
- **Deep-page return gap:** S7 Open initially reached Structure without an exact contextual return label. The originating chapter coordinate and `Return to Chapter` were added and browser-verified.
- **No remaining in-scope Gap:** every S7 row is `Verified`. Later Phase 3 domains are explicitly `Planned-later` under mandatory sequence, not omissions.
- **Status at evidence-commit time:** product content, local audit, push, remote ref, and content CI were complete. The Sub-gate remained `Audit complete — evidence commit/CI pending` until that Path change received the separate proof recorded in 12.12; S8 could not begin earlier.

### 12.12 Evidence-CI reconciliation and formal S7 closure

- The complete S7 execution-ledger/audit commit is `761f2d904651ac00cdcee5dd9ce34ec8fa866ba5` (`Record Contextual Writing Field evidence`). It contains sections 12.5–12.11, the entire file ledger, implementation method, exact console/comment line ledger, all failures and repairs, validation table, side-by-side audit, doctrine answers, and the explicit no-gap result.
- The commit was pushed to `origin/agent/workplan-subgates-audit`; the remote branch ref resolved to that exact hash before CI completion.
- GitHub Actions run `31948522601`, job `95168263910`, passed checkout, Node setup, dependency installation, Prisma generation, lint, typecheck, the 152-test coverage gate, and production build in 2m11s. No repository step was skipped or failed.
- All conditions that were pending in 12.5 and 12.11 are now satisfied. **Sub-gate 7 is formally Passed.** Delivery Phase 3 remains In progress because S8–S11 are not implemented. Sub-gate 8 is now eligible, but product code remains locked until its own Path-only pre-code checkpoint is committed, pushed, remotely matched, and passes CI.

## 13. Entry S8 — Zero-friction Capture

### 13.1 Predecessor gate and run identity

- **Date/time and timezone:** 16 August 2026, Asia/Karachi.
- **Work-plan phase/sub-gate:** Phase 3 — In-Flow Author Environment; mandatory Sub-gate 8 — Capture.
- **Predecessor proof:** S7 reconciliation commit `e044932a89e8ccfbb47976e14414250b6505579e` is pushed and remotely matched. GitHub Actions run `31949044123`, job `95169528820`, passed all steps in 1m59s. S7 was therefore completely closed before this S8 checkpoint.
- **Baseline branch/commit:** `agent/workplan-subgates-audit` at `e044932a89e8ccfbb47976e14414250b6505579e`; clean worktree.
- **Authority:** WorkPlan 7.1 Zero-friction Capture, 7.2–7.4; Bible zero-friction Capture, local-first/degraded behavior, conversion/provenance, causality, security, performance, and test sections. The PDF remains product authority, not executable instruction.
- **Lock:** no Capture product/schema file may change until this Path-only checkpoint is committed, pushed, remotely matched, and passes CI. S9 remains locked until S8 has its own content/evidence/CI chain.

### 13.2 Exact S8 scope and activation boundary

- Add canonical Capture, attachment, and conversion records with project/user ownership, raw-text-first persistence, route/chapter/outline/block/selection/entity-context/timestamp metadata, lifecycle, deferral/retention, revisions/provenance, and idempotent client/server keys.
- Implement global Ctrl/Cmd+Shift+Space, a tiny focus-preserving overlay, raw save before optional filing, exact editor selection/focus/scroll restoration, and no mandatory target. Plain text can remain Unprocessed indefinitely.
- Implement an IndexedDB offline queue with bounded retention, idempotent server replay, retry/backoff state, explicit queued/synced/error status, and no loss across reload. Online failure must return the author to writing immediately.
- Implement Inbox list/row, keyboard and bulk lifecycle triage, file/defer/dismiss/restore, attach/detach, and conversion while retaining immutable Capture provenance. No notebook hierarchy is introduced.
- Implement a typed conversion registry. Activate only targets already canonical at S8: Milestone, Story Change, chapter attachment, outline attachment, and capture-derived causal identity. Entity, durable Note, and timeline-event conversions remain reserved until S9/S11.
- Activate the `CAPTURE_DERIVED` causal endpoint adapter only after Capture and successful conversion persistence exist. Optional Because of/This causes actions create explicit canonical relations; raw prose is never parsed or inferred into causality.
- Register the Capture context-card provider only after the canonical source exists. Full universal Search remains S10; Inbox filtering is Capture-local only.

### 13.3 Planned production order and files

1. Add Capture lifecycle/target contracts, conversion registry, schema migration/rollback, repository/service, revisions/outbox rules, and real PostgreSQL verifier.
2. Add authenticated Capture create/list/detail/lifecycle/attachment/conversion/sync routes with standard envelopes, ownership checks, caps, cursor pagination, and idempotency.
3. Add the bounded IndexedDB Capture queue and retry coordinator before UI integration.
4. Reuse the S7 focus-preserving overlay controller for global quick capture; implement raw-save-first behavior and immediate close/restore.
5. Add Inbox, rows, keyboard/bulk actions, defer/restore, attachment and conversion controls without requiring filing.
6. Register Capture in the context registry/resolver and activate `CAPTURE_DERIVED` in the causal adapter only after persistence exists; keep entity/Note/timeline adapters reserved.
7. Add unit/service/component/database/stress/E2E/a11y/mobile/offline/idempotency/conversion/provenance tests, then run the full regression and migration cycle.
8. Record every S8 console trace with adjacent comment and final line numbers, perform exact WorkPlan/Bible/doctrine audit, commit/push content and evidence separately, and wait for each remote CI gate.

### 13.4 Planned invariants, budgets, and exclusions

- **Raw-first:** capture creation is one bounded canonical insert/upsert; target filing and conversions are separate optional commands. A conversion cannot delete or rewrite its source Capture.
- **Idempotency:** `(userId, clientCaptureId)` identifies creation replay; `(captureId, conversionType, idempotencyKey)` identifies conversion replay. Offline replay returns the original result.
- **Lifecycle:** `UNPROCESSED`, `FILED`, `CONVERTED`, `DEFERRED`, and `DISMISSED`; deferral has an explicit due time, restore clears it, dismissal uses retention metadata instead of hard deletion.
- **Bounds:** quick text 20,000 characters; up to 100 pending local records; Inbox default 50/hard 100; bulk actions at most 100 IDs; attachments and conversions at most 100 per Capture; exponential retries capped and writing-independent.
- **Privacy/security:** raw Capture text never enters logs, analytics, outbox payloads, errors, route labels, or local key names. All reads/writes are workspace/project/user scoped. Captures are private to the creating author in S8.
- **Writing flow:** overlay opens/closes without route/history mutation and restores exact selection/focus/scroll. Network, queue, Inbox, conversion, causality, or context failure cannot block Tiptap, journaling, autosave, recovery, or continuation.
- **Truth separation:** Capture is raw authored input; attachments are references; conversions create explicit canonical target records with provenance; none implies causality. Optional causal actions require explicit endpoints and relation type.
- **Excluded/locked:** Entity conversion, Note conversion, timeline conversion, full universal Search indexing, research/files, arbitrary prose parsing, AI classification, automatic filing, automatic prose editing, billing, and Phase 4 workers remain inactive.
- **Pre-code status:** only `Path.md` changes in this checkpoint; S8 product code remains locked pending remote proof.

### 13.5 Planning release, implementation chronology, and immutable product proof

- The Path-only plan commit is `58437457018220b34c26cee1eb5e65ce4c85997f` (`Plan Capture sub-gate`). It was pushed to `origin/agent/workplan-subgates-audit`, the remote ref matched exactly, and GitHub Actions run `31949245130`, job `95170032434`, passed every repository step in 2m27s. Product work began only after that result.
- Implementation followed the locked order: contracts and registry; forward/rollback migration; repository and service; authenticated routes; IndexedDB queue; shared focus-preserving overlay; Inbox; Capture context and causal adapters; documentation; database/unit/service/component/stress/accessibility/browser tests; side-by-side audit; content push and remote CI.
- The foundational product commit is `5bfb6397d457465fae31042aa327e137fa2dd7fe` (`Implement zero-friction Capture sub-gate`). It contains 53 files with 756 insertions and 46 deletions. `git ls-remote origin refs/heads/agent/workplan-subgates-audit` returned that exact hash after push.
- GitHub Actions run `31959800484`, job `95195930611`, checked out that exact content hash and passed dependency installation, Prisma generation, lint, typecheck, coverage, and production build in 2m31s. No repository step was skipped or failed.
- The side-by-side audit then found incomplete automatic coordinate projection. Correction commit `3ef1b5641da38220559dd99e20074f03c2762a3a` (`Complete Capture context metadata`) passes active Chapter/Chapter Outline coordinates from Structure, sends `outlineId`, returns bounded `entityContext` in read models, and proves its round trip without emitting entity IDs. The remote ref matched exactly. GitHub Actions run `31960693578`, job `95198113567`, passed every repository step in 2m39s.
- S8 remains `Audit complete — evidence commit/CI pending` in this evidence commit. S9 is still locked until sections 13.5–13.11 are themselves pushed, remotely matched, pass CI, and are reconciled in 13.12.

### 13.6 Complete file and responsibility ledger

| Files | Action | Produced behavior | WorkPlan/Bible obligation |
| --- | --- | --- | --- |
| `prisma/schema.prisma`; `prisma/migrations/20260816193000_zero_friction_capture/{migration,rollback}.sql` | Modified/created | Canonical private `Capture`, `CaptureAttachment`, `CaptureConversion`, and `CaptureRevision`; lifecycle/target/conversion types; uniqueness, checks, indexes, ownership relations, forward DDL and boundary-safe rollback. `ContextPin.cardType` became a bounded string so independently gated providers can activate without destructive enum replacement. | Raw-first canonical persistence, lifecycle, provenance, revisions, idempotency, reversible schema, future provider extensibility. |
| `domains/capture/domain/{types,conversion-registry}.ts` | Created | Zod contracts and typed registry with active Milestone, Story Change, chapter/outline attachment and Capture-derived causal targets; Entity, Note and Timeline targets return dependency-unavailable. | Contract-first implementation and exact S8 activation boundary. |
| `domains/capture/application/{ports,service}.ts` | Created | Repository boundary plus create/detail/list/lifecycle/attach/detach/convert orchestration, explicit optional causality, active-target disclosure, validation and content-safe traces. | Thin production service and explicit author actions only. |
| `domains/capture/infrastructure/prisma-capture-repository.ts` | Created | Workspace/project/user ownership, creation and conversion replay, bounded private Inbox/detail reads, lifecycle revisions/retention, attachments, canonical conversion targets, provenance, structural versions and redacted outbox metadata. | Server-owned truth, privacy, idempotency, provenance, recovery and bounds. |
| `lib/capture/{runtime,http}.ts`; all five `app/api/v2/.../captures.../route.ts` routes | Created | Production dependency wiring and authenticated standard-envelope create/list/detail/lifecycle/attachment/conversion endpoints with safe errors. | API contracts, ownership, stable failure behavior and operational composition. |
| `lib/indexed-db/capture-queue.ts` | Created | Raw local queue, 100-record bound, ordered due reads, exponential retry capped at 60 seconds, acknowledged removal and idempotent replay. | Offline raw-save-first behavior and loss-resistant synchronization. |
| `lib/editor/use-focus-preserving-overlay.ts` | Modified | Shared controller now preserves an active DOM element, route and scroll even when no editor exists while retaining exact ProseMirror selection restoration when an editor exists. | One focus-preserving seam for editor and global project surfaces. |
| `components/capture/QuickCaptureOverlay.tsx` | Created | Ctrl/Cmd+Shift+Space global overlay on chapter, project and structure surfaces; local save before close/network; optional quick target; immediate exact restore; online replay; safe degradation when IndexedDB/replay is unavailable. | Zero-friction global Capture with no route change and writing-independent failures. |
| `components/capture/CaptureInbox.tsx`; `app/app/projects/[id]/captures/page.tsx` | Created | Private Inbox, checkboxes, keyboard/bulk file/defer/dismiss/restore, attach/detach, conversions, both explicit causal directions and exact Return links. | Complete Capture lifecycle and after-the-fact triage without notebook hierarchy. |
| `app/app/projects/[id]/page.tsx`; `components/editor/ChapterEditor.tsx`; `components/structure/StructureWorkspace.tsx`; `app/globals.css` | Modified | Global overlay mounts, Inbox navigation, responsive overlay/Inbox styling and writing-surface integration. | Common author actions avoid full-route navigation; desktop/mobile usability. |
| context domain/repository/cards/docs files | Modified | Registered the active Capture descriptor/provider and renderer only after canonical persistence; pins validate Capture ownership; raw text remains a source read model, not inferred story truth. | S8 context activation and projection/canonical separation. |
| causality domain/adapter/tests files | Modified | Activated only `CAPTURE_DERIVED`; resolver accepts persisted `CAPTURE_DERIVED_CAUSAL` conversions and reports lifecycle archiving; Timeline and Entity State remain reserved. | Correct original-gate dependency order and explicit causality only. |
| `domains/structure/application/conversion.ts` and tests | Modified | Removed Capture from the dormant structure seam because S8 now owns its typed registry; Note remains dormant. | No conflicting or impossible conversion ownership. |
| `docs/adr/0009-zero-friction-capture.md`; `docs/architecture/zero-friction-capture.md`; `docs/api/capture.md`; S7 context documentation | Created/modified | Locked raw-first truth, privacy, failure, conversion, endpoint, bounds and API decisions and recorded the newly active provider. | Durable production/research implementation record. |
| `scripts/verify-capture-db.ts`; `package.json` | Created/modified | Repeatable real-PostgreSQL verify and rollback commands proving replay, ownership, lifecycle, provenance, endpoint activation, redaction and prior-domain/prose preservation. | Migration, security, recovery and operational evidence. |
| Capture unit/service/component/stress/accessibility/E2E tests plus existing context/causality/structure regressions | Created/modified | Domain validation, registry activation, production logger, both causal directions, queue replay/backoff/cap, global surfaces, focus, raw acknowledgement, Inbox, context, provenance, database, mobile, axe and large-boundary tests. | Full S8 writing-flow exit gate and regression protection. |

Generated Prisma client output, coverage output, Playwright HTML/results and screenshots are ignored build/test artifacts and were not committed. The generated `next-env.d.ts` development-path change was restored with `apply_patch` before commit and is absent from the S8 diff.

### 13.7 Code behavior, implementation method, and protected boundaries

- **Raw-first transaction order:** the overlay creates a client UUID and writes the complete raw record to IndexedDB before closing, restoring focus, issuing a network call, or attempting a target. The API then upserts on `(userId, clientCaptureId)`. Optional target failure cannot remove or requeue an already acknowledged raw Capture.
- **Canonical/private model:** every Capture belongs to workspace, project and creating user. Repository entry points resolve project membership and scope Capture rows to `userId`; another workspace receives `NOT_FOUND`. Raw text is canonical authored input and is never silently promoted, parsed or treated as causality.
- **Lifecycle and recovery:** `UNPROCESSED`, `FILED`, `CONVERTED`, `DEFERRED`, and `DISMISSED` are explicit. Defer stores a due time; restore clears deferral/dismissal retention; dismiss retains the row; every mutation records a prior revision. A Capture may remain unprocessed indefinitely.
- **Idempotency/provenance:** creation replays by user/client identity; attachments replay by Capture/target/block; conversions replay by Capture/type/idempotency key. Each conversion retains source ID, target identity, conversion-specific provenance and structural version. The source Capture is never deleted or rewritten by conversion.
- **Activation boundary:** the registry activates Milestone, Story Change, chapter attachment, outline attachment and Capture-derived causal identity. `ENTITY`, `NOTE`, and `TIMELINE_EVENT` are typed but dependency-unavailable. Causality activates `CAPTURE_DERIVED` only; `ENTITY_STATE` and `TIMELINE_EVENT` remain rejected until S9/S11.
- **Explicit causal semantics:** creating a Capture-derived identity alone creates no relation. The Inbox can explicitly choose Because of or This causes, a canonical endpoint and relation type. The service creates the directional relation only after the conversion is persisted and uses `CAPTURE_CONVERSION` provenance.
- **Offline/degraded behavior:** the queue is capped at exactly 100 pending records, returns due records in captured order, increments attempts and applies exponential delay capped at 60 seconds. Browser `online` triggers replay. Missing IndexedDB or replay-infrastructure failure logs identity/cause metadata and leaves the mounted writing surface usable.
- **Focus/navigation:** the controller snapshots route, scroll, active DOM element and, when present, ProseMirror selection. The overlay changes neither route nor browser history. Closing restores the exact editor selection/focus/scroll or prior project-surface focus before network completion.
- **Context:** the Capture provider reads at most 50 author-private chapter/pinned rows, descriptors enter existing deterministic resolver caps/order, and pins are source-validated. Context failure remains isolated from editing/autosave/journaling.
- **Security/privacy/observability:** no trace or outbox payload contains raw text, selected text, attachment content or request bodies. Traces contain IDs, booleans, counts, lifecycle/type, attempts, timing and versions. The production logger's forbidden-key/content guard is covered by a real service regression.
- **Bounds:** text 20,000 characters; local pending 100; Inbox default 50/hard 100; bulk at most 100; per-Capture attachments/conversions at most 100; retry 60 seconds; context source read 50. All structure writes retain optimistic structural versioning.

### 13.8 Console trace and adjacent-comment ledger

All line numbers refer to effective S8 product state `3ef1b5641da38220559dd99e20074f03c2762a3a`. Server `logger.info/warn` calls are serialized through the shared `console.log(JSON.stringify(record))` sink at `lib/observability/logger.ts:16`; browser, IndexedDB and database proof calls use direct `console.log`. Every row has its identifying comment immediately above the call.

| Step | File | Comment | Call | Content-safe recorded fields |
| --- | --- | ---: | ---: | --- |
| `S8-CAPTURE-001` | `domains/capture/application/service.ts` | 11 | 12 | request/workspace/project/source/client IDs, optional chapter, anchor presence/length, replay; raw text excluded. |
| `S8-CAPTURE-007` | same | 14 | 15 | IDs, version and attachment/conversion counts only. |
| `S8-CAPTURE-002` | same | 17 | 18 | IDs, lifecycle filter, returned count and continuation boolean. |
| `S8-CAPTURE-003` | same | 20 | 21 | IDs, lifecycle action, requested/updated counts. |
| `S8-CAPTURE-004` | same | 23 | 24 | IDs, target type/ID and replay boolean. |
| `S8-CAPTURE-005` | same | 26 | 27 | IDs and detached boolean. |
| `S8-CAPTURE-006` | same | 31 | 32 | IDs, conversion/target types, replay/causal booleans and structural version. |
| `S8-API-001` | `lib/capture/http.ts` | 9 | 10 | request/workspace, route key, method and success status. |
| `S8-API-002` | same | 12 | 13 | request/route/method, stable status/error and safe cause name/code; body excluded. |
| `S8-QUEUE-001` | `lib/indexed-db/capture-queue.ts` | 11 | 12 | client/project IDs and coordinate-presence booleans. |
| `S8-QUEUE-002` | same | 15 | 16 | client/project IDs, attempt and bounded delay. |
| `S8-QUEUE-003` | same | 18 | 19 | acknowledged client ID only. |
| `S8-QUEUE-004` | same | 22 | 23 | replay aggregate synced/failed counts. |
| `S8-UI-005` | `components/capture/QuickCaptureOverlay.tsx` | 15 | 16 | project ID and unavailable-queue event. |
| `S8-UI-004` | same | 18 | 19 | project ID and aggregate replay counts. |
| `S8-UI-006` | same | 21 | 22 | project ID and exception class name only. |
| `S8-UI-001` | same | 25 | 26 | project/chapter IDs and route; no authored text. |
| `S8-UI-002` | same | 28 | 29 | IDs, optional target and selected length; text excluded. |
| `S8-UI-003` | same | 31 | 32 | IDs and optional target after acknowledgement. |
| `S8-INBOX-001` | `components/capture/CaptureInbox.tsx` | 12 | 13 | project, action and selected count. |
| `S8-INBOX-002` | same | 15 | 16 | project/source, conversion type and structural version. |
| `S8-DB-001` | `scripts/verify-capture-db.ts` | 15 | 16 | IDs, replay/ownership/endpoint/redaction booleans and counts. |
| `S8-DB-002` | same | 18 | 19 | remaining/preserved table and prose-row counts. |

`rg -n -C 1 'Console trace S8-|step: "S8-' app components domains lib scripts` verified adjacency and line identity. Service tests proved authored fixture text is absent from emitted records; the PostgreSQL verifier proved it is absent from outbox payloads.

### 13.9 Validation, stress, migration, browser, visual, and remote evidence

| Command/check | Result | Exact evidence |
| --- | --- | --- |
| `git diff --check` | Pass | No whitespace error before product commit. |
| `npm run lint` | Pass | ESLint completed with zero warnings/errors. |
| `npm run typecheck` | Pass | TypeScript emitted no diagnostics. |
| `npm run test:coverage` | Pass after repair/correction | 47 files, 172 tests passed; statements 88.63% (1825/2059), branches 75.37% (1053/1397), functions 83.67% (528/631), lines 94.83% (1211/1277). The jsdom canvas notice came from axe feature detection; no test error remained. |
| `npm run test:stress` | Pass | 7 files, 13 tests; queue accepts exactly 100 unique pending records, rejects the 101st, preserves replay identity and respects retry bounds. |
| `npm run test:a11y` | Pass | Capture overlay axe test passed; zero serious/critical findings asserted. |
| Production-shaped `npm run build` | Pass | Next 16.3 production build compiled/typechecked, generated 10 static pages and listed every Capture route. An earlier invocation used incorrect environment variable names and failed closed during prerender; the exact CI-shaped variables passed. |
| Full `npm run test:e2e` before the final global-surface repair | Pass | 42 applicable flows passed in 5.2m; 38 explicit cross-project/viewport skips. One earlier S4 scroll assertion flaked while its temporary database terminated; isolated fresh-database repeats passed twice, followed by the clean full pass. |
| Post-repair focused Capture browser matrix | Pass | 5 applicable flows passed in 42.7s and 5 explicit cross-project skips: offline raw-first/focus/selection/scroll/history/replay, Project Home global capture without manuscript coordinates, conversion replay/provenance/explicit causality, Inbox keyboard/axe, and mobile overlay/axe. |
| Manual visual review | Pass | `test-results/capture-inbox-desktop.png` showed readable bounded rows, lifecycle controls, return action and no clipping. `test-results/capture-overlay-mobile.png` showed a compact labelled modal, visible optional target and return controls, and no horizontal overflow. CSS spacing was tightened and the post-change component/browser checks passed. |
| `npm run db:validate` | Pass | Prisma accepted the complete nine-migration schema. |
| `npm run db:rollback:capture` | Pass | `S8-DB-002`: zero Capture tables remained; both S7 context tables and one sampled prose row were preserved byte-equivalently. |
| `npm run db:deploy` after rollback | Pass | All nine migrations were discovered; `20260816193000_zero_friction_capture` reapplied successfully. |
| `npm run db:verify:capture` | Pass | Create replay, one private Inbox record, context-coordinate round trip, cross-workspace rejection, attachment replay, conversion replay, active Capture endpoint, four revisions and content-free outbox all proved true. |
| Content/correction push/ref | Pass | Foundational content matched `5bfb6397d457465fae31042aa327e137fa2dd7fe`; effective corrected product matched `3ef1b5641da38220559dd99e20074f03c2762a3a`. |
| GitHub Actions | Pass | Foundational run `31959800484`/job `95195930611` passed in 2m31s; correction run `31960693578`/job `95198113567` passed in 2m39s. The actions Node-deprecation annotation is upstream metadata, not a repository failure. |

### 13.10 Side-by-side S8, Phase 3, doctrine, and dependency audit

| Requirement | Actual evidence | Classification | Action |
| --- | --- | --- | --- |
| Global shortcut, tiny overlay, raw save first and exact restoration | Overlay on chapter/project/structure; IndexedDB precedes close/network; editor and Project Home equality/focus browser proofs | Verified | None. |
| Automatic route/chapter/outline/block/selection/entity/time/project/user coordinates | Route/project/time are captured locally, user comes from the authenticated server actor, editor derives chapter/block/selection, Structure derives active Chapter/Chapter Outline, and bounded entity context round-trips; Project Home correctly omits nonexistent manuscript coordinates | Verified | Entity-context discovery becomes richer when S9 supplies canonical entities; the S8 contract and transport are active now. |
| Offline queue and idempotent sync | IndexedDB cap/order/retry/replay tests; API unique user/client identity; disconnected browser replay | Verified | None. |
| All lifecycle states, retention, keyboard/bulk triage, attach/detach | Schema/service/Inbox/database/component/browser proofs | Verified | None. |
| Convert while retaining source and provenance | Typed conversion rows, revisions, source FK, replay key, DB and E2E provenance proof | Verified | None. |
| Exact active conversion targets, later targets dormant | Registry assertions and dependency-unavailable results | Verified | S9 registers Entity; S11 registers Note/Timeline. |
| Capture-derived endpoint activates only after canonical source | Adapter queries persisted conversion; endpoint/database/causal E2E proofs | Verified | Entity State/Timeline Event remain reserved. |
| Optional Because/Consequences semantics without prose inference | Explicit directional actions only; no relation on identity conversion alone; causal E2E | Verified | None. |
| Capture context provider only; universal Search absent | Context registry/provider now includes Capture; no SearchDocument/index/palette change | Verified | Full search remains S10. |
| Privacy, bounds, errors and writing independence | Ownership tests, content-safe logger/outbox, caps/retry, failure UI and IndexedDB-unavailable regression | Verified | None. |
| Common writing action requires no route transition | Editor/project/structure global mount and unchanged history/focus assertions | Verified | Inbox is intentional deep navigation, not common quick capture. |
| Universe/Search/Language/Timeline/Notes/Research and Phase 3 macro exit | No such source domain/provider activated in S8 | Planned-later | Mandatory S9–S11 sequence; not an S8 gap. |

Doctrine result: Capture remains optional and author-owned; leaving it unprocessed is permanent valid state. Attachment does not imply structure ownership or causality. Conversion is explicit and provenance-preserving. No automatic prose parsing, AI, hierarchy invention, manuscript rewrite, chronology inference, billing, quota or Phase 4 worker was introduced. PostgreSQL is canonical after acknowledgement; IndexedDB is a bounded offline command queue, not a competing server truth. Timeline/Entity State remain inactive. All S8 reads and mutations are scoped and bounded. Semantic Zoom, Relevant Now causal collections and the $15 Core/$25 future Intelligence pricing ruling are untouched.

### 13.11 Gaps found, repairs applied, and current gate state

- **Global-surface gap:** the first implementation mounted the shortcut only in the editor. Project Home and Structure mounts plus a non-editor focus snapshot were added; component and Project Home E2E now prove no invented chapter/selection coordinates.
- **Unhandled IndexedDB gap:** the first final coverage run passed 170 assertions but failed the run because three Structure tests observed unhandled `indexedDB is not defined` rejections. The overlay now checks availability, catches replay-infrastructure rejection, logs content-safe `S8-UI-005/006`, and leaves the writing surface operational. The repaired run passed 171/171 with zero unhandled errors.
- **Logger-field gap:** the production logger rejected metadata keys containing the protected substring `capture`, correctly exposing that nominally safe field names violated the existing content policy. Service metadata uses neutral source/client-operation names and a production logger regression proves compatibility.
- **Optional-conversion recovery gap:** initially, a failed optional conversion could requeue a raw Capture already acknowledged by the server. The client now tracks raw acknowledgement and reports only the optional-action failure without duplicate raw replay.
- **Coordinate completeness gap:** `outlineId` was persisted by the domain/API but omitted from the direct overlay request, Structure did not pass its active Chapter/Chapter Outline anchor, and `entityContext` was stored but omitted from the read model. Correction `3ef1b5641da38220559dd99e20074f03c2762a3a` closed all three, added component and PostgreSQL round-trip assertions, and passed CI `31960693578`.
- **Long-run infrastructure observation:** the first temporary Prisma development database ended during a long browser run. A fresh named database on TCP 51229 completed the full nine-migration cycle and all final database/browser proofs. No failed database step was reclassified as pass.
- **No remaining in-scope gap:** every S8 audit row is `Verified`. S9–S11 work is explicitly `Planned-later` and remains inactive by dependency design.
- **Current state:** product implementation, local checks, content push/ref and content CI are complete. Formal Passed status awaits only the separate evidence commit/push/CI/reconciliation recorded next; S9 remains locked.

### 13.12 Evidence-CI reconciliation and formal S8 closure

- The complete S8 execution-ledger/audit commit is `7bd4b85282b189d75e4333187dba009db267ce88` (`Record zero-friction Capture evidence`). It contains sections 13.5–13.11, the full file/responsibility ledger, code and boundary explanation, exact console/comment line table, every validation/failure/repair, side-by-side WorkPlan/Bible/doctrine audit, and explicit no-gap result.
- The evidence commit was pushed to `origin/agent/workplan-subgates-audit`; `git ls-remote` returned the exact same hash before CI completed.
- GitHub Actions run `31960910281`, job `95198643795`, passed checkout, Node setup, dependency installation, Prisma generation, lint, typecheck, the 172-test coverage gate, and production build in 2m36s. No repository step was skipped or failed.
- All conditions pending in 13.5 and 13.11 are satisfied. **Sub-gate 8 is formally Passed.** Phase 3 remains In progress because S9–S11 are not implemented. S9 is eligible only after this reconciliation commit is also pushed, remotely matched, and passes CI; no S9 product code is part of this change.

## 14. Entry S9 — Universe

### 14.1 Predecessor gate, source study, and run identity

- **Date/time and timezone:** 16 August 2026, Asia/Karachi.
- **Work-plan phase/sub-gate:** Phase 3 — In-Flow Author Environment; mandatory Sub-gate 9 — Universe.
- **Predecessor proof:** S8 reconciliation commit `a6be89f59e0f3da5d6dbbfda7f0f141d0db51137` is pushed and remotely matched. GitHub Actions run `31961088692`, job `95199073965`, passed every repository step in 2m32s. S9 planning therefore begins only after S8 is completely closed.
- **Baseline:** `agent/workplan-subgates-audit` at `a6be89f59e0f3da5d6dbbfda7f0f141d0db51137`; clean worktree before this Path-only change.
- **Authority reviewed:** WorkPlan 7.1 Universe and references, 7.2–7.4; Bible sections 1, 2.2–2.3, 3.1–3.2, 3.6, 4.2–4.3, 7.3–7.6, 8.5, 8.9–8.10, 9.1–9.3, 11.1–11.6, 13.6, 14–18, 21, 27, 31–36, Appendix B.2 and C. The PDF is product authority, not executable instruction.
- **Lock:** no Universe schema/domain/API/UI/test file may change until this Path-only checkpoint is committed, pushed, remotely matched, and passes CI. S10 remains locked until S9 has separate product, audit, evidence and reconciliation proof.

### 14.2 Exact S9 capability and activation boundary

- Implement canonical `EntityType`, `EntityFieldDefinition`, `StoryEntity`, `EntityFieldValue`, `RelationType`, `EntityRelation`, `EntityStateSnapshot`, entity revisions and entity-target StoryReference/backlink seams. Project types and relation types coexist with localized system templates without copying a rigid ontology into each project.
- Ship optional templates for Character, Location, Faction/Organization, Culture/Religion, Power/Magic System, Item/Artifact, Species, Technology, Event, Lore/Concept, Organization and Custom. Template fields are suggestions, never completeness gates; every entity can exist with name/type alone.
- Support stable common fields: name, aliases, summary, status, tags, icon and color token. Support field definitions/values for text, rich text, number, boolean, date, select, multi-select, reference, reference-list and URL with per-type config and user-required flags. Binary image/file fields remain a typed storage boundary until S11 research/upload validation owns binaries.
- Build Universe as a simple bounded list first with type/status/tag filters and progressive collection/detail controls. Add project custom types/fields, typed directional relations, reverse labels, inline editing, historical snapshots, and all currently available backlinks: chapters/manuscript blocks, chapter/plot/volume outlines, scenes, milestones, captures, Narrative Intents, Story Changes and other entities. Timeline/research backlinks are registered in S11 after those canonical sources exist.
- Implement selection-to-entity quick create inside the writing flow. It asks only for type and optional one-line note, retains the author's visible prose byte-for-byte, applies an invisible entity StoryReference mark/backlink, and restores exact selection/focus/scroll. Renaming an entity never rewrites aliases or visible prose.
- Store state history as immutable `EntityStateSnapshot` records anchored optionally to canonical Chapter, Volume, Milestone or a temporary unanchored/order position. Never overwrite current entity fields to simulate narrative history. State snapshots can become explicit `ENTITY_STATE` causal endpoints.
- Register the S9 Entity context descriptor/provider and Peek renderer only after canonical entity persistence exists. Add Entity Capture conversion only after entity ownership/revision/provenance seams exist. Activate the `ENTITY_STATE` causal adapter only after canonical snapshot persistence exists. S10 Search and S11 Timeline/Research/Note providers remain inactive.
- Keep hierarchy, semantic reference, state history and causality distinct: an entity relation/backlink is not a causal relation; a snapshot does not imply a transition cause; co-occurrence never creates causality.

### 14.3 Planned production order and files

1. Define localized system-template catalogs, field/value validation, typed relation/state/backlink read models and registry boundaries in `domains/universe/domain/*`; define repository/application ports before persistence or UI.
2. Add the S9 forward and rollback migration plus Prisma models, constraints and indexes. Include project/type keys, field ordering, value uniqueness, relation idempotency, no-self relation check, snapshot ordering/anchor constraints, revisions, project ownership and deletion policy.
3. Implement `PrismaUniverseRepository`, `UniverseService`, runtime and authenticated envelope transport. Use repeatable/bounded reads, optimistic entity/project versions, complete prior revisions, redacted outbox events, same-project target validation and canonical template localization.
4. Add project Universe list/create/type/field/relation endpoints, entity detail/update/reference/snapshot endpoints and a selection quick-create endpoint. All lists use cursor/caps; mutations validate type-specific values and structural versions.
5. Build `UniverseWorkspace`, entity list/filter, minimal quick create, detail/field renderer, relation editor, backlink groups and historical-state UI. Add Return-to-Chapter and reuse the shared focus-preserving overlay for manuscript selection creation/Peek.
6. Extend the Tiptap StoryReference mark/action so the selected visible text is unchanged and an invisible entity reference points to the created StoryEntity. Add `@`-ready autocomplete/provider seam without making autocomplete or entity completion mandatory.
7. Register Entity context cards, Capture conversion to Entity, and `ENTITY_STATE` causality only after their canonical rows and ownership checks exist. Extend S8 Capture context metadata validation so referenced entity IDs must exist in the same project.
8. Add real PostgreSQL apply/constraints/ownership/backlink/state/endpoint/conversion/rollback/reapply proof; unit/service/component/stress/accessibility/E2E/mobile tests; manually review visual artifacts; run full lint/type/coverage/build and browser regression.
9. Record every S9 trace with an adjacent identifying comment and final immutable line numbers. Perform exact WorkPlan/Bible/acceptance/doctrine side-by-side audit, repair every in-scope gap, then commit/push product, evidence and reconciliation separately with remote CI after each.

### 14.4 Planned invariants, budgets, security, and exclusions

- **Minimum valid entity:** type plus trimmed name; aliases/note/summary/tags/icon/color/custom fields/relations/states are optional. `requiredByUser` affects author-configured validation only after explicit enablement and never blocks unrelated writing.
- **Template locality:** system definitions are immutable localized resources with stable keys/schema versions. Project custom definitions are project-owned. Presentation labels can localize; canonical keys and stored authored values do not silently change with locale.
- **Field correctness:** one value per entity/definition; value kind must match definition; reference targets are active same-project entities; select values must exist in configuration; URL must validate; rich text uses a versioned bounded document; binary values return dependency-unavailable until S11.
- **Relations:** directional edge uniqueness includes from/to/type; reverse label is presentation, not a second canonical edge; self-edges rejected; nondirectional display does not duplicate truth; archive preserves history/backlinks.
- **State history:** snapshots are immutable historical facts with source version, state JSON, optional note and explicit anchor/order. Current entity edits never rewrite past snapshots. Causal endpoint archive state follows snapshot/entity lifecycle without deleting relations silently.
- **Backlinks:** derive only from explicit StoryReference/domain link/relation/capture-context records available through S9; group by source type, keep source IDs/block anchors/provenance, return counts/cursors and cap each group. No name matching or prose scanning invents references.
- **Selection quick create:** selected text supplies the entity name but is never logged or auto-rewritten. One confirmed editor transaction adds only an invisible reference mark; failure leaves document/selection intact; Escape/Return restores exact route/focus/selection/scroll.
- **Bounds:** name 240; aliases 100; tags 100; custom fields per type 100; values per entity 100; entity relations 500; snapshots 1,000 per entity; Universe page default 50/hard 100; backlinks default 25/hard 100 per group; quick-create note 1,000; stress fixtures at least 25,000 entities/50,000 relations without unbounded rendering.
- **Privacy/security:** every author value, custom schema, relation, state and backlink read/write is workspace/project scoped. Logs/outbox exclude entity name, aliases, summary, custom values, notes, selected prose and state JSON. Safe metadata is limited to IDs, stable system keys, types, counts, versions, bounds, outcome/error codes and durations.
- **Writing independence:** Universe, quick-create, backlink, context, conversion or causality failure cannot block Tiptap, journaling, autosave, recovery, checkpoint or continuation. No Universe screen outranks Continue Writing.
- **Explicit exclusions:** universal Search/SearchDocument/palette object search and language tools remain S10; Timeline/Research/Notes/storage binaries and their backlinks/providers/conversions remain S11; propagation workers remain S12; project snapshots/export remain S13; AI extraction/inference, prose rewrite, entity completeness pressure, V1 world hierarchy and billing are prohibited.
- **Pre-code state:** this checkpoint changes `Path.md` only. S9 product implementation remains locked pending distinct remote proof.

### 14.5 Checkpoint proof and implementation chronology

- The Path-only checkpoint was committed as `b3f3e3a9176b501376bd5aef78bb26af054f8d8a`, pushed to `origin/agent/workplan-subgates-audit`, and matched by `git ls-remote` before product changes began. GitHub Actions run `31961374522`, job `95199759613`, passed dependency installation, Prisma generation, lint, typecheck, coverage, and production build. This removed the S9 product-code lock without affecting S10.
- Implementation followed the order in 14.3: contracts/templates/bounds; migration and rollback; repository/service/transport; routes; list/detail/selection UI; Context/Capture/causal registrations; tests and database verification; visual/manual review; full regression and audit.
- The first implementation pass exposed four correctable gaps: first-load catalog transactions raced when page list/catalog calls ran concurrently; system-template upserts repeated in normal entity mutations; component coverage fell below the global branch threshold; and the old S6 browser expectation still classified `ENTITY_STATE` as dormant. The page now initializes the catalog before list retrieval, normal mutations validate existing type IDs without reseeding, behavior tests cover typed/degraded UI branches, and S6 regression evidence now expects Timeline to remain unavailable while an unknown active Entity State returns `NOT_FOUND`.
- A detached Prisma development database twice ended during long browser verification. No failed run was counted as product evidence. A foreground isolated database at TCP 51237 completed clean ten-migration apply, S9 verify, rollback, S9 reapply, reverify, focused browser, and full browser regression runs.

### 14.6 Files and responsibility ledger

| Area/files | Action and implemented behavior | WorkPlan/Bible ownership |
| --- | --- | --- |
| `prisma/schema.prisma`; `prisma/migrations/20260816223000_universe/{migration.sql,rollback.sql}` | Added `EntityType`, `EntityFieldDefinition`, `StoryEntity`, `EntityFieldValue`, `RelationType`, `EntityRelation`, `EntityStateSnapshot`, and `EntityRevision`; project/user relations, enums, unique keys, check constraints, ownership indexes, reference/state ordering, revision/history and reversible Capture conversion-type expansion. Rollback removes S9-owned cross-domain rows before tables/types and restores the S8 enum without changing sampled Chapter/Capture bytes. | WorkPlan 7.1 Universe truth and 7.2 persistence; Bible 11, 17, 35. |
| `domains/universe/domain/{templates,types,collection}.ts` | Defines the thirteen optional localized system templates, seven relation templates, minimal/common fields, ten active typed-field kinds, reserved IMAGE/FILE kinds, Zod mutation/list contracts, immutable anchor rules, hard list/detail caps, and a 25,000-entity bounded projection utility. | WorkPlan 7.1/14.2/14.4; Bible 11.1–11.6, 26. |
| `domains/universe/application/{ports,service,autocomplete}.ts` | Defines canonical repository/read-model contracts, every versioned S9 use case, content-safe trace metadata, and a capped replaceable entity-autocomplete provider seam without activating S10 universal Search. | WorkPlan 7.3 steps 1–2 and S9 `@` seam; Bible 15–16, 18, 21 future boundary. |
| `domains/universe/infrastructure/prisma-universe-repository.ts` | Implements workspace/project guards, catalog localization, cursor/capped reads, type-specific validation, same-project references, optimistic project/entity versions, complete prior revisions, minimal/quick creation, invisible StoryReference backlinks, custom types/relation types, idempotent relations, immutable states, per-source backlink counts/pages, redacted outbox events and repeatable-read catalog/detail transactions. | WorkPlan 7.1 Universe/references and 7.3; Bible 11, 16–18, 35. |
| `lib/universe/{runtime,http}.ts`; `app/api/v2/projects/[id]/universe/**/route.ts` | Wires one authenticated service/repository boundary and stable envelopes for catalog/list/create, custom entity/relation types, quick create, entity detail/update, relation create and state create. Request bodies and authored values are excluded from transport logs. | WorkPlan 7.2 routes and 14.3 step 4; Bible 18, 24, 36. |
| `components/universe/{UniverseWorkspace,EntityDetail,EntityQuickCreate}.tsx`; `app/app/projects/[id]/universe/**/page.tsx`; project-home/editor/CSS changes | Adds optional bounded Universe entry/list/filter/minimal create; project custom type creation; entity common/custom inline editing; directional/reverse relation editor; immutable history and backlink groups; Return links; mobile layout; selection-to-entity overlay using the shared focus-preserving controller and a StoryReference mark that preserves visible prose. | WorkPlan 7.1/7.2/7.3 steps 4, 6, 8; Bible 4, 8.5, 8.9–8.10, 9, 11, 14–15, 34. |
| Capture changes in `domains/capture/*` and `components/capture/CaptureInbox.tsx` | Activates `ENTITY` as an idempotent conversion target with required `entityTypeId`, same-project type/entity validation, provenance retained in `CaptureConversion`, inbox type selection, and entity conversion action. Existing S8 targets/lifecycle remain unchanged. | WorkPlan 7.1 S9 activation boundary; Bible 6, 11.6, 18. |
| Causality changes in `domains/causality/*` | Moves `ENTITY_STATE` from reserved to active endpoint types and resolves owned, non-archived snapshots through the canonical adapter. `TIMELINE_EVENT` remains dependency-unavailable until S11; an entity snapshot never implies a causal edge. | WorkPlan 7.1 S9 activation boundary and Phase 2 dependency ruling; Bible 7.7, 11.5–11.6, Appendix E. |
| Context changes in `domains/context/*` and `components/context/ContextCards.tsx` | Registers typed Entity cards only after S9 persistence, resolves explicit entity references/pins into bounded context sources, and renders Entity Peek metadata. Existing precedence/contextKey/directive semantics remain unchanged. | WorkPlan 7.1 descriptor staging; Bible 4 and Appendix A. |
| `docs/adr/0010-universe-and-entity-state.md`, `docs/architecture/universe.md`, `docs/api/universe.md`, `docs/operations/migrations.md` | Records canonical truth/optionality, hierarchy-reference-state-causality separation, contracts/bounds, binary deferral to S11 and reviewed migration recovery. | WorkPlan 7.2 and global documentation contract; Bible 11, 16–18, 27, 32. |
| `scripts/verify-universe-db.ts`; S9 unit/service/component/stress/accessibility/E2E tests; adjusted prior-domain regression fixtures | Proves templates, ownership, typed data, same-project references, relation replay, backlinks, revisions, redaction, Entity Capture conversion, Entity State adapter, rollback boundary, focus/prose preservation, mobile/a11y, 25k/50k bounds and prior-gate compatibility. Legacy E2E fixtures now wait for completed sign-in navigation, removing a pre-existing authentication race. | WorkPlan 7.2 test list, 7.4 exit, global acceptance; Bible 31, 33, 35–36. |

Generated `next-env.d.ts` changed only because Next.js 16 regenerated its current type imports during required development/build execution; it is retained under the repository's generated Next.js guidance. `package.json` adds only the S9 database verify/rollback commands.

### 14.7 Implemented code, state ownership, and failure behavior

- **Canonical truth and minimal validity:** PostgreSQL owns entity types, entities, field values, entity relations, StoryReferences, revisions and historical states. The minimum valid entity is one active same-project/system type plus a trimmed name. Templates/custom fields/relations/history are optional and never gate editor access.
- **Localized flexible schema:** system types use stable `systemKey`, locale `en`, schema version and authored-neutral template labels; project types use project-scoped stable keys. Common fields stay columns; extensible fields use ordered definitions plus one JSON value row per entity/definition. Validation rejects kind/config/reference mismatches transactionally.
- **History and optimistic writes:** every entity update checks entity and project structural versions, writes a complete prior `EntityRevision`, replaces validated custom values in the same transaction, increments versions and emits content-free outbox metadata. State snapshots are append-only rows with explicit anchor/order and source entity version; current fields are never rewritten to simulate history.
- **References/backlinks:** quick create persists the entity and one manuscript-block `StoryReference` atomically, then the client applies only a `storyReference` mark to the existing selection. Detail queries explicit reference groups independently with returned/total/next-cursor evidence and includes Capture entity-context backlinks. No prose/name scan invents links.
- **Relations and causality:** `EntityRelation` is one canonical typed edge with reverse label presentation; same-project targets, no-self checks and idempotency uniqueness apply. `ENTITY_STATE` resolution reads a snapshot; causal relation creation remains an explicit separate action. Timeline remains reserved.
- **Client/server separation:** server components seed bounded catalog/detail/list models; client components own only form/filter/message/version state. No client cache becomes canonical. A failed optional entity/context/Capture/causal request reports a bounded error and leaves the editor, journal, autosave, checkpoint, visible prose and navigation intact.
- **Privacy/security:** all repository entry points scope workspace/project ownership. Authenticated route handlers return safe envelopes. Entity names, aliases, summaries, labels, notes, selected prose, custom values and state JSON are absent from operational logs/outbox payloads; tests inspect logged metadata and database outbox bytes.
- **Accessibility/responsiveness:** semantic headings/forms/lists/status regions, named controls, keyboard-native details/selects, focus restoration, desktop and mobile layouts, axe serious/critical scans and visual screenshots are verified. The selected manuscript text remains byte-identical and editor focus returns after quick create.
- **Performance:** Universe pages cap at 100, default 50; definitions/values cap at 100; detail relations at 500; snapshots at 1,000; each backlink group at 100. The stress fixture reduces 25,000 entities/50,000 relations to these budgets under the asserted two-second local processing ceiling. No whole-project UI render or graph walk was introduced.
- **Degraded boundary:** IMAGE/FILE fields are visible as disabled dependency boundaries until S11 owns private storage/upload validation. Entity autocomplete has only a bounded provider interface. S10 Search/Language and S11 Timeline/Note/Research remain absent.

### 14.8 Console/comment evidence with final line numbers

Every S9 operational trace site has the requested adjacent identifying comment. Server calls flow through the existing guarded structured logger to its single literal console transport; UI/verifier sites use direct JSON `console.log` with identifiers/counts/versions only.

| Step | Identifying comment line | Call line | Purpose and content boundary |
| --- | --- | --- | --- |
| `S9-UNIVERSE-001` | `domains/universe/application/service.ts:22` | logger call `:23` | Catalog type/relation counts; no labels or values. |
| `S9-UNIVERSE-002` | `domains/universe/application/service.ts:41` | logger call `:42` | Page filters/count/more flag. |
| `S9-UNIVERSE-003` | `domains/universe/application/service.ts:62` | logger call `:63` | Entity/type IDs, value count and structural version. |
| `S9-UNIVERSE-004` | `domains/universe/application/service.ts:83` | logger call `:84` | Quick-create IDs, selected length and version; no selected text/note/name. |
| `S9-UNIVERSE-005` | `domains/universe/application/service.ts:105` | logger call `:106` | Detail relation/state/backlink counts. |
| `S9-UNIVERSE-006` | `domains/universe/application/service.ts:133` | logger call `:134` | Entity/version identity only. |
| `S9-UNIVERSE-007` | `domains/universe/application/service.ts:153` | logger call `:154` | Custom type ID/field count/version; no authored labels. |
| `S9-UNIVERSE-010` | `domains/universe/application/service.ts:177` | logger call `:178` | Custom relation-type ID/direction/version. |
| `S9-UNIVERSE-008` | `domains/universe/application/service.ts:201` | logger call `:202` | Explicit edge endpoint/replay/version metadata. |
| `S9-UNIVERSE-009` | `domains/universe/application/service.ts:228` | logger call `:229` | Snapshot/entity IDs, anchor kind/order/version; no state/note. |
| `S9-API-001` | `lib/universe/http.ts:19` | logger call `:20` | Successful route/method/status and actor/request IDs. |
| `S9-API-002` | `lib/universe/http.ts:34` | logger call `:35` | Stable failure code/status/cause class; no body. |
| `S9-UI-001` | `components/universe/UniverseWorkspace.tsx:77` | literal `console.log` `:78` | Entity ID/project/version after minimal create. |
| `S9-UI-005` | `components/universe/UniverseWorkspace.tsx:120` | literal `console.log` `:121` | Type ID/project/version after custom type create. |
| `S9-UI-004` | `components/universe/EntityDetail.tsx:88` | literal `console.log` `:89` | Entity/project/entity+structure versions after inline update. |
| `S9-UI-002` | `components/universe/EntityDetail.tsx:183` | literal `console.log` `:184` | Entity/snapshot IDs and version; excludes state JSON. |
| `S9-UI-003` | `components/universe/EntityQuickCreate.tsx:124` | literal `console.log` `:125` | Chapter/entity/reference IDs, selection length and version; excludes prose. |
| `S9-DB-001` | `scripts/verify-universe-db.ts:201` | literal `console.log` `:202` | Database invariant counts/booleans and generated IDs. |
| `S9-DB-002` | `scripts/verify-universe-db.ts:274` | literal `console.log` `:275` | Rollback table/enum/preserved-row evidence. |

### 14.9 Validation, stress, visual, migration, and regression evidence

| Check | Result | Exact evidence |
| --- | --- | --- |
| Prisma generation/format/validation | Pass | Prisma 7.9.1 client generated; `prisma format` and `prisma validate` accepted the complete schema. |
| Static quality | Pass | Final `npm run lint` completed with zero warnings/errors; final strict `npm run typecheck` passed. |
| Full coverage gate | Pass | `npm run test:coverage`: 52 files, 189 tests; 88.90% statements, 75.58% branches, 84.19% functions, 94.25% lines; all configured thresholds passed. |
| Stress/load | Pass | `npm run test:stress`: 8 files/15 tests, including 25,000 Universe entities and 50,000 relations reduced to hard viewport/detail budgets in under the asserted 2,000ms. |
| Accessibility | Pass | `npm run test:a11y`: 2 files/2 tests; no serious or critical axe result for Context/Universe views. |
| Production build | Pass | CI-shaped OIDC environment `npm run build` compiled, typechecked, generated 10 static pages and emitted all Universe API/application routes under Next.js 16.3.0. |
| Focused S9 E2E | Pass | 3 applicable passes/3 intentional cross-device skips: desktop entity/relation/state/a11y/visual, selection quick-create/prose/focus, and mobile collection/create/visual. |
| Full browser regression | Pass | Final `npm run test:e2e`: 46 applicable passes, 42 intentional project/device skips, zero failures in 4.1m. Covers Sub-gates 0–9 across desktop/mobile. |
| Visual review | Pass | Manually inspected `test-results/universe-detail-desktop.png` and `test-results/universe-mobile.png`: bounded forms/cards, readable hierarchy, Return action and mobile bottom navigation render without clipping or overlap. |
| Database apply/behavior | Pass | Fresh isolated PostgreSQL applied all ten migrations. `db:verify:universe` proved 13 system types, relation replay, active Entity State resolver, explicit backlink, cross-workspace denial, Entity Capture conversion, revision creation, content-free outbox and four enforced constraint groups. |
| Rollback/reapply | Pass | `db:rollback:universe` emitted `S9-DB-002`: zero Universe tables, Capture enum restored, one sampled prose row and one sampled Capture row byte-preserved. `prisma migrate deploy` reapplied only S9 and a second verifier run passed all invariants. |
| Diff/format | Pass | Pre-commit `git diff --check` passed after formatting; generated/build/test artifacts and external PDF are excluded from the intended product commit. |

The jsdom axe run prints the library's known `HTMLCanvasElement.getContext` not-implemented diagnostic; both accessibility tests and all assertions pass, and no application canvas path is involved.

### 14.10 Side-by-side WorkPlan/Bible/acceptance audit

| Requirement | Actual evidence | Classification | Audit decision |
| --- | --- | --- | --- |
| Flexible EntityType/field/value/relation/state/revision truth | S9 migration/schema, domain contracts, repository transactions and DB verifier | Verified | Exact S9 owner; no rigid per-project ontology. |
| All named optional templates | Thirteen stable template keys asserted in unit and database tests | Verified | Faction/Organization and Culture/Religion presentation coexist with separately named Organization/Religion resources without forcing use. |
| Ten active field kinds; binary boundary | Domain types/validator/editor cover text, rich text, number, boolean, date, select, multi-select, reference/list, URL; IMAGE/FILE disabled | Verified | S11 owns binaries exactly as planned. |
| Minimal creation and zero setup | Workspace form requires only type/name; empty state explicitly preserves writing | Verified | No completeness gate. |
| Selection quick create, invisible backlink, unchanged prose/focus | Atomic repository create/reference plus Tiptap mark and E2E byte/focus assertions | Verified | Optional note supported; visible text unchanged. |
| Full detail/custom fields/relations/reverse labels/backlinks/history | EntityDetail, repository detail groups/pages and component/E2E/DB tests | Verified | Historical states append; no overwrite simulation. |
| Entity Context provider/Peek | Descriptor registration, resolver repository, card rendering and context regression tests | Verified | Activated after canonical entity persistence. |
| Entity Capture conversion | Typed registry/Inbox/repository and database verifier | Verified | Explicit/idempotent/provenance-retaining. |
| `ENTITY_STATE` causal adapter | Active type registry/Prisma adapter/database and browser regression | Verified | Unknown IDs return `NOT_FOUND`; Timeline stays unavailable. |
| Ownership/privacy/redaction | Guards, safe transport, revisions/outbox/log tests and cross-workspace DB proof | Verified | No authored content in S9 logs/outbox. |
| Bounded scale | Query `take` caps, backlink group pages and 25k/50k stress fixture | Verified | No unbounded project render/query. |
| Accessibility/mobile/visual/focus | axe, desktop/mobile Playwright, screenshots, semantic components | Verified | Exact focus restoration for common editor action. |
| Search/Language | No SearchDocument, full-search UI or language provider | Planned-later | Correct S10 dependency, not an S9 gap. |
| Timeline/Notes/Research/binary storage | Only reserved seams/disabled fields; no canonical S11 domain | Planned-later | Correct S11 dependency, not an S9 gap. |
| Propagation/export/billing/AI | No S12–S17 capability activated | Planned-later | Correct phase locks. |

Global acceptance/doctrine answers:

- Universe setup, fields, states, relations, backlinks, Capture conversion and causality remain optional; the editor and Continue Writing are never gated.
- No entity, milestone or relation became a hierarchy owner. Hierarchy, semantic reference, entity state, chronology and causality remain separate canonical dimensions.
- No relation/reference/state/co-occurrence creates causality implicitly, and no S9 write edits visible prose.
- PostgreSQL remains canonical; component state/read models are bounded views. Structural versions prevent an apparently successful stale write.
- No quota, downgrade, billing, AI, proposal or later provider was added.
- Logs, outbox events, errors and tests do not emit entity names, author notes, selected prose, custom values or state JSON as operational metadata.
- Every list/detail/backlink/autocomplete path is capped; the stress test proves reduction before rendering.
- `becauseItems[]`/`consequenceItems[]`, the outline-aware Semantic Zoom order and USD 15 Core/future USD 25 Intelligence ruling remain unchanged.
- S10 has not started. Timeline is the only remaining causal endpoint dependency-unavailable at the end of S9; Entity State is active only because its source domain is now canonical and verified.

### 14.11 Gaps, deviations, repairs, and gate decision

- **First-load transaction race:** concurrent server-component catalog/list calls both seeded the global catalog and produced 404 fallback during browser verification. Catalog initialization is now explicitly ordered before list retrieval; normal list/create/quick-create operations no longer repeat global upserts. Fresh-database desktop/mobile E2E passes.
- **Coverage gap:** the first complete run passed 186 assertions but branch coverage was 73.11% versus the immutable 75% threshold. Typed-field, binary-boundary, common/field mutation, degraded error and custom-type behavior tests raised branch coverage to 75.58% without changing thresholds or excluding S9 files.
- **Regression expectation gap:** the old S6 browser case expected both Timeline and Entity State to remain dependency-unavailable. S9 correctly activates Entity State, so the test now distinguishes reserved Timeline `503 DEPENDENCY_UNAVAILABLE` from active-but-unknown Entity State `404 NOT_FOUND`; focused and full regression pass.
- **Authentication fixture race:** legacy E2E helpers evaluated fixture APIs before the development sign-in redirect was guaranteed committed. All browser fixtures now wait for `/app`, preserving behavior while removing nondeterminism.
- **Verification infrastructure:** detached disposable database processes stopped during long runs. A foreground isolated process completed the accepted evidence. Failed/incomplete runs remain failures in this chronology and are not represented as passes.
- **No remaining compliance gap:** every S9-owned WorkPlan item and applicable acceptance/doctrine item is `Verified`. All later work is legally `Planned-later` with its canonical source absent. No WorkPlan correction is required.
- **Gate decision:** local implementation and audit **PASS with no open in-scope gap**. Formal Sub-gate 9 `Passed` status awaits product commit/push/remote match, product CI, evidence commit/push/CI and reconciliation. S10 remains locked.

### 14.12 Git product proof and pending evidence reconciliation

- **Branch/remote:** `agent/workplan-subgates-audit` / `https://github.com/InfernusReal/Mythra-V2.git`.
- **Plan proof:** `b3f3e3a9176b501376bd5aef78bb26af054f8d8a`; GitHub Actions `31961374522`/`95199759613` passed.
- **Product commit:** `e5131463791a5c20d005ae485f652922c8133876` (`Implement Universe capability`) contains all S9 application/domain/migration/docs/tests and the cross-domain activation/regression changes enumerated above. `Path.md` was deliberately excluded from that product commit and reserved for this evidence commit.
- **Remote proof:** `git push origin agent/workplan-subgates-audit` advanced the branch from the S9 planning checkpoint to the product commit; `origin/agent/workplan-subgates-audit` matches `e5131463791a5c20d005ae485f652922c8133876`.
- **Independent CI proof:** GitHub Actions run `32046041348`, job `95434077558`, passed in 2m43s. Its checked-out head was the exact product hash. Dependency installation, Prisma generation, lint, typecheck, coverage and production build all passed.
- **Evidence state at this historical checkpoint:** this Path change was intentionally prepared as the evidence-only commit and could not contain its own hash before creation. Its final hash and CI proof are now reconciled in 14.13.
- **Rollback/revert point:** S8 reconciliation `a6be89f59e0f3da5d6dbbfda7f0f141d0db51137`; database rollback is the reviewed S9 `rollback.sql` only while no S10 data exists.

### 14.13 Evidence reconciliation and final S9 decision

- The evidence-only Path commit is `663ec69ea3d4869d43eb7a44de6d805a72ab339b` (`Record Universe implementation evidence`). It changed only `Path.md`, was pushed to `origin/agent/workplan-subgates-audit`, and the remote ref matched before reconciliation.
- GitHub Actions run `32046340519`, job `95435025227`, checked out that exact evidence hash and passed dependency installation, Prisma generation, lint, typecheck, coverage and production build in 2m53s.
- Product commit `e5131463791a5c20d005ae485f652922c8133876` and evidence commit `663ec69ea3d4869d43eb7a44de6d805a72ab339b` therefore have separate remote proof. The reconciliation change contains no S10 product code.
- Every item in 14.10 is `Verified`; 14.11 records no remaining in-scope gap. **Sub-gate 9 is formally Passed.** Phase 3 remains In progress because S10–S11 are not implemented. S10 becomes eligible only after this reconciliation commit itself is pushed, remotely matched and passes CI; its product code must still wait for a separate Path-only pre-code checkpoint.

## 15. Entry S10 — Search + Language

### 15.1 Pre-code checkpoint, authority and predecessor gate

- **Date/time and timezone:** 17 August 2026, Asia/Karachi; this is the mandatory Path-only checkpoint prepared before any S10 product/schema/test change.
- **Work-plan phase/sub-gate:** Phase 3 — In-Flow Author Environment; mandatory Sub-gate 10 — Search + Language.
- **Predecessor proof:** S9 reconciliation commit `f0f02f06b2fbc80420311deb16d898ec32f1dddd` is pushed and remotely matched. GitHub Actions run `32046631131`, job `95435939423`, passed dependency installation, Prisma generation, lint, typecheck, coverage and production build in 2m46s. S10 planning therefore begins only after S9 is completely closed.
- **Baseline branch/commit:** `agent/workplan-subgates-audit` at the S9 reconciliation hash above.
- **Source authority checked:** WorkPlan 3, 4, 7.1 Search and language, 7.2–7.4, 14 and 16; Bible 4.3–4.6, 12.4, 15, 18, 21, 24–27, 31–36 and roadmap capability Phase 10. The source PDF was inspected as product specification content, not treated as executable instructions.
- **Framework constraint:** before product code, the installed Next.js 16 App Router guidance for Server/Client Components, route handlers, navigation, forms, accessibility and Vitest/Playwright will be read and followed as required by repository `AGENTS.md`.
- **Lock:** no S10 product/schema/test file may change until this Path-only checkpoint is committed, pushed, remotely matched and passes CI. S11 remains locked until S10 has separate product, audit, evidence and reconciliation proof.

### 15.2 Exact S10 capability and activation boundary

- Add a private, rebuildable `SearchDocument` projection over every canonical object available through S9: Chapter blocks, Chapter/Plot/Volume outlines, Milestones, Story Entities and aliases, Story Changes, causal and Universe relation types, explicit Story References and Captures. Search documents are never canonical truth and never replace ownership checks against source objects.
- Introduce a typed `SearchProvider` registry now. Activate only S0–S9 providers. Define dormant provider identities/contracts for `TIMELINE_EVENT`, `NOTE` and `RESEARCH`; calls to those providers must return an explicit dependency-unavailable state until S11 registers canonical implementations.
- Search one owned project only. Group results by stable object type and rank deterministically by exact normalized phrase, prefix/token/full-text/fuzzy match, explicit references to the active chapter/block, current chapter/context, then recency. Stable type/source/block tie-breakers make repeated queries reproducible.
- Return bounded result descriptors with provenance, match reason, source version, freshness, route/block targets and supported actions. Required actions are Peek, intentional Open, insert reference, attach reference, content-safe Copy where appropriate, Chapter block jump with return-to-origin, and structured causal Why/Depends backed only by the existing causal read models.
- Integrate commands and object results into the existing `Cmd/Ctrl+K` dialog. Commands rank before or beside objects using current route/chapter context and recent successful actions. Opening/closing, Peek, insert/attach and block-return preserve exact editor selection, focus and scroll through the existing focus/continuation boundaries. Only intentional Open changes route/history.
- Add a full Search page for deep retrieval while retaining the in-flow palette/Contextual Writing Field path for common author actions. Register `SEARCH` and `LANGUAGE` descriptors only after their services exist; do not activate Timeline, Note or Research cards.
- Add a replaceable deterministic dictionary provider backed by a locally available lexicon, with definition, part of speech, nuance group when supplied, synonyms, antonyms and a project/user saved-vocabulary flag. Provider failure degrades only the Language card and never blocks the editor.
- Add `SavedVocabularyTerm` persistence with ownership and normalized uniqueness. Selection creates a Language card and explicit selection actions only; it never sends automatic style corrections, inferred recommendations or synonym-spam prompts.
- Single-click replacement must be one Tiptap transaction so native undo restores the exact original selection. Replacement is never persisted outside the normal durability pipeline and never bypasses explicit character limits. Dismiss/save-vocabulary operations do not mutate prose.
- S11 remains absent: no TimelineEvent, Note, ResearchItem, upload or binary provider is created here. Phase 4 remains absent: S10 uses a synchronous/read-through projection synchronizer with explicit freshness/versioning until the durable outbox worker owns propagation in S12.

### 15.3 Planned files, contracts and implementation method

| Planned area/files | Code to be produced and how it will be implemented | Boundary/evidence intent |
| --- | --- | --- |
| `prisma/schema.prisma`; `prisma/migrations/20260817*_search_language/{migration.sql,rollback.sql}` | Add `SearchDocument` with workspace/project/source/source-key/block/version/freshness/search text/normalized aliases/metadata and PostgreSQL full-text plus trigram-capable indexes; add `SavedVocabularyTerm` with user/project ownership and normalized uniqueness. Forward and rollback SQL will be independently reviewed and byte-preservation tested against S0–S9 rows. | Bible 21.2, 12.4, 17–18, 32; WorkPlan 7.2. |
| `domains/search/domain/*` | Define query validation, active/dormant source types, provider registry, result/action descriptors, normalization, grouping, deterministic score components and stable ordering. No rich editor JSON is parsed per query after projection synchronization. | Bible 21.1–21.3; WorkPlan 7.1 and 7.3 steps 1–2. |
| `domains/search/application/*`; `domains/search/infrastructure/*` | Implement owned-project service/repository ports; bounded read-through synchronization from canonical S0–S9 tables; PostgreSQL FTS/exact/prefix/fuzzy retrieval; explicit-reference/current-context scoring; source revalidation; causal Why/Depends delegation; dormant S11 providers. | Canonical server ownership, projection honesty and future replaceability. |
| `domains/language/domain/*`; `domains/language/application/*`; `domains/language/infrastructure/*` | Implement selection/word validation, dictionary response contracts, replaceable local lexicon adapter, deterministic synonym/antonym/nuance ordering, saved-vocabulary persistence and provider-local failure states. Authored selection text will not be logged. | Bible 4.6 and 12.4; WorkPlan provider/failure rule. |
| `lib/search/{runtime,http}.ts`; `lib/language/{runtime,http}.ts`; `app/api/v2/projects/[id]/{search,language,vocabulary}/**` | Add thin authenticated, ownership-scoped route handlers with stable envelopes/codes, safe rate limits and content-redacted traces. Search query and dictionary selection remain request data, never observability metadata. | Bible 16, 18, 24–27. |
| `components/search/*`; `app/app/projects/[id]/search/page.tsx`; `components/shell/CommandPalette.tsx` | Build accessible grouped palette results and full Search surface; roving/arrow keyboard behavior, explicit action menus, loading/empty/degraded states, Peek/Open semantics, block-jump/return state and responsive layout. Commands and objects share one registry and current-context ranker. | Bible 4.3–4.5, 13–15, 21; no navigation for common writing actions. |
| `components/language/*`; editor/context integration | Build the Selection Language card, definition/part-of-speech/synonym nuance/antonym/saved vocabulary UI, and one-click editor replacement in one Tiptap transaction with focus/selection restoration and normal autosave/undo behavior. | Bible 4.5–4.6, 12.4; exact undo exit gate. |
| Context/causality/reference/continuation integration | Register Search/Language descriptors after source services; use existing StoryReference creation for insert/attach, existing causal neighborhood for Why/Depends, and existing writing-session/block anchors for jump/return. No source-name matching creates references or causality. | WorkPlan 7.1 activation rule and Bible 7, 18, 21.3. |
| `scripts/verify-search-language-db.ts`; S10 unit/service/component/stress/accessibility/E2E tests; docs/ADR/API/architecture/operations | Prove projection completeness/freshness/rebuild, ranking, ownership, provider dormancy, language determinism, undo, focus/scroll/selection, palette keyboard access, mobile/visual behavior, rollback/reapply and prior-gate compatibility. | WorkPlan 7.2–7.4; Bible 31–36. |

### 15.4 Bounds, failure behavior and security rules locked before code

- Query length is 1–160 Unicode characters after normalization. Default page size is 40, hard maximum 100; each group is capped at 20 before explicit More/pagination. Projection synchronization is capped at 25,000 canonical source records per project per run and processes writes in bounded batches; exceeding the cap yields an honest stable limit error rather than partial-complete claims.
- Chapter projections are block-addressable through stable `blockId` source keys so matching results can jump without searching editor JSON at request time. Rich authored bodies may exist inside the private projection, but no query, prose, Capture text, entity text, outline text, definition, synonym or copied text may enter logs, outbox metadata, error envelopes or analytics.
- Fuzzy matching is conservative and deterministic. Empty/stop-word-only queries, archived/dismissed/foreign-workspace sources and stale orphan documents cannot surface as valid results. Every action revalidates the canonical source/project before mutation or navigation.
- Search provider failure produces a typed per-provider degraded state while healthy groups remain usable. Dictionary failure produces an unavailable Language card with retry/dismiss only. Neither failure changes manuscript selection, focus, scroll or durability state.
- Command history stores only allow-listed command/source identities and timestamps, never query or manuscript content. Clipboard copying is user-initiated. Reference insertion/attachment is explicit and idempotent. Why/Depends never infers a causal relation.
- The local dictionary dependency/license and installed Next.js API guidance will be verified before implementation. No unreviewed network dictionary call is permitted in the typing path.

### 15.5 Planned validation and gate decision protocol

1. Format/validate/generate Prisma and apply all migrations to a fresh PostgreSQL database; verify S10 constraints, FTS/fuzzy indexes, ownership, provider catalog and projection content coverage.
2. Run lint, typecheck and immutable global coverage thresholds; add behavioral tests for every new branch rather than reduce thresholds or exclude new source.
3. Stress at least 25,000 mixed documents and repeated exact/prefix/fuzzy/current-context queries; verify bounded deterministic results and record measured timing/memory without inventing a pass threshold after execution.
4. Run component/accessibility tests for keyboard-only palette, focus trapping/restoration, grouped semantics, Language card and degraded states. Run desktop/mobile visual inspection.
5. Run focused S10 E2E for universal domain coverage, Peek/Open, insert/attach/copy, block jump/return, Why/Depends, command ranking, dictionary/synonym/antonym/save, replacement undo and focus preservation; then run the complete browser regression suite.
6. Execute S10 migration rollback/reapply against sampled S0–S9 content and verify byte preservation. Run production build and content-leak/static instrumentation checks.
7. Compare implementation side by side with every S10 row above, Phase 3 scope/exit, global acceptance, Bible coverage matrix, doctrine/anti-goals and all console traces. Repair every `Gap`; later S11/S12 providers alone may remain `Planned-later`.
8. Commit/push S10 product separately, prove remote ref and CI, then commit/push Path evidence separately and prove CI, followed by reconciliation. S11 cannot start before the reconciliation proof passes.

- **Pre-code state:** this checkpoint changes `Path.md` only. S10 product implementation remains locked pending distinct remote proof.

### 15.6 Implementation chronology and repaired findings

- **Implementation run:** 17 August 2026, Asia/Karachi, on `agent/workplan-subgates-audit`; product baseline was the remotely passed pre-code commit `038946827bce1e9b749ad3df3815b40c63027cda` and product result is `2a512b6d1409831f433b56853ddd256428b1b36b` (`Implement Search and Language capability`).
- The schema and migration established a private, rebuildable `SearchDocument` projection and actor/project-owned `SavedVocabularyTerm`; source rows remain canonical. PostgreSQL generated `tsvector`, GIN full-text and trigram indexes support bounded exact, phrase, prefix, token and fuzzy candidates. Read-through synchronization caps a project at 25,000 sources, batches 200 writes and rejects over-limit claims.
- Search activates all canonical S0–S9 types: chapters/manuscript blocks, chapter/plot/volume outlines, milestones, entities and aliases, Story Changes, causal and Universe relation types, Story References and actor-owned non-dismissed Captures. `TIMELINE_EVENT`, `NOTE` and `RESEARCH` remain typed but dependency-unavailable until S11.
- Ranking combines exact normalized phrase, prefix/token/full-text/fuzzy evidence, explicit active-context references, current chapter/context and recency, then stable type/source/block tie-breakers. Results are grouped and bounded, with Peek, intentional Open, insert/attach, safe Copy, block jump/return, and existing-read-model Why/Depends actions.
- The command palette and full Search page preserve selection/focus/scroll through transient interactions. Identity-only recent history contains no query or authored content. Search and Language Context descriptors are registered only after their services exist and never create unsolicited cards.
- Language uses the local `wordpos@2.1.0`/`wordnet-db@3.1.14` lexicon through a replaceable provider. It returns deterministic definitions, parts of speech, nuance groups when available, synonyms, antonyms and examples within fixed caps; it has no typing-path network call. Saved vocabulary uses actor/project ownership and normalized uniqueness. Replacement is one Tiptap `insertContentAt` transaction so native undo restores the original selection.
- Raw Prisma cannot deserialize an unsupported `tsvector` column from `SELECT *`; the repository was corrected to select only supported fields. Four effect-derived React state paths were rewritten as derived/render/input state. The E2E Capture fixture was corrected to use the canonical `/api/v2/captures` route. Next production bundling of WordNet data was fixed with `serverExternalPackages` for `wordpos` and `wordnet-db`. A browser-only assertion of a server trace was replaced by an observable UI trace assertion. The active-context chip contrast was corrected from 4.42:1 to a passing text token. Prior negative provider tests were updated only for newly active Capture/Entity/Search/Language while Timeline/Note/Research remain negative.
- No WorkPlan requirement was weakened. Coverage thresholds, result bounds, security rules, ownership checks and the S11 dependency lock were preserved during every repair.

### 15.7 Complete S10 file and responsibility ledger

| Files/area | Implemented responsibility |
| --- | --- |
| `prisma/schema.prisma`; `prisma/migrations/20260817180000_search_language/{migration.sql,rollback.sql}` | Projection/source enums, saved vocabulary truth, generated search vector, FTS/trigram/ownership indexes, constraints and isolated rollback. |
| `domains/search/domain/{contracts,normalization,ranking,provider-registry}.ts` | Query/result/action/provider contracts, normalization, deterministic scoring/grouping and active-versus-dormant provider state. |
| `domains/search/application/service.ts`; `domains/search/infrastructure/{prisma-search-repository,projection-sources}.ts` | Ownership-scoped orchestration, bounded read-through synchronization, canonical-source revalidation, PostgreSQL retrieval and structured causal action delegation. |
| `domains/language/domain/contracts.ts`; `domains/language/application/service.ts`; `domains/language/infrastructure/{wordpos-dictionary-provider,prisma-vocabulary-repository}.ts` | Selection validation, replaceable dictionary boundary, deterministic local lexical results, degradation and actor/project-owned vocabulary persistence. |
| `lib/search/{runtime,http}.ts`; `lib/language/{runtime,http}.ts`; Search/language/vocabulary routes under `app/api/v2/projects/[id]` | Authenticated runtime composition, stable envelopes, ownership enforcement, rate limits and content-redacted transport logs. |
| `components/search/*`; `app/app/projects/[id]/search/page.tsx`; `components/shell/CommandPalette.tsx` | Responsive full Search, grouped result actions, accessible palette keyboard model, focus trap/restoration, stale-response discard and identity-only recent actions. |
| `components/language/*`; `components/editor/EditorSearchBridge.tsx` | Selection Language card, explicit lookup/save/replace actions, block jump/return coordinates and single-transaction editor replacement. |
| Context, reference and navigation integration files | Explicit transient Search/Language descriptors, active Entity/Capture StoryReference targets, canonical action routing and no name-derived relationship creation. |
| `next.config.ts`; `package.json`; lockfile and WordPOS declaration | Reviewed local dictionary dependency, server-only external packaging and reproducible dependency graph. |
| `docs/adr/0011-search-language.md`; `docs/architecture/search-language.md`; `docs/api/search-language.md`; migration operations docs | Architecture, contract, security/privacy, bounds, degradation, migration and recovery documentation. |
| S10 unit/service/component/stress/accessibility/E2E tests and `scripts/verify-search-language-db.ts` | Coverage of normalization/ranking/providers/ownership/freshness/actions/dormancy/undo/focus/mobile/a11y/database indexes and rollback preservation. |

The immutable product commit contains 59 changed files, 1,973 insertions and 60 deletions. It contains product, tests and technical documentation; this execution-evidence entry is intentionally separate.

### 15.8 Behavior, state ownership, failure, security and operations evidence

- **Canonical state:** chapters, structures, relations, references and Captures remain their owning domains' truth. Search documents are disposable projection rows keyed by workspace/project/source/source key/block/version. Vocabulary terms are the only new durable user-authored S10 truth.
- **Freshness/recovery:** each request performs bounded source enumeration and version-aware upsert/delete before retrieval. Stale or orphaned hits are revalidated against the source. Projection rows may be truncated and rebuilt without source loss. Durable background propagation remains S12-owned.
- **Ownership/privacy:** every service receives the authenticated actor and owned project; Capture projection includes only that actor's non-dismissed records. Cross-workspace access is rejected. Queries, selections, prose, definitions, synonyms, Capture text, entity text and copied content are excluded from logs and stable errors.
- **Interaction:** palette Open is the only object action that navigates; Peek and action expansion are transient. Jump stores an exact origin coordinate and Return restores it. Attach/insert uses canonical StoryReference validation. Why/Depends reads existing causal edges and never creates or infers one.
- **Language mutation:** lookup/dismiss/save do not mutate prose. Replacement requires the live editor selection and performs exactly one editor transaction; persistence then follows the normal autosave pipeline and native undo restores the prior text.
- **Failure isolation:** a failed provider reports its own typed degraded state while healthy groups remain usable. Language provider failure yields retry/dismiss without changing editor state. Dormant S11 providers say dependency unavailable. Search/Language failure does not affect manuscript durability.
- **Bounds:** query 1–160 Unicode characters, page maximum 100, group maximum 20, synchronization maximum 25,000 sources in batches of 200; dictionary selection maximum six words/160 characters, at most eight senses, twelve synonyms, three examples, sixteen antonyms and a bounded 500-entry memory cache.

### 15.9 Exact console instrumentation ledger at product commit

Every line below was resolved against immutable product commit `2a512b6d1409831f433b56853ddd256428b1b36b`. Server calls use the existing structured logger whose validated transport is `console.log`; client and database verifier calls are direct `console.log`. Each call has the adjacent identifying comment required by the user.

| Step | File | Comment line / log line | Exact adjacent identifying comment |
| --- | --- | --- | --- |
| S10-SEARCH-001 | `domains/search/application/service.ts` | 28 / 29–39 | `Console trace S10-SEARCH-001: universal search completed with query-independent counts and provider states only.` |
| S10-SEARCH-002 | same | 57 / 58–67 | `Console trace S10-SEARCH-002: explicit causal search action records endpoint identity and direction without query or authored content.` |
| S10-LANGUAGE-001 | `domains/language/application/service.ts` | 16 / 17 | `Console trace S10-LANGUAGE-001: dictionary lookup records outcome/counts only; selection, definitions and lexical content are excluded.` |
| S10-LANGUAGE-002 | same | 20 / 21 | `Console trace S10-LANGUAGE-002: provider-local degradation records a safe cause class and never the selected text.` |
| S10-LANGUAGE-003 | same | 29 / 30 | `Console trace S10-LANGUAGE-003: vocabulary mutation logs identity/version metadata only and excludes term/definition content.` |
| S10-LANGUAGE-004 | same | 36 / 37 | `Console trace S10-LANGUAGE-004: saved vocabulary listing emits only the bounded count.` |
| S10-API-001 | `lib/search/http.ts` | 14 / 15 | `Console trace S10-API-001: Search API success emits transport/identity metadata only and excludes query/results.` |
| S10-API-002 | same | 19 / 20 | `Console trace S10-API-002: Search API failure emits stable code/cause class and excludes request/query/authored data.` |
| S10-API-003 | `lib/language/http.ts` | 14 / 15 | `Console trace S10-API-003: Language API success logs transport identity only; selection/definitions/terms are excluded.` |
| S10-API-004 | same | 19 / 20 | `Console trace S10-API-004: Language API failure excludes selected and lexical content.` |
| S10-UI-001 | `components/search/SearchWorkspace.tsx` | 30 / 31 | `Console trace S10-UI-001: full Search resolved with counts only; query/result content is excluded.` |
| S10-UI-002 | `components/editor/EditorSearchBridge.tsx` | 108 / 109 | `Console trace S10-UI-002: explicit reference action records identities/versions/coordinate presence only and excludes prose/result text.` |
| S10-UI-003 | same | 87 / 88 | `Console trace S10-UI-003: block jump stores/restores coordinates without logging block text.` |
| S10-UI-004 | `components/search/SearchResultGroups.tsx` | 30 / 31 | `Console trace S10-UI-004: explicit copy records result identity only and excludes copied content.` |
| S10-UI-005 | same | 40 / 41 | `Console trace S10-UI-005: structured Why/Depends expansion logs only endpoint/count metadata.` |
| S10-UI-006 | `components/editor/EditorSearchBridge.tsx` | 66 / 67 | `Console trace S10-UI-006: selection Language card resolved with counts/state only; selected and lexical content are excluded.` |
| S10-UI-007 | same | 124 / 125 | `Console trace S10-UI-007: one-transaction Language replacement logs coordinate lengths only and excludes original/replacement text.` |
| S10-UI-008 | same | 137 / 138 | `Console trace S10-UI-008: saved-vocabulary action records state only and excludes the term.` |
| S10-UI-009 | `components/shell/CommandPalette.tsx` | 100 / 101 | `Console trace S10-UI-009: command palette search records counts/context presence only and excludes the query/results.` |
| S10-UI-010 | same | 112 / 113 | `Console trace S10-UI-010: Search Peek records result identity and history length only; no authored content.` |
| S10-UI-011 | `components/search/SearchResultGroups.tsx` | 53 / 54 | `Console trace S10-UI-011: full-search attach logs identities/version only and excludes result/manuscript content.` |
| S10-DB-001 | `scripts/verify-search-language-db.ts` | 58 / 59 | `Console trace S10-DB-001: PostgreSQL verified projection coverage/ranking/ownership/indexes/vocabulary using identities and counts only.` |
| S10-DB-002 | same | 72 / 73 | `Console trace S10-DB-002: S10 rollback removed only projection/vocabulary truth and preserved sampled S1/S8/S9 bytes.` |

### 15.10 Validation and stress evidence

| Check | Exact result | Classification |
| --- | --- | --- |
| Prisma format/validate/generate and migrations | Passed; S10 migration applied cleanly. | Verified |
| Lint and TypeScript | Passed with zero errors. | Verified |
| `npm run test:coverage` | Passed 58 files and 211 tests; statements 88.43%, branches 75.06%, functions 84.77%, lines 93.97%; thresholds unchanged. | Verified |
| S10 stress | Passed 9 files/16 tests; 25,000 documents across four query forms remained under the predeclared 2-second assertion. | Verified |
| Focused S10 browser suite | 4 executed and passed; 4 device-deduplicated cases deliberately skipped. | Verified |
| Complete Playwright regression | 96 projects: 50 passed, 46 deliberate configured skips, 0 failed, 5.4 minutes. | Verified |
| Accessibility | Axe reported no serious or critical violation; active-context contrast repair is included in the product commit. | Verified |
| Visual QA | `test-results/search-language-desktop.png` and `test-results/search-language-mobile.png` were inspected; no overlap, clipping or inaccessible action layout found. | Verified |
| Production build | Next.js 16.3 production build passed after reviewed server externalization of WordNet packages. | Verified |
| Database verifier | `S10-DB-001` passed twice: active type count 11, source count 27, alias exact first, explicit reference searchable, collaborator Capture excluded, cross-workspace rejected, vocabulary version 2, three required indexes. | Verified |
| Rollback/reapply | `S10-DB-002` passed: zero S10 tables remained after rollback; sampled Chapter/Capture/Entity counts each remained one; S10 reapplied and DB verification passed again. | Verified |
| `git diff --check` | Passed. | Verified |
| Dependency audit | `npm audit --omit=dev` reports three high advisories through existing Prisma configuration's `deepmerge-ts`; npm's offered fix is the breaking downgrade Prisma 7.9.1 to 6.12.0. Recorded without an unrelated unsafe dependency rollback. | External advisory; not an S10 functionality gap |

### 15.11 Side-by-side S10 conformance audit

| WorkPlan/Bible obligation | Implementation evidence | Result |
| --- | --- | --- |
| Universal, grouped, deterministic project Search | Projection sources, ranking contracts, PostgreSQL repository, palette and full page cover every available S0–S9 canonical type. | Verified |
| Private projection, PostgreSQL truth, freshness and rebuildability | Versioned read-through sync/revalidation and DB rebuild/rollback tests preserve canonical rows. | Verified |
| Peek/Open/insert/attach/copy/jump-return/Why/Depends | Explicit UI actions delegate to canonical StoryReference/causal/navigation boundaries; tests cover action behavior. | Verified |
| Command palette keyboard/focus/selection/scroll semantics | Accessible dialog, arrow navigation, focus trap/restoration, stale-response discard and exact editor origin bridge tested desktop/mobile. | Verified |
| Selection Language definitions/POS/nuance/synonyms/antonyms | Local replaceable WordNet adapter returns deterministic bounded lexical contracts. | Verified |
| One-click replacement and exact undo | One Tiptap transaction plus component/E2E undo proof; only normal durability saves it. | Verified |
| Saved vocabulary and provider-local degradation | Owned normalized persistence and retry/dismiss failure state tested. | Verified |
| S11 dependency order | Timeline Event, Note and Research stay dormant with explicit dependency-unavailable state; no S11 schema/UI/source was introduced. | Verified |
| Performance/accessibility/security/observability/migration | Fixed bounds, stress, axe, ownership tests, exact redacted trace ledger and rollback/reapply all pass. | Verified |
| Phase 3 macro exit | S7–S10 are implemented; S11 remains mandatory. | Planned-later; Phase 3 correctly remains open |

### 15.12 Global doctrine, contradiction and omission audit

- No mandatory structure, scene, world, Capture, causal link, timeline, Note or Research object was introduced. Milestones remain optional and non-owning.
- No hierarchy is inferred from time, Story References or causal edges; no chapter order is treated as chronology. Search ranking does not create truth.
- No automatic prose edit, style correction, inferred recommendation, AI call or typing-path network request exists. Replacement is explicit and undoable.
- Search projection and client transient state never become canonical truth. Read-through freshness is stated honestly pending S12's worker.
- Search/Language/support failures do not block editor durability. Logs and stable errors exclude authored/query/lexical content and retain only allow-listed identifiers, counts and states.
- No billing, pricing, entitlement, AI, Live Story Model, automation, revisions, snapshot or export behavior was added.
- `becauseItems[]` and `consequenceItems[]`, the locked semantic zoom coordinate, and the `$15 Core / future $25 Intelligence` commercial ADR remain unchanged.
- No post-V2 capability or hidden S11 provider was activated. Search's dormant-provider state enforces the original sub-gate sequence.
- Result: S10 implementation matches WorkPlan exactly with no contradiction or omitted in-scope requirement. Only explicitly later S11 and S12 work remains.

### 15.13 Gap register and repair disposition

| Finding | Initial classification | Final disposition |
| --- | --- | --- |
| Unsupported raw `tsvector` deserialization | Gap | Explicit supported-column selection; tests/build pass. |
| Effect-derived client state lint failures | Gap | Replaced with derived/render/input state; lint passes. |
| Capture E2E used a noncanonical route | Gap | Fixture uses `/api/v2/captures`; E2E passes. |
| WordNet data failed Next production bundling | Gap | Reviewed `serverExternalPackages` boundary; build passes and no browser bundle/network lookup is introduced. |
| Browser expected a server-only trace | Gap | Assertion now observes the correct UI trace; server trace remains server evidence. |
| Active-context contrast 4.42:1 | Gap | Changed to the primary text token; axe passes. |
| Prior negative tests denied newly active S8–S10 capabilities | Gap | Narrowly updated for Capture/Entity/Search/Language; Note/Timeline/Research remain denied. |
| Existing transitive dependency advisory | External advisory | Recorded; no breaking Prisma downgrade disguised as an S10 fix. |

All S10 implementation gaps found by lint, type, unit, database, stress, browser, accessibility, build, static and doctrine audits were repaired and rerun. There is no remaining in-scope `Gap`.

### 15.14 Product Git and remote CI evidence; gate state before ledger proof

- Product commit `2a512b6d1409831f433b56853ddd256428b1b36b` (`Implement Search and Language capability`) was pushed to `origin/agent/workplan-subgates-audit`; local and remote hashes matched.
- GitHub Actions run `32053586860`, job `95458529478`, checked out that exact product hash and passed `npm ci`, Prisma generation, lint, typecheck, coverage and production build in 3m15s.
- This Path-only evidence update contains no product code. S10 remains formally incomplete until this evidence commit itself is pushed/remotely matched, passes CI, and a separate reconciliation commit records that result. S11 remains locked.

### 15.15 Evidence reconciliation

- Evidence-only commit `4287dd2c8665b54f8777e38eb28e4d700646e657` (`Record Search and Language implementation evidence`) changed only `Path.md`, was pushed to `origin/agent/workplan-subgates-audit`, and the remote ref matched exactly before this reconciliation was prepared.
- GitHub Actions run `32056515633`, job `95467817847`, checked out that exact evidence hash and passed dependency installation, Prisma generation, lint, typecheck, coverage and production build in 2m19s.
- Product and evidence therefore have independent remote proof. Every S10 obligation in 15.11 is `Verified`; 15.13 contains no remaining in-scope `Gap`.
- This reconciliation contains no S11 product code. S10 becomes formally Passed, and S11 becomes eligible, only after this reconciliation commit is pushed, remotely matched and its own CI passes.

## 16. Entry S11 — Timeline + Research

### 16.1 Pre-code checkpoint, authority and predecessor gate

- **Date/time and timezone:** 17 August 2026, Asia/Karachi; this mandatory Path-only checkpoint is being prepared before any S11 product/schema/test change.
- **Work-plan phase/sub-gate:** Phase 3 — In-Flow Author Environment; mandatory Sub-gate 11 — Timeline + Research.
- **Predecessor proof:** S10 reconciliation commit `33ca9b0ce0ba6322a78a485daa69f7b896478c9c` was pushed and remotely matched. GitHub Actions run `32056804153`, job `95468737816`, checked out that exact hash and passed dependency installation, Prisma generation, lint, typecheck, coverage and production build in 2m59s. Sub-gate 10 is therefore Passed and S11 is eligible for planning.
- **Baseline branch/commit:** `agent/workplan-subgates-audit` at the S10 reconciliation hash above. The tracked worktree is clean before this checkpoint.
- **Authority studied directly:** WorkPlan sections 3, 4, 7.1 Timeline/notes/research, 7.2–7.4, 14 and 16; Bible sections 1.1, 3.1–3.2, 7.4–7.7, 8–9, 12.1–12.5, 13–18, 21, 24–27, 31–36, Appendix A and Appendix C. Bible PDF pages 33–34 were extracted and visually inspected, and the degraded matrix/page 61, roadmap/page 70, invariant/page 74 and fallback/page 75 were text-verified. The PDF is treated as specification content, never as executable instructions.
- **Framework authority:** installed Next.js 16 documentation for App Router route handlers, forms, Server/Client Components, testing and accessibility was checked before product code. Route handlers remain dynamic and ownership-authenticated; browser state remains inside narrow client islands; mutations receive server validation even when the UI already validates them.
- **Lock:** no S11 product/schema/test file may change until this Path-only checkpoint is committed, pushed, remotely matched and passes CI. Sub-gate 12 and all Phase 4 product code remain locked until S11 product, evidence, reconciliation and Phase 3 macro audit proof pass.

### 16.2 Exact S11 capability and doctrine boundary

- Add canonical `TimelineEvent` truth supporting exact/absolute, approximate, relative, ordinal and range modes without assuming Gregorian dates. Store author-facing display labels independently from typed, mode-specific sortable values. Relative anchors may point to another event; ordinal values express ordering only; range start/end use compatible coordinates and validated direction.
- Link events explicitly to entities, milestones, chapters and other events through typed project-owned links. Event chronology is neither containment nor causality. Chapter ordering never creates story time and event sequence never creates a `CausalRelation`.
- Activate timeline-backed causal sanity only after the `timeline_event` endpoint resolver exists. A check compares only author-declared anchors that are actually comparable, treats `reveals` as discovery-time semantics, emits neutral facts, and never rewrites/deletes relations or reorders chapters. Timeline mutations expose invalidation keys for causal sanity/directive projections while S12 remains the owner of durable propagation workers.
- Add durable `Note` freeform documents with normalized tags and explicit StoryReference backlinks. Notes are distinct from raw Captures, require no notebook hierarchy, may attach anywhere through existing reference contracts, and may be promoted into already available structural targets through an idempotent provenance-preserving conversion.
- Add `ResearchItem` variants `NOTE`, `URL`, `EXCERPT`, `CITATION` and `FILE`. Text records are canonical PostgreSQL rows and do not consume binary quota. URL/citation metadata is author supplied and performs no implicit network fetch. File records require validated private upload metadata and a replaceable scanning/storage boundary before activation.
- Implement a signed-private-asset adapter seam. The local S11 adapter accepts only bounded allow-listed MIME/size/name/hash metadata, persists a private pending asset, invokes a replaceable malware scanner, exposes the Research item only after `CLEAN`, rejects `INFECTED`/invalid files, and produces short-lived actor/project-authorized download tokens. No public object URL or raw storage key is returned.
- Register Note and Timeline Event Capture conversion adapters only after their canonical repositories exist. Conversion remains idempotent and retains Capture provenance. Register Timeline/Note/Research Context descriptors and Search providers only after source creation; activate existing dormant `TIMELINE_EVENT`, `NOTE` and `RESEARCH` search identities without changing earlier source ranking contracts.
- Surface linked Timeline/Note/Research cards in the Contextual Writing Field according to Appendix A ordering, with freshness and More behavior. Common inspect/edit/link actions remain Peek-first and restore editor focus/selection/scroll; dedicated Timeline and Research pages exist for deep work only.
- Complete the degraded-network matrix: recently cached/local chapter-only search is explicitly limited/labeled; cached context cards show stale state; unsafe structure mutations are disabled while offline; only already idempotent/queueable Capture and manuscript work remain available; export/snapshot/billing controls are explicitly unavailable until the server returns. This state must not claim nonexistent S12/S13/S14 capabilities.

### 16.3 Planned files, contracts and implementation method

| Planned area/files | Code to be produced and how | Required boundary/evidence |
| --- | --- | --- |
| `prisma/schema.prisma`; `prisma/migrations/20260817*_timeline_research/{migration.sql,rollback.sql}` | Add mode/status/kind enums; `TimelineEvent`, typed event links, `Note`, normalized note tags/conversions, `ResearchItem`, private `StoredAsset` metadata and indexes/ownership/version/soft-archive constraints. Forward/rollback SQL will preserve sampled S1–S10 bytes. | Bible 3, 12, 16–18, 21, 25, 32, 35. |
| `domains/timeline/domain/*`; `application/*`; `infrastructure/*` | Pure coordinate validators/comparators and range/relative-cycle rules first; ownership-scoped service/repository second; stable list/read/write/link contracts with optimistic versions and explicit invalidation keys. | No Gregorian parsing; no chronology→causality inference. |
| `domains/notes/**`; `domains/research/**` | Durable Note/tag/backlink/promotion services and Research variant services. Validate URL/citation/text/file metadata; use existing StoryReference for links and explicit conversion provenance. | Notes are not Captures; tags are not a notebook hierarchy; URLs are not fetched automatically. |
| `domains/storage/**`; `lib/storage/*` | Replaceable upload validator, scanner and private-object adapter; bounded file metadata, SHA-256 identity, clean/pending/rejected states and short-lived signed actor-authorized access. | Binary access is private and validated; text records have no binary quota semantics. |
| `lib/{timeline,notes,research}/runtime.ts`; corresponding `http.ts`; routes under `app/api/v2/projects/[id]` | Thin authenticated dynamic handlers with Zod validation, stable envelopes/codes, CSRF/rate limits, ownership and content-redacted traces. File transport uses reviewed multipart/body limits and never logs names/content/URLs/excerpts. | Next 16 route-handler and security rules; writing cannot be blocked. |
| `components/{timeline,notes,research}/*`; Timeline/Research pages; editor/context integration | Quiet list-first Timeline with explicit mode fields and optional detail/edit; Note/Research library and Peek cards; accessible forms/status; Return to Chapter and focus restoration. | Bible 12, 13–15, 34; no forced navigation for common actions. |
| Existing Capture, Search, Context, Causality and reference registries | Activate Note/Timeline conversion targets, Timeline/Note/Research providers and timeline causal resolver only after source domains; connect timeline anchors to chronology checks and expose invalidations without S12 worker claims. | Mandatory dependency order and provider-activation tests. |
| Offline/degraded client boundary and messages | Add explicit online state contract, bounded recent local chapter search cache, stale context rendering and capability availability matrix. Disable unsafe/nonexistent remote actions with honest labels. | Bible 27 and 36; local writing/draft journal remains authoritative offline. |
| S11 docs and tests | ADR/API/architecture/storage/migration docs; unit/service/repository/component/a11y/stress/E2E/visual tests; DB verifier and rollback/reapply proof. | WorkPlan 7.2–7.4 and Bible 31–36. |

### 16.4 Fixed bounds, failure behavior and security rules before code

- Timeline title/display labels: 1–200 characters; description 0–20,000; sortable decimal components use bounded signed integers and fixed precision; at most 2,000 events per list request domain and at most 100 returned per page. Relative chains are traversed with an explicit depth/visited budget and reject self/cycles.
- Notes: title 1–200, body at most 100,000 Unicode characters, at most 32 normalized unique tags and 64 explicit links. Research textual content at most 100,000; URL at most 2,048; citation at most 10,000; lists page at most 100.
- File boundary: default maximum 10 MiB in S11 tests/config; allow-list PDF, plain text, Markdown, JPEG and PNG; sanitized display name at most 255; SHA-256 required; private storage key generated server-side. Scanner failure leaves the asset unavailable with a retryable typed state. The adapter is replaceable and local filesystem test storage is development/test only.
- Search source projection remains capped by S10 limits. S11 provider activation must not leak archived records, collaborator-private Captures/Notes, file bytes, raw storage keys or unsigned URLs. Search logs never include authored labels/body/query/URL/file names.
- Context requests remain cancellable and keyed; stale cards are discarded online and explicitly marked stale only when intentionally loaded from the bounded local cache. Support failure cannot change manuscript focus, selection, scroll, body or save state.
- Upload, timeline, Note, Research and chronology failure are isolated to their surfaces. Stable errors reveal no private existence across workspace boundaries. Logs contain request/correlation IDs, safe resource IDs, versions, counts, outcomes and codes only.

### 16.5 Planned validation and gate protocol

1. Validate/generate Prisma, deploy migrations to fresh PostgreSQL, and run a real database verifier for every constraint/index/ownership/provider/adapter/invalidation invariant.
2. Unit/property test all coordinate modes, comparable/non-comparable ordering, range validation, relative cycles, reveal semantics, no implicit causality, normalized tags, variant/file validation, signed token expiry and conversion idempotency.
3. Service/repository test ownership, optimistic conflicts, backlinks, promotion provenance, scanner failures, private access, provider activation, Search freshness and context ordering/staleness.
4. Stress large mixed event/Note/Research collections, relative-chain budgets, search rebuild/ranking and bounded context resolution with thresholds declared before execution.
5. Component/accessibility test keyboard-only forms/lists/cards, focus restoration, responsive Timeline/Research pages, error/live regions, disabled offline actions and stale/limited labels. Inspect desktop and mobile screenshots.
6. Focused S11 E2E covers all timeline modes/ranges/links, no chronology-causality conflation, Notes/Capture conversion/promotion/backlinks, Research variants/private files, Search/Context activation, and offline degraded matrix; then run the entire regression suite.
7. Run production build, static content-leak/instrumentation checks, migration rollback/reapply with sampled S1–S10 rows, and dependency/security audit without weakening thresholds or hiding findings.
8. Compare every implementation row side by side with this checkpoint, WorkPlan Phase 3, Bible coverage/doctrine/anti-goals and all prior sub-gates. Repair every in-scope `Gap`; S12+ work alone may remain `Planned-later`.
9. Commit/push S11 product separately and prove remote CI, then commit/push Path evidence separately and prove CI, then reconcile. Run a distinct Phase 3 macro audit/evidence push/CI before marking Phase 3 Passed or allowing S12.

- **Pre-code state:** this checkpoint changes `Path.md` only. S11 product implementation remains locked pending this checkpoint's distinct remote proof.

### 16.6 Pre-code release and implementation chronology

- The Path-only plan commit `f6d0a35ba982827c42847fbe95099f8cf59fa652` was pushed to `origin/agent/workplan-subgates-audit`, remotely matched, and passed GitHub Actions run `33152387260`, job `98787165138`. Only then was the S11 product lock released.
- Implementation followed the planned sequence: pure timeline/research/note types and bounds; PostgreSQL models and migration; ownership-scoped repositories; service and adapter seams; thin authenticated routes; Capture/Causality/Search/Context activation; degraded-mode behavior; UI; docs; database, unit, service, component, accessibility, stress and E2E evidence.
- The immutable product result is commit `0a388fa8f2b9087b85e2947fbbd8c905d102637e`: 95 files, 1,681 insertions and 70 deletions. Its remote ref matched exactly and CI run `33239613151`, job `99066570569`, passed every required step in 3m37s.

### 16.7 Complete file and responsibility ledger

| Files | Implemented responsibility | WorkPlan/Bible boundary |
| --- | --- | --- |
| `prisma/schema.prisma`; `prisma/migrations/20260828080000_timeline_research/{migration.sql,rollback.sql}`; `scripts/verify-timeline-research-db.ts` | Adds `TimelineMode`, `TimelineLinkTargetType`, `ResearchItemKind`, `AssetScanStatus`, and canonical `TimelineEvent`, `TimelineEventLink`, `Note`, `NotePromotion`, `StoredAsset`, `ResearchItem`, `ResearchItemLink` truth with project/workspace relations, checks, uniqueness and indexes; provides forward, rollback and real-PostgreSQL proof. | WorkPlan 7.1–7.3; Bible 3, 12, 16–18, 21, 25, 32, 35. |
| `domains/timeline/{domain/types,application/ports,application/service,infrastructure/prisma-timeline-repository}.ts`; `lib/timeline/{runtime,http}.ts`; `app/api/v2/projects/[id]/timeline/{route,links/route}.ts`; `components/timeline/TimelineWorkspace.tsx`; `app/app/projects/[id]/timeline/page.tsx` | Implements five non-Gregorian modes, typed sortable coordinates, bounded relative traversal, range validation, optimistic writes, explicit non-causal links, invalidation keys, thin HTTP transport, quiet accessible list/form UI and Return-to-Chapter deep-work navigation. | S11 Timeline scope and no chronology/causality conflation. |
| `domains/notes/{domain/types,application/ports,application/service,infrastructure/prisma-note-repository}.ts`; `lib/notes/{runtime,http}.ts`; `app/api/v2/projects/[id]/notes/{route,promotions/route}.ts` | Implements durable freeform Notes, bounded normalized flat tags, StoryReference backlink counts, optimistic writes, Capture provenance and idempotent promotion to Milestone, Story Change or Chapter Outline. | Notes remain distinct from raw Capture and never invent notebook hierarchy. |
| `domains/research/{domain/types,application/ports,application/service,infrastructure/prisma-research-repository,infrastructure/local-storage,infrastructure/signed-asset-access}.ts`; `lib/research/{runtime,http}.ts`; Research routes under `app/api/v2/projects/[id]/research/**`; `components/research/ResearchWorkspace.tsx`; `app/app/projects/[id]/research/page.tsx`; `lib/storage/object-storage.ts` | Implements NOTE, URL, EXCERPT, CITATION and FILE variants; no implicit fetch; explicit reference links; 10 MiB/MIME/name validation; SHA-256 reservation; private storage; replaceable deterministic/HTTP scanners; clean-only visibility; five-minute HMAC actor/workspace/project/asset access; accessible Notes/Research/file UI. The existing shared storage port is extended instead of duplicating a `domains/storage` domain. | Storage/upload validation, scan gate and signed private access; local adapter only outside production. |
| Capture integration: `domains/capture/domain/types.ts`, `domains/capture/infrastructure/prisma-capture-repository.ts` | Activates typed NOTE and TIMELINE_EVENT conversions only after their canonical repositories exist; replays by idempotency key and retains original Capture plus conversion provenance. | Mandatory S8→S11 dependency order. |
| Causality integration: `domains/causality/domain/types.ts`, `domains/causality/infrastructure/prisma-endpoint-adapters.ts`, `docs/adr/0007-causal-boundaries.md`, `docs/api/causality.md` | Activates the previously reserved `TIMELINE_EVENT` endpoint, resolves comparable explicit story time, keeps ordinal/non-comparable values neutral, and enables chronology sanity without creating or mutating a causal relation. | Orthogonal truth invariant and S11 adapter activation. |
| Context/reference integration: `domains/context/{application/ports,domain/resolver,domain/types,infrastructure/prisma-context-repository}.ts`, `lib/context/use-context-field.ts`, `components/context/ContextCards.tsx`, `domains/references/domain/story-reference.ts`, `docs/api/universe.md` | Registers Timeline/Note/Research descriptors after source creation, preserves Appendix A ordering and contextKey cancellation, surfaces linked cards/More/freshness, and adds Note/Timeline/Research reference discriminants. | Existing direct causal/reference precedence remains stable. |
| Search integration: `domains/search/{domain/provider-registry,domain/types,infrastructure/prisma-search-repository}.ts`, `lib/search/runtime.ts`, `components/search/SearchWorkspace.tsx`, `docs/adr/0011-search-and-language.md`, `docs/api/search-language.md`, `docs/architecture/search-language.md` | Activates the three dormant S11 provider identities, builds bounded source rows, retains S10 ranking/freshness contracts, and limits offline results to labeled cached Chapters only. | Search covers all sources through S11 without exposing private content or changing S10 ordering doctrine. |
| Degraded environment: `lib/offline/{degraded-mode,use-network-status}.ts`, `components/shell/DegradedNetworkStatus.tsx`, `components/shell/AppShell.tsx`, `components/structure/StructureWorkspace.tsx`, `app/app/projects/[id]/page.tsx`, `app/globals.css` | Adds hydration-safe online state, bounded recent-Chapter and one-model-per-chapter caches, stale Context labeling, limited Search labeling, online-only unsafe Structure controls and truthful unavailable export/snapshot/billing labels. Manuscript journal and queued Capture remain available. | WorkPlan 7.1 degraded matrix; no false S12–S14 capability claim. |
| Configuration/operations: `.env.example`, `.gitignore`, `lib/env.ts`, `package.json`, `package-lock.json`, `docs/adr/0012-timeline-notes-research.md`, `docs/architecture/timeline-research.md`, `docs/api/timeline-research.md`, `docs/operations/migrations.md` | Documents env/config, ignores local private bytes, adds S11 verifier/rollback scripts, records architecture/API/migration recovery and pins `deepmerge-ts` 8.0.2 after dependency audit identified the vulnerable transitive version. | Replaceable production adapters, reviewed recovery and zero known dependency vulnerabilities. |
| Tests: `tests/unit/timeline-research-domain.test.ts`, `tests/service/timeline-research-service.test.ts`, `tests/component/timeline-research-ui.test.tsx`, `tests/accessibility/timeline-research-accessibility.test.tsx`, `tests/stress/timeline-research.stress.test.ts`, `tests/e2e/timeline-research.spec.ts`; updated Capture/Context/Causality/Search/Structure/reference tests | Covers all modes/bounds, tags/variants/tokens, private scan lifecycle, conversions/promotions, provider activation, chronology neutrality, UI/forms/focus/degradation, load bounds, cross-domain browser flow and regressions. | WorkPlan 7.2–7.4 and S11 protocol 16.5. |

### 16.8 Implemented code, state ownership, security and failure behavior

- PostgreSQL is canonical for all seven S11 records. Search documents, Context descriptors and browser caches are projections; no client cache or UI component can overwrite source truth. Mutations enforce authenticated workspace/project ownership and return stable envelopes.
- Timeline absolute/approximate/range coordinates use bounded decimal components independent of Gregorian parsing; relative coordinates resolve explicit event anchors within a 128-node visited budget; ordinal values remain intentionally unusable as causal story-time. Explicit Timeline links only create reference records.
- Note writes normalize/deduplicate at most 32 tags. Promotion atomically creates an existing canonical structural object, records `NotePromotion`, increments the project structural version and replays safely. No notebook, folder or mandatory planning hierarchy was added.
- Research validates each discriminated variant. URL/citation values are stored exactly as author-supplied metadata and never fetched. Upload performs bounded metadata validation before allocation, writes a server-generated private key, scans before activation, deletes rejected bytes, and returns neither storage key nor public URL. Production refuses to start storage/scanning without configured adapters.
- Access tokens are HMAC-signed and bind user, workspace, project and asset with a 300-second expiry. Download rechecks the authenticated actor, owned clean asset, signature and expiry before a no-store binary response. Cross-actor reuse is rejected.
- Timeline/Note/Research become active Search and Context providers only in this commit. Note/Timeline Capture conversion and Timeline causal resolution likewise activate only after source persistence. Timeline writes expose invalidation keys, but the durable propagation worker correctly remains S12.
- Search and Context failure degrades only those surfaces; scan failure leaves an asset unavailable; upload/research/timeline failures cannot change manuscript state. Offline search is Chapter-only and labeled, cached Context is stale-labeled, and unsafe/nonexistent remote actions are disabled. The hydration defect found during browser testing was repaired by giving server and first client render the same online default and reconciling actual network state in the effect.

### 16.9 Exact console trace and adjacent-comment ledger at product commit

Every S11 operational trace is immediately preceded by its identifying comment. Service/API traces use the production logger, which ultimately emits `console.log`; UI, offline-state and verifier evidence use direct `console.log`. All metadata was audited against the forbidden creative-content key guard.

| Trace | Comment line; invocation line | Safe evidence emitted |
| --- | --- | --- |
| S11-TIMELINE-001 | `domains/timeline/application/service.ts:10`; `:11` | Filter presence, returned count, cursor state. |
| S11-TIMELINE-002 | `domains/timeline/application/service.ts:16`; `:17` | Event identity, mode, versions, invalidation count. |
| S11-TIMELINE-003 | `domains/timeline/application/service.ts:22`; `:23` | Explicit endpoint identities and replay state; comment denies inferred causality. |
| S11-NOTE-001 | `domains/notes/application/service.ts:8`; `:9` | Tag-filter presence, count and cursor state. |
| S11-NOTE-002 | `domains/notes/application/service.ts:11`; `:12` | Note identity/version/tag count/provenance presence. |
| S11-NOTE-003 | `domains/notes/application/service.ts:14`; `:15` | Source/target identities, replay and structural version. |
| S11-RESEARCH-001 | `domains/research/application/service.ts:13`; `:14` | Kind-filter presence, count and cursor state. |
| S11-RESEARCH-002 | `domains/research/application/service.ts:16`; `:17` | Item identity/kind/version and asset presence. |
| S11-RESEARCH-003 | `domains/research/application/service.ts:19`; `:20` | Explicit source/target identity and replay state. |
| S11-STORAGE-001 | `domains/research/application/service.ts:22`; `:23` | Asset identity, MIME, byte count and replay; no name, key or bytes. |
| S11-STORAGE-002 | `domains/research/application/service.ts:25`; `:26` | Asset identity and 300-second lifetime; no token/URL/key. |
| S11-STORAGE-003 | `domains/research/application/service.ts:28`; `:29` | Asset identity and byte count; no token/key/name/content. |
| S11-API-001/002 | `lib/timeline/http.ts:12/:14`; `:13/:15` | Timeline success/failure request metadata and stable code/cause only. |
| S11-API-003/004 | `lib/notes/http.ts:12/:14`; `:13/:15` | Note success/failure metadata with all authored Note data excluded. |
| S11-API-005/006 | `lib/research/http.ts:12/:14`; `:13/:15` | Research success/failure metadata with URL/citation/excerpt/file data excluded. |
| S11-UI-001/006 | `components/timeline/TimelineWorkspace.tsx:36/:46`; `:37/:47` | Timeline create/link identity, mode/version/replay only. |
| S11-UI-002/003/004/005/007 | `components/research/ResearchWorkspace.tsx:28/:38/:51/:60/:69`; `:29/:39/:52/:61/:70` | Note/Research/upload/access/promotion identity, counts, types, versions and expiry only. |
| S11-OFFLINE-001 | `components/search/SearchWorkspace.tsx:31`; `:32` | Cached Chapter result count and availability; query/content excluded. |
| S11-OFFLINE-002 | `lib/context/use-context-field.ts:30`; `:31` | Chapter identity, cached card count and availability. |
| S11-OFFLINE-003 | `components/shell/DegradedNetworkStatus.tsx:9`; `:10` | Network capability boolean only. |
| S11-DB-001 | `scripts/verify-timeline-research-db.ts:69`; `:70` | Owned identities, counts, modes, isolation/replay/chronology/provider/schema outcomes and versions. |
| S11-DB-002 | `scripts/verify-timeline-research-db.ts:83`; `:84` | Removed S11 table/enum counts and preserved predecessor-row counts. |

### 16.10 Validation, stress, migration, browser and remote evidence

| Check | Measured result | Decision |
| --- | --- | --- |
| `npm run db:validate`; `npm run db:generate`; fresh `npm run db:deploy` | Prisma 7.9.1 schema validated/generated; S11 migration deployed to detached PostgreSQL. | Passed |
| `npm run db:verify:timeline-research` | 5 events/5 modes; Note backlink count 1; 3 promotion target types; 5 Research variants; signed download 19 bytes; exact 10, relative 13, ordinal neutral; chronology `CONSISTENT`; 3 active S11 Search types; cross-actor and invalid range rejected; 7 tables, 23 indexes; structural version 11. | Passed |
| Rollback/reapply proof | Rollback left 0 S11 tables/enums and preserved sampled Chapter 1, Capture 1 and Entity 0 rows; migration redeployed and the complete verifier passed again. | Passed |
| `npm run test` | 63 files, 227 tests passed. | Passed |
| `npm run test:coverage` | Statements 88.77% (2879/3243), branches 75.31% (1672/2220), functions 85.09% (788/926), lines 94.04% (2007/2134); every configured threshold passed after the Timeline Search correction. | Passed |
| `npm run test:stress` | 10 files, 18 tests passed, including large mixed S11 collections and relative-chain bounds. | Passed |
| `npm run test:a11y` | 4 files, 4 tests passed. JSDOM's informational Canvas-not-implemented message did not represent an accessibility failure. | Passed |
| Focused S11 Playwright | 3 intended executions passed; 3 complementary project variants intentionally skipped. Desktop and mobile screenshots inspected. | Passed |
| Full integrated `npm run test:e2e` | 102 discovered project cases: 53 intended executions passed, 49 complementary desktop/mobile scopes intentionally skipped, 0 unexpected, 0 flaky; 426,072.302 ms. | Passed |
| `npm run verify` | ESLint zero warnings, TypeScript clean, all 227 tests passed, Next.js 16 production build passed. | Passed |
| `npm audit --audit-level=high` | 0 vulnerabilities after replacing vulnerable transitive `deepmerge-ts` 7.1.5 with override 8.0.2. | Passed |
| Static hygiene | `git diff --check` clean after removing 13 trailing blank lines; authored-content logging review found no body/query/URL/citation/excerpt/name/token/key/bytes in metadata. | Passed |
| Product remote proof | Remote `refs/heads/agent/workplan-subgates-audit` matched `0a388fa8f2b9087b85e2947fbbd8c905d102637e`; CI `33239613151`/`99066570569` checked out that hash and passed install, generate, lint, typecheck, coverage and build. | Passed |

Visual evidence exists for Timeline mobile, Research mobile, combined Timeline/Research desktop, Search desktop/mobile, Context desktop/mobile, Causality desktop/mobile, Capture desktop/mobile, Universe desktop/mobile, and all earlier writing/structure gates. Generated Playwright reports and private test storage remain ignored and were not committed.

### 16.11 Side-by-side S11 WorkPlan/Bible conformance audit

| Required S11 outcome | Direct implementation/evidence | Disposition |
| --- | --- | --- |
| Exact/absolute, approximate, relative, ordinal, range; no Gregorian assumption; display label separate | Typed discriminant validator, decimal coordinate fields, explicit display label, five-mode DB/browser proof | Verified |
| Timeline links to entities, milestones, chapters and events without causality | Typed owned link table/repository/UI; causality relation count remains unchanged; S11-TIMELINE-003/DB proof | Verified |
| Timeline-backed neutral causal sanity | Activated adapter returns only comparable explicit anchors; ordinal/unknown neutral; reveal discovery semantics retained; no relation mutation | Verified |
| Durable tagged/backlinked Notes, no notebook hierarchy | Canonical Note/tag array, StoryReference backlink query, flat tag bounds and UI | Verified |
| Provenance-preserving structural Note promotion | Atomic idempotent promotion to all three currently supported targets and DB proof of 3 types | Verified |
| Research NOTE/URL/EXCERPT/CITATION/FILE, no implicit fetch | Discriminated validators/repository/routes/UI and five-variant DB proof | Verified |
| Validated, scanned private files and signed access | 10 MiB allow-list, hash, pending→clean/rejected scanner flow, private adapter, actor-bound 300-second token, cross-actor rejection | Verified |
| Note/Timeline Capture conversions | Registry activation after canonical sources, idempotent Capture conversion records, DB proof for both IDs | Verified |
| Timeline/Note/Research Search and Context activation | Provider registry and repository active for all three; Context descriptors and linked cards; active-provider count 3 | Verified |
| Degraded-network matrix | Chapter-only limited Search, stale Context, unsafe Structure disabled, export/snapshot/billing unavailable, manuscript/Capture retained | Verified |
| Common inspect/edit without forced full route; deep pages return | Context cards and editor overlays remain Peek-first; Timeline/Research pages are explicit deep work and accept Return-to-Chapter | Verified |
| Production-like quality, boundedness, security, observability | Ownership, CSRF/rate-limit HTTP wrapper, optimistic/idempotent writes, bounded lists/traversals/uploads, redacted adjacent-comment traces, audit 0 | Verified |
| Tests, recovery, documentation and remote proof | Unit/service/component/a11y/stress/full E2E, real DB rollback/reapply, ADR/API/architecture/operations docs, exact remote+CI | Verified |
| S12 outbox worker and later snapshot/export/billing | Invalidation keys emitted; no worker or unavailable later capability claimed | Planned-later by mandatory gate sequence; not an S11 gap |

### 16.12 Contradiction, anti-goal, omission and repair audit

- **Chronology versus causality:** event order and links never create containment or a causal edge; only explicit causal relations remain causal truth. Passed.
- **Canonical versus projection:** PostgreSQL source rows remain authoritative; Search/Context/offline cards are bounded derived views. Passed.
- **Author ownership and optional planning:** no prose is parsed, rewritten or reordered; no Timeline, Note, Research or hierarchy is required. Passed.
- **Privacy:** file bytes are private; authored text, URLs, file names, storage keys and access tokens are absent from operational logs and public read models. Passed.
- **Dependency sequence:** S11 activation occurred only after S10 reconciliation and S11 pre-code CI; S12 remains locked. Passed.
- **WorkPlan wording versus implementation topology:** the planned storage area is realized by the existing `lib/storage/object-storage.ts` port plus Research-owned adapters instead of a redundant `domains/storage/**` tree. The behavior and replaceability boundary are exact; this is a documented file-placement refinement, not a capability deviation.
- **Bible/WorkPlan contradiction review:** no implementation contradicts the orthogonal-truth invariant, Appendix A ordering, phased provider activation, Search ranking contract, offline matrix or six-phase/original-gate execution rules. No in-scope requirement is omitted.

Findings closed before product proof:

| Finding | Repair | Residual gap |
| --- | --- | --- |
| Browser hydration could render server/client network state differently | Initialized the shared hook consistently and reconciled `navigator.onLine` immediately in the effect | None |
| Upload route needed rejection before multipart allocation for declared oversized bodies | Added content-length guard plus authoritative decoded-byte validation | None |
| Research validation exposed inconsistent error mapping | Mapped Zod/domain failures to stable `VALIDATION` envelopes | None |
| Safe provenance/MIME log keys matched the global forbidden substring guard | Renamed production logger metadata to `hasSourceProvenance` and `mimeType`; tests and full E2E passed | None |
| Prisma CLI pulled vulnerable `deepmerge-ts` 7.1.5 | Pinned compatible 8.0.2 override; install, Prisma, full verify and audit passed | None |
| Initial diff contained 13 trailing blank lines | Removed before push and amended the product commit; final diff check clean | None |

### 16.13 Product Git proof and pending evidence reconciliation

- **Plan:** `f6d0a35ba982827c42847fbe95099f8cf59fa652`; remote match and CI `33152387260`/`98787165138` passed.
- **Product:** `0a388fa8f2b9087b85e2947fbbd8c905d102637e`; remote match and CI `33239613151`/`99066570569` passed.
- **Current result:** every S11 implementation row is `Verified`, every discovered in-scope finding is repaired, and no product compliance gap remains. Under the gate protocol, S11 is not formally Passed until this Path evidence commit is itself pushed/remotely matched, passes CI, and a separate reconciliation entry records that result. Phase 3 also remains open pending its distinct macro audit.

### 16.14 Evidence-CI reconciliation and formal gate condition

- Evidence commit `397307f2d2fff71f7b6f06f0cd8944775437da30` was pushed and remotely matched. GitHub Actions run `33239862800`, job `99067231006`, checked out that exact hash and passed clean install, Prisma generation, lint, typecheck, full coverage and production build in 3m6s.
- This confirms that the complete file ledger, trace line inventory, measured validation table, side-by-side WorkPlan/Bible audit, contradiction review and closed gap register in sections 16.6–16.13 describe the same remotely tested product state.
- No S11 product file changes in this reconciliation. S11 becomes formally Passed only after this reconciliation commit is pushed, the remote branch equals its exact hash, and its own CI passes. Phase 3 remains In progress until a subsequent distinct macro audit commit proves all S7→S11 exit conditions together.

### 16.15 Post-reconciliation macro finding and product correction

- **Audit time:** 29 August 2026, 12:51 Asia/Karachi.
- **Why S11 was reopened:** the first Phase 3 aggregate review traced the Search result contract through its client action, request validator and causal resolver rather than accepting provider activation alone. Timeline Search documents correctly emitted `causalEndpointType: TIMELINE_EVENT`, and the S11 adapter correctly resolved Timeline events, but `domains/search/application/service.ts` rejected that endpoint before dispatch because its Zod enum stopped at the Phase 2/S9 endpoint set. Consequently, “Why?”/“What depends on this?” worked for earlier sources but failed validation for Timeline results. This was an in-scope S11 integration `Gap`, so the earlier formal-Passed state was revoked until repair and proof.

| Corrected file and exact line | Product/test correction | Direct evidence |
| --- | --- | --- |
| `domains/search/application/service.ts:9` | Added `TIMELINE_EVENT` to the causal-action request enum. The same resolver/adapter architecture is retained; no new endpoint type or dependency is introduced. | A Timeline Search result can now traverse the already-registered bounded causal neighborhood instead of being rejected at validation. |
| `tests/service/search-language-service.test.ts:24-25` | Added a `DEPENDS` action for `TIMELINE_EVENT` and asserted dispatch as `DOWNSTREAM` with the typed endpoint intact. | Prevents the application contract and resolver registry from drifting apart. |
| `tests/e2e/timeline-research.spec.ts:37` | Extended the authenticated S11 browser journey to search for `Founding`, verify the Timeline result group, invoke “Why does this happen?”, and require the bounded-path response. | Proves provider projection → browser control → API validation → active Timeline adapter → causal response in the real application. |

No new `console.log` site was needed: the correction repairs an existing typed dispatch path and executes through the already-ledgered content-safe S10 Search and S11 Timeline instrumentation. Therefore section 16.9 remains the complete S11 trace inventory; there is no unrecorded trace comment or line to add.

Correction validation on the exact product state:

| Check | Result | Decision |
| --- | --- | --- |
| Focused Search service regression | 1 file, 2 tests passed, including `TIMELINE_EVENT` → `DOWNSTREAM`. | Passed |
| Focused S11 Playwright after restarting the detached test database | 3 intended tests passed, 3 complementary project cases skipped, 0 failures in 57.3s. | Passed |
| Full Playwright matrix | 102 discovered cases; 53 intended executions passed, 49 complementary browser/project cases intentionally skipped, 0 failures in 7.6m. The Timeline Search causal action executed in Chromium. | Passed |
| `npm run test:coverage` | 63 files/227 tests passed; 88.77% statements, 75.31% branches, 85.09% functions, 94.04% lines. | Passed |
| `npm run test:stress`; `npm run test:a11y` | 10 files/18 stress tests and 4 files/4 accessibility tests passed. | Passed |
| Production build with OIDC contract | Next.js production build passed. An earlier `npm run verify` invocation carried development-auth environment into the production build: lint/typecheck/tests passed and the production security guard correctly rejected dev auth. Rerunning with the required OIDC production contract passed. | Passed; expected security guard observed |
| `npm audit --audit-level=high`; `git diff --check` | 0 vulnerabilities; clean diff. | Passed |
| Git and remote CI | Correction commit `9abbcdb8417ef989cb0f7a78718d104ee1b6e492` was pushed and remotely matched. GitHub Actions run `33241370463`, job `99071181207`, checked out that hash and passed install, Prisma generation, lint, typecheck, coverage and production build in 3m15s. | Passed |

**Correction disposition:** the only audit-discovered S11 product gap is fixed and remotely verified. This Path-only update records the correction but does not itself restore formal Passed status. It must be committed/pushed, remotely matched and CI-passed, followed by a separate correction reconciliation. Only then may the distinct Phase 3 macro audit begin; S12 remains locked.

### 16.16 Correction-evidence reconciliation and S11 closure

- Correction evidence commit `a545a8a7c400c88cc86d667be961cd43951a2803` was pushed to `origin/agent/workplan-subgates-audit` and remotely matched.
- GitHub Actions run `33241852820`, job `99072432245`, checked out that exact hash and passed clean installation, Prisma generation, lint, typecheck, full coverage and production build in 2m26s.
- That result remotely proves section 16.15 against the corrected product commit `9abbcdb8417ef989cb0f7a78718d104ee1b6e492`, whose own CI run `33241370463`, job `99071181207`, also passed.
- No product/schema/test file changes in this reconciliation. With the correction product and correction evidence independently remote-verified, every S11 row is `Verified`, its gap register is empty, and Sub-gate 11 is formally **Passed**.
- The gate closes only S11. The distinct Phase 3 macro audit is the next authorized action; S12 and all Phase 4 product work remain locked until that macro audit is committed, pushed, remotely matched and CI-passed.

## 17. Phase 3 — In-Flow Author Environment macro conformance audit

### 17.1 Run identity, authority and lock state

- **Audit time:** 29 August 2026, 13:07 Asia/Karachi.
- **Authority compared side by side:** `WorkPlan.md` Phase 3 sections 7.1–7.4, global acceptance contract section 11, audit protocol section 12, product constitution/orthogonal-truth/anti-goals in section 2, the Bible sections assigned by the WorkPlan, and actual Entries S7–S11/repository behavior.
- **Authorized baseline:** S11 correction reconciliation `b410bbc452775533c54800298bf8bada1b4c6628` was pushed and remotely matched; CI `33241972920`/`99072742288` checked out that hash and passed every job step in 3m18s. Therefore S7–S11 were individually Passed before the macro audit began.
- **Audit scope:** integrated final-Phase-3 behavior only. No Phase 4 capability, outbox worker, durable projection pipeline, snapshot/export system, billing, AI or S12 product code is authorized.
- **Current lock:** the local macro audit passes after the two findings below were repaired. Phase 3 does not become formally Passed, and S12 does not become eligible, until this distinct Path evidence commit is pushed/remotely matched, passes CI, and a final Path-only reconciliation records that proof.

### 17.2 Mandatory original-capability chain and remote proof

| Original gate | Writing-flow exit proved before successor | Final predecessor/reconciliation proof | Decision |
| --- | --- | --- | --- |
| S7 Contextual Writing Field v1 | Planning/direct causal context inspect/edit without leaving Chapter; stable Peek/focus | `e044932a89e8ccfbb47976e14414250b6505579e`; CI `31949044123`/`95169528820` | Passed before S8 |
| S8 Capture | Route-stable raw-first/offline Capture and later structured/causal conversion | `a6be89f59e0f3da5d6dbbfda7f0f141d0db51137`; CI `31961088692`/`95199073965` | Passed before S9 |
| S9 Universe | Flexible facts/state/relations/backlinks inside contextual environment | `f0f02f06b2fbc80420311deb16d898ec32f1dddd`; CI `32046631131`/`95435939423` | Passed before S10 |
| S10 Search + Language | Project/word/explicit causal retrieval without external tools | `33ca9b0ce0ba6322a78a485daa69f7b896478c9c`; CI `32056804153`/`95468737816` | Passed before S11 |
| S11 Timeline + Research | Chronology/reference flows join environment without becoming causality | corrected product/evidence/reconciliation through `b410bbc452775533c54800298bf8bada1b4c6628`; reconciliation CI `33241972920`/`99072742288` | Passed before macro audit |

No original capability was skipped or replaced by the six-phase delivery boundary. S12 remains locked by the macro evidence condition.

### 17.3 Complete Phase 3 file surface

The immutable Phase 3 range from the verified Phase 2 reconciliation `a9c805da67253241b505d17c6b4c195f0cdfbf94` through current corrected product `e6f53dbff5030f2f9f1407265678f009755072e8` contains **215 changed paths**: `app` 37, `components` 20, `docs` 18, `domains` 49, `lib` 24, `prisma` 11, root/config 7, `scripts` 5, `tests` 43 and `types` 1. The exact per-file actions and responsibilities are not collapsed here: they are enumerated in S7 section 12.7, S8 section 13.7, S9 section 14.7, S10 section 15.7 and S11 section 16.7. Together those ledgers cover every WorkPlan 7.2 category:

| WorkPlan 7.2 file category | Implemented repository surface | Disposition |
| --- | --- | --- |
| Context/resolver/directive/cards/Peek/pins/causal trace | `domains/context/**`, `lib/context/**`, `components/context/**`, Context API/editor composition and S7 tests/docs | Verified |
| Capture schema/API/queue/overlay/inbox/conversions/attachments | Capture migration/domain/routes, `lib/indexed-db/capture-queue.ts`, Capture UI and S8 tests/docs | Verified |
| Entity/type/field/relation/state/Universe/quick-create/backlinks | Universe migration/domain/routes/components, StoryReference integration and S9 tests/docs | Verified |
| Timeline/Note/Research/storage/SearchDocument | S10/S11 migrations/domains/routes/components, private storage adapter and source projections | Verified |
| Search/API/palette/page and deterministic language adapter/card | `domains/search/**`, `domains/language/**`, command palette/full Search/selection bridge and S10 tests/docs | Verified |
| Context cards and exact Return-to-Chapter utilities | Active providers for all Phase 3 sources; one focus-preserving editor overlay hook; return coordinates on every deep page | Verified |
| Upload validation/scanning and signed private access | bounded MIME/size/hash validation, replaceable scanner/private adapter, actor/project-bound 300-second access | Verified |
| E2E/visual/a11y/load coverage | 43 Phase 3 test paths plus database verifiers; all applicable suites/results recorded below | Verified |

### 17.4 WorkPlan 7.1 scope audit

| Scope group | Integrated implementation and evidence | Disposition |
| --- | --- | --- |
| Contextual Writing Field and Peek/Open | Desktop attention region/mobile overlay; exact pinned→selection→Peek→cursor/chapter→fallback precedence; idle debounce/typing suspension/cancellation/stale `contextKey` discard; typed provider registry; pin/hide/mute/edit/intentional actions; direct causality before references; bounded More; Peek preserves history/selection/focus/scroll and Open/Return is intentional | Verified |
| Compiled Narrative Directive v1 | Purpose, Advance, Preserve, Reader Outcome, Next, Relevant Context and explicit `becauseItems[]`/`consequenceItems[]`; author-owned provenance and source Peek; deterministic ranking; dismissal/pinning/edit/deviation/disable; synchronous read-through version/freshness until S12 | Verified |
| Zero-friction Capture | global shortcut; raw-save-first; exact restoration; project/chapter/outline/block/selection/entity/time/user context; local IndexedDB queue/idempotent sync; all five lifecycle states, triage, attachments, retention, provenance-preserving conversions; adapters activated only in S8/S9/S11 order; explicit optional causality without prose inference | Verified |
| Universe and references | 13 optional system templates plus custom types; stable common and 10 active non-binary field kinds; explicit IMAGE/FILE boundary backed by same-phase Research/private storage rather than inline binary values; minimal selection quick-create without prose mutation; directional relations/reverse labels; StoryReference backlinks; immutable historical snapshots; entity conversion and `ENTITY_STATE` endpoint activated after canonical persistence | Verified |
| Search and language | one bounded `SearchDocument` model over all 14 Phase 3 source types; grouped deterministic ranking; Peek/Open/reference/copy/block-return/Why/Depends actions; Cmd/Ctrl+K integration; deterministic dictionary/synonym/antonym/saved vocabulary replacement with editor undo; S11 types activated only after their sources | Verified |
| Timeline, Notes, Research and degraded network | five non-Gregorian timeline modes/display labels; non-causal event links; flat tagged/backlinked Notes with promotion; five Research variants; validated private files; Note/Timeline Capture adapters; Timeline/Note/Research Context/Search providers; active `TIMELINE_EVENT` resolver and neutral chronology checks; labeled limited offline Search/stale Context and unavailable unsafe server actions | Verified |

### 17.5 WorkPlan 7.3 implementation-method audit

| Required production order/method | Repository proof | Disposition |
| --- | --- | --- |
| Descriptor/read-model contracts and adapters first | Every S7–S11 pre-code checkpoint records contracts/provider activation before implementation; later adapters remained reserved until source ownership existed | Verified |
| Source domains/indexes before resolver composition | Migrations and canonical repositories precede Context/Search/conversion/causal registration in each original gate | Verified |
| Deterministic ordering/stability and stale-race tests | context resolver fixtures, `contextKey`, request sequence discard, typing suspension and capped ranking tests | Verified |
| One focus-preserving overlay controller | `lib/editor/use-focus-preserving-overlay.ts` is reused by Context Peek, Capture and Entity quick-create/selection flows; causal composition resides in the same Context field | Verified |
| Raw Capture before optional filing | create succeeds before optional target conversion; failed target retains saved raw Capture; offline raw data queues first | Verified |
| Canonical server data; cards are projections | PostgreSQL owns Universe/Timeline/Research/Search sources; Context/Search/browser caches are bounded derived state | Verified |
| Replaceable upload/language adapters; local failure only | scanner/object-storage and dictionary provider ports expose typed unavailable/retry states without disabling manuscript writing | Verified |
| Common editor actions avoid full routes | Context/causal Peek, Capture, entity quick-create, Search palette and language replacement run in overlays/cards; optional deep pages preserve Return to Chapter | Verified |

### 17.6 Exact Phase 3 exit-gate matrix

| WorkPlan 7.4 exit condition | Measured proof | Decision |
| --- | --- | --- |
| Stable Context during continuous typing with exact precedence/contextKey | deterministic unit races and real-browser typing/Peek sequence; stale responses cannot render | Passed |
| Required sources inspect/edit through Peek with exact focus restoration | S7–S11 Context providers, shared overlay controller, editor/mobile browser flows and Return-to-Chapter evidence | Passed |
| Raw-first/offline/permanent-unprocessed/idempotent provenance Capture | offline E2E preserves exact editor state; DB verifier proves replay, lifecycle, attachments, conversion and provenance | Passed |
| Flexible/minimal Universe, complete backlinks, historical snapshots | 13-template/custom schema, minimal create, field/relation/backlink/state DB and browser proofs | Passed |
| Timeline distinct from causality; complete Search; language undo | chronology neutrality, unchanged causal-edge count, 14 active Search types including repaired Timeline causal action, undo-preserving replacement | Passed |
| Common planned-author writing has no full-route dependency | integrated overlay/Peek/palette/selection flows; deep Timeline/Research/Universe/Inbox pages are optional and return exactly | Passed |
| S7–S11 separately pass with providers, Path and remote Git evidence | section 17.2 chain plus each complete sub-gate entry/CI | Passed |

### 17.7 Integrated database, regression, stress and security evidence

| Audit | Exact current result | Decision |
| --- | --- | --- |
| Current-schema S7→S11 database sequence | Context verifier passed; after the verifier repair, Capture, Universe, Search/Language and Timeline/Research all passed sequentially against one fully migrated PostgreSQL database. Capture proved a real active same-project entity context; Universe proved 13 types/state endpoint/backlinks; Search proved 11 pre-S11 types; S11 proved the remaining 3 types, five timeline modes, Note/Research/private storage and chronology. | Passed |
| Migration recovery | Each S7–S11 entry records rollback, predecessor-table/prose preservation, redeploy and re-verification; S11 final rollback left 0 S11 tables/enums and preserved Chapter/Capture/Entity rows. | Passed |
| Full unit/service/component integration | 63 files, 227 tests passed. | Passed |
| Coverage | 88.77% statements (2879/3243), 75.31% branches (1672/2220), 85.09% functions (788/926), 94.04% lines (2007/2134); all thresholds passed. | Passed |
| Stress/load | 10 files, 18 tests passed, covering large context collections, Capture queues, Universe sets, Search bounds and Timeline chains. | Passed |
| Accessibility | 4 files, 4 tests passed; serious/critical axe scans, keyboard/focus and mobile semantics also pass in E2E. | Passed |
| Full browser matrix | 102 cases discovered; 53 intended browser/project executions passed, 49 complementary scopes intentionally skipped, 0 failures in 7.6m. | Passed |
| Production/static/security | lint zero warnings, TypeScript clean, OIDC production build passed, `git diff --check` clean, `npm audit --audit-level=high` found 0 vulnerabilities. | Passed |
| Remote verifier correction | `e6f53dbff5030f2f9f1407265678f009755072e8` remotely matched; CI `33242281126`/`99073540416` passed install, generate, lint, typecheck, coverage and build in 3m21s. | Passed |

Generated screenshots/reports and private test-storage bytes remain ignored. Visual evidence from the individual gates covers desktop/mobile Context, Capture, Universe, Search, Timeline and Research plus Light/Dark surfaces; the macro audit introduced no new visual component.

### 17.8 Global acceptance and product-doctrine audit

| Global contract/doctrine area | Integrated Phase 3 result | Disposition |
| --- | --- | --- |
| Writing sovereignty/no mandatory setup | all Phase 3 systems remain optional and supporting failures degrade locally | Verified |
| Light/Dark/Cream and calm responsive UI | theme inheritance and visual evidence exist; mobile/compact Context and Capture operate without manuscript displacement | Verified; Phase 5 hardening remains Planned-later |
| Focus/keyboard/screen reader/reduced motion/Unicode/IME | Phase 3 tests cover focus/keyboard/semantics/reduced motion/Unicode; final exhaustive IME/RTL matrix belongs to S15 | Verified for active gate; completion Planned-later at S15 |
| Ownership/privacy | direct and child IDs are workspace/project scoped; collaborator-private Capture and signed-file isolation pass; content-free logger guard covers manuscript/Capture/Note/selection/query/file data | Verified |
| Boundedness/performance | card/search/list/traversal/upload bounds and stress suites pass; no whole-project editor load | Verified |
| Canonical versus projection/freshness | source repositories own truth; read-through cards/Search declare versions/staleness; S12 worker/rebuild is not falsely claimed | Verified; S12 propagation Planned-later |
| Orthogonal hierarchy/chronology/causality | containment, event links and before/after never create `CausalRelation`; explicit author causal edges alone are canonical | Verified |
| Optional structure and creative autonomy | no scene/outline/milestone/entity/timeline/causal requirement, literary score, automatic prose rewrite or hard creative drift error | Verified |
| Recovery/destructive safety | Capture/editor local recovery and per-gate migration rollback pass; snapshot/export/checkpoint completion belongs to S13 | Verified where applicable; S13 work Planned-later |
| No AI/post-V2/commercial leakage | no model dependency, inferred canonical relation, Entry/Pro gate, collaboration/community/publisher scope or Phase 4+ UI was introduced | Verified |
| Path/Git evidence | every original gate has detailed files/code/traces/tests/deviations and separate remote proof; this section is the required distinct macro evidence | Verified locally; macro remote proof pending |

### 17.9 Contradiction, omission and audit-finding register

The side-by-side review found no contradiction between the final implementation, WorkPlan and Bible doctrine around mandatory/optional structure, milestone ownership, Semantic Zoom, chronology/causality, canonical/projection truth, creative/data-integrity constraints, focus/deep navigation, privacy, query bounds, no-AI scope or the corrected Core/Intelligence commercial ruling. Phase 4–6 work remains explicitly later and no later capability is represented as implemented.

Two real cross-gate findings were discovered and repaired rather than waived:

| Finding | Classification | Repair/proof | Residual gap |
| --- | --- | --- | --- |
| Timeline Search results emitted an active causal endpoint, but the S10 request validator omitted `TIMELINE_EVENT` | Product integration `Gap` in S11 | section 16.15; product `9abbcdb8417ef989cb0f7a78718d104ee1b6e492`, service/E2E regression, CI `33241370463`/`99071181207` | None |
| S8 DB verifier used an arbitrary entity-context UUID, which final S9 ownership validation correctly rejects | Integrated verification-harness `Gap`; product enforcement was correct | `scripts/verify-capture-db.ts:11,15` now creates an owned Character entity through `PrismaUniverseRepository`, uses its canonical structural versions, and re-proves round-trip; product/test-harness commit `e6f53dbff5030f2f9f1407265678f009755072e8`, current-schema DB sequence and CI passed | None |

The verifier repair adds no new console sink. Its existing adjacent instrumentation is now `scripts/verify-capture-db.ts:16` (`// Console trace S8-DB-001: PostgreSQL verified raw-first idempotency, ownership, lifecycle, attachment, conversion, provenance, endpoint and redaction facts without raw text.`) and literal `console.log` at line 17. It emits only identities, booleans and counts; the entity name/raw Capture text remain excluded. Complete exact trace/comment/call inventories for S7, S8, S9, S10 and S11 remain in sections 12.8, 13.8, 14.8, 15.9 and 16.9 respectively.

### 17.10 Macro decision before remote evidence reconciliation

- Every WorkPlan 7.1 scope row, 7.2 file category, 7.3 implementation method, 7.4 exit condition and applicable global acceptance item is `Verified`; explicitly later S12/S13/S15 work is classified `Planned-later`, not hidden as complete.
- Both audit findings are fixed and independently remote-CI verified. No in-scope product, test, documentation, trace-ledger, migration, security, accessibility, performance or writing-flow gap remains.
- This is a Path-only macro evidence change. Phase 3 remains **In progress** until this commit is pushed/remotely matched and its CI passes, followed by a separate Path-only reconciliation. S12 remains locked.

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
