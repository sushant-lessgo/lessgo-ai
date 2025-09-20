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

Input: "AI-powered email writer for marketing teams"
Output: {"marketCategory": "AI", "marketSubcategory": "Content Generation", "keyProblem": "Marketing teams waste hours writing and personalizing email campaigns", "targetAudience": "Marketing Teams", "startupStage": "MVP", "pricingModel": "Tiered", "landingPageGoals": "Start Free Trial"}

Input: "Code review automation tool for engineering teams"
Output: {"marketCategory": "Engineering", "marketSubcategory": "DevOps", "keyProblem": "Manual code reviews slow down development cycles and miss critical issues", "targetAudience": "Engineering Teams", "startupStage": "Early Access", "pricingModel": "Usage-Based", "landingPageGoals": "Request Demo"}

Input: "Subscription management platform for SaaS founders"
Output: {"marketCategory": "Finance", "marketSubcategory": "Billing & Payments", "keyProblem": "SaaS founders struggle with complex subscription billing and revenue tracking", "targetAudience": "SaaS Founders", "startupStage": "Growth", "pricingModel": "Tiered", "landingPageGoals": "Start Free Trial"}

Input: "No-code website builder for small businesses"
Output: {"marketCategory": "No-Code", "marketSubcategory": "Website Builders", "keyProblem": "Small businesses need professional websites but can't afford developers", "targetAudience": "Small Businesses", "startupStage": "Scaling", "pricingModel": "Freemium", "landingPageGoals": "Start Building"}

## Instructions:
- Use the examples above as reference for output format and quality
- Be specific and accurate in your categorization
- Match the style and detail level shown in examples
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
