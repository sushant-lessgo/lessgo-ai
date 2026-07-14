// src/modules/prompt/mockResponseGeneratorWork.ts
// ============================================================================
// WORK MOCK RESPONSES — canned strategy (+ a copy stub for phase 3) so mock /
// degraded runs of the work engine carry `meta.mock` and never call the LLM.
// Used when NEXT_PUBLIC_USE_MOCK_GPT=true or the DEMO_TOKEN bearer is supplied.
//
// The strategy mock returns a canned WorkStrategyResponse and runs it through
// the REAL assembler (`assembleWorkStrategy`), so mock output has the exact same
// structural shape as a real run — only the three narrative angles are canned.
// ============================================================================

import type { WorkFacts } from '@/lib/schemas/workFacts.schema';
import type { WorkStrategyResponse } from '@/lib/schemas/workStrategy.schema';
import {
  assembleWorkStrategy,
  type WorkStrategyOutput,
} from '@/modules/audience/work/strategy/parseStrategyWork';
import type { WorkProfessionRow } from '@/modules/audience/work/voice';

export interface MockWorkStrategyInput {
  facts: WorkFacts;
  /** Business-type row (only `.key` is read). */
  professionRow?: WorkProfessionRow | null;
}

/** A canned, facts-agnostic strategy — the three narrative angles only. */
const CANNED_WORK_STRATEGY: WorkStrategyResponse = {
  positioningAngle:
    'The studio you book when the day has to be right — let the work make the case.',
  storyAngle:
    'Started behind the lens for the people who mattered; now trusted for the days that do.',
  voiceNotes: [
    'Let the work carry the page — frame it, do not describe it.',
    'One true line beats three clever ones.',
    'No superlatives, no exclamation marks.',
  ],
};

/**
 * Canned work strategy. Real structure (via `assembleWorkStrategy`), canned
 * angles. Mirror of `generateMockMeridianStrategy`.
 */
export function generateMockWorkStrategy(
  input: MockWorkStrategyInput
): WorkStrategyOutput {
  return assembleWorkStrategy({
    llmResponse: CANNED_WORK_STRATEGY,
    facts: input.facts,
    professionRow: input.professionRow,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Copy mock (phase 3) — canned but USABLE per-page copy so mock / degraded copy
// runs return a real, renderable page carrying `meta.mock`. Facts-backed
// collections (work groups / packages) are filled from the actual facts; proof
// quotes are left empty (the parser injects real praise verbatim). The output is
// the CopyResponseSchema shape (section → { elements }); the route runs it through
// the SAME parseWorkCopy pipeline a real run uses.
// ─────────────────────────────────────────────────────────────────────────────

import { formatWorkPrice } from '@/modules/audience/work/workLibrary';
import { workElementContract } from '@/modules/engines/workSections';

export interface MockWorkCopyInput {
  facts: WorkFacts;
  /** The page's section keys (from the strategy sitemap). */
  sections: string[];
}

/** A short canned line per element key — deterministic, voice-agnostic. */
function cannedScalar(key: string, name: string): string {
  switch (key) {
    case 'logo_text':
    case 'name':
      return name || 'Studio';
    case 'role_line':
      return 'Photography';
    case 'eyebrow':
      return 'Work';
    case 'heading':
      return name ? `The work of ${name}` : 'Selected work';
    case 'lead':
      return 'A small body of work, chosen with care.';
    case 'bio':
      return 'A short, true story about the work and the people it is for.';
    case 'awards_line':
      return '';
    case 'quote':
      return 'Let the work make the case.';
    case 'note':
      return 'Get in touch to start a conversation.';
    case 'copyright':
      return name ? `© ${name}` : '';
    case 'cta_label':
      return 'Enquire';
    case 'contact_method':
      return 'form';
    default:
      return name || 'Studio';
  }
}

/** Build one section's elements (canned scalars + facts-backed collections). */
function buildMockSection(
  section: string,
  facts: WorkFacts
): { elements: Record<string, unknown> } | null {
  const schema = workElementContract[section];
  if (!schema) return null;

  const name = facts.identity?.name ?? '';
  const elements: Record<string, unknown> = {};

  // Required scalar elements only (lean; optional ones omitted).
  for (const [key, def] of Object.entries(schema.elements)) {
    if (def.fillMode === 'system') continue;
    if (def.requirement === 'required') elements[key] = cannedScalar(key, name);
  }

  // Facts-backed collections.
  const groups = facts.groups ?? [];
  if (section === 'work') {
    elements['groups'] = groups.map((g) => ({
      name: g.name,
      cover_image: '',
      href: `#${g.name.toLowerCase().replace(/\s+/g, '-')}`,
    }));
  } else if (section === 'packages') {
    elements['packages'] = groups.map((g) => ({
      name: g.name,
      price_mode: g.price?.mode ?? 'on-request',
      price_line: formatWorkPrice(g.price),
      description: '',
      cta_label: 'Enquire',
    }));
  }
  // proof.quotes intentionally left empty — parseWorkCopy injects real praise.

  return { elements };
}

/**
 * Canned per-page work copy. Real, renderable copy for the given sections; the
 * route feeds it through parseWorkCopy (defaults + praise injection + ids).
 */
export function generateMockWorkCopy(
  input: MockWorkCopyInput
): Record<string, { elements: Record<string, unknown> }> {
  const out: Record<string, { elements: Record<string, unknown> }> = {};
  for (const section of input.sections) {
    const built = buildMockSection(section, input.facts);
    if (built) out[section] = built;
  }
  return out;
}
