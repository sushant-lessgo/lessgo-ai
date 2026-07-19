# bugs-qa-0719b audit

## B3 — Duplicated desktop/mobile preview toggle in editor header

**Files changed**
- `src/app/edit/[token]/components/layout/GlobalAppHeader.tsx`
- `src/app/edit/[token]/components/layout/GlobalAppHeader.menus.test.tsx`

**What I did**
- Deleted the dead center device `SegmentedControl` stub block (the `{/* ── Center: device segmented (t1) ── */}` region, its `ml-auto flex-none` wrapper `<div>`, the greyed 3-way `<SegmentedControl aria-label="Preview device" onValueChange={() => {}}>` wrapped in `<Coming what="device previews">`, and the two stale decision-12 / font-substitute comment blocks).
- Removed the now-unused `import { SegmentedControl } from '@/components/ui/segmented-control'` (line ~41). Verified via grep that line 289 was its only consumer in the file before removing.
- Left the real `DeviceToggle` (mounted via `EditHeaderRightPanel`) untouched as the single device control.

**Test added**
- `GlobalAppHeader.menus.test.tsx`: `does NOT render the dead device-preview stub (B3)` — asserts `container.querySelector('[aria-label="Preview device"]')` is null. The suite already mocks `EditHeaderRightPanel` → `() => null`, so the stub was the only possible `aria-label="Preview device"` node; pre-fix the stub rendered → the query would return the element (non-null) → test would fail. Post-fix it is null → passes.

**Verify results**
- `npx tsc --noEmit`: only pre-existing unrelated error `src/app/page.tsx(6,26): TS2307 Cannot find module '@/assets/images/founder.jpg'` — not related to this change.
- `npm run test:run -- GlobalAppHeader`: 1 file, 7 tests passed.

**Deviation from root-cause fix:** none.

**Open risks:** none. Removing the center block leaves the right cluster's own `ml-auto` responsible for right-alignment, so bar layout is preserved.

## B4 — Preview mode still shows editing options

**Files changed**
- `src/app/globals.css`
- `src/app/edit/[token]/components/layout/MainContent.tsx`
- `src/app/edit/[token]/previewModeAffordances.test.ts` (new)

**Fix 1 — globals.css (visual affordance leak via bare `[data-element-key]`)**
- Prefixed the two blocks that set `cursor: pointer` / `user-select: none` on
  `[data-element-key]:not([contenteditable="true"][data-editing="true"])` with the
  `.edit-mode` ancestor (~L16 and ~L88). `.edit-mode` is stamped by
  `ElementDetector.tsx` only when `mode !== 'preview'`, so in preview these
  affordances no longer apply. Left the `[contenteditable][data-editing]` editing
  rules and the plain `[data-element-key] { transition }` rule untouched.

**Fix 2 — MainContent.tsx (~L568-572)**
- Moved `cursor-pointer` and `hover:ring-1 hover:ring-gray-300` behind
  `mode !== 'preview'` using `cn(...)`, matching the existing conditional pattern
  at L535/L540/L573. `cn` already imported.

**Test added:** `previewModeAffordances.test.ts` — asserts every CSS block that sets
`cursor: pointer` on `[data-element-key]` is `.edit-mode`-scoped. Fails pre-fix
(bare selector had no `.edit-mode`), passes post-fix.

**Verify results**
- `npm run test:run -- previewModeAffordances`: 1 passed.
- `npx tsc --noEmit`: only pre-existing unrelated error `src/app/page.tsx(6,26)
  TS2307 @/assets/images/founder.jpg` (not a touched file). No errors in touched files.
- No existing MainContent test file to regress.

**Deviation?** No.

## B5 — Atelier header: white bg + invisible logo/nav + missing logo/menu toolbars (one root cause)

**Files changed**
- `src/modules/skeletons/work/tokenContract.ts`
- `src/modules/skeletons/work/tokenContract.test.ts`

