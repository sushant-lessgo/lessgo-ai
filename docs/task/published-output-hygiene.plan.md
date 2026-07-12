# published-output-hygiene — implementation plan (rev 2, post plan-review)

> **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\published-output-hygiene`
> **Branch:** `feature/published-output-hygiene`
> Spec: `docs/task/published-output-hygiene.spec.md`
> Rev 2 resolves review blockers B1 (subpath metadata bypass) + B2 (three hardcoded siteNames) and folds in reviewer decisions 1–4 (year-wrap all footers; module = `footerHygiene.ts`; range-safe year regex; accept `stripHTMLTags` as-is).

## Overview

Published pages ship "looks fake" defects that contradict the publish-ready promise: raw `<em>`/`<strong>` markup leaks into SEO title/description, the footer shows the seed's hardcoded "© 2024", empty footer columns render headers with zero links, and ×6 dead "Learn more" links point at `#`. Fix all four in Slice 1 (phases 1–2), then a brand/date consistency sweep on published output only (phase 3: "Lessgo AI", never "Lessgo.ai"), then a full-build + republish live verification (phase 4).

## Progress log

- phase 1 SEO meta HTML strip: done (review loops 1, ship) — buildPageMetadata + subpath route inline strip; tsc/2779 tests green
- phase 2 footer fixes (year + empty columns + dead links): pending
- phase 3 brand-string sweep (published output): pending
- phase 4 build + live verification: pending

## Parity ruling (read before reviewing phase 2)

Spec acceptance says "Editor and published render identically". For B2 (empty columns) and B3 (dead links) this means: **parity of rendered output for content that renders**. The editor block (`.tsx`) runs in two modes:

- `mode === 'edit'`: stays **permissive** — empty columns and `#`-href links remain visible so the user can author them. This is an authoring affordance, not a parity break.
- `mode !== 'edit'` (editor preview): applies the **same filters** as `.published.tsx`, so preview ↔ published are identical.

Layout/CSS/markup of everything that does render stays byte-identical between the pair. Impl-reviewer: do NOT flag the edit-mode permissiveness as a dual-renderer divergence — it is deliberate and scoped here.

Also per spec Scope OUT: dead **primary/nav CTAs** pending user setup are expected (publish-ux owns warnings). The B3 filter targets footer link lists (columns + techpremium legal row) only.

---

## Phase 1 — Strip HTML from SEO title + meta description

Slice 1a. `buildPageMetadata()` is the choke point for the static generator (`renderPublishedExport.ts` → `htmlGenerator.ts` title:362 / description:363 / og:371–372 / twitter:379–380) AND the root dynamic SSR route — **but NOT for subpages**: `src/app/p/[slug]/[...subpath]/page.tsx` builds its metadata **inline** (~lines 76–116) from `heroElements.headline?.content` / `subheadline?.content` with no strip (review blocker B1). Both surfaces are fixed here.

**Files touched**
- `src/lib/staticExport/buildPageMetadata.ts`
- `src/lib/staticExport/buildPageMetadata.test.ts`
- `src/app/p/[slug]/[...subpath]/page.tsx`

**Steps**
1. Import `stripHTMLTags` from `src/utils/smartTitleGenerator.ts` in both files (confirmed exported, plain module — no `'use client'`, safe for server/static paths). Per review decision 4: accept this repo-standard helper **as-is** (regex tag-strip + `.trim()`) — do NOT build a new sanitizer. Acknowledged tradeoffs: a bare `<`/`>` pair in prose is theoretically strippable (acceptable; not a real meta-content shape here), and `.trim()` removes edge whitespace (harmless for meta).
2. `buildPageMetadata()` (~lines 126–135):
   - Strip `rawDesc` **before** the `.slice(0, 160)` cap — reclaims char budget AND avoids a truncated tag remnant (`...<e`) the regex can't match after capping.
   - Strip the **final resolved** `title` and `description` before return — covers manual `seo.title`/`seo.description` overrides. og/twitter reuse these same two strings, so they're covered.
