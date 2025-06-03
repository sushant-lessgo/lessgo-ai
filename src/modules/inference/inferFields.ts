import { z } from 'zod';
import { OpenAI } from 'openai';
import { openai, mistral } from '@/lib/openaiClient';

const model = process.env.USE_OPENAI === 'true' ? 'openai' : 'mistral';

const InferredFieldsSchema = z.object({
  marketCategory: z.string(),
  marketSubcategory: z.string(),
  keyProblem: z.string(),
  targetAudience: z.string(),
  startupStage: z.string(),
  pricingModel: z.string(),
  landingGoal: z.string(),
});

export type InferredFields = z.infer<typeof InferredFieldsSchema>;

function buildSystemPrompt(): string {
  return `
You are a startup analyst.

Given a one-line startup idea, infer the following 7 structured fields based on common startup patterns and standard taxonomies used in the SaaS ecosystem:

1. marketCategory - choose the closest matching top-level SaaS industry category (e.g., productivity, marketing, AI, finance, etc.).

2. marketSubcategory - select a relevant subcategory typically found under the chosen category (e.g., CRM under marketing, DevOps under engineering).

3. keyProblem - summarize the core user problem the startup aims to solve in one sentence.

4. targetAudience - identify the most relevant user type (e.g., developers, SMBs, e-commerce sellers, indie hackers, enterprise teams).

5. startupStage - infer the likely stage of the startup (e.g., idea, MVP launched, 100 users, scaling, etc.) based on phrasing and maturity cues.

6. pricingModel - suggest the most likely SaaS pricing model (e.g., freemium, tiered, usage-based, one-time fee).

7. landingGoal - recommend the most appropriate landing page goal (e.g., collect emails, request demo, start free trial, join waitlist, etc.).


Only return a JSON object with the inferred values. Do not explain.
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
        ? await openai.chat.completions.create({ model: 'gpt-3.5-turbo-0125', messages })
        : await mistral.chat.completions.create({ model: 'open-mistral-7b', messages });

    const raw = res.choices[0]?.message?.content?.trim() || '';
    const parsed = JSON.parse(raw);
    return InferredFieldsSchema.parse(parsed);
  } catch (error) {
    console.warn(`[inferFields] ${model} failed, trying fallback`, error);

    try {
      const fallback = model === 'openai' ? mistral : openai;
      const fallbackModel = model === 'openai' ? 'open-mistral-7b' : 'gpt-3.5-turbo-0125';

      const res = await fallback.chat.completions.create({ model: fallbackModel, messages });
      const raw = res.choices[0]?.message?.content?.trim() || '';
      const parsed = JSON.parse(raw);
      return InferredFieldsSchema.parse(parsed);
    } catch (fallbackError) {
      console.error('[inferFields] Fallback failed:', fallbackError);
      throw new Error('Inference failed from both models');
    }
  }
}
