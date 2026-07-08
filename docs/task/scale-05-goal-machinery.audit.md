# scale-05 goal machinery — implementation audit

## Phase 1 — Goal param plumbing (schema + capture + writeback)

**Files changed**
- `src/lib/schemas/brief.schema.ts` — modified
- `src/modules/brief/bridge.ts` — modified
- `src/components/onboarding/shared/GoalParamFields.tsx` — NEW
- `src/hooks/useProductGenerationStore.ts` — modified
- `src/hooks/useServiceGenerationStore.ts` — modified
- `src/app/onboarding/product/[token]/components/steps/GoalStep.tsx` — modified
- `src/app/onboarding/service/[token]/components/steps/GoalStep.tsx` — modified
- `src/app/onboarding/product/[token]/components/steps/GeneratingStep.tsx` — modified
- `src/app/onboarding/service/[token]/components/steps/GeneratingStep.tsx` — modified
- `src/modules/brief/bridge.test.ts` — modified
- `src/modules/goals/goalToDestination.test.ts` — modified

### Per-file
- **brief.schema.ts** — `goal.param` added: `z.object({phone,email,url,links,date,message}).partial().optional()`. Additive/optional; existing Briefs + frozen fixtures parse unchanged (asserted in bridge.test).
- **bridge.ts** — `SERVICE_GOAL_TO_INTENT` + `LANDING_GOAL_TO_INTENT` (TOTAL `Record`s, compiler-enforced), `GoalParamInput` type, `legacyGoalToBriefGoal(legacyGoal, param?)`. Intent-specific branches FIRST: `subscribe-newsletter` → forced `mechanism='M1'`, no param/destination (never derived from `goalIntentMeta`); `download-app` → `param.links` persisted verbatim (trimmed, empties dropped), `destination = links[0]`; `rsvp` → url+date, url present → M3 else M1. Then mechanism-generic fallback: phone/email → M2 (`wa.me/<digits>` / `mailto:`) when intent allows M2; url → M3 when intent allows M3; M4 → links; M1/M5 → none. `vocabulary.ts` untouched.
- **GoalParamFields.tsx** — NEW shared client component, controlled (value/onChange). Branch order mirrors writeback; `subscribe-newsletter` returns null before any fallback. download-app = two labeled store-URL fields (fixed 2-slot links array, 0=Play 1=App Store). Exports `intentHasParamFields` + `intentParamSatisfied` (download-app requires ≥1 link).
- **stores (both)** — `goalParam: GoalParamInput` (init `{}`) + `setGoalParam`.
- **product GoalStep** — param-less goals keep original auto-advance; param goals pause, show GoalParamFields + Continue (disabled until satisfied) + "Skip for now"; param cleared on goal switch.
- **service GoalStep** — GoalParamFields rendered above Continue when the mapped intent has fields (only book-call today: optional scheduling link); Continue gated on `intentParamSatisfied` (always true for the 3 offered goals).
- **service GeneratingStep** — saveDraft body gains `brief: { goal: legacyGoalToBriefGoal(goal, goalParam) }`; `goalParam` added to useCallback deps.
- **product GeneratingStep** — `briefPatch` computed once per run (`landingGoal ? {brief:{goal:...}} : {}`), spread into ALL THREE saveDraft bodies (saveFC multi-page, techpremium deterministic, single-page runCopyAndSave). Resumed runs (store reset → landingGoal null) send nothing, so saveDraft's shallow brief merge leaves the persisted goal untouched.
- **bridge.test.ts** — reverse-map totality (iterates both legacy enums), renamed-intent mappings, subscribe-newsletter override (incl. stray-param ignore), download-app two-links verbatim + destination=links[0], demo+Calendly M3 upgrade, wa.me/mailto composition, pure-M1 cases, BriefSchema acceptance, end-to-end phase-6 shape assertion (`goalParam` → `brief.goal.param.links`), newsletter → `mechanism==='M1'`.
- **goalToDestination.test.ts** — extended (not replaced): composed round-trip cases — wa.me→whatsapp, mailto→email, Calendly→external, download-app→external links[0] (param.links intact), newsletter override→M1 `#form-section` anchor, M4 social shape still resolves.

