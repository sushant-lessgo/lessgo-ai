// modules/prompt/buildPrompt.ts - ✅ PHASE 4: API Layer Migration Complete
import { getCompleteElementsMap, getSectionElementRequirements, mapStoreToVariables } from '../sections/elementDetermination'
import { classifyFieldsForSection, getGenerationStrategy } from '../generation/fieldClassification'

import type {
  InputVariables,
  HiddenInferredFields,
  FeatureItem
} from '@/types/core/index';
import type { EditStore } from '@/types/store';

// ✅ PERMANENT FIX: Use the actual store state interfaces
// Import the store state getter function to access current types
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';

// ✅ FIXED: Extract actual store types from Zustand stores
type OnboardingStore = ReturnType<typeof useOnboardingStore.getState>;
type PageStore = ReturnType<typeof useEditStore.getState>;

/**
 * Builds business context section for all prompt types
 */
function buildBusinessContext(onboardingStore: OnboardingStore, pageStore: PageStore): string {
  const { oneLiner, validatedFields, featuresFromAI } = onboardingStore;
  const { targetAudience, businessType } = (pageStore as any).meta?.onboardingData || {};

  const features = featuresFromAI.map(f => `• ${f.feature}: ${f.benefit}`).join('\n');
  
  return `BUSINESS CONTEXT:
Product/Service: ${oneLiner}
Target Audience: ${targetAudience || validatedFields.targetAudience || 'Not specified'}
Business Type: ${businessType || validatedFields.marketCategory || 'Not specified'}
Market Category: ${validatedFields.marketSubcategory || 'Not specified'}
Startup Stage: ${validatedFields.startupStage || 'Not specified'}
Landing Goal: ${validatedFields.landingPageGoals || 'Not specified'}

KEY FEATURES & BENEFITS:
${features || 'Features not available'}`;
}

/**
 * ✅ FIXED: Builds brand and tone context section using canonical field names
 */
function buildBrandContext(onboardingStore: OnboardingStore): string {
  const { validatedFields, hiddenInferredFields } = onboardingStore;
  
  const awarenessLevel = hiddenInferredFields.awarenessLevel || 'Not specified';
  const copyIntent = hiddenInferredFields.copyIntent || 'Not specified';
  const toneProfile = hiddenInferredFields.toneProfile || 'Not specified'; // ✅ FIXED: Use toneProfile
  const marketSophistication = hiddenInferredFields.marketSophisticationLevel || 'Not specified';
  const problemType = hiddenInferredFields.problemType || 'Not specified';
  
  return `BRAND & MESSAGING STRATEGY:
Audience Awareness Level: ${awarenessLevel}
Copy Intent: ${copyIntent}
Tone Profile: ${toneProfile}
Market Sophistication: ${marketSophistication}
Problem Type: ${problemType}
Pricing Model: ${validatedFields.pricingModel || 'Not specified'}`;
}

/**
 * Builds layout context for copy-layout harmony
 */
function buildLayoutContext(elementsMap: any): string {
  const layoutContexts: string[] = [];
  
  Object.values(elementsMap).forEach((section: any) => {
    const { sectionId, sectionType, layout } = section;
    layoutContexts.push(`${sectionType} (${layout}): ${getSectionLayoutGuidance(sectionType, layout)}`);
  });

  return `LAYOUT CONTEXT FOR COPY OPTIMIZATION:
${layoutContexts.join('\n')}`;
}

/**
 * Provides layout-specific copy guidance for conversion optimization
 */
/**
 * Complete layout guidance for copy-layout harmony
 */
