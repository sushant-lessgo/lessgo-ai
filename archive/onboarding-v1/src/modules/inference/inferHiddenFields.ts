// modules/inference/inferHiddenFields.ts - AI-powered hidden field inference for copywriting psychology
import { z } from 'zod';
import { OpenAI } from 'openai';
import { openai, mistral } from '@/lib/openaiClient';
import { logger } from '@/lib/logger';
import type { InputVariables, HiddenInferredFields } from '@/types/core/index';

const model = process.env.USE_OPENAI === 'true' ? 'openai' : 'mistral';

// Schema matching the exact types from taxonomy
const HiddenFieldsSchema = z.object({
  awarenessLevel: z.enum([
    'unaware',
    'problem-aware',
    'solution-aware',
    'product-aware',
    'most-aware'
  ]),
  copyIntent: z.enum(['pain-led', 'desire-led']),
  toneProfile: z.enum([
    'confident-playful',
    'minimal-technical',
    'bold-persuasive',
    'friendly-helpful',
    'luxury-expert'
  ]),
  marketSophisticationLevel: z.enum([
    'level-1',
    'level-2',
    'level-3',
    'level-4',
    'level-5'
  ]),
  problemType: z.enum([
    'manual-repetition',
    'burnout-or-overload',
    'compliance-or-risk',
    'lost-revenue-or-inefficiency',
    'creative-empowerment',
    'personal-growth-or-productivity',
    'professional-image-or-branding',
    'time-freedom-or-automation'
  ])
});

function buildSystemPrompt(): string {
  return `
You are an expert marketing psychologist and copywriting strategist specializing in SaaS landing page optimization.

Given validated business information, perform market research to infer 5 psychological copywriting parameters that will guide high-converting landing page copy.

## Your Task: Market Research & Psychological Analysis

Analyze the provided business context to determine:
1. **awarenessLevel** - Where the target audience sits in the awareness spectrum
2. **copyIntent** - Whether to lead with pain points or desires
3. **toneProfile** - The optimal brand voice for this audience/market
4. **marketSophisticationLevel** - How mature/saturated the market is
5. **problemType** - The core psychological problem category

## Awareness Levels (Eugene Schwartz Framework):
- **unaware**: Doesn't know they have a problem
- **problem-aware**: Knows the problem but not solutions
- **solution-aware**: Knows solutions exist but not specific products
- **product-aware**: Knows your product but needs conviction
- **most-aware**: Ready to buy, needs the right offer

## Copy Intent:
- **pain-led**: Focus on problem agitation, consequences, urgency
- **desire-led**: Focus on aspirations, transformation, possibilities

## Tone Profiles:
- **confident-playful**: For startups targeting solopreneurs/creators
- **minimal-technical**: For dev tools, APIs, engineering audiences
- **bold-persuasive**: For saturated markets or high-friction pricing
- **friendly-helpful**: For support tools, education platforms
- **luxury-expert**: For premium/enterprise positioning

## Market Sophistication Levels:
- **level-1**: New category, no competition
- **level-2**: Few competitors, basic claims work
- **level-3**: Growing competition, need differentiation
- **level-4**: Saturated market, need unique mechanisms
- **level-5**: Hyper-saturated, need contrarian positioning

## Problem Types:
- **manual-repetition**: Repetitive tasks wasting time
- **burnout-or-overload**: Overwhelm and stress
- **compliance-or-risk**: Legal/security/regulatory issues
- **lost-revenue-or-inefficiency**: Missing opportunities, waste
- **creative-empowerment**: Unlock creativity/potential
- **personal-growth-or-productivity**: Self-improvement focus
- **professional-image-or-branding**: Status and perception
- **time-freedom-or-automation**: Reclaim time for what matters

## Examples:

Input: {
  "marketCategory": "Personal Productivity Tools",
  "marketSubcategory": "Personal Note-Taking & Knowledge Management",
  "targetAudience": "Indie Hackers",
  "keyProblem": "Need lightweight way to organize notes across devices with AI",
  "startupStage": "Pre-MVP",
  "pricingModel": "Freemium"
}
Analysis: Indie hackers are tech-savvy and know many note apps exist (Notion, Obsidian). They're solution-aware or most-aware. The problem mentions efficiency and AI, suggesting automation desire. Personal productivity for indies needs confident-playful tone. Market is saturated (level-4). Core issue is manual organization.
Output: {"awarenessLevel": "solution-aware", "copyIntent": "desire-led", "toneProfile": "confident-playful", "marketSophisticationLevel": "level-4", "problemType": "time-freedom-or-automation"}

Input: {
  "marketCategory": "Marketing & Sales Tools",
  "marketSubcategory": "Social Media Management",
  "targetAudience": "Social Media Marketers",
  "keyProblem": "Struggle to grow audience on X/Twitter without insights",
  "startupStage": "MVP",
  "pricingModel": "Freemium"
}
Analysis: Marketers know many social tools exist (Buffer, Hootsuite). They're most-aware. Problem is about lost growth (revenue), needs pain-led approach. Marketers expect bold claims. Very saturated market (level-5). Core issue is lost opportunities.
Output: {"awarenessLevel": "most-aware", "copyIntent": "pain-led", "toneProfile": "bold-persuasive", "marketSophisticationLevel": "level-5", "problemType": "lost-revenue-or-inefficiency"}

Input: {
  "marketCategory": "Health & Wellness",
  "marketSubcategory": "Mental Health & Therapy",
  "targetAudience": "Young Professionals",
  "keyProblem": "Stressed professionals need accessible mental health support",
  "startupStage": "Growth",
  "pricingModel": "Tiered"
}
Analysis: Young professionals increasingly aware of mental health importance but may not know online therapy options. Problem-aware to solution-aware. Stress/burnout needs empathetic pain-led approach. Health requires friendly-helpful tone. Growing market (level-3). Core issue is burnout.
Output: {"awarenessLevel": "problem-aware", "copyIntent": "pain-led", "toneProfile": "friendly-helpful", "marketSophisticationLevel": "level-3", "problemType": "burnout-or-overload"}

Input: {
  "marketCategory": "AI Tools",
  "marketSubcategory": "AI Coding Assistants",
  "targetAudience": "Developers",
  "keyProblem": "Writing boilerplate code takes too much time",
  "startupStage": "Growth",
  "pricingModel": "Usage-Based"
}
Analysis: Developers know GitHub Copilot exists, they're product-aware or most-aware. Time-saving on repetitive tasks suggests pain-led approach. Dev audience needs minimal-technical tone. AI coding is competitive (level-4). Core issue is repetitive manual work.
Output: {"awarenessLevel": "product-aware", "copyIntent": "pain-led", "toneProfile": "minimal-technical", "marketSophisticationLevel": "level-4", "problemType": "manual-repetition"}

Input: {
  "marketCategory": "Design & Creative Tools",
  "marketSubcategory": "Graphic Design Software",
  "targetAudience": "Content Creators",
  "keyProblem": "Need professional designs without design skills",
  "startupStage": "Early Access",
  "pricingModel": "Freemium"
}
Analysis: Creators know Canva/Figma but seek easier options. Solution-aware. Empowerment angle suggests desire-led. Creators respond to confident-playful tone. Saturated market (level-4). Core issue is creative empowerment.
Output: {"awarenessLevel": "solution-aware", "copyIntent": "desire-led", "toneProfile": "confident-playful", "marketSophisticationLevel": "level-4", "problemType": "creative-empowerment"}

## Critical Instructions:
- Consider the target audience's sophistication and exposure to competitors
- Don't assume early stage = unaware audience (many early products target sophisticated users)
- Match tone to both audience expectations AND market category norms
- Assess market saturation based on category, not startup stage
- Choose problem type based on the core psychological driver, not surface symptoms
- Return ONLY valid JSON, no explanations
`.trim();
}

