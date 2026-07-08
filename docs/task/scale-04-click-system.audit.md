# scale-04 Phase 1 — audit

## Files changed
- `src/types/destination.ts` (new) — Destination union, CTAButton, Link, type guards
- `src/utils/destinationShim.ts` (new) — `toDestination` + `LegacyButtonConfig`
- `src/utils/resolveCtaHref.ts` (rewritten) — added `resolveDestination`, wrapper now routes through shim; kept `externalLinkProps` unchanged
- `src/utils/destinationShim.test.ts` (new) — mapping table + resolver-per-kind
- `src/utils/resolveCtaHref.test.ts` (new) — wrapper byte-identical parity net
- `src/types/core/content.ts` — additive `cta?: CTAButton` on `elementMetadata` value

## Per-file

### src/types/destination.ts
`Destination` = discriminated union on `kind` (`section|page|external|whatsapp|call|email|download|social`). `CTAButton{role,dest:'GOAL_REF'|Destination,formId?}`, `Link{dest,source}`. Guards `isDestination/isGoalRef/isCTAButton/isLink` are plain predicates (server-safe). Guards distinguish new shapes from legacy `buttonConfig` (which has `type`, not `role`/`source`).

### src/utils/destinationShim.ts
Plain module (no `'use client'`). `LegacyButtonConfig` is the superset of the 3 divergent scout interfaces (all fields optional). `toDestination` dispatches: string→`classifyString`; `isCTAButton`/`isLink`→`.dest`; else legacy `type` switch (`page`→page, `link`/`link-with-input`→`classifyString(url)`, `form`→`undefined` per D-D, default→`undefined`). `classifyString` order: `#`→section(anchor without `#`), `/`→page, `tel:`→call, `mailto:`→email, wa.me/api.whatsapp.com→whatsapp, default→external (verbatim).

### src/utils/resolveCtaHref.ts
`resolveDestination(dest)` is the new dumb core. Wrapper `resolveCtaHref(buttonConfig, forms, fallback='#cta')` keeps the exact legacy signature.

## Byte-identical reasoning (the point of Phase 1)
Old wrapper had 5 branches; each maps 1:1:
- `!buttonConfig` → `fallback`. Preserved verbatim (first line).
- `type:'form'` → formId check + `forms?.[formId]` check → `'#form-section'` else `fallback`. Kept INLINE in the wrapper, character-for-character (D-D — this check is not pure so the shim never sees it).
- `type:'page'` → old `pathSlug || fallback`. New: `toDestination`→`page{pathSlug: pathSlug ?? ''}`→`resolveDestination`→`pathSlug` string; wrapper `resolveDestination(dest) || fallback` reproduces `pathSlug || fallback`.
- `type:'link'|'link-with-input'` → old `url || fallback`. New: `classifyString(url ?? '')`→some Destination→`resolveDestination` round-trips the url verbatim (external default guarantees any string round-trips; empty→`''`→`|| fallback`). Note `classifyString` may classify `#x`/`/x`/`tel:` etc. urls, but each round-trips to the identical string, so href output is unchanged.
- else (unknown/absent type) → old `fallback`. New: `toDestination`→`undefined`→wrapper returns `fallback`.

`externalLinkProps` is untouched.

Whatsapp is the one non-verbatim reconstruction: `resolveDestination(whatsapp)` emits canonical `https://wa.me/<number>[?text=<enc>]`. For canonical stored inputs (the LinkTargetPopover writes verbatim, users type `https://wa.me/<n>`) this round-trips byte-identically. A NON-canonical stored whatsapp link inside a legacy `type:'link'` buttonConfig (e.g. `api.whatsapp.com/send?...` or `+`-encoded text) would resolve to the canonical form and thus differ from the old verbatim output. This is a deliberate D-D directive (classify wa.me even in the legacy link path). Logged under Deviations/risks.

