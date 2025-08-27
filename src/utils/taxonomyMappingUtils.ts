import { logger } from '@/lib/logger';

// utils/taxonomyMappingUtils.ts
// Auto-generates mappings from individual IDs to group IDs

import { 
  targetAudienceGroups, 
  startupStageGroups, 
  landingGoalTypes,
  pricingModels,
  marketCategories 
} from '@/modules/inference/taxonomy'; // Update this import path

// Auto-generated mapping from individual item IDs to their group IDs
export function generateItemToGroupMapping() {
  const mapping: Record<string, string> = {};
  
  logger.debug('🗺️ Generating taxonomy item-to-group mappings...');
  
  // Map target audiences: individual audience ID → group ID
  targetAudienceGroups.forEach(group => {
    group.audiences.forEach(audience => {
      mapping[audience.id] = group.id;
      logger.debug(`📍 Audience: ${audience.id} → ${group.id}`);
    });
  });
  
  // Map startup stages: individual stage ID → group ID  
  startupStageGroups.forEach(group => {
    group.stages.forEach(stage => {
      mapping[stage.id] = group.id;
      logger.debug(`📍 Stage: ${stage.id} → ${group.id}`);
    });
  });
  
  logger.debug('✅ Taxonomy mappings generated:', Object.keys(mapping).length, 'mappings');
  return mapping;
}

// Cached mapping to avoid regenerating on every call
let _cachedMapping: Record<string, string> | null = null;

export function getItemToGroupMapping(): Record<string, string> {
  if (!_cachedMapping) {
    _cachedMapping = generateItemToGroupMapping();
  }
  return _cachedMapping;
}

// Helper function to map an individual item ID to its group ID
export function mapItemToGroup(itemId: string): string {
  const mapping = getItemToGroupMapping();
  const groupId = mapping[itemId];
  
  if (!groupId) {
    logger.warn(`⚠️ No group mapping found for item: ${itemId}, using as-is`);
    return itemId; // Return the original ID if no mapping found
  }
  
  return groupId;
}

// Helper function to map onboarding store data to funnel input format
export function mapOnboardingDataToFunnelInput(validatedFields: any, hiddenInferredFields: any) {
  logger.debug('🎯 Mapping onboarding data to funnel input format...');
  logger.debug('Input validatedFields:', validatedFields);
  logger.debug('Input hiddenInferredFields:', hiddenInferredFields);
  
  const funnelInput = {
    // Market Category: Use display value directly (variationScoreMap expects full names)
    marketCategoryId: validatedFields.marketCategory || '',
    
    // Target Audience: Map individual ID → group ID
    targetAudienceId: mapItemToGroup(validatedFields.targetAudience || ''),
    
    // Goal: Use individual ID directly (landingGoalTypes are already at the right level)
    goalId: validatedFields.landingGoal || validatedFields.goal || '',
    
    // Stage: Map individual ID → group ID
    stageId: mapItemToGroup(validatedFields.startupStage || validatedFields.stage || ''),
    
    // Pricing: Use individual ID directly (pricingModels are already at the right level)
    pricingId: validatedFields.pricingModel || validatedFields.pricing || '',
    
    // Tone: From hiddenInferredFields (if available)
    toneId: hiddenInferredFields.toneProfile || hiddenInferredFields.tone || 'confident-playful', // fallback
  };
  
  logger.debug('✅ Mapped funnel input:', funnelInput);
  
  // Validate that we have meaningful values
  const emptyFields = Object.entries(funnelInput)
    .filter(([key, value]) => !value || value === '')
    .map(([key]) => key);
    
  if (emptyFields.length > 0) {
    logger.warn('⚠️ Empty fields in funnel input:', emptyFields);
  }
  
  return funnelInput;
}

// Validation helper: Check if all required mappings exist
export function validateTaxonomyMappings() {
  logger.debug('🔍 Validating taxonomy mappings...');
  
  const mapping = getItemToGroupMapping();
  const issues: string[] = [];
  
  // Check target audiences
  const allAudienceIds = targetAudienceGroups.flatMap(group => 
    group.audiences.map(audience => audience.id)
  );
  
  const missingAudienceMappings = allAudienceIds.filter(id => !mapping[id]);
  if (missingAudienceMappings.length > 0) {
    issues.push(`Missing audience mappings: ${missingAudienceMappings.join(', ')}`);
  }
  
  // Check startup stages
  const allStageIds = startupStageGroups.flatMap(group => 
    group.stages.map(stage => stage.id)
  );
  
  const missingStageMappings = allStageIds.filter(id => !mapping[id]);
  if (missingStageMappings.length > 0) {
    issues.push(`Missing stage mappings: ${missingStageMappings.join(', ')}`);
  }
  
  if (issues.length > 0) {
    logger.error('❌ Taxonomy mapping validation failed:', issues);
    return false;
  }
  
  logger.debug('✅ Taxonomy mapping validation passed');
  return true;
}

// Debug helper: Show all mappings
export function debugTaxonomyMappings() {
  const mapping = getItemToGroupMapping();
  
  console.group('🗺️ Taxonomy Mappings Debug');
  
  console.group('👥 Target Audience Mappings');
  targetAudienceGroups.forEach(group => {
    logger.debug(`Group: ${group.id} (${group.label})`);
    group.audiences.forEach(audience => {
      logger.debug(`  • ${audience.id} → ${mapping[audience.id] || 'MISSING'}`);
    });
  });
  console.groupEnd();
  
  console.group('🚀 Startup Stage Mappings');
  startupStageGroups.forEach(group => {
    logger.debug(`Group: ${group.id} (${group.label})`);
    group.stages.forEach(stage => {
      logger.debug(`  • ${stage.id} → ${mapping[stage.id] || 'MISSING'}`);
    });
  });
  console.groupEnd();
  
  console.groupEnd();
}