**Token change**
- `serializeSkinTokens` (`tokenContract.ts` ~line 328-337): changed the `headerOverlay: true` branch of `hdrBg` from `'transparent'` to `'var(--wk-dark)'`. `hdrFg='var(--wk-on-dark)'` and `hdrDot='inline-block'` unchanged. Rewrote the adjacent comment to explain the interim dark-editorial-band rationale (the transparent bg revealed the white paper band beneath because the geometric overlay was never built, painting on-dark near-white logo/nav invisible; a self-contained dark fill makes the on-dark header legible on its own). The `--wk-header-*` vars flow to BOTH renderers via `buildWorkStylesheet` (used by `ThemeInjector` edit + `SSRTokens` published) → dual-renderer parity satisfied by construction; no `WorkHeader.core/.tsx/.published/styles.ts` edits made.

**Test change**
- `tokenContract.test.ts` "emits the Atelier composition vars for the opted-in skin" (~line 228): changed `expect(css).toContain('--wk-header-bg:transparent;')` → `expect(css).toContain('--wk-header-bg:var(--wk-dark);')` and added guard `expect(css).not.toContain('--wk-header-bg:transparent')`. Kept the `--wk-header-fg:var(--wk-on-dark)` + `--wk-header-dot:inline-block` assertions. Single-source token CSS = one assertion covers both renderers. Fails pre-fix (was transparent), passes post-fix.

**Test results**
- `npm run test:run -- tokenContract`: 18/18 passed.
- Parity/atelier tests `npm run test:run -- coreParity renderParity.work kundiusPages`: 5 files, 157/157 passed. No subpixel/background parity assertion broke; no tolerance bumps needed. The old comment cited an isolated-parity subpixel artifact for a hard dark fill, but no parity test currently asserts against the header bg — nothing regressed.
- `npx tsc --noEmit`: one pre-existing/environmental error only — `src/app/page.tsx(6,26): TS2307 Cannot find module '@/assets/images/founder.jpg'` (the file exists on disk; known stale `.next/types` image-declaration flake, unrelated to this change and outside touched files).

**Deviation from root-cause fix:** No. Applied exactly as specified.

**Note (intended):** This ships a DARK EDITORIAL BAND as the interim header appearance. The true transparent-over-hero geometric overlay (absolute-positioned header floating over the dark hero cover) remains DEFERRED (cross-track page/section-stack concern). The token knob (`headerOverlay`) is now correct for any skin that sets it.

**Open risks:** If/when the geometric overlay is built, revisit `hdrBg` — a transparent header over the real dark hero would then be correct, and the dark band would double up. Track with the deferred overlay work.

## B1 — Dream-client onboarding option appears then disappears

**Files changed**
- `src/modules/wizard/work/questionGating.ts`
- `src/modules/wizard/work/questionGating.test.ts`

**What I did**
- Made the D-F ceiling engagement-aware (questionGating.ts ~247-264). Root cause: the cap sorted ALL candidates by static `PRIORITY_RANK` and `.slice(0, 5)`, blind to engagement. `dreamClient` is rank 6, so once ≥6 candidates existed it was the first real ask evicted — even when already shown/answered (`answered:true`), violating "once shown/answered, must not vanish".
- New cap: `engaged(c) = c.answered || session(c.slot)`; pin every engaged slot, then fill `remaining = max(0, MAX_QUESTIONS - pinned.length)` slots from the UNENGAGED candidates by priority rank; `kept = pinned ∪ keptCompeting`; restore display order via the final `candidates.filter`. `buildQuestionPlan` signature unchanged. Degenerate case preserved: nothing engaged → `pinned=[]`, `remaining=5`, identical rank-5 result.

**Test added**
- `questionGating.test.ts`: `buildQuestionPlan — ceiling never evicts an engaged slot (B1)` › `a session-answered dreamClient survives the cap even with 6+ candidates`. work seeded with only `dreamClient` → 7 candidates (identity/groups/price/languages/contactMethod all need asking + dreamClient), tripping the ceiling. Pre-fix: rank-6 dreamClient sorted out of the top 5 → `plan.find(slot==='dreamClient')` undefined → test fails. Post-fix: dreamClient is session-answered → pinned → survives with `answered:true` → passes.

**Verify results**
- `npm run test:run -- questionGating`: 16/16 pass, including the degenerate rank-5 case (`caps at 5 by priority rank ...`) and all D-C/D-F cases — no regressions.
- `npx tsc --noEmit`: only pre-existing unrelated error `src/app/page.tsx(6,26): TS2307 Cannot find module '@/assets/images/founder.jpg'` (asset-typing artifact, not questionGating). No errors from touched files.

