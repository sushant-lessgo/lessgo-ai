interface LayoutElement {
  element: string;
  mandatory: boolean;
}

interface LayoutSchema {
  [layoutName: string]: LayoutElement[];
}

export const layoutElementSchema: LayoutSchema = {
  // BeforeAfter Section
  SideBySideBlocks: [
    { element: "headline", mandatory: true },
    { element: "before_label", mandatory: true },
    { element: "after_label", mandatory: true },
    { element: "before_description", mandatory: true },
    { element: "after_description", mandatory: true },
    { element: "before_icon", mandatory: false },
    { element: "after_icon", mandatory: false },
    { element: "subheadline", mandatory: false },
    { element: "supporting_text", mandatory: false },
    { element: "cta_text", mandatory: false },
    { element: "trust_items", mandatory: false },
  ],

  StackedTextVisual: [
    { element: "headline", mandatory: true },
    { element: "before_text", mandatory: true },
    { element: "after_text", mandatory: true },
    { element: "transition_text", mandatory: false },
    { element: "subheadline", mandatory: false },
    { element: "supporting_text", mandatory: false },
    { element: "cta_text", mandatory: false },
    { element: "trust_items", mandatory: false },
  ],

  BeforeAfterSlider: [
    { element: "headline", mandatory: true },
    { element: "before_label", mandatory: true },
    { element: "after_label", mandatory: true },
    { element: "before_description", mandatory: true },
    { element: "after_description", mandatory: true },
    { element: "before_visual", mandatory: false },
    { element: "after_visual", mandatory: false },
    { element: "before_placeholder_text", mandatory: false },
    { element: "after_placeholder_text", mandatory: false },
    { element: "interaction_hint_text", mandatory: false },
    { element: "show_interaction_hint", mandatory: false },
    { element: "before_icon", mandatory: false },
    { element: "after_icon", mandatory: false },
    { element: "hint_icon", mandatory: false },
    { element: "subheadline", mandatory: false },
    { element: "supporting_text", mandatory: false },
    { element: "cta_text", mandatory: false },
    { element: "trust_items", mandatory: false },
    { element: "slider_instruction", mandatory: false },
  ],

  SplitCard: [
    { element: "headline", mandatory: true },
    { element: "before_title", mandatory: true },
    { element: "after_title", mandatory: true },
    { element: "before_description", mandatory: true },
    { element: "after_description", mandatory: true },
    { element: "subheadline", mandatory: false },
    { element: "supporting_text", mandatory: false },
    { element: "cta_text", mandatory: false },
    { element: "trust_items", mandatory: false },
  ],

  TextListTransformation: [
    { element: "headline", mandatory: true },
    { element: "before_label", mandatory: true },
    { element: "after_label", mandatory: true },
    { element: "before_list", mandatory: true },
    { element: "after_list", mandatory: true },
    { element: "transformation_text", mandatory: false },
    { element: "before_icon", mandatory: false },
    { element: "after_icon", mandatory: false },
    { element: "transformation_icon", mandatory: false },
    { element: "subheadline", mandatory: false },
    { element: "supporting_text", mandatory: false },
    { element: "cta_text", mandatory: false },
    { element: "trust_items", mandatory: false },
  ],

  VisualStoryline: [
    { element: "headline", mandatory: true },
    { element: "story_steps", mandatory: true },
    { element: "step_descriptions", mandatory: true },
    { element: "subheadline", mandatory: false },
    { element: "conclusion_text", mandatory: false },
    { element: "supporting_text", mandatory: false },
    { element: "cta_text", mandatory: false },
    { element: "trust_items", mandatory: false },
  ],

  // Results Section
  StatBlocks: [
    { element: "headline", mandatory: true },
    { element: "stat_values", mandatory: true },
    { element: "stat_labels", mandatory: true },
    { element: "stat_descriptions", mandatory: false },
    { element: "subheadline", mandatory: false },
  ],

  BeforeAfterStats: [
    { element: "headline", mandatory: true },
    { element: "before_stats", mandatory: true },
    { element: "after_stats", mandatory: true },
    { element: "stat_labels", mandatory: true },
    { element: "improvement_labels", mandatory: false },
  ],

  QuoteWithMetric: [
    { element: "headline", mandatory: true },
    { element: "result_quotes", mandatory: true },
    { element: "metric_values", mandatory: true },
    { element: "customer_names", mandatory: true },
    { element: "customer_titles", mandatory: false },
  ],

  EmojiOutcomeGrid: [
    { element: "headline", mandatory: true },
    { element: "emojis", mandatory: true },
    { element: "outcomes", mandatory: true },
    { element: "descriptions", mandatory: true },
    { element: "subheadline", mandatory: false },
    { element: "footer_text", mandatory: false },
  ],

  TimelineResults: [
    { element: "headline", mandatory: true },
    { element: "timeline_periods", mandatory: true },
    { element: "result_descriptions", mandatory: true },
    { element: "milestone_markers", mandatory: false },
  ],

  OutcomeIcons: [
    { element: "headline", mandatory: true },
    { element: "outcome_titles", mandatory: true },
    { element: "outcome_descriptions", mandatory: true },
    { element: "icon_labels", mandatory: false },
  ],

  StackedWinsList: [
    { element: "headline", mandatory: true },
    { element: "win_statements", mandatory: true },
    { element: "win_descriptions", mandatory: false },
    { element: "category_labels", mandatory: false },
  ],

  PersonaResultPanels: [
    { element: "headline", mandatory: true },
    { element: "personas", mandatory: true },
    { element: "roles", mandatory: true },
    { element: "result_metrics", mandatory: true },
    { element: "result_descriptions", mandatory: true },
    { element: "key_benefits", mandatory: true },
    { element: "subheadline", mandatory: false },
    { element: "footer_text", mandatory: false },
    { element: "persona_icon_1", mandatory: false },
    { element: "persona_icon_2", mandatory: false },
    { element: "persona_icon_3", mandatory: false },
    { element: "persona_icon_4", mandatory: false },
    { element: "persona_icon_5", mandatory: false },
    { element: "persona_icon_6", mandatory: false },
  ],

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

  SecurityChecklist: [
    { element: "headline", mandatory: true },
    { element: "security_items", mandatory: true },
    { element: "item_descriptions", mandatory: false },
    { element: "compliance_note", mandatory: false },
  ],

  SecurityGuaranteePanel: [
    { element: "headline", mandatory: true },
    { element: "security_stats", mandatory: true },
    { element: "stat_labels", mandatory: true },
    { element: "stat_descriptions", mandatory: false },
  ],

  TrustSealCollection: [
    { element: "headline", mandatory: true },
    { element: "compliance_names", mandatory: true },
    { element: "badge_descriptions", mandatory: false },
    { element: "subheadline", mandatory: false },
  ],

  // SocialProof Section
  LogoWall: [
    { element: "headline", mandatory: true },
    { element: "company_names", mandatory: true },
    { element: "subheadline", mandatory: false },
    { element: "category_labels", mandatory: false },
  ],

  MediaMentions: [
    { element: "headline", mandatory: true },
    { element: "media_names", mandatory: true },
    { element: "mention_quotes", mandatory: true },
    { element: "mention_dates", mandatory: false },
  ],

  UserCountBar: [
    { element: "headline", mandatory: true },
    { element: "user_count", mandatory: true },
    { element: "count_description", mandatory: true },
    { element: "growth_stats", mandatory: false },
  ],

  IndustryBadgeLine: [
    { element: "headline", mandatory: true },
    { element: "badge_titles", mandatory: true },
    { element: "badge_descriptions", mandatory: false },
    { element: "industry_context", mandatory: false },
  ],

  MapHeatSpots: [
    { element: "headline", mandatory: true },
    { element: "location_names", mandatory: true },
    { element: "usage_stats", mandatory: true },
    { element: "map_legend", mandatory: false },
  ],

  StackedStats: [
    { element: "headline", mandatory: true },
    { element: "stat_values", mandatory: true },
    { element: "stat_labels", mandatory: true },
    { element: "stat_contexts", mandatory: false },
  ],

  StripWithReviews: [
    { element: "headline", mandatory: true },
    { element: "review_snippets", mandatory: true },
    { element: "review_sources", mandatory: true },
    { element: "rating_scores", mandatory: false },
  ],

  SocialProofStrip: [
    { element: "headline", mandatory: true },
    { element: "proof_statements", mandatory: true },
    { element: "proof_sources", mandatory: true },
    { element: "credibility_markers", mandatory: false },
  ],

  // Testimonial Section
  QuoteGrid: [
    { element: "headline", mandatory: true },
    { element: "testimonial_quotes", mandatory: true },
    { element: "customer_names", mandatory: true },
    { element: "customer_titles", mandatory: false },
    { element: "customer_companies", mandatory: false },
  ],

  VideoTestimonials: [
    { element: "headline", mandatory: true },
    { element: "video_titles", mandatory: true },
    { element: "video_descriptions", mandatory: true },
    { element: "customer_names", mandatory: true },
    { element: "customer_titles", mandatory: false },
  ],

  AvatarCarousel: [
    { element: "headline", mandatory: true },
    { element: "testimonial_quotes", mandatory: true },
    { element: "customer_names", mandatory: true },
    { element: "customer_titles", mandatory: false },
    { element: "carousel_navigation", mandatory: false },
  ],

  BeforeAfterQuote: [
    { element: "headline", mandatory: true },
    { element: "before_quotes", mandatory: true },
    { element: "after_quotes", mandatory: true },
    { element: "customer_names", mandatory: true },
    { element: "transformation_labels", mandatory: false },
  ],

  SegmentedTestimonials: [
    { element: "headline", mandatory: true },
    { element: "segment_labels", mandatory: true },
    { element: "testimonial_quotes", mandatory: true },
    { element: "customer_names", mandatory: true },
    { element: "customer_titles", mandatory: false },
  ],

  RatingCards: [
    { element: "headline", mandatory: true },
    { element: "testimonial_quotes", mandatory: true },
    { element: "customer_names", mandatory: true },
    { element: "customer_titles", mandatory: true },
    { element: "ratings", mandatory: true },
    { element: "review_platforms", mandatory: true },
    { element: "review_dates", mandatory: false },
    { element: "verified_badges", mandatory: false },
    { element: "customer_locations", mandatory: false },
    { element: "subheadline", mandatory: false },
    { element: "supporting_text", mandatory: false },
    { element: "cta_text", mandatory: false },
    { element: "trust_items", mandatory: false },
  ],

  PullQuoteStack: [
    { element: "headline", mandatory: true },
    { element: "pullquote_texts", mandatory: true },
    { element: "quote_attributions", mandatory: true },
    { element: "quote_contexts", mandatory: false },
  ],

  InteractiveTestimonialMap: [
    { element: "headline", mandatory: true },
    { element: "location_markers", mandatory: true },
    { element: "testimonial_quotes", mandatory: true },
    { element: "customer_names", mandatory: true },
    { element: "location_labels", mandatory: false },
  ],

  // UniqueMechanism Section - Using actual component names
  AlgorithmExplainer: [
    { element: "headline", mandatory: true },
    { element: "algorithm_name", mandatory: true },
    { element: "algorithm_description", mandatory: true },
    { element: "algorithm_steps", mandatory: true },
    { element: "algorithm_benefits", mandatory: false },
  ],

  InnovationTimeline: [
    { element: "headline", mandatory: true },
    { element: "timeline_entries", mandatory: true },
    { element: "entry_descriptions", mandatory: true },
    { element: "entry_dates", mandatory: false },
  ],

  MethodologyBreakdown: [
    { element: "headline", mandatory: true },
    { element: "explainer_content", mandatory: true },
    { element: "tag_labels", mandatory: true },
    { element: "tag_descriptions", mandatory: false },
  ],

  ProcessFlowDiagram: [
    { element: "headline", mandatory: true },
    { element: "flywheel_steps", mandatory: true },
    { element: "step_descriptions", mandatory: true },
    { element: "connection_labels", mandatory: false },
  ],

  PropertyComparisonMatrix: [
    { element: "headline", mandatory: true },
    { element: "comparison_categories", mandatory: true },
    { element: "your_approach", mandatory: true },
    { element: "traditional_approach", mandatory: true },
    { element: "table_headers", mandatory: false },
  ],

  SecretSauceReveal: [
    { element: "headline", mandatory: true },
    { element: "patent_titles", mandatory: true },
    { element: "patent_descriptions", mandatory: true },
    { element: "patent_numbers", mandatory: false },
  ],

  StackedHighlights: [
    { element: "headline", mandatory: true },
    { element: "highlight_titles", mandatory: true },
    { element: "highlight_descriptions", mandatory: true },
    { element: "mechanism_name", mandatory: false },
  ],

  SystemArchitecture: [
    { element: "headline", mandatory: true },
    { element: "model_title", mandatory: true },
    { element: "model_description", mandatory: true },
    { element: "component_labels", mandatory: true },
    { element: "illustration_caption", mandatory: false },
  ],

  TechnicalAdvantage: [
    { element: "headline", mandatory: true },
    { element: "advantages", mandatory: true },
    { element: "advantage_descriptions", mandatory: true },
    { element: "advantage_icon_1", mandatory: false },
    { element: "advantage_icon_2", mandatory: false },
    { element: "advantage_icon_3", mandatory: false },
    { element: "advantage_icon_4", mandatory: false },
    { element: "advantage_icon_5", mandatory: false },
    { element: "advantage_icon_6", mandatory: false },
  ],

  // UseCase Section - Using actual component names
  BeforeAfterWorkflow: [
    { element: "headline", mandatory: true },
    { element: "workflow_steps", mandatory: true },
    { element: "before_descriptions", mandatory: true },
    { element: "after_descriptions", mandatory: true },
    { element: "workflow_benefits", mandatory: false },
  ],

  CustomerJourneyFlow: [
    { element: "headline", mandatory: true },
    { element: "journey_stages", mandatory: true },
    { element: "stage_descriptions", mandatory: true },
    { element: "stage_outcomes", mandatory: false },
  ],

  IndustryUseCaseGrid: [
    { element: "headline", mandatory: true },
    { element: "industry_names", mandatory: true },
    { element: "industry_descriptions", mandatory: true },
    { element: "industry_examples", mandatory: false },
  ],

  InteractiveUseCaseMap: [
    { element: "headline", mandatory: true },
    { element: "use_case_categories", mandatory: true },
    { element: "use_case_descriptions", mandatory: true },
    { element: "interaction_labels", mandatory: false },
  ],

  PersonaGrid: [
    { element: "headline", mandatory: true },
    { element: "persona_names", mandatory: true },
    { element: "persona_descriptions", mandatory: true },
    { element: "use_case_examples", mandatory: false },
  ],

  RoleBasedScenarios: [
    { element: "headline", mandatory: true },
    { element: "role_names", mandatory: true },
    { element: "scenario_descriptions", mandatory: true },
    { element: "scenario_outcomes", mandatory: false },
  ],

  UseCaseCarousel: [
    { element: "headline", mandatory: true },
    { element: "use_case_titles", mandatory: true },
    { element: "use_case_descriptions", mandatory: true },
    { element: "carousel_navigation", mandatory: false },
  ],

  WorkflowDiagrams: [
    { element: "headline", mandatory: true },
    { element: "workflow_steps", mandatory: true },
    { element: "step_descriptions", mandatory: true },
    { element: "diagram_labels", mandatory: false },
  ],

  JobToBeDoneList: [
    { element: "headline", mandatory: true },
    { element: "job_titles", mandatory: true },
    { element: "job_descriptions", mandatory: true },
    { element: "solution_approaches", mandatory: false },
  ],

  StatComparison: [
    { element: "headline", mandatory: true },
    { element: "before_label", mandatory: true },
    { element: "after_label", mandatory: true },
    { element: "before_stats", mandatory: true },
    { element: "after_stats", mandatory: true },
    { element: "improvement_text", mandatory: false },
    { element: "summary_title", mandatory: false },
    { element: "summary_stat_1_value", mandatory: false },
    { element: "summary_stat_1_label", mandatory: false },
    { element: "summary_stat_2_value", mandatory: false },
    { element: "summary_stat_2_label", mandatory: false },
    { element: "summary_stat_3_value", mandatory: false },
    { element: "summary_stat_3_label", mandatory: false },
    { element: "show_summary_section", mandatory: false },
    { element: "improvement_icon", mandatory: false },
    { element: "flow_icon", mandatory: false },
    { element: "stat_icon_1", mandatory: false },
    { element: "stat_icon_2", mandatory: false },
    { element: "stat_icon_3", mandatory: false },
    { element: "subheadline", mandatory: false },
    { element: "supporting_text", mandatory: false },
    { element: "cta_text", mandatory: false },
    { element: "trust_items", mandatory: false },
  ],

  PersonaJourney: [
    { element: "headline", mandatory: true },
    { element: "persona_name", mandatory: true },
    { element: "before_scenario", mandatory: true },
    { element: "after_scenario", mandatory: true },
    { element: "journey_steps", mandatory: false },
    { element: "persona_quote", mandatory: false },
    { element: "subheadline", mandatory: false },
    { element: "supporting_text", mandatory: false },
    { element: "cta_text", mandatory: false },
    { element: "trust_items", mandatory: false },
  ],

  // Close Section
  MockupWithCTA: [
    { element: "headline", mandatory: true },
    { element: "cta_text", mandatory: true },
    { element: "subheadline", mandatory: false },
    { element: "urgency_text", mandatory: false },
    { element: "guarantee_text", mandatory: false },
  ],

  BonusStackCTA: [
    { element: "headline", mandatory: true },
    { element: "cta_text", mandatory: true },
    { element: "bonus_items", mandatory: true },
    { element: "total_value_text", mandatory: false },
    { element: "urgency_text", mandatory: false },
  ],

  LeadMagnetCard: [
    { element: "headline", mandatory: true },
    { element: "cta_text", mandatory: true },
    { element: "magnet_title", mandatory: true },
    { element: "magnet_description", mandatory: true },
    { element: "form_labels", mandatory: false },
    { element: "privacy_text", mandatory: false },
  ],

  EnterpriseContactBox: [
    { element: "headline", mandatory: true },
    { element: "cta_text", mandatory: true },
    { element: "contact_description", mandatory: true },
    { element: "features_list", mandatory: false },
    { element: "contact_methods", mandatory: false },
  ],

  ValueReinforcementBlock: [
    { element: "headline", mandatory: true },
    { element: "value_points", mandatory: true },
    { element: "cta_text", mandatory: true },
    { element: "subheadline", mandatory: false },
    { element: "closing_statement", mandatory: false },
  ],

  LivePreviewEmbed: [
    { element: "headline", mandatory: true },
    { element: "cta_text", mandatory: true },
    { element: "preview_description", mandatory: true },
    { element: "instruction_text", mandatory: false },
  ],

  SideBySideOfferCards: [
    { element: "headline", mandatory: true },
    { element: "offer_titles", mandatory: true },
    { element: "offer_descriptions", mandatory: true },
    { element: "cta_texts", mandatory: true },
    { element: "comparison_points", mandatory: false },
  ],

  MultistepCTAStack: [
    { element: "headline", mandatory: true },
    { element: "step_titles", mandatory: true },
    { element: "step_descriptions", mandatory: true },
    { element: "final_cta_text", mandatory: true },
    { element: "progress_labels", mandatory: false },
  ],

  // Comparison Section
  BasicFeatureGrid: [
    { element: "headline", mandatory: true },
    { element: "feature_names", mandatory: true },
    { element: "competitor_names", mandatory: true },
    { element: "your_product_name", mandatory: true },
    { element: "subheadline", mandatory: false },
  ],

  CheckmarkComparison: [
    { element: "headline", mandatory: true },
    { element: "feature_list", mandatory: true },
    { element: "competitor_name", mandatory: true },
    { element: "your_product_name", mandatory: true },
    { element: "comparison_summary", mandatory: false },
  ],

  YouVsThemHighlight: [
    { element: "headline", mandatory: true },
    { element: "your_approach_title", mandatory: true },
    { element: "their_approach_title", mandatory: true },
    { element: "your_approach_description", mandatory: true },
    { element: "their_approach_description", mandatory: true },
    { element: "conclusion_text", mandatory: false },
  ],

  ToggleableComparison: [
    { element: "headline", mandatory: true },
    { element: "toggle_labels", mandatory: true },
    { element: "comparison_categories", mandatory: true },
    { element: "comparison_values", mandatory: true },
    { element: "subheadline", mandatory: false },
  ],

  CompetitorCallouts: [
    { element: "headline", mandatory: true },
    { element: "competitor_names", mandatory: true },
    { element: "callout_titles", mandatory: true },
    { element: "callout_descriptions", mandatory: true },
    { element: "your_advantage_text", mandatory: false },
  ],

  AnimatedUpgradePath: [
    { element: "headline", mandatory: true },
    { element: "stage_titles", mandatory: true },
    { element: "stage_descriptions", mandatory: true },
    { element: "subheadline", mandatory: false },
    { element: "stage_icons", mandatory: false },
    { element: "stage_icon_1", mandatory: false },
    { element: "stage_icon_2", mandatory: false },
    { element: "stage_icon_3", mandatory: false },
    { element: "cta_text", mandatory: false },
  ],

  PersonaUseCaseCompare: [
    { element: "headline", mandatory: true },
    { element: "persona_names", mandatory: true },
    { element: "use_case_titles", mandatory: true },
    { element: "solution_descriptions", mandatory: true },
    { element: "outcome_comparisons", mandatory: false },
  ],

  LiteVsProVsEnterprise: [
    { element: "headline", mandatory: true },
    { element: "tier_names", mandatory: true },
    { element: "tier_descriptions", mandatory: true },
    { element: "feature_comparisons", mandatory: true },
    { element: "recommended_labels", mandatory: false },
  ],

  // FAQ Section
  AccordionFAQ: [
    { element: "headline", mandatory: true },
    { element: "subheadline", mandatory: false },
    // Individual Q&A fields (up to 5 items)
    { element: "question_1", mandatory: true },
    { element: "answer_1", mandatory: true },
    { element: "question_2", mandatory: true },
    { element: "answer_2", mandatory: true },
    { element: "question_3", mandatory: true },
    { element: "answer_3", mandatory: true },
    { element: "question_4", mandatory: false },
    { element: "answer_4", mandatory: false },
    { element: "question_5", mandatory: false },
    { element: "answer_5", mandatory: false },
    // Icon fields
    { element: "expand_icon", mandatory: false },
    { element: "collapse_icon", mandatory: false },
    // Legacy fields for backward compatibility
    { element: "questions", mandatory: false },
    { element: "answers", mandatory: false },
  ],

  TwoColumnFAQ: [
    { element: "headline", mandatory: true },
    { element: "subheadline", mandatory: false },
    // Left column Q&A (up to 3 items)
    { element: "left_question_1", mandatory: true },
    { element: "left_answer_1", mandatory: true },
    { element: "left_question_2", mandatory: true },
    { element: "left_answer_2", mandatory: true },
    { element: "left_question_3", mandatory: false },
    { element: "left_answer_3", mandatory: false },
    // Right column Q&A (up to 3 items)
    { element: "right_question_1", mandatory: true },
    { element: "right_answer_1", mandatory: true },
    { element: "right_question_2", mandatory: true },
    { element: "right_answer_2", mandatory: true },
    { element: "right_question_3", mandatory: false },
    { element: "right_answer_3", mandatory: false },
    // Column configuration
    { element: "left_column_title", mandatory: false },
    { element: "right_column_title", mandatory: false },
    // Legacy fields for backward compatibility
    { element: "questions", mandatory: false },
    { element: "answers", mandatory: false },
    { element: "column_titles", mandatory: false },
    { element: "questions_left", mandatory: false },
    { element: "answers_left", mandatory: false },
    { element: "questions_right", mandatory: false },
    { element: "answers_right", mandatory: false },
  ],

  InlineQnAList: [
    { element: "headline", mandatory: true },
    { element: "subheadline", mandatory: false },
    { element: "question_1", mandatory: true },
    { element: "answer_1", mandatory: true },
    { element: "question_2", mandatory: true },
    { element: "answer_2", mandatory: true },
    { element: "question_3", mandatory: true },
    { element: "answer_3", mandatory: true },
    { element: "question_4", mandatory: false },
    { element: "answer_4", mandatory: false },
    { element: "question_5", mandatory: false },
    { element: "answer_5", mandatory: false },
    { element: "question_6", mandatory: false },
    { element: "answer_6", mandatory: false },
    { element: "questions", mandatory: false },
    { element: "answers", mandatory: false },
  ],

  SegmentedFAQTabs: [
    { element: "headline", mandatory: true },
    { element: "subheadline", mandatory: false },
    // Tab configuration
    { element: "tab_1_label", mandatory: true },
    { element: "tab_2_label", mandatory: true },
    { element: "tab_3_label", mandatory: false },
    { element: "tab_1_description", mandatory: false },
    { element: "tab_2_description", mandatory: false },
    { element: "tab_3_description", mandatory: false },
    // Tab 1 Q&A (up to 3 items per tab)
    { element: "tab_1_question_1", mandatory: true },
    { element: "tab_1_answer_1", mandatory: true },
    { element: "tab_1_question_2", mandatory: false },
    { element: "tab_1_answer_2", mandatory: false },
    { element: "tab_1_question_3", mandatory: false },
    { element: "tab_1_answer_3", mandatory: false },
    // Tab 2 Q&A
    { element: "tab_2_question_1", mandatory: true },
    { element: "tab_2_answer_1", mandatory: true },
    { element: "tab_2_question_2", mandatory: false },
    { element: "tab_2_answer_2", mandatory: false },
    { element: "tab_2_question_3", mandatory: false },
    { element: "tab_2_answer_3", mandatory: false },
    // Tab 3 Q&A
    { element: "tab_3_question_1", mandatory: false },
    { element: "tab_3_answer_1", mandatory: false },
    { element: "tab_3_question_2", mandatory: false },
    { element: "tab_3_answer_2", mandatory: false },
    { element: "tab_3_question_3", mandatory: false },
    { element: "tab_3_answer_3", mandatory: false },
    // Legacy fields for backward compatibility
    { element: "tab_labels", mandatory: false },
    { element: "tab_descriptions", mandatory: false },
    { element: "questions", mandatory: false },
    { element: "answers", mandatory: false },
  ],

  QuoteStyleAnswers: [
    { element: "headline", mandatory: true },
    { element: "subheadline", mandatory: false },
    // Individual Q&A with quotes (up to 5 items)
    { element: "question_1", mandatory: true },
    { element: "quote_answer_1", mandatory: true },
    { element: "attribution_1", mandatory: true },
    { element: "question_2", mandatory: true },
    { element: "quote_answer_2", mandatory: true },
    { element: "attribution_2", mandatory: true },
    { element: "question_3", mandatory: false },
    { element: "quote_answer_3", mandatory: false },
    { element: "attribution_3", mandatory: false },
    { element: "question_4", mandatory: false },
    { element: "quote_answer_4", mandatory: false },
    { element: "attribution_4", mandatory: false },
    { element: "question_5", mandatory: false },
    { element: "quote_answer_5", mandatory: false },
    { element: "attribution_5", mandatory: false },
    // Style configuration
    { element: "quote_style", mandatory: false },
    { element: "attribution_style", mandatory: false },
    // Legacy fields for backward compatibility
    { element: "questions", mandatory: false },
    { element: "quote_answers", mandatory: false },
    { element: "quote_attributions", mandatory: false },
  ],

  IconWithAnswers: [
    { element: "headline", mandatory: true },
    { element: "subheadline", mandatory: false },
    // Individual Q&A with icons (up to 6 items)
    { element: "question_1", mandatory: true },
    { element: "answer_1", mandatory: true },
    { element: "icon_1", mandatory: true },
    { element: "question_2", mandatory: true },
    { element: "answer_2", mandatory: true },
    { element: "icon_2", mandatory: true },
    { element: "question_3", mandatory: true },
    { element: "answer_3", mandatory: true },
    { element: "icon_3", mandatory: true },
    { element: "question_4", mandatory: false },
    { element: "answer_4", mandatory: false },
    { element: "icon_4", mandatory: false },
    { element: "question_5", mandatory: false },
    { element: "answer_5", mandatory: false },
    { element: "icon_5", mandatory: false },
    { element: "question_6", mandatory: false },
    { element: "answer_6", mandatory: false },
    { element: "icon_6", mandatory: false },
    // Icon configuration
    { element: "icon_position", mandatory: false },
    { element: "icon_size", mandatory: false },
    // Legacy fields for backward compatibility
    { element: "questions", mandatory: false },
    { element: "answers", mandatory: false },
    { element: "icon_labels", mandatory: false },
  ],

  TestimonialFAQs: [
    { element: "headline", mandatory: true },
    { element: "subheadline", mandatory: false },
    // Individual Q&A with testimonials (up to 5 items)
    { element: "question_1", mandatory: true },
    { element: "testimonial_answer_1", mandatory: true },
    { element: "customer_name_1", mandatory: true },
    { element: "customer_title_1", mandatory: false },
    { element: "customer_company_1", mandatory: false },
    { element: "question_2", mandatory: true },
    { element: "testimonial_answer_2", mandatory: true },
    { element: "customer_name_2", mandatory: true },
    { element: "customer_title_2", mandatory: false },
    { element: "customer_company_2", mandatory: false },
    { element: "question_3", mandatory: false },
    { element: "testimonial_answer_3", mandatory: false },
    { element: "customer_name_3", mandatory: false },
    { element: "customer_title_3", mandatory: false },
    { element: "customer_company_3", mandatory: false },
    { element: "question_4", mandatory: false },
    { element: "testimonial_answer_4", mandatory: false },
    { element: "customer_name_4", mandatory: false },
    { element: "customer_title_4", mandatory: false },
    { element: "customer_company_4", mandatory: false },
    { element: "question_5", mandatory: false },
    { element: "testimonial_answer_5", mandatory: false },
    { element: "customer_name_5", mandatory: false },
    { element: "customer_title_5", mandatory: false },
    { element: "customer_company_5", mandatory: false },
    // Style configuration
    { element: "testimonial_style", mandatory: false },
    { element: "customer_photo_style", mandatory: false },
    // Legacy fields for backward compatibility
    { element: "questions", mandatory: false },
    { element: "testimonial_answers", mandatory: false },
    { element: "customer_names", mandatory: false },
    { element: "customer_titles", mandatory: false },
  ],

  ChatBubbleFAQ: [
    { element: "headline", mandatory: true },
    { element: "subheadline", mandatory: false },
    // Individual chat conversations (up to 5 items)
    { element: "question_1", mandatory: true },
    { element: "answer_1", mandatory: true },
    { element: "persona_1", mandatory: false },
    { element: "question_2", mandatory: true },
    { element: "answer_2", mandatory: true },
    { element: "persona_2", mandatory: false },
    { element: "question_3", mandatory: false },
    { element: "answer_3", mandatory: false },
    { element: "persona_3", mandatory: false },
    { element: "question_4", mandatory: false },
    { element: "answer_4", mandatory: false },
    { element: "persona_4", mandatory: false },
    { element: "question_5", mandatory: false },
    { element: "answer_5", mandatory: false },
    { element: "persona_5", mandatory: false },
    // Chat configuration
    { element: "customer_persona_name", mandatory: false },
    { element: "support_persona_name", mandatory: false },
    { element: "chat_style", mandatory: false },
    { element: "bubble_alignment", mandatory: false },
    // Legacy fields for backward compatibility
    { element: "questions", mandatory: false },
    { element: "answers", mandatory: false },
    { element: "chat_personas", mandatory: false },
  ],

  // Features Section
  IconGrid: [
    { element: "headline", mandatory: true },
    { element: "feature_titles", mandatory: true },
    { element: "feature_descriptions", mandatory: true },
    { element: "subheadline", mandatory: false },
  ],

  SplitAlternating: [
    { element: "headline", mandatory: true },
    { element: "feature_titles", mandatory: true },
    { element: "feature_descriptions", mandatory: true },
    { element: "feature_benefits", mandatory: false },
  ],

  Tabbed: [
    { element: "headline", mandatory: true },
    { element: "tab_labels", mandatory: true },
    { element: "tab_titles", mandatory: true },
    { element: "tab_descriptions", mandatory: true },
    { element: "subheadline", mandatory: false },
  ],

  Timeline: [
    { element: "headline", mandatory: true },
    { element: "timeline_titles", mandatory: true },
    { element: "timeline_descriptions", mandatory: true },
    { element: "timeline_dates", mandatory: false },
    { element: "milestone_labels", mandatory: false },
  ],

  FeatureTestimonial: [
    { element: "headline", mandatory: true },
    { element: "feature_titles", mandatory: true },
    { element: "feature_descriptions", mandatory: true },
    { element: "testimonial_quotes", mandatory: true },
    { element: "customer_names", mandatory: true },
    { element: "customer_titles", mandatory: false },
  ],

  MetricTiles: [
    { element: "headline", mandatory: true },
    { element: "metric_values", mandatory: true },
    { element: "metric_labels", mandatory: true },
    { element: "metric_descriptions", mandatory: false },
    { element: "subheadline", mandatory: false },
  ],

  MiniCards: [
    { element: "headline", mandatory: true },
    { element: "card_titles", mandatory: true },
    { element: "card_descriptions", mandatory: true },
    { element: "card_tags", mandatory: false },
  ],

  Carousel: [
    { element: "headline", mandatory: true },
    { element: "slide_titles", mandatory: true },
    { element: "slide_descriptions", mandatory: true },
    { element: "navigation_labels", mandatory: false },
    { element: "slide_numbers", mandatory: false },
  ],

  // FounderNote Section
  FounderCardWithQuote: [
    { element: "founder_name", mandatory: true },
    { element: "founder_title", mandatory: true },
    { element: "founder_quote", mandatory: true },
    { element: "founder_bio", mandatory: false },
    { element: "company_context", mandatory: false },
  ],

  LetterStyleBlock: [
    { element: "greeting", mandatory: true },
    { element: "letter_content", mandatory: true },
    { element: "closing", mandatory: true },
    { element: "founder_name", mandatory: true },
    { element: "founder_title", mandatory: true },
    { element: "date", mandatory: false },
  ],

  VideoNoteWithTranscript: [
    { element: "video_title", mandatory: true },
    { element: "video_description", mandatory: true },
    { element: "transcript_text", mandatory: true },
    { element: "founder_name", mandatory: true },
    { element: "video_duration", mandatory: false },
  ],

  MissionQuoteOverlay: [
    { element: "mission_quote", mandatory: true },
    { element: "founder_name", mandatory: true },
    { element: "founder_title", mandatory: true },
    { element: "context_text", mandatory: false },
  ],

  TimelineToToday: [
    { element: "timeline_title", mandatory: true },
    { element: "timeline_events", mandatory: true },
    { element: "event_descriptions", mandatory: true },
    { element: "founder_name", mandatory: true },
    { element: "event_dates", mandatory: false },
  ],

  SideBySidePhotoStory: [
    { element: "story_title", mandatory: true },
    { element: "story_content", mandatory: true },
    { element: "founder_name", mandatory: true },
    { element: "photo_caption", mandatory: false },
    { element: "story_conclusion", mandatory: false },
  ],

  StoryBlockWithPullquote: [
    { element: "story_title", mandatory: true },
    { element: "story_content", mandatory: true },
    { element: "pullquote_text", mandatory: true },
    { element: "founder_name", mandatory: true },
    { element: "story_context", mandatory: false },
  ],

  FoundersBeliefStack: [
    { element: "belief_title", mandatory: true },
    { element: "belief_statements", mandatory: true },
    { element: "founder_names", mandatory: true },
    { element: "belief_explanations", mandatory: false },
    { element: "company_mission", mandatory: false },
  ],

  // Hero Section
  leftCopyRightImage: [
    { element: "headline", mandatory: true },
    { element: "cta_text", mandatory: true },
    { element: "subheadline", mandatory: false },
    { element: "supporting_text", mandatory: false },
    { element: "badge_text", mandatory: false },
  ],

  centerStacked: [
    { element: "headline", mandatory: true },
    { element: "cta_text", mandatory: true },
    { element: "subheadline", mandatory: false },
    { element: "supporting_text", mandatory: false },
    { element: "secondary_cta_text", mandatory: false },
  ],

  splitScreen: [
    { element: "headline", mandatory: true },
    { element: "cta_text", mandatory: true },
    { element: "subheadline", mandatory: false },
    { element: "value_proposition", mandatory: false },
  ],

  imageFirst: [
    { element: "headline", mandatory: true },
    { element: "cta_text", mandatory: true },
    { element: "subheadline", mandatory: false },
    { element: "caption_text", mandatory: false },
  ],

  // HowItWorks Section
  ThreeStepHorizontal: [
    { element: "headline", mandatory: true },
    { element: "step_titles", mandatory: true },
    { element: "step_descriptions", mandatory: true },
    { element: "step_numbers", mandatory: false },
    { element: "conclusion_text", mandatory: false },
  ],

  VerticalTimeline: [
    { element: "headline", mandatory: true },
    { element: "step_titles", mandatory: true },
    { element: "step_descriptions", mandatory: true },
    { element: "timeline_connector_text", mandatory: false },
  ],

  IconCircleSteps: [
    { element: "headline", mandatory: true },
    { element: "step_titles", mandatory: true },
    { element: "step_descriptions", mandatory: true },
    { element: "step_labels", mandatory: false },
  ],

  AccordionSteps: [
    { element: "headline", mandatory: true },
    { element: "step_titles", mandatory: true },
    { element: "step_descriptions", mandatory: true },
    { element: "step_details", mandatory: false },
  ],

  CardFlipSteps: [
    { element: "headline", mandatory: true },
    { element: "step_titles", mandatory: true },
    { element: "step_descriptions", mandatory: true },
    { element: "step_details", mandatory: false },
    { element: "flip_instruction", mandatory: false },
  ],

  VideoWalkthrough: [
    { element: "headline", mandatory: true },
    { element: "video_title", mandatory: true },
    { element: "video_description", mandatory: true },
    { element: "chapter_titles", mandatory: false },
    { element: "video_duration", mandatory: false },
  ],

  ZigzagImageSteps: [
    { element: "headline", mandatory: true },
    { element: "step_titles", mandatory: true },
    { element: "step_descriptions", mandatory: true },
    { element: "image_captions", mandatory: false },
  ],

  AnimatedProcessLine: [
    { element: "headline", mandatory: true },
    { element: "process_titles", mandatory: true },
    { element: "process_descriptions", mandatory: true },
    { element: "animation_labels", mandatory: false },
  ],

  // Integration Section
  LogoGrid: [
    { element: "headline", mandatory: true },
    { element: "integration_names", mandatory: true },
    { element: "subheadline", mandatory: false },
    { element: "category_labels", mandatory: false },
  ],

  CategoryAccordion: [
    { element: "headline", mandatory: true },
    { element: "category_titles", mandatory: true },
    { element: "integration_names", mandatory: true },
    { element: "category_descriptions", mandatory: false },
  ],

  InteractiveStackDiagram: [
    { element: "headline", mandatory: true },
    { element: "layer_titles", mandatory: true },
    { element: "layer_descriptions", mandatory: true },
    { element: "interaction_labels", mandatory: false },
  ],

  UseCaseTiles: [
    { element: "headline", mandatory: true },
    { element: "use_case_titles", mandatory: true },
    { element: "use_case_descriptions", mandatory: true },
    { element: "integration_lists", mandatory: false },
  ],

  BadgeCarousel: [
    { element: "headline", mandatory: true },
    { element: "badge_titles", mandatory: true },
    { element: "badge_descriptions", mandatory: true },
    { element: "carousel_navigation", mandatory: false },
  ],

  TabbyIntegrationCards: [
    { element: "headline", mandatory: true },
    { element: "tab_labels", mandatory: true },
    { element: "integration_titles", mandatory: true },
    { element: "integration_descriptions", mandatory: true },
    { element: "setup_instructions", mandatory: false },
  ],

  ZapierLikeBuilderPreview: [
    { element: "headline", mandatory: true },
    { element: "trigger_labels", mandatory: true },
    { element: "action_labels", mandatory: true },
    { element: "connection_descriptions", mandatory: true },
    { element: "builder_instructions", mandatory: false },
  ],

  LogoWithQuoteUse: [
    { element: "headline", mandatory: true },
    { element: "integration_names", mandatory: true },
    { element: "usage_quotes", mandatory: true },
    { element: "customer_names", mandatory: true },
    { element: "customer_titles", mandatory: false },
  ],

  // Objection Section
  ObjectionAccordion: [
    { element: "headline", mandatory: true },
    { element: "objection_titles", mandatory: true },
    { element: "objection_responses", mandatory: true },
    { element: "subheadline", mandatory: false },
  ],

  MythVsRealityGrid: [
    { element: "headline", mandatory: true },
    { element: "myth_reality_pairs", mandatory: true },
    { element: "subheadline", mandatory: false },
    { element: "myth_icon", mandatory: false },
    { element: "reality_icon", mandatory: false },
  ],

  QuoteBackedAnswers: [
    { element: "headline", mandatory: true },
    { element: "objection_titles", mandatory: true },
    { element: "quote_responses", mandatory: true },
    { element: "quote_attributions", mandatory: true },
    { element: "source_credentials", mandatory: false },
  ],

  VisualObjectionTiles: [
    { element: "headline", mandatory: true },
    { element: "objection_titles", mandatory: true },
    { element: "objection_responses", mandatory: true },
    { element: "tile_labels", mandatory: false },
  ],

  ProblemToReframeBlocks: [
    { element: "headline", mandatory: true },
    { element: "problem_statements", mandatory: true },
    { element: "reframe_statements", mandatory: true },
    { element: "transition_text", mandatory: false },
  ],

  SkepticToBelieverSteps: [
    { element: "headline", mandatory: true },
    { element: "conversion_steps", mandatory: true },
    { element: "subheadline", mandatory: false },
    { element: "objections_summary", mandatory: false },
    { element: "step_icon_1", mandatory: false },
    { element: "step_icon_2", mandatory: false },
    { element: "step_icon_3", mandatory: false },
    { element: "step_icon_4", mandatory: false },
    { element: "step_icon_5", mandatory: false },
    { element: "step_icon_6", mandatory: false },
  ],

  BoldGuaranteePanel: [
    { element: "headline", mandatory: true },
    { element: "guarantee_statement", mandatory: true },
    { element: "guarantee_details", mandatory: true },
    { element: "risk_reversal_text", mandatory: false },
  ],

  ObjectionCarousel: [
    { element: "headline", mandatory: true },
    { element: "objection_titles", mandatory: true },
    { element: "objection_responses", mandatory: true },
    { element: "carousel_navigation", mandatory: false },
  ],

  // Pricing Section
  TierCards: [
    { element: "headline", mandatory: true },
    { element: "tier_names", mandatory: true },
    { element: "tier_prices", mandatory: true },
    { element: "tier_descriptions", mandatory: true },
    { element: "cta_texts", mandatory: true },
    { element: "feature_lists", mandatory: false },
    { element: "popular_labels", mandatory: false },
  ],

  ToggleableMonthlyYearly: [
    { element: "headline", mandatory: true },
    { element: "toggle_labels", mandatory: true },
    { element: "tier_names", mandatory: true },
    { element: "monthly_prices", mandatory: true },
    { element: "yearly_prices", mandatory: true },
    { element: "cta_texts", mandatory: true },
    { element: "savings_labels", mandatory: false },
  ],

  FeatureMatrix: [
    { element: "headline", mandatory: true },
    { element: "tier_names", mandatory: true },
    { element: "feature_categories", mandatory: true },
    { element: "feature_names", mandatory: true },
    { element: "tier_prices", mandatory: true },
    { element: "cta_texts", mandatory: true },
  ],

  SegmentBasedPricing: [
    { element: "headline", mandatory: true },
    { element: "segment_names", mandatory: true },
    { element: "segment_descriptions", mandatory: true },
    { element: "segment_prices", mandatory: true },
    { element: "cta_texts", mandatory: true },
    { element: "ideal_for_labels", mandatory: false },
  ],

  SliderPricing: [
    { element: "headline", mandatory: true },
    { element: "slider_labels", mandatory: true },
    { element: "price_tiers", mandatory: true },
    { element: "tier_descriptions", mandatory: true },
    { element: "cta_text", mandatory: true },
    { element: "calculator_instructions", mandatory: false },
  ],

  CallToQuotePlan: [
    { element: "headline", mandatory: true },
    { element: "plan_name", mandatory: true },
    { element: "plan_description", mandatory: true },
    { element: "cta_text", mandatory: true },
    { element: "feature_highlights", mandatory: false },
    { element: "contact_information", mandatory: false },
  ],

  CardWithTestimonial: [
    { element: "headline", mandatory: true },
    { element: "tier_names", mandatory: true },
    { element: "tier_prices", mandatory: true },
    { element: "cta_texts", mandatory: true },
    { element: "testimonial_quotes", mandatory: true },
    { element: "customer_names", mandatory: true },
    { element: "customer_titles", mandatory: false },
  ],

  MiniStackedCards: [
    { element: "headline", mandatory: true },
    { element: "card_titles", mandatory: true },
    { element: "card_prices", mandatory: true },
    { element: "card_descriptions", mandatory: true },
    { element: "cta_texts", mandatory: true },
    { element: "card_badges", mandatory: false },
  ],

  // CTA Section
  CenteredHeadlineCTA: [
    { element: "headline", mandatory: true },
    { element: "cta_text", mandatory: true },
    { element: "subheadline", mandatory: false },
    { element: "urgency_text", mandatory: false },
  ],

  CTAWithBadgeRow: [
    { element: "headline", mandatory: true },
    { element: "cta_text", mandatory: true },
    { element: "badge_texts", mandatory: true },
    { element: "subheadline", mandatory: false },
  ],

  VisualCTAWithMockup: [
    { element: "headline", mandatory: true },
    { element: "cta_text", mandatory: true },
    { element: "mockup_caption", mandatory: false },
    { element: "supporting_text", mandatory: false },
  ],

  SideBySideCTA: [
    { element: "headline", mandatory: true },
    { element: "cta_text", mandatory: true },
    { element: "value_proposition", mandatory: true },
    { element: "benefit_list", mandatory: false },
  ],

  CountdownLimitedCTA: [
    { element: "headline", mandatory: true },
    { element: "cta_text", mandatory: true },
    { element: "countdown_label", mandatory: true },
    { element: "scarcity_text", mandatory: true },
    { element: "urgency_text", mandatory: false },
  ],

  CTAWithFormField: [
    { element: "headline", mandatory: true },
    { element: "cta_text", mandatory: true },
    { element: "form_labels", mandatory: true },
    { element: "form_placeholders", mandatory: true },
    { element: "privacy_text", mandatory: false },
  ],

  ValueStackCTA: [
    { element: "headline", mandatory: true },
    { element: "cta_text", mandatory: true },
    { element: "value_items", mandatory: true },
    { element: "total_value_text", mandatory: false },
  ],

  TestimonialCTACombo: [
    { element: "headline", mandatory: true },
    { element: "cta_text", mandatory: true },
    { element: "testimonial_quote", mandatory: true },
    { element: "customer_name", mandatory: true },
    { element: "customer_title", mandatory: false },
  ],

  // Problem Section
  StackedPainBullets: [
    { element: "headline", mandatory: true },
    { element: "pain_points", mandatory: true },
    { element: "pain_descriptions", mandatory: false },
    { element: "subheadline", mandatory: false },
  ],

  BeforeImageAfterText: [
    { element: "headline", mandatory: true },
    { element: "before_description", mandatory: true },
    { element: "after_description", mandatory: true },
    { element: "image_caption", mandatory: false },
  ],

  SideBySideSplit: [
    { element: "headline", mandatory: true },
    { element: "problem_title", mandatory: true },
    { element: "problem_description", mandatory: true },
    { element: "solution_preview", mandatory: false },
  ],

  EmotionalQuotes: [
    { element: "headline", mandatory: true },
    { element: "emotional_quotes", mandatory: true },
    { element: "quote_attributions", mandatory: true },
    { element: "context_text", mandatory: false },
  ],

  CollapsedCards: [
    { element: "headline", mandatory: true },
    { element: "problem_titles", mandatory: true },
    { element: "problem_descriptions", mandatory: true },
    { element: "expand_labels", mandatory: false },
  ],

  PainMeterChart: [
    { element: "headline", mandatory: true },
    { element: "pain_categories", mandatory: true },
    { element: "pain_levels", mandatory: true },
    { element: "pain_descriptions", mandatory: true },
    { element: "chart_labels", mandatory: false },
  ],

  PersonaPanels: [
    { element: "headline", mandatory: true },
    { element: "persona_names", mandatory: true },
    { element: "persona_problems", mandatory: true },
    { element: "persona_descriptions", mandatory: false },
  ],

  ProblemChecklist: [
    { element: "headline", mandatory: true },
    { element: "problem_statements", mandatory: true },
    { element: "checklist_items", mandatory: true },
    { element: "conclusion_text", mandatory: false },
    { element: "scoring_labels", mandatory: false },
    { element: "action_thresholds", mandatory: false },
    { element: "intro_text", mandatory: false },
    { element: "subheadline", mandatory: false },
    { element: "supporting_text", mandatory: false },
    { element: "cta_text", mandatory: false },
    { element: "trust_items", mandatory: false },
    { element: "result_stat_1", mandatory: false },
    { element: "result_stat_1_label", mandatory: false },
    { element: "result_stat_2", mandatory: false },
    { element: "result_stat_2_label", mandatory: false },
    { element: "result_stat_3", mandatory: false },
    { element: "result_stat_3_label", mandatory: false },
    { element: "encouragement_tip_1", mandatory: false },
    { element: "encouragement_tip_2", mandatory: false },
    { element: "encouragement_tip_3", mandatory: false },
  ],

  // Header Section
  MinimalNavHeader: [
    { element: "nav_item_1", mandatory: true },
    { element: "nav_item_2", mandatory: false },
    { element: "nav_item_3", mandatory: false },
    { element: "nav_item_4", mandatory: false },
    { element: "nav_link_1", mandatory: false },
    { element: "nav_link_2", mandatory: false },
    { element: "nav_link_3", mandatory: false },
    { element: "nav_link_4", mandatory: false },
  ],

  NavWithCTAHeader: [
    { element: "nav_item_1", mandatory: true },
    { element: "nav_item_2", mandatory: false },
    { element: "nav_item_3", mandatory: false },
    { element: "nav_item_4", mandatory: false },
    { element: "nav_link_1", mandatory: false },
    { element: "nav_link_2", mandatory: false },
    { element: "nav_link_3", mandatory: false },
    { element: "nav_link_4", mandatory: false },
    { element: "cta_text", mandatory: true },
  ],

  CenteredLogoHeader: [
    { element: "nav_item_1", mandatory: true },
    { element: "nav_item_2", mandatory: true },
    { element: "nav_item_3", mandatory: false },
    { element: "nav_item_4", mandatory: false },
    { element: "nav_item_5", mandatory: false },
    { element: "nav_item_6", mandatory: false },
    { element: "nav_link_1", mandatory: false },
    { element: "nav_link_2", mandatory: false },
    { element: "nav_link_3", mandatory: false },
    { element: "nav_link_4", mandatory: false },
    { element: "nav_link_5", mandatory: false },
    { element: "nav_link_6", mandatory: false },
  ],

  FullNavHeader: [
    { element: "nav_item_1", mandatory: true },
    { element: "nav_item_2", mandatory: false },
    { element: "nav_item_3", mandatory: false },
    { element: "nav_item_4", mandatory: false },
    { element: "nav_item_5", mandatory: false },
    { element: "nav_link_1", mandatory: false },
    { element: "nav_link_2", mandatory: false },
    { element: "nav_link_3", mandatory: false },
    { element: "nav_link_4", mandatory: false },
    { element: "nav_link_5", mandatory: false },
    { element: "cta_text", mandatory: true },
    { element: "secondary_cta_text", mandatory: false },
  ],

  // Footer Section
  SimpleFooter: [
    { element: "copyright", mandatory: true },
    { element: "link_text_1", mandatory: false },
    { element: "link_1", mandatory: false },
    { element: "link_text_2", mandatory: false },
    { element: "link_2", mandatory: false },
    { element: "link_text_3", mandatory: false },
    { element: "link_3", mandatory: false },
  ],

  LinksAndSocialFooter: [
    { element: "copyright", mandatory: true },
    { element: "company_name", mandatory: false },
    { element: "tagline", mandatory: false },
    { element: "link_text_1", mandatory: false },
    { element: "link_1", mandatory: false },
    { element: "link_text_2", mandatory: false },
    { element: "link_2", mandatory: false },
    { element: "link_text_3", mandatory: false },
    { element: "link_3", mandatory: false },
    { element: "link_text_4", mandatory: false },
    { element: "link_4", mandatory: false },
    { element: "social_twitter", mandatory: false },
    { element: "social_linkedin", mandatory: false },
    { element: "social_github", mandatory: false },
    { element: "social_facebook", mandatory: false },
  ],

  MultiColumnFooter: [
    { element: "copyright", mandatory: true },
    { element: "company_description", mandatory: false },
    { element: "column_1_title", mandatory: false },
    { element: "column_1_link_text_1", mandatory: false },
    { element: "column_1_link_1", mandatory: false },
    { element: "column_1_link_text_2", mandatory: false },
    { element: "column_1_link_2", mandatory: false },
    { element: "column_1_link_text_3", mandatory: false },
    { element: "column_1_link_3", mandatory: false },
    { element: "column_1_link_text_4", mandatory: false },
    { element: "column_1_link_4", mandatory: false },
    { element: "column_2_title", mandatory: false },
    { element: "column_2_link_text_1", mandatory: false },
    { element: "column_2_link_1", mandatory: false },
    { element: "column_2_link_text_2", mandatory: false },
    { element: "column_2_link_2", mandatory: false },
    { element: "column_2_link_text_3", mandatory: false },
    { element: "column_2_link_3", mandatory: false },
    { element: "column_2_link_text_4", mandatory: false },
    { element: "column_2_link_4", mandatory: false },
    { element: "column_3_title", mandatory: false },
    { element: "column_3_link_text_1", mandatory: false },
    { element: "column_3_link_1", mandatory: false },
    { element: "column_3_link_text_2", mandatory: false },
    { element: "column_3_link_2", mandatory: false },
    { element: "column_3_link_text_3", mandatory: false },
    { element: "column_3_link_3", mandatory: false },
    { element: "column_3_link_text_4", mandatory: false },
    { element: "column_3_link_4", mandatory: false },
  ],

  ContactFooter: [
    { element: "copyright", mandatory: true },
    { element: "newsletter_title", mandatory: false },
    { element: "newsletter_description", mandatory: false },
    { element: "newsletter_cta", mandatory: false },
    { element: "email", mandatory: false },
    { element: "phone", mandatory: false },
    { element: "address", mandatory: false },
    { element: "link_text_1", mandatory: false },
    { element: "link_1", mandatory: false },
    { element: "link_text_2", mandatory: false },
    { element: "link_2", mandatory: false },
    { element: "link_text_3", mandatory: false },
    { element: "link_3", mandatory: false },
    { element: "link_text_4", mandatory: false },
    { element: "link_4", mandatory: false },
  ],
}