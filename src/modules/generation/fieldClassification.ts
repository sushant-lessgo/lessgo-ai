/**
 * Field Classification System for AI Content Generation
 *
 * This module provides intelligent classification of UIBlock fields to determine
 * which should be AI-generated, manually curated, or handled with a hybrid approach.
 */

export interface FieldClassification {
  category: 'ai_generated' | 'manual_preferred' | 'hybrid';
  reason: string;
  fallback_strategy: 'generate' | 'default' | 'skip';
  confidence: number; // 0-1 indicating confidence in the classification
}

export interface ClassificationResult {
  field: string;
  classification: FieldClassification;
  suggested_default?: string;
  user_guidance?: string;
}

/**
 * Classifies a field based on its name and characteristics
 */
export function classifyField(fieldName: string, sectionType?: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // AI-Generated Fields (high confidence for content generation)
  if (isAiGeneratedField(field)) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Content field suitable for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.95
      }
    };
  }

  // Manual-Preferred Fields (require human input/validation)
  if (isManualPreferredField(field)) {
    const manualReason = getManualReason(field);
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: manualReason,
        fallback_strategy: 'default',
        confidence: 0.9
      },
      suggested_default: getSuggestedDefault(field),
      user_guidance: getUserGuidance(field)
    };
  }

  // Hybrid Fields (AI generation + user review recommended)
  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Field benefits from AI generation with user review',
      fallback_strategy: 'generate',
      confidence: 0.7
    },
    user_guidance: 'AI will generate content, but please review for accuracy'
  };
}

/**
 * Determines if a field is suitable for AI generation
 */
function isAiGeneratedField(field: string): boolean {
  const aiGeneratedPatterns = [
    'headline', 'subheadline', 'supporting_text', 'intro_text', 'conclusion_text',
    'description', 'benefit', 'feature', 'value_proposition', 'story',
    'testimonial_quote', 'quote', 'content', 'text',
    'pain_point', 'problem_statement', 'solution', 'outcome',
    'cta_text', 'call_to_action', 'button_text'
  ];

  return aiGeneratedPatterns.some(pattern => field.includes(pattern));
}

/**
 * Determines if a field requires manual input
 */
function isManualPreferredField(field: string): boolean {
  const manualPatterns = [
    'avatar_url', 'image_url', 'photo', 'video_url',
    'customer_location', 'location', 'address', 'phone', 'email',
    'audit_date', 'event_date', 'timeline_date', 'review_date',
    'rating', 'score', 'verified_badge', 'compliance',
    'patent_number', 'license', 'certification',
    'pricing', 'price', 'cost', 'tier_price',
    'integration_name', 'partner_name', 'auditor_name',
    'founder_name', 'customer_name', 'company_name',
    'scoring_label', 'action_threshold', 'assessment',
    'persona_icon', 'emoji_label', 'icon_label'
  ];

  return manualPatterns.some(pattern => field.includes(pattern));
}

/**
 * Gets the reason why a field is manual-preferred
 */
function getManualReason(field: string): string {
  if (field.includes('avatar') || field.includes('image') || field.includes('photo')) {
    return 'Requires actual image uploads or customer photos';
  }
  if (field.includes('location') || field.includes('address') || field.includes('phone') || field.includes('email')) {
    return 'Requires real contact/geographic information';
  }
  if (field.includes('date') || field.includes('timeline')) {
    return 'Requires accurate temporal information';
  }
  if (field.includes('rating') || field.includes('score') || field.includes('verified')) {
    return 'Reflects actual performance metrics or verification status';
  }
  if (field.includes('pricing') || field.includes('price') || field.includes('cost')) {
    return 'Requires accurate business pricing information';
  }
  if (field.includes('name') && (field.includes('customer') || field.includes('founder') || field.includes('company'))) {
    return 'Requires real names or company information';
  }
  if (field.includes('scoring') || field.includes('threshold') || field.includes('assessment')) {
    return 'Requires business-specific qualification criteria';
  }
  if (field.includes('icon') || field.includes('emoji')) {
    return 'Requires brand-appropriate visual elements';
  }

  return 'Requires manual configuration or real data';
}

