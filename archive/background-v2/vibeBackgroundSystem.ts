import { Vibe } from '@/types/generation';
import { getBackgroundsByCategory, PrimaryBackground } from './background/primaryBackgrounds';
import { getSecondaryBackground } from './background/simpleSecondaryBackgrounds';
import { accentOptions } from './ColorSystem/accentOptions';

// Vibe → Category + BaseColor filter (hybrid approach)
// Differentiates vibes that share same category via baseColor filtering
interface VibeConfig {
  category: 'technical' | 'professional' | 'friendly';
  baseColors?: string[];  // If specified, filter backgrounds to these baseColors only
}

const VIBE_CONFIG: Record<Vibe, VibeConfig> = {
  'Dark Tech': {
    category: 'technical'
    // No baseColor filter - all technical backgrounds work
  },
  'Light Trust': {
    category: 'professional',
    baseColors: ['blue', 'sky', 'slate', 'indigo']  // Trust = blue tones
  },
  'Warm Friendly': {
    category: 'friendly',
    baseColors: ['amber', 'orange', 'yellow', 'emerald', 'green', 'teal']  // Warm tones
  },
  'Bold Energy': {
    category: 'friendly',
    baseColors: ['purple', 'pink', 'indigo', 'violet', 'blue', 'cyan']  // Vibrant/cool tones
  },
  'Calm Minimal': {
    category: 'professional',
    baseColors: ['gray', 'slate', 'stone', 'neutral', 'zinc']  // Neutral tones only
  },
};

// Vibe → Neutral background (dark vibes need dark neutral)
const VIBE_NEUTRAL: Record<Vibe, string> = {
  'Dark Tech': '#0f172a',      // Dark slate
  'Light Trust': '#ffffff',
  'Warm Friendly': '#fffbeb',  // Warm white
  'Bold Energy': '#faf5ff',    // Light purple tint
  'Calm Minimal': '#fafafa',   // Near white
};

// Divider color map (from existing calculateOtherBackgrounds)
const DIVIDER_MAP: Record<string, string> = {
  blue: 'rgba(219, 234, 254, 0.5)',
  sky: 'rgba(224, 242, 254, 0.5)',
  indigo: 'rgba(224, 231, 255, 0.5)',
  purple: 'rgba(243, 232, 255, 0.5)',
  pink: 'rgba(252, 231, 243, 0.5)',
  orange: 'rgba(255, 237, 213, 0.5)',
  amber: 'rgba(254, 243, 199, 0.5)',
  yellow: 'rgba(254, 249, 195, 0.5)',
  green: 'rgba(220, 252, 231, 0.5)',
  emerald: 'rgba(209, 250, 229, 0.5)',
  teal: 'rgba(204, 251, 241, 0.5)',
  cyan: 'rgba(207, 250, 254, 0.5)',
  gray: 'rgba(243, 244, 246, 0.5)',
  slate: 'rgba(241, 245, 249, 0.5)',
  stone: 'rgba(245, 245, 244, 0.5)',
};

export interface VibeBackgroundSystem {
  primary: string;        // CSS gradient/color for hero/cta
  secondary: string;      // Subtle tint for features/content
  neutral: string;        // Clean sections (vibe-aware)
  divider: string;        // Subtle separators
  baseColor: string;      // Tailwind color name
  accentColor: string;    // Complementary accent name
  accentCSS: string;      // Tailwind class for buttons
}

/**
 * Get random accent option for a base color
 * Uses existing accentOptions which have curated color harmony pairs
 */
function getAccentForBaseColor(baseColor: string): { accentColor: string; accentCSS: string } {
  const options = accentOptions.filter(o => o.baseColor === baseColor);

  if (options.length === 0) {
    // Fallback: use blue-500 as safe default
    return { accentColor: 'blue', accentCSS: 'bg-blue-500' };
  }

  // Random pick from matching options (preserves variety)
  const selected = options[Math.floor(Math.random() * options.length)];

  return {
    accentColor: selected.accentColor,
    accentCSS: selected.tailwind
  };
}

/**
 * Generate complete background system from vibe only
 *
 * Flow:
 * 1. Vibe → Category + BaseColor filter → Random primary background
 * 2. Primary baseColor → Secondary (existing function)
 * 3. Primary baseColor → Accent (color harmony)
 * 4. Vibe → Neutral (dark vibes get dark neutral)
 */
export function generateBackgroundSystemForVibe(vibe: Vibe): VibeBackgroundSystem {
  // Step 1: Vibe → Category → Filter by baseColors → Random Primary
  const config = VIBE_CONFIG[vibe];
  let backgrounds = getBackgroundsByCategory(config.category);

  // Apply baseColor filter if specified (differentiates vibes sharing same category)
  if (config.baseColors && config.baseColors.length > 0) {
    backgrounds = backgrounds.filter(bg => config.baseColors!.includes(bg.baseColor));
  }

  if (backgrounds.length === 0) {
    // Fallback: use all backgrounds from category if filter too restrictive
    console.warn(`No backgrounds matched filter for ${vibe}, using full category`);
    backgrounds = getBackgroundsByCategory(config.category);
  }

  const primary = backgrounds[Math.floor(Math.random() * backgrounds.length)];

  // Step 2: Derive secondary from baseColor (existing function)
  const secondary = getSecondaryBackground(primary.baseColor);

  // Step 3: Derive accent from baseColor (color harmony)
  const accent = getAccentForBaseColor(primary.baseColor);

  // Step 4: Get vibe-appropriate neutral and divider
  const neutral = VIBE_NEUTRAL[vibe];
  const divider = DIVIDER_MAP[primary.baseColor] || 'rgba(243, 244, 246, 0.5)';

  return {
    primary: primary.css,
    secondary,
    neutral,
    divider,
    baseColor: primary.baseColor,
    accentColor: accent.accentColor,
    accentCSS: accent.accentCSS
  };
}
