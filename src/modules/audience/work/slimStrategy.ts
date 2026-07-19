// src/modules/audience/work/slimStrategy.ts
// ============================================================================
// WORK SLIM STRATEGY — the DETERMINISTIC half of the work strategy (zero AI).
//
// Everything decidable from WorkFacts + the phase-A contracts is decided HERE,
// unit-tested, with NO LLM. The single small AI strategy call (phase 2) adds
// only positioning-angle / story-angle / voice-notes on top of this structure.
//
// What this computes, all from facts:
//   • archetype + ordered pages   — via proposeWorkSiteStructure (workPages.ts)
//   • sections per page           — each page's contract `defaultSections`
//   • card counts                 — facts-derived counts CLAMPED to the element
//                                    contract collection min/max; NEVER exceed
//                                    max, NEVER pad below what actually exists
//   • which groups lead           — curation signals (cover photo, size, kind)
//   • story branch                — establishment slot (new | established)
//   • primary language            — languages[0]
//   • profession wording          — professionWording[profession]
//
// ── ANTI-PADDING LAW ────────────────────────────────────────────────────────
//   Card counts = min(actualCount, contractMax). We do NOT force counts up to the
//   contract min — inventing empty cards to satisfy a minimum is padding, which
//   the facts-law forbids. min/max are reported alongside for the copy phase.
//
// ── FIREWALL ────────────────────────────────────────────────────────────────
//   Pure code. Reads only pure-data contract modules. No react / stores / hooks /
//   templateId. Calls proposeWorkSiteStructure — never edits it.
// ============================================================================

import type { WorkFacts, WorkGroup } from '@/lib/schemas/workFacts.schema';
import {
  proposeWorkSiteStructure,
  deriveStructureSignals,
  workPageTypes,
  type WorkPageTypeKey,
  type WorkSiteArchetypeKey,
  type WorkStructureSignals,
} from '@/modules/engines/workPages';

// `deriveStructureSignals` was RELOCATED to `workPages.ts` (plan-proposal-gate
// phase 1, firewall: keep it out of the store's bundle path). Re-exported here so
// existing callers/tests that import it from this module are untouched.
export { deriveStructureSignals };
import {
  workElementContract,
  type WorkSectionKey,
} from '@/modules/engines/workSections';
import {
  professionWording,
  type ProfessionWording,
} from '@/modules/engines/workVocabulary';
import { resolveWorkProfession, type WorkProfessionRow, type Establishment } from './voice';

/** Default primary language when none is stated. */
export const DEFAULT_PRIMARY_LANGUAGE = 'en';
/** Default story branch when the establishment slot is absent. */
export const DEFAULT_ESTABLISHMENT: Establishment = 'established';

/** One collection's clamp plan for a section. `count` is set only when a facts
 *  source backs it (work groups / packages / praise); otherwise undefined (the
 *  copy phase fills within [min,max]). */
export interface CollectionPlan {
  key: string;
  min: number;
  max: number;
  /** Facts-derived card count, clamped to [.., max]. Undefined = AI decides. */
  count?: number;
}

/** A page's deterministic section list + per-section collection plans. */
export interface PagePlan {
  page: WorkPageTypeKey;
  /** Body-only section keys (chrome injected at boundaries, never listed). */
  sections: WorkSectionKey[];
  /** Section key → its collection plans (only for sections that carry one). */
  collections: Record<string, CollectionPlan[]>;
}

/** The full deterministic assembly — the slim-strategy structure half. */
export interface WorkStructure {
  archetype: WorkSiteArchetypeKey;
  pages: PagePlan[];
  promotedGroupCount: number;
  /** Group names in curated lead order (best-first). */
  leadGroups: string[];
  storyBranch: Establishment;
  primaryLanguage: string;
  wording: ProfessionWording;
  /** The structure signals used (echoed for tests / the copy phase). */
  signals: WorkStructureSignals;
}

// ─────────────────────────────────────────────────────────────────────────────
// Card-count clamping.
// ─────────────────────────────────────────────────────────────────────────────

