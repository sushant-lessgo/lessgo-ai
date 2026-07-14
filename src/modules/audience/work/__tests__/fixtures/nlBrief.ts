// src/modules/audience/work/__tests__/fixtures/nlBrief.ts
// ============================================================================
// NL-PRIMARY KUNDIUS FIXTURE (work-copy-engine phase 7 — the Dutch language pass).
//
// SAME real Kundius facts as `kundiusBrief.ts` (identity, the FOUR priced groups
// EUR 500/350/250/100, dreamClient, empty praise, contact method) — the ONLY
// change is the PRIMARY LANGUAGE: `languages: ['nl']` (Dutch). This exercises
// whether the copy engine writes EVERY string in Dutch when the primary language
// is NL — the AC-6 gate ("NL-primary Brief → NL copy throughout").
//
// Why a separate fixture (not a param on kundiusBrief): the phase-4 EN golden is
// founder-APPROVED and must stay byte-identical; the NL pass runs off its OWN
// fixture so the EN capture path and its committed golden are never disturbed.
//
// ── ABOUT-TEXT HARVEST (Dutch) ───────────────────────────────────────────────
//   The harvested old-site about paragraph is already Dutch — here it doubles as
//   BOTH the tone reference AND a natural fit for the NL output language. It is
//   still a REFERENCE only (never copied verbatim, never a source of new claims).
// ============================================================================

import type { Brief } from '@/types/brief';
import type { WorkFacts } from '@/lib/schemas/workFacts.schema';
import type { WorkProfessionRow } from '@/modules/audience/work/voice';
import {
  kundiusWorkFacts,
  kundiusAboutHarvest,
  kundiusProfessionRow,
} from './kundiusBrief';

/**
 * NL-primary Kundius work facts. Identical to `kundiusWorkFacts` EXCEPT
 * `languages: ['nl']` (Dutch primary). Same groups/prices, dream client, empty
 * praise, contact method. Used by the phase-7 NL golden capture to prove the
 * engine emits Dutch throughout.
 */
export const nlWorkFacts: WorkFacts = {
  ...kundiusWorkFacts,
  // Slot 8 — content language: NL primary (the whole site is written in Dutch).
  languages: ['nl'],
};

/** Dutch about-text harvest (tone reference; re-exported for the NL harness). */
export const nlAboutHarvest = kundiusAboutHarvest;

/** Business-type row (only `.key` is read by the engine). */
export const nlProfessionRow: WorkProfessionRow = kundiusProfessionRow;

/**
 * The full Brief wrapping the NL-primary Kundius work facts. Same as
 * `kundiusBrief` with `locales: ['nl']` and `facts.work.languages = ['nl']`.
 */
export const nlBrief: Brief = {
  businessType: 'photographer',
  copyEngine: 'work',
  facts: { work: nlWorkFacts },
  locales: ['nl'],
};
