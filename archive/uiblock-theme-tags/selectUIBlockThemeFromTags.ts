import { shortlistTags } from './shortlistTags';
import type {
  MarketCategory,
  TargetAudience,
  LandingGoalType,
  StartupStage,
  ToneProfile,
  AwarenessLevel,
  PricingModel
} from '@/modules/inference/taxonomy';

export type UIBlockTheme = 'warm' | 'cool' | 'neutral';

type UserContext = {
  marketCategory: MarketCategory;
  targetAudience: TargetAudience;
  landingPageGoals: LandingGoalType;
  startupStage: StartupStage;
  toneProfile: ToneProfile;
  awarenessLevel: AwarenessLevel;
  pricingModel: PricingModel;
};

/**
 * Select UIBlock theme using existing tags system
 * Reuses shortlistTags logic with temperature tags from tagsAccentTaxonomy
 *
 * This function leverages the existing tag-based selection infrastructure
 * to determine visual polish (shadows, hover states) for UIBlocks.
 *
 * @param userContext - Full taxonomy context (7 fields)
 * @returns 'warm' | 'cool' | 'neutral' theme
 */
export function selectUIBlockTheme(userContext: UserContext): UIBlockTheme {
  const tags = shortlistTags(userContext, true); // Use category diversity

  // Debug logging
  console.log('🏷️ selectUIBlockTheme:', {
    marketCategory: userContext.marketCategory,
    targetAudience: userContext.targetAudience,
    tags,
    hasWarm: tags.includes('warm'),
    hasCool: tags.includes('cool'),
    hasNeutral: tags.includes('neutral')
  });

  // ✅ PRIORITY 1: Direct category overrides for food/consumer apps
  // These should always be warm regardless of parent category
  const warmCategories = [
    'food & beverage',
    'food & nutrition',
    'meal planning',
    'recipe',
    'restaurant',
    'culinary',
    'cooking',
    'nutrition'
  ];

  const categoryLower = userContext.marketCategory?.toLowerCase() || '';
  if (warmCategories.some(cat => categoryLower.includes(cat))) {
    console.log('✅ Override: Food-related category detected → warm');
    return 'warm';
  }

  // ✅ PRIORITY 2: Audience-based detection for consumer apps
  // "families" + "Health & Wellness" = likely food/lifestyle, not medical
  if (userContext.targetAudience === 'families' &&
      categoryLower.includes('health')) {
    console.log('✅ Override: Family-focused health app → warm (likely food/lifestyle)');
    return 'warm';
  }

  // ✅ PRIORITY 3: Check temperature tags from taxonomy
  if (tags.includes('warm')) return 'warm';
  if (tags.includes('cool')) return 'cool';
  if (tags.includes('neutral')) return 'neutral';

  // ✅ PRIORITY 4: Fallback heuristics from other tags
  if (tags.includes('creative') || tags.includes('consumer')) return 'warm';
  if (tags.includes('fintech') || tags.includes('enterprise') || tags.includes('technical')) return 'cool';

  return 'neutral';
}
