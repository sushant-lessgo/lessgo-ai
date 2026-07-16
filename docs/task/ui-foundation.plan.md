# ui-foundation — implementation plan

**WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\ui-foundation` · **Branch:** `feature/ui-foundation`
**Spec:** `docs/task/ui-foundation.spec.md` (tier: full)

> **Handoff bundle location (critical):** the designer handoff is UNTRACKED and exists ONLY in the
> main repo, NOT in this worktree. Read it at the absolute path
> `C:\Users\susha\lessgo-ai\docs\Design\Lessgo AI UI redesign\design_handoff_lessgo_app\`
> (`README.md` = token tables; the four `.dc.html` files = exact markup). Do not try to copy it in.

## Overview

Ship the shared visual foundation for app chrome: 4 self-hosted fonts (Onest, JetBrains Mono 600,
subsetted Material Symbols Rounded variable icon font, Caveat), a namespaced app-chrome token layer
(color/radius/shadow/type/stripe/badge values from the handoff README), and the full primitive set —
9 existing `src/components/ui/` primitives reskinned in place + 5 net-new primitives. The #1
constraint is template/published isolation: generated pages (`src/modules/templates/*`, both
renderers, `/p/*`) must render byte-identical before/after, proven by automated guards laid down
FIRST plus a founder eyeball gate.

## Progress log

- phase 1 isolation baseline guards: done (commit 454dbc23, review loops 1, verdict ship) — guards: HTML snapshot + published.css sha256 (published surface) + /dev computed-style e2e (editor surface) + tailwind.config.js freeze test; isolation spec wired into playwright public project
- phase 2 fonts (fetch + subset + app-only stylesheet + preloads): done (commit 6e7af964, review loops 1, verdict ship) — 4 families self-hosted, MS subset 164KB axes-intact, app-only stylesheet no published leak; mid-flight fix: app mono = distinct family 'JetBrains Mono App' (avoids mono@600 editor/published divergence); e2e /dev network assertion dropped as mis-scoped
- phase 3 token layer + AppIcon + scope class [HUMAN GATE]: done (commit efe3d48b, review loops 1, verdict ship, HUMAN GATE passed 2026-07-16) — app-* tokens additions-only, AppIcon, .app-chrome (unattached); config-freeze re-scoped; isolation held + founder-confirmed identical
- phase 4 reskin 9 existing primitives: pending
- phase 5 net-new primitives: pending
- phase 6 acceptance sweep + final green gate [HUMAN GATE]: pending

## Isolation mechanism (design decision, binding for all phases)

1. **Namespaced Tailwind keys only.** All new tokens land under `app-*` keys in
   `tailwind.config.js` `theme.extend` (`colors.app.*`, `borderRadius['app-*']`,
   `boxShadow['app-*']`, `fontFamily['app-sans'|'app-mono'|'app-hand']`,
   `backgroundImage['app-stripes']`). Tailwind's stock palette, the existing
   `borderRadius.lg/md/sm → var(--radius)` overrides, `fontSize` scale, and every existing key
   stay UNTOUCHED. `src/app/globals.css` `:root` is NOT edited (it's imported by `p/layout.tsx`).
2. **Primitives are self-contained.** Reskinned primitives use static `app-*` utilities directly
   (incl. explicit `font-app-sans` / `font-app-mono` in their base classes) — no dependence on an
   ancestor scope, so Radix portals (dialog/select/toast render into `document.body`) style
   correctly with zero `:root` involvement.
3. **`.app-chrome` scope class** (new `src/styles/app-chrome.css`) provides inherited base defaults
   (Onest, `#191922` ink, `#f7f8fa` canvas bg, antialiasing) + the `.app-icon` Material Symbols
   classes. Foundation DEFINES it but applies it to NO screens — consuming specs (auth-redesign,
   dashboard, editor-shell) attach it to their shells. Never attach it to root `<body>`, `/p/*`,
   `/preview/*`, or any wrapper containing the editor canvas.
4. **Forbidden files (no phase may touch):** `src/app/globals.css`, `src/app/p/layout.tsx`,
   `src/styles/fonts-self-hosted.css`, `src/lib/staticExport/htmlGenerator.ts`,
   `scripts/buildPublishedCSS.js`, `scripts/buildAssets.js`, `src/modules/templates/**`,
   `src/modules/generatedLanding/**` (renderers/registries; the phase-1 guard TEST files added
   there are the sole exception), `src/components/published/**`, `src/modules/Design/designTokens.ts`,
   `CriticalFontPreload.tsx`. (`buildPublishedCSS.js` inlines `fonts-self-hosted.css` into
   `public/published.css` and compiles Tailwind only over published-renderer globs — new `app-*`
   keys therefore never emit into published CSS.)
5. **Two-surface isolation proof (two guards, one per surface).** Generated template blocks render
   on TWO independently-styled surfaces, so no single artifact proves isolation:
   - **PUBLISHED surface** (`/p/[slug]`): styled by `public/published.css`, which
     `scripts/buildPublishedCSS.js` compiles from its own STANDALONE embedded config
     (`tailwind.published.config.js` — hardcoded fontFamily/fontSize, default borderRadius),
     INDEPENDENT of root `tailwind.config.js`. Guard = committed sha256 baseline of the freshly
     built `public/published.css` (Phase 1), asserted byte-identical in every later phase. This
     pins the published surface against forbidden-file edits and any new-token/font leakage.
     NOTE: because the published config is standalone, this hash is INVARIANT to root
     `tailwind.config.js` changes — it does NOT catch a root-config existing-key mutation.
   - **EDITOR / main-app surface** (`/edit`, `/preview`, and the `/dev/*` template galleries that
     `e2e/render.spec.ts` already exercises — `/dev/meridian/blocks` route confirmed at
     `src/app/dev/meridian/blocks/page.tsx`): styled by the MAIN-APP bundle CSS compiled from
     ROOT `tailwind.config.js`. An accidental override of an existing key
     (`borderRadius.lg/md/sm`, `fontSize` scale, `fontFamily.heading/body`) shifts template
     rendering HERE silently — and creates an editor↔published divergence. Guard = Phase 1's
     Playwright spec records computed-style baselines (`border-radius`, `font-size`,
     `font-family`) for representative template elements on `/dev/meridian/blocks` and asserts
     them equal to committed baseline values through Phase 6. THIS is the guard that catches a
     root-config existing-key mutation.
   Both guards are laid down in Phase 1 and asserted at every later phase. The published-css hash
   is only valid against a FRESH artifact (`npm run build:published-css` / `npm run build`),
   never a stale file.

**Dependency decision:** NO new npm deps. Tabs / segmented control / toast are built headless
in-house (`@radix-ui/react-tabs`/`react-toast` are not installed; the edit-page-local
ToastProvider at `src/app/edit/[token]/components/ui/` is behavior reference only).

## Token reference (implementer copies values from handoff README §Design System; summary)

- Colors (`colors.app.*`): `primary #006CFF`, `primary-hover #0056d6`, `primary-deep #003E80`,
  `tint #e6f0ff`, `cta #FF6B3D`, `cta-soft #FF814A`, `ink #191922`, `muted #7b7b86`,
  `faint #a6a6b0`, `placeholder #b0b0ba`, `label #3a3a44`, `slate #5a6472`, `body #5b5b66`,
  `success #16a34a`, `success-bg #e6f5ec`, `danger #d1483a`, `danger-bg #fef2f2`,
  `canvas #f7f8fa`, `surface #ffffff`, `border #ececf1`, `border-input #e2e4ea`,
  `border-strong #d7d7dd`, `divider #eef0f3`, `hairline #f2f2f5`.
- Radius: `app-ctl 10px`, `app-input 12px`, `app-panel 14px`, `app-card 16px`, `app-modal 20px`,
  `app-pill 20px`, `app-badge 6px`.
- Shadows: `app-card 0 2px 10px -6px rgba(20,20,40,.2)`,
  `app-modal 0 40px 90px -34px rgba(20,20,40,.4)`,
  `app-float 0 30px 66px -22px rgba(20,20,40,.4)`,
  `app-btn-primary 0 14px 28px -12px rgba(0,108,255,.75)`,
  `app-btn-cta` — coral-tinted; README truncates it → read the exact value from the `.dc.html`
  files (grep an orange CTA button's box-shadow).
- `backgroundImage['app-stripes']: repeating-linear-gradient(135deg,#eef0f4 0 11px,#e6e8ee 11px 22px)`.
- Type: Onest 400/500/600/700/800 (display 800, tracking −0.3…−1.2px, lh 1.1–1.2; body 400 lh
  1.5–1.7); JetBrains Mono 400–600 (eyebrows letter-spacing .08–.12em); Caveat = Auth accent.

---

## Phase 1 — Isolation baseline guards (tests only, BEFORE any styling change)

**Goal:** capture the current template output on BOTH surfaces — rendered HTML + the compiled
`public/published.css` artifact (published surface) AND computed styles on the main-app surface
(`/dev/meridian/blocks`) — as automated baselines so every later phase mechanically proves
"generated pages unchanged", including the silent root-Tailwind existing-key-mutation failure mode.

**Files touched**
- `src/modules/generatedLanding/uiFoundationIsolation.test.tsx` (new)
- `src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap` (generated by test run)
- `src/modules/generatedLanding/__fixtures__/published-css.sha256` (new — committed baseline hash of freshly built `public/published.css`)
- `e2e/ui-isolation.spec.ts` (new)
- `e2e/fixtures/ui-isolation-computed-styles.json` (new — committed computed-style baselines for the `/dev/meridian/blocks` elements; omit only if values are hardcoded in the spec instead)
- `src/modules/generatedLanding/tailwindConfigFreeze.test.ts` (new — **added post-approval per plan-review nit #1**: coverage-independent config-level guard, see step 4)
- `playwright.config.ts` (**added post-implementation**: register `ui-isolation.spec.ts` in the `public` project's `testMatch` so the isolation e2e actually runs under `npm run test:e2e` — without this the guard is silently skipped/vacuous)

**Steps**
1. Vitest test: render published HTML from an EXISTING frozen fixture — reuse the fixture already
   used by the generation-contract / dispatch / golden tests (locate it; do not create a new
   fixture) through the published renderer path (`generateStaticHTML()` or
   `LandingPagePublishedRenderer` + `renderToStaticMarkup`), for at least one product (meridian)
   and one service (hearth) project shape. Assertions:
   a. `toMatchSnapshot()` on the full HTML (baseline recorded THIS phase, pre-change; later
      phases must not alter it).
   b. Negative-trace assertions (hold forever): output contains none of `class="...app-`,
      `Onest`, `Caveat`, `Material Symbols`, `fonts-app-chrome`.
2. **Published-CSS hash baseline (published-surface guard).** Run `npm run build:published-css`
   TWICE and confirm the output is deterministic (identical sha256 both runs; if not, identify
   the nondeterministic element — e.g. a timestamp banner — and record how the guard normalizes
   it before proceeding). Write the sha256 of the fresh `public/published.css` to
   `src/modules/generatedLanding/__fixtures__/published-css.sha256`. Add a vitest case in
   `uiFoundationIsolation.test.tsx` that reads `public/published.css`, computes sha256 (node
   `crypto`), and asserts equality with the committed baseline. If `public/published.css` is
   MISSING, the test must FAIL LOUDLY with "run `npm run build:published-css` first" — fail, not
   skip; and because it is a build artifact, every phase's verification runs the build BEFORE
   `test:run` so the guard never compares against a stale file. SCOPE NOTE: `published.css` is
   compiled from the standalone `tailwind.published.config.js` embedded in
   `scripts/buildPublishedCSS.js` — it is invariant to root `tailwind.config.js`, so this hash
   pins the PUBLISHED surface (forbidden-file edits, new-token/font leakage) but canNOT catch a
   root-config existing-key mutation. That vector is covered by step 3a's computed-style
   baseline on the main-app surface.
3. Playwright spec `e2e/ui-isolation.spec.ts` (mirror `e2e/render.spec.ts` conventions — same
   mock-mode server setup; render.spec already loads `/dev/meridian/blocks`, the full meridian
   block gallery rendered through the MAIN-APP CSS bundle compiled from root
   `tailwind.config.js`; note render.spec's own comment: that route mounts its block subtree via
   an `ssr:false` dynamic import, so wait for client render before reading styles):
   a. **Computed-style baselines (editor-surface guard — catches root-config existing-key
      mutation).** On `/dev/meridian/blocks`, record `getComputedStyle` values for a handful of
      representative template elements — e.g. one card (border-radius), one CTA/button
      (border-radius + font-size), one heading (font-family + font-size), one body-text node
      (font-family + font-size) — and assert them EQUAL to the committed baselines in
      `e2e/fixtures/ui-isolation-computed-styles.json` (baselines captured THIS phase,
      pre-change; a handful of elements covering radius + font-size + font-family, not
      exhaustive). Select elements via stable selectors (`data-surface` attrs / template block
      classnames), not nth-child.
   b. On the `/dev/meridian/blocks` app-surface render: computed `font-family` of the hero
      headline does NOT contain `Onest` (templates don't USE app fonts even when available), and
      `document.querySelectorAll('[class*="app-"]')` inside the landing root is empty. **NOTE (Phase 2
      correction):** do NOT assert "no app-font woff2 network request" on this route — `/dev/*` is an
      APP-SHELL route served by the root layout, which legitimately preloads app fonts (Onest/Material
      Symbols) on every app route. That is app chrome, not a published page. The published-surface
      font-network isolation ("a published page references/loads no app font") is proven instead by the
      vitest guard's HTML-snapshot negative-trace (no `fonts-app-chrome`/`Onest`/etc. in published HTML)
      + the published.css sha256 + 0-leak grep. The meaningful app-surface assertions here are the
      font-family (templates render Inter Tight, not Onest, despite Onest being preloaded/available) and
      the app-class checks.
   c. Skip gracefully if mock-mode server prereqs unavailable (follow render.spec conventions) —
      BUT the phase-gate expectation is that it actually EXECUTES (render.spec proves mock-mode
      prereqs are normally available). A silent skip makes the editor-surface guard vacuous, so
      treat a skip at a phase gate as "guard not run," not "guard passed."
   d. **Pin the Playwright viewport explicitly** in this spec (fixed `viewport` in test.use or
      the config) so px-based `font-size`/`border-radius` baselines don't drift across
      machines/CI — template heading font-sizes may be `clamp()/vw`-derived.
4. **Config-freeze unit guard (`tailwindConfigFreeze.test.ts`) — added post-approval per
   plan-review nit #1.** A vitest test that `require`s the root `tailwind.config.js`, runs it
   through `resolveConfig` (`tailwindcss/resolveConfig`), and asserts FROZEN expected values for
   `theme.borderRadius` (esp. `lg/md/sm`), `theme.fontSize`, and `theme.fontFamily` (`heading`/
   `body`). This is the strictly-more-robust, coverage-INDEPENDENT guard for the root-config
   existing-key-mutation vector: it fails on ANY mutation of those keys regardless of whether a
   sampled template element happens to consume the mutated key, needs no browser/mock server, and
   is deterministic. It complements (belt-and-suspenders) — does not replace — step 3a's e2e
   computed-style baseline. Record the current resolved values as the frozen baseline THIS phase.

**Verification:** `npx tsc --noEmit` · `npm run build:published-css` (fresh artifact, determinism
double-run done) then `npm run test:run` — HTML snapshot recorded + published-css hash test green
+ config-freeze test green · `npm run test:e2e` for the new spec — computed-style baselines
recorded + green (must actually execute, not skip; documented skip reason only if genuinely
env-bound, matching render.spec behavior).

---

## Phase 2 — Fonts: fetch + subset + licenses + app-only stylesheet + preloads

**Goal:** all 4 families self-hosted under `public/fonts/`, declared in a NEW app-only stylesheet
imported ONLY by the root app layout — zero bytes added to published pages.
(Licensing is CLEARED per spec 2026-07-16 — all libre; no blocking gate. Non-blocking note only:
confirm fetched binaries match the commands below before committing.)

**Files touched**
- `public/fonts/onest/onest-latin-{400,500,600,700,800}-normal.woff2` (new binaries)
- `public/fonts/onest/OFL.txt` (new)
- `public/fonts/jetbrains-mono/jetbrains-mono-latin-600-normal.woff2` (new; 400/500 + OFL already present)
- `public/fonts/material-symbols-rounded/material-symbols-rounded.woff2` (new, SUBSET ONLY — full font must never be committed)
- `public/fonts/material-symbols-rounded/LICENSE` (new, Apache 2.0)
- `public/fonts/material-symbols-rounded/NOTICE` (new — state source + that the font was subsetted, per Apache 2.0 change-notice obligation; list the retained icon set)
- `public/fonts/material-symbols-rounded/icons.txt` (new — the subset glyph list, kept as the regeneration input)
- `public/fonts/caveat/caveat-latin-{400,700}-normal.woff2` (new)
- `public/fonts/caveat/OFL.txt` (new)
- `src/styles/fonts-app-chrome.css` (new)
- `src/app/layout.tsx` (import stylesheet + preload links in the empty `<head />` slot, lines ~107–115)
- `e2e/ui-isolation.spec.ts` (**Phase-2 correction to this Phase-1 file**: the root-layout preloads added here fire on every app-surface route incl. `/dev`, so remove the mis-scoped "no app-font woff2 request on `/dev`" assertion — see Phase 1 step 3b note; keep the font-family + app-class assertions. Published-surface font-network isolation stays proven by the vitest HTML-snapshot + published.css guards.)

> **Shared-file note:** `src/app/layout.tsx` is INTENTIONALLY touched by both Phase 2 (this
> phase: `fonts-app-chrome.css` import + 3 preload links) and Phase 3 (`app-chrome.css` import).
> The Phase 3 implementer must treat this phase's imports/preloads as expected prior state, not
> drift.

**Steps**
1. Fetch per spec commands (run from WORKDIR; bash):
   ```bash
   mkdir -p public/fonts/onest
   for w in 400 500 600 700 800; do
     curl -L -o public/fonts/onest/onest-latin-$w-normal.woff2 \
       "https://cdn.jsdelivr.net/fontsource/fonts/onest@latest/latin-$w-normal.woff2"
   done
   curl -L -o public/fonts/jetbrains-mono/jetbrains-mono-latin-600-normal.woff2 \
     "https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-600-normal.woff2"
   mkdir -p public/fonts/material-symbols-rounded
   curl -L -o public/fonts/material-symbols-rounded/material-symbols-rounded-full.woff2 \
     "https://github.com/google/material-design-icons/raw/master/variablefont/MaterialSymbolsRounded%5BFILL%2CGRAD%2Copsz%2Cwght%5D.woff2"
   mkdir -p public/fonts/caveat
   for w in 400 700; do
     curl -L -o public/fonts/caveat/caveat-latin-$w-normal.woff2 \
       "https://cdn.jsdelivr.net/fontsource/fonts/caveat@latest/latin-$w-normal.woff2"
   done
   ```
   Licenses: Onest/Caveat `OFL.txt` from `https://github.com/google/fonts/raw/main/ofl/<family>/OFL.txt`;
   Material Symbols `LICENSE` = Apache-2.0 from the material-design-icons repo root.
2. Build the icon list: grep the four `.dc.html` files (main-repo absolute path above) for
   Material-Symbols text nodes; union with the spec's seed set
   (`arrow_forward, mail, lock, auto_awesome, push_pin, perm_media, tune`). Write one name per
   line to `icons.txt`.
3. **MANDATORY subset** (spec): with fonttools (`pip install fonttools brotli`):
   ```bash
   python -m fontTools.subset public/fonts/material-symbols-rounded/material-symbols-rounded-full.woff2 \
     --output-file=public/fonts/material-symbols-rounded/material-symbols-rounded.woff2 \
     --flavor=woff2 --layout-features='liga,rlig,calt' \
     --text-file=public/fonts/material-symbols-rounded/icons.txt
   ```
   Icon names resolve via ligatures — `--text-file` + kept `liga` pulls the composed glyphs; do
   NOT pass `--instance`/pin axes, so `FILL,GRAD,opsz,wght` fvar axes survive. Then DELETE
   `material-symbols-rounded-full.woff2` (never committed). Sanity: subset ≲ 100 KB; inspect
   axes survive (`python -m fontTools.ttx -t fvar -o - <subset>` shows the 4 axes).
4. `src/styles/fonts-app-chrome.css` — mirror the existing `@font-face` pattern from
   `fonts-self-hosted.css` (but do NOT edit that file):
   - 5 static Onest faces (`font-display:swap`).
   - 2 static Caveat faces.
   - App mono faces under a **DISTINCT family name `'JetBrains Mono App'`** (NOT `'JetBrains Mono'`).
     Declare 400/500/600 under this distinct name (400/500 reuse the existing
     `public/fonts/jetbrains-mono/jetbrains-mono-latin-{400,500}-normal.woff2`; 600 = the new file).
     **WHY distinct (corrected mid-flight — the plan's original same-name-merge premise was FALSE):**
     multiple templates (`techpremium`, `lumen`, meridian `.mrd-cta__eyebrow`) render
     `var(--font-mono)` = `'JetBrains Mono'` at `font-weight:600`. If the app 600 face used the SAME
     family name, it would merge on the app surface (root layout covers `/edit`,`/preview`) and those
     template nodes would render REAL 600 in the editor while published (published.css ships only JBM
     400/500) synthesizes faux-bold → a NEW editor↔published divergence in GENERATED pages, violating
     the #1 constraint. A distinct app-only family name means templates' `'JetBrains Mono'` stays
     400/500-only on BOTH surfaces (faux-bold 600 on both, byte-identical, as before this feature),
     while app chrome gets real JBM 600 via the `font-app-mono` token (Phase 3) → `'JetBrains Mono App'`.
     Touches no forbidden files. Consumers reference the `font-app-mono` token, never the raw family
     name, so the internal rename is invisible to them.
   - Material Symbols Rounded variable face: `src:url(...) format('woff2-variations');
     font-weight:100 700; font-style:normal; font-display:block` (block avoids icon-name FOUT).
5. `src/app/layout.tsx`: `import '@/styles/fonts-app-chrome.css'` (alongside the existing
   fonts-self-hosted import) + in `<head>`: `<link rel="preload" as="font" type="font/woff2"
   crossOrigin="anonymous">` for `onest-latin-400`, `onest-latin-600`, and the Material Symbols
   subset. Do NOT touch `CriticalFontPreload.tsx` (published-page hero preload) or `p/layout.tsx`.

**Verification:** `npx tsc --noEmit` · `npm run build` green (regenerates `public/published.css`)
then `npm run test:run` — published-css sha256 == phase-1 baseline AND phase-1 HTML snapshot
unchanged · `npm run test:e2e` isolation spec — `/dev/meridian/blocks` computed-style baselines
unchanged · diagnostic re-grep `rg -i "onest|caveat|material symbols" public/published.css` →
empty · **JBM-600 divergence — RESOLVED BY DESIGN (see step 4):** templates DO render mono@600
(`techpremium`/`lumen`/meridian), so the app mono faces use the distinct family name
`'JetBrains Mono App'` and CANNOT merge with templates' `'JetBrains Mono'`. Verify the guarantee:
`rg -i "jetbrains mono" src/styles/fonts-app-chrome.css` must show ONLY `'JetBrains Mono App'`
(no bare `'JetBrains Mono'` face declared in the app stylesheet), and templates' `--font-mono`
still resolves to `'JetBrains Mono'` (unchanged). This keeps template mono@600 faux-bold on BOTH
surfaces (editor==published). ·
read-only confirm `scripts/buildAssets.js` still copies only `fonts-self-hosted.css` (it lists
files explicitly, line ~65 — no glob, so no action needed) · dev spot-check: app page loads the
3 preloads, a `/p/[slug]` page requests NONE of the new font files.

---

## Phase 3 — Token layer + AppIcon + scope class — **HUMAN GATE**

**Goal:** the complete namespaced token layer per the reference table above, the `.app-chrome`
scope class, and the icon component — then prove isolation held before building primitives on top.

**Files touched**
- `tailwind.config.js` (theme.extend additions ONLY: `colors.app.*`, `borderRadius['app-*']`,
  `boxShadow['app-*']`, `fontFamily['app-sans','app-mono','app-hand']`, `backgroundImage['app-stripes']`)
- `src/styles/app-chrome.css` (new)
- `src/app/layout.tsx` (import app-chrome.css)
- `src/components/ui/icon.tsx` (new — `AppIcon`)
- `src/modules/generatedLanding/tailwindConfigFreeze.test.ts` (**added post-implementation**: the Phase-1 borderRadius freeze used whole-object `toEqual`, which rejects the authorized additive `app-*` radius keys. Re-scope the borderRadius assertion to per-EXISTING-key checks — mirroring the fontFamily assertion already in this file — so existing keys `lg/md/sm`/etc. stay frozen (mutation still fails) while namespaced `app-*` additions are tolerated. Do NOT weaken the existing-key freeze.)

> **Shared-file note:** `src/app/layout.tsx` already carries Phase 2's `fonts-app-chrome.css`
> import + preload links — expected prior state, leave intact; this phase only ADDS the
> `app-chrome.css` import.

**Steps**
1. `tailwind.config.js`: ADD the namespaced keys from the token table. Hard rules: no edits to
   existing keys; do not touch stock palette, `borderRadius.lg/md/sm`, `fontSize`, or
   `fontFamily.heading/body`; confirm `content` globs already cover `src/components/**` and
   `src/app/**` (they do — existing ui/ works; change nothing if so).
   **`fontFamily['app-mono']` MUST use the distinct app family:**
   `['JetBrains Mono App', 'ui-monospace', 'monospace']` (NOT bare `'JetBrains Mono'`) — see Phase 2
   step 4: sharing the template family name reintroduces the mono@600 editor↔published divergence.
   `app-sans` = `['Onest', ...system]`, `app-hand` = `['Caveat', 'cursive']`. The phase-1
   `/dev/meridian/blocks` computed-style baseline (e2e) is the mechanical proof no existing key
   moved on the main-app surface — a root-config mutation does NOT show up in the published-css
   hash (standalone config), so the e2e check is MANDATORY this phase, not optional.
2. `src/styles/app-chrome.css`:
   - `.app-chrome` base: `font-family` Onest stack, `color #191922`, `background #f7f8fa`,
     antialiasing, `font-optical-sizing:auto`. NOT applied to any screen in this feature —
     documented for consuming specs (see isolation mechanism §3).
   - `.app-icon`: standard Material Symbols base (font-family, `line-height:1`, `display:inline-block`,
     `white-space:nowrap`, antialiased, `font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24`);
     `.app-icon--filled` flips `'FILL' 1`. Never pin `opsz` in component styles beyond this base —
     let `font-optical-sizing:auto` drive it where size varies.
3. `src/components/ui/icon.tsx`: `AppIcon({ name, filled?, size?, className? })` → renders
   `<span aria-hidden className={cn('app-icon', filled && 'app-icon--filled', className)}
   style={{ fontSize: size }}>{name}</span>`. App-chrome only; MUST NOT be imported by anything
   under `src/modules/templates/**` or `src/components/published/**` (lucide + IconPublished
   remain the template/published icon system).
4. Import `app-chrome.css` in `src/app/layout.tsx` only.

**Verification:** `npx tsc --noEmit` · `npm run build` green, then `npm run test:run` —
published-css sha256 == phase-1 baseline (published surface pinned), phase-1 HTML snapshot
byte-identical, negative traces green · `npm run test:e2e` isolation spec green — the
`/dev/meridian/blocks` computed-style baselines are THE existing-key-mutation check for this
phase's `tailwind.config.js` edit (main-app surface) · diagnostic re-grep of
`public/published.css` for `app-|onest` (empty) · FILL-axis smoke: temporarily drop
`<AppIcon name="push_pin" filled />` + unfilled twin onto the dashboard page in dev, verify both
render as glyphs (not text) with filled/outline difference, then revert the temp edit.

**HUMAN GATE (mandatory, spec):** founder eyeballs a real published page (`/p/[slug]`) and an
editor page (`/edit/[token]`) before/after phases 2–3 — must be visually identical (template
fonts, colors, radii untouched). Do not proceed to phase 4 without sign-off.

---

## Phase 4 — Reskin the 9 existing primitives in place

**Goal:** every existing shared primitive matches its handoff appearance using only `app-*` tokens.
No parallel components; exported names/props/variant keys stay stable so ~all call sites compile
untouched.

**Files touched**
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/switch.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/dialog.tsx`

**Steps**
1. Before styling each primitive, read its exact markup in the relevant `.dc.html` (main-repo
   path) — high-fidelity: colors/radii/shadows/type are final; hover via the prototype's
   `style-hover`, focus = border `#006CFF` + white bg (`focus-within`).
2. `button.tsx` (cva): keep keys `default/destructive/outline/secondary/ghost/link` + sizes;
   restyle `default` = primary blue (`bg-app-primary hover:bg-app-primary-hover text-white
   shadow-app-btn-primary rounded-app-ctl font-app-sans font-semibold`); ADD `cta` variant
   (coral `bg-app-cta`, white text, `shadow-app-btn-cta`); restyle `secondary/ghost/destructive`
   per handoff; `outline`/`link` get token-aligned facelifts (kept — callers depend on the keys;
   `buttonVariants` export unchanged).
3. `input.tsx`/`textarea.tsx`/`select.tsx`: `rounded-app-input`, `border-app-border-input`,
   placeholder `text-app-placeholder`, focus border `app-primary` + `bg-white`; select popover =
   surface white, `rounded-app-panel`, `shadow-app-float`.
4. `checkbox.tsx`/`switch.tsx`: checked = `bg-app-primary`; unchecked track/border per handoff.
5. `card.tsx` family: `bg-app-surface border-app-border rounded-app-card shadow-app-card`.
6. `badge.tsx` (cva): keep `default/secondary/destructive/outline`; restyle + ADD recurring
   handoff variants — `pill` shape prop or variants: status chip (`rounded-app-pill`), dark mono
   annotation badge (`bg-app-ink` white `font-app-mono`), `post-beta` (`#f1e6d8`/`#9a6a1f`/border
   `#ecdcc2` — one-offs, use arbitrary values `bg-[#f1e6d8]`, no config edits this phase),
   `magic` (`bg-app-cta` white), `saved` (green dot + `text-app-muted`), success/danger chips
   (`app-success`/`app-danger` + bgs). This covers the spec's "pills / status chips" — they are
   badge variants, not a new file.
7. `dialog.tsx` = the modal shell: overlay dim, content `rounded-app-modal shadow-app-modal
   bg-app-surface font-app-sans`; keep Radix structure + exported parts identical.
8. All base classes carry explicit `font-app-sans` (or `font-app-mono` where handoff says mono)
   so portaled/unwrapped usage renders correctly (isolation mechanism §2).

**Verification:** `npx tsc --noEmit` · `npm run build` green, then `npm run test:run` —
published-css sha256 == phase-1 baseline + HTML snapshot byte-identical · `npm run test:e2e`
isolation spec — `/dev/meridian/blocks` computed-style baselines unchanged · manual dev sweep:
dashboard, a modal (e.g. ConfirmDialog flow), a form screen — primitives visually match handoff;
templates/published spot-check unchanged.

---

## Phase 5 — Net-new primitives (headless, no new deps)

**Goal:** the remaining shared primitives every consuming spec needs, built on the token layer.

**Files touched**
- `src/components/ui/nav-item.tsx` (new)
- `src/components/ui/segmented-control.tsx` (new)
- `src/components/ui/tabs.tsx` (new)
- `src/components/ui/toast.tsx` (new)
- `src/components/ui/image-placeholder.tsx` (new)
- `src/components/ui/segmented-control.test.tsx` (new)
- `src/components/ui/tabs.test.tsx` (new)
- `src/components/ui/toast.test.tsx` (new)

**Steps**
1. `nav-item.tsx`: icon (AppIcon) + label row; active = `text-app-primary-deep bg-app-tint`
   (handoff: `#003E80` on `#e6f0ff`), hover `bg-app-canvas`; polymorphic `asChild`/href support
   via `@radix-ui/react-slot` (already installed).
2. `segmented-control.tsx`: controlled `value/onValueChange` pill group (handoff t4 link-picker
   type control) — container `bg-app-canvas rounded-app-ctl p-1`, active segment white +
   `shadow-app-card`; keyboard arrows + `role="tablist"`-appropriate ARIA (or radiogroup — match
   Radix conventions).
3. `tabs.tsx`: headless controlled Tabs/TabsList/TabsTrigger/TabsContent with shadcn-compatible
   API (so a later swap to `@radix-ui/react-tabs` is a drop-in); underline/active styling per
   handoff (e.g. media picker "Stock" tabs).
4. `toast.tsx`: lightweight `ToastProvider` + `useToast()` + viewport portal (bottom, stacked,
   auto-dismiss, success/error/info variants using `app-success`/`app-danger` chips + AppIcon).
   Behavior reference: `src/app/edit/[token]/components/ui/ToastProvider` — reference ONLY, do
   not modify or import it; migration of edit-page toasts is a consuming-spec job.
5. `image-placeholder.tsx`: `bg-app-stripes` box, optional `rounded-*` + aspect props — the
   handoff's universal "image goes here" region.
6. Vitest (jsdom) for the three interactive ones: selection change + keyboard for segmented +
   tabs; enqueue/auto-dismiss/variant for toast (deterministic-QA rule).

**Verification:** `npx tsc --noEmit` · `npm run build` green, then `npm run test:run` — new unit
tests green + published-css sha256 == phase-1 baseline + HTML snapshot byte-identical ·
`npm run test:e2e` isolation spec — computed-style baselines unchanged · quick dev render of each
new primitive (scratch usage, reverted).

---

## Phase 6 — Acceptance sweep + final green gate — **HUMAN GATE**

**Goal:** whole-feature verification against the spec's acceptance criteria; document the layer
for consuming specs.

**Files touched**
- `src/components/ui/README.md` (new or update — token layer summary, `app-*` naming, AppIcon
  usage + subset-regeneration note (`icons.txt`), `.app-chrome` attach rules incl. the
  editor-canvas prohibition, forbidden-files isolation list, two-surface guard doc: published-css
  hash regeneration + `/dev/meridian/blocks` computed-style baseline maintenance)

**Steps**
1. Full green gate: `npx tsc --noEmit` · fresh `npm run build` (regenerates `public/published.css`)
   then `npm run test:run` — published-css sha256 == phase-1 baseline + HTML snapshot
   byte-identical · `npm run test:e2e` (isolation spec: computed-style baselines on
   `/dev/meridian/blocks` unchanged + landing-page negative checks) · final diagnostic
   `rg -i "onest|caveat|material symbols|app-" public/published.css` → empty.
2. Acceptance checklist walk (spec §Acceptance): fonts loading + FILL axis · token layer complete
   vs README tables · primitive set complete (9 reskinned + badge pill/status variants + 5 new) ·
   no parallel library (no duplicate button/input/etc. files added) · generated pages unchanged
   on BOTH surfaces (published-css hash + computed-style baselines).
3. Grep guard: no file under `src/modules/templates/**`, `src/modules/generatedLanding/**`, or
   `src/components/published/**` imports `icon.tsx`, `app-chrome.css`, or `fonts-app-chrome.css`.

**HUMAN GATE:** founder re-runs the before/after eyeball on `/p/[slug]` + `/edit/[token]` against
the FINAL state (phases 4–5 landed since the phase-3 gate) and signs off acceptance. Merge to main
is the pipeline's own gate — not a plan phase.

---

## Unresolved questions

1. Coral CTA shadow exact value — README truncated; plan says pull from `.dc.html`. OK?
2. Badge one-off colors (POST-BETA `#f1e6d8/#9a6a1f/#ecdcc2`) as arbitrary values vs named tokens — plan picks arbitrary. OK?
3. Caveat weights: fetched 400+700 (handoff unspecified). OK?
4. `.app-chrome` applied to ZERO screens in this feature (consuming specs attach it) — confirm you accept old screens keep old base font until auth/dashboard/editor specs land, while primitives (buttons/inputs/etc.) restyle everywhere immediately.
5. In-house headless tabs/toast (no radix dep) — fine, or prefer adding `@radix-ui/react-tabs`/`react-toast` now?
