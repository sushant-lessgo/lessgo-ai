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

## Phase 2 — Pro gating: plan flag, API exposure, publish-time strip

**Files changed**
- `src/lib/planManager.ts`
- `src/app/api/billing/plan/route.ts`
- `src/app/api/publish/route.ts`
- `src/lib/planManager.test.ts` (new)

**Per-file changes**
- `planManager.ts`: added `trackingPixels: boolean` to `PlanConfig['features']` with a config-only comment (deliberately not a DB column; create/upgrade/downgrade writers left untouched). Added the flag to all four `PLAN_CONFIGS` entries (FREE=false; PRO/AGENCY/ENTERPRISE=true). Added exported `hasTrackingPixels(userId)` — resolves tier via `getUserPlan` then reads `PLAN_CONFIGS[tier].features.trackingPixels === true`; fail-closed (false) on error/unknown tier. Comment explains why it does NOT use `hasFeature` (fail-open on missing DB column). `hasFeature` unchanged.
- `billing/plan/route.ts`: imported `PLAN_CONFIGS`/`PlanTier`; added `trackingPixels: PLAN_CONFIGS[plan.tier as PlanTier]?.features.trackingPixels ?? false` to the returned `features` object (config-derived, same source as server gate).
- `publish/route.ts`: imported `hasTrackingPixels`; added the Pro gate immediately AFTER the sanitizeSeo block and BEFORE the chrome-injection block / DB write. When `!(await hasTrackingPixels(userId))`, it deletes `metaPixelId`/`ga4MeasurementId` from `c.seo` and from every `sub.seo`. Strip only — never rejects/throws.
- `planManager.test.ts`: new suite mocking `@/lib/prisma` (`userPlan.findUnique`) and `@/lib/logger`. Drives tier through the findUnique stub. Cases: FREE→false, PRO→true, AGENCY→true, ENTERPRISE→true, DB-error→false, garbage-tier→false, plus a direct `PLAN_CONFIGS` mapping assertion.

**Publish-strip positioning:** mutates `content.seo` (root) and each `content.subpages[*].seo`, in place, right after sanitizeSeo and before the chrome injection + DB write — so every downstream republish path inherits clean content.

**Test mocking resolution:** mocked `getUserPlan`'s dependency (`prisma.userPlan.findUnique`) rather than the function itself — matches the sibling pattern in `src/app/api/forms/submit/route.test.ts`. `getUserPlan` returns the stubbed row directly; `hasTrackingPixels` maps its tier through `PLAN_CONFIGS`.

**tsc:** clean except the known pre-existing `src/app/page.tsx` missing `@/assets/images/founder.jpg` error (unrelated).

**Tests:** `npm run test:run` → 2126 passed, 3 skipped, 1 failed. The single failure (`i18nHonesty.test.ts` — generateStaticHTML 5s timeout) is a pre-existing flake under full-suite load; it PASSES in isolation (15/15) and is unrelated to Phase 2 (touches no Phase 2 files). New `planManager.test.ts`: 7/7 pass.

**Deviations:** none. No DB column / migration added (per plan). `hasFeature` left untouched.

**Open risks:** the i18n full-suite timeout flake is orthogonal but worth noting for CI stability.
