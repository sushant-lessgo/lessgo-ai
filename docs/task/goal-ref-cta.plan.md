# goal-ref-cta — implementation plan (rev 3, post plan-review round 2)

**Branch:** `feature/goal-ref-cta` (already created; never switch/checkout)
**Spec:** `docs/task/goal-ref-cta.spec.md`
**Base-branch note:** spec named `fix/qa-quick-fixes` as base; those fixes (incl. F14/F1) landed on main at `808280ca`, so main-based feature branch satisfies the constraint.

## Overview

Fix F5/F6/F23. The central gap: `seedGoalForm.ts:81` early-returns `if (!isM1) return`, and `seedGoalForm` is the ONLY generation-time writer of `dest:'GOAL_REF'` — so for M2–M5 goals **nothing stamps anything** (F5), M1 writes a resolved snapshot (F6), and the **multipage generation path (`runFanOut`) never runs ANY goal tail at all**, so every multipage CTA ships metadata-less and falls to the dead template default (F23, the exact P1 repro). This plan decouples GOAL_REF stamping into a new plain module that runs for ANY goal mechanism on **BOTH generation paths** (single-page `buildFinalContent` tail AND multipage `finalizeMultiPageGeneration`), stamps via an explicit element-key allowlist, makes the M1 resolver sitemap-aware (cross-page `page` dest), and locks it with shim/parity/re-point tests plus a multipage generation-layer assertion. No data migration; legacy shapes render via the existing dual-read shim.

## Progress log

- phase 1 GOAL_REF stamping for ALL mechanisms on BOTH generation paths: done (commit c70aa37e, review loops 1, verdict ship)
- phase 2 dual-read shim coverage + legacy fixture + reader-impact analysis: done (commit 1dfc2d9c, review loops 1, verdict ship — NO production code changed; shim already complete)
- phase 3 multipage M1 page dest + chrome/header reach + shared ctx builder (F23): done (commit e7cd8db9, review loops 1, verdict ship)
- phase 3.5 flat-href render bridge (vestria + techpremium-header; granth descoped) — ADDED mid-run: done (commit f7a80df1, review loops 1, verdict ship)
- phase 4 parity + re-point + detach tests (test-only): done (commit 6fa624d5, review loops 1, verdict ship — NO production code changed)
- phase 5 M2–M5 engine matrix + cross-template allowlist coverage: done (commit dd5766a5, review loops 1, verdict ship — NO production code changed)
- phase 6 full verification + manual repro gate: pending

## Verified facts (from scout + plan-review rounds 1–2; implementer verifies line numbers before editing, but do NOT re-derive these)

- `seedGoalForm.ts:81` gates EVERYTHING behind `if (!isM1) return`; it is the only generation-time GOAL_REF writer, called from `src/modules/wizard/generation/finalize.ts:141`. It returns `void`, generates `formId = \`form-${Date.now()}\`` internally (`seedGoalForm.ts:103`), stores the form in `finalContent.forms` (`:120`), and is idempotent — no-op when ANY form already exists (`:85`). The comment at `acceptance.scale05.test.ts:61` ("the real generation writes this") is **aspirational, not true** — hero is NOT written today.
- **Two disjoint generation paths** in `src/modules/wizard/generation/thing.ts`:
  - Single-page: `runCopyAndSave` (`thing.ts:584`) → `buildFinalContent` (`thing.ts:608`, defined in `finalize.ts`) → goal tail (`seedGoalForm` + `injectGoalSections`).
  - Multipage (`input.sitemap` present, incl. the resume path at `thing.ts:544`): `runFanOut` (`thing.ts:378-535`) → per-page `mergePageIntoFinalContent` (`src/modules/generation/multiPageAssembly.ts:133`) → optional `runCollectionFanOut` (`thing.ts:477`) → `finalizeMultiPageGeneration` (`multiPageAssembly.ts:236`, called at `thing.ts:527`) → `saveFC`. **NONE of these call `buildFinalContent`, `seedGoalForm`, `injectGoalSections`, or any GOAL_REF writer — reviewer-verified: no GOAL_REF writer exists anywhere in `thing.ts` or `multiPageAssembly.ts` today.** This is the direct cause of F23.
  - `briefGoal` (`thing.ts:338`, via `briefGoalFor(input)`) is a closure variable in scope for BOTH `runCopyAndSave` and `runFanOut` (fresh AND resume entry).
