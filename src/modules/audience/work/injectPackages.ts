// src/modules/audience/work/injectPackages.ts
// ============================================================================
// WORK PACKAGES INJECTOR — work-LOCAL (Wave 2 packages quad). Sibling of
// injectPraise: a FACTS-LAW seam that runs at PARSE time (code, not the LLM).
//
// Maps the seller's stated group sub-items VERBATIM onto each package tier's
// `bullets` string (a newline-delimited "what's included" list, split at render).
// The tier↔group mapping is POSITIONAL — the copy prompt binds "one card per
// stated item" (copyPrompt.ts rule 11), so packages[i] derives from groups[i].
//
// LAW (mirrors injectPraise):
//   • FACTS ARE AUTHORITATIVE WHEN STATED. When `groups` is provided (the seller
//     told us what they sell), each tier's `bullets` is REPLACED by its matching
//     group's item names, verbatim, in facts order, clamped to MAX_BULLETS.
//   • PER-TIER STRIP. A tier whose matching group has NO items gets `bullets`
//     forced to '' — facts are present but this tier states no inclusions, so any
//     AI-drafted bullets are fabrication and must go (zero-invention).
//   • AI-DRAFT WHEN SILENT. When `groups` is undefined/empty (the seller stated
//     nothing), AI-drafted bullets are LEFT UNTOUCHED — the prompt is allowed to
//     draft them as a fallback (copyPrompt.ts). Unlike praise (fake client quotes,
//     high risk), package inclusions are the seller's own scope, low-risk to draft.
//   • No-op when the page has no `packages` section (defensive).
//   • category_label is NOT injected here — WorkFacts carries no category string
//     (groups have `name`/`kind` only), so it stays AI-drafted / manual.
//
// ── FIREWALL ────────────────────────────────────────────────────────────────
//   Pure code. `import type` from the facts schema only. No react / stores /
//   hooks / templateId.
// ============================================================================

import type { SectionCopy } from '@/types/generation';
import type { WorkGroup } from '@/lib/schemas/workFacts.schema';
import { workElementContract } from '@/modules/engines/workSections';

const PACKAGES_SECTION = 'packages';
const PACKAGES_KEY = 'packages';
const BULLETS_FIELD = 'bullets';

/** Deterministic cap on injected bullet lines (a string field — no contract
 *  count constraint), so a group with dozens of shoots can't produce a runaway
 *  list. Kept small; portfolio copy earns its place by restraint. */
export const MAX_BULLETS = 8;

/** The group sub-items → bullet lines for one tier (verbatim names, clamped). */
function bulletsForGroup(group: WorkGroup | undefined): string {
  const items = group?.items ?? [];
  const lines = items
    .map((it) => (typeof it?.name === 'string' ? it.name.trim() : ''))
    .filter((s) => s.length > 0)
    .slice(0, MAX_BULLETS);
  return lines.join('\n');
}

/**
 * Inject the seller's stated group items verbatim into each package tier's
 * `bullets`. Mutates and returns the same sections map. See the LAW block above
 * for the strip / silent-fallback rules.
 *
 * @param sections  the parsed per-page section map
 * @param groups    the seller's stated work groups (facts.work.groups), or
 *                  undefined when the caller has no facts in scope
 */
export function injectPackages(
  sections: Record<string, SectionCopy>,
  groups: readonly WorkGroup[] | undefined
): Record<string, SectionCopy> {
  const section = sections[PACKAGES_SECTION];
  if (!section?.elements) return sections; // no packages section → no-op

  // Facts silent → leave AI-drafted bullets untouched (allowed fallback).
  if (!groups || groups.length === 0) return sections;

  const tiers = (section.elements as Record<string, unknown>)[PACKAGES_KEY];
  if (!Array.isArray(tiers)) return sections;

  tiers.forEach((tier, i) => {
    if (!tier || typeof tier !== 'object') return;
    // Positional tier↔group mapping (one card per stated item). Facts are
    // authoritative: verbatim inject, or per-tier strip when the group states
    // no items.
    (tier as Record<string, unknown>)[BULLETS_FIELD] = bulletsForGroup(groups[i]);
  });

  return sections;
}

/** The contract max for the `packages` collection — law-driven (defensive export). */
export function packagesMax(): number {
  return (
    workElementContract[PACKAGES_SECTION]?.collections?.[PACKAGES_KEY]?.constraints
      .max ?? 6
  );
}