function getSectionLayoutGuidance(sectionType: string, layout: string): string {
  const guidance: Record<string, Record<string, string>> = {
    BeforeAfter: {
      SideBySideBlocks: "Side-by-side comparison layout. Use parallel structure in before/after descriptions. Keep labels concise and contrasting.",
      StackedTextVisual: "Vertical flow design. Build narrative momentum from before to after. Use transition language to connect states.",
      BeforeAfterSlider: "Interactive slider comparison. Before/after labels should be clear and immediate. Focus on visual contrast in copy.",
      SplitCard: "Card-based comparison. Titles should create stark contrast. Descriptions should highlight the transformation clearly.",
      TextListTransformation: "List-based transformation view. Use parallel list structure. Make transformation obvious through language patterns.",
      VisualStoryline: "Story-driven narrative layout. Copy should flow like a story with clear progression. Use connecting phrases between steps.",
      StatComparison: "Data-driven comparison. Focus on specific, measurable differences. Use numbers and percentages prominently.",
      PersonaJourney: "User-centered transformation story. Write from user perspective. Show emotional and practical journey."
    },
    
    Close: {
      MockupWithCTA: "Visual product focus with action. Let mockup showcase value, copy should create urgency and remove friction.",
      BonusStackCTA: "Value-stacking offer presentation. Build perceived value progressively. Use cumulative language and urgency.",
      LeadMagnetCard: "Lead capture focused design. Emphasize immediate value and low commitment. Address privacy concerns naturally.",
      EnterpriseContactBox: "B2B sales-focused layout. Professional tone, feature comprehensive benefits. Include multiple contact options naturally.",
      ValueReinforcementBlock: "Value summary and action. Reinforce key benefits delivered earlier. Create final compelling reason to act.",
      LivePreviewEmbed: "Interactive product demonstration. Let preview speak for itself. Copy should guide interaction and next steps.",
      SideBySideOfferCards: "Multiple offer comparison. Differentiate offers clearly. Help users choose the right option confidently.",
      MultistepCTAStack: "Process-oriented conversion. Break down commitment into manageable steps. Reduce perceived complexity."
    },

    Comparison: {
      BasicFeatureGrid: "Simple feature comparison table. Use clear, scannable feature names. Focus on differentiation, not explanation.",
      CheckmarkComparison: "Visual feature availability comparison. Feature names should be benefit-focused. Keep descriptions concise.",
      YouVsThemHighlight: "Direct competitive positioning. Use confident, factual tone. Focus on unique advantages clearly.",
      ToggleableComparison: "Interactive comparison tool. Labels should be immediately understandable. Categories should group logically.",
      CompetitorCallouts: "Competitive advantage showcase. Use specific, verifiable claims. Maintain professional, not attacking tone.",
      AnimatedUpgradePath: "Progressive improvement narrative. Show clear progression path. Use upgrade-focused language throughout.",
      PersonaUseCaseCompare: "User-centered comparison approach. Write from user perspective. Focus on outcomes, not features.",
      LiteVsProVsEnterprise: "Tiered offering comparison. Clear tier differentiation. Help users self-select appropriate level."
    },

    FAQ: {
      AccordionFAQ: "Expandable question format. Questions should address real concerns. Keep answers comprehensive but scannable.",
      TwoColumnFAQ: "Side-by-side Q&A layout. Questions should be clear and direct. Answers should be complete but concise.",
      InlineQnAList: "Simple list-based Q&A. Questions should flow logically. Answers should be immediately helpful.",
      SegmentedFAQTabs: "Categorized question organization. Tab labels should be clear categories. Questions should be segment-specific.",
      QuoteStyleAnswers: "Testimonial-based answers. Use authentic voice in responses. Include credible attribution details.",
      IconWithAnswers: "Visual-enhanced Q&A format. Icons should support question themes. Keep visual-text balance appropriate.",
      TestimonialFAQs: "Customer-answered questions. Use real customer language. Include relevant customer context and credibility.",
      ChatBubbleFAQ: "Conversational Q&A interface. Use natural, conversational tone. Make interaction feel personal and helpful."
    },

    Features: {
      IconGrid: "Icon-driven feature showcase. IMPORTANT: Use ALL features from KEY FEATURES & BENEFITS section. Generate pipe-separated values (e.g., 'Title1|Title2|Title3|Title4' and 'Desc1|Desc2|Desc3|Desc4'). Feature titles should be 2-4 words max. Descriptions should be benefit-focused, not feature-focused.",
      SplitAlternating: "Alternating image-text feature layout. Use ALL features from KEY FEATURES & BENEFITS. Generate pipe-separated values. Vary headline lengths for visual rhythm. Use action-oriented language throughout.",
      Tabbed: "Tab-based feature navigation. Use ALL features from KEY FEATURES & BENEFITS. Generate pipe-separated values. Headlines should clearly differentiate between tabs. Keep descriptions concise and focused.",
      Timeline: "Chronological feature presentation. Use ALL features from KEY FEATURES & BENEFITS. Generate pipe-separated values. Use progressive language that builds momentum. Each step should connect to the next.",
      FeatureTestimonial: "Social proof enhanced features. Use ALL features from KEY FEATURES & BENEFITS. Generate pipe-separated values. Blend feature benefits with customer validation. Use authentic testimonial language.",
      MetricTiles: "Data-driven feature presentation. Use ALL features from KEY FEATURES & BENEFITS. Generate pipe-separated values. Lead with compelling numbers. Support metrics with clear explanations.",
      MiniCards: "Compact feature card layout. Use ALL features from KEY FEATURES & BENEFITS. Generate pipe-separated values. Keep titles punchy and clear. Descriptions should be scannable and benefit-focused.",
      Carousel: "Sliding feature presentation. Use ALL features from KEY FEATURES & BENEFITS. Generate pipe-separated values. Each slide should be self-contained. Use navigation-friendly language and structure."
    },

    FounderNote: {
      FounderCardWithQuote: "Personal founder introduction. Use authentic, personal voice. Balance credibility with relatability.",
      LetterStyleBlock: "Formal letter format presentation. Use personal, direct address. Maintain professional yet warm tone.",
      VideoNoteWithTranscript: "Video-first personal message. Transcript should capture spoken authenticity. Include human elements.",
      MissionQuoteOverlay: "Mission-focused founder statement. Use inspirational, purpose-driven language. Keep message clear and compelling.",
      TimelineToToday: "Founder journey narrative. Show progression and growth. Connect past experience to current solution.",
      SideBySidePhotoStory: "Visual storytelling format. Let image support story. Use personal, relatable language throughout.",
      StoryBlockWithPullquote: "Narrative with highlighted quote. Pullquote should capture key insight. Story should build to that moment.",
      FoundersBeliefStack: "Value-driven founder presentation. Use conviction-based language. Connect beliefs to product benefits."
    },

    Header: {
      MinimalNavHeader: "Simple navigation header. Keep nav items short (1-2 words). Use clear, action-oriented labels. Nav items should match main sections.",
      NavWithCTAHeader: "Navigation with primary CTA. Nav items should be intuitive. CTA should match main conversion goal. Keep CTA text urgent but not pushy.",
      CenteredLogoHeader: "Balanced centered logo design. Distribute nav items evenly. Use consistent labeling style. Create visual hierarchy through spacing.",
      FullNavHeader: "Complete navigation with dual CTAs. Primary CTA should be stronger action. Secondary CTA for existing users. Maintain clear visual hierarchy."
    },

    Hero: {
      leftCopyRightImage: "Left-side copy with right-side visual. Keep headlines punchy and scannable. Prioritize clarity over cleverness.",
      centerStacked: "Centered layout for maximum impact. Headlines can be longer and more descriptive. Focus on emotional connection.",
      splitScreen: "Equal visual weight design. Headlines should be bold and confident. Support with strong value proposition.",
      imageFirst: "Visual leads, copy supports. Keep headlines short and benefit-focused. Let the image tell the primary story."
    },

    HowItWorks: {
      ThreeStepHorizontal: "Three-step process overview. Use parallel structure across steps. Keep steps simple and actionable.",
      VerticalTimeline: "Sequential step presentation. Use connecting language between steps. Show clear progression and momentum.",
      IconCircleSteps: "Icon-enhanced step guide. Step titles should be clear actions. Icons should support comprehension.",
      AccordionSteps: "Expandable step details. Step titles should be compelling. Details should provide necessary depth.",
      CardFlipSteps: "Interactive step exploration. Front should intrigue, back should satisfy. Use curiosity-driven language.",
      VideoWalkthrough: "Video-guided process explanation. Complement video with clear structure. Include key timestamps and chapters.",
      ZigzagImageSteps: "Visual-heavy step presentation. Let images carry weight. Copy should support and clarify visuals.",
      AnimatedProcessLine: "Animated step progression. Use momentum-building language. Connect steps with transitional phrases."
    },

    Integration: {
      LogoGrid: "Simple logo showcase layout. Let logos speak for credibility. Use minimal, supportive copy that doesn't compete.",
      CategoryAccordion: "Organized integration categories. Category titles should be clear groupings. Descriptions should explain category value.",
      InteractiveStackDiagram: "Technical integration visualization. Use technical but accessible language. Explain connections clearly.",
      UseCaseTiles: "Use case focused integration display. Connect integrations to specific user needs. Show practical application value.",
      BadgeCarousel: "Sliding integration showcase. Each badge should be self-explanatory. Use consistent formatting across items.",
      TabbyIntegrationCards: "Tabbed integration organization. Tab labels should be intuitive categories. Cards should show integration value.",
      ZapierLikeBuilderPreview: "Workflow builder demonstration. Use action-oriented integration language. Show cause-and-effect relationships.",
      LogoWithQuoteUse: "Social proof enhanced integrations. Combine logos with usage validation. Use specific, credible testimonials."
    },

    Objection: {
      ObjectionAccordion: "EXPANDABLE OBJECTION HANDLING: Address real concerns with individual fields (objection_1, response_1, etc.). OBJECTION STRATEGY: Use market sophistication-aware concerns - Level 1-2 markets focus on basic functionality/cost, Level 3-4 markets address implementation/integration, Level 5 markets tackle differentiation/ROI. RESPONSE APPROACH: Start with acknowledgment, provide evidence-backed answers, end with confidence-building statements. TONE: Never defensive - use consultative, understanding language that builds trust.",

      MythVsRealityGrid: "MYTH VS REALITY COMPARISON: Use individual myth_1/reality_1 field pairs for better content control. MYTH SELECTION: Address actual market misconceptions from competitor messaging, outdated information, or industry assumptions. Focus on myths that create purchase hesitation. REALITY STATEMENTS: Provide compelling counter-evidence with specifics, numbers, or proof points. Use confident, factual language that builds credibility. VISUAL STRATEGY: Create clear contrast between misconception (red/warning) and truth (green/positive).",

      QuoteBackedAnswers: "EXPERT AUTHORITY RESPONSES: Use individual objection/quote/attribution triplets for sophisticated markets (Level 4-5). OBJECTION FOCUS: Address high-level strategic concerns that experts would validate. QUOTE STRATEGY: Create realistic expert voices with specific credentials - CTOs for technical concerns, CEOs for ROI/strategy, consultants for implementation. ATTRIBUTION: Include company type, role, and context that matches target audience sophistication. CREDIBILITY: Use industry-specific language and concerns.",

      SkepticToBelieverSteps: "CONVERSION JOURNEY NARRATIVE: Use individual step fields (step_name_1, step_quote_1, step_result_1) to show progression. NARRATIVE ARC: Start with relatable skepticism, show gradual buy-in with evidence, demonstrate increasing enthusiasm and results. PERSONA STRATEGY: Use company names and scenarios that match target audience. QUOTE EVOLUTION: Progress from 'I was skeptical...' to 'This actually works...' to 'Best decision we made.' RESULTS: Make outcomes specific and measurable - time savings, revenue increases, efficiency gains.",

      VisualObjectionTiles: "VISUAL OBJECTION TILES: Use individual tile fields (tile_objection_1, tile_response_1) for scannable format. TILE STRATEGY: Keep objections concise for visual presentation, responses punchy but complete. OBJECTION SELECTION: Choose concerns that benefit from visual/icon treatment. RESPONSE TONE: Use confident, reassuring language that works in limited space. VISUAL HIERARCHY: Ensure responses feel more prominent than objections through design contrast.",

      ProblemToReframeBlocks: "PERSPECTIVE REFRAMING: Use individual problem/reframe pairs to shift customer mindset. PROBLEM IDENTIFICATION: Address limiting beliefs and old-paradigm thinking that prevents adoption. REFRAME STRATEGY: Show new perspective that makes your solution the obvious choice. LANGUAGE PATTERNS: Use 'Instead of thinking... consider...' or 'What if... actually meant...' reframing structures. TRANSITION: Include smooth transition text between problems and reframes.",

      BoldGuaranteePanel: "RISK REVERSAL FOCUS: Use detailed guarantee fields for maximum confidence-building. GUARANTEE STRUCTURE: Include specific guarantee statement, detailed terms, and clear risk reversal language. CONFIDENCE BUILDING: Address the #1 purchase anxiety with bold, unconditional language. LEGAL BALANCE: Create compelling copy while maintaining realistic business terms. TRUST ELEMENTS: Include security badges, company backing, and verification indicators.",

      ObjectionCarousel: "PROGRESSIVE OBJECTION FLOW: Use individual slide fields (slide_objection_1, slide_response_1) for 5-8 sequential concerns. FLOW STRATEGY: Order objections from surface-level to deep concerns, building complexity and addressing sophistication. CAROUSEL ADVANTAGE: Use multiple objections to demonstrate thoroughness and preparedness. RESPONSE CONSISTENCY: Maintain confident, helpful tone across all slides while varying evidence and approach."
    },

    Pricing: {
      TierCards: "Tiered pricing card layout. Tier names should be clear and aspirational. Feature lists should highlight value progression.",
      ToggleableMonthlyYearly: "Billing cycle comparison. Emphasize annual savings clearly. Use value-focused language for longer commitments.",
      FeatureMatrix: "Detailed feature comparison table. Features should be benefit-focused. Use clear checkmarks and value indicators.",
      SegmentBasedPricing: "Audience-specific pricing presentation. Connect pricing to specific user needs. Help users self-identify appropriate tier.",
      SliderPricing: "Usage-based pricing calculator. Use clear calculation language. Help users understand cost-value relationship.",
      CallToQuotePlan: "Custom pricing presentation. Emphasize personalization and value. Include clear next steps for contact.",
      CardWithTestimonial: "Social proof enhanced pricing. Combine pricing with customer validation. Use relevant, credible testimonials.",
      MiniStackedCards: "Compact pricing options. Keep information dense but scannable. Use clear hierarchy and call-to-action placement."
    },

    CTA: {
      CenteredHeadlineCTA: "Central focus call-to-action with maximum conversion impact. HEADLINE: Create irresistible urgency using power words like 'instant', 'exclusive', or 'guaranteed'. Address the primary benefit and time sensitivity. CTA TEXT: Use action verbs with immediate benefit promise (e.g., 'Start Saving Today', 'Get Instant Access'). URGENCY TEXT: Create legitimate time pressure with specific deadlines or limited availability. TRUST INDICATORS: Include security badges, customer counts, or satisfaction guarantees to reduce friction. SOCIAL PROOF: Display customer numbers or ratings if startup stage allows credible metrics.",

      CTAWithBadgeRow: "Trust-building CTA with credibility-first approach. HEADLINE: Balance urgency with trustworthiness - use authoritative language. TRUST BADGES: Select 3-5 relevant badges (security, compliance, awards, integrations) that match target audience concerns. For enterprise: SOC2, GDPR, SSL. For SMB: Customer reviews, uptime, support. CTA TEXT: Emphasize low-risk trial or guarantee. CUSTOMER AVATARS: Show diverse, professional customer base if metrics support it. RATING DISPLAY: Only show ratings above 4.5 stars with substantial review counts.",

      VisualCTAWithMockup: "Product-demonstration CTA focusing on ease-of-use. HEADLINE: Emphasize how simple the product is to start using. MOCKUP STRATEGY: Show the actual product interface or key workflow. SECONDARY CTA: Offer alternative engagement like 'Watch Demo' or 'See Examples'. CTA TEXT: Use getting-started language like 'Try It Now' or 'Start Building'. TRUST ITEMS: Focus on technical credibility (uptime, security, reliability) since users see product complexity.",

      SideBySideCTA: "Balanced value-action presentation for comprehensive conversion. VALUE PROPOSITION: Address the #1 customer objection or hesitation. HEADLINE: Create desire for the transformation, not just the product. BENEFIT LIST: Use 3-4 scannable benefits with outcome-focused language. SUPPORTING TEXT: Include social proof elements or risk-reduction messaging. CTA TEXT: Match the value proposition intensity. TRUST ITEMS: Select items that support the primary value claim.",

      CountdownLimitedCTA: "Urgency-driven conversion with scarcity psychology. HEADLINE: Combine time urgency with value urgency - what they'll miss. SCARCITY TEXT: Be specific about limitations (seats, spots, early-bird pricing). COUNTDOWN MECHANICS: Set realistic but urgent deadlines. URGENCY TEXT: Use loss-aversion language ('Don't miss out', 'Limited time only'). BONUS TEXT: Add value to justify immediate action. AVAILABILITY TEXT: Show decreasing availability if authentic. TRUST ITEMS: Counter urgency skepticism with credibility signals.",

      CTAWithFormField: "Lead capture optimization with friction reduction. HEADLINE: Focus on what they get, not what they give. FORM STRATEGY: Minimize fields to essential data only. FORM LABELS: Use benefit-focused labels ('Get My Custom Demo' vs 'Email'). PLACEHOLDER TEXT: Provide examples and reduce cognitive load. BENEFITS: List 3-4 specific, time-bound benefits of submitting form. PRIVACY TEXT: Address data security concerns explicitly for enterprise audiences. CTA TEXT: Promise immediate next step ('Get Instant Access', 'Start My Trial'). SUCCESS MESSAGE: Set clear expectations for follow-up timing.",

      ValueStackCTA: "Value amplification strategy for high-value conversions. VALUE PROPOSITIONS: List 4-6 core benefits with specific outcomes. VALUE DESCRIPTIONS: Include quantified benefits where possible. FINAL CTA HEADLINE: Summarize total transformation promise. FINAL CTA DESCRIPTION: Address why now vs. later. GUARANTEE TEXT: Offer specific, time-bound guarantee to reduce risk. VALUE ICONS: Use icons that clearly represent each value prop. STACKING STRATEGY: Build perceived value progressively toward irresistible total.",

      TestimonialCTACombo: "Social proof amplified conversion with trust transfer. HEADLINE: Leverage testimonial theme in CTA messaging. TESTIMONIAL CONTENT: Use specific, quantified results with metrics. CUSTOMER ATTRIBUTION: Include title, company, and credibility signals. COMPANY LOGO: Add visual trust transfer from recognizable brands. CASE STUDY TAG: Highlight specific success type. SOCIAL PROOF METRICS: Display customer count, ratings, or uptime that complement testimonial. TESTIMONIAL DATE: Include recent dates for relevance. CTA TEXT: Reference social proof in action language ('Join [X] Happy Customers')."
    },

    Problem: {
      StackedPainBullets: "Pain point enumeration layout. Use emotionally resonant language. Build urgency through accumulated pain points.",
      BeforeImageAfterText: "Visual pain demonstration. Let image show current struggle. Text should agitate and relate to user experience.",
      SideBySideSplit: "Problem-solution preview layout. Balance problem urgency with solution hope. Create natural bridge between states.",
      EmotionalQuotes: "User voice pain expression. Use authentic, emotional customer language. Include relatable context and attribution.",
      CollapsedCards: "Expandable problem exploration. Problem titles should be immediately recognizable. Details should build emotional connection.",
      PainMeterChart: "Data-driven pain visualization. Use clear metrics and categories. Show severity and impact quantitatively.",
      PersonaPanels: "User-specific problem presentation. Tailor problems to specific user types. Use language each persona would recognize.",
      ProblemChecklist: "Interactive problem assessment with scoring. Problem statements should be specific and relatable. Checklist items should be short, clear labels. Include scoring guidance (0-2 well managed, 3-5 improvement needed, 6-8 significant challenges, 9-10 critical). Provide actionable thresholds and encouragement for different score ranges."
    },

    Results: {
      StatBlocks: "Metric-focused results presentation. Lead with compelling numbers. Support statistics with clear context and explanations.",
      BeforeAfterStats: "Comparative results showcase. Use clear before-after language. Emphasize improvement and transformation metrics.",
      QuoteWithMetric: "Social proof enhanced results. Combine customer voice with quantifiable outcomes. Use specific, credible testimonials.",
      EmojiOutcomeGrid: "Visual results representation. Generate pipe-separated values for emojis, outcomes, and descriptions (e.g., '🚀|💰|⚡' and 'Faster Launch|Higher Revenue|Lightning Speed' and 'Get to market 3x faster|Increase revenue by 200%|Process in milliseconds'). Keep each outcome clear and immediately understandable. Use emojis that match the outcome theme.",
      TimelineResults: "Progressive results demonstration. Show improvement over time. Use time-based language and milestone markers.",
      OutcomeIcons: "Icon-enhanced results display. Icons should support outcome comprehension. Keep text concise and impact-focused.",
      StackedWinsList: "Achievement-focused results list. Use victory language and positive framing. Stack wins for cumulative impact.",
      PersonaResultPanels: "Role-specific results presentation. Each persona needs tailored metric (e.g., '3x Lead Generation'), role description (e.g., 'Growth Focused'), and comma-separated key benefits. Use role-appropriate language and metrics. Include persona icons and footer message about universal benefits."
    },

    Security: {
      AuditResultsPanel: "Third-party validation presentation. Use authoritative, credible language. Include relevant dates and certification details.",
      PenetrationTestResults: "Security testing results showcase. Present test categories and results clearly. Use technical yet accessible language.",
      PrivacyCommitmentBlock: "Detailed policy presentation. Policy titles should be clear categories. Details should be comprehensive but understandable.",
      SecurityChecklist: "Security feature enumeration. Use clear, non-technical security language. Focus on user protection and peace of mind.",
      SecurityGuaranteePanel: "Security metric presentation. Combine protection statistics with visual security symbols. Use confidence-building language.",
      TrustSealCollection: "Compliance credential showcase. Let badges establish credibility. Use minimal, supportive compliance language."
    },

    SocialProof: {
      LogoWall: "Simple logo credibility display. Let logos establish market presence. Use minimal text that doesn't compete with visual impact.",
      MediaMentions: "Press coverage showcase. Use credible media sources. Include specific quotes or coverage details for authenticity.",
      UserCountBar: "Usage statistic presentation. Use impressive but believable numbers. Include growth context and user categories.",
      IndustryBadgeLine: "Industry recognition display. Use award and recognition language. Include relevant context and achievement dates.",
      MapHeatSpots: "Geographic usage visualization. Show global or regional adoption. Use location-specific language and statistics.",
      StackedStats: "Multiple statistic presentation. Use clear, compelling metrics. Stack statistics for cumulative impressive impact.",
      StripWithReviews: "Review aggregation display. Use authentic review language. Include rating scores and review source credibility.",
      SocialProofStrip: "Multiple proof point showcase. Combine different types of social validation. Use consistent formatting across proof types."
    },

    Testimonial: {
      QuoteGrid: "Multiple testimonial showcase. Use authentic customer voice throughout. Include relevant customer context and credibility markers.",
      VideoTestimonials: "Video-based customer validation. Written descriptions should complement video content. Include customer background context.",
      AvatarCarousel: "Rotating testimonial presentation. Each testimonial should be complete and compelling. Use consistent formatting across testimonials.",
      BeforeAfterQuote: "Transformation-focused testimonials. Use before-after language structure. Emphasize change and improvement outcomes.",
      SegmentedTestimonials: "Category-organized testimonials. Group testimonials by relevant user segments. Use segment-appropriate language and concerns.",
      RatingCards: "Review-style testimonial presentation. Include rating context and review platform credibility. Use authentic review language.",
      PullQuoteStack: "Highlighted quote presentation. Pullquotes should capture key insights. Include sufficient context and attribution.",
      InteractiveTestimonialMap: "Geographic testimonial display. Connect testimonials to locations. Use location-relevant context and validation."
    },

    UniqueMechanism: {
      AlgorithmExplainer: "Algorithm explanation showcase. Use technical yet accessible language. Explain the unique algorithm and its benefits.",
      InnovationTimeline: "Innovation evolution presentation. Show progression and breakthroughs. Use milestone-based narrative.",
      MethodologyBreakdown: "Tagged explanation format. Use clear categorization language. Tags should enhance understanding and organization.",
      ProcessFlowDiagram: "Process visualization presentation. Use cyclical, momentum-building language. Show how components work together.",
      PropertyComparisonMatrix: "Approach comparison presentation. Use clear differentiation language. Show advantages of unique approach.",
      SecretSauceReveal: "Intellectual property showcase. Use innovation and proprietary language. Include relevant patent or IP context.",
      StackedHighlights: "Feature uniqueness showcase. Use differentiation-focused language. Emphasize unique approach and methodology.",
      SystemArchitecture: "Conceptual model presentation. Use clear, explanatory language that supports visual understanding.",
      TechnicalAdvantage: "Technical advantage cards layout. Use clear technical benefits language. Present multiple technical capabilities as structured advantage cards."
    },

    UseCase: {
      BeforeAfterWorkflow: "Workflow transformation showcase. Use clear before/after contrast. Show step-by-step improvement in processes.",
      CustomerJourneyFlow: "Customer journey visualization. Use journey-stage language. Show progression and touchpoints clearly.",
      IndustryUseCaseGrid: "Industry-specific application display. Use industry-appropriate language and terminology. Address industry-specific needs.",
      InteractiveUseCaseMap: "Interactive use case exploration. Use clear categorization. Enable easy navigation between different use cases.",
      PersonaGrid: "User type showcase layout. Use persona-specific language and concerns. Address different user needs and motivations.",
      RoleBasedScenarios: "Role-specific scenario presentation. Use role-appropriate language and concerns. Show practical application for each role.",
      UseCaseCarousel: "Rotating use case presentation. Each use case should be complete and relatable. Use consistent narrative structure.",
      WorkflowDiagrams: "Process visualization showcase. Use clear workflow language. Show logical progression and decision points."
    },

    Footer: {
      SimpleFooter: "Minimal footer design. Include essential legal links. Keep copyright current. Link text should be standard (Privacy, Terms, etc.).",
      LinksAndSocialFooter: "Footer with social presence. Include relevant social platforms only. Tagline should reinforce brand value. Organize links logically.",
      MultiColumnFooter: "Organized multi-column layout. Group links by category (Product, Company, Resources). Column titles should be clear. Maintain consistent link style.",
      ContactFooter: "Contact-focused footer with newsletter. Newsletter copy should offer value. Include multiple contact methods. Make contact info scannable."
    }
  };

  return guidance[sectionType]?.[layout] || "Standard copy guidelines apply.";
}

  
/**
 * Builds section flow context for cohesive messaging
 */
