/**
 * Published-safe CTA button component for server-side rendering.
 *
 * @remarks
 * - No onClick handlers (static button for published pages)
 * - Uses inline styles for dynamic theme colors
 * - Tailwind classes for structural layout only
 * - No client-side hooks or state
 *
 * @example
 * ```tsx
 * <CTAButtonPublished
 *   text="Get Started"
 *   backgroundColor="#14B8A6"
 *   textColor="#FFFFFF"
 * />
 * ```
 */

interface CTAButtonPublishedProps {
  text: string;
  backgroundColor?: string;
  textColor?: string;
  className?: string;
  href?: string;
}

export function CTAButtonPublished({
  text,
  backgroundColor,
  textColor,
  className = '',
  href
}: CTAButtonPublishedProps) {
  const style = {
    background: backgroundColor,
    color: textColor,
  };

  const baseClasses = `inline-block px-6 py-3 rounded-lg font-semibold transition ${className}`;

  if (href) {
    return (
      <a
        href={href}
        style={style}
        className={baseClasses}
        data-lessgo-cta=""
      >
        {text}
      </a>
    );
  }

  return (
    <button
      style={style}
      className={baseClasses}
      data-lessgo-cta=""
    >
      {text}
    </button>
  );
}
