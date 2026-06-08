# Service Onboarding — Implementation Plan

Source: `newServiceOnboarding.md`. Philosophy: **pilot first with minimum UIBlocks, then expand**. Validate the full pipeline (onboarding → strategy → copy → render → edit → publish) on a thin vertical slice before scaling block library.

---

## Pilot Scope (the "thin slice")

**Goal:** one persona can complete onboarding → see published service page, end-to-end, with real Hearth look. No block choice, no palette choice beyond default.

**Locked simplifications for pilot:**
- 1 service type only (`agency`) for prompt tuning; flow accepts others but tuned on agency.
- 1 awareness state only (`search-aware-comparing`) — single section template.
- 1 goal only (`book-call`).
- 1 palette only (`terracotta`) — picker UI shows 1 enabled, others disabled-with-tooltip.
- 1 block per section (no LLM `uiblockDecisions` branching yet — fixed mapping).
- Minimum sections (6): **Header, Hero, Services, Testimonials, Packages, CTA, Footer** (7 sections, drop Packages if testimonials missing).
- No optional sections (Problem, Transformation, IndustriesServed, ObjectionHandle, CaseStudies, Outcomes, Process, Approach, ClientLogos, FAQ, TeamAndFounder) until expansion.

**Pilot block list (6 blocks × 2 renderers = 12 files):**
- WarmNavHeader, PetalFramedHero, IconServiceCards, PullQuoteWithMark, TieredPackages, BookCallCTA, ContactFooterRich.
- (Optionally drop TieredPackages from pilot → 6 blocks. Decide based on whether AI can generate plausible package data without hallucinating.)

**Pilot validates:**
1. DB shape (`projectType`, `paletteId`).
2. Onboarding store + page transitions.
3. Strategy + copy prompts produce usable output.
4. Hearth tokens render correctly across browsers.
5. Shared renderer branches cleanly on `projectType`.
6. Existing edit/preview/publish/auto-save work unchanged on service blocks.
7. Italic-accent `<em>` LLM convention behaves.

---

## Phases

### Phase 0 — Foundation (~7 days)
- Prisma migration: `projectType` (`@default("product")`), `paletteId` on Project + PublishedPage. Backfill existing rows.
- Prisma migration: `User.persona` (nullable enum, 8 values: SaaS founder, indie maker, agency, consultant, coach, freelancer, local service, productized service). No backfill.
- `src/types/service.ts`: `ProjectType`, `ServiceType`, `ServiceAwareness`, `ServiceGoal`, `HearthPalette`, `ServiceStrategyOutput`, `UserPersona`.
- **Persona capture flow:**
  - New signup → persona prompt as first post-signup step (blocking, single screen).
  - Existing users without `persona` → blocking modal on next dashboard load.
  - Anonymous `/api/start` → `projectType='product'` default. On later signup, re-derive `projectType` from new persona; offer "convert this project" prompt if mismatch.
  - Account settings → persona edit ("I do different work now").
- `/api/start` reads `user.persona` → derives `projectType`. SaaS founder / indie maker → `product`. All others → `service` (also seeds `serviceType` for Step 2).
- `useServiceGenerationStore.ts` — net-new, isolated; product store untouched.
- Renderer branch stub: `resolveServiceBlock` returns placeholder div until Phase 3. Branches via `componentRegistry.ts` shape.
- **No feature flag** — pilot ships live (no live users yet, so no gating risk).
- **Credits:** reuse existing `UsageEvent.eventType` strings + `UserUsage.fullPageGens` counter. No `service_*` namespace.
- **PostHog `projectType` event property + `user.persona` super-property** baseline from day one.
- **Project.content JSON shape audit:** verify `saveDraft`/`loadDraft` round-trip new section types (`services`, `packages`) without implicit shape assumptions (legacy `features` collection etc.).
- **Editor layout-swap UIs:** hide `LayoutSelector.tsx` / `EnhancedAddSection.tsx` / `LayoutChangeSelector.tsx` when `projectType='service'`. Parallel registry entries deferred to post-pilot.

**Exit:** signed-in users have a persona; new project creation auto-derives `projectType` from persona; renderer doesn't crash; product route untouched; credits + analytics + draft persistence all account for service projects.

### Phase 1 — Hearth Design System (~3 days)
- Port tokens from `Hearth - Warm Service.html` → `src/modules/service/design/tokens.ts`.
- `palettes.ts` with all 9 defined (only terracotta enabled in pilot).
- `HearthThemeInjector.tsx` — emits CSS vars + `data-palette` on `:root`.
- `sectionRules.ts` — cream alternation map.
- Static demo route to verify all CSS vars resolve and look right.

