// src/modules/audience/work/__tests__/fixtures/kundiusBrief.ts
// ============================================================================
// REAL KUNDIUS FACTS (phase-4 gate, 2026-07-14) — founder-supplied.
// These are Kristina Kundius's actual Brief facts as given at the phase-4 gate,
// EXCEPT two documented judgment mappings (both flagged inline + in the audit):
//   1. establishment: founder said "in-between" (neither new nor established);
//      the schema enum is new|established → mapped to `established` (a practicing
//      graduate professional targeting enterprise). See comment on the slot.
//   2. Event photography is priced €100 PER HOUR; WorkPrice has no hourly mode,
//      so it is represented as `exact` 100 with the "per hour" nuance carried in
//      the group name. See comment on that group.
// ============================================================================
//
// A Kundius-shaped WorkFacts / Brief fixture: a commercial photographer (also
// weddings + family — identity breadth only, NOT priced groups) targeting
// enterprise brand clients. Used by the phase-4 golden harness
// (`captureGoldenWork.test.ts`) to exercise the work copy engine end-to-end for
// the HOME page only.
//
// ── BREADTH vs PRICED GROUPS ─────────────────────────────────────────────────
//   Weddings & family photography are identity-level breadth ONLY. They are NOT
//   priced work groups and carry NO price/group here — do not invent one. The
//   four `groups` below are the ONLY priced services.
//
// ── ABOUT-TEXT HARVEST (no WorkFacts slot) ───────────────────────────────────
//   The WorkFacts contract has NO about-text slot (slots: identity, groups,
//   establishment, dreamClient, praise, contactMethod, languages). The harvested
//   old-site about paragraph therefore travels as SiteContext tone reference,
//   NOT as a fact. It is exported separately (`kundiusAboutHarvest`) so the
//   harness can feed it to the copy prompt as a tone-only `siteContextBlock`. It
//   is Dutch (tone harvest only) — the OUTPUT language is EN (languages: ['en']).
//   It is a REFERENCE, never copied verbatim, and never a source of new claims.
// ============================================================================

import type { Brief } from '@/types/brief';
import type { WorkFacts } from '@/lib/schemas/workFacts.schema';
import type { WorkProfessionRow } from '@/modules/audience/work/voice';

/**
 * The Kundius work facts (`brief.facts.work`). Founder's real Kundius facts as of
 * the phase-4 gate (2026-07-14). €100–500 EUR pricing with no premium keywords in
 * the dream client and empty praise, so `derivePricePosition` classifies this as
 * `'middle'` (not premium) — the fixture deliberately exercises the middle band +
 * the empty-praise proof-omission path.
 */
export const kundiusWorkFacts: WorkFacts = {
  // Slot 1 — identity: commercial photographer offering brand headshots for a
  // company's brand (also weddings + family — identity breadth, not priced).
  identity: {
    name: 'Kristina Kundius',
    location: 'Netherlands',
    reach: 'Portfolio headshots for your company brand',
  },

  // Slot 4 — establishment. Founder said "in-between" (not new, not established).
  // The schema enum is new|established; mapped to `established` as a JUDGMENT
  // CALL — a practicing graduate professional targeting enterprise clients reads
  // closer to established than to brand-new. Flagged in the phase-4 audit.
  establishment: 'established',

  // Slot 5 — dream client (verbatim founder answer).
  dreamClient: 'Enterprise customers, big corporates',

  // Slot 6 — verbatim praise. Founder provided NONE → empty. This deliberately
  // exercises the empty-praise fabrication-strip + graceful proof omission. Do
  // NOT invent testimonials.
  praise: [],

  // Slot 7 — conversion mechanism. Founder offers form + WhatsApp + email; the
  // contactMethod enum is a single value (whatsapp|booking|form) → `form` (the
  // richest multi-field capture; WhatsApp/email are secondary channels).
  contactMethod: 'form',

  // Slot 8 — content language: EN primary (the Dutch about-text is tone-only).
  languages: ['en'],

  // Slot 2 — groups (= what you sell). Price (slot 3) lives on each group. These
  // FOUR are the only priced services; weddings/family are breadth, not groups.
  groups: [
    {
      name: 'Full brand package',
      kind: 'category',
      price: { mode: 'exact', amount: 500, currency: 'EUR' },
      photos: [{ id: 'brand-cover', alt: 'Full brand package cover', cover: true }],
    },
    {
      name: 'Brand photoshoot',
      kind: 'category',
      price: { mode: 'exact', amount: 350, currency: 'EUR' },
      photos: [{ id: 'shoot-cover', alt: 'Brand photoshoot cover', cover: true }],
    },
    {
      name: 'Portrait & business shoot',
      kind: 'category',
      price: { mode: 'exact', amount: 250, currency: 'EUR' },
      photos: [{ id: 'portrait-cover', alt: 'Portrait & business shoot cover', cover: true }],
    },
    {
      // €100 PER HOUR. WorkPrice has no hourly mode, so the amount is carried as
      // `exact` 100 and the "per hour" nuance lives in the group NAME (the only
      // faithful slot available). Flagged in the phase-4 audit.
      name: 'Event photography (per hour)',
      kind: 'category',
      price: { mode: 'exact', amount: 100, currency: 'EUR' },
      photos: [{ id: 'event-cover', alt: 'Event photography cover', cover: true }],
    },
  ],
};

/**
 * Old-site about-text harvest (REAL, Dutch — tone reference ONLY). There is NO
 * WorkFacts slot for this — it is fed to the copy prompt as a `siteContextBlock`.
 * Never copied verbatim; never a source of new claims; the OUTPUT language is EN.
 */
export const kundiusAboutHarvest =
  'Hallo, mijn naam is Kristina en ik ben een professionele fotograaf gevestigd in Nederland. Ik ben afgestudeerd aan de universiteit met een diploma in Kunstgeschiedenis, waar mijn passie voor schoonheid en esthetiek is begonnen.';

/** Business-type row for the fixture (only `.key` is read by the engine). */
export const kundiusProfessionRow: WorkProfessionRow = { key: 'photographer' };

/**
 * The full Brief wrapping the Kundius work facts. `businessType: 'photographer'`
 * resolves the profession; `facts.work` carries the WorkFacts (read via
 * `getWorkFacts`). Real founder facts as of the phase-4 gate (2026-07-14).
 */
export const kundiusBrief: Brief = {
  businessType: 'photographer',
  copyEngine: 'work',
  facts: { work: kundiusWorkFacts },
  locales: ['en'],
};
