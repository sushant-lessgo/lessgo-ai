# editor-shell-redesign — implementation audit

WORKDIR: `C:\Users\susha\lessgo-ai\.claude\worktrees\editor-shell-redesign`
Branch: `feature/editor-shell-redesign` (verified before first edit)

---

## Phase 1 — Foundation: popover primitive, coming variant, tokens, icons

### Files changed

| File | Change |
|---|---|
| `src/components/ui/popover.tsx` | **Modified (not new)** — added app-chrome layer: `AppPopoverMenu`/`AppPopoverPanel`/`AppPopoverItem`/`AppPopoverLabel`/`AppPopoverSeparator`. Stock exports untouched. |
| `src/components/ui/tooltip.tsx` | **Modified (not new)** — added `AppTooltip` + `AppTooltipContent`. Stock exports untouched. |
| `src/components/ui/spinner.tsx` | **New** — `<Spinner>` ring spinner (t17 state B). |
| `src/components/ui/nav-item.tsx` | Added opt-in `activeBar` prop (gap G.6). |
| `src/styles/app-chrome.css` | Added `.app-coming` (the `coming` variant) + `.app-divider` / `.app-divider--full`. |
| `tailwind.config.js` | Additive only: 32 `colors.app.*` keys, 2 `borderRadius`, 4 `boxShadow`, 1 `animation` + 1 `keyframes`. |
| `src/components/ui/README.md` | Documented every new token, both popover surfaces, the `coming` recipe, `.app-divider`, `activeBar`, and the two-layer rationale. |
| `public/fonts/material-symbols-rounded/icons.txt` | **NOT modified — no change needed** (see Icons below). |
| `.claude/mailbox/dashboard-workspace-ia.md` | `coming` name posted for S1 (untracked, not committed). |

No file outside the plan's Phase-1 *Files touched* list was edited.

### Deviations from the plan

1. **`popover.tsx` and `tooltip.tsx` already existed — plan called them "(new)". Extended
   additively instead of reskinning in place.** This is the one significant judgement call.
   Both were stock shadcn with **live consumers**:
   - `popover.tsx` → `LinkTargetPopover.tsx` (an editor-toolbar popover, **out of scope for
     this entire track**) + the 3 theme popovers (phase 5).
   - `tooltip.tsx` → `preview/[token]/page.tsx` + `modules/Design/ColorSystem/VariableModeIndicators.tsx`.

   Reskinning in place would have (a) silently restyled `LinkTargetPopover` — an out-of-scope
   visual change, (b) pushed app-chrome styling into a `modules/Design` component, which the
   ui-foundation isolation rules forbid, and (c) **broken call sites**: `tooltip.tsx` exports
   `Tooltip` as the *Radix Root*, so redefining it as a convenience wrapper is a breaking API
   change for two existing consumers. Conservative option taken: stock parts frozen, `App*`
   parts added alongside, rationale written into both files + the README. **Net effect for
   downstream phases is unchanged** — there is still exactly ONE app-chrome popover.
   *Phase 5 note:* migrating the 3 theme popovers from `PopoverContent` → `AppPopoverPanel` is
   a deliberate per-file swap, not automatic.

2. **`coming` shipped as a CSS utility + documented recipe, NOT a `<Coming>` component.**
   The plan (step 4) scopes it to `.app-coming` in `app-chrome.css`; a `coming.tsx` component
   is not on the Files-touched list, so creating one would have been out of scope. The class
   alone cannot carry `aria-disabled` or the tooltip, so consumers apply a 3-part recipe
   (class + `aria-disabled` + `AppTooltip` wrapper), documented verbatim in the README, in
   `app-chrome.css`, and in the mailbox note. **Risk: the recipe is convention, not enforced —
   a phase could apply the class and forget the aria/tooltip.** If the orchestrator wants this
   enforced, adding `src/components/ui/coming.tsx` (a ~15-line wrapper) to a later phase's
   Files-touched list would close it. Flagging, not deciding.

3. **Token list is broader than the plan's step-7 enumeration** (32 keys vs ~17 listed).
   Reason: **no later phase has `tailwind.config.js` on its Files-touched list**, so phase 1 is
   the only chance to tokenize. I swept every hex in scout §G/§H lacking an existing `app-*`
   equivalent (added: `hover #f6f6f9`, `tint-edge #e0ecff`, `border-pane #eceef2`,
   `preview-snippet #5a5a66`, `dim #8a8a94`, `icon-muted #6b6b76`, `icon-faint #9a9aa4`,
   `thumb-*`, `delete`/`delete-bg`, `marker`, `border-frame #e9e9ee`). Under-adding would have
   forced phases 4–7 to hard-code raw hexes. Strictly additive; no existing key touched.

