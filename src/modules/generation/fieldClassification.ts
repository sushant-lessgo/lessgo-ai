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

  // Objection Section Classifications
  if (sectionType === 'ObjectionAccordion') {
    return classifyObjectionAccordionField(fieldName);
  }

  if (sectionType === 'MythVsRealityGrid') {
    return classifyMythVsRealityGridField(fieldName);
  }

  if (sectionType === 'QuoteBackedAnswers') {
    return classifyQuoteBackedAnswersField(fieldName);
  }

  if (sectionType === 'SkepticToBelieverSteps') {
    return classifySkepticToBelieverStepsField(fieldName);
  }

  if (sectionType === 'VisualObjectionTiles') {
    return classifyVisualObjectionTilesField(fieldName);
  }

  if (sectionType === 'ProblemToReframeBlocks') {
    return classifyProblemToReframeBlocksField(fieldName);
  }

  if (sectionType === 'BoldGuaranteePanel') {
    return classifyBoldGuaranteePanelField(fieldName);
  }

  if (sectionType === 'ObjectionCarousel') {
    return classifyObjectionCarouselField(fieldName);
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

  // Problem Section Classifications
  if (sectionType === 'StackedPainBullets') {
    return classifyStackedPainBulletsField(fieldName);
  }

  if (sectionType === 'BeforeImageAfterText') {
    return classifyBeforeImageAfterTextField(fieldName);
  }

  if (sectionType === 'SideBySideSplit') {
    return classifySideBySideSplitField(fieldName);
  }

  if (sectionType === 'EmotionalQuotes') {
    return classifyEmotionalQuotesField(fieldName);
  }

  if (sectionType === 'CollapsedCards') {
    return classifyCollapsedCardsField(fieldName);
  }

  if (sectionType === 'PainMeterChart') {
    return classifyPainMeterChartField(fieldName);
  }

  if (sectionType === 'PersonaPanels') {
    return classifyPersonaPanelsField(fieldName);
  }

  if (sectionType === 'ProblemChecklist') {
    return classifyProblemChecklistField(fieldName);
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

  // PrimaryCTA Section Classifications
  if (sectionType === 'CenteredHeadlineCTA') {
    return classifyCenteredHeadlineCTAField(fieldName);
  }

  if (sectionType === 'CTAWithBadgeRow') {
    return classifyCTAWithBadgeRowField(fieldName);
  }

  if (sectionType === 'VisualCTAWithMockup') {
    return classifyVisualCTAWithMockupField(fieldName);
  }

  if (sectionType === 'SideBySideCTA') {
    return classifySideBySideCTAField(fieldName);
  }

  if (sectionType === 'CountdownLimitedCTA') {
    return classifyCountdownLimitedCTAField(fieldName);
  }

  if (sectionType === 'CTAWithFormField') {
    return classifyCTAWithFormFieldField(fieldName);
  }

  if (sectionType === 'ValueStackCTA') {
    return classifyValueStackCTAField(fieldName);
  }

  if (sectionType === 'TestimonialCTACombo') {
    return classifyTestimonialCTAComboField(fieldName);
  }

  // HowItWorks Section Classifications
  if (sectionType === 'ThreeStepHorizontal') {
    return classifyThreeStepHorizontalField(fieldName);
  }

  if (sectionType === 'VerticalTimeline') {
    return classifyVerticalTimelineField(fieldName);
  }

  if (sectionType === 'IconCircleSteps') {
    return classifyIconCircleStepsField(fieldName);
  }

  if (sectionType === 'AccordionSteps') {
    return classifyAccordionStepsField(fieldName);
  }

  if (sectionType === 'CardFlipSteps') {
    return classifyCardFlipStepsField(fieldName);
  }

  if (sectionType === 'VideoWalkthrough') {
    return classifyVideoWalkthroughField(fieldName);
  }

  if (sectionType === 'ZigzagImageSteps') {
    return classifyZigzagImageStepsField(fieldName);
  }

  if (sectionType === 'AnimatedProcessLine') {
    return classifyAnimatedProcessLineField(fieldName);
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

/**
 * Specific classification for CenteredHeadlineCTA fields
 */
function classifyCenteredHeadlineCTAField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // Headlines and subheadlines - AI generated
  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'CTA headlines should be compelling and action-oriented',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create conversion-optimized headlines'
    };
  }

  // CTA text - AI generated but conversion-critical
  if (field === 'cta_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'CTA text should align with landing page goals and conversion psychology',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create action-oriented CTA text'
    };
  }

  // Urgency text - AI generated for persuasion
  if (field === 'urgency_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Urgency messaging requires persuasive copywriting',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create compelling urgency messaging'
    };
  }

  // Trust items - hybrid approach
  if (field.includes('trust_item') || field === 'trust_items') {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Trust indicators should be accurate and credible',
        fallback_strategy: 'generate',
        confidence: 0.8
      },
      user_guidance: 'AI will suggest trust indicators; verify accuracy'
    };
  }

  // Social proof metrics - manual preferred
  if (field === 'customer_count' || field === 'rating_stat' || field === 'uptime_stat' || field === 'customer_label' || field === 'uptime_label') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Metrics and statistics must be accurate and verifiable',
        fallback_strategy: 'default',
        confidence: 0.95
      },
      user_guidance: 'Provide accurate company metrics and statistics'
    };
  }

  // Default for other fields
  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Standard CTA content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.8
    }
  };
}

