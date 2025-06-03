// validateOutput.ts

import { InferredFields } from './inferFields';
import { taxonomy, marketSubcategories, MarketCategory, marketCategories } from './taxonomy';
import stringSimilarity from 'string-similarity';

function findClosestMatch(value: string, options: string[], threshold = 0.6): string | null {
  const { bestMatch } = stringSimilarity.findBestMatch(
    value.toLowerCase(),
    options.map((o) => o.toLowerCase())
  );

  return bestMatch.rating >= threshold
    ? options.find((o) => o.toLowerCase() === bestMatch.target) || null
    : null;
}

function isValidMarketCategory(category: string): category is MarketCategory {
  return (marketCategories as readonly string[]).includes(category);
}

export function validateInferredFields(raw: InferredFields): Record<string, string> {
  const {
    marketCategory,
    marketSubcategory,
    keyProblem,
    targetAudience,
    startupStage,
    pricingModel,
    landingGoal,
  } = raw;


  console.log('🔍 marketCategory', marketCategory, taxonomy.marketCategories);

  const cleanedCategory = findClosestMatch(marketCategory, taxonomy.marketCategories);
  let allowedSubcategories: string[] = [];

  if (cleanedCategory && isValidMarketCategory(cleanedCategory)) {
    allowedSubcategories = marketSubcategories[cleanedCategory] ?? [];

  }
console.log('🔍 marketSubcategory', marketSubcategory, allowedSubcategories);
  const cleanedSubcategory =
  allowedSubcategories.length > 0
    ? findClosestMatch(marketSubcategory, allowedSubcategories)
    : null;


  console.log('🔍 targetAudience', targetAudience, taxonomy.targetAudiences);
  const cleanedAudience = findClosestMatch(targetAudience, taxonomy.targetAudiences);


  console.log('🔍 startupStage', startupStage, taxonomy.startupStages);
  const cleanedStage = findClosestMatch(startupStage, taxonomy.startupStages);


  console.log('🔍 pricingModel', pricingModel, taxonomy.pricingModels);
  const cleanedPricing = findClosestMatch(pricingModel, taxonomy.pricingModels);


  console.log('🔍 landingGoal', landingGoal, taxonomy.landingGoals);
  const cleanedGoal = findClosestMatch(landingGoal, taxonomy.landingGoals);

  console.log("Category", cleanedCategory);
  console.log("SubCategory", cleanedSubcategory);
  console.log("Target Audience", cleanedAudience);
  console.log("Key Problem Getting Solved", keyProblem);
  console.log("Startup Stage", cleanedStage);
  console.log("Landing Page Goals", cleanedGoal);
  console.log("Pricing Category and Model", cleanedPricing);

  


  return {
    "Market Category": cleanedCategory || '',
    "Market Subcategory": cleanedSubcategory || '',
    "Target Audience": cleanedAudience || '',
    "Key Problem Getting Solved": keyProblem.trim(),
    "Startup Stage": cleanedStage || '',
    "Landing Page Goals": cleanedGoal || '',
    "Pricing Category and Model": cleanedPricing || '',
  };
}
