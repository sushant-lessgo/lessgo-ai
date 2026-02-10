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
      dark: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px) 0 0/20px 20px',
      light: 'radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px) 0 0/20px 20px',
    },
  },
  {
    id: 'line-grid',
    label: 'Line Grid',
    css: {
      dark: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 30px), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 30px)',
      light: '',
    },
  },
  {
    id: 'paper',
    label: 'Paper',
    css: {
      dark: '',
      light: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
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
