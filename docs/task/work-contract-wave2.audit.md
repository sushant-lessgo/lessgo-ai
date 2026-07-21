# work-contract-wave2 — implementation audit

## Phase 1 — Editor media + primitive foundation + header logo lane

### Files changed

- `src/modules/skeletons/work/blocks/primitives.ts` — added `WorkToggleProps` + `Toggle` to the `WorkPrimitives` type contract.
- `src/modules/skeletons/work/blocks/editPrimitives.tsx` — rewired `Img` to the shared `MediaPickerModal`; added `tokenId` to `WorkEditCtx` + `useWorkEditCtx`; added the `Toggle` edit primitive + its `.wk-toggle-edit` zero-layout CSS.
- `src/modules/skeletons/work/blocks/publishedPrimitives.tsx` — added the static `Toggle` primitive (renders only `children`; no picker import).
- `src/modules/engines/workSections.ts` — added the header `logo_image` element (`optional`, `fillMode:'system'`).
- `src/modules/templates/blockMocks/harness.ts` — seeded `tokenId` into the mock store state.
- `src/modules/templates/blockMocks/atelier.ts` — added `logo_image: ''` to the primary header fixture.
- `src/modules/skeletons/work/__tests__/imgPicker.test.tsx` — NEW jsdom regression test.

### Per-file changes

**primitives.ts** — `WorkToggleProps` (`elementKey`, `value?`, `label?`, `className?`, `children?`) + `Toggle: React.FC<WorkToggleProps>` on `WorkPrimitives`. Types-only, no runtime import — the firewall (core + both impls import this) is preserved.

**editPrimitives.tsx**
- Import: `MediaPickerModal` from `@/app/edit/[token]/components/ui/MediaPickerModal` — edit side only.
- `Img`: replaced the raw `<input type=file>` + `ctx.uploadImage` path with the CMS `ItemEditor` idiom — local `picking` flag → one `<MediaPickerModal open={picking} onOpenChange={setPicking} tokenId={ctx.tokenId} onPick={onPick}/>`. `onPick(url)` calls `saveField(ctx, elementKey, url)` — the EXACT write the upload path used (scalar `update`, or `updateCollection` for a collection-item path). The `.wk-img-edit` affordance markup is unchanged except the `<label><input file></label>` became a `<button onClick={setPicking(true)}>`; the Remove button is untouched. Wrapper stays static (non-positioned) per the existing parity note.
- `WorkEditCtx` + `useWorkEditCtx`: surfaced `tokenId` via `useEditStore((s) => (s as any).tokenId)` — the same token-scoped store field `WorkGalleryGrid.tsx` already reads as `s.tokenId` for its board deep-link. `ctx.uploadImage` left in place (type + wiring) since removing it was out of scope and harmless.
- `Toggle`: renders `children` + an absolute, `opacity:0`-until-hover flip button (`.wk-toggle-edit`, added to `EDIT_AFFORDANCE_STYLES`) — the `.wk-list-add`/`.wk-img-edit` zero-layout idiom, so the edit render adds NO in-flow node the published Toggle lacks. Flip writes the flag string `'true'`/`''` via `saveField`. Added to the exported `editPrimitives` object.

