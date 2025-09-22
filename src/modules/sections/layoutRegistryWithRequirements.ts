// layoutRegistryWithRequirements.ts - Enhanced layout registry with card requirements
import type { EnhancedLayoutRegistry } from '@/types/layoutTypes';

/**
 * Enhanced layout registry that includes card requirements for each UIBlock
 * This defines how many cards/elements each layout can handle
 */
export const layoutRegistryWithRequirements: EnhancedLayoutRegistry = {
  BeforeAfter: {
    SideBySideBlocks: {
      component: 'SideBySideBlocks',
      cardRequirements: {
        type: 'pairs',
        min: 1,
        max: 3,
        optimal: [2, 2],
        description: 'Before/after comparison blocks'
      }
    },
    StackedTextVisual: {
      component: 'StackedTextVisual',
      cardRequirements: {
        type: 'pairs',
        min: 1,
        max: 3,
        optimal: [2, 2],
        description: 'Stacked before/after comparisons'
      }
    },
    BeforeAfterSlider: {
      component: 'BeforeAfterSlider',
      cardRequirements: {
        type: 'pairs',
        min: 1,
        max: 1,
        optimal: [1, 1],
        description: 'Interactive before/after slider'
      }
    }
  },

  Features: {
    IconGrid: {
      component: 'IconGrid',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 9,
        optimal: [4, 6],
        description: 'Feature cards with icons',
        respectUserContent: true // Prioritize user-provided features
      }
    },
    MetricTiles: {
      component: 'MetricTiles',
      cardRequirements: {
        type: 'cards',
        min: 1,
        max: 8,
        optimal: [3, 5],
        description: 'Metric-focused feature cards',
        respectUserContent: true // Prioritize user-provided features
      }
    },
    SplitAlternating: {
      component: 'SplitAlternating',
      cardRequirements: {
        type: 'cards',
        min: 2,
        max: 6,
        optimal: [3, 4],
        description: 'Alternating feature sections',
        respectUserContent: true
      }
    },
    FeatureTestimonial: {
      component: 'FeatureTestimonial',
      cardRequirements: {
        type: 'cards',
        min: 2,
        max: 4,
        optimal: [3, 3],
        description: 'Features with testimonials',
        respectUserContent: true
      }
    },
    Timeline: {
      component: 'Timeline',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 8,
        optimal: [4, 6],
        description: 'Timeline feature cards',
        respectUserContent: true
      }
    },
    Carousel: {
      component: 'Carousel',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 8,
        optimal: [4, 6],
        description: 'Feature carousel cards',
        respectUserContent: true
      }
    },
    MiniCards: {
      component: 'MiniCards',
      cardRequirements: {
        type: 'cards',
        min: 4,
        max: 12,
        optimal: [6, 8],
        description: 'Mini feature cards',
        respectUserContent: true
      }
    },
    Tabbed: {
      component: 'Tabbed',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 6,
        optimal: [3, 4],
        description: 'Tabbed feature cards',
        respectUserContent: true
      }
    }
  },

  Testimonials: {
    QuoteGrid: {
      component: 'QuoteGrid',
      cardRequirements: {
        type: 'cards',
        min: 2,
        max: 6,
        optimal: [3, 4],
        description: 'Grid of testimonial quotes'
      }
    },
    BeforeAfterQuote: {
      component: 'BeforeAfterQuote',
      cardRequirements: {
        type: 'pairs',
        min: 1,
        max: 4,
        optimal: [2, 3],
        description: 'Before/after testimonial pairs'
      }
    },
    PullQuoteStack: {
      component: 'PullQuoteStack',
      cardRequirements: {
        type: 'cards',
        min: 2,
        max: 5,
        optimal: [3, 4],
        description: 'Stacked pull quote testimonials'
      }
    },
    InteractiveTestimonialMap: {
      component: 'InteractiveTestimonialMap',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 8,
        optimal: [4, 6],
        description: 'Interactive testimonial map cards'
      }
    },
    VideoTestimonials: {
      component: 'VideoTestimonials',
      cardRequirements: {
        type: 'cards',
        min: 2,
        max: 6,
        optimal: [3, 4],
        description: 'Video testimonial cards'
      }
    },
    SegmentedTestimonials: {
      component: 'SegmentedTestimonials',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 8,
        optimal: [4, 6],
        description: 'Segmented testimonial categories'
      }
    },
    RatingCards: {
      component: 'RatingCards',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 8,
        optimal: [6, 6],
        description: 'Testimonial rating cards'
      }
    },
    AvatarCarousel: {
      component: 'AvatarCarousel',
      cardRequirements: {
        type: 'cards',
        min: 4,
        max: 10,
        optimal: [6, 8],
        description: 'Avatar carousel testimonials'
      }
    }
  },

  FAQ: {
    AccordionFAQ: {
      component: 'AccordionFAQ',
      cardRequirements: {
        type: 'items',
        min: 3,
        max: 10,
        optimal: [5, 7],
        description: 'Accordion-style FAQ items'
      }
    },
    InlineQnAList: {
      component: 'InlineQnAList',
      cardRequirements: {
        type: 'items',
        min: 2,
        max: 10,
        optimal: [4, 6],
        description: 'Inline Q&A list items'
      }
    },
    TwoColumnFAQ: {
      component: 'TwoColumnFAQ',
      cardRequirements: {
        type: 'items',
        min: 4,
        max: 12,
        optimal: [6, 8],
        description: 'Two-column FAQ layout'
      }
    },
    SegmentedFAQTabs: {
      component: 'SegmentedFAQTabs',
      cardRequirements: {
        type: 'items',
        min: 4,
        max: 15,
        optimal: [8, 10],
        description: 'Categorized FAQ tabs'
      }
    }
  },

  Results: {
    StatBlocks: {
      component: 'StatBlocks',
      cardRequirements: {
        type: 'cards',
        min: 1,
        max: 6,
        optimal: [3, 4],
        description: 'Statistical result blocks'
      }
    },
    BeforeAfterStats: {
      component: 'BeforeAfterStats',
      cardRequirements: {
        type: 'pairs',
        min: 2,
        max: 4,
        optimal: [3, 3],
        description: 'Before/after statistics pairs'
      }
    },
    PersonaResultPanels: {
      component: 'PersonaResultPanels',
      cardRequirements: {
        type: 'cards',
        min: 2,
        max: 6,
        optimal: [3, 4],
        description: 'Persona-specific result panels'
      }
    },
    QuoteWithMetric: {
      component: 'QuoteWithMetric',
      cardRequirements: {
        type: 'cards',
        min: 2,
        max: 5,
        optimal: [3, 4],
        description: 'Testimonial quotes with metrics'
      }
    },
    StackedWinsList: {
      component: 'StackedWinsList',
      cardRequirements: {
        type: 'items',
        min: 3,
        max: 8,
        optimal: [4, 6],
        description: 'Stacked list of wins/achievements'
      }
    },
    OutcomeIcons: {
      component: 'OutcomeIcons',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 8,
        optimal: [4, 6],
        description: 'Outcome icons with descriptions'
      }
    },
    TimelineResults: {
      component: 'TimelineResults',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 6,
        optimal: [4, 5],
        description: 'Timeline of results/achievements'
      }
    },
    EmojiOutcomeGrid: {
      component: 'EmojiOutcomeGrid',
      cardRequirements: {
        type: 'cards',
        min: 4,
        max: 8,
        optimal: [6, 6],
        description: 'Emoji-based outcome grid'
      }
    }
  },

  Comparison: {
    BasicFeatureGrid: {
      component: 'BasicFeatureGrid',
      cardRequirements: {
        type: 'rows',
        min: 4,
        max: 10,
        optimal: [5, 7],
        description: 'Feature comparison rows'
      }
    },
    CheckmarkComparison: {
      component: 'CheckmarkComparison',
      cardRequirements: {
        type: 'rows',
        min: 3,
        max: 8,
        optimal: [4, 6],
        description: 'Checkmark comparison rows'
      }
    },
    YouVsThemHighlight: {
      component: 'YouVsThemHighlight',
      cardRequirements: {
        type: 'rows',
        min: 3,
        max: 8,
        optimal: [4, 6],
        description: 'You vs Them comparison rows'
      }
    },
    ToggleableComparison: {
      component: 'ToggleableComparison',
      cardRequirements: {
        type: 'rows',
        min: 4,
        max: 10,
        optimal: [5, 7],
        description: 'Toggleable comparison table'
      }
    }
  },

  UniqueMechanism: {
    StackedHighlights: {
      component: 'StackedHighlights',
      cardRequirements: {
        type: 'cards',
        min: 2,
        max: 6,
        optimal: [3, 4],
        description: 'Unique mechanism highlight cards'
      }
    },
    AnimatedSequence: {
      component: 'AnimatedSequence',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 5,
        optimal: [3, 4],
        description: 'Animated sequence steps'
      }
    },
    DiagramExplainer: {
      component: 'DiagramExplainer',
      cardRequirements: {
        type: 'blocks',
        min: 1,
        max: 1,
        optimal: [1, 1],
        description: 'Single diagram explainer'
      }
    },
    AlgorithmExplainer: {
      component: 'AlgorithmExplainer',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 5,
        optimal: [3, 4],
        description: 'Algorithm step explanations'
      }
    },
    InnovationTimeline: {
      component: 'InnovationTimeline',
      cardRequirements: {
        type: 'items',
        min: 3,
        max: 7,
        optimal: [4, 5],
        description: 'Innovation timeline milestones'
      }
    },
    MethodologyBreakdown: {
      component: 'MethodologyBreakdown',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 6,
        optimal: [3, 4],
        description: 'Methodology breakdown steps'
      }
    },
    ProcessFlowDiagram: {
      component: 'ProcessFlowDiagram',
      cardRequirements: {
        type: 'blocks',
        min: 1,
        max: 1,
        optimal: [1, 1],
        description: 'Single process flow diagram'
      }
    },
    PropertyComparisonMatrix: {
      component: 'PropertyComparisonMatrix',
      cardRequirements: {
        type: 'rows',
        min: 3,
        max: 8,
        optimal: [4, 6],
        description: 'Property comparison matrix rows'
      }
    },
    SecretSauceReveal: {
      component: 'SecretSauceReveal',
      cardRequirements: {
        type: 'cards',
        min: 2,
        max: 4,
        optimal: [3, 3],
        description: 'Secret sauce feature reveals'
      }
    },
    SystemArchitecture: {
      component: 'SystemArchitecture',
      cardRequirements: {
        type: 'blocks',
        min: 1,
        max: 1,
        optimal: [1, 1],
        description: 'Single system architecture diagram'
      }
    },
    TechnicalAdvantage: {
      component: 'TechnicalAdvantage',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 6,
        optimal: [3, 4],
        description: 'Technical advantage points'
      }
    }
  },

  Problem: {
    StackedPainBullets: {
      component: 'StackedPainBullets',
      cardRequirements: {
        type: 'items',
        min: 2,
        max: 5,
        optimal: [3, 3],
        description: 'Pain point bullets'
      }
    },
    PainAgitationGrid: {
      component: 'PainAgitationGrid',
      cardRequirements: {
        type: 'cards',
        min: 2,
        max: 6,
        optimal: [3, 4],
        description: 'Pain agitation cards'
      }
    },
    CollapsedCards: {
      component: 'CollapsedCards',
      cardRequirements: {
        type: 'cards',
        min: 2,
        max: 4,
        optimal: [3, 3],
        description: 'Expandable problem cards'
      }
    }
  },

  SocialProof: {
    LogoWall: {
      component: 'LogoWall',
      cardRequirements: {
        type: 'items',
        min: 4,
        max: 12,
        optimal: [6, 8],
        description: 'Company logo grid'
      }
    },
    MetricsBanner: {
      component: 'MetricsBanner',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 5,
        optimal: [3, 4],
        description: 'Social proof metrics'
      }
    },
    TestimonialStats: {
      component: 'TestimonialStats',
      cardRequirements: {
        type: 'cards',
        min: 2,
        max: 4,
        optimal: [3, 3],
        description: 'Testimonial statistics'
      }
    },
    StackedStats: {
      component: 'StackedStats',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 6,
        optimal: [4, 6],
        description: 'Stacked social proof metrics'
      }
    },
    IndustryBadgeLine: {
      component: 'IndustryBadgeLine',
      cardRequirements: {
        type: 'items',
        min: 3,
        max: 8,
        optimal: [4, 6],
        description: 'Industry badge certifications'
      }
    },
    MapHeatSpots: {
      component: 'MapHeatSpots',
      cardRequirements: {
        type: 'items',
        min: 5,
        max: 15,
        optimal: [8, 12],
        description: 'Geographic usage heat spots'
      }
    },
    MediaMentions: {
      component: 'MediaMentions',
      cardRequirements: {
        type: 'items',
        min: 3,
        max: 8,
        optimal: [4, 6],
        description: 'Media mention logos'
      }
    },
    SocialProofStrip: {
      component: 'SocialProofStrip',
      cardRequirements: {
        type: 'items',
        min: 4,
        max: 10,
        optimal: [6, 8],
        description: 'Social proof strip elements'
      }
    },
    StripWithReviews: {
      component: 'StripWithReviews',
      cardRequirements: {
        type: 'items',
        min: 3,
        max: 6,
        optimal: [4, 5],
        description: 'Review strip items'
      }
    },
    UserCountBar: {
      component: 'UserCountBar',
      cardRequirements: {
        type: 'cards',
        min: 1,
        max: 3,
        optimal: [2, 2],
        description: 'User count metric cards'
      }
    }
  },

  Pricing: {
    TierCards: {
      component: 'TierCards',
      cardRequirements: {
        type: 'cards',
        min: 2,
        max: 4,
        optimal: [3, 3],
        description: 'Pricing tier cards'
      }
    },
    CallToQuotePlan: {
      component: 'CallToQuotePlan'
    },
    CardWithTestimonial: {
      component: 'CardWithTestimonial',
      cardRequirements: {
        type: 'cards',
        min: 2,
        max: 4,
        optimal: [3, 3],
        description: 'Pricing cards with testimonials'
      }
    },
    MiniStackedCards: {
      component: 'MiniStackedCards',
      cardRequirements: {
        type: 'cards',
        min: 2,
        max: 5,
        optimal: [3, 4],
        description: 'Mini stacked pricing cards'
      }
    },
    FeatureMatrix: {
      component: 'FeatureMatrix',
      cardRequirements: {
        type: 'rows',
        min: 5,
        max: 15,
        optimal: [8, 10],
        description: 'Feature comparison matrix rows'
      }
    },
    ToggleableMonthlyYearly: {
      component: 'ToggleableMonthlyYearly',
      cardRequirements: {
        type: 'cards',
        min: 2,
        max: 4,
        optimal: [3, 3],
        description: 'Monthly/yearly toggle pricing cards'
      }
    },
    SliderPricing: {
      component: 'SliderPricing',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 5,
        optimal: [3, 4],
        description: 'Usage-based slider pricing tiers'
      }
    },
    SegmentBasedPricing: {
      component: 'SegmentBasedPricing',
      cardRequirements: {
        type: 'cards',
        min: 2,
        max: 5,
        optimal: [3, 4],
        description: 'Segment-based pricing cards'
      }
    }
  },

  HowItWorks: {
    ThreeStepHorizontal: {
      component: 'ThreeStepHorizontal',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 3,
        optimal: [3, 3],
        description: 'Three-step process'
      }
    },
    NumberedSteps: {
      component: 'NumberedSteps',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 6,
        optimal: [3, 4],
        description: 'Numbered process steps'
      }
    },
    ProcessTimeline: {
      component: 'ProcessTimeline',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 7,
        optimal: [4, 5],
        description: 'Timeline process steps'
      }
    }
  },

  ObjectionHandling: {
    ProblemToReframeBlocks: {
      component: 'ProblemToReframeBlocks',
      cardRequirements: {
        type: 'pairs',
        min: 2,
        max: 6,
        optimal: [3, 4],
        description: 'Problem/reframe block pairs'
      }
    },
    BoldGuaranteePanel: {
      component: 'BoldGuaranteePanel',
      cardRequirements: {
        type: 'blocks',
        min: 1,
        max: 1,
        optimal: [1, 1],
        description: 'Single guarantee panel'
      }
    },
    MythVsRealityGrid: {
      component: 'MythVsRealityGrid',
      cardRequirements: {
        type: 'pairs',
        min: 3,
        max: 6,
        optimal: [4, 5],
        description: 'Myth vs reality comparison pairs'
      }
    },
    ObjectionAccordion: {
      component: 'ObjectionAccordion',
      cardRequirements: {
        type: 'items',
        min: 3,
        max: 8,
        optimal: [4, 6],
        description: 'Objection accordion items'
      }
    },
    ObjectionCarousel: {
      component: 'ObjectionCarousel',
      cardRequirements: {
        type: 'items',
        min: 3,
        max: 8,
        optimal: [4, 6],
        description: 'Objection carousel slides'
      }
    },
    QuoteBackedAnswers: {
      component: 'QuoteBackedAnswers',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 6,
        optimal: [3, 4],
        description: 'Quote-backed objection answers'
      }
    },
    SkepticToBelieverSteps: {
      component: 'SkepticToBelieverSteps',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 5,
        optimal: [3, 4],
        description: 'Skeptic to believer transformation steps'
      }
    },
    VisualObjectionTiles: {
      component: 'VisualObjectionTiles',
      cardRequirements: {
        type: 'cards',
        min: 4,
        max: 8,
        optimal: [4, 6],
        description: 'Visual objection handling tiles'
      }
    }
  },

  // Sections without specific card requirements (fixed format)
  Hero: {
    leftCopyRightImage: {
      component: 'leftCopyRightImage'
    },
    imageFirst: {
      component: 'imageFirst'
    },
    splitScreen: {
      component: 'splitScreen'
    },
    centerStacked: {
      component: 'centerStacked'
    }
  },

  CTA: {
    CenteredHeadlineCTA: {
      component: 'CenteredHeadlineCTA'
    },
    SplitWithVisual: {
      component: 'SplitWithVisual'
    }
  },

  PrimaryCTA: {
    CTAWithBadgeRow: {
      component: 'CTAWithBadgeRow'
    },
    VisualCTAWithMockup: {
      component: 'VisualCTAWithMockup'
    },
    ValueStackCTA: {
      component: 'ValueStackCTA'
    },
    CountdownLimitedCTA: {
      component: 'CountdownLimitedCTA'
    },
    CTAWithFormField: {
      component: 'CTAWithFormField'
    },
    TestimonialCTACombo: {
      component: 'TestimonialCTACombo'
    }
  },

  // Missing sections from UIBlocks directory scan
  Close: {
    BonusStackCTA: {
      component: 'BonusStackCTA',
      cardRequirements: {
        type: 'items',
        min: 3,
        max: 6,
        optimal: [4, 5],
        description: 'Bonus stack items'
      }
    },
    EnterpriseContactBox: {
      component: 'EnterpriseContactBox'
    },
    LeadMagnetCard: {
      component: 'LeadMagnetCard'
    },
    LimitedOfferCountdown: {
      component: 'LimitedOfferCountdown'
    },
    QuickFormCTA: {
      component: 'QuickFormCTA'
    },
    ScarcityNoticeBox: {
      component: 'ScarcityNoticeBox'
    },
    StickyOfferBar: {
      component: 'StickyOfferBar'
    },
    TrialCTAHighlight: {
      component: 'TrialCTAHighlight'
    }
  },

  Security: {
    AuditResultsPanel: {
      component: 'AuditResultsPanel',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 6,
        optimal: [4, 5],
        description: 'Security audit result cards'
      }
    },
    ComplianceBadgeGrid: {
      component: 'ComplianceBadgeGrid',
      cardRequirements: {
        type: 'items',
        min: 4,
        max: 12,
        optimal: [6, 8],
        description: 'Compliance certification badges'
      }
    },
    CyberThreatDashboard: {
      component: 'CyberThreatDashboard',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 8,
        optimal: [4, 6],
        description: 'Threat protection metrics'
      }
    },
    EncryptionExplainer: {
      component: 'EncryptionExplainer'
    },
    PenetrationTestResults: {
      component: 'PenetrationTestResults',
      cardRequirements: {
        type: 'items',
        min: 4,
        max: 8,
        optimal: [5, 6],
        description: 'Penetration test result items'
      }
    },
    PrivacyPolicyHighlights: {
      component: 'PrivacyPolicyHighlights',
      cardRequirements: {
        type: 'cards',
        min: 4,
        max: 8,
        optimal: [5, 6],
        description: 'Privacy policy highlight cards'
      }
    },
    SecurityFeatureGrid: {
      component: 'SecurityFeatureGrid',
      cardRequirements: {
        type: 'cards',
        min: 4,
        max: 10,
        optimal: [6, 8],
        description: 'Security feature cards'
      }
    },
    TrustSealCollection: {
      component: 'TrustSealCollection',
      cardRequirements: {
        type: 'items',
        min: 3,
        max: 8,
        optimal: [4, 6],
        description: 'Trust seal items'
      }
    }
  },

  Integration: {
    InteractiveStackDiagram: {
      component: 'InteractiveStackDiagram',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 8,
        optimal: [4, 6],
        description: 'Integration stack layers'
      }
    },
    LogoGrid: {
      component: 'LogoGrid',
      cardRequirements: {
        type: 'items',
        min: 6,
        max: 20,
        optimal: [8, 12],
        description: 'Integration partner logos'
      }
    },
    PartnerShowcase: {
      component: 'PartnerShowcase',
      cardRequirements: {
        type: 'cards',
        min: 4,
        max: 12,
        optimal: [6, 8],
        description: 'Partner showcase cards'
      }
    },
    PluginLibrary: {
      component: 'PluginLibrary',
      cardRequirements: {
        type: 'cards',
        min: 6,
        max: 15,
        optimal: [8, 12],
        description: 'Plugin/extension cards'
      }
    },
    ProcessFlow: {
      component: 'ProcessFlow',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 6,
        optimal: [4, 5],
        description: 'Integration process steps'
      }
    },
    StackCarousel: {
      component: 'StackCarousel',
      cardRequirements: {
        type: 'items',
        min: 5,
        max: 12,
        optimal: [6, 8],
        description: 'Technology stack carousel items'
      }
    },
    ToolConnectorGrid: {
      component: 'ToolConnectorGrid',
      cardRequirements: {
        type: 'cards',
        min: 6,
        max: 16,
        optimal: [8, 12],
        description: 'Tool connector cards'
      }
    }
  },

  UseCase: {
    BenefitComparisonChart: {
      component: 'BenefitComparisonChart',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 6,
        optimal: [4, 5],
        description: 'Benefit comparison cards'
      }
    },
    CustomerJourneyMap: {
      component: 'CustomerJourneyMap',
      cardRequirements: {
        type: 'cards',
        min: 4,
        max: 8,
        optimal: [5, 6],
        description: 'Customer journey stage cards'
      }
    },
    IndustryUseCases: {
      component: 'IndustryUseCases',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 8,
        optimal: [4, 6],
        description: 'Industry-specific use case cards'
      }
    },
    PersonaCards: {
      component: 'PersonaCards',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 6,
        optimal: [3, 4],
        description: 'User persona cards'
      }
    },
    RoleBasedFeatures: {
      component: 'RoleBasedFeatures',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 8,
        optimal: [4, 6],
        description: 'Role-based feature cards'
      }
    },
    ScenarioShowcase: {
      component: 'ScenarioShowcase',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 6,
        optimal: [3, 4],
        description: 'Use case scenario cards'
      }
    },
    WorkflowExamples: {
      component: 'WorkflowExamples',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 6,
        optimal: [3, 4],
        description: 'Workflow example cards'
      }
    }
  },

  FounderNote: {
    FounderStoryBanner: {
      component: 'FounderStoryBanner'
    },
    FounderVideoMessage: {
      component: 'FounderVideoMessage'
    },
    ManifestoStatement: {
      component: 'ManifestoStatement'
    },
    MissionVisionPanel: {
      component: 'MissionVisionPanel'
    },
    PersonalNote: {
      component: 'PersonalNote'
    },
    TeamPhotoGrid: {
      component: 'TeamPhotoGrid',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 12,
        optimal: [4, 8],
        description: 'Team member cards'
      }
    },
    ValueCards: {
      component: 'ValueCards',
      cardRequirements: {
        type: 'cards',
        min: 3,
        max: 6,
        optimal: [3, 4],
        description: 'Company value cards'
      }
    }
  },

  Header: {
    CenteredHeader: {
      component: 'CenteredHeader'
    },
    LeftLogoRightMenu: {
      component: 'LeftLogoRightMenu'
    },
    LogoTopCenterMenu: {
      component: 'LogoTopCenterMenu'
    },
    MinimalHeader: {
      component: 'MinimalHeader'
    },
    StickyNavigationBar: {
      component: 'StickyNavigationBar'
    }
  },

  Footer: {
    CenteredMinimal: {
      component: 'CenteredMinimal'
    },
    ComprehensiveFooter: {
      component: 'ComprehensiveFooter'
    },
    SimpleThreeColumn: {
      component: 'SimpleThreeColumn'
    },
    SocialFocusedFooter: {
      component: 'SocialFocusedFooter'
    }
  },

};

/**
 * Helper function to get card requirements for a specific layout
 */
export function getCardRequirements(sectionType: string, layoutName: string) {
  const section = layoutRegistryWithRequirements[sectionType];
  if (!section) return undefined;

  const layout = section[layoutName];
  if (!layout) return undefined;

  return layout.cardRequirements;
}

/**
 * Helper function to get all layouts for a section type
 */
export function getSectionLayouts(sectionType: string) {
  return Object.keys(layoutRegistryWithRequirements[sectionType] || {});
}