/**
 * Returns a CSS filter string that subtly shifts an image
 * toward the palette's visual temperature.
 *
 * Values are intentionally subtle — enough to harmonize,
 * not enough to look "filtered".
 */
export function getImageFilter(
  paletteMode?: 'dark' | 'light',
  paletteTemperature?: 'cool' | 'neutral' | 'warm'
): string | undefined {
  if (!paletteMode) return undefined;

  const key = `${paletteMode}-${paletteTemperature || 'neutral'}`;

  const filters: Record<string, string> = {
    'dark-cool':     'brightness(0.92) saturate(0.9)',
    'dark-neutral':  'brightness(0.95) saturate(0.85)',
    'dark-warm':     'brightness(0.93) saturate(0.95) sepia(0.05)',
    'light-cool':    'saturate(0.95) brightness(1.02)',
    'light-neutral': 'none',
    'light-warm':    'sepia(0.06) saturate(1.05)',
  };

  const f = filters[key];
  return f && f !== 'none' ? f : undefined;
}
