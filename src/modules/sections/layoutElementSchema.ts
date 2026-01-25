/**
 * Generation types for elements:
 * - ai_generated: AI generates content, ready to use
 * - manual_preferred: User provides (logo, hero_image), has defaults
 * - ai_generated_needs_review: AI generates placeholder, flagged "Verify this"
 * - hybrid: Mix of AI and manual
 */
export type GenerationType = 'ai_generated' | 'manual_preferred' | 'ai_generated_needs_review' | 'hybrid';

export interface LayoutElement {
  element: string;
  mandatory: boolean;
  generation?: GenerationType;
  isCard?: boolean; // Indicates if this element is part of a card structure
  description?: string; // Optional description or guidance for the element
  charLimit?: number; // Maximum character length for this element
}

export interface CardStructure {
  type: 'cards' | 'pairs' | 'items' | 'blocks' | 'steps' | 'triplets' | 'quadruplets' | 'sextuplets' | 'tabbed_pairs' | 'rows' | 'usage_based' | 'column_pairs';
  elements: string[];  // All card elements are mandatory by default
  generation: GenerationType;
}

export interface CardRequirements {
  type: string;
  min: number;
  max: number;
  optimal: [number, number];
  description: string;
  respectUserContent?: boolean; // Prioritize user-provided features
}

export interface UnifiedLayoutElement {
  sectionElements: LayoutElement[];
  cardStructure?: CardStructure;
  cardRequirements: CardRequirements | null;
}

export interface LayoutSchema {
  [layoutName: string]: LayoutElement[] | UnifiedLayoutElement;
}

// Helper functions to work with both old and new schema formats
export function isUnifiedSchema(schema: LayoutElement[] | UnifiedLayoutElement): schema is UnifiedLayoutElement {
  return typeof schema === 'object' && !Array.isArray(schema) && 'sectionElements' in schema;
}

export function getAllElements(schema: LayoutElement[] | UnifiedLayoutElement): LayoutElement[] {
  if (isUnifiedSchema(schema)) {
    const cardElements = schema.cardStructure ? schema.cardStructure.elements.map(elementName => ({
      element: elementName,
      mandatory: true, // All card elements are mandatory
      generation: schema.cardStructure!.generation
    })) : [];
    return [...schema.sectionElements, ...cardElements];
  }
  return schema;
}

// New helper function to get layout elements safely for any schema format
export function getLayoutElements(layoutName: string): LayoutElement[] {
  const schema = layoutElementSchema[layoutName];
  if (!schema) {
    return [];
  }
  return getAllElements(schema);
}

export function getSectionElements(schema: LayoutElement[] | UnifiedLayoutElement): LayoutElement[] {
  if (isUnifiedSchema(schema)) {
    return schema.sectionElements;
  }
  return schema;
}

export function getCardElements(schema: LayoutElement[] | UnifiedLayoutElement): LayoutElement[] {
  if (isUnifiedSchema(schema) && schema.cardStructure) {
    return schema.cardStructure.elements.map(elementName => ({
      element: elementName,
      mandatory: true, // All card elements are mandatory
      generation: schema.cardStructure!.generation
    }));
  }
  return [];
}

export function getCardRequirements(schema: LayoutElement[] | UnifiedLayoutElement): CardRequirements | null {
  if (isUnifiedSchema(schema)) {
    return schema.cardRequirements || null;
  }
  return null;
}

