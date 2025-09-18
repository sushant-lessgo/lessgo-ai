import { layoutElementSchema } from './layoutElementSchema';
import type { InputVariables, HiddenInferredFields } from '@/types/core/index';

type Variables = Partial<InputVariables> & Partial<HiddenInferredFields>;

interface ElementRule {
  element: string;
  conditions: Array<{
    variable: keyof Variables;
    values: string[];
    weight: number; // 1-5 scale
  }>;
  minScore: number;
}

interface SectionLayoutRules {
  [key: string]: ElementRule[]; // Using flat structure: "SectionType_LayoutName"
}

const elementRules: SectionLayoutRules = {

      "BeforeAfter_SideBySideBlocks": [
    {
      element: "subheadline",
      conditions: [
        { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
        { variable: "copyIntent", values: ["pain-led"], weight: 3 },
        { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }
      ],
      minScore: 6
    },
    {
      element: "supporting_text",
      conditions: [
        { variable: "problemType", values: ["lost-revenue-or-inefficiency", "manual-repetition"], weight: 4 },
        { variable: "targetAudience", values: ["enterprise-tech-teams", "mid-market-companies"], weight: 3 },
        { variable: "copyIntent", values: ["desire-led"], weight: 2 }
      ],
      minScore: 6
    },
    {
      element: "cta_text",
      conditions: [
        { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
        { variable: "landingPageGoals", values: ["signup", "start-trial", "book-demo"], weight: 3 }
      ],
      minScore: 4
    },
    {
      element: "trust_items",
      conditions: [
        { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
        { variable: "targetAudience", values: ["enterprise-buyers", "team-leads"], weight: 2 }
      ],
      minScore: 3
    },
    {
      element: "before_icon",
      conditions: [
        { variable: "targetAudience", values: ["developers", "no-code-builders"], weight: 2 },
        { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
      ],
      minScore: 2
    },
    {
      element: "after_icon",
      conditions: [
        { variable: "targetAudience", values: ["developers", "no-code-builders"], weight: 2 },
        { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
      ],
      minScore: 2
    }
  ],

  "BeforeAfter_StackedTextVisual": [
    {
      element: "transition_text",
      conditions: [
        { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
        { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 3 },
        { variable: "copyIntent", values: ["desire-led"], weight: 2 }
      ],
      minScore: 6
    },
    {
      element: "subheadline",
      conditions: [
        { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
        { variable: "problemType", values: ["burnout-or-overload", "personal-growth-or-productivity"], weight: 3 }
      ],
      minScore: 5
    }
  ],

  "BeforeAfter_BeforeAfterSlider": [
    {
      element: "slider_instruction",
      conditions: [
        { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
        { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
        { variable: "targetAudience", values: ["developers", "product-managers", "no-code-builders"], weight: 2 }
      ],
      minScore: 6
    },
    {
      element: "subheadline",
      conditions: [
        { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
        { variable: "copyIntent", values: ["pain-led"], weight: 3 }
      ],
      minScore: 5
    },
    {
      element: "supporting_text",
      conditions: [
        { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 },
        { variable: "copyIntent", values: ["benefit-led", "pain-led"], weight: 3 }
      ],
      minScore: 4
    },
    {
      element: "cta_text",
      conditions: [
        { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
        { variable: "landingPageGoals", values: ["signup", "start-trial", "book-demo"], weight: 3 }
      ],
      minScore: 4
    },
    {
      element: "trust_items",
      conditions: [
        { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
        { variable: "targetAudience", values: ["enterprise-buyers", "team-leads"], weight: 2 }
      ],
      minScore: 3
    },
    {
      element: "interaction_hint_text",
      conditions: [
        { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 },
        { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }
      ],
      minScore: 3
    },
    {
      element: "show_interaction_hint",
      conditions: [
        { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 },
        { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }
      ],
      minScore: 3
    },
    {
      element: "before_placeholder_text",
      conditions: [
        { variable: "copyIntent", values: ["pain-led"], weight: 3 },
        { variable: "awarenessLevel", values: ["problem-aware"], weight: 2 }
      ],
      minScore: 3
    },
    {
      element: "after_placeholder_text",
      conditions: [
        { variable: "copyIntent", values: ["benefit-led"], weight: 3 },
        { variable: "awarenessLevel", values: ["solution-aware"], weight: 2 }
      ],
      minScore: 3
    },
    {
      element: "before_icon",
      conditions: [
        { variable: "targetAudience", values: ["developers", "no-code-builders"], weight: 2 },
        { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
      ],
      minScore: 2
    },
    {
      element: "after_icon",
      conditions: [
        { variable: "targetAudience", values: ["developers", "no-code-builders"], weight: 2 },
        { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
      ],
      minScore: 2
    },
    {
      element: "hint_icon",
      conditions: [
        { variable: "targetAudience", values: ["developers", "no-code-builders"], weight: 2 },
        { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
      ],
      minScore: 2
    }
  ],

  "BeforeAfter_SplitCard": [
    {
      element: "subheadline",
      conditions: [
        { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
        { variable: "copyIntent", values: ["pain-led"], weight: 3 },
        { variable: "problemType", values: ["lost-revenue-or-inefficiency", "manual-repetition"], weight: 2 }
      ],
      minScore: 6
    }
  ],

  "BeforeAfter_TextListTransformation": [
    {
      element: "transformation_text",
      conditions: [
        { variable: "copyIntent", values: ["desire-led"], weight: 4 },
        { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 3 },
        { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 2 }
      ],
      minScore: 6
    },
    {
      element: "subheadline",
      conditions: [
        { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
        { variable: "copyIntent", values: ["pain-led"], weight: 3 }
      ],
      minScore: 5
    },
    {
      element: "supporting_text",
      conditions: [
        { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 },
        { variable: "copyIntent", values: ["benefit-led", "pain-led"], weight: 3 }
      ],
      minScore: 4
    },
    {
      element: "cta_text",
      conditions: [
        { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
        { variable: "landingPageGoals", values: ["signup", "start-trial", "book-demo"], weight: 3 }
      ],
      minScore: 4
    },
    {
      element: "trust_items",
      conditions: [
        { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
        { variable: "targetAudience", values: ["enterprise-buyers", "team-leads"], weight: 2 }
      ],
      minScore: 3
    },
    {
      element: "before_icon",
      conditions: [
        { variable: "targetAudience", values: ["developers", "no-code-builders"], weight: 2 },
        { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
      ],
      minScore: 2
    },
    {
      element: "after_icon",
      conditions: [
        { variable: "targetAudience", values: ["developers", "no-code-builders"], weight: 2 },
        { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
      ],
      minScore: 2
    },
    {
      element: "transformation_icon",
      conditions: [
        { variable: "targetAudience", values: ["developers", "no-code-builders"], weight: 2 },
        { variable: "toneProfile", values: ["confident-playful"], weight: 2 }
      ],
      minScore: 2
    }
  ],

  "BeforeAfter_VisualStoryline": [
    {
      element: "subheadline",
      conditions: [
        { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
        { variable: "copyIntent", values: ["pain-led"], weight: 3 }
      ],
      minScore: 5
    },
    {
      element: "conclusion_text",
      conditions: [
        { variable: "copyIntent", values: ["desire-led"], weight: 4 },
        { variable: "landingPageGoals", values: ["free-trial", "demo", "signup"], weight: 3 },
        { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 2 }
      ],
      minScore: 6
    }
  ],

  "BeforeAfter_StatComparison": [
    {
      element: "improvement_percentages",
      conditions: [
        { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 },
        { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
        { variable: "copyIntent", values: ["desire-led"], weight: 2 }
      ],
      minScore: 6
    },
    {
      element: "subheadline",
      conditions: [
        { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
        { variable: "problemType", values: ["lost-revenue-or-inefficiency"], weight: 3 }
      ],
      minScore: 5
    }
  ],

  "BeforeAfter_PersonaJourney": [
    {
      element: "journey_steps",
      conditions: [
        { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
        { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
        { variable: "targetAudience", values: ["enterprise-tech-teams", "mid-market-companies"], weight: 2 }
      ],
      minScore: 6
    },
    {
      element: "persona_quote",
      conditions: [
        { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k"], weight: 4 },
        { variable: "copyIntent", values: ["desire-led"], weight: 3 },
        { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 2 }
      ],
      minScore: 6
    }
  ],

// Close Section Rules
  "Close_MockupWithCTA": [
    {
      element: "subheadline",
      conditions: [
        { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
        { variable: "copyIntent", values: ["pain-led"], weight: 3 }
      ],
      minScore: 5
    },
    {
      element: "urgency_text",
      conditions: [
        { variable: "landingPageGoals", values: ["buy-now", "free-trial", "early-access"], weight: 4 },
        { variable: "toneProfile", values: ["bold-persuasive", "confident-playful"], weight: 3 },
       // { variable: "pricingModifier", values: ["discount"], weight: 2 }
      ],
      minScore: 6
    },
    {
      element: "guarantee_text",
      conditions: [
        { variable: "landingPageGoals", values: ["buy-now", "free-trial"], weight: 4 },
       // { variable: "pricingModifier", values: ["money-back"], weight: 3 },
        { variable: "targetAudience", values: ["smbs", "early-stage-startups", "solopreneurs"], weight: 2 }
      ],
      minScore: 6
    }
  ],

  "Close_BonusStackCTA": [
    {
      element: "total_value_text",
      conditions: [
        { variable: "landingPageGoals", values: ["buy-now", "subscribe"], weight: 5 },
        { variable: "toneProfile", values: ["bold-persuasive"], weight: 3 },
        { variable: "pricingModel", values: ["tiered", "flat-monthly"], weight: 2 }
      ],
      minScore: 7
    },
    {
      element: "urgency_text",
      conditions: [
        { variable: "landingPageGoals", values: ["buy-now", "early-access"], weight: 4 },
       // { variable: "pricingModifier", values: ["discount"], weight: 3 },
        { variable: "startupStage", values: ["problem-exploration", "pre-mvp", "mvp-development"], weight: 2 }
      ],
      minScore: 6
    }
  ],

  "Close_LeadMagnetCard": [
    {
      element: "form_labels",
      conditions: [
        { variable: "landingPageGoals", values: ["download", "waitlist", "signup"], weight: 4 },
        { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 3 },
        { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
      ],
      minScore: 6
    },
    {
      element: "privacy_text",
      conditions: [
        { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "it-decision-makers"], weight: 4 },
        { variable: "marketSubcategory", values: ["Healthcare & MedTech SaaS", "LegalTech SaaS"], weight: 3 },
        { variable: "landingPageGoals", values: ["download", "signup"], weight: 2 }
      ],
      minScore: 6
    }
  ],

  "Close_EnterpriseContactBox": [
    {
      element: "features_list",
      conditions: [
        { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "it-decision-makers"], weight: 5 },
        { variable: "landingPageGoals", values: ["contact-sales", "demo", "book-call"], weight: 3 },
        { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 2 }
      ],
      minScore: 7
    },
    {
      element: "contact_methods",
      conditions: [
        { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 4 },
        { variable: "landingPageGoals", values: ["contact-sales", "book-call"], weight: 3 }
      ],
      minScore: 5
    }
  ],

  "Close_ValueReinforcementBlock": [
    {
      element: "subheadline",
      conditions: [
        { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
        { variable: "copyIntent", values: ["pain-led"], weight: 3 },
        { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }
      ],
      minScore: 6
    },
    {
      element: "closing_statement",
      conditions: [
        { variable: "copyIntent", values: ["desire-led"], weight: 4 },
        { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 3 },
        { variable: "landingPageGoals", values: ["free-trial", "signup", "demo"], weight: 2 }
      ],
      minScore: 6
    }
  ],

  "Close_LivePreviewEmbed": [
    {
      element: "instruction_text",
      conditions: [
        { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
        { variable: "targetAudience", values: ["developers", "product-managers", "no-code-builders"], weight: 3 },
        { variable: "landingPageGoals", values: ["free-trial", "demo"], weight: 2 }
      ],
      minScore: 6
    }
  ],

  "Close_SideBySideOfferCards": [
    {
      element: "comparison_points",
      conditions: [
        { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
        { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 },
        { variable: "pricingModel", values: ["tiered", "freemium"], weight: 2 }
      ],
      minScore: 6
    }
  ],

  "Close_MultistepCTAStack": [
    {
      element: "progress_labels",
      conditions: [
        { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
        { variable: "landingPageGoals", values: ["signup", "free-trial", "demo"], weight: 3 },
        { variable: "marketSophisticationLevel", values: ["level-3", "level-4"], weight: 2 }
      ],
      minScore: 6
    }
  ],

  // Comparison Section Rules
  "Comparison_BasicFeatureGrid": [
    {
      element: "subheadline",
      conditions: [
        { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
        { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
      ],
      minScore: 5
    }
  ],

  "Comparison_CheckmarkComparison": [
    {
      element: "comparison_summary",
      conditions: [
        { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 },
        { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 },
        { variable: "copyIntent", values: ["desire-led"], weight: 2 }
      ],
      minScore: 6
    }
  ],

  "Comparison_YouVsThemHighlight": [
    {
      element: "conclusion_text",
      conditions: [
        { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
        { variable: "copyIntent", values: ["desire-led"], weight: 3 },
        { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 2 }
      ],
      minScore: 6
    }
  ],

  "Comparison_ToggleableComparison": [
    {
      element: "subheadline",
      conditions: [
        { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
        { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
        { variable: "targetAudience", values: ["developers", "product-managers", "enterprise-tech-teams"], weight: 2 }
      ],
      minScore: 6
    }
  ],

  "Comparison_CompetitorCallouts": [
    {
      element: "your_advantage_text",
      conditions: [
        { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 5 },
        { variable: "copyIntent", values: ["desire-led"], weight: 3 },
        { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 2 }
      ],
      minScore: 7
    }
  ],

  "Comparison_AnimatedUpgradePath": [
    {
      element: "subheadline",
      conditions: [
        { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
        { variable: "copyIntent", values: ["pain-led"], weight: 3 },
        { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }
      ],
      minScore: 6
    },
    {
      element: "stage_icons",
      conditions: [
        { variable: "toneProfile", values: ["confident-playful", "friendly-approachable"], weight: 4 },
        { variable: "targetAudience", values: ["small-business-owners", "mid-market-companies"], weight: 3 },
        { variable: "copyIntent", values: ["desire-led"], weight: 2 }
      ],
      minScore: 6
    },
    {
      element: "stage_icon_1",
      conditions: [
        { variable: "toneProfile", values: ["confident-playful", "friendly-approachable"], weight: 4 },
        { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 }
      ],
      minScore: 5
    },
    {
      element: "stage_icon_2",
      conditions: [
        { variable: "toneProfile", values: ["confident-playful", "friendly-approachable"], weight: 4 },
        { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 }
      ],
      minScore: 5
    },
    {
      element: "stage_icon_3",
      conditions: [
        { variable: "toneProfile", values: ["confident-playful", "friendly-approachable"], weight: 4 },
        { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 }
      ],
      minScore: 5
    },
    {
      element: "cta_text",
      conditions: [
        { variable: "landingPageGoals", values: ["lead-capture", "trial-signup"], weight: 4 },
        { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 },
        { variable: "copyIntent", values: ["desire-led"], weight: 2 }
      ],
      minScore: 6
    }
  ],

  "Comparison_PersonaUseCaseCompare": [
    {
      element: "outcome_comparisons",
      conditions: [
        { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
        { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 3 },
        { variable: "copyIntent", values: ["desire-led"], weight: 2 }
      ],
      minScore: 6
    }
  ],

  "Comparison_LiteVsProVsEnterprise": [
    {
      element: "recommended_labels",
      conditions: [
        { variable: "pricingModel", values: ["tiered", "per-seat"], weight: 4 },
        { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 3 },
        { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
      ],
      minScore: 6
    }
  ],

  // FAQ Section Rules

"FAQ_AccordionFAQ": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "question_4",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 6
  },
  {
    element: "question_5",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 3 }
    ],
    minScore: 6
  },
  {
    element: "expand_icon",
    conditions: [
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 3 },
      { variable: "targetAudience", values: ["creators", "solopreneurs", "indie-hackers"], weight: 2 }
    ],
    minScore: 4
  },
  {
    element: "collapse_icon",
    conditions: [
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 3 },
      { variable: "targetAudience", values: ["creators", "solopreneurs", "indie-hackers"], weight: 2 }
    ],
    minScore: 4
  }
],

"FAQ_TwoColumnFAQ": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "left_question_3",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 6
  },
  {
    element: "right_question_3",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 6
  },
  {
    element: "left_column_title",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "developers"], weight: 3 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "right_column_title",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "developers"], weight: 3 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 2 }
    ],
    minScore: 6
  }
],

"FAQ_InlineQnAList": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 },
      { variable: "copyIntent", values: ["pain-led"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "question_4",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "developers", "product-managers"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "question_5",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 3 }
    ],
    minScore: 7
  },
  {
    element: "question_6",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 5 },
      { variable: "awarenessLevel", values: ["product-aware"], weight: 3 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 2 }
    ],
    minScore: 7
  }
],

"FAQ_SegmentedFAQTabs": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "tab_3_label",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 3 }
    ],
    minScore: 6
  },
  {
    element: "tab_1_description",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "developers", "product-managers"], weight: 3 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "tab_2_description",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "developers", "product-managers"], weight: 3 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "tab_3_description",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "developers", "product-managers"], weight: 3 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "tab_1_question_2",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 6
  },
  {
    element: "tab_2_question_2",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 6
  }
],

"FAQ_QuoteStyleAnswers": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "question_3",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 3 }
    ],
    minScore: 6
  },
  {
    element: "question_4",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 },
      { variable: "startupStage", values: ["users-500-1k", "users-1k-5k", "mrr-growth"], weight: 3 }
    ],
    minScore: 6
  },
  {
    element: "question_5",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-5"], weight: 4 },
      { variable: "startupStage", values: ["users-1k-5k", "mrr-growth"], weight: 3 }
    ],
    minScore: 6
  },
  {
    element: "quote_style",
    conditions: [
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 3 },
      { variable: "copyIntent", values: ["desire-led"], weight: 2 }
    ],
    minScore: 4
  },
  {
    element: "attribution_style",
    conditions: [
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 },
      { variable: "copyIntent", values: ["desire-led"], weight: 3 },
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 2 }
    ],
    minScore: 6
  }
],

"FAQ_IconWithAnswers": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "question_4",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 6
  },
  {
    element: "question_5",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 6
  },
  {
    element: "question_6",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["product-aware"], weight: 3 }
    ],
    minScore: 6
  },
  {
    element: "icon_position",
    conditions: [
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 3 },
      { variable: "targetAudience", values: ["creators", "solopreneurs", "indie-hackers"], weight: 2 }
    ],
    minScore: 4
  },
  {
    element: "icon_size",
    conditions: [
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 3 },
      { variable: "targetAudience", values: ["creators", "solopreneurs", "indie-hackers"], weight: 2 }
    ],
    minScore: 4
  }
],

