/**
 * Published-safe logo component for server-side rendering.
 *
 * @remarks
 * - No client-side hooks or state
 * - Uses inline styles for dynamic values
 * - Tailwind classes for structural layout only
 * - Generates initials fallback if no logoUrl
 * - Matches gradient palette from LogoEditableComponent
 *
 * @example
 * ```tsx
 * <LogoPublished
 *   logoUrl="https://example.com/logo.png"
 *   companyName="Acme Corp"
 *   size="md"
 * />
 * ```
 */

interface LogoPublishedProps {
  logoUrl?: string;
  companyName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LogoPublished({ logoUrl, companyName, size = 'md', className }: LogoPublishedProps) {
  // Size mappings matching LogoEditableComponent pattern
  const sizeStyles = {
    sm: { width: '48px', height: '48px' },
    md: { width: '64px', height: '64px' },
    lg: { width: '80px', height: '80px' }
  };

  // Gradient colors matching LogoEditableComponent (lines 50-55)
  const gradients = [
    'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', // blue-600 to blue-700
    'linear-gradient(135deg, #374151 0%, #1f2937 100%)', // gray-700 to gray-800
    'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', // green-600 to green-700
    'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)'  // purple-600 to purple-700
  ];

  if (!logoUrl) {
    // Generate initials matching LogoEditableComponent logic (lines 44-49)
    const words = companyName.split(' ');
    const initials = words.length === 1
      ? companyName.substring(0, 2).toUpperCase()
      : words.slice(0, 2).map(w => w[0]).join('').toUpperCase();

    // Select gradient based on company name hash (lines 57-58)
    const hash = companyName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradient = gradients[hash % gradients.length];

    return (
      <div
        style={{
          ...sizeStyles[size],
          background: gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px',
          color: 'white',
          fontWeight: 'bold',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}
        className={className}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`${companyName} logo`}
      style={{
        ...sizeStyles[size],
        objectFit: 'contain'
      }}
      className={className}
    />
  );
}
