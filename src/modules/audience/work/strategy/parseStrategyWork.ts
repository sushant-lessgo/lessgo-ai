// src/modules/audience/work/strategy/parseStrategyWork.ts
// ============================================================================
// WORK STRATEGY ASSEMBLER — merge the DETERMINISTIC structure (phase 1) with the
// AI's three narrative angles into a WorkStrategyOutput.
//
// Shape is PARALLEL to ProductStrategyOutput (src/types/product.ts): the
// deterministic half (sections / uiblocks / sitemap) is computed here from facts
// via `assembleWorkStructure`; the AI contributes ONLY the narrative fields
// (positioningAngle / storyAngle / voiceNotes). This split is AC-3: the AI can
// never contribute structure — it isn't even read for structure here.
//
// The shared single-page clamp `clampSectionList` (parseStrategyProduct.ts) is
// CALLED (never edited) so the home page's section list obeys the same law as
// product/service pages: chrome forced at the edges, hero first, required
// sections present, unknown sections dropped.
//
// ── FIREWALL ────────────────────────────────────────────────────────────────
//   Pure code. No templateId anywhere — uiblocks map to the template-AGNOSTIC
//   contract section types (the concrete skin/block resolves later, never here).
// ============================================================================

import type { WorkFacts } from '@/lib/schemas/workFacts.schema';
import type { WorkStrategyResponse } from '@/lib/schemas/workStrategy.schema';
import type { ProfessionWording } from '@/modules/engines/workVocabulary';
import {
  workPageTypes,
  type WorkSiteArchetypeKey,
  type WorkPageGoalKey,
} from '@/modules/engines/workPages';
import { workElementContract } from '@/modules/engines/workSections';
import { clampSectionList } from '@/modules/audience/product/strategy/parseStrategyProduct';
import { assembleWorkStructure, type WorkStructure } from '../slimStrategy';
import type { Establishment, WorkProfessionRow } from '../voice';

/** One page of the work sitemap. Parallel to product `SitemapPage`; body-only. */
export interface WorkSitemapPage {
  archetypeKey: string;
  title: string;
  pathSlug: string;
  /** Body-only section keys (chrome injected at boundaries). */
  sections: string[];
  /**
   * The one action this page asks a visitor to take (E4 plan screen). Optional +
   * additive: absent here (assembly does not set it) — populated + edited on the
   * plan screen, then carried through Brief.structure. Generation does not read
   * it yet. Falls back to `defaultGoalForPage(...)` when unset.
   */
  goal?: WorkPageGoalKey;
}

/**
 * The assembled work strategy. Deterministic structure (sections/uiblocks/
 * sitemap + the context the copy phase needs) + the AI's three narrative angles.
 */
export interface WorkStrategyOutput {
  // ── AI narrative half (the ONLY fields the model contributes) ──────────────
  positioningAngle: string;
  storyAngle: string;
  voiceNotes: string[];
  // ── Deterministic structure half (from assembleWorkStructure) ──────────────
  /** Home page incl. chrome: header + home body + footer (clampSectionList law). */
  sections: string[];
  /** Section key → template-agnostic contract section type. */
  uiblocks: Record<string, string>;
  /** [0] is always home. */
  sitemap: WorkSitemapPage[];
  archetype: WorkSiteArchetypeKey;
  /** Group names in curated lead order (best-first). */
  leadGroups: string[];
  storyBranch: Establishment;
  primaryLanguage: string;
  wording: ProfessionWording;
}

export interface AssembleWorkStrategyInput {
  /** The AI strategy response (already validated by WorkStrategyResponseSchema). */
  llmResponse: WorkStrategyResponse;
  /** The work facts (`brief.facts.work`). */
  facts: WorkFacts;
  /** Business-type row (only `.key` is read); resolves the profession. */
  professionRow?: WorkProfessionRow | null;
  /** Optional pre-computed structure (defaults to deriving from facts). */
  structure?: WorkStructure;
}

/** Map a section key to its template-agnostic contract section type (identity). */
function uiblockFor(section: string): string {
  return workElementContract[section]?.sectionType ?? section;
}

/**
 * Merge the deterministic work structure with the AI's narrative angles. The AI
 * response is read ONLY for the three narrative fields — never for structure.
 */
export function assembleWorkStrategy(
  input: AssembleWorkStrategyInput
): WorkStrategyOutput {
  const { llmResponse, facts, professionRow } = input;

  const structure =
    input.structure ?? assembleWorkStructure(facts, professionRow);

  // Home is always the first proposed page (proposeWorkSiteStructure forces it).
  const homePlan = structure.pages[0];
  const homeDef = workPageTypes[homePlan.page];

  // Apply the shared single-page clamp to the home body, then frame with chrome.
  // canonical = the home page's allowed body (ordered); locked = its required
  // sections (e.g. hero). clampSectionList forces hero first + header/footer.
  const canonical = ['header', ...homeDef.allowedSections, 'footer'];
  const sections = clampSectionList(
    homePlan.sections,
    canonical,
    homeDef.requiredSections
  );

  // uiblocks: every section in the framed home list → its contract section type.
  const uiblocks: Record<string, string> = {};
  for (const section of sections) uiblocks[section] = uiblockFor(section);

  // Sitemap: one entry per deterministic page (body-only sections).
  const sitemap: WorkSitemapPage[] = structure.pages.map((pp) => {
    const def = workPageTypes[pp.page];
    return {
      archetypeKey: def.key,
      title: def.title,
      pathSlug: def.pathSlug,
      sections: [...pp.sections],
    };
  });

  return {
    // AI narrative half — the ONLY fields sourced from the model.
    positioningAngle: llmResponse.positioningAngle,
    storyAngle: llmResponse.storyAngle,
    voiceNotes: llmResponse.voiceNotes,
    // Deterministic structure half — sourced from facts, never the model.
    sections,
    uiblocks,
    sitemap,
    archetype: structure.archetype,
    leadGroups: structure.leadGroups,
    storyBranch: structure.storyBranch,
    primaryLanguage: structure.primaryLanguage,
    wording: structure.wording,
  };
}
