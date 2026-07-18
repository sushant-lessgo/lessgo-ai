// src/modules/audience/work/workLibrary.ts
// ============================================================================
// WORK LIBRARY — the typed, facts-bound source-of-truth block fed to the copy
// prompt. Mirrors buildSiteContextPromptBlock (src/lib/siteContext.ts L144-180):
// a bounded, clearly-framed prompt block the model may draw from but must NEVER
// exceed or invent beyond.
//
// This is the FACTS-LAW backbone of the copy prompt: every group name, kind and
// price is rendered VERBATIM (or mode-phrased for on-request), photo counts and
// sub-items are summarised, praise is listed verbatim (it is injected at parse
// time — the model never rewrites it), and the dream client frames the reader.
//
// There is no typed work-library object elsewhere today — this file introduces
// it (nearest prior art: CollectionsFacts). It is a pure PROJECTION of WorkFacts
// for the prompt layer; it adds nothing the facts do not already state.
//
// ── FIREWALL ────────────────────────────────────────────────────────────────
//   Pure code. Reads only WorkFacts (pure data). No react / stores / hooks /
//   templateId. No template names.
// ============================================================================

import type {
  WorkFacts,
  WorkGroup,
  WorkPrice,
} from '@/lib/schemas/workFacts.schema';

/** One group, projected for the prompt (verbatim name/kind/price + counts). */
export interface WorkLibraryGroup {
  name: string;
  kind: 'category' | 'story';
  /** Verbatim-or-mode-phrased price line (never invented). */
  priceLine: string;
  /** Pricing mode — drives how the copy may frame the price. */
  priceMode: WorkPrice['mode'];
  /** Total photos referenced by this group (flat + per sub-item). */
  photoCount: number;
  /** Sub-item (shoot / project / piece) names, if the group has a second level. */
  subItems: string[];
}

/** The typed work library — a pure projection of WorkFacts for the prompt. */
export interface WorkLibrary {
  businessName: string;
  location?: string;
  reach?: string;
  dreamClient?: string;
  groups: WorkLibraryGroup[];
  /** Verbatim praise strings (injected into proof at parse time, not rewritten). */
  praise: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Price rendering — VERBATIM amount + currency, mode-phrased. Never invented.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render a group price as a prompt line. Amount + currency are shown VERBATIM
 * (no locale formatting, no invented figures). `on-request` shows no number.
 */
export function formatWorkPrice(price: WorkPrice | undefined): string {
  if (!price) return 'On request';
  const cur = price.currency ?? '';
  switch (price.mode) {
    case 'on-request':
      return 'On request';
    case 'from':
      return price.amount !== undefined ? `from ${cur}${price.amount}` : 'On request';
    case 'exact':
    default:
      return price.amount !== undefined ? `${cur}${price.amount}` : 'On request';
  }
}

function photoCountOf(g: WorkGroup): number {
  const flat = g.photos?.length ?? 0;
  const nested = (g.items ?? []).reduce((n, it) => n + (it.photos?.length ?? 0), 0);
  return flat + nested;
}

// ─────────────────────────────────────────────────────────────────────────────
// Projection — WorkFacts → WorkLibrary.
// ─────────────────────────────────────────────────────────────────────────────

/** Project WorkFacts into the typed work library (pure; invents nothing). */
export function buildWorkLibrary(facts: WorkFacts): WorkLibrary {
  const groups: WorkLibraryGroup[] = (facts.groups ?? []).map((g) => ({
    name: g.name,
    kind: g.kind,
    priceLine: formatWorkPrice(g.price),
    priceMode: g.price?.mode ?? 'on-request',
    photoCount: photoCountOf(g),
    subItems: (g.items ?? []).map((it) => it.name),
  }));

  return {
    businessName: facts.identity?.name ?? '',
    location: facts.identity?.location,
    reach: facts.identity?.reach,
    dreamClient: facts.dreamClient,
    groups,
    praise: facts.praise ?? [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt block — bounded, clearly-framed (mirrors buildSiteContextPromptBlock).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render the work library as a copy-prompt block. Every group name / kind /
 * price is VERBATIM; praise is listed verbatim (injected, not rewritten). The
 * framing states the never-invent, never-pad law the copy rules then enforce.
 */
export function buildWorkLibraryPromptBlock(facts: WorkFacts): string {
  const lib = buildWorkLibrary(facts);
  const lines: string[] = [
    '## WORK LIBRARY (source of truth — the ONLY facts you may state; never invent or pad beyond this list)',
  ];

  // Identity.
  if (lib.businessName) lines.push('', `Business: ${lib.businessName}`);
  if (lib.location) lines.push(`Location: ${lib.location}`);
  if (lib.reach) lines.push(`Serves: ${lib.reach}`);
  if (lib.dreamClient) lines.push(`Dream client (who to speak to): ${lib.dreamClient}`);

  // Groups — the stated offering. One card per group; NO padding beyond these.
  lines.push('', `WHAT THEY OFFER (${lib.groups.length} item(s) — write EXACTLY this many cards, no more):`);
  if (lib.groups.length === 0) {
    lines.push('- (none stated — do NOT invent any offering)');
  } else {
    for (const g of lib.groups) {
      const parts = [`- ${g.name} — ${g.priceLine}`];
      if (g.photoCount > 0) parts.push(`(${g.photoCount} photo${g.photoCount === 1 ? '' : 's'})`);
      lines.push(parts.join(' '));
      if (g.subItems.length) {
        lines.push(`    sub-items: ${g.subItems.join(', ')}`);
      }
    }
  }

  // Praise — verbatim; injected into proof, never rewritten.
  if (lib.praise.length) {
    lines.push(
      '',
      'VERBATIM PRAISE (real client words — the system injects these into the proof section EXACTLY as written; do NOT rewrite, paraphrase, invent, or attribute them):'
    );
    for (const p of lib.praise) lines.push(`- "${p}"`);
  }

  return lines.join('\n');
}
