import { create } from 'zustand';

// Utility functions
const darken = (hex: string, amount: number) =>
  shadeColor(hex, -amount);
const lighten = (hex: string, amount: number) =>
  shadeColor(hex, amount);

function shadeColor(hex: string, percent: number) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 0 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

function isLight(hex: string) {
  const c = hex.substring(1); // strip #
  const rgb = parseInt(c, 16); // convert rrggbb to decimal
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 180;
}

// Store type
interface ThemeState {
  primary: string;
  background: string;
  muted: string;
  setTheme: (colors: Partial<ThemeState>) => void;
  resetTheme: () => void;
  getFullTheme: () => Record<string, string>;
}

// Store implementation
export const useThemeStore = create<ThemeState>((set, get) => ({
  primary: '#14B8A6',
  background: '#F9FAFB',
  muted: '#6B7280',

  setTheme: (colors) => set((state) => ({ ...state, ...colors })),

  resetTheme: () =>
    set({
      primary: '#14B8A6',
      background: '#F9FAFB',
      muted: '#6B7280',
    }),

  getFullTheme: () => {
    const { primary, background, muted } = get();

    const theme = {
      '--landing-primary': primary,
      '--landing-primary-hover': darken(primary, 10),
      '--landing-accent': lighten(primary, 15),
      '--landing-muted-bg': background,
      '--landing-border': isLight(background)
        ? 'rgba(0,0,0,0.08)'
        : 'rgba(255,255,255,0.1)',
      '--landing-text-primary': isLight(background) ? '#111827' : '#F9FAFB',
      '--landing-text-secondary': isLight(background) ? '#374151' : '#D1D5DB',
      '--landing-text-muted': muted,
    };

    return theme;
  },
}));
