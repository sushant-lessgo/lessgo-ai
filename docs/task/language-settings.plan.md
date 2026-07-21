# language-settings — implementation plan (rev 3, post plan-review round 2)

- **WORKDIR**: `C:\Users\susha\lessgo-ai\.claude\worktrees\language-settings`
- **BRANCH**: `feature/language-settings` (verified; subagents hard-stop on mismatch)
- **Tier**: **full** — escalated from `standard` by the orchestrator because the feature
  touches the publish path, the published-asset immutability contract (`switcher.v1.js`
  freeze → `switcher.v2.js`), and the `/p/{slug}` SSR renderer. Full plan-review loop +
  per-phase implement/impl-review loops apply.
- Inputs: `docs/task/language-settings.spec.md` (founder-signed) +
  `docs/task/language-settings.scout.md` (authoritative; supersedes the spec's stale
  onboarding description and its wrong `voice.ts` pointer). The scout doc's three
  orchestrator rulings are IMPLEMENTED here, not re-opened.

## ⛔ ORCHESTRATOR AMENDMENT A1 (2026-07-21) — MANDATORY, read before phase 3

**Status of the review loop:** round-3 plan-review never returned a verdict — the agent died
on an account weekly rate limit, not on findings. The orchestrator therefore verified the
single highest-risk claim of rev 3 by hand and found a **blocking defect**. Rev 3 is
otherwise approved-in-substance (rounds 1+2 blockers were independently verified as fixed);
this amendment is the only outstanding correction.

**Defect: the seam does NOT bind at every call site — 3 of 7 bypass the payload builders.**

Rev 3 assumes all generation requests flow through `buildStrategyPayload` /
`buildCopyPayload`. They do not. Verified in the worktree:

| Call site | Route | Body |
|---|---|---|
| `thing.ts:390` | product/strategy | `buildStrategyPayload(input)` ✅ |
| `thing.ts:701` | product/generate-copy | `buildCopyPayload(input, strategy)` ✅ |
| **`thing.ts:493`** | product/generate-copy | **inline `JSON.stringify({…})`** ❌ multi-page fan-out |
| **`thing.ts:584`** | product/generate-copy | **inline `JSON.stringify({…})`** ❌ collection-item fan-out (`generateItemCopy`) |
| `trust.ts:328` | service/strategy | `buildStrategyPayload(input)` ✅ |
| `trust.ts:400` | service/generate-copy | `buildCopyPayload(input, strategy)` ✅ |
| **`trust.ts:464`** | service/generate-copy | **inline `JSON.stringify({…})`** ❌ collection-item fan-out (`generateItemCopy`) |

**Consequence if unfixed:** a Dutch site generates its root page in Dutch and every
sub-page + every CMS collection item in English — a half-translated site, which is a worse
failure than the "picked English, got Dutch" bug this spec exists to fix. The planned
phase-3 `payloadLanguage.test.ts` would pass (it pins the builders) while the fan-out paths
ship dead. This is the round-2 blocker recurring in a new costume, which is precisely what
the round-3 review was asked to check for.

**Required changes (phase 3, extending its existing `thing.ts`/`trust.ts` ownership):**

1. Add the `language` field to **all three inline bodies** (`thing.ts:493`, `thing.ts:584`,
   `trust.ts:464`), sourced identically to the builders. Preferred: extract the shared
   language resolution into one local helper in each file and call it from all four sites,
   so a future fan-out path cannot silently omit it.
2. `payloadLanguage.test.ts` must assert **every call site**, not just the builders — spy on
   `fetch` and assert that each of the 7 requests carries the expected `language`. A test
   that only exercises the two builders is inert against this defect and must not be
   written that way.
3. Reviewer assertion for phase 3: grep `body: JSON.stringify` in `thing.ts` + `trust.ts`
   and confirm **every** audience-route request body includes `language`. Zero exceptions.

**Also re-check (not orchestrator-verified, rev 3 was written with few tool calls):** the
other rev-3 pointers — `renderPublishedRoot.tsx` extraction shape, `htmlGenerator.ts`
reading `params.localeConfig.switcherStyle`, the `<html lang>` re-point at both
`renderPublishedExport.ts:229` and `:328`, and the work-engine save sites
(`work.ts:150/:170/:267`, `work.llm.ts:234`). The implementer must verify each against the
tree before relying on it and record any correction in the audit.

## Revision note (rev 3 — orchestrator re-keying)

Round-2 review: 1 blocking (phase 4's server-side Project read had **no token to bind to**
— the audience routes carry no `tokenId` and the wizard callers send no Authorization
header, so `prisma.project.findUnique` had no key and first-gen would ALWAYS have fallen
back to English) + 9 non-blocking notes. All folded. **No phase added/removed/reordered
(still 7, same titles)** — orchestrator re-key needed only for Files-touched membership:

1. **BLOCKER — seam (b) per orchestrator ruling (new ruling 11)**: the wizard sends the
   resolved locale CODE in the strategy/copy payloads; the four audience routes accept an
   optional `language` field, validate it against `SUPPORTED_LOCALES` server-side, fall
   back to `'en'` on absent/invalid, and map via `toPromptLanguage`. NO prisma import /
   DB read in the audience routes (the tokenId/prisma variant is explicitly NOT
   implemented). Regen unchanged — `scopedRegen` genuinely has the Project row and keeps
   server-reading `defaultLocale`. Payload-builder edits land in **phase 3** (already owns
   `thing.ts`/`trust.ts`); route + prompt consumption stays **phase 4**. Route tests now
   assert the BOUND path (request `nl` ⇒ Dutch directive in the built prompt; garbage ⇒
   `en` fallback), not mocked-content shapes; the planned `@/lib/prisma` route mocks are
   dropped.
2. Non-blocking folds: `applyLocaleOverlay` wrapper DROPPED (SSR calls the shared
   `resolveLocaleElements` directly; `renderPublishedExport.ts` removed from phase 6
   Files touched — it stays in phase 5); no parallel `switcherStyle` param
   (`generateStaticHTML` already receives the whole `localeConfig` at
   `renderPublishedExport.ts:230/:329/:487` — htmlGenerator reads
   `localeConfig.switcherStyle` internally); locale-root SSR renders via a NEW shared
   root-render helper extracted from `p/[slug]/page.tsx:120-204` (no ~50-line copy);
   inert assertion `i18nStaticExport.test.ts:224` fixed in the phase-5 pass; `<html lang>`
   re-point applied to BOTH `:229` (root) and `:328` (subpages); product RULES numbering
   collision avoided (language rule appended unnumbered/bold — `accentRule` hardcodes
   `1.` and `5. Pricing` follows); `persistSiteLanguage` stepIndex caveat added (saveDraft
   route rebuilds `content.onboarding` with `stepIndex=0` — implementer confirms nothing
   resumes off it, else sends the current step); work save sites enumerated (FOUR:
   `work.ts:150,:170,:267` + `work.llm.ts:234` — all four spread the patch);
   `fit.ts:32,:61` `switcher.v1.js` comment drift added to the phase-7 sweep.
3. Open risks updated: the obsolete "route auth/demo variance ⇒ English fallback" risk is
   replaced by the ruling-11 rationale + the residual persist-failure/regen risk.

## Revision note (rev 2 — retained; verified fixed in round 2, do not re-open)

Round-1 blockers, all landed and reviewer-verified: phase-6 publish persistence of
`localeConfig`/`localeContent` onto `PublishedPage.content` + verify-dns regen fix;
corrected Files-touched lists (phase 1 `types/store/actions.ts`, phase 4 route tests,
inert firewall test dropped, phase 5 breaking i18n tests named); ruling 10
drop-to-single-locale preservation (+ six-reader audit); `LOCALE_ENGLISH_NAMES` exonym
prompt contract (ruling 3). Non-blocking folds and the 4 orchestrator-ruled open
questions also landed (greyed Auto-translate, `{n} translated fields` subline,
`SUPPORTED_LOCALES` stays closed, real-LLM check = founder QA at merge gate).

## Overview

Surface the shipped i18n Phase-1 engine into Site Settings (designer's Languages panel in
`SeoSettingsModal`), retire the header globe (`LocaleSettings`) while keeping the
`LanguageToggle` pill group, give every project an onboarding-set `defaultLocale`, and make
product/service generation (first-gen + regen) honor that language with an explicit
output-language directive. Add a `switcherStyle` (Dropdown/None) control, ship
`switcher.v2.js` (v1 frozen) so the published switcher works on the `/p/{slug}` path, persist
the locale declaration onto `PublishedPage` and add real locale awareness + switcher injection
to the `/p` SSR renderer. Auto-translate and change-site-language ship greyed via `<Coming>`
(Spec-2 placeholders).

