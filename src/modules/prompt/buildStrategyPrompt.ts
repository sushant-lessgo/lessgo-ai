// modules/prompt/buildStrategyPrompt.ts - Strategic analysis for conversion-driven copy generation
import type { EditStore } from '@/types/store';
import type { PageLayoutRequirements } from '@/types/layoutTypes';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { summarizeRequirementsForPrompt } from '@/modules/sections/getLayoutRequirements';
import { layoutElementSchema, isUnifiedSchema, getCardRequirements } from '@/modules/sections/layoutElementSchema';

// Extract actual store types from Zustand stores
type OnboardingStore = ReturnType<typeof useOnboardingStore.getState>;
type PageStore = ReturnType<typeof useEditStore.getState>;

/**
 * Extracts enhanced requirements from unified schema where available
 */
function getUnifiedSchemaRequirements(layoutRequirements: PageLayoutRequirements | undefined): string {
  if (!layoutRequirements) return '';

  const enhancedRequirements: string[] = [];

  for (const [sectionId, requirement] of Object.entries(layoutRequirements)) {
    const { layoutName } = requirement;
    const schema = layoutElementSchema[layoutName];

    if (isUnifiedSchema(schema)) {
      const { cardRequirements, cardStructure } = schema;
      const structureType = cardStructure.type;
      const optimalRange = `${cardRequirements.optimal[0]}-${cardRequirements.optimal[1]}`;
      const constraintRange = `(min: ${cardRequirements.min}, max: ${cardRequirements.max})`;

      enhancedRequirements.push(
        `${sectionId}: Generate ${optimalRange} ${structureType} ${constraintRange} - ${cardRequirements.description}`
      );
    } else {
      // Fallback to original requirements for non-unified schemas
      enhancedRequirements.push(`${sectionId}: ${requirement.layoutName} layout`);
    }
  }

  return enhancedRequirements.length > 0
    ? enhancedRequirements.join('\n')
    : '';
}

/**
 * Builds business context section for strategic analysis
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
 * Builds brand and positioning context for strategic analysis
 */
function buildBrandContext(onboardingStore: OnboardingStore): string {
  const { validatedFields, hiddenInferredFields } = onboardingStore;

  const awarenessLevel = hiddenInferredFields.awarenessLevel || 'Not specified';
  const copyIntent = hiddenInferredFields.copyIntent || 'Not specified';
  const toneProfile = hiddenInferredFields.toneProfile || 'Not specified';
  const marketSophistication = hiddenInferredFields.marketSophisticationLevel || 'Not specified';
  const problemType = hiddenInferredFields.problemType || 'Not specified';

  return `BRAND & MARKET POSITIONING:
Audience Awareness Level: ${awarenessLevel}
Copy Intent: ${copyIntent}
Tone Profile: ${toneProfile}
Market Sophistication: ${marketSophistication}
Problem Type: ${problemType}
Pricing Model: ${validatedFields.pricingModel || 'Not specified'}`;
}

/**
 * Builds competitive and market context for strategic analysis
 */
function buildMarketContext(onboardingStore: OnboardingStore): string {
  const { validatedFields, hiddenInferredFields } = onboardingStore;
  const category = validatedFields.marketCategory || 'Not specified';
  const audience = validatedFields.targetAudience || 'Not specified';
  const sophistication = hiddenInferredFields.marketSophisticationLevel || 'level-3';

  let marketInsights = '';

  // Market sophistication insights
  switch (sophistication) {
    case 'level-1':
      marketInsights = 'New category, little competition, basic claims work';
      break;
    case 'level-2':
      marketInsights = 'Few competitors, simple differentiation sufficient';
      break;
    case 'level-3':
      marketInsights = 'Growing competition, need clear differentiation';
      break;
    case 'level-4':
      marketInsights = 'Saturated market, need unique mechanisms and extensive proof';
      break;
    case 'level-5':
      marketInsights = 'Hyper-saturated, need contrarian positioning and breakthrough ideas';
      break;
    default:
      marketInsights = 'Moderate competition, standard differentiation approach';
  }

  return `MARKET COMPETITIVE CONTEXT:
Category: ${category}
Target Audience: ${audience}
Market Sophistication: ${sophistication}
Market Insights: ${marketInsights}

COMPETITIVE STRATEGY NEEDS:
- Level of proof required for this market
- Differentiation intensity needed
- Objection handling depth required
- Trust-building approach for this audience`;
}

