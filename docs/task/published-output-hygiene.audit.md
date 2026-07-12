# published-output-hygiene — Phase 1 audit

## Files changed
- `src/lib/staticExport/buildPageMetadata.ts`
- `src/lib/staticExport/buildPageMetadata.test.ts`
- `src/app/p/[slug]/[...subpath]/page.tsx`
- `docs/task/published-output-hygiene.audit.md` (this file)

## Goal
Strip HTML tags from published SEO title + meta description so `<em>`/`<strong>`
markup can't leak into Google/social meta. Uses the repo-standard `stripHTMLTags`
from `src/utils/smartTitleGenerator.ts` (plain module, `html.replace(/<[^>]*>/g,'').trim()`)
AS-IS — no new sanitizer.

## Per-file changes

### src/lib/staticExport/buildPageMetadata.ts
- Added import: `import { stripHTMLTags } from '@/utils/smartTitleGenerator';` (after the
  `canonicalUrl` import, before the `PageSeo` type import).
- `buildPageMetadata()` (~line 126): wrapped the `rawDesc` derivation in `stripHTMLTags(...)`
  BEFORE the `.slice(0, 160)` cap — reclaims char budget and avoids a truncated-tag remnant
  after capping.
- After the `title` resolution (~line 140): added `cleanTitle = stripHTMLTags(title)` and
  `cleanDescription = stripHTMLTags(description)` — strips the FINAL resolved strings so
  `seo.title`/`seo.description` overrides are covered (og/twitter reuse these two strings).
- Return object now emits `title: cleanTitle` / `description: cleanDescription`.
- Downstream `escapeHTML()` untouched — strip removes tags only, never encodes, so no
  double-escape. `seo.description` (unstripped path) is still capped only when it's the
  auto path; that behavior is unchanged (only the auto-description gets the 160-cap; the
  strip now runs on the final value regardless).

### src/app/p/[slug]/[...subpath]/page.tsx  (inline strip, NO refactor onto buildPageMetadata)
Exact insertion points (line numbers are post-edit approximations of the metadata builder):
- Added import: `import { stripHTMLTags } from '@/utils/smartTitleGenerator';` after the
  `getPublishedGoal` import (~line 9).
- `pdEl` (product-detail) branch:
  - `headline` (~line 79): `stripHTMLTags([model, name].filter(Boolean).join(' '))` before the
    `|| sub?.title || ...` fallback chain.
  - `intro` (~line 81): wrapped the `oneLiner`/`lede` fallback in `stripHTMLTags(...)` BEFORE the
    `157 + '...'` cap (honors the non-blocking reviewer note: strip before the cap, same
    truncated-tag rationale as subheadline).
- hero branch:
  - `headline` (~line 86): `stripHTMLTags(heroElements.headline?.content || '')` before the
    `|| sub?.title || ...` fallback.
  - `subheadline` (~line 87): wrapped in `stripHTMLTags(...)` BEFORE the 157-char cap.
- Final resolution (~line 94): changed `const pageTitle` → `let pageTitle`; after the
  `seo?.description`/`seo?.ogImage` overrides, added `pageTitle = stripHTMLTags(pageTitle);`
  and `description = stripHTMLTags(description);` just before the `faviconUrl` line / `return`.
  Covers both branches + `seo.title`/`seo.description` overrides in one place. `description`
  was already `let` (declared at top), so no declaration change needed there.

### src/lib/staticExport/buildPageMetadata.test.ts
Added two describe blocks (existing byte-identity + parity assertions untouched):
- `buildPageMetadata — HTML strip (Phase 1)`:
  - `<em>`/`<strong>` in headline (title) + subheadline (description) → tag-free, inner text
    preserved, no `[<>]`.
  - markup in `seo.title` / `seo.description` overrides → stripped.
  - 160-cap applied AFTER strip: `<strong>` wrapping 200 x's → exactly 160 x's, no tags.
  - documenting test: tags stripped, inner text + `&` + quotes preserved unchanged
    (no drop, no encode).
- `buildPageMetadata — favicon cascade`: holds the pre-existing favicon test (relocated out
  of the seo-overrides block during editing; assertions unchanged).

## Deviations from the plan
- None functional. The favicon-cascade test was moved into its own describe block as a
  mechanical consequence of inserting the new HTML-strip block; its assertions are byte-identical.

## Test / tsc results
- `npx tsc --noEmit`: the only error is pre-existing and unrelated —
  `src/app/page.tsx(6,26): error TS2307: Cannot find module '@/assets/images/founder.jpg'`.
  None of the three touched files produce errors.
- `npx vitest run src/lib/staticExport/buildPageMetadata.test.ts`: 29 passed.
- `npm run test:run` (full suite): 163 passed | 1 skipped (files); 2779 passed | 15 skipped
  (tests). No regressions.

## Open risks
- The subpath route has no unit harness; its strip reuses the same helper on the same shapes,
  so it's covered indirectly by the buildPageMetadata tests + the phase-4 live subpage check.
- `stripHTMLTags` also `.trim()`s — harmless for meta content (accepted per plan review
  decision 4). A bare `<`/`>` in prose is theoretically strippable; not a real meta shape here.
