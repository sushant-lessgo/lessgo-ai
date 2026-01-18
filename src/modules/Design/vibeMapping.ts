// src/modules/design/vibeMapping.ts
// Maps Vibe to design tokens - compatible with existing background system
// Pure function, no API call

import type { Vibe } from '@/types/generation';
import {
  type BackgroundCategory,
  type PrimaryBackground,
  getBackgroundsByCategory,
  primaryBackgrounds
} from '../Design/background/primaryBackgrounds';

/**
 * Design mapping for a Vibe
 */
export interface VibeDesignMapping {
  backgroundCategory: BackgroundCategory;
  preferredArchetypePatterns: string[];
  accentEnergy: 'low' | 'medium' | 'high';
  headingFont: string;
  bodyFont: string;
  toneProfile: string;
}

/**
 * Vibe to Design mapping
 * Uses existing BackgroundCategory system from primaryBackgrounds.ts
 */
export const vibeToDesign: Record<Vibe, VibeDesignMapping> = {
  'Dark Tech': {
    backgroundCategory: 'technical',
    preferredArchetypePatterns: ['matrix', 'mesh', 'dark', 'spotlight', 'midnight', 'graphite'],
    accentEnergy: 'high',
    headingFont: "'Sora', sans-serif",
    bodyFont: "'Inter', sans-serif",
    toneProfile: 'minimal-technical'
  },
  'Light Trust': {
    backgroundCategory: 'professional',
    preferredArchetypePatterns: ['light', 'frost', 'paper', 'glass', 'trust', 'soft'],
    accentEnergy: 'medium',
    headingFont: "'Inter', sans-serif",
    bodyFont: "'Inter', sans-serif",
    toneProfile: 'friendly-helpful'
  },
  'Warm Friendly': {
    backgroundCategory: 'friendly',
    preferredArchetypePatterns: ['soft', 'warm', 'peach', 'coral', 'ember', 'sunset'],
    accentEnergy: 'medium',
    headingFont: "'DM Sans', sans-serif",
    bodyFont: "'DM Sans', sans-serif",
    toneProfile: 'confident-playful'
  },
  'Bold Energy': {
    backgroundCategory: 'professional',
    preferredArchetypePatterns: ['energy', 'vibrant', 'diagonal', 'rings', 'startup', 'modern'],
    accentEnergy: 'high',
    headingFont: "'Sora', sans-serif",
    bodyFont: "'DM Sans', sans-serif",
    toneProfile: 'bold-persuasive'
  },
  'Calm Minimal': {
    backgroundCategory: 'professional',
    preferredArchetypePatterns: ['editorial', 'mono', 'calm', 'zen', 'paper', 'minimal'],
    accentEnergy: 'low',
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Inter', sans-serif",
    toneProfile: 'luxury-expert'
  }
};

/**
 * Get design mapping for a Vibe
 */
export function getDesignFromVibe(vibe: Vibe): VibeDesignMapping {
  return vibeToDesign[vibe];
}

/**
 * Select a background that matches the Vibe
 * Uses existing category system with optional archetype filtering
 */
export function selectBackgroundForVibe(vibe: Vibe): PrimaryBackground {
  const mapping = vibeToDesign[vibe];

  // Get backgrounds from category
  let pool = getBackgroundsByCategory(mapping.backgroundCategory);

  // Fallback to all backgrounds if category pool is too small
  if (pool.length < 5) {
    pool = primaryBackgrounds;
  }

  // Try to filter by preferred archetype patterns
  if (mapping.preferredArchetypePatterns.length > 0) {
    const filtered = pool.filter(bg =>
      mapping.preferredArchetypePatterns.some(pattern =>
        bg.id.toLowerCase().includes(pattern.toLowerCase())
      )
    );

    // Only use filtered if we have enough options (at least 3)
    if (filtered.length >= 3) {
      pool = filtered;
    }
  }

  // Random selection from pool
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * Get font CSS for a Vibe
 */
export function getFontsForVibe(vibe: Vibe): { heading: string; body: string } {
  const mapping = vibeToDesign[vibe];
  return {
    heading: mapping.headingFont,
    body: mapping.bodyFont
  };
}

/**
 * Get accent energy level for a Vibe
 */
export function getAccentEnergyForVibe(vibe: Vibe): 'low' | 'medium' | 'high' {
  return vibeToDesign[vibe].accentEnergy;
}

/**
 * Get tone profile for a Vibe (for copy generation)
 */
export function getToneProfileForVibe(vibe: Vibe): string {
  return vibeToDesign[vibe].toneProfile;
}

/**
 * Get complete design tokens for a Vibe
 */
export interface VibeDesignTokens {
  background: PrimaryBackground;
  headingFont: string;
  bodyFont: string;
  accentEnergy: 'low' | 'medium' | 'high';
  toneProfile: string;
}

export function getDesignTokensForVibe(vibe: Vibe): VibeDesignTokens {
  const mapping = vibeToDesign[vibe];
  return {
    background: selectBackgroundForVibe(vibe),
    headingFont: mapping.headingFont,
    bodyFont: mapping.bodyFont,
    accentEnergy: mapping.accentEnergy,
    toneProfile: mapping.toneProfile
  };
}