/**
 * Extracts sections that require card count strategy from layout requirements
 */
function getStrategySections(layoutRequirements?: PageLayoutRequirements): string[] {
  if (!layoutRequirements) {
    // Fallback to default sections if no layout requirements
    return ['features', 'testimonials', 'faq', 'results', 'social_proof', 'pricing', 'problem', 'comparison'];
  }

  const strategySections: string[] = [];

  layoutRequirements.sections.forEach(req => {
    // Only include sections that have card requirements (need strategy)
    if (req.cardRequirements) {
      // Map section IDs to strategy keys
      const strategyKey = mapSectionToStrategyKey(req.sectionId);
      if (strategyKey && !strategySections.includes(strategyKey)) {
        strategySections.push(strategyKey);
      }
    }
  });

  return strategySections.length > 0 ? strategySections : ['features', 'testimonials', 'faq', 'results'];
}

/**
 * Maps section IDs to strategy keys used in AI prompts
 */
function mapSectionToStrategyKey(sectionId: string): string | null {
  const mapping: Record<string, string> = {
    'features': 'features',
    'testimonials': 'testimonials',
    'faq': 'faq',
    'results': 'results',
    'comparisonTable': 'comparison',
    'comparison': 'comparison',
    'socialProof': 'social_proof',
    'pricing': 'pricing',
    'problem': 'problem',
    'uniqueMechanism': 'uniqueMechanism',
    'objectionHandling': 'objection_handling',
    'beforeAfter': 'before_after',
    'howItWorks': 'how_it_works',
    'close': 'close',
    'security': 'security',
    'integration': 'integration',
    'useCase': 'use_case',
    'founderNote': 'founder_note'
  };

  return mapping[sectionId] || null;
}

/**
 * Provides section-specific strategic guidance based on section type
 */
function getSectionStrategicGuidance(sectionKey: string): string {
  const guidance: Record<string, string> = {
    'features': 'Focus on complete value demonstration - enough features to prove comprehensive solution without overwhelming. Consider feature hierarchy: core value props first, supporting capabilities second.',

    'testimonials': 'Optimize for credibility depth - stronger testimonials need fewer instances, weaker ones need accumulation. Consider customer profile diversity and specific outcome mentions.',

    'faq': 'Target objection elimination - cover all major barriers without creating new concerns. Prioritize highest-friction objections first.',

    'results': 'Balance proof strength with believability - impressive but credible metrics. Consider metric types: revenue, time savings, efficiency gains.',

    'social_proof': 'Build market credibility through volume and authority - logos, user counts, awards, media mentions. Match proof type to audience skepticism level.',

    'pricing': 'Optimize for conversion psychology - enough options to serve different segments without decision paralysis. Consider value anchoring and scarcity.',

    'problem': 'Establish urgency without overwhelming - enough pain points to motivate action. Focus on current state dissatisfaction.',

    'comparison': 'Demonstrate clear superiority - enough comparison points to show why this beats alternatives. Focus on unique advantages.',

    'uniqueMechanism': 'Explain the "secret sauce" - break down what makes this work when others fail. Focus on the unique process or technology.',

    'objection_handling': 'Address skepticism systematically - handle objections by priority and provide proof for each. Consider emotional and logical barriers.',

    'before_after': 'Show transformation clearly - contrast current struggle with future success. Make the improvement tangible and specific.',

    'how_it_works': 'Simplify complex processes - break down into digestible steps. Remove confusion and demonstrate ease of use.',

    'close': 'Create final conversion momentum - use scarcity, bonuses, guarantees. Match closing intensity to audience sophistication.',

    'security': 'Build technical trust - demonstrate safety through certifications, processes, and track record. Match depth to data sensitivity.',

    'integration': 'Show ecosystem fit - demonstrate how this works with existing tools and workflows. Address compatibility concerns.',

    'use_case': 'Provide relevant examples - show specific applications for this audience. Make benefits concrete and relatable.',

    'founder_note': 'Build personal connection - share authentic story that increases trust and relatability. Balance personal touch with credibility.'
  };

  return guidance[sectionKey] || 'Optimize card count based on evidence strength and audience proof requirements.';
}

/**
 * Gets market sophistication-aware recommendations for section strategy
 */