/**
 * Specific classification for CTAWithBadgeRow fields
 */
function classifyCTAWithBadgeRowField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // Headlines and subheadlines - AI generated
  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'CTA headlines should be compelling and badge-focused',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create conversion-optimized headlines'
    };
  }

  // CTA text - AI generated
  if (field === 'cta_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'CTA text should align with trust badge messaging',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create action-oriented CTA text'
    };
  }

  // Trust badges and items - hybrid approach
  if (field.includes('trust_') || field === 'trust_badges') {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Trust badges should be accurate and credible',
        fallback_strategy: 'generate',
        confidence: 0.8
      },
      user_guidance: 'AI will suggest trust badges; verify accuracy and compliance'
    };
  }

  // Social proof and ratings - manual preferred
  if (field === 'customer_count' || field === 'rating_value' || field === 'rating_count' || field.includes('avatar')) {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Social proof metrics must be accurate and verifiable',
        fallback_strategy: 'default',
        confidence: 0.95
      },
      user_guidance: 'Provide accurate customer metrics and avatar data'
    };
  }

  // Boolean flags - manual preferred
  if (field.includes('show_')) {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Display preferences should be set based on available data',
        fallback_strategy: 'default',
        confidence: 0.9
      },
      user_guidance: 'Configure based on your available social proof data'
    };
  }

  // Default for other fields
  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Standard badge CTA content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.8
    }
  };
}

/**
 * Specific classification for VisualCTAWithMockup fields
 */
function classifyVisualCTAWithMockupField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // Headlines and subheadlines - AI generated
  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Visual CTA headlines should complement mockup messaging',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create visually-oriented headlines'
    };
  }

  // CTA text - AI generated
  if (field === 'cta_text' || field === 'secondary_cta') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'CTA text should drive engagement with visual elements',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create action-oriented CTA text'
    };
  }

  // Mockup image - manual preferred
  if (field === 'mockup_image') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Product mockups should be actual product screenshots or demos',
        fallback_strategy: 'skip',
        confidence: 0.95
      },
      user_guidance: 'Upload actual product screenshots or demo images'
    };
  }

  // Trust items - hybrid approach
  if (field.includes('trust_item')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Trust indicators should support visual credibility',
        fallback_strategy: 'generate',
        confidence: 0.8
      },
      user_guidance: 'AI will suggest trust indicators; verify accuracy'
    };
  }

  // Default for other fields
  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Standard visual CTA content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.8
    }
  };
}

/**
 * Specific classification for SideBySideCTA fields
 */
function classifySideBySideCTAField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // Headlines and text content - AI generated
  if (field === 'headline' || field === 'subheadline' || field === 'supporting_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Side-by-side content should create compelling value proposition',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create balanced side-by-side messaging'
    };
  }

  // CTA text - AI generated
  if (field === 'cta_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'CTA text should align with value proposition',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create action-oriented CTA text'
    };
  }

  // Value proposition - AI generated
  if (field === 'value_proposition') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Value propositions require persuasive copywriting',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will craft compelling value propositions'
    };
  }

  // Benefit list - AI generated
  if (field === 'benefit_list') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Benefit lists showcase product advantages effectively',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create comprehensive benefit lists'
    };
  }

  // Trust items - hybrid approach
  if (field.includes('trust_item') || field === 'trust_items') {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Trust indicators should be accurate and credible',
        fallback_strategy: 'generate',
        confidence: 0.8
      },
      user_guidance: 'AI will suggest trust indicators; verify accuracy'
    };
  }

  // Default for other fields
  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Standard side-by-side CTA content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.8
    }
  };
}

/**
 * Specific classification for CountdownLimitedCTA fields
 */
function classifyCountdownLimitedCTAField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // Headlines and subheadlines - AI generated
  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Countdown CTA headlines should create urgency and scarcity',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create urgency-focused headlines'
    };
  }

  // CTA text - AI generated
  if (field === 'cta_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'CTA text should reinforce urgency messaging',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create urgent action-oriented CTA text'
    };
  }

  // Urgency and scarcity text - AI generated
  if (field === 'urgency_text' || field === 'scarcity_text' || field === 'availability_text' || field === 'bonus_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Urgency messaging requires persuasive copywriting',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create compelling urgency and scarcity messaging'
    };
  }

  // Countdown mechanics - manual preferred
  if (field === 'countdown_label' || field === 'countdown_end_date' || field === 'countdown_end_time' || field === 'limited_quantity') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Countdown mechanics must be accurate and realistic',
        fallback_strategy: 'default',
        confidence: 0.95
      },
      user_guidance: 'Set accurate countdown dates and quantities'
    };
  }

  // Trust items - hybrid approach
  if (field.includes('trust_item') || field === 'trust_items') {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Trust indicators should counter urgency skepticism',
        fallback_strategy: 'generate',
        confidence: 0.8
      },
      user_guidance: 'AI will suggest trust indicators; verify accuracy'
    };
  }

  // Default for other fields
  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Standard countdown CTA content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.8
    }
  };
}

/**
 * Specific classification for CTAWithFormField fields
 */