function buildSectionFlowContext(elementsMap: any, pageStore: PageStore): string {
  const sectionOrder = (pageStore as any).layout?.sections || [];
  const flowContext: string[] = [];
  
  sectionOrder.forEach((sectionId: string, index: number) => {
    const section = elementsMap[sectionId];
    if (!section) return;
    
    const position = index === 0 ? 'OPENING' : 
                    index === sectionOrder.length - 1 ? 'CLOSING' : 
                    'MIDDLE';
    
    const previousSection = index > 0 ? elementsMap[sectionOrder[index - 1]]?.sectionType : null;
    const nextSection = index < sectionOrder.length - 1 ? elementsMap[sectionOrder[index + 1]]?.sectionType : null;
    
    flowContext.push(`${section.sectionType} (${position}): ${getSectionFlowGuidance(section.sectionType, position, previousSection, nextSection)}`);
  });

  return `SECTION FLOW FOR COHESIVE MESSAGING:
Selected sections: [${sectionOrder.map((s: string) => `"${s}"`).join(', ')}]

${flowContext.join('\n')}`;
}

/**
 * Provides section-specific flow guidance
 */
/**
 * Complete section flow guidance for cohesive landing page messaging
 * Based on section order priority (1-24)
 */
function getSectionFlowGuidance(sectionType: string, position: string, previousSection: string | null, nextSection: string | null): string {
  const flowGuidance: Record<string, string> = {
    // Order 1 - Hero (required)
    Hero: "Hook attention and establish core value proposition. Set expectations for the journey ahead. Tease the transformation or benefits that following sections will elaborate on.",
    
    // Order 2 - Problem 
    Problem: "Agitate pain points and create urgency established in hero. Make the problem feel real and costly. Set up the need for a solution that features/benefits will address.",
    
    // Order 3 - BeforeAfter
    BeforeAfter: "Show the transformation from current pain state to desired outcome. Build on problems identified earlier. Create desire for the solution approach that follows.",
    
    // Order 4 - UseCases
    UseCases: "Demonstrate practical applications and relevance. Build on the transformation shown in before/after. Set up specific features that enable these use cases.",
    
    // Order 5 - Features
    Features: "Deliver on promises made in hero and address problems/use cases mentioned earlier. Show how features enable the transformation. Set up proof and validation.",
    
    // Order 6 - UniqueMechanism
    UniqueMechanism: "Explain the unique approach that makes features possible. Differentiate from alternatives mentioned or implied earlier. Set up why this works better.",
    
    // Order 7 - HowItWorks
    HowItWorks: "Show the process that makes the unique mechanism actionable. Build on features by showing implementation. Set up confidence for results/testimonials.",
    
    // Order 8 - Results
    Results: "Provide proof for claims made about features and process. Validate the transformation promised in before/after. Set up social proof and testimonials.",
    
    // Order 9 - Testimonials
    Testimonials: "Reinforce results with authentic customer voices. Echo language and benefits mentioned in previous sections. Humanize the transformation story.",
    
    // Order 10 - SocialProof
    SocialProof: "Build credibility and market validation. Support testimonials with broader market acceptance. Create confidence for next steps.",
    
    // Order 12 - ComparisonTable
    ComparisonTable: "Position against alternatives using advantages established in unique mechanism. Show superiority based on features and results demonstrated.",
    
    // Order 13 - ObjectionHandling
    ObjectionHandling: "Address doubts that may have emerged from comparison or throughout the journey. Reinforce confidence in solution and process.",
    
    // Order 14 - Integrations
    Integrations: "Show ecosystem compatibility and reduced friction. Support the 'how it works' process with practical implementation details.",
    
    // Order 15 - Security
    Security: "Address trust and safety concerns for enterprise/serious buyers. Support the professional credibility built through social proof.",
    
    // Order 16 - Pricing
    Pricing: "Present investment as logical next step based on value demonstrated. Reference benefits, results, and differentiators established earlier.",
    
    // Order 19 - FounderNote
    FounderNote: "Add human element and personal commitment to customer success. Reinforce trust and values behind the solution.",
    
    // Order 22 - FAQ
    FAQ: "Address final concerns and provide comprehensive answers. Reinforce key points made throughout the page while removing last objections.",
    
    // Order 23 - CTA (required)
    CTA: "Create final urgency based on complete value demonstrated. Reference transformation, benefits, and proof provided throughout the journey.",
    
    // Order 24 - CloseSection
    CloseSection: "Provide final value reinforcement and remove last barriers to action. Summarize the complete journey and transformation promise."
  };

  let guidance = flowGuidance[sectionType] || "Maintain consistent messaging with other sections while serving this section's specific purpose.";
  
  // Add contextual guidance based on section position and neighbors
  if (position === 'OPENING') {
    guidance += " As an opening section, focus on hooking attention and setting clear expectations.";
  } else if (position === 'CLOSING') {
    guidance += " As a closing section, reinforce the complete value story and drive final action.";
  } else if (position === 'MIDDLE') {
    guidance += " As a middle section, bridge previous content with what follows.";
  }
  
  // Add specific neighbor context
  if (previousSection) {
    const previousGuidance: Record<string, string> = {
      Hero: "Build on the hook and value proposition established in hero.",
      Problem: "Transition from problem agitation to solution/benefits.",
      BeforeAfter: "Build on the transformation story with specific details.",
      UseCases: "Expand on use cases with deeper functionality.",
      Features: "Provide proof/validation for features mentioned.",
      UniqueMechanism: "Show how the unique approach works in practice.",
      HowItWorks: "Validate the process with results and proof.",
      Results: "Humanize the data with customer stories.",
      Testimonials: "Reinforce social proof with broader market validation.",
      SocialProof: "Build on credibility with competitive positioning.",
      ComparisonTable: "Address doubts that comparison may have raised.",
      ObjectionHandling: "Support objection handling with practical details.",
      Integrations: "Address security concerns for the technical solution.",
      Security: "Transition from trust-building to investment discussion.",
      Pricing: "Add personal touch to the business relationship.",
      FounderNote: "Address practical questions about implementation.",
      FAQ: "Reinforce final confidence with clear action steps.",
      CTA: "Provide final value stack and urgency."
    };
    
    if (previousGuidance[previousSection]) {
      guidance += ` ${previousGuidance[previousSection]}`;
    }
  }
  
  if (nextSection) {
    const nextGuidance: Record<string, string> = {
      Problem: "Set up the pain points that will be agitated next.",
      BeforeAfter: "Hint at the transformation story that follows.",
      UseCases: "Tease practical applications and use cases.",
      Features: "Set up the feature discussion with clear needs.",
      UniqueMechanism: "Prepare for differentiation and unique approach.",
      HowItWorks: "Set expectations for the process explanation.",
      Results: "Build anticipation for proof and validation.",
      Testimonials: "Prepare for social proof and customer stories.",
      SocialProof: "Set up broader market validation.",
      ComparisonTable: "Hint at competitive advantages to be shown.",
      ObjectionHandling: "Acknowledge potential concerns to be addressed.",
      Integrations: "Prepare for technical implementation details.",
      Security: "Set up trust and security discussion.",
      Pricing: "Build value anticipation for investment discussion.",
      FounderNote: "Prepare for personal, human connection.",
      FAQ: "Set up comprehensive question addressing.",
      CTA: "Build momentum toward the call-to-action.",
      CloseSection: "Set up final value reinforcement and close."
    };
    
    if (nextGuidance[nextSection]) {
      guidance += ` ${nextGuidance[nextSection]}`;
    }
  }

  return guidance;
}

