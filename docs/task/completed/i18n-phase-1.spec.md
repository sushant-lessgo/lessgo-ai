# i18n-phase-1 — spec

Platform content-language layer, **independent-authoring mode only** (i18nPlan Phase 1).
Un-deferred by founder ruling 2026-07-11. Agreed 2026-07-11.

## Problem / why
- Coverage-100: bilingual needed by **21/101 sites; 28/101 non-English** (ja/es/pt/fr/it/id/nl/
  th/vi/de/pl) — findings §8 ranks it platform priority #4. Not a Lumen one-off.
- The atelier template build (Kundius, EN/NL) needs bilingual NOW, and the Lumen twin-`_nl`-field
  hack is contained/bespoke — building on it again would be a second hack.
- Serve gate needs `bilingual` as a queryable capability (scalePlan §7 closed vocab) instead of
  the current unqueryable lumen special case.

## Goal
Content carries a locale dimension; a project declares its locales; the editor edits any locale
via a language toggle; the published static site ships a language switcher with geo default.
Existing single-language projects are untouched — **default locale IS today's `content`, zero
data migration.**

## Decisions (locked)
1. Independent authoring only — each locale hand-written. Assisted/LLM translation = Phase 2
   (naayom→Hindi), OUT.
2. **Pilot = the atelier/Kundius site (EN/NL), not a live-Lumen migration.** Lumen retires as
   bespoke-off; its twin-field mechanism is not migrated, just superseded.
3. Editor UX: ONE language toggle re-pointing all Editables (i18nPlan gate #2 recommendation);
   no side-by-side.
4. Published UX: on-page switcher + geo default (`navigator.language` fallback) + `localStorage`
   persistence — the UX Lumen's contained toggle already proved.
5. Back-compat law: single-locale projects see zero behavior/storage change; locale machinery is
   invisible until a project declares a 2nd locale.

## Scope
IN: locale-keyed content model (shape = plan decision, i18nPlan gate #1: `content[locale]` map vs
per-field variants — must be back-compatible) · per-project locale config (locales + default) ·
editor language toggle (store + Editables + persistence/auto-save locale-aware) · published
switcher asset (generalize the `lumen.v1.js` idea into a shared published asset) · static-export
path renders all declared locales · `bilingual` capability declared/queryable.
OUT: assisted translation (Phase 2) · hreflang/per-locale meta + SEO routes (Phase 3 — see open
q1) · RTL · locale set beyond what config allows (mechanism generic; en/nl exercised).

## Constraints
- Dual-renderer parity: toggle/switcher behavior identical editor vs published.
- Published pages are static HTML on Blob — switcher must work with no server (client-side swap
  or per-locale pre-render; plan decides, publish pipeline + KV routing consequences included).
- Copy generation stays locale-unaware for now: generation writes the default locale; other
  locales are manually authored (work engine is manual-fill anyway).
- No template involvement: templates render whatever locale is active (i18nPlan principle).
- Bundle firewall + published/client boundary stand.

## Acceptance
- [ ] A 2-locale project edits EN and NL through the editor toggle; auto-save/load round-trips
      both.
- [ ] Published site: switcher + geo default + persistence; both locales fully rendered.
- [ ] Existing single-language projects: zero visual/storage diff (regression-tested).
- [ ] `bilingual` capability queryable; conformance-style honesty test.
- [ ] Atelier/Kundius pilot passes all of the above end-to-end (final gate lands in the atelier
      build).

## Open questions
1. SEO surface in v1: switcher-only (lean, founder-inclined defer) vs hreflang/per-locale meta
   now (i18nPlan gate #4 leaned include) — decide at plan review.
2. Content-model shape (`content[locale]` vs per-field) — scout + plan decide, gate #1.
3. Per-locale pre-render (N static HTMLs + routing) vs single HTML with embedded locales +
   client swap — plan decides with publish-pipeline evidence.

## References
- `docs/tracks/i18nPlan.md` — track plan (phases, gates, principles).
- Lumen twin-field + `lumen.v1.js` toggle — prior art for published UX only.
- `docs/research/coverage-100/findings.md` §7–8 — demand evidence.
- `docs/tracks/scalePlan.md` §7 — capability vocab + honesty test.
