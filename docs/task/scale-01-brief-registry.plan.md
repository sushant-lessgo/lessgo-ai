# scale-01 — Brief record, self-describing registry, goal enums · PLAN

**Branch:** `feature/scale` (shared accumulating branch — already exists; NO per-spec branch creation; every implementer/impl-reviewer verifies `git branch --show-current` == `feature/scale` before touching anything).

Spec: `docs/task/scale-01-brief-registry.spec.md` · Source of decisions: `docs/tracks/scalePlan.md` §§2/3/6/7/11.

## Overview

Create the pure data layer everything downstream (router, gate, wizard, generation) will read: a persisted per-project **Brief** (`Project.brief Json?` + zod contract), frozen **goal vocabulary** (18 intents × mechanisms M1–M5), a **closed capability vocab**, static **template metadata** (`copyEngines/capabilities/designStyles/retired/bespoke`) parallel to the loader-only registry, frozen **engine-core section sets**, a **businessType v0** config, and a **`fit()`** hard-fit helper — all proven by conformance + unit tests. Zero funnel/runtime behavior change: no app code imports any of this yet; existing e2e passes untouched.

## Progress log

- phase 1 vocabulary + brief contract: done (review loops 1, ship)
- phase 2 prisma brief column: done (review loops 1, ship; migration 20260707191204_add_project_brief)
- phase 3 template metadata + engine-core sections: done (review loops 1, ship; no resolver drift)
- phase 4 conformance tests: pending
- phase 5 businessTypes v0 + fit() + final green sweep: pending

## Design decisions baked into this plan (plan-review: challenge these)

### D-A. Engine-core sets vs ground truth (THE tension — resolved here, not left to the implementer)

Spec §5 says `thing-core` = meridian's 7 and `work-core` = granth/lumen. Ground truth from the dispatch resolvers (source of truth) breaks both:

1. **thing-core:** vestria's block map (verified in `src/modules/templates/vestria/resolveVestriaBlock.ts`) is `header, hero, trust, industries, about, features, catalog, materials, process, testimonials, contact, footer` — **no `pricing`, no `cta`**. Vestria's CTA is its `contact` lead-form section. So "thing-core = meridian's 7" makes conformance (§6a) unshippable for vestria, and acceptance requires saas→meridian+**vestria**.
   **Decision:** `thing-core` = the guaranteed common contract = **`header, hero, features, testimonials, footer` (5)**. `pricing`/`cta` are meridian-specific extras, not engine guarantees. (Rejected alternative: alias table `cta → cta|contact` — fuzzy "frozen" set, more machinery for zero v0 benefit. Plan-review may prefer it; state why if so.)
2. **work-core:** granth(6) ∩ lumen(9) = only `hero, about, footer` — too thin to mean anything. Spec's own framing for thing/trust is "one canonical template's set," and lumen is D4 bespoke-off-funnel (never in shortlists).
   **Decision:** `work-core` = **granth's 6** (`hero, about, books, writing, praise, footer`), and **lumen is exempt from engine-core conformance** via a `bespoke: true` flag in its metadata (it still gets the capability-evidence check). Revisit work-core when a second shortlist-eligible work template lands.
3. **trust-core** = hearth's 7 (`header, hero, services, testimonials, packages, cta, footer`) — lex has the same 7; surge has these 7 + logos/about/casestudies/stats. No tension. (Implementer re-verifies all three trust resolvers' keys before freezing, same as vestria was verified.)

### D-B. Conformance-test rule (makes §6a/§6b precise)

- **(a) engine-core:** for every template with `retired !== true` and `bespoke !== true`, for every engine in its `copyEngines`, every section type in that engine's core set must resolve to a real block in BOTH modes: `resolveXBlock(type,'edit')` and `(type,'published')` truthy and `!== <template>PlaceholderBlock`. Bespoke (lumen) + retired (techpremium) are skipped for (a).
- **(b) capability evidence:** capabilities split into **block-backed** (`gallery, catalog, lead-form, packages, blog, video-hero, store-badges, map-hours`) and **structural** (`multipage, bilingual` — page-menu machinery / twin-fields, not a block; exempt from (b) with a comment). Each templateMeta entry carries `capabilitySections: Partial<Record<CapabilityId, string>>` mapping every declared block-backed capability → the section type that evidences it; the test asserts (i) every declared block-backed capability has an evidence entry, (ii) that section resolves non-placeholder in both modes. Lying in metadata = red test.

