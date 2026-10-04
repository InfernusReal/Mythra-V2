# ADR 0013: Isolated appearance renewal without product redesign

Status: **7X-0 candidate contract; gate acceptance incomplete.** This is not a shipped palette system. Original contract/observations below are retained; the dated reconciliation at the end and Path sections 35–40 describe later separately authorized prerequisites and current gaps.

Authority: WorkPlan 14.1–14.12 and the user's latest instruction to start Phase 7X. Baseline: `fd60f7f0035cc9cf49ab50264941d0fbdc36a846`. Historic Phase 7 release: `f8fa1d061a91e748642e10387c6318df116f6ca0`. Execution: Path section 34.

## Decision and immutable boundary

Retain the current TypeScript modular monolith, canonical objects, deterministic capabilities, routes, action/control order, panel placement, editor/document/save/recovery/undo/selection/continuation, Context, commands and overlay lifecycle, identity, CSRF, billing, database, APIs and operational rules. Do not change the rigid UI hierarchy or hide existing controls. Core remains USD 15; Intelligence remains dormant. Old tests, deadlines, thresholds, skips, retries and workflows are not edited.

Gate 0 changes no existing application source, style, preference, locale, markup or runtime. The pinned manifest accounts for all **665** preceding tracked files, including binary-safe SHA-256 and **556** TS/JS AST signatures, **2,386** import declarations and **418** literal JSX control/region tags. These syntactic counts do not equal runtime controls; browser attachments independently record visible controls and bounds. All **16** page route families are listed, including the existing root redirect.

The read-only scope checker authenticates the complete manifest against the pinned Git archive, compares every existing file, permits only six named gate-0 additions, permits only append-only Path plus its two current dashboard rows, and rejects deletions, moves, unlisted additions and any existing source change. Text CRLF is normalized like Git checkout; invalid UTF-8 and binary bytes are never decoded lossily. AST/import/control fingerprints are generated from the same normalized bytes, not a different representation.

**Later integration remains locked.** Gate 1 may only introduce the separately allowed appearance stylesheet, catalog/storage/bootstrap/chooser and labels, and tightly bounded layout/ThemeMenu wiring. Its checker must evolve through additive positive/negative AST proof before admitting those exact changes. Gate 0's strict no-product-mutation checker does not itself authorize future integration. All other sources and old tests remain frozen.

## Surface identity and candidate hexadecimal values

Choose an editorial ink/paper instrument, not generic blue-gray. Surface identity and interaction accent are independent. Five palettes each have Light, Dark and Cream adaptations; six accent families have mode-appropriate action foregrounds. System delegates to the existing Light/Dark resolver and is not a fourth token set. Default/reset is `aubergine` + `citron`, preserving the selected base mode.

The machine-readable `appearanceContract` in `docs/audits/phase-7x-foundation-baseline.json` is the complete candidate hexadecimal source, not a production theme implementation. It contains background/surface/raised/subdued/text/muted/decorative-border/emphasized-border for all fifteen surface adaptations and accent/action/text-on-action for all eighteen accent adaptations. The ninety nominal combinations receive additive opaque contrast checks. **Actual composed translucent/gradient, hover/pressed/disabled, graph, selection, caret, focus, semantic-state and Light/Cream browser audits remain required before these become approved shipped tokens.**

| Palette | Dark background / surface / raised | Dark text / muted | Recommended accent |
| --- | --- | --- | --- |
| Aubergine | `#17121b` / `#1e1723` / `#281f2f` | `#f3edf5` / `#b6a8bc` | Citron |
| Warm Ink | `#191613` / `#211c18` / `#2d2520` | `#f5eee7` / `#bcb0a3` | Copper |
| Forest | `#111a16` / `#17231d` / `#1f2e26` | `#e8f2ec` / `#abc1b4` | Mint |
| Burgundy | `#1b1216` / `#251920` / `#32212a` | `#f5edf1` / `#c3adb8` | Rose |
| Neutral | `#151618` / `#1d1f22` / `#282b30` | `#f1f2f4` / `#b2b6be` | Author-selected; Ice used for comparison only |

| Accent | Light/Cream accent and action fill | Dark accent and action fill | Action foreground |
| --- | --- | --- | --- |
| Citron | `#5d651f` | `#d5dc8c` | Light/Cream `#ffffff`; Dark `#17151b` |
| Copper | `#874725` | `#dda47d` | Same mode-appropriate foreground |
| Mint | `#24684b` | `#94ceb0` | Same mode-appropriate foreground |
| Rose | `#8d405c` | `#df9eaf` | Same mode-appropriate foreground |
| Iris | `#6146a4` | `#baaff1` | Same mode-appropriate foreground |
| Ice | `#315f83` | `#9cbfdc` | Same mode-appropriate foreground |

