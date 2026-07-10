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