### D-C. Metadata lives in a SIBLING file, not inside loaders

`templateRegistry` entries stay async-loaders-only (bundle firewall — nothing static may enter the loaders). New `src/modules/templates/templateMeta.ts` exports a synchronous `templateMeta: Record<TemplateId, TemplateMeta>`, queryable by `fit()` without touching any template chunk. `registry.ts` itself is NOT edited.

### D-D. Final declarations (the §11.3 audit, resolved)

| template | copyEngines | designStyles | capabilities | evidence (capabilitySections) | flags |
|---|---|---|---|---|---|
| meridian | thing | tech-minimal | lead-form | lead-form→`cta` | — |
| vestria | thing | editorial-craft | multipage, lead-form, catalog | lead-form→`contact`, catalog→`catalog` | — |
| hearth | trust | warm-human | lead-form | lead-form→`cta` | — |
| lex | trust | authority-professional | lead-form | lead-form→`cta` | — |
| surge | trust | bold-performance | lead-form, packages | lead-form→`cta`, packages→`packages` | — |
| granth | work | literary-quiet | *(none)* | — | — |
| lumen | work | editorial-craft | bilingual, gallery, lead-form | gallery→`portfolio`, lead-form→`contact` | `bespoke: true` |
| techpremium | *(empty)* | *(empty)* | *(empty)* | — | `retired: true` |

