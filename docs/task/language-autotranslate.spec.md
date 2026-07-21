# language-autotranslate (Spec 2) — spec

LLM-assisted translation for multilingual projects (i18nPlan **Phase 2**). Fills a non-default
locale's overlay by translating the default-locale copy, per-field and reviewable. Stacks on
**language-settings (F1)**. Agreed 2026-07-21.

**Tier: full** (LLM generation path + credit cost + translation-quality gate + publish surface).

## Problem / why
- The Languages panel (F1) can *declare* a second locale, but adding one gives **empty fields to
  hand-author** (independent mode). The designer's panel shows Auto-translate **ON by default**
  with per-language "Auto-translated · N edits" status — i.e. the intended default UX is machine
  translation, which does not exist yet.
- F1 greys two affordances pending this spec: the **Auto-translate toggle** and **"change site
  language = translate"** (never regenerate — that would destroy user copy, founder ruling).
- Concrete pilot: **naayom → Hindi** (founder won't hand-write Hindi; same message, another
  language). i18nPlan Phase 2.

## What already exists (do NOT rebuild)
- Overlay content model + `resolveLocaleElements` (`src/lib/i18n/localeContent.ts`) — translation
  writes into `localeContent[locale][sectionId][elementKey]`.
- Per-locale published pages + switcher (Phase 1). No new publish machinery needed.
- Generation provider stack: `aiClient.ts` / `modelConfig.ts` (add a `translate` model entry).
- F1's Languages panel + `LocaleSettings` add/remove flow — this spec **un-greys** its toggle.

## Decisions (locked / proposed)
1. **Reuse the generation provider** (Claude via `aiClient`), new `translate` model config. Not a
   third-party MT API.
2. **Per-field, HTML-preserving.** Translate one element at a time; inline markup (`<em>`, `<strong>`,
   `<a>`, line breaks) must survive verbatim — only human-readable text is translated.
3. **Incremental + cached.** Cache by **source-string hash**; translate only strings that are new
   or changed since the last run. Re-translate never re-hits unchanged fields (cost bound + the
   Phase-2 gate).
4. **Never clobber user edits.** Track which target fields the author hand-edited after machine
   translation (the designer's "· N edits"); a re-translate skips edited fields unless the user
   explicitly forces it. Manual overlay edits win.
5. **Two triggers:**
   a. **Add language + Auto-translate ON** → machine-fill the new overlay from base.
   b. **Change site language (monolingual)** → in-place: translate the base map, swap `defaultLocale`
      to the new language. Single-locale so no base↔overlay swap-lock issue. Un-greys F1's action.
6. **Credit-costed.** New `TRANSLATE` credit cost (`creditSystem.ts` + `creditCosts.ts`), charged
   per translate run; incremental caching keeps repeat cost near-zero.
7. **Scope boundary = whatever the overlay reaches** — section-level top-level elementKeys only.
   Per-collection-item text + nav labels are **NOT translatable until the item-nav-i18n follow-up**
   deepens the overlay; auto-translate covers them automatically once that write path exists.

## Scope
IN: per-field translate call (HTML-preserving) · source-hash cache + changed-only incremental ·
edited-field tracking + skip-on-retranslate · Auto-translate toggle (un-grey F1) · monolingual
change-language = in-place base translate (un-grey F1) · `TRANSLATE` credit cost · per-language
"· N edits" + retranslate action (the `more_horiz` menu) · translate model in `modelConfig`.
OUT (→ **item-nav-i18n** follow-up): translating collection-item text + nav labels (needs the
overlay write path first).
OUT: per-locale title/desc/OG meta (Phase 3) · RTL · translation memory across projects.

## Constraints
- **Inline-markup fidelity** is the top correctness risk — a golden/fixture test that round-trips
  `<em>`/`<a>`/multi-sentence strings and asserts markup is byte-identical, only text changed.
- **Cost bound is a gate, not a nicety** — prove changed-only caching with a test (re-run over an
  unchanged project = 0 model calls).
- Dual-renderer parity stands; overlay already renders both sides — no per-template work.
- `activeLocale` regen-lock unchanged (regen still default-locale only).
- Published/client boundary + bundle firewall stand.

## Acceptance
- [ ] Add a locale with Auto-translate ON → the new locale's overlay is machine-filled from base;
      published page renders it.
- [ ] Inline markup preserved verbatim across translation (fixture test).
- [ ] Re-translate an unchanged project = **zero** model calls (cache/incremental test).
- [ ] Hand-edit a translated field, re-translate → the edited field is **not** overwritten; "· N
      edits" reflects it.
- [ ] Monolingual "change site language" translates existing copy in place (no regeneration, no
      lost edits) and updates `defaultLocale`.
- [ ] Credits decrement per translate run per `TRANSLATE` cost; incremental re-run ≈ 0.
- [ ] **naayom EN+HI pilot**: publishes both locales; founder judges Hindi quality acceptable.

## Open questions
1. Translate **granularity** — one call per element (simplest, most calls) vs batched per section
   (cheaper, harder markup isolation)? Plan decides with a cost estimate.
2. Where "· N edits" tracking lives — a per-field `sourceHash` alongside the overlay value, or a
   sibling metadata map? (Affects the overlay shape.)
3. Model + params for translation quality/cost (Sonnet per pricing-v2?) — modelConfig `translate`.

## References
- `docs/tracks/Completed/i18nPlan.md` — Phase 2 definition + gate (naayom→Hindi, cost bound).
- `docs/task/language-settings.spec.md` — F1; the greyed affordances this un-greys.
- `src/lib/i18n/localeContent.ts` — overlay model + resolver (translation target).
- `src/lib/aiClient.ts` / `src/lib/modelConfig.ts` — provider stack to reuse.
- `src/lib/creditSystem.ts` / `src/lib/creditCosts.ts` — new `TRANSLATE` cost.
- Memory: [[project_i18n_multilingual]] · [[project_pricing_v2]] (credit model).
