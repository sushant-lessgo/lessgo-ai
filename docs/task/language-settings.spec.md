# language-settings (F1) — spec

Surface the built i18n Phase-1 engine into the editor's **Site Settings**, make it reachable
for every project (not just already-bilingual ones), and give product/service generation a
real output-language. Agreed 2026-07-21 (founder QA F1 + designer Languages panel).

**Tier: standard** (auto-escalate — touches generation prompts, onboarding seam, and the
published `/p` path; planner flags those surfaces for the review pass).

## Problem / why
- Kundius/Ravi QA (bugs19thJuly1 F1): "In settings I'm not getting language option." True —
  there is **no Languages row** in any settings surface (explicit prior ruling
  `SeoSettingsModal.tsx:17,:384`), and the built add-language panel (`LocaleSettings.tsx`) is
  **hidden behind `if (!isMultiLocale) return null`** (L54, the bilingual-editing gate). So a
  normal (monolingual) user literally cannot reach language config.
- "Picked English, got Dutch" (bugs19thJuly1 General #2, symptom-patched in qa-0719b): the
  **root** is that product/service generation has **no output-language directive** — only the
  work engine honors a language (`primaryLanguage`). The model infers language from the one-liner.
- The designer's Editor Redesign (`…/Lessgo Editor Redesign.dc.html` §Languages, L691–719) draws
  a full Languages panel in Site Settings — the intended home.

## What already exists (i18n Phase 1, shipped 2026-07-11 — do NOT rebuild)
Locale-overlay content model (base `content` = default locale, zero migration; others = text
overlays) · editor language toggle · **`LocaleSettings.tsx` add/remove-language flow** (already
handles monolingual→bilingual via `addLocale`) · per-locale published pages `/{locale}` +
hreflang/canonical + `switcher.v1.js` (geo + localStorage) · `bilingual` queryable capability +
honesty test. **This spec surfaces + wires that engine; it does not re-implement it.**

## Decisions (locked this discussion)
1. **Languages lives in Site Settings only.** Retire the header globe (`LocaleSettings`) — move
   the config panel into the `SeoSettingsModal` left rail (Domain / SEO / Social / **Languages**).
   Reverses the "NO Languages row" ruling (founder now wants it).
2. **Ungate monolingual.** Remove the `isMultiLocale` return-null gate so any project can add a
   language. `addLocale`'s first-declaration path already seeds `[default, new]` correctly.
3. **Site language is set at onboarding → `defaultLocale`; Settings edits it.** Onboarding writes
   the site's language into `localeConfig.defaultLocale` (durable fix for "picked EN got Dutch").
   Coordinate with the **uniform-journey** track — this is a shared onboarding seam.
4. **Generation honors the site language.** Product & service copy prompts get an output-language
   directive keyed to `defaultLocale` (reuse the work engine's `primaryLanguage` pattern —
   `copyPrompt.ts` / `voice.ts`), for first-gen and scoped regen.
5. **Never regenerate to change language — translate.** Changing an already-set site language
   does NOT regenerate (would destroy user copy). It translates existing copy → **depends on the
   Spec-2 auto-translate engine**, so in THIS spec the change-language action is **greyed
   "coming soon"** (greyed-placeholder rule). Onboarding sets it initially; post-gen change waits
   for Spec 2. Adding a *second* language in Spec 1 gives an empty overlay to hand-author
   (independent mode — already supported).
6. **Fix the published switcher on `/p/{slug}`.** Today the path-prefix swap assumes locale = first
   path segment, so it works on custom-domain/subdomain serve but **breaks on the `/p/{slug}`
   SSR/preview path** (i18nPlan v1 limitation). Fix it so the switcher works on the preview URL too.
7. **Switcher-style control** (Dropdown / None) per the designer — "None" suppresses the published
   switcher widget.

## Scope
IN: Languages row + designer-layout panel in `SeoSettingsModal` · remove header globe mount +
`isMultiLocale` gate · onboarding writes `defaultLocale` (uniform-journey seam) · product/service
generation output-language directive (first-gen + regen) · switcher-style Dropdown/None ·
`/p/{slug}` switcher fix · Auto-translate toggle shown **greyed** (Spec-2 placeholder) ·
active-locale editing switcher re-homed (see open q1).
OUT (→ **Spec 2**, stacked): LLM auto-translate; the "change site language = translate" action.
OUT (→ **follow-up spec**): per-collection-item text + nav-label localizability (Phase-1 limit,
newly relevant post cms-collections).
OUT: per-locale title/desc/OG meta (Phase 3); RTL; default-locale base↔overlay swap.

## Constraints
- **Dual-renderer parity** — switcher behavior identical editor-preview vs published.
- **Bundle firewall + published/client boundary** stand; templates stay locale-agnostic.
- Monolingual projects with no declared 2nd locale: **zero storage/behavior diff** (regression).
- The `activeLocale` regen-lock (`EditHeaderRightPanel.tsx:109`) stays as-is (only bites multi-locale).
- Onboarding-seam change coordinated with uniform-journey **at launch**, not via async mailbox
  (per the E2/E3 seam lesson).

## Acceptance
- [ ] A fresh monolingual project can open Site Settings → Languages and **add a language**
      (was impossible: gate removed).
- [ ] Onboarding in a non-English flow produces a page whose **base copy is in that language**
      (product & service), and `defaultLocale` reflects it. "Picked English → English."
- [ ] No language globe in the editor header; Languages reachable only via Site Settings.
- [ ] Published page **and** `/p/{slug}` preview both show a working language switcher; "None"
      hides it.
- [ ] "Change site language" is visibly greyed with a "coming soon" affordance (not missing, not
      fake-functional).
- [ ] Monolingual, single-locale projects: zero visual/storage diff (regression test).

## Open questions
1. **Active-locale editing switcher home** — retiring the header globe removes the only always-
   visible "which language am I editing" control. Options: per-language **Edit** button in the
   Settings panel (sets `activeLocale`, closes modal) + a slim editing indicator, OR a compact
   locale chip in the editor bar shown **only** when multi-locale. Designer panel doesn't show one.
   Decide the home (founder/designer).
2. **Onboarding language input** — explicit picker step vs infer-from-one-liner-then-confirm? And
   does it live in the generic wizard, the engine step, or shared shell? (uniform-journey seam.)
3. **Regen while site language is being changed** — since change=translate=Spec 2, confirm Spec 1
   simply greys the action (no half-built translate call).

## References
- `docs/tracks/Completed/i18nPlan.md` — Phase-1 build (D1–D5) + v1 limitations.
- `docs/task/completed/i18n-phase-1.spec.md` — what shipped.
- `src/app/edit/[token]/components/editor/LocaleSettings.tsx` — the panel to re-home (L54 gate).
- `src/app/edit/[token]/components/ui/SeoSettingsModal.tsx` — the settings host (L384 rail).
- `…/design_handoff_lessgo_app/Lessgo Editor Redesign.dc.html` §Languages L691–719 — target layout.
- Memory: [[project_i18n_multilingual]] · [[project_onboarding_by_engine]] · [[feedback_greyed_placeholder_for_missing_functionality]].
