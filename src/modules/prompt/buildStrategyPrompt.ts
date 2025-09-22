// modules/prompt/buildStrategyPrompt.ts - Strategic analysis for conversion-driven copy generation
import type { EditStore } from '@/types/store';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';

// Extract actual store types from Zustand stores
type OnboardingStore = ReturnType<typeof useOnboardingStore.getState>;
type PageStore = ReturnType<typeof useEditStore.getState>;

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
 * Builds the main strategic analysis prompt
 */
export function buildStrategyPrompt(
  onboardingStore: OnboardingStore,
  pageStore: PageStore | any
): string {
  const businessContext = buildBusinessContext(onboardingStore, pageStore);
  const brandContext = buildBrandContext(onboardingStore);
  const marketContext = buildMarketContext(onboardingStore);

  return `You are an expert copywriter and conversion strategist analyzing a business for high-converting landing page copy.

Your task: Perform strategic analysis to determine the optimal copy approach and exact card counts needed for maximum conversion.

${businessContext}

${brandContext}

${marketContext}

STRATEGIC ANALYSIS REQUIRED:

1. **Copy Strategy Foundation:**
   - Big Idea/Hook: What's the one compelling concept that stops the scroll and drives everything?
   - Core Promise: What transformation are we selling? (from pain state to desired outcome)
   - Unique Mechanism: Why does this work when alternatives fail? What's the "secret sauce"?
   - Primary Emotional Trigger: What emotion drives this audience to action? (fear, desire, status, etc.)
   - Objection Priority: What are the top 3 barriers to conversion in order of importance?

2. **Card Count Strategy:**
   For each section, determine the optimal number of cards based on:
   - Market sophistication level and proof requirements
   - Audience awareness level and education needs
   - Available evidence strength and credibility
   - Objection intensity and coverage needed
   - Conversion psychology for this specific audience

   DETERMINE CARD COUNTS FOR:
   - Features: How many feature cards needed to prove complete value proposition?
   - Testimonials: How many customer stories needed for sufficient credibility?
   - FAQ: How many questions to remove the major objections?
   - Results/Stats: How many metrics needed to build strong belief?
   - Social Proof: How many trust elements needed for market credibility?
   - Pricing (if applicable): How many pricing tiers or value points?
   - Problem: How many pain points to establish urgency?
   - Comparison: How many comparison points to show superiority?

STRATEGIC REASONING REQUIRED:
- Explain WHY each card count is optimal for THIS specific business and audience
- Consider evidence strength: strong proof = fewer cards, weak proof = more accumulation
- Factor in market sophistication: sophisticated buyers need more comprehensive proof
- Address objection coverage: ensure all major barriers are addressed

OUTPUT FORMAT:
Return a JSON object with this exact structure:

{
  "copyStrategy": {
    "bigIdea": "The central compelling hook that drives everything",
    "corePromise": "Specific transformation from current state to desired outcome",
    "uniqueMechanism": "Why this works when alternatives fail",
    "primaryEmotion": "Main emotional driver for this audience",
    "objectionPriority": ["primary_objection", "secondary_objection", "tertiary_objection"]
  },
  "cardCounts": {
    "features": 4,
    "testimonials": 3,
    "faq": 5,
    "results": 3,
    "social_proof": 4,
    "pricing": 3,
    "problem": 2,
    "comparison": 3
  },
  "reasoning": {
    "features": "Explanation for features card count",
    "testimonials": "Explanation for testimonials card count",
    "faq": "Explanation for FAQ card count",
    "results": "Explanation for results card count",
    "social_proof": "Explanation for social proof card count",
    "overall": "Overall strategic approach summary"
  }
}

IMPORTANT GUIDELINES:
- Base card counts on PERSUASION NECESSITY, not arbitrary limits
- Consider this specific audience's skepticism level and proof requirements
- Factor in the strength of available evidence (strong proof = fewer cards needed)
- Ensure sufficient objection coverage without overwhelming the prospect
- Remember: the goal is conversion, not content volume

Analyze this business and return the strategic foundation for high-converting copy generation.`;
}