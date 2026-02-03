/**
 * Published-safe icon component for server-side rendering.
 *
 * @remarks
 * - Supports PascalCase Lucide icons (system default)
 * - Supports emojis (user choice)
 * - No client-side hooks or state
 *
 * @example
 * ```tsx
 * <IconPublished icon="Clock" size={24} color="#14B8A6" />
 * <IconPublished icon="🎯" size={20} color="#9333EA" />
 * ```
 */

import * as LucideIcons from 'lucide-react';

interface IconPublishedProps {
  icon: string; // PascalCase Lucide name ('Clock') or emoji ('🎯')
  color?: string;
  size?: number;
  className?: string;
}

export function IconPublished({ icon, color, size = 24, className }: IconPublishedProps) {
  if (!icon) {
    return <LucideIcons.Sparkles size={size} color={color} className={className} />;
  }

  // Case 1: PascalCase Lucide icon (system default)
  if (/^[A-Z][a-zA-Z0-9]*$/.test(icon)) {
    const LucideIcon = LucideIcons[icon as keyof typeof LucideIcons] as React.ComponentType<any>;

    if (LucideIcon && typeof LucideIcon !== 'string') {
      return <LucideIcon size={size} color={color} className={className} />;
    }

    // Fallback for invalid PascalCase name
    return <LucideIcons.Sparkles size={size} color={color} className={className} />;
  }

  // Case 2: Emoji (user choice - supported but not encouraged)
  if (/\p{Emoji}/u.test(icon)) {
    return (
      <span
        style={{
          fontSize: `${size}px`,
          color: color,
          lineHeight: 1
        }}
        className={className}
      >
        {icon}
      </span>
    );
  }

  // Fallback for any other format
  return <LucideIcons.Sparkles size={size} color={color} className={className} />;
}
