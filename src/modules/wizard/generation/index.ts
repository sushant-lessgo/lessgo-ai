// src/modules/wizard/generation/index.ts
// scale-06 phase 5 — the unified generation dispatch.
//
// `runGeneration(engine, input, cb)` fans out to the per-engine adapter. THING
// is wired now (phase 5); trust/work throw "not yet migrated" until phases 8/9
// port their adapters (`trust.ts`/`work.ts`) and register them here.
//
// FIREWALL: PLAIN module (no `'use client'`) — the shared result/callback
// contract + a thin switch. Executed client-side by `GeneratingSlot`.

import type { CopyEngine } from '@/types/brief';
import { runThingGeneration, type ThingGenerationInput } from './thing';

/** Progress stages surfaced to the GeneratingSlot UI (mirror old GeneratingStep). */
export type GenerationStage = 'strategy' | 'copy' | 'saving' | 'done';

export interface GenerationCallbacks {
  /** Advance the progress UI. */
  onStage?: (stage: GenerationStage) => void;
  /** Multi-page fan-out progress ("page X of N"). */
  onPageProgress?: (p: { done: number; total: number }) => void;
}

export type GenerationStatus = 'done' | 'credits' | 'error';

export interface GenerationResult {
  status: GenerationStatus;
  /** Where the slot navigates on success (`/edit/${tokenId}`). */
  redirectTo?: string;
  /** Human-readable error for the retry UI (status === 'error'). */
  error?: string;
}

/** Per-engine adapter input union (widened as trust/work migrate). */
export type GenerationInput = ThingGenerationInput;

export async function runGeneration(
  engine: CopyEngine,
  input: GenerationInput,
  cb: GenerationCallbacks = {}
): Promise<GenerationResult> {
  switch (engine) {
    case 'thing':
      return runThingGeneration(input as ThingGenerationInput, cb);
    case 'trust':
    case 'work':
      throw new Error(`Generation for the "${engine}" engine is not yet migrated to the unified wizard.`);
    default:
      throw new Error(`Unknown copy engine: ${engine as string}`);
  }
}
