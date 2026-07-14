// src/modules/audience/work/__tests__/fixtures/kundiusBrief.ts
// ============================================================================
// REPRESENTATIVE PLACEHOLDER FACTS — founder must replace with Kundius's real
// Brief before the golden read is authoritative (see plan Phase 4).
// ============================================================================
//
// A Kundius-shaped WorkFacts / Brief fixture: an ESTABLISHED, PREMIUM,
// bilingual (EN primary + NL) photography studio. Used by the phase-4 golden
// harness (`captureGoldenWork.test.ts`) to exercise the work copy engine
// end-to-end for the HOME page only.
//
// ── HOW TO DROP IN REAL FACTS ────────────────────────────────────────────────
//   Edit the VALUES below only — the SHAPE is the frozen WorkFacts contract and
//   must not change. Replace the group names/prices, the dreamClient line, the
//   verbatim `praise` strings, and `kundiusAboutHarvest` (the old-site about-text
//   paragraph) with Kundius's real material. Keep `establishment: 'established'`
//   and premium-signal pricing so the fixture keeps deriving `'premium'` (the
//   pilot voice depends on it — plan N1 / phase-1 assertion).
//
// ── ABOUT-TEXT HARVEST (no WorkFacts slot) ───────────────────────────────────
//   The WorkFacts contract has NO about-text slot (slots: identity, groups,
//   establishment, dreamClient, praise, contactMethod, languages). A harvested
//   old-site about paragraph therefore travels as SiteContext tone reference
//   (server-fed via sourceUrl in production), NOT as a fact. It is exported here
//   separately (`kundiusAboutHarvest`) so the harness can feed it to the copy
//   prompt as a tone-only `siteContextBlock`. It is a REFERENCE, never copied
//   verbatim, and never a source of new claims.
// ============================================================================

import type { Brief } from '@/types/brief';
import type { WorkFacts } from '@/lib/schemas/workFacts.schema';
import type { WorkProfessionRow } from '@/modules/audience/work/voice';

/**
 * The Kundius work facts (`brief.facts.work`). REPRESENTATIVE PLACEHOLDER —
 * premium established photography studio. Premium signals (on-request +
 * high stated amount + a discerning/editorial dream client + premium praise)
 * make `derivePricePosition` classify this as `'premium'`.
 */
export const kundiusWorkFacts: WorkFacts = {
  // Slot 1 — identity (who + where + reach).
  identity: {
    name: 'Studio Kundius',
    location: 'Amsterdam, Netherlands',
    reach: 'Available across Europe and for destination commissions',
  },

  // Slot 4 — established BRANCH (real body of work + earned praise).
  establishment: 'established',

  // Slot 5 — dream client (premium-signalling: discerning / editorial / timeless).
  dreamClient:
    'Discerning couples and editors who value timeless, editorial imagery and are ready to invest in photographs that will still feel considered in twenty years.',

  // Slot 6 — verbatim praise (three real quotes; contract max is 3, so this
  // fixture sits exactly at the clamp boundary — a useful edge for the golden).
  praise: [
    'Studio Kundius captured our wedding with such quiet elegance — every frame feels timeless. Worth every euro.',
    'The most considered, professional photographer we have ever worked with. The images are art we live with every day.',
    'From the first call to the final gallery, an absolute joy. Refined, unhurried, and impeccable.',
  ],

  // Slot 7 — conversion mechanism (one-tap confirm, never guessed).
  contactMethod: 'form',

  // Slot 8 — content languages, EN primary + NL.
  languages: ['en', 'nl'],

  // Slot 2 — groups (= what you sell). Price (slot 3) lives on each group.
  groups: [
    {
      name: 'Weddings',
      kind: 'category',
      // Premium signal: a high stated "from" amount.
      price: { mode: 'from', amount: 4500, currency: 'EUR' },
      photos: [
        { id: 'wed-cover', alt: 'Wedding cover frame', cover: true },
        { id: 'wed-2', alt: 'Ceremony detail' },
        { id: 'wed-3', alt: 'Golden-hour portrait' },
      ],
    },
    {
      name: 'Editorial & Campaigns',
      kind: 'story',
      // Premium signal: on-request / high-touch commission pricing.
      price: { mode: 'on-request' },
      photos: [
        { id: 'ed-cover', alt: 'Editorial cover frame', cover: true },
        { id: 'ed-2', alt: 'Campaign still' },
      ],
    },
    {
      name: 'Portraits',
      kind: 'category',
      price: { mode: 'exact', amount: 1200, currency: 'EUR' },
      photos: [{ id: 'por-1', alt: 'Studio portrait' }],
    },
  ],
};

/**
 * Old-site about-text harvest (REPRESENTATIVE PLACEHOLDER). There is NO
 * WorkFacts slot for this — it is a SiteContext tone reference only, fed to the
 * copy prompt as a `siteContextBlock`. Never copied verbatim; never a source of
 * new claims. Replace with the real harvested paragraph.
 */
export const kundiusAboutHarvest =
  'I started photographing the people I loved before I ever called it work. Twelve years on, I still shoot the same way — patiently, close, waiting for the true moment instead of arranging it. I keep the number of weddings I take each year small on purpose, so every couple gets the same care. What I care about is not the trend of the day but the frame you will still want on the wall long after.';

/** Business-type row for the fixture (only `.key` is read by the engine). */
export const kundiusProfessionRow: WorkProfessionRow = { key: 'photographer' };

/**
 * The full Brief wrapping the Kundius work facts. `businessType: 'photographer'`
 * resolves the profession; `facts.work` carries the WorkFacts (read via
 * `getWorkFacts`). REPRESENTATIVE PLACEHOLDER — see header.
 */
export const kundiusBrief: Brief = {
  businessType: 'photographer',
  copyEngine: 'work',
  facts: { work: kundiusWorkFacts },
  locales: ['en', 'nl'],
};
