import { z } from 'zod';
import { OpenAI } from 'openai';
import { openai, mistral } from '@/lib/openaiClient';
import { logger } from '@/lib/logger';

const model = process.env.USE_OPENAI === 'true' ? 'openai' : 'mistral';

const InferredFieldsSchema = z.object({
  marketCategory: z.string(),
  marketSubcategory: z.string(),
  keyProblem: z.string(),
  targetAudience: z.string(),
  startupStage: z.string(),
  pricingModel: z.string(),
  landingPageGoals: z.string(),
});

export type InferredFields = z.infer<typeof InferredFieldsSchema>;

function buildSystemPrompt(): string {
  return `
You are an expert startup analyst specializing in SaaS categorization.

Given a one-line startup idea, infer the following 7 structured fields based on common startup patterns and standard taxonomies used in the SaaS ecosystem.

## Fields to Infer:

1. marketCategory - top-level SaaS industry category
2. marketSubcategory - specific subcategory under the main category
3. keyProblem - core user problem being solved (one sentence)
4. targetAudience - primary user type
5. startupStage - current development stage
6. pricingModel - likely SaaS pricing model
7. landingPageGoals - primary conversion goal for landing page

## Examples:

Input: "AI-powered study planner that adapts to your learning style"
Output: {"marketCategory": "Education & Learning", "marketSubcategory": "Study Tools & Planners", "keyProblem": "Students struggle to create effective study plans that match their individual learning style", "targetAudience": "Students", "startupStage": "MVP", "pricingModel": "Freemium", "landingPageGoals": "Start Free Trial"}

Input: "Personal health tracker with mood pattern insights"
Output: {"marketCategory": "Health & Wellness", "marketSubcategory": "Health Tracking & Monitoring", "keyProblem": "People want to understand their health patterns but lack tools to connect symptoms with lifestyle factors", "targetAudience": "Health-Conscious Individuals", "startupStage": "Early Access", "pricingModel": "Freemium", "landingPageGoals": "Download App"}

Input: "Social media content scheduler with AI optimization"
Output: {"marketCategory": "Content & Creator Economy", "marketSubcategory": "Content Planning & Scheduling", "keyProblem": "Content creators waste hours manually posting and struggle to optimize posting times for engagement", "targetAudience": "Content Creators", "startupStage": "Growth", "pricingModel": "Tiered", "landingPageGoals": "Start Free Trial"}

Input: "Typing speed trainer for programmers with syntax practice"
Output: {"marketCategory": "Education & Learning", "marketSubcategory": "Skill Development Tools", "keyProblem": "Developers want to type faster and more accurately but regular typing tests don't include coding syntax", "targetAudience": "Developers", "startupStage": "MVP", "pricingModel": "Freemium", "landingPageGoals": "Start Training"}

Input: "Team collaboration tool for remote startups"
Output: {"marketCategory": "Business Productivity Tools", "marketSubcategory": "Team Collaboration & Communication", "keyProblem": "Remote teams struggle to maintain alignment and transparency without proper collaboration tools", "targetAudience": "Startup Teams", "startupStage": "Growth", "pricingModel": "Tiered", "landingPageGoals": "Start Free Trial"}

Input: "Party game platform for virtual events"
Output: {"marketCategory": "Entertainment & Gaming", "marketSubcategory": "Party & Social Games", "keyProblem": "People hosting virtual events lack engaging interactive games that work well online", "targetAudience": "Event Hosts", "startupStage": "MVP", "pricingModel": "Freemium", "landingPageGoals": "Try Free Games"}

Input: "Personal note-taking app with AI organization"
Output: {"marketCategory": "Personal Productivity Tools", "marketSubcategory": "Personal Note-Taking & Knowledge Management", "keyProblem": "Individuals accumulate notes across different tools but struggle to organize and find information when needed", "targetAudience": "Knowledge Workers", "startupStage": "Early Access", "pricingModel": "Freemium", "landingPageGoals": "Start Organizing"}

Input: "Code review automation for engineering teams"
Output: {"marketCategory": "Engineering & Development Tools", "marketSubcategory": "Testing & QA Software", "keyProblem": "Manual code reviews slow down development cycles and miss critical issues", "targetAudience": "Engineering Teams", "startupStage": "Growth", "pricingModel": "Usage-Based", "landingPageGoals": "Request Demo"}

Input: "Social media analytics platform with performance insights"
Output: {"marketCategory": "Marketing & Sales Tools", "marketSubcategory": "Social Media Management & Scheduling", "keyProblem": "Marketers struggle to understand which social content drives engagement and need actionable insights to improve performance", "targetAudience": "Digital Marketers", "startupStage": "Growth", "pricingModel": "Tiered", "landingPageGoals": "Request Demo"}

## CRITICAL CONSTRAINTS:

**VALID marketCategory OPTIONS (use EXACTLY these names):**
Business Productivity Tools, Marketing & Sales Tools, Engineering & Development Tools, AI Tools, Customer Support & Service Tools, Data & Analytics Tools, HR & People Operations Tools, Finance & Accounting Tools, Personal Productivity Tools, Education & Learning, Health & Wellness, Entertainment & Gaming, Content & Creator Economy, Design & Creative Tools, Healthcare Technology, Legal Technology, Real Estate Technology, No-Code & Development Platforms, Web3 & Crypto Tools, Product Add-ons & Integrations

**IMPORTANT**: You MUST use one of the exact category names listed above. DO NOT create new category names or variations.

## Instructions:
- Use the examples above as reference for output format and quality
- Be specific and accurate in your categorization
- Match the style and detail level shown in examples
- CRITICAL: Only use the exact marketCategory names listed in the constraints section
- Return ONLY valid JSON, no explanations
`.trim();
}

function buildMessages(input: string): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  return [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: `Startup idea: "${input}"` },
  ];
}

export async function inferFields(input: string): Promise<InferredFields> {
  const messages = buildMessages(input);

  try {
    const res =
      model === 'openai'
        ? await openai.chat.completions.create({ model: 'gpt-4o-mini', messages })
        : await mistral.chat.completions.create({ model: 'open-mistral-7b', messages });

    const raw = res.choices[0]?.message?.content?.trim() || '';
    const parsed = JSON.parse(raw);
    return InferredFieldsSchema.parse(parsed);
  } catch (error) {
    logger.warn(`[inferFields] ${model} failed, trying fallback`, error);

    try {
      const fallback = model === 'openai' ? mistral : openai;
      const fallbackModel = model === 'openai' ? 'open-mistral-7b' : 'gpt-4o-mini';

      const res = await fallback.chat.completions.create({ model: fallbackModel, messages });
      const raw = res.choices[0]?.message?.content?.trim() || '';
      const parsed = JSON.parse(raw);
      return InferredFieldsSchema.parse(parsed);
    } catch (fallbackError) {
      logger.error('[inferFields] Fallback failed:', fallbackError);
      throw new Error('Inference failed from both models');
    }
  }
}
