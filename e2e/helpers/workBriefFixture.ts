// e2e/helpers/workBriefFixture.ts
// ============================================================================
// WORK_BRIEF_FIXTURE — the seeded work brief the journey e2e resumes from.
//
// ── WHY A FIXTURE AND NOT THE REAL ENTRY (decision 9 / landmine 13) ─────────
// Mock mode CANNOT classify work: `/api/v2/understand` returns the agency-shaped
// `ENTRY_DEMO_SIGNALS` fixture, and `understand`/`scrape-website` are OUT OF
// SCOPE (ruled). So every journey e2e SEEDS a confirmed work brief through the
// REAL `/api/brief/confirm` serve gate and resumes the shell from there. The
// real classify → STEP 01 path is covered by Vitest + founder QA (P7) — it is
// deliberately never faked here.
//
// ── ZERO IMPORTS, ON PURPOSE ────────────────────────────────────────────────
// This module is loaded by BOTH runners:
//   • the Playwright runner (via `seedWorkBrief.ts`) — which has no `@/` alias,
//     so an app import would not resolve;
//   • Vitest (via `src/modules/wizard/work/workBriefFixture.test.ts`) — the
//     drift guard, where `@/` DOES resolve and the real schemas/gate run.
// It therefore imports nothing at all — not even `import type { Brief }` — and
// lives apart from `seedWorkBrief.ts`, which imports `expect` from
// `@playwright/test` as a VALUE (that would drag Playwright into Vitest).
//
// The fixture is UNTYPED here by necessity; the drift guard is what proves it
// still parses and still serves. If you edit it, run that test.
//
// ── WHAT THE SHAPE MUST HOLD (all pinned by the drift guard) ────────────────
//   • `BriefSchema.parse` succeeds (`/api/brief/confirm` rejects otherwise).
//   • `decideServe` ⇒ { outcome:'serve', templateId:'atelier',
//     audienceType:'service' } — work is an ENGINE, never an audience.
//   • `getWorkFacts(facts)` is non-null — every group carries a `kind` and a
//     valid price, so STEP 05 generation has a runnable bag (landmine 6).
//
// `classificationSource:'lookup'` + `tiebreaker:'none'` (NOT the
// 'portfolio-is-proof' tiebreaker) because photographer is a KNOWN businessType:
// engine resolution is a config lookup, and the gate's source-gated rungC
// gallery probe stays out of the path.
// ============================================================================

export const WORK_BRIEF_FIXTURE = {
  businessType: 'photographer',
  // work = ENGINE. The SERVED project is audienceType 'service' + templateId
  // 'atelier' (TEMPLATE_AUDIENCE) — there is no 'work' audience.
  copyEngine: 'work',
  category: 'photography',
  facts: {
    entry: {
      rawInput: 'documentary wedding photographer in Amsterdam',
      resolvedEngine: 'work',
      classificationSource: 'lookup',
      tiebreaker: 'none',
      platformNeeds: 'none',
      summary: 'Documentary wedding photography',
      businessName: 'Kundius Studio',
      offerings: ['Wedding day coverage', 'Engagement session'],
      audiences: ['Couples getting married'],
      categories: ['photography', 'weddings'],
      outcomes: [],
      deliveryModel: 'in-person',
      offer: 'Check availability for your date',
      oneLiner: 'Documentary wedding photography in Amsterdam',
      testimonials: [],
    },
    // PRE-EMBEDDED `facts.work` — what `seedWorkFactsFromEntry` produces at
    // confirm on the real path. Embedded here so the seeded project has the rail
    // + generation minimum without running STEP 01. Every group is `kind`-valid
    // with a valid price.
    work: {
      identity: {
        name: 'Kundius Studio',
        descriptor: 'Documentary wedding photography',
      },
      groups: [
        { name: 'Wedding day coverage', kind: 'category', price: { mode: 'on-request' } },
        { name: 'Engagement session', kind: 'category', price: { mode: 'on-request' } },
      ],
    },
  },
  proofAvailable: [],
  socialProfiles: [],
  // Classify's unconfirmed hint shape (mode + empty pages) — NOT a confirmed
  // structure, so wizard hydrate treats it exactly as a fresh classify would.
  structure: { mode: 'multi', pages: [] },
  designStyleHint: 'editorial-craft',
  confidence: 0.9,
};

/** The serve verdict the fixture MUST produce (asserted by seeder + guard). */
export const WORK_BRIEF_EXPECTED_SERVE = {
  outcome: 'serve',
  audienceType: 'service',
  templateId: 'atelier',
} as const;