/**
 * Provides suggested defaults for manual fields
 */
function getSuggestedDefault(field: string): string | undefined {
  if (field.includes('verified_badge')) {
    return '["true", "false", "true"]';
  }
  if (field.includes('rating')) {
    return '["5", "4", "5", "4"]';
  }
  if (field.includes('location')) {
    return '["New York, US", "London, UK", "San Francisco, US"]';
  }
  if (field.includes('date')) {
    return '["Recently", "This month", "Last week"]';
  }
  if (field.includes('persona_icon')) {
    return '"👤"'; // Generic person icon
  }
  if (field.includes('scoring_label')) {
    return '["0-2: Low", "3-5: Medium", "6-8: High", "9-10: Critical"]';
  }
  if (field.includes('action_threshold')) {
    return '["Monitor", "Review", "Act", "Urgent"]';
  }

  return undefined;
}

/**
 * Provides user guidance for manual fields
 */
function getUserGuidance(field: string): string {
  if (field.includes('avatar') || field.includes('image')) {
    return 'Upload customer photos or use avatar generation tools for professional appearance';
  }
  if (field.includes('location')) {
    return 'Use real customer locations for authenticity, or representative major cities';
  }
  if (field.includes('rating') || field.includes('score')) {
    return 'Use actual ratings from your review platforms for credibility';
  }
  if (field.includes('pricing')) {
    return 'Enter your actual pricing tiers and values';
  }
  if (field.includes('date')) {
    return 'Use recent dates for testimonials and reviews to maintain freshness';
  }
  if (field.includes('scoring') || field.includes('threshold')) {
    return 'Define criteria based on your business qualification process';
  }
  if (field.includes('icon') || field.includes('emoji')) {
    return 'Choose icons that align with your brand personality and visual style';
  }

  return 'Please review and customize this field based on your specific business needs';
}

/**
 * Classifies all fields for a given UIBlock section
 */
export function classifyFieldsForSection(fields: string[], sectionType: string): ClassificationResult[] {
  return fields.map(field => classifyField(field, sectionType));
}

/**
 * Gets generation strategy recommendations based on field classifications
 */
export function getGenerationStrategy(classifications: ClassificationResult[]): {
  aiGenerated: string[];
  manualPreferred: string[];
  hybrid: string[];
  totalFields: number;
  manualFieldsCount: number;
  aiFieldsCount: number;
} {
  const aiGenerated = classifications
    .filter(c => c.classification.category === 'ai_generated')
    .map(c => c.field);

  const manualPreferred = classifications
    .filter(c => c.classification.category === 'manual_preferred')
    .map(c => c.field);

  const hybrid = classifications
    .filter(c => c.classification.category === 'hybrid')
    .map(c => c.field);

  return {
    aiGenerated,
    manualPreferred,
    hybrid,
    totalFields: classifications.length,
    manualFieldsCount: manualPreferred.length,
    aiFieldsCount: aiGenerated.length + hybrid.length
  };
}

/**
 * Generates user-facing recommendations for field management
 */
export function generateFieldRecommendations(classifications: ClassificationResult[]): {
  message: string;
  priority: 'low' | 'medium' | 'high';
  actions: string[];
} {
  const strategy = getGenerationStrategy(classifications);

  if (strategy.manualFieldsCount === 0) {
    return {
      message: 'All fields can be AI-generated. Your section is ready to go!',
      priority: 'low',
      actions: ['Review generated content for brand alignment']
    };
  }

  if (strategy.manualFieldsCount > strategy.aiFieldsCount) {
    return {
      message: `This section requires significant manual input (${strategy.manualFieldsCount} out of ${strategy.totalFields} fields)`,
      priority: 'high',
      actions: [
        'Prepare real data for manual fields before generation',
        'Consider using demo data for testing purposes',
        'Plan time for post-generation customization'
      ]
    };
  }

  return {
    message: `Section will be mostly AI-generated with ${strategy.manualFieldsCount} fields requiring manual input`,
    priority: 'medium',
    actions: [
      'Review manual fields after AI generation',
      'Customize based on your specific business data',
      'Test with real customer data when ready'
    ]
  };
}