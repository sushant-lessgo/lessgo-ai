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
      IconGrid: "Icon-driven feature showcase. Feature titles should be 2-4 words max. Descriptions should be benefit-focused, not feature-focused.",
      SplitAlternating: "Alternating image-text feature layout. Vary headline lengths for visual rhythm. Use action-oriented language throughout.",
      Tabbed: "Tab-based feature navigation. Headlines should clearly differentiate between tabs. Keep descriptions concise and focused.",
      Timeline: "Chronological feature presentation. Use progressive language that builds momentum. Each step should connect to the next.",
      FeatureTestimonial: "Social proof enhanced features. Blend feature benefits with customer validation. Use authentic testimonial language.",
      MetricTiles: "Data-driven feature presentation. Lead with compelling numbers. Support metrics with clear explanations.",
      MiniCards: "Compact feature card layout. Keep titles punchy and clear. Descriptions should be scannable and benefit-focused.",
      Carousel: "Sliding feature presentation. Each slide should be self-contained. Use navigation-friendly language and structure."
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
      ObjectionAccordion: "Expandable objection handling. Questions should address real concerns directly. Answers should be comprehensive but reassuring.",
      MythVsRealityGrid: "Myth-busting comparison format. Myths should be real market misconceptions. Reality should be factual and compelling.",
      QuoteBackedAnswers: "Authority-supported responses. Use credible sources and expert validation. Include proper attribution and context.",
      VisualObjectionTiles: "Visual objection addressing. Use clear, non-defensive language. Address concerns while building confidence.",
      ProblemToReframeBlocks: "Perspective-shifting presentation. Show new way of thinking about challenges. Use reframing language techniques.",
      SkepticToBelieverSteps: "Conversion journey mapping. Show logical progression from doubt to confidence. Use empathetic, understanding tone.",
      BoldGuaranteePanel: "Risk-reversal focused presentation. Use confident, guarantee-focused language. Address risk concerns directly.",
      ObjectionCarousel: "Multiple objection showcase. Each objection should be distinct. Responses should be complete and convincing."
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
      CenteredHeadlineCTA: "Central focus call-to-action. Headline should create urgency and desire. CTA text should be action-specific and valuable.",
      CTAWithBadgeRow: "Trust-building CTA layout. Use badges to reinforce credibility. CTA should feel like natural, logical next step.",
      VisualCTAWithMockup: "Product-focused action section. Let mockup showcase ease of use. Copy should focus on immediate getting started benefits.",
      SideBySideCTA: "Balanced value-action presentation. Value proposition should address final hesitations. Benefits should be scannable and compelling.",
      CountdownLimitedCTA: "Urgency-driven action section. Use time-sensitive language throughout. Create genuine scarcity and urgency.",
      CTAWithFormField: "Lead capture focused design. Form labels should be clear and minimal. Address privacy and value exchange explicitly.",
      ValueStackCTA: "Value reinforcement with action. Stack value propositions progressively. Build to natural action conclusion.",
      TestimonialCTACombo: "Social proof enhanced CTA. Use testimonial to overcome final objections. Combine validation with clear action."
    },

    Problem: {
      StackedPainBullets: "Pain point enumeration layout. Use emotionally resonant language. Build urgency through accumulated pain points.",
      BeforeImageAfterText: "Visual pain demonstration. Let image show current struggle. Text should agitate and relate to user experience.",
      SideBySideSplit: "Problem-solution preview layout. Balance problem urgency with solution hope. Create natural bridge between states.",
      EmotionalQuotes: "User voice pain expression. Use authentic, emotional customer language. Include relatable context and attribution.",
      CollapsedCards: "Expandable problem exploration. Problem titles should be immediately recognizable. Details should build emotional connection.",
      PainMeterChart: "Data-driven pain visualization. Use clear metrics and categories. Show severity and impact quantitatively.",
      PersonaPanels: "User-specific problem presentation. Tailor problems to specific user types. Use language each persona would recognize.",
      ProblemChecklist: "Systematic problem identification. Use checkbox-style recognition format. Build comprehensive understanding of user struggles."
    },

    Results: {
      StatBlocks: "Metric-focused results presentation. Lead with compelling numbers. Support statistics with clear context and explanations.",
      BeforeAfterStats: "Comparative results showcase. Use clear before-after language. Emphasize improvement and transformation metrics.",
      QuoteWithMetric: "Social proof enhanced results. Combine customer voice with quantifiable outcomes. Use specific, credible testimonials.",
      EmojiOutcomeGrid: "Visual results representation. Use emojis to enhance emotional impact. Keep outcomes clear and immediately understandable.",
      TimelineResults: "Progressive results demonstration. Show improvement over time. Use time-based language and milestone markers.",
      OutcomeIcons: "Icon-enhanced results display. Icons should support outcome comprehension. Keep text concise and impact-focused.",
      StackedWinsList: "Achievement-focused results list. Use victory language and positive framing. Stack wins for cumulative impact.",
      PersonaResultPanels: "User-specific outcome presentation. Tailor results to different user types. Use language each persona values most."
    },

    Security: {
      ComplianceBadgeRow: "Compliance credential showcase. Let badges establish credibility. Use minimal, supportive compliance language.",
      SecurityChecklist: "Security feature enumeration. Use clear, non-technical security language. Focus on user protection and peace of mind.",
      AuditTrustPanel: "Third-party validation presentation. Use authoritative, credible language. Include relevant dates and certification details.",
      FAQStyleSecurity: "Security concern addressing. Address real security questions directly. Use reassuring, technically accurate responses.",
      StatWithShieldIcons: "Security metric presentation. Combine protection statistics with visual security symbols. Use confidence-building language.",
      PartnerValidationRow: "Partnership credential display. Use partner credibility to build trust. Include relevant partnership context.",
      DiagramInfraSecurity: "Technical security visualization. Use accessible technical language. Explain security layers and protections clearly.",
      ExpandablePolicyCards: "Detailed policy presentation. Policy titles should be clear categories. Details should be comprehensive but understandable."
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
      StackedHighlights: "Feature uniqueness showcase. Use differentiation-focused language. Emphasize unique approach and methodology.",
      VisualFlywheel: "Process visualization presentation. Use cyclical, momentum-building language. Show how components work together.",
      PillarIcons: "Foundation principle display. Use foundational, pillar-based language. Show how principles support overall approach.",
      IllustratedModel: "Conceptual model presentation. Use clear, explanatory language that supports visual understanding.",
      ExplainerWithTags: "Tagged explanation format. Use clear categorization language. Tags should enhance understanding and organization.",
      ComparisonTable: "Approach comparison presentation. Use clear differentiation language. Show advantages of unique approach.",
      PatentStrip: "Intellectual property showcase. Use innovation and proprietary language. Include relevant patent or IP context.",
      TechnicalCards: "Technical advantage cards layout. Use clear technical benefits language. Present multiple technical capabilities as structured advantage cards."
    },

    UseCase: {
      PersonaGrid: "User type showcase layout. Use persona-specific language and concerns. Address different user needs and motivations.",
      TabbedUseCases: "Category-organized use case presentation. Tab labels should be clear use case categories. Content should be category-specific.",
      IndustryTiles: "Industry-specific application display. Use industry-appropriate language and terminology. Address industry-specific needs.",
      ScenarioCards: "Situation-based use case presentation. Use scenario-specific language. Show practical application in real situations.",
      SegmentSplitBlocks: "Market segment presentation. Use segment-appropriate language and positioning. Address different market needs.",
      CarouselAvatars: "Rotating user story presentation. Each story should be complete and relatable. Use consistent narrative structure.",
      RoleBenefitMatrix: "Role-based benefit mapping. Connect specific roles to relevant benefits. Use role-appropriate language and concerns."
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

    // Miscellaneous
    'emoji_labels': "[\"🚀\", \"💡\", \"⭐\"]",
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
  const outputFormat = buildOutputFormat(elementsMap);

  return `You are an expert copywriter specializing in high-converting SaaS landing pages. Generate compelling, conversion-focused copy for a complete landing page.

${businessContext}

${brandContext}

${layoutContext}

${sectionFlowContext}

${fieldClassificationGuidance}

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
  
  const userGuidance = userPrompt ? `\nUSER GUIDANCE: ${userPrompt}` : '';

  return `You are an expert copywriter. Regenerate copy for the ${sectionRequirements.sectionType} section of a landing page.

${businessContext}

${brandContext}

SECTION CONTEXT:
Section: ${sectionRequirements.sectionType} (${layout})
Layout Guidance: ${layoutGuidance}${userGuidance}

${otherSectionsContext}

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
    cta_text: "Action-oriented, value-focused. Promise immediate benefit. 2-4 words.",
    feature_titles: "Benefit-focused, not feature-focused. What user gets, not what it does.",
    feature_descriptions: "Specific outcomes and value. Use 'you' language. Be concrete.",
    testimonial_quotes: "Authentic voice, specific results. Include emotion and outcome.",
    questions: "Address real user concerns. Match awareness level. End with question mark.",
    answers: "Direct, helpful responses. Build confidence and trust.",
    value_proposition: "Clear differentiation. Why choose this over alternatives.",
    supporting_text: "Reinforce main message. Add credibility or urgency."
  };

  const sectionSpecific: Record<string, Record<string, string>> = {
    Hero: {
      headline: "Hook attention with biggest benefit. First impression is critical.",
      cta_text: "Low-friction entry point. Match landing goal and offer."
    },
    Features: {
      feature_titles: "Lead with outcome, not process. What user achieves.",
      feature_descriptions: "Specific, measurable benefits. Address user jobs-to-be-done."
    },
    CTA: {
      headline: "Create urgency and desire. Overcome final hesitations.",
      cta_text: "Final push to action. Address any remaining objections."
    }
  };

  let guidance = elementGuidance[elementName] || "Follow standard copywriting best practices.";
  
  if (sectionSpecific[sectionType]?.[elementName]) {
    guidance += ` ${sectionSpecific[sectionType][elementName]}`;
  }

  return guidance;
}