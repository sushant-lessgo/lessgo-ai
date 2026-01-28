/**
 * Published-safe avatar component for server-side rendering.
 *
 * @remarks
 * - Circular avatar with initials fallback
 * - No client-side hooks or state
 * - Used in testimonials, team sections
 * - Simple and server-safe
 *
 * @example
 * ```tsx
 * <AvatarPublished
 *   imageUrl="https://example.com/avatar.png"
 *   name="John Doe"
 *   size={48}
 * />
 * ```
 */

interface AvatarPublishedProps {
  imageUrl?: string;
  name: string;
  size?: number;
  theme?: 'warm' | 'cool' | 'neutral';
}

// Theme-based avatar colors
const getAvatarBackground = (theme?: 'warm' | 'cool' | 'neutral') => {
  const colors = {
    warm: 'linear-gradient(135deg, #f97316, #ea580c)',
    cool: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    neutral: 'linear-gradient(135deg, #6b7280, #4b5563)'
  };
  return colors[theme || 'neutral'];
};

export function AvatarPublished({ imageUrl, name, size = 48, theme }: AvatarPublishedProps) {
  if (!imageUrl) {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: getAvatarBackground(theme),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          color: 'white',
          fontSize: `${size * 0.35}px`
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        objectFit: 'cover'
      }}
    />
  );
}
