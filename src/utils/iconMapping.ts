/**
 * Icon mapping utility for converting semantic category names to emojis
 * Used by AI-generated content to provide meaningful, contextually relevant icons
 */

interface IconMapping {
  [category: string]: string[];
}

// Semantic categories mapped to relevant emojis
const ICON_MAPPING: IconMapping = {
  // Analytics & Data
  analytics: ['📊', '📈', '📉', '🔍'],
  insights: ['💡', '🔬', '📊', '🎯'],
  data: ['📊', '🗃️', '📈', '💾'],
  metrics: ['📊', '📈', '⚡', '🎯'],

  // Speed & Performance
  speed: ['⚡', '🚀', '💨', '⏰'],
  performance: ['🚀', '⚡', '📈', '🎯'],
  fast: ['⚡', '🚀', '💨', '⏱️'],
  instant: ['⚡', '🚀', '💫', '⏰'],

  // Automation & AI
  automation: ['🤖', '⚙️', '🔄', '⚡'],
  ai: ['🧠', '🤖', '💫', '🔮'],
  intelligence: ['🧠', '💡', '🎯', '🔍'],
  smart: ['🧠', '💡', '🎯', '⚡'],

  // Security & Protection
  security: ['🔒', '🛡️', '🔐', '🛠️'],
  protection: ['🛡️', '🔒', '🔐', '⚙️'],
  safe: ['🛡️', '🔒', '✅', '🛠️'],
  privacy: ['🔒', '🛡️', '🔐', '👁️'],

  // Growth & Success
  growth: ['📈', '🚀', '🌱', '📊'],
  success: ['✅', '🎯', '🏆', '📈'],
  results: ['📈', '🎯', '✅', '🏆'],
  achievement: ['🏆', '✅', '🎯', '📈'],

  // Efficiency & Optimization
  efficiency: ['⚡', '⚙️', '🎯', '📈'],
  optimization: ['⚙️', '🎯', '⚡', '🔧'],
  streamline: ['🔄', '⚡', '⚙️', '🎯'],
  optimize: ['⚙️', '🎯', '⚡', '📈'],

  // Workflow & Process
  workflow: ['🔄', '⚙️', '📋', '🎯'],
  process: ['⚙️', '🔄', '📋', '⚡'],
  system: ['⚙️', '🔧', '🎯', '📊'],
  method: ['📋', '⚙️', '🎯', '✅'],

  // Integration & Connection
  integration: ['🔗', '🔄', '⚙️', '🌐'],
  connection: ['🔗', '🌐', '🔄', '⚡'],
  sync: ['🔄', '🔗', '⚡', '⚙️'],
  connect: ['🔗', '🌐', '🔄', '⚡'],

  // Innovation & Technology
  innovation: ['💡', '🚀', '⚡', '🔬'],
  technology: ['💻', '⚙️', '🚀', '⚡'],
  advanced: ['🚀', '💫', '⚡', '🔬'],
  cutting_edge: ['🚀', '💫', '⚡', '💡'],

  // Quality & Excellence
  quality: ['✅', '🏆', '⭐', '💎'],
  excellence: ['🏆', '⭐', '✅', '💎'],
  premium: ['💎', '🏆', '⭐', '✨'],
  professional: ['💼', '🏆', '✅', '⚡'],

  // Collaboration & Team
  collaboration: ['🤝', '👥', '🔗', '⚡'],
  team: ['👥', '🤝', '🎯', '⚡'],
  communication: ['💬', '📡', '🔗', '⚡'],
  social: ['👥', '🤝', '💬', '🌐'],

  // Scale & Enterprise
  scale: ['📈', '🚀', '🌐', '⚡'],
  enterprise: ['🏢', '🚀', '⚙️', '📈'],
  global: ['🌐', '🚀', '📈', '🌍'],
  massive: ['🚀', '📈', '🌐', '⚡'],

  // FAQ & Support
  faq: ['❓', '💡', '🔍', '📚'],
  support: ['🆘', '💬', '🤝', '📞'],
  help: ['🆘', '💡', '🔍', '💬'],
  questions: ['❓', '💡', '🤔', '📝'],
  answers: ['✅', '💡', '📝', '🎯'],
  guide: ['📚', '🧭', '📍', '💡'],
  documentation: ['📚', '📝', '📋', '💡']
};

// Fallback icons for unknown categories
const FALLBACK_ICONS = ['✨', '⚡', '🎯', '💫', '🚀'];

/**
 * Convert a semantic category name to an appropriate emoji
 * @param category - The semantic category (e.g., 'analytics', 'speed', 'automation')
 * @param preferredIndex - Optional index to select specific emoji from category array
 * @returns Emoji string
 */
export function getIconFromCategory(category: string, preferredIndex: number = 0): string {
  // Normalize category name (lowercase, replace spaces/hyphens with underscores)
  const normalizedCategory = category.toLowerCase()
    .replace(/[\s-]+/g, '_')
    .trim();

  // Get icons for this category
  const categoryIcons = ICON_MAPPING[normalizedCategory];

  if (categoryIcons && categoryIcons.length > 0) {
    // Use preferredIndex if valid, otherwise use modulo to cycle through available icons
    const index = preferredIndex < categoryIcons.length ? preferredIndex : preferredIndex % categoryIcons.length;
    return categoryIcons[index];
  }

  // Fallback for unknown categories
  const fallbackIndex = preferredIndex % FALLBACK_ICONS.length;
  return FALLBACK_ICONS[fallbackIndex];
}

/**
 * Convert an array of semantic categories to emoji arrays
 * @param categories - Array of category names
 * @returns Array of emoji strings
 */
export function getIconsFromCategories(categories: string[]): string[] {
  return categories.map((category, index) => getIconFromCategory(category, index));
}

/**
 * Get all available semantic categories
 * @returns Array of category names
 */
export function getAvailableCategories(): string[] {
  return Object.keys(ICON_MAPPING).sort();
}

/**
 * Get a random icon from a specific category
 * @param category - The semantic category
 * @returns Random emoji from that category
 */
export function getRandomIconFromCategory(category: string): string {
  const normalizedCategory = category.toLowerCase().replace(/[\s-]+/g, '_').trim();
  const categoryIcons = ICON_MAPPING[normalizedCategory];

  if (categoryIcons && categoryIcons.length > 0) {
    const randomIndex = Math.floor(Math.random() * categoryIcons.length);
    return categoryIcons[randomIndex];
  }

  // Fallback
  const randomIndex = Math.floor(Math.random() * FALLBACK_ICONS.length);
  return FALLBACK_ICONS[randomIndex];
}

/**
 * Validate if a category exists in the mapping
 * @param category - Category to check
 * @returns Boolean indicating if category exists
 */
export function isValidCategory(category: string): boolean {
  const normalizedCategory = category.toLowerCase().replace(/[\s-]+/g, '_').trim();
  return normalizedCategory in ICON_MAPPING;
}