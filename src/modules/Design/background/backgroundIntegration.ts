// backgroundIntegration.ts — v3 palette-first background system
// Position-based section mapping, no per-section config.

import { type Palette, getDefaultPaletteForVibe, getPaletteById } from './palettes';
import { accentOptions } from '../ColorSystem/accentOptions';
import { logger } from '@/lib/logger';

type BackgroundType = 'primary' | 'secondary' | 'neutral';

export interface BackgroundSystem {
  primary: string;
  secondary: string;
  neutral: string;
  baseColor: string;
  accentColor: string;
  accentCSS: string;
}

// ===== SECTION TYPE EXTRACTION =====

const PRIMARY_SECTIONS = new Set(['hero', 'cta', 'closesection']);
const CHROME_SECTIONS = new Set(['header', 'footer']);

function extractSectionType(sectionId: string): string {
  return sectionId.split('-')[0].toLowerCase();
}

// ===== POSITION-BASED SECTION MAPPING =====

export function assignSectionBackgrounds(
  sections: string[]
): Record<string, BackgroundType> {
  const result: Record<string, BackgroundType> = {};
  let contentIndex = 0;

  for (const sectionId of sections) {
    const sType = extractSectionType(sectionId);

    if (CHROME_SECTIONS.has(sType)) {
      result[sectionId] = 'neutral';
    } else if (PRIMARY_SECTIONS.has(sType)) {
      result[sectionId] = 'primary';
    } else {
      result[sectionId] = contentIndex % 2 === 0 ? 'secondary' : 'neutral';
      contentIndex++;
    }
  }

  return result;
}

// ===== ACCENT SELECTION =====

function selectAccentFromPalette(palette: Palette): { accentColor: string; accentCSS: string } {
  const options = accentOptions.filter(o =>
    palette.compatibleAccents.includes(o.accentColor)
  );
  const selected = options.find(o => o.tags.includes('high-contrast')) || options[0];

  if (selected) {
    return { accentColor: selected.accentColor, accentCSS: selected.tailwind };
  }
  return { accentColor: 'blue', accentCSS: 'bg-blue-500' };
}

// ===== BACKGROUND SYSTEM GENERATION =====

export function generateBackgroundSystemFromPalette(palette: Palette): BackgroundSystem {
  const accent = selectAccentFromPalette(palette);
  return {
    primary: palette.primary,
    secondary: palette.secondary,
    neutral: palette.neutral,
    baseColor: palette.baseColor,
    accentColor: accent.accentColor,
    accentCSS: accent.accentCSS,
  };
}

export function generateBackgroundSystemForVibe(vibe: string): BackgroundSystem {
  const palette = getDefaultPaletteForVibe(vibe);
  logger.debug('🎨 [BG-V3] Palette for vibe:', { vibe, paletteId: palette.id, mode: palette.mode });
  return generateBackgroundSystemFromPalette(palette);
}

export function generateCompleteBackgroundSystem(_onboardingData?: any): BackgroundSystem {
  // Legacy compat: no vibe context available, use default
  const palette = getPaletteById('ice-blue') || getDefaultPaletteForVibe('Light Trust');
  return generateBackgroundSystemFromPalette(palette);
}

// ===== COMPAT WRAPPERS =====

export function getSectionBackgroundType(
  sectionId: string,
  allSections?: string[],
  _currentIndex?: number,
  _onboardingData?: any
): BackgroundType {
  if (allSections && allSections.length > 0) {
    const assignments = assignSectionBackgrounds(allSections);
    return assignments[sectionId] || 'neutral';
  }
  // Single section fallback
  const sType = extractSectionType(sectionId);
  if (PRIMARY_SECTIONS.has(sType)) return 'primary';
  if (CHROME_SECTIONS.has(sType)) return 'neutral';
  return 'secondary';
}

export function getSectionBackgroundTypeWithContext(
  sectionId: string,
  allSections: string[],
  _onboardingData?: any
): BackgroundType {
  return getSectionBackgroundType(sectionId, allSections);
}

export function getEnhancedSectionBackgroundType(
  sectionId: string,
  allSections: string[],
  _onboardingData: any
): BackgroundType {
  return getSectionBackgroundType(sectionId, allSections);
}

export function getSectionBackgroundTypeWithEnhancedLogic(
  sectionId: string,
  allSections: string[],
  _onboardingData: any
): BackgroundType {
  return getSectionBackgroundType(sectionId, allSections);
}

export function assignEnhancedBackgroundsToAllSections(
  sections: string[],
  _onboardingData: any
): Record<string, BackgroundType> {
  return assignSectionBackgrounds(sections);
}

export function getSectionBackgroundCSS(
  sectionId: string,
  backgroundSystem: BackgroundSystem,
  allSections?: string[],
  _onboardingData?: any
): string {
  const backgroundType = getSectionBackgroundType(sectionId, allSections);
  return backgroundSystem[backgroundType];
}

// ===== TEXT COLOR RE-EXPORTS =====

export {
  getTextColorForBackground,
  getBodyColorForBackground,
  getMutedColorForBackground
} from '@/utils/improvedTextColors';
