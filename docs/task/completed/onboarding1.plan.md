# onboarding1 — manufacturer persona fit for /onboarding/product — PLAN

**Branch:** `feature/onboarding1` — all work happens here. Implementers/reviewers
hard-stop if `git branch --show-current` ≠ `feature/onboarding1`.

Spec: `docs/task/onboarding1.spec.md`

---

## Overview

Make `/onboarding/product` fit a manufacturer/trade-supplier (pilot: Golden Shadow,
goldenshadowtrading.com): add an `enquiry` landing goal, a manufacturer-specific page-2
field set (`whatYouMake / industriesServed / productCategories / valueAdds`), matching
AI extraction in both hydration paths (understand + scrape-website), de-SaaS'd example
copy, and strategy/copy prompt wiring that actually consumes the new fields. Every
change branches on the manufacturer signal so SaaS/indie/hardware personas remain
byte-for-byte unchanged.

---

## Design decisions (locked in this plan)

### D1 — Branch key = `templateId === 'vestria'` (NOT persona fetch)
Persona is transient (fetched only in `page.tsx` and `GeneratingStep`); the durable,
already-store-resident proxy is `store.templateId === 'vestria'` (set at persona fetch,
1:1 with manufacturer today, already threaded into every strategy/copy API body).
All UI steps (UnderstandingStep, GoalStep, OneLinerStep, OfferStep) and both extraction
routes branch on this. **No persona persistence, no new plumbing for copy prompt**
(route already derives `voiceId='tailored-trade'` from `templateId==='vestria'`).
Define one tiny helper (e.g. `isManufacturerFlow(templateId)`) so the 1:1 assumption
lives in exactly one place — when onboarding2 breaks the 1:1, only that helper changes.

