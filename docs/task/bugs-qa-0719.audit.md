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
