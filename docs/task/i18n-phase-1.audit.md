# i18n-phase-1 — implementation audit

## Phase 1 — Content-model types + locale resolver (foundation)

**Files changed**
- `src/types/core/content.ts` (modified)
- `src/lib/i18n/localeContent.ts` (new)
- `src/lib/i18n/localeContent.test.ts` (new)

### What changed

`src/types/core/content.ts`
- Added `LocaleConfig` = `{ locales: string[]; defaultLocale: string }` (D4).
- Added `LocaleContentOverlay` = `{ [locale]: { [sectionId]: { [elementKey]: string | string[] } } }` (D1, text-only overlay).
- Extended `LandingPageContent` with optional `localeContent?: LocaleContentOverlay` and `localeConfig?: LocaleConfig`. Both OPTIONAL → legacy single-locale content is untouched.

`src/lib/i18n/localeContent.ts` (plain module, NOT `'use client'`)
- `resolveLocaleElements(base, overlay?, locale?) => Record<sectionId, SectionData>`
- `getEffectiveElementValue(base, overlay?, locale?, sectionId, elementKey) => string | string[] | undefined`
- `isMultiLocale(config?) => boolean` (true iff config exists and `locales.length > 1`)
- `SUPPORTED_LOCALES` readonly tuple = `['en','ja','es','pt','fr','it','id','nl','th','vi','de','pl']` (en first = default) + derived `SupportedLocale` union type.

### Shape decisions
- **Merge granularity = per-elementKey shallow override.** Overlay carries text only (`string | string[]`), so an overlaid key wholesale-replaces the base value for that key. Merge = `{ ...section.elements, ...sectionOverlay }` inside a fresh `SectionData` (`{ ...section, elements: ... }`). Base and `base.elements` are never mutated.
- **Nested V2 collection values** (arrays of objects, e.g. gallery `images`) are NOT deep-merged — when no overlay key exists for them they pass through by reference untouched; when overlaid, the whole value is replaced. Test `passes nested V2 collection values through untouched` asserts the collection is returned by identity (`toBe`).
- **Referential no-op fast path.** When `overlay`/`locale` is absent, or the locale has no overlay entry, `resolveLocaleElements` returns `base` AS-IS (same reference) — nothing to merge. Sections lacking an overlay entry keep their original `SectionData` reference; only sections with overlay get a new object. Keeps future perf/memo work honest.
- **Iterate base keys only.** Stray overlay sections not present in base are ignored (D1: overlay never introduces structure).
- `getEffectiveElementValue` return type is `string | string[] | undefined` — the text-reader contract Phase 3b consumes; base collection values fall outside its intended use.

### Deviations from plan
- The plan mentions `ProjectContent` (declared in `saveDraft`/`loadDraft` route files) gaining `localeConfig?`. Those route files are OUT of Phase 1's Files-touched (they belong to Phase 2). Per the task's own note ("canonical page type extension goes here in content.ts"), I added `localeConfig?` to the canonical `LandingPageContent` in content.ts only. The route-level `ProjectContent` typing is Phase 2's job. No out-of-scope files touched.

### Verification
- `npx tsc --noEmit` — clean (no output).
- `npx vitest run src/lib/i18n/localeContent.test.ts` — `Test Files 1 passed (1)`, `Tests 14 passed (14)`.
- `npm run test:run` (full suite) — `Test Files 129 passed | 1 skipped (130)`, `Tests 2030 passed | 3 skipped (2033)`. Nothing else broke.
- No-import check: `grep -rn "lib/i18n\|localeContent" src/ --include=*.ts --include=*.tsx` (excluding the module itself) returns only `src/types/core/content.ts:106` — the `localeContent?` field name, a coincidental substring match, NOT an import. Zero runtime/production code imports the module → zero behavior change.

### Open risks / notes for next phases
- `getEffectiveElementValue` typed for text (`string | string[] | undefined`); Phase 3b readers that need collection values should read via `resolveLocaleElements(...).elements[key]` instead.
- The resolver's shallow-per-key semantics mean per-item text INSIDE a collection (e.g. a testimonial quote in an array) cannot be independently localized with the current overlay shape — only whole top-level elementKeys. If per-collection-item localization is needed later, the overlay type must be extended.
- `resolveLocaleElements` returns `base` by identity on the no-op path; callers must treat the result as read-only (as they already do with `state.content`).