/**
 * Builds explicit feature mapping instructions for Features section
 */
function buildFeatureMappingInstructions(onboardingStore: OnboardingStore, elementsMap: any): string {
  const { featuresFromAI } = onboardingStore;
  const featureCount = featuresFromAI.length;

  // Check if there's a Features section in the elementsMap
  const hasFeatureSection = Object.values(elementsMap).some(
    (section: any) => section.sectionType === 'Features'
  );

  if (!hasFeatureSection || featureCount === 0) {
    return '';
  }

  const featureTitles = featuresFromAI.map(f => f.feature).join('|');
  const featureDescriptions = featuresFromAI.map(f => f.benefit).join('|');

  return `
CRITICAL FEATURE GENERATION INSTRUCTIONS:
You have ${featureCount} features provided in KEY FEATURES & BENEFITS.
When generating the Features section:
- feature_titles: MUST contain exactly ${featureCount} pipe-separated titles
- feature_descriptions: MUST contain exactly ${featureCount} pipe-separated descriptions
- Use ALL features provided, not just examples

Expected format:
- feature_titles: "${featureTitles}" (adapt titles to be 2-4 words each)
- feature_descriptions: "${featureDescriptions}" (expand benefits to be compelling)

IMPORTANT: If you generate fewer than ${featureCount} features, users will not see all their features displayed.`;
}

