/**
 * Universal Icon Category Mapping
 *
 * Central source of truth for all icon mappings across the application.
 * Maps semantic category names to emoji icons.
 *
 * Usage: Import getIconForCategory() in any component that needs icons
 */

export const iconCategoryMap: Record<string, string> = {
  // Analytics & Data
  'analytics': '📊',
  'insights': '💡',
  'data': '📈',
  'metrics': '📉',
  'dashboard': '🎯',
  'reporting': '📋',
  'statistics': '📊',
  'chart': '📊',

  // Performance & Speed
  'speed': '⚡',
  'performance': '🚀',
  'fast': '⚡',
  'instant': '⏱️',
  'quick': '⚡',
  'rocket': '🚀',
  'boost': '🚀',
  'rapid': '⚡',

  // Automation & AI
  'automation': '🤖',
  'ai': '🤖',
  'intelligence': '🧠',
  'smart': '⚡',
  'robot': '🤖',
  'magic': '✨',
  'automated': '🤖',

  // Security & Safety
  'security': '🔒',
  'protection': '🛡️',
  'safe': '🔒',
  'privacy': '🔐',
  'shield': '🛡️',
  'lock': '🔒',
  'encrypt': '🔐',
  'secure': '🔒',

  // Integration & Connection
  'integration': '🔗',
  'connection': '🔗',
  'sync': '🔄',
  'link': '🔗',
  'api': '🔌',
  'network': '🌐',
  'connect': '🔗',
  'integrate': '🔗',

  // Communication & Messaging
  'communication': '💬',
  'message': '💬',
  'chat': '💬',
  'notification': '🔔',
  'bell': '🔔',
  'alert': '🚨',
  'email': '📧',
  'messaging': '💬',

  // Collaboration & Team
  'collaboration': '🤝',
  'team': '👥',
  'users': '👥',
  'people': '👥',
  'group': '👥',
  'community': '🌟',
  'social': '🤝',
  'together': '🤝',

  // Growth & Success
  'growth': '📈',
  'success': '🏆',
  'achievement': '🏆',
  'winner': '🏆',
  'trophy': '🏆',
  'star': '⭐',
  'results': '🎯',
  'winning': '🏆',

  // Efficiency & Productivity
  'efficiency': '⚙️',
  'productivity': '⚙️',
  'optimize': '⚙️',
  'streamline': '⚙️',
  'workflow': '⚙️',
  'process': '⚙️',
  'gear': '⚙️',
  'efficient': '⚙️',

  // Quality & Excellence
  'quality': '💎',
  'premium': '💎',
  'excellence': '💎',
  'professional': '💎',
  'diamond': '💎',
  'badge': '🏅',
  'enterprise': '🏢',
  'superior': '💎',

  // Innovation & Ideas
  'innovation': '💡',
  'creative': '🎨',
  'idea': '💡',
  'lightbulb': '💡',
  'breakthrough': '✨',
  'spark': '✨',
  'invention': '💡',
  'innovative': '💡',

  // Money & Finance
  'money': '💰',
  'cost': '💰',
  'savings': '💰',
  'profit': '💰',
  'pricing': '💵',
  'dollar': '💵',
  'finance': '💰',
  'revenue': '💰',

  // Time & Schedule
  'time': '⏰',
  'schedule': '📅',
  'calendar': '📅',
  'deadline': '⏰',
  'reminder': '⏰',
  'clock': '⏰',
  'timer': '⏱️',
  'timing': '⏰',

  // Support & Help
  'support': '💬',
  'help': '❓',
  'assistance': '🤝',
  'service': '🛎️',
  'care': '❤️',
  'lifesaver': '🆘',
  'helpful': '💬',

  // Tools & Features
  'tools': '🔧',
  'utility': '🔧',
  'feature': '⭐',
  'function': '⚙️',
  'capability': '✨',
  'wrench': '🔧',
  'tool': '🔧',

  // Design & Customization
  'design': '🎨',
  'custom': '🎨',
  'visual': '🎨',
  'interface': '🖥️',
  'theme': '🎨',
  'palette': '🎨',
  'customize': '🎨',
  'customization': '🎨',

  // Target & Goals
  'target': '🎯',
  'goal': '🎯',
  'objective': '🎯',
  'aim': '🎯',
  'focus': '🎯',
  'goals': '🎯',

  // Verification & Validation
  'verified': '✅',
  'check': '✅',
  'validation': '✅',
  'confirm': '✅',
  'approved': '✅',
  'checkmark': '✅',

  // Warning & Error
  'warning': '⚠️',
  'error': '❌',
  'issue': '⚠️',
  'problem': '⚠️',
  'caution': '⚠️',

  // Progress & Loading
  'progress': '📊',
  'loading': '⏳',
  'pending': '⏳',
  'hourglass': '⏳',

  // Location & Global
  'location': '📍',
  'global': '🌐',
  'world': '🌍',
  'map': '🗺️',
  'pin': '📍',

  // Document & File
  'document': '📄',
  'file': '📁',
  'folder': '📁',
  'page': '📄',
  'paper': '📄',

  // Media & Content
  'image': '🖼️',
  'video': '🎥',
  'media': '🎬',
  'photo': '📷',
  'camera': '📷',

  // Default fallback
  'default': '⭐'
};