export const layoutElementSchema: LayoutSchema = {
  // BeforeAfter Section
  SideBySideBlocks: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "before_label", mandatory: true, generation: "ai_generated" },
      { element: "after_label", mandatory: true, generation: "ai_generated" },
      { element: "before_description", mandatory: true, generation: "ai_generated" },
      { element: "after_description", mandatory: true, generation: "ai_generated" },
      { element: "before_icon", mandatory: false, generation: "ai_generated" },
      { element: "after_icon", mandatory: false, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" }
    ],
    cardRequirements: {
      type: 'pairs',
      min: 1,
      max: 3,
      optimal: [2, 2],
      description: 'Before/after comparison blocks'
    }
  },

  StackedTextVisual: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "before_text", mandatory: true, generation: "ai_generated" },
      { element: "after_text", mandatory: true, generation: "ai_generated" },
      { element: "before_label", mandatory: true, generation: "ai_generated" },
      { element: "after_label", mandatory: true, generation: "ai_generated" },
      { element: "transition_text", mandatory: false, generation: "ai_generated" },
      { element: "before_icon", mandatory: false, generation: "ai_generated" },
      { element: "after_icon", mandatory: false, generation: "ai_generated" },
      { element: "transition_icon", mandatory: false, generation: "ai_generated" },
      { element: "summary_text", mandatory: false, generation: "ai_generated" },
      { element: "show_summary_box", mandatory: false, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" }
    ],
    cardRequirements: {
      type: 'pairs',
      min: 1,
      max: 3,
      optimal: [2, 2],
      description: 'Stacked before/after comparisons'
    }
  },

  SplitCard: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "before_label", mandatory: true, generation: "ai_generated" },
      { element: "after_label", mandatory: true, generation: "ai_generated" },
      { element: "before_description", mandatory: true, generation: "ai_generated" },
      { element: "after_description", mandatory: true, generation: "ai_generated" },
      { element: "before_visual", mandatory: false, generation: "manual_preferred" },
      { element: "after_visual", mandatory: false, generation: "manual_preferred" },
      { element: "premium_features_text", mandatory: false, generation: "ai_generated" },
      { element: "upgrade_text", mandatory: false, generation: "ai_generated" },
      { element: "before_placeholder_text", mandatory: false, generation: "ai_generated" },
      { element: "after_placeholder_text", mandatory: false, generation: "ai_generated" },
      { element: "premium_badge_text", mandatory: false, generation: "ai_generated" },
      { element: "before_icon", mandatory: false, generation: "ai_generated" },
      { element: "after_icon", mandatory: false, generation: "ai_generated" },
      { element: "upgrade_icon", mandatory: false, generation: "ai_generated" },
      { element: "premium_feature_icon", mandatory: false, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" }
    ],
    cardRequirements: {
      type: 'pairs',
      min: 1,
      max: 1,
      optimal: [1, 1],
      description: 'Split card premium vs standard comparison'
    }
  },

  // FAQ Section
  AccordionFAQ: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      // Individual Q&A fields (support up to 10 items based on cardRequirements max)
      { element: "question_1", mandatory: true, generation: "ai_generated", isCard: true },
      { element: "answer_1", mandatory: true, generation: "ai_generated", isCard: true },
      { element: "question_2", mandatory: true, generation: "ai_generated", isCard: true },
      { element: "answer_2", mandatory: true, generation: "ai_generated", isCard: true },
      { element: "question_3", mandatory: true, generation: "ai_generated", isCard: true },
      { element: "answer_3", mandatory: true, generation: "ai_generated", isCard: true },
      { element: "question_4", mandatory: false, generation: "ai_generated", isCard: true },
      { element: "answer_4", mandatory: false, generation: "ai_generated", isCard: true },
      { element: "question_5", mandatory: false, generation: "ai_generated", isCard: true },
      { element: "answer_5", mandatory: false, generation: "ai_generated", isCard: true },
      { element: "question_6", mandatory: false, generation: "ai_generated", isCard: true },
      { element: "answer_6", mandatory: false, generation: "ai_generated", isCard: true },
      { element: "question_7", mandatory: false, generation: "ai_generated", isCard: true },
      { element: "answer_7", mandatory: false, generation: "ai_generated", isCard: true },
      { element: "question_8", mandatory: false, generation: "ai_generated", isCard: true },
      { element: "answer_8", mandatory: false, generation: "ai_generated", isCard: true },
      { element: "question_9", mandatory: false, generation: "ai_generated", isCard: true },
      { element: "answer_9", mandatory: false, generation: "ai_generated", isCard: true },
      { element: "question_10", mandatory: false, generation: "ai_generated", isCard: true },
      { element: "answer_10", mandatory: false, generation: "ai_generated", isCard: true },
      // Legacy fields for backward compatibility
      { element: "questions", mandatory: false, generation: "ai_generated" },
      { element: "answers", mandatory: false, generation: "ai_generated" }
    ],

    cardRequirements: {
      type: 'items',
      min: 3,
      max: 10,
      optimal: [4, 6],
      description: 'Accordion FAQ items'
    }
  },

  TwoColumnFAQ: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "left_column_title", mandatory: false, generation: "ai_generated" },
      { element: "right_column_title", mandatory: false, generation: "ai_generated" },
      // Legacy fields for backward compatibility
      { element: "questions", mandatory: false, generation: "ai_generated" },
      { element: "answers", mandatory: false, generation: "ai_generated" },
      { element: "column_titles", mandatory: false, generation: "ai_generated" },
      { element: "questions_left", mandatory: false, generation: "ai_generated" },
      { element: "answers_left", mandatory: false, generation: "ai_generated" },
      { element: "questions_right", mandatory: false, generation: "ai_generated" },
      { element: "answers_right", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "column_pairs",
      elements: ["left_question", "left_answer", "right_question", "right_answer"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'items',
      min: 4,
      max: 10,
      optimal: [6, 8],
      description: 'Two-column FAQ items (split between left and right)'
    }
  },

  InlineQnAList: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "pairs",
      elements: ["question", "answer"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'items',
      min: 2,
      max: 10,
      optimal: [4, 6],
      description: 'Inline Q&A list items'
    }
  },

  SegmentedFAQTabs: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "tab_label_1", mandatory: true, generation: "ai_generated" },
      { element: "tab_label_2", mandatory: true, generation: "ai_generated" },
      { element: "tab_label_3", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "tabbed_pairs",
      elements: ["tab_questions", "tab_answers"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'items',
      min: 4,
      max: 15,
      optimal: [8, 10],
      description: 'Categorized FAQ tabs'
    }
  },

  // Features Section
  IconGrid: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "icon_1", mandatory: true, generation: "ai_generated" },
      { element: "icon_2", mandatory: true, generation: "ai_generated" },
      { element: "icon_3", mandatory: true, generation: "ai_generated" },
      { element: "icon_4", mandatory: true, generation: "ai_generated" },
      { element: "icon_5", mandatory: true, generation: "ai_generated" },
      { element: "icon_6", mandatory: true, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["feature_titles", "feature_descriptions"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 9,
      optimal: [4, 6],
      description: 'Feature cards with icons',
      respectUserContent: true
    }
  },

  SplitAlternating: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "feature_icon_1", mandatory: true, generation: "ai_generated" },
      { element: "feature_icon_2", mandatory: true, generation: "ai_generated" },
      { element: "feature_icon_3", mandatory: true, generation: "ai_generated" },
      { element: "feature_icon_4", mandatory: true, generation: "ai_generated" },
      { element: "feature_icon_5", mandatory: true, generation: "ai_generated" },
      { element: "feature_icon_6", mandatory: true, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["feature_titles", "feature_descriptions", "feature_benefits"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 2,
      max: 6,
      optimal: [3, 4],
      description: 'Alternating feature sections',
      respectUserContent: true
    }
  },

  MetricTiles: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "metric_icon_1", mandatory: true, generation: "ai_generated" },
      { element: "metric_icon_2", mandatory: true, generation: "ai_generated" },
      { element: "metric_icon_3", mandatory: true, generation: "ai_generated" },
      { element: "metric_icon_4", mandatory: true, generation: "ai_generated" },
      { element: "metric_icon_5", mandatory: true, generation: "ai_generated" },
      { element: "metric_icon_6", mandatory: true, generation: "ai_generated" },
      { element: "metric_icon_7", mandatory: true, generation: "ai_generated" },
      { element: "metric_icon_8", mandatory: true, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["metric_values", "metric_labels", "metric_descriptions"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 1,
      max: 8,
      optimal: [3, 5],
      description: 'Metric-focused feature cards',
      respectUserContent: true
    }
  },

  Carousel: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "auto_play", mandatory: false, generation: "manual_preferred" },
      { element: "benefit_1", mandatory: false, generation: "ai_generated" },
      { element: "benefit_2", mandatory: false, generation: "ai_generated" },
      { element: "benefit_icon_1", mandatory: true, generation: "ai_generated" },
      { element: "benefit_icon_2", mandatory: true, generation: "ai_generated" },
      { element: "feature_icon_1", mandatory: true, generation: "ai_generated" },
      { element: "feature_icon_2", mandatory: true, generation: "ai_generated" },
      { element: "feature_icon_3", mandatory: true, generation: "ai_generated" },
      { element: "feature_icon_4", mandatory: true, generation: "ai_generated" },
      { element: "feature_icon_5", mandatory: true, generation: "ai_generated" },
      { element: "feature_icon_6", mandatory: true, generation: "ai_generated" },
      { element: "feature_icon_7", mandatory: true, generation: "ai_generated" },
      { element: "feature_icon_8", mandatory: true, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["feature_titles", "feature_descriptions", "feature_visuals", "feature_tags"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 8,
      optimal: [4, 6],
      description: 'Feature carousel cards',
      respectUserContent: true
    }
  },

  // FounderNote Section
  LetterStyleBlock: {
    sectionElements: [
      { element: "letter_header", mandatory: true, generation: "ai_generated" },
      { element: "letter_greeting", mandatory: true, generation: "ai_generated" },
      { element: "letter_body", mandatory: true, generation: "ai_generated" },
      { element: "letter_signature", mandatory: true, generation: "ai_generated" },
      { element: "founder_title", mandatory: true, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "founder_name", mandatory: false, generation: "ai_generated" },
      { element: "company_name", mandatory: false, generation: "ai_generated" },
      { element: "date_text", mandatory: false, generation: "ai_generated" },
      { element: "ps_text", mandatory: false, generation: "ai_generated" },
      { element: "founder_image", mandatory: false, generation: "manual_preferred" }
    ],
    cardRequirements: null
  },

  // Hero Section
  leftCopyRightImage: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "secondary_cta_text", mandatory: false, generation: "ai_generated" },
      { element: "subheadline", mandatory: true, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "badge_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_1", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_2", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_3", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_4", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_5", mandatory: false, generation: "ai_generated" },
      { element: "hero_image", mandatory: true, generation: "manual_preferred" },
      { element: "customer_count", mandatory: false, generation: "manual_preferred" },
      { element: "rating_value", mandatory: false, generation: "manual_preferred" },
      { element: "rating_count", mandatory: false, generation: "manual_preferred" },
      { element: "show_social_proof", mandatory: false, generation: "manual_preferred" },
      { element: "show_customer_avatars", mandatory: false, generation: "manual_preferred" },
      { element: "avatar_count", mandatory: false, generation: "manual_preferred" },
      { element: "customer_names", mandatory: false, generation: "manual_preferred" },
      { element: "avatar_urls", mandatory: false, generation: "manual_preferred" },
    ],
    cardRequirements: null
  },

  centerStacked: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: true, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "secondary_cta_text", mandatory: false, generation: "ai_generated" },
      { element: "badge_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_1", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_2", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_3", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_4", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_5", mandatory: false, generation: "ai_generated" },
      { element: "center_hero_image", mandatory: true, generation: "manual_preferred" },
      { element: "customer_count", mandatory: false, generation: "manual_preferred" },
      { element: "rating_value", mandatory: false, generation: "manual_preferred" },
      { element: "rating_count", mandatory: false, generation: "manual_preferred" },
      { element: "show_social_proof", mandatory: false, generation: "manual_preferred" },
      { element: "show_customer_avatars", mandatory: false, generation: "manual_preferred" },
      { element: "avatar_count", mandatory: false, generation: "manual_preferred" },
      { element: "customer_names", mandatory: false, generation: "manual_preferred" },
      { element: "avatar_urls", mandatory: false, generation: "manual_preferred" },
    ],
    cardRequirements: null
  },

  splitScreen: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "secondary_cta_text", mandatory: false, generation: "ai_generated" },
      { element: "subheadline", mandatory: true, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "badge_text", mandatory: false, generation: "ai_generated" },
      { element: "value_proposition", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_1", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_2", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_3", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_4", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_5", mandatory: false, generation: "ai_generated" },
      { element: "split_hero_image", mandatory: true, generation: "manual_preferred" },
      { element: "customer_count", mandatory: false, generation: "manual_preferred" },
      { element: "rating_value", mandatory: false, generation: "manual_preferred" },
      { element: "rating_count", mandatory: false, generation: "manual_preferred" },
      { element: "show_social_proof", mandatory: false, generation: "manual_preferred" },
      { element: "show_customer_avatars", mandatory: false, generation: "manual_preferred" },
      { element: "avatar_count", mandatory: false, generation: "manual_preferred" },
      { element: "customer_names", mandatory: false, generation: "manual_preferred" },
      { element: "avatar_urls", mandatory: false, generation: "manual_preferred" },
    ],
    cardRequirements: null
  },

  imageFirst: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "secondary_cta_text", mandatory: false, generation: "ai_generated" },
      { element: "subheadline", mandatory: true, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "badge_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_1", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_2", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_3", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_4", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_5", mandatory: false, generation: "ai_generated" },
      { element: "image_first_hero_image", mandatory: true, generation: "manual_preferred" },
      { element: "customer_count", mandatory: false, generation: "manual_preferred" },
      { element: "rating_value", mandatory: false, generation: "manual_preferred" },
      { element: "rating_count", mandatory: false, generation: "manual_preferred" },
      { element: "show_social_proof", mandatory: false, generation: "manual_preferred" },
      { element: "show_customer_avatars", mandatory: false, generation: "manual_preferred" },
      { element: "avatar_count", mandatory: false, generation: "manual_preferred" },
      { element: "customer_names", mandatory: false, generation: "manual_preferred" },
      { element: "avatar_urls", mandatory: false, generation: "manual_preferred" },
    ],
    cardRequirements: null
  },

  // HowItWorks Section
  ThreeStepHorizontal: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "conclusion_text", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "step_numbers", mandatory: false, generation: "manual_preferred" },
      { element: "step_icon_1", mandatory: false, generation: "ai_generated" },
      { element: "step_icon_2", mandatory: false, generation: "ai_generated" },
      { element: "step_icon_3", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["step_titles", "step_descriptions"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 3,
      optimal: [3, 3],
      description: 'Three-step process'
    }
  },

  VerticalTimeline: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "process_summary_text", mandatory: false, generation: "ai_generated" },
      { element: "timeline_connector_text", mandatory: false, generation: "ai_generated" },
      { element: "use_step_icons", mandatory: false, generation: "ai_generated" },
      { element: "step_icon_1", mandatory: false, generation: "ai_generated" },
      { element: "step_icon_2", mandatory: false, generation: "ai_generated" },
      { element: "step_icon_3", mandatory: false, generation: "ai_generated" },
      { element: "step_icon_4", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["step_titles", "step_descriptions", "step_durations"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [4, 5],
      description: 'Timeline process steps'
    }
  },

  AccordionSteps: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "tech_specs_heading", mandatory: false, generation: "ai_generated" },
      { element: "tech_spec_1_value", mandatory: false, generation: "ai_generated" },
      { element: "tech_spec_1_label", mandatory: false, generation: "ai_generated" },
      { element: "tech_spec_2_value", mandatory: false, generation: "ai_generated" },
      { element: "tech_spec_2_label", mandatory: false, generation: "ai_generated" },
      { element: "tech_spec_3_value", mandatory: false, generation: "ai_generated" },
      { element: "tech_spec_3_label", mandatory: false, generation: "ai_generated" },
      { element: "tech_specs_description", mandatory: false, generation: "ai_generated" },
      { element: "show_step_indicators", mandatory: false, generation: "manual_preferred" },
      { element: "show_tech_specs", mandatory: false, generation: "manual_preferred" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["step_titles", "step_descriptions", "step_details"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [4, 5],
      description: 'Technical implementation steps with details'
    }
  },

  VideoWalkthrough: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "video_title", mandatory: true, generation: "ai_generated" },
      { element: "video_description", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "demo_stats_heading", mandatory: false, generation: "ai_generated" },
      { element: "demo_stat_1_label", mandatory: false, generation: "ai_generated" },
      { element: "demo_stat_1_description", mandatory: false, generation: "ai_generated" },
      { element: "demo_stat_2_label", mandatory: false, generation: "ai_generated" },
      { element: "demo_stat_2_description", mandatory: false, generation: "ai_generated" },
      { element: "demo_stat_3_label", mandatory: false, generation: "ai_generated" },
      { element: "demo_stat_3_description", mandatory: false, generation: "ai_generated" },
      { element: "video_info_1_text", mandatory: false, generation: "ai_generated" },
      { element: "video_info_2_text", mandatory: false, generation: "ai_generated" },
      { element: "video_duration", mandatory: false, generation: "manual_preferred" },
      { element: "video_url", mandatory: false, generation: "manual_preferred" },
      { element: "video_thumbnail", mandatory: false, generation: "manual_preferred" },
      { element: "show_demo_stats", mandatory: false, generation: "manual_preferred" },
      { element: "show_video_info", mandatory: false, generation: "manual_preferred" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["chapter_titles"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 8,
      optimal: [4, 6],
      description: 'Video chapter breakdown'
    }
  },

  // Objection Section
  MythVsRealityGrid: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "myth_icon", mandatory: false, generation: "ai_generated" },
      { element: "reality_icon", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "pairs",
      elements: ["myth_reality_pairs"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'pairs',
      min: 3,
      max: 6,
      optimal: [4, 5],
      description: 'Myth vs reality comparison pairs'
    }
  },

  VisualObjectionTiles: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["objection_questions", "objection_responses", "objection_labels", "objection_icons"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 4,
      max: 8,
      optimal: [4, 6],
      description: 'Visual objection handling tiles'
    }
  },

  // Pricing Section
  TierCards: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "tier_count", mandatory: false, generation: "manual_preferred" },
      { element: "feature_lists", mandatory: false, generation: "ai_generated" },
      { element: "popular_labels", mandatory: false, generation: "manual_preferred" },
      // Individual tier features (up to 3 tiers, 8 features each)
      { element: "tier_1_feature_1", mandatory: false, generation: "ai_generated" },
      { element: "tier_1_feature_2", mandatory: false, generation: "ai_generated" },
      { element: "tier_1_feature_3", mandatory: false, generation: "ai_generated" },
      { element: "tier_1_feature_4", mandatory: false, generation: "ai_generated" },
      { element: "tier_1_feature_5", mandatory: false, generation: "ai_generated" },
      { element: "tier_1_feature_6", mandatory: false, generation: "ai_generated" },
      { element: "tier_1_feature_7", mandatory: false, generation: "ai_generated" },
      { element: "tier_1_feature_8", mandatory: false, generation: "ai_generated" },
      { element: "tier_2_feature_1", mandatory: false, generation: "ai_generated" },
      { element: "tier_2_feature_2", mandatory: false, generation: "ai_generated" },
      { element: "tier_2_feature_3", mandatory: false, generation: "ai_generated" },
      { element: "tier_2_feature_4", mandatory: false, generation: "ai_generated" },
      { element: "tier_2_feature_5", mandatory: false, generation: "ai_generated" },
      { element: "tier_2_feature_6", mandatory: false, generation: "ai_generated" },
      { element: "tier_2_feature_7", mandatory: false, generation: "ai_generated" },
      { element: "tier_2_feature_8", mandatory: false, generation: "ai_generated" },
      { element: "tier_3_feature_1", mandatory: false, generation: "ai_generated" },
      { element: "tier_3_feature_2", mandatory: false, generation: "ai_generated" },
      { element: "tier_3_feature_3", mandatory: false, generation: "ai_generated" },
      { element: "tier_3_feature_4", mandatory: false, generation: "ai_generated" },
      { element: "tier_3_feature_5", mandatory: false, generation: "ai_generated" },
      { element: "tier_3_feature_6", mandatory: false, generation: "ai_generated" },
      { element: "tier_3_feature_7", mandatory: false, generation: "ai_generated" },
      { element: "tier_3_feature_8", mandatory: false, generation: "ai_generated" },
      // Trust indicators
      { element: "trust_item_1", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_2", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_3", mandatory: false, generation: "ai_generated" },
      { element: "show_trust_footer", mandatory: false, generation: "manual_preferred" },
      // Tier icons
      { element: "tier_icon_1", mandatory: false, generation: "ai_generated" },
      { element: "tier_icon_2", mandatory: false, generation: "ai_generated" },
      { element: "tier_icon_3", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["tier_names", "tier_prices", "tier_descriptions", "cta_texts"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 2,
      max: 4,
      optimal: [3, 3],
      description: 'Pricing tier cards'
    }
  },

  ToggleableMonthlyYearly: [
    { element: "headline", mandatory: true },
    { element: "tier_names", mandatory: true },
    { element: "monthly_prices", mandatory: true },
    { element: "yearly_prices", mandatory: true },
    { element: "tier_descriptions", mandatory: true },
    { element: "cta_texts", mandatory: true },
    { element: "feature_lists", mandatory: false },
    { element: "popular_tiers", mandatory: false },
    { element: "annual_discount_label", mandatory: false },
    { element: "billing_note", mandatory: false },
    { element: "subheadline", mandatory: false },
    { element: "supporting_text", mandatory: false },
    { element: "trust_items", mandatory: false },
    // Platform features section
    { element: "platform_features_title", mandatory: false },
    { element: "platform_feature_1_title", mandatory: false },
    { element: "platform_feature_1_desc", mandatory: false },
    { element: "platform_feature_1_icon", mandatory: false },
    { element: "platform_feature_2_title", mandatory: false },
    { element: "platform_feature_2_desc", mandatory: false },
    { element: "platform_feature_2_icon", mandatory: false },
    { element: "platform_feature_3_title", mandatory: false },
    { element: "platform_feature_3_desc", mandatory: false },
    { element: "platform_feature_3_icon", mandatory: false },
    { element: "platform_feature_4_title", mandatory: false },
    { element: "platform_feature_4_desc", mandatory: false },
    { element: "platform_feature_4_icon", mandatory: false },
    { element: "show_platform_features", mandatory: false },
  ],

  SliderPricing: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "pricing_type", mandatory: true, generation: "manual_preferred" },
      { element: "base_price", mandatory: true, generation: "manual_preferred" },
      { element: "unit_price", mandatory: true, generation: "manual_preferred" },
      { element: "min_units", mandatory: true, generation: "manual_preferred" },
      { element: "max_units", mandatory: true, generation: "manual_preferred" },
      { element: "default_units", mandatory: true, generation: "manual_preferred" },
      { element: "unit_label", mandatory: true, generation: "ai_generated" },
      { element: "included_features", mandatory: true, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "tier_breakpoints", mandatory: false, generation: "manual_preferred" },
      { element: "tier_discounts", mandatory: false, generation: "manual_preferred" },
      { element: "pricing_note", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      // Feature icons
      { element: "feature_icon_1", mandatory: false, generation: "ai_generated" },
      { element: "feature_icon_2", mandatory: false, generation: "ai_generated" },
      { element: "feature_icon_3", mandatory: false, generation: "ai_generated" },
      { element: "feature_icon_4", mandatory: false, generation: "ai_generated" },
      { element: "feature_icon_5", mandatory: false, generation: "ai_generated" },
      { element: "feature_icon_6", mandatory: false, generation: "ai_generated" },
      // Pricing icon
      { element: "pricing_icon", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "usage_based",
      elements: [],
      generation: "manual_preferred"
    },

    cardRequirements: {
      type: 'usage_slider',
      min: 1,
      max: 1,
      optimal: [1, 1],
      description: 'Usage-based pricing slider'
    }
  },

  CallToQuotePlan: [
    { element: "headline", mandatory: true },
    { element: "value_proposition", mandatory: true },
    { element: "contact_options", mandatory: true },
    { element: "contact_ctas", mandatory: true },
    { element: "subheadline", mandatory: false },
    { element: "supporting_text", mandatory: false },
    { element: "trust_items", mandatory: false },
    // Contact icons
    { element: "contact_icon_1", mandatory: false },
    { element: "contact_icon_2", mandatory: false },
    { element: "contact_icon_3", mandatory: false },
    { element: "contact_icon_4", mandatory: false },
  ],

  // Problem Section
  CollapsedCards: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "intro_text", mandatory: false, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["problem_titles", "problem_descriptions", "expand_labels", "problem_impacts", "solution_hints", "problem_icons"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 2,
      max: 4,
      optimal: [3, 3],
      description: 'Expandable problem challenge cards'
    }
  },

  SideBySideSplit: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "problem_title", mandatory: true, generation: "ai_generated" },
      { element: "problem_description", mandatory: true, generation: "ai_generated" },
      { element: "solution_preview", mandatory: true, generation: "ai_generated" },
      { element: "call_to_action", mandatory: false, generation: "ai_generated" },
      { element: "transition_text", mandatory: false, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "bottom_stat_1", mandatory: false, generation: "ai_generated" },
      { element: "bottom_stat_1_label", mandatory: false, generation: "ai_generated" },
      { element: "bottom_stat_2", mandatory: false, generation: "ai_generated" },
      { element: "bottom_stat_2_label", mandatory: false, generation: "ai_generated" },
      { element: "bottom_stat_3", mandatory: false, generation: "ai_generated" },
      { element: "bottom_stat_3_label", mandatory: false, generation: "ai_generated" },
      { element: "cta_section_message", mandatory: false, generation: "ai_generated" },
      { element: "path_1_icon", mandatory: false, generation: "ai_generated" },
      { element: "path_2_icon", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "pairs",
      elements: ["problem_points", "solution_points"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'pairs',
      min: 3,
      max: 5,
      optimal: [4, 5],
      description: 'Problem vs solution point pairs'
    }
  },

  PersonaPanels: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "intro_text", mandatory: false, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["persona_names", "persona_problems", "persona_descriptions", "persona_titles", "persona_pain_points", "persona_goals", "persona_icons"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 4,
      optimal: [4, 4],
      description: 'Business owner persona panels'
    }
  },

  // Results Section
  StatBlocks: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "achievement_footer", mandatory: false, generation: "ai_generated" },
      { element: "stat_icon_1", mandatory: true, generation: "ai_generated" },
      { element: "stat_icon_2", mandatory: true, generation: "ai_generated" },
      { element: "stat_icon_3", mandatory: true, generation: "ai_generated" },
      { element: "stat_icon_4", mandatory: true, generation: "ai_generated" },
      { element: "stat_icon_5", mandatory: true, generation: "ai_generated" },
      { element: "stat_icon_6", mandatory: true, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["stat_values", "stat_labels", "stat_descriptions"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 1,
      max: 6,
      optimal: [3, 4],
      description: 'Statistical result blocks'
    }
  },

  StackedWinsList: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "win_count", mandatory: false, generation: "ai_generated" },
      { element: "footer_title", mandatory: false, generation: "ai_generated" },
      { element: "footer_text", mandatory: false, generation: "ai_generated" },
      { element: "win_icon", mandatory: true, generation: "ai_generated" },
      { element: "momentum_icon", mandatory: true, generation: "ai_generated" },
      { element: "badge_icon", mandatory: true, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "items",
      elements: ["wins", "descriptions", "categories"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'items',
      min: 3,
      max: 8,
      optimal: [4, 6],
      description: 'Stacked list of wins/achievements'
    }
  },

  ResultsGallery: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "image_1", mandatory: false, generation: "manual_preferred" },
      { element: "image_2", mandatory: false, generation: "manual_preferred" },
      { element: "image_3", mandatory: false, generation: "manual_preferred" },
      { element: "image_4", mandatory: false, generation: "manual_preferred" },
      { element: "caption_1", mandatory: false, generation: "ai_generated" },
      { element: "caption_2", mandatory: false, generation: "ai_generated" },
      { element: "caption_3", mandatory: false, generation: "ai_generated" },
      { element: "caption_4", mandatory: false, generation: "ai_generated" },
    ],

    cardStructure: {
      type: "items",
      elements: ["images", "captions"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'items',
      min: 2,
      max: 4,
      optimal: [4, 4],
      description: 'Gallery of result images with captions for visual tools'
    }
  },

  // SocialProof Section
  LogoWall: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "logo_urls", mandatory: false, generation: "manual_preferred" },
      { element: "stat_1_number", mandatory: false, generation: "ai_generated" },
      { element: "stat_1_label", mandatory: false, generation: "ai_generated" },
      { element: "stat_2_number", mandatory: false, generation: "ai_generated" },
      { element: "stat_2_label", mandatory: false, generation: "ai_generated" },
      { element: "stat_3_number", mandatory: false, generation: "ai_generated" },
      { element: "stat_3_label", mandatory: false, generation: "ai_generated" },
      { element: "show_stats_section", mandatory: false, generation: "manual_preferred" },
      { element: "trust_badge_text", mandatory: false, generation: "ai_generated" },
      { element: "show_trust_badge", mandatory: false, generation: "manual_preferred" }
    ],
    cardStructure: {
      type: "items",
      elements: ["company_names"],
      generation: "manual_preferred"
    },
    cardRequirements: {
      type: 'items',
      min: 4,
      max: 12,
      optimal: [6, 8],
      description: 'Company logo grid'
    }
  },

  // Testimonial Section
  QuoteGrid: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "verification_message", mandatory: false, generation: "ai_generated" },
      { element: "rating_value", mandatory: false, generation: "manual_preferred" },
      { element: "quote_mark_icon", mandatory: false, generation: "ai_generated" },
      { element: "verification_icon", mandatory: false, generation: "ai_generated" },
      { element: "testimonial_icon_1", mandatory: true, generation: "ai_generated" },
      { element: "testimonial_icon_2", mandatory: true, generation: "ai_generated" },
      { element: "testimonial_icon_3", mandatory: true, generation: "ai_generated" },
      { element: "testimonial_icon_4", mandatory: true, generation: "ai_generated" },
      { element: "testimonial_icon_5", mandatory: true, generation: "ai_generated" },
      { element: "testimonial_icon_6", mandatory: true, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["testimonial_quotes", "customer_names", "customer_titles", "customer_companies"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 2,
      max: 6,
      optimal: [3, 4],
      description: 'Grid of testimonial quotes'
    }
  },

  VideoTestimonials: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "industry_leaders_title", mandatory: false, generation: "ai_generated" },
      { element: "enterprise_customers_stat", mandatory: false, generation: "manual_preferred" },
      { element: "enterprise_customers_label", mandatory: false, generation: "ai_generated" },
      { element: "uptime_stat", mandatory: false, generation: "manual_preferred" },
      { element: "uptime_label", mandatory: false, generation: "ai_generated" },
      { element: "support_stat", mandatory: false, generation: "manual_preferred" },
      { element: "support_label", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["video_titles", "video_descriptions", "video_urls", "video_thumbnails", "customer_names", "customer_titles", "customer_companies"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 2,
      max: 6,
      optimal: [3, 4],
      description: 'Video testimonial cards'
    }
  },

  AvatarCarousel: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "community_title", mandatory: false, generation: "ai_generated" },
      { element: "active_creators_count", mandatory: false, generation: "manual_preferred" },
      { element: "active_creators_label", mandatory: false, generation: "ai_generated" },
      { element: "average_rating_display", mandatory: false, generation: "manual_preferred" },
      { element: "average_rating_label", mandatory: false, generation: "ai_generated" },
      { element: "creations_count", mandatory: false, generation: "manual_preferred" },
      { element: "creations_label", mandatory: false, generation: "ai_generated" },
      { element: "auto_rotate", mandatory: false, generation: "manual_preferred" },
      { element: "avatar_urls", mandatory: false, generation: "manual_preferred" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["testimonial_quotes", "customer_names", "customer_titles", "customer_companies", "customer_avatars", "ratings"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 4,
      max: 10,
      optimal: [6, 8],
      description: 'Avatar carousel testimonials'
    }
  },

  BeforeAfterQuote: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "before_icon", mandatory: false, generation: "ai_generated" },
      { element: "after_icon", mandatory: false, generation: "ai_generated" },
      { element: "before_icon_1", mandatory: true, generation: "ai_generated" },
      { element: "before_icon_2", mandatory: true, generation: "ai_generated" },
      { element: "before_icon_3", mandatory: true, generation: "ai_generated" },
      { element: "before_icon_4", mandatory: true, generation: "ai_generated" },
      { element: "after_icon_1", mandatory: true, generation: "ai_generated" },
      { element: "after_icon_2", mandatory: true, generation: "ai_generated" },
      { element: "after_icon_3", mandatory: true, generation: "ai_generated" },
      { element: "after_icon_4", mandatory: true, generation: "ai_generated" },
      { element: "avatar_urls", mandatory: false, generation: "manual_preferred" }
    ],
    cardStructure: {
      type: "pairs",
      elements: ["before_situations", "after_outcomes", "testimonial_quotes", "customer_names", "customer_titles"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'pairs',
      min: 1,
      max: 4,
      optimal: [2, 3],
      description: 'Before/after testimonial pairs'
    }
  },

  PullQuoteStack: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "context_icon_1", mandatory: true, generation: "ai_generated" },
      { element: "context_icon_2", mandatory: true, generation: "ai_generated" },
      { element: "context_icon_3", mandatory: true, generation: "ai_generated" },
      { element: "context_icon_4", mandatory: true, generation: "ai_generated" },
      { element: "context_icon_5", mandatory: true, generation: "ai_generated" },
      { element: "context_icon_6", mandatory: true, generation: "ai_generated" },
      { element: "avatar_1", mandatory: false, generation: "manual_preferred" },
      { element: "avatar_2", mandatory: false, generation: "manual_preferred" },
      { element: "avatar_3", mandatory: false, generation: "manual_preferred" },
      { element: "avatar_4", mandatory: false, generation: "manual_preferred" },
      { element: "avatar_5", mandatory: false, generation: "manual_preferred" },
      { element: "avatar_6", mandatory: false, generation: "manual_preferred" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["testimonial_quotes", "customer_names", "customer_titles", "customer_companies", "problem_contexts", "emotional_hooks"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 2,
      max: 5,
      optimal: [3, 4],
      description: 'Stacked pull quote testimonials'
    }
  },

  // UniqueMechanism Section
  MethodologyBreakdown: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "methodology_name", mandatory: true, generation: "manual_preferred" },
      { element: "methodology_description", mandatory: true, generation: "ai_generated" },
      { element: "results_title", mandatory: false, generation: "ai_generated" },
      { element: "methodology_icon", mandatory: false, generation: "ai_generated" },
      { element: "result_metrics", mandatory: false, generation: "ai_generated" },
      { element: "result_labels", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["principles", "principle_details", "principle_icons"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [3, 4],
      description: 'Methodology breakdown steps'
    }
  },

  ProcessFlowDiagram: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "benefits_title", mandatory: false, generation: "ai_generated" },
      { element: "process_steps", mandatory: true, generation: "ai_generated" },
      { element: "step_descriptions", mandatory: true, generation: "ai_generated" },
      { element: "benefit_titles", mandatory: false, generation: "ai_generated" },
      { element: "benefit_descriptions", mandatory: false, generation: "ai_generated" },
      { element: "benefit_icons", mandatory: false, generation: "ai_generated" }
    ],
    cardRequirements: {
      type: 'blocks',
      min: 1,
      max: 1,
      optimal: [1, 1],
      description: 'Single process flow diagram'
    }
  },

  PropertyComparisonMatrix: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "feature_header", mandatory: true, generation: "ai_generated" },
      { element: "us_header", mandatory: true, generation: "manual_preferred" },
      { element: "competitors_header", mandatory: true, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "rows",
      elements: ["properties", "us_values", "competitors_values", "property_icons"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'rows',
      min: 3,
      max: 8,
      optimal: [4, 6],
      description: 'Property comparison matrix rows'
    }
  },

  SecretSauceReveal: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["secret_titles", "secret_descriptions", "secret_icons"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 2,
      max: 4,
      optimal: [3, 3],
      description: 'Secret sauce feature reveals'
    }
  },

  StackedHighlights: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "mechanism_name", mandatory: false, generation: "manual_preferred" },
      { element: "footer_text", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["highlight_titles", "highlight_descriptions", "highlight_icons"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 2,
      max: 6,
      optimal: [3, 4],
      description: 'Unique mechanism highlight cards'
    }
  },

  TechnicalAdvantage: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["advantage_titles", "advantage_descriptions", "advantage_icons"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [3, 4],
      description: 'Technical advantage points'
    }
  },

  // UseCase Section
  IndustryUseCaseGrid: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["industry_names", "use_case_descriptions", "industry_icons"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [4, 6],
      description: 'Industry-specific use cases with examples'
    }
  },

  PersonaGrid: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "footer_text", mandatory: false, generation: "ai_generated" },
      { element: "badge_text", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["persona_names", "persona_descriptions", "persona_icons"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 2,
      max: 6,
      optimal: [3, 4],
      description: 'User persona cards with descriptions and roles'
    }
  },

  RoleBasedScenarios: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["roles", "scenarios", "role_icons"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [4, 6],
      description: 'Role-based scenarios and use cases'
    }
  },

  // CTA Section
  CenteredHeadlineCTA: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "secondary_cta_text", mandatory: false, generation: "ai_generated" },
      { element: "urgency_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_1", mandatory: true, generation: "ai_generated" },
      { element: "trust_item_2", mandatory: true, generation: "ai_generated" },
      { element: "trust_item_3", mandatory: true, generation: "ai_generated" },
      { element: "trust_item_4", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_5", mandatory: false, generation: "ai_generated" },
      { element: "customer_count", mandatory: false, generation: "manual_preferred" },
      { element: "customer_label", mandatory: false, generation: "manual_preferred" },
      { element: "rating_stat", mandatory: false, generation: "manual_preferred" },
      { element: "uptime_stat", mandatory: false, generation: "manual_preferred" },
      { element: "uptime_label", mandatory: false, generation: "manual_preferred" }
    ],

    cardRequirements: null
  },

  VisualCTAWithMockup: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "secondary_cta", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_1", mandatory: true, generation: "ai_generated" },
      { element: "trust_item_2", mandatory: true, generation: "ai_generated" },
      { element: "trust_item_3", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_4", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_5", mandatory: false, generation: "ai_generated" },
      { element: "mockup_image", mandatory: false, generation: "manual_preferred" }
    ],

    cardRequirements: null
  },

  ValueStackCTA: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "secondary_cta_text", mandatory: false, generation: "ai_generated" },
      { element: "final_cta_headline", mandatory: true, generation: "ai_generated" },
      { element: "final_cta_description", mandatory: true, generation: "ai_generated" },
      { element: "guarantee_text", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["value_propositions", "value_descriptions", "value_icon_1", "value_icon_2", "value_icon_3", "value_icon_4", "value_icon_5", "value_icon_6"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [4, 5],
      description: 'Value propositions with icons and detailed descriptions'
    }
  },

  // Header Section
  MinimalNavHeader: {
    sectionElements: [
      { element: "nav_item_1", mandatory: true, generation: "manual_preferred" },
      { element: "nav_item_2", mandatory: false, generation: "manual_preferred" },
      { element: "nav_item_3", mandatory: false, generation: "manual_preferred" },
      { element: "nav_item_4", mandatory: false, generation: "manual_preferred" },
      { element: "nav_link_1", mandatory: false, generation: "manual_preferred" },
      { element: "nav_link_2", mandatory: false, generation: "manual_preferred" },
      { element: "nav_link_3", mandatory: false, generation: "manual_preferred" },
      { element: "nav_link_4", mandatory: false, generation: "manual_preferred" }
    ],
    cardRequirements: null
  },

  // Footer Section
  ContactFooter: {
    sectionElements: [
      { element: "copyright", mandatory: true, generation: "manual_preferred" },
      { element: "newsletter_title", mandatory: false, generation: "ai_generated" },
      { element: "newsletter_description", mandatory: false, generation: "ai_generated" },
      { element: "newsletter_cta", mandatory: false, generation: "ai_generated" },
      { element: "email", mandatory: false, generation: "manual_preferred" },
      { element: "phone", mandatory: false, generation: "manual_preferred" },
      { element: "address", mandatory: false, generation: "manual_preferred" },
      { element: "link_text_1", mandatory: false, generation: "manual_preferred" },
      { element: "link_1", mandatory: false, generation: "manual_preferred" },
      { element: "link_text_2", mandatory: false, generation: "manual_preferred" },
      { element: "link_2", mandatory: false, generation: "manual_preferred" },
      { element: "link_text_3", mandatory: false, generation: "manual_preferred" },
      { element: "link_3", mandatory: false, generation: "manual_preferred" },
      { element: "link_text_4", mandatory: false, generation: "manual_preferred" },
      { element: "link_4", mandatory: false, generation: "manual_preferred" }
    ],
    cardRequirements: null
  },
}
