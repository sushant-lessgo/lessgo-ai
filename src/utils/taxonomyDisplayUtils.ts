// utils/taxonomyDisplayUtils.ts
// Helper functions to convert between taxonomy IDs and display labels

import { taxonomy } from '@/modules/inference/taxonomy';
import type { CanonicalFieldName } from '@/types/core/index';

/**
 * Convert a taxonomy ID to its display label
 * @param fieldName - The canonical field name
 * @param id - The taxonomy ID (e.g., "mvp-development")
 * @returns The display label (e.g., "MVP in development") or the original ID if not found
 */
export function getDisplayLabelForId(fieldName: CanonicalFieldName, id: string): string {
  if (!id) return id;

  switch (fieldName) {
    case 'targetAudience': {
      for (const group of taxonomy.targetAudienceGroups) {
        const audience = group.audiences.find(a => a.id === id);
        if (audience) return audience.label;
      }
      break;
    }

    case 'startupStage': {
      for (const group of taxonomy.startupStageGroups) {
        const stage = group.stages.find(s => s.id === id);
        if (stage) return stage.label;
      }
      break;
    }

    case 'landingPageGoals': {
      const goal = taxonomy.landingGoalTypes.find(g => g.id === id);
      if (goal) return goal.label;
      break;
    }

    case 'pricingModel': {
      const model = taxonomy.pricingModels.find(m => m.id === id);
      if (model) return model.label;
      break;
    }

    // Fields without IDs - return as-is
    case 'marketCategory':
    case 'marketSubcategory':
    case 'keyProblem':
      return id;

    default:
      return id;
  }

  // If not found, return original ID
  return id;
}

/**
 * Convert a display label to its taxonomy ID
 * @param fieldName - The canonical field name
 * @param label - The display label (e.g., "MVP in development")
 * @returns The taxonomy ID (e.g., "mvp-development") or the original label if not found
 */
export function getIdForDisplayLabel(fieldName: CanonicalFieldName, label: string): string {
  if (!label) return label;

  switch (fieldName) {
    case 'targetAudience': {
      for (const group of taxonomy.targetAudienceGroups) {
        const audience = group.audiences.find(a => a.label === label);
        if (audience) return audience.id;
      }
      break;
    }

    case 'startupStage': {
      for (const group of taxonomy.startupStageGroups) {
        const stage = group.stages.find(s => s.label === label);
        if (stage) return stage.id;
      }
      break;
    }

    case 'landingPageGoals': {
      const goal = taxonomy.landingGoalTypes.find(g => g.label === label);
      if (goal) return goal.id;
      break;
    }

    case 'pricingModel': {
      const model = taxonomy.pricingModels.find(m => m.label === label);
      if (model) return model.id;
      break;
    }

    // Fields without IDs - return as-is
    case 'marketCategory':
    case 'marketSubcategory':
    case 'keyProblem':
      return label;

    default:
      return label;
  }

  // If not found, return original label
  return label;
}

/**
 * Check if a field uses IDs (vs labels) in the taxonomy
 */
export function fieldUsesIds(fieldName: CanonicalFieldName): boolean {
  return ['targetAudience', 'startupStage', 'landingPageGoals', 'pricingModel'].includes(fieldName);
}
