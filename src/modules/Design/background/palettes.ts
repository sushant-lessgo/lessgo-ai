// palettes.ts — 30 hand-curated palettes (v3 palette-first architecture)

export interface Palette {
  id: string;
  label: string;
  mode: 'dark' | 'light';
  temperature: 'cool' | 'neutral' | 'warm';
  energy: 'calm' | 'bold';
  colorFamily: string;
  fontPairing: string;
  baseColor: string;
  primary: string;
  secondary: string;
  neutral: string;
  compatibleAccents: string[];
}

// ─── DARK MODE — Cool ───

const midnightSlate: Palette = {
  id: 'midnight-slate',
  label: 'Midnight Slate',
  mode: 'dark',
  temperature: 'cool',
  energy: 'bold',
  colorFamily: 'navy-slate',
  fontPairing: 'sora-inter',
  baseColor: 'slate',
  primary: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
  secondary: '#1a2332',
  neutral: '#0f172a',
  compatibleAccents: ['cyan', 'sky', 'emerald', 'purple'],
};

const deepIndigo: Palette = {
  id: 'deep-indigo',
  label: 'Deep Indigo',
  mode: 'dark',
  temperature: 'cool',
  energy: 'bold',
  colorFamily: 'indigo',
  fontPairing: 'sora-inter',
  baseColor: 'indigo',
  primary: 'linear-gradient(135deg, #1e1b4b, #312e81)',
  secondary: '#1e1b4b',
  neutral: '#0f0d2e',
  compatibleAccents: ['cyan', 'emerald', 'amber', 'sky'],
};

const oceanAbyss: Palette = {
  id: 'ocean-abyss',
  label: 'Ocean Abyss',
  mode: 'dark',
  temperature: 'cool',
  energy: 'calm',
  colorFamily: 'teal-ocean',
  fontPairing: 'inter-inter',
  baseColor: 'teal',
  primary: 'linear-gradient(135deg, #0c4a6e, #164e63)',
  secondary: '#0e3a52',
  neutral: '#0a2540',
  compatibleAccents: ['amber', 'emerald', 'orange'],
};

const arcticNight: Palette = {
  id: 'arctic-night',
  label: 'Arctic Night',
  mode: 'dark',
  temperature: 'cool',
  energy: 'calm',
  colorFamily: 'navy-slate',
  fontPairing: 'inter-inter',
  baseColor: 'gray',
  primary: 'linear-gradient(to bottom right, #111827, #1f2937, #111827)',
  secondary: '#1a1f2e',
  neutral: '#111827',
  compatibleAccents: ['sky', 'blue', 'emerald', 'orange'],
};

const steelMidnight: Palette = {
  id: 'steel-midnight',
  label: 'Steel Midnight',
  mode: 'dark',
  temperature: 'cool',
  energy: 'calm',
  colorFamily: 'navy-slate',
  fontPairing: 'inter-inter',
  baseColor: 'slate',
  primary: 'radial-gradient(ellipse at top, #1e293b, #0f172a)',
  secondary: '#162032',
  neutral: '#0f172a',
  compatibleAccents: ['sky', 'cyan', 'purple', 'emerald'],
};

// ─── DARK MODE — Neutral ───

const graphite: Palette = {
  id: 'graphite',
  label: 'Graphite',
  mode: 'dark',
  temperature: 'neutral',
  energy: 'calm',
  colorFamily: 'navy-slate',
  fontPairing: 'inter-inter',
  baseColor: 'gray',
  primary: 'linear-gradient(135deg, #1f2937, #374151)',
  secondary: '#1a2030',
  neutral: '#111827',
  compatibleAccents: ['orange', 'emerald', 'sky', 'purple'],
};

const obsidian: Palette = {
  id: 'obsidian',
  label: 'Obsidian',
  mode: 'dark',
  temperature: 'neutral',
  energy: 'bold',
  colorFamily: 'pure-gray',
  fontPairing: 'sora-inter',
  baseColor: 'stone',
  primary: 'radial-gradient(ellipse at top right, #1c1917, #292524)',
  secondary: '#1c1917',
  neutral: '#0c0a09',
  compatibleAccents: ['orange', 'amber', 'emerald', 'sky'],
};

const charcoal: Palette = {
  id: 'charcoal',
  label: 'Charcoal',
  mode: 'dark',
  temperature: 'neutral',
  energy: 'calm',
  colorFamily: 'pure-gray',
  fontPairing: 'inter-inter',
  baseColor: 'zinc',
  primary: 'linear-gradient(to bottom, #18181b, #27272a)',
  secondary: '#1e1e22',
  neutral: '#18181b',
  compatibleAccents: ['emerald', 'sky', 'purple', 'orange'],
};

