# ui-foundation — Phase 1 audit (isolation baseline guards)

Branch: `feature/ui-foundation` (verified before any edit). Tests-only phase — NO
styling/token/font changes. Baselines RECORDED this phase (snapshot, sha256,
computed-style JSON, frozen config values); "green" = assertions pass against the
freshly-captured baselines.

## Files changed

- `src/modules/generatedLanding/uiFoundationIsolation.test.tsx` (new) — vitest: published-HTML snapshot + negative-trace + published.css sha256 guard.
- `src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap` (new, generated) — 2 HTML snapshots (meridian product, hearth service).
- `src/modules/generatedLanding/__fixtures__/published-css.sha256` (new) — committed baseline hash.
- `src/modules/generatedLanding/tailwindConfigFreeze.test.ts` (new) — root tailwind.config.js freeze guard.
- `e2e/ui-isolation.spec.ts` (new) — Playwright editor/main-app surface guard.
- `e2e/fixtures/ui-isolation-computed-styles.json` (new, captured by the spec's first run) — computed-style baselines.
- `playwright.config.ts` (1-line edit — added to Phase-1 Files-touched by the orchestrator post-hoc) — registers the isolation spec in the `public` project's `testMatch`.
- `docs/task/ui-foundation.audit.md` (this file).

No forbidden-list file was touched. The new test/fixture files under
`src/modules/generatedLanding/` are the plan's sole carve-out (test files;
buildPublishedCSS.js globs specific published files, never these).

## What each file does

### uiFoundationIsolation.test.tsx (published surface)
Builds a full page content map from the EXISTING frozen block-mock fixtures
(`src/modules/templates/blockMocks/{meridian,hearth}.ts` — the same fixtures the
/dev galleries + `renderParity.meridian.test.tsx` use; no new fixture created) and
renders it through the published renderer path `generateStaticHTML()` (server-only
neutralized with the same `vi.mock('server-only')` shim as the sibling
`htmlGenerator.test.ts`). Assertions:
- `toMatchSnapshot()` on the full HTML for meridian (product) and hearth (service).
- Negative-trace (holds forever): no `app-` class token, and none of `Onest`,
  `Caveat`, `Material Symbols`, `fonts-app-chrome` as substrings.
- published.css sha256 == committed baseline; MISSING artifact throws loudly
  ("run `npm run build:published-css` first") rather than skipping.

### published-css.sha256
`c2f87e08f517a72b43f6e9e0e9b703b6261f4f152c711be9241649c6f26219b6`
Determinism: `npm run build:published-css` run twice → byte-identical output
(`diff -q` clean, identical sha256 both runs). The Tailwind CLI output carries no
timestamp/banner; NO normalization was needed.

### tailwindConfigFreeze.test.ts (root-config existing-key-mutation guard)
`require`s root `tailwind.config.js` → `tailwindcss/resolveConfig` → asserts frozen
resolved values. This is the coverage-independent guard for the vector the
published-css hash CANNOT see (published.css is compiled from the standalone
embedded config, invariant to root config). Frozen baselines (resolved 2026-07-16):
- `borderRadius`: `{none:0px, sm:calc(var(--radius) - 4px), DEFAULT:0.25rem, md:calc(var(--radius) - 2px), lg:var(--radius), xl:0.75rem, 2xl:1rem, 3xl:1.5rem, full:9999px}`
- `fontFamily.heading` = `["Inter","sans-serif"]`; `fontFamily.body` = `["Inter","sans-serif"]`
- `fontSize`: full resolved scale (tailwind defaults xs..9xl PLUS custom display/hero/h1/h2/h3/body-lg/body/body-sm/caption clamp() values) — asserted via deep-equal.

### e2e/ui-isolation.spec.ts (editor / main-app surface guard)
Mirrors render.spec mock-mode conventions; loads `/dev/meridian/blocks`
(ssr:false dynamic mount → waits for `[data-surface],[data-palette],[data-variant]`).
Viewport pinned `1280x800` (test.use) so px baselines are stable. Self-capturing:
writes `e2e/fixtures/ui-isolation-computed-styles.json` on first run when absent,
asserts `toEqual` on subsequent runs.
- Computed-style probes (stable classname selectors): `.mrd-price-card`
  border-radius; `.mrd-btn--primary` border-radius + font-size;
  `.mrd-hero__headline` font-family + font-size; `.mrd-hero__lede` font-family +
  font-size.
- Negative checks on the same surface: hero headline font-family does NOT contain
  `onest`; `[class*="app-"]` count == 0; no network request for
  `fonts-app-chrome`/`material-symbols`/`onest` woff2.

### ui-isolation-computed-styles.json (captured baseline)
```
card.borderRadius   = 10px
button.borderRadius = 8px      button.fontSize = 13.5px
heading.fontFamily  = "Inter Tight", ui-sans-serif, system-ui, sans-serif   heading.fontSize = 108px
body.fontFamily     = "Inter Tight", ui-sans-serif, system-ui, sans-serif   body.fontSize    = 21px
```
(Headline font = Inter Tight, the meridian template font — NOT Onest, so the
negative check is non-vacuous.)

## Verification results

- `npx tsc --noEmit`: clean re: all Phase-1 files. One PRE-EXISTING unrelated error
  remains (`src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'`)
  — not introduced by this phase, not in scope.
- `npm run build:published-css`: deterministic double-run (identical sha256), fresh
  artifact used for the hash test.
- `npm run test:run`: `184 passed | 1 skipped` files, `3012 passed | 18 skipped`
  tests. The 2 new vitest files: 8 tests pass, 2 snapshots written (first run).
- e2e isolation spec: EXECUTED (not skipped) as part of the normal suite. After the
  `playwright.config.ts` one-line `testMatch` addition, `npx playwright test --list`
  shows both isolation tests under the `public` project (Total 20 tests / 7 files, up
  from 18/6). `npm run test:e2e -- --project=public` → `11 passed, 4 skipped` — the 2
  isolation tests are #14 and #15, both green (3.2s each, warm server; the 4 skips are
  the real-LLM generation cases that self-skip without `E2E_AUTH`). The self-capture
  path (first run wrote the JSON) + the assert path (subsequent runs compare) were both
  verified earlier via a throwaway temp config; that temp config was deleted and never
  committed.

