# goal-ref-cta — implementation audit

## Phase 1 — GOAL_REF stamping for ALL mechanisms on BOTH generation paths

### Files changed
- `src/modules/goals/stampGoalRefCtas.ts` (new) — the plain-module GOAL_REF stamper.
- `src/modules/goals/stampGoalRefCtas.test.ts` (new) — unit tests.
- `src/modules/goals/__tests__/ctaKeyAllowlist.test.ts` (new) — D-A guard test.
- `src/modules/goals/seedGoalForm.ts` — stripped the resolved-snapshot `cta` write.
- `src/modules/wizard/generation/finalize.ts` — single-page stamp wiring.
- `src/modules/wizard/generation/thing.ts` — one-line multipage call-site change.
- `src/modules/generation/multiPageAssembly.ts` — `finalizeMultiPageGeneration` signature + stamp calls.
- `src/modules/generation/multiPageAssembly.goalRef.test.ts` (new) — BB3 real-assembly test.
- `src/modules/goals/goalToDestination.ts` — D-C param-less `null` degradation.
- `src/utils/normalizeCtas.ts` — map `null` → inert `#` no-op.
- `src/modules/goals/seedGoalForm.test.ts` — updated snapshot-cta assertion.
- `src/modules/goals/goalToDestination.test.ts` — M2/M3/M4 param-less → `null`.
- `src/modules/goals/__tests__/acceptance.scale05.test.ts` — corrected an aspirational comment.

### Phase 1 step 1 — required pre-step finding (CONFIRMED IN CODE)

Read `seedGoalForm.ts` end to end. **Confirmed: hero/header receive NO `cta` metadata today.**
- `seedGoalForm` writes CTA metadata to exactly ONE section: `targetId = cta ?? contact ?? hero`
  (the `findSectionIdByType` fallback chain, old `:92-96`). In the normal case a `cta` section
  exists, so hero and header are never touched.
- What it wrote there (old `:143-152`) was a **resolved snapshot**
  `cta = { role:'primary', dest:{kind:'section',anchor:'form-section'}, formId }` — this is F6
  (a resolved dest can never re-point).
- The comment at `acceptance.scale05.test.ts:61` ("the real generation writes this") was
  **aspirational, not true**: the hero GOAL_REF in `makePage()` is hand-authored by the test,
  not produced by `seedGoalForm`. Phase 1 makes it true via `stampGoalRefCtas`; I updated that
  comment to say so.

This finding is what the acceptance-test rewrites depend on: the strip removes the snapshot, and
the new stamp writes `dest:'GOAL_REF'` on hero/header/cta alike.

### Sole-form invariant (PINNED)

`resolveGoalFormId(forms, goal)` reads the M1 formId back from the tree's `forms` map (never
generates it — `seedGoalForm` returns void; multipage's `ensureSiteContactForm` is internal to the
merge). **Both generation paths cap at ≤1 form:** `ensureSiteContactForm` is idempotent by name
`'Contact'` (`multiPageAssembly.ts:65-67`); `seedGoalForm` no-ops when any form exists
(`seedGoalForm.ts:85`). So the single-entry branch always fires today. The `name === 'Contact'`
preference is a guard for a hypothetical future second form — **if a second form is ever
introduced on a generation path, this lookup rule must be revisited** rather than silently
dangling a formId. Pinned here per plan-review non-negotiable #5.

### Per-file changes

**`stampGoalRefCtas.ts` (new).** Plain module (no `'use client'`, imports only types). Exports:
- `GOAL_REF_STAMP_KEYS = ['cta_text']` — the D-A allowlist (single source; the guard test imports it).
- `resolveGoalFormId(forms, goal)` — non-M1 → undefined; sole-form → that id; multi → `Contact`-named.
- `stampSectionGoalRefCtas(section, goal, formId?)` — stamps a lone section (chrome header).
- `stampGoalRefCtas(contentTree, {goal, formId?})` — stamps every section in a content map.
Behavior: stamps `elementMetadata[key].cta = {role:'primary', dest:'GOAL_REF'}` (+`formId` iff M1
and formId defined); creates `elementMetadata` where missing; preserves an existing entry's
`buttonConfig`; idempotent; `goal==null` → no-op. **Stamps a key only when it is present in
`section.elements` (or already in `elementMetadata`)** — never phantom-stamps `cta_text` onto a
section that renders no such button. M1 = `mechanism==='M1' || intent==='subscribe-newsletter'`
(matches `seedGoalForm`).

**`seedGoalForm.ts`.** Surgical strip per non-negotiable #6: removed ONLY the resolved `cta` object
construction (old `:143-147`) and changed the assignment from `{ buttonConfig, cta }` to
`{ buttonConfig }`. Kept `buttonConfig`, `cta_embed`, `section.cta`, form instantiation, and the
`leadForm-<uuid>` injection. Updated the header doc comment to describe the new split.

**`finalize.ts`.** Added `stampGoalRefCtas(finalContent.content, { goal: briefGoal, formId:
resolveGoalFormId(finalContent.forms, briefGoal) })` immediately AFTER `seedGoalForm` and before
`injectGoalSections`. Order pinned so the M1 formId points at the just-seeded form. On the
single-page path the header is an ordinary section inside `finalContent.content`, so this one call
covers hero/header/cta — confirmed by the stamp iterating the whole `content` map.

**`multiPageAssembly.ts`.** `finalizeMultiPageGeneration(fc, briefGoal?)` — optional param
(existing no-goal callers stay green). When a goal exists it stamps all three trees explicitly:
`fc.pages[*].content` (every page incl. collection items), `fc.chrome.header.data` +
`fc.chrome.footer.data` (single-section helper), and the flat `fc.content`. Reads formId via
`resolveGoalFormId(fc.forms, briefGoal)`. Redundant writes over shared refs are safe (idempotent);
each tree carries its own stamp so it survives JSON persistence (refs de-alias).

**`thing.ts`.** Single change: `finalizeMultiPageGeneration(fc)` → `finalizeMultiPageGeneration(fc,
briefGoal)` at `:527`. `briefGoal` is the in-scope closure var (`:338`). Reached by both fresh
(`:690`) and resume (`:544`) entries — both converge through `runFanOut`.

**`goalToDestination.ts` + `normalizeCtas.ts`.** D-C param-less degradation: M2 (phone/email), M3
(url), M4 (links) now return `null` when the required param is missing (was `undefined`). Return
type widened to `GoalDestination | null | undefined`. `normalizeCtas.ctaToButtonConfig` maps
`null` → `{ type:'link', url:'#' }` (inert no-op), `undefined` → leave-untouched. M1/M5 keep
working defaults (M5's missing-destination stays `undefined`; M2's malformed-but-present dest stays
`undefined`).