function classifyCTAWithFormFieldField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // Headlines and subheadlines - AI generated
  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Form CTA headlines should encourage form completion',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create form-focused headlines'
    };
  }

  // CTA text - AI generated
  if (field === 'cta_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'CTA text should encourage form submission',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create submission-focused CTA text'
    };
  }

  // Form fields - manual preferred
  if (field === 'form_label' || field === 'placeholder_text' || field === 'form_type' || field === 'required_fields') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Form field configuration should match data collection needs',
        fallback_strategy: 'default',
        confidence: 0.9
      },
      user_guidance: 'Configure form fields based on your data collection requirements'
    };
  }

  // Privacy and legal text - manual preferred
  if (field === 'privacy_text' || field === 'success_message') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Privacy and legal text must comply with regulations',
        fallback_strategy: 'default',
        confidence: 0.95
      },
      user_guidance: 'Ensure compliance with privacy regulations (GDPR, CCPA, etc.)'
    };
  }

  // Benefits - AI generated
  if (field.includes('benefit') || field === 'benefits') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Benefits should motivate form completion',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create form completion benefits'
    };
  }

  // Trust items - hybrid approach
  if (field.includes('trust_item')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Trust indicators should reduce form abandonment',
        fallback_strategy: 'generate',
        confidence: 0.8
      },
      user_guidance: 'AI will suggest trust indicators; verify accuracy'
    };
  }

  // Default for other fields
  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Standard form CTA content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.8
    }
  };
}

/**
 * Specific classification for ValueStackCTA fields
 */
function classifyValueStackCTAField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // Headlines and subheadlines - AI generated
  if (field === 'headline' || field === 'subheadline' || field === 'final_cta_headline' || field === 'final_cta_description') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Value stack headlines should emphasize comprehensive benefits',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create value-focused headlines'
    };
  }

  // CTA text - AI generated
  if (field === 'cta_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'CTA text should reflect high value proposition',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create value-driven CTA text'
    };
  }

  // Value propositions and descriptions - AI generated
  if (field === 'value_propositions' || field === 'value_descriptions') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Value propositions require persuasive benefit articulation',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will craft compelling value propositions and detailed benefits'
    };
  }

  // Guarantee text - hybrid approach
  if (field === 'guarantee_text') {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Guarantee terms should be accurate and legally sound',
        fallback_strategy: 'generate',
        confidence: 0.8
      },
      user_guidance: 'AI will suggest guarantee language; verify legal accuracy'
    };
  }

  // Value icons - manual preferred
  if (field.includes('value_icon')) {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Icons should visually represent specific value propositions',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      user_guidance: 'Choose icons that clearly represent each value proposition'
    };
  }

  // Default for other fields
  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Standard value stack content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.8
    }
  };
}

/**
 * Specific classification for TestimonialCTACombo fields
 */
function classifyTestimonialCTAComboField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // Headlines and subheadlines - AI generated
  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Testimonial CTA headlines should leverage social proof',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create social proof-focused headlines'
    };
  }

  // CTA text - AI generated
  if (field === 'cta_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'CTA text should build on testimonial credibility',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create trust-based CTA text'
    };
  }

  // Testimonial content - manual preferred
  if (field === 'testimonial_quote' || field === 'testimonial_author' || field === 'testimonial_title' ||
      field === 'testimonial_company' || field === 'testimonial_date' || field === 'testimonial_industry') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Testimonial content must be authentic and verifiable',
        fallback_strategy: 'default',
        confidence: 0.95
      },
      user_guidance: 'Use actual customer testimonials with verified attribution'
    };
  }

  // Company logo - manual preferred
  if (field === 'testimonial_company_logo') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Company logos must be authentic and properly licensed',
        fallback_strategy: 'skip',
        confidence: 0.95
      },
      user_guidance: 'Upload authentic company logos with proper permissions'
    };
  }

  // Case study elements - hybrid approach
  if (field === 'case_study_tag') {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Case study tags should accurately reflect testimonial content',
        fallback_strategy: 'generate',
        confidence: 0.8
      },
      user_guidance: 'AI will suggest case study tags; verify accuracy'
    };
  }

  // Social proof metrics - manual preferred
  if (field === 'customer_count' || field === 'average_rating' || field === 'uptime_percentage') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Social proof metrics must be accurate and verifiable',
        fallback_strategy: 'default',
        confidence: 0.95
      },
      user_guidance: 'Provide accurate company metrics and statistics'
    };
  }

  // Display flags - manual preferred
  if (field === 'show_social_proof') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Display preferences should be set based on available data',
        fallback_strategy: 'default',
        confidence: 0.9
      },
      user_guidance: 'Configure based on your available social proof data'
    };
  }

  // Default for other fields
  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Standard testimonial CTA content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.8
    }
  };
}

/**
 * Problem Section Classifications
 */

function classifyStackedPainBulletsField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Pain point headlines should be emotionally resonant and specific',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create compelling pain point headlines'
    };
  }

  if (field === 'pain_points') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Pain points should be specific and relatable to target audience',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will generate pipe-separated pain points based on business context'
    };
  }

  if (field === 'pain_descriptions') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Detailed pain descriptions amplify emotional impact',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create detailed pain descriptions (pipe-separated)'
    };
  }

  if (field === 'conclusion_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Conclusion text should validate and relate to user experience',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create validating conclusion text'
    };
  }

  if (field.includes('pain_icon_')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Pain icons should visually represent specific pain points',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      suggested_default: '⚠️',
      user_guidance: 'AI will suggest relevant pain icons; customize for your specific pain points'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Standard pain bullet content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.85
    }
  };
}