- Multipage content trees (`mergePageIntoFinalContent`): body-only pages at `fc.pages[key].content` (`:205-208`); home merge also writes `fc.chrome.header.data` / `fc.chrome.footer.data` (`:210-216`) and the flat back-compat `fc.content = { ...content }` (`:224`) — a **shallow copy**, so its section objects are the SAME references as home's `fc.pages[home].content` and `fc.chrome.*.data`. The multipage shared 'Contact' form is created by `ensureSiteContactForm` (`multiPageAssembly.ts:65`, `fc.forms`, name `'Contact'`), internal to the merge — its id is only recoverable by reading `fc.forms`.
- Types (`src/types/destination.ts`), shim (`src/utils/destinationShim.ts`), resolver (`src/utils/resolveCtaHref.ts`), render pre-pass (`src/utils/normalizeCtas.ts`, run at published `LandingPagePublishedRenderer.tsx:76` and edit `LandingPageRenderer.tsx:131`) all exist.
- `deriveCtaRole` (`src/utils/sectionHelpers.ts:20-24`): `cta.role` → `buttonConfig.ctaType` → element-key `/secondary/i` → **defaults to `'primary'`**. Not circular, but the default means `signin_text` (`MeridianNavHeader.published.tsx:42`, `TechPremiumNav.published.tsx:43`) and dynamic `tiers_cta_${id}` / `packages_cta_${id}` would classify primary — it CANNOT be the stamping enumerator (see D-A).
- Full CTA element-key set across `.published.tsx` blocks: `cta_text` (hero/header/cta), `secondary_cta_text`, `signin_text`, `tiers_cta_*`, `packages_cta_*`. Call sites use TWO syntaxes: dot access (`md?.cta_text?.buttonConfig`) and bracket template-literal (`md?.[\`packages_cta_${p.id}\`]?.buttonConfig`, `TieredPackages.published.tsx:70`; likewise `tiers_cta_${id}`) — the guard test must handle both (phase 1 step 6).
- **Header location per path.** Single-page: the header is an ordinary section in the flat `finalContent.content` map at generation time (no chrome split exists on the single-page path; the chrome split at `persistenceActions.ts:218+` is a multipage persistence concern) — a stamp over `finalContent.content` reaches it. Multipage: the header lives at `fc.chrome.header.data` (and, by shared reference, in home's content + `fc.content`) — the stamp must cover it explicitly (D-F). At publish, `/api/publish/route.ts:73-76` runs `injectChromeIntoPage` (root + every subpage) BEFORE export, which makes an **already-stamped** header reachable to the published `normalizeCtas`; it is a relocation step, NOT a stamping mechanism — it cannot resolve a GOAL_REF that was never written.
- `resolveDestination({kind:'page'})` returns the **bare `pathSlug`** (`resolveCtaHref.ts:37`), identical to existing nav page-links (`pageLinks.ts:53`); `middleware.ts` resolves host-relative paths via KV on published domains. Generated HTML contains `/contact`, never `/p/<slug>/contact` (see Spec deviation).
- `leadFormFields.tsx:74` emits `<div id="form-section">` from the SharedLeadForm block content itself — the anchor is real; single-page M1 anchor resolution works today. Keep the `'form-section'` constant.
- On multipage, the seeded leadForm concept doesn't apply — the template ships its own contact form (vestria) provisioned during merge; the cross-page case arises only for **template-shipped** contact forms.
- "Goal change re-points" and "detach writes explicit Destination" are already satisfied by machinery (`getPublishedGoal` re-reads `Project.brief.goal` at publish; `ButtonConfigurationModal.buildCtaButton` writes `{role:'primary',dest:'GOAL_REF'}` / explicit dest) → tests, not builds (phase 4).

## Spec deviation (ratified by orchestrator)

Acceptance criterion 3's literal `/p/<slug>/contact` is **factually wrong**: the codebase's page-dest mechanism emits the bare host-relative `pathSlug` (`/contact`), same as existing multipage nav links, and middleware/KV serve it on the published host. We implement and test the bare path. Any `/p/<slug>/` prefix gap affects nav links identically, is pre-existing, and is OUT of scope (separate ticket).

## Known limitation (documented, out of scope)

**Regenerate paths drop the goal tail.** `regenerate-content` / `regenerate-section` / `regenerate-element` rebuild elements with NO goal tail — a full-content regen can drop GOAL_REF stamps and re-trigger F5 post-generation. This is **pre-existing** (scale-05's `seedGoalForm` never ran on regen either — `docs/task` scale-05 audit `:168`) and stays OUT of scope here; fixing it means threading the stamp into three regen routes and belongs to a follow-up ticket. Stated so it is a conscious gap, not a silent one.

## Design decisions

### D-A: Stamping enumerator = explicit allowlist, NOT `deriveCtaRole`

Options weighed: (1) per-template manifest of `(sectionType, elementKey)` pairs; (2) `deriveCtaRole`-based convention; (3) block-schema stamping. **Option 2 is rejected**: `deriveCtaRole` defaults to primary, so it would mis-stamp `signin_text` and pricing-tier CTAs (`tiers_cta_*`/`packages_cta_*`) with GOAL_REF. **Chosen: explicit allowlist** — stamp only element key `cta_text` (the hero/header/cta-section primary across all templates, per the verified key set). `signin_text`, `secondary_cta_text`, and pricing-tier CTAs are explicitly OUT of scope (spec enumerates hero/header/cta only). Honest tradeoff: a hardcoded allowlist carries the same forgot-a-spot risk we ascribed to the manifest — mitigated by a **guard test** that extracts `resolveCtaHref` call-site element keys from all `.published.tsx` blocks and fails when a new key appears that is neither allowlisted nor on the known-excluded list. `deriveCtaRole` may serve as a secondary guard (never stamp a key it classifies secondary), nothing more.

### D-B: Parity test layer

**Test at the `normalizeCtas` layer.** Edit `.tsx` blocks render CTAs as editable text and compute no href; the edit click path (`ctaHandler.ts`, `FormConnectedButton.tsx`) has zero importers (dead code). Both renderers share the single `normalizeCtas` pre-pass; asserting identical normalized `buttonConfig` + `resolveCtaHref` output given the same content+ctx proves the criterion at the only layer where an href exists in both worlds. The ctx builder is extracted as a definite phase-3 deliverable (not contingent) so phase 4 consumes it. Wiring the dead click path: out.

### D-C: Param-less degradation (F14 "Skip for now")

`goalParamSkipped` is wizard-only, never persisted — degradation lives in `goalToDestination`: required param absent → return `null`; `normalizeCtas` maps `null` → documented inert config (`href:'#'`, no dead anchor). Never throw, never emit a broken URL. (Ratified: `'#'` + documented no-op; visually-disabled button touches blocks → deferred, out of scope.)

### D-D: Copy invariant

No prompt/copy changes anywhere. GOAL_REF is stamped post-copy at finalize and resolved at render/export. No phase touches `src/modules/prompt/` or audience prompt builders.

### D-E: Stamp lives in its own plain module; unit of work = a content tree

Weighed: (a) lift the gate inside `seedGoalForm` and branch internally vs (b) new plain module `src/modules/goals/stampGoalRefCtas.ts`. **Chosen: (b).** `seedGoalForm`'s name AND gate are form-scoped; stamping is mechanism-agnostic and must run for M2–M5 where no form exists — burying it behind a function whose contract is "seed the M1 form" is exactly how F5 happened. `seedGoalForm` keeps its M1 gate for form instantiation + leadForm injection ONLY and loses its snapshot-writing; `stampGoalRefCtas` owns all `dest:'GOAL_REF'` writes for every mechanism. Plain module (no 'use client') per published/client boundary law.

**Contract (pinned so both paths share ONE function, no fork):** `stampGoalRefCtas(contentMap, { goal, formId? })` takes a **content tree** — a `Record<sectionId, Section>` whose sections carry `elements`/`elementMetadata` — plus the goal and an optional pre-resolved formId. It stamps allowlisted keys `{role:'primary', dest:'GOAL_REF'}` (+ `formId` iff M1; **non-M1 stamps carry NO `formId`**), creates `elementMetadata` entries where missing, never writes a resolved `Destination`, and is **idempotent** (re-stamping writes the same value). A single-section helper (or a one-entry map call) covers `chrome.header.data`. **No goal (`goal == null`) → no stamp**: stamping GOAL_REF with no goal would resolve every primary to `'#'`, strictly worse than today's template fallback.

### D-F: Multipage stamp site = inside `finalizeMultiPageGeneration` (NOT per-merge)

The multipage path never runs the finalize tail (verified fact above), so the stamp needs its own call site there. Weighed:
- (a) **Inside `finalizeMultiPageGeneration(fc, briefGoal)` (`multiPageAssembly.ts:236`)** — chosen.
- (b) After each `mergePageIntoFinalContent` in `runFanOut` (`thing.ts:441`).

**Chosen (a), the single choke point:** it runs exactly ONCE per generation, on fresh AND resume runs (`thing.ts:527`, resume converges through the same `runFanOut`), and sees the fully assembled `fc` — including `fc.chrome` and the flat `fc.content` (which exist only after the home merge) and collection item pages merged inside `runCollectionFanOut` (which per-merge stamping in `runFanOut`'s page loop would MISS entirely). Option (b) would need three separate stamp sites to reach the same coverage. Cost of (a): `finalizeMultiPageGeneration` gains a `briefGoal` parameter (optional, defaulting to no-stamp, so existing callers/tests stay green) and the call site `thing.ts:527` passes the in-scope `briefGoal` closure (`thing.ts:338`).

**What it stamps:** iterate `fc.pages[*].content` (every page incl. collection items), `fc.chrome.header.data` AND `fc.chrome.footer.data` (allowlist-driven, so footer is a harmless no-op unless a template ever puts `cta_text` there), and the flat `fc.content`. Note `fc.content` shares section references with home + chrome (shallow copy, `multiPageAssembly.ts:224`) — stamping is idempotent so the overlap is safe; stamp all three anyway and assert on all three in tests (do NOT rely on reference sharing).

**M1 formId source per path (pinned):** the stamp never generates a formId — it reads one back from the tree's `forms` map, because `seedGoalForm` returns `void` (`seedGoalForm.ts:103`) and multipage's `ensureSiteContactForm` is internal to the merge (`multiPageAssembly.ts:65,184`). Lookup rule: if `forms` has exactly one entry, use it; if several, use the one named `'Contact'` / referenced by a contact/leadForm section's `elements.form_id` — implementer pins the exact rule in the audit. Weighed making `seedGoalForm` return the id (cleaner locally) — **rejected**: it only helps the single-page path, the multipage path must do the read-back anyway, and one uniform lookup beats two mechanisms plus a signature change.

## Ratified decisions (orchestrator; previously open questions — none remain open)

1. **seedGoalForm contradiction:** hero is NOT written today; "leaves hero as GOAL_REF" was a misread of an aspirational test comment. Phase 1 step 1 stays as an explicit pre-step that confirms this in code and surfaces the finding in the audit BEFORE the rest of phase 1 lands (acceptance-test rewrites depend on it).
2. **`/p/<slug>/` prefixing:** out of scope / separate ticket; bare `pathSlug` mirrors the existing nav mechanism. See Spec deviation.
3. **Header with no CTA key:** skip silently — driven by the explicit allowlist, so a missing key is a conscious no-op, not silent data loss.
4. **Param-less:** `'#'` + documented no-op (D-C). Disabled-button styling deferred.

---

## Phase 1 — GOAL_REF stamping for ALL goal mechanisms on BOTH generation paths

**Goal:** every primary CTA (`cta_text` in hero, header, cta section) gets `cta = { role:'primary', dest:'GOAL_REF', formId? (M1 only) }` at generation time, for **every mechanism M1–M5**, on **both** the single-page path (`buildFinalContent` tail) and the multipage path (`finalizeMultiPageGeneration` — the F23 repro path, which today runs no goal tail at all), replacing the M1-only pre-resolved snapshot. This is the core of F5 AND the stamping half of F23.

**Honesty note (was "single-page meridian slice"):** `seedGoalForm`/`finalize` are shared across all audiences and templates, and the multipage assembly is shared by every sitemap generation, so this rework lands globally in one step — there is no code seam for a meridian-only slice. The "slice" is test focus (meridian repro shape first), not blast radius. ALL existing service-intent `seedGoalForm`/goals tests AND multipage assembly tests must stay green.

**Steps:**
1. **Pre-step (ratified #1):** read `seedGoalForm.ts` end-to-end; confirm in code that hero/header receive no `cta` metadata today and that `acceptance.scale05.test.ts:61` is aspirational. Surface this finding in the phase audit BEFORE the rest of the phase lands.
2. Create `src/modules/goals/stampGoalRefCtas.ts` per D-E's pinned contract: plain module, takes a content tree (`Record<sectionId, Section>`) + `{goal, formId?}`; stamps allowlisted keys (`cta_text` only, per D-A) with `{role:'primary', dest:'GOAL_REF'}` (+ `formId` iff M1; non-M1 carries none); creates `elementMetadata` entries where missing (the F5 case); never writes a resolved `Destination`; idempotent; `goal == null` → no-op; skips sections with no allowlisted key silently (ratified #3). Export the single-section helper for chrome stamping.
3. **Single-page wiring:** in `finalize.ts`, call `stampGoalRefCtas(finalContent.content, …)` **AFTER** `seedGoalForm` (~`:141`) — ordering pinned because the M1 `formId` must point at the form seedGoalForm just created; obtain the formId by reading `finalContent.forms` back (D-F lookup rule; seedGoalForm returns void — do NOT change its signature). The stamp runs **outside** any mechanism gate. Strip `seedGoalForm`'s snapshot-writing (the `targetId`+resolved-dest logic in the ~`:92-152` region — verify lines); keep its M1 gate solely for form instantiation + leadForm section injection. Header reach: on this path the header is a regular section inside `finalContent.content` (verified fact), so this one call covers hero/header/cta alike — implementer confirms header presence in the stamped output in the audit.
4. **Multipage wiring (BB1/D-F):** change `finalizeMultiPageGeneration(fc)` → `finalizeMultiPageGeneration(fc, briefGoal?)` in `multiPageAssembly.ts`; inside it, when a goal exists, run the stamp over `fc.pages[*].content`, `fc.chrome.header.data`, `fc.chrome.footer.data`, and `fc.content` (all three trees explicitly; shared references make some writes redundant — that's fine, idempotent). M1 formId read from `fc.forms` per D-F. Update the call site `thing.ts:527` to pass the `briefGoal` closure (`thing.ts:338`). No other `thing.ts` changes.
5. Add param-less degradation (D-C): `goalToDestination` returns `null` when required `goal.param` missing (M2 phone/email, M3 url, M4 links); `normalizeCtas` maps `null` → inert `'#'` config. M1/M5 keep working defaults.
6. Guard test (D-A mitigation): scan `.published.tsx` blocks for `resolveCtaHref`/metadata CTA call-site element keys; fail if any key is neither allowlisted (`cta_text`) nor known-excluded (`secondary_cta_text`, `signin_text`, `tiers_cta_*`, `packages_cta_*`). **The extractor must handle BOTH call-site syntaxes:** dot access (`md?.cta_text?.buttonConfig`) and bracket template-literals (`md?.[\`packages_cta_${p.id}\`]?.buttonConfig`, `TieredPackages.published.tsx:70`; `tiers_cta_${id}`) — normalize a template-literal to its static prefix (`packages_cta_`/`tiers_cta_`) and match it against the excluded wildcard patterns, else the guard false-positives on day one.
7. Tests:
   - `stampGoalRefCtas.test.ts`: every primary stamped for each of M1–M5, metadata created where missing, formId on M1 only (and absent for M2–M5), excluded keys untouched, resolved-`Destination` never written, null-goal no-op, idempotence.
   - **Multipage generation-layer test (BB3 guard)** `src/modules/generation/multiPageAssembly.goalRef.test.ts`: build the fc via the REAL assembly — `buildMultiPageSkeleton` + `mergePageIntoFinalContent` per page with **raw AI-shaped copy fixtures carrying NO cta metadata** (vestria repro shape `9knkYn8_QZpE`: home + `/contact`, template-shipped contact form via `formSpec`) + `finalizeMultiPageGeneration(fc, m1Goal)`. Assert: `fc.pages[*].content` primaries, `fc.chrome.header.data`, and `fc.content` all carry `{role:'primary', dest:'GOAL_REF', formId}` where `dest` is the **literal string `'GOAL_REF'`, NOT a resolved snapshot object**; formId equals the `ensureSiteContactForm` id in `fc.forms`; excluded keys untouched; no-goal call leaves everything metadata-less. **A hand-built fixture that pre-carries `dest:'GOAL_REF'` does NOT satisfy this test — the fixture must enter the assembly unstamped.**
   - `seedGoalForm.test.ts` updated (no snapshot writes; M1 form seeding unchanged; ALL service-intent cases green); `goalToDestination.test.ts` (param-less → null); rewrite `acceptance.scale05.test.ts` assertions that baked in snapshot behavior (now truthful, per step 1).

**Files touched:**
- `src/modules/goals/stampGoalRefCtas.ts` (new)
- `src/modules/goals/stampGoalRefCtas.test.ts` (new)
- `src/modules/goals/__tests__/ctaKeyAllowlist.test.ts` (new, guard test)
- `src/modules/goals/seedGoalForm.ts`
- `src/modules/wizard/generation/finalize.ts`
- `src/modules/wizard/generation/thing.ts` (only the `finalizeMultiPageGeneration` call site, ~`:527`)
- `src/modules/generation/multiPageAssembly.ts` (`finalizeMultiPageGeneration` signature + stamp calls)
- `src/modules/generation/multiPageAssembly.goalRef.test.ts` (new)
- `src/modules/goals/goalToDestination.ts`
- `src/utils/normalizeCtas.ts`
- `src/modules/goals/seedGoalForm.test.ts`
- `src/modules/goals/goalToDestination.test.ts`
- `src/modules/goals/__tests__/acceptance.scale05.test.ts`

**Verification:**
- `npx tsc --noEmit`
- `npm run test:run -- src/modules/goals src/modules/generation` then full `npm run test:run` (service-intent + existing multipage assembly suites included)
- Acceptance: single-page M1 shape (repro `I9HwKOYo9jsm`) — all primaries (hero/header/cta) resolve to `#form-section` via `normalizeCtas` in a unit test; **multipage generation-layer assertion green (real assembly, unstamped fixtures in — GOAL_REF out, no snapshots)**; M2–M5 stamped GOAL_REF (resolution matrix completed in phase 5).

## Phase 2 — Dual-read shim: verify coverage, extend gaps, freeze legacy fixture

**Goal:** legacy shapes (raw `href` `#x`/`/x`/url; old `buttonConfig`) map losslessly at read via the existing shim; regression-locked with a frozen fixture. Extend, don't fork.

**Steps:**
1. Audit `src/utils/destinationShim.ts` (`toDestination` `:107`, `LegacyButtonConfig` `:22`) against the spec matrix: `#x`→section, `/x`→page, absolute url→external, plus wa.me/tel:/mailto: forms if present in legacy data. Extend only proven gaps.
2. Verify `normalizeCtas:107` (`if (!cta) continue;`) leaves legacy metadata-less buttons rendering exactly as before (published block fallback) — that IS the no-migration contract; do not invent GOAL_REF for legacy content.
3. **Reader-impact analysis (record in audit, no edits expected):**
   - `persistenceActions.ts:202` reads `element?.metadata?.buttonConfig` — the `elements[key].metadata` shape, DIFFERENT from the `elementMetadata[key]` entries we write → new stamps neither false-positive nor get detected there. No change.
   - `useReviewState.ts:258` reads `elementMetadata[key].buttonConfig` for `type:'link' && url`: a GOAL_REF primary under an external-url goal down-converts to `{type:'link',url}` and will **newly register as "linked"** — known, likely-benign behavior change; state it explicitly in the audit as accepted, not incidental.
   - `formActions.ts:65-68`, `sectionHelpers.ts:20-24`, `FormPlacementRenderer.tsx:59-76`: confirm green, note findings.
4. Frozen legacy fixture test: capture a pre-feature content blob (repro shape) and assert `normalizeCtas` + `resolveCtaHref` output is byte-identical before/after this feature.

**Files touched:**
- `src/utils/destinationShim.ts` (only if gaps found)
- `src/utils/destinationShim.test.ts` (create if absent)
- `src/utils/__fixtures__/legacyCta.fixture.ts` (new, frozen)
- `src/utils/normalizeCtas.legacy.test.ts` (new)

**Verification:**
- `npx tsc --noEmit`
- `npm run test:run -- src/utils`
- Acceptance mapped: "legacy shape renders identically — regression test on frozen fixture."

## Phase 3 — Multipage M1: cross-page `page` dest + chrome/header reach + shared ctx builder (F23 resolution half)

**Goal:** M1 resolves to the same-page `#form-section` anchor when the form section is on the current page, else `{kind:'page', pathSlug}` to the page holding it. Threaded through both renderer entries and the static exporter; header CTA provably normalized on multipage in BOTH renderers, **fed by phase 1's generation-time stamp** (stamping itself is DONE in phase 1 — this phase resolves it). Extract the shared `NormalizeCtasContext` builder (definite, not contingent — phase 4 consumes it).

**Steps:**
1. Widen `NormalizeCtasContext` (`normalizeCtas.ts:38`): minimal shape `{ currentPagePath: string, formPagePath?: string }` (template/store-agnostic). Extract a plain-module `buildNormalizeCtasContext` helper in `normalizeCtas.ts` and refactor both renderer entries to use it (this is the phase-4 parity-test seam).
2. `goalToDestination` M1 branch (`:78-85`): form on current page → `{kind:'section', anchor:'form-section'}` — **keep the constant**; `leadFormFields.tsx:74` emits that id from the SharedLeadForm block, so it's real, not a guess. Form elsewhere → `{kind:'page', pathSlug: formPagePath}`.
3. **Form-bearing-page predicate (pinned):** scan root `content` + each `subpages[path].layout.sections` for (a) the seeded leadForm section (id prefix `leadForm-`), else (b) the template-shipped contact-form section type (implementer pins vestria's exact section-type string in the audit). Note: on multipage the form is template-shipped (vestria contact page) — whose page may have NO `#form-section` anchor. A `page` dest **without a fragment is acceptable** (lands on the form page top); state as designed behavior.
4. Published side: `renderPublishedExport.ts` derives per-page ctx via the step-3 scan (published shape has no `archetypeKey`), passes it through new `StaticHTMLOptions` fields (`htmlGenerator.ts:77`, near `goal` at `:42`) into `LandingPagePublishedRenderer`'s `normalizeCtas` call. Root render (`:118`) and subpage loop (`:205`) both threaded. **Header reach, published:** the header was stamped at GENERATION time in `fc.chrome.header.data` (phase 1 / D-F); at publish, `/api/publish/route.ts:73-76` `injectChromeIntoPage` relocates that already-stamped header into each page's content so the published `normalizeCtas` sees it — relocation, not stamping. Assert in the exporter test that the header `cta_text` href is present and correct in subpage HTML.
5. Edit side: `LandingPageRenderer.tsx:108-133` — extract `pages` + `currentPageId` from the store (`PageAxisState`), derive current path + form-page path (mirror `pageLinks.ts:45 deriveNavLinks`), extend the memoized ctx via `buildNormalizeCtasContext`. **Header reach, edit:** verify the draft-load path re-merges `chrome` header into the store's section list (the inverse of the `persistenceActions.ts:218+` split) so the edit-side `normalizeCtas(rawContent)` covers the header. If load does NOT re-merge and the header renders via a path that bypasses `normalizeCtas`, **STOP** — flag to the orchestrator to amend this phase's file list (scope addition, not a silent extra edit).
6. Tests: `goalToDestination.test.ts` (M1 same-page vs cross-page, fragment-less page dest); **exporter-level test `multipageGoalRef.test.ts` (BB3):** the input fc MUST come from the REAL generation assembly — reuse phase 1's builder (raw unstamped copy fixtures → `mergePageIntoFinalContent` → `finalizeMultiPageGeneration(fc, goal)`), NEVER a hand-built fixture that pre-carries `dest:'GOAL_REF'`. Feed that fc through the export path and assert: home-page primary href equals the **bare contact page path** (`/contact` — NOT `/p/<slug>/contact`, per Spec deviation); the chrome header CTA href is present and identical in root + subpage HTML; no resolved snapshot was written back into the persisted content by the export. Vestria repro shape `9knkYn8_QZpE`.

**Files touched:**
- `src/utils/normalizeCtas.ts`
- `src/modules/goals/goalToDestination.ts`
- `src/modules/generatedLanding/LandingPageRenderer.tsx`
- `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx`
- `src/lib/staticExport/htmlGenerator.ts`
- `src/lib/staticExport/renderPublishedExport.ts`
- `src/modules/goals/goalToDestination.test.ts`
- `src/lib/staticExport/__tests__/multipageGoalRef.test.ts` (new; consumes the real-assembly fc builder — import from phase 1's test helpers or rebuild via the same `multiPageAssembly` calls)

**Verification:**
- `npx tsc --noEmit`
- `npm run test:run`
- Acceptance mapped: "multipage M1 home primaries resolve to the contact page path (bare `pathSlug`), published HTML verified at unit level against REAL-assembly input; live check at phase 6 gate." Header CTA asserted in exported subpage HTML.

## Phase 3.5 — Flat-href render bridge (ADDED mid-run after a confirmed phase-3 finding)

**Why this exists.** Phase 3's impl-review independently verified that **no vestria block reads
`buttonConfig`** — vestria's hero (`VestriaTailoredHero.core.tsx:48`) and header
(`VestriaNavHeader.core.tsx:89`) render a flat `elements.cta_href` (hardcoded default `#contact`)
through `E.Link`, and published `Link` (`publishedPrimitives.tsx:31-32`) takes the prop verbatim.
So the GOAL_REF stamp + resolution are **dead wiring** on flat-`*_href` templates, and F23 is NOT
fixed on its own repro (`9knkYn8_QZpE`, vestria). The spec's diagnosis ("snapshot resolver guesses
`#contact`") was a misdiagnosis: `#contact` is the block's schema default.

Per-template wiring (verified): meridian = wired everywhere; techpremium = hero/cta wired but the
**header prefers the flat prop** (`TechPremiumNav.published.tsx:42`: `props.cta_href || resolveCtaHref(...)`);
vestria = flat hero+header; granth = flat hero.

**Goal:** one template-agnostic render-time bridge so flat-`*_href` blocks pick up the resolved goal
destination, in BOTH renderers, without touching any template block or `.core.tsx`.

**Design (pinned):**
- Bridge lives in `normalizeCtas` (the single chokepoint both renderers already call). For each
  allowlisted primary key that carries a resolved `cta`, ALSO write the resolved href into the
  sibling flat href element: `cta_text` → `elements.cta_href`.
- **Only bridge when the element's `cta.dest` is `'GOAL_REF'`.** An explicit (detached) `Destination`
  must NOT overwrite a flat href — and neither must a user-set `cta_href` (vestria's
  `LinkTargetPopover` at `editPrimitives.tsx:124` writes `elements.cta_href` directly). Detach and
  manual-href both win over the bridge. This preserves spec criterion 5.
- Bridge writes into the transient `normalizeCtas` clone only — never persisted (same contract as the
  existing `buttonConfig` down-conversion).
- Legacy no-migration contract unchanged: `if (!cta) continue;` — an element with no `cta` is never bridged.

**Steps:**
1. Verify the stamp actually lands on vestria/granth: phase 1 stamps a key only when it exists in
   `section.elements` or existing metadata (no phantom stamps). Confirm vestria hero/header sections
   carry a `cta_text` element (label) alongside `cta_href`. **If `cta_text` is absent, the stamp never
   fires and the bridge has nothing to read — STOP and report**, because the fix would then need a
   different key source (do not improvise a phantom stamp).
2. Implement the bridge in `normalizeCtas.ts` with the GOAL_REF-only guard above.
3. Fix the techpremium header precedence (`TechPremiumNav.published.tsx:42`) so a bridged/resolved
   destination is not shadowed by a stale flat `cta_href`. Keep the dual-renderer pair in sync
   (`.tsx` + `.published.tsx`) per the dual-renderer law.
4. Tests: vestria + granth multipage → home hero/header emit `href="/contact"` (bare); single-page →
   `#form-section`; detached explicit `Destination` and a user-set `cta_href` both survive un-bridged;
   legacy metadata-less content unchanged (reuse the frozen fixture).

**Files touched:**
- `src/utils/normalizeCtas.ts`
- `src/modules/templates/techpremium/blocks/Header/TechPremiumNav.published.tsx` (`.tsx` pair NOT touched — verified it computes no href, so it does not share the precedence bug)
- `src/utils/normalizeCtas.bridge.test.ts` (new)
- `src/lib/staticExport/__tests__/multipageGoalRef.test.ts` (extend: vestria case)

**Verification:**
- `npx tsc --noEmit`; `npm run test:run` (1834+ stay green)
- Acceptance mapped: criterion 3 (multipage vestria repro) now actually achievable at the render layer.

## Phase 4 — Parity + re-point + detach tests (test-only)

**Goal:** lock the three already-satisfied-by-machinery acceptance criteria with tests, using the phase-3 `buildNormalizeCtasContext` builder (no contingent production edits left in this phase).

**Steps:**
1. Parity test per D-B: given identical content, build ctx via `buildNormalizeCtasContext` exactly as each renderer does; assert the normalized `buttonConfig`/`resolveCtaHref` output is identical for edit and published entries — including a multipage case with a chrome header CTA (content sourced from the phase-1 real-assembly builder, not pre-stamped).
2. Re-point test: same content, two different `goal` values in ctx → every GOAL_REF primary's resolved href changes accordingly (render-time resolution; publish freshness already guaranteed by `getPublishedGoal`).
3. Detach test: element with explicit `Destination` (the shape `ButtonConfigurationModal.buildCtaButton` writes) is untouched by goal change.

**Files touched:**
- `src/utils/normalizeCtas.parity.test.ts` (new)

**Verification:**
- `npx tsc --noEmit`
- `npm run test:run -- normalizeCtas`
- Acceptance mapped: "identical hrefs parity test", "programmatic goal change re-points", "detached button untouched."

## Phase 5 — M2–M5 resolution matrix + cross-template allowlist coverage

**Goal:** all five mechanisms (M1 form, M2 direct channel, M3 external, M4 subscribe/follow, M5 scroll/anchor — spec prose omitted M5; plan covers all five) **resolve** correctly (stamping already universal on both paths since phase 1), and the allowlist covers all 6 templates (meridian, techpremium, hearth, lex, surge, lumen) including their non-`#cta` fallbacks (`#contact`/`#work`).

**Steps:**
1. Audit `goalToDestination` M2–M5 branches against `goal.param` shapes (`brief.schema.ts:27-51`): M2 whatsapp/call/email, M3 external url, M4 social platform url, M5 anchor. Fix only proven gaps; phase-1 param-less path applies to each.
2. Verify allowlist coverage per template: grep each template's `.published.tsx` CTA keys (the phase-1 guard test enforces this mechanically, both call-site syntaxes); if a template's genuine primary uses a key other than `cta_text`, extend the allowlist in `stampGoalRefCtas.ts` + guard test. `signin_text`/pricing-tier keys stay excluded.
3. Tests: per-mechanism resolution matrix in `goalToDestination.test.ts`; `stampGoalRefCtas.test.ts` cases on service section lists (awareness-driven ordering shapes); keep `injectGoalSections.test.ts` green.

**Files touched:**
- `src/modules/goals/goalToDestination.ts` (only proven gaps)
- `src/modules/goals/stampGoalRefCtas.ts` (only if a template needs an allowlist extension)
- `src/modules/goals/__tests__/ctaKeyAllowlist.test.ts` (in lockstep with any allowlist change)
- `src/modules/goals/goalToDestination.test.ts`
- `src/modules/goals/stampGoalRefCtas.test.ts`
- `src/modules/goals/injectGoalSections.test.ts` (assert green; update only if fixtures shifted)

**Verification:**
- `npx tsc --noEmit`
- `npm run test:run`
- Acceptance mapped: "M3 with param → external URL; param-less → no dead href" (+ M2/M4/M5 matrix).

## Phase 6 — Full verification + manual repro parity check  **[HUMAN GATE]**

**Goal:** everything green end-to-end; user signs off on live editor↔published parity before merge.

**Steps:**
1. `npx tsc --noEmit` + full `npm run test:run` + `npm run build` (build required: published renderer + static export touched; build ≠ next build — runs published-CSS/assets scripts first).
2. Walk the spec acceptance checklist; map each criterion to its passing test (criterion 1 incl. the multipage generation-layer assertion — real assembly emits GOAL_REF, NO resolved snapshots — phase 1; criterion 3 satisfied per the Spec deviation: bare `pathSlug`, real-assembly exporter test — phase 3).
3. **HUMAN GATE (per spec):** user manually verifies on `npm run dev`: repro `I9HwKOYo9jsm` (single-page meridian — all primaries hit form anchor, editor and published identical) and `9knkYn8_QZpE` (multipage vestria — a FRESH generation stamps GOAL_REF, home primary navigates to the contact page, header CTA included, published HTML live-checked). No merge before sign-off. Merge to main is itself a human gate per branch rules.

**Files touched:**
- none (verification only; fixes discovered here go back to the owning phase's file list)

**Verification:**
- `npx tsc --noEmit && npm run test:run && npm run build` all green; manual checklist signed off by user.

---

## Explicitly NOT in this plan
- Data migration of existing projects (spec forbids; legacy renders via shim/fallback unchanged).
- **Regenerate routes** (`regenerate-content`/`-section`/`-element`) re-running the stamp — pre-existing gap shared with scale-05's `seedGoalForm`; documented under Known limitation, separate ticket.
- `/p/<slug>/` href prefixing for page dests (Spec deviation — pre-existing nav-link behavior, separate ticket).
- Pricing-tier CTAs (`tiers_cta_*`/`packages_cta_*`) and `signin_text` — never stamped (D-A).
- Links, secondary CTAs, beacons/analytics, place-intent, goal-editor UI, ButtonConfigurationModal discoverability.
- Wiring the dead `ctaHandler.ts`/`FormConnectedButton.tsx` edit click path (D-B; deleting it is separate cleanup).
- Visually-disabled param-less button styling (ratified #4: `'#'` no-op).
- Prompt/copy changes (D-D invariant).