function getMarketSophisticationGuidance(sophisticationLevel: string): string {
  const guidance: Record<string, string> = {
    'level-1': 'Simple claims work - use fewer, stronger proof elements. Audience accepts basic demonstrations.',
    'level-2': 'Clear differentiation needed - moderate proof depth. Show why you\'re better than emerging alternatives.',
    'level-3': 'Strong proof required - balanced approach between comprehensive and focused. Address growing skepticism.',
    'level-4': 'Extensive proof essential - use more cards to overcome saturated market skepticism. Detailed unique mechanism needed.',
    'level-5': 'Overwhelming proof needed - maximum proof elements. Contrarian positioning and breakthrough concepts required.'
  };

  return guidance[sophisticationLevel] || guidance['level-3'];
}

/**
 * Builds dynamic card count request based on present sections and their constraints
 */
function buildDynamicCardCountsRequest(
  strategySections: string[],
  layoutRequirements?: PageLayoutRequirements,
  sophisticationLevel: string = 'level-3'
): string {
  const sophisticationGuidance = getMarketSophisticationGuidance(sophisticationLevel);

  let cardCountsSection = `2. **Card Count Strategy:**
   For each section, determine the optimal number of cards based on:
   - Market sophistication level and proof requirements
   - Audience awareness level and education needs
   - Available evidence strength and credibility
   - Objection intensity and coverage needed
   - Conversion psychology for this specific audience
   - UIBlock technical constraints (see LAYOUT CONSTRAINTS above)

   MARKET SOPHISTICATION GUIDANCE: ${sophisticationGuidance}

   DETERMINE CARD COUNTS FOR:`;

  // Add section-specific guidance for each present section
  strategySections.forEach(sectionKey => {
    const guidance = getSectionStrategicGuidance(sectionKey);
    const sectionName = formatSectionName(sectionKey);
    cardCountsSection += `\n   - ${sectionName}: ${guidance}`;
  });

  return cardCountsSection;
}

/**
 * Formats section keys into readable names
 */
function formatSectionName(sectionKey: string): string {
  const nameMap: Record<string, string> = {
    'features': 'Features',
    'testimonials': 'Testimonials',
    'faq': 'FAQ',
    'results': 'Results/Stats',
    'social_proof': 'Social Proof',
    'pricing': 'Pricing',
    'problem': 'Problem',
    'comparison': 'Comparison',
    'uniqueMechanism': 'Unique Mechanism',
    'objection_handling': 'Objection Handling',
    'before_after': 'Before/After',
    'how_it_works': 'How It Works',
    'close': 'Close/CTA',
    'security': 'Security',
    'integration': 'Integration',
    'use_case': 'Use Cases',
    'founder_note': 'Founder Note'
  };

  return nameMap[sectionKey] || sectionKey;
}

/**
 * Generates realistic JSON example with actual UIBlock constraints
 */
function createExampleWithConstraints(
  strategySections: string[],
  layoutRequirements?: PageLayoutRequirements
): string {
  const cardCountsExample: Record<string, number> = {};
  const reasoningExample: Record<string, string> = {};

  // Generate examples for each present section
  strategySections.forEach(sectionKey => {
    // Get constraint info if available
    const constraint = getConstraintForSection(sectionKey, layoutRequirements);

    // Use optimal range midpoint or realistic default
    const cardCount = constraint
      ? Math.round((constraint.optimal[0] + constraint.optimal[1]) / 2)
      : getRealisticDefault(sectionKey);

    cardCountsExample[sectionKey] = cardCount;
    reasoningExample[sectionKey] = `Explanation for ${formatSectionName(sectionKey)} card count`;
  });

  const exampleJson = {
    copyStrategy: {
      bigIdea: "The central compelling hook that drives everything",
      corePromise: "Specific transformation from current state to desired outcome",
      uniqueMechanism: "Why this works when alternatives fail",
      primaryEmotion: "Main emotional driver for this audience",
      objectionPriority: ["primary_objection", "secondary_objection", "tertiary_objection"]
    },
    cardCounts: cardCountsExample,
    reasoning: {
      ...reasoningExample,
      overall: "Overall strategic approach summary"
    }
  };

  return JSON.stringify(exampleJson, null, 2);
}

/**
 * Gets constraint information for a specific section from layout requirements
 */
function getConstraintForSection(sectionKey: string, layoutRequirements?: PageLayoutRequirements) {
  if (!layoutRequirements) return null;

  // Find section that matches this strategy key
  for (const req of layoutRequirements.sections) {
    const mappedKey = mapSectionToStrategyKey(req.sectionId);
    if (mappedKey === sectionKey && req.cardRequirements) {
      return req.cardRequirements;
    }
  }

  return null;
}

