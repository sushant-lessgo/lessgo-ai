/**
 * Lucide Icon Registry
 *
 * Comprehensive registry of Lucide React icons with keywords for search indexing.
 * Icons are organized by category with searchable keywords.
 */

export interface IconMetadata {
  name: string; // kebab-case icon name (e.g., 'arrow-right')
  keywords: string[]; // Searchable keywords
  category: string[]; // Primary category(ies)
}

/**
 * Get all Lucide icon names dynamically from lucide-react package
 * This ensures we always have the latest icon list
 */
export function getAllLucideIconNames(): string[] {
  // Import all Lucide icons
  const lucideIcons = require('lucide-react');

  // Filter out non-icon exports (like createLucideIcon, Icon, etc.)
  const excludedExports = [
    'createLucideIcon',
    'Icon',
    'default',
    'icons',
    'dynamicIconImports'
  ];

  return Object.keys(lucideIcons)
    .filter(key => !excludedExports.includes(key))
    .map(pascalCaseName => pascalCaseToKebab(pascalCaseName));
}

/**
 * Convert PascalCase to kebab-case
 */
function pascalCaseToKebab(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Generate keywords from icon name
 * Splits by dash and adds variations
 */
function generateKeywordsFromName(iconName: string): string[] {
  const parts = iconName.split('-');
  const keywords = [...parts, iconName];

  // Add common variations
  if (iconName.includes('arrow')) {
    keywords.push('direction', 'navigate', 'pointer');
  }
  if (iconName.includes('check')) {
    keywords.push('done', 'complete', 'tick', 'confirm');
  }
  if (iconName.includes('x') || iconName.includes('close')) {
    keywords.push('delete', 'remove', 'cancel');
  }
  if (iconName.includes('plus') || iconName.includes('add')) {
    keywords.push('new', 'create', 'insert');
  }
  if (iconName.includes('minus') || iconName.includes('subtract')) {
    keywords.push('remove', 'less', 'decrease');
  }

  return keywords;
}

/**
 * Auto-categorize icon based on name patterns
 */
function autoCategorizeIcon(iconName: string): string[] {
  const categories: string[] = [];

  // Arrows
  if (/(arrow|chevron|corner|move|navigation)/.test(iconName)) {
    categories.push('arrows');
  }

  // Communication
  if (/(mail|message|chat|phone|send|inbox|at-sign)/.test(iconName)) {
    categories.push('communication');
  }

  // Media
  if (/(play|pause|stop|skip|volume|music|video|mic|camera|image|film)/.test(iconName)) {
    categories.push('media');
  }

  // Files
  if (/(file|folder|document|save|download|upload|archive)/.test(iconName)) {
    categories.push('files');
  }

  // UI Controls
  if (/(menu|settings|toggle|slider|maximize|minimize|layout|panel|sidebar)/.test(iconName)) {
    categories.push('ui');
  }

  // Business
  if (/(briefcase|building|trending|chart|bar|pie|activity|dollar|credit|shopping)/.test(iconName)) {
    categories.push('business');
  }

  // Development
  if (/(code|terminal|git|github|gitlab|bug|brackets|package|cpu|database|server|cloud)/.test(iconName)) {
    categories.push('development');
  }

  // Design
  if (/(palette|brush|pen|pencil|paint|droplet|grid|layers|crop)/.test(iconName)) {
    categories.push('design');
  }

  // Social
  if (/(share|heart|thumbs|star|user|users|smile|frown)/.test(iconName)) {
    categories.push('social');
  }

  // Security
  if (/(lock|unlock|key|shield|eye|eye-off|fingerprint)/.test(iconName)) {
    categories.push('security');
  }

  // Nature & Weather
  if (/(sun|moon|cloud|wind|droplet|zap|leaf|tree|flower)/.test(iconName)) {
    categories.push('nature');
  }

  // Shopping
  if (/(cart|bag|tag|package|gift|credit-card)/.test(iconName)) {
    categories.push('shopping');
  }

  // Travel
  if (/(map|navigation|plane|car|train|compass|globe|home|building)/.test(iconName)) {
    categories.push('travel');
  }

  // Time
  if (/(clock|calendar|timer|alarm|watch|hourglass)/.test(iconName)) {
    categories.push('time');
  }

  // Alerts & Status
  if (/(alert|bell|info|help|circle|x-circle|check-circle|alert-triangle)/.test(iconName)) {
    categories.push('alerts');
  }

  // Devices
  if (/(laptop|monitor|smartphone|tablet|watch|airplay|cast|bluetooth|wifi)/.test(iconName)) {
    categories.push('devices');
  }

  // Accessibility
  if (/(accessibility|ear|eye|text)/.test(iconName)) {
    categories.push('accessibility');
  }

  // Gaming
  if (/(gamepad|dice|trophy|award|medal|target)/.test(iconName)) {
    categories.push('gaming');
  }

  // Science & Education
  if (/(atom|flask|microscope|book|bookmark|graduation-cap)/.test(iconName)) {
    categories.push('science');
  }

  // If no category matched, add to misc
  if (categories.length === 0) {
    categories.push('misc');
  }

  return categories;
}

/**
 * Build full icon metadata registry with keywords and categories
 */
export function buildIconRegistry(): IconMetadata[] {
  const iconNames = getAllLucideIconNames();

  return iconNames.map(iconName => ({
    name: iconName,
    keywords: generateKeywordsFromName(iconName),
    category: autoCategorizeIcon(iconName)
  }));
}

/**
 * Get icon metadata by name
 */
export function getIconMetadata(iconName: string): IconMetadata | undefined {
  const registry = buildIconRegistry();
  return registry.find(icon => icon.name === iconName);
}

/**
 * Search icons by keyword
 */
export function searchIconsByKeyword(keyword: string): IconMetadata[] {
  const registry = buildIconRegistry();
  const searchTerm = keyword.toLowerCase();

  return registry.filter(icon =>
    icon.name.includes(searchTerm) ||
    icon.keywords.some(kw => kw.includes(searchTerm))
  );
}

/**
 * Get icons by category
 */
export function getIconsByCategory(category: string): IconMetadata[] {
  const registry = buildIconRegistry();
  return registry.filter(icon => icon.category.includes(category));
}
