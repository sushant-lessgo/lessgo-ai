# scale-04 — click system unification: plan (rev 4)

**Branch:** `feature/scale-04-click-system`
**Spec:** `docs/task/scale-04-click-system.spec.md` · **Scout:** `docs/task/scale-04-click-system.scout.md`

## Overview

Replace the two parallel click models (raw `href` strings + ad-hoc `buttonConfig`) with one `Destination` union consumed by a single dumb resolver. Buttons become `CTAButton` (primary defaults to `GOAL_REF`, resolved from the project's persisted `Brief.goal` at render); links become explicit `Link` objects written by ONE shared popover (6 template copies deleted). A renderer-entry **normalization pre-pass** is the single new-shape→legacy bridge: it resolves GOAL_REF *and* down-converts every `cta` object into the legacy `buttonConfig` shape, so the 26 published block readers keep their href logic byte-identical. Old saved pages keep rendering identically via a lossless dual-read shim — no data migration. Analytics beacon gains `{role, placement}` on CTA clicks (which requires stamping `data-lessgo-cta` attrs onto those same 26 blocks — today NO template block carries the attr, so `cta_click` never fires on template pages), aggregated per-placement and shown in the dashboard.

## Progress log

- phase 1 destination types + resolver + migration shim: done (review loops 1 — whatsapp verbatim-guard fix; tsc clean, 946 tests pass)
- phase 2 brief/goal persistence + goalToDestination: done (review loops 1 — ship; brief confirm-only no migration; tsc clean, 961 tests pass)
- phase 3 cta normalization pre-pass (GOAL_REF + cta→buttonConfig bridge) in both renderers: done (review loops 1 — ship; goal threaded 3 entries; tsc clean, 971 tests pass)
- phase 4 CTAButton write path + role unification: done (review loops 1 — ship; dual-write safe; tsc clean, 974 tests pass)
- phase 5 shared link popover + Link objects: pending
- phase 6 derived link sources + social panel (D13): pending
- phase 7 analytics attrs on 26 published blocks + role/placement pipeline: pending
- phase 8 parity tests + build + manual QA: pending

## Design decisions (resolved up front — implementers follow these, don't re-litigate)

**D-A. Brief persistence gap (spec depends on unlanded scale-01).** This plan is self-contained: `Project.brief Json?` **already exists in the committed schema (`prisma/schema.prisma:36`)** — phase 2 adds only the plumbing (saveDraft/loadDraft carry `brief`; the static-export path reads it via `renderPublishedExport` self-fetch — see phase 3; edit store holds `goal` + `socialProfiles`). No goal-editing UI (spec scope OUT). When scale-01 lands, it writes into the same column — no rework. Null-goal fallback: `GOAL_REF` resolves to legacy behavior (form section / `#cta` fallback), so every existing project renders unchanged. **Existing-project story (reviewer-confirmed sound): no migration, null goal falls back losslessly.**

**D-B. Analytics conversion semantics.** Do NOT repurpose the existing counted conversion. `form_submit` stays the metric behind `formSubmissions` / `conversionRate` / device `*Conversions` (no historical breakage, no double count when primary click → form submit). ADD: `cta_click` payload gains top-level `role: 'primary'|'secondary'` + `placement: <section anchor id>`; API aggregates into new `PageAnalytics.ctaPlacements Json?` shaped `{ [placement]: { primary: n, secondary: n } }` (mirrors `topReferrers` JSON pattern); dashboard gets a "Button conversions by placement" breakdown (clone `DeviceBreakdown`). Placement source: the `usesTemplate` published branch wraps sections in `<div id={anchorMap[sectionId]} data-surface=...>` (`LandingPagePublishedRenderer.tsx:131`) — beacon uses `target.closest('[data-surface][id]').id`. **Accepted limitation:** the product-legacy branch (~L174) renders no id wrapper → placement reports `'unknown'` on legacy non-template pages. Role IS stamped on the anchor (see D-F); placement is NOT stamped (derived by beacon).

**D-C. Parity test scope (realistic).** Three layers:
1. Exhaustive shim unit tests (lossless mapping table, every legacy shape → Destination → identical href as old resolver, incl. missing-form fallback row).
2. Extend `renderParity.meridian.test.tsx` with attribute-level `<a href>` extraction from the **published** HTML, asserted against `resolveDestination()` of the fixture's dest — proves published output = resolver output. Also assert `data-lessgo-cta` + role attrs present on meridian CTA anchors (phase 7 regression net).
3. Edit↔published href equality asserted ONLY for blocks whose edit side already emits real anchors (nav/footer). Editor buttons are contentEditable non-anchors by design — don't force resolved hrefs into edit blocks.
**Accepted limitation:** non-meridian templates get shim/normalizer unit coverage but NO attribute-level render assertions (matches existing parity coverage).

**D-D. Migration shim = phase 1, before any call-site change.** `toDestination()` dual-reads raw strings (`#x`→section, `/x`→page, `tel:`→call, `mailto:`→email, `wa.me`/`api.whatsapp.com`→whatsapp, `^https?`→external) and legacy `buttonConfig` (`link`→parse url as string above; `page`→page{pathSlug}; `link-with-input`→**FOLD into external{url}+formId** — reviewer-confirmed genuinely lossless, keep). **Form case is NOT a pure shim:** legacy `type:'form'` returns fallback when formId is missing from `forms` (`resolveCtaHref.ts:34-37`) — a pure `toDestination` would emit `section{#form-section}` unconditionally. So the forms-existence check stays in the `resolveCtaHref` wrapper: it handles `type:'form'` itself (forms lookup → `section{#form-section}` or fallback), and `toDestination` never sees the form case from legacy input. `resolveCtaHref(buttonConfig, forms, fallback)` keeps its exact legacy signature so the 26 published reader files keep byte-identical href logic (they ARE edited once, in phase 7, for inert analytics attrs only — see D-F). New writes = new shape only (`elementMetadata[key].cta: CTAButton`; popover writes `Link`). Old `buttonConfig` / string hrefs never rewritten in place.

**D-E. Normalization pre-pass = the single new-shape→legacy bridge (fixes "cta never read").** New writes land as `cta: CTAButton`, but ALL ~26 published readers consume `elementMetadata[key].buttonConfig`. Instead of teaching readers to dual-read (or threading goal context into every call site), a plain-module `normalizeCtas(content, {goal, forms})` clones content and, for every `elementMetadata[*].cta`:
1. `dest:'GOAL_REF'` → `goalToDestination(goal, {forms})` → `{ dest, formId? }` (widened return — see below); null/unresolvable goal → leave entry as-is (legacy `buttonConfig` or absent → readers' `#cta` fallback — D-A).
2. Concrete `cta.dest` → Destination directly (detached primaries, secondaries; `cta.formId` carried alongside).
3. Destination → legacy `buttonConfig` written into the clone: on-site form dest → `{type:'form', formId}` (legacy reader's own forms check + fallback reused, exactly legacy semantics); `page{pathSlug}` → `{type:'page', pathSlug}`; everything else → `{type:'link', url: resolveDestination(dest)}`.
4. Entries with no `cta` pass through untouched (old pages: zero diff).
**formId decision (explicit, don't improvise):** a `section{anchor}` Destination has no `formId` slot, so `goalToDestination` uses a **widened return type** `{ dest: Destination, formId?: string } | undefined` — the M1 form case returns `dest: section{anchor:'form-section'}` PLUS `formId`; `normalizeCtas` maps that pair to `{type:'form', formId}`. Do NOT special-case `anchor === 'form-section'` inside `normalizeCtas`. (Missing-form edge: `{type:'form'}` without a resolvable formId passes through to the legacy reader's own fallback — identical semantics either way, but the widened return keeps the mapping principled.)
Called ONCE at each renderer entry (edit `LandingPageRenderer`, published `LandingPagePublishedRenderer`). Blocks stay dumb; readers stay on the legacy shape; GOAL_REF and concrete-dest ctas both render correctly through untouched href logic. Plain module → firewall-safe (no `'use client'` import into published path). **Caller inventory (every surface that instantiates the published renderer must supply `goal`):** blob-bake path via `renderPublishedExport` self-fetch (phase 3 step 2), AND the two live SSR fallback routes that instantiate the renderer DIRECTLY — `src/app/p/[slug]/page.tsx:177` (root SSR, canonical `lessgo.ai/p/{slug}` with no host rewrite) and `src/app/p/[slug]/[...subpath]/page.tsx:171` (subpage SSR, KV-miss fallback for subdomains/custom domains) — covered in phase 3 step 3, else GOAL_REF primaries silently fall back to `#cta` on SSR while the baked blob resolves correctly (public blob-vs-SSR divergence). Symmetry note: `src/lib/blog/ssr.tsx:67` also instantiates the published renderer but blog pages carry no CTAs → intentionally goal-less, out of scope.

**D-F. Analytics stamping goes IN the template blocks (fixes "no CTA events fire").** Today `data-lessgo-cta` exists ONLY in `CTAButtonPublished.tsx` + the beacon — grep confirms ZERO template blocks carry it, and every template CTA is a plain inline `<a>`. The beacon delegates on `[data-lessgo-cta]`, so on template pages `cta_click` never fires at all. Fix: phase 7 adds `data-lessgo-cta` + `data-lessgo-cta-role="primary|secondary"` to every CTA/Hero/Pricing/Footer button `<a>` in all 26 published reader files (both primary AND secondary anchors). Role is a **static literal per anchor** (the block knows which element key it renders: `cta_*`=primary, `secondary_cta_*`=secondary) — no logic added, blocks stay dumb. Attrs are `.published.tsx`-only: they're inert/invisible (no layout/CSS impact), edit blocks render contentEditable non-anchors with no beacon, and the existing precedent (`CTAButtonPublished`) is published-only — accepted, not a parity violation. **Phase-consistency rule: phases 1–6 do not edit these 26 files' href logic; phase 7 is the ONE phase that edits them, attrs only** (nav/footer headers also appear in phase 5's Files touched for the separate Link-object dual-read — that edit is nav links, not CTA href logic).

---

## Phase 1 — Destination types + resolver + migration shim (foundation, zero behavior change)

**Steps**
1. New `src/types/destination.ts`: `Destination` union (`section{anchor}` · `page{pathSlug}` · `external{url}` · `whatsapp{number,msg?}` · `call{number}` · `email{addr}` · `download{fileUrl}` · `social{platform,url}`), `CTAButton { role:'primary'|'secondary', dest:'GOAL_REF'|Destination, formId? }`, `Link { dest: Destination, source:'derived'|'manual' }`, type guards.
2. New `src/utils/destinationShim.ts` (plain module): `toDestination(raw: string | LegacyButtonConfig | Link | CTAButton | undefined): Destination | 'GOAL_REF' | undefined` per D-D; export `LegacyButtonConfig` (superset of the 3 divergent interfaces scout found). Pure — no `forms` param; legacy `type:'form'` is NOT handled here (wrapper's job, D-D).
3. Rewrite `src/utils/resolveCtaHref.ts`: core `resolveDestination(dest: Destination): string` (+ keep `externalLinkProps`); legacy `resolveCtaHref(buttonConfig, forms, fallback='#cta')` becomes wrapper: `type:'form'` handled inline with the forms-existence check (missing form → fallback, byte-identical to today), everything else → shim → `resolveDestination`. Byte-identical outputs for every legacy input.
4. Type the `elementMetadata` boundary: add optional `cta?: CTAButton` alongside existing `buttonConfig` in `src/types/core/content.ts` (~L94) — additive only.
5. Unit tests: mapping table (every legacy shape incl. `link-with-input` fold, **`type:'form'` with formId present vs MISSING from forms → `#form-section` vs fallback**, `#x`/`/x`/`tel:`/`mailto:`/`wa.me`/https strings, undefined/fallback cases), resolver per Destination type.

**Files touched**
- `src/types/destination.ts` (new)
- `src/utils/destinationShim.ts` (new)
- `src/utils/destinationShim.test.ts` (new)
- `src/utils/resolveCtaHref.ts`
- `src/utils/resolveCtaHref.test.ts` (new or extend if exists)
- `src/types/core/content.ts`

**Verification:** `npx tsc --noEmit` green; `npm run test:run` green (incl. existing dispatch/golden suites — proves zero behavior change at the 26 untouched reader files).

## Phase 2 — Brief/goal persistence + goalToDestination

**Steps**
1. `prisma/schema.prisma`: **`Project.brief Json?` ALREADY exists in the committed schema (`prisma/schema.prisma:36`) — CONFIRM it's there and do NOT add it again or generate a duplicate/empty migration.** If (and only if) the implementer finds the column genuinely absent from schema or migration history, stop and raise to the user before running `npx prisma migrate dev` — but the expected outcome is zero schema work this phase. (The only genuinely new migration in this feature is phase 7's `ctaPlacements`; that phase carries the schema-change human gate.)
2. `saveDraft` accepts optional `brief` (validated against `brief.schema.ts` partial — at minimum `goal` + `socialProfiles`); `loadDraft` returns it.
3. Edit store: `goal` (+ `socialProfiles` passthrough) in state + setter action; hydrate from loadDraft.
4. New `src/modules/goals/goalToDestination.ts` (plain module): `goalToDestination(goal, ctx:{forms}) : { dest: Destination, formId?: string } | undefined` — **widened return per D-E** so the form case carries formId. M1 on-site form→`{dest: section{anchor:'form-section'}, formId}`; M2 direct channel→parse `goal.destination` (wa/tel/mailto→whatsapp/call/email); M3 redirect→`external`; M4 subscribe-follow→`social`/`external`; M5 anchor→`section` (M2–M5 omit formId). Undefined goal → undefined (caller falls back legacy). Unit tests per mechanism.

**Files touched**
- `prisma/schema.prisma` (confirm-only expected; NO new migration dir expected — see step 1)
- `src/app/api/saveDraft/route.ts`
- `src/app/api/loadDraft/route.ts`
- `src/types/store/state.ts`
- `src/hooks/editStore/persistenceActions.ts` (hydrate/persist brief)
- `src/hooks/editStore/coreActions.ts` (goal setter — or the slice that owns meta; nothing else)
- `src/modules/goals/goalToDestination.ts` (new)
- `src/modules/goals/goalToDestination.test.ts` (new)

**Verification:** `npx tsc --noEmit`; `npm run test:run`; `npx prisma migrate dev` reports schema in sync (no pending changes for `brief`); manual: save+reload a draft with a goal, field round-trips.

## Phase 3 — CTA normalization pre-pass in both renderers (GOAL_REF + cta→buttonConfig bridge)

**Steps**
1. New `src/utils/normalizeCtas.ts` (plain module, per D-E): clone content; for each `elementMetadata[*].cta` — GOAL_REF → `goalToDestination(goal,{forms})` (widened `{dest, formId?}` return); concrete dest used directly; result down-converted to legacy `buttonConfig` (`{type:'form', formId}` for the form-goal pair / `{type:'page',pathSlug}` / `{type:'link', url:resolveDestination(dest)}`); unresolvable GOAL_REF (null goal) or no `cta` → entry untouched (legacy path intact).
2. Published blob-bake path — thread `goal` through the REAL render chain. `POST /api/publish` does NOT call `generateStaticHTML` directly: it delegates to `renderPublishedExport()` (`src/lib/staticExport/renderPublishedExport.ts`), which makes the actual calls at ~L111 (root page) and ~L197 (each subpage). Changes:
   a. New shared plain-module helper `getPublishedGoal()` in `src/lib/staticExport/getPublishedGoal.ts` (exact name/location = implementer's call, but it MUST be one shared helper, not three copies): given `projectId` (or `pageId → PublishedPage.projectId`), one prisma lookup `Project.brief → goal`; null `projectId`/`brief` → undefined goal → legacy fallback. `renderPublishedExport` calls it **itself** — self-fetch means BOTH its callers — normal publish/republish (`publish/route.ts`) and the shared custom-domain go-live/republish path (`publish/route.ts:264` / `domains/verify-dns`) — are covered with **zero caller edits**; the publish route is NOT touched this phase.
   b. Pass `goal` into **BOTH** `generateStaticHTML` calls — root (~L111) AND each subpage (~L197) — otherwise multi-page primaries never re-point.
   c. `StaticHTMLOptions` (in `htmlGenerator.ts`) gains **OPTIONAL** `goal?`. Optional keeps other callers green: `src/lib/blog/publishBlogPost.ts:138` and its test mock (`publishBlogPost.test.ts:18`) pass no goal — correct, blog pages have no CTAs → null-goal fallback.
   d. `generateStaticHTML` forwards `goal` as a new prop on `LandingPagePublishedRenderer` (its `createElement` at `htmlGenerator.ts:90-102` currently passes none); the renderer runs the pre-pass before dispatch.
3. **Published SSR fallback paths — same goal, same pre-pass (blocker fix).** Two live serving routes instantiate `LandingPagePublishedRenderer` DIRECTLY, bypassing `generateStaticHTML`/`renderPublishedExport`: `src/app/p/[slug]/page.tsx:177` (root SSR — canonical `lessgo.ai/p/{slug}` with no host rewrite) and `src/app/p/[slug]/[...subpath]/page.tsx:171` (subpage SSR — the KV-miss fallback for subdomains/custom domains, confirmed via middleware). Without a goal these render every GOAL_REF primary as `#cta` while the baked blob resolves correctly → public blob-vs-SSR divergence. Fix in BOTH routes: they already call `prisma.publishedPage.findUnique` (subpath select at ~`:120-132`) — extend the select/lookup to reach `projectId → Project.brief → goal` (reuse the shared `getPublishedGoal` helper from step 2a — do NOT triplicate the fetch) and pass the resolved `goal` as the renderer prop, mirroring the `renderPublishedExport` self-fetch. Null goal → legacy fallback, unchanged. (Symmetry note: `src/lib/blog/ssr.tsx:67` also instantiates the published renderer but blog pages carry no CTAs → intentionally goal-less, out of scope.)
4. Edit path: `LandingPageRenderer` runs the pre-pass with store goal (memoized), so editor buttons preview the same target. **Preview note:** `/preview/[token]` renders via this SAME edit renderer + store goal, so it's covered as long as preview's store hydration carries `brief` (loadDraft does per phase 2) — confirm in the manual check; if some preview hydration path skips brief, the null-goal fallback there is accepted (cosmetic preview-only, not a source-of-truth surface).
5. Unit tests: GOAL_REF + form goal → `{type:'form',formId}`; GOAL_REF + WhatsApp goal → `{type:'link', url:'https://wa.me/…'}`; concrete-dest cta (detached primary / secondary) → correct buttonConfig; null goal → content byte-identical; legacy-only entries (no `cta`) → byte-identical; missing form → `{type:'form'}` passthrough resolves to reader fallback.

**Files touched**
- `src/utils/normalizeCtas.ts` (new)
- `src/utils/normalizeCtas.test.ts` (new)
- `src/lib/staticExport/getPublishedGoal.ts` (new — shared goal-fetch helper, step 2a/3)
- `src/lib/staticExport/renderPublishedExport.ts`
- `src/lib/staticExport/htmlGenerator.ts`
- `src/app/p/[slug]/page.tsx` (root SSR fallback — step 3)
- `src/app/p/[slug]/[...subpath]/page.tsx` (subpage SSR fallback — step 3)
- `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx`
- `src/modules/generatedLanding/LandingPageRenderer.tsx`

**Verification:** `npx tsc --noEmit`; `npm run test:run` (parity + generation-contract + `publishBlogPost` suites stay green — proves no-goal projects and the goal-less blog path unchanged). Manual: publish a MULTI-PAGE project with a goal-ref primary on a subpage → subpage HTML primary points at the goal (proves the ~L197 threading). **SSR-path check (blocker regression net): hit `/p/{slug}` served LIVE via the SSR route (canonical `lessgo.ai/p/{slug}` — not the blob-proxy) for a goal-ref project and confirm the rendered primary `<a href>` is the resolved goal target (identical to the baked blob), not `#cta`; repeat for a subpage URL to cover the `[...subpath]` route.** This phase makes the `cta` field actually consumable end-to-end BEFORE phase 4 starts writing it.

## Phase 4 — CTAButton write path + role unification + edit-side click

**Steps**
1. `ButtonConfigurationModal.tsx`: build + write `cta: CTAButton` (new shape only) into elementMetadata; keep reading old `buttonConfig` via shim for initial values. Role derived from element key (`cta_*`=primary, `secondary_cta_*`=secondary) shown read-only. Primary default `dest:'GOAL_REF'` with a visible "follows project goal" state + **detach** control (pick explicit dest). Secondary: no default (D14) — user picks dest explicitly. (Rendering already works: phase 3 pre-pass bridges `cta` → legacy readers.)
2. Unify role readers: `sectionHelpers.ts` `findPrimaryCTASection` + `FormConnectedButton.tsx` read role from `cta.role` with legacy `ctaType`/key-name fallback.
3. Edit-side click: `ctaHandler.ts` + `FormConnectedButton.tsx` route through `toDestination` + `resolveDestination` (kill divergent imperative logic; keep scroll/modal behaviors keyed off the resolved Destination type; form case via the wrapper per D-D).

**Files touched**
- `src/components/toolbars/ButtonConfigurationModal.tsx`
- `src/utils/ctaHandler.ts`
- `src/components/forms/FormConnectedButton.tsx`
- `src/utils/sectionHelpers.ts`
- `src/utils/destinationShim.ts` (extend read of `cta` field if needed)
- `src/utils/destinationShim.test.ts`

**Verification:** `npx tsc --noEmit`; `npm run test:run`; manual editor smoke: configure primary (goal-ref + detached) and secondary buttons, publish, click targets correct in published HTML (proves pre-pass consumes the new writes).

## Phase 5 — ONE shared link popover + Link objects (delete ×6)

**Steps**
1. New shared `src/components/editor/LinkTargetPopover.tsx`: same UX as the 6 identical copies but `onChange(link: Link)`; option sources = section anchors (existing prop), pages via `buildPageLinkOptions`, custom input parsed by `toDestination` (`source:'manual'`).
2. Delete the 6 template copies; update call sites + the 2 `editPrimitives` re-exports to import shared component.
3. Call sites (nav/footer link items) now STORE `Link` objects; their render (both `.tsx` AND `.published.tsx` twins — dual-renderer parity) dual-reads `string | Link` via `toDestination`+`resolveDestination`. Old pages with string hrefs render identically. **Scope note: this edits nav/footer LINK rendering only — CTA-button `resolveCtaHref` logic in these files is NOT touched (D-F consistency).**
4. Check hearth/lex headers/footers (no popover copies exist there): if they store href strings edited elsewhere, add the same dual-read; do not add popover UI beyond current behavior.

**Files touched**
- `src/components/editor/LinkTargetPopover.tsx` (new)
- Delete: `src/modules/templates/{meridian,techpremium,vestria,surge,lumen,granth}/components/LinkTargetPopover.tsx` (6 files)
- `src/modules/templates/vestria/blocks/editPrimitives.tsx`, `src/modules/templates/granth/blocks/editPrimitives.tsx` (+ their `index.ts` re-exports: `src/modules/templates/vestria/index.ts`, `src/modules/templates/granth/index.ts`)
- `src/modules/templates/meridian/blocks/Header/MeridianNavHeader.tsx` + `.published.tsx`
- `src/modules/templates/meridian/blocks/Footer/HairlineFooter.tsx` + `.published.tsx`
- `src/modules/templates/techpremium/blocks/Header/TechPremiumNav.tsx` + `.published.tsx`
- `src/modules/templates/techpremium/blocks/Footer/TechPremiumFooter.tsx` + `.published.tsx`
- `src/modules/templates/surge/blocks/Header/WarmNavHeader.tsx` + `.published.tsx`
- `src/modules/templates/surge/blocks/Footer/ContactFooterRich.tsx` + `.published.tsx`
- `src/modules/templates/lumen/blocks/Header/LumenNav.tsx` + `.published.tsx`
- `src/modules/templates/lumen/blocks/Footer/LumenFooter.tsx` + `.published.tsx`
- (conditional dual-read only) `src/modules/templates/hearth/blocks/Header/WarmNavHeader.tsx` + `.published.tsx`, `src/modules/templates/hearth/blocks/Footer/ContactFooterRich.tsx` + `.published.tsx`

**Verification:** `npx tsc --noEmit`; `npm run test:run` (dispatch + parity suites); manual: edit a nav link in 2 templates, verify editor + published output; verify an OLD project (string hrefs) still renders same links.

## Phase 6 — Derived link sources + social panel (D13)

**Steps**
1. Popover "derived" sources: pages (already wired ph5), legal → privacy path option (reuse `PrivacyPolicyLink` basePath logic), social → site-level socialProfiles. Derived picks stored `source:'derived'`.
2. Social panel (D13): editor panel editing site-level `socialProfiles` persisted in `project.brief.socialProfiles`; bridge to existing `SocialMediaConfig` store (`{items:{id,platform,url,icon,order}[]}`): hydrate store from brief on load, write back on edit. Scrape prefill already lands in Brief — flows in for free once phase 2 persists it.
3. Nav ← sitemap: `deriveNavLinks(pages)` helper (from `getPagesList`/`buildPageLinkOptions`); headers seed `nav_items` from it ONLY when empty/unset (no live sync — hand-edited navs untouched).

**Files touched**
- `src/components/editor/LinkTargetPopover.tsx`
- `src/components/editor/SocialProfilesPanel.tsx` (new) + its mount point in the editor settings UI (single file — locate the existing settings/panel host, e.g. where `SocialMediaConfig` is edited today)
- `src/hooks/editStore/persistenceActions.ts` (brief↔store bridge)
- `src/utils/pageLinks.ts` (add `deriveNavLinks`)
- Header blocks that seed nav when empty: `MeridianNavHeader.tsx`+`.published.tsx`, `TechPremiumNav.tsx`+`.published.tsx`, surge `WarmNavHeader.tsx`+`.published.tsx`, `LumenNav.tsx`+`.published.tsx` (same paths as phase 5; nav-seed logic only — no CTA href changes)
- `src/types/store/state.ts` (if bridge needs a field)

**Verification:** `npx tsc --noEmit`; `npm run test:run`; manual: add social profile in panel → footer social link derivable; multi-page project → nav seeds from sitemap; goal change does NOT move any derived link (acceptance).

## Phase 7 — Analytics attrs on the 26 published blocks + role/placement pipeline — **HUMAN GATE (schema migration — the ONE real schema change in this feature)** + asset rebuild

This is the ONE phase that edits the 26 published CTA-reader files (D-F): add inert `data-lessgo-cta` + `data-lessgo-cta-role` attributes to CTA anchors. NO href/logic changes in these files.

**Steps**
1. `prisma/schema.prisma`: `PageAnalytics.ctaPlacements Json?`; `npx prisma migrate dev`. **Gate: user approves migration.**
2. Stamp template blocks (fixes zero-events bug): every CTA/Hero/Pricing/Footer button `<a>` in the 26 files below gets `data-lessgo-cta="" data-lessgo-cta-role="primary"` (elements keyed `cta_*`) or `"secondary"` (keyed `secondary_cta_*`) — static literals per anchor, both roles stamped. Nav LINK items (non-button) are NOT stamped. `.published.tsx` only (D-F: inert attrs, accepted).
3. `CTAButtonPublished.tsx`: add `data-lessgo-cta-role` (from `cta.role` / legacy `ctaType` / key-name fallback) alongside its existing `data-lessgo-cta`.
4. Beacon `src/lib/staticExport/analyticsGenerator.js`: `initCTATracking` adds `role` (from `data-lessgo-cta-role`, default `'primary'`) + `placement` (`closest('[data-surface][id]').id`, fallback `'unknown'` — incl. legacy non-template pages per D-B) to `cta_click` payload. Fires for primary AND secondary.
5. API `analytics/event/route.ts`: extend Zod schema (`role`, `placement` optional on cta_click); upsert merges into `ctaPlacements` JSON per D-B. `form_submit` counting untouched.
6. Dashboard: new `CtaBreakdown.tsx` (clone `DeviceBreakdown` pattern) showing per-placement primary/secondary splits; wire into `page.tsx`.
7. `npm run build` — buildAssets re-minifies beacon → `public/assets/a.v1.js`. Note: already-published pages keep old beacon until republished; versioned asset name unchanged (payload additive, API backward-compatible).

**Files touched**
- `prisma/schema.prisma` + new migration dir
- `src/components/published/CTAButtonPublished.tsx`
- meridian: `src/modules/templates/meridian/blocks/CTA/ArcCTA.published.tsx`, `Hero/TerminalHero.published.tsx`, `Pricing/ThreeTierPricing.published.tsx`, `Header/MeridianNavHeader.published.tsx`
- techpremium: `src/modules/templates/techpremium/blocks/CTA/TechPremiumCTA.published.tsx`, `Hero/TechPremiumHero.published.tsx`, `Pricing/TechPremiumPricing.published.tsx`, `Header/TechPremiumNav.published.tsx`
- hearth: `src/modules/templates/hearth/blocks/CTA/BookCallCTA.published.tsx`, `Hero/PetalFramedHero.published.tsx`, `Packages/TieredPackages.published.tsx`, `Header/WarmNavHeader.published.tsx`
- lex: `src/modules/templates/lex/blocks/CTA/EngravedInvitationCTA.published.tsx`, `Hero/ProspectusHero.published.tsx`, `Header/LetterheadNav.published.tsx`
- surge: `src/modules/templates/surge/blocks/CTA/BookCallCTA.published.tsx`, `Hero/PetalFramedHero.published.tsx`, `Packages/TieredPackages.published.tsx`, `Header/WarmNavHeader.published.tsx`, `Footer/ContactFooterRich.published.tsx`
- lumen: `src/modules/templates/lumen/blocks/Hero/LumenHero.published.tsx`, `About/LumenPhotographerAbout.published.tsx`, `Contact/LumenContactForm.published.tsx`, `Header/LumenNav.published.tsx`
- vestria: `src/modules/templates/vestria/blocks/publishedPrimitives.tsx`
- granth: `src/modules/templates/granth/blocks/publishedPrimitives.tsx`
- `src/lib/staticExport/analyticsGenerator.js`
- `src/app/api/analytics/event/route.ts`
- `src/app/dashboard/analytics/[slug]/components/CtaBreakdown.tsx` (new)
- `src/app/dashboard/analytics/[slug]/page.tsx`
- `public/assets/a.v1.js` (build artifact, regenerated)

**Verification:** `npx tsc --noEmit`; `npm run test:run` (parity suites green — attrs are inert); `npm run build` green; manual: publish a page per audience type (spot-check 2–3 templates), click hero primary + a secondary, confirm `cta_click` fires with role+placement, `ctaPlacements` rows + dashboard breakdown appear, form_submit conversions unchanged.

## Phase 8 — Parity/golden tests + full build + manual QA — **HUMAN GATE (pre-merge QA)**

**Steps**
1. Extend `renderParity.meridian.test.tsx` per D-C: extract `<a href>` attributes from published HTML; assert vs `resolveDestination()` of fixture dests (valid because the phase-3 pre-pass normalizes via `resolveDestination`); assert `data-lessgo-cta`/`data-lessgo-cta-role` present on meridian CTA anchors; edit↔published href equality for anchor-emitting blocks (nav/footer). Extend `MERIDIAN_BLOCK_MOCKS` fixtures with CTAButton (GOAL_REF + explicit) and Link (string-legacy + object) cases.
2. New legacy-shim golden: `src/modules/generatedLanding/legacyHrefShim.test.tsx` — old-shaped saved-page fixture (raw hrefs + all 4 legacy buttonConfig types, incl. form-with-missing-formId) rendered through published renderer → hrefs byte-identical to pre-scale-04 expectations.
3. Full `npm run build`.
4. **Human gate — manual QA (this feature changes what every button points to):** run `/manual-test`-style pass on dev: goal flip form→WhatsApp re-points every primary (zero copy change) — incl. a subpage primary on a multi-page project, secondary/links unmoved, old project renders identically, editor↔published visual parity across templates, published HTML click-through + beacon events visible — and re-check the SSR fallback URLs (`/p/{slug}` + a subpath) match the blob output (phase 3 blocker net).

**Files touched**
- `src/modules/templates/__tests__/renderParity.meridian.test.tsx` (+ the mock fixture module it imports, `MERIDIAN_BLOCK_MOCKS` source file)
- `src/modules/generatedLanding/legacyHrefShim.test.tsx` (new)

**Verification:** `npx tsc --noEmit`; `npm run test:run` full green; `npm run build` green; human QA sign-off.

---

## Unresolved questions

1. Conversion metric: keep form_submit as counted conversion (plan) or should primary cta_click drive `conversionRate` for non-form goals?
2. Nav derivation: seed-only-when-empty (plan) sufficient, or want live sitemap sync?
3. Unconfigured secondary CTA: legacy `#cta` fallback (plan) or render inert?
4. No goal-edit UI in scope — acceptance "change goal" via saveDraft/DB ok until scale-01?
5. hearth/lex: dual-read only (plan) or also give them the shared popover now?
6. Already-published pages keep old beacon until republish — bulk republish wanted post-merge?
7. Placement `'unknown'` on legacy non-template pages (D-B) — accepted, or want a wrapper-id backfill for the legacy branch?