/**
 * Provides realistic defaults for sections when no constraints available
 */
function getRealisticDefault(sectionKey: string): number {
  const defaults: Record<string, number> = {
    'features': 4,
    'testimonials': 3,
    'faq': 5,
    'results': 3,
    'social_proof': 4,
    'pricing': 3,
    'problem': 2,
    'comparison': 3,
    'uniqueMechanism': 3,
    'objection_handling': 4,
    'before_after': 3,
    'how_it_works': 3,
    'close': 1,
    'security': 4,
    'integration': 6,
    'use_case': 4,
    'founder_note': 1
  };

  return defaults[sectionKey] || 3;
}

/**
 * Builds the main strategic analysis prompt
 */
export function buildStrategyPrompt(
  onboardingStore: OnboardingStore,
  pageStore: PageStore | any,
  layoutRequirements?: PageLayoutRequirements
): string {
  const businessContext = buildBusinessContext(onboardingStore, pageStore);
  const brandContext = buildBrandContext(onboardingStore);
  const marketContext = buildMarketContext(onboardingStore);

  // Get dynamic section list based on actual page layout
  const strategySections = getStrategySections(layoutRequirements);

  // Get market sophistication for dynamic guidance
  const sophisticationLevel = onboardingStore.hiddenInferredFields.marketSophisticationLevel || 'level-3';

  // Build dynamic card count strategy section
  const cardCountStrategy = buildDynamicCardCountsRequest(strategySections, layoutRequirements, sophisticationLevel);

  // Generate realistic example based on actual constraints
  const exampleOutput = createExampleWithConstraints(strategySections, layoutRequirements);

  // Build layout constraints section if requirements provided
  const layoutConstraints = layoutRequirements
    ? (() => {
        const unifiedRequirements = getUnifiedSchemaRequirements(layoutRequirements);
        const originalRequirements = summarizeRequirementsForPrompt(layoutRequirements);

        const constraintsText = unifiedRequirements || originalRequirements;

        return `\n\nLAYOUT CONSTRAINTS:\n${constraintsText}\n\nIMPORTANT: Your card count recommendations MUST respect these UIBlock constraints. Generate counts within the specified min-max ranges, preferring the optimal ranges when conversion strategy allows.`;
      })()
    : '';

  return `You are an expert copywriter and conversion strategist analyzing a business for high-converting landing page copy.

Your task: Perform strategic analysis to determine the optimal copy approach and exact card counts needed for maximum conversion.

${businessContext}

${brandContext}

${marketContext}${layoutConstraints}

STRATEGIC ANALYSIS REQUIRED:

1. **Copy Strategy Foundation:**
   - Big Idea/Hook: What's the one compelling concept that stops the scroll and drives everything?
   - Core Promise: What transformation are we selling? (from pain state to desired outcome)
   - Unique Mechanism: Why does this work when alternatives fail? What's the "secret sauce"?
   - Primary Emotional Trigger: What emotion drives this audience to action? (fear, desire, status, etc.)
   - Objection Priority: What are the top 3 barriers to conversion in order of importance?

${cardCountStrategy}

STRATEGIC REASONING REQUIRED:
- Explain WHY each card count is optimal for THIS specific business and audience
- Consider evidence strength: strong proof = fewer cards, weak proof = more accumulation
- Factor in market sophistication: sophisticated buyers need more comprehensive proof
- Address objection coverage: ensure all major barriers are addressed
- RESPECT layout constraints: work within UIBlock min/max limits while optimizing for conversion
- Prefer optimal ranges when conversion strategy allows it

OUTPUT FORMAT:
Return a JSON object with this exact structure:

${exampleOutput}

IMPORTANT GUIDELINES:
- Base card counts on PERSUASION NECESSITY within technical constraints
- MANDATORY: Respect UIBlock min/max limits specified in LAYOUT CONSTRAINTS
- Consider this specific audience's skepticism level and proof requirements
- Factor in the strength of available evidence (strong proof = fewer cards needed)
- Ensure sufficient objection coverage without overwhelming the prospect
- When layout constraints conflict with strategy, find the optimal balance within bounds
- Remember: the goal is conversion within technical feasibility
- ONLY provide card counts for sections that are present on this page: [${strategySections.join(', ')}]

Analyze this business and return the strategic foundation for high-converting copy generation.`;
}