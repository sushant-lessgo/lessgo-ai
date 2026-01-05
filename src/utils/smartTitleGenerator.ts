/**
 * Smart Title Generation Utilities
 *
 * Generates SEO-friendly page titles using market category + target audience pattern
 * Strips HTML formatting for clean meta tags and OG images
 */

/**
 * Strip all HTML tags from a string
 * @param html - String that may contain HTML tags
 * @returns Clean text without HTML tags
 */
export function stripHTMLTags(html: string): string {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Format field values for display
 * Capitalizes words and removes dashes/underscores
 * @param field - Raw field value (e.g., "design-tools" or "social_media_marketers")
 * @returns Formatted string (e.g., "Design Tools" or "Social Media Marketers")
 */
export function formatField(field: string): string {
  if (!field || typeof field !== 'string') return '';

  return field
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Generate smart page title using market category + target audience pattern
 * @param marketCategory - Market category (e.g., "design-tools")
 * @param targetAudience - Target audience (e.g., "social-media-marketers")
 * @param fallback - Fallback text (e.g., headline) if category fields missing
 * @returns Smart title (e.g., "Design Tools for Social Media Marketers")
 */
export function generateSmartTitle(
  marketCategory?: string,
  targetAudience?: string,
  fallback?: string
): string {
  // Priority 1: Both category and audience available
  if (marketCategory && targetAudience) {
    const title = `${formatField(marketCategory)} for ${formatField(targetAudience)}`;
    return title.slice(0, 60); // SEO recommendation: 50-60 chars
  }

  // Priority 2: Just category available
  if (marketCategory) {
    const title = `${formatField(marketCategory)} Tool`;
    return title.slice(0, 60);
  }

  // Priority 3: Use fallback (typically headline), strip HTML
  if (fallback) {
    const cleanFallback = stripHTMLTags(fallback);
    return cleanFallback.slice(0, 60);
  }

  // Final fallback
  return 'Untitled Page';
}
