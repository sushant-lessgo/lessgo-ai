// src/app/onboarding/[token]/components/decider/deciderMachine.ts
// Engine Decider — the pure status machine (engineDecider Phase 2).
//
// PURE. No React, no 'use client', no store. Encodes R1's DETERMINISTIC table:
// which decider screen fires is decided by the registry state (via the
// `EngineResolution` union from resolveEngine), and confidence modulates the
// D2/D3 PRESENTATION only — it can never change WHICH engine resolves or WHETHER
// D4 fires (R1). Mirrors `buildBriefDraft`'s engineStatus derivation so the rail
// (which reads `facts.entry.engineStatus`) and this machine never disagree.
//
// Firewall: consumes only the pure `@/modules/brief/classify` types/const.

import {
  LOW_CONFIDENCE_THRESHOLD,
  type EngineResolution,
  type EngineStatus,
} from '@/modules/brief/classify';

export type { EngineStatus };

/** The decider screen an `engineStatus` maps to (R1 table). `resolving` is the
 *  D1 transient (no screen yet); `confirmed` is settled (post-pick, no question). */
export type DeciderScreen = 'resolving' | 'D2' | 'D3' | 'D4' | 'settled';

/**
 * The AI confidence is an un-calibrated self-report; a garbage/out-of-range or
 * non-finite value must never throw or mis-branch. Clamp to [0,1]; NaN ⇒ 0
 * (⇒ `almost-sure`, the safe "ask one more tap" branch). Matches
 * `clampConfidence` in classify.ts.
 */
function clampConfidence(n: number): number {
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}

/**
 * R1 table — resolution + confidence → presentation status. DETERMINISTIC on the
 * resolution (registry state); confidence only splits a committed lookup into
 * `known` (≥ 0.6 ⇒ D2, zero questions) vs `almost-sure` (< 0.6 ⇒ D3, one tap).
 * An unknown type resolved via the tiebreaker ladder is `known` (a definite
 * signal). An `ask` resolution — ambiguous registry type OR unknown-with-no-
 * signal — is always `ambiguous` (⇒ D4). Never returns `resolving`/`confirmed`
 * (those are transient/post-pick, not resolution outcomes).
 */
export function statusFromResolution(
  resolution: EngineResolution,
  confidence: number
): EngineStatus {
  if (resolution.state === 'ask') return 'ambiguous';
  if (resolution.source === 'tiebreaker') return 'known';
  // Committed lookup: confidence modulates presentation only (R1).
  return clampConfidence(confidence) >= LOW_CONFIDENCE_THRESHOLD
    ? 'known'
    : 'almost-sure';
}

/**
 * Which decider screen an `engineStatus` renders. Defensive on a missing/
 * undefined status (EntryFacts.engineStatus is optional; pre-existing fixtures
 * may omit it) — default to `resolving`, never a wrong screen.
 */
export function screenForStatus(status: EngineStatus | undefined): DeciderScreen {
  switch (status ?? 'resolving') {
    case 'resolving':
      return 'resolving';
    case 'known':
      return 'D2';
    case 'almost-sure':
      return 'D3';
    case 'ambiguous':
      return 'D4';
    case 'confirmed':
      return 'settled';
    default:
      // Exhaustive; an unknown literal is treated as the safe transient.
      return 'resolving';
  }
}

/**
 * The pick transition (D4 / D2-override / D3-confirm): any pre-commit status
 * becomes `confirmed`. Pure — the Brief write is `applyEnginePick` in classify.ts;
 * this is just the presentation-state half.
 */
export function statusAfterPick(): EngineStatus {
  return 'confirmed';
}
