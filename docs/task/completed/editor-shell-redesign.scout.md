# editor-shell-redesign — consolidated scout findings

Source: 4 scouts, 2026-07-16. Feeds the planner. Orchestrator rulings marked **[RULING]**.

---

## A. Published-parity — PROVEN (de-risks the mandatory gate)

Import-graph evidence, verified:
- `LandingPagePublishedRenderer.tsx` imports only react / next/script / `componentRegistry.published` /
  `@/utils/*` / `@/types/*` / `@/modules/templates/registry` / `@/modules/skeletons/styleTokens`.
  **Zero `@/app/edit/**` imports.**
- Grep across ALL `*.published.tsx`: no import from `app/edit/**`. Zero matches.
- Grep across `src/lib/staticExport/`: no `app/edit|components/layout|components/ui` matches.
- Every chrome file is `"use client"` (L2) — boundary enforced by convention AND empty import graph.

**Conclusion: an edit-chrome reskin cannot reach published output.** The parity gate should still be
run by the founder (it's the spec's mandatory gate), but the structural risk is near-zero.

**HARD RULE:** `.app-chrome` must NEVER wrap the editor canvas — outer shell / rail / top bar only.
Violating this shifts template output (known past incident: app-chrome font-family bleed).

---

## B. THE BIG ONE — spec's t17 file pointers are WRONG

**There is no publish UI in the editor header.** `GlobalAppHeader` / `EditHeader` /
`EditHeaderRightPanel` contain ZERO publish code. The whole publish flow lives in
`src/app/preview/[token]/page.tsx`. The editor's only link is `PreviewButton`
(`components/ui/PreviewButton.tsx`, mounted `EditHeaderRightPanel.tsx:146`) → navigates to `/preview/[token]`.

- Publish UI state = **local `useState` in the preview page** (`page.tsx:109-121`):
  `publishing`, `publishSuccess`, `publishedUrl`, `publishError`, `showSlugModal`, `showDomainModal`,
  `customSlug`, `publishTitle`, `existingPublished`.
- API call site: single `fetch('/api/publish')` at **`page.tsx:362`**. Status read: `fetch('/api/projects/${tokenId}/published-slug')` at `page.tsx:145`.
- `SlugModal` (`src/components/SlugModal.tsx`) is **preview-only**, rendered `page.tsx:537-543` — it IS
  the publish confirm step, not an editor modal. Domain entry = `showDomainModal` local state.

**[RULING] t17 target = the preview page's publish MARKUP.** Spec intent is unambiguous ("reskin the
confirm → publishing → live UI"); only the file pointer is wrong. Reskin JSX only.
**NO-TOUCH REGIONS:** the `handlePublish` body (~`page.tsx:362`), slug normalization (~`page.tsx:300`),
`src/app/api/publish/route.ts`, `src/lib/staticExport/*`, `src/lib/routing/kvRoutes.ts`.
Risk: publish state + fetch are interleaved in ONE component — treat `handlePublish` as a no-touch
region, do NOT assume file-level separation.

---

## C. Chrome seam — per-file reskin verdict

Risk order (safe → risky): `EditHeader` → `LeftPanel` frame → `EditLayout` shell → `GlobalAppHeader`
→ `EditHeaderRightPanel` → `PageSwitcher`.

