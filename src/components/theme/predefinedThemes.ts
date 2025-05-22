export const predefinedThemes = [
  {
    name: 'Aqua Fresh',
    primary: '#14B8A6',
    background: '#F9FAFB',
    muted: '#6B7280',
  },
  {
    name: 'Sunset Glow',
    primary: '#F97316',
    background: '#FFF7ED',
    muted: '#92400E',
  },
  {
    name: 'Royal Blue',
    primary: '#3B82F6',
    background: '#EFF6FF',
    muted: '#1E3A8A',
  },
  {
    name: 'Forest Green',
    primary: '#10B981',
    background: '#ECFDF5',
    muted: '#065F46',
  },
  {
    name: 'Violet Mist',
    primary: '#8B5CF6',
    background: '#F5F3FF',
    muted: '#6B21A8',
  },
  {
    name: 'Rose Sand',
    primary: '#EC4899',
    background: '#FFF1F2',
    muted: '#9D174D',
  }
];

export function getThemeByName(name: string) {
  return predefinedThemes.find((t) => t.name === name) || predefinedThemes[0]; // default: Aqua Fresh
}
