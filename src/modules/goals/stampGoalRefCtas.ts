// src/modules/goals/stampGoalRefCtas.ts
// goal-ref-cta phase 1 (D-E) — the SINGLE generation-time writer of
// `dest:'GOAL_REF'` for EVERY goal mechanism (M1–M5), on BOTH generation paths.
//
// PLAIN module (NO 'use client'): reached from server/generation code
// (finalize.ts single-page tail + multiPageAssembly.finalizeMultiPageGeneration).
// It imports ONLY types — never a store, never a React component — so it is
// firewall-safe past the published/client boundary.
//
// Why a separate module (not a branch inside seedGoalForm): `seedGoalForm`'s name
// AND gate are FORM-scoped (M1 only). Stamping is mechanism-agnostic and must run
// for M2–M5 where no form exists. Burying it behind an M1 gate is exactly how F5
// (hero/header carry no CTA metadata) happened.
//
// Contract:
//   stampGoalRefCtas(contentTree, { goal, formId? })
//     contentTree = Record<sectionId, Section> whose sections carry
//       `elements` / `elementMetadata`.
//   • Stamps ONLY allowlisted element keys (D-A: `cta_text`) with
//     `{ role:'primary', dest:'GOAL_REF' }` (+ `formId` iff M1; non-M1 carries
//     NO formId).
//   • Creates `elementMetadata` entries where missing (the F5 case), preserving
//     any existing entry fields (e.g. a seedGoalForm `buttonConfig`).
//   • NEVER writes a resolved `Destination` — resolution happens at render/export
//     via normalizeCtas → goalToDestination.
//   • Idempotent: re-stamping writes the same value.
//   • `goal == null` → no-op (stamping GOAL_REF with no goal would resolve every
//     primary to `'#'`, strictly worse than today's template fallback).
//   • Skips sections with no allowlisted key silently (ratified #3).

import type { Brief } from '@/types/brief';
import type { CTAButton } from '@/types/destination';

type BriefGoal = NonNullable<Brief['goal']>;

/**
 * The ONE allowlisted primary-CTA element key (D-A). `cta_text` is the hero /
 * header / cta-section primary across every template. `signin_text`,
 * `secondary_cta_text`, `newsletter_cta`, and the dynamic pricing-tier keys
 * (`tiers_cta_*` / `packages_cta_*`) are OUT of scope and stay excluded — see
 * ctaKeyAllowlist.test.ts for the mechanical guard.
 */
export const GOAL_REF_STAMP_KEYS = ['cta_text'] as const;

/** M1 = on-site form (incl. the `subscribe-newsletter` override → mechanism M1). */
function isM1(goal: BriefGoal): boolean {
  return goal.mechanism === 'M1' || goal.intent === 'subscribe-newsletter';
}

/**
 * Resolve the M1 form id to carry on the stamp — read BACK from an already-built
 * `forms` map (never generated here: `seedGoalForm` returns void, and multipage's
 * `ensureSiteContactForm` is internal to the merge). Non-M1 → undefined.
 *
 * Sole-form invariant (pinned): BOTH generation paths cap at ≤1 form
 * (`ensureSiteContactForm` is idempotent by name `'Contact'`; `seedGoalForm`
 * no-ops when any form exists), so the single-entry branch always fires today.
 * The `'Contact'`-name preference is a guard for a hypothetical future second
 * form — if one ever appears, revisit this rule rather than silently dangling.
 */
export function resolveGoalFormId(
  forms: Record<string, any> | null | undefined,
  goal: BriefGoal | null | undefined,
): string | undefined {
  if (!goal || !isM1(goal)) return undefined;
  if (!forms || typeof forms !== 'object') return undefined;
  const ids = Object.keys(forms);
  if (ids.length === 0) return undefined;
  if (ids.length === 1) return ids[0];
  const contact = ids.find((id) => forms[id]?.name === 'Contact');
  return contact ?? ids[0];
}

/**
 * Stamp a SINGLE section's allowlisted CTA keys with GOAL_REF (mutates in place).
 * Exported for chrome stamping (`fc.chrome.header.data` is a lone section, not a
 * content map). No-op on null goal / non-object section / sections with no
 * allowlisted key present.
 */
export function stampSectionGoalRefCtas(
  section: any,
  goal: BriefGoal | null | undefined,
  formId?: string,
): void {
  if (!goal) return;
  if (!section || typeof section !== 'object') return;

  const elements = section.elements;
  const existingMeta = section.elementMetadata;
  const m1 = isM1(goal);

  for (const key of GOAL_REF_STAMP_KEYS) {
    const hasElement =
      elements && typeof elements === 'object' && key in elements;
    const hasMeta =
      existingMeta && typeof existingMeta === 'object' && key in existingMeta;
    // Only stamp keys the section actually carries (element present, or an
    // existing metadata entry) — never phantom-stamp a key onto a section that
    // renders no such button.
    if (!hasElement && !hasMeta) continue;

    if (!section.elementMetadata || typeof section.elementMetadata !== 'object') {
      section.elementMetadata = {};
    }
    const entry = section.elementMetadata[key] ?? {};
    const cta: CTAButton =
      m1 && formId !== undefined
        ? { role: 'primary', dest: 'GOAL_REF', formId }
        : { role: 'primary', dest: 'GOAL_REF' };
    section.elementMetadata[key] = { ...entry, cta };
  }
}

/**
 * Stamp every section in a content tree (`Record<sectionId, Section>`).
 * Idempotent, in-place; no-op on null goal / non-object tree.
 */
export function stampGoalRefCtas(
  contentTree: Record<string, any> | null | undefined,
  opts: { goal: BriefGoal | null | undefined; formId?: string },
): void {
  if (!contentTree || typeof contentTree !== 'object') return;
  if (!opts.goal) return;
  for (const sectionId of Object.keys(contentTree)) {
    stampSectionGoalRefCtas(contentTree[sectionId], opts.goal, opts.formId);
  }
}
