
import { variationScoreMap } from './variationScoreMap';

type ScoreMap = Record<string, Record<string, 0 | 1 | 2 | 3>>;

interface FunnelInput {
  marketCategoryId: string;
  targetAudienceId: string;
  goalId: string;
  stageId: string;
  pricingId: string;
  toneId: string;
}

interface FunnelResult {
  primaryVariation: string;
  secondaryOptions: string[];
  trace: {
    topArchetypes: string[];
    topThemes: string[];
    topVariations: string[];
  };
}

function computeScore(scores: {
  marketCategory: number;
  targetAudience: number;
  goal: number;
  stage: number;
  pricing: number;
  tone: number;
}): number {
  return (
    0.4 * (scores.marketCategory / 3) +
    0.4 * (scores.targetAudience / 3) +
    0.2 * (
      0.4 * (scores.goal / 3) +
      0.3 * (scores.stage / 3) +
      0.15 * (scores.pricing / 3) +
      0.15 * (scores.tone / 3)
    )
  );
}

export function getTopVariationWithFunnel(input: FunnelInput): FunnelResult {
  const archetypeScores: Record<string, number> = {};

  // Step 1: Score archetypes
  for (const key in variationScoreMap) {
    const [archetypeId] = key.split("::");
    const variation = variationScoreMap[key];

    const scores = {
      marketCategory: variation.marketCategory?.[input.marketCategoryId] ?? 0,
      targetAudience: variation.targetAudience?.[input.targetAudienceId] ?? 0,
      goal: variation.goal?.[input.goalId] ?? 0,
      stage: variation.stage?.[input.stageId] ?? 0,
      pricing: variation.pricing?.[input.pricingId] ?? 0,
      tone: variation.tone?.[input.toneId] ?? 0,
    };

    if (Object.values(scores).includes(0)) continue;

    const score = computeScore(scores);
    archetypeScores[archetypeId] = Math.max(archetypeScores[archetypeId] ?? 0, score);
  }

  const topArchetypes = Object.entries(archetypeScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  // Step 2: Score themes from top archetypes
  const themeScores: Record<string, number> = {};

  for (const key in variationScoreMap) {
    const [archetypeId, themeId] = key.split("::");
    if (!topArchetypes.includes(archetypeId)) continue;

    const variation = variationScoreMap[key];

    const scores = {
      marketCategory: variation.marketCategory?.[input.marketCategoryId] ?? 0,
      targetAudience: variation.targetAudience?.[input.targetAudienceId] ?? 0,
      goal: variation.goal?.[input.goalId] ?? 0,
      stage: variation.stage?.[input.stageId] ?? 0,
      pricing: variation.pricing?.[input.pricingId] ?? 0,
      tone: variation.tone?.[input.toneId] ?? 0,
    };

    if (Object.values(scores).includes(0)) continue;

    const score = computeScore(scores);
    const themeKey = `${archetypeId}::${themeId}`;
    themeScores[themeKey] = Math.max(themeScores[themeKey] ?? 0, score);
  }

  const topThemes = Object.entries(themeScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  // Step 3: Score variations from top themes
  const variationScores: { key: string; score: number }[] = [];

  for (const key in variationScoreMap) {
    const [archetypeId, themeId, variationId] = key.split("::");
    const themeKey = `${archetypeId}::${themeId}`;
    if (!topThemes.includes(themeKey)) continue;

    const variation = variationScoreMap[key];

    const scores = {
      marketCategory: variation.marketCategory?.[input.marketCategoryId] ?? 0,
      targetAudience: variation.targetAudience?.[input.targetAudienceId] ?? 0,
      goal: variation.goal?.[input.goalId] ?? 0,
      stage: variation.stage?.[input.stageId] ?? 0,
      pricing: variation.pricing?.[input.pricingId] ?? 0,
      tone: variation.tone?.[input.toneId] ?? 0,
    };

    if (Object.values(scores).includes(0)) continue;

    const score = computeScore(scores);
    variationScores.push({ key, score });
  }

  variationScores.sort((a, b) => b.score - a.score);
  const top5Variations = variationScores.slice(0, 5).map(v => v.key);
  const randomIndex = Math.floor(Math.random() * top5Variations.length);

  return {
    primaryVariation: top5Variations[randomIndex],
    secondaryOptions: top5Variations.filter((_, i) => i !== randomIndex),
    trace: {
      topArchetypes,
      topThemes,
      topVariations: top5Variations,
    },
  };
}