**Deviation?** No.

**Merge note:** Sibling round `fix/qa-0719` may also touch `questionGating.ts`; a merge reconciliation on the cap block (~247-264) is possible. (Did not read that branch.)

## B2 — User picked English, work-engine site generated in Dutch

**Files changed**
- `src/modules/audience/work/copyPrompt.ts` (copy phase)
- `src/modules/audience/work/strategy/promptsWork.ts` (strategy phase)
- `src/modules/audience/work/storyInterview.ts` (about/story phase)
- `src/modules/audience/work/copyPrompt.language.test.ts` (new regression test)

**Root cause:** Code faithfully carries the chosen language to `primaryLanguage` and the
copy prompt already says `Write EVERY string in ${language}` — that part is correct.
The failure was LLM prompt ADHERENCE: Dutch grounding (WORK LIBRARY block + Dutch
strategy `positioningAngle`/`storyAngle` injected verbatim near the top) led the model
to ECHO source-language wording because no directive told it to TRANSLATE the meaning
rather than copy. No translate/source-language instruction existed anywhere (grep-confirmed).

**Directives added (prompt-hardening, root-cause not symptom):**
- `copyPrompt.ts`: new `## OUTPUT LANGUAGE — ${language} (READ FIRST)` block inserted
  immediately after `voice.identity` — i.e. BEFORE the POSITIONING/STORY ANGLE angle
  injections (~213-217) and BEFORE the WORK LIBRARY block (~224). States output MUST be
  `${language}`, and that grounding facts/library/positioning MAY be in another language:
  "render its MEANING in ${language}: translate the idea, never copy or echo the
  source-language wording" (proper nouns stay as-is). The existing
  `Write EVERY string in ${language}` rule is kept.
- `promptsWork.ts` (~95): appended translate-don't-echo clause to the existing
  `Write every string in ${primaryLanguage}` directive so the strategy phase doesn't
  emit foreign-language angles that later contaminate the copy prompt.
- `storyInterview.ts` (~157): appended the same clause to rule 1 of the about/story path.

No code path/ordering changed (index-0 selection untouched). Server-side prompt builders
only — no block `.tsx`/`.published.tsx`.

**Test added:** `copyPrompt.language.test.ts` — `work copy prompt — translate-don't-echo
language directive (B2)`. Builds the copy prompt via `buildWorkCopyPrompt` with
`primaryLanguage:'English'` and Dutch grounding (Dutch group names `Bruiloftsfotografie`/
`Portretsessies` + Dutch praise). Asserts: baseline `Write EVERY string in English`
retained; `/render .*meaning in English/i` present; `/never (copy|echo).*source-language/i`
present; and the directive appears BEFORE the Dutch grounding it governs.
Why it fails pre-fix: the strings "render its MEANING in English" and
"never copy or echo the source-language" did not exist anywhere before this change
(grep-confirmed), so the two `toMatch` assertions would fail on pre-fix code. It passes
post-fix. This proves the directive is PRESENT, not that the model OBEYS it.

**Verify results:**
- `npx tsc --noEmit`: only pre-existing unrelated error `src/app/page.tsx(6,26) TS2307
  Cannot find module '@/assets/images/founder.jpg'` — not a file in scope, not caused by
  this change (stale asset/types issue).
- `npx vitest run copyPrompt promptsWork storyInterview`: 4 files, 31 tests, all pass
  (includes the new language test + factsLaw + storyInterview).

**Deviation?** No.

**Residual uncertainty:** This is a unit-level PRESENCE check, not an adherence check —
true language adherence is only provable via the opt-in real-LLM golden
(`captureGoldenWork.test.ts`, `CAPTURE=1`), out of scope here; no real-LLM call attempted.
I could not inspect the QA run's actual saved `facts.work.languages`. If that field held
`['nl']`/Dutch at commit time, the root cause could flip toward selection/ordering rather
than adherence — but runtime seeding defaults the output language to English, so echo of
Dutch grounding (this fix) is the likely cause.

