# bugs-qa-0719 — implementation audit

## B9 — "Logo bad in editor.. make it good everywhere"

**Files changed**
- `src/components/shared/Logo.tsx` — root-cause fix
- `src/components/shared/Logo.test.tsx` — new regression test
- `src/components/dashboard/AppSidebar.tsx` — re-pointed to shared `<Logo>` (single source of truth)
- `src/components/shared/Header.tsx` — call-site size adjust
- `src/app/onboarding/[token]/page.tsx` — call-site size adjust
- `src/components/onboarding/PersonaPrompt.tsx` — call-site size adjust
- `src/app/edit/[token]/components/layout/GlobalAppHeader.tsx` — stale comment + size cleanup

### What changed & why
- **Logo.tsx (root cause):** now renders the transparent wordmark `/lessgo-logo.png`
  (intrinsic 152×40) via `next/image`, matching the dashboard sidebar reference from
  qa-0718. The `size` prop is reinterpreted as TARGET HEIGHT; width is derived from the
  152:40 aspect ratio (`Math.round(size * 152/40)`) so the wide wordmark is never squished.
  Previously it rendered the boxed `/logo.svg` at `width=size height=size` (square) —
  the "bad logo." `alt` set to `"Lessgo AI"`; `className` passthrough preserved
  (GlobalAppHeader still relies on `h-[22px] w-auto`).
- **AppSidebar.tsx:** replaced the inline `next/image` copy with `<Logo size={30} className="h-[30px] w-auto" />`
  (removed now-unused `next/image` import). Renders the identical ~30px transparent
  wordmark → one logo component across the app.

### Call-site sizing adjustments (size→height reinterpretation)
Old `size` was a square edge; now it's the display height, so oversized square values
had to shrink to sensible heights:
- Header.tsx (marketing): `240` → `40` (was a 240px square box; 40px tall wordmark).
- onboarding/[token]/page.tsx (top bar, py-3): `80` → `30`.
- PersonaPrompt.tsx (top bar, py-3): `80` → `30`.
- GlobalAppHeader.tsx: `110` → `22`; height already pinned by `h-[22px] w-auto` className
  (display unchanged) — updated the now-stale comment about the old square behavior.
- JourneyTopBar.tsx: `size={22}` left as-is — already a sensible height, no change needed.

### Regression test
`src/components/shared/Logo.test.tsx` renders `<Logo />` (react-dom/client + React.act,
the repo's harness — no @testing-library) and asserts the emitted `img` has
`alt="Lessgo AI"`, its `src` contains `lessgo-logo`, and does NOT contain `logo.svg`.
- Pre-fix (old Logo.tsx via `git stash`): **FAILED** (src was logo.svg).
- Post-fix: **PASSED** (1/1).

### Gate results
- `npx vitest run src/components/shared/Logo.test.tsx` → 1 passed.
- `npx tsc --noEmit` → no NEW errors. One pre-existing unrelated error remains:
  `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'` (asset
  typing, not touched by this fix).

### Deviations
- None from the root-cause plan. Took the "preferred" optional step (re-point AppSidebar)
  since it cleanly reproduced the ~30px wordmark.

### Open risks
- Visual review recommended on the marketing Header (240→40) and onboarding/PersonaPrompt
  top bars (80→30) — heights chosen to match the dashboard ~30px reference, but not
  visually confirmed in-browser. Not a dual-renderer surface (no `.published.tsx` pair).

---

## B10 — Unpublish menu row renders literal `cloud_off` text; "Unpublish" label overflows

**Files changed**
- `src/components/dashboard/ProjectCardMenu.tsx` (modified)
- `public/fonts/material-symbols-rounded/icons.txt` (modified)
- `src/components/dashboard/ProjectCardMenu.test.tsx` (created)

### What changed
- **ProjectCardMenu.tsx:277** — swapped the Unpublish row's `<AppIcon name="cloud_off" size={17} />`
  for `name="visibility_off"` (same size). `cloud_off` is absent from the shipped Material
  Symbols woff2 subset, so the browser painted the raw ligature name as text; with
  `.app-icon { white-space:nowrap }` inside the fixed 186px menu that wide literal blew out the
  row and pushed "Unpublish" off-edge. `visibility_off` IS in the subset (icons.txt line ~176,
  and it already renders live at CorrectionBoard.tsx:203) and reads as the natural opposite of
  the `visibility` glyph on the "Visit site" row. Added an inline comment noting the intent to
  restore `cloud_off` after a font-subset regen. No CSS / menu-width change (root cause was the
  glyph width, so a normal ~17px glyph fixes the truncation).
- **icons.txt** — added `cloud_off` in alphabetical position with an inline `#` comment marking it
  as the ideal Unpublish glyph, pending a woff2 subset regen. This alone does NOT fix the bug (the
  shipped font still lacks the glyph); it just records the want so a future regen restores it.

### Regression test
`src/components/dashboard/ProjectCardMenu.test.tsx` (react-dom/client + React.act idiom, per
GlobalAppHeader.menus.test.tsx — no @testing-library in repo):
- Renders `<ProjectCardMenu>` for a PUBLISHED project (publishState: 'published') so the
  isPublished-gated Unpublish row mounts; opens the Radix dropdown via the keyboard path
  (Enter on the focused trigger — jsdom has no PointerEvent, and Radix opens on pointerdown).
- Parses `icons.txt` into a "shipped subset" Set, treating any line containing `#` as a
  comment / documented-pending entry (excluded) — so the pending `cloud_off` entry is NOT
  counted as shipped.
- Asserts every rendered `.app-icon` glyph ∈ subset, and that a menu item contains "Unpublish".
- Comment documents that icons.txt is a lower-bound proxy (woff2 GSUB is authoritative), guarding
  the specific subset-drop class.

**Before/after:** pre-fix (`name="cloud_off"`) → FAILS `AssertionError: glyph "cloud_off" is not
in the shipped subset` (subset = 179 entries, cloud_off excluded via the pending-comment rule).
Post-fix → both tests PASS (2 passed). Verified by temporarily reverting the glyph.

### Deviations
- None. Used the preferred full-render test (no fallback needed).

### Gate
- `npx vitest run src/components/dashboard/ProjectCardMenu.test.tsx` → 2 passed.
- `npx tsc --noEmit` → only the pre-existing unrelated `src/app/page.tsx:6` founder.jpg
  TS2307 error; no new errors.

### Open risks
- The proper `cloud_off` glyph is still not shipped in the woff2 subset; a future font-subset
  regen (using the now-recorded icons.txt entry) can restore it and revert the swap. Low priority
  — `visibility_off` is an acceptable, correct-reading substitute.