Changing the surface palette must not replace the separately selected accent. Recommended pairings are descriptive. Never put white text on pale Dark action fills. Decorative separators need not carry control-boundary meaning; required input/focus boundaries use emphasized border/accent and reach at least 3:1. Ordinary text, muted labels and action foregrounds reach at least 4.5:1. Disabled/error/destructive controls retain their semantic role, label and current availability. Preserve the original base-mode danger/success colors and truthful status meaning; do not globally turn destructive actions into the chosen primary accent.

The first nominal candidate check rejected Forest and Neutral Light/Cream emphasized borders below 3:1 on subdued surfaces. Candidate values were darkened before approval of even the nominal checks. This is retained design-validation history, not a passing initial palette claim.

## Typography, state finish and motion

Keep the manuscript's existing Georgia/Times stack, font size, line-height, width, paragraph measures and scrolling. Keep the UI's Inter/system stack and existing heading metrics. No font downloads, new dependency or new manuscript font option. Initial palette work changes no font metrics. Later UI-only weight/heading finish must prove no clipping or geometry regression before acceptance.

Use coherent surface depth, existing border radii, restrained color/finish differences and the selected accent across Writing, Structure, Universe, Timeline, Research and Operations. Work modes retain their current capabilities and layout. Graph/list emphasis is cosmetic only: no new edges, meaning, counts, traversals or removed list equivalents. Every existing primary-action selector with a hard-coded white foreground must be inventoried and individually adapted; do not use a universal button recoloring that damages danger/neutral roles.

Gate 0 rejects every font-family, font-weight and letter-spacing override, including root/body inheritance, nested selectors and UI selectors. Matching only named manuscript selectors cannot prove that inherited typography stays unchanged. A later finite UI-selector/consumer proof is required before allowing UI-only treatment; this candidate adds no such override.

Retain the existing 140ms color/shadow motion default; hard ceiling 180ms. No transforms, layout motion, opacity-based concealed controls, delayed focus, keystroke/save animations, animation queues or new responsive breakpoints. Reduced motion is immediate. Forced colors uses system semantic colors and visible boundaries. The gate-0 CSS contract parses declarations/at-rules, including escaped properties and nesting; rejects requests/imports, important overrides, layout/hit-area/stacking/pointer/content/manuscript changes and long/non-cosmetic transitions. New bounded chooser geometry requires its own finite-selector proof in Gate 1; this old-surface rule set is not permission to redesign layout.

## Cosmetic persistence and bootstrap contract (not implemented in Gate 0)

- One browser-origin record: `mythra.appearance.v1`, exactly `{ version: 1, palette, accent }`.
- Maximum serialized input **256 UTF-8 bytes** before parsing; exact three keys, finite known enums, exact version. Reject malformed/oversized/extra-key values; use the default without throwing into writing.
- No user/project ID, route, query, prose, selection, credentials or account/provider state. No canonical API/database preference, cookie, migration, export record or account synchronization. UI must explain local-device-only behavior.
- Storage denial/quota/private browsing uses bounded in-memory state. Reset removes only this key. Cross-tab events inspect only this key; clearing the record resolves to defaults and never synchronizes story state.
- Apply only palette/accent root attributes in one synchronous task; leave `data-theme`, base theme storage/API/provider, `lang`, `dir`, `colorScheme`, existing theme/command bootstrap and all product state untouched.
- An isolated cached bootstrap precedes application paint where supported, without hiding content or network work. Root integration imports the new CSS after `globals.css`, preserves all provider nesting and existing bootstrap order, and must prove actual server-delivered timing/hydration. Injecting a substitute init script is not integration evidence.
- Palette/accent/reset performs zero API writes or extra requests, editor transactions/remounts, navigation, history changes, journal resets, Context resolution, or shared-overlay closure. The chooser owns only its cosmetic/transient state and local focus/Escape behavior; no global provider/store or shared-hook refactor.
- The allowed compact disclosure belongs in the current shell theme-control slot. ThemeMenu is reused in shell, Settings and Command Palette. That consumer topology must be explicitly handled in Gate 1 so the new disclosure does not create extra destinations or an unintended second overlay control. Existing base selects remain unchanged in every consumer.

## Evidence and known incompatible requirements

New browser proof captures the actual current routes, visible controls/order, major region bounds and manuscript metrics on desktop/mobile; existing mode and breakpoint boundaries; command/Capture focus return; full-resolution before images and per-state machine attachments. Five Dark candidates are browser-only stylesheet previews on the actual editor, removed after each comparison. **No `app/appearance.css`, chooser, live catalog, storage or root integration is shipped by those comparisons.** Nominal candidate contrast is not complete composed-browser acceptance or the full 109-state matrix.

