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

  // Hero Section Classifications
  if (['leftCopyRightImage', 'centerStacked', 'splitScreen', 'imageFirst'].includes(sectionType || '')) {
    return classifyHeroField(fieldName);
  }

  // Section-specific classifications
  if (sectionType === 'InlineQnAList') {
    return classifyInlineQnAListField(fieldName);
  }

  // FAQ Section Classifications
  if (sectionType === 'AccordionFAQ') {
    return classifyAccordionFAQField(fieldName);
  }

  if (sectionType === 'TwoColumnFAQ') {
    return classifyTwoColumnFAQField(fieldName);
  }

  if (sectionType === 'SegmentedFAQTabs') {
    return classifySegmentedFAQTabsField(fieldName);
  }

  if (sectionType === 'QuoteStyleAnswers') {
    return classifyQuoteStyleAnswersField(fieldName);
  }

  if (sectionType === 'IconWithAnswers') {
    return classifyIconWithAnswersField(fieldName);
  }

  if (sectionType === 'TestimonialFAQs') {
    return classifyTestimonialFAQsField(fieldName);
  }

  if (sectionType === 'ChatBubbleFAQ') {
    return classifyChatBubbleFAQField(fieldName);
  }

  if (sectionType === 'BeforeAfterSlider') {
    return classifyBeforeAfterSliderField(fieldName);
  }

  if (sectionType === 'SideBySideBlocks') {
    return classifySideBySideBlocksField(fieldName);
  }

  if (sectionType === 'TextListTransformation') {
    return classifyTextListTransformationField(fieldName);
  }

  if (sectionType === 'StatComparison' || sectionType === 'StackedTextVisual' ||
      sectionType === 'VisualStoryline' || sectionType === 'PersonaJourney' ||
      sectionType === 'SplitCard') {
    return classifyBeforeAfterGenericField(fieldName, sectionType);
  }

  // UniqueMechanism Section Classifications
  if (sectionType === 'AlgorithmExplainer') {
    return classifyAlgorithmExplainerField(fieldName);
  }

  if (sectionType === 'InnovationTimeline') {
    return classifyInnovationTimelineField(fieldName);
  }

  if (sectionType === 'MethodologyBreakdown') {
    return classifyMethodologyBreakdownField(fieldName);
  }

  if (sectionType === 'ProcessFlowDiagram') {
    return classifyProcessFlowDiagramField(fieldName);
  }

  if (sectionType === 'PropertyComparisonMatrix') {
    return classifyPropertyComparisonMatrixField(fieldName);
  }

  if (sectionType === 'SecretSauceReveal') {
    return classifySecretSauceRevealField(fieldName);
  }

  if (sectionType === 'StackedHighlights') {
    return classifyStackedHighlightsField(fieldName);
  }

  if (sectionType === 'SystemArchitecture') {
    return classifySystemArchitectureField(fieldName);
  }

  if (sectionType === 'TechnicalAdvantage') {
    return classifyTechnicalAdvantageField(fieldName);
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
 * Specific classification for AccordionFAQ fields
 */
function classifyAccordionFAQField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Accordion FAQ header content is ideal for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create engaging headlines for your collapsible FAQ section'
    };
  }

  if (field.startsWith('question_') || field.startsWith('answer_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Accordion Q&A pairs perfect for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will generate expandable Q&A content based on your business'
    };
  }

  if (field.includes('icon') && (field.includes('expand') || field.includes('collapse'))) {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Interaction icons should match brand visual style',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      suggested_default: '➕',
      user_guidance: 'Choose icons that match your brand style (e.g., +/-, arrows, or custom icons)'
    };
  }

  // Legacy fields
  if (field === 'questions' || field === 'answers') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Legacy format for accordion FAQ content',
        fallback_strategy: 'generate',
        confidence: 0.85
      }
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown AccordionFAQ field',
      fallback_strategy: 'generate',
      confidence: 0.7
    }
  };
}

