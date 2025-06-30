import { variableTagsMapping } from './variableTagsMapping';
import { tagsAccentTaxonomy } from './tagsAccentTaxonomy';
import type { 
  MarketCategory,
  TargetAudience, 
  LandingGoalType,
  StartupStage,
  ToneProfile,
  AwarenessLevel,
  PricingModel 
} from '@/modules/inference/taxonomy';

// Tag weighting config (total = 1.0)
const weights = {
  marketCategory: 0.25,
  targetAudience: 0.20,
  landingPageGoals: 0.20,
  startupStage: 0.15,
  toneProfile: 0.10,
  awarenessLevel: 0.05,
  pricingModel: 0.05
} as const;

// ✅ MAPPING: Convert canonical field names to variableTagsMapping keys
// Based on the actual keys in your updated variableTagsMapping.ts
const CANONICAL_TO_MAPPING_KEYS = {
  marketCategory: 'marketCategories',
  targetAudience: 'targetAudienceGroups', 
  landingPageGoals: 'landingPageGoals',  // ✅ Updated to match your file
  startupStage: 'startupStageGroups',
  toneProfile: 'toneProfiles',
  awarenessLevel: 'awarenessLevels',
  pricingModel: 'pricingModels'
} as const;

// ✅ MIGRATED: Now uses canonical field names with proper types
type UserContext = {
  marketCategory: MarketCategory;
  targetAudience: TargetAudience;
  landingPageGoals: LandingGoalType;
  startupStage: StartupStage;
  toneProfile: ToneProfile;
  awarenessLevel: AwarenessLevel;
  pricingModel: PricingModel;
};

type WeightedTag = { tag: string; weight: number };

// Step 1: Collect weighted tags from user context
export function collectTagsFromUserContext(
  userContext: UserContext
): WeightedTag[] {
  const weightedTags: WeightedTag[] = [];

  for (const key in weights) {
    const varId = key as keyof typeof weights;
    const selected = userContext[varId];
    
    // ✅ FIXED: Convert canonical field name to mapping key
    const mappingKey = CANONICAL_TO_MAPPING_KEYS[varId];
    
    // ✅ FIXED: Explicit type handling for variableTagsMapping access
    const mappingSection = (variableTagsMapping as any)[mappingKey];
    const tags = mappingSection?.[selected] as string[] | undefined;

    if (tags && Array.isArray(tags)) {
      tags.forEach((tag: string) => {
        weightedTags.push({ tag, weight: weights[varId] });
      });
    }
  }

  return weightedTags;
}

// Step 2: Aggregate tag scores
export function aggregateTagScores(weightedTags: WeightedTag[]): Record<string, number> {
  const scoreMap: Record<string, number> = {};

  weightedTags.forEach(({ tag, weight }) => {
    scoreMap[tag] = (scoreMap[tag] || 0) + weight;
  });

  return scoreMap;
}

// Step 3: Rank and select top N tags
export function rankAndSelectTopTags(scoreMap: Record<string, number>, limit = 6): string[] {
  return Object.entries(scoreMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([tag]) => tag);
}

// Optional: Ensure diversity across tag taxonomy categories
export function ensureCategoryDiversity(tags: string[], limit = 6): string[] {
  const final: Set<string> = new Set();
  const seenCategories = new Set<string>();

  for (const tag of tags) {
    for (const category in tagsAccentTaxonomy) {
      const categoryKey = category as keyof typeof tagsAccentTaxonomy;
      const categoryTags = tagsAccentTaxonomy[categoryKey];
      
      // ✅ FIXED: Use type assertion that TypeScript accepts
      if ((categoryTags as readonly string[]).includes(tag)) {
        if (!seenCategories.has(category)) {
          final.add(tag);
          seenCategories.add(category);
          break;
        }
      }
    }
    if (final.size >= limit) break;
  }

  return Array.from(final);
}

// Entry point
export function shortlistTags(userContext: UserContext, useDiversity = false, limit = 6): string[] {
  const weighted = collectTagsFromUserContext(userContext);
  const scoreMap = aggregateTagScores(weighted);
  const topTags = rankAndSelectTopTags(scoreMap, limit);
  return useDiversity ? ensureCategoryDiversity(topTags, limit) : topTags;
}