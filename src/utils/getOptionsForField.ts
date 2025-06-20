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

export function getOptionsForField(displayFieldName: string): readonly string[] {
  const internalFieldName = fieldNameMap[displayFieldName];

  if (!internalFieldName) {
    console.warn(`Unknown display field name: ${displayFieldName}`);
    return [];
  }

  // Get validated fields (already stored with internal names)
  const validatedFields = useOnboardingStore.getState().validatedFields;

  switch (internalFieldName) {
    case "marketCategory":
      return taxonomy.marketCategories;

    case "marketSubcategory": {
      // Look for the category using internal name (since that's how it's stored)
      const category = validatedFields.marketCategory;
      if (category && category in marketSubcategories) {
        return marketSubcategories[category as ValidCategory];
      }
      return [];
    }

    case "targetAudience":
      // Flatten all audiences from all groups
      return taxonomy.targetAudienceGroups.flatMap(group => 
        group.audiences.map(audience => audience.label)
      );

    case "startupStage":
      // Flatten all stages from all groups
      return taxonomy.startupStageGroups.flatMap(group => 
        group.stages.map(stage => stage.label)
      );

    case "pricingModel":
      return taxonomy.pricingModels.map(model => model.label);

    case "landingGoal":
      return taxonomy.landingGoalTypes.map(goal => goal.label);

    default:
      return [];
  }
}