/**
 * Specific classification for TwoColumnFAQ fields
 */
function classifyTwoColumnFAQField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Two-column FAQ header content ideal for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create headers that introduce your split FAQ layout'
    };
  }

  if (field.startsWith('left_') || field.startsWith('right_')) {
    if (field.includes('question') || field.includes('answer')) {
      return {
        field: fieldName,
        classification: {
          category: 'ai_generated',
          reason: 'Column-specific Q&A content ideal for AI generation',
          fallback_strategy: 'generate',
          confidence: 0.9
        },
        user_guidance: 'AI will generate balanced Q&A content for both columns'
      };
    }

    if (field.includes('title')) {
      return {
        field: fieldName,
        classification: {
          category: 'hybrid',
          reason: 'Column titles benefit from business-specific customization',
          fallback_strategy: 'generate',
          confidence: 0.8
        },
        user_guidance: 'AI will suggest column titles, but consider customizing for your specific categories'
      };
    }
  }

  // Legacy fields
  if (field === 'questions' || field === 'answers' || field.includes('column_titles')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Legacy format for two-column FAQ',
        fallback_strategy: 'generate',
        confidence: 0.85
      }
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown TwoColumnFAQ field',
      fallback_strategy: 'generate',
      confidence: 0.7
    }
  };
}

/**
 * Specific classification for SegmentedFAQTabs fields
 */
function classifySegmentedFAQTabsField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Tabbed FAQ header content ideal for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create headers that introduce your categorized FAQ tabs'
    };
  }

  if (field.includes('tab_') && field.includes('label')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Tab labels should reflect business-specific categories',
        fallback_strategy: 'generate',
        confidence: 0.8
      },
      user_guidance: 'AI will suggest tab categories, but customize to match your business areas'
    };
  }

  if (field.includes('tab_') && field.includes('description')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Tab descriptions can be generated from business context',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create helpful descriptions for each FAQ category'
    };
  }

  if (field.includes('tab_') && (field.includes('question') || field.includes('answer'))) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Tab-specific Q&A content ideal for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will generate relevant Q&A content for each tab category'
    };
  }

  // Legacy fields
  if (field === 'tab_labels' || field === 'tab_descriptions' || field === 'questions' || field === 'answers') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Legacy format for segmented FAQ tabs',
        fallback_strategy: 'generate',
        confidence: 0.85
      }
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown SegmentedFAQTabs field',
      fallback_strategy: 'generate',
      confidence: 0.7
    }
  };
}

/**
 * Specific classification for QuoteStyleAnswers fields
 */
function classifyQuoteStyleAnswersField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Quote-style FAQ header content ideal for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create headers that introduce your testimonial-style FAQ'
    };
  }

  if (field.startsWith('question_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'FAQ questions can be generated from business context',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will generate relevant questions that customers commonly ask'
    };
  }

  if (field.includes('quote_answer') || field.includes('attribution')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Quote answers should sound authentic to real customers',
        fallback_strategy: 'generate',
        confidence: 0.75
      },
      user_guidance: 'AI will generate quote-style answers, but consider using real customer testimonials'
    };
  }

  if (field.includes('style')) {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Visual styling should match brand guidelines',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      suggested_default: 'professional',
      user_guidance: 'Choose styling that matches your brand voice and visual identity'
    };
  }

  // Legacy fields
  if (field === 'questions' || field === 'quote_answers' || field === 'quote_attributions') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Legacy format for quote-style FAQ',
        fallback_strategy: 'generate',
        confidence: 0.85
      }
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown QuoteStyleAnswers field',
      fallback_strategy: 'generate',
      confidence: 0.7
    }
  };
}

/**
 * Specific classification for Hero section fields
 */
