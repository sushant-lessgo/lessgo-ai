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

---

# published-output-hygiene — Phase 2 audit

## Files changed
- `src/modules/templates/shared/footerHygiene.ts` (new)
- `src/modules/templates/shared/footerHygiene.test.ts` (new)
- `src/hooks/editStore/archetypes.ts`
- `src/modules/templates/meridian/blocks/Footer/HairlineFooter.tsx`
- `src/modules/templates/meridian/blocks/Footer/HairlineFooter.published.tsx`
- `src/modules/templates/techpremium/blocks/Footer/TechPremiumFooter.tsx`
- `src/modules/templates/techpremium/blocks/Footer/TechPremiumFooter.published.tsx`
- `src/modules/templates/hearth/blocks/Footer/ContactFooterRich.tsx`
- `src/modules/templates/hearth/blocks/Footer/ContactFooterRich.published.tsx`
- `src/modules/templates/surge/blocks/Footer/ContactFooterRich.tsx`
- `src/modules/templates/surge/blocks/Footer/ContactFooterRich.published.tsx`
- `src/modules/templates/lex/blocks/Footer/ColophonFooter.tsx`
- `src/modules/templates/lex/blocks/Footer/ColophonFooter.published.tsx`
- `src/modules/templates/lumen/blocks/Footer/LumenFooter.tsx`
- `src/modules/templates/lumen/blocks/Footer/LumenFooter.published.tsx`
- `src/modules/templates/vestria/blocks/Footer/VestriaFooter.core.tsx`
- `src/modules/templates/atelier/blocks/Footer/AtelierFooter.core.tsx`
- `src/modules/templates/granth/blocks/Footer/GranthFooter.core.tsx`
- `docs/task/published-output-hygiene.audit.md` (this file)

## Helper module — footerHygiene.ts
Plain module, NO 'use client' (imported by both editor + published renderers).

Final year regex (range-safe):
`/((?:©|\(c\)|&copy;)\s*)((?:19|20)\d{2})(?![\d–—-])/i`
Replaces the year only when it differs from `new Date().getFullYear()`; returns
input unchanged on no match; passes `undefined` through.

`filterFooterColumns<T extends { links?: any }>(columns, resolveHref)`:
maps each column to `{ ...col, links: links.filter(l => { const h =
resolveHref(l.href); return Boolean(h) && h !== '#'; }) }`, then drops columns
with `links.length === 0`. Spread-only (no mutation). Generic param + loose
`any` on links/href because each template footer has its own
`FooterColumn`/`FooterLink` types (some `href: string | Link`) — a strict
shared interface tripped "two different types with this name" tsc errors, so
the helper stays structurally loose and each caller passes its own
`resolveLinkHref`. (Deviation from plan's literal `FooterColumn`/`FooterLink`
interfaces — see Deviations.)

## Seed fix
`archetypes.ts:312` — `© 2024 ${brand}` → `` © ${new Date().getFullYear()} ${brand} ``.

## Per-footer copyright wrap (render points as-found)
- meridian `.published.tsx` — `{normalizeCopyrightYear(props.copyright) || '© Meridian'}` (was :94)
- meridian `.tsx` — `value={normalizeCopyrightYear(blockContent.copyright) ?? blockContent.copyright}` (MeridianEditable copyright, was :318)
- techpremium `.published.tsx` — wrapped `props.copyright` in the bottom `<div>` (was :95)
- techpremium `.tsx` — wrapped copyright TechPremiumEditable value (was :185)
- hearth `.published.tsx` — `{normalizeCopyrightYear(props.copyright) || '© Studio'}` (was :60)
- hearth `.tsx` — wrapped copyright HearthEditable value (was :178)
- surge `.published.tsx` — `{normalizeCopyrightYear(props.copyright) || ''}` (was :98)
- surge `.tsx` — wrapped copyright SurgeEditable value (was :305)
- lex `.published.tsx` — `{normalizeCopyrightYear(props.copyright) || ''}` (was :54)
- lex `.tsx` — wrapped copyright LexEditable value (was :168)
- lumen `.published.tsx` — wrapped BOTH `copyright` + `copyright_nl` incl. both `bilingualAttrs(...)` args AND the visible text (was :94)
- lumen `.tsx` — added `copyrightContent` shallow copy of `blockContent` with normalized `copyright`/`copyright_nl`; passed `content={copyrightContent}` to LumenEditable (store object never mutated) (editable was :151)
- vestria `.core.tsx` — `value={normalizeCopyrightYear(content.copyright) ?? content.copyright}` (was :102)
- atelier `.core.tsx` — same `?? content.copyright` pattern (was :121)
- granth `.core.tsx` — `value={normalizeCopyrightYear(content.copyright)}` (prop already accepts `string | undefined`; Devanagari `© २०२६` placeholder is an inert no-op for the ASCII regex, as expected) (was :44)

