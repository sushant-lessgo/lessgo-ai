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
