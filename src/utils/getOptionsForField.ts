// getOptionsForField.ts - Phase 3 Migration: Fixed field name mappings
import { taxonomy, marketSubcategories } from "@/modules/inference/taxonomy";
import { useOnboardingStore } from "@/hooks/useOnboardingStore";
import { DISPLAY_TO_CANONICAL, type CanonicalFieldName } from "@/types/core/index";

// Type for valid market category
type ValidCategory = keyof typeof marketSubcategories;

export function getOptionsForField(displayFieldName: string): readonly string[] {
  // ✅ FIXED: Use canonical mappings from types/core/index.ts
  const canonicalFieldName = DISPLAY_TO_CANONICAL[displayFieldName as keyof typeof DISPLAY_TO_CANONICAL];

  if (!canonicalFieldName) {
    return [];
  }

  // Get validated fields (already stored with canonical names)
  const validatedFields = useOnboardingStore.getState().validatedFields;

  switch (canonicalFieldName) {
    case "marketCategory":
      return taxonomy.marketCategories;

    case "marketSubcategory": {
      // Look for the category using canonical name (since that's how it's stored)
      const category = validatedFields.marketCategory;

      if (process.env.NODE_ENV === 'development') {
        console.log('[getOptionsForField] subcategory options:', {
          category,
          hasCategory: !!category,
          isValidCategory: category && category in marketSubcategories,
          optionsCount: category && category in marketSubcategories
            ? marketSubcategories[category as ValidCategory].length
            : 0
        });
      }

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

    case "landingPageGoals": // ✅ FIXED: Use canonical field name
      return taxonomy.landingGoalTypes.map(goal => goal.label);

    default:
      return [];
  }
}

// NEW: Get grouped options from taxonomy structure
export function getGroupedOptionsForField(displayFieldName: string): Record<string, string[]> | null {
  // ✅ FIXED: Use canonical mappings from types/core/index.ts
  const canonicalFieldName = DISPLAY_TO_CANONICAL[displayFieldName as keyof typeof DISPLAY_TO_CANONICAL];

  if (!canonicalFieldName) {
    return null;
  }

  switch (canonicalFieldName) {
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

// Helper function to get field options by canonical name (useful for validation)
export function getOptionsByCanonicalName(canonicalFieldName: CanonicalFieldName, parentCategory?: string): readonly string[] {
  switch (canonicalFieldName) {
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

    case "landingPageGoals": // ✅ FIXED: Use canonical field name
      return taxonomy.landingGoalTypes.map(goal => goal.label);

    default:
      return [];
  }
}

// ✅ NEW: Legacy support function for backward compatibility
export function getOptionsByInternalName(internalFieldName: string, parentCategory?: string): readonly string[] {
  return getOptionsByCanonicalName(internalFieldName as CanonicalFieldName, parentCategory);
}