// src/lib/creditRunGate.ts — B8 (qa-0719) upfront full-run credit gate.
//
// A first-generation run is charged in stages across MULTIPLE routes: a strategy
// call (STRATEGY_GENERATION) then a per-page copy call (GENERATE_COPY × pages).
// Before the FIRST charged AI call fires, the caller checks the balance ONCE
// against the WHOLE-run cost so a partial balance is caught INSTANTLY ("the
// moment he says build my site") instead of mid-pipeline after a wasted call +
// partial charge.
//
// ⚠️ INVARIANT: PLAIN, client-safe module — imported by BOTH the client store
// (useWizardStore.fetchStrategy, thing/trust) AND the plain generation adapter
// (work.llm.ts, work engine, which MUST NOT import the store per its firewall).
// Keep it free of prisma / the store / any server-only import; it only uses
// `fetch` + the prisma-free CREDIT_COSTS.

import { CREDIT_COSTS } from './creditCosts';

/**
 * Full charged cost of a first-generation run: strategy + copy×pages.
 * (Work + thing + trust all share this shape: STRATEGY_GENERATION once, then
 * GENERATE_COPY per page.)
 */
export function estimateFullRunCost(pageCount: number): number {
  return CREDIT_COSTS.STRATEGY_GENERATION + CREDIT_COSTS.GENERATE_COPY * Math.max(1, pageCount);
}

/** Copy-only cost when a strategy is already paid/pre-supplied (no strategy charge). */
export function estimateCopyOnlyCost(pageCount: number): number {
  return CREDIT_COSTS.GENERATE_COPY * Math.max(1, pageCount);
}

/**
 * True when the balance is KNOWN and below `fullCost` (⇒ block, show credits
 * error, fire ZERO AI calls). A balance-endpoint hiccup (network throw, non-OK,
 * or a payload without a numeric `totalAvailable`) returns FALSE — it does NOT
 * block; the per-route 402 gates remain the backstop.
 */
export async function isRunUnaffordable(fullCost: number): Promise<boolean> {
  let available: number | null = null;
  try {
    const res = await fetch('/api/credits/balance');
    if (res.ok) {
      const data = await res.json();
      available = typeof data?.totalAvailable === 'number' ? data.totalAvailable : null;
    }
  } catch {
    available = null;
  }
  return available !== null && available < fullCost;
}