4. **Hexes the plan explicitly mapped were mapped, not given new keys** — per plan step 1 and
   the §G mapping table (the invariant "token mapping from scout §G"): `#e6e6ec`→`app-border`,
   `#f4f4f7`→`app-hairline`, `#f0f0f3`→`app-divider`. Decision 3's no-snap rule was applied to
   *unmapped* hexes only. `.app-divider` uses `#e6e6ec` per plan step 5 (scout §H says `#e9e9ee`
   for the t1 bar borders — plan wins as the ruled artifact; `app-border-frame` exists for §H's value).

5. **`.app-coming` uses `!important` on color** — needed to beat primitives' own
   `text-app-ink`/variant colors without every consumer re-ordering classes.

### Icons (step 8) — no toolchain gap, nothing to regenerate

**All 42 icons in the scout §G list are already present in `icons.txt`** (verified
programmatically, exact-line match). `icons.txt` is unchanged and the subset font was **not**
regenerated — correctly so: the NOTICE's rule is add-then-regenerate, and there was nothing to
add. **No blocker for downstream phases.** If a later phase needs an icon outside that list, it
must add the name to `icons.txt` and regenerate per the NOTICE (`pyftsubset`, `--no-layout-closure`,
never from the full font, never pin axes) — that toolchain was **not** exercised or validated here.

### Verification

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **1 error, PRE-EXISTING and unrelated** — `src/app/page.tsx(6,26): TS2307: Cannot find module '@/assets/images/founder.jpg'` (missing image type declaration; file exists on disk). **Proven pre-existing**: stashing all my changes reproduces the identical error. `src/app/page.tsx` is outside this phase's scope — not fixed. **Zero errors in any file I touched.** |
| `npm run test:run` | **GREEN** — 193 files passed / 1 skipped; 3331 tests passed / 18 skipped. Notably `tailwindConfigFreeze.test.ts` passes → token additions are correctly additive. |
| `npm run lint` | **GREEN** — zero errors; only pre-existing warnings (`no-img-element`, `exhaustive-deps`), none in my files. |

Not run: `npm run build` (plan asks for it this phase) and the dev-page visual smoke — the
orchestrator/founder should run `npm run build` before merge, since `tailwind.config.js` changed.
The published-CSS sha256 guard runs inside `test:run` and is green; the config-freeze test
covers the root-key risk that guard cannot see.

---

## How downstream phases CONSUME these primitives

### Popover — ONE primitive, two surfaces (phases 4/5/6/7/8)

Import from `@/components/ui/popover`. Trigger/Root come from the **stock** exports:

```tsx
import { Popover, PopoverTrigger, AppPopoverMenu, AppPopoverPanel,
         AppPopoverItem, AppPopoverLabel, AppPopoverSeparator } from "@/components/ui/popover"

<Popover>
  <PopoverTrigger asChild><button>Settings</button></PopoverTrigger>
  <AppPopoverMenu width={224} align="start">      {/* menu LIST surface */}
    <AppPopoverLabel>Site settings</AppPopoverLabel>
    <AppPopoverItem icon={<AppIcon name="public" size={18} />} onClick={showDomainModal}>Domain</AppPopoverItem>
    <AppPopoverItem active trailing={<span className="font-app-mono text-[11px]">2</span>}>Languages</AppPopoverItem>
    <AppPopoverSeparator />
    <AppPopoverItem destructive>Delete</AppPopoverItem>
  </AppPopoverMenu>
</Popover>
```

- **`width` is a NUMBER of px** (not a class): 216 app menu · 224 Settings · 194 t18 ⋯ ·
  288 t14 · 314/300/322 t17 · 344 t18 panel. Defaults: menu 216, panel 288.
- `AppPopoverMenu` = radius 12, `shadow-app-menu`, pad 6, `border-app-border`. Padded.
- `AppPopoverPanel` = radius 14, `shadow-app-popover`, **UNPADDED on purpose** (t14/t17/t18
  bring their own header/body/footer rhythm), `overflow-hidden`.
- `AppPopoverItem` props: `active` (tint-soft bg + primary-deep 600 + primary icon) ·
  `destructive` (t18 Delete) · `icon` (ReactNode slot — pass `<AppIcon>`) · `trailing`
  (right-aligned slot, e.g. the Languages mono count) · plus all `<button>` props.
  It is a **styled slot** — behavior arrives via `onClick`.
- `align`/`side`/`sideOffset` are Radix Content props, passed straight through.
- **Do NOT use the stock `PopoverContent` for new app chrome** — it is the frozen legacy surface.

### Tooltip

```tsx
import { AppTooltip } from "@/components/ui/tooltip"
<AppTooltip label="Undo" side="bottom"><button>…</button></AppTooltip>
```
Self-providing (no `TooltipProvider` needed; nesting under the root layout's provider is safe).
`asChild` trigger → **no extra DOM node**, so it won't disturb flex layouts in the t1 bar.
**Falsy `label` → renders the child bare**, so `label={cond ? "…" : undefined}` is safe.
Child must forward refs/props (a plain DOM element or a `forwardRef` component).

### Spinner (phase 7, t17 state B)

```tsx
import { Spinner } from "@/components/ui/spinner"
<Spinner size={40} />                        // t17 publishing card (handoff default)
<Spinner size={16} thickness={2} label="Publishing" />
```
`role="status"`; pass `label` when there's no adjacent text. Reduced-motion aware.

### `coming` variant (phases 3/4/6/7/8) — the shared grey-out

**Full recipe required** (class alone is not enough):

```tsx
<AppTooltip label="Coming soon — page CMS">
  <button type="button" className="app-coming" aria-disabled="true" tabIndex={-1}
          onClick={(e) => e.preventDefault()}>
    <AppIcon name="database" size={18} /> CMS
  </button>
</AppTooltip>
```

- **`aria-disabled`, NOT `disabled`** — `disabled` swallows the pointer events the tooltip
  needs, so the "why" affordance would never appear. This is the whole reason the recipe exists.
- Copy convention: **"Coming soon — <what>"**.
- Applies to (per plan): score pill, rail Pages/CMS/Theme tabs, `My sites`, `Rename site`,
  `Duplicate`, Help dead rows, Publish dropdown half, device segmented, `Share`, Sitemap.
- **NEVER grey what works today** — decision 10: `Social & sharing` is wired; also Design, SEO,
  Languages, Domain, undo/redo, Edit/Preview, Publish, Back to dashboard, Help & support,
  page switcher, mobile panel toggle, UserButton.

### `.app-divider` (phase 4, ×3 in the t1 bar)

`<div className="app-divider" />` — 1×22 vertical hairline, `flex:none`, self-centering.
`.app-divider--full` stretches to the parent's height instead of a fixed 22px.

### `nav-item` `activeBar` (phases 3 + 6)

```tsx
<NavItem active activeBar icon="description" label="Hero" />   // adds inset 2px 0 0 #006CFF
```
**Opt-in, default OFF** — the dashboard nav has no bar, so existing call sites are unchanged.
Only renders when `active` is also true. Adds `font-semibold` with the bar (matches t1/t16).

### Tokens (all phases)

Full list in `src/components/ui/README.md`. Most-wanted: `bg-app-frame` (t1 frame),
`border-app-border-frame` (bar/rail borders), `bg-app-track` (segmented tracks),
`hover:bg-app-hover` (rail rows), `bg-app-tint-soft` (active menu rows), `text-app-dim`
(Saved text / inactive), `bg-app-review-bg`/`border-app-review-border`/`text-app-review-text`
(review pill), `*-app-nudge-*` (t17 soft nudge), `bg-app-score-bg`/`border-app-score-border`
(score pill), `text-app-border-mute` (disabled undo/redo), `shadow-app-btn-publish`,
`rounded-app-ctl-sm` (9px t1 controls), `rounded-app-row` (11px).
**`font-app-mono` → `'JetBrains Mono App'` — never emit the raw family name.**

### Open risks for later phases

- **`.app-chrome` is still attached NOWHERE.** Phase 3 attaches it — top bar / rail / modal
  roots ONLY, never a canvas-wrapping element.
- **Radix portals escape `.app-chrome`.** All `App*` primitives here carry `font-app-sans` +
  `app-*` utilities explicitly, so they're safe. Any *new* portal-rendered chrome must do the same.
- **`.app-coming`'s `!important` color** will beat a consumer's intentional color. Expected, but
  don't fight it — if a greyed control needs a non-`#8a8a94` tone, that's a plan question.
- The `coming` recipe is convention, not compiler-enforced (deviation 2).
- `npm run build` not yet run this phase (tailwind config changed) — run before merge.

---

## Phase 2 — Status pills (SaveStateChip / ReviewPill) + dirty-guard e2e

### Files changed

| File | Change |
|---|---|
| `e2e/editor-dirty-guard.spec.ts` | **New** — 4 tests: mid-edit guard, dirty-window guard, clean-page silence (with activation), review-pill behavior. |
| `playwright.config.ts` | Registered the spec in the `authed` project's `testMatch` allowlist + a comment recording that the list IS an allowlist. |
| `src/components/ui/coming.tsx` | **New** (orchestrator amendment 2) — `<Coming>` wraps the phase-1 3-part grey-out recipe. |
| `src/app/edit/[token]/components/ui/SaveStateChip.tsx` | Restyled `STATUS_VIEW` + `chipStyle` to t1. Guard region L47-78 untouched. |
| `src/app/edit/[token]/components/ui/ReviewPill.tsx` | Restyled inline styles to the t1 coral pill; `flag` icon + count; `aria-label` added. |

No file outside the Files-touched list (+ the two amendment additions) was edited.
`EditHeader.tsx` untouched — no bar-layout work, per the phase line.

### The red-capability proof (amendment 1) — done, and it mattered

**The plan's negative case was vacuous and is fixed.** A zero-interaction page has no
sticky user activation, so Chromium suppresses beforeunload *unconditionally* — that
assertion would pass against a deleted guard. The negative test now performs a real
**non-dirtying click** (on the save-state chip: `role="status"`, no handler, cannot dirty
the store) so activation IS present, and only then closes. "No dialog" is now the guard's
decision, not a browser-imposed impossibility. It also waits for the chip to read `Saved`
first (clean precondition asserted, not assumed) and re-asserts `Saved` after the click to
prove the activation click didn't itself dirty anything.

**Sanity-proof performed as instructed.** With the `beforeunload` registration neutered
(`window.addEventListener` swapped for a no-op), the mid-edit POSITIVE case **FAILED**.
Guard restored verbatim — `git diff` on the file is empty, i.e. byte-identical — and it
passes again. The spec can genuinely go red.

**What I observed while doing it, and fixed:** the red failure surfaced as a bare
*"Test timeout of 180000ms exceeded"* after 3 minutes — no mention of a missing dialog. A
guard regression that reads as an unexplained suite timeout invites someone to retry it or
mark it flaky. Added `expectDialog(why, 15_000)`: a bounded race that throws
`No beforeunload dialog fired within 15000ms — <reason>`. The red signal is now fast and
self-explaining.

**Second vacuity found and closed (same class, unprompted).** My first draft of the
review-pill test had an `if (allComplete) return` branch — which would let a *broken or
deleted* pill pass as the "self-hide" case. I verified empirically that a freshly seeded
meridian draft always has open guide tasks (no logo, stock hero → `remainingCount > 0`), so
the assertion is now **unconditional**: the pill MUST be visible and MUST open the review
panel. Confirmed passing on that path, so it asserts rather than skips.

### `coming.tsx` — API for phases 3-8 (amendment 2)

```tsx
import { Coming } from "@/components/ui/coming"

<Coming what="page CMS"><AppIcon name="database" size={18} /> CMS</Coming>
<Coming what="site duplication" side="right">Duplicate</Coming>
```

| Prop | Type | Notes |
|---|---|---|
| `what` | `string` (**required**) | Tooltip renders `Coming soon — {what}`. Lowercase noun phrase. Required by design: an unexplained grey control is the exact failure this prevents. |
| `side` | `"top"\|"right"\|"bottom"\|"left"` | Tooltip side; default `bottom`. |
| `children` | `ReactNode` | Whatever the handoff draws (label/icon). |
| …rest | `HTMLAttributes<HTMLSpanElement>` | e.g. `className` (merged via `cn`, appended after `app-coming`). |

- Renders a **`<span>`, not a `<button>`** — `disabled` would swallow the pointer events the
  tooltip needs (phase 1's stated reason for `aria-disabled`), and a non-button can't be
  form-submitted or silently wired to an `onClick` later.
- Applies all three recipe parts together: `.app-coming` + `aria-disabled="true"` + tooltip;
  plus `tabIndex={-1}` (not a tab stop) and an `onClickCapture` preventDefault/stopPropagation
  so a nested clickable can't fire a half-wired handler.
- `inline-flex items-center gap-1.5 select-none` → drops into the t1 bar / rail rows / menu
  lists without disturbing flex layout.
- **Phases 3-8 use `<Coming>`, never the bare `.app-coming` class** (decision 15: ONE grey-out
  implementation). Nothing is greyed in *this* phase — the score pill lives in the phase-4 bar.

### Judgement calls (deviations)

1. **Touched `SaveStateChip` L94 (the dot `<span>`), just outside `STATUS_VIEW`/`chipStyle`.**
   The pulsing saving-dot the plan mandates cannot be expressed in the style objects alone; it
   needs a conditional class. Added `pulse?: boolean` to `STATUS_VIEW` + one
   `className={view.pulse ? 'animate-pulse' : undefined}`. Inside the allowed restyle intent,
   outside the forbidden L47-78 — diff confirmed to start at L92.
2. **All three chip states now have `bg`/`border: transparent`** — including `error`, which
   previously had a `#fef2f2`/`#fecaca` pill. Plan says error = "same geometry"; t1's bar has no
   filled chips. The `bg`/`border` keys were **kept** rather than removed purely so the render
   block stays byte-identical — smaller blast radius than editing the JSX.
3. **`minWidth: 150px` reservation kept verbatim**, with a comment naming it load-bearing and
   why (widest label = "Not saved — retrying"). Not removed, not re-valued.
4. **ReviewPill gained an `aria-label`.** t1 shrinks the label to `flag` + a bare count, so the
   accessible name would have degraded to "3". `aria-label` carries the existing `title`
   sentence. `useReviewState`, the L12 self-hide, and both click handlers are untouched;
   `EditHeader.tsx:70`'s `!allComplete` guard untouched → double gating intact.
5. **ReviewPill `isActive` state kept** (t1 draws only one pill). Same coral family, one step
   deeper (`#ffe1d3` bg / `#d9531f` border) — dropping it would make a working toggle stop
   reading as a toggle (affordance change, not presentation).
6. **`git checkout -- <snapshot>`** — `npm run test:run` rewrote
   `src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap` with CRLF
   line endings (content-identical; `git diff` showed only the LF→CRLF warning, zero content
   lines). I restored it to HEAD so the phase diff stays exactly on-scope. Disclosing because
   the standing rule bans `checkout`: this was a single-file restore of a file I never edited,
   not a branch/ref operation. Nothing else git-mutated; **no commit made**.

### Verification (actual results)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **CLEAN** — zero output. (Phase 1's stale `founder.jpg` error did not recur; `next-env.d.ts` had regenerated.) |
| `npm run test:run` | **GREEN** — 193 files passed / 1 skipped; **3331 passed** / 18 skipped (identical to phase 1). |
| `npm run lint` | **GREEN** — 0 errors; only pre-existing warnings (`no-img-element`, `exhaustive-deps`), none in my files. |
| `npm run test:e2e` (`authed`) — **post-restyle** | **9 passed (4.7m)**, incl. `publish.spec` ×3 and `edit-persistence` still green. |
| `npm run test:e2e` (`public`) | **13 passed / 4 skipped** — run because ReviewPill now imports `AppIcon`; `ui-isolation` (no app-chrome fonts on the block surface) + all parity specs green → the icon did not leak onto the template surface. |

**Proof the new spec EXECUTED under `authed`** (not merely "suite green") — runner lines:

```
  ✓  3 [authed] › e2e\editor-dirty-guard.spec.ts:102:5 › dirty-guard prompts on close while mid-edit (unsynced work is protected) (5.7s)
  ✓  4 [authed] › e2e\editor-dirty-guard.spec.ts:129:5 › dirty-guard prompts on close inside the dirty window (post-blur, pre-autosave) (52.9s)
  ✓  5 [authed] › e2e\editor-dirty-guard.spec.ts:152:5 › dirty-guard stays SILENT on a clean page (with user activation present) (5.8s)
  ✓  6 [authed] › e2e\editor-dirty-guard.spec.ts:183:5 › review pill: visible while setup is incomplete, opens the review panel on click (55.1s)
```

Also green **pre-restyle** (same 4 tests, `5 passed (2.2m)` incl. setup) — the spec landed and
ran before `SaveStateChip` was touched, as the phase requires.

### Open risks / not done

- **`E2E_PORT`/`PORT` needed to run e2e in this worktree.** Port 3000 is held by another
  worktree's dev server (returns 500), so Playwright's `webServer` neither reused it nor bound
  it — `next dev` fell back to 3001 while Playwright waited on 3000 →
  `Timed out waiting 180000ms from config.webServer`. **All runs used `PORT=3007 E2E_PORT=3007`.**
  `E2E_PORT` alone is NOT enough: it only moves `baseURL`, while `npm run dev` still binds
  `PORT` (default 3000). Anyone re-running e2e here needs BOTH. Config unchanged beyond the
  `testMatch` registration (out of scope).
- **The dirty-window test is timing-coupled by nature** (the autosave debounce could clear
  `isDirty` before the close). Green on every run here. Per the plan: if it turns flaky,
  downgrade to `fixme` **with that reason** — do not delete it; the mid-edit test is the
  mandatory one. Reason is documented in-file.
- **Seed rate-limiting (429) makes the suite slow, not flaky** — `seedDraft` already backs off
  and retries; several runs waited 35s+. Pre-existing.
- **Selector coupling for phase 4:** the review-pill test scopes to `page.locator('header')`
  and the clean-page test clicks `header [role="status"]`. The phase-4 single-bar collapse
  re-mounts both out of today's `<header>`. If phase 4 emits a `<header>` for the merged bar
  these keep working; **otherwise phase 4 must re-point these two selectors** — and must keep
  the negative test's neutral-click target non-dirtying, or the red-capability proof rots.
- **`npm run build` not run this phase** (nothing tailwind/asset-level changed; phase 1's
  config change still needs a build before merge, per its audit). No dev-server visual check
  performed — the founder gate at phase 3/4 covers the composed look; the pills' hexes are
  taken verbatim from scout §H.

---

## Phase 3 — LeftPanel reskin + `.app-chrome` attach + `#e6e6ec` token fix

Scope per orchestrator **amendment 1** (RESEQUENCED): LeftPanel reskin + the `.app-chrome`
attach + frame bg. **No EditLayout header geometry** — the two-row frame's spacing/heights/
borders are untouched; phase 4 collapses it. Both mount points (`GlobalAppHeader` L138,
`EditHeader` L173) intact.

### Files changed

| File | Change |
|---|---|
| `src/app/edit/[token]/components/layout/LeftPanel.tsx` | Rail reskinned to t1 (the bulk). |
| `src/app/edit/[token]/components/layout/EditLayout.tsx` | `.app-chrome` attach + frame bg ONLY. |
| `tailwind.config.js` | **+1 additive key**: `colors.app['border-hairline'] = '#e6e6ec'` (amendment 2 / decision 16). |
| `src/components/ui/popover.tsx` | `AppPopoverMenu` + `AppPopoverPanel` borders re-pointed `border-app-border` -> `border-app-border-hairline`. |
| `src/styles/app-chrome.css` | `.app-divider` background literal -> `theme('colors.app.border-hairline')`. |
| `src/components/ui/README.md` | Documented the new key + a "three border hexes that look alike" table. |

Files-touched additions were the four amendment-2 files, authorized by the orchestrator.
Nothing else edited. **No commit made.**

### Exactly which wrappers got `.app-chrome` (and proof the canvas is outside)

Four attach points, all **leaf-side** wrappers:

| # | Wrapper | Contains |
|---|---|---|
| 1 | new `<div className="app-chrome flex-none">` around `<GlobalAppHeader>` (was bare at L138) | top bar |
| 2 | existing rail wrapper (`EditLayout` L143) — class added | `<LeftPanel>` |
| 3 | new `<div className="app-chrome flex-none">` around `<EditHeader>` | nested header row |
| 4 | new `<div className="app-chrome contents">` around the 4 modal roots | GlobalFormBuilder, GlobalButtonConfigModal, LayoutChangeModal, ModalDebugPanel |

**Proof the canvas is outside** (structural, by construction):

- The `shell` root deliberately does **NOT** carry `.app-chrome`. It keeps its existing
  `font-inter` + inline `fontFamily: 'Inter…'`. It is the canvas's ancestor.
- `<MainContent>` (the canvas) is a **sibling** of wrapper #3 inside the right column, and the
  right column itself is NOT `.app-chrome` — this is why `EditHeader` is wrapped individually
  instead of the cheaper "wrap the column" move. Wrapping the column would have put the canvas
  inside `.app-chrome`. That trap is now written into the file as a comment block ("attach map")
  so phase 4 cannot reintroduce it while restructuring.
- No `.app-chrome` element is an ancestor of `<MainContent>`. Verified by reading the final JSX
  top-to-bottom; the four attach points are enumerated above and none of them wrap it.
- Wrapper #4 uses `display:contents` -> zero layout box (modals inside render fixed/portalled),
  and font inheritance still flows since inheritance follows the DOM tree, not the box tree.

**Honest caveat about the automated signal.** The brief called the `public` project's
ui-isolation + parity specs "your automated canvas-bleed signal". They are green, but they
**cannot see this change**: both `ui-isolation.spec.ts` and `parity.spec.ts` navigate to
`/dev/blocks/*`, which does **not mount `EditLayout`**. What they prove is narrower and still
worth having: the token/popover/`.app-divider` edits did not leak onto the block surface
globally. They are **not** proof that `.app-chrome` misses the canvas inside `/edit/[token]` —
that rests on the structural argument above plus the phase-3 **human gate** (founder eyeballs
editor vs published). Flagging rather than overclaiming.

### Mobile overlay (decision 14) — SURVIVED, verbatim

`EditLayout` L163-168 and its L166 `storeState?.toggleLeftPanel?.()` are **byte-identical** —
I did not even restyle its classes (permitted, but the black scrim needs no t1 treatment and
leaving it untouched is the smaller blast radius). Verified by `git diff`: the overlay block
shows zero changed lines. The L35-40 `store?.getState()` stale-closure that feeds it is also
byte-identical, as is `LeftPanel` L112-114. **Not verified in a live browser at a narrow
window** — no dev-server visual check was performed this phase (see Not done).

### `Coming` vs segmented-control geometry (decision 17) — NO conflict, but one real trap found

The rail's `Pages`/`CMS`/`Theme` tabs use the **`Coming` component** (never the bare class).
Geometry composes fine: `Coming` renders an `inline-flex items-center gap-1.5` span, and a
`SegmentedControl` option button is already `inline-flex`, so the nested span adds no visible
box. **No second grey-out style was improvised.**

**The trap phase 4 must know:** I deliberately did **NOT** set `disabled: true` on those three
options. `SegmentedControl`'s button carries `disabled:pointer-events-none` — which would
swallow the very pointer events `Coming`'s tooltip needs, silently killing the "why" affordance
that decision 15 exists to guarantee (and `disabled:opacity-50` would compound with
`.app-coming`'s `opacity:.5` -> .25). Inertness instead comes from `Coming`'s own
`onClickCapture` stopPropagation, which kills the click before the option button's `onClick`
sees it; `onValueChange` is additionally a no-op guard (belt-and-braces). **Anyone greying a
`SegmentedControl` option later must not "fix" this by adding `disabled`.** Documented in-file.

### Judgement calls / deviations

1. **Active rail row reads `state.selectedSection`** (a selector-first, read-only subscription).
   t1 specifies an active row (`bg #e6f0ff` + `inset 2px 0 0 #006CFF` + `#003E80` 600) and the
   plan mandates it, but `LeftPanel` had no active state. `selectedSection` already exists in
   the store; reading it adds **zero writes** and no new selection behavior. The conservative
   alternative (omit active styling) would have dropped a specced treatment.
2. **`nav-item`'s `activeBar` variant was NOT used** for the rail rows. The rows are existing
   `<button>`s whose handlers must stay untouched (plan: className-only); swapping in `NavItem`
   would have rebuilt them. The inset bar is applied as the identical
   `shadow-[inset_2px_0_0_#006CFF]`. Phase 6's t16 left-nav is the natural `activeBar` consumer.
3. **Emoji `SECTION_ICONS` -> Material Symbols ligatures.** Map keys and the `custom`/fallback
   behavior are unchanged; every ligature verified present in `icons.txt` (no font regeneration
   needed). This is presentation.
4. **No hover-reveal on the row `visibility` slot.** `.app-coming` sets `opacity:.5` and
   `app-chrome.css` is imported **after** the Tailwind utilities, so an
   `opacity-0 group-hover:opacity-50` pair loses the cascade — the icon paints at .5 regardless.
   Rendered at a constant .5 (the honest result) rather than shipping classes that do not work.
   Phase 1's audit predicted this class of `!important`/cascade friction.
5. **Rail tabs hidden in review ("Setup") mode.** Showing `Sections` as the active tab while the
   Setup checklist is displayed would be a lie about state. The `add` slot is likewise hidden in
   review mode. The Setup view keeps its existing back-button flow.
6. **The duplicate right border was removed from `LeftPanel`'s root** (both the wrapper and the
   panel root had `border-r border-gray-200`). The border now lives once, on the `EditLayout`
   wrapper, as `border-app-border-frame` (#e9e9ee per t1/§H).
7. **`.app-divider` re-pointed via `theme()`, verified not assumed.** `app-chrome.css` had no
   prior `theme()` usage (only `globals.css` did), so I ran the file through postcss+tailwind
   and confirmed it compiles to `background: #e6e6ec`. A silent no-op here would have broken the
   x3 dividers phase 4 is about to place.

### Verification (actual results)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **CLEAN** — zero output. |
| `npm run test:run` | **GREEN** — 193 files passed / 1 skipped; **3331 passed** / 18 skipped (identical to phases 1-2). `tailwindConfigFreeze` green -> the `border-hairline` addition is correctly additive. |
| `npm run lint` | **GREEN** — **0 errors**; only pre-existing warnings (`no-img-element`, `exhaustive-deps`), **none in my files** (grepped for LeftPanel/EditLayout/popover/coming -> no hits). |
| `PORT=3007 E2E_PORT=3007 npm run test:e2e -- --project=public` | **13 passed / 4 skipped (1.3m)** — incl. `ui-isolation` x2 and all parity specs + their 3 negative controls. See the caveat above re: what this does/does not prove. |
| `PORT=3007 E2E_PORT=3007 npm run test:e2e -- --project=authed` | **9 passed (4.4m)** — incl. `editor-dirty-guard` x4 (still green with the reskinned rail) and `publish.spec` x3. Both ports needed, per phase 2's finding. |

`git status` after gates: the `uiFoundationIsolation.test.tsx.snap` CRLF rewrite occurred as
predicted; `git diff --numstat` showed **zero content lines** and I restored it with
`git checkout -- <that file>` (single-file restore of a file I never edited; no branch/ref op,
no commit). `docs/task/editor-shell-redesign.plan.md` and `docs/tracks/uiRequirements.md` also
show modified — **pre-existing in this worktree, not touched by me.**

### Not done / open risks for phase 4

- **No dev-server visual check** and no side-by-side editor<->published canvas comparison. That
  is the phase-3 **HUMAN GATE** and it is now the primary evidence for the attach — the
  automated specs do not reach `EditLayout` (above). The narrow-window mobile-overlay toggle
  also wants a live check; code-wise it is byte-identical.
- **`npm run build` not run** — `tailwind.config.js` changed again (one additive key). Phase 1's
  audit already carries a standing "build before merge" item; this does not change that.
- **The rail's top edge is NOT final.** The tabs row currently sits under the nested `EditHeader`
  row, because phase 3 kept both mount points per amendment 1. Phase 4's single-bar collapse
  changes the rail's vertical extent — the `pt-3` on the tabs row and the `h-10` header row are
  provisional spacing, not a ruled t1 measurement.
- **Phase 4 owns the frame.** What I leave: shell root = `bg-app-frame`, no `.app-chrome`, canvas
  inherits Inter. Four attach points enumerated in an "attach map" comment at the top of the
  `shell` JSX — **update that comment if you move a wrapper.** L64-127 and L202-231 untouched.
- **Selector coupling still stands** (phase 2's note): the dirty-guard spec scopes to
  `page.locator('header')`. My `.app-chrome` wrappers are `<div>`s *around* the existing
  `<header>` elements, so the selectors still resolve — but phase 4's collapse must keep a
  `<header>` or re-point them.

---

## Phase 4 — Single-bar collapse: GlobalAppHeader + EditHeader merge + right cluster

### COLLAPSE, not fallback

The collapse landed. It did **not** turn structural: no handler was rewritten, no store
wiring changed, and the rail's layout was untouched (the bar already sat above it — what
moved was `EditHeader`'s *content*, out of the right content column and into the one bar).
The fallback (stacked-but-restyled) was not needed and was not taken.

Mechanically: `EditHeader` stopped being a component that renders a `<header>`, and became
the two CLUSTERS its content was — `EditorDesignControls` (left) + `EditorStatusCluster`
(right) — which `GlobalAppHeader` mounts inside the single `<header>`. That split was forced
by t1's ordering: the old row's content does not stay contiguous in the new bar (design
controls go left, pills go right), so a fragment could not have interleaved it.

### Files changed

| File | Change |
|---|---|
| `src/app/edit/[token]/components/layout/GlobalAppHeader.tsx` | Rewritten as THE single t1 56px bar: app menu, page switcher, design controls, Settings menu, help menu, mobile toggle, device segmented (greyed), status cluster, right panel, UserButton. |
| `src/app/edit/[token]/components/layout/EditHeader.tsx` | No longer renders a row. Exports `EditorDesignControls` + `EditorStatusCluster`; dispatch logic + ReviewPill guard moved unchanged. Score pill (greyed) added here. |
| `src/app/edit/[token]/components/layout/EditHeaderRightPanel.tsx` | Button markup + `RegenCopyConfirmModal` + toast restyled; Edit/Preview segmented shell + inline Publish split-button added. Orchestration untouched. |
| `src/app/edit/[token]/components/ui/PreviewButton.tsx` | Restyled to the inactive Edit/Preview segment. Navigation untouched. |
| `src/app/edit/[token]/components/layout/EditLayout.tsx` | Second header mount + its `.app-chrome` wrapper removed; attach map updated. Nothing else. |

No file outside the phase's Files-touched list was edited. **No commit made.**

### Attach-map change (trap 3)

Phase 3 had FOUR attach points; there are now **three**. The removed one is wrapper #3
(around the nested `EditHeader`) — the row it wrapped no longer exists. The comment block in
`EditLayout.tsx` was updated to say so explicitly, including *why* the right content column
still must never carry `.app-chrome` (it holds `<MainContent>`).

**The canvas did not move and did not become a descendant of anything new.** The `EditLayout`
diff is 4 non-comment lines: the `EditHeader` import and its 4-line mount. `<MainContent>` is
now the ONLY child of the right column; the shell root still carries no `.app-chrome`. Net
effect on the canvas: strictly *less* `.app-chrome` in the tree than phase 3 shipped.

`EditLayout` L64-127 (resize/shortcuts/autosave/modal reset), L35-40 `store?.getState()`, the
ThemeInjector/backgroundSystem block, and the mobile overlay + its L193
`storeState?.toggleLeftPanel?.()` are all byte-identical (verified by diff — they produce zero
changed lines).

### The `Coming`-in-menu-rows pattern (decision 17) — DECIDED HERE

**Greyed row = `<Coming>` wearing `AppPopoverItem`'s row geometry via `className`,** from a
single `COMING_ROW` const at the top of `GlobalAppHeader.tsx`. Used for all 7 greyed rows
(My sites / Rename site / Duplicate; the 4 help rows; Domain).

Rejected the alternative (a row-shaped variant on `AppPopoverItem`) because the variant would
have to render a `<span>` not a `<button>`, drop `onClick`, and re-implement `Coming`'s
inertness — i.e. it would be `Coming` with extra steps, added to a *shared* primitive for one
file's benefit. `COMING_ROW` restates only box + typography; colors are left to `.app-coming`,
which `!important`-wins regardless. Later menu consumers should copy this const, not improvise.

Per trap 5, **no `disabled`** was set on any greyed `SegmentedControl` option (device
segmented): inertness is `Coming`'s `onClickCapture` + a no-op `onValueChange`. Phase 3's
precedent followed exactly.

### Handlers — how "byte-identical" was verified

Diffed each file and filtered out presentation lines; the surviving non-presentational lines
are only imports, the two new cluster component boundaries, and the one new hook call site
noted below. Specifically confirmed unchanged: `handleLogoClick`, `handleHelpClick`,
`showSeoModal`/`showSocialModal` call sites, the L157 `useEditStore.getState().toggleLeftPanel?.()`
mutation (still verbatim, still via the hook object — `GlobalAppHeader.tsx:202`), the design-control
dispatch, the `!allComplete` ReviewPill guard, `regenerateAllContent` orchestration, the
toast-on-completion effect, the regen locale-lock, and the regen button's `disabled`/`title`
expressions. **No new store-write PATHS** — every store action reachable from this bar was already
reachable pre-diff, and no new action was introduced.

> **CORRECTION (impl-review note 2).** This originally read "*Zero new store writes — no
> `setState`/action call was added anywhere*", which is **false as worded**. The Publish
> split-button's main half calls `usePreviewNavigation`, which reaches
> `storeApi.getState().triggerAutoSave()` — so a new *call site* of an existing store action WAS
> added. It is per-plan (the plan sanctions "main button = existing Preview→publish entry
> navigation") and it is the same action Preview already invoked via the same hook, so no new
> behavior or new action reaches the store. But the literal claim was wrong and is retracted here.

### The two t1 deviations the founder must sign off (gate)

1. **`UserButton` KEPT** in the right cluster (decision 8) — t1 draws no avatar, but this is
   the only sign-out path. The `user.firstName` label beside it IS dropped (presentation only;
   `user` is no longer read).
2. **"/ Editor" breadcrumb REMOVED** — pure text, no handler, superseded by the page-switcher.

### Other judgement calls / deviations

1. **`Domain` in the Settings popover is GREYED, not wired.** The plan says all four rows wire
   to existing `GlobalModals` callers, but only `showSeoModal`/`showSocialModal`/`showProductsModal`
   exist — **there is no domain modal in the editor** (domain lives in the publish/preview flow).
   Greying it is not a regression (nothing works today) and matches "render greyed, never omit".
   Phase 6 builds the real t16 Domain pane. **Social is WIRED and was never greyed** (decision 10).
2. **`Languages` is NOT a Settings row.** t1 puts it there with a mono count, but `LocaleSettings`
   is a self-contained control with its own trigger + popover, and it is **not in this phase's
   Files touched** — opening it from a menu row would require editing it (and nesting a popover
   in a popover). Conservative option: `LanguageToggle` + `LocaleSettings` stay mounted in the
   bar (as the plan requires), so Languages keeps working. The Settings menu therefore has 3 rows.
3. **Publish split-button's main half calls `usePreviewNavigation(tokenId)`** — a NEW call site
   of an EXISTING hook, not new logic. Justified: publishing lives on the preview page and the
   Preview navigation is the only entry today, which is exactly what the plan says the main
   button should be. Dropdown half greyed (handoff never defines it).
4. **`Help & support` opens the help popover via controlled state** (`showHelpMenu`), with the
   help icon button as the Radix anchor. Both entry points work; `handleHelpClick` preserved.
   Consequence: the help button remains in the bar, which t1 does not draw.
5. **`Regen Copy` and `Reset` are kept in the bar** though t1 draws neither — they work today.
   **`UndoRedoButtons` and `ResetButton` are NOT in this phase's Files touched**, so they keep
   their old grey-box styling: t1's 19px undo/redo (disabled `#c7c7cf`) is **NOT achieved**. This
   is a visible inconsistency in the right cluster and the most likely founder-gate comment.
   Flagging rather than editing out-of-scope files.
6. **4 icons the handoff implies are absent from the subset font** (`menu_book`, `smart_display`,
   `keyboard`, `warning`) and `icons.txt` is not in this phase's Files touched. Rather than ship
   tofu boxes or regenerate the font out of scope, substituted present ligatures: `auto_stories`,
   `subtitles`, `smart_button`, `info`. Every ligature used in this phase was verified against
   `icons.txt` programmatically.
7. **`RegenCopyConfirmModal` stayed a plain conditional overlay** rather than adopting the dialog
   primitive (the plan suggested it). It is driven by local `showConfirm` state and rendered from
   inside the bar; swapping the mount model changes focus/scroll/portal behavior = behavior change.
   Restyled only. Same call for the toast (no toast primitive exists in `src/components/ui`).
8. **Neither the modal nor the toast carries `.app-chrome`** — `fixed` moves the box, not the DOM
   position, so both still inherit the app font from the bar's wrapper. Adding the class would have
   overridden their own backgrounds (trap 2). Two tokens I reached for did not exist
   (`nudge-icon`, `nudge-bg-strong`); used `app-review-text`/`app-review-bg` rather than adding
   keys (`tailwind.config.js` is not in this phase's Files touched).
9. **`Logo` height constrained via className.** `<Logo size>` feeds next/image as BOTH width and
   height, so a bare `size` reserves a square box far taller than a 56px bar. `h-[22px] w-auto`
   gives t1's h22.

### Verification (actual results)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **CLEAN** — zero output. |
| `npm run test:run` | **GREEN** — 193 files passed / 1 skipped; **3331 passed** / 18 skipped (identical to phases 1-3). |
| `npm run lint` | **GREEN** — 0 errors; only pre-existing warnings (`no-img-element`, `exhaustive-deps`), **none in my files**. |
| `PORT=3007 E2E_PORT=3007 npm run test:e2e --project=authed` | **9 passed (4.5m)** — run twice, green both times. |
| `PORT=3007 E2E_PORT=3007 npm run test:e2e --project=public` | **13 passed (2.1m)** — ui-isolation + parity still green. |

**Proof the dirty-guard spec EXECUTED against the new bar** (trap 1 — `SaveStateChip`/`ReviewPill`
were re-mounted into a different parent; the spec's `page.locator('header')` / `header [role="status"]`
selectors kept resolving because the composed bar IS the `<header>`, and it is now the only one):

```
  ✓  3 [authed] › e2e\editor-dirty-guard.spec.ts:102:5 › dirty-guard prompts on close while mid-edit (unsynced work is protected) (6.2s)
  ✓  4 [authed] › e2e\editor-dirty-guard.spec.ts:129:5 › dirty-guard prompts on close inside the dirty window (post-blur, pre-autosave) (52.2s)
  ✓  5 [authed] › e2e\editor-dirty-guard.spec.ts:152:5 › dirty-guard stays SILENT on a clean page (with user activation present) (5.2s)
  ✓  6 [authed] › e2e\editor-dirty-guard.spec.ts:183:5 › review pill: visible while setup is incomplete, opens the review panel on click (55.2s)
```

Selectors were **not** re-pointed — no need. The negative test's activation target is still the
`SaveStateChip` (`role="status"`, no handler, now inside the composed bar); it re-asserts `Saved`
after the click, and it passed, so the red-capability proof has not rotted. The toast I restyled
deliberately did **not** gain a `role="status"` that could have made `header [role="status"]`
ambiguous. `useEditor.ts:212`'s `target.closest('header')` header-click detection also still
resolves — another reason the bar had to stay a `<header>`.

`git status` after gates: the `uiFoundationIsolation.test.tsx.snap` CRLF rewrite recurred as in
phases 2-3; `git diff --numstat` showed **zero content lines** and I restored it with
`git checkout -- <that file>` (single-file restore of a file I never edited; no branch/ref op, no
commit). `docs/task/editor-shell-redesign.plan.md` + `docs/tracks/uiRequirements.md` still show
modified — pre-existing in this worktree, not touched by me.

### NOT done / open risks

- **No live `npm run dev` manual pass was performed.** This is the honest gap and the founder gate
  is the real check. What the e2e suite DOES cover on the real bar (worth more than nothing): the
  editor loads and edits, autosave + dirty guard fire, the ReviewPill click still opens the left
  panel, and `publish.spec` drives Preview → publish → `/p/[slug]` renders (so the Publish
  split-button's entry point and PreviewButton navigation are exercised end-to-end).
  **NOT covered by any automation, needs founder eyes:** sign-out via `UserButton`, app-menu
  Back-to-dashboard, each Settings row opening its modal (**especially Social**), the help menu's
  two entry points, undo/redo, the regen toast + locale lock, the mobile overlay at narrow width,
  and the composed bar's actual look.
- **Right-cluster styling is inconsistent by construction** (deviation 5): reskinned Regen +
  segmented + Publish sit beside un-reskinned UndoRedo/Reset. Needs either a Files-touched
  amendment or the phase-8 sweep.
- **Bar overflow at narrow widths is unverified.** The bar now carries strictly more controls than
  either old row did, and there is no responsive pass in this track (handoff is fixed 1360 desktop).
  The two `ml-auto` groups will compress before they wrap.
- **`npm run build` not run** this phase (no tailwind/asset change here); phases 1/3's standing
  "build before merge" item is unchanged.

---

## Phase 4 — fix pass (impl-review blocking issue)

**Files changed (this pass)**
- `src/app/edit/[token]/components/layout/GlobalAppHeader.tsx`
- `src/app/edit/[token]/components/layout/EditHeaderRightPanel.tsx`
- `src/app/edit/[token]/components/ui/PreviewButton.tsx`
- `docs/task/editor-shell-redesign.audit.md` (this section + the store-writes correction above)

No other file touched. The phase-4 diff was kept and fixed on top; nothing from the approved
collapse was redone.

### BLOCKING — wired popover rows never dismissed their menu

Real regression the composition introduced: Radix `Popover` does not close on item click (unlike
`DropdownMenu`), and `popover.tsx` exports no `PopoverClose`. Pre-diff, SEO/Social were bare bar
buttons — click, modal opens, nothing left behind.

Fixed per the ruling: all three menus are now **controlled** with local state in
`GlobalAppHeader.tsx` (`showAppMenu`, `showSettingsMenu`, plus the already-controlled
`showHelpMenu`), and every WIRED row sets its menu `false` in its own `onClick`:

| Row | Before | After |
|---|---|---|
| Settings → SEO | modal opens, menu hangs on top | menu closes, then `showSeoModal()` |
| Settings → Social & sharing | same | menu closes, then `showSocialModal()` |
| App menu → Help & support | two popovers, two anchors, overlapping | app menu closes, help opens |
| App menu → Back to dashboard | menu open during nav | menu closes, then `router.push` |

**No `Close` was added to the shared primitive** — that's a phase-8/decision-17-style call on a
component with other consumers. `popover.tsx` is untouched by this pass.

Greyed rows are left alone deliberately: `<Coming>`'s `onClickCapture` swallows the click, so
nothing happens and there is nothing to dismiss — and a Radix close wouldn't fire through the
swallowed event anyway. A load-bearing comment at the top of the file records the whole rule so a
later consumer doesn't "simplify" the controlled state away.

### `handleHelpClick` — coincidence → intent (note 4)

`handleHelpClick` (`setShowHelpMenu(!showHelpMenu)`) sat on the trigger *alongside* Radix's own
`onOpenToggle`. Both fired; it only worked because Radix `preventDefault()`s a re-entrant trigger
click (`targetIsTrigger`). Deleted the hand-rolled toggle and the redundant `aria-expanded` (Radix
`PopoverTrigger` sets both). **Behavior identical**, now by design rather than by accident.

### `Back to dashboard` emphasis (also-fix 1)

`active` rendered AppPopoverItem's *selected-row* styling **and** `data-active` on a navigation
action — semantically "this is the current item", which is wrong. The handoff (scout §H t1) does
draw the row highlighted, but that's emphasis, not selection.

**Approach chosen:** kept the exact visual treatment, dropped the `active` prop, and applied the
pixels as a presentational `EMPHASIS_ROW` className const in this file. Rationale: the alternative
— adding an `emphasis` prop to `AppPopoverItem` — edits the shared primitive, which is precisely
what the ruling on `PopoverClose` told me not to do in this pass. A local className keeps
`popover.tsx` untouched and confines the decision to the one consumer that needs it. `hover:bg-app-tint-soft`
is restated so the emphasised row doesn't flip to the hairline hover; tailwind-merge resolves the
rest against the base row classes. Nothing announces the row as selected any more.

### `usePreviewNavigation` double-instantiation (also-fix 2) — **LIFTED**

Chose the **preferred fix (lift), not the comment**. `EditHeaderRightPanel` is the SOLE consumer of
`PreviewButton` (verified by grep), so the hook now runs ONCE in the parent and
`handlePreviewClick`/`isNavigating` go down as props. `PreviewButton`'s props changed
`{tokenId}` → `{onPreviewClick, isNavigating}`; its `tokenId` was only ever feeding the hook.

Why this stayed inside the presentation line: the button's user-visible behavior is unchanged (same
handler, same `disabled`, same "Saving..." label), no store logic moved, and the public-API change
reaches exactly one call site which is in Files touched. What it buys:
- One owner of the `getTabManager`/`cleanupTabManager` lifecycle. `utils/tabManager.ts:230-247` is a
  keyed singleton with **no refcount** whose cleanup unconditionally `destroy()`s — two owners was a
  latent landmine (safe only by luck: the `instances` map deduped construction and both mounted in
  the same commit).
- Publish's "Opening…" now correctly disables Preview — the two halves shared one `isNavigating`
  instead of each having its own. That was the stated side-effect bug.

Both files carry a comment naming the refcount hazard so nobody re-instantiates the hook.

### Invariants re-checked
- `.app-chrome` still never wraps the canvas — **no wrapper touched**, attach points unchanged at 3
  (bar, rail, modal roots). Attach-map comment needed no update.
- `GlobalAppHeader.tsx` mobile toggle `useEditStore.getState().toggleLeftPanel?.()` verbatim.
- Regen orchestration / toast effect / locale lock / mobile overlay untouched.
- Handlers still verbatim: `showSeoModal`/`showSocialModal`/`handleLogoClick` are *called*
  unchanged, only wrapped to close their menu first.
- `COMING_ROW` pattern consistent; greyed things still use `<Coming>`, never the bare class.
- Still exactly one `<header>`; `role="status"` still unique to `SaveStateChip`.

### Test results (actual)
- `npx tsc --noEmit` — **clean, no output.**
- `npm run test:run` — **193 passed | 1 skipped (194 files); 3331 passed | 18 skipped (3349 tests).**
- `npm run lint` — **no errors**; pre-existing warnings only, none in the three touched files.
- `PORT=3007 E2E_PORT=3007 npm run test:e2e` — **22 passed, 4 skipped (6.2m).**
- Dirty-guard **execution proof** (re-run alone, list reporter):
  ```
  ✓ 2 [authed] › editor-dirty-guard.spec.ts:102 › dirty-guard prompts on close while mid-edit
  ✓ 3 [authed] › editor-dirty-guard.spec.ts:129 › dirty-guard prompts on close inside the dirty window
  ✓ 4 [authed] › editor-dirty-guard.spec.ts:152 › dirty-guard stays SILENT on a clean page
  ✓ 5 [authed] › editor-dirty-guard.spec.ts:183 › review pill: visible while setup is incomplete
  5 passed (2.1m)
  ```
  All four executed, including the negative chip-click case.
- `uiFoundationIsolation.test.tsx.snap` CRLF churn restored (`git checkout --`); tree is back to the
  phase-4 file set exactly.

### Deviations
- Emphasis applied as a local className rather than a new `emphasis` prop on the shared primitive —
  conservative reading of the "don't touch the shared primitive in this pass" ruling. If phase 8
  reskins menus anyway, promoting `EMPHASIS_ROW` to a primitive prop is the natural follow-up.

### Residual risk
- **The dismissal fix is NOT covered by automation** — no e2e asserts menu-closes-on-row-click. It is
  verified by inspection (controlled `open` + explicit `setOpen(false)` is deterministic), but a live
  click-through in `npm run dev` was **not** performed this pass. Worth 30 seconds at the founder
  gate: Settings→SEO, Settings→Social, Logo→Help & support.
- `EMPHASIS_ROW` relies on tailwind-merge resolving against `AppPopoverItem`'s base row classes; if
  phase 8 restructures those classes, re-check the row still reads emphasised.
- Deliberately left for **phase 8** (ruled deferred, untouched): `UndoRedoButtons`/`ResetButton` grey-box
  styling; the 4 missing icons + weak substitutes (`subtitles`, `smart_button`); two `ml-auto` →
  device segmented not truly centred (founder call); bar overflow at narrow widths.

---

## Phase 4 — fix pass II (help-menu regression introduced by fix pass I)

### Files changed
- `src/app/edit/[token]/components/layout/GlobalAppHeader.tsx`
- `src/app/edit/[token]/components/layout/GlobalAppHeader.menus.test.tsx` (**new**)
- `docs/task/editor-shell-redesign.audit.md` (this section)

Nothing else touched. `popover.tsx` untouched (shared-primitive ruling holds). Phase 4 + fix pass I
kept as-is and fixed on top.

### CORRECTION to fix pass I's audit
Fix pass I claimed the menu-dismissal wiring was "verified by inspection (controlled `open` +
explicit `setOpen(false)` is deterministic)". **That claim was wrong for `Logo → Help & support`.**
Inspection missed a Radix focus-semantics interaction: the row unmounts the app-menu content and
opens the help menu in ONE handler, so
1. `FocusScope` fires `AUTOFOCUS_ON_UNMOUNT` in a `setTimeout(0)` on the app-menu content unmount
   (`@radix-ui/react-focus-scope/dist/index.js:125-132`);
2. `PopoverContentNonModal.onCloseAutoFocus` (not default-prevented, no outside interaction) calls
   `context.triggerRef.current?.focus()` → focus lands on the **logo button**
   (`@radix-ui/react-popover@1.1.14/dist/index.js:225-233`);
3. the help layer's `DismissableLayer` `focusin` listener is already live and the logo button is
   outside it → `onFocusOutside` → `onDismiss` → help closes.
Help flashed open and vanished (in a real browser the app menu's `data-[state=closed]:animate-out`
defers unmount ~150ms via Presence, so it's a visible flash rather than an instant no-op).
Fix pass I's audit also said the dismissal fix was "NOT covered by automation" — that is now false;
see the new test below.

### The fix — option A
`onFocusOutside={(e) => e.preventDefault()}` on the **help** `AppPopoverMenu`, with a comment
explaining the Radix mechanism (it reads as cruft otherwise). Accepted side effect: the help menu no
longer dismisses on focus-out; it still dismisses on outside pointerdown and on Escape (both pinned
by tests). This is exactly what Radix's own *modal* popover does.

**Why not option B** (`onCloseAutoFocus` preventDefault on the app menu): it suppresses focus-return
for EVERY app-menu close, including Escape — an a11y regression. Rejected per the ruling.

### New test — `GlobalAppHeader.menus.test.tsx` (Vitest/jsdom)
Repo convention: no `@testing-library/react`, so `react-dom/client` + `React.act`, mirroring
`src/components/ui/segmented-control.test.tsx`. Renders the **real** `GlobalAppHeader` with the real
`popover.tsx` primitives; only leaf deps are mocked (`next/navigation`, `@clerk/nextjs`,
`useEditStore`, `Logo`, `PageSwitcher`, `EditHeader`, `EditHeaderRightPanel`, `GlobalModals`).
Six cases: help stays open after the app-menu handoff · help still dismisses on outside pointerdown ·
help still dismisses on Escape · Back to dashboard navigates + closes · Settings→SEO · Settings→Social.

Two traps the test defuses (both would make it pass vacuously):
- assertions **flush timers** (`settle()` = 200ms in `act`) — without it the `setTimeout(0)`
  focus-return never runs and the bug is invisible;
- the outside-pointerdown case settles **before** dispatching, because Radix attaches its
  `pointerdown` listener in a `setTimeout(0)`. jsdom has no `PointerEvent` constructor — a
  `MouseEvent('pointerdown')` carries everything `usePointerDownOutside` reads.

**RED PROOF (performed):** removed `onFocusOutside` → 
`1 failed | 5 passed` — `app menu → Help & support opens the help menu and it STAYS open`:
`AssertionError: expected false to be true` at the `menuOpen('Help and support')` assertion.
Restored the prop → **6 passed**. The test fails for exactly the intended reason.

### Test results (actual)
- `npx tsc --noEmit` — **clean (exit 0, no output).**
- `npm run test:run` — **194 passed | 1 skipped (195 files); 3337 passed | 18 skipped (3355 tests).**
  Collection proof (`npx vitest list`): all 6 new cases listed under
  `src/app/edit/[token]/components/layout/GlobalAppHeader.menus.test.tsx`.
- `npm run lint` — **no errors** (pre-existing warnings only; none in the touched files).
- `PORT=3007 E2E_PORT=3007 npm run test:e2e` — **21 passed | 4 skipped | 1 failed (7.2m)**.
  The failure is `publish.spec.ts` (authed): `Publish button never enabled` on `/preview/<token>`.
  **Unrelated to this pass and to phase 4** — the preview page is untouched and does not import
  `PreviewButton`; this fix only adds a prop to the editor's help popover. Env-dependent authed
  publish flow (Blob/KV absent locally). Flagged as an open risk, not fixed (out of scope).
- **Dirty-guard execution proof** (re-run alone, list reporter):
  ```
  ✓  5 [authed] › e2e\editor-dirty-guard.spec.ts:183:5 › review pill: visible while setup is incomplete, opens the review panel on click (5.2s)
  5 passed (2.1m)
  ```
  All 5 executed and green.
- `uiFoundationIsolation.test.tsx.snap` CRLF churn restored (`git checkout --`); no longer in the diff.

### Live click-through (performed, real Chromium)
Driven with a **throwaway** authed Playwright spec against the dev server on :3007, using a scratchpad
config (repo `playwright.config.ts` was NOT edited — its `testMatch` is an allowlist). The spec was
**deleted** afterwards; no repo file outside the Files-changed list remains modified.

Observed on `/edit/<token>`, `Logo → Help & support`:
```
LIVE: appMenu after open = open | help row count = 1
LIVE: +50   help= open  app= closed
LIVE: +100  help= open  app= closed
LIVE: +300  help= open  app= closed
LIVE: +1000 help= open  app= closed
LIVE: final help= open  appMenu= closed  helpRowsVisible= 1
LIVE: after SEO -> settings= closed
```
Help opens, the app menu closes, no overlap, help STAYS open past 1.4s. Settings→SEO closes its menu.

### Open risk — separate, pre-existing (NOT this fix)
While instrumenting, a **control** case (open the help menu on its OWN trigger, no cross-menu handoff)
showed it self-closing once, early in page life:
```
CONTROL: help-alone t+300  = open
CONTROL: help-alone t+1000 = closed
```
On the same page, menus opened *later* survive indefinitely (the trace above). So: a one-shot event
~1s after editor load — most plausibly the draft-load/hydration remount resetting the header's local
`useState` — dismisses whatever menu is open at that moment. It is **not** the focus-return bug (that
one is now fixed and pinned), it affects every menu equally, and diagnosing it means going into
`EditLayout`/`EditProvider`, outside this phase's Files touched. **Reported, not fixed** — worth a
phase-8 look, and it is why the first live run misleadingly showed `help=closed`.

---

## Phase 4 — amendment (founder removals, decisions 8 + 8b)

Follow-up pass on top of the committed+approved phase 4 (`4462a93e`). Two founder-ruled
REMOVALS, taken at the phase-4 gate, that reverse earlier plan decisions and are authorized
BEHAVIOR changes overriding the spec's presentation-only line. Not a redo of phase 4.

**Files changed**
- `src/app/edit/[token]/components/layout/GlobalAppHeader.tsx`
- `src/app/edit/[token]/components/layout/EditHeader.tsx`
- `docs/task/editor-shell-redesign.audit.md` (this section)

No other file was touched; nothing forced a wider edit.

### GlobalAppHeader.tsx — avatar / Clerk `UserButton` removed
Removed the `{isSignedIn && <UserButton .../>}` mount from the right cluster, plus the
`app-divider` that separated it from `EditHeaderRightPanel` (a trailing divider with nothing
after it would be a dangling separator). Reverses decision 8 ("keep it, it's the only in-editor
sign-out path"); founder ruling: account actions incl. sign-out live on the dashboard, reachable
from the logo menu's `Back to dashboard` row.

Dead code cleaned: `useUser()` became unused → removed, and with it the whole
`import { UserButton, useUser } from '@clerk/nextjs'` line — this file no longer imports Clerk at
all. A comment now records the ruling so the next reader does not "restore" the avatar.

**Upside realized:** t1 draws no avatar, so the bar now matches the handoff exactly and the
phase-4 "avatar deviation" is gone.

### EditHeader.tsx — Languages control unmounted
Removed the `<LanguageToggle />` + `<LocaleSettings />` mounts from `EditorDesignControls` and
their two imports; `EditorDesignControls` now returns just `designControls`. Reverses the earlier
"removing a working control is a behavior change" call. Rationale: `LanguageToggle` is invisible
until a project declares a 2nd locale, so on ~every project the pair was dead weight.

**Deliberately LEFT ON DISK, untouched and unimported:**
`src/app/edit/[token]/components/editor/{LanguageToggle,LocaleSettings}.tsx`. They are not dead
code to be swept — see residual risk below; keeping them makes re-mounting elsewhere cheap.
(`LocaleSettings` imports `localeLabel` from `LanguageToggle`, so the pair stays internally
consistent on disk. `i18nStoreState.test.ts` only *simulates* their store calls and is unaffected.)

Updated the file's header comment (which previously documented that these "stay mounted" and WHY)
to state the founder ruling + point at the `docs/product/orchestrator.md` open risk. Also corrected
`EditorDesignControls`' docstring, which still advertised "+ the i18n controls".

### Regen locale-lock — VERIFIED SURVIVING
`EditHeaderRightPanel` L107-108:
`const regenLocaleLocked = !!localeConfig && activeLocale !== localeConfig.defaultLocale;`
This reads `activeLocale`/`localeConfig` **from the store selector** (L81-88), never the toggle
component — so unmounting the toggle cannot affect it. File untouched; compiles; logic intact.
Not removed as "dead" despite the toggle being gone. The lock is now only reachable on a project
whose active locale was already non-default, which is the residual risk below, not a lock defect.

### Deviations
None. Both removals implemented exactly as scoped; no file outside the list touched.

### Test results (actual)
- `npx tsc --noEmit` — **clean, no output.**
- `npm run test:run` — **194 passed | 1 skipped (195 files); 3337 passed | 18 skipped.**
- `GlobalAppHeader.menus.test.tsx` — **6/6 passed.** No test needed weakening or fixing: the
  suite's `vi.mock('@clerk/nextjs')` stubs (`useUser: () => ({ isSignedIn: false })`,
  `UserButton: () => null`) already rendered NO avatar, so no assertion covered the removed mount.
  Those two stub lines are now inert (the component imports no Clerk) but sit in a file outside
  this phase's Files touched — left alone, flagged here as trivial cleanup for a later phase.
- `npm run lint` — no errors; only pre-existing `no-img-element` / `exhaustive-deps` warnings.
  Neither touched file appears in the output → no newly-unused imports.
- `PORT=3007 E2E_PORT=3007` full Playwright suite — **EXIT=0, 22 passed, 4 skipped.**
  Dirty-guard **EXECUTED** (proof from list reporter):
  `✓ 20/21/22 editor-dirty-guard.spec.ts` (mid-edit prompt, dirty-window prompt, silent-when-clean)
  plus `✓ 23` review pill — all green. `publish.spec.ts` passed on this run.
- CRLF-churned `src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap`
  restored (`git diff --ignore-all-space` confirmed line-ending churn only, zero content delta).

### Invariants re-checked (not regressed)
`.app-chrome` attach map untouched (no wrapper touched → attach-map comment left as-is); the bar is
still the single `<header>` with a unique `role="status"` (`SaveStateChip`) — dirty-guard e2e proves
it; `GlobalAppHeader.tsx` `useEditStore.getState().toggleLeftPanel?.()` preserved VERBATIM; regen
orchestration + toast effect untouched; popover-dispatch + `!allComplete` ReviewPill guard unchanged;
greyed rows still use `<Coming>`; no new store writes.

### Residual risk
**Bilingual projects lose their only locale-switch affordance.** Lumen (EN/NL) and naayom→Hindi have
no in-editor way to switch/declare a locale now. Consequences: (a) authors cannot reach non-default
locale copy from the editor; (b) a project already parked on a non-default `activeLocale` will show
Regen Copy locked with no visible way to switch back. Store state and both components are intact, so
the fix is a re-mount, not a rebuild. Logged in `docs/product/orchestrator.md`.

---

## Phase 5 — Design menu (t14): the three theme popovers

### Files changed

| File | Change |
|---|---|
| `src/app/edit/[token]/components/ui/DesignMenuShell.tsx` | **New** — t14 chrome, pure presentation: trigger + shell (header/body/footer) + group/row/thumb/segmented/swatch/link atoms. |
| `src/app/edit/[token]/components/ui/ServiceThemePopover.tsx` | Adopts the shell. Trigger `Style` → `Design`. Sections → TEMPLATE / Looks / STYLE / ACCENT. Handlers untouched. |
| `src/app/edit/[token]/components/ui/VestriaThemePopover.tsx` | Same, + Mood group (vestria-only) as a segmented with its colour dots preserved. |
| `src/app/edit/[token]/components/ui/ThemePopover.tsx` | Legacy product: standalone restyle to the same vocabulary (NOT folded into the shell). Trigger `Theme` → `Design`. |

Nothing outside the Files-touched list was edited. `TemplateSwapList.tsx`, `tailwind.config.js`,
`app-chrome.css`, `GlobalAppHeader.tsx`, `EditHeader.tsx` all untouched.

### Style → Design (founder ruling 8b)

- **Trigger, all three popovers → `Design`** with t1's `palette` ghost icon (`DESIGN_TRIGGER_CLASS`
  restates `GlobalAppHeader`'s private `BAR_BTN`, since that file is out of scope this phase).
  `ThemePopover`'s trigger said **`Theme`**, not "Style" — renamed too: it is the same t1 slot, and
  leaving one audience on a different word would re-create the inconsistency the ruling closes.
- **Panel header → `palette` + "Design" + `close`** on all three.
- **The internal STYLE group eyebrow: KEPT as t14 draws it.** Asked to use judgement here. "Design ▸
  Style" is an ordinary hierarchy (Figma/Sheets read the same way), and the *reason* it could confuse
  — a sibling control also called "Style" — is exactly what the rename deletes. Consumers see one
  "Design" button; "STYLE" only ever appears inside it.
  - Cost, logged: the group eyebrow is now `Style` on both, where Service said "Layout variant" and
    Vestria said "Typeface". That semantic hint survives on the `aria-label` (`Layout variant` /
    `Typeface`) and each option's blurb `title`, so it is not lost to AT or hover — only to the
    eyebrow, which the handoff specifies.

### "Browse all" — greyed on Service/Vestria, WIRED and kept on ThemePopover

Checked before greying (the `Social & sharing` lesson):
- **Service/Vestria: no picker exists** — no route/handler for the handoff's "live preview with the
  user's real content" picker; the only template affordance is `TemplateSwapList`. So "Browse all"
  renders via **`<Coming what="browsing all templates with your content">`**, never omitted.
- **ThemePopover: `Browse all styles` IS wired today** (`setStyleBrowserOpen(true)` → `StyleBrowserModal`,
  a real modal over the legacy palette set). **Kept working**, promoted to the footer strip. Greying it
  would have been the exact repeat of the near-miss.

### Dispatch firewall — how it was kept

- **`TemplateSwapList` and `handleSwap` are byte-identical.** `git diff` over both popovers'
  handler regions shows a single hunk: `onSwap={handleSwap}` re-indented. No `preloadTemplate`,
  `buildSwapPatch`, `updateMeta`, `triggerAutoSave` or posthog line changed.
- **No new template imports.** `DesignMenuShell` imports only `react` / `AppIcon` / `cn`. The
  popovers' `@/modules/templates/*` import set is unchanged (`registry`, `templateMeta` — both
  firewall-safe). `templateLabels`/`templateBlurbs` come from `@/types/service` (type-level data,
  already what `TemplateSwapList` reads).
- **Accent swatches still resolve through `[data-palette]{--accent}`** — the existing CSS-var trick,
  not a palette-config import. Verified live: hearth and meridian render **different, real** 9-swatch
  sets (hearth `oklch(0.62 0.15 40)`… warm/terracotta; meridian `oklch(0.78 0.17 155)`… brights) —
  i.e. real template palettes, NOT the handoff's 6 illustrative hexes.
- Dispatch + palette regression suites green (see Gates).

### `DesignMenuShell` API (for phases 6-8 / downstream)

```tsx
<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild><DesignMenuTrigger paletteId={activePalette} /></PopoverTrigger>
  <AppPopoverPanel side="bottom" align="start" width={288}>
    <DesignMenuShell onClose={() => setOpen(false)}>
      <DesignMenuGroup label="Template" action={<Coming what="…">Browse all</Coming>}>
        <DesignTemplateRow name={…} subtitle={…} active />
      </DesignMenuGroup>
      <DesignMenuGroup label="Style">
        <DesignSegmented options={…} value={…} onChange={…} aria-label="Layout variant" />
      </DesignMenuGroup>
      <DesignMenuGroup label="Accent">
        <DesignSwatchRow>{ids.map(id => <DesignSwatch paletteId={id} selected={…} onClick={…} />)}</DesignSwatchRow>
      </DesignMenuGroup>
    </DesignMenuShell>
  </AppPopoverPanel>
</Popover>
```

| Export | Notes |
|---|---|
| `DesignMenuTrigger` | t1 Design button. `paletteId` tints the glyph from the live `--accent`; `accentColor` is the literal-hex escape hatch (legacy system). forwardRef → works with `asChild`. |
| `DESIGN_TRIGGER_CLASS` | The bar-control class string, if a caller needs its own element. |
| `DesignMenuShell` | Header + scrolling body + footer. `footer` defaults to the lock strip; pass `null`/custom to replace. |
| `DesignMenuGroup` | Eyebrow (700/10/.09em) + optional trailing `action` + body. |
| `DesignTemplateRow` / `DesignTemplateThumb` | t14 bordered row (radius 11) + 40×30 faux thumb. Renders a `div` unless `onClick` is given. |
| `DesignSegmented` | t14 STYLE segmented. Options take `leading` (used for vestria's mood dots) + `blurb` (title). |
| `DesignSwatch` / `DesignSwatchRow` | 26×26 radius-8, double-ring selection. `paletteId` (CSS var) OR `color` (literal). |
| `DesignMenuFooter` / `DesignMenuLink` | Lock strip; "Browse all"-style link. |

Pure presentation: no store reads, no handlers, no template knowledge.

### Judgement calls / deviations

1. **A real layout bug found by browser probe, and fixed here: the panel could clip its own ACCENT
   group.** On service/hearth (swap list + 4 Looks + Style + Accent) the t14 panel is taller than the
   viewport, and `AppPopoverPanel` is `overflow-hidden` → the last swatches were rendered but
   **outside the viewport and unclickable** (Playwright: 256 retries, "element is outside of the
   viewport"). `DesignMenuShell` is now `flex max-h-[var(--radix-popover-content-available-height,80vh)]
   flex-col` with a scrolling body and pinned header/footer; same bound applied to `ThemePopover`.
   This was invisible to `tsc`/vitest and to inspection — only the live click-through caught it.
2. **`TemplateSwapList`'s own "Template" heading is hidden by a wrapper** (`[&>div>p]:hidden`), because
   the t14 group already supplies the eyebrow and that file is out of scope. Verified live: the inner
   `<p>` is `present=2 visible=1` (mine visible, its hidden). **Flag for the orchestrator:** the swap
   *rows* inside it keep their legacy blue-ring/amber-confirm styling — visually off-vocabulary next to
   t14. Fixing that needs `TemplateSwapList.tsx` on a Files-touched list (phase 8 sweep candidate).
3. **`ThemePopover` NOT folded into the shell** — per plan step 3 / scout §E, and independently
   justified: t14's footer says *"Curated set — no free color or background editing"* and this panel
   **ships a colour picker** (custom hex + contrast warning). The claim would be a lie, so this surface
   gets the wired "Browse all styles" footer instead. Only the shared *trigger* is reused.
4. **`DesignSegmented` is local, not the shared `SegmentedControl`** — t14's active segment is
   `#006CFF` 600/11.5, the primitive's is ink at `text-sm`. Re-tuning a shared primitive for one panel
   is out of scope.
5. **Swatch double-ring is an inline `boxShadow`**, not a token: it is two comma-separated shadows over
   the swatch's own background and `tailwind.config.js` is out of scope (no new key). Hexes restate
   existing tokens (`#fff` = app-surface, `#006CFF` = app-primary).
6. **Trigger swatch → tinted `palette` glyph.** t1 draws an icon-only Design button; tinting the glyph
   from the live accent keeps the at-a-glance colour the old swatch gave.
7. **Vestria mood dots preserved** via `DesignSegmented`'s `leading` slot — bone vs slate is a colour
   choice; a text-only segmented would have dropped the information.
8. **`triggerPreview` removed** from `ThemePopover` (only consumer was the old swatch; would have been
   an unused-var lint error).

### Gates (actual output)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **GREEN** — no output. |
| `npm run test:run` | **GREEN** — 194 files passed / 1 skipped; **3337 passed** / 18 skipped (identical to phase 4 — no test lost or gained). |
| `npm run lint` | **GREEN** — 0 errors (warnings pre-existing: `<img>`/exhaustive-deps in untouched files). |
| **Dispatch + palette regression (the firewall signal)** | **GREEN, called out explicitly** — ran `templates/__tests__/dispatch.test.ts`, `templates/__tests__/barrelDispatch.test.ts`, `templates/paletteSelection.regression.test.ts`, `templates/swap.test.ts`, `GlobalAppHeader.menus.test.tsx` together: **5 files / 57 tests passed**. The 6 `GlobalAppHeader.menus` cases are among them. |
| `PORT=3007 E2E_PORT=3007 npm run test:e2e` | **19 passed, 1 failed, 4 skipped, 2 did not run.** Dirty-guard **EXECUTED and GREEN — confirmed from runner output**, all 4 cases (mid-edit / dirty-window / clean-silence / review pill); re-run alone: `5 passed`. The 1 failure is the **known** `publish.spec.ts` flake under full-suite load — it dies at `page.waitForFunction(() => Clerk?.user)` (`publish.spec.ts:23`), i.e. Clerk session expiry, before any UI selector; nothing in it touches this phase's files. |

### Live browser verification (done — real Chromium, real seeded projects, mock LLM)

Throwaway probe (scratchpad-only, deleted; no repo file added), authed storageState, `npm run dev`:

| Path | Result |
|---|---|
| **service → ServiceThemePopover** | ✅ `Design` trigger; panel + TEMPLATE/STYLE/ACCENT + lock strip; **accent swap applied** (`aria-pressed` false→true) across **9 real hearth palettes**; **variant swap applied** — STYLE group = `["Classic","Condensed","Editorial"]`; TemplateSwapList alive with **real swap targets** (`Hearth` current + `Lex` + `Surge`) + 4 Looks; `Browse all` greyed (`aria-disabled`); close works. <br>❌ **CORRECTION (fix pass):** this row recorded the TEMPLATE group as correct. It was **not** — `Hearth` rendered **TWICE** (t14 thumb row + TemplateSwapList's own always-emitted current row), both styled active. The probe SAW both and I logged them as "`Hearth` current + `Lex` + `Surge`" because the `[&>div>p]:hidden` wrapper suppressed the duplicate *heading*, making the duplicate *row* read as intentional. Fixed below; everything else in this row stands. |
| **product + template module → VestriaThemePopover** | ✅ same, **9 real meridian palettes**; STYLE = `["Developer","Marketing","Light"]`. <br>❌ **CORRECTION (fix pass):** "swap rows `Meridian` (current) + `Vestria`" — same duplicate-current-row bug as above. Also note the seeded meridian fixture (`hero/features/cta`) actually has **no** eligible target (`swapShortlist('meridian') = ['meridian']`), so this path is the *fallback* branch, not the swap-list branch. |
| **legacy product → ThemePopover** | ❌ **NOT exercised — say so plainly.** Every seedable audience uses a template module (`AUDIENCES` = hearth/meridian/lex); I had no legacy non-template product project to open, and creating one was out of scope. It is `tsc`+lint clean and its handlers are untouched, but **its restyle is unverified in a browser** — founder eyes needed at the gate. |
| **template swap COMMIT** | Rows render and are clickable; I did not click through the amber confirm → commit (would mutate the seed mid-probe). Mechanism is byte-identical + `swap.test.ts` green. |

**Pre-existing bug re-observed (phase-8 carry, NOT mine):** the **~1s menu self-close**. The probe was
intermittently red on hearth until the settle wait went 1500ms → 4000ms, then deterministic. Confirms
the phase-4 note: a menu opened <1s after editor load closes itself once. Heavier pages (hearth) widen
the window. Unchanged by this phase; it just makes the symptom easy to reproduce.

### Open risks

- **Legacy `ThemePopover` unverified in-browser** (above) — the one real gap in this phase.
- **`TemplateSwapList` rows are visually legacy** inside a t14 group (deviation 2) — needs the file
  scoped into a later phase.
- The scroll bound relies on Radix's `--radix-popover-content-available-height`; the `80vh` fallback
  covers any context where Radix does not publish it.
- Snapshot `uiFoundationIsolation.test.tsx.snap` CRLF churn restored (`git checkout`), tree clean.

---

## Phase 5 — fix pass (duplicate current-template row)

**Files changed (this pass)**

- `src/app/edit/[token]/components/ui/ServiceThemePopover.tsx`
- `src/app/edit/[token]/components/ui/VestriaThemePopover.tsx`
- `docs/task/editor-shell-redesign.audit.md`

### 1. BLOCKING — current template rendered twice (fixed)

`TemplateSwapList` **always emits the current template as its own active row**
(`TemplateSwapList.tsx:145-146`) and returns `null` when no target is eligible. Rendering the t14
`DesignTemplateRow` *unconditionally above it* therefore duplicated the current template whenever a
swap target existed. Applied the ruled fix — the t14 thumb row is now the **fallback for the
"swap list hides itself" case**, which is what it is actually needed for:

```tsx
const swapSite = deriveSwapSite(sections, pages);
const hasSwapTargets = swapShortlist(tid, swapSite).some((t) => t !== tid);
…
{hasSwapTargets ? <div className="[&>div>p]:hidden"><TemplateSwapList …/></div>
                : <DesignTemplateRow name={…} subtitle={…} active />}
```

**Exactly ONE current-template row on both branches.** `swapShortlist` is an exported pure fn from
the module already imported here; no new static template import → **firewall intact**.
`TemplateSwapList.tsx` untouched (its legacy row styling remains the ruled phase-8 carry).

**Which branch serves which:**

| Branch | Who draws the current row | Real cases |
|---|---|---|
| `hasSwapTargets === true` | `TemplateSwapList` (current + targets) | hearth, lex → `[hearth, lex, surge]` |
| `hasSwapTargets === false` | t14 `DesignTemplateRow` fallback | meridian (`['meridian']` — eligible but no target); techpremium/lumen/granth (`[]` — retired/bespoke, no engine) |

### 2. Dead gap (fixed)

The `<div className="mt-2 …">` wrapper rendered even when `TemplateSwapList` returned `null` → an 8px
dead gap. The wrapper now only exists on the `hasSwapTargets` branch, and its `mt-2` is dropped (it is
the group's first child now — nothing above it to space from).

### 3. Vestria "Typeface" hint (fixed — cheap, no module reach)

`VESTRIA_FALLBACK_VARIANTS` was `{id,label}` only → `title` undefined → on that path the only visible
hint that these variants are *typeface* sets vanished once the eyebrow became "Style". Added the 3
`blurb`s **as literals copied from** `modules/templates/vestria/tokens.ts` — deliberately *not*
imported (firewall). 3-line change, so done per instruction; no template module reached into.

### Verification (actual output)

- `npx tsc --noEmit` → **clean**.
- `npm run lint` → **no new errors** (pre-existing `no-img-element` / `exhaustive-deps` warnings only).
- `npm run test:run` → **194 passed | 1 skipped (195 files); 3337 passed | 18 skipped (3355 tests)**.
- Named suites (`dispatch palette swap GlobalAppHeader`) → **6 files / 59 passed**, incl. all **6
  `GlobalAppHeader.menus` cases**. (Reviewer baseline was 4 files/51; my filter matched two extra
  files — `sectionSwap.test.ts`, `paletteSelection.regression.test.ts` — hence the higher count.)

**Both branches verified against what t14 DRAWS** (throwaway jsdom probe, deleted — mounted the real
popovers, opened the panel, counted the current template's label+blurb in the rendered panel text):

| Case | Result |
|---|---|
| hearth (targets exist) | `"Hearth"` drawn **1x**, blurb **1x** — panel: `Template · Browse all · Hearth / Lex / Surge · Looks…`. Duplicate gone. |
| meridian (no targets) | `"Meridian"` drawn **1x**, blurb **1x** — t14 fallback row present, `Accent`, lock strip. |

**The metric was itself validated (this is the part the first pass skipped):** my initial probe counted
*DOM nodes* and reported "1" for hearth — but the meridian control returned **0**, proving the selector
never matched `DesignTemplateRow` at all and so *could not* have seen the duplicate. Switched to
counting label+blurb occurrences in panel text, then **red-checked it**: temporarily restoring the old
unconditional row made hearth report **`"Hearth" drawn: 2x`** (the exact reported bug); reverting
returned it to **1x**. The check can go red, so green means something.

- e2e not run (no chrome/bar change — optional per scope).
- Snapshot `uiFoundationIsolation.test.tsx.snap` CRLF-churned by the suite run, restored; tree clean.

### Open risks

- Legacy `ThemePopover` still unverified in-browser (unchanged by this pass; it does not use
  `TemplateSwapList`, so the duplicate bug never applied to it).
- Verification was jsdom, not a real browser: it proves the **row count / branch selection**, not
  pixels. `TemplateSwapList`'s legacy blue-ring styling inside a t14 group remains the phase-8 carry.

---

# Phase 6 — Site settings + SEO (t16) + per-page SEO (t18)

## Files changed
- `src/app/edit/[token]/components/ui/SeoSettingsModal.tsx` — reskinned to t16/t18. **The only file
  touched.** `LocaleSettings.tsx` / `LanguageToggle.tsx` were REMOVED from Files-touched by the
  orchestrator amendment (decision 8b, Languages gone → they are unmounted dead code; left untouched
  on disk for the i18n track). `GlobalModals.tsx` needed no change (the wrapper-className ceiling was
  never reached — see "Social row" below).

## What shipped

**t16 site-settings window** (root page selected):
- `dialog` primitive, **912×552** (live-measured `{x:224,y:156,width:912,height:552}`), radius 16,
  border `app-border-strong`, `shadow-app-window`.
- Header 56 / bottom border `app-border-pane`: `tune` `#006CFF` + "Site settings" 700/15 + **Saved
  dot-pill** + `close`.
- Left nav 196, bg `app-surface-sunken` (#fafafb), right border `app-border-pane`, eyebrow `SITE`:
  **Domain (greyed) / SEO (active) / Social & sharing (wired)**.
- SEO pane (pad 22/26, two cols gap 26): Homepage title input · Meta description textarea + mono
  counter · Google preview card (`app-border-pane`, radius 10, title `app-preview-title`, URL
  `app-preview-url`, snippet `app-preview-snippet`) · indexing `switch` row. Side col **184**:
  Favicon 40×40 + Replace · Default social image (`image-placeholder` + `1200×630` mono chip +
  Replace image) · Social card preview · Sitemap row (bg `app-surface-alt`, `open_in_new`).
- Fields pad `9px 12px` / border `app-border-hairline` / radius 9 (`rounded-app-ctl-sm`); labels
  600/11.5 `app-label`.

**t18 per-page overrides** (sub-page selected — the EXISTING per-page section, restyled):
- Header "Page settings · <name>" + t18's verbatim caption ("Overrides, not duplicates. Each field
  falls back to the site SEO defaults — you only fill in what should differ for this page.").
- `tabs` primitive → `General | SEO | Social`, restyled to the drawn segmented look (track
  `app-track`, active `#fff` + `app-primary` 600/12 + `0 1px 2px rgba(0,0,0,.07)`).
- Tighter fields (radius 8, pad `8px 11px`), mono counters. General = indexing toggle, SEO = meta
  title/description + Google preview, Social = social image.

## Ruled deviation from t16 as drawn — no `Languages` nav row
t16 draws a 4th left-nav row (`Languages` + mono locale count). **Deliberately omitted** per founder
ruling 8b (Languages gone from the chrome; phase 4 already deleted the `LanguageToggle`/
`LocaleSettings` mounts). Re-adding it in the settings modal would contradict the ruling. Left nav is
**Domain / SEO / Social & sharing** — 3 rows, live-verified. Documented in the file's header comment.

## Dispositions — evidence
- **Social & sharing: WIRED, never greyed.** Opens the existing social panel. Implementation note: it
  does **not** import `showSocialModal` — `GlobalModals.tsx` imports THIS file, so that would be a
  require cycle. It dispatches the `lessgo:manage-social` window event, which `GlobalModals` already
  listens for (the firewall-safe pattern already in the codebase). This is why no `GlobalModals`
  change was needed. Live-verified: SEO window closes (autosave fires), social panel opens.
- **Domain: GREYED** via `<Coming what="custom domain setup">`. Re-verified the phase-4 finding: no
  domain entry point exists anywhere in `src/app/edit/`. Live: `aria-disabled="true"`, `.app-coming`,
  tooltip "Coming soon — custom domain setup".
- **Sitemap: GREYED — evidence both ways.** A per-host sitemap route **does exist**
  (`src/app/api/seo/sitemap/route.ts`, reached by a middleware rewrite of `{publishedHost}/sitemap.xml`;
  `src/app/sitemap.xml/route.ts` is the marketing sitemap only, not this site's). **But the editor has
  no published host to build the link from**: `publishing.publishedUrl` is *declared* at
  `src/types/store/state.ts:407` and **never assigned anywhere in the repo** (grep returns only the
  type declaration), and this phase may add no fetches. Wiring it needs the publish-status fetch that
  lives on the preview page → phase 7/8 territory. Greyed as `Coming what="the sitemap link"`.
- **`nav-item`'s `activeBar` variant: FITS — now consumed.** t16's left nav is exactly its drawn use
  (`bg-app-tint` + `inset 2px 0 0 #006CFF` + `app-primary-deep` 600). It should NOT be deleted in
  phase 8.

## Preserved (scout §E landmines)
- **`useMemo`-outside-selector shape (L36-38 comments + code): verbatim.** The raw `pages` record is
  still selected and the sorted list still derived in a `useMemo` outside the selector. Live probes
  across 3 sessions: **no "Maximum update depth exceeded"** in the console.
- **`store.updatePageSeo` wiring**: untouched — reskin, not rebuild. Live-verified a per-page override
  reaching the store: `T18 STORE seo: {"description":"Pricing page override description."}`.
- **Char meters** (60/70, 160/200) + `maxLength` behavior unchanged.
- **Pixel regexes + Pro gate** (`/api/billing/plan`, L66-80): untouched, still **fail-closed**. Live:
  `#seo-meta-pixel` rendered disabled.
- **Google preview still renders from the real `buildPageMetadata`** — no mock markup. Live: typing in
  the description updated the snippet, and the title field updated the preview title.
- `noindex` semantics unchanged (see judgement calls).
- Raw tracking-ID local state, upload handlers, `handleClose`→`triggerAutoSave` all byte-identical.

## Judgement calls (in-scope, conservative)
1. **noindex checkbox → t16 indexing switch.** t16 draws "Let search engines index this site" (ON =
   indexed); the store field is `noIndex`. Mapped by inversion — `checked={!seo.noIndex}`,
   `onCheckedChange(v => patch({noIndex: v ? undefined : true}))`. Identical semantics/store writes.
2. **Switch left at the primitive's 36×20, not t16's 38×22.** The thumb size and its 16px travel are
   internal to `switch.tsx` (out of scope); resizing the track alone would desynchronize the knob.
   2px deviation, deliberate.
3. **Built-in `DialogContent` close suppressed** via `[&>button]:hidden` so the t16 header close (a
   `DialogClose`) is the only one. t16 draws exactly ONE close. Live-verified: **1 visible close
   affordance** (the built-in has `box=null`). `dialog.tsx` is out of scope, hence the utility rather
   than a primitive change.
4. **Radix Dialog adds ESC-to-close** (backdrop-click already closed and still does; both route to the
   same `handleClose` → `triggerAutoSave`). Minor behavior addition inherent to the primitive.
5. **Saved dot-pill derives save state locally** (read-only, `useShallow` selector on the persistence
   slice) rather than mounting `SaveStateChip` — the chip registers a `beforeunload` guard, and a
   second one is not wanted. No new store state.
6. **`.app-chrome` sits on the portalled `DialogContent`** (Radix portals to `body`, escaping
   `EditLayout`'s chrome roots) and never near the canvas. All backgrounds are painted by CHILDREN —
   `.app-chrome` would beat a co-located `bg-*` utility on the same element.
7. **Nothing dropped.** t16 doesn't draw structured data / tracking pixels / the social card preview;
   all three are working features, so they were restyled and kept (extras below the drawn t16 fields /
   in the side col) rather than omitted.
8. **Char-meter tone preserved.** t16 specifies `#b0b0ba`; the green/amber over-ideal tone is the
   meter's *behavior*, so it was kept and only the neutral state adopts the handoff grey.

## Verification — actual output
- `npx tsc --noEmit` → **clean, 0 errors**.
- `npm run test:run` → **194 passed | 1 skipped (195 files); 3337 passed | 18 skipped (3355 tests)**.
- `npm run lint` → **0 errors** (pre-existing `no-img-element` / `exhaustive-deps` warnings only;
  targeted `eslint` on the touched file: clean).
- CRLF-churned `uiFoundationIsolation.test.tsx.snap` restored; `git status` shows only this phase's file.
- e2e not run (optional this phase).

### Live browser check — RUN (headless Chromium, dev on :3003, seeded Meridian project, 1360×864)
Ports 3000-3002 were held by other worktrees' dev servers. Probes were standalone scripts in the
scratchpad (no repo files created; `playwright.config.ts`'s `testMatch` allowlist makes a throwaway
spec impossible without an out-of-scope config edit). Screenshots reviewed, then deleted.
- Opens via the Settings popover → SEO row. PASS
- Dialog geometry **912×552** exactly. PASS
- Left nav: **exactly 3 rows** — `Domain` / `SEO` / `Social & sharing` (counted against t16 as drawn,
  minus the ruled Languages omission). PASS
- **Exactly 1 visible close** (the duplicate hazard — explicitly counted, not assumed). PASS
- Meters + Google preview update **live**: `MONO ["0 / 60","63 / 160","1200x630"]`; snippet became the
  typed text; `PREVIEW TITLE AFTER "Probe SEO title"`. PASS
- Per-page override **saves** through `updatePageSeo`. PASS. t18 tabs all three render + switch. PASS
- Social row opens the social panel. PASS
- **No "Maximum update depth exceeded"** in any probe. PASS
- **Clipping/reachability** (the 912×552 + scrolling-pane hazard): pane `scrollHeight 801 / clientH
  494`, scrolls correctly; the bottom-most controls (Sitemap row, tracking inputs) are visible and
  reachable; nothing clipped or unreachable. PASS
- Pro gate: `#seo-meta-pixel` **disabled** (fail-closed holds). PASS
- **False alarm, chased down not assumed:** a probe reported only ONE page chip where two were drawn
  (the phase-5 duplicate-row failure mode in reverse). Re-probed with a verbatim dump: **3 chips**,
  `"Home*" / "Pricing*" / "Pricing"` — the first reading was my regex missing the seo bullet marker,
  and the third chip was my own probe calling `addPage` twice across sessions (store confirmed two
  `/pricing` entries). **Not a UI bug** — the strip renders every page.

## Open risks / not done
- **Pre-existing, NOT mine:** `GET /edit/<token>` returns **500** on first SSR in dev —
  `useEditStoreBootstrap.ts:238 ReferenceError: window is not defined` (the dev-only `window` debug
  block). Already logged as the phase-7 note in the plan; the page hydrates and works. Unrelated to
  this file.
- t18's entry point per the handoff is the Pages rail ... menu, which is **greyed** (phase 3) and
  explicitly not built here — so the per-page pane is reached via the modal's page-chip strip, as it
  was before this phase. The chip strip itself is a restyle, not the drawn t18 entry.
- The t18 branch only renders for multi-page projects; the live check exercised it by adding a page
  through the dev store handle (probe-only, no code path added).
- `LocaleSettings.tsx` / `LanguageToggle.tsx` remain unstyled dead code on disk by ruling — if the
  i18n track re-mounts them, they will not match app-chrome.

---

## Phase 7 — Publish flow (t17) + publish.spec selector repair

### Files changed
- `src/app/preview/[token]/page.tsx` — action-bar reskin (publish ENTRY) + t17-C live card; `onReview` slot wired.
- `src/components/SlugModal.tsx` — t17-A confirm card + t17-B publishing card + `app-danger` error.
- `e2e/publish.spec.ts` — selector repair (5 planned + 1 unenumerated) + 4 new UI-state assertions.

Nothing else. `git status --short -- src e2e` lists exactly these three.

### What shipped, per t17 state
- **A · confirm** (`SlugModal`, `data-testid="publish-confirm-card"`): header "Publish changes" + `close`;
  live-target row (`bg-app-surface-alt` #f6f7fb r9, `public` icon, slug 600/11.5, "Live target" caption
  `app-faint`, **"Change"** link `app-primary` → focuses the slug input); soft **Review nudge**
  (`app-nudge-bg`/`app-nudge-border`, `flag` `app-cta`, `app-nudge-text`, "Review" link
  `app-review-text`) rendered only when `!allComplete` (mirrors `ReviewPill`'s self-hide); URL field
  (mono) + title field + mono `n / 60` counter; analytics row; footer `Cancel` + **`Publish now`**
  (flex-1, `app-primary`, 600/12.5). **"N edits since last publish" row OMITTED** (decision 13).
- **B · publishing** (`publish-publishing-card`): phase-1 `<Spinner size={40}>` (ring `app-tint-ring`
  + `app-primary` top, `.8s`), "Publishing your changes…" 600/14, "Usually takes a few seconds" 400/11.5.
  Renders **in place of the confirm body** when `loading` — same WHEN (`publishing` is only ever true
  while `showSlugModal` is true; `handlePublish` is the sole setter), different WHAT.
- **C · live** (`publish-live-card`): 48px `app-success-bg` circle + filled `check` `app-success`;
  **"You're live!"** 700/18 `-.3px`; sub; URL row (border r10, `lock` green, URL **mono 500/12**,
  `content_copy` → existing `navigator.clipboard` handler); **`Share` GREYED via `<Coming what="one-click
  sharing">`**; `View site` (`app-primary` + `open_in_new`, real `href={publishedUrl}` — works); footer
  "Version saved · restore anytime"; **domain upsell row** (`app-tint-soft`/`app-tint-edge`,
  `app-primary-deep`, `arrow_forward`) → `setPublishSuccess(false); setShowDomainModal(true)` (the same
  setter the action bar's Custom Domain button already uses).
- **Error**: `publishError` restyled to `app-danger` in the confirm card. When it fires: unchanged.
- **Action bar** (the publish entry, not itself a t17 state): reskinned to app-chrome; label stays
  "Publish" + `rocket_launch`; `data-testid="publish-trigger"` added.

### Proof the no-touch regions are untouched
`git show HEAD:` diff of the protected span (old L108-450 vs new L114-456) → **empty**:
`handlePublish` body incl. the single `fetch('/api/publish')`, slug normalization, the
`published-slug` status fetch, and the whole local `useState` set are **BYTE-IDENTICAL**.
Every diff hunk is at the import block or >= L457 (JSX). `git diff --name-only HEAD --
src/app/api/publish src/lib/staticExport src/lib/routing src/modules "*.published.tsx"` → **empty**.
Zero `@/app/edit/**` imports in either touched component (the one grep hit is my own comment).

### Selector repairs (old → new) — honest, not weakened
| old | new | why honest |
|---|---|---|
| `div.shadow-lg` + `hasText:/Choose your page URL\|Republish Your Page/` | `getByTestId('publish-confirm-card')` **+** `getByRole('heading', {name:'Publish changes'})` | class+copy coupling → testid; the heading assertion is *added*, so copy is still checked |
| `getByRole('button',{name:/Confirm & Publish\|Update Published Page/})` | `getByRole('button',{name:'Publish now'})` **+ `toBeEnabled()`** | still a role+name assertion (not a testid); the enabled check *adds* the handoff's "nudge never gates" rule |
| `getByPlaceholder('e.g., Design Tools…')` | `getByTestId('publish-title-input')` | placeholder retained in the DOM; testid is the stable hook |
| `getByText(/Page Published/i)` | `getByTestId('publish-live-card')` **+** `getByText(/You're live!/)` **+** `publish-live-url` matches the slug | 1 assertion → 3; the URL row is now proven non-empty |
| `getByRole('button',{name:'Publish', exact:true})` (**unenumerated in the plan** — impl-review flagged it) | `getByTestId('publish-trigger')` + `toHaveText(/Publish/)` | `exact:true` would have broken on the `rocket_launch` ligature text node; label still asserted |
| — | **NEW** `publish-publishing-card` visible after confirm | state B had no coverage at all before |

Net: assertions went from 4 → 9. Nothing was relaxed to make the suite pass.

### Gates (actual output)
- `npx tsc --noEmit` → **0 errors**.
- `npm run test:run` → **194 files passed | 1 skipped; 3337 passed | 18 skipped**.
- `npm run lint` → **0 errors** (warnings only, all pre-existing, none in the touched files).
- `PORT=3007 E2E_PORT=3007 npx playwright test` → **22 passed | 4 skipped | 0 failed**, and
  `publish.spec.ts` **EXECUTED** — runner lines: `✓ 24 [authed] publish service / Hearth (34.2s)`,
  `✓ 25 publish service / Lex (7.8s)`, `✓ 26 publish product / Meridian (1.1m)`. The 4 skips are the
  pre-existing `generation.spec.ts` public skips, not publish.
- **Flake classification (honest):** across 4 full-suite runs + 1 isolated run, publish.spec passed
  4/5. The single failure (run 2, Hearth) failed at **32.0s** — consistent with the known 30s
  `waitForFunction(() => Clerk?.user)` timeout at `publish.spec.ts:23`, i.e. the recorded env/session
  flake, NOT the new selectors (which carry 45s/20s/120s timeouts and would fail at different marks).
  I did not capture that run's stack (my own grep filter dropped it), so this is **inference from the
  timing, not proof**. The isolated re-run immediately after was 4/4 green, as was every later full run.

### Live loop (performed, real Chromium, `PORT=3007`) — verified against t17 AS DRAWN
A scratchpad-only probe (outside the repo; no repo file added) seeded a real Hearth draft via the
authed routes and drove preview → Publish → confirm → publishing → live → `/p/[slug]`, dumping
computed styles + screenshots which I then compared against scout §H's hexes/sizes:
- confirm card `#e6e6ec` / r14 / Onest OK · nudge `#fff8f5` + `#ffe1d3` / r9 OK · **`Publish now`
  `#006CFF` 600/12.5, `enabled = true` WITH the nudge showing (2 setup steps left)** OK — the handoff's
  "soft nudge, not a gate" rule holds empirically, not just by inspection · slug input `JetBrains Mono App` OK
- spinner: top `rgb(0,108,255)` + track `rgb(230,238,252)` OK (the bounding box reads 56px because a
  rotating 40px square's rect is 40·√2 — the element is 40px)
- live card **w=322 exactly as t17** OK · URL row mono 500/12 OK · `View site` href = the real published
  URL OK · Share = `.app-coming` grey `#8a8a94` OK
- Republish of an existing slug: covered by the e2e suite itself (deterministic slugs → runs 2+ are
  republishes) — green.
- The canvas behind the modal keeps its template serif/colors — no `.app-chrome` bleed (screenshot).

**Two real bugs the probe caught that tsc/tests/lint could not** (both fixed, both were "looks fine
in code" defects — the phase-5 lesson applied):
1. **`Share` was 80px wide / 19.2px / radius 0** instead of a flex-1 12.5px button: I had put the row
   geometry on a child of `<Coming>`, but `Coming` renders its OWN `inline-flex` span (decision 17's
   exact trap). Fixed by passing the classes to `Coming` via `className` — the phase-4 documented pattern.
2. **Both cards rendered `#f7f8fa`, not white**: `.app-chrome`'s `background` beat `bg-white` (equal
   specificity, later in the cascade). Fixed with the **existing phase-3/4 `app-chrome contents`
   wrapper** (`display:contents` → inherits Onest/ink, paints no box), applied at all three sites
   (confirm modal, live modal, action bar). Re-probed: all now `rgb(255,255,255)`.

### PARITY EVIDENCE — what I can and cannot claim
**I did NOT produce a before/after byte diff of exported HTML.** Doing it properly needs a
`git stash`/checkout of the working tree, which is a state-changing git command I'm not permitted to
run. The founder must still do the hand check at the gate.

What I *can* evidence — a by-construction argument, each link verified:
1. Published output = f(`content` payload, published renderer, `staticExport`, templates, registries).
2. The `content` payload is built by `handlePublish` → **byte-identical** (diff above).
3. Renderer / `staticExport` / registries / templates / every `.published.tsx` → **zero diff**.
4. The one DOM-derived input, `htmlContent` scraped from `#landing-preview`, is **discarded by the
   route**: `src/app/api/publish/route.ts:212,246` store `htmlContent: ''` ("Phase 2: Empty for dynamic
   rendering"). So even the preview DOM cannot reach published output — and my markup is entirely
   outside `#landing-preview` regardless.
5. Empirical: the e2e published 3 templates (Hearth/Lex/Meridian) to real `/p/[slug]` pages across 4
   runs and asserted each renders `div.landing-page-published` with template token attrs + real hero copy.
→ Output is identical **by construction**, but that is an argument, not a byte diff. Gate still required.

### Judgement calls / deviations
- **Confirm card is 380px, not t17's 314px.** t17-A draws a popover with a live-target row, an edit
  count and a nudge; our confirm ALSO owns the slug field, title field + counter and the analytics
  opt-in (all pre-existing, all load-bearing). 314px squeezes them. Live card is 322px, exactly as drawn.
- **Confirm stays a centered modal, not a popover anchored under Publish.** Anchoring it would mean
  moving the trigger/ownership of `showSlugModal` — a structural change to when things render. Plan
  says "A confirm (SlugModal context)"; I read that as the modal keeps its shell.
- **"Change" focuses the slug input** rather than toggling a disclosure. A disclosure would add new
  UI state and hide the field the e2e fills; the fields stay visible, so the link is a jump, not a gate.
- **`Publish now` keeps `disabled={loading || !slug…}`.** The "ALWAYS ENABLED" rule is about the Review
  nudge never gating (verified live: enabled with 2 steps outstanding). The empty-slug guard is
  pre-existing *validation*, which the plan says is unchanged. Removing it would let a publish fire at
  a URL that `handlePublish` then early-returns on.
- **Contextual submit labels dropped** ("Update Published Page" / "Change URL & Republish" → always
  "Publish now", per decision 5). The URL-change warning banner still carries that information; it is
  restyled to the coral nudge family and keeps its copy.
- **Domain upsell is `disabled` + tooltip when `existingPublished?.slug` is absent** (i.e. on a *first*
  publish), mirroring the action bar's existing Custom Domain gating exactly. `CustomDomainModal` only
  renders for an already-published slug (`page.tsx:554`) and widening that condition is a render-condition
  change → out of bounds. I did **not** use `<Coming>` here: the control is real and wired, and `Coming`
  would claim "not built yet", which is a lie. **Founder-visible wart:** right after a first publish the
  upsell is greyed until the preview is reopened (the status fetch is mount-only). Fixing it needs a
  refetch/state write = out of scope.
- **"Review" link → `handleEdit`** (the page's existing, verbatim route back to the editor). It does not
  open the review tab — cross-page state I'm not allowed to write. Nudge is soft, so this is a jump-back.
- **`#f0f0f3`** (t17 footer/divider hairline) has no token and `tailwind.config.js` is not in my
  Files-touched → used as an arbitrary `border-[#f0f0f3]`. Decision 3 forbids snapping it to
  `app-hairline` (#f2f2f5). Phase 8 could tokenize it.
- **Action bar reskinned** though it isn't a t17 state: it carried the `div.shadow-lg` the e2e coupled
  to, and it is the entry to the flow. Handlers moved verbatim; `Publish` label kept.

### Open risks
- `publish.spec.ts`'s Clerk-session flake is untouched and still present (~1-in-5 under full-suite load).
- The dev-server SSR error at `useEditStoreBootstrap.ts:238` (`window is not defined`) still logs on the
  preview page's server render. **Not worsened** — it appears identically before/after and never failed a
  run. Not touched (out of scope, editor-perf track).
- `SlugModal` now reads `useReviewState`. On the preview page `EditProvider` calls `initFromContent`, so
  `remainingCount` is real (probe showed "2 setup steps left"). But preview passes
  `prefetchBaselineForReview: false` — that suppresses *markers* only, not `guideTasks`/`remainingCount`,
  so the nudge count is correct. No store writes were added.
- `src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap` gets CRLF-churned by
  every `test:run`; restored (`git status` clean of it).