**Exit:** demo page renders Hearth surfaces with correct fonts, spacing, accent.

### Phase 2 — Generation Backend (~5 days)
- `/api/service/strategy` + `promptsService.ts` + Zod schema.
- `/api/service/generate-copy` + `copyPromptService.ts` + `voiceHearth.ts` (full voice spec, even though pilot uses fixed mapping — voice still drives copy).
- `sectionSelectionService.ts`: hardcoded to `search-aware-comparing` template for pilot.
- `selectUIBlocksService.ts`: hardcoded mapping for pilot block set.
- Italic-`<em>` post-process fallback (deterministic emphasis-picker if LLM omits).
- E2E backend test: input one-liner → JSON output of full page (sections + content) without UI.

**Exit:** curl-able pipeline from one-liner to renderable page JSON.

### Phase 3 — Pilot Block Build (~5 days)
- 6 blocks × 2 renderers each (edit + published variants).
- Author against same `data-element-key` / `data-section-id` conventions as product blocks → editor compatibility free.
- Visual diff vs Hearth HTML reference for each block.
- `serviceElementSchema.ts` covering only pilot block elements.
- `resolveServiceBlock.ts` real implementation.

**Exit:** can render the pilot section list with Hearth look.

### Phase 4 — Pilot Onboarding UI (~4 days)
- Service onboarding pages: one-liner → understanding → goal → offer → assets → style → generating.
- **No gateway page on project flow for authed users** — `projectType` already derived from `user.persona` at `/api/start`. Spec's Step 0 collapses into Phase 0's persona capture.
- **Pilot UI lock-down:** only `agency` persona can reach service flow; other service personas (consultant, coach, freelancer, local service, productized service) → blocked with "coming soon" screen + waitlist email capture.
- Pilot UI shrinks: goal locked to `book-call`, palette locked to terracotta.
- Step 2 (Understanding) pre-fills `serviceType='agency'` from persona; user can refine sub-category.
- Wire to APIs from Phase 2.
- Generating screen → save draft → redirect to `/edit/[token]`.

**Exit:** agency-persona user can complete service onboarding and land on edit screen with generated page. Other service personas waitlisted.

### Phase 5 — Pilot Edit/Publish Verification (~3 days)
- Verify inline editing works on all 6 pilot blocks.
- Verify auto-save round-trip.
- Verify preview + publish.
- Verify form builder on BookCallCTA.
- Image picker keyword override (`imageKeywords.ts` warm-leaning defaults).
- **No theme panel changes yet** — defer to expansion phase. Service projects show product theme panel in pilot (acceptable since palette is terracotta-locked).

**Exit:** end-to-end agency persona ships a live published page. Pilot complete.

### Phase 6 — Pilot Hardening (~3 days) ✅ DONE 2026-05-07
- Internal dogfooding (3–5 personas): different service types, different industries.
- Tune prompts based on observed LLM output.
- Fix italic-`<em>` reliability.
- Decide: is pilot output good enough to expand, or does prompt strategy need rework?

**Exit:** signed-off pilot. Decision gate before expansion. See `servicePilotReview.md` — both gates passed, ship verdict.

---

## Expansion Phases (post-pilot)

### Phase 7 — Palettes (~2 days) 🔄 WIP — code done, uncommitted as of 2026-06-07
- Enable remaining 8 palettes in picker. ✅ `palettes.ts` `pilotEnabledPalettes` spans all 9.
- Industry-signal default selection (Step 6 spec logic). ✅ `paletteSelection.ts` — keyword scoring → serviceType fallback → terracotta.
- Per-palette image keyword tuning. ✅ `imageKeywords.ts` `PALETTE_IMAGE_KEYWORDS` layered on serviceType hint; `ImageToolbar` passes `paletteId` through.

**Exit:** commit + build verify. Phase 6 backlog items (credibility hallucination, restaurant-marketing lede outlier) deferred to Phase 8 or later.

### Phase 7.5 — Multi-Template Architecture Refactor (~5 days) 🆕 2026-06-07
**Trigger:** designer delivered 8 more templates (Folio, Riot, Lex, Mill, Atlas, Pulse, Vital, Stockroom). Locks in 3-tier model: **audienceType → templateId → variantId + paletteId**.