/**
 * Builds output format specification
 */
function buildOutputFormat(elementsMap: any): string {
  const formatExample: Record<string, any> = {};
  
  Object.entries(elementsMap).forEach(([sectionId, section]: [string, any]) => {
    const elementFormat: Record<string, string> = {};
    
    section.allElements.forEach((element: string) => {
      elementFormat[element] = getElementFormatGuidance(element);
    });
    
    formatExample[sectionId] = elementFormat;
  });

  return `OUTPUT FORMAT:
Return a valid JSON object with this exact structure where each key is a section ID and contains the required elements:

${JSON.stringify(formatExample, null, 2)}

IMPORTANT: The above is the structure. Replace the example values with actual generated content.`;
}

/**
 * Provides format guidance for specific elements
 */
function getElementFormatGuidance(element: string): string {
  // Core headline patterns
  if (element.includes('headline') || element === 'headline') {
    return "One powerful sentence, 5-12 words";
  }
  
  // CTA patterns
  if (element.includes('cta') || element.includes('_cta')) {
    return "Action phrase, 2-4 words (e.g., \"Get Started Now\", \"Try Free\")";
  }
  
  // Special handling for feature_titles and feature_descriptions
  if (element === 'feature_titles') {
    return "[\"Use ALL features from KEY FEATURES & BENEFITS - generate exactly as many titles as features provided\"]";
  }

  if (element === 'feature_descriptions') {
    return "[\"Use ALL features from KEY FEATURES & BENEFITS - generate exactly as many descriptions as features provided\"]";
  }

  // List patterns for titles
  if (element.includes('titles') || element.endsWith('_titles') ||
      element.includes('_title') || element === 'title') {
    return "[\"Title 1\", \"Title 2\", \"Title 3\"]";
  }

  // List patterns for descriptions
  if (element.includes('descriptions') || element.endsWith('_descriptions') ||
      element.includes('_description') || element === 'description') {
    return "[\"Brief description 1\", \"Brief description 2\"]";
  }
  
  // Question patterns
  if (element.includes('questions') || element.endsWith('_questions')) {
    return "[\"Question 1?\", \"Question 2?\", \"Question 3?\"]";
  }
  
  // Answer patterns
  if (element.includes('answers') || element.endsWith('_answers')) {
    return "[\"Answer 1\", \"Answer 2\", \"Answer 3\"]";
  }
  
  // Name patterns
  if (element.includes('names') || element.endsWith('_names') ||
      element.includes('_name') || element === 'name') {
    return "[\"Name 1\", \"Name 2\", \"Name 3\"]";
  }
  
  // Quote patterns
  if (element.includes('quote') || element.includes('quotes')) {
    return "[\"Quote text 1\", \"Quote text 2\"]";
  }
  
  // List/items patterns
  if (element.includes('list') || element.includes('items') || 
      element.endsWith('_list') || element.endsWith('_items')) {
    return "[\"Item 1\", \"Item 2\", \"Item 3\"]";
  }
  
  // Label patterns
  if (element.includes('label') || element.includes('labels')) {
    return "[\"Label 1\", \"Label 2\"]";
  }
  
  // Step patterns
  if (element.includes('step') || element.includes('steps')) {
    return "[\"Step 1\", \"Step 2\", \"Step 3\"]";
  }
  
  // Stat/metric patterns
  if (element.includes('stat') || element.includes('metric') || 
      element.includes('value') || element.includes('count')) {
    return "[\"50%\", \"2.5x\", \"10,000+\"]";
  }
  
  // Feature patterns
  if (element.includes('feature') || element.includes('features')) {
    return "[\"Feature 1\", \"Feature 2\", \"Feature 3\"]";
  }
  
  // Benefit patterns - Enhanced for complex benefit lists
  if (element.includes('benefit') || element.includes('benefits')) {
    if (element === 'key_benefits') {
      return "[\"Benefit 1,Sub-benefit A,Sub-benefit B\", \"Benefit 2,Sub-benefit C,Sub-benefit D\"]";
    }
    return "[\"Benefit 1\", \"Benefit 2\", \"Benefit 3\"]";
  }

  // Rating/Review patterns
  if (element.includes('rating') || element.includes('review')) {
    return "[\"5\", \"4\", \"5\", \"4\"]";
  }

  // Persona/Role patterns
  if (element.includes('persona') || element.includes('role')) {
    return "[\"User Type 1\", \"User Type 2\", \"User Type 3\"]";
  }

  // Scoring/Assessment patterns
  if (element.includes('scoring') || element.includes('threshold') || element.includes('assessment')) {
    return "[\"Score range 1\", \"Score range 2\", \"Score range 3\"]";
  }

  // Result statistics patterns
  if (element.includes('result_stat') || element.includes('encouragement')) {
    return "Performance metric or encouragement text";
  }
  
  // Price patterns
  if (element.includes('price') || element.includes('prices')) {
    return "[\"$9/mo\", \"$29/mo\", \"$99/mo\"]";
  }
  
  // Text content patterns
  if (element.includes('text') || element.includes('content')) {
    return "Single text content, 1-2 sentences";
  }
  
  // Single word patterns for subheadlines
  if (element.includes('subheadline') || element === 'subheadline') {
    return "Supporting text, 8-15 words";
  }
  
  // Specific element mappings for unique cases
  const specificMappings: Record<string, string> = {
    // Founder-specific
    'founder_name': "Full name (e.g., \"John Smith\")",
    'founder_title': "Title/Role (e.g., \"CEO & Founder\")",
    'founder_quote': "Personal quote, 15-30 words",
    'founder_bio': "Brief bio, 2-3 sentences",
    
    // Time-specific
    'date': "Date format (e.g., \"January 2024\")",
    'timeline_dates': "[\"Q1 2023\", \"Q2 2023\", \"Q3 2023\"]",
    'event_dates': "[\"Jan 2023\", \"Mar 2023\", \"Dec 2023\"]",
    
    // Media-specific
    'video_duration': "Duration (e.g., \"3:45\")",
    'video_title': "Video title, 5-10 words",
    'transcript_text': "Full transcript content",
    
    // Form-specific
    'form_labels': "[\"Email\", \"Company\", \"Phone\"]",
    'form_placeholders': "[\"Enter email\", \"Company name\", \"Phone number\"]",
    'privacy_text': "Privacy policy text, 1 sentence",
    
    // Navigation
    'carousel_navigation': "[\"Previous\", \"Next\"]",
    'navigation_labels': "[\"Back\", \"Continue\", \"Finish\"]",
    'progress_labels': "[\"Step 1 of 3\", \"Step 2 of 3\", \"Step 3 of 3\"]",
    
    // Ratings and Reviews - Updated for RatingCards UIBlock
    'ratings': "[\"5\", \"4\", \"5\", \"4\", \"5\"]",
    'review_platforms': "[\"G2\", \"Capterra\", \"Trustpilot\", \"Product Hunt\"]",
    'verified_badges': "[\"true\", \"true\", \"false\", \"true\"]",
    'customer_locations': "[\"New York, US\", \"London, UK\", \"Toronto, CA\"]",
    'testimonial_quotes': "[\"This product changed our workflow completely. Amazing results!\", \"Outstanding support and features. Highly recommended.\", \"Best tool we've used in years. Game changer.\"]",
    'rating_scores': "[\"4.8/5\", \"4.9/5\", \"5.0/5\"]",
    'rating_sources': "[\"G2\", \"Capterra\", \"TrustPilot\"]",
    
    // Comparison
    'your_product_name': "Your product name",
    'competitor_names': "[\"Competitor A\", \"Competitor B\"]",
    'tier_names': "[\"Basic\", \"Pro\", \"Enterprise\"]",
    
    // Compliance/Security
    'compliance_names': "[\"SOC 2\", \"GDPR\", \"HIPAA\"]",
    'audit_dates': "[\"Q4 2023\", \"Q1 2024\"]",
    'auditor_names': "[\"Ernst & Young\", \"Deloitte\"]",
    
    // Location
    'location_names': "[\"New York\", \"San Francisco\", \"London\"]",
    'location_markers': "[\"NYC\", \"SF\", \"LON\"]",
    
    // Instructions/Help
    'instruction_text': "Clear instruction, 1 sentence",
    'slider_instruction': "Instruction for slider use",
    'builder_instructions': "[\"Step 1 instruction\", \"Step 2 instruction\"]",
    
    // Specialized content
    'patent_numbers': "[\"US10,123,456\", \"US10,789,012\"]",
    'integration_names': "[\"Slack\", \"Google Drive\", \"Salesforce\"]",
    'category_labels': "[\"Communication\", \"Storage\", \"CRM\"]",
    
    // Timeline/Process
    'timeline_connector_text': "→",
    'transition_text': "Transition description",
    'connection_labels': "[\"leads to\", \"enables\", \"improves\"]",
    
    // Urgency/Scarcity
    'urgency_text': "Time-sensitive message",
    'scarcity_text': "Limited availability message",
    'countdown_label': "Countdown timer label",
    
    // Value/Money
    'total_value_text': "Total value: $XXX",
    'savings_labels': "[\"Save 20%\", \"Best Value\"]",
    'improvement_percentages': "[\"50% faster\", \"3x better\"]",
    
    // ProblemChecklist Interactive Fields
    'problem_statements': "[\"You spend hours on manual tasks that could be automated\", \"Important information gets lost in email chains\", \"Team members work in silos without visibility\"]",
    'checklist_items': "[\"Manual task overload\", \"Information silos\", \"Communication gaps\"]",
    'scoring_labels': "[\"0-2: Well managed\", \"3-5: Room for improvement\", \"6-8: Significant challenges\", \"9-10: Critical intervention needed\"]",
    'action_thresholds': "[\"Keep monitoring\", \"Consider optimization\", \"Prioritize improvements\", \"Urgent action required\"]",
    'result_stat_1': "87%",
    'result_stat_1_label': "see improvement within 30 days",
    'result_stat_2': "3.2x",
    'result_stat_2_label': "average productivity increase",
    'result_stat_3': "$47K",
    'result_stat_3_label': "average annual savings",
    'encouragement_tip_1': "Regular process reviews",
    'encouragement_tip_2': "Proactive improvements",
    'encouragement_tip_3': "Team feedback loops",

    // PersonaResultPanels Fields
    'personas': "[\"Marketing Teams\", \"Sales Leaders\", \"Operations Managers\", \"Engineering Teams\"]",
    'roles': "[\"Growth Focused\", \"Revenue Driven\", \"Efficiency Minded\", \"Innovation Focused\"]",
    'result_metrics': "[\"3x Lead Generation\", \"40% Sales Increase\", \"60% Cost Reduction\", \"50% Faster Delivery\"]",
    'key_benefits': "[\"Better targeting,Higher conversion,Real-time analytics\", \"Shorter cycles,Better forecasting,Automated follow-ups\", \"Process optimization,Resource savings,Team productivity\", \"Faster deployment,Better quality,Reduced errors\"]",
    'persona_icon_1': "📢",
    'persona_icon_2': "📈",
    'persona_icon_3': "⚙️",
    'persona_icon_4': "⚡",
    'persona_icon_5': "👥",
    'persona_icon_6': "👤",
    'footer_text': "Tailored results for every team in your organization",

    // ObjectionAccordion individual fields
    'objection_1': "Primary market objection - most common concern prospects have (e.g., 'Is this too expensive for a small business?')",
    'response_1': "Evidence-backed response with specific proof points - address concern while building confidence",
    'objection_2': "Secondary concern about implementation, complexity, or fit (e.g., 'Will this replace our current system?')",
    'response_2': "Reassuring response that reduces perceived risk and shows smooth transition",
    'objection_3': "Trust/proof related concern (e.g., 'How do we know it will actually work?')",
    'response_3': "Credibility-building response with social proof, guarantees, or trial offers",
    'objection_4': "Support or service concern (optional) - deeper implementation questions",
    'response_4': "Service-focused response highlighting support quality and availability",
    'objection_5': "Advanced/technical concern (optional) - sophisticated buyer questions",
    'response_5': "Technical validation response with specifics and expert backing",
    'objection_6': "Edge case or niche concern (optional) - addresses specific market segments",
    'response_6': "Comprehensive response that shows thoroughness and market understanding",

    // MythVsRealityGrid individual fields
    'myth_1': "Most damaging market misconception that prevents adoption",
    'reality_1': "Compelling truth with specific evidence that counters the myth",
    'myth_2': "Secondary myth about complexity, cost, or implementation",
    'reality_2': "Factual counter with proof points or customer examples",
    'myth_3': "Industry assumption or competitor-driven misconception",
    'reality_3': "Evidence-based reality that differentiates your solution",
    'myth_4': "Advanced myth for sophisticated markets (optional)",
    'reality_4': "Expert-level truth with industry-specific validation",
    'myth_5': "Niche myth for specific market segments (optional)",
    'reality_5': "Targeted truth that addresses specific audience concerns",
    'myth_6': "Emerging myth or new market misconception (optional)",
    'reality_6': "Forward-looking reality that positions market leadership",

    // QuoteBackedAnswers individual fields (using unique guidance for this context)
    'quote_response_1': "Expert quote addressing strategic concerns with authority and credibility",
    'quote_attribution_1': "Credible expert with relevant title and company (e.g., 'Dr. Sarah Chen, CTO at TechForward')",
    'quote_response_2': "Technical expert quote with specific industry knowledge and implementation insights",
    'quote_attribution_2': "Technical authority with relevant credentials and hands-on experience",
    'quote_response_3': "Industry expert quote with market insights and competitive validation",
    'quote_attribution_3': "Market authority or analyst with relevant industry expertise and research background",

    // SkepticToBelieverSteps individual fields
    'step_name_1': "First customer persona - initial skeptic (e.g., 'Sarah from TechCorp was skeptical')",
    'step_quote_1': "Skeptical quote expressing initial doubts and concerns",
    'step_result_1': "Context or background that explains their situation and skepticism",
    'step_name_2': "Second persona - testing/trying (e.g., 'Marcus from DataFlow decided to test it')",
    'step_quote_2': "Cautiously optimistic quote about initial trial or test",
    'step_result_2': "Early positive results that surprised them",
    'step_name_3': "Third persona - early believer (e.g., 'Jennifer from ScaleUp got instant access')",
    'step_quote_3': "Positive quote about immediate benefits or ease of use",
    'step_result_3': "Specific results or outcomes that convinced them",
    'step_name_4': "Fourth persona - full adopter (e.g., 'David from Enterprise Inc rolled it out')",
    'step_quote_4': "Enthusiastic quote about full implementation success",
    'step_result_4': "Company-wide results and transformation outcomes",
    'step_name_5': "Fifth persona - champion/advocate (e.g., 'Lisa from InnovateCo became the champion')",
    'step_quote_5': "Champion quote about being the internal hero who found the solution",
    'step_result_5': "Leadership recognition and expanded role/influence",

    // VisualObjectionTiles individual fields
    'tile_objection_1': "Concise objection perfect for visual tile format",
    'tile_response_1': "Punchy response that works in limited visual space",
    'tile_label_1': "Optional category label for the objection type",
    'tile_objection_2': "Second tile objection - different concern category",
    'tile_response_2': "Confident response with visual appeal",
    'tile_label_2': "Optional label for second objection category",

    // ProblemToReframeBlocks individual fields
    'problem_1': "Limiting belief or old-paradigm thinking that blocks adoption",
    'reframe_1': "New perspective that makes your solution the obvious choice",
    'problem_2': "Second limiting belief about implementation or change",
    'reframe_2': "Reframe that shows change as opportunity, not burden",
    'problem_3': "Mindset issue about cost, time, or resource investment",
    'reframe_3': "Investment reframe that focuses on returns and outcomes",

    // Legacy format fields for backward compatibility
    'myth_reality_pairs': "Myth: Statement 1|Reality: Truth 1|Myth: Statement 2|Reality: Truth 2",
    'myth_icon': "❌",
    'reality_icon': "✅",
    'conversion_steps': "Name from Company|Initial skeptical thought|Background context|Name from Company 2|Believer quote|Transformation result|Name from Company 3|Success quote|Specific outcome|Name from Company 4|Champion quote|Final transformation|Name from Company 5|Hero quote|Long-term impact",
    'objections_summary': "Summary text addressing how objections were overcome with real proof",

    // Miscellaneous
    'emoji_labels': "[\"🚀\", \"💡\", \"⭐\"]",
    'emojis': "Pipe-separated emojis (e.g., \"🚀|💰|⚡|🎯|📈|⭐\")",
    'outcomes': "Pipe-separated outcome titles (e.g., \"Faster Launch|Higher Revenue|Lightning Speed|Perfect Accuracy\")",
    'descriptions': "Pipe-separated outcome descriptions (e.g., \"Get to market 3x faster|Increase revenue by 200%|Process in milliseconds\")",
    'icon_labels': "[\"Speed\", \"Security\", \"Scale\"]",
    'badge_text': "Badge text (e.g., \"#1 Rated\")",
    'caption_text': "Image/video caption",
    'conclusion_text': "Concluding statement",
    'supporting_evidence': "Evidence or proof points"
  };
  
  // Check specific mappings first
  if (specificMappings[element]) {
    return specificMappings[element];
  }
  
  // Default fallback
  return "Appropriate content for element type";
}



