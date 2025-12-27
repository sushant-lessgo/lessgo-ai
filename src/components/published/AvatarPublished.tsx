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
}

export function AvatarPublished({ imageUrl, name, size = 48 }: AvatarPublishedProps) {
  if (!imageUrl) {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: '#e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold'
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