function classifyBeforeImageAfterTextField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Headlines should frame the before/after transformation story',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create transformation-focused headlines'
    };
  }

  if (field === 'before_description' || field === 'after_description') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Before/after descriptions create compelling transformation narrative',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create contrasting before/after descriptions'
    };
  }

  if (field === 'before_after_image') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Visual proof of transformation should be authentic',
        fallback_strategy: 'skip',
        confidence: 0.9
      },
      user_guidance: 'Upload actual before/after images showing your transformation'
    };
  }

  if (field === 'image_caption') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Captions explain and amplify the visual transformation',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create descriptive image captions'
    };
  }

  if (field.includes('transformation_icon_')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Icons should represent transformation states',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      suggested_default: field.includes('1') ? '⚡' : (field.includes('2') ? '✓' : '💖'),
      user_guidance: 'AI will suggest transformation icons; customize for your specific transformation'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Standard transformation content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.85
    }
  };
}

function classifySideBySideSplitField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Headlines should present clear path choice to audience',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create path-choice focused headlines'
    };
  }

  if (field === 'problem_title' || field === 'problem_description') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Problem path content should create urgency and relatability',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create compelling problem path description'
    };
  }

  if (field === 'solution_preview') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Solution preview should provide hope and direction',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create aspirational solution preview'
    };
  }

  if (field === 'problem_points' || field === 'solution_points') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Contrasting points amplify the path differences',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create contrasting problem/solution points (pipe-separated)'
    };
  }

  if (field === 'call_to_action' || field === 'transition_text' || field === 'cta_section_message') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Action text should motivate path switching',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create motivating action and transition text'
    };
  }

  if (field.includes('bottom_stat_') && !field.includes('label')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Statistics should be relevant and credible',
        fallback_strategy: 'generate',
        confidence: 0.8
      },
      user_guidance: 'AI will suggest relevant statistics; verify accuracy'
    };
  }

  if (field.includes('bottom_stat_') && field.includes('label')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Stat labels should clearly explain the numbers',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create clear statistical labels'
    };
  }

  if (field.includes('path_') && field.includes('icon')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Path icons should represent problem vs solution states',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      suggested_default: field.includes('1') ? '⚠️' : '✓',
      user_guidance: 'AI will suggest path icons; customize for your specific paths'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Standard path comparison content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.85
    }
  };
}

function classifyEmotionalQuotesField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Headlines should introduce emotional resonance and relatability',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create empathetic headline about shared struggles'
    };
  }

  if (field === 'emotional_quotes') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Quotes should feel authentic and emotionally resonate with target audience',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create relatable emotional quotes (pipe-separated)'
    };
  }

  if (field === 'quote_attributions') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Attribution names and titles should feel realistic for target audience',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create believable quote attributions (pipe-separated)'
    };
  }

  if (field === 'context_text' || field === 'emotional_impact' || field === 'relatable_intro') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Context text should validate user feelings and create connection',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create validating context and emotional impact text'
    };
  }

  if (field === 'quote_categories') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Categories should organize quotes by pain type or user segment',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create quote categories (pipe-separated)'
    };
  }

  if (field.includes('category_icon_')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Category icons should represent different types of emotional pain',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      suggested_default: '💼',
      user_guidance: 'AI will suggest category icons; customize for your pain categories'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Standard emotional quote content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.85
    }
  };
}

function classifyCollapsedCardsField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Headlines should encourage exploration of business challenges',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create engaging headline about business challenges'
    };
  }

  if (field === 'problem_titles') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Problem titles should be immediately recognizable and clickable',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create recognizable problem titles (pipe-separated)'
    };
  }

  if (field === 'problem_descriptions') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Detailed descriptions should build emotional connection with problems',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create detailed problem descriptions (pipe-separated)'
    };
  }

  if (field === 'problem_impacts') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Impact statements should show consequences of unresolved problems',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create problem impact statements (pipe-separated)'
    };
  }

  if (field === 'solution_hints') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Solution hints should provide hope and tease resolution',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create solution hints (pipe-separated)'
    };
  }

  if (field === 'expand_labels') {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Expand labels should encourage interaction with card content',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      suggested_default: 'Learn More',
      user_guidance: 'AI will suggest expand labels; customize for your UI preferences'
    };
  }

  if (field === 'intro_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Intro text should set up the challenge exploration experience',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create introductory exploration text'
    };
  }

  if (field.includes('problem_icon_')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Problem icons should visually represent different business challenges',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      suggested_default: '⚙️',
      user_guidance: 'AI will suggest problem icons; customize for your specific challenges'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Standard collapsed card content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.85
    }
  };
}