/**
 * Builds field classification guidance for AI generation
 */
function buildFieldClassificationGuidance(elementsMap: any): string {
  const guidanceLines: string[] = [];

  Object.entries(elementsMap).forEach(([sectionId, section]: [string, any]) => {
    const { sectionType, allElements } = section;
    const classifications = classifyFieldsForSection(allElements, sectionType);
    const strategy = getGenerationStrategy(classifications);

    if (strategy.manualFieldsCount > 0) {
      const manualFields = strategy.manualPreferred.join(', ');
      guidanceLines.push(`${sectionType}: Manual fields [${manualFields}] - Use suggested defaults, require user review`);
    }
  });

  if (guidanceLines.length === 0) {
    return `FIELD CLASSIFICATION: All fields are AI-generatable. Focus on high-quality, conversion-optimized content.`;
  }

  return `FIELD CLASSIFICATION:
${guidanceLines.join('\n')}

GENERATION PRIORITY:
1. AI-generate all content fields (headlines, descriptions, quotes, etc.)
2. Use realistic defaults for manual-preferred fields (ratings, dates, locations)
3. Ensure manual fields use placeholder data that feels authentic
4. Flag complex interactive fields for post-generation review`;
}

/**
 * Main function: Builds complete prompt for full landing page generation
 */
