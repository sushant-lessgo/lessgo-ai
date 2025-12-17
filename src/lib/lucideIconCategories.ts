/**
 * Lucide Icon Categories
 *
 * Organized categories for icon picker UI.
 * Includes emoji icons and dynamically populated categories (Popular, Recent).
 */

import { IconType } from './iconStorage';

export interface EmojiIconData {
  emoji: string;
  name: string;
  keywords: string[];
}

export interface IconCategory {
  id: string;
  name: string;
  icon: string; // Emoji or lucide icon for category tab
  dynamic?: boolean; // True for Popular/Recent (populated at runtime)
  emoji?: boolean; // True for emoji category
  icons?: EmojiIconData[]; // For emoji category only
}

/**
 * Existing 48 emoji icons from original IconPicker
 * Preserved for backwards compatibility
 */
export const EMOJI_ICONS: EmojiIconData[] = [
  // Common (12)
  { emoji: '🎯', name: 'target', keywords: ['target', 'goal', 'aim', 'focus'] },
  { emoji: '⚡', name: 'lightning', keywords: ['lightning', 'bolt', 'fast', 'speed', 'energy'] },
  { emoji: '🔒', name: 'lock', keywords: ['lock', 'secure', 'private', 'protected'] },
  { emoji: '🎨', name: 'palette', keywords: ['palette', 'art', 'design', 'color', 'creative'] },
  { emoji: '🔗', name: 'link', keywords: ['link', 'chain', 'connection', 'url'] },
  { emoji: '💡', name: 'lightbulb', keywords: ['lightbulb', 'idea', 'innovation', 'bright'] },
  { emoji: '⭐', name: 'star', keywords: ['star', 'favorite', 'rating', 'featured'] },
  { emoji: '✅', name: 'check', keywords: ['check', 'done', 'complete', 'verified', 'success'] },
  { emoji: '🚀', name: 'rocket', keywords: ['rocket', 'launch', 'startup', 'growth', 'fast'] },
  { emoji: '💰', name: 'money', keywords: ['money', 'dollar', 'revenue', 'profit', 'cash'] },
  { emoji: '📊', name: 'chart', keywords: ['chart', 'graph', 'analytics', 'data', 'metrics'] },
  { emoji: '🔧', name: 'wrench', keywords: ['wrench', 'tool', 'settings', 'configure', 'fix'] },

  // Business (12)
  { emoji: '📈', name: 'trending-up', keywords: ['trending-up', 'growth', 'increase', 'success', 'profit'] },
  { emoji: '📉', name: 'trending-down', keywords: ['trending-down', 'decline', 'decrease', 'loss'] },
  { emoji: '💼', name: 'briefcase', keywords: ['briefcase', 'business', 'work', 'professional', 'career'] },
  { emoji: '🏢', name: 'building', keywords: ['building', 'office', 'company', 'enterprise', 'corporate'] },
  { emoji: '👥', name: 'users', keywords: ['users', 'people', 'team', 'group', 'community'] },
  { emoji: '🎪', name: 'performance', keywords: ['performance', 'metrics', 'speed', 'optimization'] },
  { emoji: '🛡️', name: 'shield', keywords: ['shield', 'protect', 'secure', 'defense', 'safe'] },
  { emoji: '⚙️', name: 'settings', keywords: ['settings', 'config', 'preferences', 'options', 'gear'] },
  { emoji: '📋', name: 'clipboard', keywords: ['clipboard', 'list', 'tasks', 'document', 'copy'] },
  { emoji: '📧', name: 'email', keywords: ['email', 'mail', 'message', 'contact', 'inbox'] },
  { emoji: '🌐', name: 'globe', keywords: ['globe', 'world', 'global', 'international', 'web'] },
  { emoji: '🔄', name: 'refresh', keywords: ['refresh', 'reload', 'sync', 'update', 'rotate'] },

  // Technology (12)
  { emoji: '💻', name: 'computer', keywords: ['computer', 'laptop', 'desktop', 'tech', 'device'] },
  { emoji: '📱', name: 'mobile', keywords: ['mobile', 'phone', 'smartphone', 'device', 'app'] },
  { emoji: '☁️', name: 'cloud', keywords: ['cloud', 'storage', 'server', 'backup', 'online'] },
  { emoji: '🔌', name: 'plug', keywords: ['plug', 'connection', 'power', 'electric', 'integrate'] },
  { emoji: '📡', name: 'antenna', keywords: ['antenna', 'signal', 'broadcast', 'network', 'wifi'] },
  { emoji: '🖥️', name: 'monitor', keywords: ['monitor', 'screen', 'display', 'desktop'] },
  { emoji: '⌨️', name: 'keyboard', keywords: ['keyboard', 'type', 'input', 'code'] },
  { emoji: '🖱️', name: 'mouse', keywords: ['mouse', 'click', 'pointer', 'cursor'] },
  { emoji: '🗄️', name: 'database', keywords: ['database', 'data', 'storage', 'server', 'sql'] },
  { emoji: '🔐', name: 'secure', keywords: ['secure', 'lock', 'key', 'encrypted', 'safe'] },
  { emoji: '📊', name: 'analytics', keywords: ['analytics', 'data', 'metrics', 'insights', 'report'] },
  { emoji: '🤖', name: 'robot', keywords: ['robot', 'ai', 'automation', 'bot', 'machine'] },

  // Emotions (12)
  { emoji: '😊', name: 'happy', keywords: ['happy', 'smile', 'joy', 'positive', 'pleased'] },
  { emoji: '🎉', name: 'celebration', keywords: ['celebration', 'party', 'success', 'achievement', 'congrats'] },
  { emoji: '❤️', name: 'heart', keywords: ['heart', 'love', 'like', 'favorite', 'passion'] },
  { emoji: '👍', name: 'thumbs-up', keywords: ['thumbs-up', 'approve', 'good', 'agree', 'like'] },
  { emoji: '🌟', name: 'star-glow', keywords: ['star-glow', 'sparkle', 'shine', 'special', 'featured'] },
  { emoji: '🔥', name: 'fire', keywords: ['fire', 'hot', 'trending', 'popular', 'flame'] },
  { emoji: '✨', name: 'sparkles', keywords: ['sparkles', 'magic', 'shine', 'special', 'new'] },
  { emoji: '🎊', name: 'confetti', keywords: ['confetti', 'party', 'celebrate', 'fun', 'success'] },
  { emoji: '💪', name: 'strength', keywords: ['strength', 'power', 'strong', 'muscle', 'force'] },
  { emoji: '🏆', name: 'trophy', keywords: ['trophy', 'winner', 'achievement', 'award', 'champion'] },
  { emoji: '🎖️', name: 'medal', keywords: ['medal', 'award', 'achievement', 'honor', 'badge'] },
  { emoji: '🥇', name: 'first-place', keywords: ['first-place', 'winner', 'gold', 'champion', 'top'] }
];