## Deviations
- **link-with-input formId not returned by `toDestination`.** D-D says "fold into external{url}+formId". `toDestination`'s return type is `Destination|'GOAL_REF'|undefined` with no formId slot; formId lives on `CTAButton` separately. `toDestination` emits only the url Destination (href-lossless — formId is irrelevant to href). Conservative, matches the stated return signature.
- **Whatsapp canonical reconstruction** (above) — non-canonical legacy whatsapp URLs stored as `type:'link'` would change output. Real legacy data is canonical wa.me strings, so byte-identity holds in practice. Flagged for reviewer.
- `section` anchor stored WITHOUT leading `#` (resolver re-prepends). Round-trips `#x`→`#x`.

## Test results
- `npx tsc --noEmit`: clean, no errors.
- `npm run test:run`: 69 files passed / 1 skipped; 945 passed / 2 skipped. Existing dispatch/golden/parity suites all green → confirms zero behavior change at the 26 untouched published readers.

## For the impl-reviewer to scrutinize
1. Whatsapp non-canonical round-trip edge (above) — confirm acceptable per D-D, or restrict wa.me classification to the raw-string/Link path only.
2. `content.ts` uses an inline `import('@/types/destination').CTAButton` type to stay additive without adding a top-level import; confirm this is acceptable style here.
3. `type:'form'` returning `undefined` from `toDestination` — verify no other current caller relies on the pure shim seeing form (only the wrapper calls it in Phase 1).

---

## Phase 1 fix — whatsapp verbatim-preservation guard (2026-07-08)

### Files changed
- `src/utils/destinationShim.ts` — legacy `type:'link'`/`'link-with-input'` branch now guards whatsapp.
- `src/utils/resolveCtaHref.test.ts` — added whatsapp verbatim-parity rows.

### What changed
Byte-identity violation: the old `resolveCtaHref` returned `buttonConfig.url` VERBATIM for `type:'link'`, but the new shim re-classified the url and, when it matched `wa.me`/`api.whatsapp.com`, reconstructed a canonical `https://wa.me/<n>[?text=]` — mangling real stored non-canonical whatsapp links (domain rewrite, dropped `&utm_*`, scheme upgrade, substring matches). The write path (`ButtonConfigurationModal`) stores `config.url` with no normalization, so such links are real.

Fix: in the legacy link branch, after `classifyString`, if `d.kind === 'whatsapp'` return `{ kind: 'external', url }` with the VERBATIM url (round-trips byte-identical through `resolveDestination`). `formId` behavior for `link-with-input` unchanged (rides on the CTAButton, not the href). Bare-string / new-write classification into whatsapp is UNCHANGED — only the legacy buttonConfig link branch preserves verbatim.

### Tests
Added two rows asserting `resolveCtaHref({type:'link', url})` returns the input verbatim for `https://api.whatsapp.com/send?phone=1234&text=Hi` and `https://wa.me/1234?text=x&utm_source=y`.

`npx tsc --noEmit` green. `npm run test:run` green (946 passed | 2 skipped).

### Deviations
None. Applied the reviewer's suggested shape adapted to actual var/type names.

### Open risks
None known — the guard is scoped to the legacy link branch only.

---

# scale-04 Phase 2 — audit

## Files changed
- `prisma/schema.prisma` — CONFIRM ONLY, no edit. `Project.brief Json?` present at L36, backed by migration `20260707191204_add_project_brief`. No migration generated.
- `src/app/api/saveDraft/route.ts` — accept optional `brief`, validate against `BriefSchema.partial()`, merge over existing brief, persist to `Project.brief`.
- `src/app/api/loadDraft/route.ts` — select + return `brief` in response.
- `src/types/store/state.ts` — MetaSlice gains optional `goal?` + `socialProfiles?` (Brief mirrors).
- `src/hooks/editStore/coreActions.ts` — `setGoal` action (goal setter).
- `src/hooks/editStore/persistenceActions.ts` — `save()` ships `brief` payload; `loadFromDraft` hydrates `goal`/`socialProfiles` from `apiResponse.brief`.
- `src/modules/goals/goalToDestination.ts` (new) — mechanism→Destination resolver (widened return).
- `src/modules/goals/goalToDestination.test.ts` (new) — 15 per-mechanism tests.