### Deviations from the plan

1. **`newsletter_cta` added to the guard's known-excluded set.** The plan enumerated the CTA key
   set as `cta_text`, `secondary_cta_text`, `signin_text`, `tiers_cta_*`, `packages_cta_*`. Grep
   found a sixth key — `newsletter_cta` (footer newsletter capture in
   `HairlineFooter.published.tsx:51` and `TechPremiumFooter.published.tsx:43`). It is a footer
   newsletter CTA, not a primary conversion CTA, so per D-A it stays EXCLUDED (only `cta_text` is
   stamped). I added it to `KNOWN_EXCLUDED_EXACT` in the guard test so the guard does not
   false-positive on day one. This is the conservative choice, confined to a Files-touched file,
   logged here per the in-scope-ambiguity rule.

No other deviations. No files outside the phase-1 Files-touched list were modified.

### Out-of-scope path recorded (per non-negotiable #9)

`thing.ts:555` routes `templateId === 'techpremium'` to `buildTechPremiumHomeFinalContent`
(`src/hooks/editStore/archetypes.ts:260`), returning at `:580` WITHOUT touching `finalize.ts` or
`runFanOut`, so it never reaches `stampGoalRefCtas`. It hardcodes `cta_text:'Contact Sales'` /
`cta_href:'/contact'`, and `MeridianNavHeader.published.tsx:41` ignores `cta_href` and reads
`elementMetadata.cta_text.buttonConfig`, so this bespoke single-tenant (naayom) seed ships a
metadata-less header primary. It is OUTSIDE the spec's meridian/vestria repros and is
**deliberately not addressed in this phase.** Recorded here as a known, unaddressed generation
seam.

### Test results

- `npx tsc --noEmit`: clean.
- `npx vitest run src/modules/goals src/modules/generation src/utils/normalizeCtas`: 13 files, 193
  tests passed.
- `npm run test:run` (full): 110 passed | 1 skipped (111 files); 1817 passed | 3 skipped tests; 0
  failures. All pre-existing service-intent `seedGoalForm`, acceptance, and multipage-assembly
  suites stay green.
- `npm run build`: NOT run (reserved for phase 6 per plan).

New tests added:
- `stampGoalRefCtas.test.ts`: M1–M5 stamping, metadata-created-where-missing, formId M1-only
  (absent M2–M5 even if passed), excluded keys untouched, no-phantom-stamp, literal-string dest
  (no snapshot), null-goal no-op, idempotence, `resolveGoalFormId` sole-form + Contact-preference +
  non-M1.
- `multiPageAssembly.goalRef.test.ts` (BB3): fc built through REAL assembly from UNSTAMPED copy
  fixtures; asserts hero + cta (page body) + header (chrome) + flat `fc.content` all carry
  `{role:'primary', dest:'GOAL_REF', formId}`; formId equals the `ensureSiteContactForm` id;
  `dest` is the literal string (no snapshot object anywhere, incl. after JSON round-trip); excluded
  keys untouched; no-goal finalize leaves everything metadata-less.
- `ctaKeyAllowlist.test.ts`: scans every `.published.tsx`, handles both dot and bracket
  template-literal call-site syntaxes, fails on any unclassified CTA metadata key.

### Open risks

- **Header presence at generation.** Stamping is gated on `cta_text` being present in a section's
  `elements`. If a real template's generated header copy omits `cta_text`, its header primary would
  not be stamped and would fall to the template fallback (`#cta`). The multipage test asserts the
  header carries `cta_text`; real-generation header copy shape is verified at the phase 6 manual
  gate.
- **`useReviewState` behavior change** (a GOAL_REF primary under an external-url goal now
  down-converts to `{type:'link',url}` and may register as "linked") is a phase-2 reader-impact item
  — not evaluated here.
- The techpremium/naayom seam above is a live gap for that one tenant until a follow-up addresses it.

---

## Phase 1 — impl-review verdict: **ship** (loop 1, no blocking issues)

Gate: `npx tsc --noEmit` exit 0 · `npm run test:run` 1817 passed / 3 skipped / 0 failures.

