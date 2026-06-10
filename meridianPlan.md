# Meridian — Product Template Migration Plan

Product-line analog of `nsoPlan.md` (service). PO owns product. **Goal:** move the product
line off the 47-UIBlock à-la-carte assembly model onto the template-scoped architecture the
service line proved (`templates/<id>/*` + `audience/<type>/*`), with **Meridian** ("Modern
Tech") as the first product template. Then archive the 47 blocks. Then add templates as the
designer ships them.

Source design: `Meridian - Modern Tech.html`. Reference for prior product flow:
`newOnboarding_v3.md` (the system being replaced at the render/selection layer).

---

## Philosophy

**Pilot-first, build-then-archive.** The 47 UIBlocks are the only product renderer that
exists today. We build Meridian to a verified end-to-end slice, cut product dispatch over to
it, and archive the 47 *in the same cutover* — never archive first (no broken window). Mirrors
how service de-risked Hearth.

**Fixed now, awareness-engine later** (PO call). Pilot uses a fixed section list + 1 block per
section (no LLM section/block branching). The deterministic awareness-template engine is
re-introduced for Meridian blocks in a later phase.

---

## Scope (designer-delivered Meridian)

**7 blocks** (= "all sections designer has given"), 1 block per section for pilot:

| Section | Meridian block | Notable elements |
|---|---|---|
| Header | `MeridianNavHeader` | brand mark, nav links, sign-in + primary CTA |
| Hero | `TerminalHero` | status eyebrow, h1 w/ accent mark + caret, lede, 2 actions, 4 stat-meta cells, terminal product-vis card |
| Features | `HairlineFeatureGrid` | eyebrow, title, lede, 6× {index, glyph icon, title, body, link} |
| Testimonials | `ProofWithLogoRail` | eyebrow, title, 3 quote cards (1 raised + 2), 6-logo rail |
| Pricing | `ThreeTierPricing` | eyebrow, title, lede, 3× {plan, amount, per, pitch, feature list, CTA}, mid = "Most chosen" |
| CTA | `ArcCTA` | eyebrow, headline, body, 2 actions, the arc (once-per-page motif) |
| Footer | `HairlineFooter` | wordmark, tag, newsletter form, 4 link columns, copyright/location |

- **Palettes:** 9 (mint default). Pilot locks to `mint`; all 9 enabled in expansion phase.
- **Variants:** 3 (`developer` default, `marketing`, `light`). Pilot locks to `developer`;
  enabled in expansion phase. Pure `data-variant` token swap — never touches copy.

---

## Reuse / Build / Archive

**Reuse (product is mature — don't reinvent):**
- v3 strategy concepts (`oneReader` / `oneIdea` / `featureAnalysis`) drive copy quality.
- Copy-gen infra: `applyAllSchemaDefaults` engine, collection-id backfill pattern (from
  service `parseCopy`), italic/accent-`<em>` fallback pattern.
- Product onboarding UI + `useGenerationStore` (one-liner → understanding → goal → offer →
  assets). Reuse as-is; only the render target changes.
- `/api/v3/*` generation routes (or rehome to `/api/audience/product/*` — see Q).

**Build new (Meridian-specific):**
- `src/modules/templates/meridian/`: `tokens.ts`, `palettes.ts` (9), `variants.ts` (3),
  `sectionRules.ts`, `ThemeInjector.tsx`, `SSRTokens`, `blocks/` (7 × edit+published),
  `resolveBlock.ts`, `index.ts`, `paletteImageKeywords`. Mirrors `templates/hearth/*`.
- `src/modules/audience/product/`: `voice.ts` (Meridian §9 product voice), fixed
  `sectionSelection.ts`, `selectBlocks.ts` (fixed map), `elementSchema.ts` (7 blocks),
  `parseCopy.ts` (defaults + id-backfill + accent-`<em>` fallback).
- Registry: add `meridian` loader to `templates/registry.ts` + `TemplateId` union.
- Dispatch: `audienceType='product'` → `templateId='meridian'`.

**Archive (after cutover verified):**
- `src/modules/UIBlocks/*` (47 blocks) → `archive/`.
- `sectionSelectionV3`, `selectUIBlocksV3`, `layoutNames` (47-block registry).
- Product block *entries* in `layoutElementSchema.ts` — **keep `applyAllSchemaDefaults`
  engine** (service `parseCopy` depends on it; do not delete the function).
- Decouple `/p/[slug]` from `layoutElementSchema` if the 47-schema pull blocks the archive
  (the 7.5d pre-existing 17.5 kB finding).

---

## Phases

### P0 — Foundation + branch (~1d)
- New product branch (base = the 7.5 template rails — see Q1).
- `TemplateId += 'meridian'`; register loader in `templateRegistry`.
- `audience/product/*` + `templates/meridian/*` skeletons (stubs compile).
- Dispatch maps product → meridian, behind the not-yet-built blocks (legacy 47 still render
  product until P4 cutover).
**Exit:** build clean; registry resolves `meridian` to a stub; legacy product untouched.

### P1 — Meridian design system (~2d)
- Port tokens (CSS vars), `palettes.ts` (9, incl. light-variant accent overrides),
  `variants.ts` (developer/marketing/light), `ThemeInjector` (emit `data-palette` +
  `data-variant` + `--accent`), `sectionRules` (Meridian is uniform `--ink` + hairlines —
  minimal alternation).
- Static demo route; verify all vars resolve, fonts load (Inter Tight / Inter / JetBrains Mono).
**Exit:** demo renders Meridian surfaces correctly across the 3 variants.

### P2 — Pilot blocks (~4d)

**Goal:** 7 Meridian blocks (edit + published) + element schema + real resolver, rendering the
7-section page at full fidelity. NOT in P2: copy/strategy/voice (P3), product cutover/dispatch
(P4), archiving (P5). Blocks are dormant (not invoked by product renderer) — verified via a dev
gallery. Design source: `Meridian - Modern Tech.html` (block markup 1167-1463; component CSS 285-676).

**Mirror Hearth file-for-file** (proven reference):

| Concern | Hearth (copy from) | Meridian (create) |
|---|---|---|
| Editable wrapper | `hearth/components/HearthEditable.tsx` | `meridian/components/MeridianEditable.tsx` (near-copy; do NOT cross-import Hearth — keeps Meridian's chunk self-contained) |
| Empty-image affordance | `hearth/components/HearthAddImageOverlay.tsx` | `meridian/components/MeridianAddImageOverlay.tsx` (hero image slot only) |
| Store/content hook | `hearth/hooks/useServiceBlock.ts` | `meridian/hooks/useMeridianBlock.ts` (generic; rename only) |
| Block pair | `hearth/blocks/<Section>/<Name>.tsx` + `.published.tsx` | `meridian/blocks/<Section>/<Name>.tsx` + `.published.tsx` |
| Resolver | `hearth/resolveServiceBlock.ts` | `meridian/resolveMeridianBlock.ts` (replace P0 stub: real `{edit,published}` registry keyed by lowercased layout name) |
| Element schema | `audience/service/elementSchema.ts` | `audience/product/elementSchema.ts` → `meridianElementSchema` (audience-level; pure data; imports ZERO template modules — firewall) |
| Schema registration | `sections/layoutElementSchema.ts:330 ...serviceElementSchema` | add `...meridianElementSchema` to the same registry object |

**Invariants (what keeps shared edit tooling working at cutover):**
- Edit block: `'use client'`, takes `{sectionId}`, calls `useMeridianBlock<T>`, renders `<section data-section-id>` + `<MeridianEditable … data-element-key>` per field.
- Collection item key: `` `${collectionKey}_${field}_${item.id}` ``.
- Published block: no `'use client'`; content **as props** (renderer spreads `section.elements`); `dangerouslySetInnerHTML` for any `<em>`-bearing field; no add/remove chrome.
- Both variants: identical scoped `<style>` using `var(--…)` only (never hardcode color — palette/variant must cascade).
- Numbers/prices/stats/quotes → `ai_generated_needs_review`; images/icons → `manual_preferred`; ids → `system`. Decorative motifs (terminal-vis, CTA arc, hero grid, crosshairs, caret) are static CSS, NOT schema fields.

**The 7 blocks** (`sectionType` · layout key · fields · Hearth analog):

1. **header · MeridianNavHeader** (HTML 1167-1178) — el: `logo_text`, `cta_text`("Start free"), `signin_text`("Sign in"), `logo_image`(opt/manual). coll: `nav_items`{id,label,href} 2-5. ← `WarmNavHeader`.
2. **hero · TerminalHero** (1181-1225) — el: `status_text`, `audience_tag`, `headline`(may `<em>`; accent = color not italic), `lede`, `cta_text`, `secondary_cta_text`, `caption`, `hero_image`(opt/manual→overlay). coll: `stats`{id,value,label} 0-4 (needs_review). Decorative static: hero-grid, terminal `.hero-vis` (aria-hidden), blinking caret. ← `PetalFramedHero`.
3. **features · HairlineFeatureGrid** (1237-1286) — el: `eyebrow`, `headline`, `lede`. coll: `features`{id,title,description,icon(manual/lucide),link_text} 3-6. `F-0n` index from array position. ← `IconServiceCards`.
4. **testimonials · ProofWithLogoRail** (1298-1336) — el: `eyebrow`, `headline`. coll: `testimonials`{id,quote,author_name,author_role} 1-3 (FIRST = raised `.lg`; needs_review); `logos`{id,name} 0-6 (manual). ← `PullQuoteWithMark` + new logo rail.
5. **pricing · ThreeTierPricing** (1349-1396) — el: `eyebrow`, `headline`, `lede`. coll: `tiers`{id,plan,amount(needs_review),per,pitch,features(list),cta_text,featured(bool=`.mid`)} 2-3. **Nested list + featured flag: mirror `TieredPackages` storage shape exactly.**
6. **cta · ArcCTA** (1409-1421) — el: `eyebrow`, `headline`(may `<em>`), `body`, `cta_text`, `secondary_cta_text`. Decorative static: `.cta-arc` + grid. ← `BookCallCTA` (reuse the `isButton` select-vs-edit CTA convention so "Button Settings" works).
7. **footer · HairlineFooter** (1433-1463) — el: `wordmark`, `tag`, `newsletter_placeholder`, `newsletter_cta`, `copyright`, `location`. coll: `footer_columns`{id,heading,links(nested)} 1-5. **Nested columns→links: mirror `ContactFooterRich`.**

**Verification (P2 exit gate):**
1. Dev gallery — extend `/dev/meridian` (or `/dev/meridian/blocks`) to render every block edit+published from schema-default mock content; visual-diff vs HTML reference (developer/mint); spot-check marketing+light don't break layout.
2. Editor contract — every editable el has `data-section-id`+`data-element-key`; every collection item a stable `id`.
3. `<em>` round-trips accent-colored (not italic) in both modes.
4. `getSchemaDefaults('TerminalHero')` etc. resolve; `applyAllSchemaDefaults` fills all 7.
5. `tsc --noEmit` + `npm run build` clean; product byte-sizes unchanged (still legacy); `/dev/hearth-demo` still renders.

**Guardrails:** `audience/product/elementSchema.ts` imports zero template modules; Meridian blocks never import from `templates/hearth/*`; no change to `defaultTemplateForAudience` wiring / render gate / any product path — P2 is additive and dormant until P4.

**Exit:** all 7 blocks render at fidelity in the dev gallery; schema registered; build clean; product untouched.

### P3 — Generation wiring (~2d) — ✅ DONE & build-green (2026-06-10)
- Fixed section list + fixed block map in `audience/product/selectBlocks`.
- Meridian product voice into copy prompt; strategy reuses oneReader/oneIdea/featureAnalysis
  (drop `vibe` → palette/variant locked for pilot).
- Route: reuse `/api/v3/*` or rehome (Q3). `parseCopy` defaults + id-backfill + accent-`<em>`.
- E2E: one-liner → full page JSON, no UI.
**Exit:** curl-able pipeline one-liner → renderable Meridian page.

**Built (decisions: lean strategy / rehome routes / headline-only accent):**
- `audience/product/`: `sectionSelection.ts` (fixed 7), `selectBlocks.ts` (uses existing
  `MERIDIAN_LAYOUT_NAMES`), `voice.ts` (Modern-Tech `PRODUCT_VOICE`), `accentFallback.ts`
  (accent ONLY hero+cta headlines), `parseCopy.ts` (**recursive** id-backfill — footer_columns→links),
  `promptFirewall.ts`, `copyPrompt.ts` (+`getMeridianCollectionSchemas()`),
  `strategy/promptsProduct.ts` (trimmed v3: awareness/oneReader/oneIdea/featureAnalysis, no
  vibe/decisions), `strategy/parseStrategyProduct.ts`.
- `lib/schemas/productStrategy.schema.ts` (`ProductStrategyResponseSchema`), `types/product.ts`
  (`ProductStrategyOutput`), `modules/prompt/mockResponseGeneratorProduct.ts`.
- Routes: `/api/audience/product/strategy` + `/generate-copy` (mirror service routes; 2/3 credits).
- **Middleware:** added the two product routes to `isPublicRoute` (next to public `/api/v3/*`);
  handlers still enforce auth via `requireAuth` (same posture as v3).
- Verified: tsc clean, `next build` green; mock curl (DEMO_TOKEN) → 7 sections, nested footer-link
  ids backfilled, 1 featured tier; real-LLM E2E (OpenAI) → well-formed nested tiers + footer,
  hero/cta `<em>` only. needs_review is **schema-driven** (stats.value / testimonial fields /
  tiers.amount are `ai_generated_needs_review`); editor-badge surfacing to be confirmed in P4.

### P4 — Onboarding + edit/publish verify (~3d) — ✅ BUILD-GREEN (2026-06-10), runtime E2E pending
- Wire product onboarding pages to Meridian gen; picker locked (developer + mint).
- Verify inline edit, auto-save round-trip, preview, publish, form builder on all 7 blocks.
- **Cutover:** flip product dispatch to Meridian.
**Exit (DECISION GATE):** product user completes onboarding → live Meridian page. Is output
good enough to archive + expand?

**Built (decisions: build-parallel onboarding / hard-lock mint+developer / strict gate):**
- **Cutover via one shared gate helper** `usesTemplateModule(audienceType, templateId)` in
  `types/service.ts` — `service || (product && templateId==='meridian')`. STRICT: no
  null→meridian default (legacy `/create` product = templateId-null + 47-block content stays on
  legacy until P5). Applied at ALL ~10 gate sites: `componentRegistry.ts:446` +
  `componentRegistry.published.ts:337` (block resolvers), `LandingPageRenderer`/
  `LandingPagePublishedRenderer` (`isService`→`usesTemplate`), `useTemplateReady.ts` (client
  preload), `EditablePageRenderer` (edit-readiness), `htmlGenerator.ts` (static export, + thread
  templateId/variantId from `publish/route.ts`), `p/[slug]/page.tsx`, `LayoutChangeModal` +
  `EnhancedAddSection` (hide layout-swap UIs), `ImageToolbar` (palette mood).
- **variantId threading**: `p/[slug]` selects + passes variantId; published renderer + edit
  renderer thread it to `SSRTokens`/`ThemeInjector` (Meridian consumes, Hearth ignores).
  `HearthPalette` casts widened to `HearthPalette | MeridianPalette`.
- **New parallel onboarding** `/onboarding/product/[token]` (mirrors service): new
  `useProductGenerationStore` + steps oneLiner/understanding(`/api/v2/understand`)/goal/offer +
  GeneratingStep (calls `/api/audience/product/{strategy,generate-copy}`, lean finalContent,
  saveDraft with templateId=meridian/variant=developer/palette=mint, → `/edit`). `/api/start`
  product routing repointed here. Legacy `/create` left for P5 archive.
- **CTA→form**: edit-side `isButton` already wired (MeridianEditable). Fixed published gap —
  `ArcCTA.published` + `TerminalHero.published` now honor `cta_text` `buttonConfig`
  (`#form-section` resolution), mirroring `BookCallCTA.published`.
- **Verified**: `next build` green (route `/onboarding/product/[token]` emitted). **Pending
  manual E2E** (no headless browser in env): onboarding→edit→publish flow, `data-variant` in
  published SSR HTML, needs-review badges on all 7, form-modal open on published CTA click,
  legacy product regression (templateId-null → 47).

### P5 — Archive the 47 (~1d)
- Move `UIBlocks/*` + v3 selection logic to `archive/`. Strip product entries from
  `layoutElementSchema` (keep engine). Decouple `/p/[slug]` if needed.
- `npm run build` clean; product renders only via Meridian.
**Exit:** old architecture archived; single product render path.

### P6 — Variants + palettes (~2d, expansion)
- Enable 3 variants + 9 palettes in picker / theme panel. Per-palette image keywords.

### P7 — Awareness engine (~3d, expansion)
- Re-introduce deterministic awareness → section-sequence routing for Meridian blocks
  ("eventually" per PO). Mirrors product v3 templates + service `sectionSelection`.

### P8 — More product templates (ongoing)
- Add each new designer template under `templates/<id>/*`; expand picker.

---

## Cross-cutting

- **Renderer branch key:** `(audienceType='product', templateId='meridian')`. No inference from palette.
- **Authoring invariant:** `data-element-key` + `data-section-id` identical to product/service blocks — the one thing that keeps shared edit tooling working.
- **No feature flag** — prebeta, hard cutover acceptable (pending Q2 live-data confirm).
- **Voice = type-level** (Meridian §9 is *product* voice). If a 2nd product template arrives,
  voice stays shared under `audience/product`, template only swaps visuals.
- **Bundle:** Meridian lands in its own async chunk via the dynamic registry (firewall holds).

---

## Unresolved Questions

1. **Branch base.** Meridian depends on the 7.5 template rails (registry, `audienceType`,
   dispatch) — these live on `phase-7.5-multi-template`, NOT `main`. Branch product off
   `phase-7.5` now, or wait for 7.5 → main merge then branch off main? (Rec: merge 7.5 first,
   branch off main — clean base, no inherited service working-tree.)
2. **Live product data?** Any real product projects / published pages in the DB to preserve?
   If none (prebeta) → hard cutover, no dual-renderer coexistence. If some → need
   templateId-null fallback to legacy during migration. (Rec: confirm none → hard cut.)
3. **API namespace.** Keep `/api/v3/*` for product, or rehome to `/api/audience/product/*` to
   match service's clean hierarchy? (Rec: rehome — symmetry, small cost, prebeta.)
4. **Strategy reuse depth.** Reuse full v3 strategy prompt (drop only `vibe`), or author a
   leaner Meridian-specific strategy like service did? (Rec: reuse — product strategy is the
   mature asset; don't regress copy quality.)
5. **`useGenerationStore` rename.** Leave as-is (like service left `useServiceGenerationStore`),
   or rename under `audience/product`? (Rec: leave — renaming triples surface for no prelaunch value.)
6. **Onboarding "assets/goal" steps** — keep all current product steps for Meridian, or trim
   to match the simpler service flow? (Rec: keep — they feed real copy signal.)