## B6 — Atelier testimonials rendered an empty band

**Files changed (dual-renderer trio + support):**
- `src/modules/skeletons/work/blocks/Proof/WorkProofTestimonials.core.tsx` (single-source core)
- `src/modules/skeletons/work/blocks/Proof/WorkProofTestimonials.tsx` (EDIT wrapper)
- `src/modules/skeletons/work/blocks/Proof/WorkProofTestimonials.published.tsx` (PUBLISHED wrapper)
- `src/modules/skeletons/work/blocks/Proof/styles.ts` (greyed-placeholder CSS)
- `src/modules/skeletons/work/blocks/Proof/WorkProofTestimonials.emptyState.test.tsx` (new regression test)

**What changed:**
Root cause (diagnosed, by-design gating): manual atelier onboarding never collects
testimonials, so `injectPraise` forces `proof.quotes = []`; the `testimonials` proof
shape then rendered a heading over a ZERO-card grid — reads as "testimonials didn't
render" and violates the greyed-placeholder (no-silent-omission) policy.

Fix — the core previously could not tell edit vs published (both wrappers inject the
same `WorkPrimitives`). Added an `editable?: boolean` prop (default `false`) passed by
the two wrappers, and branched on empty quotes:
- `quotes.length === 0 && editable === false` (published) → `return null` (whole band
  omitted: no `<style>`, no `<section class="wk-proof">`, no heading, no empty grid).
- `quotes.length === 0 && editable === true` (editor) → renders a visible greyed
  placeholder card `<div class="wk-proof__empty" data-wk-proof-empty>` with text
  "Add a client testimonial — clients' words build trust", in addition to the existing
  `E.List` add affordance.
- `quotes.length > 0` → UNCHANGED in both modes (placeholder never rendered).
Wrappers: `.tsx` passes `editable`; `.published.tsx` passes `editable={false}`.
`styles.ts`: added `.wk-proof__empty` (dashed border, muted ink), mirroring the
existing `wk-proof-logos__ph` greyed dashed pattern in the same skeleton.

**Test added:** `WorkProofTestimonials.emptyState.test.tsx` — renders the core through
PUBLISHED primitives (`makePublishedPrimitives`) via `renderToStaticMarkup` (coreParity
pattern; the empty branch keys on `editable`, not on which primitive set is injected):
1. published + `quotes:[]` + `editable=false` → output is `''` (no `wk-proof`, no heading).
   Pre-fix: a `.wk-proof` section with heading + empty `.wk-proof__grid` rendered → FAILS.
2. editor + `quotes:[]` + `editable=true` → contains `data-wk-proof-empty` / `wk-proof__empty`
   / "Add a client testimonial". Pre-fix: no placeholder marker existed → FAILS.
3. Guard: one quote → BOTH modes still render `wk-proof__card` + the quote text and NO
   `data-wk-proof-empty`. Unchanged either way.

**Results:**
- `npx tsc --noEmit` — clean re: this fix. One PRE-EXISTING unrelated error remains:
  `src/app/page.tsx(6,26): TS2307 Cannot find module '@/assets/images/founder.jpg'`
  (image asset in an unrelated file; not touched by this fix).
- `npm run test:run -- WorkProofTestimonials` — 1 file, 3 tests PASS.
- `npm run test:run -- coreParity renderParity` — 5 files, 164 tests PASS (dual-renderer
  parity intact; the atelier proof fixture carries populated quotes so parity is unaffected).

**Deviation from plan:** No. (Scope note: the regression test renders the core with
PUBLISHED primitives for BOTH the `editable=true` and `editable=false` cases rather than
wiring the EDIT primitives + a mocked store — the empty-state branch is gated purely on
the `editable` prop, so this exercises the real logic without store scaffolding. This is
within the described test intent, not a scope change.)

**Deferred follow-up (out of bugfix scope — feature):** The real gap is that MANUAL
(non-website-import) atelier onboarding never ASKS for testimonials — the `praise` slot
is confirm/import-ONLY (`questionGating.ts`, `engines/work.ts`), so `injectPraise`
deterministically empties `proof.quotes`. Collecting testimonials in manual onboarding is
a feature; this fix only corrects the block's empty-state presentation per policy.