### Deviations / judgment calls (in-scope)
1. **M1-primary intents that allow M3 (request-demo, book-call, enroll) get an OPTIONAL destination-URL field**, and writeback upgrades M1→M3 when the url is present. The plan's generic fallback keyed on `mechanisms[0]` alone would render nothing for these, contradicting the phase's own verification ("demo goal + Calendly URL → destination + param persisted"). Conservative resolution: optional field, blank → M1 form fallback (previous behavior).
2. **`download-portfolio` (legacy ServiceGoal, not offered in UI) → `lead-magnet` intent** — plan didn't specify; closest M1 gated-resource fit.
3. **rsvp mechanism**: url present → M3 + destination, else M1 (mechanisms[0]); date stored only (plan open question #6). No legacy enum reaches rsvp today.
4. **download-app links stored as fixed 2-slot array in the store** (index 0=Play, 1=App Store) so the two inputs stay stable while typing; writeback trims + drops empties, so the PERSISTED `param.links` carries only real URLs ("verbatim" = the entered URL strings).
5. **phone param composes `wa.me/<digits>`** (not `tel:`) per design call #1's example; `tel:` remains resolver-only. M2 UI branch is dormant today (no M2-primary intent reachable from legacy enums) but implemented per plan for phase-8 reuse.

### Deferred (later phases, per plan)
- WhatsApp `param.message` materialization (phase 5), form auto-seed (phase 4), badge/strip injection (phases 6–7), intent-first GoalStep (phase 8). Regeneration paths untouched.

### Verification
- `npx tsc --noEmit` → clean (no output).
- `npm run test:run -- bridge goalToDestination brief` → `Test Files 4 passed (4) · Tests 80 passed (80)`.
- `npm run test:run -- generation` (fixture-safety extra) → `Test Files 5 passed (5) · Tests 34 passed (34)`.
- Manual wizard checks (demo+Calendly / download two links / newsletter) left for the orchestrator's phase gate.

### Open risks
- Product GoalStep UX changed for param goals (no auto-advance until Continue/Skip) — needs a quick manual look.
- `briefPatch` is sent on every multi-page saveFC call (idempotent shallow merge; harmless, slightly chatty).

---

## Phase 2 — `cta_subtext` element (schema + hero blocks, dual-renderer)

**Files changed**
- `src/modules/audience/product/elementSchema.ts` — modified (TerminalHero hero: add `cta_subtext`)
- `src/modules/audience/service/elementSchema.ts` — modified (PetalFramedHero hero: add `cta_subtext`)
- `src/modules/templates/meridian/blocks/Hero/TerminalHero.tsx` — modified
- `src/modules/templates/meridian/blocks/Hero/TerminalHero.published.tsx` — modified
- `src/modules/templates/techpremium/blocks/Hero/TechPremiumHero.tsx` — modified
- `src/modules/templates/techpremium/blocks/Hero/TechPremiumHero.published.tsx` — modified
- `src/modules/templates/hearth/blocks/Hero/PetalFramedHero.tsx` — modified
- `src/modules/templates/hearth/blocks/Hero/PetalFramedHero.published.tsx` — modified
- `src/modules/templates/lex/blocks/Hero/ProspectusHero.tsx` — modified
- `src/modules/templates/lex/blocks/Hero/ProspectusHero.published.tsx` — modified

**What changed per file**
- Schema: added `cta_subtext { type:'string', requirement:'optional', fillMode:'ai_generated', default:'' }` to the hero entry in each audience schema. Only ONE hero schema entry exists per audience (product=`TerminalHero`, service=`PetalFramedHero`); techpremium reuses `meridianElementSchema` and lex reuses the service schema (confirmed via `techpremium/registration.test.ts` importing `meridianElementSchema` and the shared service schema), so both templates inherit the new field with no extra schema entry. Vestria hero schema entries intentionally untouched (bespoke, out of scope).
- Each hero pair: added `cta_subtext` to the content/props interface, rendered a small muted line directly UNDER the primary CTA (after the actions row), plus one CSS rule (inline `STYLES` in each block — these templates ship per-block styles as inline `<style>` tags, NOT via `public/published.css`).

**Inline-edit pattern mirrored per template**
- meridian: `MeridianEditable as="p"` under `.mrd-hero__actions`, class `mrd-hero__cta-subtext` — mirrors the existing `caption`/`secondary_cta_text` optional pattern.
- techpremium: `TechPremiumEditable as="p"` after `.tp-hero__actions` (before `audience_tag`), class `tp-hero__cta-subtext` — mirrors the existing `audience_tag` optional-`<p>` pattern.
- hearth: `HearthEditable as="p"` after `.hearth-hero__actions` inside `.hearth-hero__copy`, class `hearth-hero__cta-subtext` — mirrors `meta`/`secondary_cta_text`.
- lex: `LexEditable as="p"` inside `.lex-hero__aside` after `.lex-hero__actions`, class `lex-hero__cta-subtext` — mirrors the aside's `lede`/`secondary_cta_text` pattern.

**Identical guard + markup confirmation**
- Both twins in every template guard on the SAME non-empty content check: edit twin `blockContent.cta_subtext`, published twin `props.cta_subtext`. The edit twin adds the standard `|| mode === 'edit'` editor escape that EVERY optional element in these heroes already carries (secondary_cta_text, caption, audience_tag, meta) — this is the established byte-parallel convention (published twin has no `mode`), not a divergence. Rendered markup is identical: same wrapper tag (`<p>`), same className, same position relative to the primary CTA in both `.tsx` and `.published.tsx`. Subtext rendered as plain text in the published twin (matches the caption/meta-line plain-text convention; only headline/lede use `dangerouslySetInnerHTML`).

**Deviations**
- None from the plan. In-scope call: used `<p>` for the subtext line across all four (block-level muted line under the CTA) and matched each template's own muted-text tokens (mono/`--bone-3` for meridian, mono/`--ink-3` for techpremium, italic display/`--ink-3`/`--ink-2` for hearth/lex).

**Verification**
- `npx tsc --noEmit` — clean (no output).
- `npm run test:run -- renderParity sanitizeContentForPublish` — 2 files, 33 tests passed.
- `npm run build` — completed successfully (full pipeline: build:published-css → build:assets → next build; route table emitted, no errors).

**Open risks**
- `cta_subtext` has no copy population yet — that lands in Phase 3. Until then it renders nothing on existing/new projects (empty default), so no visible change without manual entry.
- Bespoke templates (surge/lumen/granth/vestria) intentionally skipped per plan — their heroes have no subtext slot.

---

## Phase 3 — Intent → copy guidance (one table, both engines, strategy + copy)

**Files changed**
- `src/modules/goals/copyGuidance.ts` — NEW
- `src/modules/goals/copyGuidance.test.ts` — NEW
- `src/modules/audience/service/copyPrompt.ts` — modified
- `src/modules/audience/product/copyPrompt.ts` — modified
- `src/modules/prompt/buildStrategyPrompt.ts` — modified
- `src/modules/audience/service/strategy/promptsService.ts` — modified
- `src/modules/audience/product/promptBranch.test.ts` — modified (frozen baseline regenerated)

**What changed**
- `copyGuidance.ts`: plain module (no 'use client', no template imports). `goalCopyGuidance: Record<GoalIntent, { cta; subtext?; emphasis }>` — total over all 18 frozen intents (tsc-enforced via Record). Place intents (`order-via-platform`, `pay-via-link`) carry cta + emphasis only, no subtext (plain-link guidance). `getGuidanceForIntent(intent)` formats the prompt block (label line + conditional cta_subtext instruction with the hard "do NOT invent terms" rule + emphasis line). `getEmphasisForIntent(intent)` returns just the emphasis (used by strategy prompts).
- `service/copyPrompt.ts`: `getGoalCtaGuidance(goal: ServiceGoal)` re-pointed — body now `getGuidanceForIntent(SERVICE_GOAL_TO_INTENT[goal] ?? SERVICE_GOAL_TO_INTENT['book-call'])`. Signature and book-call fallback UNCHANGED; injection site (:151) unchanged — it now emits the label+subtext+emphasis block because the function returns it. Hero example JSON gained `cta_subtext`; added an explicit "OPTIONAL / OMIT unless the offer supports it / do NOT invent terms" line in OUTPUT FORMAT.
- `product/copyPrompt.ts`: `getGoalCtaGuidance(goal: LandingGoal)` re-pointed via `LANDING_GOAL_TO_INTENT` with `.signup` fallback (same intent the old `?? map.signup` fallback resolved to → `signup-free`). Signature/fallback preserved. Hero example JSON gained `cta_subtext: "No credit card required"`; added the same OMIT/don't-invent instruction after the accent note.
- `buildStrategyPrompt.ts` (legacy product strategy phase): `buildBusinessContext` appends `Goal emphasis: <emphasis>` when the free-text `landingPageGoals` resolves to an intent. Added a best-effort `resolveLandingGoalIntent()` mapping taxonomy `landingGoalTypes` ids AND display labels → GoalIntent; returns null (no emphasis line appended) when unmappable — conservative, never guesses an intent the founder didn't pick.
- `promptsService.ts` (service strategy phase): `## Landing Goal` block gained an `**Emphasis:**` line via `getEmphasisForIntent(SERVICE_GOAL_TO_INTENT[goal] ?? ...['book-call'])`.

**How `getGoalCtaGuidance` was re-pointed (signatures preserved)**
- Both functions keep their exact signature (`(goal: ServiceGoal): string` / `(goal: LandingGoal): string`) and their original fallback target (book-call / signup). Only the body changed: legacy Goal → GoalIntent (reverse map) → `getGuidanceForIntent`. No caller or call site was modified. Legacy enums (`serviceGoals`/`landingGoals`) untouched.

**cta_subtext "don't invent terms" instruction**
- The formatter emits: for subtext-bearing intents, `cta_subtext (optional …): <framing>. OMIT this element unless the offer EXPLICITLY states such terms — do NOT invent terms (no fabricated "no credit card", trial length, guarantees, or shipping claims).` For subtext-less intents: `cta_subtext: leave empty for this goal unless the offer explicitly states a supporting term — do NOT invent terms.` Both copy engines' OUTPUT FORMAT sections also carry a standalone "OMIT unless the offer explicitly supports it; do NOT invent terms" line.

**Deviations**
- `promptBranch.test.ts` frozen `COPY_SAAS_BASELINE` was REGENERATED (not just extended). The plan said "extend ONLY if guidance-line assertions already exist" — the SaaS case is a byte-exact whole-prompt `.toBe(baseline)` assertion, which inherently asserts the guidance line, so the baseline had to be updated to the new output. Regeneration was done by dumping the actual `buildProductCopyPrompt(saasCopyInput)` output and pasting it verbatim. Note: the regenerated baseline also absorbed a `cta_subtext [optional, null to exclude]` line in the hero SECTION SPEC that comes from Phase 2's `meridianElementSchema` addition (spread into `layoutElementSchema['TerminalHero']`) — Phase 2 did not update this frozen baseline, so the test was already red on this branch before Phase 3; the regeneration also fixes that. `STRATEGY_SAAS_BASELINE` is unaffected (product strategy builder `promptsProduct.ts` was not touched).
- `buildStrategyPrompt` intent resolution is best-effort against a fuzzy free-text field; `watch-video`/"Watch Demo" is intentionally left unmapped (no strong conversion intent), so no emphasis line is appended for it. Conservative choice logged here.

**Verification**
- `npx tsc --noEmit` — clean (no output).
- `npx vitest run copyGuidance copyPrompt promptBranch generation` — 7 files, 51 tests passed (includes generation-contract MOCK fixture, still green — `cta_subtext` is optional in output).

**Open risks**
- No block/renderer changes this phase (prompt/copy plumbing only), so no dual-renderer concern. `copyGuidance.ts` is a plain module — safe for the server-only strategy/copy builders.
- The legacy `buildStrategyPrompt` path stores `landingPageGoals` as either a taxonomy id or display label; the resolver covers both known forms, but a custom/edited free-text goal outside the taxonomy will simply get no emphasis line (safe, not wrong).

---

## Phase 4 — M1: form auto-seed + place + wire at generation

**Files changed**
- `src/modules/audience/service/formTemplates.ts` — modified (re-keyed templates by `GoalIntent`; added all M1-intent templates + subscribe-newsletter; new `getFormTemplateForIntent`; legacy `getServiceFormTemplate`/`SERVICE_FORM_TEMPLATE_GOALS` retained)
- `src/modules/goals/seedGoalForm.ts` — NEW (plain module, M1 form auto-seed)
- `src/app/onboarding/product/[token]/components/steps/GeneratingStep.tsx` — modified (call `seedGoalForm` in `buildFinalContent`)
- `src/app/onboarding/service/[token]/components/steps/GeneratingStep.tsx` — modified (same)
- `src/modules/goals/seedGoalForm.test.ts` — NEW
- `src/modules/audience/service/formTemplates.test.ts` — NEW

**What changed, per file**

- **formTemplates.ts** — `TEMPLATES_BY_GOAL` (ServiceGoal-keyed, 3 entries) replaced by `TEMPLATES_BY_INTENT` (`GoalIntent`-keyed, 11 entries): enquiry, request-quote, book-call, request-demo, book-me, enroll, apply, lead-magnet, waitlist, rsvp, subscribe-newsletter. `book-me` carries `event_date` (text — MVP has no `date` type) + `event_type` (select); `rsvp` carries an `attendees` select; `subscribe-newsletter` is email(required)+name(optional). New `getFormTemplateForIntent(intent)` (book-call fallback). Legacy `getServiceFormTemplate(goal: ServiceGoal)` is now a thin wrapper mapping `SERVICE_GOAL_TO_INTENT` (bridge.ts) → `getFormTemplateForIntent`; `SERVICE_FORM_TEMPLATE_GOALS` unchanged. All field `type`s ⊆ `MVPFormFieldType`.
- **seedGoalForm.ts** — `seedGoalForm(finalContent, goal)`. Seeds only when `goal.mechanism === 'M1' || goal.intent === 'subscribe-newsletter'`, and only when `finalContent.forms` is empty (idempotent). Instantiates the intent template into `finalContent.forms[form-${Date.now()}]` (matching `formActions.createForm`: id/createdAt/updatedAt, cloned fields, + a `dashboard` integration mirroring the vestria seed). Wires the primary CTA section (found by type prefix `cta-` → `contact-` → `hero-`).
- **GeneratingStep.tsx (both)** — `buildFinalContent` now assembles `finalContent` into a local, computes `briefGoal = legacyGoalToBriefGoal(landingGoal|goal, goalParam)` (Phase-1 helper) and calls `seedGoalForm(finalContent, briefGoal)` before returning. Vestria's own contact-form seed makes forms non-empty first, so the M1 seed no-ops there.

**Exact placement-record + buttonConfig shape matched (manual path parity)**

Studied `ButtonConfigurationModal.tsx` `handleSave` (lines 300–391) — the authoritative manual writer. The seed reproduces its form-CTA write byte-for-byte:
- `elements.cta_embed = 'form:' + formId` (ButtonConfigurationModal.tsx:358).
- `elementMetadata.cta_text = { buttonConfig, cta }` (ButtonConfigurationModal.tsx:372–377), with
  - `buttonConfig = { type:'form', ctaType:'primary', formId, behavior:'scrollTo' }` (:305–324 form branch; icon/iconConfig omitted — undefined on a fresh wire).
  - `cta = { role:'primary', dest:{ kind:'section', anchor:'form-section' }, formId }` (`buildCtaButton`, :86–90 form branch).
- Section-level `cta` ctaConfig `{ type:'form', cta_text, url:undefined, formId, behavior:'scrollTo', inputConfig:undefined, label, variant:'primary', size:'medium' }` (:328–335 + :383–390).
- The AI-written `cta_text` label is preserved (not clobbered), matching the modal which keeps `buttonText`.
Readers that consume this shape: `FormPlacementRenderer.tsx:59` (`buttonConfig.type==='form'`+`formId`+`behavior`), `resolveCtaHref.ts:65–69` (form → `#form-section`), `determineFormPlacement`/`formPlacement.ts`. `goalToDestination.ts:76–82` resolves the hero GOAL_REF M1 case to `{ dest: section#form-section, formId: firstForm }` — the seed leaves forms empty until it writes exactly one, so the hero GOAL_REF and the CTA button resolve to the SAME formId + `#form-section`.

**Is the seeded form RENDERED (not just wired)? — HONEST FINDING / OPEN RISK**

The seed writes data that is byte-identical to a manual founder wire via ButtonConfigurationModal, so it renders wherever a manual wire renders. HOWEVER, while studying the render path I found a pre-existing gap OUTSIDE Phase 4's Files-touched (`formPlacement.ts`, `sectionHelpers.ts`, the CTA `.published.tsx` blocks, `LandingPagePublishedRenderer.tsx`):
- Generated section ids are `${type}-${uuid8}` (e.g. `cta-cccc3333`), but `sectionHelpers.getSectionType`/`hasPrimaryCTASection` (sectionHelpers.ts:32–51) match the LITERAL strings `'cta'`/`'hero'`. So `determineFormPlacement` classifies a real cta section as `'other'` with `hasPrimaryCTA=false` → returns `modal`, and `shouldRenderFullForm` (requires `currentSectionId==='cta'`) is false. => `FormPlacementRenderer` does NOT render the full form for real generated ids.
- No DOM node emits `id="form-section"` anywhere in the codebase (grepped), and the published CTA blocks (`ArcCTA.published.tsx`, `BookCallCTA.published.tsx`) render only the `#form-section` anchor link, not the form. So the hero/CTA `#form-section` scroll target currently resolves to nothing in exported HTML.
This means the phase's "rendered, scrolled-to form" goal is NOT fully achieved by the seed alone — it needs changes to the above out-of-scope files (e.g. type-prefix-aware `getSectionType`/`hasPrimaryCTASection`, and a `form-section` render slot in the published path). Per the guardrails I did not edit files outside Phase 4's list; flagging for the orchestrator to schedule (likely a formPlacement/renderer fix in a later phase or Phase 9 acceptance). The seed DATA is correct and manual-path-compatible; the working proof today is: forms exist in `content.forms`, CTA is wired, hero stays GOAL_REF, all resolving to one shared formId + `#form-section`.

**Grep results — getServiceFormTemplate / SERVICE_FORM_TEMPLATE_GOALS callers**
Only `src/components/forms/FormBuilder.tsx` (imports both; uses `getServiceFormTemplate(goal)` at :130 and `SERVICE_FORM_TEMPLATE_GOALS` at :129/:262). No other src/e2e callers. The legacy wrapper keeps this call site compiling + behaving unchanged (verified by tsc + a wrapper test) — no silent field-drop.

**fullPageRegeneration paths** — intentionally untouched. The seed runs ONLY in the two onboarding `GeneratingStep.buildFinalContent` paths; regeneration (`fullPageRegeneration`) is not wired and, given idempotence (skips when forms exist), a later regen over a seeded draft would no-op anyway.

**Deviations**
- Added a `dashboard` integration to the seeded form (templates ship `integrations: []`). Mirrors the proven vestria contact-form seed so submissions surface in the founder dashboard. Conservative, in-scope (seedGoalForm only; templates unchanged for the FormBuilder manual path).
- Target-section fallback order `cta → contact → hero` (plan says "the CTA section"): conservative so the seed never silently drops the form when a page has no `cta` section.

**Verification**
- `npx tsc --noEmit` — clean.
- `npm run test:run -- seedGoalForm formTemplates normalizeCtas formPlacement` — 3 files, 38 tests passed (formPlacement has no test file; normalizeCtas green). New: seedGoalForm.test.ts (M1 seed+wire, hero untouched, subscribe-newsletter email capture, M2–M5 no-op, idempotence, null tolerance, hero fallback), formTemplates.test.ts (template per M1 intent + newsletter, field types ⊆ MVPFormFieldType, legacy wrapper parity).

**Open risks**
- The render gap documented above is the material one (out-of-scope files).
- `form-${Date.now()}` id collision is theoretically possible if two forms seed in the same ms; not a concern here (single seed per generation, guarded by the forms-empty idempotence check).

---

## Phase 5 — Shared-block infrastructure + M1 lead-form shared block

**Files changed**
- `src/modules/generatedLanding/sharedBlocks/registry.ts` (NEW) — edit-twin-only registry.
- `src/modules/generatedLanding/sharedBlocks/registry.published.ts` (NEW) — published-twin-only registry.
- `src/modules/generatedLanding/sharedBlocks/LeadForm/leadFormFields.tsx` (NEW) — plain module: field renderer + self-contained styles + `LeadFormCore` layout.
- `src/modules/generatedLanding/sharedBlocks/LeadForm/LeadForm.tsx` (NEW) — edit twin ('use client').
- `src/modules/generatedLanding/sharedBlocks/LeadForm/LeadForm.published.tsx` (NEW) — published twin (server-safe).
- `src/modules/generatedLanding/componentRegistry.ts` — shared-block shim before template dispatch.
- `src/modules/generatedLanding/componentRegistry.published.ts` — parallel shim.
- `src/modules/goals/seedGoalForm.ts` — extended: injects a `leadForm-<uuid>` section.
- `src/modules/sections/sectionList.ts` — `leadForm` SectionMeta entry.
- `src/modules/audience/product/elementSchema.ts` — `SharedLeadForm` layout schema.
- `src/modules/audience/service/elementSchema.ts` — `SharedLeadForm` layout schema (mirror).
- `src/modules/goals/seedGoalForm.test.ts` — extended: section-injection + idempotence tests.
- `src/modules/generatedLanding/sharedBlocks/__tests__/leadForm.parity.test.tsx` (NEW).

**Per-file notes**
- Split registries: `registry.ts` imports ONLY `LeadForm` (edit); `registry.published.ts` imports ONLY `LeadForm.published`. Neither imports the other's twin. `resolveSharedBlock`/`resolveSharedBlockPublished` key on the LOWERCASED type (`leadform`). Both componentRegistry `getComponent`s call the resolver BEFORE the `usesTemplateModule` template dispatch, so a shared block resolves on every template.
- `leadFormFields.tsx` is a PLAIN module (no 'use client') holding the field renderer, a `LEAD_FORM_STYLES` CSS string (injected via `<style>` like Vestria's `CONTACT_STYLES` — needs no `public/published.css` change and works in any template), and `LeadFormCore` (single-source layout). Both twins render through `LeadFormCore`, so markup/classes are byte-parallel. Styling is template-agnostic: neutral fallbacks + the cross-template common vars `--accent` / `--accent-ink` / `--line` / `--font-*` (verified present in meridian/hearth/lex palettes).
- data-lessgo-form attr set matched (cite `formHandler.js` lines 160-163 `form.dataset.*`): `data-form-id` -> formId, `data-page-id` -> pageId, `data-owner-id` -> ownerId, `data-success-message` -> successMessage. Published twin emits exactly these (identical to `VestriaLeadForm.published.tsx`). form.v1.js embeds automatically (htmlGenerator gates on `content.forms` non-empty — the M1 seed guarantees that) and submits to `/api/forms/submit`.
- Edit twin reads the store (plan-review finding #1): the edit renderer spreads only the section's own `data` (no `content` prop), so `LeadForm.tsx` reads `useEditStoreLegacy().content?.[sectionId]?.elements` for `form_id`/`form_headline` and `...content?.forms?.[formId]` for the fields — exactly like `VestriaLeadForm.tsx`. It does NOT read a `content` prop. Heading editable via a `contentEditable` `<h2>` -> `updateElementContent(sectionId, 'form_headline', ...)` on blur.
- #form-section anchor + scroll-margin (finding #4): `LeadFormCore` emits the inner `<div id="form-section" style={{scrollMarginTop:80}}>`; the outer type-based wrapper (`id="leadform"`) is distinct — no id collision. Hero GOAL_REF -> `goalToDestination` M1 -> `#form-section` and the seed's CTA `buttonConfig.behavior='scrollTo'` both target this node.
- Seed rewire (finding #2): `seedGoalForm` now injects a `leadForm-<uuid>` section into `layout.sections` (after hero), `layout.sectionLayouts` (`SharedLeadForm`), and `content` (elements `{form_id, form_headline}` defaulted from the template name). Idempotent: the pre-existing forms-empty guard means a re-seed no-ops the whole thing; an internal `startsWith('leadForm-')` guard also prevents a dup. Kept the CTA `buttonConfig` wiring.
- Old Phase-4 placement record — CONFIRMED there is none to drop. `FormPlacementRenderer` reads `element.metadata?.buttonConfig` (i.e. `section.elements[key].metadata`), but the Phase-4 seed writes `buttonConfig` into `section.elementMetadata.cta_text.buttonConfig` — a different shape. So `FormPlacementRenderer` never picked up the seed and rendered NOTHING (this is precisely the pre-existing "form doesn't render on core templates" bug). Therefore the new `leadForm` section is the SOLE renderer of the form -> no double-render in the editor. (Contrary to the Phase-4 plan text, the as-built Phase-4 code wrote no `formPlacement` record at all.)
- Schema (finding #3): `SharedLeadForm` added to BOTH `meridianElementSchema` and `serviceElementSchema`, which are spread into the composed `layoutElementSchema` — so `getSchemaDefaults('SharedLeadForm')` (edit) and the publish sanitize gate both resolve it without relying on unknown-layout fall-through. No direct edit to `layoutElementSchema.ts` (it composes from the audience schemas; that file is not in the Files-touched list).

**Section-type-switch grep (step 0) results**
Enumerated every reader that branches on section type: `BackgroundPreview` label/bg (default cases), `SectionTypeSelector`/`EnhancedAddSection`/`SectionCRUD` (add-section UI — never used for injected sections), `getSurfaceForSection` (defaults to `cream`/template default for unknown types — verified), `collectionHelpers`/`pageActions`/`pageHelpers` (match specific types only; ignore `leadForm`), `useReviewState` (header/footer only). None break on `leadForm`; all have safe defaults. No edits required beyond `sectionList` + `elementSchema` entries. This grep also pre-scouts `storebadges`/`followstrip` for Phases 7-8 (same conclusion).

**Verification**
- `npx tsc --noEmit` — clean.
- `npm run test:run -- seedGoalForm sharedBlocks leadForm componentRegistry dispatch normalizeCtas formPlacement` — 4 files, 46 tests passed. Includes: shared-block resolution through BOTH split registries via a real `leadForm-abcd1234` id (lowercase key); dual-renderer parity; published `<form>` emits the 5 data-lessgo-form attrs + all seeded fields + `#form-section`; seed injects the section after hero + idempotence + non-M1 no-op; template-dispatch regression green.
- `npm run build` — succeeded (published CSS/markup + registry dispatch change). The edit twin being transitively importable into the published graph (via `sectionAnchors` -> `componentRegistry.ts` -> `registry.ts` -> `LeadForm.tsx`) did NOT break the static export — it is imported but never rendered on the published path (which dispatches to `LeadForm.published` via the split published registry).

**Published form RENDERS + submits — how verified**
Test assertion on emitted static markup (`renderToStaticMarkup(<LeadFormPublished ...>)`): the `<form data-lessgo-form data-form-id="form-123" data-page-id="page-1" data-owner-id="owner-1" data-success-message="...">` with all seeded `name=field.id` inputs + a `type="submit"` button, wrapped in `id="form-section"`. form.v1.js binds every `[data-lessgo-form]` on load and POSTs the FormData (keyed by `name`) to `/api/forms/submit` with `{formId, publishedPageId: pageId, userId: ownerId}` -> `FormSubmission` + lead email. Live end-to-end submit on a published core-template page is the manual item for the Phase 5 gate.

**Deviations**
- leadForm section placement = after hero (open question #7). Chose after-hero for consistency with the Phase 7/8 injectors and a short scroll; a lead form immediately below the hero may read oddly vs a bottom/CTA position — flagged for the gate to confirm.
- Styling is neutral + accent-var-driven rather than full per-template token adoption (no universal foreground/surface var exists across templates). Guarantees the form renders correctly everywhere; richer per-template theming is a possible follow-up.

**Open risks / gate items**
- Confirm leadForm placement (after hero vs bottom) at the gate.
- Manual acceptance not yet run: live published-page submit on meridian AND hearth -> `FormSubmission` row + lead email (RESEND env). Recommend running the consultant book-call wizard on both before merge.
- Neutral styling: eyeball editor<->published parity on meridian/hearth/lex at the gate; the accent button should pick up each palette's `--accent`.

---

## Phase 6 — M2: deterministic WhatsApp prefill

**Files changed**
- `src/modules/goals/whatsappPrefill.ts` — NEW (pure prefill builder)
- `src/modules/brief/bridge.ts` — modified (facts arg + `composeWhatsappDestination` export + M2 writeback materialization)
- `src/app/onboarding/product/[token]/components/steps/GeneratingStep.tsx` — modified (pass facts)
- `src/app/onboarding/service/[token]/components/steps/GeneratingStep.tsx` — modified (pass facts)
- `src/modules/goals/goalToDestination.ts` — modified (M2 param.message enrichment)
- `src/app/edit/[token]/components/modals/LandingGoalsModal.tsx` — modified (WhatsApp message textarea)
- `src/modules/goals/whatsappPrefill.test.ts` — NEW
- `src/modules/goals/goalToDestination.test.ts` — modified (extend: attachment + facts cases; updated the enquiry+phone case for new msg behavior)
- `src/utils/resolveCtaHref.test.ts` — modified (extend: `resolveDestination` whatsapp prefill encode)

**What changed per file**
- `whatsappPrefill.ts`: `buildWhatsappPrefill(facts) -> string`. Pure, no imports, no AI/network. Reads `facts.businessName` / `facts.offer` (the exact keys `classify.ts` writes onto `EntryFacts` — verified: `EntryFacts.businessName`, `EntryFacts.offer`).
- `bridge.ts`: `legacyGoalToBriefGoal` gains optional 3rd arg `facts?: WhatsappFacts`. Only the M2 phone branch uses it: sets `param.message = buildWhatsappPrefill(facts)` and `destination = composeWhatsappDestination(phone, message)`. Added exported `composeWhatsappDestination(phone, message)` (digits-only number via existing `waDigits`, `?text=` = `encodeURIComponent(message)`) — shared with the modal so both compose identically. Non-M2 branches untouched.
- Both GeneratingSteps: pass `{ businessName, offer }` (product: `productName` as businessName) into every `legacyGoalToBriefGoal(...)` call.
- `goalToDestination.ts`: M2 case — after shim parse, if `dest.kind==='whatsapp' && dest.msg===undefined && goal.param?.message`, attach the message. Additive; never overrides an inline `?text=`.
- `LandingGoalsModal.tsx`: reads `goal`/`setGoal` from `useEditStoreLegacy()` (full-state hook, no selector). Shows a "Prefilled WhatsApp message" textarea only when `goal.mechanism==='M2'` and the goal is WhatsApp (param.phone OR wa.me destination). On change: `setGoal({...goal, destination: composeWhatsappDestination(number, message), param: {...param, message}})`. `setGoal` marks the store dirty -> standard auto-save round-trips `param.message` + recomposed `destination` into `Project.brief` (persistenceActions save()). Republish reads the persisted Brief, so the new text survives.

**Exact template + degradation strings**
- both: `Hi {businessName}, I found your website — interested in {offer}` (em dash U+2014)
- no offer: `Hi {businessName}, I found your website and I'm interested.`
- no facts / no businessName: `Hi, I found your website and I'm interested.`

**classify.ts fact keys read:** `EntryFacts.businessName`, `EntryFacts.offer`.

**Purity confirmation:** `whatsappPrefill.ts` has zero imports; no AI provider, no network, no randomness. Test asserts deterministic equality across 50 calls.

**Sample output** (businessName="Acme", offer="AI landing pages", phone="+1 555 123 4567"):
`https://wa.me/15551234567?text=Hi%20Acme%2C%20I%20found%20your%20website%20%E2%80%94%20interested%20in%20AI%20landing%20pages`

**Verification**
- `npx tsc --noEmit`: clean.
- `npm run test:run -- whatsappPrefill goalToDestination resolveCtaHref bridge`: 4 files / 73 tests PASS (after bridge.test.ts fix below).
- UPDATE (authorized scope add): `src/modules/brief/bridge.test.ts` added to Phase 6 scope by orchestrator; applied the one-assertion fix to the `enquiry + phone -> M2` case (destination now `https://wa.me/15551234567?text=Hi%2C%20I%20found%20your%20website%20and%20I'm%20interested.`, param now `{ phone, message: "Hi, I found your website and I'm interested." }`) — matches `legacyGoalToBriefGoal` output (no facts -> generic degradation message). tsc clean; all 73 tests green.

**Deviations**
- `buildWhatsappPrefill` with an offer but NO businessName falls back to the no-name string (conservative — the "Hi {name}" template needs a name). In-scope edge call, logged here.
- `composeWhatsappDestination` exported from bridge.ts (small additive helper, not just `legacyGoalToBriefGoal`) so the modal recomposes destinations with byte-identical formatting instead of duplicating the wa.me/encode logic.

**Open risks / blocker**
- BLOCKER (out-of-scope file): `src/modules/brief/bridge.test.ts` is NOT in Phase 6 Files-touched, but the plan-mandated M2 writeback change (always materialize `param.message`) invalidates its `enquiry + phone -> M2 with composed wa.me destination (digits only)` case (line ~257). That test now must expect `destination: "https://wa.me/15551234567?text=Hi%2C%20I%20found%20your%20website%20and%20I'm%20interested."` (apostrophe stays literal — encodeURIComponent does not escape it) and `param: { phone: '+1 (555) 123-4567', message: "Hi, I found your website and I'm interested." }`. Left UNEDITED per scope rules — orchestrator must add bridge.test.ts to scope or approve the one-assertion update.
- Modal persistence relies on the edit-store auto-save; not exercised by an automated edit-page test in this phase (no edit-page test harness in Files-touched).

---

## Phase 7 — M3: store-badges shared block

**Files changed**
- `src/modules/generatedLanding/sharedBlocks/StoreBadges/badgeArt.tsx` — NEW plain module (no 'use client')
- `src/modules/generatedLanding/sharedBlocks/StoreBadges/StoreBadges.tsx` — NEW edit twin ('use client')
- `src/modules/generatedLanding/sharedBlocks/StoreBadges/StoreBadges.published.tsx` — NEW published twin
- `src/modules/generatedLanding/sharedBlocks/registry.ts` — registered `storebadges` edit twin
- `src/modules/generatedLanding/sharedBlocks/registry.published.ts` — registered `storebadges` published twin
- `src/modules/goals/injectGoalSections.ts` — NEW deterministic injector
- `src/app/onboarding/product/[token]/components/steps/GeneratingStep.tsx` — call injector in buildFinalContent
- `src/app/onboarding/service/[token]/components/steps/GeneratingStep.tsx` — same
- `src/modules/sections/sectionList.ts` — added `storeBadges` SectionMeta
- `src/modules/audience/product/elementSchema.ts` — added `SharedStoreBadges` entry
- `src/modules/audience/service/elementSchema.ts` — added `SharedStoreBadges` entry
- `src/modules/goals/injectGoalSections.test.ts` — NEW
- `src/modules/generatedLanding/sharedBlocks/__tests__/storeBadges.parity.test.tsx` — NEW

**What changed (per file)**
- `badgeArt.tsx`: plain module holding inline "official-style" SVG badges (Google Play, App Store), the shared `StoreBadgesCore` layout (self-sets `data-surface="neutral"`, `<style>`-injected CSS mirroring the LeadForm approach), `resolveBadges()` (App Store then Google Play, empty URLs skipped) and `badgeKindForUrl()` host sniff. No public/ asset, no buildAssets change. Firewall-safe (React import only).
- `StoreBadges.tsx` / `.published.tsx`: byte-parallel twins built on `StoreBadgesCore`. Edit twin reads the section from `useEditStoreLegacy` by `sectionId` (edit renderer spreads only section data, not `content` — same reason LeadForm.tsx reads the store), editable `badge_label` heading, inert anchors (preventDefault). Published twin reads flattened element props (`appstore_url`/`playstore_url`/`badge_label`), anchors carry `data-lessgo-cta` + `data-lessgo-cta-role="secondary"` + `externalLinkProps` (new-tab). Badge SVG markup shared via `badgeArt(kind)` → identical in both.
- `injectGoalSections.ts`: plain module `injectGoalSections(sections, sectionLayouts, content, goal, ctx)`. For `download-app` with ≥1 `param.links` entry, host-sniffs each link, injects a `storeBadges-<uuid>` section (layout `SharedStoreBadges`) after the hero with elements `{ appstore_url, playstore_url, badge_label }`. Deterministic, idempotent (skips if a `storeBadges-` section exists), no-op for other intents / no links / unknown-host-only links. Mutates sections/sectionLayouts/content in place (matches seedGoalForm's `injectLeadFormSection`).
- GeneratingSteps: call `injectGoalSections(finalContent.layout?.sections, finalContent.layout?.sectionLayouts, finalContent.content, briefGoal)` right after `seedGoalForm`.

**Host-sniff rule:** URL contains `play.google.com` → Play badge (`playstore_url`); contains `apps.apple.com` (or `itunes.apple.com`) → App Store badge (`appstore_url`); unknown host → skipped. First match per store slot wins; order-independent. Two links (Kathaworld) → TWO badges; one → one.

**Twin parity + firewall:** both twins build markup through the single-source `StoreBadgesCore`/`badgeArt` (byte-parallel section/badge DOM). `badgeArt.tsx` is a PLAIN module; the published twin imports only plain modules (`badgeArt`, `resolveCtaHref`) — no 'use client' code reaches the static-markup path. Intentional asymmetry (same as LeadForm): published anchors carry `data-lessgo-cta` beacon attrs, edit anchors do not.

**Registry lowercase keys:** `storeBadges-<uuid>` → both `extractSectionType` impls lowercase to `storebadges`; both registries keyed `storebadges`. Verified via parity test resolving a real `storeBadges-abcd1234` id through both `componentRegistry` shims.

**Section-type-switch grep (step 0):** re-confirmed the Phase 5 enumeration (already pre-scouted `storebadges`): `getSurfaceForSection` (not called for shared types — block self-sets `data-surface`), BackgroundPreview/SectionTypeSelector/SectionCRUD (add-section UI, never used for injected sections), collectionHelpers/pageActions/pageHelpers (match specific types only), useReviewState (header/footer only). All have safe defaults; no reader breaks on `storeBadges`. No edits required beyond `sectionList` + `elementSchema` entries.

**Kathaworld two badge hrefs produced** (from `param.links = [play, appstore]`):
- `playstore_url` = `https://play.google.com/store/apps/details?id=com.kathaworld.app`
- `appstore_url`  = `https://apps.apple.com/us/app/kathaworld/id1234567890`
Both rendered as two `.lg-badge` anchors in BOTH renderers; published anchors carry `data-lessgo-cta`/`role="secondary"`/`target="_blank"`.

**Deviations:** none (all edits within Files-touched). `badge_label` defaults to "Get the app" (conservative, editable) since Phase 1 links carry no label.

**Tests / build**
- `npx tsc --noEmit` — clean.
- `npm run test:run -- injectGoalSections storeBadges componentRegistry dispatch` — 3 files, 30 tests pass; `dispatch.test.ts` run explicitly = 14 pass (template-dispatch regression green).
- `npm run build` — green (published block CSS injected inline via `<style>`, no public/published.css dependency).

**Open risks:** editor-side interactions (drag/reorder/delete of an injected storeBadges section) not covered by an automated edit-page test (no such harness in Files-touched); relies on the grep-confirmed safe defaults.

---

## Phase 8 — M4: follow-strip shared block

**Files changed:**
- `src/modules/generatedLanding/sharedBlocks/FollowStrip/socialIcons.tsx` — NEW plain module (no 'use client').
- `src/modules/generatedLanding/sharedBlocks/FollowStrip/FollowStrip.tsx` — NEW edit twin ('use client').
- `src/modules/generatedLanding/sharedBlocks/FollowStrip/FollowStrip.published.tsx` — NEW published twin.
- `src/modules/generatedLanding/sharedBlocks/registry.ts` — registered `followstrip` edit twin.
- `src/modules/generatedLanding/sharedBlocks/registry.published.ts` — registered `followstrip` published twin.
- `src/modules/goals/injectGoalSections.ts` — EXTENDED: `follow-social` branch + `injectFollowStrip`; added `InjectGoalSectionsCtx` (socialProfiles fallback).
- `src/modules/goals/goalToDestination.ts` — **DEVIATION (see below):** added `export` to the existing `inferPlatform` (one-word additive change; zero behavior change).
- `src/app/onboarding/product/[token]/components/steps/GeneratingStep.tsx` — passed `{ socialProfiles: undefined }` ctx to the existing injector call.
- `src/app/onboarding/service/[token]/components/steps/GeneratingStep.tsx` — same.
- `src/modules/sections/sectionList.ts` — added `followStrip` SectionMeta entry.
- `src/modules/audience/product/elementSchema.ts` — added `SharedFollowStrip` entry.
- `src/modules/audience/service/elementSchema.ts` — added `SharedFollowStrip` entry.
- `src/modules/goals/injectGoalSections.test.ts` — EXTENDED with M4 follow-strip + subscribe-newsletter negative + non-follow-social cases (storeBadges cases untouched).
- `src/modules/generatedLanding/sharedBlocks/__tests__/followStrip.parity.test.tsx` — NEW.

**Per file — what changed:**
- `socialIcons.tsx`: inline-SVG icons (instagram, facebook, twitter/x, linkedin, youtube, tiktok, threads, pinterest, telegram, whatsapp, website fallback) using `currentColor`; `resolveProfiles(links_json)` safe JSON parse; `FOLLOW_STRIP_STYLES` (self-contained, no public/published.css dep); `FollowStripCore` single-source layout (self-sets `data-surface="neutral"`). Mirrors StoreBadges/badgeArt exactly.
- `FollowStrip.tsx` / `.published.tsx`: byte-parallel layout via `FollowStripCore`. Edit twin reads section from `useEditStoreLegacy` (edit renderer passes no `content` prop), editable heading, inert anchors. Published twin reads flattened `strip_heading`/`links_json` props, emits `data-lessgo-cta` on every anchor, `data-lessgo-cta-role="primary"` on the FIRST profile (the goal platform / hero destination) and `secondary` on the rest, `target=_blank rel` via `externalLinkProps`.
- `injectGoalSections.ts`: `follow-social` ONLY. Links from `goal.param.links`, falling back to `ctx.socialProfiles`. Platform inferred via the shared `inferPlatform` (unless an explicit `profile.platform` is supplied, e.g. from Brief.socialProfiles). Materialized to `links_json` at injection (renderers never read the Brief). Idempotent, after-hero placement, deterministic (no AI).

**Deviations:**
1. **`goalToDestination.ts` not in Phase 8 Files-touched but edited (added `export` to `inferPlatform`).** The orchestrator explicitly required reusing `inferPlatform` and forbade writing a second inferer; it lives as a private function in `goalToDestination.ts` and there is no other exported platform inferer in the repo. The only way to satisfy both instructions was to export it — a one-word, purely additive change with zero behavior/risk impact (the plan clearly assumed it was importable). Flagged here for review rather than duplicating the table or stopping the whole phase.
2. **Onboarding passes `{ socialProfiles: undefined }`.** The product/service generation stores carry no `socialProfiles` field (adding one is out of Phase-8 scope). Onboarding follow-social links flow via `param.links` (the Phase-1 M4 capture); the `ctx.socialProfiles` seam is threaded but undefined in onboarding — it is the injector's Brief fallback for other callers (Phase 10 acceptance / edit-time).

**inferPlatform reuse (not duplicated):** confirmed — `injectFollowStrip` imports `inferPlatform` from `@/modules/goals/goalToDestination`; no second platform table was written. `socialIcons.tsx` icon keys align with `inferPlatform`'s output labels.

**follow-social-only rule + negative assertion:** the injector gates strictly on `goal.intent === 'follow-social'`. Test `subscribe-newsletter does NOT inject a follow-strip` asserts no strip even when a stray `param.links` is present (M1 form, Phases 4–5). Also `non-follow-social intent (book-call) → no follow-strip`.

**Parity + firewall confirmation:** parity test asserts identical section/strip markup + classes + `data-surface` across both twins; published carries beacon attrs, edit does not. `socialIcons.tsx` is a plain module (no 'use client'); `FollowStrip.published.tsx` imports only plain modules (`socialIcons`, `resolveCtaHref`). Section-type-switch grep for `storeBadges` returned no non-registry/non-schema readers → `followStrip` needs nothing beyond sectionList + elementSchema + the two registries (shared blocks resolve before template dispatch).

**Documented limitation:** later edits via SocialProfilesPanel do NOT auto-sync the strip (strip URLs are materialized once at injection, editable as the section's own `links_json`/heading elements). Noted in the injector doc comment.

**Writer fixture hrefs/platforms:** for a writer with an Instagram profile `https://instagram.com/writerhandle` (goal follow-social), the injector materializes `links_json = [{"platform":"instagram","url":"https://instagram.com/writerhandle"}]`; the published strip emits a single anchor `href="https://instagram.com/writerhandle"` with `data-lessgo-cta` + `data-lessgo-cta-role="primary"` + `target="_blank" rel="noopener noreferrer"`, rendering the Instagram icon. (Multi-profile Instagram+YouTube → Instagram anchor role=primary, YouTube role=secondary.)

**Verification:**
- `npx tsc --noEmit` — clean.
- `npm run test:run -- injectGoalSections followStrip dispatch` — 3 files, 40 tests pass (dispatch regression green).
- `npm run build` — green (published block CSS injected inline via `<style>`, no public/published.css dependency).

**Open risks:** editor-side interactions (drag/reorder/delete of an injected followStrip section) not covered by an automated edit-page test (no such harness in Files-touched); relies on grep-confirmed safe defaults. Onboarding `socialProfiles` fallback is inert until a store field or edit-time caller supplies it (deviation 2).

---

## Phase 9 — Intent-first wizard goal step (unhide + extend)

**Files changed**
- `src/hooks/useProductGenerationStore.ts` — modified (added `goalIntent` state + `setGoalIntent`, alongside `landingGoal`)
- `src/hooks/useServiceGenerationStore.ts` — modified (added `goalIntent` state + `setGoalIntent`, alongside `goal`)
- `src/modules/brief/bridge.ts` — modified (`goalIntent` on both prefills from `brief.goal.intent`; new `intentToLegacyGoal(intent, audience)` legacy-mirror helper with per-audience fallback; new `intentToBriefGoal(intent, param, facts)` intent-first writeback composer that `legacyGoalToBriefGoal` now delegates to)
- `src/app/onboarding/product/[token]/components/steps/GoalStep.tsx` — REWRITTEN (intent-first: likelyIntents OptionCards + "Other goals" inline expand)
- `src/app/onboarding/service/[token]/components/steps/GoalStep.tsx` — REWRITTEN (same, OptionCard grid replaces the old custom list)
- `src/app/onboarding/product/[token]/page.tsx` — modified (hydrate `goalIntent` from prefill)
- `src/app/onboarding/service/[token]/page.tsx` — modified (hydrate `goalIntent` from prefill)
- `src/app/onboarding/product/[token]/components/steps/GeneratingStep.tsx` — modified (writeback prefers store `goalIntent` via `intentToBriefGoal`; legacy `legacyGoalToBriefGoal(landingGoal,…)` is FALLBACK)
- `src/app/onboarding/service/[token]/components/steps/GeneratingStep.tsx` — modified (same)
- `src/modules/brief/bridge.test.ts` — modified (prefill goalIntent cases; `intentToLegacyGoal` totality + fallback; `intentToBriefGoal` preference/loss-prevention; updated two existing exact-match prefill assertions to include `goalIntent`)

**Per-file change detail**
- Stores: `goalIntent: GoalIntent | null` (init null) + `setGoalIntent`, added ALONGSIDE the legacy `landingGoal`/`goal` (never replacing them).
- bridge.ts: `intentToLegacyGoal` reuses the existing `INTENT_TO_SERVICE_GOAL`/`INTENT_TO_LANDING_GOAL` forward maps; unmapped → product `signup`, service `book-call` (overloaded signatures give a precise return type per audience). `intentToBriefGoal` holds the composition body previously inside `legacyGoalToBriefGoal`; the legacy fn now just reverse-maps the enum then delegates — all existing Phase 1/6 composition tests unchanged and green.
- GoalStep (both): options = `businessTypes[businessTypeKey].likelyIntents` rendered as `OptionCard`s (label from `goalIntentMeta`, local icon + description maps for all 18 intents). Pre-selects the store `goalIntent` (which the page hydrates from prefill = the AI guess). "Other goals" is a plain `useState` inline expand (NO modal) showing the remaining intents; it auto-opens when the pre-selected intent isn't in the likely few. On pick: `setGoalIntent(intent)` + `setLandingGoal/setGoal(intentToLegacyGoal(intent, audience))` (both set) + clears stale `goalParam` on change. `GoalParamFields` (Phase 1) renders unchanged after the pick (download-app dual-URL, subscribe-newsletter renders nothing, etc.). Product keeps auto-advance for param-less intents; service keeps the explicit Continue button + posthog events.

**getServiceFormTemplate / SERVICE_FORM_TEMPLATE_GOALS grep (landmine 1)**
Re-ran the grep. Only caller of the legacy `getServiceFormTemplate` + `SERVICE_FORM_TEMPLATE_GOALS` is `src/components/forms/FormBuilder.tsx` (:14/:15/:129/:130/:262). `getFormTemplateForIntent` is used by `src/modules/goals/seedGoalForm.ts` (:102) + the formTemplates test. Phase 9 does NOT touch the intent↔legacy form-template maps (`formTemplates.ts` untouched) — it only adds `intentToLegacyGoal`/`intentToBriefGoal`/prefill `goalIntent`. No re-key, so no silent field-drop; the legacy wrapper still covers FormBuilder.

**businessType resolution per audience**
- Product: `isManufacturerFlow(templateId) ? 'manufacturer' : 'saas'`. (The product store carries no `brief.businessType`, so the "brief-prefilled businessType wins" clause is inert here — see Deviations.)
- Service: `understanding.serviceType` → businessType via the inverse of bridge's `BUSINESS_TYPE_TO_SERVICE_TYPE` (agency→agency, consultancy→consultant, coaching→coach; freelance/productized/local + undefined → default `agency`).

**Legacy goal mirrored (downstream untouched)**
Every pick writes BOTH `goalIntent` (real) AND the legacy `landingGoal`/`goal` (via `intentToLegacyGoal`). Copy prompts, form seed, injectors, and any legacy reader keep consuming the legacy enum exactly as before. Legacy enums (`landingGoals`/`serviceGoals`) and `vocabulary.ts` untouched (design call #4).

**Writeback prefers goalIntent, legacy fallback**
Both GeneratingSteps compose `brief.goal` from `intentToBriefGoal(goalIntent,…)` when the store carries a `goalIntent`, falling back to `legacyGoalToBriefGoal(legacyGoal,…)` only when it's absent (resumed run / pre-Phase-9 draft). Intent-first avoids the lossy legacy round-trip (e.g. `book-me`→`book-call`); a bridge test proves the preservation.

**AI pre-select source**
`goalIntentGuess` (from `/api/v2/understand` + classify) becomes `brief.goal.intent` in `classify.ts`; `briefTo{Product,Service}Prefill` now expose it as `prefill.goalIntent`; each `page.tsx` hydrates `setGoalIntent(prefill.goalIntent)` on mount; GoalStep pre-selects it. So the AI guess flows Brief → prefill → store → pre-selection; the user can override.

**Verification**
- `npx tsc --noEmit` — clean.
- `npm run test:run -- bridge` — 39 tests pass (incl. new Phase 9 cases; two existing exact-match prefill assertions updated for the additive `goalIntent`).
- `npm run test:e2e -- generation` — ran on `PORT=3020 E2E_PORT=3020` (port 3000 was occupied by a foreign process, so Playwright's spawned `next dev` had to bind a free port). Product pipeline test PASSED; the service pipeline test SKIPPED (auth-gated, expected default in public mock mode). The generation specs are API-driven and do not exercise the GoalStep UI, so they validate that the goal-machinery routes are unaffected, not the new wizard UI itself.

**Post-review fix (blocking regression):** product `page.tsx` prefill hydration set `goalIntent` but only mirrored the legacy `landingGoal` when `prefill.landingGoal` was defined — an AI-guessed intent with no `INTENT_TO_LANDING_GOAL` entry (e.g. `book-call`) left `landingGoal=null` and hard-errored in GeneratingStep. Fixed by always mirroring via `s.setLandingGoal(prefill.landingGoal ?? intentToLegacyGoal(prefill.goalIntent, 'product'))` (total helper → `signup` fallback) whenever `goalIntent` is present, matching the service GoalStep mount-effect defense. Re-verified: `tsc` clean; `bridge generation seedGoalForm injectGoalSections whatsappPrefill` = 109 tests pass.

**Deviations**
- "brief-prefilled businessType wins" (both audiences) is only partially realized: neither generation store nor the ProductPrefill/ServicePrefill interfaces carry `brief.businessType` today, and plumbing it would require store/prefill fields not in Phase 9's Files-touched. Conservative choice: product resolves via `manufacturerFlow`, service via `serviceType`. The AI's businessType still indirectly drives the pre-selected INTENT (via `goalIntentGuess`), just not the likely-list bucket. Logged rather than expanding scope.
- Service GoalStep's visual switched from the old bespoke 3-card list to the shared OptionCard grid (required by "rendered via goalIntentMeta labels + the existing OptionCard component"). Intended UX change under the Phase 9 human gate.
- Added `intentToBriefGoal` to bridge.ts (within Files-touched) as the clean seam for "writeback prefers goalIntent"; `legacyGoalToBriefGoal` delegates to it, so all prior behavior/tests are preserved.

**Open risks / human-gate eyeball**
- Which intents show FIRST: manufacturer → `enquiry`, `request-quote`; SaaS → `request-demo`, `free-trial`, `signup-free`, `waitlist`; service (agency/consultant/coach) → `book-call` first (+ enquiry/request-quote or lead-magnet/enroll per type).
- "Other goals" inline expand reveals the remaining intents (full 18 minus the likely few); auto-opens when a pre-selected intent isn't in the likely list.
- Prefill pre-selection: a scrape-prefilled project should land on the AI-guessed intent already selected (and "Other" auto-open if that guess isn't a likely one).
- Icons/descriptions for the 18 intents are hand-authored per file — eyeball for tone/accuracy.
