// vibeDesignTokens.ts — Vibe-to-design-token mapping (fonts, tone, energy)
// Extracted from vibeMapping.ts (archived). No background logic.

import type { Vibe } from '@/types/generation';

interface VibeDesignMapping {
  accentEnergy: 'low' | 'medium' | 'high';
  headingFont: string;
  bodyFont: string;
  toneProfile: string;
}

const vibeToDesign: Record<Vibe, VibeDesignMapping> = {
  'Dark Tech': {
    accentEnergy: 'high',
    headingFont: "'Sora', sans-serif",
    bodyFont: "'Inter', sans-serif",
    toneProfile: 'minimal-technical',
  },
  'Light Trust': {
    accentEnergy: 'medium',
    headingFont: "'Inter', sans-serif",
    bodyFont: "'Inter', sans-serif",
    toneProfile: 'friendly-helpful',
  },
  'Warm Friendly': {
    accentEnergy: 'medium',
    headingFont: "'DM Sans', sans-serif",
    bodyFont: "'DM Sans', sans-serif",
    toneProfile: 'confident-playful',
  },
  'Bold Energy': {
    accentEnergy: 'high',
    headingFont: "'Sora', sans-serif",
    bodyFont: "'DM Sans', sans-serif",
    toneProfile: 'bold-persuasive',
  },
  'Calm Minimal': {
    accentEnergy: 'low',
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Inter', sans-serif",
    toneProfile: 'luxury-expert',
  },
};

export function getFontsForVibe(vibe: Vibe): { heading: string; body: string } {
  const m = vibeToDesign[vibe];
  return { heading: m.headingFont, body: m.bodyFont };
}

export function getToneProfileForVibe(vibe: Vibe): string {
  return vibeToDesign[vibe].toneProfile;
}

export function getAccentEnergyForVibe(vibe: Vibe): 'low' | 'medium' | 'high' {
  return vibeToDesign[vibe].accentEnergy;
}

export interface VibeDesignTokens {
  headingFont: string;
  bodyFont: string;
  accentEnergy: 'low' | 'medium' | 'high';
  toneProfile: string;
}

export function getDesignTokensForVibe(vibe: Vibe): VibeDesignTokens {
  const m = vibeToDesign[vibe];
  return {
    headingFont: m.headingFont,
    bodyFont: m.bodyFont,
    accentEnergy: m.accentEnergy,
    toneProfile: m.toneProfile,
  };
}