"FAQ_TestimonialFAQs": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "question_3",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 3 }
    ],
    minScore: 6
  },
  {
    element: "question_4",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 },
      { variable: "startupStage", values: ["users-500-1k", "users-1k-5k", "mrr-growth"], weight: 3 }
    ],
    minScore: 6
  },
  {
    element: "question_5",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-5"], weight: 4 },
      { variable: "startupStage", values: ["users-1k-5k", "mrr-growth"], weight: 3 }
    ],
    minScore: 6
  },
  {
    element: "customer_title_1",
    conditions: [
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "customer_company_1",
    conditions: [
      { variable: "startupStage", values: ["users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "testimonial_style",
    conditions: [
      { variable: "toneProfile", values: ["friendly-helpful", "professional-trustworthy"], weight: 3 },
      { variable: "copyIntent", values: ["desire-led"], weight: 2 }
    ],
    minScore: 4
  }
],

"FAQ_ChatBubbleFAQ": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "question_3",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 6
  },
  {
    element: "question_4",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 6
  },
  {
    element: "question_5",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["product-aware"], weight: 3 }
    ],
    minScore: 6
  },
  {
    element: "customer_persona_name",
    conditions: [
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 4 },
      { variable: "targetAudience", values: ["creators", "solopreneurs", "indie-hackers", "early-stage-founders"], weight: 3 }
    ],
    minScore: 6
  },
  {
    element: "support_persona_name",
    conditions: [
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 4 },
      { variable: "targetAudience", values: ["creators", "solopreneurs", "indie-hackers", "early-stage-founders"], weight: 3 }
    ],
    minScore: 6
  },
  {
    element: "chat_style",
    conditions: [
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 4 },
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 2 }
    ],
    minScore: 5
  },
  {
    element: "bubble_alignment",
    conditions: [
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 3 },
      { variable: "targetAudience", values: ["creators", "solopreneurs", "indie-hackers"], weight: 2 }
    ],
    minScore: 4
  }
],

