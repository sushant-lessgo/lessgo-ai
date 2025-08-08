import { landingTypography, TypographyVariant } from '@/modules/Design/fontSystem/landingTypography';

/**
 * Helper function to create inline styles from landingTypography variants
 * This ensures consistent typography across all UIBlocks without hardcoded classes
 */
export function createTypographyStyle(
  variant: TypographyVariant,
  theme?: { typography?: { headingFont?: string; bodyFont?: string } }
): React.CSSProperties {
  const baseStyle = landingTypography[variant];
  
  // Determine if this variant should use heading or body font
  const isHeadingVariant = variant.startsWith('h') || 
                          variant === 'display' || 
                          variant === 'hero' || 
                          variant === 'button' || 
                          variant === 'label';
  
  const fontFamily = theme?.typography 
    ? isHeadingVariant
      ? `${theme.typography.headingFont}, 'Inter', sans-serif`
      : `${theme.typography.bodyFont}, 'Inter', sans-serif`
    : 'inherit';
  
  return {
    fontSize: baseStyle.fontSize,
    fontWeight: baseStyle.fontWeight,
    lineHeight: baseStyle.lineHeight,
    letterSpacing: baseStyle.letterSpacing,
    fontFamily,
  };
}

/**
 * Helper function to get typography style with additional className compatibility
 * Returns both inline styles and any remaining classes that need to be preserved
 */
export function getTypographyProps(
  variant: TypographyVariant,
  additionalClasses?: string,
  theme?: { typography?: { headingFont?: string; bodyFont?: string } }
) {
  return {
    style: createTypographyStyle(variant, theme),
    className: additionalClasses || ''
  };
}