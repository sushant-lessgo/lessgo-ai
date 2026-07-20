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
