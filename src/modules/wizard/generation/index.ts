// src/modules/wizard/generation/index.ts
// scale-06 phase 5 — the unified generation dispatch.
//
// `runGeneration(engine, input, cb)` fans out to the per-engine adapter. THING
// (phase 5), TRUST (phase 8) and WORK (phase 9 — writer / granth) are all wired.
//
// FIREWALL: PLAIN module (no `'use client'`) — the shared result/callback
// contract + a thin switch. Executed client-side by `GeneratingSlot`.

import type { CopyEngine } from '@/types/brief';
import { runThingGeneration, type ThingGenerationInput } from './thing';
import { runTrustGeneration, type TrustGenerationInput } from './trust';
import { runWorkGeneration, type WorkGenerationInput } from './work';

// Strategy-before-structure (scale-07 phase 3): the standalone strategy step,
// run pre-gate by the wizard store's `fetchStrategy` action.
export { runStrategy, type RunStrategyResult } from './thing';

/** Progress stages surfaced to the GeneratingSlot UI (mirror old GeneratingStep). */
export type GenerationStage = 'strategy' | 'copy' | 'saving' | 'done';

export interface GenerationCallbacks {
  /** Advance the progress UI. */
  onStage?: (stage: GenerationStage) => void;
  /** Multi-page fan-out progress ("page X of N"). */
  onPageProgress?: (p: { done: number; total: number }) => void;
}

export type GenerationStatus = 'done' | 'credits' | 'error';

/**
 * silent-fallback telemetry — the degraded-generation signal a route reports so
 * the slot can tell the user (and PostHog) that copy came back MOCK or
 * INCOMPLETE instead of silently passing as a normal success. Threaded from the
 * copy route's `json.meta` through the engine adapters (thing/trust).
 */
export interface GenerationMeta {
  /** true when the route served canned MOCK copy (no real LLM call). */
  mock?: boolean;
  /** false when the completeness check found promised sections missing. */
  complete?: boolean;
  /** Section keys the completeness check flagged as missing (when !complete). */
  missingSections?: string[];
}

export interface GenerationResult {
  status: GenerationStatus;
  /** Where the slot navigates on success (`/edit/${tokenId}`). */
  redirectTo?: string;
  /** Human-readable error for the retry UI (status === 'error'). */
  error?: string;
  /** Degraded-generation signal on success (silent-fallback surfacing). */
  meta?: GenerationMeta;
}

/** Per-engine adapter input union. */
export type GenerationInput =
  | ThingGenerationInput
  | TrustGenerationInput
  | WorkGenerationInput;

export async function runGeneration(
  engine: CopyEngine,
  input: GenerationInput,
  cb: GenerationCallbacks = {}
): Promise<GenerationResult> {
  switch (engine) {
    case 'thing':
      return runThingGeneration(input as ThingGenerationInput, cb);
    case 'trust':
      return runTrustGeneration(input as TrustGenerationInput, cb);
    case 'work':
      return runWorkGeneration(input as WorkGenerationInput, cb);
    default:
      throw new Error(`Unknown copy engine: ${engine as string}`);
  }
}
