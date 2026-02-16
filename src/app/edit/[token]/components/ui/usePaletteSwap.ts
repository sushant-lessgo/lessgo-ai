"use client";

import { useCallback } from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { type Palette } from '@/modules/Design/background/palettes';
import { getCompatibleTextures, compileBackground } from '@/modules/Design/background/textures';
import { generateBackgroundSystemFromPalette } from '@/modules/Design/background/backgroundIntegration';

export function usePaletteSwap() {
  const {
    theme,
    updateTheme,
    updateFromBackgroundSystem,
    recalculateTextColors,
  } = useEditStore();

  const textureId = theme?.colors?.textureId || 'none';

  const handlePaletteSwap = useCallback(
    (newPalette: Palette) => {
      const newCompatible = getCompatibleTextures(newPalette);
      const textureStillValid = newCompatible.some((t) => t.id === textureId);
      const finalTextureId = textureStillValid ? textureId : 'none';

      const bgSystem = generateBackgroundSystemFromPalette(newPalette);
      const compiledPrimary = compileBackground(newPalette, finalTextureId, 'primary');
      const compiledSecondary = compileBackground(newPalette, finalTextureId, 'secondary');

      updateFromBackgroundSystem({
        ...bgSystem,
        primary: compiledPrimary,
        secondary: compiledSecondary,
      });

      updateTheme({
        colors: {
          paletteId: newPalette.id,
          textureId: finalTextureId,
        } as any,
      });

      recalculateTextColors();
    },
    [textureId, updateFromBackgroundSystem, updateTheme, recalculateTextColors]
  );

  return handlePaletteSwap;
}
