// pickFont.ts
import { fontThemesByTone, FontTheme } from './fontThemes';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';

export function pickFontFromOnboarding(): FontTheme {
  const hiddenFields = useOnboardingStore.getState().hiddenInferredFields;

  // Get tone from inferred fields
  const toneId = hiddenFields?.brandTone || 'minimal-technical';

  // Look up theme options for the tone
  const fontOptions = fontThemesByTone[toneId] || fontThemesByTone['minimal-technical'];

  // Select one at random
  const selected = fontOptions[Math.floor(Math.random() * fontOptions.length)];

  return selected;
}