export function buildFullPrompt(
  onboardingStore: OnboardingStore,
  pageStore: PageStore | any
): string {
  const elementsMap = getCompleteElementsMap(onboardingStore, pageStore);

  const businessContext = buildBusinessContext(onboardingStore, pageStore);
  const brandContext = buildBrandContext(onboardingStore);
  const layoutContext = buildLayoutContext(elementsMap);
  const sectionFlowContext = buildSectionFlowContext(elementsMap, pageStore);
  const fieldClassificationGuidance = buildFieldClassificationGuidance(elementsMap);
  const featureMappingInstructions = buildFeatureMappingInstructions(onboardingStore, elementsMap);
  const outputFormat = buildOutputFormat(elementsMap);

  return `You are an expert copywriter specializing in high-converting SaaS landing pages. Generate compelling, conversion-focused copy for a complete landing page.

${businessContext}

${brandContext}

${layoutContext}

${sectionFlowContext}

${fieldClassificationGuidance}
${featureMappingInstructions}

COPYWRITING REQUIREMENTS:
- Write copy that flows cohesively from section to section
- Each section should build on the previous and set up the next
- Maintain consistent tone and messaging throughout
- Focus on conversion and user value at every element
- Use layout context to optimize copy for visual presentation
- Address the specific awareness level and market sophistication
- Apply the copy intent (pain-led or desire-led) consistently
- For manual-preferred fields, use realistic placeholder data that users can easily replace

${outputFormat}

Generate complete, conversion-optimized copy for all sections now.`;
}

/**
 * Builds prompt for regenerating a single section with optional user guidance
 */
export function buildSectionPrompt(
  onboardingStore: OnboardingStore,
  pageStore: PageStore | any,
  sectionId: string,
  userPrompt?: string
): string {
  const variables = mapStoreToVariables(onboardingStore, pageStore);
  const layout = pageStore.layout?.sectionLayouts?.[sectionId];

  if (!layout) {
    throw new Error(`No layout found for section "${sectionId}"`);
  }

  const sectionRequirements = getSectionElementRequirements(sectionId, layout, variables);
  const businessContext = buildBusinessContext(onboardingStore, pageStore);
  const brandContext = buildBrandContext(onboardingStore);

  // Get existing content from other sections for context
  const otherSectionsContext = buildOtherSectionsContext(pageStore, sectionId);
  const layoutGuidance = getSectionLayoutGuidance(sectionRequirements.sectionType, layout);

  // Build section-specific output format
  const sectionOutputFormat = buildSectionOutputFormat(sectionId, sectionRequirements);

  // Add feature mapping if this is a Features section
  let featureInstructions = '';
  if (sectionRequirements.sectionType === 'Features') {
    const { featuresFromAI } = onboardingStore;
    const featureCount = featuresFromAI.length;
    if (featureCount > 0) {
      featureInstructions = `\n\nFEATURE GENERATION REQUIREMENTS:
- You have ${featureCount} features from KEY FEATURES & BENEFITS
- feature_titles: Generate exactly ${featureCount} pipe-separated titles
- feature_descriptions: Generate exactly ${featureCount} pipe-separated descriptions
- Use ALL features, not just examples`;
    }
  }

  const userGuidance = userPrompt ? `\nUSER GUIDANCE: ${userPrompt}` : '';

  return `You are an expert copywriter. Regenerate copy for the ${sectionRequirements.sectionType} section of a landing page.

${businessContext}

${brandContext}

SECTION CONTEXT:
Section: ${sectionRequirements.sectionType} (${layout})
Layout Guidance: ${layoutGuidance}${userGuidance}

${otherSectionsContext}${featureInstructions}

REQUIREMENTS:
- Generate copy that flows with existing sections
- Maintain consistent tone and brand voice
- Apply layout-specific optimizations
- Focus on conversion for this section type${userPrompt ? `\n- Incorporate user guidance: "${userPrompt}"` : ''}

${sectionOutputFormat}

Generate optimized copy for this section now.`;
}

/**
 * Builds context from other sections for cohesive regeneration
 */
function buildOtherSectionsContext(pageStore: PageStore | any, targetSectionId: string): string {
  const otherSections: string[] = [];
  
  ((pageStore as any).layout?.sections || []).forEach((sectionId: string) => {
    if (sectionId === targetSectionId) return;
    
    const sectionContent = pageStore.content[sectionId];
    if (!sectionContent) return;
    
    // Extract key headlines/messages from other sections
    const headline = sectionContent.elements?.headline;
    const cta_text = sectionContent.elements?.cta_text;
    
    if (headline || cta_text) {
      otherSections.push(`${sectionId}: ${headline || ''} ${cta_text ? `(CTA: ${cta_text})` : ''}`);
    }
  });

  return otherSections.length > 0 
    ? `EXISTING SECTIONS CONTEXT:\n${otherSections.join('\n')}`
    : 'EXISTING SECTIONS CONTEXT: None available';
}

/**
 * Builds output format for single section
 */
function buildSectionOutputFormat(sectionId: string, sectionRequirements: any): string {
  const elementFormat: Record<string, string> = {};
  
  sectionRequirements.allElements.forEach((element: string) => {
    elementFormat[element] = getElementFormatGuidance(element);
  });

  return `OUTPUT FORMAT:
Return a valid JSON object with this exact structure:

{
  "${sectionId}": ${JSON.stringify(elementFormat, null, 4)}
}`;
}

/**
 * Builds prompt for generating multiple variations of a single element
 */
export function buildElementPrompt(
  onboardingStore: OnboardingStore,
  pageStore: PageStore | any,
  sectionId: string,
  elementName: string,
  variationCount: number = 5
): string {
  const variables = mapStoreToVariables(onboardingStore, pageStore);
  const layout = pageStore.layout?.sectionLayouts?.[sectionId];
  
  if (!layout) {
    throw new Error(`No layout found for section "${sectionId}"`);
  }

  const sectionRequirements = getSectionElementRequirements(sectionId, layout, variables);
  
  // Check if element is required for this section
  if (!sectionRequirements.allElements.includes(elementName)) {
    throw new Error(`Element "${elementName}" not required for ${sectionRequirements.sectionType} with ${layout} layout`);
  }

  const businessContext = buildBusinessContext(onboardingStore, pageStore);
  const brandContext = buildBrandContext(onboardingStore);
  const existingContent = getExistingElementContext(pageStore, sectionId, elementName);
  const elementGuidance = getSpecificElementGuidance(elementName, sectionRequirements.sectionType);

  return `You are an expert copywriter. Generate ${variationCount} creative variations of a ${elementName} for a ${sectionRequirements.sectionType} section.

${businessContext}

${brandContext}

ELEMENT CONTEXT:
Section: ${sectionRequirements.sectionType} (${layout})
Element: ${elementName}
Current Version: ${existingContent}

ELEMENT GUIDELINES:
${elementGuidance}

VARIATION REQUIREMENTS:
- Generate ${variationCount} distinctly different approaches
- Maintain consistent brand tone and copy intent
- Vary the angle, emphasis, or phrasing while staying on-strategy
- Each variation should feel meaningfully different to the user
- Keep within layout constraints and element guidelines

OUTPUT FORMAT:
Return a valid JSON array:

[
  "Variation 1 text",
  "Variation 2 text", 
  "Variation 3 text",
  "Variation 4 text",
  "Variation 5 text"
]

Generate ${variationCount} compelling variations now.`;
}

/**
 * Gets existing content for element context
 */
function getExistingElementContext(pageStore: PageStore, sectionId: string, elementName: string): string {
  const sectionContent = pageStore.content[sectionId];
  if (!sectionContent?.elements?.[elementName]) {
    return 'No existing content';
  }
  
  const element = sectionContent.elements[elementName];
  if (typeof element === 'string') return element;
  if (typeof element.content === 'string') return element.content;
  if (Array.isArray(element.content)) return element.content.join('\n');
  return String(element.content || 'No content');
}

/**
 * Provides element-specific writing guidance
 */
