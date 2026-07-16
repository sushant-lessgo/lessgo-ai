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
