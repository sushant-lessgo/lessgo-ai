---
tier: standard
tier-why: shared §E AppSidebar shell (visual ripple to all 12 dashboard screens) + Clerk signOut — low blast radius, but the shared-shell + auth touch earns one impl-review over the diff.
---

# dashboard-profile-menu (handoff 2e) — spec

## Problem / why
**There is currently no way to log out anywhere in the app (P0).** Root cause = a cross-track seam
gap: `editor-shell-redesign` removed the editor's avatar/UserButton on the founder ruling "logout
happens from the dashboard" (`GlobalAppHeader.tsx:347`), but the dashboard profile menu that holds
logout was scoped into the dashboard "later" tier and never built. Today `AppSidebar.tsx:180-206`
renders a **static** profile row — avatar `<img>` (not clickable) + name/email + a settings-gear
`Link`. No popover, no logout. `signOut` is called nowhere; `UserButton` is imported-but-never-
rendered in `layout.tsx`. Net: a signed-in user is stuck with no exit.

## Goal
Build the handoff **2e profile popover**: the sidebar's bottom user-card becomes clickable and opens
an upward popover with **Settings · Billing · Appearance · Log out**, restoring a working logout and
giving account actions their designed home. Matches the handoff visually; uses `app-*` chrome tokens.

## Scope OUT (non-goals)
- **2f full account-settings page** (profile/password/notifications/connected-apps/danger-zone) — the
  bigger "profile/account reskin", stays in the dashboard "later" tier. The popover's **Settings**
  item points at the **existing** `/dashboard/settings` (persona picker) as-is.
- **App-level theme/appearance system** — none exists (dashboard chrome is light-only). "Appearance"
  ships as a **greyed placeholder** with a why-tooltip (founder greyed-placeholder rule), NOT wired.
- **Editor logout** — stays removed (founder decision 8b); the dashboard is the logout home, this
  closes that loop.
- **Redesigning the sidebar** beyond turning the bottom user-card into the popover trigger.

## Constraints
- **Whole user-card is the trigger** (per handoff — chevron, popover opens *upward*). The current
  standalone settings-gear **folds into the popover** as the "Settings" item — no separate gear left.
- **Items (mirror the design, in order): Settings · Billing · Appearance · Log out.** Settings →
  `/dashboard/settings`; Billing → `/dashboard/billing` (both already exist); Appearance → greyed +
  why-tooltip; Log out → Clerk `signOut` → redirect to `/sign-in`, styled red w/ logout icon.
- **`AppSidebar` is the byte-identical §E shell** across all 12 dashboard screens — the popover must
  render identically everywhere and not disturb the existing layout/tokens. Use `app-*` tokens only
  (never a stock Tailwind key — those feed template rendering; see `src/components/ui/README.md`).
- **Reuse the foundation popover primitive** if one exists (Radix popover/dropdown in
  `src/components/ui/`); do not hand-roll or edit frozen foundation primitives.
- **a11y:** keyboard-openable, focus-trapped, Escape-closable, single dialog/menu in the a11y tree
  (avoid the double-mount trap that bit the editor modals).
- Rides the big-bang batch (unpushed). Re-green = tsc + test:run + build + lint.

## References
- `src/components/dashboard/AppSidebar.tsx:180-206` — the static profile row to convert into the
  trigger + popover (note the R7/R12/R15 greyed-control conventions in its header comment).
- Handoff `docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/Lessgo Dashboard.dc.html` §2e
  — the popover visuals (items, red Log out, chevron, upward popover). §2f = the OUT-of-scope page.
- `src/components/dashboard/AppSidebar.tsx` `DisabledNavItem` — the established greyed-control pattern
  to reuse for the greyed "Appearance" item.
- Clerk `signOut` (`@clerk/nextjs`) — the logout mechanism; `UserButton` import in `layout.tsx` is
  dead (scout: remove it if nothing else uses it).
- Existing foundation popover/dropdown primitive in `src/components/ui/` (scout to confirm which).

## Open exploration questions (scout)
- Which foundation primitive backs popovers/dropdowns in `src/components/ui/` (Radix?) — reuse it.
- Is `SidebarProfile` (name/email/avatarUrl) already the full data the popover needs, or is more
  required? (Looks sufficient.)
- Is `UserButton` in `layout.tsx` truly dead (only imported for Clerk appearance config) — safe to
  drop the import?
- Any existing app-chrome pattern for a "coming soon" tooltip to reuse for greyed Appearance.

## Candidate human gates
- **Logout works end-to-end** (founder click-test): open popover → Log out → session ends → lands on
  `/sign-in`; re-login works. This is the P0 the whole spec exists for.
- Visual sign-off that the popover matches 2e and the sidebar is unchanged on all screens.

## Acceptance criteria
- [ ] The sidebar user-card is clickable and opens an upward popover; the standalone settings-gear is
      gone (folded into the popover).
- [ ] Popover shows, in order: Settings · Billing · Appearance (greyed + why-tooltip) · Log out (red).
- [ ] **Log out ends the Clerk session and redirects to `/sign-in`** — a signed-in user can now exit.
- [ ] Settings → `/dashboard/settings`; Billing → `/dashboard/billing` (existing routes).
- [ ] Appearance is visibly disabled with a why-tooltip; not clickable.
- [ ] Popover renders identically across dashboard screens (shared §E shell intact); `app-*` tokens only.
- [ ] a11y: keyboard-openable, Escape-closable, focus managed, single menu in the a11y tree.
- [ ] tsc + test:run + build + lint green.

## Pilot / smallest slice
Single phase — small, bounded. Standard tier: (scout the popover primitive) → plan → implement →
one impl-review. Decision gate = founder clicks Log out and is actually signed out (the P0), and the
popover matches 2e.