function getSpecificElementGuidance(elementName: string, sectionType: string): string {
  const elementGuidance: Record<string, string> = {
    headline: "Lead with strongest benefit. Hook attention immediately. 5-12 words optimal.",
    subheadline: "Support and clarify the headline. Add context or urgency. 10-20 words.",
    supporting_text: "Reinforce main message. Add credibility, urgency or key metrics. 15-25 words.",
    cta_text: "Action-oriented, value-focused. Promise immediate benefit. 2-4 words.",
    secondary_cta_text: "Alternative action for different readiness levels. 2-4 words.",
    badge_text: "Social proof or credibility signal. Keep ultra-concise. 2-5 words.",
    value_proposition: "Clear differentiation. Why choose this over alternatives. 10-20 words.",
    trust_item_1: "Primary trust signal - most important guarantee or proof point.",
    trust_item_2: "Secondary trust signal - reduce friction or objection.",
    trust_item_3: "Tertiary trust signal - additional confidence builder.",
    trust_item_4: "Optional extra trust signal if highly relevant.",
    trust_item_5: "Optional extra trust signal if highly relevant.",
    feature_titles: "Benefit-focused, not feature-focused. What user gets, not what it does.",
    feature_descriptions: "Specific outcomes and value. Use 'you' language. Be concrete.",
    testimonial_quotes: "Authentic voice, specific results. Include emotion and outcome.",
    questions: "Address real user concerns. Match awareness level. End with question mark.",
    answers: "Direct, helpful responses. Build confidence and trust.",

    // UniqueMechanism field guidance
    algorithm_name: "Brand your algorithm/technology. Make it memorable and proprietary.",
    algorithm_step_1: "First step in your process. Clear action verb, specific outcome.",
    algorithm_step_2: "Second step in your process. Build on previous step logically.",
    algorithm_step_3: "Third step in your process. Show progression and value.",
    algorithm_step_4: "Fourth step (optional). Advanced functionality or refinement.",
    algorithm_step_5: "Fifth step (optional). Enhanced capabilities or optimization.",
    algorithm_step_6: "Sixth step (optional). Advanced features for complex workflows.",
    algorithm_step_7: "Seventh step (optional). Specialized functionality.",
    algorithm_step_8: "Eighth step (optional). Complete workflow coverage.",

    timeline_item_1: "First milestone. Include date and achievement. Format: 'Year: Achievement'",
    timeline_item_2: "Second milestone. Show progression from first milestone.",
    timeline_item_3: "Third milestone. Demonstrate growth and development.",
    timeline_item_4: "Fourth milestone (optional). Advanced achievements.",
    timeline_item_5: "Fifth milestone (optional). Market expansion or sophistication.",
    timeline_item_6: "Sixth milestone (optional). Latest developments or future plans.",

    methodology_name: "Brand your methodology/framework. Include trademark if applicable.",
    methodology_description: "High-level benefits of your methodology. Why it's superior.",
    principle_1: "First core principle. Fundamental concept driving your approach.",
    principle_2: "Second core principle. Complementary to first principle.",
    principle_3: "Third core principle. Complete the foundational trilogy.",
    principle_4: "Fourth principle (optional). Advanced methodology component.",
    principle_5: "Fifth principle (optional). Sophisticated approach element.",
    principle_6: "Sixth principle (optional). Complete methodology coverage.",
    detail_1: "Explanation of first principle. How it works in practice.",
    detail_2: "Explanation of second principle. Specific implementation.",
    detail_3: "Explanation of third principle. Real-world application.",
    detail_4: "Explanation of fourth principle (optional). Advanced detail.",
    detail_5: "Explanation of fifth principle (optional). Sophisticated explanation.",
    detail_6: "Explanation of sixth principle (optional). Complete detail set.",
    result_metric_1: "First key result. Quantifiable outcome (e.g., '300%').",
    result_metric_2: "Second key result. Different metric type.",
    result_metric_3: "Third key result. Additional proof point.",
    result_metric_4: "Fourth key result. Complete results picture.",
    result_label_1: "Description of first metric. What the number represents.",
    result_label_2: "Description of second metric. Clear label.",
    result_label_3: "Description of third metric. Specific outcome.",
    result_label_4: "Description of fourth metric. Complete label set.",
    results_title: "Section header for results. Emphasize proven outcomes.",

    process_steps: "Pipe-separated process steps. Clear sequence of actions.",
    step_descriptions: "Pipe-separated step explanations. Match step order exactly.",
    benefits_title: "Benefits section header. Why this process is superior.",
    benefit_titles: "Pipe-separated benefit names. Key advantages.",
    benefit_descriptions: "Pipe-separated benefit explanations. Specific value.",

    properties: "Pipe-separated comparison categories. Key differentiators.",
    us_values: "Pipe-separated your advantages. Strong, specific benefits.",
    competitors_values: "Pipe-separated competitor limitations. Factual, not disparaging.",
    feature_header: "Table column header for features/properties.",
    us_header: "Table column header for your solution.",
    competitors_header: "Table column header for alternatives.",

    secret_sauce: "Your unique differentiator. Proprietary technology or approach.",
    explanation: "Why your secret sauce matters. Competitive advantage explanation.",
    secret_icon: "Icon representing your secret sauce. Visual symbol.",

    highlight_titles: "Pipe-separated feature highlights. Unique capabilities.",
    highlight_descriptions: "Pipe-separated highlight explanations. Specific benefits.",
    mechanism_name: "Branded system name. Proprietary methodology identifier.",
    footer_text: "Supporting value proposition. Reinforce uniqueness.",

    component_1: "First system component. Core architectural element.",
    component_2: "Second system component. Build on first component.",
    component_3: "Third system component. Complete basic architecture.",
    component_4: "Fourth component (optional). Advanced system element.",
    component_5: "Fifth component (optional). Sophisticated architecture.",
    component_6: "Sixth component (optional). Complete system coverage.",

    advantages: "Pipe-separated technical advantages. Key competitive benefits.",
    advantage_descriptions: "Pipe-separated advantage explanations. Technical value."
  };

  const sectionSpecific: Record<string, Record<string, string>> = {
    Hero: {
      headline: "Hook attention with biggest benefit. First impression is critical.",
      subheadline: "Support main headline with compelling clarification or urgency.",
      supporting_text: "Add social proof, metrics, or trust signals below main copy.",
      cta_text: "Low-friction entry point. Match landing goal and offer.",
      secondary_cta_text: "Alternative action for users not ready for primary CTA.",
      badge_text: "Highlight awards, recognition, or credibility markers.",
      value_proposition: "Clearly articulate unique advantage over competitors.",
      trust_item_1: "Strongest guarantee or proof point (e.g., 'Free 14-day trial').",
      trust_item_2: "Remove friction or objection (e.g., 'No credit card required').",
      trust_item_3: "Additional confidence builder (e.g., 'Cancel anytime')."
    },
    Features: {
      feature_titles: "Lead with outcome, not process. What user achieves.",
      feature_descriptions: "Specific, measurable benefits. Address user jobs-to-be-done."
    },
    CTA: {
      headline: "Create urgency and desire. Overcome final hesitations.",
      cta_text: "Final push to action. Address any remaining objections."
    },
    AlgorithmExplainer: {
      headline: "Emphasize intelligence and sophistication of your process.",
      algorithm_name: "Position as proprietary IP. Use technical but accessible naming.",
      algorithm_step_1: "Start with data input or user action. Make it concrete.",
      algorithm_step_2: "Show intelligent processing. Highlight AI or automation.",
      algorithm_step_3: "Demonstrate output or result. Focus on user benefit."
    },
    InnovationTimeline: {
      headline: "Show evolution and continuous improvement over time.",
      timeline_item_1: "Early foundation or breakthrough. Establish credibility.",
      timeline_item_2: "Major milestone or validation. Show market traction.",
      timeline_item_3: "Recent innovation or expansion. Demonstrate momentum."
    },
    MethodologyBreakdown: {
      headline: "Position your approach as scientifically superior.",
      methodology_name: "Brand as proprietary framework. Include trademark.",
      principle_1: "Core differentiating principle. Foundation of your advantage.",
      detail_1: "Explain the science or logic. Make it credible and unique."
    },
    ProcessFlowDiagram: {
      headline: "Emphasize systematic approach and reliability.",
      process_steps: "Show clear workflow. Each step builds value.",
      benefits_title: "Highlight why this process is superior to alternatives."
    },
    PropertyComparisonMatrix: {
      headline: "Set up competitive comparison favorably.",
      properties: "Choose categories where you excel. Stack the deck.",
      us_values: "Strong, specific advantages. Quantify when possible.",
      competitors_values: "Factual limitations. Not disparaging but clear."
    },
    SecretSauceReveal: {
      headline: "Build anticipation and exclusivity around revelation.",
      secret_sauce: "Make it sound proprietary and valuable. Intellectual property.",
      explanation: "Justify why this gives unfair advantage. Competitive moat."
    },
    StackedHighlights: {
      headline: "Present your unique approach as comprehensive solution.",
      highlight_titles: "Focus on unique capabilities others can't match.",
      mechanism_name: "Brand the overall system. Proprietary methodology."
    },
    SystemArchitecture: {
      headline: "Communicate technical sophistication and reliability.",
      component_1: "Core system element. Foundation of your platform.",
      component_2: "Build complexity gradually. Show integration."
    },
    TechnicalAdvantage: {
      headline: "Highlight superior technical capabilities and innovation.",
      advantages: "Focus on technical differentiators that create business value.",
      advantage_descriptions: "Explain why each advantage matters to users."
    }
  };

  let guidance = elementGuidance[elementName] || "Follow standard copywriting best practices.";
  
  if (sectionSpecific[sectionType]?.[elementName]) {
    guidance += ` ${sectionSpecific[sectionType][elementName]}`;
  }

  return guidance;
}