**publishedPrimitives.tsx** — `Toggle` renders only `<>{children ?? null}</>` (the visible chip is the core's job from the flag value). Added to the returned object. No new imports; no `MediaPickerModal`.

**workSections.ts** — `logo_image: { type:'string', requirement:'optional', fillMode:'system', default:'' }` added to `headerContract.elements`. `fillMode:'system'` = manual lane (never AI-emitted), per the global mechanism; the `str()` helper hard-codes `manual_preferred`, so this key is written as an explicit `ElementDef`. Render binding (`E.Logo imageKey="logo_image"`) already existed — no core edit.

**harness.ts** — `tokenId: 'harness-token'` added to `buildStoreState`'s returned state so the media-picker-wired `Img` resolves a `tokenId` under jsdom.

**atelier.ts** — `logo_image: ''` added to the primary header fixture (`atelier-header`). Empty → wordmark, byte-identical; `NON_VISIBLE_KEY` already matches `image`, so no regex edit.

**imgPicker.test.tsx** — mocks `MediaPickerModal` to a lightweight open/onPick stub; drives the edit `Img`/`Logo` primitives with a hand-built `WorkEditCtx`. Asserts: (1) empty `Img` click opens the picker with `ctx.tokenId` threaded; (2) `onPick` writes the url STRING to the scalar key; (3) `onPick` on a collection path writes into the item; (4) `Logo` (with src) inherits the picker and writes to `imageKey`; (5) published `Img`/`Logo` render plain `<img src>` with no picker surface; (6) `publishedPrimitives.tsx` has no `MediaPickerModal` import.

### tokenId-wiring approach

`useWorkEditCtx` reads `s.tokenId` from the token-scoped edit store (same field `WorkGalleryGrid.tsx` reads directly) and puts it on `WorkEditCtx.tokenId`. `Img` passes `ctx.tokenId` to `MediaPickerModal` (whose `/api/media` + `/api/upload-image` calls are token-scoped). No new store field or provider was needed.

### Keeping the picker out of the published path

`MediaPickerModal` (`'use client'`) is imported ONLY in `editPrimitives.tsx`. `publishedPrimitives.tsx` and every `.published.tsx` are untouched by it (grep-verified: the only "editPrimitives" hit in the published file is a descriptive comment, not an import; zero `MediaPickerModal` hits). The new test also asserts the no-import invariant. The Radix Dialog renders nothing while `open` is false, so the edit `Img` adds zero in-flow DOM vs published — parity band preserved.

### Test results

- `npx tsc --noEmit`: 1 error, PRE-EXISTING and unrelated — `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'`. Cause: this worktree has no generated `next-env.d.ts` (it is gitignored / produced by `next build`|`next dev`), so `next/image-types/global`'s `*.jpg` module declarations are absent. Not caused by any Phase-1 file (page.tsx/founder.jpg are outside scope; the asset exists). The phase-gate `npm run build` regenerates `next-env.d.ts` and clears it.
- `npm run test:run`: **287 files passed | 1 skipped; 4638 tests passed | 15 skipped**. Includes green `renderParity.work`, `coreParity` (count stays 19), `skinPurity`, `conformance`, `kundiusPages`, `oldContentFallback`, and the new `imgPicker` (7/7).

### Deviations from the plan

1. **`onPick` writes a bare url STRING, not the CMS `{url}` object.** The plan's phrase "writes the `{url}` string ... exactly where the upload path wrote it" was honored literally: the old upload path wrote `saveField(ctx, elementKey, url)` (a plain string), and both work renderers read `src` as a string. Writing a `{url}` object would break the render contract. (The CMS `{url}` shape is a CMS-value concern, not a work-primitive one.)
2. **Dropped the `'use client'` regex assertion from the firewall test** — `publishedPrimitives.tsx`'s header comment literally says "NO 'use client'", which the regex matched. The load-bearing guard (no `MediaPickerModal` import) is kept and tightened to `import[^\n]*MediaPickerModal`.
3. **`logo_image: ''` added to the PRIMARY header fixture only**, not the four mapped `WorkHeader*` variant fixtures. Empty `logo_image` is invisible and `NON_VISIBLE_KEY` ignores it, so the extra fixtures gain nothing; kept the change minimal. Flag if a later phase wants the variants seeded.

### Open risks

- The `Toggle` primitive has no consuming core yet (Packages wires it in Phase 2), so its parity behavior is only unit-proven here, not exercised by `renderParity.work`. Phase 2 must place `E.Toggle` inside a `position:relative` card so the absolute flip button anchors correctly.
- The pre-existing `next-env.d.ts`/`founder.jpg` tsc phantom will resolve at the phase gate's `npm run build`; if a reviewer runs bare `tsc` first they will see that one unrelated error.
- Full `lint` / `build` / `parity.spec.ts` were NOT run in this phase (per the task's minimum of tsc + test:run); they are the phase-boundary gate.

---

## Phase 2 — Packages quad end-to-end (PILOT)

### Files changed

- `src/modules/engines/workSections.ts` — packages contract: section scalar `category_label` + per-item `bullets` (manual_preferred), `image`/`featured` (`fillMode:'system'`).
- `src/modules/audience/work/injectPackages.ts` (NEW) — facts-verbatim `bullets` injector (group items -> per-tier bullets).
- `src/modules/audience/work/injectPackages.test.ts` (NEW) — injector unit tests + the parse-time system-key strip test.
- `src/modules/audience/work/parseCopy.ts` — DEFINITE `stripSystemKeys` guard + `injectPackages` wiring (optional `groups` param); narrowed `backfillWorkCollectionIds` to `id` only.
- `src/modules/audience/work/copyPrompt.ts` — `WORK_CHAR_CAPS` for `category_label`/`bullets` + a facts-verbatim `bullets` binding rule.
- `src/modules/skeletons/work/blocks/Packages/WorkPackages.core.tsx` — per-tier image (`E.Img`), dash-bullet list, "most booked" chip (`E.Toggle`), category label.
- `src/modules/skeletons/work/blocks/Packages/styles.ts` — `.wk-packages__img`/`:empty`/`-el`, `__flag`, `__cat`, `__bullets`/`__bullet` + `position:relative` card.
- `src/modules/templates/blockMocks/atelier.ts` — packages fixture: quad on 2 tiers, 3rd tier left empty (in-fixture graceful-empty).
- `src/modules/wizard/work/questionGating.test.ts` — regression tests: bullets ride the existing `groups` slot; no new slot introduced.
- `e2e/workWave2.spec.ts` (NEW) — filled-packages DOM parity (both bands) + empty-tier legacy-card proof (see Deviations re: registration).

### Per-file changes

**workSections.ts** — `category_label: str('optional')` (manual_preferred, AI-visible, no default injection since optional). Packages collection gains `bullets` (`FILL`, default `''`), `image` + `featured` (`fillMode:'system'`, default `''`). Item `id` stays system. `elementSchema.ts` derived — no edit.

**injectPackages.ts** — `injectPackages(sections, groups)`, sibling of `injectPraise`. Positional tier<->group mapping (the "one card per stated item" prompt rule guarantees it). `groups` present: each tier `bullets` = its group `items[].name` verbatim, facts order, clamped to `MAX_BULLETS` (8); a tier whose group states NO items has `bullets` STRIPPED to `''` (no fabrication). `groups` undefined/empty (silent): AI-drafted bullets untouched (allowed fallback — inclusions are the seller's own scope, low-risk vs praise). `category_label` NOT injected (see Deviations).

**parseCopy.ts** — `stripSystemKeys`: contract-driven deletion of AI-emitted values for every `fillMode:'system'` scalar element + collection field EXCEPT `id`. The uniform manual-lane AI-exclusion guard across first-gen + all regen; wired between defaults and injectPraise. `injectPackages` wired after praise via a new OPTIONAL 4th param `groups`. `backfillWorkCollectionIds` narrowed from "all system fields" to `id` ONLY — MANDATORY fix: with `image`/`featured` now system, the old backfill resurrected them with uuids right after the strip removed them (caught by the strip test).

**copyPrompt.ts** — caps `category_label:32`, `bullets:200`; a `hasPackages` binding rule: bullets are facts-verbatim-injected, so the model drafts them ONLY as a silent-facts fallback, never restating stated inclusions. Rule numbering shifts but `copyPrompt.factsLaw.test.ts` asserts substrings only — green.

**WorkPackages.core.tsx / styles.ts** — designer `.atl-pack` shape mapped onto today's card WITHOUT a `__body` wrapper (keeps direct-child order -> graceful-empty). Reused the existing price face + `--wk-pkg-price-fs` token (card mode already = `clamp(32px,3vw,42px)` = designer `.atl-price`) — NO new token.

### Decisions

- **Category-ask branch: NO new slot, NO `workFacts.schema` change, NO `workContract.test` edit.** `WorkFacts` has no category string (groups carry `name`/`kind` only), so `category_label` is AI-drafted / manual and needs no wizard ask. `workSlots.ts`/`StepQuestions.tsx`/`engines/work.ts`/`rail.ts` untouched. `questionGating.ts` needed no logic change; only its test was extended.
- **Token: reused `--wk-pkg-price-fs`** — designer price face matches the existing card-mode token exactly. No `tokenContract.ts`/test touch.
- **Facts-verbatim vs AI-draft:** `bullets` = facts-verbatim when the seller stated group items (authoritative, per-tier strip on empty), AI-draft when silent. `category_label` = AI/manual only.

### Graceful-empty per field (empty -> today's card markup)

- **image** — `E.Img` always rendered (picker reachable) with NO placeholder: published-empty = bare `<div class="wk-packages__img">` hidden by `.wk-packages__img:empty{display:none}` (visually byte-identical; one hidden DOM node). Edit-empty holds the picker affordance (never `:empty`). Filled -> 3:2 image pulled flush to card edges.
- **bullets** — rendered only when non-empty (split `<ul><li>`); empty -> nothing.
- **featured** — `E.Toggle` always (zero-layout flip control, Phase-1 idiom, anchored to the now-`position:relative` card); the visible `.wk-packages__flag` chip renders ONLY when `featured==='true'`. Off -> nothing.
- **category_label** — `E.Txt` with NO placeholder: published-empty -> `null` (no leak); edit-empty -> empty editable node.

### Deviations from the plan

1. **injectPackages is DORMANT until a route one-liner lands (plan Files-touched gap — flagged, NOT edited).** `injectPackages` needs `facts.work.groups`, which only a caller can supply. `parseWorkCopy` now takes an OPTIONAL `groups` param (in-scope, back-compatible), but the callers (`generate-copy/route.ts` L302, `regenerate-story/route.ts`, `scopedRegen.ts`) are OUT of Files-touched, so I did NOT edit them. First-gen facts-verbatim bullets populate only once `generate-copy/route.ts` passes `facts.groups` (a one-liner). The system-key strip is unaffected — it runs via every existing caller today.
2. **`backfillWorkCollectionIds` narrowed to `id`** (parseCopy.ts, in-scope) — required correctness fix, see above.
3. **`category_label` rendered as a SECTION-level label**, per the plan's "section scalar" — NOT per-card like the designer's `.atl-pack-cat` (4 distinct per-card categories). Per-card would need a per-ITEM field not in the Phase-2 contract. Founder gate to rule.
4. **`bullets` NOT inline-editable at the leaf** — plain split `<li>` (identical in both renderers, dash via CSS `::before`). AI/facts-authored + AI-regenerable per the plan; inline per-bullet editing would need a `saveField`/primitive change (out of scope). "picker sets tier image / toggle flips chip" met; manual bullet-add on an empty tier is not (edited via regen).
5. **`e2e/workWave2.spec.ts` written but UNREGISTERED.** Playwright config uses an explicit testMatch ALLOWLIST; adding the spec to the `public` project requires editing `playwright.config.ts` (NOT in Files-touched) — not done. Spec is currently unrunnable ("No tests found"). Edit<->published parity of the filled quad IS covered by the registered `parity.spec.ts` (atelier/packages = 1.117%), content parity by `renderParity.work` + `kundiusPages` (green with the quad fixture).

### Test results (full phase gate)

- `npx tsc --noEmit` — CLEAN (0 errors; the Phase-1 `founder.jpg` phantom did not recur).
- `npm run test:run` — **288 passed | 1 skipped; 4647 passed | 15 skipped** (+9 vs Phase 1). Green: `renderParity.work`, `coreParity` (count stays 19), `skinPurity`, `conformance`, `kundiusPages`, `oldContentFallback`, new `injectPackages` (9/9), `questionGating`, `parseCopy`, `copyPrompt.factsLaw`.
- `npm run lint` — clean (pre-existing `<img>`/hook warnings only; none in touched files).
- `npm run build` — SUCCEEDED.
- `npx playwright test e2e/parity.spec.ts --project=public` — atelier ALL bands pass; **atelier/packages [#17] = 1.117%** (< 3%). The 2 failures are `atelier2` ("Page crashed"/180s timeout) — PRE-EXISTING and unrelated: reproduced identically with all Phase-2 changes `git stash`ed. No atelier2 file is in scope.
- `e2e/workWave2.spec.ts` — not run (unregistered; Deviation 5).

### Open risks

- **Facts-verbatim bullets inert until the `generate-copy/route.ts` one-liner** (Deviation 1). The pilot's "fresh generation -> bullets verbatim" acceptance needs it — orchestrator decision: add the route to scope, or accept as a follow-on.
- **`category_label` section-vs-per-card** (Deviation 3) is a Phase-2 HUMAN-GATE (a) eyeball item.
- **Image flush uses negative margins** counter to card padding; a future card-padding change must track the offsets (both are `clamp(22px,2.6vw,34px)` today).
- atelier2 parity-stage crash is pre-existing and orthogonal to this wave.

### Phase 2 completion (gaps 1+2)

Closes prior Deviations #1 and #5 (the two dormant lanes). Orchestrator authorized editing exactly two files: `generate-copy/route.ts` + `playwright.config.ts`.

**Files changed (this pass)**
- `src/app/api/audience/work/generate-copy/route.ts` — threaded `facts.groups` into BOTH `parseWorkCopy` calls (mock L195, main ~L305), as the new 4th arg, mirroring `facts.praise`.
- `playwright.config.ts` — registered `/workWave2\.spec\.ts/` in the `public` project's `testMatch` allowlist.

**GAP 1 — injectPackages LIVE on first-gen.** In this route `facts = getWorkFacts(brief.facts)` returns the `WorkFacts` object directly, so praise is read as `facts.praise` and groups as `facts.groups` (the "facts.work.groups" of the contract, already unwrapped one level). injectPraise's data-flow: `facts.praise` is passed as `parseWorkCopy`'s 3rd arg on BOTH the mock path (L195) and the real path (main). I mirrored it EXACTLY — appended `facts.groups` as the 4th arg on both call sites (same source object `facts`, same access pattern, both paths). No new data channel; the value is `readonly WorkGroup[] | undefined`, matching the existing optional 4th param. First-gen facts-verbatim bullets now populate.

**Regen decision (what I found + what I did).** injectPraise IS wired on the regen paths, so per the precedent-matching rule groups "should" flow there too — BUT that requires editing files outside my authorized two:
- `src/modules/generation/scopedRegen.ts` L904-908 calls `parseWorkCopy(response, workUiblocks, workFacts?.praise)` — praise passed, groups omitted (pre-existing since regen-modernization; no uncommitted diff; NOT in Phase 2 Files-touched).
- `src/app/api/audience/work/regenerate-story/route.ts` L205-209 calls `parseWorkCopy(response, ABOUT_UIBLOCKS, facts.praise)` — praise passed, groups omitted. (This route regenerates the `about` section only; packages are never in `ABOUT_UIBLOCKS`, so injectPackages is a structural no-op here regardless.)
- So the ONE regen path where matching the precedent would materially change behavior is `scopedRegen.ts` (section/element regen of a packages section). Passing `groups` there requires editing `scopedRegen.ts`, which is NOT in my Files-touched and is explicitly excluded by the orchestrator's "touch ONLY" constraint. Per the hard Files-touched rule I did NOT edit it. **Flagged for orchestrator:** to make injectPackages behave IDENTICALLY to injectPraise on regen, a follow-on one-liner in `scopedRegen.ts` L904-908 must thread `workFacts?.groups` as the 4th `parseWorkCopy` arg (facts already in scope at L641/`workFacts`). Left as a divergence-by-scope, not a silent choice.

**GAP 2 — e2e registration.** `e2e/workWave2.spec.ts` is a no-auth dev-stage spec (`/dev/blocks/atelier`, same public stage `parity.spec.ts` uses), so it belongs in the `public` project, not `authed`. Added `/workWave2\.spec\.ts/` to that allowlist. Ran `npx playwright test e2e/workWave2.spec.ts` — **1 passed (37.7s)**; the quad + graceful-empty assertions hold in BOTH bands.

**GAP 3 — regen path closed (this pass).** Orchestrator authorized editing ONLY `scopedRegen.ts` to finish the divergence flagged above. The `parseWorkCopy` call at scopedRegen.ts L904-908 changed from `parseWorkCopy(response as ..., workUiblocks, workFacts?.praise)` to `parseWorkCopy(response as ..., workUiblocks, workFacts?.praise, workFacts?.groups)` — one line added (`workFacts?.groups,` as the 4th arg), mirroring the `workFacts?.praise` 3rd arg EXACTLY (same `workFacts?.` optional access, same `readonly WorkGroup[] | undefined` shape as the 4th param added in this phase). `workFacts` is already in scope at this call site (L837 `const workFacts = engine === 'work' ? requireWorkFacts(project) : null`); no new import needed. injectPackages now matches injectPraise on ALL regen paths — packages-section regen re-injects facts-verbatim bullets instead of leaving AI drafts, exactly as praise is re-injected. (regenerate-story remains a structural no-op for packages since `ABOUT_UIBLOCKS` never contains a packages section.) Gate: `npx tsc --noEmit` CLEAN; `npm run test:run` **288 passed | 1 skipped; 4647 passed | 15 skipped** (unchanged from GAP-1/2); `npm run lint` clean (pre-existing `<img>`/hook warnings only, none in scopedRegen.ts). build + e2e unaffected by an arg-threading (skipped). No surprises — `workFacts.groups` was already an optional field on the `WorkFacts` schema (L162) and the 4th param already existed.

**Full gate (this pass)**
- `npx tsc --noEmit` — CLEAN (no `founder.jpg` phantom; no build regen needed).
- `npm run test:run` — **288 passed | 1 skipped; 4647 passed | 15 skipped** (unchanged — the wiring is a runtime thread, not new test surface).
- `npm run lint` — clean (pre-existing `<img>`/hook warnings only; none in touched files).
- `npm run build` — SUCCEEDED.
- `npx playwright test e2e/workWave2.spec.ts` — **1 passed**.

**Open risk (updated).** First-gen facts-verbatim bullets are now LIVE (GAP 1 done). Regen (section/element) of a packages section still leaves bullets AI-drafted because `scopedRegen.ts` does not pass `groups` — a scope-gated divergence from the injectPraise precedent, pending the orchestrator-authorized one-liner above.

---

## Phase 2b — per-card category (founder gate decision)

Founder gate ruled `category` = PER-CARD (per-tier), matching the designer `.atl-pack`
(each tier card shows its own category), NOT the Phase-2 section-level scalar. This
phase converts the section scalar `category_label` → a per-item collection field
`category`. Forward-modifies committed Phase 2 (`b507a5f6`).

### Files changed

- `src/modules/engines/workSections.ts` — packages contract: REMOVED the section-level
  scalar `category_label`; ADDED per-item `category` to the `packages` collection `fields`.
- `src/modules/audience/work/copyPrompt.ts` — replaced the `category_label:32` cap with a
  per-item `category:24` cap; added a `hasPackages` drafting rule (each tier gets a short
  1-3 word category, distinct from its name).
- `src/modules/audience/work/injectPackages.ts` — updated the LAW comment (`category_label`
  → per-tier `category`); NO logic change (category has no facts source, never injected).
- `src/modules/skeletons/work/blocks/Packages/WorkPackages.core.tsx` — removed the
  section-level category `E.Txt`; added a per-card category `E.Txt` (key
  `packages.<id>.category`) as a kicker above the tier name; added `category?` to
  `WorkPackage`, removed `category_label?` from `WorkPackagesContent`, seeded `category:''`
  in `makeItem`.
- `src/modules/skeletons/work/blocks/Packages/styles.ts` — repointed the `.wk-packages__cat`
  comment to per-tier; margin `12px 0 0` → `0 0 -8px` (kicker tight above name).
- `src/modules/templates/blockMocks/atelier.ts` — moved category off the section into the
  two filled tiers (`pk1:'Commercial'`, `pk2:'Editorial'`); empty tier (`pk3`) left blank.
- `e2e/workWave2.spec.ts` — swapped the section-scalar category assertion for per-card:
  filled tiers' text visible in BOTH bands; count/empty-tier-absence checked PUBLISHED-only
  (see graceful-empty note); added empty-tier no-category assertion (published band).

### New contract shape

```
packages (collection) fields:
  category: { type: 'string', fillMode: 'manual_preferred', default: '' }   // optional, per-tier
```
Lane = `manual_preferred` (AI-drafted + editable) — NOT `fillMode:'system'` — because
WorkFacts has no category source; the AI drafts it, the seller edits it. Optional
(default `''`) so absent = graceful-empty. The section-level `category_label` scalar is
GONE from `packages.elements`.

### Graceful-empty confirmation

- **Published** (Kundius byte-identical): `publishedPrimitives.Txt` returns `null` when value
  is empty with no placeholder → a tier with no category renders NO node. The card's flex
  gap only spans present children, so an uncategorised tier is byte-identical to today.
  e2e asserts this on the empty tier (published band).
- **Edit**: an empty optional `E.Txt` still mounts an empty editable node (`InlineTextEditorV2`),
  which is the normal editor affordance for any optional field (click-to-fill). This is
  edit-only and does not reach published output — so the strict category count / empty-tier
  absence checks are PUBLISHED-band-only in the e2e (deviation noted below). `category` is
  visible text → no `NON_VISIBLE_KEY` change.

### Deviations

- **e2e count assertions are published-band-only.** In the edit renderer an empty optional
  category mounts an empty editable node, so `.wk-packages__cat` count = 3 (all tiers) in
  edit vs 2 in published. Conservative choice: assert filled-tier category TEXT in both
  bands (robust to empty nodes), and strict count / empty-tier-absence in published only
  (the graceful-empty guarantee is a published-output contract). No scope change.
- **styles.ts margin** `0 0 -8px` chosen so the kicker sits tight above the name within the
  card's `gap:14px` flex column; edit↔published render the same markup so parity is
  unaffected regardless.

### Full gate

- `npx tsc --noEmit` — clean. (One transient self-inflicted error: a backtick in a CSS
  comment inside the `WORK_PACKAGES_STYLES` template literal — removed.)
- `npm run test:run` (full vitest) — **288 passed | 1 skipped** (4647 passed / 15 skipped).
  Includes renderParity.work, coreParity, skinPurity, conformance, kundiusPages,
  oldContentFallback, injectPackages — all green.
- `npm run lint` (touched files) — clean.
- `npm run build` — SUCCEEDED.
- `npx playwright test e2e/workWave2.spec.ts` — **1 passed** (per-card category in both
  bands; empty tier stays legacy).
- `npx playwright test e2e/parity.spec.ts` — **atelier per-section parity PASSED** (packages
  band under threshold, <3%). Two `atelier2` tests FAILED — see surprise below.

### Surprise (pre-existing, NOT this change)

`parity.spec.ts` TEMPLATES still lists a stale `atelier2`, but `atelier2` is NOT in
`templateRegistry` (the old atelier2 skeleton barrel was folded into `templates/atelier/`).
So `/dev/blocks/atelier2` hits `notFound()`, no parity band ever renders, and both
`atelier2` tests time out on `waitForSelector('[data-parity-band="published"]')` —
deterministically, independent of this diff (reproduced on re-run). Both `parity.spec.ts`
and `registry.ts` are outside this phase's Files-touched, so left untouched. The live
`atelier` per-section parity (which covers the packages band) is green.

---

## Phase 3 — About: portrait (4:5) / signature / badge

### Files changed

- `src/modules/engines/workSections.ts` — added 3 About fields to the `fromDonor`-built about schema EXPLICITLY.
- `src/modules/audience/work/copyPrompt.ts` — `badge` char cap (36) + a `hasAbout` binding rule (badge DISTINCT from eyebrow).
- `src/modules/wizard/generation/work.llm.ts` — NEW pure exported helper `stampAboutSignature` + its first-gen call site in `runFanOut`.
- `src/hooks/editStore/aiActions.ts` — story-regen merge skip predicate: `if (key === 'signature') return;` (belt).
- `src/hooks/editStore/aiActions.test.ts` — NEW store test: story-regen merge-survival regression.
- `src/modules/wizard/generation/work.llm.test.ts` — added a `stampAboutSignature` unit-test describe block (Deviation 1: file NOT on Files-touched).
- `src/modules/skeletons/work/blocks/About/WorkAbout.core.tsx` — portrait art (`E.Img`) + overlaid badge + serif signature; `WorkAboutContent` gains `portrait_image?`/`badge?`/`signature?`.
- `src/modules/skeletons/work/blocks/About/styles.ts` — `.wk-about__art`/`__portrait`(+`:empty`)/`__portrait-img`/`__badge`/`__sign`.
- `src/modules/templates/blockMocks/atelier.ts` — about fixture: portrait/badge/signature on the filled fixture; `editBasics.text += badge, signature`.
- `src/modules/audience/work/parseCopy.ts` — VERIFY-ONLY, NO edit (below).

### Contract shape (donor-add mechanism)

`about` is `fromDonor(writerElementSchema.GranthParichay, 'about')`. `fromDonor` copies only the donor's OWN keys (eyebrow/heading/bio + facts[]), blanking string defaults — it does NOT know Wave-2 fields. So the 3 new fields are assigned onto the returned `aboutContract.elements` EXPLICITLY:

```
portrait_image: { type:'string', requirement:'optional', fillMode:'system', default:'' }  // manual media lane
signature:      { type:'string', requirement:'optional', fillMode:'system', default:'' }  // manual lane; name default at first-gen
badge:          str('optional')  // fillMode:'manual_preferred', default '' — AI-drafted, editable
```

All optional (regenerate-story collision safety). `portrait_image`/`signature` = `fillMode:'system'` → excluded from the AI spec by the existing `isSystemField` skip and auto-stripped by the Phase-2 `stripSystemKeys`. `badge` = `manual_preferred` → AI-emitted + regenerable normally.

### parseCopy.ts — verify-only (NO edit), exactly as the plan predicted

`stripSystemKeys` (Phase 2) iterates `schema.elements` and deletes any `fillMode:'system'` scalar. Once `signature`/`portrait_image` are declared `fillMode:'system'` on the about contract, they are dropped from any AI/regen output at parse automatically. No signature logic added here — this is precisely WHY signature is not injected in parse: `parseWorkCopy` is called by the story-regen route, so a parse-time inject would re-emit `signature=name` every regen and clobber a user-customized signature.

### Signature stamp — where + how (work.llm.ts), and why not parseCopy

New pure exported helper `stampAboutSignature(fc, name)`: walks `fc.content` (flat home) + every `fc.pages[*].content`, matches sections by `id.startsWith('about-')`, sets `elements.signature = name.trim()` ONLY when empty (`if (!el.signature)`) — never clobbers a user value, idempotent on resume, no-op on empty name.

Call site: in `runFanOut`, immediately AFTER the `runWorksFanOut` try-block (before `finalizeMultiPageGeneration`), as `stampAboutSignature(fc, getWorkFacts(input.brief?.facts)?.identity?.name)`. First-gen ONLY (work.llm.ts is unreachable by scoped/story regen), facts in scope, same stamp call-site family the plan names — NOT `parseCopy.ts` (story-regen clobber), NOT `multiPageAssembly.ts` (no facts in scope).

**Deviation from the plan's literal L202 placement (Deviation 2).** The plan said "beside `stampWorkGalleryBinding(fc, entries)` (L202)", which is INSIDE `runWorksFanOut`. But `runWorksFanOut` early-returns (`entries.length === 0`) when facts yield no derivable works entries — and a signature=name default has nothing to do with photos. Placing it at L202 would silently skip the signature on any such run. So it lives in `runFanOut` at the works-binding region (always runs on fresh gen) — strictly dominant on correctness while honoring every other constraint. Phase 4's photo-derived `stampHeroSlides` can still sit at L202.

### aiActions.ts belt — exact line

Story-regen apply block ONLY (~L382, the block WITHOUT the "Merge new content — skip image elements" comment). Added as the FIRST line inside `Object.entries(data.content).forEach(...)`:

```
if (key === 'signature') return;
```

directly above the existing `if (isImageValue(existingElements[key]) || isImageKey(key)) return;`. The `regenerateSection` twin (~L182, WITH the comment) was NOT touched — it is covered by the Phase-2 parse-time `stripSystemKeys`. One guard line + comment, no merge refactor.

### Graceful-empty per field (empty → today's about markup exactly)

- **portrait_image** — `E.Img`, NO placeholder. Published-empty → bare `<div class="wk-about__portrait"></div>` → `.wk-about__portrait:empty{ display:none; margin:0 }` → zero space; `.wk-about__art` carries no margin/padding → 0-height, invisible → head column = today's eyebrow+heading. Edit-empty keeps the picker affordance (editor-only; Phase-1/2 image precedent).
- **badge** — `E.Txt`, NO placeholder → published-empty returns `null` (no node, no leak).
- **signature** — `E.Txt`, NO placeholder → published-empty returns `null`; `.wk-about__sign` margin applies only when the node exists → no reflow.

The portrait is the first child of the existing `.wk-about__head` column (above eyebrow) — the 2-col `head | body` grid is unchanged, so no column is added/reflowed when empty. Filled: left column = portrait+badge over eyebrow+heading; signature = serif sign-off after the bio.

### Story-regen survival test (aiActions.test.ts)

Store test on the `createAIActions(set, get)` harness (cloned from `aiActions.credits.test.ts`; mocks `posthog-js` + `@/utils/autoSaveDraft`). Seeds an about section with customized `signature`/`badge`/`portrait_image`, drives `regenerateStoryFromInterview`: (1) response `{heading,bio}` → heading/bio update, the 3 preserved (absent from response); (2) hostile response echoing `signature`/`portrait_image` → heading updates, signature preserved (belt), portrait_image preserved (isImageKey). Both green.

`stampAboutSignature` unit tests (work.llm.test.ts): stamps empty signature; never clobbers a user value; stamps in-page about sections; no-op on empty/undefined name; touches only `about-*`. All green.

### Full gate

- `npx tsc --noEmit` — CLEAN (no `founder.jpg` phantom).
- `npm run test:run` — **289 passed | 1 skipped; 4654 passed | 15 skipped** (+7 tests, +1 file vs Phase 2b). Green: `renderParity.work`, `coreParity` (count stays 19), `skinPurity`, `conformance`, `kundiusPages`, `oldContentFallback`, `workContract`, `injectPackages`, new `aiActions` (2/2), `stampAboutSignature` (5/5).
- `npm run lint` — clean (pre-existing `<img>`/hook warnings only; zero errors; none in touched files).
- `npm run build` — SUCCEEDED.
- `npx playwright test e2e/parity.spec.ts --project=public` — **atelier ALL bands pass; atelier/about [#18] = 0.258%** (< 3%); the `atelier` per-section parity test passed. The 2 failures are the PRE-EXISTING `atelier2` timeouts (stale `atelier2` in the spec's TEMPLATES, not in the registry → 404 → time out), reproduced identically and documented in the progress log; `parity.spec.ts` is outside Files-touched.

### Deviations

1. **`work.llm.test.ts` edited though NOT on Files-touched.** Phase 3 step 5 mandates a signature-stamp unit test and names "wherever `work.llm.ts` behavior is already tested" as the home; Files-touched omitted the test file. `work.llm.test.ts` is the direct test twin of the (listed) `work.llm.ts` and already imports the same module — adding a `stampAboutSignature` describe block there is within phase intent, not scope creep. Flagged for the reviewer.
2. **Signature stamp placed in `runFanOut` (always-runs), not literally inside `runWorksFanOut` at L202** — conservative correctness (avoids the no-entries early-return skipping the name-only default). In scope (only `work.llm.ts` touched).
3. **Badge fixture default "Kristina · Amsterdam"** (a name·place stamp) — matches designer `.atl-badge` and the binding rule (distinct from eyebrow "About"). Fixture-only.

### Open risks

- Edit-mode empty portrait shows a picker affordance box in the EDITOR (editor-only; published collapses via `:empty`) — same accepted behavior as Phase-2 packages image. The live Kundius PUBLISHED page stays byte-identical; the editor gains an "add portrait" affordance. No migration.
- Badge is `manual_preferred` → AI drafts it fresh; if the model echoes the eyebrow despite the binding rule it is an editable copy nit, not a structural regression.
- Pre-existing `atelier2` parity timeouts remain (orthogonal; flag at merge gate).

---

## Phase 4 — Hero: `slides[]` collection + 2nd CTA

### Files changed

- `src/modules/engines/workSections.ts` — hero contract: explicit `slides` collection + `cta2_label`/`cta2_href` scalars on the `fromDonor`-built hero schema.
- `src/modules/generation/workCollections.ts` — NEW pure `stampHeroSlides(fc, entries)` (reuses `pickCover` + `deriveWorksEntries` output).
- `src/modules/generation/workCollections.test.ts` — NEW `stampHeroSlides` describe block (6 tests).
- `src/modules/wizard/generation/work.llm.ts` — first-gen `stampHeroSlides` call in `runFanOut` (import + one call beside `stampAboutSignature`).
- `src/modules/audience/work/copyPrompt.ts` — `cta2_label` char cap (28).
- `src/modules/skeletons/work/blocks/Hero/WorkHeroSlider.core.tsx` — the two-branch slider fork + 2nd CTA; content type gains `slides`/`cta2_label`/`cta2_href`.
- `src/modules/skeletons/work/blocks/Hero/styles.ts` — slider (slides/arrows/dots) + ghost-CTA CSS.
- `src/modules/templates/blockMocks/atelier.ts` — NEW multi-slide hero fixture (`atelier-hero-slides`); the primary `atelier-hero` fixture kept single-image.
- `e2e/workWave2.spec.ts` — hero-slider assertions (multi-slide hooks + single-image bail).

`multiPageAssembly.ts` (listed "only if the stamp must run post-fan-out") was NOT needed — the stamp runs in `work.llm.ts` `runFanOut` (facts in scope), same call-site family as Phase 3's `stampAboutSignature`.

### Contract shape (donor-add mechanism)

`hero` is `fromDonor(writerElementSchema.GranthArchedHero, 'hero')`; `fromDonor` copies only the donor's own keys, so Wave-2 hero fields are assigned onto the returned schema EXPLICITLY:

```
cta2_label:  str('optional')                                                  // manual_preferred — AI-drafted, char cap 28
cta2_href:   { type:'string', requirement:'optional', fillMode:'system', default:'' }  // manual lane — never AI-emitted
collections.slides: {
  requirement:'optional', fillMode:'manual_preferred', constraints:{min:0,max:6},
  fields: { id:{type:'string',fillMode:'system'}, image:{type:'string',fillMode:'system',default:''} }  // both manual/system
}
```

All optional (validation-storm safe). `slides.image`/`slides.id`/`cta2_href` = `fillMode:'system'` → excluded from the AI spec by the existing `isSystemField` skip and auto-dropped by the Phase-2 `stripSystemKeys` parse guard (no `parseCopy.ts` edit needed — verified: system fields covered generically). `cta2_label` = `manual_preferred` → AI-drafted + regenerable normally.

### `stampHeroSlides` — derive + where called + never-overwrite guard

New pure exported helper in `workCollections.ts`: builds `{id:'slide-<slug>', image:<cover>}` per entry, reusing `pickCover(entry.photos)` and dropping entries whose cover is empty (a hidden cover already fell back / a hidden-only group has no cover → no slide, since `deriveWorksEntries` is the single hide-not-destroy choke point). Walks `fc.content` (flat home) + every `fc.pages[*].content`, matches sections by `id.startsWith('hero-')`, and writes `el.slides` ONLY when the hero has no non-empty `slides` array — the never-clobber-user-slides guard (so a per-slide picker edit + a resume re-run are both idempotent). No entries / no covers ⇒ no-op (single-portrait hero byte-identical).

Call site: `runFanOut` (`work.llm.ts`), immediately after `stampAboutSignature`, as `stampHeroSlides(fc, deriveWorksEntries(getWorkFacts(input.brief?.facts)))`. First-gen ONLY (unreachable by scoped/story regen → no clobber by construction), runs unconditionally on fresh gen (not inside `runWorksFanOut`, which early-returns when there are no derivable works entries).

### Hero hooks added (EXACT — match workBehaviors.js verbatim)

The core previously emitted only root `data-wk-hero-slider` + one `wk-hero__media`/`wk-hero__media-in`. Added, spelled exactly as `workBehaviors.js` L42-72 (and the editor `WorkHeroSlider.tsx` effect, which was ALREADY wired for them) query them:

- `[data-wk-interval]` on the `[data-wk-hero-slider]` section root (value `"5000"`) — multi-slide branch only.
- `.wk-hero__slide` per slide (first slide carries `is-active` in static markup → shows with no JS).
- `[data-wk-prev]` / `[data-wk-next]` on the two arrow `<button>`s.
- `[data-wk-dots]` on the EMPTY dots container (JS injects `.wk-hero__dot`).

No existing hero selector renamed; no `workBehaviors.js` edit; `work.v1.js` UNCHANGED (git-verified: `git status public/assets/` clean after `npm run build`; still exactly `work.v1.js`, no new filename). The dot/`is-active` class names also match the styles I added (`.wk-hero__dot`, `.wk-hero__slide.is-active`).

### Fork logic + byte-identical single-image fallback

`isSlider = slides.length >= 2`. `slides>=2` → `.wk-hero__slides` wrapper with per-slide `.wk-hero__slide` (E.Img per slide, picker-wired via `slides.<id>.image`) + arrows + empty dots + `data-wk-interval` on the root. `else` (0/1 slide, incl. Kundius) → EXACTLY today's `wk-hero__media` / `wk-hero__media-in` single-media DOM from `portrait_image`, with NO `data-wk-interval` on the root → the JS bails (<2 slides). Kundius (empty `slides`) renders the single-media branch byte-identical (kundiusPages / oldContentFallback green untouched). Slides rendered via a manual `.map` (not `E.List`) so the first slide can carry `is-active` in static markup — required for the no-JS/degradation state and for edit↔published parity on the parity stage (E.List applies its `itemClassName` uniformly and cannot mark only the first item). Per-slide picker override still works (each slide is an `E.Img` on the collection-item path); add/remove-slide chrome is not exposed (slides are auto-derived; deviation below).

### 2nd-CTA href-gating refinement (orchestrator-approved)

The plan said "renders only when label set". Refined to render the 2nd CTA ONLY when `cta2_href` is present: `cta2_label` is AI-drafted but `cta2_href` is manual, so gating on label alone would ship a dead hrefless button on fresh generation. When `cta2_href` is present but `cta2_label` is empty, the label falls back to a sensible default ("Learn more") via the primitive placeholder (published `Txt` renders `value || placeholder`). Ghost/outline style variant (`.wk-hero__cta--ghost`).

### Fixture strategy (why two fixtures)

The primary `atelier-hero` fixture stays SINGLE-IMAGE (Kundius byte-identical + the e2e single-image bail case). A NEW `atelier-hero-slides` fixture (layout `WorkHeroSlider`, 2 slides + cta2) exercises the multi-slide fork. The two slides use the SAME image url so the editor `WorkHeroSlider.tsx` effect's autoplay (is-active swap across slides) is visually inert on the parity stage → deterministic edit↔published screenshot, while still exercising the 2-slide DOM. The ONLY residual edit-vs-published divergence on that band is the JS-injected dots (editor injects `.wk-hero__dot`; the dev-stage published band has no JS) — measured at 0.375% (see parity band below). `NON_VISIBLE_KEY` unchanged (slide `image`/`id` match `image`/`^id$`; `cta2_href` matches `href`).

### Full gate

- `npx tsc --noEmit` — CLEAN (after fixing one self-inflicted error: backticks inside a CSS comment in the `WORK_HERO_STYLES` template literal terminated the string — the same trap the Phase-2b audit records; removed the backticks).
- `npm run test:run` — **289 passed | 1 skipped; 4664 passed | 15 skipped** (+10 vs Phase 3). Green: `renderParity.work`, `coreParity` (count stays 19 — a collection/fixture is not a new core), `skinPurity`, `conformance`, `kundiusPages`, `oldContentFallback`, `workContract`, `work.llm`, new `stampHeroSlides` (6/6).
- `npm run lint` — clean on all touched files.
- `npm run build` — SUCCEEDED; `work.v1.js` unchanged, no new asset filename (`git status public/assets/` clean).
- `npx playwright test e2e/workWave2.spec.ts` — **2 passed** (packages quad + hero slider: 2 slide nodes, first `is-active`, arrows/dots/interval hooks, empty dots container, 2nd CTA visible; single-image band = exactly 1 `wk-hero__media`, 0 `.wk-hero__slide`, no interval hook).
- `npx playwright test e2e/parity.spec.ts` — atelier ALL bands < 3%: **atelier/hero [#1] (single-image) = 0.014%**, **atelier/hero [#2] (NEW multi-slide) = 0.375%**, arrangement heroes [#11/#12/#13] = 0.064/0.133/0.149%. meridian/hearth green. The 2 `atelier2` failures are the PRE-EXISTING stale-registry timeouts (atelier2 not in the registry → 404 → `waitForSelector` timeout), documented in the Phase 2b/3 audit + progress log; `parity.spec.ts` + `registry.ts` are outside this phase's Files-touched.

### Deviations from the plan

1. **Slides rendered via a manual `.map`, not `E.List`.** The plan named "`E.List` + per-item `E.Img`". `E.List` applies its `itemClassName` uniformly and cannot put `is-active` on only the FIRST slide — which is required both for the no-JS degradation state and for edit↔published parity (the dev-stage published band has no JS to add `is-active`; without it in the markup the published band would show a blank hero vs the editor's active first slide → parity break). Manual `.map` keeps per-slide `E.Img` picker override; the add/remove-slide list chrome is not exposed (slides are auto-derived, and the load-bearing need is per-slide image override).
2. **2nd CTA gates on `cta2_href`, not `cta2_label`** — the orchestrator-approved refinement recorded above.
3. **Two hero fixtures (single-image primary kept + new multi-slide added), multi-slide uses identical slide images** — to keep the primary/Kundius band byte-identical AND the multi-slide parity screenshot deterministic under the editor autoplay effect. Recorded above.

### Open risks

- The multi-slide parity band carries a tiny (0.375%) edit-vs-published delta from the editor effect's runtime dot injection into an empty `[data-wk-dots]` (the published dev-stage band has no JS). It is the documented, expected shape (mirrors the atelier2 single-slide note) and sits far under the 3% threshold; on a REAL published page `work.v1.js` injects the same dots, so live edit==published holds.
- No add/remove-slide affordance in the editor yet (Deviation 1); per-slide image override works. If designers need manual slide add/remove, a follow-on can extend the core to `E.List` with a per-first-item `is-active` mechanism.
- Pre-existing `atelier2` parity timeouts remain (orthogonal; flag at merge gate).
