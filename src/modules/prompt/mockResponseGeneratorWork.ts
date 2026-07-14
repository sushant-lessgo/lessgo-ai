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
// Copy mock — PLACEHOLDER for phase 3 (work generate-copy route). Fleshed out
// when the copy prompt/parser land; kept here so the mock module already exists
// and phase 3 only extends it. Returns an empty per-section copy map today.
// ─────────────────────────────────────────────────────────────────────────────

export interface MockWorkCopyInput {
  strategy: WorkStrategyOutput;
  facts: WorkFacts;
}

/** Placeholder (phase 3): empty copy map so mock/degraded copy runs are visible. */
export function generateMockWorkCopy(
  _input: MockWorkCopyInput
): Record<string, unknown> {
  return {};
}
