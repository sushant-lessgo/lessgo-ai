// src/modules/audience/product/strategy/parseStrategyProduct.ts
// Assemble ProductStrategyOutput from the LLM response + the deterministic
// per-template section list + block map. Mirror of parseStrategyService.ts.
//
// Multi-page templates (vestria): the LLM additionally proposes a sitemap,
// constrained to the template's page-archetype menu. The proposal is a
// SUGGESTION — clampSitemap below is the law (home forced first, unknown
// keys/sections dropped, required sections inserted, fallback defaults).

import type { ProductStrategyOutput, SitemapPage } from '@/types/product';
import type { Brief, CapabilityId } from '@/types/brief';
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
  /**
   * scale-07 phase 4 step 0 (phase-2 carryover): the resolved Brief, forwarded
   * to `selectProductSections` on the SINGLE-PAGE path so Brief-required
   * capability sections re-surface (meridian pricing/cta went Brief-gated in
   * phase 2 — without this the single-page default stays bare engine core).
   * Absent ⇒ engine core only (current behavior).
   */
  brief?: Brief;
  /**
   * Explicit capability inclusions (the 7b structure gate's entry path for the
   * explicit-trigger ids). Unioned with the Brief-derived set downstream.
   */
  requiredCapabilities?: readonly CapabilityId[];
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
 * The `clampSitemap` law generalized to a SINGLE-PAGE flat section list
 * (scale-07 phase 4). Deterministic law over a user-confirmed (or AI-proposed)
 * section list — the confirmed 7b structure passes through this before any
 * copy is generated:
 *  - unknown sections dropped (membership limited to `canonical` — no adds),
 *    duplicates deduped (first wins)
 *  - `locked` (engine-core required) sections forced present, inserted at
 *    their canonical relative position
 *  - hero forced FIRST in the body
 *  - header/footer chrome forced exactly where `canonical` has it (never
 *    user-controlled)
 *  - empty/absent proposal → `canonical` body (default accept)
 * Slugs never apply single-page (no pages ⇒ nothing for AI to name) — the
 * multipage half of the law stays in `clampSitemap` above.
 */
export function clampSectionList(
  proposal: string[] | undefined | null,
  canonical: readonly string[],
  locked: readonly string[] = []
): string[] {
  const isChrome = (s: string) => s === 'header' || s === 'footer';
  const canonicalBody = canonical.filter((s) => !isChrome(s));
  const allowed = new Set(canonicalBody);

  let body = dedupe((proposal ?? []).filter((s) => !isChrome(s) && allowed.has(s)));
  if (body.length === 0) body = [...canonicalBody];

  // Required forced present, at canonical relative position.
  for (const s of canonicalBody) {
    if (!locked.includes(s) || body.includes(s)) continue;
    const canonIdx = canonicalBody.indexOf(s);
    let insertAt = body.length;
    for (let i = 0; i < body.length; i++) {
      if (canonicalBody.indexOf(body[i]) > canonIdx) {
        insertAt = i;
        break;
      }
    }
    body.splice(insertAt, 0, s);
  }

  // Hero first.
  const heroIdx = body.indexOf('hero');
  if (heroIdx > 0) {
    body.splice(heroIdx, 1);
    body.unshift('hero');
  }

  return [
    ...(canonical.includes('header') ? ['header'] : []),
    ...body,
    ...(canonical.includes('footer') ? ['footer'] : []),
  ];
}

/**
 * Apply a confirmed 7b single-page structure to an assembled strategy: the
 * confirmed list is clamped by `clampSectionList` (same law as multipage
 * pages), then `sections` AND `uiblocks` are reduced to the survivors — a
 * section absent from the confirmed structure gets NO copy (the copy prompt
 * iterates `strategy.sections`/`uiblocks`). Generic over the assembled-strategy
 * shape so the service twin (`parseStrategyService.applyConfirmedStructure`)
 * reuses the exact same law.
 */
export function applyConfirmedSections<
  T extends { sections: string[]; uiblocks: Record<string, string> },
>(strategy: T, confirmed: string[] | null | undefined, locked: readonly string[] = []): T {
  if (!confirmed) return strategy;
  const sections = clampSectionList(confirmed, strategy.sections, locked);
  const keep = new Set(sections);
  const uiblocks = Object.fromEntries(
    Object.entries(strategy.uiblocks).filter(([k]) => keep.has(k))
  );
  return { ...strategy, sections, uiblocks };
}

/**
 * Combine LLM strategy (awareness/oneReader/oneIdea/featureAnalysis) with the
 * deterministic per-template section list + block map (+ clamped sitemap for
 * multi-page templates).
 */
export function assembleProductStrategy(
  input: AssembleProductStrategyInput
): ProductStrategyOutput {
  const { llmResponse, templateId, proof, brief, requiredCapabilities } = input;

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
    // scale-07 phase 4 step 0: forward the Brief (+ explicit capability
    // inclusions) so Brief-required capability sections (meridian: an M1 goal
    // ⇒ lead-form ⇒ cta; packages ⇒ pricing) re-enter the single-page list.
    sections = selectProductSections({ templateId, brief, requiredCapabilities });
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
