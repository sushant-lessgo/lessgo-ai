// Value pins for the prisma-free config modules extracted in billing-beta phase 1.
// The extraction was a pure move: these pins exist so a future edit to the moved
// values is a CONSCIOUS act rather than a silent money-facing drift.
//
// Scope note (de-dupe): PLAN_CONFIGS tier values (FREE credits:20, PRO price
// 29/24, limits, feature flags) are ALREADY pinned in `planManager.test.ts`
// ("PLAN_CONFIGS pricing v2 numbers", :148-185) — and planManager re-exports this
// module, so those pins cover planConfigs.ts too. Not duplicated here. This file
// pins CREDIT_COSTS (previously unpinned anywhere) plus the two config facts that
// look like bugs and are not, so nobody "fixes" them.
import { describe, it, expect } from 'vitest';

import { CREDIT_COSTS } from './creditCosts';
import { PLAN_CONFIGS, PlanTier, getPlanConfig } from './planConfigs';

describe('CREDIT_COSTS values (pinned)', () => {
  it('pins the costs surfaced in the UI', () => {
    expect(CREDIT_COSTS.FULL_PAGE_GENERATION).toBe(10);
    expect(CREDIT_COSTS.SECTION_REGENERATION).toBe(2);
    expect(CREDIT_COSTS.ELEMENT_REGENERATION).toBe(1);
    expect(CREDIT_COSTS.SCRAPE_WEBSITE).toBe(1);
    expect(CREDIT_COSTS.UNDERSTAND).toBe(1);
  });

  it('pins the remaining backend costs', () => {
    expect(CREDIT_COSTS.FIELD_INFERENCE).toBe(1);
    expect(CREDIT_COSTS.FIELD_VALIDATION).toBe(0);
    expect(CREDIT_COSTS.IVOC_RESEARCH).toBe(3);
    expect(CREDIT_COSTS.STRATEGY_GENERATION).toBe(2);
    expect(CREDIT_COSTS.UIBLOCK_SELECT).toBe(1);
    expect(CREDIT_COSTS.GENERATE_COPY).toBe(3);
    expect(CREDIT_COSTS.PRIVACY_POLICY_GENERATION).toBe(2);
    expect(CREDIT_COSTS.OUTREACH_SCRAPE).toBe(1);
  });
});

describe('deliberate config divergences (do NOT "fix")', () => {
  it('FREE credits:20 diverges from DB creditsLimit=0 by design (pool-backed)', () => {
    expect(PLAN_CONFIGS[PlanTier.FREE].credits).toBe(20);
  });

  it('PRO price.annual is a PER-MONTH figure (24), not the $290/yr number', () => {
    // $290/yr lives ONLY in pricing/page.tsx. Nothing in-app may render 24 as an
    // annual price, and 290 must not be invented here.
    expect(PLAN_CONFIGS[PlanTier.PRO].price.annual).toBe(24);
    expect(PLAN_CONFIGS[PlanTier.PRO].price.monthly).toBe(29);
  });
});

describe('getPlanConfig', () => {
  it('returns the config for each tier', () => {
    for (const tier of Object.values(PlanTier)) {
      expect(getPlanConfig(tier).tier).toBe(tier);
    }
  });
});