All plan line numbers matched reality.

## meridian + techpremium column/link filtering
- meridian `.published.tsx`: `columns = filterFooterColumns(rawColumns, resolveLinkHref)` before render.
- meridian `.tsx`: `displayColumns = mode === 'edit' ? columns : filterFooterColumns(columns, resolveLinkHref)`; render maps `displayColumns`. Add/remove affordances + mutations still reference raw `columns`.
- techpremium `.published.tsx`: `columns = filterFooterColumns(...)`; legal row filter extended to `l && l.label && resolveLinkHref(l.href) !== '#'` (hides row when empty).
- techpremium `.tsx`: `displayColumns` (edit→raw, else filtered) + `displayLegal` (edit→raw, else `l.label && resolveLinkHref(l.href) !== '#'`); bottom-bar guard uses `displayLegal.length > 0 || edit`.
- Add-link `href:'#'` seed defaults left untouched (authoring placeholders).
- `resolveLinkHref` returns `'#'` (never undefined) for unresolvable/placeholder targets, so the `!== '#'` predicate covers both dead + placeholder links.

## Tests added (footerHygiene.test.ts, 11 cases)
normalizeCopyrightYear: `© 2020–2024` unchanged; `© 2024`→current; already-current
unchanged; `Studio 2024 GmbH` (no ©) unchanged; `undefined` passthrough; `&copy;`
+ `(c)` markers normalize.
filterFooterColumns: dead `#` link dropped; column emptied-by-filter dropped;
1 live + 1 dead keeps live; input not mutated; falsy-resolveHref link dropped.

## Deviations
- Helper uses generic `<T extends { links?: any }>` + `any`-typed href/links
  instead of the plan's concrete `FooterColumn`/`FooterLink` interfaces. Reason:
  each template footer declares its own incompatible `FooterLink`
  (`href: string | Link` vs `string`); a shared concrete interface produced tsc
  TS2345 "two different types with this name" at every call site. Behavior is
  identical; conservative (loose types, spread-only, no mutation).

## tsc / test results
- `npx tsc --noEmit`: clean except the pre-existing unrelated
  `src/app/page.tsx(6,26) TS2307 @/assets/images/founder.jpg`. No new errors.
- `footerHygiene.test.ts`: 11/11 pass.
- Full `npm run test:run`: **2 failures**, both from ONE out-of-scope fixture:
  `src/modules/templates/blockMocks/meridian.ts` footer_columns links all use
  `href: '#'`, which the new filter (correctly) drops.
    1. `renderParity.meridian` "most fixture fields actually render" — renders
       `<Published>` directly; published MUST filter → labels gone.
    2. `conformance` meridian footer collection "footer_columns → 4 roots" —
       renders Edit block in `mode:'preview'` (harness default); per the plan's
       parity ruling, preview filters like published → 0 heading markers.
  Both are unavoidable without editing the fixture (or disabling the published
  filter, which is the core defect fix). coreParity + dispatch suites stay green.

## Open risk / BLOCKER (reported to orchestrator mailbox: published-output-hygiene.md)
`blockMocks/meridian.ts` is NOT in Phase 2's Files-touched list. Recommended
minimal fix: change its footer_columns link hrefs from `'#'` to real anchors
(the nav fixture in the same file already uses `#docs`, `/pricing`, etc.),
which restores both tests. Awaiting orchestrator authorization to edit that file
(or reassignment). All other Phase 2 work is complete + green.

## Phase 2 — BLOCKER RESOLVED (orchestrator authorized fixture fix)
Added to changed-files: `src/modules/templates/blockMocks/meridian.ts`.

Change (ONLY this): the `footer_columns` fixture (4 columns c1–c4, 19 links) had
every link `href: '#'` — a stale placeholder that the new dead-link filter
(correctly) strips. Replaced all 19 with realistic non-`#` anchors:
- c1 Product: `/product/overview`, `/product/deploys`, `/product/regions`, `/product/rollback`, `/product/observability`
- c2 Developers: `/docs`, `/docs/api`, `/docs/cli`, `/changelog`, `https://status.meridian.dev`
- c3 Company: `/company/about`, `/customers`, `/careers`, `/security`, `/contact`
- c4 Legal: `/legal/terms`, `/legal/privacy`, `/legal/dpa`, `/legal/cookies`
All 4 columns stay non-empty → conformance `items: 4` holds. `nav_items` block
(n3/n4 keep `href: '#'`) left untouched — nav is header chrome, not filtered by
this feature, and the renderParity href-parity assertions depend on those.

