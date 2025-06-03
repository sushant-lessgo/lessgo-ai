import { taxonomy, marketSubcategories } from "@/modules/inference/taxonomy";
import { useOnboardingStore } from "@/hooks/useOnboardingStore";

// Type for valid market category
type ValidCategory = keyof typeof marketSubcategories;

const fieldNameMap: Record<string, string> = {
  "Market Category": "marketCategory",
  "Market Subcategory": "marketSubcategory",
  "Target Audience": "targetAudience",
  "Startup Stage": "startupStage",
  "Landing Page Goals": "landingGoal",
  "Pricing Category and Model": "pricingModel",
};

export function getOptionsForField(displayFieldName: string): string[] {
  const internalFieldName = fieldNameMap[displayFieldName];

  if (!internalFieldName) {
    console.warn(`Unknown display field name: ${displayFieldName}`);
    return [];
  }

  const validatedFieldsRaw = useOnboardingStore.getState().validatedFields;


  const validatedFields: Record<string, string> = {};
  for (const [displayKey, value] of Object.entries(validatedFieldsRaw)) {
    const internalKey = fieldNameMap[displayKey];
    if (internalKey) validatedFields[internalKey] = value;
  }

  switch (internalFieldName) {
    case "marketCategory":
      return taxonomy.marketCategories;

    case "marketSubcategory": {
      const category = validatedFields.marketCategory;
      if (category && category in marketSubcategories) {
        return marketSubcategories[category as ValidCategory];
      }
      return [];
    }

    case "targetAudience":
      return taxonomy.targetAudiences;

    case "startupStage":
      return taxonomy.startupStages;

    case "pricingModel":
      return taxonomy.pricingModels;

    case "landingGoal":
      return taxonomy.landingGoals;

    default:
      return [];
  }
}
