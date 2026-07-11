# Multilingual (i18n) — Platform Track Plan

> **STATUS: PHASE 1 BUILT 2026-07-11** (branch `feature/i18n-phase-1`; plan
> `docs/task/i18n-phase-1.plan.md`, audit `docs/task/i18n-phase-1.audit.md`). Independent-authoring
> content-language layer shipped end-to-end (en/nl exercised generically). Spec:
> `docs/task/i18n-phase-1.spec.md`. **Pilot changed: atelier/Kundius EN/NL** (Lumen retires
> bespoke-off — its twin-field hack is superseded, NOT migrated). Phases 2–3 stay deferred.
> Un-deferred 2026-07-11 (founder ruling; evidence: coverage-100 — bilingual needed 21/101, 28/101
> non-English, findings §8 platform priority #4); originally deferred 2026-06-25. Full
> atelier/Kundius end-to-end acceptance (incl. per-template NL render fidelity) lands in the
> **atelier template build** — this track delivered the generic mechanism.

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
- **Phase 1 — Platform content-language layer (independent mode). BUILT 2026-07-11** (branch
  `feature/i18n-phase-1`). Locale-keyed content model + per-project locale config + **editor language
  toggle** (shared, language-aware Editables/persistence) + published switcher. Generic **en/nl**
  exercised (full atelier/Kundius EN/NL end-to-end acceptance deferred to the atelier template build).
  Existing single-language projects: zero storage/behavior diff.
  - **What shipped:** locale-overlay content model (base = default locale = today's flat `content`,
    zero migration; non-default locales in a sibling text-only overlay) · locale-aware
    saveDraft/loadDraft with the **clear-contract** (absent=preserve, explicit null/`{}`=clear) ·
    editor language toggle + globe "Languages" config UI + locale-aware writes/reads/undo-redo (all
    keyed on `activeLocale`) · per-locale pre-rendered published docs at `/{locale}` with reciprocal
    hreflang + self-canonical + template-agnostic `switcher.v1.js` (geo/localStorage default) ·
    `bilingual` now a **queryable capability** (Brief `locales` derivation + `PLATFORM_CAPABILITIES`
    satisfaction for non-retired templates) backed by a structural **honesty test**.
- **Phase 2 — Assisted translation mode.** Per-field LLM translate (reuse the generation provider),
  reviewable, `<em>`/HTML-preserving, optional per project. **Pilot: naayom → Hindi.** **Gate:** a
  naayom page publishes EN+HI; translation quality acceptable; cost bounded (cache by source-string
  hash; translate only changed strings).
- **Phase 3 — SEO + scale.** hreflang, per-locale routes/meta/OG, more locales, RTL audit if ever
  needed, language-switcher polish.

## Phase 1 — key decisions (D1–D5, LOCKED at build)

- **D1 — content shape:** default-locale base + per-locale overlay. Flat `content` stays as-is and
  IS the default locale (zero migration); non-default locales live in a sibling text-only
  `localeContent` map. Reads/writes resolve through one `resolveLocaleElements` helper
  (overlay-first, then extract) on BOTH editor and published paths (parity-ordering invariant).
- **D2 — published strategy:** per-locale **pre-rendered blobs** (default at `/`, non-default at
  `/{locale}` + `/{locale}/{sub}`), NOT client-swap — reuses the multi-page export/`extraRoutes`/KV
  machinery, no template involvement, no form/analytics rebind traps.
- **D3 — SEO in v1:** reciprocal hreflang + self-canonical + x-default **ship in v1** on every
  locale doc of a multi-locale project (crawler-safe geo redirect). Per-locale title/desc/OG
  deferred. Single-locale emits none (byte-identical).
- **D4 — locale config home:** JSON `localeConfig { locales, defaultLocale }` in project content
  (no Prisma migration).
- **D5 — URL scheme:** `/nl` **path prefix** (founder-locked 2026-07-11; default at root). Globe
  "Languages" button kept in the header for all projects.

**Lumen twin-field supersession:** this platform layer supersedes Lumen's bespoke `_nl` twin-field
mechanism. Lumen is **retired-in-place** — its template declaration stays (harmless), but the
twin-field mechanism is NOT migrated onto the platform layer.

## Phase 1 — v1 limitations / deferred (boundaries for future work + the atelier build)

- **Assisted / LLM translation deferred to Phase 2** (naayom → Hindi) — v1 is independent-authoring
  only.
- **Per-locale title/description/OG meta deferred** (only hreflang/canonical ship in v1).
- **RTL out.**
- **Nav labels NOT localizable in v1** — `navigationConfig` slice + template `nav_items` collection
  have no overlay write path; locale-shared.
- **Per-collection-item card text NOT localizable** — the overlay is whole-top-level-elementKey only;
  text inside `items[]`/`related[]` object arrays renders default-locale copy in every locale.
- **Default-locale change LOCKED** in the editor (base map IS the default locale; swapping would
  require base↔overlay swap).
- **Switcher path-prefix swap assumes locale = first path segment** — works on custom-domain /
  subdomain serve, NOT on the `/p/{slug}` SSR/preview path.
- **Regen disabled on non-default locale** (store guard + UI disable); no regen-into-locale in v1.
- **Per-template NL render fidelity remains a MANUAL gate** — the honesty test proves the machinery
  (resolver / switcher asset / head-tag injection / per-locale routes), NOT the typography
  (fixed-width text, hardcoded English in blocks, long-word overflow). First exercised in the
  **atelier template build**.

## Original decision gates / open questions (resolved above where noted)

1. Content model — **RESOLVED D1** (default-locale base + overlay).
2. Editor UX — **RESOLVED D2** (single toggle, no side-by-side).
3. Translation cost control — deferred to **Phase 2** (assisted translation).
4. SEO scope for v1 — **RESOLVED D3** (hreflang/canonical ship; per-locale meta deferred).
5. Geo fidelity: `geo-country` cookie (middleware) + `navigator.language` fallback shipped; true
   IP-geo on the serve path later.
6. Locale set — **RESOLVED** (`SUPPORTED_LOCALES` = en + 11 coverage-100 langs).

## Related
- `/new-template` skill (`.claude/skills/new-template/SKILL.md`) §13 (bespoke templates), §3f (CSS boundary).
- PO decision (2026-06-29): Lumen-contained bilingual approved; no shared i18n infra yet.
- Memory: multilingual platform direction; [[project_before_customer_2]] (don't build shared infra for
  one client — this clears that bar with 2 use cases).
