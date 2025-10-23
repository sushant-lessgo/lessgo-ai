// backgroundSelection.ts - Select appropriate background for user

import { primaryBackgrounds, getBackgroundsByCategory, type PrimaryBackground } from './primaryBackgrounds';
import { getCategoryForUser, getCategoryWithReason } from './categoryMapping';
import type { InputVariables, HiddenInferredFields } from '@/types/core/content';
import { logger } from '@/lib/logger';

/**
 * Select a primary background based on user's onboarding data
 *
 * Process:
 * 1. Determine user category (technical/professional/friendly)
 * 2. Filter backgrounds by category
 * 3. Select random from filtered pool
 * 4. Fallback to all backgrounds if pool is too small
 */
export function selectPrimaryBackground(
  onboardingData: Partial<InputVariables & HiddenInferredFields>
): PrimaryBackground {
  // Determine user category
  const { category, reason } = getCategoryWithReason(onboardingData);

  logger.debug('🎨 [Background Selection] Determining category:', {
    category,
    reason,
    audience: onboardingData.targetAudience,
    market: onboardingData.marketCategory,
  });

  // Filter backgrounds by category
  let pool = getBackgroundsByCategory(category);

  // Fallback: if pool too small (< 5), use all backgrounds
  if (pool.length < 5) {
    // logger.warn(`Background pool for category "${category}" has only ${pool.length} items. Using all backgrounds.`);
    pool = primaryBackgrounds;
  }

  // Select random from filtered pool
  const randomIndex = Math.floor(Math.random() * pool.length);
  const selected = pool[randomIndex];

  logger.debug('🎨 [Background Selection] Selected background:', {
    id: selected.id,
    label: selected.label,
    baseColor: selected.baseColor,
    category: selected.category,
    poolSize: pool.length,
    totalAvailable: primaryBackgrounds.length,
  });

  return selected;
}

/**
 * Select multiple backgrounds for variety (e.g., for section-specific backgrounds)
 */
export function selectMultipleBackgrounds(
  onboardingData: Partial<InputVariables & HiddenInferredFields>,
  count: number = 3
): PrimaryBackground[] {
  const category = getCategoryForUser(onboardingData);
  let pool = getBackgroundsByCategory(category);

  // Fallback to all if pool too small
  if (pool.length < count) {
    pool = primaryBackgrounds;
  }

  // Shuffle pool and take first N
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get a specific background by ID with fallback
 */
export function getBackgroundOrFallback(
  backgroundId: string | undefined,
  onboardingData: Partial<InputVariables & HiddenInferredFields>
): PrimaryBackground {
  if (backgroundId) {
    const found = primaryBackgrounds.find(bg => bg.id === backgroundId);
    if (found) {
      // logger.debug('🎨 [Background Selection] Using specific background:', backgroundId);
      return found;
    }
    // logger.warn(`Background ID "${backgroundId}" not found, selecting random.`);
  }

  return selectPrimaryBackground(onboardingData);
}

/**
 * Preview all backgrounds in a category (for testing/debugging)
 */
export function previewCategoryBackgrounds(category: 'technical' | 'professional' | 'friendly') {
  const backgrounds = getBackgroundsByCategory(category);

  // console.log(`\n📊 ${category.toUpperCase()} Backgrounds (${backgrounds.length} total):\n`);

  // backgrounds.forEach((bg, index) => {
  //   console.log(`${index + 1}. ${bg.label}`);
  //   console.log(`   ID: ${bg.id}`);
  //   console.log(`   CSS: ${bg.css.substring(0, 60)}${bg.css.length > 60 ? '...' : ''}`);
  //   console.log(`   Base Color: ${bg.baseColor}\n`);
  // });
}

/**
 * Test background selection with sample profiles
 */
export function testBackgroundSelection() {
  const testProfiles = [
    {
      name: 'AI Developer Tool',
      data: { targetAudience: 'Developers', marketCategory: 'AI Tools' }
    },
    {
      name: 'Enterprise HR Platform',
      data: { targetAudience: 'Enterprise Teams', marketCategory: 'HR & People Operations Tools' }
    },
    {
      name: 'Startup No-Code Builder',
      data: { targetAudience: 'Founders', marketCategory: 'No-Code & Development Platforms' }
    },
    {
      name: 'Finance SaaS',
      data: { targetAudience: 'Small Businesses', marketCategory: 'Finance & Accounting Tools' }
    },
  ];

  // console.log('🧪 Testing Background Selection...\n');

  // testProfiles.forEach(profile => {
  //   console.log(`\n📝 Testing: ${profile.name}`);
  //   console.log(`   Audience: ${profile.data.targetAudience}`);
  //   console.log(`   Market: ${profile.data.marketCategory}`);

  //   // Select 3 backgrounds to show variety
  //   const selections = selectMultipleBackgrounds(profile.data, 3);

  //   console.log(`\n   Selected Backgrounds:`);
  //   selections.forEach((bg, i) => {
  //     console.log(`   ${i + 1}. ${bg.label} (${bg.category})`);
  //   });
  // });

  // console.log('\n✅ Background selection test complete.\n');
}