**Sequenced as tickets (PO calls):** 7.5a rename+schema, 7.5b restructure+voice, 7.5c dispatch+picker, 7.5d boundary tightening (firewall blockers), 7.5e route rename.
- **7.5a DONE (2026-06-07):** `projectType→audienceType` across 33 files, `templateId`/`variantId` columns + migration `20260607120000_rename_audiencetype_add_template_fields`, PostHog props renamed, save/load/publish plumbing. Build clean.
- **7.5b DONE:** `src/modules/service/*` split into `templates/hearth/*` (visual) + `audience/service/*` (voice/copy/strategy). Voice `HEARTH_VOICE→SERVICE_VOICE` (type-level). `imageKeywords` split (audience type-hint vs hearth palette-mood).
- **7.5c DONE:** `TemplateModule` contract (`src/types/template.ts`), dynamic-import `templateRegistry` (`src/modules/templates/registry.ts`) — Hearth blocks land in a separate async chunk, NOT the shared bundle. Page-level preload dispatch (`useTemplateModule` client hook; RSC/static export preload before sync render). Picker: template card (Hearth-only) + 9 palettes, no variant UI; persists `templateId`/`variantId='classic'`. Prompt firewall assertion (`promptFirewall.ts`) on strategy + copy builders.
- **7.5d DONE (2026-06-08, PO 2nd-review blockers):** firewall leaks fixed. `elementSchema.ts` moved `templates/hearth/` → `audience/service/` (audience-level; shared by all service templates); 3 importers updated. ImageToolbar no longer static-imports Hearth — `paletteImageKeywords` added to `TemplateModule`, palette phrase sourced via `getLoadedTemplate(...)`, query composed by audience `getServiceImageQuery`. Grep gate: **zero** `@/modules/templates/hearth/*` static imports under `sections/`, `copy/`, `prompt/`, `api/v3/`, `p/`, `hooks/`, `utils/`, `edit/`.
- **7.5e DONE:** `/api/service/*` → `/api/audience/service/*` (routes moved; `GeneratingStep` callers + endpoint strings updated).
- **Bundle finding (7.5d):** `/p/[slug]` stays 17.5 kB — NOT reduced by the move. Root cause is pre-existing: `p/[slug]/page.tsx` imports `sanitizeContentForPublish` from `sections/layoutElementSchema`, pulling the full schema registry. Not a template leak. → separate follow-up "decouple published render from `layoutElementSchema`" (flag to PO).
- **Migration NOT yet applied** (dev DB unreachable at edit time) — run `npx prisma migrate deploy` when DB is up. Runtime gates (dogfood copy-diff, edit/publish E2E) deferred to when DB is reachable; all tickets pass `npm run build`.
- **Deferred cleanup (intentional):** `useServiceGenerationStore` and the `/onboarding/service/[token]` route path keep their names — renaming would 3× the surface for no pre-launch value. Revisit post-launch.

**Rename:** `projectType` → `audienceType`. Values: `product | service | ecommerce` (nothing in prod = zero migration risk). Touch Prisma schema, all `/api/*` routes, edit store, renderer dispatcher, image keywords, prompts.

**Schema additions** (Project + PublishedPage):
- `audienceType: enum` (renamed from `projectType`)
- `templateId: string?` — hearth | folio | riot | lex | mill | atlas | pulse | vital (meridian post-launch)
- `variantId: string?` — template-specific (Classic/Condensed/Editorial for Hearth, Serif/Mixed/Grotesque for Folio, etc.)
- `paletteId: string?` — kept, but now template-scoped (terracotta belongs to Hearth; bone belongs to Folio; etc.)

**Directory restructure:**
```
src/modules/templates/
  hearth/        (move existing src/modules/service/* here)
    tokens.ts, palettes.ts, sectionRules.ts, blocks/, ThemeInjector.tsx, index.ts
  folio/
  riot/
  ...
  registry.ts    — id → template module
src/modules/audience/
  service/
    voice.ts     (rename from voiceHearth.ts — type-level voice, shared across all service templates)
    copyPrompt.ts, strategy/, sectionSelection.ts, italicAccentFallback.ts
  product/       (existing v3 logic moves here, or stays where it is and gets aliased)
  ecommerce/     (stub for now)
```

**Voice extraction:** `voiceHearth.ts` → `src/modules/audience/service/voice.ts`. Italic-`<em>` rules become **service-type convention**, not Hearth-specific. All 8 service templates share. No prompt regression — rules unchanged.

**Renderer dispatch:** `resolveServiceBlock` → `resolveTemplateBlock(audienceType, templateId, blockType)`. Two-level lookup: type → template → block renderer.