| File | Reskin verdict |
|---|---|
| `layout/EditHeader.tsx` (81L) | **Safest.** Pure 3-zone layout shell. Reskin L54-78 freely. Leave popover-dispatch L24-52 alone. |
| `layout/LeftPanel.tsx` (235L) | Frame = outer div **L176-180** (collapsed variant L155-174) + wrapper in `EditLayout.tsx:143-160`. Reskin frame/header (L183-196) + resize-handle visuals (L226-232). Section-list `<button>` map (L206-218) + `GettingStartedChecklist` (L26-100): className-only edits, leave handlers. |
| `layout/EditLayout.tsx` (232L) | ⚠️ Most entangled. Shell JSX = **L129-199 ONLY**. DO NOT touch L64-127 (resize listener, keyboard shortcuts, autosave, modal reset) or L202-231 (ThemeInjector/backgroundSystem). |
| `layout/GlobalAppHeader.tsx` (176L) | Mostly presentational. ⚠️ **L157 landmine**: `useEditStore.getState().toggleLeftPanel?.()` — chrome MUTATES store, via the hook object not `useEditStoreApi()`. Inconsistent but **DO NOT "fix" during reskin** (that's a behavior change) — and do not lose it. |
| `layout/EditHeaderRightPanel.tsx` (167L) | ⚠️ Chrome+behavior fused. Regen orchestration (`regenerateAllContent` L111), toast-on-completion effect (L95-106), locale regen-lock (L86-87). Button markup L121-142, `RegenCopyConfirmModal` L15-66, toast L155-163 all inline. Reskinnable but high blast radius. |
| `layout/PageSwitcher.tsx` (237L) | ⚠️ **Highest entanglement.** Tab markup inlined INSIDE the gating map (L152-233). Mutations L125,136,142,158,208,218. `BlogButton` self-fetches `published-slug` (L26-37). Reskin requires editing logic-adjacent JSX — give it its own phase. |

**Store coupling:** all six are selector-first / via `EditProvider useStoreState`. **No bare whole-store
subscription anywhere.** ESLint ban (`CallExpression[callee.name='useEditStore'][arguments.length=0]`)
holds; zero violations in `src/app/edit`.

**⚠️ Stale-closure pattern — PRESERVE AS-IS:** `LeftPanel.tsx:112-114` and `EditLayout.tsx:35-40` grab
actions via `store?.getState()` **during render**. Harmless today (actions stable), but reordering or
extracting these lines can make actions undefined.

**Spec correction:** LeftPanel does NOT own add-section (spec assumed it did). It is read-only
navigation: resize drag (L126-146), collapse (L159/L188), scroll-to-section (L148-151), checklist tabs
(L33-48). Add-section lives in `components/ui/AddSectionButton.tsx` / `EnhancedAddSection.tsx`.

---

## D. Load-bearing behavior hiding inside "pills" — DO NOT DELETE

- **`ui/SaveStateChip.tsx`** — derives `saved|saving|error` from `persistence.{isDirty,isSaving,saveError}`
  (L47-55) AND **registers a `beforeunload` dirty-guard (L58-78)** incl. a
  `[contenteditable="true"][data-editing="true"]` mid-edit check. Styling is inline via `STATUS_VIEW`
  (L100-128). **Deleting the guard during a reskin silently loses unsaved-work protection — no type
  error, no test failure.** → PLAYWRIGHT SPEC REQUIRED in the phase that touches this file.
- **`ui/ReviewPill.tsx`** — not pure. `useReviewState()` + `useStoreState(s => s.leftPanel)`; self-hides on
  `allComplete` (L12); click drives `setLeftPanelTab`/`toggleLeftPanel`. Inline `React.CSSProperties`
  L39-62. Note `EditHeader.tsx:70` ALSO guards `!allComplete` — double gating, preserve both.
- **`components/editor/` LanguageToggle / LocaleSettings** — mounted `EditHeader.tsx:64-65`; toggle
  self-hides until a 2nd locale is declared.

---

## E. Design menu (t14) + SEO modals (t16/t18)

**Theme popovers** — all in `components/ui/`: `ThemePopover.tsx` (L52), `ServiceThemePopover.tsx` (L39),
`VestriaThemePopover.tsx` (L57). Dispatched by `EditHeader.tsx:43-52`: service→Service;
product+template-module→Vestria; other template-module (writer/granth)→none; legacy product→ThemePopover.
- Service + Vestria are **near-twins** (both import `TemplateSwapList`, same section shape) → a shared
  styled shell is feasible for those two. `ThemePopover` is the odd one out (legacy product color
  system, no `TemplateSwapList`) — **not worth folding in**.
- Safe to reskin IF `TemplateSwapList` and the swap-commit handler (`ServiceThemePopover.tsx:127`) are
  untouched — template swap preloads via the registry dynamic loader = **dispatch-firewall-sensitive**.

**`ui/SeoSettingsModal.tsx`** — **per-page override model ALREADY EXISTS** (not flat): page tabs +
per-page `seo` blob via `store.updatePageSeo`. Fields: SEO title (meter 60/70), meta description
(160/200), OG image + favicon upload, noindex, tracking pixels (`META_PIXEL_ID_RE`, `GA4_MEASUREMENT_ID_RE`)
behind a **Pro gate** fetched from `/api/billing/plan` (L66-80, fail-closed). Previews render from the
real `buildPageMetadata` (single source of truth). → t16/t18 are a RESKIN, not a rebuild.
- ⚠️ **`SeoSettingsModal.tsx:36-38`** selector comments warn: calling `getPagesList()` inside a selector
  causes "Maximum update depth exceeded". **PRESERVE the `useMemo`-outside-selector shape.**

**⚠️ TWO PARALLEL MODAL SYSTEMS.** SEO/Products/Social modals use a bespoke **module-level singleton**
in `ui/GlobalModals.tsx` (imperative `showSeoModal`/`hideSeoModal`/… L24-53 mutating a module
`modalState` + a `useState` subscriber L58), NOT `useModalManager`. Callers are plain buttons
(`GlobalAppHeader.tsx:56,69`). `ProductsModal` adds a 2nd module-scoped side channel
`setPanelCollectionKey` (`PageSwitcher.tsx:102-105`).
**[RULING] Do NOT unify the two modal systems — that is a behavior change, not presentation.** Live with
the singleton.

---

## F. Collisions — verified CLEAR

Orchestrator ran the git check the scout could not:
- **Zero live branches** touch `layout/`, `components/ui/`, or `preview/[token]`.
- **`feature/selection-highlight-labels` does not exist** — it is only a plan doc. So the scout's flagged
  contention on `ToolbarShell.tsx` / `MainContent.tsx` / `EditablePageRenderer.tsx` is **future intent,
  not in-flight work**. We are not sequencing behind anything.
- `docs/tracks/workEndtoEnd.md` (Lane 2): zero editor-chrome matches → no direct overlap. Coupling is
  indirect: Design ▾ is skeleton-gated → build its SLOT, not its behavior.

**[RULING] Top bar is OURS.** `toolbarPlan.md` lists "Global chrome (top bar)" with ownership as an open
question; `uiRedesignPlan.md` assigns t1 to this track; the orchestrator mailbox settles it:
**editor and dashboard each build their own top bar, matched via foundation tokens — do NOT extract a
shared `AppTopBar`.** `GlobalAppHeader` is verified edit-only (zero imports outside `edit/`) → reskin in
place. This closes toolbarPlan's open question by reference; do not re-litigate.

**Factor as SLOTS (do not wire behavior):** toolbar-shell action region, Design ▾ trigger,
Ask-Lessgo-AI button, menu/logo/link toolbars, add-page page-set.
**Split ownership:** add-page modal (t11) — modal restyle = ours; page-set logic = Lane 2.

---

## G. ui-foundation inventory + GAPS

Tokens (additive, `tailwind.config.js`): `colors.app.*`, `borderRadius['app-ctl|input|panel|card|modal|pill|badge']`,
`boxShadow['app-card|modal|float|btn-primary|btn-cta']`, `fontFamily['app-sans'|'app-mono'|'app-hand']`,
`backgroundImage['app-stripes']`. Scope class `.app-chrome` (`src/styles/app-chrome.css`) — **defined but
attached nowhere yet.**

Reskinned (9): button · input · textarea · select · checkbox · switch · card · badge · dialog.
Net-new (6): `icon.tsx` (AppIcon/Material Symbols) · `nav-item.tsx` · `segmented-control.tsx` · `tabs.tsx`
· `toast.tsx` · `image-placeholder.tsx`.

Directly usable: `nav-item` (**active `#003E80` on `#e6f0ff` matches t1 rail + t16 nav EXACTLY**),
`segmented-control` (Edit/Preview, device switcher, t14 STYLE, rail tabs), `tabs` (t18), `dialog` (t16
window, t18 panel), `badge` (score/review/Saved chips — use `status` variant; default badge radius is 6px
NOT a pill), `button` (`default` blue = Publish; `outline` = Cancel/Share), `input`/`textarea`, `switch`
(indexing toggle — `app-primary` on-track matches), `image-placeholder` (t16 social image), `icon`.

### GAPS the planner MUST handle
1. **NO popover/dropdown/menu primitive — the biggest hole.** Needed by: t1 app menu, t1 Settings menu,
   t14 Design menu, t18 ⋯ menu, t17 confirm popover, all 3 theme popovers. → **Build this FIRST, once.**
   Option: reuse `select.tsx`'s Radix popover shell internals.
2. **No disabled-state token/variant** documented. S1 dashboard also ships "destructive greyed" →
   **coordinate or two tracks invent conflicting styles.**
3. **No tooltip** primitive (needed for greyed "why disabled" affordance).
4. No split-button primitive (Publish has integrated `expand_more`; handoff never says what the dropdown
   contains → **ambiguity, grey it out**).
5. No spinner primitive (t17 state B uses `@keyframes lg-spin` from the prototype runtime).
6. `nav-item` lacks the rail's `inset 2px 0 0 #006CFF` active bar → confirm whether to extend it.
7. No separator/skeleton primitives.

### Unmapped hexes — no `app-*` equivalent exists
`#ececee` (t1 frame bg), `#e9e9ee`, `#f1f1f5`, `#f6f7fb`, `#fafafb`, `#f5f9ff`, `#e6eefc`,
`#dbe6ff`/`#f0f4ff` (score pill), `#fff2ec`/`#ffd9c7`/`#fff8f5`/`#ffe1d3` + `#8a5a44`/`#d9531f`
(review pill + soft-nudge coral family), `#1a3fb8`/`#5f7d5f` (Google preview), `#cdcdd4`/`#c7c7cf`.
→ Planner: add `app-*` keys (additive is permitted) or snap to nearest. The coral soft-nudge family and
the score/review pill families are the most conspicuous absences.

**The `.dc.html` uses raw inline hex + literal font names — ZERO CSS variables. Every value is hand-mapped.**
Mapping table: `#006CFF`→`app-primary`, `#0056d6`→`primary-hover`, `#003E80`→`primary-deep`,
`#e6f0ff`→`tint`; `#FF6B3D`→`app-cta`, `#FF814A`→`cta-soft`; `#191922`→`app-ink`, `#7b7b86`→`muted`,
`#a6a6b0`/`#b0b0ba`→`faint`/`placeholder`, `#3a3a44`/`#5b5b66`→`body`/`slate`/`label`;
`#16a34a`+`#e6f5ec`→`app-success`/`success-bg`; `#d1483a`+`#fef2f2`→`app-danger`/`danger-bg`;
`#f7f8fa`→`app-canvas`, `#fff`→`app-surface`; `#ececf1`→`app-border`, `#e2e4ea`/`#e6e6ec`→`border-input`,
`#d7d7dd`→`border-strong`, `#eef0f3`/`#f0f0f3`/`#f4f4f7`→`divider`/`hairline`;
radius 9-12→`app-ctl`(10)/`app-input`(12), 14→`app-panel`, 16→`app-card`, 18-20→`app-modal`, 20 pill→`app-pill`, 5-6→`app-badge`;
`'Onest'`→`font-app-sans`, `'JetBrains Mono'`→**`font-app-mono`** (resolves to `'JetBrains Mono App'` —
NEVER the raw name), Material Symbols→`AppIcon`; `repeating-linear-gradient(135deg,…)`→`bg-app-stripes`.

**Icon check REQUIRED before build:** every icon below must exist in
`public/fonts/material-symbols-rounded/icons.txt` — **add-then-regenerate per NOTICE, NEVER regenerate
from the full font**:
`expand_more, arrow_back, grid_view, drive_file_rename_outline, content_copy, help, description, palette,
tune, desktop_windows, tablet_mac, smartphone, insights, flag, undo, redo, rocket_launch, public,
travel_explore, share, language, add, drag_indicator, web_asset, bolt, verified, auto_awesome, timeline,
format_quote, photo_library, close, history, lock, open_in_new, more_horiz, settings, delete, check,
swap_horiz, visibility, celebration, arrow_forward`

---

## H. Handoff design specs (t1/t14/t16/t17/t18)

Handoff = **desktop-only, fixed 1360×864**; responsive explicitly unspecified. Spec says desktop-first → OK.

### t1 — shell / top bar (`.dc.html` L2210, option "1a Command Bar")
Frame 1360×864, bg `#ececee`, border `#d7d7dd`, radius 14.
**Top bar**: height 56, `flex:none`, bg `#fff`, bottom border `#e9e9ee`, pad `0 14px`, gap 12, `z-index:20`.
L→R: **logo button** (= app menu; `assets/lessgo-logo.png` h22 + `expand_more` 18px `#9a9aa4`, transparent,
radius 9, hover `#f4f4f7`) · divider 1×22 `#e9e9ee` (×3 in right cluster) · **page switcher** (bordered
`#e6e6ec` pill radius 9; `description` icon `#006CFF` + name 600/13 Onest + route chip (`/`) mono 11 on
`#f1f1f5` radius 4 + `expand_more`; hover `#f6f6f9`) · **menu toolbar** (`Design` palette-icon ghost;
`Settings` tune + `expand_more`, active bg `#f1f1f5`; both pad `7px 10px` radius 8, label 500/13) ·
**center** device segmented `desktop_windows|tablet_mac|smartphone` 19px, active `#3a3a44` on `#f1f1f5`
radius 6 · **right cluster** gap 8: score pill (`insights` + `7.4`; bg `#f0f4ff`, border `#dbe6ff`, text
`#003E80`, radius 8) → review pill (`flag` + `3`; bg `#fff2ec`, border `#ffd9c7`, text `#d9531f`) →
**Saved status** (7px green `#16a34a` dot + 500/12 `#8a8a94`) → undo/redo (19px; disabled redo `#c7c7cf`) →
**Edit/Preview segmented** (track `#f1f1f5` radius 9 pad 3; active `#fff` + `0 1px 2px rgba(0,0,0,.08)`
radius 7) → **Publish split-button** (bg `#006CFF`, radius 9, `rocket_launch` FILL 1, label 600/13 white,
`rgba(255,255,255,.3)` 1×16 hairline, `expand_more`; shadow `0 2px 8px -1px rgba(58,91,255,.5)`; hover `#0056d6`).

**App-menu popover** (top 52, left 12, w 216, radius 12, border `#e6e6ec`, shadow
`0 18px 40px -12px rgba(20,20,40,.28)`, pad 6): `Back to dashboard` (active: bg `#f5f9ff`, `arrow_back`
`#006CFF`, text `#003E80` 600) · `My sites` — divider `#f0f0f3` — `Rename site` · `Duplicate` — divider —
`Help & support`. Inactive rows 500/13 `#3a3a44`, icon `#6b6b76`, hover `#f4f4f7`.

**Settings popover** (left 322, w 224, same shell): eyebrow `SITE SETTINGS` (700/10.5, `letter-spacing:.09em`,
`#a6a6b0`) → `Domain` · `SEO` · `Social & sharing` · `Languages` (right-aligned mono count `2` = **the
language indicator; t1 shows NO separate language toggle control**).

**Left rail**: w 266, bg `#fff`, right border `#e9e9ee`. Top: 4-tab segmented (`Sections | Pages | CMS |
Theme`) on `#f1f1f5` track radius 9 pad 3. Below: header `PAGE SECTIONS` (700/10.5 eyebrow) + `add` icon.
Section rows: pad `8px 9px`, radius 8, gap 9 — `drag_indicator` (`#cdcdd4`) + per-type icon + label +
`visibility` toggle; hover `#f6f6f9`; **active** = bg `#e6f0ff`, `box-shadow:inset 2px 0 0 #006CFF`, text
`#003E80` 600, icons `#006CFF` (bolt FILL 1).

### t14 — Design menu (L966)
Popover w 288, radius 14, border `#e6e6ec`, shadow `0 22px 50px -16px rgba(20,20,40,.30)`. Header:
`palette` `#006CFF` + "Design" 600/14 + `close`. Three eyebrow groups (700/10, `.09em`, `#a6a6b0`):
- **TEMPLATE** — one row (border `#e6e6ec`, radius 11): 40×30 mini thumb (bg `#f7f8fb`, faux bars
  `#c4d3f2`/`#e0e3ec`) + name 600/12.5 + subtitle 400/10.5 `#a6a6b0` + **"Browse all"** link `#006CFF` 600/11.5.
- **STYLE** (= variant) — segmented, 3 options; active `#fff` chip, text `#006CFF` 600/11.5, shadow
  `0 1px 2px rgba(0,0,0,.07)`; inactive `#8a8a94`.
- **ACCENT** — 6 swatches 26×26 radius 8; selected ring `box-shadow:0 0 0 2px #fff, 0 0 0 3.5px #006CFF`.
  Mock hexes `#006CFF,#003E80,#FF6B3D,#16a34a,#7c5cff,#0ea5a5` are **illustrative — real accents come from
  template palettes.**
- **Footer strip**: bg `#fafafb`, top border `#f0f0f3`, `lock` + "Curated set — no free color or background editing".
Notes: swap preserves structure/content ("never hears the word 'skeleton'"); "Browse all" opens a live
preview with the user's real content (same picker as the generation flow).

### t16 — Site settings + SEO (L618)
Modal 912×552, radius 16, border `#d7d7dd`, shadow `0 30px 70px -30px rgba(20,20,40,.35)`.
- **Header** 56, bottom border `#eceef2`: `tune` `#006CFF` + "Site settings" 700/15 + spacer + **Saved**
  dot-pill + `close`.
- **Left nav** w 196, bg `#fafafb`, right border `#eceef2`: eyebrow `SITE`, rows `Domain / SEO / Social &
  sharing / Languages` (+ mono count `2`). Active = bg `#e6f0ff` + `inset 2px 0 0 #006CFF` + `#003E80` 600;
  hover `#f0f0f3`.
- **SEO pane** (pad 22/26): "Search engine (SEO)" 700/16 + sub 400/12 `#8a8a94`. Two cols gap 26:
  - Main: *Homepage title* input; *Meta description* textarea + mono **`128 / 160` counter** (`#b0b0ba`);
    **Google preview card** (border `#eceef2`, radius 10 — favicon circle, name/URL `#5f7d5f`, title
    400/16 `#1a3fb8`, snippet `#5a5a66`); **indexing toggle** row ("Let search engines index this site" /
    "Turn off while you're still building") — on-track `#006CFF`, 38×22, knob 18.
  - Side col w 184: **Favicon** (40×40 radius 9 + "Replace") · **Default social image** (96px striped
    placeholder + `1200×630` mono chip + "Replace image") · **Sitemap** row (bg `#f6f7fb`, `open_in_new`).
- Field style: pad `9px 12px`, border `#e6e6ec`, radius 9. Labels 600/11.5 `#3a3a44`.

### t17 — Publish flow (L547) — 3 states, each a card (border `#e6e6ec`, radius 14, shadow `0 22px 50px -16px rgba(20,20,40,.3)`)
- **A · Confirm popover** (w 314, anchored under Publish): header "Publish changes" 600/14 + `close`.
  Body gap 10: **live-target row** (bg `#f6f7fb` radius 9 — `public` icon, `naayom.lessgo.site` 600/11.5 +
  "Live target" caption `#a6a6b0`, **"Change"** link `#006CFF`) · **"12 edits since last publish"**
  (`history`, 400/11.5 `#6b6b76`) · **soft Review nudge**: bg `#fff8f5`, border `#ffe1d3`, radius 9, `flag`
  `#FF6B3D`, text `#8a5a44` 500/11, **"Review"** link `#d9531f`. Footer (top border `#f0f0f3`): `Cancel`
  (white, border `#e6e6ec`) + `Publish now` (flex:1, `#006CFF`, 600/12.5) — **ALWAYS ENABLED**.
- **B · Publishing** (w 300, pad `34px 20px`, centered): 40px spinner ring `3px solid #e6eefc` +
  `border-top-color:#006CFF`, `animation:lg-spin .8s linear infinite`; "Publishing your changes…" 600/14;
  "Usually takes a few seconds" 400/11.5.
- **C · Live** (w 322): 48px `#e6f5ec` circle + `check` `#16a34a` FILL 1; "You're live!" 700/18
  (`letter-spacing:-.3px`); sub "Your changes are now public."; **URL row** (border, radius 10 — `lock`
  green, URL **mono 500/12**, `content_copy`); actions `Share` (outline) + `View site` (`#006CFF` +
  `open_in_new`); footer "Version saved · restore anytime" (400/10.5 `#a6a6b0`) + **domain upsell** row
  (bg `#f5f9ff`, border `#e0ecff`, `#003E80` 600/11.5, `arrow_forward`) → links to t16.
- **Interaction rule (quoted):** *"Soft nudge, not a gate. The Review count shows in confirm, but 'Publish
  now' always works — never block someone from shipping."*

### t18 — Per-page SEO (L447)
Entry: **Pages tab → page row → `more_horiz` (⋯) menu** (w 194, radius 11): `Rename` · `Duplicate` —
divider — **`Page settings`** (active bg `#e6f0ff`, `#003E80` 600) — divider — `Delete` (`#d23b3b`, hover
bg `#f7e6e6`). Page rows: hovered/selected bg `#f4f4f7`, name 600/13, ⋯ icon `#006CFF`.
Panel w 344, radius 14, same shadow. Header "Page settings · Products" (600/14 + 400/12 `#a6a6b0` suffix)
+ `close`. **Tabs** `General | SEO | Social` — segmented on `#f1f1f5`, active `#fff` + `#006CFF` 600/12.
SEO body gap 13: *Meta title* + *Meta description* (mono `96 / 160` counter). Field radius 8, pad `8px 11px`
(tighter than t16).
Note (quoted): *"Overrides, not duplicates. Each field falls back to the site SEO defaults — you only fill
in what should differ for this page."*

---

## I. GREY-OUT — the handoff does NOT specify a disabled control **[RULING REQUIRED → RULED]**

**Beta scope note (t2b, L27-37), quoted:** *"Scope for Beta. Per-element **Design ▾** (skeleton-gated) and
inline **Ask AI** are held back. Design still lives in the top-bar Design menu; AI stays in the corner chat
panel. This keeps every toolbar to the essentials for launch."*
Separately tagged POST-BETA: **t6 standard color picker** (L380), **t20 Ask Lessgo AI panel** (L1685).

**CRITICAL: the Beta scope note scopes TOOLBARS — which are OUT of scope for this feature. It does NOT
supply our grey-out list.** t1/t14/t16/t17/t18 are all fully in-scope.

The handoff shows held-back items as **REMOVED from the toolbar**, not disabled-but-visible. It provides:
- **POST-BETA pill** (L380/1685): `600 10px 'JetBrains Mono'`, pad `3px 8px`, bg `#f1e6d8`, text `#9a6a1f`,
  border `#ecdcc2`, radius 20, `letter-spacing:.04em` — used as a *section/screen* tag.
- **Held-back legend row** (L52): whole row `opacity:.5`, 9×9 `#cdd0d8` square marker, label 600/12
  `#8a8a94` + inline mono `POST-BETA` `#a6a6b0`, sub-caption "Removed from toolbars for launch." `#b0b0ba`.
- **NO disabled-control spec at all** — no `cursor:not-allowed`, no disabled hover, no tooltip.

**[RULING — orchestrator]** Spec intent ("not-yet-wired shell controls render greyed/disabled ('coming'),
never omitted") **overrides handoff silence**. Derive the treatment from the handoff's OWN held-back visual
language and define it **ONCE**, early, as a shared variant/token:
- `opacity:.5` + muted `#8a8a94` + `cursor:not-allowed` + `aria-disabled` + a tooltip naming what's coming.
- Planner: land this in the **same early phase as the popover primitive**, so later phases consume it
  rather than improvising a second style. **Coordinate the name with dashboard S1's "destructive greyed"**
  (gap G.2) to avoid two conflicting disabled styles across tracks.

**Grey-out candidates** (t1 controls with no behavior today — planner to confirm each against the code):
score pill (`insights 7.4` — no scoring system exists), rail tabs `Pages`/`CMS`/`Theme`, app-menu
`Rename site` / `Duplicate`, Publish split-button **dropdown** (handoff never says what it contains →
grey it), `Share` (t17 C), Sitemap row (t16), `Social & sharing`.
Explicitly NOT greyed (they work today): Design menu, SEO, Languages, Domain, undo/redo, device toggle,
Edit/Preview, Publish itself, Back to dashboard, page switcher.
