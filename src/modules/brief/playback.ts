// src/modules/brief/playback.ts
// Confirm-card copy — PURE module (scale-02 phase 1, plan D7). ALL
// user-facing entry copy is centralized here for the founder's pre-launch
// review (spec open q1). Internal terms (engine/archetype/rung) are NEVER
// rendered.

import type { Brief } from '@/types/brief';
import { goalIntentMeta } from '@/modules/goals/vocabulary';
import {
  businessTypeKeys,
  businessTypes,
  type BusinessTypeKey,
} from '@/modules/businessTypes/config';

/**
 * User-language playback line for the confirm card:
 * "A page for your {category|label} that gets visitors to {goal, lowercased}."
 */
export function playbackSentence(brief: Brief): string {
  const known =
    !!brief.businessType && brief.businessType in businessTypes
      ? businessTypes[brief.businessType as BusinessTypeKey]
      : undefined;
  const what = brief.category ?? known?.label ?? brief.businessType ?? 'business';
  const goal = brief.goal
    ? goalIntentMeta[brief.goal.intent].label.toLowerCase()
    : 'take action';
  return `A page for your ${what} that gets visitors to ${goal}.`;
}

export interface ChooserCard {
  /** businessType key, or 'other' for the manual-capture card. */
  key: BusinessTypeKey | 'other';
  label: string;
}

/**
 * Chooser = businessType cards (user language), NOT engine cards (plan D7).
 * "Something else" routes to manual capture (rungA:unclassified).
 */
export function chooserCards(): ChooserCard[] {
  return [
    ...businessTypeKeys.map((key) => ({ key, label: businessTypes[key].label })),
    { key: 'other' as const, label: 'Something else' },
  ];
}