function classifyPainMeterChartField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Headlines should introduce quantified pain measurement',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create data-focused pain measurement headline'
    };
  }

  if (field === 'pain_categories') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Pain categories should cover key business challenge areas',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create business pain categories (pipe-separated)'
    };
  }

  if (field === 'pain_levels') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Pain levels should provide realistic severity scores',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will generate pain level scores 0-100 (pipe-separated numbers)'
    };
  }

  if (field === 'category_descriptions') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Descriptions should explain each pain category impact',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create category descriptions (pipe-separated)'
    };
  }

  if (field === 'chart_labels' || field === 'total_score_text' || field === 'benchmark_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Chart labeling and scoring text for data interpretation',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create clear chart labels and scoring text'
    };
  }

  if (field === 'intro_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Intro text should contextualize the pain measurement data',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create pain meter introduction text'
    };
  }

  if (field.includes('action_stat_') && !field.includes('label')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Action statistics should be credible and relevant',
        fallback_strategy: 'generate',
        confidence: 0.8
      },
      user_guidance: 'AI will suggest relevant statistics; verify accuracy'
    };
  }

  if (field.includes('action_stat_') && field.includes('label')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Stat labels should clearly explain the action metrics',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create clear action statistic labels'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Standard pain meter content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.85
    }
  };
}

function classifyPersonaPanelsField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Headlines should encourage persona identification and self-selection',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create persona identification headline'
    };
  }

  if (field === 'persona_names') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Persona names should be recognizable business archetypes',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create business persona names (pipe-separated)'
    };
  }

  if (field === 'persona_problems') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Persona problems should be specific to each business stage/role',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create persona-specific problems (pipe-separated)'
    };
  }

  if (field === 'persona_descriptions' || field === 'persona_titles') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Persona details should help users self-identify',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create persona descriptions and titles (pipe-separated)'
    };
  }

  if (field === 'persona_pain_points' || field === 'persona_goals') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Detailed persona characteristics for deeper identification',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create persona pain points and goals (pipe-separated)'
    };
  }

  if (field === 'intro_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Intro text should set up persona selection process',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create persona introduction text'
    };
  }

  if (field.includes('persona_icon_')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Persona icons should represent different business stages/roles',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      suggested_default: '👤',
      user_guidance: 'AI will suggest persona icons; customize for your business types'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Standard persona content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.85
    }
  };
}

function classifyProblemChecklistField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Headlines should encourage checklist participation and assessment',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create assessment-focused headline'
    };
  }

  if (field === 'problem_statements') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Problem statements should be specific and relatable',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create relatable problem statements (pipe-separated)'
    };
  }

  if (field === 'checklist_items') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Checklist items should be clear, short labels for each problem',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create clear checklist labels (pipe-separated)'
    };
  }

  if (field === 'conclusion_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Conclusion should validate user experience and provide next steps',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create validating conclusion text'
    };
  }

  if (field === 'scoring_labels' || field === 'action_thresholds') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Scoring guidance helps users interpret their assessment results',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create scoring labels and action thresholds'
    };
  }

  if (field === 'intro_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Intro text should set up the assessment experience',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create assessment introduction text'
    };
  }

  if (field === 'cta_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'CTA should guide users to next step based on assessment',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create assessment-based CTA text'
    };
  }

  if (field.includes('result_stat_') && !field.includes('label')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Result statistics should be credible and relevant',
        fallback_strategy: 'generate',
        confidence: 0.8
      },
      user_guidance: 'AI will suggest relevant statistics; verify accuracy'
    };
  }

  if (field.includes('result_stat_') && field.includes('label')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Stat labels should clearly explain the result metrics',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create clear result statistic labels'
    };
  }

  if (field.includes('encouragement_tip_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Encouragement tips should provide positive guidance based on score ranges',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create encouraging tips for different score ranges'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'ai_generated',
      reason: 'Standard problem checklist content suitable for AI generation',
      fallback_strategy: 'generate',
      confidence: 0.85
    }
  };
}

/**
 * Specific classification for ThreeStepHorizontal fields
 */
function classifyThreeStepHorizontalField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // Core content fields are AI-generated
  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Process header content is ideal for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create engaging headlines that introduce your 3-step process'
    };
  }

  if (field === 'step_titles' || field === 'step_descriptions') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Step content is perfect for AI generation based on business context',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will generate clear, actionable steps based on your business process'
    };
  }

  if (field === 'conclusion_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Conclusion text summarizes the process effectively',
        fallback_strategy: 'generate',
        confidence: 0.85
      },
      user_guidance: 'AI will create compelling conclusion text for your process'
    };
  }

  if (field.startsWith('step_icon_') || field === 'step_numbers') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Visual elements require specific brand choices',
        fallback_strategy: 'default',
        confidence: 0.6
      },
      suggested_default: field.startsWith('step_icon_') ? '⭐' : '1|2|3'
    };
  }

  // Fallback
  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown ThreeStepHorizontal field, using hybrid approach',
      fallback_strategy: 'generate',
      confidence: 0.7
    },
    user_guidance: 'Please review this field as it may need manual adjustment'
  };
}

/**
 * Specific classification for VerticalTimeline fields
 */