3. Subpath route `[...subpath]/page.tsx` — apply `stripHTMLTags` inline; do **NOT** refactor it onto `buildPageMetadata`. Why: its metadata has its own fallback chain (product-detail `pdEl` branch from `model`/`name`/`oneLiner`, `"${sub.title} — ${page.title}"` composition, `157 + '...'` ellipsis style, `"Check out ${headline}"` fallback) — porting that into `buildPageMetadata` risks byte-drift on existing root pages and is out of proportion for this fix. Strip points:
   - `headline` at resolution (:86 hero branch; also the `pdEl` branch :79 — model/name/oneLiner are user/AI strings too) — feeds `pageTitle` and the `Check out ${headline}` fallback.
   - `subheadline` (:87) **before** the 157-char cap (same truncated-tag rationale).
   - Final `pageTitle` and `description` just before the `return` (:101) — covers both branches + `seo.title`/`seo.description` overrides (:94–96) in one place.
4. Do NOT touch downstream `escapeHTML()` in `headTags.ts`/`htmlGenerator.ts` — it still runs, so legit chars (`&`, quotes, unicode) survive and nothing double-escapes (strip removes tags only; it never encodes).
5. Extend `buildPageMetadata.test.ts`:
   - headline/subheadline containing `<em>`/`<strong>` → title/description tag-free, inner text preserved.
   - markup inside `seo.title`/`seo.description` overrides → stripped.
   - 160-cap applied after strip (string with markup near the cap boundary).
   - documenting test per review decision 4: markup stripped; inner text + `&` and quotes preserved unchanged (no drop, no encode).
   - existing byte-identity assertions still green.
   (Subpath route has no unit harness — its strip is the same helper on the same shapes; covered by the buildPageMetadata tests + phase-4 live check on a subpage.)

**Verification**
- `npx tsc --noEmit`
- `npm run test:run` (esp. `buildPageMetadata.test.ts`)
- Live confirmation deferred to phase 4 (needs `npm run build` + republish) — include one **subpage** in the phase-4 checks.

---

## Phase 2 — Footer: dynamic year + drop empty columns + hide dead links

Slice 1b–d. Two sub-scopes per review decision 1:

- **B2/B3 (empty columns + dead links): meridian + techpremium ONLY** — confirmed the only footers using the `footer_columns` link-column pattern (grep: no `footer_columns` in hearth/lex/surge/lumen/core templates). Do not broaden.
- **B1 (year normalize): ALL footers that render a stored `copyright`-type prop** — verified inventory below; every template footer has one, none skipped. Each is a minimal single-line wrap; `.core.tsx` files cover both renderers in one place.

Dual-renderer: every non-core change lands in BOTH `.tsx` and `.published.tsx`. No hardcoded year exists anywhere; "© 2024 InvoiceKit" comes from the seed default `src/hooks/editStore/archetypes.ts:312`.

**Files touched**
- `src/modules/templates/shared/footerHygiene.ts` (new — FINAL name per review decision 2; holds `normalizeCopyrightYear()` + `filterFooterColumns()`; plain module, NO `'use client'` — published renderers import it, published/client boundary rule applies)
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

**Steps**

*B1 — year (two levers, both):*
1. Seed fix: `archetypes.ts:312` → `` copyright: `© ${new Date().getFullYear()} ${brand}. All Rights Reserved.` `` — new content starts correct.
2. Helper `normalizeCopyrightYear(text?: string): string | undefined` in `footerHygiene.ts`. Conservative + **range-safe** per review decision 3: replace only the year token adjacent to a © marker, and only when NOT immediately followed by a dash or digit — e.g. `/((?:©|\(c\)|&copy;)\s*)((?:19|20)\d{2})(?![\d–—-])/i` → current year when it differs. Never touch other digits (brand names, addresses, ranges). Required unit tests: `© 2020–2024 X` **unchanged** (must NOT become `© 2026–2024`); `© 2024 X` → `© <current> X`; already-current year unchanged; no-© string (`Studio 2024 GmbH`) unchanged; `undefined` passthrough.
3. Wrap the copyright render/display value with `normalizeCopyrightYear(...)` at each verified render point (minimal wrap, nothing else):
   - meridian: `.published.tsx:94`; editor `.tsx:318` (`MeridianEditable value=`)
   - techpremium: `.published.tsx:95`; editor `.tsx:185`
   - hearth: `.published.tsx:60`; editor `.tsx:178`
   - surge: `.published.tsx:98`; editor `.tsx:305`
   - lex: `.published.tsx:54`; editor `.tsx:168`
   - lumen: `.published.tsx:94` — wrap BOTH `copyright` and `copyright_nl` (bilingual twin fields, incl. the `bilingualAttrs(...)` args); editor `.tsx:151` uses a content-object editable API (`content={blockContent}`) — pass a shallow-copied `blockContent` with normalized `copyright`/`copyright_nl`; never mutate the store object.
   - vestria core `:102`, atelier core `:121`, granth core `:44` — wrap `content.copyright` in the `E.Txt value=` (single-source `.core.tsx` → one edit covers editor + published).
   - Skipped footers: **none** — all 9 template footers carry a copyright prop (verified by grep).
   Editors show the normalized value; `onSave` still stores what the user types — a subsequent save persists the normalized text (accepted self-heal, review decision 1 context). ⚠️ Known InlineTextEditor semi-controlled history — manually verify copyright still editable/saves (see verification).
   Note: `blockMocks`/`coreParity.test.ts` fixtures use `© 2026` = current year → unchanged by the normalize, existing tests stay green.