Reviewer-verified (independent of implementer's log):
- Multipage test uses REAL assembly over unstamped fixtures (asserted unstamped on input) — not a
  false green. `acceptance.scale05.test.ts` hero fixture stays hand-authored, which is legitimate:
  it is a resolution-level test; generation-produces-GOAL_REF is proven by `multiPageAssembly.goalRef.test.ts`.
- Negative assertion present: `dest === 'GOAL_REF'` literal across all trees, incl. post-JSON-roundtrip.
- Idempotency tested; shared-ref double-stamp (`fc.content` aliases home + chrome) is safe.
- Allowlist guard regex handles BOTH dot and bracket-template-literal call sites; a new unlisted key
  would push to `offenders` and fail the test. All 6 live keys classified.
- Boundary law holds: `stampGoalRefCtas.ts` imports types only; no `'use client'` transitively.
- `seedGoalForm` strip surgical: `buttonConfig`, `cta_embed`, `section.cta`, form creation, leadForm
  injection all survive.
- `resolveGoalFormId` returns `undefined` for non-M1 / 0 forms — never dangling.
- Copy invariant intact (nothing under `src/modules/prompt/` touched).

Non-blocking notes carried forward:
1. **Stamp overwrites `cta` unconditionally** (`{...entry, cta}`). Safe now — both call sites run only
   at generation, before any user detach can exist. **Carry into the deferred regenerate-path fix:**
   do NOT route edited content through this stamp, or a user-detached explicit `Destination` gets
   clobbered. Detach-at-render is preserved via `normalizeCtas.ts:69-77` else-branch.
2. No direct `normalizeCtas`-layer test for the `null`→`'#'` inert mapping (tested at
   `goalToDestination` level). Phase 4 parity tests should cover it.
3. Untracked `docs/task/serve-gate-v2.spec.md` + `scripts/renderPage.mjs` are concurrent work,
   outside this phase's scope — deliberately NOT committed with phase 1.

---

## Phase 2 — Dual-read shim coverage + legacy fixture regression + reader-impact analysis

### Files changed
- `src/utils/__fixtures__/legacyCta.fixture.ts` (new) — frozen pre-feature content blob + expected hrefs.
- `src/utils/normalizeCtas.legacy.test.ts` (new) — frozen-fixture regression test.

**No production code changed.** `destinationShim.ts` was audited and needed NO edit (see below); the four reader-impact call sites were read-only checks and needed no edit.

### Shim coverage audit — every matrix case already covered (test, not code)

Audited `src/utils/destinationShim.ts` (`toDestination` `:107`, `LegacyButtonConfig` `:22`,
`classifyString` `:49`, `parseWhatsapp` `:70`) against the spec migration matrix. Result: **all
cases already covered; no gaps; no code added.**

| Legacy shape | Handled at | Covered? | Existing test |
|---|---|---|---|
| raw `#x` -> `{kind:'section'}` | `classifyString:50` | already | `destinationShim.test.ts:7` |
| raw `/x` -> `{kind:'page'}` | `classifyString:53` | already | `:13` |
| absolute `https?://` url -> `{kind:'external'}` | `classifyString:65` | already | `:51` |
| raw `tel:` -> `{kind:'call'}` | `classifyString:56` | already | `:19` |
| raw `mailto:` -> `{kind:'email'}` | `classifyString:59` | already | `:25` |
| raw `wa.me/...` / `api.whatsapp.com/send` -> `{kind:'whatsapp'}` | `classifyString:62` -> `parseWhatsapp` | already | `:31`,`:37`,`:43` |
| unrecognized string -> `{kind:'external'}` verbatim | `classifyString:66` | already | `:57` |
| legacy `buttonConfig {type:'page'}` | `toDestination:127` | already | `:65` |
| legacy `{type:'link'|'link-with-input'}` (url reparsed) | `toDestination:129` | already | `:70`,`:81` |
| legacy `{type:'form'}` -> `undefined` (wrapper owns it) | `toDestination:139` | already | `:92` |
| unknown/absent type -> `undefined` | `toDestination:142` | already | `:96` |

Because coverage is complete, I did **not** touch `destinationShim.ts` or the existing
comprehensive `destinationShim.test.ts` (plan lists both as touch-only-if-gap / create-if-absent;
neither condition held). Newly-added shim cases: **none.** Everything in the matrix was pre-covered
by scale-04.

### No-migration contract verified (`normalizeCtas.ts:113`, `if (!cta) continue;`)

Confirmed in code: `normalizeCtas` (`:97-129`) iterates `elementMetadata`, and any entry without a
`cta` key hits `if (!cta) continue;` (`:113`) — never cloned, never touched. With NO `cta` key
anywhere in the fixture, `contentClone` stays `null` and the function returns the SAME reference
(`:128`). The new regression test asserts `normalizeCtas(fixture) === fixture` (identity) under both
an active M1 goal and a null goal, plus a `JSON.stringify` byte-equality assertion and a negative
assertion that no `GOAL_REF`/`cta` string is ever injected into legacy content. No-migration
contract locked; a future "helpful" GOAL_REF upgrade of legacy content fails the test.

### Reader-impact analysis (code evidence)

**1. `persistenceActions.ts:202` — orphaned-form audit. No change.** Reads
`element?.metadata?.buttonConfig` where `element` iterates `section.elements` (`:201`) — i.e. the
`elements[key].metadata` shape. The phase-1 stamps write to `section.elementMetadata[key].cta` — a
DIFFERENT, sibling map (`elementMetadata` != `elements[key].metadata`). Two independent reasons the
stamp is invisible: (a) wrong container, (b) the audit only matches `buttonConfig.type==='form'` and
stamps write `cta`, never a persisted `buttonConfig`. So GOAL_REF stamps neither false-positive the
orphan warning nor get detected by it. Matches the plan's expected conclusion.

**2. `useReviewState.ts:258` (`isPrimaryCtaLinked`) — plan's premise did NOT materialize; benign.**
The plan feared a GOAL_REF primary under an external-url goal (M3) would down-convert to
`{type:'link',url}` and newly register as "linked". Traced the data flow and the premise does not
hold: `normalizeCtas` is called ONLY inside the two renderers (`LandingPageRenderer.tsx:131`,
`LandingPagePublishedRenderer.tsx:76`), each producing a TRANSIENT render clone that is never
written back to the store. `useReviewState.initFromContent` is fed `updatedState.content` — the RAW
store content (`EditProvider.tsx:190-198`). In raw store content a GOAL_REF stamp is
`elementMetadata[key].cta` with NO `buttonConfig`, so `isPrimaryCtaLinked` (`:258`, reads
`elementMetadata[key].buttonConfig`) sees `undefined` -> returns false. Net: the down-conversion is
never visible to this reader, so no reclassification to "linked" occurs.
- Verdict: **benign, no user-visible wrong state** — no STOP. Since stamps write `cta` not
  `buttonConfig`, a GOAL_REF primary is classified NOT-linked, same bucket as a form-connected
  primary (`type:'form'` also fails the `type==='link'` check). Effect: the "Link your CTA buttons"
  guide task can show not-done for a primary that is in fact goal-linked — a minor nudge quirk, not
  a broken href or corrupted state, and essentially unchanged from pre-feature (hero/header had no
  metadata at all -> already not-linked). Recorded as accepted known behavior. (Refines the phase-1
  open risk that flagged this item as unevaluated.)

**3. `formActions.ts:65-68` — form-disconnect. Green, no change.** Iterates
`section.elementMetadata[key].buttonConfig.formId === id` and rewrites that `buttonConfig`. Stamps
write `cta`, not `buttonConfig`, so a GOAL_REF stamp is never matched/mutated. `seedGoalForm` still
writes the M1 form `buttonConfig` on its target section (phase 1 kept it), so real form-disconnect
behavior is unchanged.

**4. `sectionHelpers.ts:20-24` (`deriveCtaRole`) — green, no change.** Reads `cta.role`; a stamped
`cta.role:'primary'` classifies primary — correct, and consistent with D-A (deriveCtaRole is a
secondary guard, never the stamping enumerator).

**5. `FormPlacementRenderer.tsx:59-76` — green, no change.** Reads `element.metadata?.buttonConfig`
(the `elements[key].metadata` shape, same container distinction as #1). GOAL_REF stamps live in
`elementMetadata`, so they do not reach this scanner; template-shipped form buttons (real
`buttonConfig type:'form'`) still render as before.

All five checks were read-only; none required an edit, so no scope expansion.

### `form-section` anchor constant

Untouched and unaffected by phase 2 (no goalToDestination/leadFormFields edits). The frozen fixture
exercises a legacy `{type:'form'}` button resolving to `#form-section` via `resolveCtaHref` — the
constant is asserted in the frozen expected hrefs.

### Boundary law

Both new files are plain modules: the fixture imports nothing; the test imports only `normalizeCtas`,
`resolveCtaHref`, types, and the fixture. No `'use client'`, no client-store imports.

### Deviations from the plan
None. `destinationShim.ts` and `destinationShim.test.ts` were on the Files-touched list only as
conditional ("if gaps found" / "create if absent"); coverage was complete and the test file already
existed and is comprehensive, so both were left untouched. No files outside the phase-2
Files-touched list were modified.

### Test results
- `npx tsc --noEmit`: clean.
- `npx vitest run src/utils`: 7 files, 103 tests passed.
- `npm run test:run` (full): 111 passed | 1 skipped (112 files); 1827 passed | 3 skipped (1830) — up
  from phase 1's 1817 by the 10 new legacy-fixture cases; phase-1 suites stay green. 0 failures.
- `npm run build`: NOT run (reserved for phase 6).

### Open risks
- The `useReviewState` guide-task quirk (a goal-linked primary can show as "Link your CTA buttons"
  not-done) is benign and accepted; if a future phase routes normalized content into review state,
  re-evaluate `isPrimaryCtaLinked`.
- The frozen fixture is representative, not exhaustive (5 buttons across hero/cta/header/features/
  footer). It covers every shim branch reachable via `buttonConfig`; raw string branches
  (tel/mailto/wa.me) are locked by the existing `destinationShim.test.ts`.

---

## Phase 2 — impl-review verdict: **ship** (loop 1, no blocking issues)

Gate: `npx tsc --noEmit` exit 0 · `npm run test:run` 1827 passed / 3 skipped / 0 failures
(+10 vs phase 1; all phase-1 suites green).

Reviewer-verified independently:
- "No production code changed" is TRUE (`git diff HEAD --stat`: audit + plan progress-log SHA only;
  fixture + legacy test untracked-new).
- Shim coverage claim is HONEST, not skipped work: every migration-matrix cell has BOTH code and an
  existing test (`#x`→section, `/x`→page, url→external, `tel:`→call, `mailto:`→email,
  `wa.me`/`api.whatsapp.com`→whatsapp, unknown→external verbatim, + legacy buttonConfig types).
  No cell lacks both. Zero shim edits needed.
- Frozen fixture is genuinely PRE-feature (no `cta` key, no `GOAL_REF`), deep-frozen, and exercises
  raw `#pricing` / `/contact` / external-url / legacy `{type:'form'}` / fully metadata-less button.
- Legacy test is meaningful, not decorative: reference-identity is load-bearing because
  `normalizeCtas` clones ONLY when it finds a `cta`. A "helpful" legacy→GOAL_REF upgrade would fail
  (clone breaks identity, deep-freeze throws, substring assertions catch it).

### Retired risk: the `useReviewState` behavior change does NOT exist
Round-1 plan review recorded that an M3 GOAL_REF primary would down-convert to `{type:'link',url}`
and newly register as "linked" at `useReviewState.ts:258`. **Verified false, end-to-end:**
- `EditProvider.tsx:190-198` feeds `initFromContent` the RAW store content.
- `normalizeCtas(` has exactly two production call sites (`LandingPageRenderer.tsx:131`,
  `LandingPagePublishedRenderer.tsx:76`) — both transient render clones, never persisted, never
  passed to review state.
- `isPrimaryCtaLinked` reads `elementMetadata[key].buttonConfig` + section-level `sectionData.cta`,
  never the element-level `elementMetadata[key].cta` a stamp writes → returns false.
Remaining effect is a benign classification quirk (a goal-linked primary may leave the "Link CTAs"
guide task not-done). Accepted; no longer tracked as a behavior change.

### Reader-impact conclusions (code-verified)
- `persistenceActions.ts:202` reads `elements[key].metadata.buttonConfig` — a DIFFERENT container
  from the written `elementMetadata[key].cta`, and only matches `type:'form'`. Stamps are invisible
  to the orphaned-form audit: no false positives, and no detection either.
- `formActions.ts:65-68`, `sectionHelpers.ts` `deriveCtaRole`, `FormPlacementRenderer.tsx:59-76`:
  green, no edits.

Non-blocking note: the frozen fixture is representative, not exhaustive — raw `tel:`/`mailto:`/`wa.me`
string branches are covered by `destinationShim.test.ts` rather than the render fixture. Accepted.

---

## Phase 3 — Multipage M1 cross-page `page` dest + chrome/header reach + shared ctx builder (F23 resolution half)

### Files changed
- `src/modules/goals/goalToDestination.ts` — M1 branch: cross-page `page` dest when the form is on another page.
- `src/utils/normalizeCtas.ts` — widened `NormalizeCtasContext`; added `CtaPageInput`, `findFormPagePath`, `buildNormalizeCtasContext`; threaded the new fields into `goalToDestination`.
- `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx` — new `currentPagePath`/`formPagePath` props, ctx built via `buildNormalizeCtasContext`.
- `src/modules/generatedLanding/LandingPageRenderer.tsx` — derive active-page path + form-page from the store's `pages`/`currentPageId`, ctx via `buildNormalizeCtasContext`; single-page (<=1 page) degrades to `{goal,forms}`.
- `src/lib/staticExport/htmlGenerator.ts` — `StaticHTMLOptions` gains `currentPagePath`/`formPagePath`; passed to the renderer.
- `src/lib/staticExport/renderPublishedExport.ts` — one-time page scan; per-render `currentPagePath` + `findFormPagePath(...)` at root + subpage sites.
- `src/modules/goals/goalToDestination.test.ts` — M1 same-page vs cross-page + fragment-less page dest cases.
- `src/lib/staticExport/__tests__/multipageGoalRef.test.ts` (new) — exporter-level test on REAL assembly.

### Pinned form-bearing-page predicate (`pageHasFormSection`, normalizeCtas.ts)
A page holds the conversion form when its content map has EITHER a section whose id starts with `leadForm-` (single-page seeded lead form), OR any section carrying a non-empty `elements.form_id` string. `form_id` is the multipage marker: `mergePageIntoFinalContent` sets `content[contactId].elements.form_id` on the `contact` section when a page's `bodyTypes.includes('contact')` (`multiPageAssembly.ts:189-192`). Structural (no `archetypeKey`), so it works on the published shape. `findFormPagePath(pages, currentPagePath)` PREFERS the current page when it holds a form (same-page anchor), else the first page that does (cross-page dest), else `undefined` (M1 same-page anchor = single-page behavior). Verified asymmetry (plan section 5): `seedGoalForm` injects into the HOME array and is idempotent when a form already ships, so the genuine cross-page case is a TEMPLATE-shipped contact form — the F23 repro shape (form only on `/contact`).

### Exact `NormalizeCtasContext` shape settled
`{ goal?, forms?, currentPagePath?: string, formPagePath?: string }` — template- and store-agnostic (no `PageAxisState`, no `subpages` shape leaks in). The two callers converge via `buildNormalizeCtasContext({ goal, forms, currentPagePath, formPagePath?, pages? })`: the edit renderer passes `pages` (scanned here via `findFormPagePath` — the DRY predicate); the published exporter passes a precomputed `formPagePath` (it alone holds every page). `CtaPageInput = { path: string; content: Record<string,any> | undefined }` is the normalized scan input both sides build. M1 resolution (goalToDestination): `formPagePath && currentPagePath && formPagePath !== currentPagePath` yields `{ dest:{kind:'page', pathSlug: formPagePath} }` with **NO `formId` key** (a page dest is navigation, so normalizeCtas' `'formId' in gd` form-detection stays false => `{type:'page'}`, never `{type:'form'}`). Else `{ dest:{kind:'section', anchor:'form-section'}, formId }`.

### Edit-side chrome/header finding (section 8) — NO STOP required
The edit path DOES re-merge chrome into the top-level `content` that `normalizeCtas(rawContent)` consumes. `loadPageIntoActive` (`pageHelpers.ts:129`) builds the working copy via `withChrome(body, state.chrome)` (`pageHelpers.ts:82-100`), which puts `chrome.header.id` -> `content[header.id] = chrome.header.data` at the front of the active page. So the stamped header section is present in the edit-side `content`; `normalizeCtas` covers it. Inverse of the `persistenceActions.ts:218+` split, exactly as the plan anticipated. No bypass; no scope addition needed.

### Deviation (logged) + STOP-FLAG finding
**The F23 repro template `vestria` does NOT consume the GOAL_REF/`buttonConfig` resolution — its render is UNAFFECTED by this fix.** Vestria's hero (`VestriaTailoredHero.core.tsx:48`) and header (`VestriaNavHeader.core.tsx:89`) render `content.cta_href` — a FLAT `ai_generated` element (schema default `#contact`, `product/elementSchema.ts:788`) — through `publishedPrimitives.tsx` `Link` (which takes `href` verbatim, never calls `resolveCtaHref`). Phase 1 stamps `elementMetadata.cta_text.cta`; normalizeCtas down-converts it to `elementMetadata.cta_text.buttonConfig`; but vestria reads NEITHER — so its primary CTA href stays the flat `cta_href` (`#contact`). That flat `#contact` default IS the F23 "scrolls nowhere" symptom (the spec's "snapshot resolver guesses `#contact`" was a misdiagnosis — it is the schema default, not a resolved snapshot). Granth reads flat `cta_href` the same way; techpremium is mixed.

Consequence: **this plan (phases 1+3) does NOT fix F23 on vestria at the render layer.** The resolution IS correct and template-agnostic for every template whose blocks consume `buttonConfig` via `resolveCtaHref` (meridian hero/header/cta, hearth, shared blocks). Wiring vestria's flat-`cta_href` blocks to the goal resolution (or a `*_href`-from-`elementMetadata[key].buttonConfig` bridge in the render path) is OUTSIDE phase 3's Files-touched — flagged to the orchestrator, NOT edited here.

Because of this, the exporter test (plan step 6 / non-negotiable 11) uses **meridian** (fully `buttonConfig`-wired) instead of vestria, so the HTML assertion is real: on a vestria fixture the same test would assert nothing (vestria emits `#contact` regardless). The test still drives REAL assembly (unstamped copy in -> `finalizeMultiPageGeneration(fc, goal)` -> stamp out), the exporter's real HTML producer (`generateStaticHTML`), and the real `findFormPagePath` scan — a false-green fixture pre-carrying `{kind:'page'}` is not used. `'server-only'` is mocked to an empty module so the exporter runs under vitest (jsdom); no precedent test exercised `generateStaticHTML` live.

### Non-negotiable 11 mapping (meridian, real assembly)
- Home hero + header + cta primaries -> `href="/contact"` (bare pathSlug; asserted >=3 occurrences; asserted NOT `/p/acme/contact`).
- Contact page (the form page) own primary -> `href="#form-section"` (asserted; asserted NOT `/contact`).
- Single-page (no pages/formPagePath, form on the page) -> `href="#form-section"` — no regression.
- Unstamped-in guard: assembled fc has no `elementMetadata` before finalize, and `findFormPagePath([home], '/')` is `undefined` (home holds no form).

### Test results
- `npx tsc --noEmit`: clean.
- `npx vitest run src/lib/staticExport src/modules/goals src/utils/normalizeCtas.test.ts`: 16 files, 203 passed.
- `npm run test:run` (full): 112 passed | 1 skipped (113 files); 1834 passed | 3 skipped (1837) — up from phase 2's 1827 by 4 exporter + 3 goalToDestination cases. 0 failures.
- `npm run build`: NOT run (reserved for phase 6).

### Open risks
- **F23 NOT fixed for vestria/granth/flat-`cta_href` templates** (STOP-flag above) — needs a follow-up to wire those blocks to the goal resolution; the phase-6 manual gate on `9knkYn8_QZpE` (vestria) will FAIL until then.
- "Identical header href in root + subpage" (plan step 6 wording): per-page resolution makes the shared header CTA resolve to `/contact` on home but `#form-section` on the contact page — both correct (both lead to the form), but the strings DIFFER by design. The test follows non-negotiable 11 (home->`/contact`, contact->`#form-section`), not the looser "identical" phrasing.
- Multi-form pages: `findFormPagePath` prefers the current page, so a page with its own form always self-anchors; a project with forms on several non-current pages resolves to the FIRST — acceptable for the single-conversion model, revisit if multi-form sites arrive.

---

## Phase 3 — impl-review verdict: **ship** (loop 1, no blocking issues)

Gate: `npx tsc --noEmit` exit 0 · `npm run test:run` 1834 passed / 3 skipped / 0 failures (+7 vs phase 2).

Shipped: `NormalizeCtasContext` widened to `{goal?, forms?, currentPagePath?, formPagePath?}` (store- and
template-agnostic); `buildNormalizeCtasContext` + `findFormPagePath` exported from `normalizeCtas.ts`
(plain module); `goalToDestination` M1 emits `{kind:'page', pathSlug}` (no `formId`) when the form page
differs from the current page, else the same-page `#form-section` anchor; threaded through both renderers,
`htmlGenerator` (`StaticHTMLOptions`), and `renderPublishedExport` (root + subpage sites).

Form-page predicate (pinned): section id starts with `leadForm-`, OR a section has non-empty
`elements.form_id`. `findFormPagePath` prefers current page → first form page → `undefined`.
Reviewer: false-positive surface low (newsletter captures store formId in a different container —
`elementMetadata.newsletter_cta.buttonConfig.formId`).

§8 edit-side chrome finding — NO STOP: `loadPageIntoActive` → `withChrome` (`pageHelpers.ts:88/91`)
re-merges `chrome.header.data` into top-level `content`, so edit-side `normalizeCtas` sees the stamped header.

Spec deviation honored: tests assert the bare host-relative `/contact`, and
`not.toContain('/p/acme/contact')`. `resolveDestination` untouched.

Exporter test uses meridian, not vestria — reviewer judged this CORRECT, not defect-hiding: meridian is
buttonConfig-wired so the HTML assertion actually exercises resolution, whereas a vestria fixture would
emit `#contact` regardless of the fix (that would be the true false-green). Test drives real assembly with
an explicit unstamped-in guard. `vi.mock('server-only')` is a sound harness move (build-time bundling
guard, not a runtime boundary).

### ⚠ CONFIRMED SCOPE GAP — F23 is NOT yet fixed on its own repro template

Independently verified by the reviewer (implementer's STOP-flag was correct):
- **No vestria block reads `buttonConfig` or calls `resolveCtaHref`.** Grep across `templates/vestria`
  yields only `externalLinkProps` (for `target=_blank`) and a `resolveDestination` inside
  `editPrimitives.tsx:124` `LinkTargetPopover.onChange` — a user-driven href WRITE, never a render read.
- Vestria's primary href is a **flat element**: `VestriaTailoredHero.core.tsx:48` and
  `VestriaNavHeader.core.tsx:89` both do `<E.Link hrefKey="cta_href" href={content.cta_href || '#contact'}>`.
  Published `Link` (`publishedPrimitives.tsx:31-32`) is `const target = href || '#'` — verbatim.
- Holds for BOTH edit and published paths. **No bridge exists** from `elementMetadata[*].buttonConfig`
  into `elements.cta_href` (grep-confirmed).
- **The spec misdiagnosed F23.** `#contact` is the block's hardcoded schema default, NOT a resolved
  snapshot. "Snapshot resolver guesses same-page anchor" was wrong about the mechanism.

**Per-template primary-CTA wiring (reviewer-verified):**
| template | hero | header | cta |
|---|---|---|---|
| meridian | wired | wired | wired |
| techpremium | wired | **flat prop takes PRECEDENCE** (`TechPremiumNav.published.tsx:42`: `props.cta_href \|\| resolveCtaHref(...)`) | wired |
| vestria | flat `cta_href` | flat `cta_href` | — |
| granth | flat (`GranthHero.core.tsx:56`) | — | — |

Consequence: stamping + resolution are correct and template-agnostic for buttonConfig-consuming templates,
but are **dead wiring for flat-`*_href` templates**. Phase 6's manual gate on `9knkYn8_QZpE` (vestria)
would fail. → **New phase 3.5 added** (render-time href bridge). Not a phase-3 defect; phase-3 code is
correct and correctly scoped.

---

## Phase 3.5 — Flat-href render bridge — STEP 1 GATE FAILED, STOPPED (no code changed)

### Files changed
- None. Stopped at the Step-1 gate before any edit; only this audit section was appended.

### Step-1 gate finding (verified in code)
Phase 1 stamps `dest:'GOAL_REF'` onto `elementMetadata[key].cta` ONLY for keys in
`GOAL_REF_STAMP_KEYS = ['cta_text']`, and ONLY when the key is present in a section's `elements`
(no phantom stamps). The bridge reads that stamp on `cta_text` and writes the resolved href into the
sibling `elements.cta_href`. So the bridge only helps a block whose primary carries `cta_text`.

| Template | primary text key | flat href key | `cta_text` present? | Phase-1 stamp lands? | Bridge works? |
|---|---|---|---|---|---|
| vestria hero (`product/elementSchema.ts:819-820`) | `cta_text` | `cta_href` (default `#contact`) | YES | YES | YES |
| vestria header (`product/elementSchema.ts:787-788`) | `cta_text` | `cta_href` (default `#contact`) | YES | YES | YES |
| granth hero (`writer/elementSchema.ts:25-26`) | **`cta_label`** | `cta_href` (default `#books`) | **NO** | **NO** | **NO** |

- Vestria blocks read flat `content.cta_href` (`VestriaTailoredHero.core.tsx:48`,
  `VestriaNavHeader.core.tsx:89`) → gate PASSES, bridge is achievable and in-scope.
- Granth hero renders `<E.Txt elementKey="cta_label" …>` for the button label and
  `<E.Link hrefKey="cta_href" href={content.cta_href || '#books'}>` (`GranthHero.core.tsx:56-57`).
  Its primary uses `cta_label`, NOT `cta_text`, so Phase 1 never stamps it and the bridge has
  nothing to read → gate FAILS.

### Why this is STOP-and-report (not improvise)
Non-negotiable #1: "If `cta_text` is absent, the stamp never fires, the bridge has nothing to read →
STOP AND REPORT. Do not improvise a phantom stamp or invent a new stamp key; that's an orchestrator
decision." Granth's `cta_text` is absent. The only fixes are:
1. Add `cta_label` to `GOAL_REF_STAMP_KEYS` in `src/modules/goals/stampGoalRefCtas.ts` (+ a
   `cta_label → cta_href` bridge mapping) — but `stampGoalRefCtas.ts` is NOT on Phase 3.5's
   Files-touched list, and adding a stamp key is a reserved orchestrator decision.
2. Descope granth from Phase 3.5 (it is in NO acceptance repro — repros are meridian single-page +
   vestria multipage). Non-negotiable #8 nonetheless lists "granth hero: bridged the same way" as a
   REQUIRED assertion, so the phase as written cannot pass without resolving this.

Because the phase's required test bar (granth) is impossible within the Files-touched list, and the
resolution changes the bridge/allowlist shape, I stopped at the gate rather than land a partial phase.

### Ready-to-implement (unblocked, in-scope) once granth is resolved/descoped
- **Bridge in `normalizeCtas.ts`:** for each allowlisted primary carrying a resolved `cta` whose
  `cta.dest === 'GOAL_REF'`, also write the resolved href into the sibling `elements.cta_href` in the
  transient clone. Guard so an explicit/detached `Destination`, a user-set flat href, and legacy
  metadata-less elements (`if (!cta) continue;`) survive un-bridged.
- **techpremium header precedence** (`TechPremiumNav.published.tsx:42`,
  `props.cta_href || resolveCtaHref(...)`): the flat prop shadows the resolver — needs the
  resolved/GOAL_REF destination to win over a stale/default flat `cta_href`. Its `.tsx` pair
  (`TechPremiumNav.tsx:177`) renders the CTA as editable text and computes NO href, so the edit pair
  does NOT share the precedence bug — fix is `.published.tsx`-only, fully in-scope.

### Open question for the orchestrator (blocking)
Default-vs-user-set `cta_href` distinguishability (non-negotiable #3) was NOT reached, because the
gate failed first. It must be settled alongside the granth decision before implementation resumes.

### Test / verification status
- Not run (no edits). `tsc`/tests unchanged from Phase 3 baseline (1834 passed / 3 skipped).

---

## Phase 3.5 — Flat-href render bridge — IMPLEMENTED (gate resolved by orchestrator)

The Step-1 gate above was ratified by the orchestrator: **granth DESCOPED** (its `cta_label`
allowlist change has writer-track blast radius, no acceptance repro — stays out of scope), and the
**default-vs-user-set `cta_href` rule RATIFIED**. Resumed and landed the vestria + techpremium work.

### Files changed
- `src/utils/normalizeCtas.ts` — added the GOAL_REF-only flat-href bridge (writes the resolved href
  into the sibling `elements.cta_href` in the transient clone).
- `src/modules/templates/techpremium/blocks/Header/TechPremiumNav.published.tsx` — precedence fix so
  a resolved buttonConfig wins over a stale/default flat `cta_href`.
- `src/utils/normalizeCtas.bridge.test.ts` (new) — bridge unit tests.
- `src/lib/staticExport/__tests__/multipageGoalRef.test.ts` — added the VESTRIA case (meridian case
  kept unchanged).

### The ratified rule, as implemented (`normalizeCtas.ts`)
For each allowlisted primary metadata key carrying a resolved `cta`, the bridge ALSO writes the
resolved href into the sibling flat element, per `GOAL_REF_FLAT_HREF_KEYS = { cta_text: 'cta_href' }`
(matches stampGoalRefCtas' `['cta_text']` allowlist). It fires ONLY when BOTH:
1. `cta.dest === 'GOAL_REF'` — an explicit/detached `Destination` (concrete `cta.dest`) is never
   bridged (still down-converts to a `buttonConfig`, but the flat href is left alone); legacy
   metadata-less elements never reach the bridge (`if (!cta) continue;`).
2. the existing `elements.cta_href` is absent / empty / EXACTLY a known schema default —
   `SCHEMA_DEFAULT_CTA_HREFS = { '#contact', '#books', '/contact', '#' }`. A flat href present AND
   not in that set = a value a human typed via `LinkTargetPopover` (`editPrimitives.tsx` writes
   `elements.cta_href` directly) -> left untouched.

The resolved href is obtained via `resolveCtaHref(buttonConfig, ctx.forms, '')` — the SAME resolution
the wired blocks get; an empty result (unresolvable) skips the write. Writes go into the per-section
`elementsClone` (a fresh `{ ...section.elements }`), merged into the existing `contentClone`
alongside `elementMetadata` — **transient only, never persisted** (verified by the "does not mutate
input" test: source JSON byte-identical, `out !== content`).

**Why a local constant, not the elementSchema (tradeoff, ratified fallback):** `normalizeCtas` is a
plain firewall-safe util with no per-section template/block context — it sees generic `sectionId`s
(`hero-<uuid>`), so it cannot reverse-map a section to its schema entry to read the default. Reading
the per-audience `elementSchema` modules would add coupling/import surface for no render benefit and
risk the boundary law. Per the orchestrator's allowed fallback, the known defaults live as a local
constant, documented inline; a new template default `cta_href` must be added there.

**Cross-template default collision is accepted** (ratified): a user who types a value equal to some
template's default (e.g. `/contact`) is indistinguishable from the default and is treated as default
-> bridged. This preserves goal wiring for generated pages and never clobbers a genuinely distinct
user value. The only editor path that sets vestria `cta_href` is `LinkTargetPopover` (which writes an
intentional non-default target — and any non-default target is preserved).

### techpremium header precedence fix
`TechPremiumNav.published.tsx:42` was `const ctaHref = props.cta_href || resolveCtaHref(md?.cta_text?.buttonConfig, forms, '/contact')`
— the flat prop SHADOWED the resolver. Now: when `md.cta_text.buttonConfig` exists (GOAL_REF stamped
+ normalizeCtas-resolved, or a ButtonConfigurationModal-set config) the resolver WINS, with the flat
prop as its fallback; with no buttonConfig the flat prop is used unchanged (legacy parity). This is
belt-and-suspenders with the bridge (which also writes `props.cta_href` for techpremium) — both agree.

**Dual-renderer law (asymmetry noted, NOT a violation):** the `.tsx` edit pair
(`TechPremiumNav.tsx:177`) renders the CTA as EDITABLE TEXT (`TechPremiumEditable`) and computes NO
href at all — there is no `href` expression in the edit pair to carry the precedence bug. So the fix
is `.published.tsx`-only and the pair stays behaviorally consistent (edit = editable label; published
= resolved href). Confirmed no other file needed editing.

### Dual-renderer coverage of the bridge (edit path benefits for free)
The bridge lives in `normalizeCtas`, which BOTH renderers call
(`LandingPagePublishedRenderer.tsx:85`, `LandingPageRenderer.tsx:131`). Vestria's edit and published
blocks share ONE core (`VestriaTailoredHeroCore` / `VestriaNavHeaderCore`) that renders
`content.cta_href || '#contact'`; both renderers flatten `elements` into the block's props
(published via `extractContentFields` -> `{...flattenedData}`). So the `elements.cta_href` the bridge
writes reaches the edit `Link` and the published `Link` identically — the edit path genuinely
benefits without any block edit.

### Granth — KNOWN LIMITATION (deliberately out of scope, orchestrator-descoped)
Granth hero's primary is `cta_label` + `cta_href` (`writer/elementSchema.ts:25-26`,
`GranthHero.core.tsx:56-57`), NOT `cta_text`. The `['cta_text']` allowlist never stamps it, so goal
wiring does not reach granth and its flat hero stays unbridged. Fixing it means widening the global
allowlist (`stampGoalRefCtas.ts` — outside this feature's Files-touched) + adding a
`cta_label -> cta_href` bridge mapping. Descoped because the allowlist is global to the **writer**
audience (a different track, no acceptance repro, goal typically `#books` not a form), so the blast
radius is unjustified here. Same register as the already-documented techpremium/naayom seam
(`thing.ts:555`) and the regenerate-path gap.

### Test results
- `npx tsc --noEmit`: clean.
- `npx vitest run src/utils/normalizeCtas.bridge.test.ts src/lib/staticExport/__tests__/multipageGoalRef.test.ts`: 14 passed (7 bridge + 7 exporter, incl. 3 new vestria).
- `npx vitest run src/utils src/lib/staticExport`: 166 passed.
- `npm run test:run` (full): 113 passed | 1 skipped (114 files); 1844 passed | 3 skipped (1847) — up
  from Phase 3's 1834 by the 10 new phase-3.5 cases. 0 failures.
- `npm run build`: NOT run (reserved for phase 6).

New/asserted test coverage:
- `normalizeCtas.bridge.test.ts`: multipage M1 (`#contact` default -> bare `/contact`), single-page M1
  (-> `#form-section`), absent flat href -> bridged, USER-SET href (`/my-custom-target`) -> untouched,
  DETACHED explicit `Destination` -> flat href untouched (buttonConfig still down-converted),
  no-mutation (transient clone), legacy frozen fixture -> same reference / no `form-section` injected.
- `multipageGoalRef.test.ts` VESTRIA case (real assembly, templateId `vestria`, unstamped-in guard):
  home hero + header flat `cta_href` bridged to bare `/contact` (>=2, never `#contact`, never
  `/p/acme/contact`); single-page vestria -> `#form-section`.

### Open risks
- The granth limitation above (writer audience unbridged) — tracked, needs a follow-up if writer
  goals ever require CTA resolution.
- `SCHEMA_DEFAULT_CTA_HREFS` is a maintained constant: a NEW template introducing a different default
  `cta_href` value must be added, or the bridge will treat that default as user-set and skip it
  (safe-fail — no clobber, but the goal won't reach that new template's flat CTA until added).
- The bridge additionally writes `elements.cta_href` on any `cta_text`-stamped section (harmless —
  buttonConfig-reading blocks ignore the flat key), so meridian's existing exporter assertions stay
  green (verified).

---

## Phase 3.5 — impl note: STOP section above is superseded
The "STEP 1 GATE FAILED, STOPPED" section documents the pre-resume gate finding and the two decisions
returned to the orchestrator. Both were ratified (granth descoped; default-vs-user-set rule fixed) and
the work resumed and landed as documented in this section. The STOP section is retained as the audit
trail of the gate, not as the phase outcome.

---

## Phase 3.5 — impl-review verdict: **ship** (loop 1, no blocking issues)

Gate: `npx tsc --noEmit` exit 0 · `npm run test:run` 1844 passed / 3 skipped / 0 failures (+10 vs phase 3).

Reviewer-verified: clobber rule enforced on BOTH arms (`normalizeCtas.ts:232` GOAL_REF gate,
`:241-245` absent/empty/exact-default gate); user-set non-default href survives; bridge writes only
into `elementsClone`→`contentClone` (deep-frozen legacy fixture would throw on mutation — test asserts
source byte-identical); detached explicit `Destination` skips the bridge; `if (!cta) continue;`
preserved. techpremium precedence fix is not inverted and doesn't regress when `buttonConfig` is absent;
`TechPremiumNav.tsx:177` computes no href so the unedited edit pair does NOT violate the dual-renderer
law. Grep confirms **no other block** carries the `props.X_href || resolveCtaHref(...)` shadow bug.
Vestria exporter test drives real assembly + real `generateStaticHTML` and would FAIL if the bridge were
deleted. Granth correctly untouched; `stampGoalRefCtas.ts` unmodified; allowlist still `['cta_text']`.

### ⚠ Known limitation (accepted, ratified) — `/contact` popover collision → FOLLOW-UP
`SCHEMA_DEFAULT_CTA_HREFS` includes `'/contact'`, which is a genuine schema default. But
`vestria/blocks/editPrimitives.tsx:124` (`LinkTargetPopover.onChange`) does
`saveField(ctx, hrefKey, resolveDestination(link.dest))` — writing `elements.cta_href` while leaving
`elementMetadata.cta_text.cta.dest === 'GOAL_REF'`. So a user choosing **"Contact page"** in the popover
writes `/contact`, the bridge classifies it as a default, and **overwrites it whenever the goal resolves
to something else** (single-page `#form-section`, or an M3 external URL).

Why accepted (not blocking): the element still declares `GOAL_REF`, so "follow the goal" is the honored
semantic — proper detach goes through `ButtonConfigurationModal`, which writes a concrete `cta.dest` the
bridge correctly skips. In the dominant case (goal = contact form on `/contact`) the resolved value equals
the existing one and the `existing !== resolvedHref` guard makes it a no-op. `'#'` is a non-issue: a
param-less goal resolves to `'#'`, so `existing === resolvedHref` → no write.

**Follow-up (out of this spec's scope):** make `LinkTargetPopover` DETACH on user pick — write an explicit
`cta.dest` Destination alongside the flat href — so a deliberate link choice is structurally distinguishable
from a schema default. Until then, vestria users retargeting a primary via the popover (rather than the
button-config modal) may see the goal re-assert itself.

Other notes: `SCHEMA_DEFAULT_CTA_HREFS` is a local constant, not read from the element schema
(`normalizeCtas` has no per-section template context; importing audience schemas would breach the
plain-module boundary). Fails SAFE — an unlisted new default simply never bridges (no clobber).
Plan's Files-touched has a path typo (`blocks/Nav/` vs actual `blocks/Header/`); correct file was edited.

### Known limitation — granth (descoped, orchestrator Decision 1)
Granth hero's primary is `cta_label` + `cta_href` (`writer/elementSchema.ts:25-26`), not `cta_text`, so the
`['cta_text']` allowlist never stamps it and the bridge cannot reach it. Goal wiring does not reach granth.
Deliberately out of scope: widening the global allowlist would change stamping for the entire **writer**
audience (different track, no acceptance repro, goal typically not a form — default `#books`). Fixing it
means widening the allowlist + a `cta_label → cta_href` bridge mapping.
