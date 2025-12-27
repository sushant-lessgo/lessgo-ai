/**
 * Published-safe checkmark icon component for server-side rendering.
 *
 * @remarks
 * - Server-renders actual SVG element (not empty div)
 * - Matches existing checkmark path from CheckmarkComparison.tsx
 * - No client-side hooks or state
 * - Used in comparison tables, CTA benefit lists, feature lists
 *
 * @example
 * ```tsx
 * <CheckmarkIconPublished color="#10b981" size={20} />
 * <CheckmarkIconPublished color="#14B8A6" size={24} />
 * ```
 */

interface CheckmarkIconPublishedProps {
  color?: string;
  size?: number;
}

export function CheckmarkIconPublished({ color = '#10b981', size = 20 }: CheckmarkIconPublishedProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