/**
 * Icon categories for organization
 */
export const ICON_CATEGORIES: IconCategory[] = [
  // Dynamic categories (populated at runtime)
  {
    id: 'popular',
    name: 'Popular',
    icon: '⭐',
    dynamic: true
  },
  {
    id: 'recent',
    name: 'Recent',
    icon: '🕐',
    dynamic: true
  },

  // Emoji category (existing 48 emojis)
  {
    id: 'emojis',
    name: 'Emojis',
    icon: '😊',
    emoji: true,
    icons: EMOJI_ICONS
  },

  // Lucide categories (auto-populated from registry)
  {
    id: 'arrows',
    name: 'Arrows',
    icon: '➡️'
  },
  {
    id: 'communication',
    name: 'Communication',
    icon: '💬'
  },
  {
    id: 'media',
    name: 'Media',
    icon: '🎵'
  },
  {
    id: 'files',
    name: 'Files',
    icon: '📁'
  },
  {
    id: 'ui',
    name: 'UI',
    icon: '🎛️'
  },
  {
    id: 'business',
    name: 'Business',
    icon: '💼'
  },
  {
    id: 'development',
    name: 'Development',
    icon: '💻'
  },
  {
    id: 'design',
    name: 'Design',
    icon: '🎨'
  },
  {
    id: 'social',
    name: 'Social',
    icon: '👥'
  },
  {
    id: 'security',
    name: 'Security',
    icon: '🔒'
  },
  {
    id: 'nature',
    name: 'Nature',
    icon: '🌿'
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: '🛒'
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: '✈️'
  },
  {
    id: 'time',
    name: 'Time',
    icon: '⏰'
  },
  {
    id: 'alerts',
    name: 'Alerts',
    icon: '🔔'
  },
  {
    id: 'devices',
    name: 'Devices',
    icon: '📱'
  },
  {
    id: 'accessibility',
    name: 'Accessibility',
    icon: '♿'
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: '🎮'
  },
  {
    id: 'science',
    name: 'Science',
    icon: '🔬'
  },
  {
    id: 'misc',
    name: 'Misc',
    icon: '📦'
  }
];

/**
 * Get category by ID
 */
export function getCategoryById(categoryId: string): IconCategory | undefined {
  return ICON_CATEGORIES.find(cat => cat.id === categoryId);
}

/**
 * Get all non-dynamic categories (for browsing)
 */
export function getBrowsableCategories(): IconCategory[] {
  return ICON_CATEGORIES.filter(cat => !cat.dynamic);
}

/**
 * Get dynamic categories (Popular, Recent)
 */
export function getDynamicCategories(): IconCategory[] {
  return ICON_CATEGORIES.filter(cat => cat.dynamic);
}
