// src/modules/engines/workVocabulary.ts
// ============================================================================
// WORK BUYER-WORDS VOCABULARY (work-contract phase 4). SINGLE SOURCE.
//
// One vocabulary, read identically by the site plan, the editor labels, the
// reports and every email. INTERNAL section/element names (hero, proof, cta…)
// are NEVER shown to a user — this table is the only place they are translated
// into what the seller actually sees. A rename happens ONCE, here.
//
// ── RULES (workEndtoEnd.md §buyer-words) ────────────────────────────────────
//  1. Second person, about her site: "Your best work", not "Portfolio section".
//  2. Name what it does for the VISITOR, never what it's built from — no Hero,
//     Testimonial, CTA, Collection, Widget anywhere user-facing.
//  3. Her groups wear her OWN names (Weddings, Newborn); we only name containers.
//  4. Every name carries a one-line description — the description explains, so
//     names stay short.
//  5. Profession-adaptive words (shoot / project / piece / case study) come from
//     `professionWording` below (same layer that personalizes questions).
//
// ── DRAFT / HUMAN GATE ──────────────────────────────────────────────────────
//   Four names are DRAFTS awaiting the founder's pick at the merge gate — they
//   carry `flagged: true`: hero ("Your promise"), ctaButton ("Your action
//   button"), footer ("Page bottom"), logos ("Seen with / featured in").
//   Ship the draft; the gate confirms or renames (one edit here).
//
// ── FIREWALL (D5) ───────────────────────────────────────────────────────────
//   PURE DATA. Imports NOTHING at runtime — no react / stores / hooks / template
//   runtime, no templateId / skeletonId. Keyed by INTERNAL name strings and by
//   businessType KEY strings; it deliberately does NOT import `businessTypes`
//   (avoids a config↔vocab cycle). The phase-5 conformance test asserts key
//   alignment against `workSections` + `businessTypeKeys` instead.
// ============================================================================

/** One buyer-facing translation of an internal name. `flagged` = draft, gated. */
export interface WorkVocabEntry {
  /** What the seller sees — second person, visitor-benefit (rule 1 & 2). */
  userLabel: string;
  /** One-line explanation shown beside the label (rule 4). */
  description: string;
  /** Draft name awaiting the founder's merge-gate ruling. */
  flagged?: true;
}

/**
 * Internal name → buyer word. Keyed by INTERNAL name — one entry per work-core
 * `WorkSectionKey` (must + optional, incl. the proof shapes testimonials/logos/
 * results and workdetail) PLUS the non-section internals the table names
 * (featuredWork, ctaButton, map, socialLinks, menu). `logos`/`results` are both
 * an optional section AND a proof shape — one key covers both roles.
 */