## Deviations from the plan (with reason)

1. **step-3b "generated landing page" runs on `/dev/meridian/blocks`, not a live
   `/p` or `/edit` page.** That route IS meridian blocks rendered through the
   main-app CSS bundle and is the only template surface render.spec proves
   reachable in mock mode without a Clerk session + seeded draft. Conservative,
   in-scope choice; documented in the spec header too.
2. **card probe uses `.mrd-price-card`, not `.mrd-te__card`.** `mrd-te__card`
   exists only in the PUBLISHED testimonials block; the edit gallery render has no
   such element (verified — locator resolved to 0). `.mrd-price-card` is a real
   card with `border-radius: var(--r-lg)` present in the edit render. Same guard
   intent (a card's radius).
3. **waitForSelector/toHaveCount timeouts raised 15s→45s** in the spec (vs
   render.spec's 15s). This route compiles cold in an isolated run; render.spec
   passes at 15s only because earlier suite tests warm the dev server first. 45s
   is a safe headroom; no behavioral change.
4. **computed-style baseline is self-captured by the spec (write-if-absent), not
   hand-authored.** The plan's Files-touched explicitly allows the JSON to be
   captured this phase. Committed after the capturing run.

## Resolved (was: testMatch blocker)

- **RESOLVED — `playwright.config.ts` testMatch gap.** The orchestrator added
  `playwright.config.ts` to Phase-1 Files-touched and authorized the one-line fix. The
  `public` project's `testMatch` now reads
  `[/generation\.spec\.ts/, /render\.spec\.ts/, /parity\.spec\.ts/, /ui-isolation\.spec\.ts/]`
  (only that array changed; `setup`/`authed` and all other config untouched). The
  `public` project is mock-mode / no-auth — the exact surface the spec verifies against.
  `ui-isolation.spec.ts` now runs under `npm run test:e2e` (verified green above). The
  throwaway temp config used pre-fix is gone / never committed.

## Open risks / follow-ups

- The e2e guard requires a running `next dev` + Chromium; in CI it must be wired the
  same way render.spec is (webServer auto-start). No new deps added.

---

# ui-foundation — Phase 2 audit (fonts: fetch + subset + app-only stylesheet + preloads)

Branch: `feature/ui-foundation` (verified `git branch --show-current` before any edit).
Goal: all 4 app-chrome families self-hosted, declared in a NEW app-only stylesheet
imported ONLY by the root app layout — zero bytes added to published pages.

## Files changed

- `public/fonts/onest/onest-latin-{400,500,600,700,800}-normal.woff2` (new binaries).
- `public/fonts/onest/OFL.txt` (new — SIL OFL 1.1).
- `public/fonts/jetbrains-mono/jetbrains-mono-latin-600-normal.woff2` (new; 400/500 already present).
- `public/fonts/material-symbols-rounded/material-symbols-rounded.woff2` (new, SUBSET only).
- `public/fonts/material-symbols-rounded/LICENSE` (new — Apache 2.0).
- `public/fonts/material-symbols-rounded/NOTICE` (new — source + subset change-notice + regeneration + icon-list pointer).
- `public/fonts/material-symbols-rounded/icons.txt` (new — 175-name subset glyph list = regeneration input).
- `public/fonts/caveat/caveat-latin-{400,700}-normal.woff2` (new binaries).
- `public/fonts/caveat/OFL.txt` (new — SIL OFL 1.1).
- `src/styles/fonts-app-chrome.css` (new — app-only @font-face layer).
- `src/app/layout.tsx` (added fonts-app-chrome.css import + 3 preload links in the existing `<head>` slot).
- `e2e/ui-isolation.spec.ts` (added to Phase-2 Files-touched by the orchestrator post-hoc — removed the mis-scoped "no app-font woff2 network request on /dev" assertion the Phase-2 preloads necessitated; see resolved note below).
- `docs/task/ui-foundation.audit.md` (this Phase 2 section appended).

No forbidden-list file was touched (fonts-self-hosted.css, p/layout.tsx, htmlGenerator.ts,
buildPublishedCSS.js, buildAssets.js, CriticalFontPreload.tsx, handoffLint.ts, designKit.ts,
templates/published/renderers, tailwind.config.js — all untouched).

## Fonts fetched (all verified real wOF2 binaries, not HTML error pages)

Source: fontsource jsDelivr CDN (cdn.jsdelivr.net/fontsource/fonts/<family>@latest/latin-<w>-normal.woff2).
- Onest 400=14008 B, 500=14660 B, 600=14688 B, 700=14716 B, 800=14588 B.
- JetBrains Mono 600 = 21860 B.
- Caveat 400=48836 B, 700=51020 B.
- Material Symbols Rounded FULL (temp -full.woff2) = 5346776 B, fetched from
  github.com/google/material-design-icons/raw/master/variablefont/MaterialSymbolsRounded[FILL,GRAD,opsz,wght].woff2.
Magic bytes checked (head -c4 | xxd -> wOF2) on representative files of each family + the full MS font.
Licenses: Onest OFL.txt (4384 B), Caveat OFL.txt (4385 B) from github.com/google/fonts/raw/main/ofl/<family>/OFL.txt;
Material Symbols LICENSE (Apache 2.0, 11357 B) from the material-design-icons repo root.

## Icon list derivation

Grepped the FOUR .dc.html files at
`C:\Users\susha\lessgo-ai\docs\Design\Lessgo AI UI redesign\design_handoff_lessgo_app\`
for `<span class="ms">...</span>` nodes (the handoff's Material-Symbols class is `.ms`;
icon = element text = ligature name). Extracted 175 distinct ligature names. Unioned with
the spec seed set (arrow_forward, mail, lock, auto_awesome, push_pin, perm_media, tune) —
all 7 seeds were already present in the HTML (0 seed-only additions). Final: 175 names,
one per line -> icons.txt.

## Subset result

Tooling: Python 3.12.10 (installed via `winget install Python.Python.3.12` — no real Python
pre-existed; the WindowsApps python/python3 were Store stubs) + fonttools 4.63.0 + brotli.

First attempt with the plan's literal command (--layout-features='liga,rlig,calt'
--text-file=icons.txt, layout closure ON) produced 3.99 MB — because every Material-Symbols
icon ligature is spelled from the same Latin alphabet, so retaining the alphabet + default
layout-closure pulls in ALL ~6590 icons (ligature closure). Font inspection confirmed FILL
is a genuine gvar variation axis on the base glyphs (no .fill-glyph swap / no rvrn), glyphs
are named by icon, ligature mapping is rlig.

Final working subset command (deviation — see below):
  python -m fontTools.subset <full.woff2> --output-file=material-symbols-rounded.woff2
    --flavor=woff2 --no-layout-closure --layout-features='rlig,rclt,liga,calt'
    --glyphs-file=<172 icon names that are real glyph names>
    --text='abcdefghijklmnopqrstuvwxyz0123456789_'
- Result: 164100 B (164 KB), 210 glyphs (172 icon glyphs + Latin alphabet/digits/underscore/.notdef
  needed as ligature-input components).
- All 4 fvar axes SURVIVE (ttx -t fvar -> FILL, GRAD, opsz, wght); NOT instanced/pinned.
  99 of the retained icon glyphs carry FILL-varied gvar tuples (the rest are outline-only
  icons with no distinct filled form — expected), so font-variation-settings:'FILL' 1 still
  animates the icons that have a fill state.
- 247 rlig ligature rules retained (name->glyph), alphabet retained for input -> typing e.g.
  "mail" still renders the glyph.
- Temp material-symbols-rounded-full.woff2 DELETED after subsetting; confirmed absent from
  the committed dir (ls *full* -> no such file). Full font never committed.

## fonts-app-chrome.css faces declared

Mirrors the fonts-self-hosted.css @font-face pattern. Faces:
- Onest 400/500/600/700/800, font-display:swap.
- JetBrains Mono App 400/500/600 under a DISTINCT font-family 'JetBrains Mono App' name
  (coordinator directive — see RESOLVED note below). 400/500 src = the existing
  jetbrains-mono-latin-{400,500}-normal.woff2; 600 src = the new -600 file. font-display:swap.
  Does NOT declare any face under bare 'JetBrains Mono', so templates' --font-mono family
  stays 400/500-only on both surfaces.
- Caveat 400/700, font-display:swap.
- Material Symbols Rounded variable face: format('woff2-variations'), font-weight:100 700,
  font-style:normal, font-display:block (avoids icon-name FOUT).

## layout.tsx changes

- Added `import '@/styles/fonts-app-chrome.css';` immediately after the existing
  fonts-self-hosted.css import (with an isolation comment).
- Replaced the empty `<head />` self-closing slot with a `<head>...</head>` containing 3
  `<link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous">` for
  onest-latin-400, onest-latin-600, and the Material Symbols subset. No other restructuring;
  CriticalFontPreload.tsx and p/layout.tsx untouched.

## Verification results

- npx tsc --noEmit -> exit 0 (no new errors; the Phase-1-noted founder.jpg error did not
  reproduce this run).
- npm run build:published-css (fresh) -> public/published.css sha256
  c2f87e08f517a72b43f6e9e0e9b703b6261f4f152c711be9241649c6f26219b6 == Phase-1 committed
  baseline. UNCHANGED (yes).
- npm run test:run -> 184 passed | 1 skipped files, 3012 passed | 18 skipped tests. Phase-1
  HTML snapshot byte-identical; published.css sha256 guard green; negative-trace (no
  Onest/Caveat/Material Symbols/fonts-app-chrome/app-) green; config-freeze green.
- npm run build -> green (regenerated published.css); post-build sha256 still == baseline;
  grep -icE "onest|caveat|material symbols" public/published.css -> 0 (no app-chrome font
  leak into published output). grep for ".app-|Onest" in published.css -> empty.
- buildAssets.js (read-only) still copies ONLY fonts-self-hosted.css (explicit file list
  line ~65, no glob) -> fonts-app-chrome.css is NOT shipped to published assets.
- Only importer of fonts-app-chrome.css is src/app/layout.tsx (grep) — NOT p/layout.tsx,
  NOT any renderer -> structural isolation confirmed.
- JBM-600 divergence check — FINDING: NOT none (many templates render mono@600); RESOLVED
  by the coordinator-directed distinct-family rename (see "RESOLVED — JBM-600 divergence" below).

## Deviations from the plan (with reason)

1. Material Symbols subset command changed from the plan's literal command. The plan's
   command (layout-closure ON, --text-file) yielded 3.99 MB (ligature closure over the
   shared alphabet retains all ~6590 icons). Switched to --no-layout-closure + explicit
   --glyphs-file of the icon glyph names + --text of the ligature-input alphabet, keeping
   rlig/rclt. Same intent (subset to the handoff icon set, keep all 4 axes), correct 164 KB
   result, ligatures + FILL still work. Documented in NOTICE for regeneration. Conservative
   in-scope choice — the plan's own goal could not be met by its literal command.
2. Subset size 164 KB, over the plan's "~100 KB" sanity bound. The estimate assumed the
   7-icon seed set; the actual handoff grep yielded 175 icons, each carrying 4-axis gvar
   variation data — that icon COUNT (not a subsetting error) drives 164 KB. All 4 axes are
   mandatory (plan forbids pinning), so this is the minimum for the real icon set. 164 KB
   vs the 5.3 MB full font is a 97% reduction.
3. 3 of 175 icon names (collections, restore, smartphone) are ligature ALIASES, not glyph
   names — passed via --text alphabet only, not --glyphs. Their rlig rules resolve to
   canonical glyphs that are themselves in the retained set (e.g. photo_library/history are
   in the icon list), so they still render. Kept in icons.txt as the authoritative name list.
4. Installed Python 3.12 via winget (no real Python was present). The task authorized
   pip install fonttools brotli; a Python runtime was a prerequisite. Not a repo file change.

## RESOLVED — JBM-600 divergence (coordinator directive, still in Phase 2)

The plan's Phase-2 premise "no template renders JetBrains Mono @600" was FALSE:
techpremium (.tp-metric__v, .tp-pill, .tp-pcard__plan, .tp-pmodel, .tp-sn, .tp-news__btn,
Problem/Process/ProductDetail labels), meridian (.mrd-cta__eyebrow), and lumen
(.lm-wa-edit strong, contact label) all render font-family:var(--font-mono) @600, and all
three set --font-mono:'JetBrains Mono' in their tokens.ts. A same-name real JBM 600 face
in the root layout would give the EDITOR a real 600 while PUBLISHED (published.css ships
only JBM 400/500) stays faux-bold -> a NEW editor<->published divergence.

FIX (per coordinator): app-chrome mono now uses a DISTINCT family name 'JetBrains Mono App'
declaring the full 400/500/600 set (400/500 reuse the existing self-hosted files, 600 the
new file). fonts-app-chrome.css declares NO face under bare 'JetBrains Mono'. Templates'
'JetBrains Mono' family therefore stays 400/500-only on BOTH surfaces -> faux-bold 600 on
both, exactly as before this feature -> NO divergence, published output byte-identical. App
chrome will reference this via Phase-3's font-app-mono token (never the raw family name);
the rename is invisible to consumers.

Re-verification after the rename:
- Face-decl grep: the only `font-family:` face declarations for mono are 'JetBrains Mono App'
  (x3, weights 400/500/600); ZERO bare 'JetBrains Mono' face declarations (grep -c = 0). The
  only bare-name occurrences are explanatory comments.
- All 3 referenced files exist: jetbrains-mono-latin-{400,500,600}-normal.woff2 (21168/21832/21860 B).
- npx tsc --noEmit -> exit 0.
- npm run build:published-css (fresh) -> published.css sha256 == Phase-1 baseline
  (c2f87e08...). npm run test:run -> 3012 passed | 18 skipped (snapshot + sha256 + config-freeze
  + negative-trace all green). npm run build -> green; post-build sha256 == baseline;
  grep -icE "onest|caveat|material symbols" public/published.css -> 0.

## RESOLVED — Phase-1 e2e guard vs Phase-2 preloads collision (e2e spec edited under Phase 2)

The first e2e run (`npm run test:e2e -- --project=public`) had 1 failure: test
`ui-isolation.spec.ts:86` at its third assertion (~line 115) asserted `/dev/meridian/blocks`
makes NO onest/material-symbols woff2 request. That became false because Phase 2's 3
`<link rel=preload>` tags (plan step 5) live in the ROOT app layout `<head>` and fire on
EVERY app route, including the `/dev` gallery.

This assertion was MIS-SCOPED: `/dev/meridian/blocks` is an APP-SHELL route served by the
ROOT layout, which now correctly preloads app-chrome fonts on every app route — so those
requests are EXPECTED there, not an isolation break. The isolation guarantee we actually
care about (a PUBLISHED page loads/references no app font) is proven independently by the
vitest HTML-snapshot negative-trace (no `fonts-app-chrome`/`Onest`/`Caveat`/`Material Symbols`
in published HTML) + the published.css sha256 baseline + the 0-leak grep; published `/p/[slug]`
pages are static blob HTML that never load the root layout.

FIX (orchestrator added `e2e/ui-isolation.spec.ts` to Phase-2 Files-touched): removed ONLY
that network-request assertion and its now-unused `badFontRequests` array + `page.on('request')`
listener; renamed the test to `no app-chrome fonts/classes on the block surface`. KEPT the
two meaningful assertions — (1) hero headline computed font-family does NOT contain `Onest`
(templates still compute to Inter Tight even though Onest is preloaded/available), (2) zero
`[class*="app-"]` elements. The separate computed-style baseline test (JSON-fixture compare)
was left completely untouched.

Re-verification after the spec edit:
- `npx tsc --noEmit` -> exit 0 (unused listener/array removed, no dangling refs).
- `npm run test:run` -> 3012 passed | 18 skipped (unchanged).
- `npm run build` -> green; published.css sha256 == Phase-1 baseline (c2f87e08...);
  `grep -icE "onest|caveat|material symbols" public/published.css` -> 0.
- `npm run test:e2e -- --project=public` (free port 3018) -> 11 passed, 4 skipped, 0 failed.
  Both isolation tests now PASS:
  - `#14 ui-isolation.spec.ts:55 › computed-style baselines on /dev/meridian/blocks are unchanged` (green)
  - `#15 ui-isolation.spec.ts:86 › no app-chrome fonts/classes on the block surface` (green)

## Open risks / follow-ups

- None outstanding for Phase 2. Dev spot-check split: the e2e run CONFIRMS the app-surface
  half (the 3 preloads are requested on the `/dev` app route — now expected); the
  published-surface half (a `/p/[slug]` requests none of the new fonts) is proven by static
  analysis (fonts-app-chrome.css imported only in root layout, not p/layout.tsx; buildAssets
  ships only fonts-self-hosted.css; published.css 0-leak grep + sha256 baseline).

---

# ui-foundation — Phase 3 audit (token layer + AppIcon + scope class) — HUMAN GATE

Branch: `feature/ui-foundation` (verified `git branch --show-current` before any edit).
Goal: the complete namespaced app-chrome token layer + `.app-chrome` scope class +
`AppIcon`, proving template/published isolation held via the automated guards.

## Files changed

- `tailwind.config.js` — theme.extend ADDITIONS ONLY (namespaced `app-*` keys). No existing key edited.
- `src/styles/app-chrome.css` (new) — `.app-chrome` scope base + `.app-icon`/`.app-icon--filled`.
- `src/components/ui/icon.tsx` (new) — `AppIcon` component.
- `src/app/layout.tsx` — ADDED one import (`@/styles/app-chrome.css`) only; Phase-2 font import + preloads left intact.
- `src/modules/generatedLanding/tailwindConfigFreeze.test.ts` — borderRadius freeze re-scoped from whole-object `toEqual` to `toMatchObject` (added to Phase-3 Files-touched by the orchestrator; see "RESOLVED — config-freeze borderRadius" below).
- `docs/task/ui-foundation.audit.md` (this Phase 3 section appended).

No forbidden-list file touched (globals.css, p/layout.tsx, fonts-self-hosted.css,
htmlGenerator.ts, buildPublishedCSS.js, buildAssets.js, templates/**, renderers,
designTokens.ts, CriticalFontPreload.tsx — all untouched).

## Exact token values committed (tailwind.config.js theme.extend)

- `colors.app.*` (24 keys, from handoff README §Color): primary `#006CFF`,
  primary-hover `#0056d6`, primary-deep `#003E80`, tint `#e6f0ff`, cta `#FF6B3D`,
  cta-soft `#FF814A`, ink `#191922`, muted `#7b7b86`, faint `#a6a6b0`,
  placeholder `#b0b0ba`, label `#3a3a44`, slate `#5a6472`, body `#5b5b66`,
  success `#16a34a`, success-bg `#e6f5ec`, danger `#d1483a`, danger-bg `#fef2f2`,
  canvas `#f7f8fa`, surface `#ffffff`, border `#ececf1`, border-input `#e2e4ea`,
  border-strong `#d7d7dd`, divider `#eef0f3`, hairline `#f2f2f5`.
- `borderRadius` app keys (added alongside untouched lg/md/sm): app-ctl `10px`,
  app-input `12px`, app-panel `14px`, app-card `16px`, app-modal `20px`,
  app-pill `20px`, app-badge `6px`.
- `boxShadow` (new key, all namespaced): app-card `0 2px 10px -6px rgba(20,20,40,.2)`,
  app-modal `0 40px 90px -34px rgba(20,20,40,.4)`, app-float `0 30px 66px -22px rgba(20,20,40,.4)`,
  app-btn-primary `0 14px 28px -12px rgba(0,108,255,.75)`,
  **app-btn-cta `0 10px 22px -9px rgba(255,107,61,.7)`**.
- `fontFamily` app keys (added alongside untouched heading/body):
  app-sans `['Onest','ui-sans-serif','system-ui','-apple-system','Segoe UI','Roboto','Helvetica Neue','Arial','sans-serif']`,
  **app-mono `['JetBrains Mono App','ui-monospace','monospace']`** (distinct app family per Phase 2 — NOT bare 'JetBrains Mono'),
  app-hand `['Caveat','cursive']`.
- `backgroundImage['app-stripes']`: `repeating-linear-gradient(135deg,#eef0f4 0 11px,#e6e8ee 11px 22px)`.

### CTA shadow source + variance

README truncates the coral CTA shadow (`0 10px 22px -...`). Grepped the four
`.dc.html` files for the orange (`#FF6B3D`) CTA `box-shadow`. The value varies
slightly per button:
- `0 10px 22px -9px rgba(255,107,61,.7)` — dominant across in-app action CTAs
  (`Lessgo Dashboard.dc.html` lines 181 "Regenerate draft", 572/597 "Generate posts/email"), and the closest analogue to the `Onboarding Flow.dc.html:89` primary CTA.
- variants: `-8px …,.7)` ("New site with AI" buttons), `-9px …,.75)` ("Build my site"),
  `-10px …,.8)` (icon tiles, e.g. Dashboard lines 345/732).

Committed `app-btn-cta = 0 10px 22px -9px rgba(255,107,61,.7)` (dominant in-app CTA
value). Source: `Lessgo Dashboard.dc.html`. Logged under Deviations as an in-scope
judgment call.

Confirmation: **`fontFamily['app-mono']` → `'JetBrains Mono App'`** (distinct family;
avoids the mono@600 editor↔published divergence — Phase 2).

## app-chrome.css classes

- `.app-chrome` — Onest system stack, `color:#191922`, `background:#f7f8fa`,
  `font-optical-sizing:auto`, `-webkit-font-smoothing:antialiased`/`-moz-osx-font-smoothing:grayscale`.
  Documented in-file: applied to NO screen by this feature; consuming specs attach it;
  never root `<body>`/`/p`/`/preview`/editor-canvas.
- `.app-icon` — `font-family:'Material Symbols Rounded'`, `line-height:1`,
  `display:inline-block`, `white-space:nowrap`, antialiased,
  `font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24`.
- `.app-icon--filled` — flips to `'FILL' 1` (other axes unchanged).

## AppIcon API

`AppIcon({ name, filled?, size?, className? })` →
`<span aria-hidden className={cn('app-icon', filled && 'app-icon--filled', className)} style={{ fontSize: size }}>{name}</span>`.
`cn` imported from `@/lib/utils`. In-file comment: app-chrome only; MUST NEVER be
imported by `src/modules/templates/**` or `src/components/published/**`.

## layout.tsx change

Added exactly one line: `import "@/styles/app-chrome.css";` (with isolation comment),
directly after the Phase-2 `fonts-app-chrome.css` import. Phase-2 preload `<link>`s and
all other layout content untouched.

## Verification results

- `npx tsc --noEmit` → clean (exit 0).
- `npm run build` → green (regenerated `public/published.css`).
- **published.css sha256 == baseline: YES.** current `c2f87e08f517a72b43f6e9e0e9b703b6261f4f152c711be9241649c6f26219b6`
  == committed baseline (byte-identical published surface — the namespaced app-* keys
  never emit into the standalone published config).
- Leak grep `grep -icE "onest|caveat|material symbols|[^a-z]app-" public/published.css` → **0**.
- `npm run test:run` → **3012 passed | 18 skipped | 0 failed** (after the config-freeze
  re-scope — see RESOLVED below). HTML-snapshot (meridian+hearth) byte-identical,
  published.css sha256 guard green, negative-trace green, config-freeze (borderRadius
  existing-keys + fontFamily heading/body + fontSize scale) all green.
- `npm run test:e2e -- --project=public` → **11 passed, 4 skipped, 0 failed** (port 3021,
  set via `PORT=3021 E2E_PORT=3021`; 3000/3001 occupied). Both isolation tests green:
  - `#14 ui-isolation.spec.ts:55 › computed-style baselines on /dev/meridian/blocks are unchanged`
    — THE mandatory editor-surface existing-key-mutation check for this phase's
    `tailwind.config.js` edit; proves no template style moved on the main-app surface.
  - `#15 ui-isolation.spec.ts:86 › no app-chrome fonts/classes on the block surface`.
- **FILL-axis smoke: PASS.** Temp page (`src/app/dev/fillsmoke/page.tsx`, rendered under
  `/dev` because localhost is treated as the apex host by middleware and non-`/dev` app
  routes 404) rendered `<AppIcon name="push_pin" filled>` + unfilled twin; dev server on
  3022 + Playwright probe:
  - both spans compute `font-family:"Material Symbols Rounded"`, `document.fonts.check` true;
  - filled `font-variation-settings` = `"FILL" 1,…`, outline = `"FILL" 0,…`;
  - both boxes 64×64 (single glyph, NOT the ~8-char literal text "push_pin");
  - screenshot: top glyph SOLID (filled pin), bottom HOLLOW (outline pin) — visibly distinct.
  Temp page + throwaway screenshot script deleted (git status clean of `fillsmoke`/`fillshot`);
  dev server killed. No trace left.

## Deviations from the plan (with reason)

1. **CTA shadow value pick.** The `.dc.html` files carry 4 slightly-different coral CTA
   shadows (see above). Picked the dominant in-app action-CTA value
   `0 10px 22px -9px rgba(255,107,61,.7)`. In-scope judgment call (matches plan
   unresolved-question #1's "pull from .dc.html").
2. **FILL-axis smoke mounted under `/dev/fillsmoke`, not the dashboard page** (plan said
   "drop onto the dashboard page"). On localhost the app's host-based middleware serves
   apex/marketing + `/dev/*` only; `/dashboard` and top-level app routes 404, so the
   dashboard page is unreachable in this env. `/dev/*` is the same root-app-layout surface
   (app-chrome.css + fonts-app-chrome.css active), so the smoke is equally valid. Temp
   files fully reverted.

## RESOLVED — config-freeze borderRadius (orchestrator-authorized, added to Files-touched)

The Phase-1 guard `tailwindConfigFreeze.test.ts` asserted `borderRadius` via whole-object
`toEqual`, which rejected the 7 plan-authorized additive `borderRadius['app-*']` keys — NOT
an existing-key mutation (`lg/md/sm/none/DEFAULT/xl/2xl/3xl/full` all unchanged). The
orchestrator added the test file to Phase-3 Files-touched and authorized re-scoping it to
match the addition-tolerant `fontFamily` assertion already in the same file (per-key freeze,
which is why fontFamily stayed green after app-sans/mono/hand were added).

Change made (ONLY this): the `borderRadius` assertion is now

```js
expect(theme.borderRadius).toMatchObject({
  none: '0px', sm: 'calc(var(--radius) - 4px)', DEFAULT: '0.25rem',
  md: 'calc(var(--radius) - 2px)', lg: 'var(--radius)', xl: '0.75rem',
  '2xl': '1rem', '3xl': '1.5rem', full: '9999px',
});
```

`toMatchObject` freezes every key that existed before ui-foundation (fails on any
mutation OR deletion of `lg/md/sm`/etc.) while tolerating the additive `app-*` radius keys
— intent preserved. The `fontFamily` (heading/body per-key) and `fontSize` (whole-scale)
assertions were left EXACTLY as-is; no other test or fixture touched. Test renamed to
"borderRadius (esp. lg/md/sm) existing keys are unchanged".

Re-verification after the re-scope:
- `npx tsc --noEmit` → clean (exit 0). (Also removed a stale `.next/types/app/dev/fillsmoke`
  build artifact left by the FILL-axis smoke temp page — gitignored `.next`, not a source file.)
- `npm run test:run` → **3012 passed | 18 skipped | 0 failed.** config-freeze borderRadius
  now passes with the `app-*` keys present; HTML-snapshot + published.css sha256 guards still
  green. (A mutation of `lg/md/sm` would still fail `toMatchObject` — mutation-catching intent
  intact.)
- No rebuild / e2e re-run needed (only the test assertion changed; no config/source/style change).

## Open risks / follow-ups

- None outstanding. All isolation proofs green: published.css sha byte-identical, HTML
  snapshot byte-identical, e2e computed-style baselines on `/dev/meridian/blocks` unchanged,
  0-leak grep, config-freeze (borderRadius existing-keys + fontFamily + fontSize) green,
  `test:run` 0 failed.
- HUMAN GATE (orchestrator's step): founder before/after eyeball on a real `/p/[slug]` +
  `/edit/[token]` — not performed by this agent.

---

# ui-foundation — Phase 4 audit (reskin 9 existing primitives)

Branch: `feature/ui-foundation` (verified before any edit). Reskin-in-place only — no
parallel components, no new files, all exported names/props/cva variant KEYS stable so
every call site compiles untouched. Only `app-*` tokens (Phase-3) used; no `tailwind.config.js`
edit. No forbidden-list file touched.

## Files changed

- `src/components/ui/button.tsx` — reskinned onto app-* tokens; ADDED `cta` variant.
- `src/components/ui/input.tsx` — reskinned.
- `src/components/ui/select.tsx` — reskinned (trigger + popover + item/label/separator).
- `src/components/ui/checkbox.tsx` — reskinned.
- `src/components/ui/switch.tsx` — reskinned.
- `src/components/ui/textarea.tsx` — reskinned.
- `src/components/ui/card.tsx` — reskinned (Card + Title + Description).
- `src/components/ui/badge.tsx` — restyled existing keys + ADDED 7 handoff variants.
- `src/components/ui/dialog.tsx` — reskinned modal shell (overlay/content/close/title/description).
- `docs/task/ui-foundation.audit.md` (this section).

## Per-primitive changes (+ handoff source)

- **button.tsx** (matched `Lessgo Auth.dc.html` "Claim my seat" primary + `Lessgo Dashboard.dc.html`
  coral CTA/secondary/ghost): base now `rounded-app-ctl font-app-sans font-semibold` +
  `focus-visible:ring-app-primary/40`. `default` = `bg-app-primary hover:bg-app-primary-hover
  text-white shadow-app-btn-primary` (auth blue button). ADDED `cta` = `bg-app-cta
  hover:bg-app-cta-soft text-white shadow-app-btn-cta` (dashboard coral, shadow token matches
  handoff `0 10px 22px -9px rgba(255,107,61,.7)`). `destructive` = `bg-app-danger`; `outline` =
  white surface + `border-app-border-input` hover canvas; `secondary` = canvas-fill bordered;
  `ghost` = hover `bg-app-canvas`; `link` = `text-app-primary` hover primary-hover+underline.
  Dropped the `rounded-md` on `sm`/`lg` sizes so base `rounded-app-ctl` applies (deviation note 1).
  `buttonVariants` export + all 6 original keys + 4 size keys UNCHANGED.
- **input.tsx** (matched Auth email/password field: `border #e2e4ea`, focus border `#006CFF` +
  white bg, placeholder `#b0b0ba`): `rounded-app-input border-app-border-input bg-app-surface
  font-app-sans text-app-ink placeholder:text-app-placeholder focus-visible:border-app-primary
  focus-visible:bg-white`; height 9→10, dropped `shadow-sm` (handoff fields are flat).
- **textarea.tsx** (same field system): matching input treatment, `rounded-app-input` etc.
- **select.tsx** (matched editor/dashboard dropdown surfaces): trigger mirrors input; popover
  `SelectContent` = `rounded-app-panel border-app-border bg-app-surface shadow-app-float
  font-app-sans` (white floating surface per handoff); item focus `bg-app-tint
  text-app-primary-deep` (active-nav tint); label `text-app-muted`; separator `bg-app-divider`.
- **checkbox.tsx**: unchecked `border-app-border-strong bg-app-surface`, checked `bg-app-primary
  border-app-primary text-white`, `rounded-[4px]`, ring `app-primary/40`.
- **switch.tsx** (matched editor toggle `#006CFF` on-track): checked `bg-app-primary`, unchecked
  `bg-app-border-strong`, white thumb, ring `app-primary/40`.
- **card.tsx** (matched dashboard cards): `rounded-app-card border-app-border bg-app-surface
  shadow-app-card font-app-sans`; Title `text-app-ink`, Description `text-app-muted`.
- **badge.tsx** (matched README "Recurring badge styles" + dashboard/editor chips): base now
  `rounded-app-badge font-app-sans gap-1`. Existing keys restyled: `default` bg-app-primary,
  `secondary` app-tint/primary-deep, `destructive` app-danger, `outline` app-border.
- **dialog.tsx** (matched Auth 20px-radius modal card + modal shadow token): overlay
  `bg-app-ink/60`; content `rounded-app-modal border-app-border bg-app-surface font-app-sans
  text-app-ink shadow-app-modal`; close button hover `bg-app-canvas`; title `text-app-ink`,
  description `text-app-muted`. Radix structure + all exported parts UNCHANGED.

## Variant-key inventory

- **button** existing keys UNCHANGED: `default/destructive/outline/secondary/ghost/link` +
  sizes `default/sm/lg/icon`. `buttonVariants` export unchanged. ADDED: `cta`.
- **badge** existing keys UNCHANGED: `default/secondary/destructive/outline`. `badgeVariants`
  export unchanged. ADDED (7): `status` (pill canvas/muted), `mono` (dark `bg-app-ink` white
  `font-app-mono` — README dark annotation badge), `postBeta` (`bg-[#f1e6d8] text-[#9a6a1f]
  border-[#ecdcc2]` pill — one-off arbitrary values per plan, no config tokens), `magic`
  (`bg-app-cta` white pill — MAGIC MOMENT), `success` (`bg-app-success-bg text-app-success`
  pill), `danger` (`bg-app-danger-bg text-app-danger` pill), `saved` (transparent `text-app-muted`
  — consumer supplies the green dot).
- No other primitive exposes cva variants; all component/part exports on all 9 files are unchanged.

## Deviations / judgment calls

1. Removed `rounded-md` from button `sm`/`lg` sizes and `md:text-sm`/`shadow-sm` from
   input/textarea so the app radius + flat handoff field look apply uniformly. In-scope styling
   only; no API change.
2. Badge base radius changed pill(rounded-full)→`rounded-app-badge` (6px) to match README's
   "Small badges 5–6px"; pill-shaped chips use the new pill variants. Existing keys keep working;
   only their corner radius shifts. Conservative reskin, logged.
3. Focus rings unified to `ring-app-primary/40` (replacing `ring-ring`) across primitives so
   portaled/unwrapped usage (dialog/select in document.body, outside `.app-chrome`) styles
   correctly per isolation mechanism §2. Every base carries explicit `font-app-sans` (badge/dialog
   mono variant carries `font-app-mono`).

## Verification (all run in WORKDIR)

- `npx tsc --noEmit` → clean (no output). Stable API confirmed: no call site needed adjustment.
- `npm run build` → green.
- `npm run test:run` → 184 files passed / 1 skipped; 3012 passed / 18 skipped; **0 failed**.
  tailwindConfigFreeze + published.css sha256 + HTML-snapshot guards all green.
- `public/published.css` sha256 = `c2f87e08f517a72b43f6e9e0e9b703b6261f4f152c711be9241649c6f26219b6`
  == committed baseline (byte-identical — no token added, no template touched).
- `npm run lint` (eslint on the 9 touched files) → clean (no output).
- `npm run test:e2e` isolation spec (`--project=public`, **port 3050** — 3000 held a stale
  server returning 500; ran a dedicated fresh dev server via `PORT=3050 E2E_PORT=3050`) →
  2 passed: computed-style baselines on `/dev/meridian/blocks` unchanged + no app-chrome
  fonts/classes on the block surface. Primitives aren't used by templates, so template
  rendering is unchanged.
- Dev visual spot-check: SKIPPED (a working dev server on the standard port was unavailable;
  the isolation e2e ran against a dedicated 3050 server, but a manual eyeball of the reskinned
  primitives themselves was not performed). Founder's Phase-6 manual pass is the visual-taste gate.

## Open risks

- Visual fidelity vs handoff is unverified by human eye this phase (deferred to Phase-6 HUMAN
  GATE). Reskin values were copied from the `.dc.html` markup at high fidelity.
- Badge default-radius change (deviation 2) could surface where an existing call site assumed a
  full pill; grep of usages not exhaustively re-audited — low risk (badges are decorative).

---

## Phase 5 — Net-new primitives (headless, no new deps)

**Files changed**
- `src/components/ui/nav-item.tsx` (new)
- `src/components/ui/segmented-control.tsx` (new)
- `src/components/ui/tabs.tsx` (new)
- `src/components/ui/toast.tsx` (new)
- `src/components/ui/image-placeholder.tsx` (new)
- `src/components/ui/segmented-control.test.tsx` (new)
- `src/components/ui/tabs.test.tsx` (new)
- `src/components/ui/toast.test.tsx` (new)
- `docs/task/ui-foundation.audit.md` (this section)

### Primitive APIs + handoff surface matched

- **`nav-item.tsx`** — `NavItem` (fwdRef) + `navItemClasses(active?)`. Props: `asChild?`,
  `active?`, `href?`, `icon?` (Material Symbols ligature), `iconFilled?`, `label?`, + HTML attrs.
  Renders `<button>` / `<a href>` / `Slot` (asChild for Next `<Link>`). Active =
  `text-app-primary-deep bg-app-tint` (#003E80 on #e6f0ff), idle hover `bg-app-canvas`; sets
  `aria-current="page"` when active. `'use client'` (Slot). → Dashboard sidebar nav.
- **`segmented-control.tsx`** — `SegmentedControl` (fwdRef) + `SegmentedOption` type. Controlled
  `value`/`onValueChange`, `options[]` ({value,label,icon?,disabled?}), `aria-label`.
  WAI-ARIA radiogroup + roving tabindex; Arrow (L/U=prev, R/D=next, wraps), Home/End; skips
  disabled. Container `bg-app-canvas rounded-app-ctl p-1`, active segment `bg-app-surface
  shadow-app-card`. `'use client'`. → Editor link-picker / media-picker type control.
- **`tabs.tsx`** — `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` (all fwdRef),
  shadcn-compatible (`value`/`defaultValue`/`onValueChange`) so a later `@radix-ui/react-tabs`
  swap is a drop-in. Controlled + uncontrolled; context carries value + `React.useId()` baseId.
  Roving focus (arrows wrap, Home/End) with automatic activation; `role=tablist|tab|tabpanel`,
  `aria-selected`, `aria-controls`/`aria-labelledby` id-linked, inactive panel `hidden` + not
  rendered. Underline active = `border-app-primary text-app-primary-deep`. `'use client'`.
  → Editor media-picker "Stock/Upload/URL" tabs.
- **`toast.tsx`** — `ToastProvider` + `useToast()` → `{ toast(message, {variant?,duration?}), dismiss(id) }`
  + `ToastVariant`/`ToastOptions` types. Bottom-stacked viewport `createPortal`ed to
  `document.body`, carrying `font-app-sans` + direct app-* tokens (Phase-4 dialog pattern).
  Auto-dismiss (default 4000ms; 0 = sticky); variants success (`app-success-bg`/`check_circle`),
  error (`app-danger-bg`/`error`), info (`app-tint`/`info`) via AppIcon; per-card dismiss button.
  `'use client'`. Self-contained — does NOT touch the edit-page-local ToastProvider. → global toast.
- **`image-placeholder.tsx`** — `ImagePlaceholder` (fwdRef) + `ImagePlaceholderProps`. Props:
  `aspect?` (CSS aspect-ratio), `rounded?` (default `rounded-app-card`), + HTML attrs. Striped
  `bg-app-stripes` box, `aria-hidden` when empty. Presentational — server component (no `'use client'`).
  → universal "image goes here" region.

### Tests (13 assertions across 3 files)

No `@testing-library/react` is installed in this repo (contrary to the task note — verified absent
from package.json + node_modules). To honor the hard "NO new npm deps" rule, the interactive tests
use a `react-dom/client` `createRoot` + `React.act` (18.3.1) harness with native event dispatch and
`IS_REACT_ACT_ENVIRONMENT=true`. No new dependency added.

- `segmented-control.test.tsx` (4): radiogroup + radio-per-option + roving tabindex/aria-checked;
  value change on click; ArrowRight/Left selection + wrap; Home/End jump.
- `tabs.test.tsx` (4): role/aria-selected/aria-controls + panel visibility (uncontrolled);
  selection change on click; roving arrow focus + auto-activation + wrap; controlled value honored
  (self-update suppressed) + `onValueChange` fired + re-render on new prop.
- `toast.test.tsx` (5): enqueue → renders with message; variant data-attr + app-success/app-danger
  chip class + per-variant AppIcon ligature; auto-dismiss after duration (fake timers); duration 0
  = no dismiss; dismiss button removes.
- New total: **13 tests, all pass.**

### Isolation

All 5 primitives are app-chrome-only (use app-* tokens directly, explicit `font-app-sans` on
portaled/base surfaces). Each file carries an "APP-CHROME ONLY — never import from
`src/modules/templates/**` or `src/components/published/**`" comment. `nav-item`/`segmented-control`/
`toast` import `AppIcon` (Material Symbols) so leakage to template/published surfaces is explicitly
forbidden. No template/published/renderer/forbidden file touched.

### Gate results

- `npx tsc --noEmit` → clean.
- `npm run test:run` → 3025 passed | 18 skipped (0 failed); includes the 13 new tests and the
  Phase-1 guards (published-css sha256, config-freeze, HTML snapshot) all green.
- `npm run build` → green.
- `public/published.css` sha256 = `c2f87e08f517a72b43f6e9e0e9b703b6261f4f152c711be9241649c6f26219b6`
  == committed baseline → **byte-identical (yes)**.
- `npm run lint` (eslint, 8 new files) → clean.
- `git diff HEAD -- package.json package-lock.json` → empty → **zero new deps confirmed**.
- e2e isolation not re-run this phase (port contention) — published-surface unchanged is proven
  by the byte-identical sha256 + config-freeze + HTML-snapshot guards, which all passed.

### Deviations

1. **Test harness = `react-dom/client` + `React.act`, not `@testing-library/react`.** The library
   the task cited is not installed and adding it would violate the binding "no new npm deps" rule.
   Chose the conservative option: a dependency-free harness (createRoot + act + native events).
   Same behavioral coverage (click, keyboard, auto-dismiss, variant).
2. **`tabs.test.tsx` panel lookup uses `document.getElementById`** rather than a CSS selector —
   `React.useId()` produces ids containing `:` which are invalid in `querySelector`. Behavior
   unaffected; the id-linking assertion still holds.
