// getOptionsForField.ts
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
      console.warn(`No options defined for field: ${internalFieldName}`);
      return [];
  }
}

// NEW: Get grouped options from taxonomy structure
export function getGroupedOptionsForField(displayFieldName: string): Record<string, string[]> | null {
  const internalFieldName = fieldNameMap[displayFieldName];

  if (!internalFieldName) {
    console.warn(`Unknown display field name: ${displayFieldName}`);
    return null;
  }

  switch (internalFieldName) {
    case "targetAudience":
      // Transform targetAudienceGroups to grouped structure
      return taxonomy.targetAudienceGroups.reduce((acc, group) => {
        acc[group.label] = group.audiences.map(audience => audience.label);
        return acc;
      }, {} as Record<string, string[]>);

    case "startupStage":
      // Transform startupStageGroups to grouped structure
      return taxonomy.startupStageGroups.reduce((acc, group) => {
        acc[group.label] = group.stages.map(stage => stage.label);
        return acc;
      }, {} as Record<string, string[]>);

    case "pricingModel":
      // Create logical groups for pricing models
      const pricingGroups: Record<string, string[]> = {
        'Free & Trial Options': [],
        'Standard Subscription': [],
        'Usage & Scale Based': [],
        'Enterprise Sales': []
      };

      taxonomy.pricingModels.forEach(model => {
        const label = model.label;
        if (label.includes('Free') || label.includes('Trial') || label.includes('Freemium')) {
          pricingGroups['Free & Trial Options'].push(label);
        } else if (label.includes('Flat') || label.includes('Tiered')) {
          pricingGroups['Standard Subscription'].push(label);
        } else if (label.includes('Per Seat') || label.includes('Usage-Based')) {
          pricingGroups['Usage & Scale Based'].push(label);
        } else if (label.includes('Custom') || label.includes('Sales')) {
          pricingGroups['Enterprise Sales'].push(label);
        } else {
          // Default fallback
          pricingGroups['Standard Subscription'].push(label);
        }
      });

      // Remove empty groups
      Object.keys(pricingGroups).forEach(key => {
        if (pricingGroups[key].length === 0) {
          delete pricingGroups[key];
        }
      });

      return pricingGroups;

    default:
      // Field doesn't have natural grouping
      return null;
  }
}

// Helper function to get field options by internal name (useful for validation)
export function getOptionsByInternalName(internalFieldName: string, parentCategory?: string): readonly string[] {
  switch (internalFieldName) {
    case "marketCategory":
      return taxonomy.marketCategories;

    case "marketSubcategory":
      if (parentCategory && parentCategory in marketSubcategories) {
        return marketSubcategories[parentCategory as ValidCategory];
      }
      return [];

    case "targetAudience":
      return taxonomy.targetAudienceGroups.flatMap(group => 
        group.audiences.map(audience => audience.label)
      );

    case "startupStage":
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