function classifyVerticalTimelineField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // Core content fields are AI-generated
  if (field === 'headline' || field === 'subheadline' || field === 'supporting_text') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Timeline header content is ideal for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create engaging timeline headers that introduce your process'
    };
  }

  if (field === 'step_titles' || field === 'step_descriptions') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Timeline step content is perfect for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will generate clear, progressive timeline steps'
    };
  }

  if (field === 'step_durations' || field === 'process_time_label') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Time estimates can be reasonably generated based on typical processes',
        fallback_strategy: 'generate',
        confidence: 0.8
      },
      user_guidance: 'AI will suggest realistic time estimates; adjust based on your specific process'
    };
  }

  if (field.includes('process_summary') || field === 'process_steps_label') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Process summary content works well with AI generation',
        fallback_strategy: 'generate',
        confidence: 0.85
      },
      user_guidance: 'AI will create compelling process summary content'
    };
  }

  if (field.startsWith('step_icon_') || field === 'use_step_icons') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Visual elements require specific brand choices',
        fallback_strategy: 'default',
        confidence: 0.6
      },
      suggested_default: field.startsWith('step_icon_') ? '⭐' : undefined
    };
  }

  if (field === 'cta_text' || field === 'trust_items') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'CTA and trust elements are suitable for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.85
      },
      user_guidance: 'AI will generate compelling CTA and trust indicators'
    };
  }

  // Fallback
  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown VerticalTimeline field, using hybrid approach',
      fallback_strategy: 'generate',
      confidence: 0.7
    },
    user_guidance: 'Please review this field as it may need manual adjustment'
  };
}

/**
 * Specific classification for IconCircleSteps fields
 */
function classifyIconCircleStepsField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // Core content fields are AI-generated
  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Icon-based process headers are ideal for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create engaging headlines for your icon-driven process'
    };
  }

  if (field === 'step_titles' || field === 'step_descriptions') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Step content with icon support is perfect for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will generate clear, icon-friendly step descriptions'
    };
  }

  if (field === 'step_labels') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Step labels complement the icon-driven design',
        fallback_strategy: 'generate',
        confidence: 0.85
      },
      user_guidance: 'AI will create concise, descriptive step labels'
    };
  }

  if (field.startsWith('step_icon_')) {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Icons require specific brand and visual choices',
        fallback_strategy: 'default',
        confidence: 0.6
      },
      suggested_default: '⭐'
    };
  }

  // Fallback
  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown IconCircleSteps field, using hybrid approach',
      fallback_strategy: 'generate',
      confidence: 0.7
    },
    user_guidance: 'Please review this field as it may need manual adjustment'
  };
}

/**
 * Specific classification for AccordionSteps fields
 */
function classifyAccordionStepsField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // Core content fields are AI-generated
  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Accordion process headers are ideal for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create engaging headlines for your expandable process steps'
    };
  }

  if (field === 'step_titles' || field === 'step_descriptions') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Accordion step content is perfect for detailed AI generation',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will generate comprehensive step titles and descriptions for accordion format'
    };
  }

  if (field === 'step_details') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Detailed step information is ideal for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.85
      },
      user_guidance: 'AI will create detailed explanations for each accordion step'
    };
  }

  // Fallback
  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown AccordionSteps field, using hybrid approach',
      fallback_strategy: 'generate',
      confidence: 0.7
    },
    user_guidance: 'Please review this field as it may need manual adjustment'
  };
}

/**
 * Specific classification for CardFlipSteps fields
 */
function classifyCardFlipStepsField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // Core content fields are AI-generated
  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Card flip process headers are ideal for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create engaging headlines for your interactive card flip process'
    };
  }

  if (field === 'step_titles' || field === 'step_descriptions') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Card flip content is perfect for AI generation with front/back structure',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will generate compelling card front titles and detailed back descriptions'
    };
  }

  if (field === 'step_details') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Card back details are ideal for comprehensive AI generation',
        fallback_strategy: 'generate',
        confidence: 0.85
      },
      user_guidance: 'AI will create detailed explanations for card flip reveal'
    };
  }

  if (field === 'flip_instruction') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'User interaction instructions can be generated effectively',
        fallback_strategy: 'generate',
        confidence: 0.8
      },
      user_guidance: 'AI will create clear flip interaction instructions'
    };
  }

  // Fallback
  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown CardFlipSteps field, using hybrid approach',
      fallback_strategy: 'generate',
      confidence: 0.7
    },
    user_guidance: 'Please review this field as it may need manual adjustment'
  };
}

/**
 * Specific classification for VideoWalkthrough fields
 */
function classifyVideoWalkthroughField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // Core content fields are AI-generated
  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Video walkthrough headers are ideal for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create engaging headlines that introduce your video walkthrough'
    };
  }

  if (field === 'video_title' || field === 'video_description') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Video content descriptions are perfect for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will generate compelling video titles and descriptions'
    };
  }

  if (field === 'chapter_titles') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Video chapter organization is suitable for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.85
      },
      user_guidance: 'AI will create logical video chapter titles'
    };
  }

  if (field === 'video_duration') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Video duration requires actual video content knowledge',
        fallback_strategy: 'default',
        confidence: 0.3
      },
      suggested_default: '3:45'
    };
  }

  // Fallback
  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown VideoWalkthrough field, using hybrid approach',
      fallback_strategy: 'generate',
      confidence: 0.7
    },
    user_guidance: 'Please review this field as it may need manual adjustment'
  };
}

/**
 * Specific classification for ZigzagImageSteps fields
 */
