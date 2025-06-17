import { variableTagsMapping } from './variableTagsMapping';
import { tagsAccentTaxonomy } from './tagsAccentTaxonomy';

// Tag weighting config (total = 1.0)
const weights = {
  marketCategory: 0.25,
  targetAudienceGroups: 0.20,
  landingGoalTypes: 0.20,
  startupStageGroups: 0.15,
  toneProfiles: 0.10,
  awarenessLevels: 0.05,
  pricingModels: 0.05
} as const;

type UserContext = {
  marketCategory: string;
  targetAudienceGroups: string;
  landingGoalTypes: string;
  startupStageGroups: string;
  toneProfiles: string;
  awarenessLevels: string;
  pricingModels: string;
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
    const tags = variableTagsMapping[varId]?.[selected];

    if (tags && Array.isArray(tags)) {
      tags.forEach(tag => {
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
      if (tagsAccentTaxonomy[category as keyof typeof tagsAccentTaxonomy].includes(tag)) {
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