Gate-0 inspection found two incompatible old proof contracts that cannot be silently bypassed:

1. `tests/unit/command-reliability-boundary.test.ts` freezes the earlier entire source tree plus five literal command repair substitutions. WorkPlan's future permitted layout/ThemeMenu/message integration cannot satisfy that exact old snapshot. Gate 0 keeps it passing and does not edit it.
2. `tests/e2e/foundation.spec.ts:27` and `:35` assert actual Dark/Light body colors exactly `rgb(17, 18, 20)` and `rgb(250, 250, 249)`. A new default surface background cannot simultaneously equal those old literals. Original fallback palette and historical proof remain valid, but those current assertions need an explicitly authorized historical-versus-current appearance reconciliation before activation. No environment-only test bypass is acceptable.

The new strict full-Axe baseline also exposes a pre-existing `landmark-no-duplicate-banner` moderate finding in the command modal. It is retained, not filtered away, removed from the report, or repaired through forbidden markup changes. Existing request-abort server errors and the current Windows lint-tooling deadline failure remain separate gaps. No green workflow badge certifies those gaps away.

The second fresh matrix also observes mobile Capture scroll return 98→536 after repeated viewport/full-page audits, with unchanged caret coordinates. It remains a baseline failure whose root cause and screenshot/resize independence are not established. The five Dark comparisons pass on both devices after the new harness waits for actual Context readiness; ten candidate plus two original images are manually compared. This is a validated design comparison, not a passing whole-gate matrix or permission to repair frozen runtime code.

## Rollback and acceptance

Gate 0 has no product rollback: revert only its additive verification/documentation files and Path dashboard/append without deleting historical evidence. Later appearance rollback removes/reverts only the isolated CSS, local preference/chooser and permitted wiring; original CSS/theme sources restore presentation without SQL, manuscript migration, journal erasure or account changes. Reset is not a story-data rollback.

No Gate 1 begins until Gate 0's source/visual/design/predecessor/local/remote evidence passes and conflicting proof requirements receive direction. All seven gates, the full matrix and stress/functional/accessibility/remote checks remain mandatory. Known or unexecuted requirements remain **Gap** or **Planned-later**, never Verified by documentation alone.

## 4 October 2026 current reconciliation, not palette approval

The original six-item gap history above is not the current unqualified implementation state. Path 35 records separately authorized exact historical/current source and body-color coexistence plus Command Palette's one-attribute landmark correction; 36 records the bounded public-view-focus Capture correction with fail-first/counterfactual/real-browser proof; 37 preserves lint rules/root behavior while lazily importing in the verifier's correct cwd; 38–39 independently authorize and prove Research/Timeline screenshot hydration/caret handling, with all old actions/assertions/deadlines/skips/retries preserved. Finite reversible recipes admit only those named revisions; the original **665-file baseline, manifest and WorkPlan hashes remain unchanged**, no exemption or later cosmetic integration is introduced.

Path40 authenticates nine fresh families / **109 full-resolution before images, individually inspected**, with **zero reported root overflow/mode mismatches**, **seven Search finding observations** (six heading-order, one SearchPeek duplicate banner), and six deliberately induced resource-error observations. Exact external helper/report/image hashes, control/region/typography records, failed partial collectors and final console/comment indices are retained. A screenshot named `200-percent` at 720px is explicitly compact-width evidence, not actual doubled text/browser zoom. Tall display and independently scrollable internal-pane limitations are disclosed.

Remaining acceptance is not gap-free: Search semantic repair needs its own direct direction; current unchanged combined coverage has five failed files; exact new hosted clean logs and supplementary System/preferences/text zoom/Light/Cream/composed-state design evidence remain incomplete. Existing isolated stress passes do not erase combined failures. Original Dark previews and ninety opaque-role checks remain candidate evidence only. **No live appearance stylesheet, catalog, browser preference, bootstrap, chooser or new labels exists; 7X-1–7X-6 remain Locked.** Current proof/creating hashes and status are in the execution ledger; no future success or phase seal is inferred here.

Subsequent exact receipt in Path 41: **f80a023...** passes hosted 120 files / 1,546 cases, both Security triggers and clean protected 35 cases / 31 old device skips, independently same-tree actual merge. Original-workspace five failures remain; independent same-source Windows checkout still has 1,545 pass / one 12-second lint-child timeout, also reproduced alone. Direct verifier checks all 545 paths / 62 assets but takes 75.83s and is not a budget pass. Separate bounded verifier authority is requested, not presumed. Screenshot correction is Verified in its narrow scope; **gate 0 is not**.