function classifyHeroField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // Core content fields - AI generated
  if (field === 'headline' || field === 'subheadline' || field === 'supporting_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Core hero messaging should be generated based on product value proposition',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create compelling hero copy based on your product'
    };
  }

  if (field === 'cta_text' || field === 'secondary_cta_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'CTA text should align with landing page goals and user journey stage',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create action-oriented CTA text'
    };
  }

  if (field === 'badge_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Badge text provides social proof or credibility signals',
        fallback_strategy: 'skip',
        confidence: 0.85
      },
      user_guidance: 'AI will generate credibility badges when appropriate'
    };
  }

  if (field === 'value_proposition') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Value prop should clearly communicate unique benefits',
        fallback_strategy: 'generate',
        confidence: 0.95
      }
    };
  }

  // Trust indicators - AI generated
  if (field === 'trust_items' || field.startsWith('trust_item_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Trust indicators build confidence and reduce friction',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will generate trust-building elements'
    };
  }

  // Social proof fields - hybrid approach
  if (field === 'customer_count' || field === 'rating_value' || field === 'rating_count') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Social proof metrics should be real or clearly marked as examples',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      suggested_default: field === 'customer_count' ? '500+ happy customers' :
                        field === 'rating_value' ? '4.9/5' : 'from 127 reviews',
      user_guidance: 'Provide real metrics or use placeholder values'
    };
  }

  // Customer avatars - manual preferred
  if (field === 'customer_names' || field === 'avatar_urls') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Customer information should be authentic or clearly marked as examples',
        fallback_strategy: 'default',
        confidence: 0.85
      },
      suggested_default: field === 'customer_names' ? 'Sarah Chen|Alex Rivera|Jordan Kim|Maya Patel' : '{}',
      user_guidance: 'Use real customer names or example personas'
    };
  }

  // Images - manual required
  if (field.includes('hero_image')) {
    const defaultImage = field === 'image_first_hero_image' ? '/hero-placeholder.jpg' :
                        field === 'split_hero_image' ? '/hero-placeholder.jpg' :
                        field === 'center_hero_image' ? '/hero-placeholder.jpg' :
                        '/hero-placeholder.jpg';

    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Hero images require brand-specific visuals',
        fallback_strategy: 'default',
        confidence: 0.95
      },
      suggested_default: defaultImage,
      user_guidance: 'Upload hero image that represents your product'
    };
  }

  // Boolean flags - manual preferred
  if (field.startsWith('show_')) {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Display preferences should match design intent',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      suggested_default: 'true'
    };
  }

  // Avatar count - manual preferred
  if (field === 'avatar_count') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Number of avatars affects visual balance',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      suggested_default: '4'
    };
  }

  // Default fallback
  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown Hero field',
      fallback_strategy: 'skip',
      confidence: 0.6
    }
  };
}

/**
 * Specific classification for IconWithAnswers fields
 */
function classifyIconWithAnswersField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Icon FAQ header content ideal for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create headers that introduce your visual FAQ section'
    };
  }

  if (field.startsWith('question_') || field.startsWith('answer_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Q&A content can be generated from business context',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will generate Q&A content that pairs well with visual icons'
    };
  }

  if (field.includes('icon_') && !field.includes('position') && !field.includes('size')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Icons should be meaningful and match content theme',
        fallback_strategy: 'generate',
        confidence: 0.7
      },
      user_guidance: 'AI will suggest relevant icons, but consider using brand-specific icons'
    };
  }

  if (field.includes('position') || field.includes('size')) {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Layout configuration should match design preferences',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      suggested_default: 'left',
      user_guidance: 'Choose icon placement and size based on your design system'
    };
  }

  // Legacy fields
  if (field === 'questions' || field === 'answers' || field === 'icon_labels') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Legacy format for icon FAQ',
        fallback_strategy: 'generate',
        confidence: 0.85
      }
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown IconWithAnswers field',
      fallback_strategy: 'generate',
      confidence: 0.7
    }
  };
}

/**
 * Specific classification for TestimonialFAQs fields
 */
