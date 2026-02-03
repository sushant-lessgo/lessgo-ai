/**
 * Universal Icon Category Mapping
 *
 * Central source of truth for all icon mappings across the application.
 * Maps semantic category names to emoji icons.
 *
 * Usage: Import getIconForCategory() in any component that needs icons
 */

// Icon type for storage format (used by IconPicker and related components)
export type IconType = 'emoji' | 'lucide';

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

/**
 * Infer PascalCase Lucide icon name from title/description text
 * Returns Lucide icon component names for direct lookup
 *
 * @param title - Title text to analyze
 * @param description - Optional description text
 * @returns PascalCase Lucide icon name (e.g., 'Clock', 'Users', 'TrendingUp')
 *
 * @example
 * inferIconFromText('Spending hours on manual tasks') // Returns 'Clock'
 * inferIconFromText('Your tools don\'t talk to each other') // Returns 'Unlink'
 */
export function inferIconFromText(title: string, description?: string): string {
  const text = `${title} ${description || ''}`.toLowerCase();

  // Time-related
  if (text.includes('time') || text.includes('hour') || text.includes('slow') || text.includes('wait')) {
    return 'Clock';
  }
  // Disconnection/integration issues
  if (text.includes('disconnect') || text.includes('integration') || text.includes('sync') || text.includes('talk to each other')) {
    return 'Unlink';
  }
  // Deadlines/urgency
  if (text.includes('deadline') || text.includes('miss') || text.includes('late') || text.includes('urgent')) {
    return 'AlertTriangle';
  }
  // Burnout/fatigue
  if (text.includes('burn') || text.includes('exhaust') || text.includes('tired') || text.includes('overwhelm')) {
    return 'Battery';
  }
  // Loss/decline
  if (text.includes('losing') || text.includes('lost') || text.includes('decline') || text.includes('drop')) {
    return 'TrendingDown';
  }
  // Chaos/disorganization
  if (text.includes('chaos') || text.includes('mess') || text.includes('scattered') || text.includes('disorganiz')) {
    return 'Shuffle';
  }
  // Manual work
  if (text.includes('manual') || text.includes('repetitive') || text.includes('tedious')) {
    return 'Hand';
  }
  // Customer/users
  if (text.includes('customer') || text.includes('user') || text.includes('client') || text.includes('people')) {
    return 'Users';
  }
  // Satisfaction/rating
  if (text.includes('satisfaction') || text.includes('rating') || text.includes('happy') || text.includes('love')) {
    return 'Heart';
  }
  // Revenue/growth
  if (text.includes('revenue') || text.includes('growth') || text.includes('increase') || text.includes('rise')) {
    return 'TrendingUp';
  }
  // Speed/efficiency
  if (text.includes('speed') || text.includes('fast') || text.includes('efficiency') || text.includes('productivity') || text.includes('quick')) {
    return 'Zap';
  }
  // Money/cost
  if (text.includes('money') || text.includes('cost') || text.includes('price') || text.includes('budget') || text.includes('saving')) {
    return 'DollarSign';
  }
  // Security
  if (text.includes('security') || text.includes('secure') || text.includes('protect') || text.includes('safe')) {
    return 'Shield';
  }
  // Analytics/data
  if (text.includes('analytics') || text.includes('data') || text.includes('metrics') || text.includes('insight') || text.includes('report')) {
    return 'BarChart3';
  }
  // Settings/config
  if (text.includes('setting') || text.includes('config') || text.includes('customize') || text.includes('option')) {
    return 'Settings';
  }
  // Communication
  if (text.includes('email') || text.includes('message') || text.includes('chat') || text.includes('notification')) {
    return 'Mail';
  }
  // Calendar/schedule
  if (text.includes('calendar') || text.includes('schedule') || text.includes('appointment') || text.includes('booking')) {
    return 'Calendar';
  }
  // Search/find
  if (text.includes('search') || text.includes('find') || text.includes('discover') || text.includes('look')) {
    return 'Search';
  }
  // Award/achievement
  if (text.includes('award') || text.includes('achievement') || text.includes('winner') || text.includes('trophy')) {
    return 'Trophy';
  }
  // Goal/target
  if (text.includes('goal') || text.includes('target') || text.includes('objective') || text.includes('aim')) {
    return 'Target';
  }
  // Rocket/launch
  if (text.includes('launch') || text.includes('start') || text.includes('begin') || text.includes('rocket')) {
    return 'Rocket';
  }
  // Collaboration/team
  if (text.includes('collaborat') || text.includes('team') || text.includes('together') || text.includes('share')) {
    return 'Users';
  }
  // Automation/AI
  if (text.includes('automat') || text.includes('ai') || text.includes('smart') || text.includes('intelligen')) {
    return 'Bot';
  }
  // Integration/connection
  if (text.includes('integrat') || text.includes('connect') || text.includes('link') || text.includes('api')) {
    return 'Link';
  }
  // Support/help
  if (text.includes('support') || text.includes('help') || text.includes('assist') || text.includes('service')) {
    return 'LifeBuoy';
  }
  // Check/verify
  if (text.includes('check') || text.includes('verify') || text.includes('confirm') || text.includes('valid')) {
    return 'CheckCircle';
  }
  // Error/problem
  if (text.includes('error') || text.includes('problem') || text.includes('issue') || text.includes('bug')) {
    return 'AlertCircle';
  }
  // File/document
  if (text.includes('file') || text.includes('document') || text.includes('folder') || text.includes('storage')) {
    return 'FileText';
  }
  // Lock/unlock
  if (text.includes('lock') || text.includes('unlock') || text.includes('access') || text.includes('permission')) {
    return 'Lock';
  }
  // Star/favorite
  if (text.includes('star') || text.includes('favorite') || text.includes('best') || text.includes('top')) {
    return 'Star';
  }
  // Globe/global
  if (text.includes('global') || text.includes('world') || text.includes('international') || text.includes('worldwide')) {
    return 'Globe';
  }
  // Phone/call
  if (text.includes('phone') || text.includes('call') || text.includes('contact') || text.includes('mobile')) {
    return 'Phone';
  }
  // Video/camera
  if (text.includes('video') || text.includes('camera') || text.includes('record') || text.includes('stream')) {
    return 'Video';
  }
  // Image/photo
  if (text.includes('image') || text.includes('photo') || text.includes('picture') || text.includes('visual')) {
    return 'Image';
  }
  // Download/upload
  if (text.includes('download') || text.includes('upload') || text.includes('export') || text.includes('import')) {
    return 'Download';
  }
  // Refresh/update
  if (text.includes('refresh') || text.includes('update') || text.includes('reload') || text.includes('renew')) {
    return 'RefreshCw';
  }
  // Play/pause
  if (text.includes('play') || text.includes('start') || text.includes('run') || text.includes('execute')) {
    return 'Play';
  }
  // Edit/modify
  if (text.includes('edit') || text.includes('modify') || text.includes('change') || text.includes('update')) {
    return 'Edit';
  }
  // Delete/remove
  if (text.includes('delete') || text.includes('remove') || text.includes('trash') || text.includes('discard')) {
    return 'Trash2';
  }
  // Add/plus
  if (text.includes('add') || text.includes('plus') || text.includes('new') || text.includes('create')) {
    return 'Plus';
  }
  // Minus/subtract
  if (text.includes('minus') || text.includes('subtract') || text.includes('less') || text.includes('reduce')) {
    return 'Minus';
  }

  // Default fallback
  return 'Sparkles';
}
