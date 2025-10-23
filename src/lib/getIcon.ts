/**
 * Universal Icon Getter
 *
 * Single function for getting icons across all UIBlock components.
 * Implements intelligent three-tier fallback system:
 *   1. AI-provided category → Direct lookup
 *   2. Infer from title/description → Context analysis
 *   3. Default fallback → ⭐
 */

import { getIconForCategory, inferCategoryFromText, isValidCategory } from './iconCategoryMap';

interface IconContext {
  title?: string;
  description?: string;
}

/**
 * Get icon emoji with intelligent fallback
 *
 * @param category - Semantic category from AI (e.g., 'analytics', 'speed', 'security')
 * @param context - Optional context for intelligent fallback (title, description)
 * @returns Emoji icon string
 *
 * @example
 * // Priority 1: AI-provided category
 * getIcon('analytics') // Returns '📊'
 *
 * // Priority 2: Infer from title
 * getIcon(undefined, { title: 'Real-Time Analytics' }) // Returns '📊'
 *
 * // Priority 3: Default fallback
 * getIcon(undefined) // Returns '⭐'
 */
export function getIcon(
  category: string | undefined,
  context?: IconContext
): string {
  const debugMode = process.env.NEXT_PUBLIC_DEBUG_ICON_SELECTION === 'true';

  // Priority 1: AI-provided category
  if (category) {
    const icon = getIconForCategory(category);

    // Check if we got a valid match (not fallback)
    const isValidMatch = isValidCategory(category) || icon !== '⭐';

    // if (debugMode) {
    //   console.log('🎯 [ICON] getIcon - AI category:', {
    //     category,
    //     isValid: isValidMatch,
    //     resolvedIcon: icon,
    //     usedFallback: !isValidMatch
    //   });
    // }

    // If we got a valid match, return it
    if (isValidMatch) {
      return icon;
    }

    // If not valid but we have context, try inference
    if (context?.title) {
      // Fall through to Priority 2
    } else {
      // No context, return the attempted match (might be partial match or fallback)
      return icon;
    }
  }

  // Priority 2: Infer from title/description
  if (context?.title) {
    const inferredCategory = inferCategoryFromText(context.title, context.description);
    const icon = getIconForCategory(inferredCategory);

    // if (debugMode) {
    //   console.log('🎯 [ICON] getIcon - Inferred from context:', {
    //     title: context.title,
    //     inferredCategory,
    //     resolvedIcon: icon
    //   });
    // }

    return icon;
  }

  // Priority 3: Default fallback
  // if (debugMode) {
  //   console.log('🎯 [ICON] getIcon - Using default fallback: ⭐');
  // }

  return '⭐';
}

/**
 * Get icon with explicit fallback override
 *
 * @param category - Semantic category from AI
 * @param context - Context for intelligent fallback
 * @param fallback - Custom fallback icon (overrides default '⭐')
 * @returns Emoji icon string
 */
export function getIconWithFallback(
  category: string | undefined,
  context: IconContext | undefined,
  fallback: string
): string {
  const icon = getIcon(category, context);

  // If we got the default fallback, use custom fallback instead
  if (icon === '⭐' && fallback !== '⭐') {
    return fallback;
  }

  return icon;
}
