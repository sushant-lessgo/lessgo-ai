// lib/sidebarPlan.ts — pure display helper for the dashboard sidebar plan widget.
//
// A signed-in user with NO UserPlan row is by definition FREE (createDefaultPlan
// always makes FREE), so the sidebar should default to FREE rather than greying
// out. This helper does DISPLAY defaulting only — it never touches entitlement or
// writes any state. Kept prisma-free (imports only planConfigs) so it stays safe
// on any code path.

import { PLAN_CONFIGS, PlanTier } from '@/lib/planConfigs'
import type { SidebarPlan } from '@/components/dashboard/AppSidebar'

/**
 * Resolve the sidebar plan widget data. `tier` undefined → FREE default.
 * `used` is the caller-supplied published-page count.
 */
export function resolveSidebarPlan(tier: PlanTier | undefined, used: number): SidebarPlan {
  const config = PLAN_CONFIGS[tier ?? PlanTier.FREE]
  return { planName: config.name, used, limit: config.limits.publishedPages }
}