function classifyZigzagImageStepsField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // Core content fields are AI-generated
  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Zigzag visual process headers are ideal for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create engaging headlines for your visual zigzag process'
    };
  }

  if (field === 'step_titles' || field === 'step_descriptions') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Image-supported step content is perfect for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will generate clear steps that work well with alternating image layout'
    };
  }

  if (field === 'image_captions') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Image captions can be generated to complement step content',
        fallback_strategy: 'generate',
        confidence: 0.8
      },
      user_guidance: 'AI will create descriptive captions for your process images'
    };
  }

  // Fallback
  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown ZigzagImageSteps field, using hybrid approach',
      fallback_strategy: 'generate',
      confidence: 0.7
    },
    user_guidance: 'Please review this field as it may need manual adjustment'
  };
}

/**
 * Specific classification for AnimatedProcessLine fields
 */
function classifyAnimatedProcessLineField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  // Core content fields are AI-generated
  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Animated process headers are ideal for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create engaging headlines for your animated process flow'
    };
  }

  if (field === 'process_titles' || field === 'process_descriptions') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Animated process content is perfect for AI generation',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will generate dynamic process steps with animation-friendly language'
    };
  }

  if (field === 'animation_labels') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Animation labels complement the process flow effectively',
        fallback_strategy: 'generate',
        confidence: 0.85
      },
      user_guidance: 'AI will create concise animation labels for your process flow'
    };
  }

  // Fallback
  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown AnimatedProcessLine field, using hybrid approach',
      fallback_strategy: 'generate',
      confidence: 0.7
    },
    user_guidance: 'Please review this field as it may need manual adjustment'
  };
}

/**
 * Specific classification for ObjectionAccordion fields
 */
function classifyObjectionAccordionField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Section headers should be compelling and audience-focused',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create persuasive headlines for objection handling'
    };
  }

  if (field.startsWith('objection_') && (field.includes('_1') || field.includes('_2') || field.includes('_3'))) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Core objections should be tailored to target audience and market sophistication',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will generate market-specific objections based on audience analysis'
    };
  }

  if (field.startsWith('response_') && (field.includes('_1') || field.includes('_2') || field.includes('_3'))) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Responses require persuasive copywriting and trust-building language',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create compelling responses that build trust and address concerns'
    };
  }

  if (field.startsWith('objection_') && !field.includes('icon')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Additional objections benefit from market research and audience insights',
        fallback_strategy: 'generate',
        confidence: 0.85
      },
      user_guidance: 'AI will generate relevant objections for your specific market'
    };
  }

  if (field.startsWith('response_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'All responses need consistent tone and persuasive messaging',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will maintain consistent persuasive tone across all responses'
    };
  }

  if (field.includes('icon') || field === 'help_text' || field === 'trust_icon') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Visual elements and micro-copy often need brand-specific customization',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      user_guidance: 'Consider customizing icons and helper text to match your brand'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown objection accordion field',
      fallback_strategy: 'generate',
      confidence: 0.7
    }
  };
}

/**
 * Specific classification for MythVsRealityGrid fields
 */
function classifyMythVsRealityGridField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Headlines should be attention-grabbing and set up the myth-busting framework',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create compelling headlines that frame myths vs reality'
    };
  }

  if (field.startsWith('myth_') && !field.includes('icon')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Myths should reflect actual market misconceptions and competitor positioning',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will identify common market myths based on industry analysis'
    };
  }

  if (field.startsWith('reality_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Reality statements need compelling evidence and benefit-focused messaging',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create evidence-based reality statements that build credibility'
    };
  }

  if (field.includes('icon')) {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Icons should align with brand visual identity',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      user_guidance: 'Consider using brand-specific icons for myths and reality indicators'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown myth vs reality field',
      fallback_strategy: 'generate',
      confidence: 0.7
    }
  };
}

/**
 * Specific classification for QuoteBackedAnswers fields
 */
function classifyQuoteBackedAnswersField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Headers should emphasize authority and credibility',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create authority-focused headlines for expert validation'
    };
  }

  if (field.startsWith('objection_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Objections should reflect sophisticated buyer concerns',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will generate sophisticated objections that experts can address'
    };
  }

  if (field.startsWith('quote_response_')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Expert quotes need authenticity but can be AI-enhanced for clarity',
        fallback_strategy: 'generate',
        confidence: 0.75
      },
      user_guidance: 'AI will create realistic expert quotes - consider replacing with real testimonials'
    };
  }

  if (field.startsWith('quote_attribution_')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Attributions should be realistic but can be AI-generated for prototyping',
        fallback_strategy: 'generate',
        confidence: 0.7
      },
      user_guidance: 'AI will create realistic expert profiles - replace with actual contacts when possible'
    };
  }

  if (field.includes('credentials') || field.includes('trust_') || field.includes('verification')) {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Trust indicators and credentials should be verifiable and brand-specific',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      user_guidance: 'Use actual credentials and trust indicators specific to your industry'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown quote-backed answers field',
      fallback_strategy: 'generate',
      confidence: 0.7
    }
  };
}

/**
 * Specific classification for SkepticToBelieverSteps fields
 */