## Progress log

- phase 1 locale contracts + store actions: done (commit pending-sha, review loops 1, VERDICT ship)
  - carries into phase 2: keep the DEFAULT locale non-removable in `LanguagesPanel`
    (`i18nActions.ts:74-91` clears a non-English site's config if its default is removed —
    unreachable today only because the picker excludes it; a `if (code === cfg.defaultLocale) return;`
    guard would make it self-enforcing)
  - carries into phase 3: `labelToLocaleCode()` accepts LABELS only and returns `null` for bare
    codes (`'nl'` → null) — respect this when mapping the work engine's `facts.languages[0]`
  - note: store-action signatures went on `MetaActions` (not `ContentActions`) — plan pointer was
    impossible; precedent `actions.ts:442-448`. No type-checked caller until phase 2.
- phase 2 Languages panel in Site Settings + retire globe: pending
- phase 3 onboarding site-language capture: pending
- phase 4 generation output-language directive: pending
- phase 5 switcher.v2 asset + publish emission: pending
- phase 6 publish persistence + /p SSR locale awareness + e2e: pending
- phase 7 docs + acceptance sweep: pending

## Load-bearing design rulings (the sharp edges, decided up front)

1. **`LocaleSettings` local closures → real store actions.** `addLocale`/`removeLocale`
   currently live as component closures calling `api.setState` directly (LocaleSettings.tsx
   L69-128) and are duplicated-by-simulation in `i18nStoreState.test.ts:324,357`. We
   **extract them into store actions** (`addLocale`, `removeLocale`, `setSwitcherStyle` in a
   new `src/hooks/editStore/i18nActions.ts`), because (a) the new `LanguagesPanel` and any
   future caller need them, (b) the test simulation drift-risk goes away (tests call the real
   actions), (c) the engaged/isDirty/flush choreography is invariant-bearing and belongs in
   one place. The `confirmDialog` stays in the UI layer; actions are confirmation-free.
   **`addLocale` moves verbatim; `removeLocale` does NOT — its drop-to-single branch changes
   per ruling 10.**
2. **Language directive is ALWAYS emitted** (resolves to `en` when no language is known).
   The "picked English got Dutch" root cause is the model inferring language from a
   non-English one-liner — an explicit English directive is the fix, so gating the directive
   on non-en would un-fix the reported bug. The **zero-diff regression contract covers
   storage and rendered output, not prompt text**. Consequence: `promptBranch.test.ts`
   (asserts prompt text) WILL break and is updated in phase 4; the product audience route
   tests gain language-field cases in the same phase (no prisma mocks — see ruling 11).
3. **Prompt language value = English exonym, defined in ONE place.** Two name maps, distinct
   jobs: `LOCALE_DISPLAY_NAMES` (native — `Nederlands`, `日本語`) stays UI-only; a NEW
   `LOCALE_ENGLISH_NAMES` map in `localeNames.ts` (`'en'→'English'`, `'nl'→'Dutch'`,
   `'de'→'German'`, … all 12 `SUPPORTED_LOCALES`) feeds prompts.
   `toPromptLanguage(code) = LOCALE_ENGLISH_NAMES[code] ?? code`. Rationale: the mirrored
   work-engine wording (`work/copyPrompt.ts:213-219`) interpolates the value into English
   instructions ("no English fragments (unless ${language} IS English)") — native names would
   read "unless Nederlands IS English"; work's existing labels are English exonyms already
   (`'Dutch'`). On `assertNoTemplateLeak` (`product/promptFirewall.ts:8-20`): it checks only
   for the KEYS `templateId`/`variantId`, so a `language` value cannot trip it — safe by
   construction, and **no firewall test is added** (it could never fail = inert assertion;
   documented project lesson).
4. **Work regen reconciliation** (`scopedRegen.ts:669` re-derives from
   `facts.languages[0]`): rule = **`content.localeConfig.defaultLocale` wins when present**
   (durable, user-declared, editable in Settings later); `facts.languages[0]` label is the
   fallback for legacy work projects with no config. Rationale: facts are onboarding-time raw
   input; localeConfig is the site's current declared language.
