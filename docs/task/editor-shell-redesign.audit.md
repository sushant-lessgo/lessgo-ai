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