/** Clamp a facts-derived actual count to the contract max (never pad up to min). */
function clampCount(actual: number, max: number): number {
  return Math.max(0, Math.min(actual, max));
}

/**
 * Build the collection plans for one section. `count` is filled for the three
 * facts-backed collections (work.groups, packages.packages, proof.quotes) and
 * left undefined elsewhere (copy phase decides within [min,max]).
 */
function planCollections(section: WorkSectionKey, facts: WorkFacts): CollectionPlan[] {
  const contract = workElementContract[section];
  if (!contract?.collections) return [];

  const groupCount = (facts.groups ?? []).length;
  const praiseCount = (facts.praise ?? []).length;

  return Object.entries(contract.collections).map(([key, def]) => {
    const { min, max } = def.constraints;
    const plan: CollectionPlan = { key, min, max };

    if (section === 'work' && key === 'groups') {
      plan.count = clampCount(groupCount, max);
    } else if (section === 'packages' && key === 'packages') {
      // Each group ≙ one package (group ≙ service ≙ price — one spine).
      plan.count = clampCount(groupCount, max);
    } else if (section === 'proof' && key === 'quotes') {
      plan.count = clampCount(praiseCount, max);
    }
    return plan;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Lead-group curation (which groups lead the home gallery teaser).
// ─────────────────────────────────────────────────────────────────────────────

function groupSize(g: WorkGroup): number {
  return (g.items?.length ?? 0) + (g.photos?.length ?? 0);
}

function hasCover(g: WorkGroup): boolean {
  if (g.photos?.some((p) => p.cover)) return true;
  if (g.items?.some((it) => it.photos?.some((p) => p.cover))) return true;
  // Any photo at all is a weaker cover signal.
  return !!(g.photos?.length || g.items?.some((it) => it.photos?.length));
}

/** Curation score: a cover photo dominates, then story kind, then size. */
function leadScore(g: WorkGroup): number {
  let s = 0;
  if (hasCover(g)) s += 4;
  if (g.kind === 'story') s += 1;
  return s;
}

/** Order group names best-first (stable on ties, size as final tiebreak). */
function curateLeadGroups(groups: WorkGroup[]): string[] {
  return groups
    .map((g, i) => ({ g, i }))
    .sort((a, b) => {
      const byScore = leadScore(b.g) - leadScore(a.g);
      if (byScore !== 0) return byScore;
      const bySize = groupSize(b.g) - groupSize(a.g);
      if (bySize !== 0) return bySize;
      return a.i - b.i; // stable: preserve original order
    })
    .map(({ g }) => g.name);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main assembly.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Assemble the deterministic work site structure from facts. Zero AI.
 *
 * @param facts          the work facts (`brief.facts.work`)
 * @param professionRow  the business-type row (only `.key` is read)
 * @param signalsOverride optional pre-computed signals (defaults to deriving
 *                        them from `facts` — same value either way)
 */
export function assembleWorkStructure(
  facts: WorkFacts,
  professionRow: WorkProfessionRow | null | undefined,
  signalsOverride?: WorkStructureSignals
): WorkStructure {
  const signals = signalsOverride ?? deriveStructureSignals(facts);
  const proposal = proposeWorkSiteStructure(signals);

  const pages: PagePlan[] = proposal.pages.map((pageKey) => {
    const sections = [...workPageTypes[pageKey].defaultSections] as WorkSectionKey[];
    const collections: Record<string, CollectionPlan[]> = {};
    for (const section of sections) {
      const plans = planCollections(section, facts);
      if (plans.length) collections[section] = plans;
    }
    return { page: pageKey, sections, collections };
  });

  const profession = resolveWorkProfession(professionRow?.key);

  return {
    archetype: proposal.archetype,
    pages,
    promotedGroupCount: proposal.promotedGroupCount,
    leadGroups: curateLeadGroups(facts.groups ?? []),
    storyBranch: facts.establishment ?? DEFAULT_ESTABLISHMENT,
    primaryLanguage: facts.languages?.[0] ?? DEFAULT_PRIMARY_LANGUAGE,
    wording: professionWording[profession],
    signals,
  };
}