// Features Section Rules - Add these to elementRules object

"Features_IconGrid": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 },
      { variable: "copyIntent", values: ["pain-led"], weight: 2 }
    ],
    minScore: 5
  }
],

"Features_SplitAlternating": [
  {
    element: "feature_benefits",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 3 },
      { variable: "copyIntent", values: ["desire-led"], weight: 2 }
    ],
    minScore: 6
  }
],

"Features_Tabbed": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 }
    ],
    minScore: 5
  }
],

"Features_Timeline": [
  {
    element: "timeline_dates",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "targetAudience", values: ["developers", "product-managers", "enterprise-tech-teams"], weight: 3 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "milestone_labels",
    conditions: [
      { variable: "copyIntent", values: ["desire-led"], weight: 4 },
      { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 3 }
    ],
    minScore: 5
  }
],

"Features_FeatureTestimonial": [
  {
    element: "customer_titles",
    conditions: [
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 3 }
    ],
    minScore: 5
  }
],

"Features_MetricTiles": [
  {
    element: "metric_descriptions",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 },
      { variable: "copyIntent", values: ["pain-led"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k"], weight: 3 }
    ],
    minScore: 5
  }
],

"Features_MiniCards": [
  {
    element: "card_tags",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "targetAudience", values: ["developers", "product-managers", "no-code-builders"], weight: 3 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 2 }
    ],
    minScore: 6
  }
],

"Features_Carousel": [
  {
    element: "navigation_labels",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 4 },
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "slide_numbers",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "targetAudience", values: ["developers", "product-managers", "enterprise-tech-teams"], weight: 3 }
    ],
    minScore: 5
  }
],

// FounderNote Section Rules - Add these to elementRules object

"FounderNote_FounderCardWithQuote": [
  {
    element: "founder_bio",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "targetAudience", values: ["early-stage-founders", "solopreneurs", "indie-hackers"], weight: 3 },
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "company_context",
    conditions: [
      { variable: "startupStage", values: ["problem-exploration", "pre-mvp", "mvp-development", "mvp-launched"], weight: 4 },
      { variable: "copyIntent", values: ["pain-led"], weight: 3 },
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 2 }
    ],
    minScore: 6
  }
],

"FounderNote_LetterStyleBlock": [
  {
    element: "date",
    conditions: [
      { variable: "toneProfile", values: ["friendly-helpful", "luxury-expert"], weight: 4 },
      { variable: "targetAudience", values: ["early-stage-founders", "solopreneurs", "creators"], weight: 3 },
      { variable: "copyIntent", values: ["desire-led"], weight: 2 }
    ],
    minScore: 6
  }
],

"FounderNote_VideoNoteWithTranscript": [
  {
    element: "video_duration",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "mid-market-companies"], weight: 2 }
    ],
    minScore: 6
  }
],

"FounderNote_MissionQuoteOverlay": [
  {
    element: "context_text",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "copyIntent", values: ["pain-led"], weight: 3 },
      { variable: "targetAudience", values: ["early-stage-founders", "solopreneurs", "creators"], weight: 2 }
    ],
    minScore: 6
  }
],

"FounderNote_TimelineToToday": [
  {
    element: "event_dates",
    conditions: [
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
      { variable: "copyIntent", values: ["desire-led"], weight: 2 }
    ],
    minScore: 6
  }
],

"FounderNote_SideBySidePhotoStory": [
  {
    element: "photo_caption",
    conditions: [
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 4 },
      { variable: "targetAudience", values: ["creators", "solopreneurs", "early-stage-founders"], weight: 3 },
      { variable: "copyIntent", values: ["desire-led"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "story_conclusion",
    conditions: [
      { variable: "copyIntent", values: ["desire-led"], weight: 4 },
      { variable: "landingPageGoals", values: ["signup", "join-community", "waitlist"], weight: 3 },
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 2 }
    ],
    minScore: 6
  }
],

"FounderNote_StoryBlockWithPullquote": [
  {
    element: "story_context",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "copyIntent", values: ["pain-led"], weight: 3 },
      { variable: "targetAudience", values: ["early-stage-founders", "solopreneurs", "creators"], weight: 2 }
    ],
    minScore: 6
  }
],

