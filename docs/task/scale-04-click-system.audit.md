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

---

# scale-04 Phase 5 — audit (ONE shared link popover + Link objects; delete ×6)

## Files changed
- `src/components/editor/LinkTargetPopover.tsx` (NEW) — the single shared popover; `onChange(link: Link)`
- DELETED 6 per-template copies: `src/modules/templates/{meridian,techpremium,vestria,surge,lumen,granth}/components/LinkTargetPopover.tsx`
- `src/modules/templates/vestria/blocks/editPrimitives.tsx` — import shared popover; convert Link→string on save
- `src/modules/templates/granth/blocks/editPrimitives.tsx` — same
- `src/modules/templates/vestria/index.ts` — comment updated (stale LinkTargetPopover re-export note)
- `src/modules/templates/granth/index.ts` — same
- `src/modules/templates/meridian/blocks/Header/MeridianNavHeader.tsx` + `.published.tsx` — Link store + dual-read
- `src/modules/templates/meridian/blocks/Footer/HairlineFooter.tsx` + `.published.tsx` — Link store + dual-read
- `src/modules/templates/techpremium/blocks/Header/TechPremiumNav.tsx` + `.published.tsx` — Link store + dual-read (top-level nav only)
- `src/modules/templates/techpremium/blocks/Footer/TechPremiumFooter.tsx` + `.published.tsx` — Link store + dual-read (footer_columns + legal)
- `src/modules/templates/surge/blocks/Header/WarmNavHeader.tsx` + `.published.tsx` — Link store + dual-read
- `src/modules/templates/surge/blocks/Footer/ContactFooterRich.tsx` — store resolved string (external type); published UNCHANGED
- `src/modules/templates/lumen/blocks/Header/LumenNav.tsx` + `.published.tsx` — Link store + dual-read
- `src/modules/templates/lumen/blocks/Footer/LumenFooter.tsx` — store resolved string (external type); published UNCHANGED

NOT changed (in Files-touched but no edit needed): `surge/.../ContactFooterRich.published.tsx`,
`lumen/.../LumenFooter.published.tsx`, `hearth/.../WarmNavHeader.{tsx,published.tsx}`,
`hearth/.../ContactFooterRich.{tsx,published.tsx}` — see Deviations.

## Shared popover
`src/components/editor/LinkTargetPopover.tsx` — `'use client'`. Same 3-mode UX as the deleted
copies (radio: Scroll to section / Link to page / Custom URL), byte-identical markup/classes.
Differences from the old copies:
- Prop `href: string` → `value: string | Link`; read into the initial UI href via `toDestination`
  (+ `resolveDestination`) so old pages (raw string) and new pages (Link) both open on the right mode.
- `onChange(href: string)` → `onChange(link: Link)`. Every selection/typed url is parsed by
  `toDestination(raw)` into a Destination and emitted as `{ dest, source: 'manual' }`.
Plain-module imports only (`toDestination`, `resolveDestination`, `@/types/destination`) — safe.

## string-vs-Link dual-read (old-page byte-identical invariant)
Each edited published twin (and the edit-side preview `<a>` where one exists) reads the link value
through a tiny local helper:
```
function resolveLinkHref(value: string | Link | undefined): string {
  if (typeof value === 'string') return value || '#';   // legacy: verbatim
  if (isLink(value)) return resolveDestination(value.dest) || '#';  // new Link: resolve
  return '#';
}
```
The helper is inlined per file (cannot live in the `'use client'` popover — published/client
firewall — and no shared plain module was in Files-touched). **Whatsapp verbatim invariant:** a raw
string href is returned AS-IS and never round-tripped through `toDestination`/`resolveDestination`,
so a legacy verbatim `wa.me/...` (or any) string nav/footer href renders byte-identical (mirrors the
Phase-1 guard). Only NEW `Link` objects hit `resolveDestination`. Existing tests (dispatch + parity)
stay green, confirming no output drift on legacy shapes.

