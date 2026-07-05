# Multilingual (i18n) — Platform Track Plan

> **STATUS: DEFERRED — do not build yet.** Implement only when **more users require bilingual**
> (trigger: a 2nd+ paying customer beyond Lumen/naayom asks for it, or it becomes a sales blocker).
> Lumen ships bilingual NOW via a **Lumen-contained** twin-field + header toggle (PO-approved 2026-06-29);
> it is **not** on this platform layer yet and will migrate onto it when this is built.
> Set 2026-06-25.

## Why this is a real platform bet (not gold-plating)

Two concrete use cases already in hand, plus a market thesis:
- **NL bilingual (EN/NL):** founder is NL-based → many local/EU clients expect bilingual pages.
  First instance: **Lumen / Kundius Photography** (service).
- **Hindi (EN/HI):** **naayom's** customers are rural Indian farmers who convert better in Hindi
  (product / TechPremium).
- Multilingual landing pages are a common, monetizable SaaS feature with **SEO upside** (per-locale
  indexing). Two real cases across **both audiences** (service + product) → it's a **content-layer**
  feature, not a template feature, and justifies touching the shared content model — on purpose.

## The key design insight: TWO modes, not one

The two use cases need different authoring models — the platform must serve both:
- **Independent authoring** (Lumen): EN and NL are written **separately** — different messaging, not a
  translation. (Lumen's contained twin-field approach is this mode, in miniature.)
- **Assisted / auto translation** (naayom → Hindi): the founder will **not** hand-write Hindi; same
  message, another language → an **LLM-assisted translation** (per-field, reviewable, `<em>`/HTML
  preserved). *This is where the publish-time translation idea (cut from the Lumen plan) returns —
  correctly, as an optional platform capability, not a bespoke hack.*

## Architecture principles

- **Locale-keyed content, back-compatible.** Content carries a language dimension keyed by locale
  (`en`, `nl`, `hi`, …). Existing single-language projects = one **default locale** = today's
  `content`, untouched (no migration of existing data; the default locale IS the current content).
- **Per-project language config.** Each project declares its locales (naayom = `[en, hi]`,
  Lumen = `[en, nl]`); default/fallback locale per project.
- **Cross-audience / cross-template.** Lives at the content/store layer + both renderers, NOT in any
  one template. Templates stay language-agnostic (they render whatever locale is active).
- **Two authoring modes** (above), selectable per project/field.
- **Published:** language switcher + geo default + `localStorage` persistence; eventually
  **hreflang + per-locale `<title>`/meta** so translated pages rank.

## Staged phases (pilot-first; gate after each)

- **Phase 0 — Lumen ships contained (NOW, not part of this track).** Twin `_nl` fields + Lumen-scoped
  header toggle + `lumen.v1.js`. Gets the paying client live; proves the *published* toggle/geo UX.
- **Phase 1 — Platform content-language layer (independent mode).** Locale-keyed content model +
  per-project locale config + **editor language toggle** (shared, language-aware Editables/persistence)
  + published switcher. **Pilot: migrate the live Lumen onto it** (EN/NL independent). **Gate:** Lumen
  renders + publishes identically on the platform layer; existing single-language projects unaffected.
- **Phase 2 — Assisted translation mode.** Per-field LLM translate (reuse the generation provider),
  reviewable, `<em>`/HTML-preserving, optional per project. **Pilot: naayom → Hindi.** **Gate:** a
  naayom page publishes EN+HI; translation quality acceptable; cost bounded (cache by source-string
  hash; translate only changed strings).
- **Phase 3 — SEO + scale.** hreflang, per-locale routes/meta/OG, more locales, RTL audit if ever
  needed, language-switcher polish.

## Decision gates / open questions (resolve when un-deferred)

1. Content model: locale-keyed map per project (`content[locale]`) vs per-field locale variants —
   pick one that's back-compatible (default locale = existing content).
2. Editor UX: a single language toggle re-pointing all Editables (recommended) vs side-by-side.
3. Translation cost control: hash-cache unchanged source strings; translate-on-demand vs at-publish.
4. SEO scope for v1: on-page switcher only, or hreflang/per-locale meta from the start (real value for
   a marketing-page tool — lean include).
5. Geo fidelity: `request.geo` (Vercel edge) + `navigator.language` fallback now; true IP-geo on the
   blob-proxy/ISR serve path later.
6. Locale set to support first (en/nl/hi) and how new locales are added.

## Related
- `docs/guides/newTemplate.md` §13 (bespoke templates), §3f (CSS boundary).
- PO decision (2026-06-29): Lumen-contained bilingual approved; no shared i18n infra yet.
- Memory: multilingual platform direction; [[project_before_customer_2]] (don't build shared infra for
  one client — this clears that bar with 2 use cases).
