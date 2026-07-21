# work-contract-wave2 — implementation plan

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\work-contract-wave2` (every phase's implementer works ONLY here)
- **Branch:** `feature/work-contract-wave2` (hard-stop if `git branch --show-current` mismatches)
- **Spec:** `docs/task/work-contract-wave2.spec.md` · Tier: full
- **Prerequisite:** `cms-collections` is merged (all 9 phases landed on main; this branch must contain that merge — verify `src/app/edit/[token]/components/cms/ItemEditor.tsx` exists before Phase 1).

## Overview

Close the Wave-2 gaps in the frozen work-engine content contract so Atelier reaches designer parity: packages (per-tier image, bullets, "most booked" flag, category label), about (portrait, signature, badge), hero `slides[]` + 2nd CTA, header `logo_image`, and derived footer columns/contact. Every field gets a declared source lane (MediaAsset picker / facts-verbatim / AI-drafted / manual) wired end-to-end through contract → wizard facts → copyPrompt/parseCopy/regen → both renderers, with graceful-empty behavior so existing drafts (incl. Kundius, live paying client) render byte-identical until fields are filled.

## Progress log

- phase 1 editor media + primitive foundation + header logo lane: done (review loops 1)
- phase 2 packages quad end-to-end (pilot): done (review loops 1; +3 orchestrator-authorized mid-phase files). HUMAN GATE PASSED 2026-07-21: contract FROZEN; founder chose category = PER-CARD (not section-level) → follow-up 2b converts `category_label` section-scalar → per-item `category`. Proceed to phase 3 after 2b.
- phase 2b per-card category (founder gate decision): done — category_label section-scalar → per-item `category` (manual_preferred); gate green (parity <3%, e2e pass); orchestrator diff-sanity (pattern = reviewed per-item fields). NOTE: pre-existing `atelier2` staleness in e2e/parity.spec.ts TEMPLATES (not in registry → those 2 tests time out) — out of scope, flag at merge gate.
- phase 3 about — portrait / signature / badge: done (review loops 1). Signature stamp in work.llm.ts runFanOut (not runWorksFanOut — early-return catch); aiActions.ts:389 story-regen `signature` skip belt (surgical); +work.llm.test.ts (accepted deviation: test home). Parity atelier/about 0.258%.
- phase 4 hero — slides[] + 2nd CTA: done (review loops 1). Hooks verbatim per workBehaviors.js; work.v1.js untouched. Fork slides>=2 → multi + hooks, else byte-identical single-media. Auto-derive stampHeroSlides (first-gen, never-overwrite). 2nd CTA gates on cta2_href. Parity hero#1 0.014% / #2 0.375%. DEFERRED FAST-FOLLOW (founder-gate note): editor has per-slide pick/replace but NO add/remove slides (manual .map required for is-active on slide 0); slide count = auto-derive stamp; add/remove affordance owed if manual curation needed.
- phase 5 footer — derived columns + contact: pending
- phase 6 hardening, e2e consolidation, docs: pending

## Global rules (every phase)

- **Dual renderer:** every visible change lands in the `.core.tsx` (single source); thin `.tsx`/`.published.tsx` wrappers stay identical — **NO exceptions this wave** (the footer reads assembly-stamped stored data, so even it has no wrapper divergence). NEVER import a `'use client'` module into anything reachable from `.published.tsx` / `publishedPrimitives.tsx`.
- **Contract fields are `optional`, never `required`** — `validateScopedSubset` (`src/modules/generation/scopedRegen.ts` ~L740) and first-gen validation hard-fail/retry-storm on AI-omitted required fields. All new fields in this wave are optional.
- **Manual-lane fields are excluded from the AI by `fillMode:'system'` — this is THE named mechanism.** `buildWorkSectionSpec` skips system fields via `isSystemField` (`copyPrompt.ts` L89-91, applied at L112 for scalars and L128 for collection fields); `INJECTED_COLLECTIONS` (L94) is the only other exclusion. There is NO image-specific skip today — existing `portrait_image` is merely soft-excluded as `[optional, omit to exclude]`. All NEW manual-lane fields (every image field, `cta2_href`, `featured`, `signature`) are declared `fillMode:'system'` in the contract so the existing skip hard-excludes them. System fields also get no `applySchemaDefaults` injection (`layoutElementSchema.ts` L271-280 injects only `required`+`manual_preferred`) and drop out of scoped-regen element lists — exactly manual-lane behavior. **Prompt-side skip is NOT enough on the parse side:** `applyAllSchemaDefaults` (`layoutElementSchema.ts` L266-269) keeps ALL non-null AI keys — it does NOT strip AI-emitted values for `fillMode:'system'` fields. So **Phase 2 adds a DEFINITE one-line strip of system-owned keys inside `parseWorkCopy`** (`src/modules/audience/work/parseCopy.ts`) — the uniform guard covering first-gen + ALL regen routes (incl. `regenerateSection`'s apply twin, which the Phase-3 `aiActions.ts` belt does NOT cover); per-merge belts complement it, never replace it. Later phases inherit the strip automatically by declaring fields `fillMode:'system'` in the contract.
- **Copy firewall:** `src/modules/engines/workSections.ts` stays pure-data; audience code imports no skeleton module and vice-versa.
- **Graceful-empty tripwires run every phase:** `src/modules/skeletons/work/__tests__/kundiusPages.test.tsx` + `src/modules/skeletons/work/__tests__/oldContentFallback.test.tsx` must stay green untouched (they define "byte-identical until filled"). Every new field's empty/default state renders exactly today's markup.
- **`NON_VISIBLE_KEY` regex** (`src/modules/skeletons/work/renderParity.work.test.tsx` ~L68-69) ALREADY matches `image`, `^featured$`, `href`, `url`, `^cover$` — do NOT add no-op entries for keys those patterns already cover (`image`, `featured`, `portrait_image`, `logo_image`, slide `image`, `cta2_href`). The ONLY key in this wave needing a real regex add is `footer_nav_mode` (Phase 5 — `^mode$` is anchored and won't match). Fixture updates go in `src/modules/templates/blockMocks/atelier.ts`.
- **No new blocks:** `coreParity.test.ts` core count stays **19**.
- **No prisma change.** If any phase discovers one is needed: **STOP — human gate** (auto-escalate to founder).
- **No `work.v1.js` edit, no new asset filename.** The shipped slider JS (`workBehaviors.js` L42-72) queries `.wk-hero__slide`, `[data-wk-prev]`, `[data-wk-next]`, `[data-wk-dots]`, `[data-wk-interval]` — **NONE of these exist in the hero core today** (it emits only root `data-wk-hero-slider` + a single `wk-hero__media`/`wk-hero__media-in`). Phase 4 ADDS those hooks, spelled EXACTLY as the JS queries them; inventing or renaming any hook would force a `work.v2.js` (new filename) — forbidden this wave.
- **Phase-boundary green gate:** `npx tsc --noEmit` + `npm run test:run` + `npm run lint` + `npm run build` + `npx playwright test e2e/parity.spec.ts` (<3% bands). Non-work templates byte-untouched (no file outside Files-touched).
- Per-phase commit on `feature/work-contract-wave2` only; audit file per phase in `docs/task/`.

---

## Phase 1 — Editor media + primitive foundation + header logo lane

Shared dependency of phases 2–4: route ALL work image editing through the MediaAsset picker, and add the one net-new primitive (toggle). Also absorbs the (tiny) header `logo_image` lane: the render side is already built — `WorkHeader.core.tsx` L88-90 binds `E.Logo imageKey="logo_image"`, and `Logo` delegates to the shared `Img` primitive (`editPrimitives.tsx` ~L264) — so the `Img` picker rewire wires the logo for free; only the contract key + fixture are missing. No visible-output change — Kundius byte-identical by construction.

**Steps**

1. Rewire `Img` in `editPrimitives.tsx` (L148-188): replace the raw `<input type=file>` + `ctx.uploadImage` path with `MediaPickerModal` (`src/app/edit/[token]/components/ui/MediaPickerModal.tsx`, props `{open,onOpenChange,initialTab,tokenId,onPick:(url)=>void}`). Copy the CMS `ItemEditor` idiom: local `picking` state → modal rendered only when open → `onPick(url)` writes the `{url}` string into content exactly where the upload path wrote it. **`tokenId`: `useWorkEditCtx` (`editPrimitives.tsx` L310-332) exposes `uploadImage` but NOT `tokenId` — surface a `tokenId` selector from the token-scoped store onto the ctx** (same store the other ctx selectors read). Keep `ctx.uploadImage` type in place if other callers exist; the picker's Upload tab replaces the direct-upload UX. One-pick-per-open idiom (no multi-select — lists append per pick, per CMS gallery precedent). Verify `Logo` inherits the picker via its `Img` delegation (no separate wiring expected — flag in audit if it has its own upload path).
2. Add `Toggle` to the `WorkPrimitives` type contract (`primitives.ts`): boolean-valued edit affordance for a content key; visible output identical in both modes (the block's core renders the visible chip from the value; `Toggle` in edit mode adds the click-to-toggle control, in published mode renders nothing extra). **The edit control MUST be zero-layout chrome**: use the established `EDIT_AFFORDANCE_STYLES` idiom (`.wk-img-edit`/`.wk-list-add` precedent — absolutely positioned, `opacity:0`, `pointer-events:none` until hover) so it adds NO in-flow node the published Toggle lacks — otherwise the parity band breaks. Implement in BOTH `editPrimitives.tsx` and `publishedPrimitives.tsx`; update the mock-primitive harness (`blockMocks/harness.ts`) so all existing block tests compile.
3. `E.Img` graceful-empty placeholder behavior unchanged (already built in).
4. **Header logo contract key** (folded former Phase 5): `workElementContract.header` (`workSections.ts` L144-163: `logo_text`/`cta_label`/`cta_href`/`nav_links`) has NO `logo_image` — add it: optional, `fillMode:'system'` (manual lane per the global mechanism; never AI-emitted; text wordmark stays default). Add `logo_image: ''` to the header fixture in `blockMocks/atelier.ts`. No `NON_VISIBLE_KEY` edit (regex already matches `image`).
5. New jsdom regression test: `src/modules/skeletons/work/__tests__/imgPicker.test.tsx` — edit-mode `E.Img` click opens `MediaPickerModal`; `onPick` writes `{url}`; same for the logo path; published `Img`/`Logo` render plain `<img src>` with zero picker imports.

**Files touched**

- `src/modules/skeletons/work/blocks/primitives.ts`
- `src/modules/skeletons/work/blocks/editPrimitives.tsx`
- `src/modules/skeletons/work/blocks/publishedPrimitives.tsx`
- `src/modules/engines/workSections.ts` (header `logo_image` key)
- `src/modules/templates/blockMocks/harness.ts`
- `src/modules/templates/blockMocks/atelier.ts` (header fixture)
- `src/modules/skeletons/work/__tests__/imgPicker.test.tsx` (new)

**Verification**

- `npx tsc --noEmit`; `npm run test:run` (esp. `renderParity.work`, `coreParity`, `skinPurity`, `conformance`, `kundiusPages`, `oldContentFallback`, new `imgPicker`).
- Grep-check: no import from `editPrimitives.tsx` / `MediaPickerModal` reachable from `publishedPrimitives.tsx` or any `.published.tsx`.
- Manual: `npm run dev` → atelier draft → click any existing image (hero portrait, gallery) → picker opens, pick writes url, render updates; pick a logo → renders in editor + published, clear → wordmark returns.
- Phase-boundary full gate incl. `parity.spec.ts` (bands unchanged — zero visual delta expected).

---

## Phase 2 — Packages quad end-to-end (PILOT) — **HUMAN GATE at exit**

The pattern-proving slice: contract field → wizard facts ask → AI/facts lane → editor affordance → both renderers → parity band, all on Packages.

**Steps**

1. **Contract** (`workSections.ts`, packages is a direct contract object ~L201): add optional section scalar `category_label` (`manual_preferred` — AI-visible, facts override at parse); add optional per-item collection fields `bullets` (`manual_preferred`, newline-delimited string — split at render; avoids nested-collection machinery; default decision, flag in audit if designer HTML forces otherwise), `image` (url string) and `featured` (flag `'true'`/empty) — BOTH `fillMode:'system'` (manual lane per the global mechanism: `isSystemField` skip in `buildWorkSectionSpec` hard-excludes them from the AI spec). Item `id` stays `fillMode:'system'`. `elementSchema.ts` is derived — no edit (layout map already covers WorkPackages).
2. **AI/facts lane** (`src/modules/audience/work/`): add `WORK_CHAR_CAPS` entries (`copyPrompt.ts` L67) for `category_label` + per-bullet cap; add a binding facts-verbatim RULE (like packages "one card per stated item" L170). Create `injectPackages.ts` on the `injectPraise.ts` pattern: at PARSE time map `facts.work.groups[].items` verbatim → per-tier `bullets` (clamped to contract max, stripped when facts empty — no fabrication), and `groups`-derived/facts category → `category_label`. AI-drafts bullets only when facts are silent (prompt rule). Wire into `parseCopy.ts` (contract defaults + ids flow automatically). **DEFINITE step — system-key strip (this phase introduces the first `fillMode:'system'` manual fields):** inside `parseWorkCopy` (`parseCopy.ts`), strip any AI-emitted value whose contract field is `fillMode:'system'` (a one-line contract-driven filter — covers `image`/`featured` now and automatically covers `signature`/`cta2_href`/`logo_image`/slide fields as later phases declare them system). Rationale: `applyAllSchemaDefaults` (`layoutElementSchema.ts` L266-269) keeps all non-null AI keys, so a confused AI response during SECTION regen (the `regenerateSection` apply twin, which Phase 3's `aiActions.ts` belt does NOT guard) would otherwise surface system keys. This parse-time strip is the UNIFORM guard across first-gen + all regen paths; per-merge belts (Phase 3) complement it. New `manual_preferred` elements auto-become section/element-regenerable via `scopedRegen.ts` — no regen edit; they are optional so facts-empty regen can't storm; system-mode fields (`image`/`featured`) correctly stay out of regen.
3. **Wizard facts ask** (Step 03 Questions): packages bullets ride the existing `groups` slot (`items` already exists in `WorkFactsSchema` — zero schema change for bullets). Category label: **prefer folding into the groups question copy as an optional ask** (no new slot, no cap pressure, no slot-count test churn). IF the slot branch is chosen instead: add one slot in `src/modules/engines/workSlots.ts` + gate in `questionGating.ts` (stay under the 5-question `PRIORITY_RANK` cap) — **and `src/modules/engines/workContract.test.ts` MUST be edited too** (L371-374 asserts `workSlots` has length 8 → update to 9). Touch `workFacts.schema.ts` + `rail.ts` (`workFactsToBriefPatch` single door) ONLY if a new facts key is added; touch `StepQuestions.tsx`/`engines/work.ts` ONLY if a new slot needs UI mechanics.
4. **Renderers**: extend `WorkPackages.core.tsx` + `Packages/styles.ts` to designer shape (`.atl-pack` reference): per-tier image (`E.Img` — picker-wired from Phase 1), dash-bullet list, "most booked" chip via `E.Toggle` (zero-layout chrome per Phase 1) + conditional chip markup in the core, category label. Every new field empty → EXACTLY today's card markup. Price face: reuse existing `--wk-pkg-price-fs` (`packagesStyle:'card'`) — NO new token; verify against `.atl-pack` price face, only add a token if the designer face genuinely differs (record in audit; a token add also touches `tokenContract.ts` + its test — avoid).
5. **Tests/fixtures**: update `blockMocks/atelier.ts` packages fixture with the quad. NO `NON_VISIBLE_KEY` edit — the regex already matches `image` and `^featured$` (global rule). New `injectPackages.test.ts` (verbatim mapping, clamp, empty-facts strip); extend `questionGating.test.ts` (+ `rail.test.ts` if schema changed). **The system-key strip gets a direct test** (in `injectPackages.test.ts` or a `parseCopy` test file already in this phase's list): an AI response containing `image`/`featured` values parses with those keys dropped.
6. **e2e**: create `e2e/workWave2.spec.ts` — deterministic filled-packages editor↔published parity check + empty-packages renders legacy card (grown further in phases 4/6).

**Files touched**

- `src/modules/engines/workSections.ts`
- `src/modules/audience/work/copyPrompt.ts`
- `src/modules/audience/work/parseCopy.ts` (inject wiring + DEFINITE system-key strip)
- `src/modules/audience/work/injectPackages.ts` (new) + `src/modules/audience/work/injectPackages.test.ts` (new)
- `src/modules/engines/workSlots.ts` (only if slot branch) + `src/modules/engines/workContract.test.ts` (only if slot branch — slot count 8→9)
- `src/modules/wizard/work/questionGating.ts` + `src/modules/wizard/work/questionGating.test.ts`
- `src/lib/schemas/workFacts.schema.ts` (only if new facts key) + `src/modules/wizard/work/rail.ts` + `src/modules/wizard/work/rail.test.ts` (only if schema changed)
- `src/components/onboarding/journey/steps/StepQuestions.tsx` + `src/components/onboarding/journey/engines/work.ts` (only if new slot needs UI)
- `src/modules/skeletons/work/blocks/Packages/WorkPackages.core.tsx` + `src/modules/skeletons/work/blocks/Packages/styles.ts`
- `src/modules/templates/blockMocks/atelier.ts`
- `e2e/workWave2.spec.ts` (new)
- `src/app/api/audience/work/generate-copy/route.ts` (ADDED mid-phase by orchestrator: thread `facts.work.groups` into `parseWorkCopy` so injectPackages facts-verbatim bullets are LIVE on first-gen — the pilot must prove the facts lane end-to-end; match the injectPraise data-flow)
- `playwright.config.ts` (ADDED mid-phase by orchestrator: register `e2e/workWave2.spec.ts` in the testMatch allowlist so the deterministic-QA spec actually runs)
- `src/modules/generation/scopedRegen.ts` (ADDED mid-phase by orchestrator: thread `workFacts?.groups` as the 4th `parseWorkCopy` arg at ~L904-908, mirroring the existing `workFacts?.praise` line, so packages-section regen re-injects facts-verbatim bullets identically to injectPraise — else regen silently replaces verbatim bullets with AI drafts)

**Verification**

- Full gate: `tsc` + `test:run` + `lint` + `build` + `parity.spec.ts` + `workWave2.spec.ts`.
- Tripwires: `kundiusPages` + `oldContentFallback` green untouched.
- System-key strip test green (AI-emitted `image`/`featured` dropped at parse).
- Manual: fresh atelier generation with packages facts → bullets verbatim, category present; facts-empty generation → no fabricated bullets; section regen + element regen on a new AI-lane field succeed; picker sets tier image; toggle flips chip in editor AND published output.

**HUMAN GATE (phase exit, two decisions):**
- **(a) Pilot decision gate** — founder eyeballs rendered packages cards vs designer HTML (`template-design/designer-workspace/atelier/` `.atl-pack`). Not parity → iterate before proceeding.
- **(b) Field-list sign-off / contract freeze** — founder confirms the spec's full Scope-IN field table (the table IS the proposal) before phases 3–5 write the remaining contract fields. (Note: `logo_image` already landed in Phase 1 — optional, invisible until filled; this gate ratifies it retroactively.)

---

## Phase 3 — About: portrait (4:5) / signature / badge

**Steps**

1. **Contract** (`workSections.ts`): about is donor-built via `fromDonor` — fields must be added to the returned schema object EXPLICITLY. Add optional `portrait_image` and `signature` — BOTH `fillMode:'system'` (manual lane; never AI-emitted per the global mechanism) — and optional `badge` (`manual_preferred` — AI-drafted, editable). All optional (regenerate-story collision — see steps 2-3).
2. **Lanes** (`copyPrompt.ts`): char cap + drafting guidance for `badge` (must be DISTINCT text from eyebrow — binding rule). **Signature default (`signature = facts.identity.name` when empty) is FIRST-GEN-ONLY and MUST NOT live inside `parseWorkCopy`.** Why: the story-regen route calls `parseWorkCopy` (`regenerate-story/route.ts` L205), and the inject precedent (`injectPraise`) runs INSIDE `parseWorkCopy` (`parseCopy.ts` L105) — any signature injection there re-emits `signature=name` into `data.content` on EVERY story regen, and the client merge then overwrites a user-customized signature (`optional` only prevents validation storms; it does NOT stop a default-injection clobber). Instead, **stamp the default at first-gen in `src/modules/wizard/generation/work.llm.ts`, beside the `stampWorkGalleryBinding(fc, entries)` call (L202)** — the ONLY first-gen site with facts in scope (`getWorkFacts(input.brief?.facts)`, L185), and the same call-site family Phase 4's `stampHeroSlides` uses. NOT `multiPageAssembly.ts`: `mergePageIntoFinalContent` (L139-148) receives only `copy`/`page`/`templateId` and `finalizeMultiPageGeneration(fc, briefGoal)` (L264) has no facts either — no facts in scope there. The `work.llm.ts` stamp path is unreachable by scoped/story regen → no clobber by construction. `parseCopy.ts` gets NO signature logic — the Phase-2 system-key strip automatically drops any AI-emitted `signature` once the contract declares it `fillMode:'system'` (verify coverage; expected no edit). No wizard ask (resolved: signature defaults to name).
3. **regenerate-story survival** (spec open-Q#5, resolved): the APPLY/merge lives CLIENT-SIDE in `src/hooks/editStore/aiActions.ts` L365-406 — the route only RETURNS `content` (`route.ts` L285-288). The merge spreads existing elements and overwrites only keys present in `data.content` (image keys skipped via `isImageKey` L377-380; `signature` is NOT skipped). Survival guarantees, each load-bearing:
   - **badge**: `storyInterview.ts` hard-lists the story output to `{eyebrow?, heading, bio}` (~L179-182), and `applySchemaDefaults` injects defaults only for `required`+`manual_preferred` (`layoutElementSchema.ts` L271-280) — an optional badge stays ABSENT from `data.content`, so the existing merge preserves it. No storyInterview/route edit needed.
   - **signature**: stamped only in `work.llm.ts` first-gen (step 2) + stripped at parse (Phase 2) → absent from `data.content`. BELT: additionally add `signature` to the story-regen merge's skip predicate in `aiActions.ts` (beside `isImageKey` — edit ONLY the story-regen apply block, not `regenerateSection`'s twin; the twin is covered by the Phase-2 parse-time strip) so even a hostile/legacy response can't clobber.
   - **portrait_image**: already skipped by `isImageKey` (contains `image`).
   - **Regression test** (belongs beside the merge, NOT in storyInterview): new store test `src/hooks/editStore/aiActions.test.ts` — story-regen apply with `data.content={heading,bio}` preserves customized `signature`/`badge`/`portrait_image`; and a response that DOES contain `signature` still does not clobber (skip predicate).
4. **Renderers**: `WorkAbout.core.tsx` + `About/styles.ts` — 4:5 portrait via `E.Img` (picker from Phase 1), signature line (`.atl-sign` shape), badge distinct from eyebrow (`.atl-badge`). All-empty → today's markup exactly (no portrait column reflow when empty).
5. **Tests/fixtures**: `blockMocks/atelier.ts` about fixture. NO `NON_VISIBLE_KEY` edit — `portrait_image` already matches `image`; signature/badge are visible text. Unit-test the signature stamp (fresh-gen path sets `signature=name` only when empty; user-set value untouched) wherever `work.llm.ts` behavior is already tested, or via a small stamp-function test if the stamp is extracted as a pure helper in `work.llm.ts`.

**Files touched**

- `src/modules/engines/workSections.ts`
- `src/modules/audience/work/copyPrompt.ts`
- `src/modules/audience/work/parseCopy.ts` (likely NO edit — Phase-2 system-key strip covers `signature` automatically; verify only, record in audit)
- `src/modules/wizard/generation/work.llm.ts` (first-gen signature stamp, beside `stampWorkGalleryBinding`)
- `src/hooks/editStore/aiActions.ts` (story-regen merge skip: `signature`)
- `src/hooks/editStore/aiActions.test.ts` (new — merge-survival regression)
- `src/modules/skeletons/work/blocks/About/WorkAbout.core.tsx` + `src/modules/skeletons/work/blocks/About/styles.ts`
- `src/modules/templates/blockMocks/atelier.ts`

**Verification**

- Full phase gate; tripwires green; `aiActions` merge-survival regression test green; signature-stamp test green.
- Manual: pick portrait via MediaPicker; customize signature → run about story regen → badge + signature + portrait survive; badge text ≠ eyebrow on fresh generation; fresh generation gets `signature = name`; empty portrait renders like today.

---

## Phase 4 — Hero: `slides[]` collection + 2nd CTA

**Steps**

1. **Contract** (`workSections.ts`): hero is donor-built — add explicitly on the returned schema: optional collection `slides` (constraints min 0 / max ~6; per-item fields: `id` `fillMode:'system'`, `image` `fillMode:'system'` — manual lane) + optional scalars `cta2_label` (`manual_preferred`, AI/manual, char cap) and `cta2_href` (`fillMode:'system'`, manual).
2. **Auto-derive** (resolved open-Q#1: do it): in `src/modules/generation/workCollections.ts` add `stampHeroSlides` reusing `deriveWorksEntries(facts)` / `pickCover(photos)` (hidden-photo filtering already handled) — one slide per works-group cover. Call site: `src/modules/wizard/generation/work.llm.ts` L202 is where `stampWorkGalleryBinding` is invoked — add `stampHeroSlides` beside it (the Phase-3 signature stamp lands at the same site); use `multiPageAssembly.ts` instead ONLY if the stamp needs the fully-fanned-out page set (pick one, record in audit). Zero authoring for photographers; user overrides per-slide via the picker (`E.List` + per-item `E.Img`, CMS-gallery idiom — one pick per open, append). Stamp only on fresh assembly; never rewrites user-edited slides.
3. **Lanes**: `copyPrompt.ts` — `cta2_label` cap; `slides` + `cta2_href` never AI-emitted (system fillMode, global mechanism; Phase-2 parse strip covers them at parse time automatically). `cta2_label` auto-regenerable/optional (no regen edit).
4. **Renderers** (`WorkHeroSlider.core.tsx` + `Hero/styles.ts`) — **this phase ADDS the slider hooks; they do not exist yet.** Today the core emits only root `data-wk-hero-slider` + a single `wk-hero__media`/`wk-hero__media-in`; the shipped JS (`workBehaviors.js` L42-72) queries `.wk-hero__slide`, `[data-wk-prev]`, `[data-wk-next]`, `[data-wk-dots]`, `[data-wk-interval]`. Two-branch render, explicit fork:
   - **`slides.length >= 2`** → multi-slide markup with ALL FOUR hook types, spelled EXACTLY as the JS queries them: one `.wk-hero__slide` per slide, prev/next arrow buttons carrying `[data-wk-prev]`/`[data-wk-next]`, a `[data-wk-dots]` container, and `[data-wk-interval]` on the root for autoplay (**without `data-wk-interval` autoplay never runs — acceptance "arrows/dots/autoplay" fails**). No new/renamed hooks — that would force a `work.v2.js` (forbidden, global rule).
   - **else (0 or 1 slide — incl. Kundius)** → emit EXACTLY today's single-media DOM (`wk-hero__media`/`wk-hero__media-in` from `portrait_image`), byte-identical — do NOT rewrap it in `.wk-hero__slide` (a naive always-rewrap regresses Kundius parity).
   2nd CTA renders only when label set.
5. **Tests/fixtures**: `blockMocks/atelier.ts` hero fixture with ≥2 slides + cta2. NO `NON_VISIBLE_KEY` edit — slide `image` matches `image`, `cta2_href` matches `href` (global rule). Unit test for `stampHeroSlides` (derive from facts fixture, respects hidden photos, no-op when groups empty) — extend `src/modules/generation/workCollections.test.ts`.
6. **e2e** (`e2e/workWave2.spec.ts`): published static HTML with 2+ slides contains `.wk-hero__slide` nodes + `[data-wk-prev]`/`[data-wk-next]` + `[data-wk-dots]` + `[data-wk-interval]` (slider JS activates); single-image draft emits exactly today's `wk-hero__media` DOM (no slide wrapper — JS bails, static render unchanged).

**Files touched**

- `src/modules/engines/workSections.ts`
- `src/modules/generation/workCollections.ts` + `src/modules/generation/workCollections.test.ts`
- `src/modules/wizard/generation/work.llm.ts` (stamp call site)
- `src/modules/generation/multiPageAssembly.ts` (only if the stamp must run post-fan-out instead — see step 2)
- `src/modules/audience/work/copyPrompt.ts`
- `src/modules/skeletons/work/blocks/Hero/WorkHeroSlider.core.tsx` + `src/modules/skeletons/work/blocks/Hero/styles.ts`
- `src/modules/templates/blockMocks/atelier.ts`
- `e2e/workWave2.spec.ts`

**Verification**

- Full phase gate; tripwires green (Kundius = single-image → today's static media DOM, byte-identical).
- Manual: fresh generation with 3 works groups → 3 auto-derived slides, autoplay/arrows/dots live on published page; delete down to 1 slide → static; per-slide picker override works in editor.

---

## Phase 5 — Footer: derived columns + contact — **HUMAN GATE (Kundius opt-in)**

**NO contract field** (spec rule). **Mechanism (pinned): assembly-time STAMP, not render-time derivation.** The resolved nav columns + contact are computed ONCE by a pure resolver and written INTO the stored footer content at assembly, marker-gated (`footer_nav_mode:'derived'`). BOTH renderers then read the SAME stored footer data — the dual-renderer divergence risk (edit wrapper seeing a live page list the published wrapper can't) is eliminated by construction, and no wrapper divergence exists. Re-stamped whenever the CMS page-set changes, so columns stay correct when a CMS collection adds/removes detail pages (spec acceptance).

**Steps**

1. New pure server-safe resolver `src/modules/generation/workFooterDerive.ts` (lives in generation beside the stamp family `workCollections.ts`/`workLibrarySync.ts` — keeps the skeleton↔generation firewall clean): `deriveFooterNav(fc)` → link columns from `fc.pages` (same map as `hasItemPage`, precedent `workCollections.ts` L136); `deriveFooterContact(...)` from facts-sourced data (`contactMethod`, `identity`). No `'use client'`.
2. **Assembly stamp** (`multiPageAssembly.ts` — chrome footer is built at ~L223-226): after the full page set (incl. CMS fan-out, ~L365-383) is registered, call the resolver and write resolved columns + contact + the marker `footer_nav_mode:'derived'` into the footer content (`fc.chrome.footer.data` + any footer sections). Fresh generations get it; old drafts (Kundius) lack the marker → today's footer exactly — `kundiusPages`/`oldContentFallback` stay green with zero migration. (This stamp needs only the page set — no facts-for-defaults problem here; contact inputs are resolved by the resolver from data already on `fc`.)
3. **Re-stamp on page-set change**: `resyncWorkContent` (`src/modules/generation/workLibrarySync.ts` L203) is the existing choke point that already rebuilds all group-reference surfaces with `hasItemPage` when the library/page set changes — add a footer re-stamp step there, gated on the marker being present (no marker → never touch the footer).
4. **Renderers**: `WorkFooter.core.tsx` + `Footer/styles.ts` — when marker=`'derived'`, render the 3-col index shape (designer ref) from the STORED columns/contact keys; contact falls back gracefully to today's `note`/`copyright` render; no marker → today's markup exactly. **Thin wrappers likely need NO edit**: `WorkFooter.tsx` passes `blockContent` wholesale and `WorkFooter.published.tsx` declares `interface Props extends WorkFooterContent`, so new stored keys flow automatically once `WorkFooterContent` (defined in the core) gains them — touch the wrappers only if a computed prop turns out to be needed (record in audit).
5. **Tests**: `workFooterDerive.test.ts` — columns track a pages fixture incl. CMS detail pages; contact fallback; and a resync case (via `resyncWorkContent`) proving columns update when a detail page is added, and that a no-marker footer is untouched. `blockMocks/harness.ts`/`atelier.ts` gain a footer fixture with marker + columns. `NON_VISIBLE_KEY` += `footer_nav_mode` (the ONE real regex add this wave — `^mode$` is anchored, won't match).

**Files touched**

- `src/modules/generation/workFooterDerive.ts` (new) + `src/modules/generation/workFooterDerive.test.ts` (new)
- `src/modules/generation/multiPageAssembly.ts` (assembly stamp + marker)
- `src/modules/generation/workLibrarySync.ts` (re-stamp in `resyncWorkContent`)
- `src/modules/skeletons/work/blocks/Footer/WorkFooter.core.tsx` + `src/modules/skeletons/work/blocks/Footer/styles.ts`
- `src/modules/skeletons/work/blocks/Footer/WorkFooter.tsx` + `src/modules/skeletons/work/blocks/Footer/WorkFooter.published.tsx` (likely NO edit — extend content type, keys flow automatically; touch only if a computed prop is needed)
- `src/modules/templates/blockMocks/atelier.ts` + `src/modules/templates/blockMocks/harness.ts`
- `src/modules/skeletons/work/renderParity.work.test.tsx` (regex: `footer_nav_mode`)

**Verification**

- Full phase gate; tripwires green (Kundius draft has no marker → byte-identical footer).
- `workFooterDerive` test proves columns update when a CMS collection adds detail pages (spec acceptance) and that both renderers show the same footer (same stored data — covered by the standard parity band).
- Manual: fresh generation → 3-col footer with live page links + contact; add a CMS detail page → footer link appears in editor AND published; publish → identical.

**HUMAN GATE:** enabling the derived footer on the LIVE Kundius draft = a content change to a paying customer's project (stamp the marker + columns into her draft). Founder decides if/when; NOT done by this pipeline by default. (Any other migration touching Kundius content discovered en route = same gate.)

---

## Phase 6 — Hardening, e2e consolidation, docs

**Steps**

1. Finalize `e2e/workWave2.spec.ts`: packages filled-parity, hero multi-slide hooks + single-slide bail, graceful-empty sweep (legacy fixture renders legacy markup for all five sections: packages/about/hero/header/footer).
2. Sweep the spec's acceptance-criteria checklist; fix stragglers (within already-listed files only — anything new = flag to orchestrator, amend plan).
3. Docs: update `docs/architecture/copyEngines.md` (work contract field table + lanes incl. the `fillMode:'system'` manual-lane mechanism + the parse-time system-key strip and the footer stamp) and the local module READMEs if present (`src/modules/skeletons/work/README.md`, `src/modules/audience/work/README.md` — extend only if they exist; do not create report files elsewhere).
4. Full-gate run + confirm non-work templates untouched (`git diff --stat main` review: only listed paths).

**Files touched**

- `e2e/workWave2.spec.ts`
- `docs/architecture/copyEngines.md`
- `src/modules/skeletons/work/README.md` (if exists)
- `src/modules/audience/work/README.md` (if exists)
- `docs/task/work-contract-wave2.plan.md` (progress log final state)

**Verification**

- FULL gate: `npx tsc --noEmit` · `npm run test:run` · `npm run lint` · `npm run build` · `npx playwright test e2e/parity.spec.ts e2e/workWave2.spec.ts` — all green, parity bands <3%.
- Merge to main = human gate (plain merge, user pushes; QA on preview per release-train discipline).

---

## Human gates (summary)

1. **Phase 2 exit** — founder eyeball: packages vs designer `.atl-pack` (pilot decision) + full field-list sign-off (contract freeze for phases 3–5; ratifies Phase-1 `logo_image` retroactively).
2. **Phase 5** — Kundius derived-footer opt-in (live paying-customer content). Also ANY discovered migration touching Kundius content, any phase.
3. **Auto-escalate STOP** — any prisma schema change surfaces (none expected).
4. Explicitly NOT gates: `work.v1.js` (untouched; Phase 4 only ADDS the exact DOM hooks the shipped JS already queries — no JS edit, no asset-filename change); Kundius migration for fields (graceful-empty = none needed).

## Unresolved questions

1. Kundius footer: flip derived-columns marker for her at all, and when?
2. Category-label ask: fold into groups question copy OK (preferred — avoids slot-count churn), or want its own slot (5-question cap pressure + `workContract.test` count bump)?
3. Bullets as newline-delimited string field OK (vs nested list machinery)?
4. Confirm: no new serif-price token unless `.atl-pack` face genuinely differs (default = reuse `--wk-pkg-price-fs`).
5. Hero-slide stamp call site: beside `stampWorkGalleryBinding` in `work.llm.ts` (default) or post-fan-out in `multiPageAssembly` — OK to let implementer pick + record in audit?
