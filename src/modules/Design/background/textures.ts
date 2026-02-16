// textures.ts — Texture overlay system (v3)

import type { Palette } from './palettes';

export interface TextureOverlay {
  id: string;
  label: string;
  css: { dark: string; light: string };
}

export const textures: TextureOverlay[] = [
  {
    id: 'dot-grid',
    label: 'Dot Grid',
    css: {
      dark: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px) 0 0/20px 20px',
      light: 'radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px) 0 0/20px 20px',
    },
  },
  {
    id: 'line-grid',
    label: 'Line Grid',
    css: {
      dark: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 30px), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 30px)',
      light: '',
    },
  },
  {
    id: 'paper',
    label: 'Paper',
    css: {
      dark: '',
      light: [
        'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.09) 1px, transparent 1px) 0 0/5px 5px',
        'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.07) 1px, transparent 1px) 2px 3px/7px 7px',
        'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.06) 1px, transparent 1px) 1px 4px/6px 6px',
      ].join(', '),
    },
  },
  {
    id: 'noise',
    label: 'Noise',
    css: {
      dark: [
        'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.06) 1px, transparent 1px) 0 0/8px 8px',
        'radial-gradient(circle at 75% 75%, rgba(255,255,255,0.04) 1px, transparent 1px) 4px 4px/8px 8px',
        'radial-gradient(circle at 50% 10%, rgba(255,255,255,0.03) 1px, transparent 1px) 2px 6px/12px 12px',
      ].join(', '),
      light: [
        'radial-gradient(circle at 25% 25%, rgba(0,0,0,0.05) 1px, transparent 1px) 0 0/8px 8px',
        'radial-gradient(circle at 75% 75%, rgba(0,0,0,0.04) 1px, transparent 1px) 4px 4px/8px 8px',
        'radial-gradient(circle at 50% 10%, rgba(0,0,0,0.03) 1px, transparent 1px) 2px 6px/12px 12px',
      ].join(', '),
    },
  },
  {
    id: 'none',
    label: 'None',
    css: { dark: '', light: '' },
  },
];

// Compatibility: which textures work on which surfaces
type Surface = 'primary' | 'secondary' | 'neutral';

function isTextureCompatible(textureId: string, mode: 'dark' | 'light', surface: Surface): boolean {
  if (textureId === 'none') return true;
  if (surface === 'neutral') return false;
  if (surface === 'secondary' && mode === 'light') return false;

  if (textureId === 'dot-grid') return true; // dark primary, light primary, dark secondary
  if (textureId === 'line-grid') return mode === 'dark' && surface === 'primary';
  if (textureId === 'paper') return mode === 'light' && surface === 'primary';
  if (textureId === 'noise') return surface === 'primary'; // both dark and light
  return false;
}

export function getCompatibleTextures(palette: Palette): TextureOverlay[] {
  // Return textures compatible with at least the primary surface
  return textures.filter(t =>
    t.id === 'none' || isTextureCompatible(t.id, palette.mode, 'primary')
  );
}

export function compileBackground(
  palette: Palette,
  textureId: string,
  surface: Surface
): string {
  const bg = palette[surface];

  if (!isTextureCompatible(textureId, palette.mode, surface)) return bg;

  const texture = textures.find(t => t.id === textureId);
  if (!texture || textureId === 'none') return bg;

  const textureCss = texture.css[palette.mode];
  if (!textureCss) return bg;

  return `${textureCss}, ${bg}`;
}
