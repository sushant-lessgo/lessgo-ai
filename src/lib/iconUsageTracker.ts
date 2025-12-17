/**
 * Icon Usage Tracker
 *
 * Tracks icon usage via localStorage for Popular and Recent icon tabs.
 * Device-specific tracking (not synced across devices).
 */

import { IconType } from './iconStorage';

const STORAGE_KEY = 'lessgo_icon_usage';
const MAX_RECENT = 15;
const MAX_POPULAR = 30;

export interface IconUsage {
  iconName: string;
  type: IconType;
  count: number;
  lastUsed: number; // Unix timestamp in milliseconds
}

interface IconUsageMap {
  [key: string]: IconUsage;
}

/**
 * Get storage key for an icon
 */
function getStorageKey(iconName: string, type: IconType): string {
  return `${type}:${iconName}`;
}

/**
 * Load usage data from localStorage
 */
function loadUsageData(): IconUsageMap {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const data = window.localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return {};
    }

    return JSON.parse(data) as IconUsageMap;
  } catch (error) {
    console.error('[IconUsageTracker] Failed to load usage data:', error);
    return {};
  }
}

/**
 * Save usage data to localStorage
 */
function saveUsageData(data: IconUsageMap): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[IconUsageTracker] Failed to save usage data:', error);
  }
}

/**
 * Track icon usage
 *
 * @param iconName - Icon identifier (emoji or icon name)
 * @param type - Icon type ('emoji' or 'lucide')
 *
 * @example
 * trackUsage('arrow-right', 'lucide')
 * trackUsage('🎯', 'emoji')
 */
export function trackUsage(iconName: string, type: IconType): void {
  const data = loadUsageData();
  const key = getStorageKey(iconName, type);

  if (data[key]) {
    // Update existing entry
    data[key].count += 1;
    data[key].lastUsed = Date.now();
  } else {
    // Create new entry
    data[key] = {
      iconName,
      type,
      count: 1,
      lastUsed: Date.now()
    };
  }

  saveUsageData(data);
}

/**
 * Get recently used icons (last 15 used)
 *
 * @returns Array of IconUsage sorted by lastUsed (most recent first)
 *
 * @example
 * const recent = getRecentIcons();
 * // Returns: [{ iconName: 'arrow-right', type: 'lucide', count: 5, lastUsed: 1234567890 }, ...]
 */
export function getRecentIcons(): IconUsage[] {
  const data = loadUsageData();
  const entries = Object.values(data);

  // Sort by lastUsed (descending), then take first MAX_RECENT
  return entries
    .sort((a, b) => b.lastUsed - a.lastUsed)
    .slice(0, MAX_RECENT);
}

/**
 * Get popular icons (top 30 by usage count)
 *
 * @returns Array of IconUsage sorted by count (most popular first)
 *
 * @example
 * const popular = getPopularIcons();
 * // Returns: [{ iconName: '🎯', type: 'emoji', count: 42, lastUsed: 1234567890 }, ...]
 */
export function getPopularIcons(): IconUsage[] {
  const data = loadUsageData();
  const entries = Object.values(data);

  // Sort by count (descending), then by lastUsed (descending), then take first MAX_POPULAR
  return entries
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return b.lastUsed - a.lastUsed;
    })
    .slice(0, MAX_POPULAR);
}

/**
 * Get usage count for a specific icon
 *
 * @param iconName - Icon identifier
 * @param type - Icon type
 * @returns Usage count (0 if never used)
 */
export function getUsageCount(iconName: string, type: IconType): number {
  const data = loadUsageData();
  const key = getStorageKey(iconName, type);
  return data[key]?.count || 0;
}

/**
 * Clear all usage data (for testing or reset)
 */
export function clearUsageData(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[IconUsageTracker] Failed to clear usage data:', error);
  }
}

/**
 * Get total number of tracked icons
 */
export function getTotalTrackedIcons(): number {
  const data = loadUsageData();
  return Object.keys(data).length;
}
