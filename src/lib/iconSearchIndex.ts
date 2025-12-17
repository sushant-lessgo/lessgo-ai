/**
 * Icon Search Index
 *
 * Provides fast, fuzzy searching across all icons (emoji + Lucide).
 * Uses indexed search with ranking for best results.
 */

import { IconType } from './iconStorage';
import { buildIconRegistry, IconMetadata } from './lucideIconRegistry';
import { EMOJI_ICONS } from './lucideIconCategories';

export interface IconSearchEntry {
  name: string; // Icon identifier (emoji char or lucide name)
  displayName: string; // Human-readable name
  keywords: string[]; // Searchable keywords
  category: string[]; // Categories
  type: IconType; // 'emoji' or 'lucide'
}

export interface SearchResult {
  icon: IconSearchEntry;
  score: number; // Relevance score (higher = better match)
}

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity score (0-1, higher is more similar)
 */
function similarityScore(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
}

/**
 * Build search index from all icons
 */
export function buildSearchIndex(): IconSearchEntry[] {
  const entries: IconSearchEntry[] = [];

  // Add emoji icons
  for (const emoji of EMOJI_ICONS) {
    entries.push({
      name: emoji.emoji,
      displayName: emoji.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      keywords: emoji.keywords,
      category: ['emojis'],
      type: 'emoji'
    });
  }

  // Add Lucide icons
  const lucideRegistry = buildIconRegistry();
  for (const icon of lucideRegistry) {
    entries.push({
      name: icon.name,
      displayName: icon.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      keywords: icon.keywords,
      category: icon.category,
      type: 'lucide'
    });
  }

  return entries;
}

/**
 * Search icons with ranking
 *
 * @param query - Search query string
 * @param maxResults - Maximum number of results to return (default: 100)
 * @returns Ranked search results
 */
export function searchIcons(query: string, maxResults: number = 100): SearchResult[] {
  if (!query || query.trim() === '') {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();
  const index = buildSearchIndex();
  const results: SearchResult[] = [];

  for (const icon of index) {
    let score = 0;

    // Priority 1: Exact match on name (highest score: 100)
    if (icon.name.toLowerCase() === searchTerm) {
      score = 100;
    }
    // Priority 2: Name starts with search term (score: 80-95)
    else if (icon.name.toLowerCase().startsWith(searchTerm)) {
      score = 95;
    }
    // Priority 3: Display name starts with search term (score: 70-85)
    else if (icon.displayName.toLowerCase().startsWith(searchTerm)) {
      score = 85;
    }
    // Priority 4: Name contains search term (score: 60-75)
    else if (icon.name.toLowerCase().includes(searchTerm)) {
      score = 75;
    }
    // Priority 5: Display name contains search term (score: 50-65)
    else if (icon.displayName.toLowerCase().includes(searchTerm)) {
      score = 65;
    }
    // Priority 6: Keyword exact match (score: 70)
    else if (icon.keywords.some(kw => kw.toLowerCase() === searchTerm)) {
      score = 70;
    }
    // Priority 7: Keyword starts with search term (score: 55)
    else if (icon.keywords.some(kw => kw.toLowerCase().startsWith(searchTerm))) {
      score = 55;
    }
    // Priority 8: Keyword contains search term (score: 45)
    else if (icon.keywords.some(kw => kw.toLowerCase().includes(searchTerm))) {
      score = 45;
    }
    // Priority 9: Fuzzy match on name (score: 20-40 based on similarity)
    else {
      const nameSimilarity = similarityScore(searchTerm, icon.name);
      const displaySimilarity = similarityScore(searchTerm, icon.displayName);
      const maxSimilarity = Math.max(nameSimilarity, displaySimilarity);

      // Only include if similarity > 0.5 (50%)
      if (maxSimilarity > 0.5) {
        score = Math.round(maxSimilarity * 40); // Scale to 20-40
      }
    }

    // Bonus: Emoji icons get +5 score (slightly prefer emojis)
    if (icon.type === 'emoji') {
      score += 5;
    }

    // Only include results with score > 0
    if (score > 0) {
      results.push({ icon, score });
    }
  }

  // Sort by score (descending), then by name (ascending)
  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.icon.name.localeCompare(b.icon.name);
  });

  // Return top N results
  return results.slice(0, maxResults);
}

/**
 * Get icons by category
 *
 * @param categoryId - Category identifier
 * @returns Array of icon search entries
 */
export function getIconsByCategory(categoryId: string): IconSearchEntry[] {
  const index = buildSearchIndex();

  if (categoryId === 'emojis') {
    return index.filter(icon => icon.type === 'emoji');
  }

  return index.filter(icon => icon.category.includes(categoryId));
}

/**
 * Get total icon count
 */
export function getTotalIconCount(): number {
  const index = buildSearchIndex();
  return index.length;
}

/**
 * Get icon count by type
 */
export function getIconCountByType(type: IconType): number {
  const index = buildSearchIndex();
  return index.filter(icon => icon.type === type).length;
}
