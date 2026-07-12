"use client";

import { useCallback } from 'react';
import { useEditStore, useEditStoreApi } from '@/hooks/useEditStore';
import { type Palette } from '@/modules/Design/background/palettes';
import { getCompatibleTextures, compileBackground } from '@/modules/Design/background/textures';
import { generateBackgroundSystemFromPalette } from '@/modules/Design/background/backgroundIntegration';

export function usePaletteSwap() {
  // Render-time read: narrow selector for the current texture id.
  const textureId = useEditStore((s) => s.theme?.colors?.textureId || 'none');
  // Non-reactive store instance — actions read in the handler only.
  const storeApi = useEditStoreApi();

  const handlePaletteSwap = useCallback(
    (newPalette: Palette) => {
      const newCompatible = getCompatibleTextures(newPalette);
      const textureStillValid = newCompatible.some((t) => t.id === textureId);
      const finalTextureId = textureStillValid ? textureId : 'none';

      const bgSystem = generateBackgroundSystemFromPalette(newPalette);
      const compiledPrimary = compileBackground(newPalette, finalTextureId, 'primary');
      const compiledSecondary = compileBackground(newPalette, finalTextureId, 'secondary');

      const { updateFromBackgroundSystem, updateTheme, recalculateTextColors } = storeApi.getState();

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
    [textureId, storeApi]
  );

  return handlePaletteSwap;
}
