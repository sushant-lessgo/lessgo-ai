# `ui/` — app-chrome primitives + the `app-*` token layer

Base UI primitives for **app chrome** (Auth, Dashboard, Editor shell, Onboarding) —
the screens the founder/customer operate, NOT the generated landing pages. This
directory is the shared visual foundation every redesign spec (auth / dashboard /
editor-shell) consumes: one token layer + one primitive set, so no consuming spec ever
invents its own button/input. Built by the `ui-foundation` feature (see
`docs/task/ui-foundation.{spec,plan,audit}.md`).

## The #1 constraint: isolation from generated pages

Generated landing pages (`src/modules/templates/**`, both renderers, `/p/*`,
`/preview/*`, the editor canvas) MUST render byte-identical with or without this
foundation. Everything here is scoped so it cannot leak into that surface. **If you are
writing a consuming spec, the rules below are load-bearing — a violation silently shifts
customers' published pages.**

### `app-*` token layer + naming convention

All foundation tokens live under **namespaced `app-*` keys** in `tailwind.config.js`
`theme.extend` — additions only, no existing Tailwind key is ever edited:

- `colors.app.*` — `primary`/`primary-hover`/`primary-deep`, `tint`, `cta`/`cta-soft`,
  `ink`, `muted`/`faint`/`placeholder`/`label`/`slate`/`body`, `success`/`success-bg`,
  `danger`/`danger-bg`, `canvas`/`surface`, `border`/`border-input`/`border-strong`,
  `divider`/`hairline`. Use as `bg-app-primary`, `text-app-muted`, etc.
  **+ editor-shell-redesign additions** (one key per unmapped handoff hex — never snap
  to a near-neighbour, snapping silently changes the designer's palette):
  `frame #ececee` · `border-frame #e9e9ee` · `border-hairline #e6e6ec` · `surface-alt #f6f7fb` ·
  `surface-sunken #fafafb` · `track #f1f1f5` · `hover #f6f6f9` · `tint-soft #f5f9ff` ·
  `tint-ring #e6eefc` · `tint-edge #e0ecff` · `score-bg #f0f4ff` ·
  `score-border #dbe6ff` · `review-bg #fff2ec` · `review-border #ffd9c7` ·
  `review-text #d9531f` · `nudge-bg #fff8f5` · `nudge-border #ffe1d3` ·
  `nudge-text #8a5a44` · `border-soft #cdcdd4` · `border-mute #c7c7cf` ·
  `border-pane #eceef2` · `preview-title #1a3fb8` · `preview-url #5f7d5f` ·
  `preview-snippet #5a5a66` · `dim #8a8a94` · `icon-muted #6b6b76` ·
  `icon-faint #9a9aa4` · `thumb-bg #f7f8fb` · `thumb-bar #c4d3f2` ·
  `thumb-bar-soft #e0e3ec` · `delete #d23b3b` · `delete-bg #f7e6e6` · `marker #cdd0d8`.
- `borderRadius['app-*']` — `app-ctl 10px`, `app-input 12px`, `app-panel 14px`,
  `app-card 16px`, `app-modal 20px`, `app-pill 20px`, `app-badge 6px`,
  `app-ctl-sm 9px` (t1 bar controls), `app-row 11px` (t14 template row, t18 ⋯ menu).
- `boxShadow['app-*']` — `app-card`, `app-modal`, `app-float`, `app-btn-primary`,
  `app-btn-cta`, `app-menu` (t1 menu popovers), `app-popover` (t14/t17/t18 panels),
  `app-window` (t16 settings window), `app-btn-publish` (t1 Publish split-button).
- `animation['app-spin']` — `.8s linear` ring rotation (t17). Stock `animate-spin` is
  1s — not a substitute.
- `fontFamily['app-sans'|'app-mono'|'app-hand']` — `font-app-sans` (Onest),
  `font-app-mono` (**`'JetBrains Mono App'`** — see gotcha below), `font-app-hand` (Caveat).
- `backgroundImage['app-stripes']` — the striped image-placeholder fill.

**Rule for consuming specs:** style app chrome with `app-*` utilities ONLY. Never add or
mutate a stock Tailwind key (palette, `borderRadius.lg/md/sm`, `fontSize`, `fontFamily.heading/body`)
to serve app chrome — those feed template rendering on the main-app surface and a mutation
creates an editor↔published divergence.

### `.app-chrome` scope class (`src/styles/app-chrome.css`)

Provides inherited base defaults (Onest, `#191922` ink, `#f7f8fa` canvas bg, antialiasing)
+ the `.app-icon` Material Symbols classes. The foundation **DEFINES** it but attaches it to
**NO screen**. Consuming specs attach it to their own shell wrappers (auth page shell,
dashboard shell, editor shell).

**Attach rules (hard):**
- Attach ONLY to an app-shell wrapper you own.
- **NEVER** attach to root `<body>`, `/p/*`, `/preview/*`, `src/app/p/layout.tsx`, or any
  wrapper that contains the **editor canvas** (the rendered landing preview). It would
  restyle template output.
- Primitives here do NOT depend on an `.app-chrome` ancestor — each carries explicit
  `font-app-sans`/`font-app-mono` + direct `app-*` utilities, so Radix portals (dialog /
  select / toast render into `document.body`, outside any scope) still style correctly.

### Forbidden files (no consuming spec touches, for the same reason)

`src/app/globals.css`, `src/app/p/layout.tsx`, `src/styles/fonts-self-hosted.css`,
`src/lib/staticExport/htmlGenerator.ts`, `scripts/buildPublishedCSS.js`,
`scripts/buildAssets.js`, `src/modules/templates/**`, `src/modules/generatedLanding/**`
(renderers/registries), `src/components/published/**`,
`src/modules/Design/designTokens.ts`, `CriticalFontPreload.tsx`.

Nothing under `src/modules/templates/**`, `src/modules/generatedLanding/**`, or
`src/components/published/**` may import `@/components/ui/icon` (AppIcon), `app-chrome.css`,
`fonts-app-chrome.css`, or any primitive in this dir. Templates/published keep their own
icon system (lucide + `IconPublished`).

## Fonts (self-hosted, app-only)

Four families under `public/fonts/`, declared in `src/styles/fonts-app-chrome.css`,
imported ONLY by `src/app/layout.tsx` (never `p/layout.tsx`) → zero bytes reach published
pages: **Onest** 400–800, **Caveat** 400/700, **Material Symbols Rounded** (subset), and the
app mono (see gotcha).

### app mono is a DISTINCT family — `'JetBrains Mono App'` (gotcha)

`font-app-mono` resolves to `'JetBrains Mono App'`, NOT bare `'JetBrains Mono'`. This is
deliberate: several templates render `var(--font-mono)` = `'JetBrains Mono'` @600. If the
app declared a real 600 face under the SAME family name, the editor surface (root layout
covers `/edit`,`/preview`) would show real 600 while published pages (which ship only JBM
400/500) synthesize faux-bold → a new editor↔published divergence. The distinct app-only
family keeps templates' `'JetBrains Mono'` 400/500-only on both surfaces. **Reference the
`font-app-mono` token, never the raw family name.**

### AppIcon (`icon.tsx`) + Material Symbols subset

`<AppIcon name="push_pin" filled size={20} />` renders a Material Symbols Rounded glyph by
ligature name; `filled` flips the `FILL` variation axis (0→1). App-chrome only.

The icon font is a **subset** — only the glyphs the handoff uses. The subset input is the
committed `public/fonts/material-symbols-rounded/icons.txt` (one ligature name per line).
**To add an icon: add its name to `icons.txt`, then regenerate the subset per
`public/fonts/material-symbols-rounded/NOTICE`.** NEVER silently regenerate from the full
font (drops the curated list, bloats LCP, may pin axes and break `FILL`). Keep all four
`FILL,GRAD,opsz,wght` axes; never `--instance`/pin.

## Primitive inventory

**Reskinned in place (9 — existing APIs/props/variant keys unchanged, ~0 call-site churn):**

| File | Usage |
|---|---|
| `button.tsx` | `default` (primary blue), added `cta` (coral), `secondary`/`ghost`/`outline`/`destructive`/`link` + sizes. |
| `input.tsx` | Text field: `app-input` radius, `app-border-input`, primary focus border. |
| `textarea.tsx` | Multiline field, matches input. |
| `select.tsx` | Radix select; trigger mirrors input, popover = white surface + `app-float`. |
| `checkbox.tsx` | Checked = `app-primary`. |
| `switch.tsx` | On-track = `app-primary`. |
| `card.tsx` | `app-card` radius + `app-card` shadow surface (Card/Title/Description). |
| `badge.tsx` | Existing `default/secondary/destructive/outline` + added `status`/`mono`/`postBeta`/`magic`/`success`/`danger`/`saved`. Default radius is `app-badge` (6px), NOT a full pill — use `status`/pill variants for chips. |
| `dialog.tsx` | Modal shell: `app-modal` radius + shadow; Radix parts unchanged. |

**Net-new primitives (5) + AppIcon:**

| File | Usage |
|---|---|
| `icon.tsx` (`AppIcon`) | Material Symbols glyph by name, FILL axis. |
| `nav-item.tsx` | Sidebar/nav row; active = `#003E80` on `#e6f0ff`; `asChild`/`href` polymorphic. `activeBar` (opt-in, off by default) adds the `inset 2px 0 0 #006CFF` left bar for the t1 rail / t16 nav. |
| `segmented-control.tsx` | Controlled pill group (`value`/`onValueChange`), radiogroup + arrow-key roving. |
| `tabs.tsx` | Headless `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`, shadcn-compatible API (drop-in for a future `@radix-ui/react-tabs`). |
| `toast.tsx` | `ToastProvider` + `useToast()` → `toast(msg,{variant,duration})`; bottom-stacked portal, success/error/info. Distinct from the edit-page-local `ToastProvider` (do not import that one). |
| `image-placeholder.tsx` | `bg-app-stripes` "image goes here" box; `aspect`/`rounded` props. |

Tabs / segmented-control / toast are **headless, in-house — no new npm deps** (`@radix-ui/react-tabs`/`react-toast` are not installed).

**Added by editor-shell-redesign phase 1 (3):**

| File | Usage |
|---|---|
| `popover.tsx` | **Two layers.** Stock `Popover`/`PopoverTrigger`/`PopoverContent`/`PopoverAnchor` = untouched shadcn (live consumers: `LinkPicker`, the 3 theme popovers). App-chrome = `AppPopoverMenu` (menu list) / `AppPopoverPanel` (panel) + `AppPopoverItem`/`AppPopoverLabel`/`AppPopoverSeparator`. |
| `tooltip.tsx` | **Two layers.** Stock `Tooltip` (= Radix Root) / `TooltipTrigger` / `TooltipContent` / `TooltipProvider` = untouched (consumers: `preview/[token]/page.tsx`, `modules/Design/ColorSystem/VariableModeIndicators.tsx`). App-chrome = `AppTooltip` (self-providing wrapper) + `AppTooltipContent`. |
| `spinner.tsx` | `<Spinner size={40} thickness={3} />` ring spinner (t17 state B); `animate-app-spin`, reduced-motion aware. |

> **Why two layers, not a reskin:** the stock popover/tooltip predate ui-foundation and
> have live call sites outside the editor shell. Restyling them in place would silently
> change `LinkPicker` (out of scope) and push app-chrome styling into a
> `modules/Design` component (forbidden — see Isolation above). `Tooltip` is also the
> Radix *Root* export, so redefining it as a wrapper would break existing call sites.
> **Consume the `App*` parts for app chrome; leave the stock parts alone.**

### The app-chrome popover — ONE primitive, two surfaces

The single popover for ALL app chrome: t1 app menu, t1 Settings menu, t14 Design menu,
t18 ⋯ menu, t17 confirm, the 3 theme popovers. **Do not improvise a second one.**

```tsx
<Popover>
  <PopoverTrigger asChild><button>Settings</button></PopoverTrigger>

  {/* surface 1 — menu LIST (radius 12, shadow app-menu, pad 6) */}
  <AppPopoverMenu width={224} align="start">
    <AppPopoverLabel>Site settings</AppPopoverLabel>
    <AppPopoverItem icon={<AppIcon name="public" size={18} />} onClick={openDomain}>
      Domain
    </AppPopoverItem>
    <AppPopoverItem active trailing={<span className="font-app-mono text-[11px]">2</span>}>
      Languages
    </AppPopoverItem>
    <AppPopoverSeparator />
    <AppPopoverItem destructive>Delete</AppPopoverItem>
  </AppPopoverMenu>

  {/* surface 2 — PANEL (radius 14, deeper shadow, UNPADDED: bring your own
      header/body/footer rhythm) for t14 / t17 / t18 */}
  <AppPopoverPanel width={288}>…</AppPopoverPanel>
</Popover>
```

`width` is a **number of px** (handoff: 216 app menu · 224 Settings · 194 t18 ⋯ ·
288 t14 · 314/300/322 t17 · 344 t18 panel). `AppPopoverItem` is a styled slot — behavior
arrives via `onClick`; `active`/`destructive`/`icon`/`trailing` cover every handoff row.

### `coming` — THE shared "not yet wired" (greyed) treatment

Named **`coming`** (utility `.app-coming` in `src/styles/app-chrome.css`). Editor-shell
and dashboard S1 both use this name — **one greyed style across all tracks**. Spec intent
("not-yet-wired shell controls render greyed, never omitted") supplies the treatment; the
handoff specifies no disabled control.

`opacity:.5` + `#8a8a94` text/icon + `cursor:not-allowed` + no hover/focus/active
response. The class does **not** carry the aria or the tooltip — apply the full recipe:

```tsx
<AppTooltip label="Coming soon — page CMS">
  <button type="button" className="app-coming" aria-disabled="true" tabIndex={-1}
          onClick={(e) => e.preventDefault()}>
    <AppIcon name="database" size={18} /> CMS
  </button>
</AppTooltip>
```

- **`aria-disabled`, NOT `disabled`** — a `disabled` button swallows the pointer events
  the tooltip needs, so the "why" affordance would never appear.
- Tooltip copy convention: **"Coming soon — <what>"**.
- **Never grey something that works today.** (Editor-shell decision 10: `Social & sharing`
  is wired — greying it is forbidden.)

### `.app-divider`

1×22 vertical hairline, `flex:none`, self-centering — the t1 top bar uses it
×3. `.app-divider--full` stretches to the parent's height instead. Plain `<div className="app-divider" />`.
Its colour comes from `theme('colors.app.border-hairline')`, not a hard-coded literal.

### Three border hexes that look alike and are NOT interchangeable

Editor-shell decision 16. Snapping any of these to another silently changes the designer's palette:

| Token | Hex | Owns |
|---|---|---|
| `app-border-hairline` | `#e6e6ec` | popover **menu/panel** borders, `.app-divider`, t1 page-switcher pill |
| `app-border-frame` | `#e9e9ee` | t1 **top-bar** bottom border, left-rail right border |
| `app-border` | `#ececf1` | general app-chrome borders (ui-foundation default) |
| `app-border-input` | `#e2e4ea` | form field borders |

The first two matter most: phase 4 places a bar border directly against a menu border, so
they must read as deliberately different, not as a drift bug.

## Isolation guards — must stay green (do not defeat)

Three automated guards prove generated pages are untouched. Every change under this dir /
`tailwind.config.js` must keep them green:

1. **`public/published.css` sha256** vs `src/modules/generatedLanding/__fixtures__/published-css.sha256`
   — byte-identical published surface. The hash is only valid against a FRESH artifact
   (`npm run build` / `npm run build:published-css`), never a stale file.
2. **Config-freeze** (`src/modules/generatedLanding/tailwindConfigFreeze.test.ts`) — root
   `tailwind.config.js` existing `borderRadius`/`fontSize`/`fontFamily` keys frozen (catches a
   root-key mutation the published-css hash cannot see, since published CSS uses a standalone
   config). Additive `app-*` keys are tolerated.
3. **Computed-style e2e** (`e2e/ui-isolation.spec.ts`) — `/dev/meridian/blocks` template
   radius/font-size/font-family unchanged vs `e2e/fixtures/ui-isolation-computed-styles.json`.

**The e2e fixture (`ui-isolation-computed-styles.json`) is a checked-in INPUT baseline** — the
spec self-captures it only when absent. NEVER delete or silently regenerate it; a re-capture
would vacuously "pass" against whatever the current (possibly regressed) output is. A
deliberate template-style change must update the fixture WITH a documented reason.
