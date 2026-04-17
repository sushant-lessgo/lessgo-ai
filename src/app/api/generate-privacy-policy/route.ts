/**
 * /api/generate-privacy-policy - Generate a per-project privacy policy
 *
 * Flow:
 *  1. Validate request
 *  2. Auth + credits (2 credits)
 *  3. Resolve token -> project -> onboarding context
 *  4. Build prompt with onboarding + user-supplied form fields
 *  5. Call AI (structured output: { markdown })
 *  6. Consume credits, return markdown
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { createSecureResponse } from '@/lib/security';
import { withAIRateLimit } from '@/lib/rateLimit';
import { requireAICredits } from '@/lib/middleware/planCheck';
import { consumeCredits, CREDIT_COSTS, UsageEventType } from '@/lib/creditSystem';
import { generateWithSchema } from '@/lib/aiClient';

export const dynamic = 'force-dynamic';

const JURISDICTIONS = ['US', 'EU', 'UK', 'Global'] as const;

const RequestSchema = z.object({
  token: z.string().min(1),
  jurisdiction: z.enum(JURISDICTIONS),
  dataCollected: z.array(z.string()).default([]),
  cookiesUsed: z.boolean().default(false),
  analyticsUsed: z.boolean().default(false),
  contactEmail: z.string().email(),
  companyName: z.string().min(1).max(200),
  websiteUrl: z.string().url().optional(),
});

const ResponseSchema = z.object({
  markdown: z.string().min(200),
});

function buildPrivacyPrompt(input: {
  companyName: string;
  websiteUrl?: string;
  jurisdiction: string;
  dataCollected: string[];
  cookiesUsed: boolean;
  analyticsUsed: boolean;
  contactEmail: string;
  marketCategory?: string;
  targetAudience?: string;
}): string {
  const dataList = input.dataCollected.length > 0
    ? input.dataCollected.join(', ')
    : 'basic contact information provided by the user';

  return `Generate a clear, compliant privacy policy in Markdown for the following product.

Company: ${input.companyName}
${input.websiteUrl ? `Website: ${input.websiteUrl}` : ''}
Jurisdiction: ${input.jurisdiction}
${input.marketCategory ? `Industry/Category: ${input.marketCategory}` : ''}
${input.targetAudience ? `Target audience: ${input.targetAudience}` : ''}
Data collected: ${dataList}
Cookies used: ${input.cookiesUsed ? 'Yes' : 'No'}
Analytics used: ${input.analyticsUsed ? 'Yes' : 'No'}
Contact email: ${input.contactEmail}

Requirements:
- Return Markdown only. Use H2 (##) for section headings.
- Include: Introduction, Information We Collect, How We Use Information, ${input.cookiesUsed ? 'Cookies, ' : ''}${input.analyticsUsed ? 'Analytics, ' : ''}Third-Party Services, Data Retention, Your Rights${input.jurisdiction === 'EU' ? ' (including GDPR rights)' : ''}${input.jurisdiction === 'US' ? ' (including CCPA rights where applicable)' : ''}, Children's Privacy, Changes to This Policy, Contact Us.
- Use plain language. Avoid legalese where possible.
- Reference the company name throughout. Use the contact email in the Contact Us section.
- Do NOT include an "effective date" line (the system will add it).
- Do NOT wrap in code fences.

Return a JSON object: { "markdown": "<full policy markdown>" }`;
}

async function handler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const validation = RequestSchema.safeParse(body);
    if (!validation.success) {
      return createSecureResponse(
        { success: false, error: 'validation_error', details: validation.error.issues },
        400
      );
    }

    const input = validation.data;

    // Auth + credit gate
    const creditCheck = await requireAICredits(
      req,
      UsageEventType.PRIVACY_POLICY_GENERATION,
      CREDIT_COSTS.PRIVACY_POLICY_GENERATION
    );
    if (!creditCheck.allowed) {
      return creditCheck.response!;
    }
    const userId = creditCheck.userId!;

    // Best-effort token lookup for onboarding context (does not gate the endpoint)
    const tokenRow = await prisma.token.findUnique({
      where: { value: input.token },
      include: { project: true },
    }).catch(() => null);

    const projectContent = (tokenRow?.project?.content as any) || {};
    const onboarding = projectContent.onboarding || {};
    const confirmed = onboarding.confirmedFields || {};
    const marketCategoryRaw = confirmed.marketCategory || confirmed.category;
    const targetAudienceRaw = confirmed.targetAudience;
    // confirmedFields stores { value, confidence } — extract the string
    const marketCategory = typeof marketCategoryRaw === 'object' ? marketCategoryRaw?.value : marketCategoryRaw;
    const targetAudience = typeof targetAudienceRaw === 'object' ? targetAudienceRaw?.value : targetAudienceRaw;

    const prompt = buildPrivacyPrompt({
      companyName: input.companyName,
      websiteUrl: input.websiteUrl,
      jurisdiction: input.jurisdiction,
      dataCollected: input.dataCollected,
      cookiesUsed: input.cookiesUsed,
      analyticsUsed: input.analyticsUsed,
      contactEmail: input.contactEmail,
      marketCategory,
      targetAudience,
    });

    let result: { markdown: string };
    try {
      result = await generateWithSchema(
        'privacy',
        [{ role: 'user', content: prompt }],
        ResponseSchema,
        'privacy_policy'
      );
    } catch (error: any) {
      logger.error('AI privacy policy generation failed:', error);
      return createSecureResponse(
        { success: false, error: 'ai_error', message: error.message || 'AI service error', recoverable: true },
        500
      );
    }

    const consumption = await consumeCredits(
      userId,
      UsageEventType.PRIVACY_POLICY_GENERATION,
      CREDIT_COSTS.PRIVACY_POLICY_GENERATION,
      {
        endpoint: '/api/generate-privacy-policy',
        projectId: tokenRow?.project?.id,
        duration: Date.now() - startTime,
        metadata: {
          jurisdiction: input.jurisdiction,
          markdownLength: result.markdown.length,
        },
      }
    );

    return createSecureResponse({
      success: true,
      content: result.markdown,
      creditsUsed: CREDIT_COSTS.PRIVACY_POLICY_GENERATION,
      creditsRemaining: consumption.remaining,
    });
  } catch (error: any) {
    logger.error('Privacy policy handler error:', error);
    return createSecureResponse(
      { success: false, error: 'internal_error', message: 'An unexpected error occurred', recoverable: true },
      500
    );
  }
}

export const POST = withAIRateLimit(handler);