## goalToDestination mechanism mapping (D-E widened return `{ dest, formId? } | undefined`)
- M1 on-site form → `{ dest: {kind:'section', anchor:'form-section'}, formId }` where `formId` = first key of `ctx.forms` (undefined if none — passes through to legacy reader's own forms check).
- M2 direct channel → `toDestination(goal.destination)` (reuses the phase-1 shim string classifier): `wa.me`→whatsapp, `tel:`→call, `mailto:`→email, else external. No formId.
- M3 redirect → `{kind:'external', url}` verbatim.
- M4 subscribe/follow → `{kind:'social', platform: inferPlatform(url), url}`; unrecognized host → `{kind:'external', url}`.
- M5 anchor → `{kind:'section', anchor: dest.replace(/^#/,'')}`.
- No goal / no mechanism / missing-or-empty destination (M2–M5) → `undefined` (caller falls back to legacy).
- Array `destination` → first non-empty string entry.

## brief column confirmation
`Project.brief Json?` pre-existed (schema L36 + migration `20260707191204_add_project_brief`). `npx prisma migrate status` → "Database schema is up to date!". NO migration created this phase.

## Deviations (in-scope judgment calls)
- **Optional MetaSlice fields.** Made `goal?`/`socialProfiles?` OPTIONAL rather than required. Required fields would force initialization in `createInitialState` (`src/stores/editStore.ts`) — a file NOT in Files-touched. Optional keeps the change fully additive within scope; loadFromDraft still assigns them explicitly (`goal` = null when absent).
- **`setGoal` not added to `actions.ts`.** The `EditStore` action interface (`src/types/store/actions.ts`) is out of scope, so `setGoal` is present on the runtime store (spread in `editStore.ts`) but not on the typed surface. It is unused this phase (write path is phase 4), so tsc stays green. Phase 4 should add its signature to `actions.ts` when it wires the write path.
- **Invalid `brief` is skipped, not rejected.** saveDraft validates `body.brief` and, on validation failure, silently skips the brief write (keeps the rest of the draft save) rather than returning 400 — conservative: never fail an autosave over an optional passthrough field. BriefSchema is already all-optional so `.partial()` is belt-and-suspenders matching the plan wording.
- **`brief` read from raw `body`, not `validationResult.data`.** `DraftSaveSchema` strips unknown keys (same reason `baseline` is read from `body`), so `brief` is read from the raw body and validated separately against `BriefSchema`. No edit to `src/lib/validation.ts` (out of scope).

## Test / tsc results
- `npx tsc --noEmit` — clean.
- `npm run test:run` — 961 passed / 2 skipped (70 files). New `goalToDestination.test.ts`: 15/15 pass.
- `npx prisma migrate status` — up to date; brief migration already present.

## Round-trip reasoning (manual)
save→load: `save()` builds `brief = { goal, socialProfiles }` (omitting empties) and POSTs it; saveDraft merges over existing `Project.brief` and persists. `loadDraft` selects+returns `brief`; `loadFromDraft` sets `state.goal = apiResponse.brief?.goal ?? null` and `state.socialProfiles = apiResponse.brief?.socialProfiles`. A saved goal round-trips. `/preview/[token]` uses the same edit-store hydration, so it inherits `brief` too (relevant to phase 3).

## Open risks / notes for reviewer
- `setGoal` is currently untyped on `EditStore` (see deviation) — phase 4 must add it to `actions.ts` before calling it type-safely.
- M1 formId = "first form on the project" is a heuristic (goal carries no formId). Fine for the phase-3 bridge (legacy reader re-checks form existence), but if a project has multiple forms the primary always wires to the first — revisit if per-CTA form selection is needed.
- `inferPlatform` is best-effort host matching; unrecognized socials degrade to `external` (still a working link), never throw.

### Phase 2 — impl-review verdict: SHIP (loops 1)
Non-blocking carry-forward notes:
1. **Phase 4:** add `setGoal` signature to `src/types/store/actions.ts` when wiring the write path (currently runtime-only, dead code, tsc-green).
2. **Phase 4/6:** `save()` builds briefPayload only when `goal || socialProfiles` truthy → setting goal back to `null` won't persist a clear. Fine now (no goal-edit UI), fix when editing lands.
3. **Phase 3 (IMPORTANT):** `goalToDestination` M1 returns `{dest: section{form-section}, formId: undefined}` when no form resolves (key present, value undefined) whereas M2–M5 omit formId. `normalizeCtas` MUST detect form-ness via this pair shape (presence of the form-section anchor / formId key), so a missing-form M1 still maps to `{type:'form'}` (→ legacy reader's own fallback), NOT `{type:'link', url:'#form-section'}`. Per D-E: do NOT special-case the anchor string; rely on the widened-return pair.

---

## Phase 3 — CTA normalization pre-pass (GOAL_REF + cta→buttonConfig bridge)

**Files changed**
- `src/utils/normalizeCtas.ts` (new) — the single new-shape→legacy bridge.
- `src/utils/normalizeCtas.test.ts` (new) — 10 unit tests.
- `src/lib/staticExport/getPublishedGoal.ts` (new) — shared PublishedPage→Project.brief→goal fetch.
- `src/lib/staticExport/renderPublishedExport.ts` — self-fetch goal; pass into both generateStaticHTML calls.
- `src/lib/staticExport/htmlGenerator.ts` — optional `goal?` on StaticHTMLOptions; forward as renderer prop.
- `src/app/p/[slug]/page.tsx` — root SSR: fetch goal via helper, pass `goal` prop.
- `src/app/p/[slug]/[...subpath]/page.tsx` — subpage SSR: fetch goal via helper, pass `goal` prop.
- `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx` — optional `goal` prop; run pre-pass once at entry.
- `src/modules/generatedLanding/LandingPageRenderer.tsx` — memoized pre-pass with store `goal`/`forms`.

**Form-case detection (carry-forward from phase-2 review).** In `ctaToButtonConfig`:
- GOAL_REF → `goalToDestination(goal,{forms})` (widened `{dest, formId?}`). Form case is detected
  by `'formId' in gd` — the M1 return literal always carries the `formId` key (value may be
  `undefined`); M2–M5 omit it. So a missing-form M1 → `{type:'form'}` (no formId key) →
  legacy reader's own missing-form fallback. A GOAL_REF that resolves to a plain `section`
  anchor (M5) has no formId key → normal anchor link. No string-matching of `'form-section'`.
- Concrete `cta.dest` → used directly; form case ONLY when `cta.formId` present AND dest is
  `section{anchor:'form-section'}` (an explicit form dest+formId). A plain section anchor is a
  normal anchor link.
- Down-convert: form → `{type:'form'[,formId]}`; `page` → `{type:'page',pathSlug}`; else →
  `{type:'link', url: resolveDestination(dest)}`.
- Entries with no `cta`, and unresolvable GOAL_REF (null goal) → left UNTOUCHED. Clone is lazy:
  when nothing resolves, the SAME content reference is returned (byte-identical; old pages / null
  goal → zero diff). Input is never mutated.

**Where the pre-pass sits per renderer.**
- Published (`LandingPagePublishedRenderer`): first statement of the component body, before
  `usesTemplate` dispatch; reads `forms` off the incoming `content.forms`, then reassigns
  `content` to the normalized clone.
- Edit (`LandingPageRenderer`): `content` destructured as `rawContent`; a `useMemo` over
  `[rawContent, goal, forms]` produces the normalized `content` consumed by all downstream
  section processing. Preview uses this same renderer so it is covered when loadDraft hydrated
  `brief`/`goal` (phase 2).

**How goal is fetched in each of the 3 render entries.**
- Blob-bake: `renderPublishedExport` calls `getPublishedGoal(pageId)` ITSELF (self-fetch) → both
  its callers (normal publish + custom-domain republish) covered with zero caller edits; goal passed
  into root (~L111) AND every subpage (~L197) `generateStaticHTML`, then forwarded as the
  `LandingPagePublishedRenderer` `goal` prop in `htmlGenerator`.
- Root SSR (`p/[slug]/page.tsx`): `getPublishedGoal(page.id)` → `goal` prop.
- Subpage SSR (`p/[slug]/[...subpath]/page.tsx`): `getPublishedGoal(page.id)` → `goal` prop.
Same shared helper in all three; no duplicated fetch. Null goal → legacy fallback everywhere.

**Deviations.** Concrete-dest form detection requires BOTH `formId !== undefined` AND the
`form-section` anchor (conservative), rather than treating any concrete dest with a formId as a
form, so a stray formId on a non-form dest can't mis-map. Phase 4 writes the `cta` shape; if it
wires form buttons differently, revisit this predicate.

**Test / tsc results.** `npx tsc --noEmit` clean. `npm run test:run` → 971 passed, 2 skipped
(72 files). normalizeCtas suite 10/10. Parity, generation-contract, and publishBlogPost suites all
green (proves the no-goal and goal-less blog paths are unchanged: htmlGenerator `goal?` is optional,
so publishBlogPost's goal-less callers stay tsc-green and render byte-identical).

**Manual QA needed (cannot exercise without a running server).**
1. Publish a MULTI-PAGE project with a GOAL_REF primary on a SUBPAGE → the subpage's baked
   HTML primary `<a href>` points at the resolved goal (proves the ~L197 threading).
2. Hit `/p/{slug}` served LIVE via the SSR route (canonical `lessgo.ai/p/{slug}`, not the blob
   proxy) for a goal-ref project → rendered primary `<a href>` = resolved goal target (matches the
   baked blob), not `#cta`. Repeat for a `/p/{slug}/{subpath}` URL (subpath SSR route).
3. `/preview/[token]` for a project whose loadDraft hydrated a goal → editor/preview primary
   previews the same target. If a preview hydration path skips `brief`, null-goal fallback there is
   accepted (cosmetic preview-only).

### Phase 3 — impl-review verdict: SHIP (loops 1)
Byte-identity confirmed (lazy shallow-clone returns same ref when nothing resolves; no input mutation). Form-case detection via `'formId' in gd` correct. Goal threaded to all 3 render entries via single shared `getPublishedGoal` (server-only, never throws).
Carry-forward notes:
1. **Phase 4 LANDMINE (normalizeCtas.ts L69-70):** concrete-dest form predicate = `formId !== undefined && section && anchor==='form-section'`. Phase 4's form-button write path MUST always set `cta.formId` for form buttons, else a concrete form CTA maps to `{type:'link', url:'#form-section'}` → `#cta` fallback instead of `{type:'form'}`. Ensure formId set, or relax predicate.
2. getPublishedGoal re-fetches publishedPage row in SSR routes (already had it) — accepted perf tradeoff; optional projectId-first overload possible later.
Phase 8 QA (headless-unverifiable): (a) multi-page subpage GOAL_REF primary baked href = resolved goal; (b) live SSR /p/{slug} + /p/{slug}/{subpath} primary href == baked blob (not #cta); (c) /preview/[token] goal preview parity.

---

## Phase 4 — CTAButton write path + role unification + edit-side click

**Files changed**
- `src/components/toolbars/ButtonConfigurationModal.tsx`
- `src/utils/sectionHelpers.ts`
- `src/utils/ctaHandler.ts`
- `src/components/forms/FormConnectedButton.tsx`
- `src/utils/destinationShim.test.ts`
- `src/types/store/actions.ts`
- (NOT modified: `src/utils/destinationShim.ts` — CTAButton read already worked from phase 1; no extension needed.)

### ButtonConfigurationModal.tsx — the new `cta` write
- Role is DERIVED from the element key (`secondary` in key ⇒ secondary, else primary) and shown READ-ONLY (the old primary/secondary RadioGroup is gone). Displayed as a pill.
- Primary buttons default to `followGoal=true` → written as `cta: { role:'primary', dest:'GOAL_REF' }` with a blue "Follows your project goal" banner + a Detach button. Detached primary shows the explicit-destination config plus a re-attach link. Secondary buttons never follow the goal (`followGoal` starts false, no goal UI).
- The explicit-destination config (Button Action radios + link/form/page/link-with-input fields) is hidden while `followGoal` is true; destination validation is skipped in goal mode (only button text is required).
- cta write shape (`buildCtaButton`):
  - primary + followGoal → `{ role:'primary', dest:'GOAL_REF' }`
  - form → `{ role, dest:{kind:'section',anchor:'form-section'}, formId: config.formId }` — ALWAYS carries formId (the phase-3 landmine: the pre-pass detects the form case by formId; a form-intent cta without it maps to a link → `#cta`). Form validation guarantees formId is set before save.
  - page → `{ role, dest:{kind:'page', pathSlug} }`
  - link → `{ role, dest: toDestination(url) }` (classifies tel:/mailto:/wa.me/https)
  - link-with-input → undefined (carries inputConfig, not representable in the new shape) → NO cta written, so the pre-pass leaves the legacy buttonConfig intact.
- Additive write, not a replacement. Existing legacy writes (buttonConfig, section-level cta, direct cta_url/cta_embed) are UNCHANGED. The new cta is written ALONGSIDE buttonConfig into `elementMetadata[key]`: `{ buttonConfig, cta }` when a cta exists, `{ buttonConfig }` (dropping any stale cta) for link-with-input. Rationale: raw readers of `elementMetadata[key].buttonConfig` (icons, ctaType, inputConfig) keep working; the phase-3 pre-pass re-derives buttonConfig from cta at render (href-identical for link/form/page), so they never diverge because the modal always rewrites both together.
- Reopen prefill (dual-read): reads `elementMetadata[key].cta` first — GOAL_REF ⇒ goal-follow state; explicit dest ⇒ `configFromCta` reverse-maps the Destination back to the flat form fields (icons/behavior from the sibling legacy buttonConfig). Falls back to the legacy buttonConfig fields when no cta present (old pages prefill unchanged).

### Role unification — `deriveCtaRole` (sectionHelpers.ts)
- New shared helper `deriveCtaRole({ cta, ctaType, elementKey })`: reads `cta.role` FIRST, then legacy `ctaType`, then the `secondary` element-key convention, default `primary`. `FormConnectedButton` uses it for the inline-form placement role (was `buttonConfig.ctaType || 'primary'`).
- Interpretation note (in-scope judgment call): `findPrimaryCTASection(sections: string[])` is a section-LOCATOR (finds the `cta` section id for form-scroll), not a per-button role reader — changing its signature is out of scope and would break callers. The role unification is centralized in `deriveCtaRole`, added to the same file the plan named. `findPrimaryCTASection` behavior unchanged.

### Edit-side click — one Destination model
- `ctaHandler.ts` `createCTAClickHandler`: reads new `cta` first, then legacy `buttonConfig`, then section-level `cta`. Form case handled inline (scroll to `form-<id>` / modal log) keyed off a resolvable formId (new `cta.formId` or legacy). Everything else → `toDestination` → `resolveDestination` → `navigateToDestination`, which keys BEHAVIOR off the Destination TYPE (section ⇒ smooth-scroll, tel/mailto/page ⇒ same-tab, external/whatsapp/social/download ⇒ new tab). Replaced the old imperative window.open branching.
- `FormConnectedButton.tsx` `handleClick`: same model. Form case kept (scroll/modal). link-with-input folds the input value into the url then routes the finalUrl string through the shim. link routes through `toDestination(buttonConfig)`.

### setGoal signature (phase-2 carry-forward)
- ADDED `setGoal: (goal: Brief['goal'] | null) => void` to `MetaActions` in `src/types/store/actions.ts` (runtime action already existed in `coreActions.ts`; `MetaActions` is part of the `EditStore` composite). Closes the deferred type hole. tsc green.

### Deviations
- Modal keeps writing the legacy buttonConfig in addition to the new cta (rather than deleting buttonConfig). Conservative choice to avoid breaking raw buttonConfig readers (form placement, icons, inputConfig) that bypass the render pre-pass. Interpreted "new shape only" as "the cta field holds only the CTAButton shape".
- link-with-input intentionally NOT written as a cta (no inputConfig slot in the new model) — legacy path preserved. Noted as a new-model limitation.

### Open risks / notes for reviewer
- Published icons/inputConfig on new cta writes: the phase-3 pre-pass down-converts cta → minimal buttonConfig, dropping icon/inputConfig fields. Verified the 26 published template CTA readers do NOT read icons from buttonConfig (grep: no leadingIcon in template `.published.tsx`), so published href/icon output is unaffected for link/form/page. link-with-input sidesteps the pre-pass (no cta). Low risk, flagged.
- Editor imperative click on a GOAL_REF primary resolves to `'GOAL_REF'` in the handlers (goal resolution lives in the render pre-pass, not the imperative path) → no-op/legacy fallback. Editor buttons are contentEditable and mostly don't navigate; the rendered anchor IS correct. Accepted.
- `deriveCtaRole`'s element-key fallback isn't reachable from FormConnectedButton (no elementKey prop) — falls back to ctaType there. Fine; the key fallback is used by the modal's own key-derived role.

### Verification
- `npx tsc --noEmit` — clean.
- `npm run test:run` — 974 passed | 2 skipped (72 files). destinationShim suite extended with 3 phase-4 CTAButton write-shape read-back tests, all green.

### Manual editor smoke (reviewer/QA — cannot run headless)
1. Primary goal-ref: open a hero/CTA primary button config → confirm "Follows your project goal" banner + read-only "Primary CTA" pill (no primary/secondary radios). Save. Publish. Confirm published primary `<a href>` points at the resolved project goal (or `#cta` when no goal set).
2. Primary detached: Detach → pick External Link (e.g. Calendly) → save/publish → published primary href = that URL (new tab). Re-open modal → prefills the URL (detached state).
3. Secondary: open a `secondary_cta_*` button → "Secondary CTA" pill, NO goal banner → pick a section anchor / page → save/publish → href correct.
4. Form button: configure Native Form (primary or secondary) → save/publish → clicking scrolls to form section / opens modal; confirm the written cta carries formId (not mis-mapped to `#cta`). Verify a single-field form still renders inline (role via deriveCtaRole).
5. Old-page regression: open a pre-scale-04 project's button (legacy buttonConfig, no cta) → modal prefills from legacy fields; published href unchanged.

### Phase 4 — impl-review verdict: SHIP (loops 1)
Dual-write (cta + legacy buttonConfig) confirmed SAFE + justified: GOAL_REF cta bakes NO concrete href; normalizeCtas re-derives buttonConfig from cta every render (overwrites stored one), so goal change re-points all primaries. Retained legacy buttonConfig carries icon/inputConfig that raw store readers (form placement, reopen) need. Form ctas always carry formId (landmine closed). Role precedence cta.role→ctaType→key correct.
Non-blocking (QA note): null-goal + detach→re-attach leaves stale config.url; only renders in null-goal transitional state (self-heals once any goal set). Cosmetic. ButtonConfigurationModal re-attach ~L476 / save ~L305.
