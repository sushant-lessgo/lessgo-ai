# B18 (D2) — dashboard rail plan badge shows "—" instead of "Free plan / 0 of 1 sites"

## Files changed
- `src/lib/sidebarPlan.ts` (created — pure helper)
- `src/lib/sidebarPlan.test.ts` (created — regression test)
- `src/app/dashboard/layout.tsx` (modified — use helper, comment updated)

## Root cause
`dashboard/layout.tsx` computed the sidebar `plan` prop with a deliberately
side-effect-free `prisma.userPlan.findUnique` (NOT get-or-create). When a user had
no UserPlan row, `config = userPlan ? PLAN_CONFIGS[...] : undefined` → `if (config)`
false → `plan` stayed `undefined` → `AppSidebar` rendered the em-dash placeholders.
But a signed-in user with no row is by definition FREE (`createDefaultPlan` always
makes FREE), so the display should default to FREE.

## Change
1. Created `resolveSidebarPlan(tier, used)` — pure helper. `tier ?? PlanTier.FREE`,
   returns the `SidebarPlan` shape `{ planName, used, limit }` from `PLAN_CONFIGS`.
   Imports `PLAN_CONFIGS` + `PlanTier` from the prisma-free `@/lib/planConfigs` and
   reuses the `SidebarPlan` type exported by `AppSidebar` (no redefinition).
2. In `layout.tsx`, replaced the `config = ... : undefined; if (config) {...}` block
   with `plan = resolveSidebarPlan(userPlan?.tier as PlanTier | undefined, used)`, so
   `plan` is ALWAYS set for a signed-in user. Dropped the now-unused `PLAN_CONFIGS`
   import (kept `PlanTier` for the cast). Updated the load-bearing comment to describe
   the FREE-default behavior instead of "No row → plan stays undefined → widget greys".

## Read stays side-effect-free
Confirmed: the `prisma.userPlan.findUnique({ where, select: { tier } })` read is
UNCHANGED — no switch to `getUserPlan`/get-or-create, no write. Only the mapping of
its result to display data changed. Entitlement is untouched (display defaulting only).
`AppSidebar.tsx` is unchanged — its `plan?`-optional em-dash path remains the genuine
unauthenticated fallback.

## Confirmed config values
FREE → name `Free`, `limits.publishedPages` = 1. PRO → name `Pro`, limit = 3.
Test expectations match the real `planConfigs.ts`.

## Tests
- `npx vitest run src/lib/sidebarPlan.test.ts` → 2 passed (undefined→Free/0/1, PRO→Pro/2/3).
  Fails pre-fix by construction (helper did not exist).
- `npx tsc --noEmit` → clean (no output).

## Open risks
None. Pure display default; entitlement and the read semantics are unchanged.