Resolved spec questions: vestria `catalog` YES (VestriaCatalogueGrid exists, verified). granth `blog` **NO** (no blog blocks — declaring it fails conformance; spec's own rule decides). surge `casestudies` is a section, NOT a capability — the vocab is closed; do not add a case-studies capability; surge's capability set is lead-form+packages only. techpremium retired ⇒ empty engine/cap lists (out of every catalog/shortlist; simplest truthful shape).

### D-E. Brief contract shape (v0 = contract, not a gate)

- Zod schema is the single source of truth: `BriefSchema` in `src/lib/schemas/brief.schema.ts`, `export type Brief = z.infer<typeof BriefSchema>`. `src/types/brief.ts` holds the shared closed enums (`copyEngines`, `capabilityIds`, `designStyles` as `as const` + union types, service.ts idiom) and re-exports `type Brief` so the canonical import path is `@/types/brief`. No dual-maintained interface.
- **All top-level Brief fields optional** in v0 — the Brief is built incrementally across wizard steps; there are zero readers yet, so the schema documents shape, it doesn't gate. Field types: `businessType: z.string()` (open key — the business-type list grows; validated against config at gate-time in spec 02+) · `copyEngine: z.enum(copyEngines)` · `category: z.string()` · `goal: { intent: z.enum(goalIntents), mechanism: z.enum(goalMechanisms), destination: z.union([z.string(), z.array(z.string())]).optional() }` · `facts: z.record(z.string(), z.unknown())` · `proofAvailable: z.array(z.string())` · `socialProfiles: z.array(z.object({ platform: z.string(), url: z.string() }))` · `structure: { mode: z.enum(['single','multi']), pages: z.array(z.string()) }` · `designStyleHint: z.enum(designStyles)` · `templateShortlist: z.array(z.enum(templateIds))` · `confidence: z.number().min(0).max(1)`.

### D-F. Goal vocabulary (frozen — scalePlan §6 table, §11.2/§11.8)

`src/modules/goals/vocabulary.ts`:
- `goalMechanisms = ['M1','M2','M3','M4','M5'] as const` + `goalMechanismMeta: Record<GoalMechanism, { label; description }>` (M1 on-site form · M2 direct channel · M3 redirect out · M4 subscribe/follow · M5 scroll/anchor).
- `goalIntents` (18, kebab-case): `enquiry, request-quote, book-call, request-demo, book-me, enroll, apply, lead-magnet, waitlist, signup-free, free-trial, download-app, buy-via-link, order-via-platform, pay-via-link, subscribe-newsletter, follow-social, rsvp`. Includes place intents now (`order-via-platform`, §11.8) and `buy-via-link` (D16 rename). Renames from today's enums (`demo`→request-demo, `signup`→signup-free, `download`→download-app, `buy`→buy-via-link) are NEW vocabulary only — today's goal enums are untouched (no deletion of routing confetti, scope OUT).
- `goalIntentMeta: Record<GoalIntent, { label; mechanisms: GoalMechanism[] }>` — allowed mechanisms per the §6 table (e.g. enquiry: M1/M2; book-call: M1/M3/M2; follow-social: M4).

### D-G. fit() split for testability

`src/modules/templates/fit.ts`:
- `fit(templateId, engine, required: CapabilityId[]): boolean` — pure hard-fit: `!retired && !bespoke && engine ∈ meta.copyEngines && required ⊆ meta.capabilities`.
- `requiredCapabilitiesFromBrief(brief): CapabilityId[]` — the §7.2 fixed table, v0 scope: businessType entry's `requiredCapabilities` (unknown businessType key → contributes none; the SERVE GATE, spec 02+, is what rejects unknown types) ∪ mechanism-derived (M1→`lead-form`; intent `download-app`→`store-badges`) ∪ `structure.mode==='multi'`→`multipage`. (No language field on Brief yet → no bilingual derivation; noted inline for spec 02+.)
- `shortlist(brief): TemplateId[]` — all templateIds where `fit(t, brief.copyEngine, requiredCapabilitiesFromBrief(brief))`.
- Acceptance fixtures: saas brief (thing, M1) → `[meridian, vestria]` (techpremium excluded via retired) · agency brief (trust, M1) → `[hearth, lex, surge]` · photographer → `fit` called with explicit `required: ['gallery']` on work + trust engines → 0 matches (granth lacks gallery; lumen bespoke-excluded) — photographer has no businessType entry yet, so the fixture exercises the pure `fit()` with explicit requirements, documenting exactly what an entry would need.

### D-H. businessTypes v0 location + shape

Greenfield module `src/modules/businessTypes/config.ts`. Entry shape (modeled on the `ServiceVoiceSpec` record idiom): `{ key, label, copyEngine, requiredCapabilities: CapabilityId[], defaultStyle: DesignStyle, wizardFields: Record<string, { label: string; example: string }>, extractionSchemaKey: string, likelyIntents: GoalIntent[] /* 3–4 */ }`. Six seed entries — shape-complete, behavior-free (spec 08 melts manufacturerFlow into this later; v0 the `manufacturer` key just exists + is shape-tested):

| key | engine | required | defaultStyle | likelyIntents |
|---|---|---|---|---|
| saas | thing | lead-form | tech-minimal | request-demo, free-trial, signup-free, waitlist |
| manufacturer | thing | lead-form | editorial-craft | enquiry, request-quote |
| agency | trust | lead-form | bold-performance | book-call, enquiry, request-quote |
| consultant | trust | lead-form | authority-professional | book-call, enquiry, lead-magnet |
| coach | trust | lead-form | warm-human | book-call, enroll, lead-magnet |
| writer | work | *(none)* | literary-quiet | follow-social, buy-via-link, subscribe-newsletter |

(manufacturer: `catalog` is *preferred* not required — a manufacturer page isn't broken without collections; required flags shrink serveability, scalePlan §7.3.)

---

## Phase 1 — Goal vocabulary + Brief contract

**Files touched**
- `src/modules/goals/vocabulary.ts` (create)
- `src/types/brief.ts` (create)
- `src/lib/schemas/brief.schema.ts` (create)
- `src/modules/goals/vocabulary.test.ts` (create)

**Steps**
1. `vocabulary.ts` per D-F: `goalIntents`/`goalMechanisms` `as const`, union types, `goalIntentMeta` + `goalMechanismMeta`. Header comment: FROZEN, coder-maintained (§11.2); today's legacy goal enums untouched.
2. `src/types/brief.ts` per D-E: `copyEngines = ['thing','trust','work'] as const` + `CopyEngine`; `capabilityIds = ['multipage','gallery','catalog','map-hours','bilingual','video-hero','store-badges','lead-form','packages','blog'] as const` + `CapabilityId`; `designStyles = ['tech-minimal','editorial-craft','warm-human','authority-professional','bold-performance','literary-quiet'] as const` + `DesignStyle`; `export type { Brief } from '@/lib/schemas/brief.schema'`.
3. `brief.schema.ts` per D-E (imports enums from `@/types/brief` and `templateIds` from `@/types/service`; import direction is schema→types only — no cycle since types/brief only re-exports the *type*).
4. `vocabulary.test.ts`: asserts exactly 18 intents, exactly 5 mechanisms, `buy-via-link` present + `buy` absent, `order-via-platform`/`pay-via-line` place intents present (`pay-via-link` — typo-check in test!), every `goalIntentMeta.mechanisms` ⊆ goalMechanisms; plus a `BriefSchema.parse({})` smoke (all-optional) and a full-fixture parse.

**Verification:** `npx tsc --noEmit` clean · `npm run test:run` green (new test included). No app import of new files (nothing else edited) ⇒ zero runtime change.

## Phase 2 — Prisma `Project.brief` column 🔒 HUMAN GATE (schema/migration)

Low-risk (additive nullable Json, idiomatic next to `content`/`themeValues`/`computedDesign`), but it's a migration touching the shared dev DB → user sign-off before running `migrate dev`.

**Files touched**
- `prisma/schema.prisma` (edit: add `brief Json?` to `Project`, schema.prisma:20-44 block)
- `prisma/migrations/<timestamp>_add_project_brief/migration.sql` (generated by `prisma migrate dev` — commit it)

**Steps**
1. Add `brief Json?` to `Project`.
2. `npx prisma migrate dev --name add_project_brief` (NEVER `db push`). Commit schema + generated migration together.

**Verification:** migration applies clean · `npx prisma generate` ok · `npx tsc --noEmit` clean · `npm run test:run` green (no reader exists; nothing can break, this is the proof).

## Phase 3 — templateMeta + engine-core sections

**Files touched**
- `src/modules/templates/templateMeta.ts` (create)
- `src/modules/engines/coreSections.ts` (create)
- `src/modules/templates/templateMeta.test.ts` (create)

**Steps**
1. `templateMeta.ts` per D-C/D-D: `interface TemplateMeta { copyEngines: readonly CopyEngine[]; capabilities: readonly CapabilityId[]; designStyles: readonly DesignStyle[]; capabilitySections?: Partial<Record<CapabilityId, string>>; retired?: true; bespoke?: true }`; `export const templateMeta: Record<TemplateId, TemplateMeta>` with the D-D table exactly. Comments: why granth has no blog, why casestudies isn't a capability, lumen D4 bespoke, techpremium §11.4 retired. Do NOT edit `registry.ts`; do NOT import any template module (static metadata only — firewall).
2. `coreSections.ts` per D-A: `export const engineCoreSections: Record<CopyEngine, readonly string[]>` — thing: `[header, hero, features, testimonials, footer]` · trust: `[header, hero, services, testimonials, packages, cta, footer]` · work: `[hero, about, books, writing, praise, footer]`. Header comment: FROZEN (§3); records the D-A rationale (vestria ground truth; work-core = granth canonical, lumen bespoke-exempt).
3. Before freezing, implementer re-verifies hearth/lex/surge/granth/lumen/meridian resolver keys against these lists (vestria already verified in planning) — any drift updates D-A tables in THIS phase, not phase 4.
4. `templateMeta.test.ts`: meta keys exactly === `templateIds` (8) · exactly 7 non-retired · lumen bespoke, techpremium retired · every declared capability ∈ `capabilityIds` · every engine ∈ `copyEngines` · every block-backed declared capability has a `capabilitySections` entry.

**Verification:** `npx tsc --noEmit` · `npm run test:run` green. Still zero app imports.

## Phase 4 — Conformance tests (§6a/§6b — the designer's bar)

**Files touched**
- `src/modules/templates/conformance.test.ts` (create)
- `src/modules/templates/templateMeta.ts` (edit ONLY if the test exposes a false declaration — fix the declaration, never weaken the test)
- `src/modules/engines/coreSections.ts` (same conditional-fix rule)

**Steps**
1. Mirror the `src/modules/templates/vestria/registration.test.ts` idiom: static imports of all 8 `resolve*Block` resolvers + each template's placeholder block (test files never enter the app bundle — firewall unaffected).
2. Build a keyed record `{ [templateId]: { resolve, placeholder } }`; drive both checks off `templateMeta` + `engineCoreSections` via `describe.each`/`for...of` per D-B: (a) engine-core, skipping `retired`/`bespoke`, both modes non-placeholder; (b) capability evidence for block-backed capabilities, both modes non-placeholder; structural caps (`multipage`, `bilingual`) explicitly listed as exempt in a `STRUCTURAL_CAPABILITIES` const with comment.
3. Assert lumen is exercised by (b) but skipped by (a) — a literal test case documenting the D-A #2 decision so plan-review/§6a intent is visible in code.

**Verification:** `npm run test:run` green for all 7 non-retired declarations — this test PASSING is the phase's deliverable (red = a declaration lies; fix metadata). `npx tsc --noEmit`.

## Phase 5 — businessTypes v0 + fit() + final green sweep

**Files touched**
- `src/modules/businessTypes/config.ts` (create)
- `src/modules/templates/fit.ts` (create)
- `src/modules/templates/fit.test.ts` (create)
- `src/modules/businessTypes/config.test.ts` (create)

**Steps**
1. `config.ts` per D-H: entry interface + `businessTypes: Record<BusinessTypeKey, BusinessTypeEntry>` with the 6 seed entries (wizardFields: 2–3 minimal fields each with label+example; extractionSchemaKey: `'<key>-v0'` placeholders — readers arrive spec 02+/08).
2. `fit.ts` per D-G: `fit()`, `requiredCapabilitiesFromBrief()`, `shortlist()`. Imports: `templateMeta`, `businessTypes`, types only — no template modules, no registry loaders.
3. `fit.test.ts`: the three acceptance fixtures (saas → `['meridian','vestria']`, agency → `['hearth','lex','surge']`, photographer/gallery → `[]`) + edge cases: retired excluded (thing + no requirements still omits techpremium), bespoke excluded (work + [] → `['granth']` only), M1 derives lead-form, `structure.mode='multi'` derives multipage (thing+multi → `['vestria']`), download-app → store-badges → 0 (nobody declares it).
4. `config.test.ts` shape test: 6 keys incl. `manufacturer` + `writer`; every `copyEngine` valid; every `requiredCapabilities` ⊆ capabilityIds; every `likelyIntents` ⊆ goalIntents with length 3–4 (manufacturer: 2 is fine — relax to 2–4); `defaultStyle` ∈ designStyles; wizardFields entries have non-empty label+example.
5. **Final green sweep (acceptance):** `npx tsc --noEmit` · `npm run test:run` · `npm run build` · import audit: grep confirms nothing under `src/app/`, `src/modules/generatedLanding/`, `src/middleware.ts`, or any `componentRegistry*` imports the new modules (`@/types/brief`, `@/lib/schemas/brief.schema`, `@/modules/goals/`, `@/modules/engines/`, `@/modules/businessTypes/`, `templateMeta`, `templates/fit`) ⇒ zero runtime behavior change; existing e2e untouched by construction.

**Verification:** all of step 5 green; fixtures match acceptance exactly.

---

## Landmine checklist (why this plan is safe)

- **Bundle firewall:** metadata is a static sibling (`templateMeta.ts`); `registry.ts` loaders untouched; only test files statically import resolvers (vitest-only, established idiom).
- **Dual renderer:** no block `.tsx`/`.published.tsx` touched anywhere; conformance checks BOTH modes, strengthening parity.
- **Migration:** `prisma migrate dev`, additive nullable column, human-gated.
- **Build ≠ next build:** phase 5 runs full `npm run build`; no published CSS/assets touched so no rebuild semantics change.
- **Zero behavior:** no existing file edited except `prisma/schema.prisma`; e2e specs and their code paths untouched.

## Unresolved questions

1. thing-core shrunk to 5 (vestria has no pricing/cta; cta lives in `contact`) — accept, or prefer alias table `cta→cta|contact` keeping 7?
2. work-core = granth's 6 + lumen bespoke-exempt — ok?
3. manufacturer: `catalog` preferred-not-required — ok? (required would shrink shortlist to vestria-only.)
4. Brief v0: all fields optional (contract, not gate) — ok?
5. lumen declares gallery/lead-form/bilingual honestly despite off-funnel — ok, or keep caps empty?