**Onboarding type-gate (persona-step refinement):**
- Keep `User.persona` capture (8 options stay).
- Persona → `audienceType` derivation map. SaaS founder / indie maker → `product`. All other 6 → `service`. (E-commerce not in pilot persona list; added in ecom wave.)
- No new global step. Refinement = persona prompt copy updated to clarify "this drives what kind of page we build."

**Template + variant + palette picker:**
- Lives in onboarding **after section selection + copy gen**, runs **parallel** to copy generation (Stage 3b in unified model).
- For pilot Hearth users, picker filtered to Hearth templates only (gallery shows 1 template, 3 variants, 9 palettes).
- Post Phase 7.5, gallery expands to all 8 service templates.
- Persisted as `templateId` + `variantId` + `paletteId` on Project.

**Backend audit:**
- `/api/service/strategy` + `/api/service/generate-copy` rename to `/api/audience/service/*` (clean URL hierarchy).
- Prompt service receives `audienceType` + persona only. **Does not receive `templateId`** — that's the firewall guaranteeing parallel copy/template.
- `Project.content` JSON shape: audit `saveDraft`/`loadDraft` round-trip new fields.

**Existing pilot data:**
- Pilot dev/test projects: backfill `audienceType='service'`, `templateId='hearth'`, `variantId='classic'` (variants ship later via Phase 11), `paletteId=<current>`. Code-side: one-time migration script during refactor merge.

**Phase 7.5 exit:**
1. All Hearth-specific names refactored to template-scoped paths.
2. Renderer dispatches via `(audienceType, templateId)` lookup.
3. Voice extracted to type-level, copy quality unchanged on dogfood re-run.
4. Schema rename + 3 new fields + backfill done.
5. Picker UI exists (even if filtered to 1 template). Renders parallel to copy gen.
6. `npm run build` clean. Existing pilot publishes still render correctly.

### Phase 8 — Section Templates (~3 days)
- Implement 3 remaining awareness templates (cold / referral / relationship).
- Optional section gating logic (Problem, Transformation, IndustriesServed).
- TeamAndFounder placement modes.
- Lives in `src/modules/audience/service/sectionSelection.ts` (renamed from `sectionSelectionService.ts`).

### Phase 9 — Block Library Batches (~4 weeks total) ⏸ ON HOLD 2026-06-07
**Reason:** designer only delivered HTML for the 6 pilot blocks. The 20+ blocks below have no visual reference. Authoring them from spec alone is highest-risk chunk of plan. Un-hold trigger TBD (designer mockups arrive, or real pilot users demand specific block types).

Soft launch (Phase 12) ships with **6 blocks × 9 palettes × 3 variants = 162 distinct visuals** — judged sufficient for early agency cohort.

Order chosen by frequency of need × authoring difficulty (preserved for un-hold reference):

**Batch A (proof, ~1 week):** Outcomes (StatHighlights, OutcomeStories), CaseStudies (FeaturedCaseStudy, CaseStudyGrid), ClientLogos (WarmLogoWall), TeamAndFounder (FounderLetter, TeamGrid).

**Batch B (process & method, ~1 week):** Process (StepTimeline, ProcessCards, AccordionProcess), Approach (MethodologyStatement, PrincipleGrid).

**Batch C (conversion variants, ~1 week):** Hero (TextLedHero, VideoHero), Services (DetailedServiceList, ServiceMatrix), Testimonials (ClientStoryCards, VideoTestimonialGrid), Packages (CustomQuoteCallout, HybridPackagesPlusQuote), CTA (QuoteRequestCTA).

**Batch D (trust & objection, ~1 week):** ObjectionHandle (TrustSignalList), FAQ (AccordionFAQ, TwoColumnFAQ), IndustriesServed (IndustryGrid), Problem (TransformationProblem), Transformation (ClientTransformation).

After each batch: extend `selectUIBlocksService.ts` rules + `serviceElementSchema.ts` + ship.

### Phase 10 — LLM-Driven Block Choice (~2 days)
- Promote `uiblockDecisions` from strategy output from advisory to active.
- Replace hardcoded pilot mapping with LLM hint + deterministic fallback (per spec §3 Step 9).

### Phase 11 — Edit Surface Adjustments (~5 days)
- Theme panel: **template + variant + palette picker** (service projects only). Gallery scoped by `audienceType`.
- Variant picker — pure token rescale (`data-variant` on `:root`). Must NOT affect copy length or voice. Default = template's first variant.
- Template picker — full re-render on switch (copy stays, blocks re-resolve via new `templateId`). Confirm-before-switch UX to prevent accidental clobber.
- Section toolbar: surface color options per template.
- Text toolbar: role-based color swatches; italic emphasis matches template voice.
- Form builder: "Book a call" default template (service-type universal).
- PostHog: `template_changed`, `variant_changed`, super-properties `templateId`, `variantId`.

