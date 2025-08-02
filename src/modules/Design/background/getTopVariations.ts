
import { variationScoreMap } from './variationScoreMap';

type ScoreMap = Record<string, Record<string, 0 | 1 | 2 | 3>>;

interface FunnelInput {
  marketCategoryId: string;
  targetAudienceId: string;
  landingPageGoalsId: string;  // ✅ Changed from goalId
  startupStageId: string;      // ✅ Changed from stageId
  pricingModelId: string;      // ✅ Changed from pricingId
  toneProfileId: string;       // ✅ Changed from toneId
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
  landingPageGoals: number;
  startupStage: number;
  pricingModel: number;
  toneProfile: number;
}): number {
  return (
    0.3 * (scores.marketCategory / 3) +
    0.3 * (scores.targetAudience / 3) +
    0.4 * (
      0.4 * (scores.landingPageGoals / 3) +
      0.3 * (scores.startupStage / 3) +
      0.15 * (scores.pricingModel / 3) +
      0.15 * (scores.toneProfile / 3)
    )
  );
}

// Map input values to existing variation keys
function mapInputToVariationKeys(input: FunnelInput): FunnelInput {
  const audienceMapping: Record<string, string> = {
    'online-educators': 'creators',
    'developers': 'builders', 
    'designers': 'creators',
    'small-business': 'businesses',
    'startups': 'founders',
    'agencies': 'businesses'
  };

  const stageMapping: Record<string, string> = {
    'early-feedback': 'mvp',
    'pre-launch': 'idea',
    'product-market-fit': 'traction'
  };

  return {
    ...input,
    targetAudienceId: audienceMapping[input.targetAudienceId] || input.targetAudienceId,
    startupStageId: stageMapping[input.startupStageId] || input.startupStageId
  };
}

export function getTopVariationWithFunnel(input: FunnelInput): FunnelResult {
  // Map input values to existing keys
  const mappedInput = mapInputToVariationKeys(input);
  const archetypeScores: Record<string, number> = {};

  // Step 1: Score archetypes
  for (const key in variationScoreMap) {
    const [archetypeId] = key.split("::");
    const variation = variationScoreMap[key];

    const scores = {
      marketCategory: variation.market?.[mappedInput.marketCategoryId] ?? 0,
      targetAudience: variation.audience?.[mappedInput.targetAudienceId] ?? 0,
      landingPageGoals: variation.landingPageGoals?.[mappedInput.landingPageGoalsId] ?? 0,
      startupStage: variation.startupStage?.[mappedInput.startupStageId] ?? 0,
      pricingModel: variation.pricingModel?.[mappedInput.pricingModelId] ?? 0,
      toneProfile: variation.toneProfile?.[mappedInput.toneProfileId] ?? 0,


    };

    // Allow variations with partial matches - don't skip zero scores

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
      marketCategory: variation.market?.[mappedInput.marketCategoryId] ?? 0,
      targetAudience: variation.audience?.[mappedInput.targetAudienceId] ?? 0,
      landingPageGoals: variation.landingPageGoals?.[mappedInput.landingPageGoalsId] ?? 0,
      startupStage: variation.startupStage?.[mappedInput.startupStageId] ?? 0,
      pricingModel: variation.pricingModel?.[mappedInput.pricingModelId] ?? 0,
      toneProfile: variation.toneProfile?.[mappedInput.toneProfileId] ?? 0,


    };

    // Allow variations with partial matches - don't skip zero scores

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
      marketCategory: variation.market?.[mappedInput.marketCategoryId] ?? 0,
      targetAudience: variation.audience?.[mappedInput.targetAudienceId] ?? 0,
      landingPageGoals: variation.landingPageGoals?.[mappedInput.landingPageGoalsId] ?? 0,
      startupStage: variation.startupStage?.[mappedInput.startupStageId] ?? 0,
      pricingModel: variation.pricingModel?.[mappedInput.pricingModelId] ?? 0,
      toneProfile: variation.toneProfile?.[mappedInput.toneProfileId] ?? 0,


    };

    // Allow variations with partial matches - don't skip zero scores

    const baseScore = computeScore(scores);
    // Add larger random variance (±0.3) to break ties and increase variety
    const randomVariance = (Math.random() - 0.5) * 0.6; // ±0.3 range
    const finalScore = baseScore + randomVariance;
    variationScores.push({ key, score: finalScore });
  }

  variationScores.sort((a, b) => b.score - a.score);
  const top15Variations = variationScores.slice(0, 15).map(v => v.key);
  const randomIndex = Math.floor(Math.random() * top15Variations.length);

  // Log variety improvements for debugging
  console.log('🎨 [VARIETY-DEBUG] Background selection improvements:', {
    totalVariations: variationScores.length,
    topVariationsCount: top15Variations.length,
    selectedVariation: top15Variations[randomIndex],
    scoreRange: {
      highest: variationScores[0]?.score.toFixed(3),
      lowest: variationScores[variationScores.length - 1]?.score.toFixed(3),
      top15Range: `${variationScores[0]?.score.toFixed(3)} - ${variationScores[14]?.score.toFixed(3)}`
    }
  });

  return {
    primaryVariation: top15Variations[randomIndex],
    secondaryOptions: top15Variations.filter((_, i) => i !== randomIndex),
    trace: {
      topArchetypes,
      topThemes,
      topVariations: top15Variations,
    },
  };
}