function classifyTestimonialFAQsField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Testimonial FAQ header content ideal for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create headers that introduce your customer-answered FAQ'
    };
  }

  if (field.startsWith('question_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'FAQ questions can be generated from business context',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will generate questions that customers commonly ask'
    };
  }

  if (field.includes('testimonial_answer')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Testimonial answers should sound authentic to real customers',
        fallback_strategy: 'generate',
        confidence: 0.7
      },
      user_guidance: 'AI will generate customer-style answers, but real testimonials are preferred'
    };
  }

  if (field.includes('customer_name') || field.includes('customer_title') || field.includes('customer_company')) {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Customer information should be authentic and verifiable',
        fallback_strategy: 'default',
        confidence: 0.9
      },
      suggested_default: 'Anonymous Customer',
      user_guidance: 'Use real customer information with permission, or anonymize appropriately'
    };
  }

  if (field.includes('style')) {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Visual styling should match brand guidelines',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      suggested_default: 'professional',
      user_guidance: 'Choose styling that matches your brand and builds credibility'
    };
  }

  // Legacy fields
  if (field === 'questions' || field === 'testimonial_answers' || field === 'customer_names' || field === 'customer_titles') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Legacy format for testimonial FAQ',
        fallback_strategy: 'generate',
        confidence: 0.85
      }
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown TestimonialFAQs field',
      fallback_strategy: 'generate',
      confidence: 0.7
    }
  };
}

/**
 * Specific classification for ChatBubbleFAQ fields
 */
function classifyChatBubbleFAQField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Chat FAQ header content ideal for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create headers that introduce your conversational FAQ'
    };
  }

  if (field.startsWith('question_') || field.startsWith('answer_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Conversational Q&A content ideal for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will generate natural conversation-style Q&A content'
    };
  }

  if (field.includes('persona') && (field.includes('name') || field.includes('customer') || field.includes('support'))) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Persona names should match brand voice and target audience',
        fallback_strategy: 'generate',
        confidence: 0.8
      },
      user_guidance: 'AI will suggest persona names, but customize to match your brand personality'
    };
  }

  if (field.includes('style') || field.includes('alignment')) {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Chat styling should match interface design',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      suggested_default: 'modern',
      user_guidance: 'Choose chat style that matches your user interface design'
    };
  }

  // Legacy fields
  if (field === 'questions' || field === 'answers' || field === 'chat_personas') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Legacy format for chat bubble FAQ',
        fallback_strategy: 'generate',
        confidence: 0.85
      }
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown ChatBubbleFAQ field',
      fallback_strategy: 'generate',
      confidence: 0.7
    }
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
 * Specific classification for SideBySideBlocks fields
 */
function classifySideBySideBlocksField(fieldName: string): ClassificationResult {
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
      user_guidance: 'AI will create compelling comparison messaging'
    };
  }

  // Before/After labels and descriptions
  if (field.includes('before_') || field.includes('after_')) {
    if (field.includes('label') || field.includes('description')) {
      return {
        field: fieldName,
        classification: {
          category: 'ai_generated',
          reason: 'Before/After comparison content is perfect for AI generation',
          fallback_strategy: 'generate',
          confidence: 0.9
        },
        user_guidance: 'AI will create contrasting before/after scenarios'
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
        user_guidance: 'Choose icons that represent the transformation'
      };
    }
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
      reason: 'Unknown SideBySideBlocks field, using hybrid approach',
      fallback_strategy: 'generate',
      confidence: 0.7
    },
    user_guidance: 'Please review this field as it may need manual adjustment'
  };
}

/**
 * Specific classification for TextListTransformation fields
 */