**Variant token sourcing:** port from each template HTML's switcher CSS as-is. 8 templates × 3 variants = 24 token sets. Mostly font-size + spacing rescales.

### Phase 12 — QA + Soft Launch (~4 days)
- Visual QA against each template's reference HTML.
- All 4 awareness × all goal spot-checks per template.
- **Visual QA matrix (8 service templates):** each template's default variant × all 9 of its palettes (full); other 2 variants × default palette (spot). Total: 8 × (9 + 2) = 88 spot checks. Full 27-per-template cartesian deferred unless breakage observed.
- Bundle-size check; code-split per-template if material (8 templates × 6 blocks × 2 renderers shipping to all users is a concern).
- PostHog event property `audienceType`, `templateId`, `variantId`.
- Feature flag rollout: internal → beta cohort → public.

### Phase 13 — E-commerce Wave (~TBD)
**Deferred to dedicated wave after service GTM.** Stockroom template + ecommerce `audienceType` + product-grid block (new schema with price / SKU / image / "add to bag"). Onboarding question flow for ecom audience. Not blocking service launch.

### Phase 14 — Product Redesign (~TBD)
**Deferred, user-driven sequencing.** Meridian + additional product templates. Migrates current 48 UIBlocks to template-scoped architecture. Highest-revenue surface so risk profile justifies delay until service flow proves the model.

---

## Cross-Cutting Notes

