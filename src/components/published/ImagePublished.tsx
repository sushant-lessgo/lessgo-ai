/**
 * Published-safe image component for server-side rendering.
 *
 * @remarks
 * - Plain img tag (not next/image)
 * - Includes loading="lazy" for performance
 * - No client-side hooks or state
 * - Simple and server-safe
 *
 * @example
 * ```tsx
 * <ImagePublished
 *   src="https://example.com/image.png"
 *   alt="Product screenshot"
 *   className="w-full h-80 object-cover rounded-xl"
 * />
 * ```
 */

import { getImageFilter } from '@/lib/generation/imageColorTreatment';

interface ImagePublishedProps {
  src: string;
  alt: string;
  className?: string;
  paletteMode?: 'dark' | 'light';
  paletteTemperature?: 'cool' | 'neutral' | 'warm';
}

export function ImagePublished({ src, alt, className, paletteMode, paletteTemperature }: ImagePublishedProps) {
  const filter = getImageFilter(paletteMode, paletteTemperature);
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={filter ? { filter } : undefined}
      loading="lazy"
    />
  );
}
