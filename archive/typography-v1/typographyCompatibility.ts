// /app/edit/[token]/components/ui/typography/typographyCompatibility.ts
import { fontThemesByTone, type FontTheme } from '@/modules/Design/fontSystem/fontThemes';

export const compatibleTones = {
  'confident-playful': ['friendly-helpful', 'bold-persuasive'],
  'minimal-technical': ['bold-persuasive', 'luxury-expert'],   
  'bold-persuasive': ['confident-playful', 'minimal-technical'],
  'friendly-helpful': ['confident-playful', 'minimal-technical'],
  'luxury-expert': ['minimal-technical', 'bold-persuasive']
};

export function getCompatibleTones(currentTone: string): string[] {
  return compatibleTones[currentTone as keyof typeof compatibleTones] || [];
}

export function getTypographyOptions(currentTone: string): FontTheme[] {
  const primaryOptions = fontThemesByTone[currentTone] || [];
  
  const compatibleToneIds = getCompatibleTones(currentTone);
  const secondaryOptions = compatibleToneIds.flatMap(tone => 
    (fontThemesByTone[tone] || []).slice(0, 1)
  );
  
  return [...primaryOptions, ...secondaryOptions];
}

export function generateFontPairName(theme: FontTheme): string {
  const headingName = extractFontName(theme.headingFont);
  const bodyName = extractFontName(theme.bodyFont);
  
  if (headingName === bodyName) {
    return `${headingName} Mono`;
  }
  return `${headingName} + ${bodyName}`;
}

function extractFontName(fontFamily: string): string {
  const match = fontFamily.match(/^['"]?([^'"]+)['"]?/);
  return match ? match[1] : fontFamily.split(',')[0].trim();
}