*B2 + B3 — column/link filtering (meridian + techpremium ONLY; order matters: filter links FIRST, then drop empty columns):*
4. `filterFooterColumns(columns, resolveHref)` in `footerHygiene.ts`: `columns.map(col => ({ ...col, links: (col.links ?? []).filter(l => { const href = resolveHref(l.href); return href && href !== '#'; }) })).filter(col => col.links.length > 0)` — a column emptied by the link filter disappears too. Each footer passes its local `resolveLinkHref`. Unit tests: dead-link dropped; column emptied-by-filter dropped; column with 1 live + 1 dead link keeps the live one; input not mutated.
5. Published renderers: render the filtered columns unconditionally (Hairline `.published.tsx:79–90`, TechPremium `.published.tsx:86–91`). TechPremium ALSO filters the bottom `legal` links row (`:96–97`) with the same `href !== '#'` predicate (hide row if all filtered).
6. Editor `.tsx`: `mode === 'edit'` → render raw `columns` (permissive; existing "+ column"/add-link affordances untouched); `mode !== 'edit'` → render filtered columns + filtered legal (identical to published). See Parity ruling above.
7. Do NOT change the add-link seed `href:'#'` defaults in the editors (Meridian `:130/:141`, TechPremium `:89/:92`) — authoring placeholders; the publish-side filter is the fix.

**Verification**
- `npx tsc --noEmit`
- `npm run test:run` (new `footerHygiene.test.ts` + existing dispatch/coreParity/blockMock suites green)
- Manual (`npm run dev`): meridian + techpremium projects — edit mode shows all columns + placeholder links; copyright editable + saves; preview → empty columns gone, `#` links gone, year current. Spot-check one service template (hearth or lex) + one core template (vestria) footer year renders current for a stored `© 2024 …` value.
- Live published confirmation deferred to phase 4.

---

## Phase 3 — Brand-string sweep (published output only)

Slice 2. "Lessgo AI" everywhere in published output; never "Lessgo.ai"/"Lessgo.AI". Covers static export AND the dynamic published routes under `src/app/p/` (customer-published pages incl. their blog routes — in scope per review blocker B2). App-shell/marketing strings (`src/app/` outside `/p/`, `src/components/shared/Footer.tsx`, terms/thanks) stay OUT of scope per spec.

**Files touched**
- `src/lib/staticExport/lessgoBadge.ts`
- `src/lib/staticExport/lessgoBadge.test.ts`
- `src/lib/staticExport/htmlGenerator.ts`
- `src/lib/staticExport/buildPageMetadata.ts`
- `src/lib/staticExport/buildPageMetadata.test.ts`
- `src/app/p/[slug]/[...subpath]/page.tsx`
- `src/app/p/[slug]/blog/page.tsx`
- `src/app/p/[slug]/blog/[postSlug]/page.tsx`