// ─── DARK MODE — Warm ───

const espresso: Palette = {
  id: 'espresso',
  label: 'Espresso',
  mode: 'dark',
  temperature: 'warm',
  energy: 'calm',
  colorFamily: 'brown',
  fontPairing: 'playfair-inter',
  baseColor: 'stone',
  primary: 'linear-gradient(135deg, #1c1210, #2c1d18)',
  secondary: '#1a1412',
  neutral: '#120e0c',
  compatibleAccents: ['amber', 'orange', 'emerald', 'sky'],
};

const darkTerracotta: Palette = {
  id: 'dark-terracotta',
  label: 'Dark Terracotta',
  mode: 'dark',
  temperature: 'warm',
  energy: 'bold',
  colorFamily: 'brown',
  fontPairing: 'sora-dm-sans',
  baseColor: 'orange',
  primary: 'linear-gradient(135deg, #2a1810, #3d2418)',
  secondary: '#231610',
  neutral: '#1a100c',
  compatibleAccents: ['amber', 'orange', 'emerald'],
};

const darkForest: Palette = {
  id: 'dark-forest',
  label: 'Dark Forest',
  mode: 'dark',
  temperature: 'warm',
  energy: 'calm',
  colorFamily: 'green',
  fontPairing: 'inter-inter',
  baseColor: 'emerald',
  primary: 'linear-gradient(135deg, #0a1f15, #14332a)',
  secondary: '#0e1a14',
  neutral: '#0a140f',
  compatibleAccents: ['amber', 'sky', 'orange'],
};

// ─── LIGHT MODE — Cool ───

const iceBlue: Palette = {
  id: 'ice-blue',
  label: 'Ice Blue',
  mode: 'light',
  temperature: 'cool',
  energy: 'calm',
  colorFamily: 'blue',
  fontPairing: 'inter-inter',
  baseColor: 'blue',
  primary: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  secondary: 'rgba(219, 234, 254, 0.85)',
  neutral: '#f8fafc',
  compatibleAccents: ['purple', 'orange', 'emerald'],
};

const trustBlue: Palette = {
  id: 'trust-blue',
  label: 'Trust Blue',
  mode: 'light',
  temperature: 'cool',
  energy: 'calm',
  colorFamily: 'blue',
  fontPairing: 'inter-inter',
  baseColor: 'blue',
  primary: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
  secondary: 'rgba(219, 234, 254, 0.7)',
  neutral: '#f8fafc',
  compatibleAccents: ['purple', 'orange', 'emerald', 'amber'],
};

const softLavender: Palette = {
  id: 'soft-lavender',
  label: 'Soft Lavender',
  mode: 'light',
  temperature: 'cool',
  energy: 'bold',
  colorFamily: 'purple',
  fontPairing: 'sora-dm-sans',
  baseColor: 'purple',
  primary: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
  secondary: 'rgba(245, 243, 255, 0.8)',
  neutral: '#fafafe',
  compatibleAccents: ['orange', 'emerald', 'amber'],
};

const skyBright: Palette = {
  id: 'sky-bright',
  label: 'Sky Bright',
  mode: 'light',
  temperature: 'cool',
  energy: 'bold',
  colorFamily: 'blue',
  fontPairing: 'dm-sans-dm-sans',
  baseColor: 'sky',
  primary: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
  secondary: 'rgba(240, 249, 255, 0.8)',
  neutral: '#ffffff',
  compatibleAccents: ['orange', 'purple', 'emerald', 'amber'],
};

const ocean: Palette = {
  id: 'ocean',
  label: 'Ocean',
  mode: 'light',
  temperature: 'cool',
  energy: 'bold',
  colorFamily: 'blue',
  fontPairing: 'sora-inter',
  baseColor: 'blue',
  primary: 'linear-gradient(to top right, #3b82f6, #60a5fa, #7dd3fc)',
  secondary: 'rgba(219, 234, 254, 0.6)',
  neutral: '#ffffff',
  compatibleAccents: ['orange', 'amber', 'emerald', 'purple'],
};

const tealFresh: Palette = {
  id: 'teal-fresh',
  label: 'Teal Fresh',
  mode: 'light',
  temperature: 'cool',
  energy: 'calm',
  colorFamily: 'teal',
  fontPairing: 'inter-inter',
  baseColor: 'teal',
  primary: 'linear-gradient(135deg, #14b8a6, #0d9488)',
  secondary: 'rgba(240, 253, 250, 0.8)',
  neutral: '#ffffff',
  compatibleAccents: ['orange', 'amber', 'purple', 'sky'],
};

