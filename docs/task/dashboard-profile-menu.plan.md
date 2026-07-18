# dashboard-profile-menu — implementation plan

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\dashboard-profile-menu`
- **Branch:** `feature/dashboard-profile-menu` (verify `git branch --show-current` before any edit; hard-stop on mismatch)
- **Spec:** `docs/task/dashboard-profile-menu.spec.md`
- **Tier: standard** — plan-review loop SKIPPED; per-phase impl-review SKIPPED; ONE impl-review over the whole diff at the end.

## Overview

There is currently no way to log out anywhere in the app (P0). The sidebar's static bottom
user-card in `AppSidebar.tsx` becomes a single clickable trigger that opens an **upward** popover
(handoff §2e): Settings · Billing · Appearance (greyed + why-tooltip) · Log out (red, Clerk
`signOut` → `/sign-in`). The standalone settings-gear folds into the popover; the dead `UserButton`
import in the root layout is dropped. All app-chrome, `app-*` tokens only, built on the existing
frozen popover foundation (`AppPopoverMenu` layer) — no new primitives.

## Progress log

- phase 1 profile popover + logout: done (commit b856934c, impl-review loops 1 → ship)

## E2E decision (deterministic-QA rule)

**No new Playwright spec — deliberate.** Reasons:
1. The popover lives behind Clerk auth on `/dashboard`; the only authed e2e context is the shared
   session from `auth.setup.ts` used by `publish.spec.ts`. An actual logout click **destroys that
   shared session** (serial worker, shared storage state) and poisons the suite.
2. Popover-open + link-href wiring without the logout click is low-value theatre (see
   "e2e-gate-was-theatre" lesson from dashboard S2).

Coverage instead: tsc/test:run/build/lint gate + the **founder logout click-test (P0 human gate)**
+ the manual a11y checklist in phase 1 verification.

---

## Phase 1 — profile popover + logout (single phase; spec says small/bounded)

### Files touched

- `src/components/dashboard/AppSidebar.tsx` — replace static profile row (:180-206) with trigger + popover
- `src/app/layout.tsx` — remove dead `UserButton` from the `@clerk/nextjs` import (:31) ONLY; leave everything else on that import line and lines :27-30 untouched

*(No other files. No new component files — popover is built inline in `AppSidebar.tsx` from
existing primitives, keeping the §E shell one file.)*

### Steps

1. **Imports in `AppSidebar.tsx`** (already `'use client'`): add
   `Popover`, `PopoverTrigger` from `src/components/ui/popover`;
   `AppPopoverMenu`, `AppPopoverItem`, `AppPopoverSeparator` (app-chrome layer — same module the
   reference `GlobalAppHeader.tsx` uses; verify exact import path from that file at implement time);
   `Coming` from `src/components/ui/coming`; `useClerk` from `@clerk/nextjs`;
   `useRouter` from `next/navigation`; `useState`.
   Do NOT touch `dropdown-menu.tsx` (stock tokens) and do NOT edit `popover.tsx` (frozen).
2. **Trigger** — replace the static row `<div>` (:180-206) with ONE `<button type="button">` wrapped
   in `PopoverTrigger asChild` inside a controlled `Popover` (`open`/`onOpenChange` + `useState`,
   mirroring `GlobalAppHeader.tsx:93,107`). Button content = existing avatar block **unchanged**
   (keep the plain `<img>` + its eslint-disable comment + `bg-app-tint` fallback — Clerk host isn't
   in next.config images) + name/email block **unchanged** + a chevron `AppIcon` on the right
   (per handoff; verify the available AppIcon chevron name at implement time — use the up/down
   chevron `GlobalAppHeader` or other app-chrome uses; flip or pick per open state if trivial,
   otherwise a static chevron is acceptable).
   - **Delete the standalone settings-gear `Link`** (:199-205) and its R7 comment; update the
     header-comment convention block (:11-26) if R7 references the gear.
   - Trigger styling: keep existing row geometry (`flex items-center gap-2.5 px-2 py-1`), add
     `w-full text-left rounded-md hover:bg-app-hairline transition-colors` (app-* tokens only) and
     an `aria-label="Account menu"` (name/email inside also give it an accessible name — fine).
   - `Link` import stays (still used at :171); `AppIcon` stays (nav rows).
3. **Popover content** — `AppPopoverMenu` with `side="top"`, `align="start"`, `sideOffset={8}`,
   `width={224}` (Radix `Content` props pass through; portal + app tokens are built into the
   primitive). Items in order:
   1. `AppPopoverItem` **Settings** — `icon="settings"`, `onClick`: close menu + `router.push('/dashboard/settings')`.
   2. `AppPopoverItem` **Billing** — billing icon (verify AppIcon name, e.g. `credit-card`; if none fits, omit icon rather than invent), `onClick`: close + `router.push('/dashboard/billing')`.
   3. **Appearance (greyed)** — NOT a `<button>`: `<Coming what="appearance settings">` wrapping a
      `<span>` that carries `AppPopoverItem` row geometry via a shared class — copy the exact
      `COMING_ROW` const pattern from `GlobalAppHeader.tsx:62` (usages :118,123,127,170). `Coming`
      supplies `.app-coming`, `aria-disabled`, `tabIndex={-1}`, click-swallow, and the
      `AppTooltip` "Coming soon — appearance settings".
   4. `AppPopoverSeparator`.
   5. `AppPopoverItem` **Log out** — `destructive` (red via `text-app-delete hover:bg-app-delete-bg`,
      already baked into the primitive), logout icon (verify AppIcon name, e.g. `log-out`),
      `onClick`: `signOut({ redirectUrl: '/sign-in' })` from `useClerk()` (net-new usage; client
      Clerk hooks precedent: `NewSiteButton.tsx`, `CreditBadge.tsx`). Fire-and-forget is fine —
      Clerk navigates away; optionally guard double-click with a local `isSigningOut` flag, no
      spinner UI needed.
4. **Single-instance a11y** — exactly ONE `Popover` root, content rendered only via the primitive's
   built-in portal; no conditional second mount, no duplicate tree (editor-modals double-mount
   trap). Radix gives keyboard open (Enter/Space), Esc-close, focus into content and return-to-trigger.
5. **`src/app/layout.tsx`** — remove `UserButton` from the `@clerk/nextjs` import list at :31
   (grep-confirmed dead). No other change in that file.
6. **Guardrails:** `app-*` tokens only in everything added (never stock Tailwind color keys — they
   feed template rendering); do NOT touch the pre-existing raw hexes on the `<aside>` (:91); no
   change to `SidebarProfile` type (:35-39) or `dashboard/layout.tsx` prop plumbing — existing data
   is sufficient; no edits to `popover.tsx`/`coming.tsx`/`tooltip.tsx` (frozen foundation).

### Verification

Automated (all must be green — big-bang batch rule):
- `npx tsc --noEmit`
- `npm run test:run`
- `npm run lint` (also proves the removed `UserButton` import broke nothing)
- `npm run build`

Manual (`npm run dev`, signed-in dashboard) — maps 1:1 to acceptance criteria:
- [ ] User-card is clickable; popover opens **upward**; standalone gear gone.
- [ ] Order: Settings · Billing · Appearance (greyed + "Coming soon" tooltip, not clickable) · Log out (red, icon).
- [ ] Settings → `/dashboard/settings`; Billing → `/dashboard/billing`; menu closes on navigate.
- [ ] Log out → session ends → lands on `/sign-in`; re-login works.
- [ ] Sidebar identical on several dashboard screens (sites list, billing, settings) — §E shell intact.
- [ ] a11y: Tab to card → Enter opens; Esc closes + focus returns to trigger; devtools a11y tree
      shows a SINGLE menu/dialog node (no double-mount).
- [ ] No stock-Tailwind color keys in the diff (eyeball the diff).

### 🚧 Human gates

- **HUMAN GATE (P0): founder logout click-test** — open popover → Log out → actually signed out →
  `/sign-in` → re-login works. This is the reason the spec exists; do not merge without it.
- **Merge gate:** visual sign-off vs handoff §2e (popover match + sidebar unchanged on all screens)
  happens at the merge human-gate, per pipeline rules.

---

## Post-phase

- One impl-review over the whole diff (standard tier), then commit on `feature/dashboard-profile-menu`.
- Merge to main = human gate; rides the big-bang batch (unpushed).

## Assumptions / risks

- `AppPopoverMenu` layer lives where `GlobalAppHeader.tsx` imports it from — implementer confirms
  the path there (scout gave the component names + reference usage, not the module path).
- AppIcon set may lack a billing/logout/chevron glyph — rule: pick the closest existing name;
  omit the icon rather than adding a new glyph (icon additions = out of scope).
- Handoff §2e chevron direction/behavior is minor visual detail — settle at the visual merge gate.

## Unresolved questions

1. Chevron static vs flips with open state — either ok?
2. If AppIcon lacks billing/logout glyphs: omit icon acceptable, or add glyphs?
