import { layoutElementSchema, getAllElements, getLayoutElements } from './layoutElementSchema';
import type { InputVariables, HiddenInferredFields } from '@/types/core/index';
import { logger } from '@/lib/logger';

// Debug mode environment variable
const DEBUG_ELEMENT_SELECTION = process.env.DEBUG_ELEMENT_SELECTION === 'true';

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

// Element selection rules for active layouts only
const elementRules: SectionLayoutRules = {

  // BeforeAfter Section
  "BeforeAfter_SideBySideBlocks": [
    { element: "subheadline", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "copyIntent", values: ["pain-led"], weight: 3 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }], minScore: 6 },
    { element: "supporting_text", conditions: [{ variable: "problemType", values: ["lost-revenue-or-inefficiency", "manual-repetition"], weight: 4 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "mid-market-companies"], weight: 3 }, { variable: "copyIntent", values: ["desire-led"], weight: 2 }], minScore: 6 },
    { element: "cta_text", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "landingPageGoals", values: ["signup", "start-trial", "book-demo"], weight: 3 }], minScore: 4 },
    { element: "trust_items", conditions: [{ variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }, { variable: "targetAudience", values: ["enterprise-buyers", "team-leads"], weight: 2 }], minScore: 3 },
    { element: "before_icon", conditions: [{ variable: "targetAudience", values: ["developers", "no-code-builders"], weight: 2 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }], minScore: 2 },
    { element: "after_icon", conditions: [{ variable: "targetAudience", values: ["developers", "no-code-builders"], weight: 2 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }], minScore: 2 }
  ],
  "BeforeAfter_StackedTextVisual": [
    { element: "transition_text", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 3 }, { variable: "copyIntent", values: ["desire-led"], weight: 2 }], minScore: 6 },
    { element: "subheadline", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "problemType", values: ["burnout-or-overload", "personal-growth-or-productivity"], weight: 3 }], minScore: 5 }
  ],
  "BeforeAfter_SplitCard": [
    { element: "subheadline", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "copyIntent", values: ["pain-led"], weight: 3 }, { variable: "problemType", values: ["lost-revenue-or-inefficiency", "manual-repetition"], weight: 2 }], minScore: 6 }
  ],

  // FAQ Section
  "FAQ_AccordionFAQ": [
    { element: "subheadline", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 },
    { element: "question_4", conditions: [{ variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }], minScore: 6 },
    { element: "question_5", conditions: [{ variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 3 }], minScore: 6 }
  ],
  "FAQ_TwoColumnFAQ": [
    { element: "subheadline", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 },
    { element: "left_question_3", conditions: [{ variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }], minScore: 6 },
    { element: "right_question_3", conditions: [{ variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }], minScore: 6 },
    { element: "left_column_title", conditions: [{ variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "developers"], weight: 3 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 2 }], minScore: 6 },
    { element: "right_column_title", conditions: [{ variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "developers"], weight: 3 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 2 }], minScore: 6 }
  ],
  "FAQ_InlineQnAList": [
    { element: "subheadline", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 }, { variable: "copyIntent", values: ["pain-led"], weight: 2 }], minScore: 6 },
    { element: "question_4", conditions: [{ variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "developers", "product-managers"], weight: 2 }], minScore: 6 },
    { element: "question_5", conditions: [{ variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 3 }], minScore: 7 },
    { element: "question_6", conditions: [{ variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 5 }, { variable: "awarenessLevel", values: ["product-aware"], weight: 3 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 2 }], minScore: 7 }
  ],
  "FAQ_SegmentedFAQTabs": [
    { element: "subheadline", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 }
  ],

  // Features Section
  "Features_IconGrid": [
    { element: "subheadline", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 }, { variable: "copyIntent", values: ["pain-led"], weight: 2 }], minScore: 5 }
  ],
  "Features_SplitAlternating": [
    { element: "feature_benefits", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 3 }, { variable: "copyIntent", values: ["desire-led"], weight: 2 }], minScore: 6 }
  ],
  "Features_MetricTiles": [
    { element: "metric_descriptions", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 }, { variable: "copyIntent", values: ["pain-led"], weight: 2 }], minScore: 6 },
    { element: "subheadline", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k"], weight: 3 }], minScore: 5 }
  ],
  "Features_Carousel": [
    { element: "navigation_labels", conditions: [{ variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 4 }, { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 }], minScore: 5 },
    { element: "slide_numbers", conditions: [{ variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 }, { variable: "targetAudience", values: ["developers", "product-managers", "enterprise-tech-teams"], weight: 3 }], minScore: 5 }
  ],

  // FounderNote Section
  "FounderNote_LetterStyleBlock": [
    { element: "founder_name", conditions: [{ variable: "toneProfile", values: ["friendly-helpful", "luxury-expert"], weight: 4 }, { variable: "targetAudience", values: ["early-stage-founders", "solopreneurs", "creators"], weight: 3 }, { variable: "copyIntent", values: ["desire-led"], weight: 2 }], minScore: 6 },
    { element: "company_name", conditions: [{ variable: "startupStage", values: ["mvp-launched", "targeting-pmf", "users-250-500"], weight: 4 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "mid-market-companies"], weight: 3 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }], minScore: 6 },
    { element: "date_text", conditions: [{ variable: "toneProfile", values: ["friendly-helpful", "luxury-expert"], weight: 4 }, { variable: "targetAudience", values: ["early-stage-founders", "solopreneurs", "creators"], weight: 3 }, { variable: "copyIntent", values: ["desire-led"], weight: 2 }], minScore: 6 },
    { element: "ps_text", conditions: [{ variable: "copyIntent", values: ["desire-led"], weight: 4 }, { variable: "landingPageGoals", values: ["signup", "free-trial", "early-access"], weight: 3 }, { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 2 }], minScore: 6 },
    { element: "founder_image", conditions: [{ variable: "toneProfile", values: ["luxury-expert", "friendly-helpful"], weight: 4 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 3 }, { variable: "startupStage", values: ["users-250-500", "users-500-1k", "users-1k-5k"], weight: 2 }], minScore: 6 }
  ],

  // Hero Section
  "Hero_leftCopyRightImage": [
    { element: "subheadline", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 }, { variable: "copyIntent", values: ["pain-led"], weight: 2 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }], minScore: 4 },
    { element: "supporting_text", conditions: [{ variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 4 }, { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 }, { variable: "landingPageGoals", values: ["demo", "contact-sales"], weight: 2 }], minScore: 5 },
    { element: "badge_text", conditions: [{ variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth", "seed-funded"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }, { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 2 }], minScore: 6 },
    { element: "trust_item_1", conditions: [{ variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }], minScore: 4 },
    { element: "trust_item_2", conditions: [{ variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }], minScore: 4 },
    { element: "trust_item_3", conditions: [{ variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }], minScore: 5 },
    { element: "customer_count", conditions: [{ variable: "startupStage", values: ["users-500-1k", "users-1k-5k", "mrr-growth", "seed-funded"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 },
    { element: "rating_value", conditions: [{ variable: "startupStage", values: ["users-250-500", "users-500-1k", "users-1k-5k"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 }
  ],
  "Hero_centerStacked": [
    { element: "subheadline", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "copyIntent", values: ["pain-led"], weight: 3 }, { variable: "landingPageGoals", values: ["waitlist", "early-access", "signup"], weight: 2 }], minScore: 5 },
    { element: "supporting_text", conditions: [{ variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "it-decision-makers"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 }], minScore: 5 },
    { element: "secondary_cta_text", conditions: [{ variable: "landingPageGoals", values: ["free-trial", "demo", "book-call"], weight: 4 }, { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k"], weight: 3 }], minScore: 999 },
    { element: "badge_text", conditions: [{ variable: "startupStage", values: ["users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 },
    { element: "trust_item_1", conditions: [{ variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }], minScore: 4 },
    { element: "trust_item_2", conditions: [{ variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }], minScore: 4 },
    { element: "trust_item_3", conditions: [{ variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }], minScore: 5 }
  ],
  "Hero_splitScreen": [
    { element: "subheadline", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "copyIntent", values: ["pain-led"], weight: 3 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }], minScore: 6 },
    { element: "supporting_text", conditions: [{ variable: "targetAudience", values: ["enterprise-tech-teams", "product-managers"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 },
    { element: "badge_text", conditions: [{ variable: "startupStage", values: ["users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 },
    { element: "value_proposition", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "copyIntent", values: ["desire-led"], weight: 3 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }], minScore: 6 },
    { element: "trust_item_1", conditions: [{ variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }], minScore: 4 },
    { element: "trust_item_2", conditions: [{ variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }], minScore: 4 },
    { element: "trust_item_3", conditions: [{ variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }], minScore: 5 },
    { element: "trust_item_4", conditions: [{ variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }, { variable: "copyIntent", values: ["desire-led"], weight: 2 }], minScore: 6 },
    { element: "trust_item_5", conditions: [{ variable: "marketSophisticationLevel", values: ["level-5"], weight: 4 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "it-decision-makers"], weight: 3 }, { variable: "awarenessLevel", values: ["product-aware"], weight: 3 }, { variable: "copyIntent", values: ["desire-led"], weight: 2 }], minScore: 7 },
    { element: "customer_count", conditions: [{ variable: "startupStage", values: ["users-500-1k", "users-1k-5k", "mrr-growth", "seed-funded"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }, { variable: "landingPageGoals", values: ["free-trial", "buy-now", "signup"], weight: 2 }], minScore: 6 },
    { element: "rating_value", conditions: [{ variable: "startupStage", values: ["users-250-500", "users-500-1k", "users-1k-5k"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }, { variable: "landingPageGoals", values: ["free-trial", "buy-now"], weight: 2 }], minScore: 5 },
    { element: "rating_count", conditions: [{ variable: "startupStage", values: ["users-250-500", "users-500-1k", "users-1k-5k"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }, { variable: "landingPageGoals", values: ["free-trial", "buy-now"], weight: 2 }], minScore: 5 },
    { element: "show_social_proof", conditions: [{ variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4", "level-5"], weight: 3 }, { variable: "awarenessLevel", values: ["unaware", "problem-aware", "solution-aware"], weight: 2 }], minScore: 6 },
    { element: "show_customer_avatars", conditions: [{ variable: "startupStage", values: ["users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4"], weight: 3 }, { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 2 }, { variable: "targetAudience", values: ["solopreneurs", "small-business-owners", "content-creators"], weight: 2 }], minScore: 6 },
    { element: "customer_names", conditions: [{ variable: "startupStage", values: ["users-1k-5k", "mrr-growth", "seed-funded"], weight: 4 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 3 }, { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 3 }, { variable: "copyIntent", values: ["desire-led"], weight: 2 }], minScore: 7 },
    { element: "avatar_urls", conditions: [{ variable: "startupStage", values: ["users-1k-5k", "mrr-growth", "seed-funded"], weight: 4 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 3 }, { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 3 }, { variable: "copyIntent", values: ["desire-led"], weight: 2 }], minScore: 7 }
  ],
  "Hero_imageFirst": [
    { element: "subheadline", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "copyIntent", values: ["pain-led"], weight: 3 }, { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 2 }], minScore: 6 },
    { element: "supporting_text", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "targetAudience", values: ["developers", "product-managers", "no-code-builders"], weight: 3 }, { variable: "landingPageGoals", values: ["demo", "free-trial"], weight: 2 }], minScore: 6 },
    { element: "badge_text", conditions: [{ variable: "startupStage", values: ["users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 },
    { element: "trust_item_1", conditions: [{ variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }], minScore: 4 },
    { element: "trust_item_2", conditions: [{ variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }], minScore: 4 },
    { element: "trust_item_3", conditions: [{ variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }], minScore: 5 }
  ],

  // HowItWorks Section
  "HowItWorks_ThreeStepHorizontal": [
    { element: "step_numbers", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware", "solution-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 3 }], minScore: 5 },
    { element: "conclusion_text", conditions: [{ variable: "copyIntent", values: ["desire-led"], weight: 4 }, { variable: "landingPageGoals", values: ["free-trial", "signup", "demo"], weight: 3 }], minScore: 5 }
  ],
  "HowItWorks_VerticalTimeline": [
    { element: "timeline_connector_text", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "copyIntent", values: ["desire-led"], weight: 3 }, { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 2 }], minScore: 6 }
  ],
  "HowItWorks_AccordionSteps": [
    { element: "step_details", conditions: [{ variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }, { variable: "targetAudience", values: ["developers", "product-managers", "enterprise-tech-teams"], weight: 2 }], minScore: 6 }
  ],
  "HowItWorks_VideoWalkthrough": [
    { element: "chapter_titles", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }, { variable: "targetAudience", values: ["developers", "product-managers", "enterprise-tech-teams"], weight: 2 }], minScore: 6 },
    { element: "video_duration", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 }
  ],

  // Objection Section
  "Objection_MythVsRealityGrid": [
    { element: "myth_4", conditions: [{ variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }, { variable: "copyIntent", values: ["desire-led"], weight: 2 }], minScore: 7 },
    { element: "myth_5", conditions: [{ variable: "marketSophisticationLevel", values: ["level-5"], weight: 4 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "it-decision-makers"], weight: 3 }, { variable: "startupStage", values: ["users-1k-5k"], weight: 2 }], minScore: 8 },
    { element: "myth_6", conditions: [{ variable: "marketSophisticationLevel", values: ["level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["product-aware"], weight: 3 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 3 }, { variable: "startupStage", values: ["users-1k-5k"], weight: 2 }], minScore: 9 }
  ],
  "Objection_VisualObjectionTiles": [
    { element: "tile_labels", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 }, { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 2 }], minScore: 6 },
    { element: "tile_objection_4", conditions: [{ variable: "awarenessLevel", values: ["problem-aware", "solution-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-2", "level-3"], weight: 3 }, { variable: "copyIntent", values: ["desire-led"], weight: 2 }], minScore: 7 },
    { element: "tile_objection_5", conditions: [{ variable: "marketSophisticationLevel", values: ["level-3", "level-4"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }, { variable: "targetAudience", values: ["small-biz-owners", "solopreneurs", "freelancers"], weight: 2 }], minScore: 7 },
    { element: "tile_objection_6", conditions: [{ variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["product-aware"], weight: 3 }, { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 2 }], minScore: 8 }
  ],

  // Pricing Section
  "Pricing_TierCards": [
    { element: "feature_lists", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }, { variable: "pricingModel", values: ["tiered", "per-seat"], weight: 2 }], minScore: 6 },
    { element: "popular_labels", conditions: [{ variable: "pricingModel", values: ["tiered", "freemium"], weight: 4 }, { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 2 }], minScore: 4 },
    { element: "tier_count", conditions: [{ variable: "pricingModel", values: ["tiered", "freemium", "per-seat"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 },
    { element: "tier_1_feature_1", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 },
    { element: "tier_1_feature_2", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 },
    { element: "tier_1_feature_3", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 },
    { element: "tier_2_feature_1", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 },
    { element: "tier_3_feature_1", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 3 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 2 }], minScore: 6 },
    { element: "trust_item_1", conditions: [{ variable: "landingPageGoals", values: ["buy-now", "free-trial", "subscribe"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 },
    { element: "show_trust_footer", conditions: [{ variable: "landingPageGoals", values: ["buy-now", "free-trial", "subscribe"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 }
  ],
  "Pricing_ToggleableMonthlyYearly": [
    { element: "annual_discount_label", conditions: [{ variable: "pricingModel", values: ["tiered", "flat-monthly"], weight: 4 }, { variable: "landingPageGoals", values: ["buy-now", "subscribe", "free-trial"], weight: 3 }, { variable: "toneProfile", values: ["bold-persuasive", "confident-playful"], weight: 2 }], minScore: 6 },
    { element: "billing_note", conditions: [{ variable: "landingPageGoals", values: ["buy-now", "subscribe", "free-trial"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4"], weight: 3 }], minScore: 5 },
    { element: "subheadline", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 3 }], minScore: 5 },
    { element: "supporting_text", conditions: [{ variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }], minScore: 5 },
    { element: "trust_items", conditions: [{ variable: "landingPageGoals", values: ["buy-now", "subscribe", "free-trial"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 },
    { element: "platform_features_title", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 },
    { element: "platform_feature_1_title", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 },
    { element: "show_platform_features", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 }
  ],
  "Pricing_SliderPricing": [
    { element: "tier_breakpoints", conditions: [{ variable: "pricingModel", values: ["usage-based", "per-seat"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }], minScore: 6 },
    { element: "tier_discounts", conditions: [{ variable: "pricingModel", values: ["usage-based", "per-seat"], weight: 4 }, { variable: "landingPageGoals", values: ["buy-now", "subscribe", "free-trial"], weight: 3 }, { variable: "toneProfile", values: ["bold-persuasive", "confident-playful"], weight: 2 }], minScore: 6 },
    { element: "pricing_note", conditions: [{ variable: "landingPageGoals", values: ["buy-now", "subscribe", "free-trial"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4"], weight: 3 }], minScore: 5 },
    { element: "subheadline", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 3 }], minScore: 5 },
    { element: "supporting_text", conditions: [{ variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }], minScore: 5 },
    { element: "trust_items", conditions: [{ variable: "landingPageGoals", values: ["buy-now", "subscribe", "free-trial"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 }
  ],
  "Pricing_CallToQuotePlan": [
    { element: "subheadline", conditions: [{ variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "it-decision-makers"], weight: 4 }, { variable: "landingPageGoals", values: ["contact-sales", "book-call"], weight: 3 }], minScore: 5 },
    { element: "supporting_text", conditions: [{ variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "it-decision-makers"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 3 }], minScore: 5 },
    { element: "trust_items", conditions: [{ variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "it-decision-makers"], weight: 4 }, { variable: "landingPageGoals", values: ["contact-sales", "book-call"], weight: 3 }], minScore: 5 },
    { element: "contact_icon_1", conditions: [{ variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 4 }, { variable: "landingPageGoals", values: ["contact-sales", "book-call"], weight: 3 }], minScore: 5 },
    { element: "contact_icon_2", conditions: [{ variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 4 }, { variable: "landingPageGoals", values: ["contact-sales", "book-call"], weight: 3 }], minScore: 5 }
  ],

  // Problem Section
  "Problem_CollapsedCards": [
    { element: "expand_labels", conditions: [{ variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }, { variable: "copyIntent", values: ["desire-led"], weight: 2 }], minScore: 6 },
    { element: "problem_impacts", conditions: [{ variable: "copyIntent", values: ["pain-led"], weight: 4 }, { variable: "problemType", values: ["lost-revenue-or-inefficiency", "competitive-disadvantage"], weight: 3 }, { variable: "marketSophisticationLevel", values: ["level-2", "level-3"], weight: 2 }], minScore: 6 },
    { element: "solution_hints", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "copyIntent", values: ["desire-led"], weight: 3 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4"], weight: 2 }], minScore: 6 },
    { element: "intro_text", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "toneProfile", values: ["friendly-helpful"], weight: 3 }], minScore: 5 }
  ],
  "Problem_SideBySideSplit": [
    { element: "solution_preview", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "copyIntent", values: ["desire-led"], weight: 3 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }], minScore: 6 },
    { element: "problem_points", conditions: [{ variable: "copyIntent", values: ["pain-led"], weight: 4 }, { variable: "problemType", values: ["lost-revenue-or-inefficiency", "manual-repetition"], weight: 3 }, { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 2 }], minScore: 6 },
    { element: "solution_points", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "copyIntent", values: ["desire-led"], weight: 3 }, { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4"], weight: 2 }], minScore: 6 },
    { element: "transition_text", conditions: [{ variable: "copyIntent", values: ["desire-led"], weight: 4 }, { variable: "toneProfile", values: ["confident-playful", "friendly-helpful"], weight: 3 }, { variable: "landingPageGoals", values: ["signup", "start-trial"], weight: 2 }], minScore: 6 },
    { element: "bottom_stat_1", conditions: [{ variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 }, { variable: "problemType", values: ["lost-revenue-or-inefficiency", "competitive-disadvantage"], weight: 3 }], minScore: 5 }
  ],
  "Problem_PersonaPanels": [
    { element: "persona_descriptions", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 }, { variable: "copyIntent", values: ["pain-led"], weight: 2 }], minScore: 6 },
    { element: "persona_titles", conditions: [{ variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4"], weight: 4 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "mid-market-companies"], weight: 3 }], minScore: 5 },
    { element: "persona_pain_points", conditions: [{ variable: "copyIntent", values: ["pain-led"], weight: 4 }, { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 }, { variable: "problemType", values: ["burnout-or-overload", "personal-growth-or-productivity"], weight: 2 }], minScore: 6 },
    { element: "intro_text", conditions: [{ variable: "awarenessLevel", values: ["unaware"], weight: 4 }, { variable: "toneProfile", values: ["friendly-helpful"], weight: 3 }], minScore: 5 }
  ],

  // Results Section
  "Results_StatBlocks": [
    { element: "stat_descriptions", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 }, { variable: "copyIntent", values: ["pain-led"], weight: 2 }], minScore: 6 },
    { element: "subheadline", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k"], weight: 3 }], minScore: 5 },
    { element: "achievement_footer", conditions: [{ variable: "copyIntent", values: ["trust-led", "desire-led"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 2 }], minScore: 6 }
  ],
  "Results_StackedWinsList": [
    { element: "descriptions", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "copyIntent", values: ["pain-led"], weight: 3 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }], minScore: 6 },
    { element: "categories", conditions: [{ variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }], minScore: 5 },
    { element: "subheadline", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 3 }], minScore: 5 },
    { element: "win_count", conditions: [{ variable: "copyIntent", values: ["trust-led"], weight: 4 }, { variable: "startupStage", values: ["users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 3 }], minScore: 5 },
    { element: "footer_title", conditions: [{ variable: "copyIntent", values: ["desire-led"], weight: 4 }, { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 3 }], minScore: 5 },
    { element: "footer_text", conditions: [{ variable: "copyIntent", values: ["desire-led"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4"], weight: 2 }], minScore: 4 }
  ],
  "Results_ResultsGallery": [],

  // SocialProof Section
  "SocialProof_LogoWall": [
    { element: "subheadline", conditions: [{ variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 }, { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 }], minScore: 5 },
    { element: "logo_urls", conditions: [{ variable: "startupStage", values: ["users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 3 }], minScore: 5 },
    { element: "stat_1_number", conditions: [{ variable: "startupStage", values: ["users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 }, { variable: "copyIntent", values: ["desire-led"], weight: 3 }], minScore: 5 },
    { element: "trust_badge_text", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 }], minScore: 5 }
  ],

  // Testimonial Section
  "Testimonial_QuoteGrid": [
    { element: "customer_titles", conditions: [{ variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 4 }, { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k"], weight: 3 }], minScore: 5 },
    { element: "customer_companies", conditions: [{ variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "it-decision-makers"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }], minScore: 5 }
  ],
  "Testimonial_VideoTestimonials": [
    { element: "customer_titles", conditions: [{ variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 3 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 2 }], minScore: 6 },
    { element: "customer_companies", conditions: [{ variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "it-decision-makers"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 3 }, { variable: "startupStage", values: ["users-1k-5k", "mrr-growth"], weight: 2 }], minScore: 6 },
    { element: "video_urls", conditions: [{ variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 3 }, { variable: "copyIntent", values: ["desire-led"], weight: 2 }], minScore: 7 },
    { element: "video_thumbnails", conditions: [{ variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 3 }], minScore: 6 },
    { element: "industry_leaders_title", conditions: [{ variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "it-decision-makers"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 3 }], minScore: 6 },
    { element: "enterprise_customers_stat", conditions: [{ variable: "startupStage", values: ["users-1k-5k", "mrr-growth"], weight: 4 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams"], weight: 3 }], minScore: 6 }
  ],
  "Testimonial_AvatarCarousel": [
    { element: "customer_titles", conditions: [{ variable: "targetAudience", values: ["enterprise-tech-teams", "enterprise-marketing-teams", "mid-market-companies"], weight: 4 }, { variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k", "users-1k-5k"], weight: 3 }], minScore: 5 },
    { element: "carousel_navigation", conditions: [{ variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 4 }, { variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 3 }], minScore: 5 }
  ],
  "Testimonial_BeforeAfterQuote": [
    { element: "transformation_labels", conditions: [{ variable: "copyIntent", values: ["desire-led"], weight: 4 }, { variable: "problemType", values: ["lost-revenue-or-inefficiency", "manual-repetition", "burnout-or-overload"], weight: 3 }, { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 2 }], minScore: 6 }
  ],
  "Testimonial_PullQuoteStack": [
    { element: "quote_contexts", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "copyIntent", values: ["pain-led"], weight: 3 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }], minScore: 6 }
  ],

  // UniqueMechanism Section
  "UniqueMechanism_MethodologyBreakdown": [
    { element: "principle_4", conditions: [{ variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }, { variable: "targetAudience", values: ["developers", "product-managers", "enterprise-tech-teams"], weight: 2 }], minScore: 6 },
    { element: "principle_5", conditions: [{ variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 }, { variable: "awarenessLevel", values: ["product-aware"], weight: 3 }, { variable: "targetAudience", values: ["enterprise-tech-teams", "developers"], weight: 2 }], minScore: 7 },
    { element: "result_metric_1", conditions: [{ variable: "copyIntent", values: ["desire-led"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }, { variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 2 }], minScore: 6 },
    { element: "results_title", conditions: [{ variable: "copyIntent", values: ["desire-led"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 3 }, { variable: "awarenessLevel", values: ["product-aware"], weight: 2 }], minScore: 7 }
  ],
  "UniqueMechanism_ProcessFlowDiagram": [
    { element: "subheadline", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 3 }, { variable: "toneProfile", values: ["friendly-helpful"], weight: 2 }], minScore: 6 },
    { element: "benefits_title", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }, { variable: "copyIntent", values: ["desire-led"], weight: 2 }], minScore: 7 },
    { element: "benefit_titles", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 3 }, { variable: "copyIntent", values: ["desire-led"], weight: 2 }], minScore: 8 }
  ],
  "UniqueMechanism_PropertyComparisonMatrix": [],
  "UniqueMechanism_SecretSauceReveal": [
    { element: "secret_icon", conditions: [{ variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }, { variable: "targetAudience", values: ["creators", "founders"], weight: 2 }], minScore: 6 }
  ],
  "UniqueMechanism_StackedHighlights": [
    { element: "mechanism_name", conditions: [{ variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 }, { variable: "copyIntent", values: ["desire-led"], weight: 3 }, { variable: "toneProfile", values: ["confident-playful", "bold-persuasive"], weight: 2 }], minScore: 6 },
    { element: "footer_text", conditions: [{ variable: "marketSophisticationLevel", values: ["level-4", "level-5"], weight: 4 }, { variable: "copyIntent", values: ["desire-led"], weight: 3 }, { variable: "toneProfile", values: ["luxury-expert", "confident-playful"], weight: 2 }], minScore: 7 }
  ],
  "UniqueMechanism_TechnicalAdvantage": [
    { element: "advantage_descriptions", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }, { variable: "targetAudience", values: ["developers", "enterprise-tech-teams", "product-managers"], weight: 2 }], minScore: 6 },
    { element: "advantage_icon_1", conditions: [{ variable: "toneProfile", values: ["confident-playful", "friendly-helpful"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4"], weight: 3 }, { variable: "targetAudience", values: ["creators", "founders"], weight: 2 }], minScore: 6 }
  ],

  // UseCase Section
  "UseCase_IndustryUseCaseGrid": [],
  "UseCase_PersonaGrid": [
    { element: "footer_text", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }, { variable: "copyIntent", values: ["desire-led"], weight: 2 }], minScore: 6 },
    { element: "badge_text", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 3 }, { variable: "marketSophisticationLevel", values: ["level-2", "level-3"], weight: 3 }, { variable: "targetAudience", values: ["businesses", "enterprise"], weight: 2 }], minScore: 5 }
  ],
  "UseCase_RoleBasedScenarios": [],

  // CTA Section
  "CTA_CenteredHeadlineCTA": [
    { element: "subheadline", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "copyIntent", values: ["pain-led"], weight: 3 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }], minScore: 6 },
    { element: "urgency_text", conditions: [{ variable: "landingPageGoals", values: ["buy-now", "free-trial", "early-access"], weight: 4 }, { variable: "toneProfile", values: ["bold-persuasive"], weight: 3 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }], minScore: 6 },
    { element: "trust_item_1", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware", "solution-aware"], weight: 4 }, { variable: "landingPageGoals", values: ["free-trial", "signup", "demo"], weight: 3 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 2 }], minScore: 6 },
    { element: "customer_count", conditions: [{ variable: "startupStage", values: ["users-250-500", "users-500-1k", "users-1k-5k", "mrr-growth"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-2", "level-3", "level-4"], weight: 3 }, { variable: "landingPageGoals", values: ["free-trial", "buy-now", "signup"], weight: 2 }], minScore: 6 },
    { element: "rating_stat", conditions: [{ variable: "startupStage", values: ["targeting-pmf", "users-250-500", "users-500-1k"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-3", "level-4", "level-5"], weight: 3 }, { variable: "targetAudience", values: ["mid-market-companies", "enterprise-tech-teams"], weight: 2 }], minScore: 6 }
  ],
  "CTA_VisualCTAWithMockup": [
    { element: "subheadline", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "copyIntent", values: ["pain-led"], weight: 3 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }], minScore: 5 },
    { element: "secondary_cta", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "landingPageGoals", values: ["demo", "learn-more", "video-watch"], weight: 3 }, { variable: "targetAudience", values: ["developers", "product-managers", "no-code-builders"], weight: 2 }], minScore: 6 },
    { element: "mockup_image", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "targetAudience", values: ["developers", "product-managers", "no-code-builders"], weight: 3 }, { variable: "marketSubcategory", values: ["Developer Tools SaaS", "Productivity & Project Management SaaS"], weight: 2 }], minScore: 6 },
    { element: "trust_item_1", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 3 }, { variable: "landingPageGoals", values: ["free-trial", "demo"], weight: 2 }], minScore: 6 }
  ],
  "CTA_ValueStackCTA": [
    { element: "subheadline", conditions: [{ variable: "awarenessLevel", values: ["unaware", "problem-aware"], weight: 4 }, { variable: "copyIntent", values: ["pain-led"], weight: 3 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2"], weight: 2 }], minScore: 6 },
    { element: "guarantee_text", conditions: [{ variable: "landingPageGoals", values: ["buy-now", "free-trial"], weight: 4 }, { variable: "marketSophisticationLevel", values: ["level-1", "level-2", "level-3"], weight: 3 }, { variable: "toneProfile", values: ["bold-persuasive", "confident-playful"], weight: 2 }], minScore: 6 },
    { element: "value_icon_1", conditions: [{ variable: "awarenessLevel", values: ["solution-aware", "product-aware"], weight: 4 }, { variable: "copyIntent", values: ["desire-led"], weight: 3 }, { variable: "toneProfile", values: ["friendly-helpful", "confident-playful"], weight: 2 }], minScore: 6 }
  ],

  // Header Section (no optional elements typically)
  "Header_MinimalNavHeader": [],

  // Footer Section (no optional elements typically)
  "Footer_ContactFooter": []
};

/**
 * Selects optional elements for a given section and layout based on variables
 */
export function selectOptionalElements(
  sectionType: string,
  layoutName: string,
  variables: Variables
): string[] {
  const ruleKey = `${sectionType}_${layoutName}`;

  if (DEBUG_ELEMENT_SELECTION) {
    logger.group(`[ELEMENT_SELECTION] Processing ${ruleKey}`, () => {
      logger.dev(`Input Variables:`, { sectionType, layoutName, variableKeys: Object.keys(variables), variables });
    });
  }

  const layoutSchema = layoutElementSchema[layoutName];
  if (!layoutSchema) {
    if (DEBUG_ELEMENT_SELECTION) logger.debug(`Layout "${layoutName}" not found in schema`);
    logger.warn(`Layout "${layoutName}" not found in schema`);
    return [];
  }

  const optionalElements = getAllElements(layoutSchema)
    .filter(element => !element.mandatory)
    .map(element => element.element);

  if (DEBUG_ELEMENT_SELECTION) {
    logger.dev(`Found ${optionalElements.length} optional elements:`, optionalElements);
  }

  const rules = elementRules[ruleKey];
  if (!rules) {
    if (DEBUG_ELEMENT_SELECTION) logger.dev(`No rules found for ${ruleKey} - returning empty array`);
    return [];
  }

  if (DEBUG_ELEMENT_SELECTION) logger.dev(`Found ${rules.length} rules to evaluate`);

  const selectedElements: string[] = [];

  for (const rule of rules) {
    if (!optionalElements.includes(rule.element)) {
      if (DEBUG_ELEMENT_SELECTION) logger.dev(`Skipping ${rule.element} - not an optional element for this layout`);
      continue;
    }

    let totalScore = 0;
    for (const condition of rule.conditions) {
      const variableValue = variables[condition.variable];
      if (variableValue && condition.values.includes(variableValue)) {
        totalScore += condition.weight;
      }
    }

    if (totalScore >= rule.minScore) {
      selectedElements.push(rule.element);
    }
  }

  if (DEBUG_ELEMENT_SELECTION) {
    logger.dev(`Final selection for ${ruleKey}:`, selectedElements);
  }

  return selectedElements;
}

/**
 * Gets optional elements that should be EXCLUDED from the UI
 */
export function getExcludedOptionalElements(
  sectionType: string,
  layoutName: string,
  variables: Variables
): string[] {
  const layoutSchema = layoutElementSchema[layoutName];
  if (!layoutSchema) return [];

  const allOptionalElements = getAllElements(layoutSchema)
    .filter(element => !element.mandatory)
    .map(element => element.element);

  const includedOptionalElements = selectOptionalElements(sectionType, layoutName, variables);
  return allOptionalElements.filter(elem => !includedOptionalElements.includes(elem));
}

/**
 * Gets all elements (mandatory + selected optional) for a layout
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
  const layoutElements = getLayoutElements(layoutName);
  if (layoutElements.length === 0) {
    return { mandatory: [], optional: [], all: [], excluded: [] };
  }

  const mandatory = layoutElements
    .filter(element => element.mandatory)
    .map(element => element.element);

  const optional = selectOptionalElements(sectionType, layoutName, variables);
  const all = [...mandatory, ...optional];
  const excluded = getExcludedOptionalElements(sectionType, layoutName, variables);

  return { mandatory, optional, all, excluded };
}

/**
 * Debug function to show scoring details for a specific layout
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