const emeraldClean: Palette = {
  id: 'emerald-clean',
  label: 'Emerald Clean',
  mode: 'light',
  temperature: 'cool',
  energy: 'calm',
  colorFamily: 'green',
  fontPairing: 'inter-inter',
  baseColor: 'emerald',
  primary: 'linear-gradient(135deg, #10b981, #059669)',
  secondary: 'rgba(236, 253, 245, 0.8)',
  neutral: '#fafffe',
  compatibleAccents: ['orange', 'purple', 'sky', 'amber'],
};

// ─── LIGHT MODE — Neutral ───

const cloudWhite: Palette = {
  id: 'cloud-white',
  label: 'Cloud White',
  mode: 'light',
  temperature: 'neutral',
  energy: 'calm',
  colorFamily: 'gray',
  fontPairing: 'inter-inter',
  baseColor: 'gray',
  primary: 'linear-gradient(135deg, #9ca3af, #6b7280)',
  secondary: 'rgba(249, 250, 251, 0.8)',
  neutral: '#ffffff',
  compatibleAccents: ['blue', 'emerald', 'purple', 'orange'],
};

const pearlGray: Palette = {
  id: 'pearl-gray',
  label: 'Pearl Gray',
  mode: 'light',
  temperature: 'neutral',
  energy: 'calm',
  colorFamily: 'gray',
  fontPairing: 'inter-inter',
  baseColor: 'slate',
  primary: 'linear-gradient(135deg, #94a3b8, #64748b)',
  secondary: 'rgba(248, 250, 252, 0.7)',
  neutral: '#ffffff',
  compatibleAccents: ['blue', 'orange', 'emerald', 'purple'],
};

const steel: Palette = {
  id: 'steel',
  label: 'Steel',
  mode: 'light',
  temperature: 'neutral',
  energy: 'calm',
  colorFamily: 'gray',
  fontPairing: 'playfair-inter',
  baseColor: 'slate',
  primary: 'linear-gradient(to top right, #e2e8f0, #cbd5e1)',
  secondary: 'rgba(248, 250, 252, 0.8)',
  neutral: '#ffffff',
  compatibleAccents: ['blue', 'emerald', 'purple', 'orange'],
};

const softStone: Palette = {
  id: 'soft-stone',
  label: 'Soft Stone',
  mode: 'light',
  temperature: 'neutral',
  energy: 'calm',
  colorFamily: 'gray',
  fontPairing: 'playfair-inter',
  baseColor: 'stone',
  primary: 'linear-gradient(135deg, #78716c, #57534e)',
  secondary: 'rgba(250, 250, 249, 0.7)',
  neutral: '#fffffe',
  compatibleAccents: ['orange', 'amber', 'emerald', 'blue'],
};

const zincModern: Palette = {
  id: 'zinc-modern',
  label: 'Zinc Modern',
  mode: 'light',
  temperature: 'neutral',
  energy: 'calm',
  colorFamily: 'gray',
  fontPairing: 'sora-inter',
  baseColor: 'zinc',
  primary: 'linear-gradient(135deg, #71717a, #52525b)',
  secondary: 'rgba(250, 250, 250, 0.8)',
  neutral: '#ffffff',
  compatibleAccents: ['purple', 'sky', 'emerald', 'orange'],
};

// ─── LIGHT MODE — Warm ───

const warmSand: Palette = {
  id: 'warm-sand',
  label: 'Warm Sand',
  mode: 'light',
  temperature: 'warm',
  energy: 'bold',
  colorFamily: 'amber-gold',
  fontPairing: 'dm-sans-dm-sans',
  baseColor: 'amber',
  primary: 'linear-gradient(135deg, #d97706, #b45309)',
  secondary: 'rgba(255, 251, 235, 0.8)',
  neutral: '#fffdf7',
  compatibleAccents: ['sky', 'emerald', 'indigo', 'purple'],
};

const coral: Palette = {
  id: 'coral',
  label: 'Coral',
  mode: 'light',
  temperature: 'warm',
  energy: 'bold',
  colorFamily: 'orange',
  fontPairing: 'dm-sans-dm-sans',
  baseColor: 'orange',
  primary: 'linear-gradient(135deg, #f97316, #ea580c)',
  secondary: 'rgba(255, 247, 237, 0.8)',
  neutral: '#fffbf5',
  compatibleAccents: ['sky', 'emerald', 'indigo', 'purple'],
};

const sunset: Palette = {
  id: 'sunset',
  label: 'Sunset',
  mode: 'light',
  temperature: 'warm',
  energy: 'bold',
  colorFamily: 'amber-gold',
  fontPairing: 'dm-sans-dm-sans',
  baseColor: 'amber',
  primary: 'linear-gradient(to top right, #f59e0b, #f97316)',
  secondary: 'rgba(255, 251, 235, 0.7)',
  neutral: '#fffdf5',
  compatibleAccents: ['sky', 'indigo', 'emerald', 'purple'],
};

