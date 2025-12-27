/**
 * Published-safe icon component for server-side rendering.
 *
 * @remarks
 * - Supports emojis and Lucide icons
 * - Uses decodeIcon from iconStorage for parsing
 * - Tree-shaking: Lucide icons imported dynamically
 * - No client-side hooks or state
 *
 * @example
 * ```tsx
 * <IconPublished icon="🎯" size={24} color="#14B8A6" />
 * <IconPublished icon="lucide:arrow-right" size={20} color="#9333EA" />
 * ```
 */

import { decodeIcon, lucideNameToPascalCase } from '@/lib/iconStorage';
import * as LucideIcons from 'lucide-react';

interface IconPublishedProps {
  icon: string; // Encoded format: '🎯' or 'lucide:arrow-right'
  color?: string;
  size?: number;
  className?: string;
}

export function IconPublished({ icon, color, size = 24, className }: IconPublishedProps) {
  const decoded = decodeIcon(icon);

  // Handle emoji icons
  if (decoded.type === 'emoji') {
    return (
      <span
        style={{
          fontSize: `${size}px`,
          color: color,
          lineHeight: 1
        }}
        className={className}
      >
        {decoded.name}
      </span>
    );
  }

  // Handle Lucide icons
  if (decoded.type === 'lucide') {
    const iconName = lucideNameToPascalCase(decoded.name);
    const LucideIcon = LucideIcons[iconName as keyof typeof LucideIcons];

    if (LucideIcon && typeof LucideIcon !== 'string') {
      return <LucideIcon size={size} color={color} className={className} />;
    }

    // Fallback if Lucide icon not found
    console.warn(`Lucide icon not found: ${iconName}`);
  }

  // Fallback for svg type or unknown icons
  return <span className={className}>{icon}</span>;
}