function classifyTextListTransformationField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // Headlines and descriptions are AI-generated
  if (field === 'headline' || field === 'subheadline' || field === 'supporting_text' || field === 'transformation_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Transformation messaging content is ideal for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create compelling transformation messaging'
    };
  }

  // Before/After labels and lists
  if (field.includes('before_') || field.includes('after_')) {
    if (field.includes('label')) {
      return {
        field: fieldName,
        classification: {
          category: 'ai_generated',
          reason: 'Before/After labels are perfect for AI generation',
          fallback_strategy: 'generate',
          confidence: 0.9
        },
        user_guidance: 'AI will create contrasting before/after labels'
      };
    }
    if (field.includes('list')) {
      return {
        field: fieldName,
        classification: {
          category: 'ai_generated',
          reason: 'List content benefits from AI generation with business context',
          fallback_strategy: 'generate',
          confidence: 0.9
        },
        user_guidance: 'AI will generate pipe-separated list items for transformation comparison'
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
        suggested_default: field.includes('before') ? '❌' : '✅',
        user_guidance: 'Choose icons that represent the transformation state'
      };
    }
  }

  // Transformation icon
  if (field === 'transformation_icon') {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Transformation arrow icon for visual flow',
        fallback_strategy: 'default',
        confidence: 0.7
      },
      suggested_default: '➡️',
      user_guidance: 'Choose an icon that represents transformation or progression'
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
      reason: 'Unknown TextListTransformation field, using hybrid approach',
      fallback_strategy: 'generate',
      confidence: 0.7
    },
    user_guidance: 'Please review this field as it may need manual adjustment'
  };
}

/**
 * Generic classification for BeforeAfter components
 */
function classifyBeforeAfterGenericField(fieldName: string, sectionType: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // Headlines and text content are AI-generated
  if (field === 'headline' || field === 'subheadline' || field === 'supporting_text' ||
      field.includes('text') || field.includes('title') || field.includes('description') ||
      field.includes('scenario') || field.includes('quote')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: `${sectionType} content is ideal for AI generation`,
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create compelling content based on your business context'
    };
  }

  // Stats and data fields (pipe-separated)
  if (field.includes('stats') || field.includes('steps') || field.includes('journey')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Data and step content for structured presentation',
        fallback_strategy: 'generate',
        confidence: 0.85
      },
      user_guidance: 'AI will generate pipe-separated content for structured display'
    };
  }

  // Icon fields
  if (field.includes('icon')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Icons benefit from AI suggestion with user customization',
        fallback_strategy: 'default',
        confidence: 0.7
      },
      suggested_default: '📊',
      user_guidance: 'Choose icons that represent your content theme'
    };
  }

  // Boolean flags
  if (field.includes('show_')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Display preference based on content complexity',
        fallback_strategy: 'default',
        confidence: 0.7
      },
      suggested_default: 'true',
      user_guidance: 'Control visibility based on your audience needs'
    };
  }

  // Name fields
  if (field.includes('name')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Names can be generated based on target audience',
        fallback_strategy: 'generate',
        confidence: 0.8
      },
      user_guidance: 'AI will create appropriate names for your personas'
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
      reason: `Unknown ${sectionType} field, using hybrid approach`,
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

/**
 * Classification functions for UniqueMechanism UIBlocks
 */

function classifyAlgorithmExplainerField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Section headline describing algorithm/process',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create a compelling headline about your algorithm'
    };
  }

  if (field === 'algorithm_name') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Company/product-specific algorithm name',
        fallback_strategy: 'default',
        confidence: 0.9
      },
      suggested_default: 'SmartOptimize AI™',
      user_guidance: 'Your branded algorithm/technology name'
    };
  }

  if (field.startsWith('algorithm_step_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Individual algorithm steps based on business logic',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will break down your process into clear steps'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Algorithm content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.85
    }
  };
}

function classifyInnovationTimelineField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Section headline for innovation timeline',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create a headline highlighting your innovation journey'
    };
  }

  if (field.startsWith('timeline_item_')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Timeline milestones need business-specific dates and achievements',
        fallback_strategy: 'generate',
        confidence: 0.75
      },
      user_guidance: 'AI will suggest timeline milestones, but dates should be reviewed'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Timeline content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.85
    }
  };
}

