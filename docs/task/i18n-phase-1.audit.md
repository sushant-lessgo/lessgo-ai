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

## Phase 2 — Persistence: saveDraft/loadDraft locale-aware

**Files changed**
- `src/lib/validation.ts` — `DraftSaveSchema`: added optional top-level `localeConfig`.
- `src/app/api/saveDraft/route.ts` — destructure `localeConfig`; comment + wholesale-replace merge for `localeConfig`; comment the existing `...finalContent` spread as the `localeContent` ride-along site.
- `src/app/api/loadDraft/route.ts` — pass `localeConfig` through the whitelisted response (it WAS being stripped).
- `src/app/api/saveDraft/i18n.test.ts` (new) — tests (a)–(f).

### Schema changes
`DraftSaveSchema` gained one field: `localeConfig: z.object({ locales: z.array(z.string().max(20)).max(50), defaultLocale: z.string().max(20) }).optional()` — matches the Phase-1 `LocaleConfig` type. OPTIONAL, so legacy payloads validate unchanged. `localeContent` was deliberately NOT added to the schema: it rides inside `finalContent` (which is `z.unknown()`), so it already passes through untouched; declaring it top-level would be wrong. Comment in the schema documents this.

### Two merge mechanisms (as implemented + commented)
1. **`localeContent` — spread-ride (D1).** Lives inside `finalContent`; rides the existing shallow `{ ...existingContent.finalContent, ...finalContent, lastSaved }` spread (route ~line 161). Payload OMITS key ⇒ stored map PRESERVED; payload INCLUDES key ⇒ whole map REPLACED. No deep-merge added. Correctness rests on the store-side invariant (Phase 3a): every save that includes `localeContent` exports the COMPLETE map (all locales, all pages). Comment block added at the spread site stating this dependency.
2. **`localeConfig` — top-level wholesale-replace (D4).** Sibling of `finalContent`/`baseline`; does NOT ride the finalContent spread. Replaced wholesale exactly like `baseline`: present ⇒ overwrite; absent ⇒ preserved by the `...existingContent` spread at `updatedContent` construction. Read from the parsed value (it's validated), not raw body. Comment block added at the replace site mirroring the baseline comment.

### loadDraft — did it need edits? YES.
The GET response object WHITELISTS top-level keys (does not spread `content`). `finalContent` is returned whole, so the `localeContent` overlay inside it passes through untouched — no edit needed for the overlay. But top-level `localeConfig` was NOT in the whitelist and would have been silently dropped, so one line was added: `localeConfig: content.localeConfig ?? null` (mirrors `baseline`). Null for legacy projects.

### Test list (all pass)
- (a) legacy payload round-trips byte-identical (back-compat) — PASS
- (b) legacy project grows NO `localeContent`/`localeConfig` keys across a save→load→save cycle (deep recursive key scan) — PASS
- (c) EN edit carrying the full map keeps the existing NL overlay — PASS
- (d) SAFETY-CRITICAL: payload OMITTING `localeContent` preserves the stored overlay (spread semantics) — PASS
- (e) `localeConfig` wholesale-replace + absent-preserves (mirrors baseline) + load round-trip — PASS
- (f) multi-page + multi-locale full-map round-trip (root + subpage overlays) + partial/empty-map detectability scaffold — PASS

Test harness runs the REAL `DraftSaveSchema` and REAL route merge logic against a shared in-memory store; only auth/prisma/security/rateLimit/admin are mocked (sibling API-test pattern).

### Verification
- `npx tsc --noEmit` — clean.
- `npm run test:run` — `Test Files 130 passed | 1 skipped (131); Tests 2036 passed | 3 skipped (2039)`. New tests included; no single-locale regressions.

### Deviations
None. In-scope judgment call: `localeContent` left off the schema (rides `z.unknown()` finalContent) rather than adding a redundant nested schema — conservative, matches D1's "rides the existing spread."

### Notes for Phase 3a (CONTRACT)
- **Full-map export invariant is load-bearing.** saveDraft's `localeContent` correctness depends ENTIRELY on the store always exporting the COMPLETE `localeContent` map on every save that touches locales — all declared locales' authored overlays, across the multi-page working-copy park boundary. A save that emits a partial/empty map WILL wipe the omitted locale(s) (the whole map is replaced when the key is present). Enforce with the dev-mode assertion (plan 3a step 7) before the payload leaves the store.
- Test (f) contains a route-side `declaredLocalesFullyPresent(config, localeContent)` scaffold demonstrating partial-map detectability; 3a's store-side flush assertion should mirror this shape so it plugs into the same fixture.
- A legacy store must NEVER send `localeConfig: null` — the schema is `.optional()` (rejects null). Omit the key entirely when there is no config (the route preserves absent = existing).