"FounderNote_FoundersBeliefStack": [
  {
    element: "belief_explanations",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 },
      { variable: "copyIntent", values: ["pain-led"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "company_mission",
    conditions: [
      { variable: "startupStage", values: ["problem-exploration", "pre-mvp", "mvp-development"], weight: 4 },
      { variable: "copyIntent", values: ["desire-led"], weight: 3 },
      { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 2 }
    ],
    minScore: 6
  }
],


// Hero Section Rules - Add these to elementRules object

"Hero_leftCopyRightImage": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 },
      { variable: "copyIntent", values: ["pain-led"], weight: 2 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }
    ],
    minScore: 4
  },
  {
    element: "supporting_text",
    conditions: [
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 4 },
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 },
      { variable: "landingPageGoals", values: ["demo", "contact-sales"], weight: 2 }
    ],
    minScore: 5
  },
  {
    element: "badge_text",
    conditions: [
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth", "seed-funded"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
      { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "trust_item_1",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 4
  },
  {
    element: "trust_item_2",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 4
  },
  {
    element: "trust_item_3",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "customer_count",
    conditions: [
      { variable: "startupStage", values: ["users-500-1k", "users-1k-5k", "mrr-growth", "seed-funded"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "rating_value",
    conditions: [
      { variable: "startupStage", values: ["users-250-500", "users-500-1k", "users-1k-5k"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }
    ],
    minScore: 5
  }
],

"Hero_centerStacked": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "copyIntent", values: ["pain-led"], weight: 3 },
      { variable: "landingPageGoals", values: ["waitlist", "early-access", "signup"], weight: 2 }
    ],
    minScore: 5
  },
  {
    element: "supporting_text",
    conditions: [
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "it-decision-makers"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "secondary_cta_text",
    conditions: [
      { variable: "landingPageGoals", values: ["free-trial", "demo", "book-call"], weight: 4 },
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "badge_text",
    conditions: [
      { variable: "startupStage", values: ["users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "trust_item_1",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 4
  },
  {
    element: "trust_item_2",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 4
  },
  {
    element: "trust_item_3",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 5
  }
],

"Hero_splitScreen": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "copyIntent", values: ["pain-led"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "supporting_text",
    conditions: [
      { variable: "targetAudience", values: ["enterprise-tech-teams", "product-managers"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "badge_text",
    conditions: [
      { variable: "startupStage", values: ["users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "value_proposition",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "copyIntent", values: ["desire-led"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "trust_item_1",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 4
  },
  {
    element: "trust_item_2",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 4
  },
  {
    element: "trust_item_3",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 5
  }
],

"Hero_imageFirst": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "copyIntent", values: ["pain-led"], weight: 3 },
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "supporting_text",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "targetAudience", values: ["developers", "product-managers", "no-code-builders"], weight: 3 },
      { variable: "landingPageGoals", values: ["demo", "free-trial"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "badge_text",
    conditions: [
      { variable: "startupStage", values: ["users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "trust_item_1",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 4
  },
  {
    element: "trust_item_2",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 4
  },
  {
    element: "trust_item_3",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 5
  }
],

// HowItWorks Section Rules
"HowItWorks_ThreeStepHorizontal": [
  {
    element: "step_numbers",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware", "solution-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "conclusion_text",
    conditions: [
      { variable: "copyIntent", values: ["desire-led"], weight: 4 },
      { variable: "landingPageGoals", values: ["free-trial", "signup", "demo"], weight: 3 }
    ],
    minScore: 5
  }
],

"HowItWorks_VerticalTimeline": [
  {
    element: "timeline_connector_text",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "copyIntent", values: ["desire-led"], weight: 3 },
      { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 2 }
    ],
    minScore: 6
  }
],

"HowItWorks_IconCircleSteps": [
  {
    element: "step_labels",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 },
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 2 }
    ],
    minScore: 6
  }
],

"HowItWorks_AccordionSteps": [
  {
    element: "step_details",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 },
      { variable: "targetAudience", values: ["developers", "product-managers", "enterprise-tech-teams"], weight: 2 }
    ],
    minScore: 6
  }
],

"HowItWorks_CardFlipSteps": [
  {
    element: "step_details",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
      { variable: "targetAudience", values: ["developers", "product-managers", "no-code-builders"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "flip_instruction",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 4 },
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 3 }
    ],
    minScore: 5
  }
],

"HowItWorks_VideoWalkthrough": [
  {
    element: "chapter_titles",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
      { variable: "targetAudience", values: ["developers", "product-managers", "enterprise-tech-teams"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "video_duration",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }
    ],
    minScore: 5
  }
],

"HowItWorks_ZigzagImageSteps": [
  {
    element: "image_captions",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 },
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 2 }
    ],
    minScore: 6
  }
],

"HowItWorks_AnimatedProcessLine": [
  {
    element: "animation_labels",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 4 },
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 },
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 2 }
    ],
    minScore: 6
  }
],

// Integration Section Rules - Add these to elementRules object

"Integration_LogoGrid": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "targetAudience", values: ["developers", "product-managers", "startup-ctos"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "category_labels",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "developers"], weight: 3 }
    ],
    minScore: 5
  }
],

"Integration_CategoryAccordion": [
  {
    element: "category_descriptions",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 },
      { variable: "targetAudience", values: ["smbs", "early-stage-startups", "solopreneurs"], weight: 2 }
    ],
    minScore: 6
  }
],

"Integration_InteractiveStackDiagram": [
  {
    element: "interaction_labels",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "targetAudience", values: ["developers", "product-managers", "enterprise-tech-teams"], weight: 3 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 2 }
    ],
    minScore: 6
  }
],

"Integration_UseCaseTiles": [
  {
    element: "integration_lists",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "mid-market-companies"], weight: 2 }
    ],
    minScore: 6
  }
],

"Integration_BadgeCarousel": [
  {
    element: "carousel_navigation",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 4 },
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 }
    ],
    minScore: 5
  }
],

"Integration_TabbyIntegrationCards": [
  {
    element: "setup_instructions",
    conditions: [
      { variable: "targetAudience", values: ["developers", "product-managers", "no-code-builders"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
    ],
    minScore: 6
  }
],

"Integration_ZapierLikeBuilderPreview": [
  {
    element: "builder_instructions",
    conditions: [
      { variable: "targetAudience", values: ["no-code-builders", "product-managers", "solopreneurs"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4"], weight: 2 }
    ],
    minScore: 6
  }
],

"Integration_LogoWithQuoteUse": [
  {
    element: "customer_titles",
    conditions: [
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
    ],
    minScore: 6
  }
],


// Objection Section Rules - Add these to elementRules object

"Objection_ObjectionAccordion": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
      { variable: "copyIntent", values: ["desire-led"], weight: 2 }
    ],
    minScore: 6
  }
],

"Objection_MythVsRealityGrid": [
  // No optional elements for this layout
],

"Objection_QuoteBackedAnswers": [
  {
    element: "source_credentials",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "it-decision-makers"], weight: 3 },
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k"], weight: 2 }
    ],
    minScore: 6
  }
],

"Objection_VisualObjectionTiles": [
  {
    element: "tile_labels",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 },
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 2 }
    ],
    minScore: 6
  }
],

"Objection_ProblemToReframeBlocks": [
  {
    element: "transition_text",
    conditions: [
      { variable: "copyIntent", values: ["desire-led"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 },
      { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 2 }
    ],
    minScore: 6
  }
],

"Objection_SkepticToBelieverSteps": [
  {
    element: "step_explanations",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 },
      { variable: "copyIntent", values: ["desire-led"], weight: 2 }
    ],
    minScore: 6
  }
],

"Objection_BoldGuaranteePanel": [
  {
    element: "risk_reversal_text",
    conditions: [
      { variable: "landingPageGoals", values: ["buy-now", "free-trial", "subscribe"], weight: 4 },
    //  { variable: "pricingModifier", values: ["money-back"], weight: 3 },
      { variable: "toneProfile", values: ["bold-persuasive", "confident-playful"], weight: 2 }
    ],
    minScore: 6
  }
],

// "Objection_ObjectionCarousel": [ // Temporarily disabled - not useful currently
//   {
//     element: "carousel_navigation",
//     conditions: [
//       { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 4 },
//       { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 }
//     ],
//     minScore: 5
//   }
// ],

