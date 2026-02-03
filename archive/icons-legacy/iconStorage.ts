/**
 * Icon Storage Format Utilities
 *
 * Handles encoding/decoding of icon values for storage.
 * Supports multiple icon formats: emoji, Lucide, and legacy SVG.
 */

export type IconType = 'emoji' | 'lucide' | 'svg';
export type IconStorageFormat = string;

export interface DecodedIcon {
  name: string;
  type: IconType;
}

/**
 * Encode icon name and type into storage string format
 *
 * @param iconName - Icon identifier (emoji character or icon name)
 * @param type - Icon type
 * @returns Encoded storage string
 *
 * @example
 * encodeIcon('🎯', 'emoji') // Returns: '🎯'
 * encodeIcon('arrow-right', 'lucide') // Returns: 'lucide:arrow-right'
 */
export function encodeIcon(iconName: string, type: IconType): IconStorageFormat {
  if (type === 'emoji') {
    return iconName; // Direct emoji character
  } else if (type === 'lucide') {
    return `lucide:${iconName}`;
  } else if (type === 'svg') {
    return `svg:${iconName}`;
  }

  // Fallback: return as-is
  return iconName;
}

/**
 * Decode storage string into icon name and type
 *
 * @param iconValue - Stored icon string
 * @returns Decoded icon object with name and type
 *
 * @example
 * decodeIcon('🎯') // Returns: { name: '🎯', type: 'emoji' }
 * decodeIcon('lucide:arrow-right') // Returns: { name: 'arrow-right', type: 'lucide' }
 * decodeIcon('svg:target') // Returns: { name: 'target', type: 'svg' }
 */
export function decodeIcon(iconValue: string): DecodedIcon {
  if (!iconValue) {
    return { name: '', type: 'emoji' };
  }

  // Check for Lucide prefix
  if (iconValue.startsWith('lucide:')) {
    return {
      name: iconValue.replace('lucide:', ''),
      type: 'lucide'
    };
  }

  // Check for legacy SVG prefix
  if (iconValue.startsWith('svg:')) {
    return {
      name: iconValue.replace('svg:', ''),
      type: 'svg'
    };
  }

  // Default to emoji (direct character)
  return {
    name: iconValue,
    type: 'emoji'
  };
}

/**
 * Validate if string is a valid icon format
 *
 * @param iconValue - Icon value to validate
 * @returns True if valid icon format
 *
 * @example
 * isValidIconFormat('🎯') // true
 * isValidIconFormat('lucide:arrow-right') // true
 * isValidIconFormat('svg:target') // true
 * isValidIconFormat('invalid') // false
 */
export function isValidIconFormat(iconValue: string): boolean {
  if (!iconValue) return false;

  // Check for prefix formats
  if (iconValue.startsWith('lucide:') || iconValue.startsWith('svg:')) {
    return true;
  }

  // Check for emoji (Unicode emoji detection)
  // Regex pattern matches most emoji characters
  const emojiRegex = /\p{Emoji}/u;
  return emojiRegex.test(iconValue);
}

/**
 * Convert Lucide icon name from kebab-case to PascalCase
 * Used for dynamic component lookup
 *
 * @param iconName - Lucide icon name in kebab-case
 * @returns PascalCase component name
 *
 * @example
 * lucideNameToPascalCase('arrow-right') // 'ArrowRight'
 * lucideNameToPascalCase('bar-chart-3') // 'BarChart3'
 */
export function lucideNameToPascalCase(iconName: string): string {
  return iconName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Convert PascalCase component name to kebab-case icon name
 *
 * @param componentName - PascalCase component name
 * @returns kebab-case icon name
 *
 * @example
 * pascalCaseToLucideName('ArrowRight') // 'arrow-right'
 * pascalCaseToLucideName('BarChart3') // 'bar-chart-3'
 */
export function pascalCaseToLucideName(componentName: string): string {
  return componentName
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}
