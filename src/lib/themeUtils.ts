// Server-side theme utilities for published pages
// Copied from useThemeStore.ts color logic

export function darken(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = ((num >> 8) & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)
  ).toString(16).slice(1);
}

export function lighten(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)
  ).toString(16).slice(1);
}

export function isLight(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

/**
 * Generate theme CSS variables from base colors
 * This will be embedded as inline <style> in published htmlContent
 */
export function generateThemeCSS(baseColors: {
  primary: string;
  background: string;
  muted: string;
}): string {
  const cssVars = {
    '--landing-primary': baseColors.primary,
    '--landing-primary-hover': darken(baseColors.primary, 10),
    '--landing-accent': lighten(baseColors.primary, 10),
    '--landing-muted-bg': baseColors.background,
    '--landing-border': isLight(baseColors.background)
      ? darken(baseColors.background, 10)
      : lighten(baseColors.background, 10),
    '--landing-text-primary': isLight(baseColors.background) ? '#111827' : '#F9FAFB',
    '--landing-text-secondary': isLight(baseColors.background) ? '#6B7280' : '#D1D5DB',
    '--landing-text-muted': baseColors.muted,
  };

  return `<style>:root{${Object.entries(cssVars).map(([k, v]) => `${k}:${v};`).join('')}}</style>`;
}