// Pricing Section Rules - Add these to elementRules object

"Pricing_TierCards": [
  {
    element: "feature_lists",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
      { variable: "pricingModel", values: ["tiered", "per-seat"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "popular_labels",
    conditions: [
      { variable: "pricingModel", values: ["tiered", "freemium"], weight: 4 },
      { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 2 }
    ],
    minScore: 4
  }
],

"Pricing_ToggleableMonthlyYearly": [
  {
    element: "savings_labels",
    conditions: [
      { variable: "pricingModel", values: ["tiered", "flat-monthly"], weight: 4 },
      { variable: "landingPageGoals", values: ["buy-now", "subscribe", "free-trial"], weight: 3 },
      { variable: "toneProfile", values: ["bold-persuasive", "confident-playful"], weight: 2 }
    ],
    minScore: 6
  }
],

"Pricing_FeatureMatrix": [
  // No optional elements for this layout - all are mandatory
],

"Pricing_SegmentBasedPricing": [
  {
    element: "ideal_for_labels",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
    ],
    minScore: 6
  }
],

"Pricing_SliderPricing": [
  {
    element: "calculator_instructions",
    conditions: [
      { variable: "pricingModel", values: ["usage-based", "per-seat"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
    ],
    minScore: 6
  }
],

"Pricing_CallToQuotePlan": [
  {
    element: "feature_highlights",
    conditions: [
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "it-decision-makers"], weight: 4 },
      { variable: "landingPageGoals", values: ["contact-sales", "book-call"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "contact_information",
    conditions: [
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 4 },
      { variable: "landingPageGoals", values: ["contact-sales", "book-call"], weight: 3 }
    ],
    minScore: 5
  }
],

"Pricing_CardWithTestimonial": [
  {
    element: "customer_titles",
    conditions: [
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
    ],
    minScore: 6
  }
],

"Pricing_MiniStackedCards": [
  {
    element: "card_badges",
    conditions: [
      { variable: "pricingModel", values: ["tiered", "freemium"], weight: 4 },
      { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 3 },
      { variable: "landingPageGoals", values: ["buy-now", "free-trial", "subscribe"], weight: 2 }
    ],
    minScore: 6
  }
],

// Problem Section Rules - Add these to elementRules object

"Problem_StackedPainBullets": [
  {
    element: "pain_descriptions",
    conditions: [
      { variable: "copyIntent", values: ["pain-led"], weight: 5 },
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "subheadline",
    conditions: [
      { variable: "copyIntent", values: ["pain-led"], weight: 4 },
      { variable: "problemType", values: ["burnout-or-overload", "lost-revenue-or-inefficiency"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "conclusion_text",
    conditions: [
      { variable: "copyIntent", values: ["pain-led"], weight: 4 },
      { variable: "toneProfile", values: ["friendly-helpful", "empathetic-supportive"], weight: 3 },
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 2 }
    ],
    minScore: 6
  }
],

"Problem_BeforeImageAfterText": [
  {
    element: "image_caption",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "copyIntent", values: ["pain-led"], weight: 3 },
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "subheadline",
    conditions: [
      { variable: "copyIntent", values: ["pain-led"], weight: 4 },
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 },
      { variable: "problemType", values: ["lost-revenue-or-inefficiency", "competitive-disadvantage"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "supporting_text",
    conditions: [
      { variable: "copyIntent", values: ["desire-led"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3"], weight: 3 }
    ],
    minScore: 5
  }
],

"Problem_SideBySideSplit": [
  {
    element: "solution_preview",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "copyIntent", values: ["desire-led"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "problem_points",
    conditions: [
      { variable: "copyIntent", values: ["pain-led"], weight: 4 },
      { variable: "problemType", values: ["lost-revenue-or-inefficiency", "manual-repetition"], weight: 3 },
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "solution_points",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "copyIntent", values: ["desire-led"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "transition_text",
    conditions: [
      { variable: "copyIntent", values: ["desire-led"], weight: 4 },
      { variable: "toneProfile", values: ["confident-playful", "friendly-helpful"], weight: 3 },
      { variable: "landingPageGoals", values: ["signup", "start-trial"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "bottom_stat_1",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "problemType", values: ["lost-revenue-or-inefficiency", "competitive-disadvantage"], weight: 3 }
    ],
    minScore: 5
  }
],

"Problem_EmotionalQuotes": [
  {
    element: "context_text",
    conditions: [
      { variable: "copyIntent", values: ["pain-led"], weight: 4 },
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 3 },
      { variable: "problemType", values: ["burnout-or-overload", "personal-growth-or-productivity"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "quote_categories",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "copyIntent", values: ["pain-led"], weight: 3 },
      { variable: "problemType", values: ["burnout-or-overload", "personal-growth-or-productivity"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "emotional_impact",
    conditions: [
      { variable: "copyIntent", values: ["pain-led"], weight: 4 },
      { variable: "toneProfile", values: ["empathetic-supportive", "friendly-helpful"], weight: 3 }
    ],
    minScore: 5
  }
],

"Problem_CollapsedCards": [
  {
    element: "expand_labels",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 },
      { variable: "copyIntent", values: ["desire-led"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "problem_impacts",
    conditions: [
      { variable: "copyIntent", values: ["pain-led"], weight: 4 },
      { variable: "problemType", values: ["lost-revenue-or-inefficiency", "competitive-disadvantage"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "solution_hints",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "copyIntent", values: ["desire-led"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "intro_text",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "toneProfile", values: ["friendly-helpful"], weight: 3 }
    ],
    minScore: 5
  }
],

"Problem_PainMeterChart": [
  {
    element: "chart_labels",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 4 },
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 },
      { variable: "toneProfile", values: ["friendly-helpful"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "category_descriptions",
    conditions: [
      { variable: "copyIntent", values: ["pain-led"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3"], weight: 3 },
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "intro_text",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "benchmark_text",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 },
      { variable: "problemType", values: ["lost-revenue-or-inefficiency"], weight: 3 }
    ],
    minScore: 5
  }
],

"Problem_PersonaPanels": [
  {
    element: "persona_descriptions",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 },
      { variable: "copyIntent", values: ["pain-led"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "persona_titles",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "mid-market-companies"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "persona_pain_points",
    conditions: [
      { variable: "copyIntent", values: ["pain-led"], weight: 4 },
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 },
      { variable: "problemType", values: ["burnout-or-overload", "personal-growth-or-productivity"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "intro_text",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware"], weight: 4 },
      { variable: "toneProfile", values: ["friendly-helpful"], weight: 3 }
    ],
    minScore: 5
  }
],

"Problem_ProblemChecklist": [
  {
    element: "conclusion_text",
    conditions: [
      { variable: "copyIntent", values: ["desire-led"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 },
      { variable: "landingPageGoals", values: ["free-trial", "demo", "signup"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "intro_text",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "copyIntent", values: ["pain-led"], weight: 3 },
      { variable: "toneProfile", values: ["friendly-helpful"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "scoring_labels",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "problemType", values: ["personal-growth-or-productivity", "burnout-or-overload"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "result_stat_1",
    conditions: [
      { variable: "landingPageGoals", values: ["signup", "start-trial", "book-demo"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4"], weight: 3 }
    ],
    minScore: 5
  }
],

// Results Section Rules - Add these to elementRules object

"Results_StatBlocks": [
  {
    element: "stat_descriptions",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 },
      { variable: "copyIntent", values: ["pain-led"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k"], weight: 3 }
    ],
    minScore: 5
  }
],

"Results_BeforeAfterStats": [
  {
    element: "improvement_labels",
    conditions: [
      { variable: "copyIntent", values: ["desire-led"], weight: 4 },
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 3 },
      { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 2 }
    ],
    minScore: 6
  }
],

"Results_QuoteWithMetric": [
  {
    element: "customer_titles",
    conditions: [
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
    ],
    minScore: 6
  }
],

"Results_EmojiOutcomeGrid": [
  {
    element: "emojis",
    conditions: [
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 4 },
      { variable: "targetAudience", values: ["creators", "solopreneurs", "early-stage-founders"], weight: 3 },
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "subheadline",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 3 },
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 },
      { variable: "targetAudience", values: ["creators", "solopreneurs"], weight: 2 }
    ],
    minScore: 5
  },
  {
    element: "footer_text",
    conditions: [
      { variable: "copyIntent", values: ["desire-led", "trust-led"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4"], weight: 2 },
      { variable: "targetAudience", values: ["early-stage-founders", "growth-stage-founders"], weight: 2 }
    ],
    minScore: 4
  }
],

"Results_TimelineResults": [
  {
    element: "milestone_markers",
    conditions: [
      { variable: "copyIntent", values: ["desire-led"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k"], weight: 2 }
    ],
    minScore: 6
  }
],

"Results_OutcomeIcons": [
  {
    element: "icon_labels",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 },
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 2 }
    ],
    minScore: 6
  }
],

"Results_StackedWinsList": [
  {
    element: "win_descriptions",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "copyIntent", values: ["pain-led"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "category_labels",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }
    ],
    minScore: 5
  }
],

"Results_PersonaResultPanels": [
  {
    element: "success_metrics",
    conditions: [
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
      { variable: "copyIntent", values: ["desire-led"], weight: 2 }
    ],
    minScore: 6
  }
],

// Security Section Rules - Add these to elementRules object

"Security_TrustSealCollection": [
  {
    element: "badge_descriptions",
    conditions: [
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "it-decision-makers"], weight: 5 },
      { variable: "marketSubcategory", values: ["Healthcare & MedTech SaaS", "LegalTech SaaS"], weight: 3 }
    ],
    minScore: 6
  },
  {
    element: "subheadline",
    conditions: [
      { variable: "targetAudience", values: ["enterprise-tech-teams", "it-decision-makers"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 2 }
    ],
    minScore: 4
  }
],

"Security_SecurityChecklist": [
  {
    element: "item_descriptions",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "it-decision-makers", "developers"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "compliance_note",
    conditions: [
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "it-decision-makers"], weight: 4 },
      { variable: "marketSubcategory", values: ["Healthcare & MedTech SaaS", "LegalTech SaaS"], weight: 3 }
    ],
    minScore: 5
  }
],

"Security_AuditResultsPanel": [
  {
    element: "audit_dates",
    conditions: [
      { variable: "targetAudience", values: ["enterprise-tech-teams", "it-decision-makers"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 3 },
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k"], weight: 2 }
    ],
    minScore: 6
  }
],

"Security_PenetrationTestResults": [
  {
    element: "test_descriptions",
    conditions: [
      { variable: "targetAudience", values: ["developers", "enterprise-tech-teams", "startup-ctos"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 3 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "test_dates",
    conditions: [
      { variable: "targetAudience", values: ["enterprise-tech-teams", "it-decision-makers"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 3 }
    ],
    minScore: 5
  }
],

"Security_SecurityGuaranteePanel": [
  {
    element: "stat_descriptions",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 },
      { variable: "targetAudience", values: ["smbs", "early-stage-startups"], weight: 2 }
    ],
    minScore: 6
  }
],

"Security_PrivacyCommitmentBlock": [
  {
    element: "policy_details",
    conditions: [
      { variable: "targetAudience", values: ["enterprise-tech-teams", "it-decision-makers"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 3 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "expand_labels",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 4 },
      { variable: "toneProfile", values: ["friendly-helpful"], weight: 3 }
    ],
    minScore: 5
  }
],

// SocialProof Section Rules - Add these to elementRules object

"SocialProof_LogoWall": [
  {
    element: "subheadline",
    conditions: [
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 },
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "category_labels",
    conditions: [
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }
    ],
    minScore: 5
  }
],

"SocialProof_MediaMentions": [
  {
    element: "mention_dates",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 3 },
      { variable: "toneProfile", values: ["luxury-expert", "confident-playful"], weight: 2 }
    ],
    minScore: 6
  }
],

"SocialProof_UserCountBar": [
  {
    element: "growth_stats",
    conditions: [
      { variable: "startupStage", values: ["users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth", "seed-funded"], weight: 4 },
      { variable: "copyIntent", values: ["desire-led"], weight: 3 },
      { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 2 }
    ],
    minScore: 6
  }
],

"SocialProof_IndustryBadgeLine": [
  {
    element: "badge_descriptions",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 },
      { variable: "targetAudience", values: ["smbs", "early-stage-startups"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "industry_context",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "mid-market-companies"], weight: 3 }
    ],
    minScore: 5
  }
],

"SocialProof_MapHeatSpots": [
  {
    element: "map_legend",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 4 },
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 },
      { variable: "toneProfile", values: ["friendly-helpful"], weight: 2 }
    ],
    minScore: 6
  }
],

"SocialProof_StackedStats": [
  {
    element: "stat_contexts",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 },
      { variable: "copyIntent", values: ["pain-led"], weight: 2 }
    ],
    minScore: 6
  }
],

"SocialProof_StripWithReviews": [
  {
    element: "rating_scores",
    conditions: [
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
      { variable: "copyIntent", values: ["desire-led"], weight: 2 }
    ],
    minScore: 6
  }
],

"SocialProof_SocialProofStrip": [
  {
    element: "credibility_markers",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k"], weight: 3 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 2 }
    ],
    minScore: 6
  }
],

// Testimonial Section Rules - Add these to elementRules object

"Testimonial_QuoteGrid": [
  {
    element: "customer_titles",
    conditions: [
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 4 },
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "customer_companies",
    conditions: [
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "it-decision-makers"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }
    ],
    minScore: 5
  }
],

"Testimonial_VideoTestimonials": [
  {
    element: "customer_titles",
    conditions: [
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
    ],
    minScore: 6
  }
],

"Testimonial_AvatarCarousel": [
  {
    element: "customer_titles",
    conditions: [
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 4 },
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k"], weight: 3 }
    ],
    minScore: 5
  },
  {
    element: "carousel_navigation",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 4 },
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 }
    ],
    minScore: 5
  }
],

"Testimonial_BeforeAfterQuote": [
  {
    element: "transformation_labels",
    conditions: [
      { variable: "copyIntent", values: ["desire-led"], weight: 4 },
      { variable: "problemType", values: ["lost-revenue-or-inefficiency", "manual-repetition", "burnout-or-overload"], weight: 3 },
      { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 2 }
    ],
    minScore: 6
  }
],

"Testimonial_SegmentedTestimonials": [
  {
    element: "customer_titles",
    conditions: [
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k"], weight: 2 }
    ],
    minScore: 6
  }
],

"Testimonial_RatingCards": [
  {
    element: "review_dates",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k"], weight: 3 },
      { variable: "copyIntent", values: ["desire-led"], weight: 2 }
    ],
    minScore: 6
  }
],

"Testimonial_PullQuoteStack": [
  {
    element: "quote_contexts",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "copyIntent", values: ["pain-led"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }
    ],
    minScore: 6
  }
],

"Testimonial_InteractiveTestimonialMap": [
  {
    element: "location_labels",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 4 },
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 },
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 2 }
    ],
    minScore: 6
  }
],

// UniqueMechanism Section Rules - Updated to match actual component implementations

"UniqueMechanism_AlgorithmExplainer": [
  {
    element: "algorithm_step_4",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 },
      { variable: "targetAudience", values: ["developers", "enterprise-tech-teams", "startup-ctos"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "algorithm_step_5",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["product-aware"], weight: 3 },
      { variable: "targetAudience", values: ["developers", "enterprise-tech-teams"], weight: 2 }
    ],
    minScore: 7
  },
  {
    element: "algorithm_step_6",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-5"], weight: 4 },
      { variable: "targetAudience", values: ["developers", "enterprise-tech-teams"], weight: 3 },
      { variable: "copyIntent", values: ["desire-led"], weight: 2 }
    ],
    minScore: 8
  }
],

"UniqueMechanism_InnovationTimeline": [
  {
    element: "timeline_item_4",
    conditions: [
      { variable: "startupStage", values: ["users-250-500", "users-500-1k", "users-1k-5k"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
      { variable: "copyIntent", values: ["desire-led"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "timeline_item_5",
    conditions: [
      { variable: "startupStage", values: ["users-500-1k", "users-1k-5k"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 3 },
      { variable: "copyIntent", values: ["desire-led"], weight: 2 }
    ],
    minScore: 7
  },
  {
    element: "timeline_item_6",
    conditions: [
      { variable: "startupStage", values: ["users-1k-5k"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-5"], weight: 3 },
      { variable: "copyIntent", values: ["desire-led"], weight: 2 }
    ],
    minScore: 8
  }
],

"UniqueMechanism_MethodologyBreakdown": [
  {
    element: "principle_4",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 },
      { variable: "targetAudience", values: ["developers", "product-managers", "enterprise-tech-teams"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "principle_5",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["product-aware"], weight: 3 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "developers"], weight: 2 }
    ],
    minScore: 7
  },
  {
    element: "result_metric_1",
    conditions: [
      { variable: "copyIntent", values: ["desire-led"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "results_title",
    conditions: [
      { variable: "copyIntent", values: ["desire-led"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 3 },
      { variable: "awarenessLevel", values: ["product-aware"], weight: 2 }
    ],
    minScore: 7
  }
],

"UniqueMechanism_ProcessFlowDiagram": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 3 },
      { variable: "toneProfile", values: ["friendly-helpful"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "benefits_title",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
      { variable: "copyIntent", values: ["desire-led"], weight: 2 }
    ],
    minScore: 7
  },
  {
    element: "benefit_titles",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 3 },
      { variable: "copyIntent", values: ["desire-led"], weight: 2 }
    ],
    minScore: 8
  }
],

"UniqueMechanism_PropertyComparisonMatrix": [
  // No optional elements - all fields are mandatory for comparison table functionality
],

"UniqueMechanism_SecretSauceReveal": [
  {
    element: "secret_icon",
    conditions: [
      { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
      { variable: "targetAudience", values: ["creators", "founders"], weight: 2 }
    ],
    minScore: 6
  }
],

"UniqueMechanism_StackedHighlights": [
  {
    element: "mechanism_name",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 },
      { variable: "copyIntent", values: ["desire-led"], weight: 3 },
      { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "footer_text",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 },
      { variable: "copyIntent", values: ["desire-led"], weight: 3 },
      { variable: "toneProfile", values: ["luxury-expert", "confident-playful"], weight: 2 }
    ],
    minScore: 7
  },
  {
    element: "highlight_icon_1",
    conditions: [
      { variable: "toneProfile", values: ["confident-playful", "friendly-helpful"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4"], weight: 3 },
      { variable: "targetAudience", values: ["creators", "founders"], weight: 2 }
    ],
    minScore: 6
  }
],

"UniqueMechanism_SystemArchitecture": [
  {
    element: "component_4",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 },
      { variable: "targetAudience", values: ["developers", "enterprise-tech-teams"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "component_5",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 },
      { variable: "awarenessLevel", values: ["product-aware"], weight: 3 },
      { variable: "targetAudience", values: ["developers", "enterprise-tech-teams"], weight: 2 }
    ],
    minScore: 7
  },
  {
    element: "component_6",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-5"], weight: 4 },
      { variable: "targetAudience", values: ["developers", "enterprise-tech-teams"], weight: 3 },
      { variable: "copyIntent", values: ["desire-led"], weight: 2 }
    ],
    minScore: 8
  }
],

"UniqueMechanism_TechnicalAdvantage": [
  {
    element: "advantage_descriptions",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
      { variable: "targetAudience", values: ["developers", "enterprise-tech-teams", "product-managers"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "advantage_icon_1",
    conditions: [
      { variable: "toneProfile", values: ["confident-playful", "friendly-helpful"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4"], weight: 3 },
      { variable: "targetAudience", values: ["creators", "founders"], weight: 2 }
    ],
    minScore: 6
  }
],

// UseCase Section Rules - Add these to elementRules object

"UseCase_PersonaGrid": [
  {
    element: "use_case_examples",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
      { variable: "copyIntent", values: ["desire-led"], weight: 2 }
    ],
    minScore: 6
  }
],

"UseCase_UseCaseCarousel": [
  {
    element: "carousel_navigation",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 },
      { variable: "targetAudience", values: ["founders", "creators"], weight: 2 }
    ],
    minScore: 6
  }
],

"UseCase_IndustryUseCaseGrid": [
  {
    element: "industry_examples",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise", "businesses"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
    ],
    minScore: 6
  }
],

"UseCase_RoleBasedScenarios": [
  {
    element: "role_scenarios",
    conditions: [
      { variable: "copyIntent", values: ["desire-led"], weight: 4 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 },
      { variable: "targetAudience", values: ["enterprise", "builders"], weight: 2 }
    ],
    minScore: 6
  }
],


"UseCase_CustomerJourneyFlow": [
  {
    element: "journey_steps",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "copyIntent", values: ["desire-led"], weight: 3 },
      { variable: "targetAudience", values: ["businesses", "marketers"], weight: 2 }
    ],
    minScore: 6
  }
],

"UseCase_WorkflowDiagrams": [
  {
    element: "workflow_steps",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "targetAudience", values: ["builders", "enterprise"], weight: 3 },
      { variable: "copyIntent", values: ["desire-led"], weight: 2 }
    ],
    minScore: 6
  }
],

// "UseCase_BeforeAfterWorkflow": [
//   {
//     element: "before_after_steps",
//     conditions: [
//       { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
//       { variable: "targetAudience", values: ["businesses", "enterprise"], weight: 3 },
//       { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 2 }
//     ],
//     minScore: 6
//   }
// ],

"UseCase_InteractiveUseCaseMap": [
  {
    element: "interactive_elements",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise", "builders"], weight: 3 },
      { variable: "awarenessLevel", values: ["product-aware", "most-aware"], weight: 2 }
    ],
    minScore: 6
  }
],

// PrimaryCTA Section Rules - Enhanced field selection logic
"CTA_CenteredHeadlineCTA": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "copyIntent", values: ["pain-led"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "urgency_text",
    conditions: [
      { variable: "landingPageGoals", values: ["buy-now", "free-trial", "early-access"], weight: 4 },
      { variable: "toneProfile", values: ["bold-persuasive"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "trust_item_1",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware", "solution-aware"], weight: 4 },
      { variable: "landingPageGoals", values: ["free-trial", "signup", "demo"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "customer_count",
    conditions: [
      { variable: "startupStage", values: ["users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4"], weight: 3 },
      { variable: "landingPageGoals", values: ["free-trial", "buy-now", "signup"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "rating_stat",
    conditions: [
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 },
      { variable: "targetAudience", values: ["mid-market-companies", "enterprise-tech-teams"], weight: 2 }
    ],
    minScore: 6
  }
],

"CTA_CTAWithBadgeRow": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "copyIntent", values: ["pain-led"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }
    ],
    minScore: 5
  },
  {
    element: "trust_item_1",
    conditions: [
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "it-decision-makers"], weight: 4 },
      { variable: "marketSubcategory", values: ["Healthcare & MedTech SaaS", "LegalTech SaaS", "FinTech SaaS"], weight: 3 },
      { variable: "landingPageGoals", values: ["demo", "free-trial", "enterprise-contact"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "show_customer_avatars",
    conditions: [
      { variable: "startupStage", values: ["users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4"], weight: 3 },
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "rating_value",
    conditions: [
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4"], weight: 3 },
      { variable: "landingPageGoals", values: ["free-trial", "buy-now"], weight: 2 }
    ],
    minScore: 6
  }
],

"CTA_VisualCTAWithMockup": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "copyIntent", values: ["pain-led"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }
    ],
    minScore: 5
  },
  {
    element: "secondary_cta",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "landingPageGoals", values: ["demo", "learn-more", "video-watch"], weight: 3 },
      { variable: "targetAudience", values: ["developers", "product-managers", "no-code-builders"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "mockup_image",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "targetAudience", values: ["developers", "product-managers", "no-code-builders"], weight: 3 },
      { variable: "marketSubcategory", values: ["Developer Tools SaaS", "Productivity & Project Management SaaS"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "trust_item_1",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 },
      { variable: "landingPageGoals", values: ["free-trial", "demo"], weight: 2 }
    ],
    minScore: 6
  }
],

"CTA_SideBySideCTA": [
  {
    element: "benefit_list",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "copyIntent", values: ["desire-led"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "copyIntent", values: ["pain-led"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "supporting_text",
    conditions: [
      { variable: "copyIntent", values: ["pain-led", "desire-led"], weight: 4 },
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 },
      { variable: "toneProfile", values: ["friendly-helpful"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "trust_item_1",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 4 },
      { variable: "landingPageGoals", values: ["free-trial", "signup", "demo"], weight: 3 },
      { variable: "targetAudience", values: ["solopreneurs", "small-teams", "mid-market-companies"], weight: 2 }
    ],
    minScore: 6
  }
],

"CTA_CountdownLimitedCTA": [
  {
    element: "urgency_text",
    conditions: [
      { variable: "landingPageGoals", values: ["buy-now", "early-access"], weight: 5 },
      { variable: "toneProfile", values: ["bold-persuasive"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }
    ],
    minScore: 7
  },
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["product-aware", "most-aware"], weight: 4 },
      { variable: "copyIntent", values: ["desire-led"], weight: 3 },
      { variable: "landingPageGoals", values: ["buy-now", "early-access"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "countdown_end_date",
    conditions: [
      { variable: "landingPageGoals", values: ["buy-now", "early-access", "subscribe"], weight: 4 },
      { variable: "toneProfile", values: ["bold-persuasive"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "limited_quantity",
    conditions: [
      { variable: "landingPageGoals", values: ["buy-now", "early-access"], weight: 4 },
      { variable: "toneProfile", values: ["bold-persuasive"], weight: 3 },
      { variable: "pricingModel", values: ["one-time", "course"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "bonus_text",
    conditions: [
      { variable: "landingPageGoals", values: ["buy-now", "subscribe"], weight: 4 },
      { variable: "toneProfile", values: ["bold-persuasive", "confident-playful"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }
    ],
    minScore: 6
  }
],

"CTA_CTAWithFormField": [
  {
    element: "privacy_text",
    conditions: [
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "it-decision-makers"], weight: 4 },
      { variable: "marketSubcategory", values: ["Healthcare & MedTech SaaS", "LegalTech SaaS"], weight: 3 },
      { variable: "landingPageGoals", values: ["download", "signup", "waitlist"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "copyIntent", values: ["pain-led"], weight: 3 },
      { variable: "landingPageGoals", values: ["signup", "download", "waitlist"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "benefit_1",
    conditions: [
      { variable: "landingPageGoals", values: ["free-trial", "signup", "download"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 3 },
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "trust_item_1",
    conditions: [
      { variable: "targetAudience", values: ["enterprise-tech-teams", "it-decision-makers"], weight: 4 },
      { variable: "marketSubcategory", values: ["Healthcare & MedTech SaaS", "FinTech SaaS"], weight: 3 },
      { variable: "landingPageGoals", values: ["demo", "enterprise-contact"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "form_type",
    conditions: [
      { variable: "landingPageGoals", values: ["demo", "enterprise-contact", "waitlist"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
    ],
    minScore: 6
  }
],

"CTA_ValueStackCTA": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "copyIntent", values: ["pain-led"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "guarantee_text",
    conditions: [
      { variable: "landingPageGoals", values: ["buy-now", "free-trial"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 3 },
      { variable: "toneProfile", values: ["bold-persuasive", "confident-playful"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "value_icon_1",
    conditions: [
      { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 },
      { variable: "copyIntent", values: ["desire-led"], weight: 3 },
      { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 2 }
    ],
    minScore: 6
  }
],

"CTA_TestimonialCTACombo": [
  {
    element: "subheadline",
    conditions: [
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 },
      { variable: "copyIntent", values: ["pain-led"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "testimonial_company_logo",
    conditions: [
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 3 },
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "testimonial_date",
    conditions: [
      { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "mid-market-companies"], weight: 3 },
      { variable: "landingPageGoals", values: ["demo", "enterprise-contact"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "case_study_tag",
    conditions: [
      { variable: "startupStage", values: ["users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 3 },
      { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "customer_count",
    conditions: [
      { variable: "startupStage", values: ["users-250-500", "users-500-1k", "users-1k-5k"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-2", "level-3"], weight: 3 },
      { variable: "landingPageGoals", values: ["free-trial", "signup"], weight: 2 }
    ],
    minScore: 6
  },
  {
    element: "show_social_proof",
    conditions: [
      { variable: "startupStage", values: ["targeting-pmf", "users-250-500"], weight: 4 },
      { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 3 },
      { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 2 }
    ],
    minScore: 6
  }
]

};

/**
 * Selects optional elements for a given section and layout based on variables
 * @param sectionType - The section type (e.g., "Hero", "Features")
 * @param layoutName - The layout name (e.g., "leftCopyRightImage")
 * @param variables - Object containing all decision variables
 * @returns Array of optional element names to include
 */
export function selectOptionalElements(
  sectionType: string,
  layoutName: string,
  variables: Variables
): string[] {
  // Get the layout schema to identify optional elements
  const layoutSchema = layoutElementSchema[layoutName];
  if (!layoutSchema) {
    console.warn(`Layout "${layoutName}" not found in schema`);
    return [];
  }

  // Get optional elements (non-mandatory)
  const optionalElements = layoutSchema
    .filter(element => !element.mandatory)
    .map(element => element.element);

  // Get rules for this section+layout combination
  const ruleKey = `${sectionType}_${layoutName}`;
  const rules = elementRules[ruleKey];
  
  if (!rules) {
    // No specific rules found, return empty array (only mandatory elements)
    return [];
  }

  const selectedElements: string[] = [];

  // Process each rule to determine if element should be included
  for (const rule of rules) {
    // Only consider elements that are actually optional for this layout
    if (!optionalElements.includes(rule.element)) {
      continue;
    }

    let totalScore = 0;

    // Calculate score based on matching conditions
    for (const condition of rule.conditions) {
      const variableValue = variables[condition.variable];
      if (variableValue && condition.values.includes(variableValue)) {
        totalScore += condition.weight;
      }
    }

    // Include element if score meets threshold
    if (totalScore >= rule.minScore) {
      selectedElements.push(rule.element);
    }
  }

  return selectedElements;
}

/**
 * Gets optional elements that should be EXCLUDED from the UI
 * Used by components to hide optional elements that don't meet criteria
 * @param sectionType - The section type  
 * @param layoutName - The layout name
 * @param variables - Object containing all decision variables
 * @returns Array of optional element names to exclude from UI
 */
export function getExcludedOptionalElements(
  sectionType: string,
  layoutName: string,
  variables: Variables
): string[] {
  // Get all optional elements from schema
  const layoutSchema = layoutElementSchema[layoutName];
  if (!layoutSchema) {
    return [];
  }
  
  const allOptionalElements = layoutSchema
    .filter(element => !element.mandatory)
    .map(element => element.element);
  
  // Get the optional elements that SHOULD be included
  const includedOptionalElements = selectOptionalElements(sectionType, layoutName, variables);
  
  // Return the ones that should be EXCLUDED
  return allOptionalElements.filter(elem => !includedOptionalElements.includes(elem));
}

/**
 * Gets all elements (mandatory + selected optional) for a layout
 * @param sectionType - The section type
 * @param layoutName - The layout name
 * @param variables - Object containing all decision variables
 * @returns Object with mandatory, optional, all, and excluded elements
 */
export function getAllLayoutElements(
  sectionType: string,
  layoutName: string,
  variables: Variables
): {
  mandatory: string[];
  optional: string[];
  all: string[];
  excluded: string[];
} {
  const layoutSchema = layoutElementSchema[layoutName];
  if (!layoutSchema) {
    return { mandatory: [], optional: [], all: [], excluded: [] };
  }

  const mandatory = layoutSchema
    .filter(element => element.mandatory)
    .map(element => element.element);

  const optional = selectOptionalElements(sectionType, layoutName, variables);
  const all = [...mandatory, ...optional];
  
  // Get excluded elements (optional elements NOT selected)
  const excluded = getExcludedOptionalElements(sectionType, layoutName, variables);

  return { mandatory, optional, all, excluded };
}

/**
 * Debug function to show scoring details for a specific layout
 * @param sectionType - The section type
 * @param layoutName - The layout name
 * @param variables - Object containing all decision variables
 * @returns Detailed scoring information
 */
export function debugElementSelection(
  sectionType: string,
  layoutName: string,
  variables: Variables
): Array<{
  element: string;
  score: number;
  minScore: number;
  included: boolean;
  matchedConditions: string[];
}> {
  const ruleKey = `${sectionType}_${layoutName}`;
  const rules = elementRules[ruleKey] || [];
  
  return rules.map(rule => {
    let totalScore = 0;
    const matchedConditions: string[] = [];

    for (const condition of rule.conditions) {
      const variableValue = variables[condition.variable];
      if (variableValue && condition.values.includes(variableValue)) {
        totalScore += condition.weight;
        matchedConditions.push(`${condition.variable}=${variableValue} (+${condition.weight})`);
      }
    }

    return {
      element: rule.element,
      score: totalScore,
      minScore: rule.minScore,
      included: totalScore >= rule.minScore,
      matchedConditions
    };
  });
}