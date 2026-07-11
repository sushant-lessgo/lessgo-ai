# tracking-pixels — audit

## Phase 1 — storage + snippet builders + head injection + fan-out

**Files changed**
- `src/types/store/pages.ts`
- `src/lib/staticExport/headTags.ts`
- `src/lib/validation.ts`
- `src/lib/staticExport/htmlGenerator.ts`
- `src/lib/staticExport/renderPublishedExport.ts`
- `src/lib/staticExport/headTags.test.ts`
- `src/lib/validation.test.ts`

### Per-file changes

- **pages.ts** — added `metaPixelId?: string` + `ga4MeasurementId?: string` to `PageSeo`, each with the "site-wide; only meaningful on the root (home) entry" comment mirroring `faviconUrl`.
- **headTags.ts** — exported `META_PIXEL_ID_RE` (`/^\d{5,20}$/`) and `GA4_MEASUREMENT_ID_RE` (`/^G-[A-Z0-9]{4,20}$/`); added pure builders `metaPixelSnippet(pixelId?)` and `ga4Snippet(measurementId?)`. Each returns `''` on absent-or-regex-fail input (defense-in-depth layer c) and otherwise the verbatim vendor markup with the ID interpolated at both occurrences. Non-empty fragments start with `'\n  '` per module convention. No new imports (module stays pure/dependency-free — no `server-only`).
- **validation.ts** — imported the two shared constants from `@/lib/staticExport/headTags`; added `metaPixelId`/`ga4MeasurementId` `.regex(...).optional()` to `PageSeoSchema`. Regexes not redefined.
- **htmlGenerator.ts** — imported the two builders; added `metaPixelId?`/`ga4MeasurementId?` to `StaticHTMLOptions`; threaded through the nested `metadata` object and `buildHTMLDocument`'s `metadata` param type; interpolated both builders in the head template immediately after `${jsonLdScriptTag(metadata.jsonLd)}`.
- **renderPublishedExport.ts** — resolved `metaPixelId`/`ga4MeasurementId` ONCE from root `contentData.seo` next to the `goal` resolution; passed the SAME two values into all three `generateStaticHTML` call sites (root, subpage loop, locale docs). Never read from `sub.seo`/`p.seo`.
- **headTags.test.ts** — added `metaPixelSnippet`/`ga4Snippet` suites: `''` for undefined/`''` (byte-identity); `''` for `'123"><script>'`, `'G-<img>'`, `'javascript:x'`, lowercase `'g-abc123'`, 4-digit `'1234'`; valid meta ID asserts `connect.facebook.net/en_US/fbevents.js`, `fbq('init', '<id>')`, `facebook.com/tr?id=<id>`; valid GA4 asserts `googletagmanager.com/gtag/js?id=<id>` and `gtag('config', '<id>')`; both assert the `'\n  '` prefix.
- **validation.test.ts** — added: valid tracking IDs survive `sanitizeSeo`; an invalid ID drops the whole blob (safeParse behavior); a legacy seo blob without tracking fields round-trips unchanged (regression).

### Deviations
None. Stayed within the Files-touched list. Did not touch planManager, publish route, or the modal (Phases 2/3).

### Test / gate results
- `npx tsc --noEmit`: only pre-existing unrelated error `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'` (confirmed present on the stashed baseline). No errors from touched files.
- `npm run test:run`: `Test Files 138 passed | 1 skipped (139)`, `Tests 2120 passed | 3 skipped (2123)`. New/related files: 23 passed.

### Open risks
- Blog-post export path (`publishBlogPost.ts`) still calls `generateStaticHTML` without these options → its output stays unchanged (intentionally out of pilot scope; absent options → `''`).
- No gating yet — any tier's stored IDs would render until Phase 2 adds the publish-time strip.