Type-deviation note (kept, per orchestrator): `filterFooterColumns` uses a loose
`<T extends { links?: any }>` generic with `any`-typed links/href BECAUSE each
template declares its own same-named-but-distinct `FooterColumn`/`FooterLink`
types (e.g. meridian/techpremium `href: string | Link` vs the shared plain
`href: string`). A concrete shared interface produced tsc TS2345 "two different
types with this name exist" at every call site. Loose generic + per-caller
`resolveLinkHref` is behavior-identical and spread-only (no mutation).

Re-verification after the fixture fix:
- `npx tsc --noEmit`: clean except the pre-existing unrelated
  `src/app/page.tsx(6,26) TS2307 @/assets/images/founder.jpg`.
- `renderParity.meridian.test.tsx` + `conformance.test.ts`: 497 passed | 12 skipped, 0 failed.
- Full `npm run test:run`: **164 files passed | 1 skipped; 2790 tests passed | 15 skipped; 0 failures.**

---

# published-output-hygiene — Phase 3 audit

## Files changed
- `src/lib/staticExport/lessgoBadge.ts`
- `src/lib/staticExport/lessgoBadge.test.ts`
- `src/lib/staticExport/htmlGenerator.ts`
- `src/lib/staticExport/buildPageMetadata.ts`
- `src/lib/staticExport/buildPageMetadata.test.ts`
- `src/app/p/[slug]/[...subpath]/page.tsx`
- `src/app/p/[slug]/blog/page.tsx`
- `src/app/p/[slug]/blog/[postSlug]/page.tsx`
- `docs/task/published-output-hygiene.audit.md` (this file)

## Goal
Brand consistency in PUBLISHED output only: "Lessgo AI" everywhere; never
"Lessgo.ai"/"Lessgo.AI". App-shell/marketing strings out of scope. URLs
(`lessgo.ai` hostnames + UTM) intentionally unchanged.

## Per-string changes (file:line, before → after)
- `lessgoBadge.ts:13` aria-label `"Proudly built by Lessgo.ai"` → `"Proudly built by Lessgo AI"`
- `lessgoBadge.ts:15` visible text `Lessgo.ai` → `Lessgo AI`
  - href `https://lessgo.ai/?ref=badge&utm_source=published&utm_medium=badge` UNCHANGED (URL, not brand copy).
- `lessgoBadge.test.ts:1` comment `"Proudly built by Lessgo.ai"` → `"Proudly built by Lessgo AI"` (in-scope file, kept accurate)
- `lessgoBadge.test.ts:10` `expect(html).toContain('Lessgo.ai')` → `'Lessgo AI'`
- `htmlGenerator.ts:374` `og:site_name content="Lessgo.ai"` → `content="Lessgo AI"`
- `buildPageMetadata.ts:169` `siteName: 'Lessgo.ai'` → `'Lessgo AI'`
- `buildPageMetadata.test.ts:109` `expect(m.siteName).toBe('Lessgo.ai')` → `'Lessgo AI'`
- `src/app/p/[slug]/[...subpath]/page.tsx:121` `siteName: 'Lessgo.ai'` → `'Lessgo AI'`
- `src/app/p/[slug]/blog/page.tsx:40` `siteName: 'Lessgo.ai'` → `'Lessgo AI'`
- `src/app/p/[slug]/blog/[postSlug]/page.tsx:66` `siteName: 'Lessgo.ai'` → `'Lessgo AI'`

## Sweep-grep result (step 5)
`rg -n "Lessgo\.(ai|AI)|© 202[0-5]"` over `src/lib/staticExport`, `src/modules/templates`,
`src/modules/generatedLanding`, `src/app/p`. After edits, remaining hits (all acceptable):
- `src/modules/templates/shared/footerHygiene.test.ts` — `© 2020–2024` / `© 2024` are
  test FIXTURES for the phase-2 year-normalizer (year RANGE untouched assertion). Expected.
- `src/modules/templates/shared/footerHygiene.ts:14` — CODE COMMENT describing the range rule.
- No `Lessgo.ai`/`Lessgo.AI` brand-copy stragglers remain in the published surface.
- No `src/app/p` hits at all.

## Deviations
- Updated `lessgoBadge.test.ts:1` header comment (not strictly required, but the old
  wording was now inaccurate and the file was already in the Files-touched list).

## Test / tsc results
- `npx tsc --noEmit`: only pre-existing unrelated `src/app/page.tsx(6,26)` TS2307
  (`founder.jpg`) — acceptable/out-of-scope. No new errors.
- `npm run test:run`: 164 files passed / 1 skipped; 2790 tests passed / 15 skipped.
  lessgoBadge + buildPageMetadata suites green.

## Open risks
- None in code. Live-output confirmation deferred to phase 4 (human gate).
- Published pages ship via `npm run build` (buildPublishedCSS/buildAssets + next build);
  changes take effect on rebuild/republish, not dev server alone.