/**
 * Get icon emoji for a semantic category
 * Supports direct matching and partial/fuzzy matching
 *
 * @param category - Semantic category name (e.g., 'analytics', 'speed', 'security')
 * @returns Emoji icon string
 *
 * @example
 * getIconForCategory('analytics') // Returns '📊'
 * getIconForCategory('real-time-analytics') // Returns '📊' (partial match)
 * getIconForCategory('unknown') // Returns '⭐' (fallback)
 */
export function getIconForCategory(category: string | undefined): string {
  if (!category) return iconCategoryMap.default;

  const normalized = category.toLowerCase().trim();

  // Direct match
  if (iconCategoryMap[normalized]) {
    return iconCategoryMap[normalized];
  }

  // Partial match (e.g., "real-time-analytics" → "analytics")
  // Check if category contains any known category keyword
  for (const [key, icon] of Object.entries(iconCategoryMap)) {
    if (key === 'default') continue;

    if (normalized.includes(key) || key.includes(normalized)) {
      return icon;
    }
  }

  // Fallback to default
  return iconCategoryMap.default;
}

/**
 * Validate if a category exists in the mapping
 * Useful for debugging and logging
 *
 * @param category - Category name to validate
 * @returns true if category exists, false otherwise
 */
export function isValidCategory(category: string): boolean {
  if (!category) return false;
  const normalized = category.toLowerCase().trim();
  return normalized in iconCategoryMap;
}

/**
 * Infer category from title and description text
 * Uses keyword matching to find the most relevant category
 * Fallback when AI doesn't provide a category
 *
 * @param title - Title text to analyze
 * @param description - Optional description text
 * @returns Best matching category name
 *
 * @example
 * inferCategoryFromText('Real-Time Analytics Dashboard') // Returns 'analytics'
 * inferCategoryFromText('Lightning Fast Performance') // Returns 'speed'
 */
export function inferCategoryFromText(title: string, description?: string): string {
  const text = `${title} ${description || ''}`.toLowerCase();

  // Score each category based on keyword matches
  const categoryScores: Record<string, number> = {};

  for (const category of Object.keys(iconCategoryMap)) {
    if (category === 'default') continue;

    // Count how many times category keyword appears in text
    const regex = new RegExp(category, 'gi');
    const matches = text.match(regex);

    if (matches) {
      categoryScores[category] = matches.length;
    }
  }

  // Return highest scoring category
  const entries = Object.entries(categoryScores);
  if (entries.length === 0) return 'default';

  const bestCategory = entries.sort(([, a], [, b]) => b - a)[0][0];
  return bestCategory;
}

/**
 * Get all available categories
 * Useful for documentation and debugging
 *
 * @returns Array of category names (excluding 'default')
 */
export function getAvailableCategories(): string[] {
  return Object.keys(iconCategoryMap).filter(key => key !== 'default');
}
