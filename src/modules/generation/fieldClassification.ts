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

  // Section-specific classifications
  if (sectionType === 'InlineQnAList') {
    return classifyInlineQnAListField(fieldName);
  }

  if (sectionType === 'BeforeAfterSlider') {
    return classifyBeforeAfterSliderField(fieldName);
  }

  if (sectionType === 'EmojiOutcomeGrid') {
    return classifyEmojiOutcomeGridField(fieldName);
  }

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

/**
 * Specific classification for InlineQnAList fields
 */
function classifyInlineQnAListField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // All content fields are AI-generated for FAQ sections
  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'FAQ header content is ideal for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create engaging headlines that introduce your FAQ section'
    };
  }

  if (field.startsWith('question_') || field.startsWith('answer_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Q&A pairs are perfect for AI generation based on business context',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will generate realistic questions and helpful answers based on your business'
    };
  }

  // Legacy format support
  if (field === 'questions' || field === 'answers') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Legacy format Q&A content for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.85
      },
      user_guidance: 'AI will generate pipe-separated questions and answers (legacy format)'
    };
  }

  // Fallback to general classification
  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown InlineQnAList field, using hybrid approach',
      fallback_strategy: 'generate',
      confidence: 0.7
    },
    user_guidance: 'Please review this field as it may need manual adjustment'
  };
}

/**
 * Specific classification for BeforeAfterSlider fields
 */
function classifyBeforeAfterSliderField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // Headlines and descriptions are AI-generated
  if (field === 'headline' || field === 'subheadline' || field === 'supporting_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Before/After header content is ideal for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create compelling transformation messaging'
    };
  }

  // Before/After labels and descriptions
  if (field.startsWith('before_') || field.startsWith('after_')) {
    if (field.includes('label') || field.includes('description')) {
      return {
        field: fieldName,
        classification: {
          category: 'ai_generated',
          reason: 'Before/After transformation content is perfect for AI generation',
          fallback_strategy: 'generate',
          confidence: 0.9
        },
        user_guidance: 'AI will create contrasting before/after scenarios based on your product'
      };
    }
    if (field.includes('placeholder_text')) {
      return {
        field: fieldName,
        classification: {
          category: 'ai_generated',
          reason: 'Placeholder text for visual representation',
          fallback_strategy: 'generate',
          confidence: 0.85
        },
        user_guidance: 'AI will generate descriptive placeholder text for the visual areas'
      };
    }
    if (field.includes('icon')) {
      return {
        field: fieldName,
        classification: {
          category: 'hybrid',
          reason: 'Icons benefit from AI suggestion with user customization',
          fallback_strategy: 'default',
          confidence: 0.7
        },
        suggested_default: field.includes('before') ? '⚠️' : '✅',
        user_guidance: 'Choose icons that visually represent the transformation'
      };
    }
    if (field.includes('visual')) {
      return {
        field: fieldName,
        classification: {
          category: 'manual_preferred',
          reason: 'Visual assets require actual screenshots or images',
          fallback_strategy: 'default',
          confidence: 0.9
        },
        user_guidance: 'Upload before/after screenshots or mockups for best effect'
      };
    }
  }

  // Interaction hints
  if (field.includes('interaction_hint') || field === 'slider_instruction') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Interaction guidance text for user engagement',
        fallback_strategy: 'generate',
        confidence: 0.85
      },
      user_guidance: 'AI will create helpful interaction hints'
    };
  }

  // Show/hide flags
  if (field === 'show_interaction_hint') {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Display preference based on audience sophistication',
        fallback_strategy: 'default',
        confidence: 0.7
      },
      suggested_default: 'true',
      user_guidance: 'Show hints for less sophisticated audiences'
    };
  }

  // Icon fields
  if (field === 'hint_icon') {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Hint icon for interaction guidance',
        fallback_strategy: 'default',
        confidence: 0.7
      },
      suggested_default: '👆',
      user_guidance: 'Choose an icon that suggests interaction'
    };
  }

  // CTA and trust items
  if (field === 'cta_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Call-to-action text generation',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create action-oriented CTA text'
    };
  }

  if (field === 'trust_items') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Trust indicators for credibility',
        fallback_strategy: 'generate',
        confidence: 0.85
      },
      user_guidance: 'AI will generate pipe-separated trust indicators'
    };
  }

  // Fallback to general classification
  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown BeforeAfterSlider field, using hybrid approach',
      fallback_strategy: 'generate',
      confidence: 0.7
    },
    user_guidance: 'Please review this field as it may need manual adjustment'
  };
}

/**
 * Specific classification for EmojiOutcomeGrid fields
 */
function classifyEmojiOutcomeGridField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // Headline and subheadline are AI-generated
  if (field === 'headline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Outcome headlines are perfect for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create an engaging headline about achieving results'
    };
  }

  if (field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Supporting text that provides context for outcomes',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will add context about the outcomes creators will achieve'
    };
  }

  // Main content fields - pipe-separated values
  if (field === 'emojis') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Emoji selection that visually represents each outcome',
        fallback_strategy: 'generate',
        confidence: 0.85
      },
      user_guidance: 'AI will select relevant emojis for each outcome (pipe-separated)'
    };
  }

  if (field === 'outcomes') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Outcome titles that showcase key results',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will generate impactful outcome titles (pipe-separated)'
    };
  }

  if (field === 'descriptions') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Detailed descriptions explaining each outcome',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create compelling descriptions for each outcome (pipe-separated)'
    };
  }

  if (field === 'footer_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Social proof text to build trust',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will add social proof about others achieving these results'
    };
  }

  // Fallback to general classification
  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown EmojiOutcomeGrid field, using hybrid approach',
      fallback_strategy: 'generate',
      confidence: 0.7
    },
    user_guidance: 'Please review this field as it may need manual adjustment'
  };
}