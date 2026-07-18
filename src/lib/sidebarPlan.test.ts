import { describe, it, expect } from 'vitest'
import { PlanTier } from '@/lib/planConfigs'
import { resolveSidebarPlan } from '@/lib/sidebarPlan'

describe('resolveSidebarPlan', () => {
  it('defaults a missing tier (no UserPlan row) to FREE', () => {
    // B18: a signed-in user with no row is by definition FREE, not "— plan".
    expect(resolveSidebarPlan(undefined, 0)).toEqual({
      planName: 'Free',
      used: 0,
      limit: 1,
    })
  })

  it('resolves an explicit PRO tier', () => {
    expect(resolveSidebarPlan(PlanTier.PRO, 2)).toEqual({
      planName: 'Pro',
      used: 2,
      limit: 3,
    })
  })
})
