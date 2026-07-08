// src/modules/audience/product/strategy/parseStrategyProduct.ts
// Assemble ProductStrategyOutput from the LLM response + the deterministic
// per-template section list + block map. Mirror of parseStrategyService.ts.
//
// Multi-page templates (vestria): the LLM additionally proposes a sitemap,
// constrained to the template's page-archetype menu. The proposal is a
// SUGGESTION — clampSitemap below is the law (home forced first, unknown
// keys/sections dropped, required sections inserted, fallback defaults).

import type { ProductStrategyOutput, SitemapPage } from '@/types/product';
import type {
  ProductStrategyResponse,
  ProductStrategyWithSitemapResponse,
} from '@/lib/schemas/productStrategy.schema';
import { selectProductSections } from '../sectionSelection';
import { selectProductBlocks } from '../selectBlocks';
import { getPageArchetypesForTemplate, type PageArchetypeDef } from '../pageArchetypes';

/**
 * Proof availability booleans (scale-06 phase 4 — the PROOF HARD RULE).
 * OPTIONAL: when ABSENT (undefined), no proof filtering runs and assembly keeps
 * its exact pre-scale-06 behavior — this is how the OLD product wizard (which
 * never sends proof) stays byte-identical. When PRESENT, an unpromised proof
 * section is dropped from the assembled section list (mirrors how the service
 * route drops `testimonials` via `selectServiceSections` asset booleans), so a
 * proof section is NEVER generated when the founder can't back it.
 */
export interface ProductProofInput {
  /** Testimonials/social-proof section (dropTarget `testimonials`). */
  hasTestimonials?: boolean;
}

/** Section types the proof hard rule can cut, keyed by the gating boolean. */
function proofDroppedSections(proof: ProductProofInput): Set<string> {
  const dropped = new Set<string>();
  // Unpromised testimonials ⇒ the testimonials section is absent (never faked).
  if (proof.hasTestimonials !== true) dropped.add('testimonials');
  return dropped;
}

export interface AssembleProductStrategyInput {
  llmResponse: ProductStrategyResponse | ProductStrategyWithSitemapResponse;
  /** Template-aware section/block selection. ASSEMBLY ONLY — never fed into any
   *  prompt builder (the prompt firewall forbids templateId in prompt input). */
  templateId?: string;
  /** Proof hard rule — see ProductProofInput. Absent ⇒ current behavior. */
  proof?: ProductProofInput;
}

interface RawSitemapPage {
  archetypeKey?: string;
  title?: string;
  sections?: string[];
  reason?: string;
}

/** Order-preserving dedupe. */
function dedupe<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * Clamp an LLM sitemap proposal to the template's page-archetype menu.
 * Deterministic server law over the suggestion:
 *  - unknown archetype keys dropped; duplicate pages deduped (first wins)
 *  - home forced present and first
 *  - per page: sections filtered (order-preserving) to allowedSections,
 *    deduped, required sections appended when missing; empty → defaultSections
 *  - titles defaulted; pathSlug ALWAYS from the menu (the AI never picks slugs)
 *  - empty/absent proposal → the menu's defaultIncluded pages with defaults
 */
export function clampSitemap(
  proposal: RawSitemapPage[] | undefined | null,
  menu: PageArchetypeDef[]
): SitemapPage[] {
  const byKey = new Map(menu.map((a) => [a.key, a]));
  const home = menu.find((a) => a.required) ?? menu[0];

  const clampPage = (def: PageArchetypeDef, raw?: RawSitemapPage): SitemapPage => {
    // No proposal for this page (fallback sitemap / forced home) → defaults.
    // A proposal, however thin, is respected: filter → dedupe → insert required.
    let sections: string[];
    if (!raw) {
      sections = [...def.defaultSections];
    } else {
      const filtered = dedupe(
        (raw.sections ?? []).filter((s) => def.allowedSections.includes(s))
      );
      sections = [
        ...filtered,
        ...def.requiredSections.filter((s) => !filtered.includes(s)),
      ];
    }
    return {
      archetypeKey: def.key,
      title: (raw?.title ?? '').trim() || def.title,
      pathSlug: def.pathSlug,
      sections,
      ...(raw?.reason ? { reason: raw.reason } : {}),
    };
  };

  // Fallback: no usable proposal → default sitemap.
  const usable = (proposal ?? []).filter(
    (p) => p && typeof p.archetypeKey === 'string' && byKey.has(p.archetypeKey)
  );
  if (!usable.length) {
    return menu
      .filter((a) => a.defaultIncluded)
      .map((a) => clampPage(a));
  }

  const seen = new Set<string>();
  const pages: SitemapPage[] = [];
  for (const raw of usable) {
    const def = byKey.get(raw.archetypeKey!)!;
    if (seen.has(def.key)) continue; // duplicate page — first wins
    seen.add(def.key);
    pages.push(clampPage(def, raw));
  }

  // Home forced present + first.
  const homeIdx = pages.findIndex((p) => p.archetypeKey === home.key);
  if (homeIdx < 0) {
    pages.unshift(clampPage(home));
  } else if (homeIdx > 0) {
    const [h] = pages.splice(homeIdx, 1);
    pages.unshift(h);
  }

  return pages;
}

/**
 * Combine LLM strategy (awareness/oneReader/oneIdea/featureAnalysis) with the
 * deterministic per-template section list + block map (+ clamped sitemap for
 * multi-page templates).
 */
export function assembleProductStrategy(
  input: AssembleProductStrategyInput
): ProductStrategyOutput {
  const { llmResponse, templateId, proof } = input;

  const menu = getPageArchetypesForTemplate(templateId);

  let sections: string[];
  let sitemap: SitemapPage[] | undefined;

  if (menu) {
    // Multi-page template: clamp the proposal; top-level sections stay the HOME
    // page (+ chrome) so every single-page consumer keeps working unchanged.
    const rawPages = (llmResponse as ProductStrategyWithSitemapResponse).sitemap?.pages;
    sitemap = clampSitemap(rawPages, menu);
    sections = ['header', ...sitemap[0].sections, 'footer'];
  } else {
    sections = selectProductSections({ templateId });
  }

  // PROOF HARD RULE (scale-06 phase 4): this is the SINGLE point that emits
  // `strategyData.sections` for BOTH the single-page (selectProductSections) and
  // multi-page (clampSitemap) paths, so the filter lives here rather than in
  // selectProductSections (which is only one of the two branches feeding this).
  // Absent `proof` ⇒ no drop ⇒ old wizard behavior. Applied BEFORE block
  // selection so unpromised sections drop from BOTH `sections` and `uiblocks`.
  if (proof) {
    const dropped = proofDroppedSections(proof);
    if (dropped.size > 0) {
      sections = sections.filter((s) => !dropped.has(s));
      if (sitemap) {
        sitemap = sitemap.map((p) => ({
          ...p,
          sections: p.sections.filter((s) => !dropped.has(s)),
        }));
      }
    }
  }

  const { uiblocks } = selectProductBlocks({ sections, templateId });

  return {
    awareness: llmResponse.awareness,
    oneReader: llmResponse.oneReader,
    oneIdea: llmResponse.oneIdea,
    featureAnalysis: llmResponse.featureAnalysis,
    sections,
    uiblocks,
    ...(sitemap ? { sitemap } : {}),
  };
}