- **Frozen surface:** existing v3 product flow, `src/modules/UIBlocks/` (48 product blocks), `useOnboardingStore`, all `/api/saveDraft`, `/api/loadDraft`, `/api/publish`. Touch only at the renderer branch point.
- **Renderer branch key:** `project.projectType`. Do not infer from `paletteId` (spec Q12).
- **Slug pool:** shared `/p/[slug]` unless naming collision becomes real (spec Q13).
- **Switching projectType post-Step 2:** hard-lock with restart warning (simpler than partial-data salvage; spec Q2).
- **Authoring contract for all service blocks:** `data-element-key` + `data-section-id` conventions identical to product blocks. This is the only invariant that keeps shared edit tooling working.
- **Path reconciliation:** `/api/v3/strategy` and `/api/v3/generate-copy` already exist (spec was correct). `/api/service/*` namespace is clean to add. Onboarding routes: spec's per-project gateway dropped in favor of user-level persona — see Persona model below.
- **Persona model (replaces per-project gateway):** `User.persona` captured once at signup (or one-time prompt for existing users). `/api/start` reads persona → derives `projectType` automatically. Anonymous `/api/start` defaults to `product`. Persona edit lives in account settings. Persona is more granular than `projectType` and seeds `serviceType` downstream, so keep both fields. **Per-project override deferred post-launch** — cross-pivot users (e.g. agency owner spinning up a SaaS) handled by manual DB row edit during pilot dogfooding; build the "Create different kind of page" escape hatch only if real users hit the case post-launch.
- **Image picker keyword override:** confirm `/api/images/search` is per-project (reads project's keyword set), not per-call.
- **Pilot UX ≠ shipped UX flag:** pilot users see product theme panel locked to terracotta (palette picker deferred to Phase 11). Acceptable for pilot dogfooding but note explicitly when soliciting feedback — palette/surface UX feedback should be solicited only post-Phase 11. Optional: Q7 — move minimum palette-only theme panel into Phase 5 to close gap.
- **Bundle size:** ~64 service block files ship to product users too in pilot. Acknowledged; defer code-split to post-launch.

---

## Estimated Timeline

Sum of phase budgets in working days:
- Phases 0–6: 30d ≈ 6 weeks. ✅ DONE 2026-05-07.
- Phase 7: 2d ✅ DONE 2026-06-07 (commit `3e47ca6`).
- **Post-break revision (2026-06-07): 8 templates landed → multi-template refactor needed; Phase 9 on hold; ecom + product deferred.**
  - Phase 7.5: 5d 🆕 multi-template + voice + rename refactor
  - Phase 8: 3d (service section rules expansion)
  - ~~Phase 9: 20d~~ ⏸ on hold
  - Phase 10: 2d (skip — section rules deterministic per type; may collapse into Phase 8)
  - Phase 11: 5d (template + variant + palette picker, was 4.5d)
  - Phase 12: 4d (QA × 8 templates, was 3d)
  - Phase 13: TBD (e-commerce wave, deferred)
  - Phase 14: TBD (product redesign / Meridian, deferred)
- **Remaining to soft launch (8 service templates) ≈ 17–19 working days ≈ 3.5–4 working weeks.**

---

## Resolved (locked pre-Phase-0 kickoff)

1. **Persona list** = 8 options (SaaS founder, indie maker, agency, consultant, coach, freelancer, local service, productized service). Start here; revisit post-launch.
2. **Existing-user persona prompt** = blocking modal on next dashboard load.
3. **Anonymous `/api/start`** = default `projectType='product'`. On later signup, re-derive from new persona; offer "convert this project" prompt if mismatch.
4. **Credits** = reuse existing `UsageEvent.eventType` strings + `UserUsage.fullPageGens` counter. No `service_*` namespace.
5. **Editor layout-swap UIs** for service in pilot = **hide**. Parallel registry entries deferred to post-pilot.
6. **Pilot persona** = agency-only. Other service personas waitlisted with "coming soon" + email capture.
7. **Theme panel move Phase 11 → Phase 5** = no. Pilot palette is terracotta-locked at the data layer; a 1-option picker is theater. Stays Phase 11.
8. **TieredPackages in pilot** = keep. Price hallucination mitigated by spec's `ai_generated_needs_review` flag — user reviews/edits prices post-gen.
9. **Italic-`<em>` reliability** = ship pilot with deterministic post-process fallback (already in Phase 2). Tune prompt in Phase 6 based on observed emit rate. Don't hold pilot.
10. **Phase 6 signoff** = solo (PO).
11. **Founder photo upload during onboarding** = punt to editor.
12. **Feature flag** = none. Pilot ships live to all (no live users yet, no gating risk).
13. **Per-project gateway fallback for cross-pivot projects** = defer post-launch. Pilot handles via manual DB edit.

## Resolved (post-pilot, 2026-06-07)

14. **Phase 9 block library** = on hold. Designer only mocked the 6 pilot blocks; authoring 20+ from spec alone too risky. Soft launch with 6 blocks × N templates × 27 (palette × variant) per template = 1296 visuals across 8 service templates. Sufficient for GTM. Un-hold trigger: designer mockups arrive OR real users repeatedly request specific block types.
15. **Variant switcher** = in scope per template, lands in Phase 11 next to template + palette picker. Pure visual rescale (`data-variant` on `:root`), zero copy-prompt impact. Default = template's first variant.
16. **Phase 6 backlog items** (credibility hallucination, restaurant-marketing lede outlier) = defer to Phase 8 or later. Not blocking.
17. **3-tier model: audienceType → templateId → variantId+paletteId.** 9 templates total (Hearth shipped, 7 more service queued, Stockroom for ecom wave, Meridian + product redesign deferred).
18. **Voice = type-level, not template-level.** `voiceHearth.ts` → `voiceService.ts` during 7.5 refactor. Italic-`<em>` rules shared across all 8 service templates. Enables copy + template parallel generation.
19. **Stockroom (e-commerce)** = dedicated wave (Phase 13), not bundled with service launch. Needs new product-grid block schema (price/SKU/cart), different from service blocks.
20. **Type-gate UI** = persona-step refinement, not new global step. Persona derives `audienceType` automatically.
21. **Existing data migration** = no concern. Nothing in production. Test/dev projects backfilled in 7.5 migration script.
22. **Rename `projectType` → `audienceType`.** Disambiguates from `templateId`. Zero migration risk (no prod data). Touch Prisma + all consumers once during 7.5.

## Unresolved Questions

- Stockroom (ecom Phase 13) — single template at launch (Stockroom only) or build 2–3 ecom templates in parallel to match service-wave pattern?
- Phase 8 awareness templates (cold / referral / relationship) — no designer mockups. Build deterministic-rules from spec or pause like Phase 9?
- Bundle size: 8 templates × 6 blocks × 2 renderers = 96 service block files ship to ALL users incl. product. Code-split per-`templateId` becomes important earlier than expected. Phase 11 or push to Phase 12?
- `User.persona` (8 values) currently lacks any ecom option. Add `dtc-founder` / `online-retailer` etc. now in 7.5, or wait for Phase 13?
- Template gallery UX: full preview thumbnails (need 24 mockup screenshots) or descriptive cards (faster to ship, less wow)?
