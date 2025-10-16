interface LayoutElement {
  element: string;
  mandatory: boolean;
  generation?: 'ai_generated' | 'manual_preferred' | 'hybrid';
}

interface CardStructure {
  type: 'cards' | 'pairs' | 'items' | 'blocks' | 'steps' | 'triplets' | 'quadruplets' | 'sextuplets' | 'tabbed_pairs' | 'rows' | 'usage_based';
  elements: string[];  // All card elements are mandatory by default
  generation: 'ai_generated' | 'manual_preferred' | 'hybrid';
}

interface CardRequirements {
  type: string;
  min: number;
  max: number;
  optimal: [number, number];
  description: string;
  respectUserContent?: boolean; // Prioritize user-provided features
}

interface UnifiedLayoutElement {
  sectionElements: LayoutElement[];
  cardStructure?: CardStructure;
  cardRequirements: CardRequirements | null;
}

interface LayoutSchema {
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

  BeforeAfterSlider: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "before_label", mandatory: true, generation: "ai_generated" },
      { element: "after_label", mandatory: true, generation: "ai_generated" },
      { element: "before_description", mandatory: true, generation: "ai_generated" },
      { element: "after_description", mandatory: true, generation: "ai_generated" },
      { element: "before_visual", mandatory: false, generation: "manual_preferred" },
      { element: "after_visual", mandatory: false, generation: "manual_preferred" },
      { element: "before_placeholder_text", mandatory: false, generation: "ai_generated" },
      { element: "after_placeholder_text", mandatory: false, generation: "ai_generated" },
      { element: "interaction_hint_text", mandatory: false, generation: "ai_generated" },
      { element: "show_interaction_hint", mandatory: false, generation: "ai_generated" },
      { element: "before_icon", mandatory: false, generation: "ai_generated" },
      { element: "after_icon", mandatory: false, generation: "ai_generated" },
      { element: "hint_icon", mandatory: false, generation: "ai_generated" },
      { element: "slider_instruction", mandatory: false, generation: "ai_generated" },
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
      description: 'Interactive before/after slider'
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

  TextListTransformation: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "before_label", mandatory: true, generation: "ai_generated" },
      { element: "after_label", mandatory: true, generation: "ai_generated" },
      { element: "transformation_text", mandatory: false, generation: "ai_generated" },
      { element: "before_icon", mandatory: false, generation: "ai_generated" },
      { element: "after_icon", mandatory: false, generation: "ai_generated" },
      { element: "transformation_icon", mandatory: false, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["before_list", "after_list"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 8,
      optimal: [4, 5],
      description: 'Before/after list transformation with multiple items'
    }
  },

  VisualStoryline: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "step1_title", mandatory: true, generation: "ai_generated" },
      { element: "step1_description", mandatory: true, generation: "ai_generated" },
      { element: "step1_visual", mandatory: false, generation: "manual_preferred" },
      { element: "step2_title", mandatory: true, generation: "ai_generated" },
      { element: "step2_description", mandatory: true, generation: "ai_generated" },
      { element: "step2_visual", mandatory: false, generation: "manual_preferred" },
      { element: "step3_title", mandatory: true, generation: "ai_generated" },
      { element: "step3_description", mandatory: true, generation: "ai_generated" },
      { element: "step3_visual", mandatory: false, generation: "manual_preferred" },
      { element: "journey_summary_title", mandatory: false, generation: "ai_generated" },
      { element: "journey_summary_description", mandatory: false, generation: "ai_generated" },
      { element: "show_journey_summary", mandatory: false, generation: "ai_generated" },
      { element: "step_connector_icon", mandatory: false, generation: "ai_generated" },
      { element: "summary_icon_1", mandatory: false, generation: "ai_generated" },
      { element: "summary_icon_2", mandatory: false, generation: "ai_generated" },
      { element: "summary_icon_3", mandatory: false, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" }
    ],
    cardRequirements: {
      type: 'steps',
      min: 3,
      max: 5,
      optimal: [3, 3],
      description: 'Multi-step transformation journey with visuals'
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

  BeforeAfterStats: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "time_period", mandatory: false, generation: "ai_generated" },
      { element: "footer_text", mandatory: false, generation: "ai_generated" },
      { element: "before_icon", mandatory: true, generation: "ai_generated" },
      { element: "after_icon", mandatory: true, generation: "ai_generated" },
      { element: "improvement_icon", mandatory: true, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "pairs",
      elements: ["stat_metrics", "stat_before", "stat_after", "stat_improvements"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'pairs',
      min: 2,
      max: 4,
      optimal: [3, 3],
      description: 'Before/after statistics pairs'
    }
  },

  QuoteWithMetric: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "footer_text", mandatory: false, generation: "ai_generated" },
      { element: "quote_icon", mandatory: true, generation: "ai_generated" },
      { element: "credibility_icon", mandatory: true, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["quotes", "authors", "companies", "roles", "metric_labels", "metric_values"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 2,
      max: 5,
      optimal: [3, 4],
      description: 'Testimonial quotes with metrics'
    }
  },

  EmojiOutcomeGrid: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "footer_text", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["emojis", "outcomes", "descriptions"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 4,
      max: 8,
      optimal: [6, 6],
      description: 'Emoji-based outcome grid'
    }
  },

  TimelineResults: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "timeline_period", mandatory: false, generation: "ai_generated" },
      { element: "success_title", mandatory: false, generation: "ai_generated" },
      { element: "success_subtitle", mandatory: false, generation: "ai_generated" },
      { element: "metric_icon", mandatory: true, generation: "ai_generated" },
      { element: "timeline_icon", mandatory: true, generation: "ai_generated" },
      { element: "success_icon", mandatory: true, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["timeframes", "titles", "descriptions", "metrics"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 2,
      max: 8,
      optimal: [4, 5],
      description: 'Timeline of results/achievements'
    }
  },

  OutcomeIcons: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "layout_style", mandatory: false, generation: "ai_generated" },
      { element: "footer_text", mandatory: false, generation: "ai_generated" },
      { element: "icon_1", mandatory: true, generation: "ai_generated" },
      { element: "icon_2", mandatory: true, generation: "ai_generated" },
      { element: "icon_3", mandatory: true, generation: "ai_generated" },
      { element: "icon_4", mandatory: true, generation: "ai_generated" },
      { element: "icon_5", mandatory: true, generation: "ai_generated" },
      { element: "icon_6", mandatory: true, generation: "ai_generated" },
      { element: "icon_7", mandatory: true, generation: "ai_generated" },
      { element: "icon_8", mandatory: true, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["titles", "descriptions"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 8,
      optimal: [4, 6],
      description: 'Outcome icons with descriptions'
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

  PersonaResultPanels: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "footer_text", mandatory: false, generation: "ai_generated" },
      { element: "persona_icon_1", mandatory: true, generation: "ai_generated" },
      { element: "persona_icon_2", mandatory: true, generation: "ai_generated" },
      { element: "persona_icon_3", mandatory: true, generation: "ai_generated" },
      { element: "persona_icon_4", mandatory: true, generation: "ai_generated" },
      { element: "persona_icon_5", mandatory: true, generation: "ai_generated" },
      { element: "persona_icon_6", mandatory: true, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["personas", "roles", "result_metrics", "result_descriptions", "key_benefits"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 2,
      max: 6,
      optimal: [3, 4],
      description: 'Persona-specific result panels'
    }
  },

  // Security Section
  // Security Section - Using actual component names
  AuditResultsPanel: [
    { element: "headline", mandatory: true },
    { element: "audit_titles", mandatory: true },
    { element: "audit_descriptions", mandatory: true },
    { element: "auditor_names", mandatory: true },
    { element: "audit_dates", mandatory: false },
  ],

  PenetrationTestResults: [
    { element: "headline", mandatory: true },
    { element: "test_categories", mandatory: true },
    { element: "test_results", mandatory: true },
    { element: "test_descriptions", mandatory: false },
    { element: "test_dates", mandatory: false },
  ],

  PrivacyCommitmentBlock: [
    { element: "headline", mandatory: true },
    { element: "policy_titles", mandatory: true },
    { element: "policy_summaries", mandatory: true },
    { element: "policy_details", mandatory: false },
    { element: "expand_labels", mandatory: false },
  ],

  SecurityFeatureCards: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["security_features", "feature_descriptions"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 4,
      max: 10,
      optimal: [6, 8],
      description: 'Security feature cards with detailed descriptions'
    }
  },

  SecurityChecklist: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "compliance_note", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["security_items", "item_descriptions"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 12,
      optimal: [6, 8],
      description: 'Security checklist items with optional descriptions'
    }
  },

  SecurityGuaranteePanel: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "guarantee_text", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["security_guarantees"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 8,
      optimal: [4, 6],
      description: 'Security guarantees and SLA promises'
    }
  },

  TrustSealCollection: [
    { element: "headline", mandatory: true },
    { element: "compliance_names", mandatory: true },
    { element: "badge_descriptions", mandatory: false },
    { element: "subheadline", mandatory: false },
  ],

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

  MediaMentions: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "testimonial_quotes", mandatory: false, generation: "ai_generated" },
      { element: "logo_urls", mandatory: false, generation: "manual_preferred" }
    ],
    cardStructure: {
      type: "items",
      elements: ["media_outlets"],
      generation: "manual_preferred"
    },
    cardRequirements: {
      type: 'items',
      min: 3,
      max: 8,
      optimal: [4, 6],
      description: 'Media mention logos'
    }
  },

  UserCountBar: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "users_joined_text", mandatory: false, generation: "ai_generated" },
      { element: "rating_value", mandatory: false, generation: "ai_generated" },
      { element: "rating_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_1", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_2", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_3", mandatory: false, generation: "ai_generated" },
      { element: "customer_names", mandatory: false, generation: "manual_preferred" },
      { element: "avatar_urls", mandatory: false, generation: "manual_preferred" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["user_metrics", "metric_labels", "growth_indicators"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 1,
      max: 3,
      optimal: [2, 2],
      description: 'User count metric cards'
    }
  },

  IndustryBadgeLine: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "cert_icon_override", mandatory: false, generation: "ai_generated" },
      { element: "award_icon_override", mandatory: false, generation: "ai_generated" },
      { element: "compliance_icon_override", mandatory: false, generation: "ai_generated" },
      { element: "cert_section_title", mandatory: false, generation: "ai_generated" },
      { element: "award_section_title", mandatory: false, generation: "ai_generated" },
      { element: "compliance_section_title", mandatory: false, generation: "ai_generated" },
      { element: "trust_summary_title", mandatory: false, generation: "ai_generated" },
      { element: "trust_summary_description", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "items",
      elements: ["certification_badges", "industry_awards", "compliance_standards"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'items',
      min: 3,
      max: 8,
      optimal: [4, 6],
      description: 'Industry badge certifications'
    }
  },

  MapHeatSpots: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "countries_list", mandatory: false, generation: "manual_preferred" },
      { element: "countries_title", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "items",
      elements: ["global_stats", "stat_labels"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'items',
      min: 5,
      max: 15,
      optimal: [8, 12],
      description: 'Geographic usage heat spots'
    }
  },

  StackedStats: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "metric_icon_1", mandatory: false, generation: "ai_generated" },
      { element: "metric_icon_2", mandatory: false, generation: "ai_generated" },
      { element: "metric_icon_3", mandatory: false, generation: "ai_generated" },
      { element: "metric_icon_4", mandatory: false, generation: "ai_generated" },
      { element: "metric_icon_5", mandatory: false, generation: "ai_generated" },
      { element: "metric_icon_6", mandatory: false, generation: "ai_generated" },
      { element: "summary_title", mandatory: false, generation: "ai_generated" },
      { element: "summary_description", mandatory: false, generation: "ai_generated" },
      { element: "customer_satisfaction_value", mandatory: false, generation: "ai_generated" },
      { element: "customer_satisfaction_label", mandatory: false, generation: "ai_generated" },
      { element: "response_time_value", mandatory: false, generation: "ai_generated" },
      { element: "response_time_label", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["metric_values", "metric_labels", "metric_descriptions"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [4, 6],
      description: 'Stacked social proof metrics'
    }
  },

  StripWithReviews: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "review_text_1", mandatory: false, generation: "ai_generated" },
      { element: "review_text_2", mandatory: false, generation: "ai_generated" },
      { element: "review_text_3", mandatory: false, generation: "ai_generated" },
      { element: "review_text_4", mandatory: false, generation: "ai_generated" },
      { element: "reviewer_name_1", mandatory: false, generation: "manual_preferred" },
      { element: "reviewer_name_2", mandatory: false, generation: "manual_preferred" },
      { element: "reviewer_name_3", mandatory: false, generation: "manual_preferred" },
      { element: "reviewer_name_4", mandatory: false, generation: "manual_preferred" },
      { element: "reviewer_title_1", mandatory: false, generation: "ai_generated" },
      { element: "reviewer_title_2", mandatory: false, generation: "ai_generated" },
      { element: "reviewer_title_3", mandatory: false, generation: "ai_generated" },
      { element: "reviewer_title_4", mandatory: false, generation: "ai_generated" },
      { element: "rating_1", mandatory: false, generation: "ai_generated" },
      { element: "rating_2", mandatory: false, generation: "ai_generated" },
      { element: "rating_3", mandatory: false, generation: "ai_generated" },
      { element: "rating_4", mandatory: false, generation: "ai_generated" },
      { element: "overall_rating_value", mandatory: false, generation: "ai_generated" },
      { element: "overall_rating_text", mandatory: false, generation: "ai_generated" },
      { element: "total_reviews_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_indicator_1", mandatory: false, generation: "ai_generated" },
      { element: "trust_indicator_2", mandatory: false, generation: "ai_generated" },
      { element: "trust_indicator_3", mandatory: false, generation: "ai_generated" },
      { element: "trust_icon_1", mandatory: false, generation: "ai_generated" },
      { element: "trust_icon_2", mandatory: false, generation: "ai_generated" },
      { element: "trust_icon_3", mandatory: false, generation: "ai_generated" },
      { element: "customer_names", mandatory: false, generation: "manual_preferred" },
      { element: "avatar_urls", mandatory: false, generation: "manual_preferred" },
      { element: "avatar_count", mandatory: false, generation: "manual_preferred" },
      { element: "show_customer_avatars", mandatory: false, generation: "manual_preferred" }
    ],
    cardStructure: {
      type: "items",
      elements: ["reviews", "reviewer_names", "reviewer_titles", "ratings"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'items',
      min: 3,
      max: 6,
      optimal: [4, 5],
      description: 'Review strip items'
    }
  },

  SocialProofStrip: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "company_logos", mandatory: false, generation: "manual_preferred" },
      { element: "logo_urls", mandatory: false, generation: "manual_preferred" },
      { element: "trust_badge_1", mandatory: false, generation: "ai_generated" },
      { element: "trust_badge_2", mandatory: false, generation: "ai_generated" },
      { element: "trust_badge_3", mandatory: false, generation: "ai_generated" },
      { element: "rating_display", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "items",
      elements: ["proof_stats", "stat_labels", "company_names"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'items',
      min: 4,
      max: 10,
      optimal: [6, 8],
      description: 'Social proof strip elements'
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

  SegmentedTestimonials: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "segments_trust_title", mandatory: false, generation: "ai_generated" },
      { element: "enterprise_stat", mandatory: false, generation: "manual_preferred" },
      { element: "enterprise_label", mandatory: false, generation: "ai_generated" },
      { element: "agencies_stat", mandatory: false, generation: "manual_preferred" },
      { element: "agencies_label", mandatory: false, generation: "ai_generated" },
      { element: "small_business_stat", mandatory: false, generation: "manual_preferred" },
      { element: "small_business_label", mandatory: false, generation: "ai_generated" },
      { element: "dev_teams_stat", mandatory: false, generation: "manual_preferred" },
      { element: "dev_teams_label", mandatory: false, generation: "ai_generated" },
      { element: "segment_icon_1", mandatory: true, generation: "ai_generated" },
      { element: "segment_icon_2", mandatory: true, generation: "ai_generated" },
      { element: "segment_icon_3", mandatory: true, generation: "ai_generated" },
      { element: "segment_icon_4", mandatory: true, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["segment_names", "segment_descriptions", "testimonial_quotes", "customer_names", "customer_titles", "customer_companies", "use_cases", "ratings"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 8,
      optimal: [4, 6],
      description: 'Segmented testimonial categories'
    }
  },

  RatingCards: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "avatar_urls", mandatory: false, generation: "manual_preferred" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["testimonial_quotes", "customer_names", "customer_titles", "ratings", "review_platforms", "review_dates", "verified_badges", "customer_locations"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 8,
      optimal: [6, 6],
      description: 'Testimonial rating cards'
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

  InteractiveTestimonialMap: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "community_features_title", mandatory: false, generation: "ai_generated" },
      { element: "global_reach_title", mandatory: false, generation: "ai_generated" },
      { element: "global_reach_stat", mandatory: false, generation: "manual_preferred" },
      { element: "currency_title", mandatory: false, generation: "ai_generated" },
      { element: "currency_description", mandatory: false, generation: "ai_generated" },
      { element: "support_title", mandatory: false, generation: "ai_generated" },
      { element: "support_description", mandatory: false, generation: "ai_generated" },
      { element: "collaboration_title", mandatory: false, generation: "ai_generated" },
      { element: "collaboration_description", mandatory: false, generation: "ai_generated" },
      { element: "global_reach_icon", mandatory: false, generation: "ai_generated" },
      { element: "currency_icon", mandatory: false, generation: "ai_generated" },
      { element: "support_icon", mandatory: false, generation: "ai_generated" },
      { element: "collaboration_icon", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["testimonial_quotes", "customer_names", "customer_locations", "customer_countries", "customer_titles", "testimonial_categories", "ratings"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 8,
      optimal: [4, 6],
      description: 'Interactive testimonial map cards'
    }
  },

  // UniqueMechanism Section - Updated to match actual component implementations
  AlgorithmExplainer: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "algorithm_name", mandatory: true, generation: "manual_preferred" },
      { element: "algorithm_description", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["algorithm_steps", "step_descriptions"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 5,
      optimal: [3, 4],
      description: 'Algorithm step explanations'
    }
  },

  InnovationTimeline: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "timeline_subtitle", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "items",
      elements: ["timeline_dates", "timeline_events", "timeline_descriptions", "timeline_icons"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'items',
      min: 3,
      max: 7,
      optimal: [4, 5],
      description: 'Innovation timeline milestones'
    }
  },

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

  SystemArchitecture: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "architecture_description", mandatory: false, generation: "ai_generated" },
      { element: "component_names", mandatory: true, generation: "ai_generated" },
      { element: "component_descriptions", mandatory: true, generation: "ai_generated" },
      { element: "component_icons", mandatory: false, generation: "ai_generated" }
    ],
    cardRequirements: {
      type: 'blocks',
      min: 1,
      max: 1,
      optimal: [1, 1],
      description: 'Single system architecture diagram'
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

  // UseCase Section - Unified schema transformations following elementTransform.md SOP
  BeforeAfterWorkflow: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "before_title", mandatory: false, generation: "ai_generated" },
      { element: "after_title", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["before_steps", "after_steps", "before_icons", "after_icons"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 2,
      max: 6,
      optimal: [3, 4],
      description: 'Before/after workflow comparison steps'
    }
  },

  CustomerJourneyFlow: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "footer_title", mandatory: false, generation: "ai_generated" },
      { element: "footer_description", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["journey_stages", "stage_descriptions", "stage_icons"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [4, 5],
      description: 'Customer journey stages with descriptions'
    }
  },

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

  InteractiveUseCaseMap: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["category_names", "use_case_descriptions", "category_icons"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [4, 6],
      description: 'Interactive use case categories with descriptions'
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

  UseCaseCarousel: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "use_case_description", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["use_case_titles", "usecase_icons"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [4, 6],
      description: 'Scrollable use case carousel with icons'
    }
  },

  WorkflowDiagrams: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["workflow_steps", "step_icons"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [4, 5],
      description: 'Workflow process steps with visual icons'
    }
  },

  JobToBeDoneList: [
    { element: "headline", mandatory: true },
    { element: "job_titles", mandatory: true },
    { element: "job_descriptions", mandatory: true },
    { element: "solution_approaches", mandatory: false },
  ],

  StatComparison: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "before_label", mandatory: true, generation: "ai_generated" },
      { element: "after_label", mandatory: true, generation: "ai_generated" },
      { element: "improvement_text", mandatory: false, generation: "ai_generated" },
      { element: "summary_title", mandatory: false, generation: "ai_generated" },
      { element: "show_summary_section", mandatory: false, generation: "ai_generated" },
      { element: "improvement_icon", mandatory: false, generation: "ai_generated" },
      { element: "flow_icon", mandatory: false, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "summary_stat_values", mandatory: false, generation: "ai_generated" },
      { element: "summary_stat_labels", mandatory: false, generation: "ai_generated" },
      { element: "stat_icons", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["before_stats", "after_stats"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 4,
      max: 8,
      optimal: [4, 6],
      description: 'Statistical before/after comparison with metrics'
    }
  },

  PersonaJourney: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "persona_name", mandatory: true, generation: "ai_generated" },
      { element: "persona_role", mandatory: false, generation: "ai_generated" },
      { element: "persona_company", mandatory: false, generation: "ai_generated" },
      { element: "before_title", mandatory: true, generation: "ai_generated" },
      { element: "before_challenges", mandatory: true, generation: "ai_generated" },
      { element: "journey_title", mandatory: false, generation: "ai_generated" },
      { element: "journey_description", mandatory: false, generation: "ai_generated" },
      { element: "after_title", mandatory: true, generation: "ai_generated" },
      { element: "after_outcomes", mandatory: true, generation: "ai_generated" },
      { element: "after_benefits", mandatory: false, generation: "ai_generated" },
      { element: "summary_title", mandatory: false, generation: "ai_generated" },
      { element: "summary_description", mandatory: false, generation: "ai_generated" },
      { element: "show_summary_section", mandatory: false, generation: "ai_generated" },
      { element: "persona_avatar", mandatory: false, generation: "manual_preferred" },
      { element: "before_icon", mandatory: false, generation: "ai_generated" },
      { element: "journey_icon", mandatory: false, generation: "ai_generated" },
      { element: "after_icon", mandatory: false, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "steps",
      elements: ["before_pain_points", "journey_steps", "summary_labels"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'steps',
      min: 3,
      max: 6,
      optimal: [4, 5],
      description: 'Persona transformation journey with pain points and outcomes'
    }
  },

  // Close Section
  MockupWithCTA: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "urgency_text", mandatory: false, generation: "ai_generated" },
      { element: "guarantee_text", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" }
    ],
    cardRequirements: null
  },

  BonusStackCTA: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "value_proposition", mandatory: true, generation: "ai_generated" },
      { element: "main_offer", mandatory: true, generation: "ai_generated" },
      { element: "total_value", mandatory: true, generation: "ai_generated" },
      { element: "discount_amount", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "urgency_text", mandatory: false, generation: "ai_generated" },
      { element: "guarantee_text", mandatory: false, generation: "ai_generated" },
      { element: "scarcity_text", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_1", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_2", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_3", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_4", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_5", mandatory: false, generation: "ai_generated" },
      { element: "main_offer_badge", mandatory: false, generation: "ai_generated" },
      { element: "bonus_badge", mandatory: false, generation: "ai_generated" },
      { element: "bonus_description", mandatory: false, generation: "ai_generated" },
      { element: "total_value_label", mandatory: false, generation: "ai_generated" },
      { element: "final_cta_title", mandatory: false, generation: "ai_generated" },
      { element: "final_cta_description", mandatory: false, generation: "ai_generated" },
      { element: "social_proof_footer_text", mandatory: false, generation: "ai_generated" },
      { element: "bonus_check_icon", mandatory: true, generation: "ai_generated" },
      { element: "urgency_icon", mandatory: false, generation: "ai_generated" },
      { element: "scarcity_icon", mandatory: false, generation: "ai_generated" },
      { element: "guarantee_icon", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "items",
      elements: ["bonus_items", "bonus_values"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'items',
      min: 3,
      max: 6,
      optimal: [4, 5],
      description: 'Bonus stack items with values'
    }
  },

  LeadMagnetCard: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "magnet_title", mandatory: true, generation: "ai_generated" },
      { element: "magnet_description", mandatory: true, generation: "ai_generated" },
      { element: "form_labels", mandatory: false, generation: "ai_generated" },
      { element: "privacy_text", mandatory: false, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" }
    ],
    cardRequirements: null
  },

  EnterpriseContactBox: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "value_proposition", mandatory: true, generation: "ai_generated" },
      { element: "cta_primary", mandatory: true, generation: "ai_generated" },
      { element: "cta_secondary", mandatory: false, generation: "ai_generated" },
      { element: "availability_text", mandatory: false, generation: "ai_generated" },
      { element: "team_size_text", mandatory: false, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "calendar_icon", mandatory: false, generation: "ai_generated" },
      { element: "demo_icon", mandatory: false, generation: "ai_generated" },
      { element: "quote_icon", mandatory: false, generation: "ai_generated" },
      { element: "download_icon", mandatory: false, generation: "ai_generated" },
      { element: "response_time_icon", mandatory: false, generation: "ai_generated" },
      { element: "enterprise_check_icon", mandatory: false, generation: "ai_generated" },
      { element: "qualification_check_icon", mandatory: false, generation: "ai_generated" },
      { element: "social_proof_icon", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["contact_options", "contact_descriptions", "response_times", "enterprise_features", "qualification_points"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [4, 4],
      description: 'Enterprise contact options with features'
    }
  },

  ValueReinforcementBlock: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "primary_value", mandatory: true, generation: "ai_generated" },
      { element: "transformation_title", mandatory: false, generation: "ai_generated" },
      { element: "transformation_description", mandatory: false, generation: "ai_generated" },
      { element: "social_proof_title", mandatory: false, generation: "ai_generated" },
      { element: "final_cta_title", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "urgency_text", mandatory: false, generation: "ai_generated" },
      { element: "risk_reversal", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_1", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_2", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_3", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_4", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_5", mandatory: false, generation: "ai_generated" },
      { element: "trending_up_icon", mandatory: false, generation: "ai_generated" },
      { element: "dollar_sign_icon", mandatory: false, generation: "ai_generated" },
      { element: "automation_icon", mandatory: false, generation: "ai_generated" },
      { element: "users_icon", mandatory: false, generation: "ai_generated" },
      { element: "chart_bar_icon", mandatory: false, generation: "ai_generated" },
      { element: "integration_icon", mandatory: false, generation: "ai_generated" },
      { element: "before_cross_icon", mandatory: false, generation: "ai_generated" },
      { element: "after_check_icon", mandatory: false, generation: "ai_generated" },
      { element: "arrow_icon", mandatory: false, generation: "ai_generated" },
      { element: "urgency_clock_icon", mandatory: false, generation: "ai_generated" },
      { element: "guarantee_shield_icon", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "items",
      elements: ["value_points", "value_icons", "transformation_before", "transformation_after", "social_proof_stats", "social_proof_labels"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'items',
      min: 3,
      max: 8,
      optimal: [4, 6],
      description: 'Value reinforcement points with transformation elements'
    }
  },

  LivePreviewEmbed: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "preview_description", mandatory: true, generation: "ai_generated" },
      { element: "instruction_text", mandatory: false, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" }
    ],
    cardRequirements: null
  },

  SideBySideOfferCards: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "comparison_note", mandatory: false, generation: "ai_generated" },
      { element: "guarantee_text", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "feature_check_icon", mandatory: true, generation: "ai_generated" },
      { element: "feature_unavailable_icon", mandatory: true, generation: "ai_generated" },
      { element: "info_icon", mandatory: false, generation: "ai_generated" },
      { element: "guarantee_shield_icon", mandatory: false, generation: "ai_generated" },
      { element: "proven_icon", mandatory: false, generation: "ai_generated" },
      { element: "setup_icon", mandatory: false, generation: "ai_generated" },
      { element: "support_icon", mandatory: false, generation: "ai_generated" },
      { element: "security_icon", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["offer_titles", "offer_descriptions", "offer_prices", "offer_features", "offer_ctas", "offer_badges", "offer_highlights"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 2,
      max: 4,
      optimal: [2, 3],
      description: 'Offer comparison cards with features and pricing'
    }
  },

  MultistepCTAStack: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "final_cta", mandatory: true, generation: "ai_generated" },
      { element: "process_note", mandatory: false, generation: "ai_generated" },
      { element: "guarantee_text", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "step_1_icon", mandatory: false, generation: "ai_generated" },
      { element: "step_2_icon", mandatory: false, generation: "ai_generated" },
      { element: "step_3_icon", mandatory: false, generation: "ai_generated" },
      { element: "time_icon", mandatory: false, generation: "ai_generated" },
      { element: "detail_check_icon", mandatory: true, generation: "ai_generated" },
      { element: "benefit_check_icon", mandatory: false, generation: "ai_generated" },
      { element: "quick_setup_icon", mandatory: false, generation: "ai_generated" },
      { element: "guided_icon", mandatory: false, generation: "ai_generated" },
      { element: "user_friendly_icon", mandatory: false, generation: "ai_generated" },
      { element: "support_icon", mandatory: false, generation: "ai_generated" },
      { element: "info_icon", mandatory: false, generation: "ai_generated" },
      { element: "guarantee_icon", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "steps",
      elements: ["step_titles", "step_descriptions", "step_details", "step_ctas", "completion_times", "step_benefits"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'steps',
      min: 3,
      max: 5,
      optimal: [3, 3],
      description: 'Multistep process steps with details and CTAs'
    }
  },

  // Comparison Section
  BasicFeatureGrid: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "your_product_name", mandatory: true, generation: "manual_preferred" }
    ],
    cardStructure: {
      type: "rows",
      elements: ["feature_names", "competitor_names"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'rows',
      min: 4,
      max: 10,
      optimal: [5, 7],
      description: 'Feature comparison rows'
    }
  },

  CheckmarkComparison: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "highlight_column", mandatory: false, generation: "manual_preferred" }
    ],
    cardStructure: {
      type: "rows",
      elements: ["column_headers", "feature_labels", "column_features"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'rows',
      min: 3,
      max: 8,
      optimal: [4, 6],
      description: 'Checkmark comparison rows'
    }
  },

  CompetitorCallouts: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "trust_badge", mandatory: false, generation: "manual_preferred" },
      { element: "issue_icon_1", mandatory: false, generation: "ai_generated" },
      { element: "issue_icon_2", mandatory: false, generation: "ai_generated" },
      { element: "issue_icon_3", mandatory: false, generation: "ai_generated" },
      { element: "solution_icon_1", mandatory: false, generation: "ai_generated" },
      { element: "solution_icon_2", mandatory: false, generation: "ai_generated" },
      { element: "solution_icon_3", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["competitor_names", "competitor_issues", "our_solution"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 2,
      max: 4,
      optimal: [3, 3],
      description: 'Competitor comparison cards'
    }
  },

  LiteVsProVsEnterprise: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "feature_categories", mandatory: false, generation: "ai_generated" },
      { element: "feature_items", mandatory: false, generation: "ai_generated" },
      { element: "tier_features", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["tier_names", "tier_prices", "tier_descriptions", "tier_ctas"],
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

  PersonaUseCaseCompare: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "persona_icon_1", mandatory: false, generation: "ai_generated" },
      { element: "persona_icon_2", mandatory: false, generation: "ai_generated" },
      { element: "persona_icon_3", mandatory: false, generation: "ai_generated" },
      { element: "persona_icon_4", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["persona_labels", "persona_descriptions", "use_cases", "solutions"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 2,
      max: 5,
      optimal: [3, 4],
      description: 'Persona use case cards'
    }
  },

  ToggleableComparison: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "rows",
      elements: ["option_labels", "feature_categories", "feature_items", "option_features"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'rows',
      min: 4,
      max: 10,
      optimal: [5, 7],
      description: 'Toggleable comparison table'
    }
  },

  AnimatedUpgradePath: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "stage_icons", mandatory: false, generation: "ai_generated" },
      { element: "stage_icon_1", mandatory: false, generation: "ai_generated" },
      { element: "stage_icon_2", mandatory: false, generation: "ai_generated" },
      { element: "stage_icon_3", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["stage_titles", "stage_descriptions"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 5,
      optimal: [3, 4],
      description: 'Upgrade path stages'
    }
  },

  YouVsThemHighlight: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "them_headline", mandatory: true, generation: "ai_generated" },
      { element: "you_headline", mandatory: true, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "rows",
      elements: ["them_points", "you_points"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'rows',
      min: 3,
      max: 8,
      optimal: [4, 6],
      description: 'You vs Them comparison rows'
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
      { element: "expand_icon", mandatory: false, generation: "ai_generated" },
      { element: "collapse_icon", mandatory: false, generation: "ai_generated" },
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

  QuoteStyleAnswers: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "show_quote_mark", mandatory: false, generation: "manual_preferred" },
      { element: "quote_icon", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "quadruplets",
      elements: ["question", "answer", "expert_name", "expert_title"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'items',
      min: 2,
      max: 5,
      optimal: [3, 4],
      description: 'Expert quote-style FAQ answers'
    }
  },

  IconWithAnswers: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "help_text", mandatory: false, generation: "ai_generated" },
      { element: "show_help_section", mandatory: false, generation: "manual_preferred" }
    ],

    cardStructure: {
      type: "triplets",
      elements: ["question", "answer", "icon"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'items',
      min: 3,
      max: 8,
      optimal: [4, 5],
      description: 'Icon-supported Q&A items'
    }
  },

  TestimonialFAQs: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "trust_text", mandatory: false, generation: "ai_generated" },
      { element: "overall_rating", mandatory: false, generation: "ai_generated" },
      { element: "satisfaction_text", mandatory: false, generation: "ai_generated" },
      { element: "show_trust_section", mandatory: false, generation: "manual_preferred" },
      { element: "star_icon", mandatory: false, generation: "ai_generated" },
      { element: "overall_rating_star_icon", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "sextuplets",
      elements: ["question", "answer", "customer_name", "customer_title", "customer_company", "rating"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'items',
      min: 2,
      max: 6,
      optimal: [3, 4],
      description: 'Customer testimonial-based FAQ items'
    }
  },

  ChatBubbleFAQ: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "user_name", mandatory: false, generation: "ai_generated" },
      { element: "support_name", mandatory: false, generation: "ai_generated" },
      { element: "support_avatar", mandatory: false, generation: "manual_preferred" },
      { element: "online_status_text", mandatory: false, generation: "ai_generated" },
      { element: "chat_placeholder", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "button_text", mandatory: false, generation: "ai_generated" },
      { element: "show_typing_indicator", mandatory: false, generation: "manual_preferred" },
      { element: "show_cta_section", mandatory: false, generation: "manual_preferred" },
      { element: "status_indicator_icon", mandatory: false, generation: "ai_generated" },
      { element: "send_icon", mandatory: false, generation: "ai_generated" },
      { element: "support_avatar_icon", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "pairs",
      elements: ["question_1", "answer_1", "question_2", "answer_2", "question_3", "answer_3", "question_4", "answer_4", "question_5", "answer_5"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'items',
      min: 3,
      max: 8,
      optimal: [5, 6],
      description: 'Chat conversation-style FAQ items'
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

  Tabbed: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "tab_icon_1", mandatory: true, generation: "ai_generated" },
      { element: "tab_icon_2", mandatory: true, generation: "ai_generated" },
      { element: "tab_icon_3", mandatory: true, generation: "ai_generated" },
      { element: "tab_icon_4", mandatory: true, generation: "ai_generated" },
      { element: "tab_icon_5", mandatory: true, generation: "ai_generated" },
      { element: "tab_icon_6", mandatory: true, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["tab_labels", "tab_titles", "tab_descriptions"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [3, 4],
      description: 'Tabbed feature cards',
      respectUserContent: true
    }
  },

  Timeline: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "step_benefit_1", mandatory: false, generation: "ai_generated" },
      { element: "step_benefit_2", mandatory: false, generation: "ai_generated" },
      { element: "step_benefit_icon_1", mandatory: true, generation: "ai_generated" },
      { element: "step_benefit_icon_2", mandatory: true, generation: "ai_generated" },
      { element: "process_summary_title", mandatory: false, generation: "ai_generated" },
      { element: "process_summary_description", mandatory: false, generation: "ai_generated" },
      { element: "show_process_summary", mandatory: false, generation: "manual_preferred" },
      { element: "timeline_icon_1", mandatory: true, generation: "ai_generated" },
      { element: "timeline_icon_2", mandatory: true, generation: "ai_generated" },
      { element: "timeline_icon_3", mandatory: true, generation: "ai_generated" },
      { element: "timeline_icon_4", mandatory: true, generation: "ai_generated" },
      { element: "timeline_icon_5", mandatory: true, generation: "ai_generated" },
      { element: "timeline_icon_6", mandatory: true, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["step_numbers", "step_titles", "step_descriptions", "step_durations"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 8,
      optimal: [4, 6],
      description: 'Timeline feature cards',
      respectUserContent: true
    }
  },

  FeatureTestimonial: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "feature_icon_1", mandatory: true, generation: "ai_generated" },
      { element: "feature_icon_2", mandatory: true, generation: "ai_generated" },
      { element: "feature_icon_3", mandatory: true, generation: "ai_generated" },
      { element: "feature_icon_4", mandatory: true, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["feature_titles", "feature_descriptions", "testimonial_quotes", "customer_names", "customer_titles"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 2,
      max: 4,
      optimal: [3, 3],
      description: 'Features with testimonials',
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

  MiniCards: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "summary_item_1", mandatory: false, generation: "ai_generated" },
      { element: "summary_item_2", mandatory: false, generation: "ai_generated" },
      { element: "summary_item_3", mandatory: false, generation: "ai_generated" },
      { element: "show_feature_summary", mandatory: false, generation: "manual_preferred" },
      { element: "feature_icon_1", mandatory: true, generation: "manual_preferred" },
      { element: "feature_icon_2", mandatory: true, generation: "manual_preferred" },
      { element: "feature_icon_3", mandatory: true, generation: "manual_preferred" },
      { element: "feature_icon_4", mandatory: true, generation: "manual_preferred" },
      { element: "feature_icon_5", mandatory: true, generation: "manual_preferred" },
      { element: "feature_icon_6", mandatory: true, generation: "manual_preferred" },
      { element: "feature_icon_7", mandatory: true, generation: "manual_preferred" },
      { element: "feature_icon_8", mandatory: true, generation: "manual_preferred" },
      { element: "feature_icon_9", mandatory: true, generation: "manual_preferred" },
      { element: "feature_icon_10", mandatory: true, generation: "manual_preferred" },
      { element: "feature_icon_11", mandatory: true, generation: "manual_preferred" },
      { element: "feature_icon_12", mandatory: true, generation: "manual_preferred" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["feature_titles", "feature_descriptions", "feature_keywords"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 4,
      max: 12,
      optimal: [6, 8],
      description: 'Mini feature cards',
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

  // FounderNote Section - Unified Schema
  FounderCardWithQuote: {
    sectionElements: [
      { element: "founder_name", mandatory: true, generation: "ai_generated" },
      { element: "founder_title", mandatory: true, generation: "ai_generated" },
      { element: "founder_quote", mandatory: true, generation: "ai_generated" },
      { element: "founder_bio", mandatory: false, generation: "ai_generated" },
      { element: "company_context", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "founder_image", mandatory: false, generation: "manual_preferred" }
    ],
    cardRequirements: null
  },

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

  VideoNoteWithTranscript: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "video_intro", mandatory: true, generation: "ai_generated" },
      { element: "transcript_text", mandatory: true, generation: "ai_generated" },
      { element: "founder_name", mandatory: true, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "video_url", mandatory: false, generation: "manual_preferred" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" }
    ],
    cardRequirements: null
  },

  MissionQuoteOverlay: {
    sectionElements: [
      { element: "mission_quote", mandatory: true, generation: "ai_generated" },
      { element: "founder_name", mandatory: true, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "founder_title", mandatory: false, generation: "ai_generated" },
      { element: "badge_text", mandatory: false, generation: "ai_generated" },
      { element: "badge_icon", mandatory: false, generation: "ai_generated" },
      { element: "mission_year", mandatory: false, generation: "ai_generated" },
      { element: "background_image", mandatory: false, generation: "manual_preferred" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["mission_stats", "mission_stat_1", "mission_stat_2", "mission_stat_3", "mission_stat_4"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 1,
      max: 4,
      optimal: [3, 3],
      description: 'Mission impact statistics'
    }
  },

  TimelineToToday: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "intro_text", mandatory: true, generation: "ai_generated" },
      { element: "current_milestone", mandatory: true, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "founder_name", mandatory: false, generation: "ai_generated" },
      { element: "company_name", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_1", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_2", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_3", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_4", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_5", mandatory: false, generation: "ai_generated" },
      { element: "current_state_heading", mandatory: false, generation: "ai_generated" },
      { element: "current_state_icon", mandatory: false, generation: "ai_generated" },
      { element: "timeline_icon_1", mandatory: false, generation: "ai_generated" },
      { element: "timeline_icon_2", mandatory: false, generation: "ai_generated" },
      { element: "timeline_icon_3", mandatory: false, generation: "ai_generated" },
      { element: "timeline_icon_4", mandatory: false, generation: "ai_generated" },
      { element: "timeline_icon_5", mandatory: false, generation: "ai_generated" },
      { element: "timeline_icon_6", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["timeline_items"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 8,
      optimal: [4, 5],
      description: 'Timeline milestone cards'
    }
  },

  SideBySidePhotoStory: {
    sectionElements: [
      { element: "story_headline", mandatory: true, generation: "ai_generated" },
      { element: "story_text", mandatory: true, generation: "ai_generated" },
      { element: "story_quote", mandatory: true, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "founder_name", mandatory: false, generation: "ai_generated" },
      { element: "badge_text", mandatory: false, generation: "ai_generated" },
      { element: "badge_icon", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_1", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_2", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_3", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_4", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_5", mandatory: false, generation: "ai_generated" },
      { element: "story_image", mandatory: false, generation: "manual_preferred" },
      { element: "secondary_image", mandatory: false, generation: "manual_preferred" },
      { element: "placeholder_icon_1", mandatory: false, generation: "ai_generated" },
      { element: "placeholder_icon_2", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["story_stats", "story_stat_1", "story_stat_2", "story_stat_3", "story_stat_4"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 1,
      max: 4,
      optimal: [3, 4],
      description: 'Story impact statistics'
    }
  },

  StoryBlockWithPullquote: {
    sectionElements: [
      { element: "story_headline", mandatory: true, generation: "ai_generated" },
      { element: "story_intro", mandatory: true, generation: "ai_generated" },
      { element: "story_body", mandatory: true, generation: "ai_generated" },
      { element: "pullquote_text", mandatory: true, generation: "ai_generated" },
      { element: "story_conclusion", mandatory: true, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "founder_name", mandatory: false, generation: "ai_generated" },
      { element: "founder_title", mandatory: false, generation: "ai_generated" },
      { element: "company_name", mandatory: false, generation: "ai_generated" },
      { element: "reading_time", mandatory: false, generation: "ai_generated" },
      { element: "cta_section_heading", mandatory: false, generation: "ai_generated" },
      { element: "cta_section_description", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_1", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_2", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_3", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_4", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_5", mandatory: false, generation: "ai_generated" },
      { element: "founder_image", mandatory: false, generation: "manual_preferred" },
      { element: "quote_icon", mandatory: false, generation: "ai_generated" }
    ],
    cardRequirements: null
  },

  FoundersBeliefStack: {
    sectionElements: [
      { element: "beliefs_headline", mandatory: true, generation: "ai_generated" },
      { element: "beliefs_intro", mandatory: true, generation: "ai_generated" },
      { element: "commitment_text", mandatory: true, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "founder_name", mandatory: false, generation: "ai_generated" },
      { element: "founder_title", mandatory: false, generation: "ai_generated" },
      { element: "company_values", mandatory: false, generation: "ai_generated" },
      { element: "company_value_1", mandatory: false, generation: "ai_generated" },
      { element: "company_value_2", mandatory: false, generation: "ai_generated" },
      { element: "company_value_3", mandatory: false, generation: "ai_generated" },
      { element: "company_value_4", mandatory: false, generation: "ai_generated" },
      { element: "company_value_5", mandatory: false, generation: "ai_generated" },
      { element: "values_heading", mandatory: false, generation: "ai_generated" },
      { element: "show_company_values", mandatory: false, generation: "manual_preferred" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_1", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_2", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_3", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_4", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_5", mandatory: false, generation: "ai_generated" },
      { element: "founder_image", mandatory: false, generation: "manual_preferred" },
      { element: "belief_icon_1", mandatory: false, generation: "ai_generated" },
      { element: "belief_icon_2", mandatory: false, generation: "ai_generated" },
      { element: "belief_icon_3", mandatory: false, generation: "ai_generated" },
      { element: "belief_icon_4", mandatory: false, generation: "ai_generated" },
      { element: "belief_icon_5", mandatory: false, generation: "ai_generated" },
      { element: "belief_icon_6", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["belief_items"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 2,
      max: 8,
      optimal: [3, 4],
      description: 'Founder belief and value cards'
    }
  },

  // Hero Section
  leftCopyRightImage: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
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
      { element: "process_steps_label", mandatory: false, generation: "ai_generated" },
      { element: "process_summary_heading", mandatory: false, generation: "ai_generated" },
      { element: "process_summary_description", mandatory: false, generation: "ai_generated" },
      { element: "process_time_label", mandatory: false, generation: "ai_generated" },
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

  IconCircleSteps: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "step_labels", mandatory: false, generation: "ai_generated" },
      { element: "circle_feature_1_text", mandatory: false, generation: "ai_generated" },
      { element: "circle_feature_2_text", mandatory: false, generation: "ai_generated" },
      { element: "circle_feature_3_text", mandatory: false, generation: "ai_generated" },
      // Summary card - reinforces ease of use with compelling copy
      { element: "summary_card_heading", mandatory: true, generation: "ai_generated", description: "Compelling headline reinforcing how easy/fast the process is (e.g., 'Start seeing results in minutes')" },
      { element: "summary_card_description", mandatory: true, generation: "ai_generated", description: "Supporting copy emphasizing simplicity and zero complexity" },
      { element: "summary_stat_1_text", mandatory: true, generation: "ai_generated", description: "Time-related stat (e.g., 'Under 10 minutes', '2-minute setup')" },
      { element: "summary_stat_2_text", mandatory: true, generation: "ai_generated", description: "Simplicity stat (e.g., 'No setup required', 'Zero coding')" },
      { element: "summary_stat_3_text", mandatory: true, generation: "ai_generated", description: "Results stat (e.g., 'Instant results', 'Works immediately')" },
      { element: "show_circle_features", mandatory: false, generation: "manual_preferred" },
      { element: "show_summary_card", mandatory: false, generation: "manual_preferred" },
      { element: "step_icon_1", mandatory: false, generation: "manual_preferred" },
      { element: "step_icon_2", mandatory: false, generation: "manual_preferred" },
      { element: "step_icon_3", mandatory: false, generation: "manual_preferred" },
      { element: "step_icon_4", mandatory: false, generation: "manual_preferred" },
      { element: "step_icon_5", mandatory: false, generation: "manual_preferred" },
      { element: "step_icon_6", mandatory: false, generation: "manual_preferred" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["step_titles", "step_descriptions"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [3, 4],
      description: 'Icon-based simple steps'
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

  CardFlipSteps: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "flip_instruction", mandatory: false, generation: "ai_generated" },
      { element: "flip_feature_1_text", mandatory: false, generation: "ai_generated" },
      { element: "flip_feature_2_text", mandatory: false, generation: "ai_generated" },
      { element: "guide_heading", mandatory: false, generation: "ai_generated" },
      { element: "guide_description", mandatory: false, generation: "ai_generated" },
      { element: "guide_indicator_1_text", mandatory: false, generation: "ai_generated" },
      { element: "guide_indicator_2_text", mandatory: false, generation: "ai_generated" },
      { element: "guide_indicator_3_text", mandatory: false, generation: "ai_generated" },
      { element: "show_flip_features", mandatory: false, generation: "manual_preferred" },
      { element: "show_interactive_guide", mandatory: false, generation: "manual_preferred" },
      { element: "flip_feature_1_icon", mandatory: false, generation: "ai_generated" },
      { element: "flip_feature_2_icon", mandatory: false, generation: "ai_generated" },
      { element: "guide_indicator_1_icon", mandatory: false, generation: "ai_generated" },
      { element: "guide_indicator_2_icon", mandatory: false, generation: "ai_generated" },
      { element: "guide_indicator_3_icon", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["step_titles", "step_descriptions", "step_visuals", "step_actions"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [4, 4],
      description: 'Interactive design process steps'
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

  ZigzagImageSteps: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "flow_summary_heading", mandatory: false, generation: "ai_generated" },
      { element: "flow_feature_1_text", mandatory: false, generation: "ai_generated" },
      { element: "flow_feature_2_text", mandatory: false, generation: "ai_generated" },
      { element: "flow_feature_3_text", mandatory: false, generation: "ai_generated" },
      { element: "flow_summary_description", mandatory: false, generation: "ai_generated" },
      { element: "show_flow_summary", mandatory: false, generation: "manual_preferred" },
      { element: "flow_feature_1_icon", mandatory: false, generation: "ai_generated" },
      { element: "flow_feature_2_icon", mandatory: false, generation: "ai_generated" },
      { element: "flow_feature_3_icon", mandatory: false, generation: "ai_generated" },
      { element: "step_visual_0", mandatory: false, generation: "manual_preferred" },
      { element: "step_visual_1", mandatory: false, generation: "manual_preferred" },
      { element: "step_visual_2", mandatory: false, generation: "manual_preferred" },
      { element: "step_visual_3", mandatory: false, generation: "manual_preferred" },
      { element: "step_visual_4", mandatory: false, generation: "manual_preferred" },
      { element: "step_visual_5", mandatory: false, generation: "manual_preferred" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["step_titles", "step_descriptions", "step_visuals", "image_captions"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [4, 4],
      description: 'Visual step-by-step creative journey'
    }
  },

  AnimatedProcessLine: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "animation_labels", mandatory: false, generation: "ai_generated" },
      { element: "process_indicator_1_text", mandatory: false, generation: "ai_generated" },
      { element: "process_indicator_2_text", mandatory: false, generation: "ai_generated" },
      { element: "process_indicator_3_text", mandatory: false, generation: "ai_generated" },
      { element: "auto_animate", mandatory: false, generation: "manual_preferred" },
      { element: "show_process_indicators", mandatory: false, generation: "manual_preferred" },
      { element: "step_icon_1", mandatory: false, generation: "ai_generated" },
      { element: "step_icon_2", mandatory: false, generation: "ai_generated" },
      { element: "step_icon_3", mandatory: false, generation: "ai_generated" },
      { element: "step_icon_4", mandatory: false, generation: "ai_generated" },
      { element: "process_indicator_1_icon", mandatory: false, generation: "ai_generated" },
      { element: "process_indicator_2_icon", mandatory: false, generation: "ai_generated" },
      { element: "process_indicator_3_icon", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["step_titles", "step_descriptions"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [4, 4],
      description: 'Automated process flow steps'
    }
  },

  // Integration Section
  LogoGrid: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "default_icon", mandatory: false, generation: "ai_generated" },
      { element: "logo_urls", mandatory: false, generation: "manual_preferred" }
    ],

    cardStructure: {
      type: "items",
      elements: ["integration_names"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'items',
      min: 6,
      max: 20,
      optimal: [8, 12],
      description: 'Integration partner logos'
    }
  },

  CategoryAccordion: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["category_titles", "category_integrations", "category_icons"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [4, 5],
      description: 'Integration categories with grouped tools'
    }
  },

  InteractiveStackDiagram: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["layer_titles", "layer_descriptions", "layer_technologies"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 8,
      optimal: [4, 6],
      description: 'Integration stack layers'
    }
  },

  UseCaseTiles: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["usecase_titles", "usecase_descriptions", "usecase_integrations", "usecase_icons"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [4, 4],
      description: 'Integration use case examples'
    }
  },

  BadgeCarousel: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "carousel_navigation", mandatory: false, generation: "manual_preferred" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["badge_titles", "badge_descriptions", "badge_icons"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 4,
      max: 12,
      optimal: [6, 8],
      description: 'Integration badges or certifications'
    }
  },

  TabbyIntegrationCards: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "tabbed_pairs",
      elements: ["tab_titles", "tab_integrations", "tab_icons"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [4, 4],
      description: 'Tabbed integration categories'
    }
  },

  ZapierLikeBuilderPreview: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "builder_instructions", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "pairs",
      elements: ["trigger_labels", "action_labels", "connection_descriptions"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'pairs',
      min: 3,
      max: 8,
      optimal: [4, 6],
      description: 'Integration automation flows'
    }
  },

  LogoWithQuoteUse: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["integration_names", "usage_quotes", "customer_names", "customer_titles"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 8,
      optimal: [4, 6],
      description: 'Integration testimonials with logos'
    }
  },

  // Objection Section
  ObjectionAccordion: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "response_icon", mandatory: false, generation: "ai_generated" },
      { element: "trust_icon", mandatory: false, generation: "ai_generated" },
      { element: "help_text", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "pairs",
      elements: ["objection_titles", "objection_responses", "objection_icons"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'items',
      min: 3,
      max: 8,
      optimal: [4, 6],
      description: 'Objection accordion items'
    }
  },

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

  QuoteBackedAnswers: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "source_credentials", mandatory: false, generation: "ai_generated" },
      { element: "expert_label", mandatory: false, generation: "ai_generated" },
      { element: "verification_label", mandatory: false, generation: "ai_generated" },
      { element: "trust_indicator_1", mandatory: false, generation: "ai_generated" },
      { element: "trust_indicator_2", mandatory: false, generation: "ai_generated" },
      { element: "trust_indicator_3", mandatory: false, generation: "ai_generated" },
      { element: "quote_icon", mandatory: false, generation: "ai_generated" },
      { element: "verification_icon", mandatory: false, generation: "ai_generated" },
      { element: "trust_icon_1", mandatory: false, generation: "ai_generated" },
      { element: "trust_icon_2", mandatory: false, generation: "ai_generated" },
      { element: "trust_icon_3", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["quote_blocks"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 6,
      optimal: [3, 4],
      description: 'Quote-backed objection answers'
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

  ProblemToReframeBlocks: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "transition_text", mandatory: false, generation: "ai_generated" },
      { element: "problem_icon", mandatory: false, generation: "ai_generated" },
      { element: "reframe_icon", mandatory: false, generation: "ai_generated" },
      { element: "transition_icon", mandatory: false, generation: "ai_generated" },
      { element: "arrow_icon", mandatory: false, generation: "ai_generated" },
      { element: "benefit_icon_1", mandatory: false, generation: "ai_generated" },
      { element: "benefit_icon_2", mandatory: false, generation: "ai_generated" },
      { element: "benefit_icon_3", mandatory: false, generation: "ai_generated" },
      { element: "bottom_headline", mandatory: false, generation: "ai_generated" },
      { element: "bottom_description", mandatory: false, generation: "ai_generated" },
      { element: "benefit_label_1", mandatory: false, generation: "ai_generated" },
      { element: "benefit_label_2", mandatory: false, generation: "ai_generated" },
      { element: "benefit_label_3", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "pairs",
      elements: ["problem_statements", "reframe_statements"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'pairs',
      min: 2,
      max: 6,
      optimal: [3, 4],
      description: 'Problem/reframe block pairs'
    }
  },

  SkepticToBelieverSteps: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "objections_summary", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["conversion_steps"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 5,
      optimal: [3, 4],
      description: 'Skeptic to believer transformation steps'
    }
  },

  BoldGuaranteePanel: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "main_guarantee", mandatory: true, generation: "ai_generated" },
      { element: "guarantee_details", mandatory: true, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "trust_indicators", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "cards",
      elements: ["key_guarantees"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'blocks',
      min: 1,
      max: 1,
      optimal: [1, 1],
      description: 'Single guarantee panel'
    }
  },

  ObjectionCarousel: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "autoplay_button_text", mandatory: false, generation: "ai_generated" }
    ],

    cardStructure: {
      type: "items",
      elements: ["objection_slides"],
      generation: "ai_generated"
    },

    cardRequirements: {
      type: 'items',
      min: 3,
      max: 8,
      optimal: [4, 6],
      description: 'Objection carousel slides'
    }
  },

  // Pricing Section - Enhanced with complete field definitions for 5/5 completeness rating
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

  FeatureMatrix: [
    { element: "headline", mandatory: true },
    { element: "tier_names", mandatory: true },
    { element: "tier_prices", mandatory: true },
    { element: "tier_descriptions", mandatory: true },
    { element: "cta_texts", mandatory: true },
    { element: "feature_categories", mandatory: true },
    { element: "feature_names", mandatory: true },
    { element: "feature_availability", mandatory: true },
    { element: "popular_tiers", mandatory: false },
    { element: "feature_descriptions", mandatory: false },
    { element: "subheadline", mandatory: false },
    { element: "supporting_text", mandatory: false },
    { element: "trust_items", mandatory: false },
    // Enterprise features section
    { element: "enterprise_section_title", mandatory: false },
    { element: "enterprise_feature_1_title", mandatory: false },
    { element: "enterprise_feature_1_desc", mandatory: false },
    { element: "enterprise_feature_1_icon", mandatory: false },
    { element: "enterprise_feature_2_title", mandatory: false },
    { element: "enterprise_feature_2_desc", mandatory: false },
    { element: "enterprise_feature_2_icon", mandatory: false },
    { element: "enterprise_feature_3_title", mandatory: false },
    { element: "enterprise_feature_3_desc", mandatory: false },
    { element: "enterprise_feature_3_icon", mandatory: false },
    { element: "enterprise_feature_4_title", mandatory: false },
    { element: "enterprise_feature_4_desc", mandatory: false },
    { element: "enterprise_feature_4_icon", mandatory: false },
    { element: "show_enterprise_features", mandatory: false },
  ],

  SegmentBasedPricing: [
    { element: "headline", mandatory: true },
    { element: "segment_names", mandatory: true },
    { element: "segment_descriptions", mandatory: true },
    { element: "segment_use_cases", mandatory: true },
    { element: "tier_names", mandatory: true },
    { element: "tier_prices", mandatory: true },
    { element: "tier_features", mandatory: true },
    { element: "cta_texts", mandatory: true },
    { element: "recommended_tiers", mandatory: false },
    { element: "segment_icons", mandatory: false },
    { element: "subheadline", mandatory: false },
    { element: "supporting_text", mandatory: false },
    { element: "trust_items", mandatory: false },
    // Segment comparison section
    { element: "segment_comparison_title", mandatory: false },
    { element: "segment_comparison_desc", mandatory: false },
    { element: "show_segment_comparison", mandatory: false },
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

  CardWithTestimonial: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "tier_count", mandatory: false, generation: "manual_preferred" },
      { element: "feature_lists", mandatory: false, generation: "ai_generated" },
      { element: "popular_tiers", mandatory: false, generation: "manual_preferred" },
      // Testimonial fields (pipe-separated)
      { element: "testimonial_quotes", mandatory: false, generation: "ai_generated" },
      { element: "testimonial_names", mandatory: false, generation: "ai_generated" },
      { element: "testimonial_companies", mandatory: false, generation: "ai_generated" },
      { element: "testimonial_ratings", mandatory: false, generation: "manual_preferred" },
      { element: "testimonial_images", mandatory: false, generation: "manual_preferred" },
      // Social proof metrics
      { element: "social_metric_1", mandatory: false, generation: "manual_preferred" },
      { element: "social_metric_1_label", mandatory: false, generation: "ai_generated" },
      { element: "social_metric_2", mandatory: false, generation: "manual_preferred" },
      { element: "social_metric_2_label", mandatory: false, generation: "ai_generated" },
      { element: "social_metric_3", mandatory: false, generation: "manual_preferred" },
      { element: "social_metric_3_label", mandatory: false, generation: "ai_generated" },
      { element: "social_metric_4", mandatory: false, generation: "manual_preferred" },
      { element: "social_metric_4_label", mandatory: false, generation: "ai_generated" },
      { element: "show_social_proof", mandatory: false, generation: "manual_preferred" },
      { element: "social_proof_title", mandatory: false, generation: "ai_generated" },
      // Guarantee section
      { element: "guarantee_title", mandatory: false, generation: "ai_generated" },
      { element: "guarantee_description", mandatory: false, generation: "ai_generated" },
      { element: "show_guarantee", mandatory: false, generation: "manual_preferred" },
      // Tier icons
      { element: "tier_icon_1", mandatory: false, generation: "ai_generated" },
      { element: "tier_icon_2", mandatory: false, generation: "ai_generated" },
      { element: "tier_icon_3", mandatory: false, generation: "ai_generated" },
      { element: "tier_icon_4", mandatory: false, generation: "ai_generated" },
      // Social proof icons
      { element: "social_icon_1", mandatory: false, generation: "ai_generated" },
      { element: "social_icon_2", mandatory: false, generation: "ai_generated" },
      { element: "social_icon_3", mandatory: false, generation: "ai_generated" },
      { element: "social_icon_4", mandatory: false, generation: "ai_generated" }
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
      description: 'Pricing cards with testimonials'
    }
  },

  MiniStackedCards: [
    { element: "headline", mandatory: true },
    { element: "tier_names", mandatory: true },
    { element: "tier_prices", mandatory: true },
    { element: "tier_descriptions", mandatory: true },
    { element: "cta_texts", mandatory: true },
    { element: "feature_lists", mandatory: false },
    { element: "popular_tiers", mandatory: false },
    { element: "subheadline", mandatory: false },
    { element: "supporting_text", mandatory: false },
    { element: "trust_items", mandatory: false },
    // FAQ section (up to 4 pairs)
    { element: "faq_question_1", mandatory: false },
    { element: "faq_answer_1", mandatory: false },
    { element: "faq_question_2", mandatory: false },
    { element: "faq_answer_2", mandatory: false },
    { element: "faq_question_3", mandatory: false },
    { element: "faq_answer_3", mandatory: false },
    { element: "faq_question_4", mandatory: false },
    { element: "faq_answer_4", mandatory: false },
    { element: "faq_section_title", mandatory: false },
    { element: "show_faq", mandatory: false },
    // Plans features section (up to 3 features)
    { element: "plans_feature_1_title", mandatory: false },
    { element: "plans_feature_1_desc", mandatory: false },
    { element: "plans_feature_1_icon", mandatory: false },
    { element: "plans_feature_2_title", mandatory: false },
    { element: "plans_feature_2_desc", mandatory: false },
    { element: "plans_feature_2_icon", mandatory: false },
    { element: "plans_feature_3_title", mandatory: false },
    { element: "plans_feature_3_desc", mandatory: false },
    { element: "plans_feature_3_icon", mandatory: false },
    { element: "plans_features_title", mandatory: false },
    { element: "show_plans_features", mandatory: false },
    // Trust indicators (up to 4)
    { element: "trust_item_1", mandatory: false },
    { element: "trust_item_2", mandatory: false },
    { element: "trust_item_3", mandatory: false },
    { element: "trust_item_4", mandatory: false },
    { element: "show_trust_item_1", mandatory: false },
    { element: "show_trust_item_2", mandatory: false },
    { element: "show_trust_item_3", mandatory: false },
    { element: "show_trust_item_4", mandatory: false },
  ],

  // PrimaryCTA Section - Enhanced with complete field definitions
  CenteredHeadlineCTA: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
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

  CTAWithBadgeRow: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "trust_item_1", mandatory: true, generation: "ai_generated" },
      { element: "trust_item_2", mandatory: true, generation: "ai_generated" },
      { element: "trust_item_3", mandatory: true, generation: "ai_generated" },
      { element: "trust_item_4", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_5", mandatory: false, generation: "ai_generated" },
      { element: "customer_count", mandatory: false, generation: "manual_preferred" },
      { element: "rating_value", mandatory: false, generation: "manual_preferred" },
      { element: "rating_count", mandatory: false, generation: "manual_preferred" },
      { element: "show_social_proof", mandatory: false, generation: "manual_preferred" },
      { element: "show_customer_avatars", mandatory: false, generation: "manual_preferred" },
      { element: "avatar_count", mandatory: false, generation: "manual_preferred" },
      { element: "customer_names", mandatory: false, generation: "manual_preferred" },
      { element: "avatar_urls", mandatory: false, generation: "manual_preferred" }
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

  SideBySideCTA: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "value_proposition", mandatory: true, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "benefit_list", mandatory: true, generation: "ai_generated" },
      { element: "trust_item_1", mandatory: true, generation: "ai_generated" },
      { element: "trust_item_2", mandatory: true, generation: "ai_generated" },
      { element: "trust_item_3", mandatory: true, generation: "ai_generated" },
      { element: "trust_item_4", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_5", mandatory: false, generation: "ai_generated" }
    ],

    cardRequirements: null
  },

  CountdownLimitedCTA: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "countdown_label", mandatory: true, generation: "ai_generated" },
      { element: "scarcity_text", mandatory: true, generation: "ai_generated" },
      { element: "urgency_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_1", mandatory: true, generation: "ai_generated" },
      { element: "trust_item_2", mandatory: true, generation: "ai_generated" },
      { element: "trust_item_3", mandatory: true, generation: "ai_generated" },
      { element: "trust_item_4", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_5", mandatory: false, generation: "ai_generated" },
      { element: "countdown_end_date", mandatory: false, generation: "manual_preferred" },
      { element: "countdown_end_time", mandatory: false, generation: "manual_preferred" },
      { element: "limited_quantity", mandatory: false, generation: "manual_preferred" },
      { element: "availability_text", mandatory: false, generation: "ai_generated" },
      { element: "bonus_text", mandatory: false, generation: "ai_generated" }
    ],

    cardRequirements: null
  },

  CTAWithFormField: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "form_label", mandatory: true, generation: "ai_generated" },
      { element: "placeholder_text", mandatory: true, generation: "ai_generated" },
      { element: "privacy_text", mandatory: false, generation: "ai_generated" },
      { element: "benefit_1", mandatory: true, generation: "ai_generated" },
      { element: "benefit_2", mandatory: true, generation: "ai_generated" },
      { element: "benefit_3", mandatory: true, generation: "ai_generated" },
      { element: "benefit_4", mandatory: false, generation: "ai_generated" },
      { element: "benefit_5", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_1", mandatory: true, generation: "ai_generated" },
      { element: "trust_item_2", mandatory: true, generation: "ai_generated" },
      { element: "trust_item_3", mandatory: true, generation: "ai_generated" },
      { element: "trust_item_4", mandatory: false, generation: "ai_generated" },
      { element: "trust_item_5", mandatory: false, generation: "ai_generated" },
      { element: "form_type", mandatory: false, generation: "manual_preferred" },
      { element: "required_fields", mandatory: false, generation: "manual_preferred" },
      { element: "success_message", mandatory: false, generation: "ai_generated" }
    ],

    cardRequirements: null
  },

  ValueStackCTA: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
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

  TestimonialCTACombo: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: true, generation: "ai_generated" },
      { element: "testimonial_quote", mandatory: true, generation: "ai_generated" },
      { element: "testimonial_author", mandatory: true, generation: "ai_generated" },
      { element: "testimonial_title", mandatory: true, generation: "ai_generated" },
      { element: "testimonial_company", mandatory: true, generation: "ai_generated" },
      { element: "testimonial_company_logo", mandatory: false, generation: "manual_preferred" },
      { element: "testimonial_date", mandatory: false, generation: "manual_preferred" },
      { element: "testimonial_industry", mandatory: false, generation: "ai_generated" },
      { element: "case_study_tag", mandatory: false, generation: "ai_generated" },
      { element: "customer_count", mandatory: false, generation: "manual_preferred" },
      { element: "average_rating", mandatory: false, generation: "manual_preferred" },
      { element: "uptime_percentage", mandatory: false, generation: "manual_preferred" },
      { element: "show_social_proof", mandatory: false, generation: "manual_preferred" }
    ],

    cardRequirements: null
  },

  // Problem Section
  StackedPainBullets: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "conclusion_text", mandatory: false, generation: "ai_generated" },
      { element: "pain_icon_1", mandatory: false, generation: "manual_preferred" },
      { element: "pain_icon_2", mandatory: false, generation: "manual_preferred" },
      { element: "pain_icon_3", mandatory: false, generation: "manual_preferred" },
      { element: "pain_icon_4", mandatory: false, generation: "manual_preferred" },
      { element: "pain_icon_5", mandatory: false, generation: "manual_preferred" },
      { element: "pain_icon_6", mandatory: false, generation: "manual_preferred" }
    ],
    cardStructure: {
      type: "items",
      elements: ["pain_points", "pain_descriptions"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'items',
      min: 2,
      max: 5,
      optimal: [3, 3],
      description: 'Pain point items with optional descriptions'
    }
  },

  BeforeImageAfterText: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "before_description", mandatory: true, generation: "ai_generated" },
      { element: "after_description", mandatory: true, generation: "ai_generated" },
      { element: "before_after_image", mandatory: false, generation: "manual_preferred" },
      { element: "image_caption", mandatory: false, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "transformation_icon_1", mandatory: false, generation: "ai_generated" },
      { element: "transformation_icon_2", mandatory: false, generation: "ai_generated" },
      { element: "transformation_icon_3", mandatory: false, generation: "ai_generated" }
    ],
    cardRequirements: null
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

  EmotionalQuotes: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "context_text", mandatory: false, generation: "ai_generated" },
      { element: "emotional_impact", mandatory: false, generation: "ai_generated" },
      { element: "relatable_intro", mandatory: false, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["emotional_quotes", "quote_attributions", "quote_categories", "category_icons"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 3,
      max: 5,
      optimal: [4, 5],
      description: 'Emotional quote cards with attributions'
    }
  },

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

  PainMeterChart: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "chart_labels", mandatory: false, generation: "ai_generated" },
      { element: "total_score_text", mandatory: false, generation: "ai_generated" },
      { element: "benchmark_text", mandatory: false, generation: "ai_generated" },
      { element: "intro_text", mandatory: false, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "action_stat_1", mandatory: false, generation: "ai_generated" },
      { element: "action_stat_1_label", mandatory: false, generation: "ai_generated" },
      { element: "action_stat_2", mandatory: false, generation: "ai_generated" },
      { element: "action_stat_2_label", mandatory: false, generation: "ai_generated" },
      { element: "action_stat_3", mandatory: false, generation: "ai_generated" },
      { element: "action_stat_3_label", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["pain_categories", "pain_levels", "category_descriptions"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 4,
      max: 6,
      optimal: [5, 6],
      description: 'Pain meter measurement categories'
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

  ProblemChecklist: {
    sectionElements: [
      { element: "headline", mandatory: true, generation: "ai_generated" },
      { element: "conclusion_text", mandatory: false, generation: "ai_generated" },
      { element: "intro_text", mandatory: false, generation: "ai_generated" },
      { element: "subheadline", mandatory: false, generation: "ai_generated" },
      { element: "supporting_text", mandatory: false, generation: "ai_generated" },
      { element: "cta_text", mandatory: false, generation: "ai_generated" },
      { element: "trust_items", mandatory: false, generation: "ai_generated" },
      { element: "result_stat_1", mandatory: false, generation: "ai_generated" },
      { element: "result_stat_1_label", mandatory: false, generation: "ai_generated" },
      { element: "result_stat_2", mandatory: false, generation: "ai_generated" },
      { element: "result_stat_2_label", mandatory: false, generation: "ai_generated" },
      { element: "result_stat_3", mandatory: false, generation: "ai_generated" },
      { element: "result_stat_3_label", mandatory: false, generation: "ai_generated" },
      { element: "encouragement_tip_1", mandatory: false, generation: "ai_generated" },
      { element: "encouragement_tip_2", mandatory: false, generation: "ai_generated" },
      { element: "encouragement_tip_3", mandatory: false, generation: "ai_generated" }
    ],
    cardStructure: {
      type: "cards",
      elements: ["problem_statements", "checklist_items", "scoring_labels", "action_thresholds"],
      generation: "ai_generated"
    },
    cardRequirements: {
      type: 'cards',
      min: 5,
      max: 10,
      optimal: [7, 10],
      description: 'Problem assessment checklist items'
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

  NavWithCTAHeader: {
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

  CenteredLogoHeader: {
    sectionElements: [
      { element: "nav_item_1", mandatory: true, generation: "manual_preferred" },
      { element: "nav_item_2", mandatory: true, generation: "manual_preferred" },
      { element: "nav_item_3", mandatory: false, generation: "manual_preferred" },
      { element: "nav_item_4", mandatory: false, generation: "manual_preferred" },
      { element: "nav_item_5", mandatory: false, generation: "manual_preferred" },
      { element: "nav_item_6", mandatory: false, generation: "manual_preferred" },
      { element: "nav_link_1", mandatory: false, generation: "manual_preferred" },
      { element: "nav_link_2", mandatory: false, generation: "manual_preferred" },
      { element: "nav_link_3", mandatory: false, generation: "manual_preferred" },
      { element: "nav_link_4", mandatory: false, generation: "manual_preferred" },
      { element: "nav_link_5", mandatory: false, generation: "manual_preferred" },
      { element: "nav_link_6", mandatory: false, generation: "manual_preferred" }
    ],
    cardRequirements: null
  },

  FullNavHeader: {
    sectionElements: [
      { element: "nav_item_1", mandatory: true, generation: "manual_preferred" },
      { element: "nav_item_2", mandatory: false, generation: "manual_preferred" },
      { element: "nav_item_3", mandatory: false, generation: "manual_preferred" },
      { element: "nav_item_4", mandatory: false, generation: "manual_preferred" },
      { element: "nav_item_5", mandatory: false, generation: "manual_preferred" },
      { element: "nav_link_1", mandatory: false, generation: "manual_preferred" },
      { element: "nav_link_2", mandatory: false, generation: "manual_preferred" },
      { element: "nav_link_3", mandatory: false, generation: "manual_preferred" },
      { element: "nav_link_4", mandatory: false, generation: "manual_preferred" },
      { element: "nav_link_5", mandatory: false, generation: "manual_preferred" }
    ],
    cardRequirements: null
  },

  // Footer Section
  SimpleFooter: {
    sectionElements: [
      { element: "copyright", mandatory: true, generation: "manual_preferred" },
      { element: "link_text_1", mandatory: false, generation: "manual_preferred" },
      { element: "link_1", mandatory: false, generation: "manual_preferred" },
      { element: "link_text_2", mandatory: false, generation: "manual_preferred" },
      { element: "link_2", mandatory: false, generation: "manual_preferred" },
      { element: "link_text_3", mandatory: false, generation: "manual_preferred" },
      { element: "link_3", mandatory: false, generation: "manual_preferred" }
    ],
    cardRequirements: null
  },

  LinksAndSocialFooter: {
    sectionElements: [
      { element: "copyright", mandatory: true, generation: "manual_preferred" },
      { element: "company_name", mandatory: false, generation: "manual_preferred" },
      { element: "tagline", mandatory: false, generation: "ai_generated" },
      { element: "link_text_1", mandatory: false, generation: "manual_preferred" },
      { element: "link_1", mandatory: false, generation: "manual_preferred" },
      { element: "link_text_2", mandatory: false, generation: "manual_preferred" },
      { element: "link_2", mandatory: false, generation: "manual_preferred" },
      { element: "link_text_3", mandatory: false, generation: "manual_preferred" },
      { element: "link_3", mandatory: false, generation: "manual_preferred" },
      { element: "link_text_4", mandatory: false, generation: "manual_preferred" },
      { element: "link_4", mandatory: false, generation: "manual_preferred" },
      { element: "social_twitter", mandatory: false, generation: "manual_preferred" },
      { element: "social_linkedin", mandatory: false, generation: "manual_preferred" },
      { element: "social_github", mandatory: false, generation: "manual_preferred" },
      { element: "social_facebook", mandatory: false, generation: "manual_preferred" }
    ],
    cardRequirements: null
  },

  MultiColumnFooter: {
    sectionElements: [
      { element: "copyright", mandatory: true, generation: "manual_preferred" },
      { element: "company_description", mandatory: false, generation: "ai_generated" },
      { element: "column_1_title", mandatory: false, generation: "manual_preferred" },
      { element: "column_1_link_text_1", mandatory: false, generation: "manual_preferred" },
      { element: "column_1_link_1", mandatory: false, generation: "manual_preferred" },
      { element: "column_1_link_text_2", mandatory: false, generation: "manual_preferred" },
      { element: "column_1_link_2", mandatory: false, generation: "manual_preferred" },
      { element: "column_1_link_text_3", mandatory: false, generation: "manual_preferred" },
      { element: "column_1_link_3", mandatory: false, generation: "manual_preferred" },
      { element: "column_1_link_text_4", mandatory: false, generation: "manual_preferred" },
      { element: "column_1_link_4", mandatory: false, generation: "manual_preferred" },
      { element: "column_2_title", mandatory: false, generation: "manual_preferred" },
      { element: "column_2_link_text_1", mandatory: false, generation: "manual_preferred" },
      { element: "column_2_link_1", mandatory: false, generation: "manual_preferred" },
      { element: "column_2_link_text_2", mandatory: false, generation: "manual_preferred" },
      { element: "column_2_link_2", mandatory: false, generation: "manual_preferred" },
      { element: "column_2_link_text_3", mandatory: false, generation: "manual_preferred" },
      { element: "column_2_link_3", mandatory: false, generation: "manual_preferred" },
      { element: "column_2_link_text_4", mandatory: false, generation: "manual_preferred" },
      { element: "column_2_link_4", mandatory: false, generation: "manual_preferred" },
      { element: "column_3_title", mandatory: false, generation: "manual_preferred" },
      { element: "column_3_link_text_1", mandatory: false, generation: "manual_preferred" },
      { element: "column_3_link_1", mandatory: false, generation: "manual_preferred" },
      { element: "column_3_link_text_2", mandatory: false, generation: "manual_preferred" },
      { element: "column_3_link_2", mandatory: false, generation: "manual_preferred" },
      { element: "column_3_link_text_3", mandatory: false, generation: "manual_preferred" },
      { element: "column_3_link_3", mandatory: false, generation: "manual_preferred" },
      { element: "column_3_link_text_4", mandatory: false, generation: "manual_preferred" },
      { element: "column_3_link_4", mandatory: false, generation: "manual_preferred" }
    ],
    cardRequirements: null
  },

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