const blush: Palette = {
  id: 'blush',
  label: 'Blush',
  mode: 'light',
  temperature: 'warm',
  energy: 'bold',
  colorFamily: 'rose-pink',
  fontPairing: 'dm-sans-dm-sans',
  baseColor: 'rose',
  primary: 'linear-gradient(135deg, #e11d48, #be123c)',
  secondary: 'rgba(255, 241, 242, 0.8)',
  neutral: '#fffbfb',
  compatibleAccents: ['sky', 'emerald', 'purple', 'indigo'],
};

const roseSoft: Palette = {
  id: 'rose-soft',
  label: 'Rose Soft',
  mode: 'light',
  temperature: 'warm',
  energy: 'calm',
  colorFamily: 'rose-pink',
  fontPairing: 'dm-sans-dm-sans',
  baseColor: 'pink',
  primary: 'linear-gradient(135deg, #fb7185, #f43f5e)',
  secondary: 'rgba(255, 241, 242, 0.7)',
  neutral: '#fffcfc',
  compatibleAccents: ['sky', 'emerald', 'indigo', 'amber'],
};

const mintWarm: Palette = {
  id: 'mint-warm',
  label: 'Mint Warm',
  mode: 'light',
  temperature: 'warm',
  energy: 'calm',
  colorFamily: 'green',
  fontPairing: 'dm-sans-dm-sans',
  baseColor: 'emerald',
  primary: 'linear-gradient(to top right, #34d399, #6ee7b7, #a7f3d0)',
  secondary: 'rgba(236, 253, 245, 0.7)',
  neutral: '#fafffe',
  compatibleAccents: ['orange', 'purple', 'amber'],
};

const goldenHour: Palette = {
  id: 'golden-hour',
  label: 'Golden Hour',
  mode: 'light',
  temperature: 'warm',
  energy: 'bold',
  colorFamily: 'amber-gold',
  fontPairing: 'playfair-inter',
  baseColor: 'amber',
  primary: 'linear-gradient(135deg, #ca8a04, #a16207)',
  secondary: 'rgba(254, 252, 232, 0.7)',
  neutral: '#fffef5',
  compatibleAccents: ['sky', 'indigo', 'emerald', 'purple'],
};

// ─── All palettes ───

export const palettes: Palette[] = [
  // Dark — Cool
  midnightSlate, deepIndigo, oceanAbyss, arcticNight, steelMidnight,
  // Dark — Neutral
  graphite, obsidian, charcoal,
  // Dark — Warm
  espresso, darkTerracotta, darkForest,
  // Light — Cool
  iceBlue, trustBlue, softLavender, skyBright, ocean, tealFresh, emeraldClean,
  // Light — Neutral
  cloudWhite, pearlGray, steel, softStone, zincModern,
  // Light — Warm
  warmSand, coral, sunset, blush, roseSoft, mintWarm, goldenHour,
];

// ─── Temporary vibe defaults ───

const VIBE_DEFAULT_PALETTE: Record<string, string> = {
  'Dark Tech': 'midnight-slate',
  'Light Trust': 'ice-blue',
  'Warm Friendly': 'coral',
  'Bold Energy': 'soft-lavender',
  'Calm Minimal': 'cloud-white',
};

// ─── Helpers ───

export function getPaletteById(id: string): Palette | undefined {
  return palettes.find(p => p.id === id);
}

export function getPalettesByMode(mode: 'dark' | 'light'): Palette[] {
  return palettes.filter(p => p.mode === mode);
}

export function getColorFamilies(mode: 'dark' | 'light'): { family: string; palettes: Palette[] }[] {
  const filtered = getPalettesByMode(mode);
  const familyMap = new Map<string, Palette[]>();
  for (const p of filtered) {
    const existing = familyMap.get(p.colorFamily) || [];
    existing.push(p);
    familyMap.set(p.colorFamily, existing);
  }
  return Array.from(familyMap.entries()).map(([family, pals]) => ({ family, palettes: pals }));
}

export function getSiblingPalettes(paletteId: string): Palette[] {
  const palette = getPaletteById(paletteId);
  if (!palette) return [];
  return palettes.filter(
    p => p.mode === palette.mode && p.colorFamily === palette.colorFamily && p.id !== paletteId
  );
}

export function getDefaultPaletteForVibe(vibe: string): Palette {
  const id = VIBE_DEFAULT_PALETTE[vibe] || 'ice-blue';
  return getPaletteById(id) || iceBlue;
}