export const workVocabulary: Record<string, WorkVocabEntry> = {
  // ── MUST sections ──
  header: {
    userLabel: 'Page top',
    description: 'your logo and menu at the top of every page',
  },
  hero: {
    userLabel: 'Your promise',
    description: 'the first thing visitors see',
    flagged: true,
  },
  work: {
    userLabel: 'Your work',
    description: 'everything you want shown, organized (groups wear your names)',
  },
  proof: {
    // Default proof shape = testimonials; shares its label.
    userLabel: 'What clients say',
    description: 'real praise, word for word',
  },
  packages: {
    userLabel: 'Packages & prices',
    description: 'what things cost, so buyers pre-qualify',
  },
  about: {
    userLabel: 'Your story',
    description: 'who you are and why you',
  },
  contact: {
    userLabel: 'How to reach you',
    description: 'the form or button that brings leads',
  },
  footer: {
    userLabel: 'Page bottom',
    description: 'the quiet essentials on every page',
    flagged: true,
  },

  // ── OPTIONAL sections ──
  results: {
    userLabel: 'Your results',
    description: 'the outcomes you have delivered, in numbers',
  },
  faq: {
    userLabel: 'Questions people ask',
    description: 'answers that remove doubts',
  },
  process: {
    userLabel: 'How it works',
    description: 'what happens after they reach out',
  },
  stats: {
    userLabel: 'Your numbers',
    description: 'proof in figures (projects shipped, years, clients)',
  },
  logos: {
    userLabel: 'Seen with / featured in',
    description: 'names that vouch for you',
    flagged: true,
  },
  team: {
    userLabel: 'Your team',
    description: 'the people behind the work',
  },
  workdetail: {
    userLabel: 'Project story',
    description: 'the full story behind one piece of work',
  },

  // ── Proof shapes (variants of the one `proof` section) ──
  testimonials: {
    userLabel: 'What clients say',
    description: 'real praise, word for word',
  },
  // NOTE: proof-shape `logos` and `results` reuse the section entries above.

  // ── Non-section internals the table names ──
  featuredWork: {
    userLabel: 'Your best work',
    description: 'the pieces that sell you, up front',
  },
  ctaButton: {
    userLabel: 'Your action button',
    description: 'the one thing each page asks visitors to do',
    flagged: true,
  },
  map: {
    userLabel: 'Where to find you',
    description: 'address, area you serve',
  },
  socialLinks: {
    userLabel: 'Your profiles',
    description: 'Instagram and friends',
  },
  menu: {
    userLabel: 'Menu',
    description: 'how visitors move around',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Profession-adaptive wording — the "shoot / project / piece / case study" layer.
// ─────────────────────────────────────────────────────────────────────────────

/** The four day-one work professions. `agency` is here NOW regardless of D3 (it
 *  stays `copyEngine: 'trust'` in config) so the wording layer is ruling-proof. */
export type WorkProfession = 'photographer' | 'designer' | 'writer' | 'agency';

export interface ProfessionWording {
  /** One piece of work: shoot / project / piece / case study. */
  workItem: string;
  /** A bucket of work: galleries / projects / collections / case studies. */
  workGroup: string;
  /** Section title for `process`: "How a shoot works", etc. */
  processLabel: string;
  /** Default name for an unnamed work group at the plan/editor. */
  groupFallbackLabel: string;
}

export const professionWording: Record<WorkProfession, ProfessionWording> = {
  photographer: {
    workItem: 'shoot',
    workGroup: 'galleries',
    processLabel: 'How a shoot works',
    groupFallbackLabel: 'Galleries',
  },
  designer: {
    workItem: 'project',
    workGroup: 'projects',
    processLabel: 'How a project works',
    groupFallbackLabel: 'Projects',
  },
  writer: {
    workItem: 'piece',
    workGroup: 'collections',
    processLabel: 'How working together works',
    groupFallbackLabel: 'Collections',
  },
  agency: {
    workItem: 'case study',
    workGroup: 'case studies',
    processLabel: 'How an engagement works',
    groupFallbackLabel: 'Case studies',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Dream-client seed chips — pre-narrowed ideal-client suggestions per profession
// (same chips idiom as `ContractField.chips`; the user edits/removes freely).
// ─────────────────────────────────────────────────────────────────────────────

export const dreamClientChips: Record<WorkProfession, readonly string[]> = {
  photographer: [
    'Weddings',
    'Newborn & family',
    'Editorial & fashion',
    'Brands & products',
    'Events',
    'Portraits',
    'Real estate',
  ],
  designer: [
    'Startups',
    'SaaS teams',
    'E-commerce brands',
    'Agencies',
    'Personal brands',
    'Restaurants & cafés',
    'Non-profits',
  ],
  writer: [
    'Founders & execs',
    'Marketing teams',
    'Magazines & publications',
    'Brands',
    'Authors',
    'Newsletters',
    'Agencies',
  ],
  agency: [
    'D2C brands',
    'SaaS companies',
    'Local businesses',
    'E-commerce',
    'B2B services',
    'Startups',
    'Enterprises',
  ],
};
