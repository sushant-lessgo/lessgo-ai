/**
 * Published-safe section wrapper component for server-side rendering.
 *
 * @remarks
 * - CRITICAL: Preserves <section> tag (innerHTML capture strips this)
 * - Applies section padding as Tailwind classes
 * - Inline styles for dynamic background values
 * - Fixes missing section padding and white gaps in published pages
 * - No client-side hooks or state
 *
 * @example
 * ```tsx
 * <SectionWrapperPublished
 *   sectionId="hero-123"
 *   background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
 *   padding="spacious"
 * >
 *   <div>Section content</div>
 * </SectionWrapperPublished>
 * ```
 */

interface SectionWrapperPublishedProps {
  children: React.ReactNode;
  sectionId?: string;
  background?: string;
  padding?: 'compact' | 'normal' | 'spacious' | 'extra' | 'cta';
  className?: string;
}

export function SectionWrapperPublished({
  children,
  sectionId,
  background,
  padding = 'normal',
  className = ''
}: SectionWrapperPublishedProps) {
  const paddingClasses = {
    compact: 'py-4 md:py-4 lg:py-4',
    normal: 'py-16 md:py-20 lg:py-24',
    spacious: 'py-12 md:py-16 lg:py-20',
    extra: 'py-20 md:py-24 lg:py-32',
    cta: 'py-20 md:py-24 lg:py-32'
  };

  return (
    <section
      data-section-id={sectionId}
      style={{ background }}
      className={`${paddingClasses[padding]} px-4 ${className}`}
    >
      {children}
    </section>
  );
}