function classifySkepticToBelieverStepsField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Headers should create narrative tension and emotional connection',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create compelling narrative headlines for the conversion journey'
    };
  }

  if (field.startsWith('step_name_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Step names should create relatable personas and scenarios',
        fallback_strategy: 'generate',
        confidence: 0.85
      },
      user_guidance: 'AI will create relatable customer personas and scenarios'
    };
  }

  if (field.startsWith('step_quote_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Quotes should reflect authentic skepticism and transformation',
        fallback_strategy: 'generate',
        confidence: 0.85
      },
      user_guidance: 'AI will create authentic-sounding customer quotes for each transformation step'
    };
  }

  if (field.startsWith('step_result_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Results should be specific, measurable, and compelling',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create specific, measurable results that demonstrate transformation'
    };
  }

  if (field.includes('icon') || field === 'objections_summary') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Visual elements and summaries benefit from brand customization',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      user_guidance: 'Consider customizing icons and summary text for your specific brand narrative'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown skeptic to believer steps field',
      fallback_strategy: 'generate',
      confidence: 0.7
    }
  };
}

/**
 * Specific classification for VisualObjectionTiles fields
 */
function classifyVisualObjectionTilesField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Headers should be visually-focused and create scanning appeal',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create scan-friendly headlines optimized for visual presentation'
    };
  }

  if (field.startsWith('tile_objection_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Tile objections should be concise and visually scannable',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create concise, scannable objections perfect for tile format'
    };
  }

  if (field.startsWith('tile_response_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Tile responses need concise yet persuasive messaging',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create punchy responses that work well in visual tile format'
    };
  }

  if (field.startsWith('tile_label_') || field.includes('icon')) {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Visual elements and labels should align with design system',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      user_guidance: 'Consider customizing tile labels and icons for visual consistency'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown visual objection tiles field',
      fallback_strategy: 'generate',
      confidence: 0.7
    }
  };
}

/**
 * Specific classification for ProblemToReframeBlocks fields
 */
function classifyProblemToReframeBlocksField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Headers should set up the problem-reframing narrative effectively',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create compelling headers that introduce problem reframing'
    };
  }

  if (field.startsWith('problem_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Problems should reflect genuine customer pain points and limiting beliefs',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will identify authentic customer problems and limiting beliefs'
    };
  }

  if (field.startsWith('reframe_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Reframes require strategic thinking and perspective-shifting language',
        fallback_strategy: 'generate',
        confidence: 0.95
      },
      user_guidance: 'AI will create powerful reframes that shift customer perspective'
    };
  }

  if (field.includes('icon') || field === 'transition_text') {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Visual transitions and micro-copy should align with brand voice',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      user_guidance: 'Consider customizing transition elements for your specific brand voice'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown problem to reframe blocks field',
      fallback_strategy: 'generate',
      confidence: 0.7
    }
  };
}

/**
 * Specific classification for BoldGuaranteePanel fields
 */
function classifyBoldGuaranteePanelField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Headers should create confidence and reduce purchase anxiety',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create confidence-building headlines for guarantee section'
    };
  }

  if (field.includes('guarantee_')) {
    return {
      field: fieldName,
      classification: {
        category: 'hybrid',
        reason: 'Guarantee language should be legally sound but compelling',
        fallback_strategy: 'generate',
        confidence: 0.75
      },
      user_guidance: 'AI will draft guarantee language - please review with legal team before publishing'
    };
  }

  if (field.includes('risk_reversal') || field.includes('refund_')) {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Risk reversal terms should reflect actual business policies',
        fallback_strategy: 'default',
        confidence: 0.9
      },
      user_guidance: 'Ensure risk reversal terms match your actual refund and guarantee policies'
    };
  }

  if (field.includes('trust_') || field.includes('security_') || field.includes('backing')) {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Trust elements should be verifiable and company-specific',
        fallback_strategy: 'default',
        confidence: 0.85
      },
      user_guidance: 'Use actual trust badges and security credentials specific to your business'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown guarantee panel field',
      fallback_strategy: 'generate',
      confidence: 0.7
    }
  };
}

/**
 * Specific classification for ObjectionCarousel fields
 */
function classifyObjectionCarouselField(fieldName: string): ClassificationResult {
  const field = fieldName.toLowerCase();

  if (field === 'headline' || field === 'subheadline') {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Headers should create engagement and carousel navigation appeal',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create engaging headlines that encourage carousel interaction'
    };
  }

  if (field.startsWith('slide_objection_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Carousel objections should build progressive understanding',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create objections that flow logically through carousel progression'
    };
  }

  if (field.startsWith('slide_response_')) {
    return {
      field: fieldName,
      classification: {
        category: 'ai_generated',
        reason: 'Carousel responses should maintain engagement across slides',
        fallback_strategy: 'generate',
        confidence: 0.9
      },
      user_guidance: 'AI will create responses optimized for carousel presentation format'
    };
  }

  if (field.includes('carousel_') || field.includes('slide_') || field.includes('auto_') || field.includes('duration')) {
    return {
      field: fieldName,
      classification: {
        category: 'manual_preferred',
        reason: 'Carousel behavior settings should match user experience goals',
        fallback_strategy: 'default',
        confidence: 0.8
      },
      user_guidance: 'Configure carousel settings based on your audience engagement preferences'
    };
  }

  return {
    field: fieldName,
    classification: {
      category: 'hybrid',
      reason: 'Unknown objection carousel field',
      fallback_strategy: 'generate',
      confidence: 0.7
    }
  };
}