function buildMessages(inputData: InputVariables): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const context = {
    marketCategory: inputData.marketCategory,
    marketSubcategory: inputData.marketSubcategory,
    targetAudience: inputData.targetAudience,
    keyProblem: inputData.keyProblem,
    startupStage: inputData.startupStage,
    pricingModel: inputData.pricingModel,
    landingPageGoals: inputData.landingPageGoals
  };

  return [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: `Analyze this business and infer hidden copywriting fields:\n${JSON.stringify(context, null, 2)}` }
  ];
}

export async function inferHiddenFields(inputData: InputVariables): Promise<HiddenInferredFields> {
  const messages = buildMessages(inputData);

  logger.debug('🧠 Starting AI inference for hidden copywriting fields...');
  logger.debug('📊 Input context:', {
    category: inputData.marketCategory,
    audience: inputData.targetAudience,
    problem: inputData.keyProblem?.substring(0, 100) + '...'
  });

  try {
    const res =
      model === 'openai'
        ? await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.3 // Lower temperature for more consistent categorization
          })
        : await mistral.chat.completions.create({
            model: 'open-mistral-7b',
            messages,
            temperature: 0.3
          });

    const raw = res.choices[0]?.message?.content?.trim() || '';
    logger.debug('🤖 Raw AI response for hidden fields:', raw);

    const parsed = JSON.parse(raw);
    const validated = HiddenFieldsSchema.parse(parsed);

    logger.info('✅ Hidden fields inferred successfully:', validated);
    return validated;
  } catch (error) {
    logger.warn(`[inferHiddenFields] ${model} failed, trying fallback`, error);

    try {
      const fallback = model === 'openai' ? mistral : openai;
      const fallbackModel = model === 'openai' ? 'open-mistral-7b' : 'gpt-4o-mini';

      const res = await fallback.chat.completions.create({
        model: fallbackModel,
        messages,
        temperature: 0.3
      });

      const raw = res.choices[0]?.message?.content?.trim() || '';
      logger.debug('🤖 Fallback AI response for hidden fields:', raw);

      const parsed = JSON.parse(raw);
      const validated = HiddenFieldsSchema.parse(parsed);

      logger.info('✅ Hidden fields inferred successfully (fallback):', validated);
      return validated;
    } catch (fallbackError) {
      logger.error('[inferHiddenFields] Both AI providers failed:', fallbackError);

      // Return sensible defaults based on input
      const defaults: HiddenInferredFields = {
        awarenessLevel: 'solution-aware', // Safe middle ground
        copyIntent: 'pain-led', // Most B2B benefits from pain-led
        toneProfile: 'friendly-helpful', // Safe, universal tone
        marketSophisticationLevel: 'level-3', // Assume moderate competition
        problemType: 'manual-repetition' // Most common problem type
      };

      logger.warn('⚠️ Using default hidden fields due to AI failure:', defaults);
      return defaults;
    }
  }
}