function classifyMethodologyBreakdownField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Section headline for methodology breakdown',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create a compelling methodology headline'
    };
  }

  if (field === 'methodology_name') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Company-specific methodology name',
        fallback_strategy: 'default',
        confidence: 0.9
      },
      suggested_default: 'Adaptive Intelligence Framework™',
      user_guidance: 'Your branded methodology or framework name'
    };
  }

  if (field === 'methodology_description') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'High-level methodology description',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will describe your methodology benefits'
    };
  }

  if (field.startsWith('principle_') || field.startsWith('detail_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Methodology principles and details',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will generate methodology principles based on your business'
    };
  }

  if (field.startsWith('result_metric_') || field.startsWith('result_label_')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Result metrics may need specific business data',
        fallback_strategy: 'generate',
        confidence: 0.75
      },
      user_guidance: 'AI will suggest metrics, but verify with actual business results'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Methodology content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.85
    }
  };
}

function classifyProcessFlowDiagramField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Section headlines for process flow',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create compelling process flow headlines'
    };
  }

  if (field === 'process_steps' || field === 'step_descriptions') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Process steps based on business workflow',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will map out your process workflow steps'
    };
  }

  if (field.includes('benefit')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Process benefits and advantages',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will highlight key process benefits'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Process content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.85
    }
  };
}

function classifyPropertyComparisonMatrixField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Comparison section headline',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create a competitive comparison headline'
    };
  }

  if (field === 'properties' || field === 'us_values' || field === 'competitors_values') {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Comparison data needs specific competitive analysis',
        fallback_strategy: 'generate',
        confidence: 0.75
      },
      user_guidance: 'AI will suggest comparison points, but verify competitive accuracy'
    };
  }

  if (field.includes('header')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Table headers for comparison matrix',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create clear comparison table headers'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Comparison content may need competitive research',
      fallback_strategy: 'generate',
      confidence: 0.75
    }
  };
}

function classifySecretSauceRevealField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Compelling headline for secret sauce reveal',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create an intriguing secret sauce headline'
    };
  }

  if (field === 'secret_sauce') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Company-specific unique differentiator',
        fallback_strategy: 'generate',
        confidence: 0.8
      },
      suggested_default: 'Quantum-Enhanced Machine Learning',
      user_guidance: 'Your actual unique technology or approach'
    };
  }

  if (field === 'explanation') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Explanation of secret sauce benefits',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will explain why your approach is unique'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Secret sauce content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.85
    }
  };
}

function classifyStackedHighlightsField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Section headline for stacked highlights',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create a powerful highlights headline'
    };
  }

  if (field === 'highlight_titles' || field === 'highlight_descriptions') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Highlight content based on business features',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create compelling highlight titles and descriptions'
    };
  }

  if (field === 'mechanism_name') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Branded mechanism or system name',
        fallback_strategy: 'default',
        confidence: 0.9
      },
      user_guidance: 'Your branded system or mechanism name'
    };
  }

  if (field === 'footer_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Supporting text for unique value proposition',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will add reinforcing value proposition text'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Highlight content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.85
    }
  };
}

function classifySystemArchitectureField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'System architecture section headline',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create a technical architecture headline'
    };
  }

  if (field.startsWith('component_')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'System components may be business-specific',
        fallback_strategy: 'generate',
        confidence: 0.8
      },
      user_guidance: 'AI will suggest system components, but verify technical accuracy'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Architecture content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.85
    }
  };
}

function classifyTechnicalAdvantageField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Technical advantages section headline',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create a compelling technical advantages headline'
    };
  }

  if (field === 'advantages' || field === 'advantage_descriptions') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Technical advantages based on business capabilities',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will highlight your technical competitive advantages'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Technical advantage content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.85
    }
  };
}