**Known risk — persona-fetch race:** `page.tsx:51-70` sets `templateId` via async
`/api/user/persona` on mount. A manufacturer who submits/imports on step 1 BEFORE that
resolves would take the SaaS branch (empty `templateId` → `isManufacturerFlow` false).
Window is one network round-trip on mount; accepted as-is for the pilot. Optional
hardening (implementer's call in Phase 3): disable OneLinerStep submit/import until
`templateId` is resolved in the store.

### D2 — Shape = optional manufacturer fields on `UnderstandingData` (no union)
Extend `UnderstandingData` with **optional** `whatYouMake? / industriesServed? /
productCategories? / valueAdds?` alongside the existing 4 SaaS fields, rather than a
discriminated union. Tradeoff: union is type-safer but forces edits at every reader
(GeneratingStep ×6, SitemapReviewStep ×4, multiPageAssembly, strategy route, prompts)
and narrows via a discriminant we'd have to invent + persist. Optional fields keep all
existing readers compiling untouched; manufacturer readers do explicit
`understanding.productCategories ?? understanding.categories`-style mapping at the two
consumption points (strategy route body-build + copy features slot). Existing draft
JSON blobs (Golden Shadow v1) stay parseable.

**Write-side padding consequence:** the 4 SaaS fields stay REQUIRED on
`UnderstandingData` (that's what keeps readers untouched), so the two manufacturer
hydration writers — OneLinerStep (scrape) and UnderstandingStep (understand) — must
PAD `categories: []`, `audiences: []`, `whatItDoes: ''`, `features: []` when building
the object, or it won't satisfy `setUnderstanding`
(`useProductGenerationStore.ts:171` takes a full `UnderstandingData`). Padding to `[]`
(not `undefined`) also keeps any SaaS-path reads like `categories.length` from
throwing.

### D3 — Field → prompt-slot mapping (manufacturer)
| New field | Feeds | Where |
|---|---|---|
| `productCategories` | strategy `Categories:` slot | body built in GeneratingStep/SitemapReviewStep → `strategy/route.ts` → `promptsProduct.ts` |
| `industriesServed` | strategy `Other audiences:` slot (relabeled **`Industries served:`** in manufacturer branch) | same path |
| `valueAdds` | copy `features` slot (relabeled **"Value-adds / USPs (raw, from the founder)"** in `isTrade` branch) | GeneratingStep body → `generate-copy` → `copyPrompt.ts` |
| `whatYouMake` | NEW explicit line in strategy business-context (`What they make:`) — `whatItDoes` currently has NO reader; for manufacturer we DO feed it, since the one-liner alone under-specifies a maker | `promptsProduct.ts` manufacturer branch |

Client threads the manufacturer values into the **existing body keys**
(`categories`/`otherAudiences`/`features`) plus one new optional body key
(`whatYouMake`); route zod widens with `.optional()`. Prompt-side relabeling happens
in the manufacturer branch only — including the trailing framing paragraph
(`promptsProduct.ts:124-126`), which currently hardcodes a "Modern Tech" SaaS framing
into EVERY strategy prompt (see Phase 4 step 3b).

### D4 — Strategy-prompt signal threading
Copy prompt already branches (`voiceId==='tailored-trade'`). Strategy does not.
Thread an explicit `voiceId` into the strategy path:
`src/app/api/audience/product/strategy/route.ts` derives `voiceId` the same way
`generate-copy/route.ts:156` does (from `templateId` in the body — already sent),
passes it into `buildProductStrategyPrompt`. This respects the
`assertNoTemplateLeak` firewall (templateId itself never enters the prompt builder;
only the derived voice signal does), and mirrors the existing copy-route pattern.

### D5 — Golden Shadow v1 → **re-onboard fresh** (human gate)
Recommend re-onboarding (new token/project) over migrating the old-shape understanding:
extraction quality is the whole point of the fix, D2 keeps his old draft loadable
anyway, and his published v1 stays live untouched until v2 is approved + republished.
**User signs off on this at Gate C before pilot run.**

---

## Phases

> Onboarding step components live at
> `src/app/onboarding/product/[token]/components/steps/` (NOT `src/modules/onboarding/`).
> All Files-touched lists below use the real paths.

### Phase 1 — Types + goal enum + schemas + mocks (foundation; app compiles)

Everything type/schema-level lands first so later phases are pure wiring/UI.
**Behavior note:** adding `enquiry` to `landingGoals` + the 4 total Records makes
GoalStep render a 7th option to ALL product personas until Phase 3 gates it to
manufacturer. Harmless on the feature branch (never deploys in this state), but this
phase is NOT "zero behavior change" — the manufacturer-only gating lands in Phase 3.

**Steps**
1. `src/types/generation.ts` — add `'enquiry'` to `landingGoals`; add
   `landingGoalLabels.enquiry = 'Send enquiry'`. Extend `UnderstandingData`
   (~:295-300) with optional `whatYouMake?`, `industriesServed?: string[]`,
   `productCategories?: string[]`, `valueAdds?: string[]` (D2 — SaaS 4 stay required).
2. Add `isManufacturerFlow(templateId)` helper (D1) in a plain shared module
   (server+client safe — NOT in a `'use client'` file; e.g.
   `src/modules/audience/product/manufacturerFlow.ts`).
3. `src/lib/schemas/understand.schema.ts` — add a manufacturer response schema
   (mirroring `understandService.schema.ts` pattern) alongside
   `UnderstandingResponseSchema`; export both.
4. `src/lib/schemas/scrapeWebsite.schema.ts` — manufacturer variant of the extended
   scrape schema (`ScrapeWebsiteExtendedSchema` superset gains the 4 optional
   manufacturer keys, or a parallel manufacturer schema — implementer picks the
   smaller diff, but existing SaaS parse path must be untouched).
5. Fix the two total-Record TS breaks from the enum add:
   `src/app/onboarding/product/[token]/components/steps/GoalStep.tsx:15`
   (`goalIcons.enquiry`), `:24` (`goalDescriptions.enquiry`) — entries only, no
   branching yet (gating is Phase 3).
6. `copyPrompt.ts:107` — add `enquiry` entry to `getGoalCtaGuidance` map (CTA drives
   to on-page `contact` form: "Send enquiry / Request a quote" flavor).

**Files touched**
- `src/types/generation.ts`
- `src/modules/audience/product/manufacturerFlow.ts` (new)
- `src/lib/schemas/understand.schema.ts`
- `src/lib/schemas/scrapeWebsite.schema.ts`
- `src/app/onboarding/product/[token]/components/steps/GoalStep.tsx`
- `src/modules/audience/product/copyPrompt.ts`

**Verification**
- `npm run build` green (tsc catches any missed total-Record).
- `npm run test:run` green (scout: no test freezes product understanding shape or
  goal enum; `multiPageAssembly.test.ts` unaffected since `features` stays).

> **HUMAN GATE A — schema-change sign-off.** Spec flags field-schema change as
> blast-radius risk. User reviews the new field set + D2/D3 mapping before wiring
> proceeds.

---

### Phase 2 — Extraction: understand + scrape-website manufacturer branches

**Steps**
1. `src/app/api/v2/understand/route.ts` — accept manufacturer signal in body
   (client will send `templateId` — wired client-side in Phase 3 step 3; route
   derives via `isManufacturerFlow`, defaults to SaaS when absent). Branch:
   manufacturer prompt (new inline builder next to `buildUnderstandPrompt` ~:35-47)
   extracting `whatYouMake / industriesServed / productCategories / valueAdds` with
   explicit anti-synonym / anti-fluff instructions ("concrete product facts, no
   quality-platitudes; industries = end-customer verticals, not 'businesses'");
   parse with manufacturer schema; manufacturer mock (~:104-116); credits metadata
   (~:170-176) records which shape ran. Credits cost unchanged (1).
2. `src/app/api/v2/scrape-website/route.ts` — same branch: manufacturer variant of
   `buildScrapePrompt` (~:43-74) + manufacturer `MOCK_DATA` (~:76-98); SaaS path
   byte-identical.
3. Route body-schema widening (`templateId` optional) lands here so both routes are
   testable via curl before Phase 3 wires the clients. **Note:** the manufacturer
   branches are reachable only via curl until Phase 3 — the client fetch bodies
   don't carry `templateId` yet (UnderstandingStep sends `{ oneLiner }` only at
   `:145-149`).

**Files touched**
- `src/app/api/v2/understand/route.ts`
- `src/app/api/v2/scrape-website/route.ts`

**Verification**
- `npm run build` green.
- Mock mode: POST both routes with/without `templateId: 'vestria'` → SaaS shape
  unchanged; manufacturer shape returns 4 new keys.
- Real run (1 credit): `understand` + `scrape-website` against
  goldenshadowtrading.com → eyeball values concrete + non-redundant (acceptance
  criterion 3, first pass).

---

### Phase 3 — Onboarding UI: UnderstandingStep manufacturer fields + store + hydration + de-SaaS copy

**Steps**
1. `useProductGenerationStore.ts` — no type change needed beyond Phase 1
   (`understanding: UnderstandingData | null` already fits); verify
   `setUnderstanding` passes new keys through (it should — confirm, adjust if it
   picks fields). `setUnderstanding` (~:171) takes a FULL `UnderstandingData` —
   manufacturer writers must pad the SaaS fields (D2).
2. `UnderstandingStep.tsx` — branch on `isManufacturerFlow(templateId)` from store:
   - (a) manufacturer renders 4 blocks — WhatYouMake (Textarea), IndustriesServed
     (ChipEditor), ProductCategories (ChipEditor), ValueAdds (FeatureListEditor) —
     reusing the in-file primitives; manufacturer updaters. SaaS JSX path untouched.
   - (b) **manual `/understand` hydration wiring:** the fetch at `:145-149` sends
     `body: { oneLiner }` only — add `templateId` to the body so Phase 2's route
     branch actually runs; at the hydration site (`:154`), when manufacturer, write
     `whatYouMake / industriesServed / productCategories / valueAdds` from the
     response into `setUnderstanding`, padding `categories: [] / audiences: [] /
     whatItDoes: '' / features: []` (D2). Without this, Phase 2's manufacturer
     branch is dead code on the manual path.
   - (c) manufacturer `isValid` variant — must short-circuit BEFORE the SaaS
     `isValid` (`:191`), which reads `localEdits.categories.length` (padding to `[]`
     makes it safe, but keep the branch order anyway: manufacturer check first).
3. `OneLinerStep.tsx` — (a) hydration writer (~:110-115): when manufacturer, write
   the 4 new keys from scrape response into `setUnderstanding`, with the same D2
   padding of the 4 SaaS fields; (b) de-SaaS example/placeholder copy behind the
   same branch; (c) send `templateId` in the scrape request body. Optionally gate
   submit/import on `templateId` resolution (D1 race note — implementer's call).
4. `OfferStep.tsx` — de-SaaS placeholder/example copy behind the branch.
5. `GoalStep.tsx` — show `enquiry` option **only** for manufacturer flow (SaaS
   personas keep exactly 6 options → byte-for-byte acceptance criterion); entries
   from Phase 1 already satisfy TS.

**Files touched**
- `src/hooks/useProductGenerationStore.ts`
- `src/app/onboarding/product/[token]/components/steps/UnderstandingStep.tsx`
- `src/app/onboarding/product/[token]/components/steps/OneLinerStep.tsx`
- `src/app/onboarding/product/[token]/components/steps/OfferStep.tsx`
- `src/app/onboarding/product/[token]/components/steps/GoalStep.tsx`

**Verification**
- `npm run build` + `npm run test:run` green.
- Manual (`npm run dev`, mock AI): walk `/onboarding/product` as SaaS persona →
  identical to today (4 old fields, 6 goals, old copy). Walk as manufacturer →
  new 4 fields render, hydrate from BOTH paths (scrape import AND manual
  one-liner → understand), `enquiry` goal visible, de-SaaS copy.

---

### Phase 4 — Downstream generation wiring: strategy + copy consume manufacturer fields

**Steps**
1. `GeneratingStep.tsx` (~:217,339-340,366,536-537) + `SitemapReviewStep.tsx`
   (~:80,88,92-93) — when manufacturer, map per D3 into existing body keys:
   `categories ← productCategories`, `otherAudiences ← industriesServed`,
   `features ← valueAdds`; add `whatYouMake` to strategy body. SaaS path passes old
   fields exactly as today.
2. `src/app/api/audience/product/strategy/route.ts` — widen zod: `whatYouMake`
   optional; derive `voiceId` from body `templateId` (same derivation as
   `generate-copy/route.ts:156`, via `isManufacturerFlow`); pass `voiceId` +
   `whatYouMake` into `buildProductStrategyPrompt` (D4). Firewall intact —
   templateId never enters the prompt builder.
3. `promptsProduct.ts` — accept `voiceId`/`isTrade` + `whatYouMake`; in manufacturer
   branch:
   - (a) relabel `Categories:` → keep (fed by productCategories),
     `Other audiences:` → `Industries served:`, and emit `What they make:` line.
   - (b) **branch the trailing framing paragraph at `:124-126`** — currently emits
     into EVERY strategy prompt: *"This strategy drives downstream copy generation
     for a 'Modern Tech' product page — confident, precise, builder-to-builder, no
     hype."* When `isTrade`, replace with a tailored-trade framing (manufacturer /
     trade-supplier page — concrete, capability-led, enquiry-driven, no startup
     hype). SaaS output stays BYTE-IDENTICAL, including this paragraph. Without
     this, acceptance criterion 4 (no SaaS labels in the manufacturer prompt) fails.
4. `copyPrompt.ts` — in existing `isTrade` branch (~:188,343-344), relabel the
   features block "Value-adds / USPs (raw, from the founder)". Content already
   arrives remapped from step 1; no new plumbing.
5. New unit test `src/modules/audience/product/promptBranch.test.ts` (Vitest,
   mirrors existing golden/contract test patterns): call
   `buildProductStrategyPrompt` and `buildProductCopyPrompt` with SaaS vs
   manufacturer fixtures; assert (i) SaaS output byte-identical to a frozen
   baseline snapshot (captured from pre-branch builder output), (ii) manufacturer
   output contains `What they make:` / `Industries served:` / value-adds label /
   trade framing and NO SaaS labels ("Modern Tech", `Other audiences:`, etc.).

**Files touched**
- `src/app/onboarding/product/[token]/components/steps/GeneratingStep.tsx`
- `src/app/onboarding/product/[token]/components/steps/SitemapReviewStep.tsx`
- `src/app/api/audience/product/strategy/route.ts`
- `src/modules/audience/product/strategy/promptsProduct.ts`
- `src/modules/audience/product/copyPrompt.ts`
- `src/modules/audience/product/promptBranch.test.ts` (new)

**Verification**
- `npm run build` + `npm run test:run` green (incl. new `promptBranch.test.ts`,
  generation-contract + multiPageAssembly — service-only/`features`-reading,
  expected unaffected).
- Primary check = the snapshot test from step 5. (A `DEBUG_AI_PROMPTS` byte-diff is
  NOT usable here: both routes short-circuit to mocks BEFORE prompt build
  (`strategy/route.ts` ~:84-99 before :105; generate-copy likewise), so mock mode
  logs no prompts and a real diff would spend credits. The unit test exercises the
  builders directly.)

---

### Phase 5 — Pilot: Golden Shadow re-onboard + end-to-end acceptance

> **HUMAN GATE B — Golden Shadow migration decision.** Confirm D5 (re-onboard fresh,
> old draft/published v1 untouched) before running. If user prefers in-place
> regeneration instead, revisit here.

**Steps**
1. Re-onboard Golden Shadow (real LLM, real scrape of goldenshadowtrading.com):
   manufacturer persona → vestria → new field set → `enquiry` goal → generate.
2. Verify enquiry CTA drives to the vestria `contact` MVPForm on the generated page
   (editor + preview).
3. Editor↔published parity spot-check for touched flows (no block edits in this
   feature, so expected clean — but publish preview once to confirm; dual-renderer
   landmine check).
4. Regression walk of one SaaS-persona onboarding end-to-end (mock LLM fine).
5. Compare v2 copy vs live v1 — the spec's decision gate: user/customer accept?

**Files touched**
- None (verification-only phase; any fixes found go back through the owning phase's
  file list as follow-up commits on the branch).

**Verification**
- Acceptance criteria checklist from spec, all 7 boxes.
- `npm run build` + `npm run test:run` final green on branch.

> **HUMAN GATE C — merge to main + push (deploy).** Plain merge, user pushes;
> deploy-watcher confirms green; then republish Golden Shadow v2.

---

## Phase → gate summary

| Phase | Gate |
|---|---|
| 1 Types/schemas/mocks | **Gate A** after (schema sign-off) |
| 2 Extraction routes | — |
| 3 Onboarding UI | — |
| 4 Prompt wiring | — |
| 5 Pilot | **Gate B** before (migration decision) · **Gate C** after (merge/deploy) |

## Unresolved questions
1. D5 OK — re-onboard Golden Shadow fresh (new token), keep v1 live till v2 approved?
2. Relabel `Other audiences:` → `Industries served:` in manufacturer strategy prompt, or keep label + just swap data?
3. `whatYouMake` feed strategy only (planned), or also copy prompt?
4. Gate OneLinerStep submit on persona/templateId resolution (race hardening), or accept the window?