## Deviations (in-scope judgment calls — logged)
1. **Link storage vs resolved-string storage split by TS ownership.** The plan says all call sites
   STORE Link objects. Where the href field's TS type is defined in an in-scope file (meridian/
   techpremium/surge/lumen NAV `NavItem`, meridian/techpremium FOOTER `FooterLink` — all local to
   the touched `.tsx`), I widened it to `string | Link` and store the Link object, and dual-read in
   the `.published.tsx` twin (as instructed). Where the field's type lives in an OUT-OF-SCOPE file, I
   store the resolved href STRING instead (convert `resolveDestination(link.dest)` at onChange),
   keeping the field a `string`, needing no external-type edit and no published change:
   - **surge footer** (`FooterLink` from `Footer/footerDefaults.ts`) and **lumen footer**
     (`FooterColumnLink`/`LegalLink` from `Footer/footerDefaults.ts`) — footerDefaults is NOT in
     Files-touched.
   - **vestria/granth** editPrimitives — their published `Link` primitive
     (`blocks/publishedPrimitives.tsx`, NOT in Files-touched) reads `href` as a plain string; a Link
     object would render `[object Object]`. So editPrimitives converts Link→string on save.
   Net effect is identical (canonical resolved href) and strictly preserves the byte-identical
   invariant; the only loss vs Link-storage is that these fields don't carry `source:'manual'` — which
   Phase 6 re-touches these same files to introduce derived sources anyway.
2. **surge/lumen footer `.published.tsx` left UNCHANGED.** Because those footers store resolved
   strings (deviation 1), their published readers keep receiving `string` hrefs → already
   byte-identical, no dual-read needed. Editing them would add a no-op. Left untouched to minimize
   risk (Files-touched is a permission ceiling, not an obligation).
3. **techpremium nav dropdown CHILD hrefs** are edited via a plain text `<input>` (not the popover)
   → always strings; left as-is. Only top-level `item.href` (popover-edited) gets Link+dual-read.
   Same for surge footer socials + techpremium footer socials (text-input hrefs).
4. **hearth/lex: skipped (plan step 4 "skip, note").** Neither uses the popover and neither exposes
   any href-editing UI (hearth nav only edits the label; lex likewise). They can NEVER store a Link
   object, so their `item.href || '#'` reads stay pure strings and are already byte-identical — a
   dual-read would be dead code. Left fully untouched.

## Scope guard (D-F) honored
No CTA-button `resolveCtaHref(...)` call in any of these files was touched — only nav/footer LINK
item rendering. No analytics attrs (Phase 7). `.tsx`/`.published.tsx` layout/CSS kept identical.

## Verification
- `npx tsc --noEmit` — clean.
- `npm run test:run` — 974 passed | 2 skipped (unchanged from Phase 4 baseline). Dispatch + parity
  suites green.
- Grep: zero remaining references to the deleted `components/LinkTargetPopover` paths; 8 direct
  callers + 2 editPrimitives now import `@/components/editor/LinkTargetPopover`.

## Manual QA for reviewer/QA
1. In the editor, edit a NAV link target in **meridian** and **techpremium** via the link popover
   (pick a section, a page if multi-page, and a custom URL). Confirm the editor preview `<a>` and the
   PUBLISHED page render the same resolved href. Repeat for a FOOTER link in meridian + techpremium.
2. Edit a footer link in **surge** and **lumen** (these store resolved strings) — confirm editor +
   published match.
3. Open an OLD project (raw string hrefs, ideally one whose nav/footer link is a verbatim `wa.me/...`
   URL). Confirm every nav/footer link renders the identical href as before — especially the `wa.me`
   link is byte-identical (not re-canonicalized).
4. vestria/granth: edit a link via the shared popover; confirm published anchor resolves correctly.

## Open risks
- Reviewer should confirm the Deviation-1 split (Link-store vs string-store) is acceptable for
  Phase 6's derived-source (`source:'derived'`) needs; Phase 6 re-touches these files and can migrate
  the string-storing footers to Link storage when it adds the derived UI.