5. **Label→code map** (work's `languages` question stores human labels like `'English'`):
   new `LOCALE_LABEL_TO_CODE` in a **plain module** `src/lib/i18n/localeNames.ts` (the
   existing `LOCALE_DISPLAY_NAMES` lives in `'use client'` `LanguageToggle.tsx` — server
   prompt builders may NOT import it; published/client boundary). Display map moves to the
   plain module; `LanguageToggle` re-exports for back-compat. Unmapped custom labels
   (e.g. `'Hindi'` — `hi` not in `SUPPORTED_LOCALES`) → **no localeConfig write** (copy still
   generated in that language via the work prompt path, which consumes the label directly);
   logged, listed as a known limit.
6. **`switcherStyle: 'none'` ALSO suppresses the geo auto-redirect. Yes.** "None" must mean
   "no automatic locale behavior at all": a page that silently geo-redirects while offering
   no visible switcher is a support trap (visitor stuck in the wrong language with no way
   back). Implementation: `htmlGenerator` omits the ENTIRE switcher block (config + script)
   when style is `none` (hreflang/canonical stay — SEO is unaffected by widget style), plus a
   defense-in-depth early-return in `switcher.v2.js` on `cfg.style === 'none'`.
7. **Zero-diff contract, enumerated**: legacy/monolingual project (localeConfig `null`,
   never engaged) ⇒ saveDraft is **never called** with a `localeConfig` key by onboarding
   (call absence, not just key absence — `api/saveDraft/route.ts:159-180` rebuilds
   `content.onboarding` on every call, so an extra call is NOT a no-op); the editor's save
   payload omits `localeConfig` (existing `persistenceActions.ts:379-383` branch, unchanged);
   no `switcherStyle` key ever materializes (it lives INSIDE `LocaleConfig`, so null config ⇒
   no field); `PublishedPage.content` gains NO new keys (phase-6 persistence is
   presence-gated); published HTML byte-identical (all new emission gated on `localeConfig`
   presence); `/p` SSR unchanged (locale branch gated on multi-locale config).
   `switcherStyle` absent ⇒ behaves exactly like `'dropdown'` (today's behavior).
8. **Uniform-journey collision avoidance**: zero edits under
   `src/components/onboarding/journey/engines/*`, no new `wizardSlots` member, no
   `inputContracts.ts` edit, no `modules/wizard/work/rail.ts` edit. The onboarding picker is
   UI inside `IdentitySlot.tsx` (a thin, engine-agnostic wrapper) + a `useWizardStore` field;
   work derives language from its EXISTING `languages` question inside the generation
   drivers. **Orchestrator: notify the uniform-journey track at launch of phase 3 (shared
   onboarding seam — E2/E3 lesson), not via async mailbox.**
9. **Rulings honored as given**: keep `LanguageToggle` (it already IS the
   "compact multi-locale-only chip"; only `setActiveLocale` UI — removing it would orphan
   `activeLocale`); retire only `LocaleSettings`; build NO new editing indicator and NO
   per-language Edit button. Spec-1 ships no translate call; change-site-language +
   auto-translate are greyed `<Coming>` placeholders. `activeLocale` regen-lock
   (`EditHeaderRightPanel.tsx:109`) untouched.
10. **Drop-to-single-locale PRESERVES a non-English site language.** After phase 3,
    `localeConfig` is the ONLY durable record of a non-English site language
    (`{locales:['nl'], defaultLocale:'nl'}` is a legitimate SINGLE-locale config —
    **non-null no longer implies multi-locale**; `isMultiLocale()` remains the gate for all
    multi-locale UI/publish surfaces). The old `removeLocale` behavior
    (`LocaleSettings.tsx:110-115`: remaining ≤ 1 ⇒ `localeConfig = null`) would destroy it:
    Dutch project adds English, removes it → null → load re-derives `activeLocale='en'`
    (`persistenceActions.ts:467-468`) → regen reads no locale → directive `'English'` →
    the site regenerates into the exact bug this spec fixes. New contract: when the
    remaining locale `def === localeConfig.defaultLocale`, keep
    `{locales:[def], defaultLocale:def}` (retain `switcherStyle` if set — harmless, every
    consumer is `isMultiLocale`-gated) **unless `def === 'en'`**, in which case clear to
    `null` (English default = the platform default; null keeps legacy zero-diff).
    **Reader audit (all six sites verified safe, NO edits)**: `aiActions.ts:67`,
    `generationActions.ts:134`, `contentActions.ts:25`, `historyHelpers.ts:106`,
    `uiActions.ts:682,:784` all read `localeConfig?.defaultLocale ?? 'en'` — with a preserved
    single-`nl` config they yield `'nl'`, and on load `activeLocale` re-derives to the
    default (`persistenceActions.ts:467-468`), so `activeLocale === def` everywhere ⇒
    identical behavior (base writes, regen unblocked), now with the CORRECT language on
    record. Phase-1 tests pin this.
11. **First-gen language rides the REQUEST, validated server-side (orchestrator ruling,
    round 2).** The four audience routes have no `tokenId` to bind a Project read to
    (request schemas carry none — `product/generate-copy/route.ts:85-128`,
    `product/strategy/route.ts:119`, `service/generate-copy/route.ts:90-131`; the only
    Bearer parse at `:174-176` exists solely for the `DEMO_TOKEN` compare) and the wizard
    callers send no Authorization header (`thing.ts:387-393` etc.). So: the wizard — which
    ALREADY knows the language (phase 3) — sends the resolved ISO code in the
    strategy/copy payloads; each route accepts an optional `language` string, validates it
    against `SUPPORTED_LOCALES`, **falls back to `'en'` on absent/invalid** (lenient — never
    a 400 over language), then maps via `toPromptLanguage`. An unrecognized code never
    reaches a prompt. **Rationale (recorded)**: language is a *prompt input*, not an authz
    input — the worst a forged value does is generate the user's OWN page in another
    language, already possible from the UI. In exchange we (i) keep prisma OUT of four hot
    generation routes, (ii) avoid the `@/lib/prisma` route-test mocking problem entirely,
    (iii) gain robustness on the headline acceptance: if the phase-3 `localeConfig` persist
    fails, first-gen STILL receives the right language (a server-read seam would silently
    fall back to English). **Regen is unchanged**: `scopedRegen` genuinely holds the Project
    row and keeps server-reading `content.localeConfig.defaultLocale`. Both paths derive
    from the same wizard state, so they agree.

---

## Phase 1 — locale contracts + store actions

Foundation: server-safe locale-name module, `switcherStyle` on the data contract, and the
extraction of locale mutators into real store actions (with the ruling-10 drop-to-single
contract). No UI change; tree stays green and byte-identical for legacy projects.

**Steps**
1. Create `src/lib/i18n/localeNames.ts` (plain module, no `'use client'`):
   - move `LOCALE_DISPLAY_NAMES` + `localeLabel()` here (verbatim values from
     `LanguageToggle.tsx:17-34` — native names, UI-only);
   - add `LOCALE_ENGLISH_NAMES: Record<string,string>` — English exonyms for all 12
     `SUPPORTED_LOCALES` (`'en'→'English'`, `'nl'→'Dutch'`, `'de'→'German'`, `'ja'→'Japanese'`, …);
   - add `toPromptLanguage(code): string` = `LOCALE_ENGLISH_NAMES[code] ?? code` (ruling 3);
   - add `LOCALE_LABEL_TO_CODE: Record<string,string>` covering every value of BOTH name maps
     (native + English exonyms → code) and `labelToLocaleCode(label): string | null`
     (trim/case-insensitive; null for unmapped).
2. `LanguageToggle.tsx`: import from `localeNames.ts` and **re-export**
   `LOCALE_DISPLAY_NAMES`/`localeLabel` so `LocaleSettings.tsx` (dies in phase 2) and any
   other importer keep compiling this phase.
3. `src/types/core/content.ts`: add optional `switcherStyle?: 'dropdown' | 'none'` to
   `LocaleConfig` (doc comment: absent ⇒ `'dropdown'` ⇒ today's behavior; publish-layer
   only). Also document ruling 10 on the type: a single-locale config is legal and means
   "declared non-English site language"; non-null ≠ multi-locale; gate multi-locale behavior
   on `isMultiLocale()`.
4. `src/lib/validation.ts` (`DraftSaveSchema.localeConfig`, L60-66): add
   `switcherStyle: z.enum(['dropdown','none']).optional()` to the object branch. Wholesale
   replace/clear semantics unchanged; no route edits needed (`saveDraft` route + store
   `persistenceActions.ts:379-383` already ship the whole object).
5. New `src/hooks/editStore/i18nActions.ts`: `addLocale(code)` (VERBATIM move from
   `LocaleSettings.tsx:69-89`: first-declaration seeding, `localeEngaged = true`,
   `persistence.isDirty = true`, `triggerAutoSave()`); `removeLocale(code)` (moved from
   `:91-128` with ONE deliberate change — the drop-to-single branch implements ruling 10:
   remaining default `'en'` ⇒ `localeConfig = null` as today; remaining default ≠ `'en'` ⇒
   `localeConfig = {locales:[def], defaultLocale:def}` preserving `switcherStyle` if set;
   overlay drop + `activeLocale` reset + engaged/isDirty/flush choreography unchanged);
   `setSwitcherStyle(style)` — no-op when `localeConfig` is null (nothing to hang it on;
   guard preserves zero-diff). Wire into the store factory `src/stores/editStore.ts`;
   declare action signatures in `src/types/store/actions.ts` (next to `setActiveLocale`
   at `:111` — NOT `state.ts`, which is data-only and needs no change).
6. Tests:
   - `src/hooks/editStore/i18nStoreState.test.ts` — replace the simulated closures
     (`:324,:357` region) with the REAL store actions; add: `setSwitcherStyle` round-trip;
     null-config `setSwitcherStyle` no-op; **ruling-10 pins**: en-default `removeLocale`
     drop-to-single ⇒ `localeConfig === null` + engaged save sends explicit `null` (existing
     `:323` contract, now via the real action); nl-default drop-to-single ⇒ config preserved
     as `{locales:['nl'], defaultLocale:'nl'}` AND the save payload carries it; a declared
     single-`nl` store routes `updateElementContent` writes to BASE (activeLocale === default
     ⇒ no overlay — proves the six audited readers stay correct); save-payload zero-diff
     (never-engaged store omits `localeConfig`; engaged config without `switcherStyle`
     serializes without the key).
   - New `src/lib/i18n/localeNames.test.ts` — label→code mapping (native labels, English
     exonyms, case/whitespace, unmapped→null), `toPromptLanguage('nl') === 'Dutch'` +
     fallback-to-code for unknown, and parity: every `SUPPORTED_LOCALES` code has BOTH a
     display name and an English name.

**Files touched**
- `src/lib/i18n/localeNames.ts` (new)
- `src/lib/i18n/localeNames.test.ts` (new)
- `src/app/edit/[token]/components/editor/LanguageToggle.tsx`
- `src/types/core/content.ts`
- `src/lib/validation.ts`
- `src/hooks/editStore/i18nActions.ts` (new)
- `src/stores/editStore.ts`
- `src/types/store/actions.ts`
- `src/hooks/editStore/i18nStoreState.test.ts`

**Verification**
- `npx tsc --noEmit`
- `npm run test:run -- src/hooks/editStore/i18nStoreState.test.ts src/lib/i18n`
- `npm run test:run` (full — validation/persistence suites must stay green)
- Reviewer asserts: `addLocale` is a verbatim move; `removeLocale` deviates ONLY in the
  drop-to-single branch (ruling 10) and both branches are test-pinned; NO edits landed in
  the six audited reader files (`aiActions`/`generationActions`/`contentActions`/
  `historyHelpers`/`uiActions`); `localeNames.ts` has no `'use client'` and imports nothing
  client-side; zod object branch still `.nullable().optional()`; zero-diff tests assert key
  ABSENCE (not just falsiness); prompt-name map is English exonyms, display map stays native.

---

## Phase 2 — Languages panel in Site Settings + retire the globe  ⛔ HUMAN GATE

Designer's Languages pane inside `SeoSettingsModal` (rail: Domain / SEO / Social /
**Languages**), monolingual ungated; header globe removed; `LanguageToggle` kept.

**Steps**
1. New `src/app/edit/[token]/components/ui/LanguagesPanel.tsx` (client), per the handoff
   (`docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/Lessgo Editor Redesign.dc.html`
   §LANGUAGES L691-719), built from in-file primitives (`FIELD`/`LABEL`/`EYEBROW` consts
   passed or duplicated per SeoSettingsModal conventions, `Coming`, `AppIcon`, `cn`,
   `confirmDialog`):
   - **No `isMultiLocale` gate** — a monolingual project sees its single default-locale card
     + "+ Add language". Store reads via `useEditStore` selectors; mutations via the phase-1
     actions (`useEditStoreApi().getState().addLocale/…`). No local save UI (auto-save flushes
     on modal close — existing `handleClose`).
   - Left col: eyebrow `LANGUAGES`; one card per declared locale (26px mono code +
     `localeLabel` name). Default card = sunken bg + blue `Default` pill + **greyed
     change-site-language affordance** wrapped in `<Coming what="changing the site language">`
     (orchestrator-ruled: ship greyed; spec acceptance: visibly greyed, not missing).
     Non-default card = subline "`{n} translated fields`" (count from `localeContent[loc]`
     overlay keys; `0 translated fields` when empty — orchestrator-approved deviation from
     the mock's Spec-2 "Auto-translated · 3 edits") + `more_horiz` overflow with **Remove**
     (reuses `confirmDialog`, destructive copy carried over from LocaleSettings; ruling-10
     semantics — removing the last non-default locale on a Dutch-default site KEEPS the
     Dutch declaration). Dashed full-width `+ Add language` → list of addable
     `SUPPORTED_LOCALES` (minus declared/default) with display names.
   - Right col: **Auto-translate** row (title + "New copy, via AI" sub + Switch drawn OFF)
     wrapped in `<Coming what="auto-translate">` — greyed, `aria-disabled`, tooltip
     (orchestrator-ruled deviation from the mock, which draws it live/ON; per spec decision
     5). Below: `Switcher style` 2-up segmented control `Dropdown | None` (small local
     component — no shared primitive exists) → `setSwitcherStyle`; **disabled with a
     why-tooltip when single-locale** (no published switcher exists to style;
     greyed-placeholder rule).
2. `SeoSettingsModal.tsx`:
   - delete stale "NO Languages row" ruling comments (file header L16-17 + rail comment
     L383-385);
   - **icon collision fix**: the greyed Domain row currently uses `AppIcon name="language"`
     (L399) — the handoff wants `language` on the Languages row. Domain row switches to
     Material Symbols `public` (globe); Languages takes `language`. Deviation recorded for
     the phase-2 gate.
   - add `const [section, setSection] = React.useState<'seo'|'languages'>('seo')`; rail rows
     become `active={section===…}` + `onClick` (Domain stays `<Coming>`; Social keeps its
     close-and-dispatch behavior); add the **Languages** `NavItem` (icon `language`, mono
     count badge = `localeConfig?.locales.length ?? 1`, blue when active per handoff);
   - branch the pane on `section` **BEFORE the `!page` "No pages found" guard at L420** (and
     before the `isRoot` branch) — Languages is site-level and must be reachable on a
     page-less project; window header reads `Site settings · Languages` when active.
3. `layout/EditHeader.tsx`: remove the `LocaleSettings` import (:45) and mount (:88) + its
   stale comments (:20-24, :49-50). `<LanguageToggle />` at :87 stays.
4. **Delete** `src/app/edit/[token]/components/editor/LocaleSettings.tsx` (logic now lives
   in i18nActions + LanguagesPanel).
5. `editor/localeControls.visibility.test.tsx`: rewrite — assert NO globe in the header at
   any locale state; `LanguageToggle` still multi-locale-gated.
6. `src/components/ui/coming.tsx`: fix the stale doc comment (L26-29) listing "Languages"
   as never-grey. `components/DebugPanel.tsx:152` mention-only comment updated.
7. New `src/app/edit/[token]/components/ui/languagesPanel.test.tsx` (vitest/jsdom):
   monolingual project can add a language (gate removed — the headline acceptance);
   **round-trip per ruling 10**: en-default add→remove ⇒ `localeConfig === null`; nl-default
   add(en)→remove(en) ⇒ `{locales:['nl'], defaultLocale:'nl'}` survives (the declared
   language is NOT lost); auto-translate + change-language render greyed with
   `aria-disabled` (greyed, present, non-functional); switcher segmented control disabled
   when single-locale, writes `switcherStyle` when multi-locale; panel reachable when the
   project has no pages.

**Files touched**
- `src/app/edit/[token]/components/ui/LanguagesPanel.tsx` (new)
- `src/app/edit/[token]/components/ui/languagesPanel.test.tsx` (new)
- `src/app/edit/[token]/components/ui/SeoSettingsModal.tsx`
- `src/app/edit/[token]/components/layout/EditHeader.tsx`
- `src/app/edit/[token]/components/editor/LocaleSettings.tsx` (deleted)
- `src/app/edit/[token]/components/editor/localeControls.visibility.test.tsx`
- `src/components/ui/coming.tsx`
- `src/app/edit/[token]/components/DebugPanel.tsx`

**Verification**
- `npx tsc --noEmit` · `npm run test:run`
- Manual (`npm run dev`): fresh monolingual project → Site Settings → Languages: add `nl`
  → `LanguageToggle` pills appear in header; no globe anywhere; nested `confirmDialog`
  portal renders ABOVE the settings Dialog (z-index/focus-trap check); modal close flushes
  auto-save and config survives reload.
- Reviewer asserts: no `isMultiLocale` gate in the panel; zero remaining imports of
  `LocaleSettings`; store writes only via phase-1 actions (no `api.setState` recipes in the
  panel); `Coming` used (not omission, not a fake toggle); Languages branch precedes the
  `!page` guard; Domain no longer uses the `language` icon.
- **HUMAN GATE: founder signs off the panel against the designer handoff** (layout, rail
  badge, card states, the three documented deviations: greyed Auto-translate, the
  `{n} translated fields` subline, the Domain-row icon swap) before phase 3 starts.

---

## Phase 3 — onboarding site-language capture (+ language on the generation payloads)

Explicit site-language picker for thing/trust (orchestrator ruling: explicit control, no
new step, no inference); work derives from its existing `languages` question. Two durable
outputs: (a) `localeConfig` persisted for regen/Settings, (b) **the resolved locale code
rides the strategy/copy request payloads** (ruling 11 — this phase owns `thing.ts`/`trust.ts`,
so the payload-builder edits land HERE; phase 4 consumes the field server-side).

**Steps**
1. `src/hooks/useWizardStore.ts`: add `siteLanguage: string` (default `'en'`) +
   `setSiteLanguage`, and a `persistSiteLanguage()` action that calls the existing client
   `saveDraft` helper (`src/modules/wizard/generation/finalize.ts:175`) with:
   - pick ≠ `'en'` → `{ tokenId, localeConfig: { locales: [code], defaultLocale: code } }`
     (single-locale declared config — legal per ruling 10; `isMultiLocale` false ⇒ no
     switcher/toggle side effects);
   - pick back to `'en'` after a prior non-en save → `{ tokenId, localeConfig: null }`
     (explicit clear per the route's clear contract);
   - `'en'` never-saved → **no call at all** (zero-diff — `api/saveDraft/route.ts:159-180`
     rebuilds `content.onboarding` from schema defaults on EVERY call, so even an "empty"
     call mutates the row; call absence is the contract).
   - **stepIndex caveat (round-2 note 7)**: that same rebuild path sets
     `onboarding.stepIndex = 0` on a minimal body. Implementer MUST confirm nothing resumes
     off `content.onboarding.stepIndex` mid-wizard; if anything does, `persistSiteLanguage`
     sends the current step alongside. Record the finding in the phase audit.
2. `src/components/onboarding/wizard/IdentitySlot.tsx`: add a compact "Site language"
   select under `<SlotBody slot="identity">` — options = `SUPPORTED_LOCALES` rendered via
   `localeLabel`, default `en`, helper text "Your page copy will be written in this
   language." On change: `setSiteLanguage` + `persistSiteLanguage()` (fire early — identity
   is slot 1; the persisted config is regen's data source, so write it durably ahead of
   generation). **No `wizardSlots` member added, no `inputContracts.ts` /
   `journey/engines/*` edits.**
3. Thread `siteLanguage` into the generation inputs and payloads (ruling 11 —
   first-gen's language source): `GeneratingSlot.tsx` `buildInput()` (:72) adds
   `siteLanguage`; `ThingGenerationInput` (`modules/wizard/generation/thing.ts:76-101`) +
   trust's equivalent gain the optional field; then:
   - `buildStrategyPayload` (`thing.ts:203-238`) and `buildCopyPayload` (`:241-259`) — and
     trust.ts's equivalent payload builders feeding its fetches at `:325-327,:397-399,:461-463`
     — add `language: input.siteLanguage ?? 'en'` (**always sent**, resolved ISO code; the
     directive is always emitted per ruling 2, and prompt text is outside the zero-diff
     contract). No Authorization-header change; no tokenId added to any payload.
   - Belt-and-suspenders persistence: tiny helper in `finalize.ts` —
     `localeConfigPatch(siteLanguage?): {} | { localeConfig: LocaleConfig }` (empty object
     when `en`/absent) — spread into **ALL five final-save bodies**: thing.ts `:445` (inside
     `saveFC` — covers `:557/:628/:803` callers), `:667` (techpremium path), `:761`;
     trust.ts `:436`, `:457`. One helper, five spread sites — no save path can drop the
     declaration even if the early slot-1 save failed.
4. **Work**: derive `labelToLocaleCode(facts.languages[0])` in the work generation drivers;
   mapped && ≠ `'en'` → include `localeConfig: { locales: [code], defaultLocale: code } }`
   in the save body; unmapped → skip + `console.warn` (ruling 5). **All FOUR work save
   sites carry the patch (round-2 note 8)**: `work.ts:150`, `work.ts:170`, `work.ts:267`,
   and `work.llm.ts:234` — same "no save path can drop it" standard as thing/trust. (Work's
   PROMPT language keeps consuming the label directly — unchanged; this is persistence
   only.) No second language control for work; no journey edits.
5. Tests:
   - new `src/components/onboarding/wizard/identityLanguage.test.tsx` — picker renders with
     `en` default; `en` untouched ⇒ **saveDraft fetch never fires from the picker** (call
     absence, not payload shape); `nl` pick ⇒ **exact body**
     `{ tokenId, localeConfig: { locales: ['nl'], defaultLocale: 'nl' } }`; nl→en revert ⇒
     explicit `localeConfig: null`.
   - new `src/modules/wizard/generation/payloadLanguage.test.ts` — `buildStrategyPayload` /
     `buildCopyPayload` (thing) + trust's builders carry `language: 'nl'` when
     `siteLanguage='nl'` and `language: 'en'` when unset (field ALWAYS present; ISO code,
     never an exonym — the exonym mapping is server-side, phase 4).
   - new `src/modules/wizard/generation/workLocale.test.ts` — `'Dutch'`→nl config in the
     save body; `'English'`→no config key; custom unmapped label→no config key; ALL FOUR
     save sites carry the patch (spy per site); and `localeConfigPatch` unit coverage
     (en/absent ⇒ `{}`, nl ⇒ config).
6. **Coordination**: orchestrator messages the uniform-journey track (coordinate at launch
   per the seam lesson, not via async mailbox) that `IdentitySlot.tsx` + `useWizardStore.ts`
   now carry the site-language seam.

**Files touched**
- `src/hooks/useWizardStore.ts`
- `src/components/onboarding/wizard/IdentitySlot.tsx`
- `src/components/onboarding/wizard/GeneratingSlot.tsx`
- `src/components/onboarding/wizard/identityLanguage.test.tsx` (new)
- `src/modules/wizard/generation/finalize.ts`
- `src/modules/wizard/generation/thing.ts`
- `src/modules/wizard/generation/trust.ts`
- `src/modules/wizard/generation/payloadLanguage.test.ts` (new)
- `src/modules/wizard/generation/work.ts`
- `src/modules/wizard/generation/work.llm.ts`
- `src/modules/wizard/generation/workLocale.test.ts` (new)

**Verification**
- `npx tsc --noEmit` · `npm run test:run`
- Manual (`npm run dev`, mock mode): thing flow with `nl` picked → after generation,
  editor loads with `localeConfig.defaultLocale==='nl'` (single-locale: no pills, no
  switcher — correct); English flow → DB `content` has NO `localeConfig` key; network tab
  shows `language: 'nl'` on the strategy + copy request bodies.
- Reviewer asserts: no diffs under `journey/engines/`, `inputContracts.ts`, `rail.ts`;
  zero-diff test asserts absence of the saveDraft CALL; ALL five thing/trust final-save
  sites spread `localeConfigPatch` (grep `saveDraft(` / `saveFC`); ALL FOUR work save sites
  carry the patch; explicit `null` clear on revert; work mapping never writes an unmapped
  code; payloads carry the ISO CODE (exonym mapping stays server-side); stepIndex finding
  recorded in the audit.

---

## Phase 4 — generation output-language directive (first-gen + regen)

Product & service prompts (copy + one-line strategy hedge) honor the site language.
**First-gen source = the validated client-sent `language` field** (ruling 11 — the routes
have no token to bind a DB read to); **regen source = server-read
`content.localeConfig.defaultLocale`** (scopedRegen holds the Project row). Work regen
reconciles per ruling 4.

**Steps**
1. New `src/lib/i18n/projectLocale.ts` (plain/server-safe):
   - `resolvePromptLanguage(input: unknown): string` — validate against
     `SUPPORTED_LOCALES`; absent/invalid ⇒ `'en'`; then `toPromptLanguage` ⇒ English exonym
     (ruling 11: an unrecognized code NEVER reaches a prompt; lenient — never throws);
   - `readDefaultLocale(content: unknown): string | null` (safe-parse
     `content.localeConfig.defaultLocale`) — the REGEN-side reader for `scopedRegen`.
2. `src/modules/audience/product/copyPrompt.ts`: add `language?: string` to
   `ProductCopyPromptInput` (:29-53); in `buildProductCopyPrompt` (:205)
   `const language = input.language || 'English'` (routes pass the resolved exonym);
   insert the `## OUTPUT LANGUAGE — ${language} (READ FIRST)` block right after the
   `identity` opening (:233-237) + an **unnumbered, bold** "**Write EVERY string in
   ${language}…**" line at the top of the RULES block — NOT a `1.` line (round-2 note 6:
   `accentRule` :240-244 already hardcodes `1.` and `5. Pricing` follows at :246; a
   numbered insert would yield two `1.`s). Wording mirrored from
   `work/copyPrompt.ts:213-219,:241-243` (translate-the-meaning, never echo source wording,
   proper nouns stay). Retry prompt (:438) wraps the original — no separate change.
3. `src/modules/audience/service/copyPrompt.ts`: same shape (`ServiceCopyPromptInput`
   :24-32, builder :135, retry :309); check its RULES numbering before inserting (same
   unnumbered-line approach if hardcoded numerals exist). **No `voice.ts` edits** — the
   spec's pointer is wrong (scout-corrected).
4. Strategy hedge (recommended by scout — stops source-language positioning/angle text
   leaking into copy): one-line output-language directive in
   `product/strategy/promptsProduct.ts` (:61 region) and
   `service/strategy/promptsService.ts`, mirroring `work/strategy/promptsWork.ts:95`.
5. Routes — accept + validate the client-sent code (ruling 11; NO prisma import, NO DB
   read, NO tokenId): `api/audience/product/strategy/route.ts`,
   `product/generate-copy/route.ts`, `service/strategy/route.ts`,
   `service/generate-copy/route.ts` each add an optional `language` string to the request
   schema (plain optional string — validation is semantic, not zod-enum, so a bad value
   falls back instead of 400ing), then
   `const promptLanguage = resolvePromptLanguage(body.language)` → threaded into the
   builders. Demo/mock short-circuits unaffected (language is prompt input, not a gate;
   never a hard fail).
6. Route tests — assert the BOUND path end-to-end (kills the round-2 inert-test risk):
   `product/generate-copy/route.test.ts` + `product/strategy/route.test.ts` (existing
   mocks at :15-39 for planCheck/creditSystem/rateLimit/security/aiClient stay; **no
   `@/lib/prisma` mock is added — the routes must not import prisma**) gain cases: request
   body carrying `language:'nl'` ⇒ the prompt handed to the mocked `aiClient` contains the
   Dutch directive (`'Dutch'`, exonym); body carrying garbage (`'xx'`, `'; DROP'`) ⇒ the
   built prompt carries the `English` fallback and the raw garbage string appears NOWHERE
   in it; body with no `language` ⇒ `English`. (The service routes have NO co-located
   tests — verified by glob; service coverage = the shared `resolvePromptLanguage` unit
   tests + `service/copyPrompt.language.test.ts` + the reviewer assert that all four routes
   run the SAME helper. Deliberate scope choice, recorded here.)
7. `src/modules/generation/scopedRegen.ts`: add `readLocaleDefault(project)` (sibling of
   `readOnboardingView` :264, delegating to `projectLocale.ts`; routes already select
   `content` — no route/prisma changes on the regen side). Thread
   `toPromptLanguage(readDefaultLocale(...) ?? 'en')` into `buildProductPrompt` (:541) and
   `buildServicePrompt` (:590). **Work reconcile at :669**: prefer
   `toPromptLanguage(defaultLocale)` when config present, else the existing
   `facts.languages[0]` label (ruling 4). First-gen and regen agree by construction — both
   derive from the same wizard state (ruling 11).
8. Tests:
   - `product/promptBranch.test.ts` — update prompt-text assertions (expected breakage).
   - New `product/copyPrompt.language.test.ts` + `service/copyPrompt.language.test.ts`,
     mirroring `work/copyPrompt.language.test.ts`: directive present + correct language
     (`'Dutch'`, not `'Nederlands'` — ruling 3); default `'English'` when absent; directive
     precedes section instructions; product RULES block contains exactly ONE `1.` line
     (numbering-collision pin, note 6).
   - New `src/lib/i18n/projectLocale.test.ts` — `resolvePromptLanguage` matrix (`'nl'`⇒
     `'Dutch'`, `'en'`/absent/`undefined`⇒`'English'`, `'xx'`/`'; DROP'`/non-string⇒
     `'English'`); `readDefaultLocale` safe-parse (null content, missing keys, declared nl).
   - `src/modules/generation/scopedRegen.test.ts` (existing) — add cases: work reconcile
     preference order (config beats `facts.languages[0]`); product/service regen prompt
     carries the language when project content declares one.
   - **No firewall test** (ruling 3: `assertNoTemplateLeak` key-checks `templateId`/
     `variantId` only — a `language`-value test could never fail = inert assertion, banned
     by project lesson). **No `generationContract.test.ts` edit** — verified: its prompt
     assertions are additive `toContain` (:528-529, :572-573, :619-634), unaffected by
     inserted directive text.

**Files touched**
- `src/lib/i18n/projectLocale.ts` (new)
- `src/lib/i18n/projectLocale.test.ts` (new)
- `src/modules/audience/product/copyPrompt.ts`
- `src/modules/audience/product/copyPrompt.language.test.ts` (new)
- `src/modules/audience/product/promptBranch.test.ts`
- `src/modules/audience/product/strategy/promptsProduct.ts`
- `src/modules/audience/service/copyPrompt.ts`
- `src/modules/audience/service/copyPrompt.language.test.ts` (new)
- `src/modules/audience/service/strategy/promptsService.ts`
- `src/app/api/audience/product/strategy/route.ts`
- `src/app/api/audience/product/strategy/route.test.ts`
- `src/app/api/audience/product/generate-copy/route.ts`
- `src/app/api/audience/product/generate-copy/route.test.ts`
- `src/app/api/audience/service/strategy/route.ts`
- `src/app/api/audience/service/generate-copy/route.ts`
- `src/modules/generation/scopedRegen.ts`
- `src/modules/generation/scopedRegen.test.ts`

**Verification**
- `npx tsc --noEmit` · `npm run test:run` (promptBranch + contract + route tests green)
- Reviewer asserts: directive emitted unconditionally (ruling 2) with `'English'` default;
  prompt values are English exonyms; **routes accept the optional `language` field but the
  value reaching a prompt is ALWAYS `resolvePromptLanguage`-validated — anything outside
  `SUPPORTED_LOCALES` yields the `en` fallback and raw client input never appears in a
  prompt** (all four routes run the same helper; ruling 11); NO prisma import landed in any
  audience route; regen route files untouched; regen side reads `defaultLocale`
  server-side; work reconcile order defaultLocale-first; `projectLocale.ts`/`localeNames.ts`
  import no client modules; route tests assert the BOUND path (body → built prompt), not
  mocked-content shapes; no inert firewall test snuck in.
- Real-LLM Dutch/English spot check = **founder QA at the merge gate** (phase-7 item), not
  an in-pipeline step; this phase verifies against mocks.

---

## Phase 5 — `switcher.v2.js` + publish emission (`switcherStyle`, slug-aware basePath)

The immutability recipe (scout §E, followed EXACTLY) + the generator-side config upgrade.
Blob path only; publish-route persistence + SSR are phase 6.

**Steps**
1. **Freeze v1** — copy the CURRENT `src/lib/staticExport/switcherBehaviors.js` VERBATIM to
   `scripts/legacy/switcher.v1.src.js`.
2. `scripts/buildAssets.js`: repoint the v1 entry at `legacyDir`
   (`{ src: 'switcher.v1.src.js', out: 'switcher.v1.js', dir: legacyDir }` + FROZEN
   comment), add `{ src: 'switcherBehaviors.js', out: 'switcher.v2.js' }`, update the
   "Current mapping" contract comment (precedent: `form.v1/v2`, `a.v1/v2`).
3. `src/lib/staticExport/switcherBehaviors.js` → v2 semantics:
   - config gains `slug` + `style`; early return when `cfg.style === 'none'` (defense in
     depth — generator won't emit at all);
   - runtime basePath detection (ONE stamped config serves every serving surface),
     **hostname-hardened**: `var onLessgo = /(^|\.)lessgo\.(ai|site)$/.test(location.hostname) || location.hostname === 'localhost';`
     `var pfx = '/p/' + cfg.slug; var basePath = (onLessgo && (pathname === pfx || pathname.indexOf(pfx + '/') === 0)) ? pfx : '';`
     — direct `/p/{slug}` on lessgo hosts gets the prefix; blob-at-host-root,
     middleware-rewritten custom-domain requests (browser pathname has no `/p`), AND the
     contrived custom-domain-page-literally-at-`/p/{slug}` case all get `''`;
   - `segAt`/`buildPath` (and the geo-redirect at L73-85 + pill clicks) operate on
     `pathname.slice(basePath.length)` and re-prepend `basePath` on every built target.
4. `src/lib/staticExport/htmlGenerator.ts` (:320-328, :373-376): stamp
   `{ locales, defaultLocale, current, slug: metadata.slug, style }` into
   `window.__lessgoLocales`; script src → `${assetBase}/assets/switcher.v2.js`.
   **`style` is read from the localeConfig the generator ALREADY receives**
   (`params.localeConfig.switcherStyle ?? 'dropdown'` at the :373-376 emission site —
   `renderPublishedExport.ts:230/:329/:487` pass the whole config today; round-2 note 2:
   NO parallel `switcherStyle` param is added anywhere). `style === 'none'` ⇒
   `switcherTags = ''` (config + script both omitted — kills pill AND geo redirect,
   ruling 6) while hreflang/canonical emission stays untouched. Single/absent locale
   config ⇒ byte-identical output (existing `multiLocale` gate unchanged — note a
   ruling-10 single-locale config is NOT multiLocale, so it emits nothing).
5. `src/lib/staticExport/renderPublishedExport.ts` — ONE concern only (the `<html lang>`
   fix; no switcherStyle threading, see step 4): whenever a `localeConfig` is DECLARED,
   pass `locale = localeConfig.defaultLocale` for the default doc at **:229** AND for
   subpage docs at **:328** (round-2 note 5 — both or a declared single-locale `nl` site
   gets `lang="nl"` on the root and `lang="en"` on subpages). Byte-diff only for projects
   WITH a config, allowed.
6. `npm run build:assets` (or full `npm run build`) — confirm `public/assets/switcher.v1.js`
   bytes UNCHANGED vs the previous build and `switcher.v2.js` appears.
7. Tests:
   - `src/lib/staticExport/htmlGenerator.test.ts` (extend): multi-locale doc references
     `switcher.v2.js` + config carries `slug`/`style`; `style:'none'` ⇒ NO switcher
     script/config but hreflang intact; absent/single localeConfig ⇒ output byte-identical
     to the pre-change expectation (zero-diff regression pin).
   - `src/lib/staticExport/__tests__/i18nStaticExport.test.ts` — **breaks by design**
     (:143-149 asserts `/assets/switcher.v1.js` AND the exact string
     `window.__lessgoLocales={"locales":["en","nl"],"defaultLocale":"en","current":"en"}`):
     update to v2 src + the new config shape including `slug`/`style`. **Also fix the inert
     assertion at :224** (round-2 note 4): the single-locale baseline asserts
     `not.toContain('switcher.v1.js')`, which can NEVER fail once nothing emits v1 — update
     it to `not.toContain('switcher.v2.js')` so it actually pins "no switcher on
     single-locale".
   - `src/lib/i18n/i18nHonesty.test.ts` — **breaks by design** (:191-192 asserts
     `/assets/switcher.v1.js`; :103-118 pins the buildAssets registration): update to v2 +
     extend the registration check to cover the frozen v1 legacy entry AND the v2 entry.
   - New `src/lib/staticExport/switcherBehaviors.v2.test.ts` (vitest/jsdom, evaluates the
     source file with a stubbed `window`/`location`): basePath detection for
     `/p/{slug}` on a lessgo host, `/p/{slug}/nl/about`, root `/nl`,
     custom-domain-rewrite shape (`/` with no `/p` prefix), AND custom-domain page at a
     literal `/p/{slug}` path ⇒ `''` (hostname gate); target-path building re-prepends
     basePath (the `/nl/p/{slug}` 404 bug is dead); `style:'none'` ⇒ no pill, no
     `location.replace`; geo-redirect suppressed under `none`; session-guard behavior
     preserved. Freeze guard: assert `scripts/legacy/switcher.v1.src.js` exists and
     `htmlGenerator.ts` no longer references `switcher.v1.js`.

**Files touched**
- `scripts/legacy/switcher.v1.src.js` (new — verbatim freeze)
- `scripts/buildAssets.js`
- `src/lib/staticExport/switcherBehaviors.js`
- `src/lib/staticExport/switcherBehaviors.v2.test.ts` (new)
- `src/lib/staticExport/htmlGenerator.ts`
- `src/lib/staticExport/htmlGenerator.test.ts`
- `src/lib/staticExport/__tests__/i18nStaticExport.test.ts`
- `src/lib/i18n/i18nHonesty.test.ts`
- `src/lib/staticExport/renderPublishedExport.ts`

**Verification**
- `npx tsc --noEmit` · `npm run test:run` · `npm run build` (build ≠ next build — asset
  step must run; verify `public/assets/switcher.v2.js` emitted and v1 bytes unchanged)
- Reviewer asserts: v1 source file is byte-identical to the pre-phase
  `switcherBehaviors.js` (`git diff`-verifiable); NO in-place semantic edit ships under the
  v1 filename; `none` suppresses config+script wholesale; NO new `switcherStyle` parameter
  exists on any generator signature (style read off the passed `localeConfig`); the
  renderPublishedExport diff is the two `locale` re-points ONLY (:229 + :328); zero-diff
  pin test present; the :224 inert assertion now targets v2; basePath detection
  hostname-gated. (Publish-route persistence is deliberately NOT in this phase — it lands
  in phase 6 with its consumer; do not flag its absence here.)

---

## Phase 6 — publish persistence + `/p/{slug}` SSR locale awareness + published-switcher e2e

Two coupled gaps (scout §E + review round 1): (a) `PublishedPage.content` carries
neither `localeConfig` nor `localeContent` — the row is written (`api/publish/route.ts:286-291`
update / `:321-327` create) BEFORE the in-memory overlay seeding (`:430-434`), and
`localeConfig` is only ever passed to `renderPublishedExport` (`:472`), never persisted —
so an SSR locale read has no data source; (b) the `/p` SSR path has ZERO locale awareness and
never injects the switcher (`/p/{slug}/nl` 404s today). This phase persists the locale data at
publish time, fixes the custom-domain go-live regen, adds locale resolution + overlay
rendering + switcher injection to both `/p` routes, and lands the deterministic e2e coverage
(none exists today). Overlay resolution reuses the EXISTING shared
`resolveLocaleElements` (`src/lib/i18n/localeContent.ts:48-74`) directly — round-2 note 1:
no wrapper is built (`renderPublishedExport.ts:361/:409` already call it directly; a
per-section "extraction" would be a no-op indirection), and `renderPublishedExport.ts` is
NOT touched in this phase.

**Steps**
1. `src/app/api/publish/route.ts` — persist the locale declaration + overlay:
   - hoist the sanitized-overlay work: right after the DB reads (:197-203), when
     `localeConfig` is present build
     `publishedContent = { ...content, localeConfig, ...(projectLocaleContent ? { localeContent: sanitizeLocaleOverlay(projectLocaleContent) } : {}) }`;
     absent ⇒ `publishedContent = content` untouched (**presence-gated ⇒ monolingual
     zero-diff: no new keys on `PublishedPage.content`**);
   - store `publishedContent` in BOTH row writes (update `:286-291`, create `:321-327`)
     and feed the SAME object to `renderPublishedExport` (:452-473), retiring the late
     in-memory seeding block (:424-435) — one enriched object, persisted and rendered,
     no drift between what the row says and what the blob was baked from;
   - update the now-stale comment at :193-203 ("we source both from the DB here" → "…and
     persist them on PublishedPage so the SSR fallback + verify-dns regen see them").
2. `src/app/api/domains/verify-dns/route.ts` (:128-151) — the go-live regen currently calls
   `renderPublishedExport` with NO `localeConfig`, so a bilingual site going live on a
   custom domain would regenerate single-locale and drop its `/nl` docs + KV routes. Fix
   (cheap, one param): pass
   `localeConfig: (page.content as any)?.localeConfig ?? null` — after step 1 the row
   carries it (and `page.content.localeContent` already rides into the overlay resolution
   at `renderPublishedExport.ts:361/:409`). Pages published BEFORE this feature have no key
   ⇒ `null` ⇒ exactly today's behavior; a republish heals them (documented, phase 7).
3. New `src/lib/i18n/publishedLocale.ts` (server-safe):
   - `resolvePublishedLocale(localeConfig, subpathSegs): { locale: string; remainder: string[] } | null`
     — first segment is a declared NON-default locale ⇒ `{locale, rest}`; else null
     (mirrors v2 `segAt` semantics so SSR and blob agree; `isMultiLocale`-gated — a
     ruling-10 single-locale config never creates locale routes);
   - `switcherScriptTags({ locales, defaultLocale, current, slug, style })` helper returning
     the config JSON (with the same `<` escaping) + script src for React injection.
   - NO overlay wrapper (round-2 note 1): SSR callers apply overlays by calling
     `resolveLocaleElements` (`localeContent.ts:48-74`) directly, exactly as
     `renderPublishedExport` does.
4. New `src/app/p/[slug]/renderPublishedRoot.tsx` (server-only shared helper, round-2
   note 3): extract the root-render body from `p/[slug]/page.tsx:120-204` (JSON-LD via
   `flattenContent`+`buildStructuredData`, root `mergedContent` assembly,
   `CriticalFontPreload`, renderer invocation) into ONE helper taking
   `{ content, locale?, overlay? }`, so the locale-root SSR case does NOT copy ~50 lines —
   without this the two published roots WILL drift.
5. `src/app/p/[slug]/page.tsx`: re-point onto `renderPublishedRoot`; when
   `content.localeConfig` is multi-locale AND `switcherStyle !== 'none'`, render the
   stamped config `<script>` + `<script src="{assetBase}/assets/switcher.v2.js" defer>`
   alongside the renderer output (default-locale doc; content untouched).
   `generateMetadata`: add `alternates.languages` (hreflang map) when multi-locale.
6. `src/app/p/[slug]/[...subpath]/page.tsx`: BEFORE the subpage lookup, run
   `resolvePublishedLocale`:
   - `/{loc}` (empty remainder) ⇒ render the ROOT content via `renderPublishedRoot` with
     the `loc` overlay applied through `resolveLocaleElements` (fixes today's `notFound()`;
     no duplicated root-render code);
   - `/{loc}/{sub}` ⇒ subpage lookup on the remainder, overlay applied via
     `resolveLocaleElements`;
   - no locale match ⇒ existing behavior byte-for-byte.
   Switcher injection + `alternates.languages` as in step 5, `current = loc`.
   Known accepted gap: `<html lang>` on the SSR path comes from the app root layout and is
   not per-locale (App Router constraint) — noted in docs, phase 7.
7. Tests:
   - `src/app/api/publish/route.test.ts` (existing) — add cases: bilingual project ⇒ the
     persisted `PublishedPage.content` carries `localeConfig` + SANITIZED `localeContent`;
     monolingual project ⇒ persisted content has NEITHER key (zero-diff pin).
   - New `src/lib/i18n/publishedLocale.test.ts` — resolution matrix (default locale is
     NEVER treated as a prefix; unknown segment ⇒ null; declared non-default ⇒ split;
     single-locale config ⇒ always null; empty/deep remainders); `switcherScriptTags`
     config-JSON escaping parity with the htmlGenerator emission. (Overlay semantics are
     already pinned by the existing `localeContent`/`i18nStaticExport` suites — no
     duplicate overlay tests.)
   - New `e2e/i18n-switcher.spec.ts` (Playwright, mock mode, unauthed — deterministic-QA
     rule; no e2e covers the published switcher today). Two fixture docs (multi-locale
     config stamped, one with `style:'none'`) served via `page.route`, with
     `**/assets/switcher.v2.js` fulfilled from `src/lib/staticExport/switcherBehaviors.js`
     source (tests live semantics without requiring a prior asset build). Asserts:
     pill renders with both locales; click on NL from a root-served doc navigates to `/nl`
     (not `/nl/p/…`); click from a `/p/{slug}`-served doc navigates to `/p/{slug}/nl` (the
     bug this feature fixes); `style:'none'` doc renders NO pill and performs NO
     geo-redirect (seeded `navigator.language`/geo cookie); localStorage persistence path.

**Files touched**
- `src/app/api/publish/route.ts`
- `src/app/api/publish/route.test.ts`
- `src/app/api/domains/verify-dns/route.ts`
- `src/lib/i18n/publishedLocale.ts` (new)
- `src/lib/i18n/publishedLocale.test.ts` (new)
- `src/app/p/[slug]/renderPublishedRoot.tsx` (new — shared root-render extraction)
- `src/app/p/[slug]/page.tsx`
- `src/app/p/[slug]/[...subpath]/page.tsx`
- `e2e/i18n-switcher.spec.ts` (new)

**Verification**
- `npx tsc --noEmit` · `npm run test:run` (incl. `i18nStaticExport` — untouched, must stay
  green; publish route tests)
- `npm run test:e2e -- i18n-switcher` (plus `render.spec.ts` + `publish.spec.ts` still
  green — SSR route and publish route were touched)
- Manual (`npm run dev`): publish a bilingual mock project → DB row's `content` shows
  `localeConfig` + `localeContent` (the SSR data source is REAL); `/p/{slug}` shows pill;
  clicking NL lands on `/p/{slug}/nl` with overlay text; `/p/{slug}/nl` direct-load works
  (no 404); Settings→Switcher style→None → republish → no pill on either path
  (dual-renderer parity: blob doc and SSR doc behave identically). Monolingual republish ⇒
  row `content` unchanged (no new keys).
- Reviewer asserts: persistence is presence-gated (monolingual rows byte-identical); ONE
  enriched content object feeds both the row write and the export (no persisted-vs-rendered
  drift); verify-dns passes `localeConfig`; no `'use client'` import enters the SSR pages
  (published/client boundary); non-locale requests hit the EXACT pre-change code path;
  overlay logic has ONE implementation (`resolveLocaleElements` — no wrapper, no copy);
  BOTH `/p` routes render roots through `renderPublishedRoot` (no duplicated root-render
  block); `renderPublishedExport.ts` has NO diff in this phase; e2e asserts both basePath
  shapes + the `none` suppression.

---

## Phase 7 — docs + acceptance sweep

**Steps**
1. `docs/architecture/publishArch.md`: switcher v1→v2 mapping + freeze rationale, the
   `__lessgoLocales` config shape (slug/style), publish-time persistence of
   `localeConfig`/`localeContent` onto `PublishedPage.content` (presence-gated), `/p` SSR
   locale behavior, the `none` semantics (suppresses pill AND geo redirect), the SSR
   `<html lang>` gap, and the **republish caveat**: blobs published before this feature
   embed the frozen `switcher.v1.js` and rows lack the locale keys — existing bilingual
   published pages need ONE republish before the `/p/{slug}` switcher fix, the SSR locale
   routes, and the verify-dns regen fix apply to them.
2. `docs/architecture/copyEngines.md`: output-language directive note (all three engines;
   first-gen = validated client-sent code, regen = server-read `defaultLocale` — same
   wizard source, ruling 11; English-exonym prompt values; work reconcile rule).
3. `src/lib/i18n/README.md` (if present — else create): module map
   (`localeContent` / `localeNames` / `projectLocale` / `publishedLocale`), the two name
   maps and their jobs (native = UI, English = prompts), the two language seams (payload
   vs server-read), ruling-10 "non-null ≠ multi-locale" invariant, client-boundary note.
4. `src/modules/templates/fit.ts` (:32, :61): update the capability comments still naming
   `switcher.v1.js` → v2 (round-2 note 9; comment-only sweep).
5. Full sweep: `npx tsc --noEmit`, `npm run test:run`, `npm run build`, `npm run test:e2e`
   (i18n-switcher + publish + render at minimum). Walk the spec's acceptance checklist
   line-by-line and record pass/fail in the phase audit — with the explicit caveat next to
   the switcher acceptance box that it holds for pages published AFTER this feature (older
   blobs: after republish). **Founder QA item for the merge gate** (recorded in the audit,
   not run in-pipeline): real-LLM spot check — Dutch one-liner + English pick → English
   copy; `nl` pick → Dutch copy.

**Files touched**
- `docs/architecture/publishArch.md`
- `docs/architecture/copyEngines.md`
- `src/lib/i18n/README.md` (new or updated)
- `src/modules/templates/fit.ts` (comment-only)

**Verification**
- Commands above, all green. Reviewer asserts: docs match shipped behavior (no aspirational
  Spec-2 claims); the republish caveat appears in BOTH publishArch.md and the acceptance
  record; no remaining `switcher.v1.js` mentions outside `scripts/legacy/` + buildAssets'
  frozen entry + historical docs; every spec acceptance box maps to a phase artifact, a
  recorded manual check, or the founder-QA merge-gate item.

---

## Open risks

- **Client-sent language (ruling 11) — accepted by design**: the audience routes trust a
  validated request field, not a server read. Worst case of a forged value = the user
  generates their OWN page in another language (already possible from the UI); language is
  a prompt input, not an authz input. Server-side `resolvePromptLanguage` guarantees
  nothing outside `SUPPORTED_LOCALES` ever reaches a prompt. Route tests pin both the
  bound path and the garbage fallback.
- **Persist-failure residual (regen only)**: first-gen no longer depends on the phase-3
  `localeConfig` persist (the payload carries the code — MORE robust than a server read).
  But if the slot-1 persist AND all five final-save re-asserts fail, the config is absent →
  later REGEN falls back to English and Settings shows no declared language. Window is
  narrow (five redundant writes); degraded = current behavior; accepted.
- **Old published pages until republish**: pre-feature blobs keep the frozen `switcher.v1.js`
  (still broken on `/p/{slug}` — by design, immutability) and pre-feature `PublishedPage`
  rows lack `localeConfig`/`localeContent` (SSR locale routes + verify-dns regen degrade to
  today's behavior). One republish heals both. Documented in phase 7; acceptance recorded
  with this caveat.
- **Snapshot churn**: `uiFoundationIsolation.test.tsx.snap` is already dirty in the
  worktree from an unrelated change, and header/modal edits (phase 2) may touch snapshots.
  Implementer re-baselines only snapshots their phase legitimately changes.
- **Custom-domain SSR fallback basePath**: assumed browser-visible pathname on the
  middleware-rewritten fallback has no `/p` prefix (internal rewrite), so runtime detection
  yields `''`; the hostname gate additionally hard-excludes custom domains. e2e covers the
  shapes but not a live custom domain — preview QA should include naayom-style
  custom-domain smoke if one is bilingual.
- **Unsupported languages** (e.g. Hindi): work can WRITE copy in them (prompt uses the
  label) but `defaultLocale` can't be declared (not in `SUPPORTED_LOCALES`) — `<html lang>`
  and future translate features won't know the language. Documented limitation; widening
  `SUPPORTED_LOCALES` is orchestrator-ruled OUT of this spec (separate decision, pinned by
  `localeContent.test.ts:133`).
- **Phase-2 gate deviations**: greyed Auto-translate + `{n} translated fields` subline are
  orchestrator-approved, but the founder sees them at the gate; the Domain-icon swap
  (`language`→`public`) is a new deviation recorded there. If any is rejected, the fallback
  is a gate-time adjustment scoped to `LanguagesPanel.tsx`/`SeoSettingsModal.tsx` only.
