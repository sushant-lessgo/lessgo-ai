# `src/lib/i18n` — the locale layer

Server-safe, plain modules (**no `'use client'` anywhere in this directory** — server
prompt builders, the static exporter and the `/p` SSR pages all import from here; see the
published/client boundary law in the root `CLAUDE.md`). No React, no DOM, no prisma.

| File | Job |
|---|---|
| `localeContent.ts` | `SUPPORTED_LOCALES` (closed at 12) · `isMultiLocale()` · `resolveLocaleElements()` — the ONE overlay resolver · `getEffectiveElementValue()` |
| `localeNames.ts` | the two name maps + `localeLabel` / `toPromptLanguage` / `labelToLocaleCode` |
| `projectLocale.ts` | the two GENERATION seams: `resolvePromptLanguage` (first-gen) · `readDefaultLocale` (regen) |
| `publishedLocale.ts` | the PUBLISHED seams: `resolvePublishedLocale` (locale routing) · `switcherTagsForSsr` / `switcherConfigJson` / `resolveSsrBasePath` · `buildLocaleAlternateMap` |
| `localeSlugCollision.ts` | guards a subpage slug that would shadow a locale prefix |
| `i18nHonesty.test.ts` | asserts the `bilingual` capability is actually backed by shipped machinery |

## The content model (i18n phase 1, unchanged)

Base `content` **is** the default locale's copy — zero migration. Other locales are
**text overlays** (`localeContent[locale]`), resolved at read time by
`resolveLocaleElements`. Structure (sections, layouts, collections) is locale-SHARED;
only text forks.

### Invariant: non-null `localeConfig` ≠ multi-locale (ruling 10)

`{ locales: ['nl'], defaultLocale: 'nl' }` is a legal SINGLE-locale config meaning "this
site's declared language is Dutch". It is the only durable record of a non-English site
language, so `removeLocale` **preserves** it rather than clearing to null (clearing would
make regen fall back to English and re-create the "picked English, got Dutch" bug from the
other direction). `removeLocale` also refuses to remove the default locale at all.

⇒ Gate every multi-locale surface (switcher, `/{locale}` docs, hreflang, the editor
language pills) on `isMultiLocale()`, **never** on `localeConfig != null`.

Corollary: `localeConfig === null` is the legacy/monolingual shape and must stay
byte-identical — the store omits the key entirely unless the project has engaged with
languages, and publish persistence is presence-gated.

## The two name maps (do not merge them)

| Map | Values | Consumers |
|---|---|---|
| `LOCALE_DISPLAY_NAMES` / `localeLabel()` | **native** — `Nederlands`, `日本語` | UI only (LanguagesPanel, LanguageToggle, the onboarding picker) |
| `LOCALE_ENGLISH_NAMES` / `toPromptLanguage()` | **English exonyms** — `Dutch`, `Japanese` | prompts only |

Prompts get exonyms because the directive interpolates the value into English
instructions ("…no English fragments (unless ${language} IS English)") — a native name
would read "unless Nederlands IS English". `labelToLocaleCode()` maps EITHER map's label
back to a code; it accepts **labels only** and returns `null` for a bare code (`'nl'` →
`null`) and for unmapped labels (`'Hindi'` — not in `SUPPORTED_LOCALES`).

## The two generation seams (`projectLocale.ts`)

They are different because the two paths have different data available:

- **First generation** — the four audience routes (`product|service` ×
  `strategy|generate-copy`) carry **no tokenId**, so there is nothing to bind a Project
  read to. The wizard, which already knows the pick, sends the resolved ISO code on the
  request body; the route runs `resolvePromptLanguage(body.language)`, which validates
  against `SUPPORTED_LOCALES`, falls back to `'en'` on absent/invalid, and returns an
  English exonym. It never throws and never 400s (language is a prompt input, not an
  authz input) — the hard guarantee is that **raw client input never reaches a prompt**.
  No prisma import enters those routes.
- **Regeneration** — `scopedRegen` genuinely holds the Project row, so it server-reads
  `readDefaultLocale(project.content)` (safe-parse of
  `content.localeConfig.defaultLocale`) and maps it with `toPromptLanguage`.

Both derive from the same wizard pick, so they agree. The directive is emitted
**unconditionally**, English included — the original bug was the model inferring a
language from a non-English one-liner, so an explicit "write in English" is the fix.

**Work engine** reconciles per ruling 4: `content.localeConfig.defaultLocale` wins when
present; the raw `facts.languages[0]` label is the fallback for legacy work projects.

## The publish/serve seams (`publishedLocale.ts`)

`resolvePublishedLocale` mirrors `switcher.v2`'s `segAt` so the SSR routes and the client
script agree on what a locale prefix is (first segment only; declared; NOT the default).
`switcherTagsForSsr` stamps `basePath` server-side and emits a **relative** script src.
Full narrative — config shape, `style: 'none'` semantics, the SSR `<html lang>` gap, the
republish caveat — lives in `docs/architecture/publishArch.md` › "Multi-locale publishing".

## ⚠️ Asset immutability (the switcher)

`public/assets/switcher.v2.js` is built from `src/lib/staticExport/switcherBehaviors.js`.
`switcher.v1.js` is **FROZEN** at `scripts/legacy/switcher.v1.src.js` because every page
published before 2026-07-21 loads it forever.

**Never edit a shipped switcher in place.** A semantic change ships as a NEW filename
(`switcher.v3.js`) with the old source frozen alongside — contract in
`scripts/buildAssets.js`, enforced by the content-hash assertion in
`src/lib/staticExport/switcherBehaviors.v2.test.ts`.

## Known limits (shipped state, 2026-07-21)

- **Unsupported languages.** `SUPPORTED_LOCALES` is closed at 12. A label outside it
  (e.g. Hindi) generates copy fine — the work prompt consumes the label directly — but
  **declares no `defaultLocale`**, so `<html lang>`, hreflang and future translate
  features won't know the language. Widening the list is a separate decision.
- **Work multi-select declares only `languages[0]`.** A work project that selects several
  languages records the first one as its site language.
- **Work regen with a bare code.** If `facts.languages` holds `'nl'` instead of `'Dutch'`
  and no `localeConfig` exists, `labelToLocaleCode` rejects the bare code and the raw value
  passes through verbatim — the prompt renders `## OUTPUT LANGUAGE — nl` (un-normalized),
  not an exonym (`scopedRegen.ts:674-675`). Pre-existing; declaring a `localeConfig` fixes it.
- **No onboarding language picker for work/granth.** The picker is hidden for the work
  engine because work first-gen takes its language from the `languages` question, not from
  the picker — a visible control that drove nothing. Those users set the language in
  Site Settings → Languages instead.
- **No translation.** Adding a language gives an EMPTY overlay to hand-author.
  Auto-translate and "change the site language" (= translate, never regenerate) are greyed
  `<Coming>` placeholders pending Spec 2.
- **Per-locale meta** (title/description/OG) and RTL are out of scope; so is swapping which
  locale owns the base content.
- Per-collection-item text and nav labels are not localizable yet (phase-1 limit).
