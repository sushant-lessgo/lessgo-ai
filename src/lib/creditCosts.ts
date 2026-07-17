// lib/creditCosts.ts - Prisma-free credit-cost constants.
//
// ⚠️ INVARIANT: this module MUST stay free of prisma, logger, and any server-only
// import — it is imported by CLIENT components and by the Playwright runner via a
// RELATIVE path. For the same reason it MUST NOT use `@/` path aliases (the
// Playwright/node import of this file does not resolve tsconfig aliases).
//
// `creditSystem.ts` re-exports CREDIT_COSTS, so all existing importers of
// `@/lib/creditSystem` keep working unchanged.

// Credit costs for different operations
export const CREDIT_COSTS = {
  FULL_PAGE_GENERATION: 10,
  SECTION_REGENERATION: 2,
  ELEMENT_REGENERATION: 1,
  FIELD_INFERENCE: 1,
  FIELD_VALIDATION: 0, // Free operation
  // V2 Generation system
  UNDERSTAND: 1,
  IVOC_RESEARCH: 3, // Only charged when Tavily called (cache hits = 0)
  STRATEGY_GENERATION: 2,
  UIBLOCK_SELECT: 1,
  GENERATE_COPY: 3,
  // Onboarding website import (fetch + one extraction call). Net-neutral vs
  // typing manually since it replaces the UNDERSTAND charge on the import path.
  SCRAPE_WEBSITE: 1,
  // Legal pages
  PRIVACY_POLICY_GENERATION: 2,
  // Cold outreach: prospect scrape (fetch + one extraction call). Charged only on cache-miss/stale.
  OUTREACH_SCRAPE: 1,
  // Lead reply (dashboard "Draft reply"): one gated AI call, charged only on a successful draft.
  // (main's lead-reply track added this to creditSystem.ts; relocated here on the
  // billing-beta merge so the prisma-free re-export carries it — see creditSystem.ts.)
  LEAD_REPLY: 1,
} as const;

// Operation keys derived from the cost table.
export type CreditOperation = keyof typeof CREDIT_COSTS;