**Steps**
1. `lessgoBadge.ts:13` aria-label `"Proudly built by Lessgo.ai"` → `"Proudly built by Lessgo AI"`; `:15` visible text `Lessgo.ai` → `Lessgo AI`. Keep the `https://lessgo.ai/...` href + UTM params UNCHANGED (URL, not brand copy). Update `lessgoBadge.test.ts` expectations.
2. `htmlGenerator.ts:374` `og:site_name content="Lessgo.ai"` → `"Lessgo AI"`.
3. `buildPageMetadata.ts:159` `siteName: 'Lessgo.ai'` → `'Lessgo AI'` (feeds root dynamic route `p/[slug]/page.tsx:57` via `meta.siteName` — no edit needed there). Update any `buildPageMetadata.test.ts` assertion on siteName.
4. Hardcoded siteNames in published dynamic routes (review blocker B2) — all three → `'Lessgo AI'`:
   - `src/app/p/[slug]/[...subpath]/page.tsx:111`
   - `src/app/p/[slug]/blog/page.tsx:40`
   - `src/app/p/[slug]/blog/[postSlug]/page.tsx:66`
5. Sweep-confirm step (widened scope per review): `rg -n "Lessgo\.(ai|AI)|© 202[0-5]" src/lib/staticExport src/modules/templates src/modules/generatedLanding "src/app/p"` — remaining hits must be URLs (`lessgo.ai` hostnames), code comments, or test fixtures only. Anything else in the published surface = fix in this phase; anything in app shell = leave (out of scope).

**Verification**
- `npx tsc --noEmit`
- `npm run test:run` (lessgoBadge + buildPageMetadata tests)
- Sweep grep from step 5 shows no brand-copy stragglers in the published surface (incl. `src/app/p/`).

---

## Phase 4 — Full build + republish live verification 【human gate: user confirms live page before merge】

Spec's pilot gate: publish a test page, confirm no placeholder/dead/wrong-year content live. Not a hard gate class (no schema/auth/prod-data), but live output confirmation needs the user's eyes — mark as sign-off before the merge gate.

**Files touched:** none (verification only; fix-forward edits, if any, re-run the owning phase's verification).

**Steps**
1. `npm run build` — REQUIRED: published-page changes ship via `buildPublishedCSS.js`/`buildAssets.js` + next build, not dev server alone.
2. `npm run test:run` + `npx tsc --noEmit` full pass; optionally `npm run test:e2e` render/publish specs if env available.
3. Publish a test page (meridian project with markup-bearing hero headline, an empty footer column, `#` links, `© 2024 …` stored copyright — i.e., the InvoiceKit repro shape). Repeat spot-check on a techpremium project. If a multi-page project is available, ALSO check one **subpage** (`/p/[slug]/<subpath>`) head — covers the phase-1 subpath route fix.
4. Inspect live HTML (`/p/[slug]` view-source):
   - `<title>` + `meta description` + og/twitter: no `<em>`/`<strong>`, legit chars intact, ≤160 desc.
   - Footer: current year, no empty column headers, no `href="#"` links.
   - Badge text + og:site_name = "Lessgo AI" (root, subpage, and — if a blog-enabled page exists — blog route social cards).
5. Parity walk: same page in editor edit mode (affordances visible) vs preview vs published (identical).
6. Note for user: static HTML bakes the year at publish time — pages published before a year rollover show the old year until republished (dynamic SSR paths self-correct). Accepted limitation.

**Verification**
- Acceptance criteria checklist from the spec, ticked against the live page. User sign-off recorded here → merge gate (orchestrator).

---

## Review decisions folded in (do not re-open)

1. Year normalize applies to ALL 9 template footers (enumerated in phase 2); B2/B3 filtering stays meridian+techpremium only.
2. Shared module finalized: `src/modules/templates/shared/footerHygiene.ts` (+ test).
3. Year regex is range-safe (negative lookahead for dash/digit after the year).
4. `stripHTMLTags` accepted as-is; tradeoffs documented in phase 1 + covered by a documenting test.

## Unresolved questions

1. Year normalize silently persists on next copyright save (self-heal) — acceptable? (Reviewer leaned yes; confirm at phase-4 sign-off.)
2. ©-adjacent-only regex leaves exotic formats ("Copyright 2024", bare "2024") untouched — ok?
3. Phase-4 test publish on prod or dev DB/blob?
