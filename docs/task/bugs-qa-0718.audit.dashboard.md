# QA-0718 Dashboard Hotfixes — Audit

## Files changed
- `src/components/dashboard/NewSiteButton.tsx` (B13)
- `e2e/dashboard-workspace.spec.ts` (B13)
- `e2e/dashboard-shell.spec.ts` (B13)
- `src/components/dashboard/AppSidebar.tsx` (B11)
- `public/lessgo-logo.png` (B11 — new asset, copied)
- `src/components/dashboard/DashboardEmptyState.tsx` (B12)

---

## B13 (D5) — rename CTA copy

**Change:** default `label` prop of `NewSiteButton` `'New site with AI'` → `'Create my new website'`.
All user-facing occurrences flow from this single default (the sidebar, projects filter row, empty-state, and ghost card either use the default or pass their own rich `label`; only the sidebar/ghost-card rely on the default text).

- `NewSiteButton.tsx`: `label = 'New site with AI'` → `label = 'Create my new website'`.
- `e2e/dashboard-shell.spec.ts`: two `getByRole('button', { name: /New site with AI/i })` matchers → `/Create my new website/i` (lines ~27, ~81).
- `e2e/dashboard-workspace.spec.ts`: one matcher (line ~124) → `/Create my new website/i`.

The doc-comment mention of "New site with AI" in `NewSiteButton.tsx` (historical provenance note) was left as-is — not user-facing.

**Regression guard:** the updated e2e string matchers ARE the guard (per instructions). Playwright not run.

Before → After: button reads **"New site with AI"** → **"Create my new website"**.

---

## B11 (D1) — dashboard logo: white background box + too small

**Root of the visual issue:** the sidebar rendered the shared `Logo` component (`/logo.svg`) as a 24×24 square at `h-6 w-auto` — a small square glyph that read as boxed and undersized versus the design.

**Asset used:** copied `docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/assets/lessgo-logo.png` (transparent RGBA wordmark, 1895×500) → `public/lessgo-logo.png`. This is exactly the asset the dashboard design handoff (`Lessgo Dashboard.dc.html`) references for the sidebar (`<img src="assets/lessgo-logo.png" style="height:24px;width:auto">`).

**Change in `AppSidebar.tsx`:**
- Dropped `import Logo from '@/components/shared/Logo'`; added `import Image from 'next/image'`. (Left the shared `Logo` component untouched to avoid blast radius on other surfaces — out of scope.)
- Replaced the `<Logo size={24} className="h-6 w-auto" />` render with a transparent `next/image` wordmark (`/lessgo-logo.png`, intrinsic 152×40, `className="h-[30px] w-auto"`, `priority`).
- No background container/box (the PNG is transparent; wrapper is just flex padding).

Before → After:
- **Background:** boxed/white square glyph → transparent wordmark on the app surface (`#fafafb`), no box.
- **Size:** 24×24 square (h-6 = 24px) → wordmark at **height 30px, width auto** (~114px wide), a balanced, legible mark in the 244px sidebar. (Design spec is 24px; bumped to 30px per founder "too small".)

---

## B12 (D3) — welcome/center block too small

Purely visual sizing in `DashboardEmptyState.tsx`. Disabled input + segmented control (R17b) untouched — no state/behavior change.

| Element | Before | After |
|---|---|---|
| Welcome chip text | `text-[11px]`, `px-3 py-[5px]` | `text-[12.5px]`, `px-3.5 py-[6px]` |
| Chip icon (`rocket_launch`) | `size={15}` | `size={17}` |
| Heading `<h1>` | `mt-4 max-w-[620px] text-[34px] leading-[1.12] tracking-[-1px]` | `mt-6 max-w-[760px] text-[46px] leading-[1.08] tracking-[-1.4px]` |
| Supporting `<p>` | `mt-3 max-w-[520px] text-[14.5px] leading-[1.5]` | `mt-4 max-w-[600px] text-[17px] leading-[1.55]` |
| Prompt card top margin | `mt-7` | `mt-9` |

Result: larger, more prominent hero headline + support copy with more breathing room above the (unchanged) prompt card.

---

## Tests
- `npx tsc --noEmit`: clean except the single known pre-existing error `src/app/page.tsx(6,26): TS2307 … @/assets/images/founder.jpg` (unrelated, per instructions).
- No unit test added — all three changes are cosmetic/copy. For B13 the e2e string update is the regression guard (Playwright not run per instructions).

## Deviations
- B11: chose to render the wordmark directly in `AppSidebar` via `next/image` rather than editing the shared `Logo` component, to keep blast radius inside the dashboard scope (shared `Logo` is used on other surfaces not in this phase). Logo height set to 30px (design spec = 24px) to satisfy the "too small" complaint.

## Open risks
- `public/lessgo-logo.png` is a raster PNG (1895×500); at 30px height it is well within its native resolution, so no upscaling blur. If a future design wants a crisp SVG wordmark, swap the asset.
- Shared `Logo` (`/logo.svg`) is now unused by the dashboard sidebar but may still be referenced elsewhere; left intact.
