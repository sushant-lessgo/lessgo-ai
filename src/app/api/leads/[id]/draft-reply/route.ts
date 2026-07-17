export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/leads/[id]/draft-reply — draft an on-brand reply to ONE inbound lead.
 *
 * Account-level route (not token-scoped): ownership is enforced via
 * `getAccountScope(clerkUserId).pageIds` — the trustworthy server-set key — NOT
 * `FormSubmission.userId` (attacker-controllable; written from the client body in
 * /api/forms/submit). A submission whose `publishedPageId` is null or outside the
 * caller's scope has no ownership proof and is refused with a 404 (no existence
 * oracle — matches the kill-switch + outreach conceal behavior).
 *
 * Check-then-charge-on-success: `checkCredits` gates upfront; the credit is
 * consumed ONLY after a successful draft. A generation failure charges nothing.
 *
 * Imports plain modules only — nothing from a 'use client' file.
 */
import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { createSecureResponse } from '@/lib/security';
import { withAIRateLimit } from '@/lib/rateLimit';
import { CREDIT_COSTS, UsageEventType, checkCredits, consumeCredits } from '@/lib/creditSystem';
import { generateRawJson } from '@/lib/aiClient';
import { getAccountScope } from '@/lib/dashboard/accountScope';
import { extractLeadMessage } from '@/lib/leadReply/messageExtraction';
import { resolveReplyGrounding } from '@/lib/leadReply/brandGrounding';
import { buildLeadReplyPrompt, LeadReplyOutputSchema } from '@/lib/leadReply/prompt';

// ---- kill-switch -------------------------------------------------------------

function isDisabled(): boolean {
  return process.env.NEXT_PUBLIC_LEAD_REPLY_DISABLED === 'true';
}

/** Conceal a disabled feature as a nonexistent route (matches ownership 404s). */
function notFoundResponse(): Response {
  return createSecureResponse({ success: false, error: 'not_found' }, 404);
}

// ---- generation (retry-once contract) ----------------------------------------

async function generateReplyDraft(prompt: string): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const out = await generateRawJson('lead-reply', prompt, LeadReplyOutputSchema);
      return out.reply;
    } catch (err) {
      lastErr = err;
      logger.dev(`[leads:draft-reply] generation attempt ${attempt} failed:`, err);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('generation failed');
}

// ---- POST --------------------------------------------------------------------

async function draftReplyHandler(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<Response> {
  if (isDisabled()) return notFoundResponse();

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return createSecureResponse({ success: false, error: 'unauthorized' }, 401);
    }

    const submissionId = params.id;

    // Ownership check FIRST — select only `publishedPageId` (defense-in-depth: no
    // `data`/brief read before the caller is proven to own the submission).
    const owned = await prisma.formSubmission.findUnique({
      where: { id: submissionId },
      select: { publishedPageId: true },
    });

    const scope = await getAccountScope(clerkId);

    // 404 (no existence oracle) when: missing, null publishedPageId, or out of scope.
    if (
      !owned ||
      !owned.publishedPageId ||
      !scope.pageIds.includes(owned.publishedPageId)
    ) {
      return notFoundResponse();
    }

    const publishedPageId = owned.publishedPageId;

    // Ownership passed — NOW read the submission `data`.
    const submission = await prisma.formSubmission.findUnique({
      where: { id: submissionId },
      select: { data: true },
    });

    const leadMessage = extractLeadMessage(
      (submission?.data ?? null) as Record<string, string> | null,
    );
    if (!leadMessage) {
      return createSecureResponse({ success: false, error: 'no_replyable_message' }, 400);
    }

    // Resolve grounding — always degrades to light, never errors.
    const grounding = await resolveGroundingSafely(publishedPageId);

    // Upfront credit gate (check-then-charge-on-success).
    const credit = await checkCredits(clerkId, CREDIT_COSTS.LEAD_REPLY);
    if (!credit.allowed) {
      return createSecureResponse(
        {
          success: false,
          error: 'insufficient_credits',
          message: `Insufficient credits. Required: ${credit.required}, Available: ${credit.remaining}`,
          remaining: credit.remaining,
        },
        402,
      );
    }

    // Generate (retry once). No charge on failure.
    let reply: string;
    try {
      const prompt = buildLeadReplyPrompt(grounding, leadMessage.value);
      logger.dev('[leads:draft-reply] PROMPT:', prompt);
      reply = await generateReplyDraft(prompt);
    } catch (err) {
      logger.error('[leads:draft-reply] generation failed:', err);
      return createSecureResponse(
        {
          success: false,
          error: 'generation_failed',
          message: err instanceof Error ? err.message : 'Failed to draft a reply',
          recoverable: true,
        },
        500,
      );
    }

    // Charge on success only.
    const consumed = await consumeCredits(
      clerkId,
      UsageEventType.LEAD_REPLY_GENERATION,
      CREDIT_COSTS.LEAD_REPLY,
      { metadata: { submissionId, grounding: grounding.mode } },
    );
    if (!consumed.success) {
      // B2 split (matches deductCredits error shape):
      //  - genuine `Insufficient credits` from consume → 402 buy-wall.
      //  - anything else (e.g. 'charge_conflict' race, tx error) → recoverable
      //    500, NEVER a buy-wall on a solvent-user race.
      const isInsufficient = (consumed.error ?? '').startsWith('Insufficient credits');
      if (isInsufficient) {
        return createSecureResponse(
          {
            success: false,
            error: 'insufficient_credits',
            message: consumed.error,
            remaining: consumed.remaining,
          },
          402,
        );
      }
      return createSecureResponse(
        {
          success: false,
          error: 'charge_failed',
          message: 'Could not complete the charge. Please try again.',
          recoverable: true,
        },
        500,
      );
    }

    return createSecureResponse({
      success: true,
      reply,
      grounding: grounding.mode,
      remaining: consumed.remaining,
    });
  } catch (error) {
    logger.error('[leads:draft-reply] endpoint error:', error);
    return createSecureResponse(
      {
        success: false,
        error: 'internal_error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      500,
    );
  }
}

/**
 * Resolve brand grounding from the scoped page's project Brief. Any failure
 * degrades to light context (site name only) — never errors (spec constraint).
 */
async function resolveGroundingSafely(publishedPageId: string) {
  try {
    const page = await prisma.publishedPage.findUnique({
      where: { id: publishedPageId },
      select: { projectId: true, title: true },
    });
    const siteName = page?.title ?? null;
    if (!page?.projectId) {
      return resolveReplyGrounding(null, siteName);
    }
    const project = await prisma.project.findUnique({
      where: { id: page.projectId },
      select: { brief: true, title: true },
    });
    return resolveReplyGrounding(project?.brief ?? null, project?.title ?? siteName);
  } catch (err) {
    logger.error('[leads:draft-reply] grounding resolution failed:', err);
    return resolveReplyGrounding(null, null);
  }
}

// withRateLimit drops the (req, ctx) second arg, so bind params per request.
export async function POST(
  req: NextRequest,
  ctx: { params: { id: string } },
): Promise<Response> {
  if (isDisabled()) return notFoundResponse();
  return withAIRateLimit((r) => draftReplyHandler(r, ctx))(req);
}