- Phase 8's `renderParity.meridian` extension will feed a Link-OBJECT nav/footer fixture — the
  meridian dual-read path added here is what makes that assertion pass.

### Phase 5 — impl-review verdict: SHIP (loops 1)
Whatsapp/old-page byte-identity PASS (resolveLinkHref returns raw strings verbatim; only Link objects → resolveDestination). 6 popover copies deleted clean, zero dangling refs. Shared popover markup byte-identical. Scope guard D-F held (no CTA resolveCtaHref logic touched). hearth/lex skip justified.
Carry-forward for Phase 6:
1. surge footer (ContactFooterRich) + lumen footer (LumenFooter) + vestria/granth editPrimitives store the RESOLVED STRING, not Link{dest,source} (their href types live in out-of-scope footerDefaults.ts / primitives.ts). Byte-safe now. BUT to make those footer legal/social links TRULY derived (source:'derived', eligible for social/sitemap sync), Phase 6 must add those two footer .tsx+.published.tsx + widen surge/lumen footerDefaults.ts to string|Link. As-planned Phase 6 does NOT list them → those footer links stay effectively "manual" (soft degradation; acceptance "goal change moves no derived link" still holds — static strings don't move). Decide consciously in Phase 6.
2. Nav headers (all 4) DO store Link (NavItem widened) → nav←sitemap derivation unaffected.

---

# Phase 6 — Derived link sources + social panel (D13)

## Files changed
- `src/utils/pageLinks.ts` — added `deriveNavLinks(pages)` + `DerivedNavItem` type.
- `src/components/editor/LinkTargetPopover.tsx` — added derived `legalOptions` + `socialOptions`; combined pages/legal/social into one "derived" select (source:'derived'); section + custom URL stay 'manual'.
- `src/components/editor/SocialProfilesPanel.tsx` (NEW) — D13 site-level social panel (wraps SocialMediaEditor).
- `src/app/edit/[token]/components/ui/GlobalModals.tsx` — mount point: hosts SocialProfilesPanel; `showSocialModal`/`hideSocialModal` + `lessgo:manage-social` window-event open path.
- `src/hooks/editStore/persistenceActions.ts` — Brief.socialProfiles <-> SocialMediaConfig bridge (hydrate-on-load-when-empty + derive-on-save).
- `src/modules/templates/meridian/blocks/Header/MeridianNavHeader.tsx` — nav-seed effect + legal/social derived options.
- `src/modules/templates/techpremium/blocks/Header/TechPremiumNav.tsx` — same.
- `src/modules/templates/surge/blocks/Header/WarmNavHeader.tsx` — same.
- `src/modules/templates/lumen/blocks/Header/LumenNav.tsx` — same.

(NOT changed: the 4 `.published.tsx` nav twins — see Deviations. `src/types/store/state.ts` — bridge needed no new field; existing `goal`/`socialProfiles` + `socialMediaConfig` slices sufficed.)

## What changed, per file

**`src/utils/pageLinks.ts`** — `deriveNavLinks(pages)` maps `buildPageLinkOptions` output to `{ id, label, href: Link }[]` where each `href` is a DERIVED page `Link` (`{ dest:{kind:'page',pathSlug}, source:'derived' }`). Reuses the existing sitemap ordering (Home first, then `order`). `DerivedNavItem` is assignable to every template's `NavItem` (label:string subset of label?, href:Link subset of string|Link).

**`LinkTargetPopover.tsx`** — new optional props `legalOptions` (value=path, e.g. `/privacy`) and `socialOptions` (value=profile url, label=platform). A single "derived" radio mode replaces the old page-only mode and renders optgroups Pages / Legal / Social. Any derived pick emits `source:'derived'`; social picks keep `dest.kind='social'` (platform+url), page/legal picks become `dest.kind='page'`. Section + custom-URL stay `source:'manual'`. Radio label stays "Link to page" for footers (page-only) and becomes "Link" when legal/social present, so footer UX is unchanged. Backward compatible — new props optional.

**`SocialProfilesPanel.tsx`** — D13 entry point. Thin wrapper over the proven `SocialMediaEditor` (which already edits the `socialMediaConfig` store slice via existing store actions), rather than duplicating ~360 lines. Doc comment records the bridge contract.

**`GlobalModals.tsx`** (mount point) — added a `socialModal` state entry, `showSocialModal`/`hideSocialModal`, and a `lessgo:manage-social` window-event listener that mirrors the existing firewall-safe `lessgo:manage-products` pattern (lets a template footer/nav block request the panel without importing app code across the template firewall). Panel is always mounted (visibility-gated), like the products/SEO modals it sits beside.

**`persistenceActions.ts`** — bridge helpers `socialConfigFromProfiles` (Brief->config, with a platform->icon-name map + `FaGlobe` fallback) and `socialProfilesFromConfig` (config->Brief). Load: after `applySnapshot`, seed `socialMediaConfig` from `brief.socialProfiles` ONLY when the restored config is empty (richer config always wins; covers scrape-prefilled profiles that live only in Brief). Save: `briefPayload.socialProfiles` is now derived from `socialMediaConfig` (fallback to the `state.socialProfiles` passthrough), so panel edits round-trip into `Project.brief`.

**4 nav headers** — each: (1) reads `socialMediaConfig` + `legalPages` from the store and builds `socialOptions` (from config items) + `legalOptions` (`/privacy` only when `legalPages.privacy` exists); passes both to its `LinkTargetPopover`. (2) a seed `useEffect` (edit-mode only, ref-guarded) that seeds `nav_items` via `deriveNavLinks(pages)` ONLY when the nav is empty AND the sitemap has >1 page. Seed-only: hand-edited navs floor at 2 items so are never empty -> never re-seeded; single-page projects (<=1 derived link) are left alone -> no spurious dirtying.

## Carry-forward decision (surge/lumen footer): OPTION (a) — ACCEPTED DEFERRAL
Chose (a): left surge `ContactFooterRich` and lumen `LumenFooter` storing resolved STRINGS (their href types live in out-of-scope `footerDefaults.ts`). Their footer legal/social links are therefore NOT `source:'derived'` and are not eligible for social/sitemap sync. Rationale: (1) the Phase-6 acceptance ("a goal change moves no derived link") holds trivially — static strings never move; (2) the derived legal/social REQUIREMENT is satisfied on the surfaces that DO store `Link` (the 4 nav headers, per Phase 5's NavItem widening), which is where the plan's Files-touched authorizes edits; (3) option (b) would require widening two out-of-scope `footerDefaults.ts` files + dual-read in two more `.published.tsx` twins — scope creep the default explicitly warns against. Footers still edit social via block-level `social_links` (surge/hearth) unchanged; the SITE-level panel + brief bridge are the new D13 surface.

## Deviations from the plan
1. **Published nav twins NOT edited (fewer files than Files-touched listed).** The 4 `*.published.tsx` nav headers were listed but need no change: nav-seed is an edit-store mutation that persists to `content`, and the published renderer has no `pages`/sitemap context to derive from. Published simply renders the persisted (seeded) `nav_items`, so edit<->published parity is preserved with no layout/CSS divergence. Doing render-time (non-persisting) derivation instead would break parity (published couldn't derive). Conservative choice: seed persists edit-side; published untouched.
2. **Legal privacy stored as a fixed `/privacy` page dest.** `PrivacyPolicyLink`'s runtime basePath-prefix (window.pathname trick) is a published-runtime concern that can't be baked into a stored static `Link`; in the editor `window.pathname` is `/edit/{token}` (wrong basePath). Stored `/privacy` matches `PrivacyPolicyLink`'s canonical SSR default and the project-root privacy page. Per-page subpath basePath prefixing is not applied to stored derived legal links — accepted (privacy is a project-root page). Logged as in-scope conservative pick.
3. **`showSocialModal` open path via window event, no new trigger button.** `SocialMediaEditor` was previously unmounted (dead); there is no existing "social settings" menu trigger. Adding a menu button would touch EditHeader/menu files outside scope. Instead the panel opens via `showSocialModal()` / `window.dispatchEvent(new Event('lessgo:manage-social'))`, mirroring the established `lessgo:manage-products` pattern — single mount file, no scope sprawl. A visible trigger can be wired in a later phase.

## Test results
- `npx tsc --noEmit`: green.
- `npm run test:run`: 974 passed, 2 skipped (72 files) — unchanged from Phase 5 count. No new tests added (phase steps are UI/store wiring; parity/golden coverage is Phase 8).

## Manual QA to run (cannot run headless)
1. Social panel: open via `window.dispatchEvent(new Event('lessgo:manage-social'))` in the editor console; add a profile (e.g. Instagram) -> save. Reopen a nav-link popover -> the "Social" optgroup now offers Instagram; pick it -> the nav link resolves to the profile URL. Confirm `Project.brief.socialProfiles` round-trips on reload (scrape-prefilled profiles also appear).
2. Multi-page: open a fresh multi-page project's editor -> the nav auto-seeds one link per sitemap page (derived). Hand-edit/remove one -> reload -> it is NOT re-seeded (seed-only). Single-page project -> nav is NOT seeded.
3. Acceptance: flip the project goal (form->WhatsApp via saveDraft/DB) -> confirm NO nav/footer DERIVED link (page/legal/social) moves; only GOAL_REF primaries re-point.

## Open risks
- The social panel has no visible in-editor trigger yet (opens via event); a future phase should add a menu entry.
- Legal-derived link uses a flat `/privacy`; subpage-relative privacy URLs on multi-page/custom-domain roots rely on the page living at project root (true today).

## Phase 6 fix (2026-07-08): reachable social-panel trigger
Resolved the blocking issue in Deviation #3 above. D13's `SocialProfilesPanel` was previously unreachable (only the `showSocialModal()` definition + `lessgo:manage-social` listener existed; nothing dispatched/called them). Added ONE reachable trigger.
- `src/app/edit/[token]/components/layout/GlobalAppHeader.tsx` — imported `showSocialModal` alongside `showSeoModal`; added a sibling "Social" header button next to the "SEO" button that calls `showSocialModal`. Same styling as the SEO/Products triggers.
- No modal-manager change needed: `showSocialModal` was already exported from `GlobalModals.tsx` (mirrors `showSeoModal`/`showProductsModal`) and already flips `modalState.socialModal` → panel mount. Verified end to end: button `onClick={showSocialModal}` → sets `socialModal.isOpen` / dispatches `stateChange` → `GlobalModals.tsx` renders `SocialProfilesPanel`.
- Tests: `npx tsc --noEmit` green; `npm run test:run` 974 passed / 2 skipped (unchanged).

### Phase 6 — impl-review verdict: SHIP (loops 1 — social-panel trigger fix)
Blocker fixed: D13 SocialProfilesPanel was mounted-but-unreachable → added one "Social" trigger in GlobalAppHeader (sibling of SEO button) → showSocialModal → panel mounts. Reachable now.
Reviewer confirmed sound: published nav parity holds (seed persists to content via updateElementContent, published twin dual-reads Link from ph5 — no divergence, 4 .published.tsx twins correctly untouched); deriveNavLinks seed-only (guarded, no clobber); brief↔store bridge lossless round-trip (seed-when-empty); goal change moves NO derived link (derived dests never GOAL_REF); surge/lumen footer option-(a) deferral accepted.
Non-blocking: bridge save now backfills brief.socialProfiles for any project with populated socialMediaConfig (additive, no clobber); flat /privacy legal dest (no subpath basePath).

---

## Phase 7 — Analytics attrs on 26 published blocks + role/placement pipeline

**Files changed (35):**
- `prisma/schema.prisma` + new migration `prisma/migrations/20260708125722_add_cta_placements/`
- `src/components/published/CTAButtonPublished.tsx`
- `src/lib/staticExport/analyticsGenerator.js`
- `src/app/api/analytics/event/route.ts`
- `src/app/dashboard/analytics/[slug]/components/CtaBreakdown.tsx` (new)
- `src/app/dashboard/analytics/[slug]/page.tsx`
- `public/assets/a.v1.js` (regenerated build artifact)
- 26 published template blocks (stamped, attrs only):
  - meridian: `CTA/ArcCTA`, `Hero/TerminalHero`, `Pricing/ThreeTierPricing`, `Header/MeridianNavHeader`
  - techpremium: `CTA/TechPremiumCTA`, `Hero/TechPremiumHero`, `Pricing/TechPremiumPricing`, `Header/TechPremiumNav`
  - hearth: `CTA/BookCallCTA`, `Hero/PetalFramedHero`, `Packages/TieredPackages`, `Header/WarmNavHeader`
  - lex: `CTA/EngravedInvitationCTA`, `Hero/ProspectusHero`, `Header/LetterheadNav`
  - surge: `CTA/BookCallCTA`, `Hero/PetalFramedHero`, `Packages/TieredPackages`, `Header/WarmNavHeader`, `Footer/ContactFooterRich`
  - lumen: `Hero/LumenHero`, `About/LumenPhotographerAbout`, `Contact/LumenContactForm`, `Header/LumenNav`
  - vestria: `blocks/publishedPrimitives.tsx`
  - granth: `blocks/publishedPrimitives.tsx`

**Migration:** `20260708125722_add_cta_placements` — adds nullable additive `PageAnalytics.ctaPlacements Json?` (user pre-approved). Applied to Neon dev via `prisma migrate dev`. Client types regenerated (query-engine dll rename hit EPERM due to a locked dll, but `.prisma/client/index.d.ts` contains `ctaPlacements` — tsc green, runtime engine unchanged).

**Role mapping (static literals per anchor):**
- Primary (`data-lessgo-cta-role="primary"`): main CTA/Hero/Pricing/Packages CTA anchors keyed `cta_*` / `tiers_cta_*` / `packages_cta_*`; header primary CTA (`cta_text`); surge footer WhatsApp FAB; lumen contact WhatsApp button.
- Secondary (`data-lessgo-cta-role="secondary"`): `secondary_cta_*` anchors; header sign-in buttons (`signin_text` — meridian, techpremium desktop+mobile); lumen contact "Book a call".
- NOT stamped: nav LINK items (`nav_items.*`), dropdown children, brand/logo links, social links, granth book `buy_url` + `socials.*`, mailto text links, and `<button type="submit">` form submit (fires form_submit, not cta_click).

**Vestria/granth primitives:** both use a shared generic `Link` primitive receiving `hrefKey`. Role derived inside the primitive from the key (`/secondary_cta/`→secondary, other `/cta/`→primary; vestria excludes `nav_items.*`). No block cores edited (they were not in Files-touched and pass `hrefKey` already).

**CTAButtonPublished.tsx:** added optional `role` / `cta.role` / `ctaType` props; stamps `data-lessgo-cta-role` (default `'primary'`) on both the `<a>` and `<button>` branches alongside the existing `data-lessgo-cta`. (No current block passes these — component is only re-exported — so default-primary is inert; kept the fallback chain per plan.)

**Beacon (`analyticsGenerator.js`):** `initCTATracking` now reads `data-lessgo-cta-role` (default `'primary'`) and `placement = target.closest('[data-surface][id]').id` (fallback `'unknown'`), added to the `cta_click` payload. Fires for both roles via the existing `[data-lessgo-cta]` delegation.

**API (`analytics/event/route.ts`):** Zod schema extended with optional `role` (enum primary|secondary) + `placement` (string) on cta_click. After the existing upsert (which still increments `ctaClicks`), a read-modify-write merges into `ctaPlacements` JSON shaped `{ [placement]: { primary, secondary } }` (Prisma can't increment nested JSON). **`form_submit` counting is UNTOUCHED** — formSubmissions / conversionRate / device `*Conversions` still driven solely by form_submit; the ctaPlacements merge is additive and only runs on cta_click.

**Dashboard:** new `CtaBreakdown.tsx` (cloned DeviceBreakdown pattern) renders per-placement primary/secondary counts, sorted by total, friendly section labels. `page.tsx` aggregates `ctaPlacements` across the period's days and renders `<CtaBreakdown>` below the device/traffic row.

**Deviations / judgment calls (in-scope):**
- Header sign-in buttons (`signin_text`) stamped as `secondary` — they are button `<a>`s but not the primary CTA and not keyed `secondary_cta_*`; conservative choice so both roles fire and sign-in clicks aren't mislabeled primary.
- Pricing/Packages tier CTAs (`tiers_cta_*` / `packages_cta_*`) stamped `primary` (not keyed `secondary_cta_*`; they are conversion buttons).
- Surge footer WhatsApp FAB + lumen WhatsApp button stamped `primary` (primary conversion action); lumen "Book a call" `secondary`.
- Granth book `buy_url` links NOT stamped (per-item purchase links, not keyed `*cta*`; treated like link items per the explicit key rule) — flag for QA if buy clicks should count.
- Form submit `<button>` in lumen contact deliberately NOT stamped (fires form_submit; stamping would double-count as cta_click).

**Verification:**
- `npx tsc --noEmit` — green.
- `npm run test:run` — 974 passed / 2 skipped (parity suites green; attrs inert, no existing assertion broke).
- `npm run build` — green; `public/assets/a.v1.js` re-minified, confirmed contains `data-lessgo-cta-role` read + `placement` fallback.

**Manual QA (cannot run headless — deferred to human gate):** publish a page per audience type (spot-check meridian/techpremium/surge/lumen), click hero primary + a secondary, confirm `cta_click` fires with role+placement, `PageAnalytics.ctaPlacements` rows populate + dashboard breakdown appears, and form_submit conversions unchanged.

**Open risks:** already-published pages keep the old beacon until republished (payload additive + API backward-compatible → no break, just no placement data until republish). Legacy non-template product pages report placement `'unknown'` (accepted per D-B). ctaPlacements merge is a non-atomic read-modify-write (acceptable for analytics; rare concurrent-click races may drop a count).

### Phase 7 — impl-review verdict: SHIP (loops 1)
Migration add_cta_placements applied (nullable additive). 26 blocks stamped attr-only (provably inert, byte-identical after stripping data-attrs), .published.tsx-only. form_submit conversion counting untouched + atomic. Role stamping judgment calls all defensible (no real primary unstamped, no util link inflating conversions since conversionRate=form_submit only). Beacon closest('[data-surface][id]') resolves section wrapper reliably. Build asset regenerated with role/placement logic.
POST-MERGE FOLLOW-UPS (logged, non-blocking):
1. **ctaPlacements JSON merge is non-atomic read-modify-write** (analytics/event/route.ts:224-242: findUnique then update, no txn/lock) → lost-update race under concurrent cta_click beacons. Bounded to the NEW supplementary breakdown only (all authoritative metrics stay atomic). FIX before high-traffic reliance: single atomic `prisma.$executeRaw` with `jsonb_set(COALESCE(ctaPlacements,'{}'), ARRAY[placement,role], (COALESCE((ctaPlacements->placement->>role)::int,0)+1)::text::jsonb, true)`. Row-atomic, no lock.
2. granth buy_url (book purchase) NOT stamped (keyed *cta* rule) — QA: should book-buy clicks count as conversions?
3. CtaBreakdown formatPlacement collapses same-type sections to one label in UI (distinct in data) — cosmetic.
