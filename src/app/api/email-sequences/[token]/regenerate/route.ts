export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * /api/email-sequences/[token]/regenerate — regenerate ONE email in place.
 *
 * POST body `{ position }`. Read-modify-write on the single EmailSequence row:
 * replaces ONLY emails[position], passing the other emails as sibling coherence
 * context. Same guards, retry contract, atomic tx + ledger row as the parent
 * route. Reuses the `email_sequence_generation` UsageEvent type; metadata marks
 * `regen: true` + the position (unresolved-question #4 resolved this way).
 *
 * Length caps live OUTSIDE the generateRawJson schema (decision #10) so the
 * `too_long` / `invalid_shape` retry/trim split (decision #9) stays intact.
 */
import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createSecureResponse, assertProjectOwner } from '@/lib/security';
import { withAIRateLimit } from '@/lib/rateLimit';
import { UsageEventType } from '@/lib/creditSystem';
import { generateRawJson } from '@/lib/aiClient';
import { BriefSchema } from '@/lib/schemas/brief.schema';
import { getSequencePlanForIntent, type SequenceDef } from '@/modules/email/archetypes';
import { buildBrandContext } from '@/modules/email/brandContext';
import {
  buildSingleEmailPrompt,
  SingleEmailOutputSchema,
  validateSingleEmail,
  mockSingleEmailOutput,
  SUBJECT_MAX_CHARS,
  BODY_MAX_CHARS,
  type EmailItem,
  type EmailSibling,
} from '@/modules/email/sequenceEngine';
import type { GoalIntent } from '@/modules/goals/vocabulary';

const ENDPOINT = '/api/email-sequences/[token]/regenerate';

// ---- kill-switch -------------------------------------------------------------

function isDisabled(): boolean {
  return process.env.NEXT_PUBLIC_EMAIL_SEQUENCES_DISABLED === 'true';
}

function disabledResponse(): Response {
  return createSecureResponse({ success: false, error: 'not_found' }, 404);
}

// ---- request validation ------------------------------------------------------

const RegenerateSchema = z.object({
  position: z.number().int().min(0),
});

// ---- stored-row shape --------------------------------------------------------

interface StoredEmail {
  position: number;
  key: string;
  subject: string;
  body: string;
}

function readStoredEmails(raw: unknown): StoredEmail[] {
  if (!Array.isArray(raw)) return [];
  const out: StoredEmail[] = [];
  raw.forEach((item, i) => {
    if (item && typeof item === 'object') {
      const r = item as Record<string, unknown>;
      out.push({
        position: typeof r.position === 'number' ? r.position : i,
        key: typeof r.key === 'string' ? r.key : `email-${i}`,
        subject: typeof r.subject === 'string' ? r.subject : '',
        body: typeof r.body === 'string' ? r.body : '',
      });
    }
  });
  return out;
}

function withTimingLabels(emails: StoredEmail[], def: SequenceDef | null) {
  return emails.map((e) => {
    const slot = def?.emails[e.position];
    return {
      position: e.position,
      key: e.key,
      subject: e.subject,
      body: e.body,
      timingLabel: slot?.timingLabel ?? '',
      purpose: slot?.purpose ?? '',
    };
  });
}

// ---- generation helpers (retry contract, decision #9) ------------------------

function trimToSentence(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const lastSentenceEnd = Math.max(
    slice.lastIndexOf('.'),
    slice.lastIndexOf('!'),
    slice.lastIndexOf('?'),
  );
  if (lastSentenceEnd > maxChars * 0.5) return slice.slice(0, lastSentenceEnd + 1).trim();
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace > 0) return slice.slice(0, lastSpace).trim();
  return slice.trim();
}

function trimEmail(email: EmailItem): EmailItem {
  return {
    subject: trimToSentence(email.subject, SUBJECT_MAX_CHARS),
    body: trimToSentence(email.body, BODY_MAX_CHARS),
  };
}

async function attemptSingle(prompt: string) {
  try {
    const raw = await generateRawJson('emailSequence', prompt, SingleEmailOutputSchema);
    return validateSingleEmail(raw);
  } catch (err) {
    return {
      status: 'invalid_shape' as const,
      error: err instanceof Error ? err.message : 'generation failed',
    };
  }
}

/**
 * Real single-email regeneration with the retry contract (decision #9):
 *   - too_long      → retry ONCE with a stricter instruction; still long → trim.
 *   - invalid_shape → retry ONCE; still bad → throw (route returns generation_failed).
 */
async function regenerateEmail(prompt: string): Promise<EmailItem> {
  let result = await attemptSingle(prompt);

  if (result.status !== 'ok') {
    const retryPrompt =
      result.status === 'too_long'
        ? prompt +
          `\n\n=== RETRY ===\nYour previous attempt exceeded the length limits. The subject MUST ` +
          `be at most ${SUBJECT_MAX_CHARS} characters and the body at most ${BODY_MAX_CHARS} ` +
          `characters. Be more concise; cut ruthlessly.`
        : prompt;
    result = await attemptSingle(retryPrompt);
  }

  if (result.status === 'ok') return result.email;
  if (result.status === 'too_long') return trimEmail(result.email);
  throw new Error(result.error);
}

// ---- POST (regenerate one email) ---------------------------------------------

async function regenerateHandler(
  req: NextRequest,
  { params }: { params: { token: string } },
): Promise<Response> {
  if (isDisabled()) return disabledResponse();

  const startTime = Date.now();
  const tokenId = params.token;

  try {
    const body = await req.json().catch(() => null);
    const parsed = RegenerateSchema.safeParse(body);
    if (!parsed.success) {
      return createSecureResponse(
        { success: false, error: 'validation_error', details: parsed.error.issues },
        400,
      );
    }
    const { position } = parsed.data;

    const { userId: clerkId } = await auth();
    const access = await assertProjectOwner(clerkId, tokenId, { action: 'email-sequences.regenerate' });
    if (!access.ok) {
      return createSecureResponse({ success: false, error: access.error }, access.status);
    }

    // Demo bearer never persisted a sequence → nothing to regenerate.
    if (access.isDemo || !clerkId) {
      return createSecureResponse({ success: false, error: 'Sequence not found' }, 404);
    }

    // Load the existing sequence (404 if none).
    const row = await prisma.emailSequence.findFirst({ where: { tokenId } });
    if (!row || row.userId !== clerkId) {
      return createSecureResponse({ success: false, error: 'Sequence not found' }, 404);
    }

    const stored = readStoredEmails(row.emails);

    // Resolve the def from the row's intent so timing/prompt slots line up.
    const plan = getSequencePlanForIntent(row.intent as GoalIntent);
    if (plan.status !== 'available') {
      return createSecureResponse({ success: false, error: 'not_available', status: plan.status }, 409);
    }
    const def = plan.def;

    // Validate the position is within range for this sequence.
    if (position >= def.emails.length || position >= stored.length) {
      return createSecureResponse(
        { success: false, error: 'invalid_position', message: `position ${position} out of range` },
        400,
      );
    }

    // Load Brief for brand context (defensive — degrades gracefully if missing).
    const project = await prisma.project.findUnique({
      where: { tokenId },
      select: { id: true, brief: true },
    });
    if (!project) {
      return createSecureResponse({ success: false, error: 'Project not found' }, 404);
    }
    const brandContext = buildBrandContext(BriefSchema.safeParse(project.brief).data ?? null);

    // Siblings = the OTHER stored emails, passed as coherence context.
    const siblings: EmailSibling[] = stored
      .filter((e) => e.position !== position)
      .map((e) => ({ position: e.position, subject: e.subject, body: e.body }));

    // Generate — env-mock short-circuit vs real LLM with the retry contract.
    let regenerated: EmailItem;
    const envMock = process.env.NEXT_PUBLIC_USE_MOCK_GPT === 'true';
    if (envMock) {
      logger.info('[email:regenerate] env mock mode');
      regenerated = mockSingleEmailOutput(def, position);
    } else {
      const prompt = buildSingleEmailPrompt({ def, position, siblings, brandContext });
      logger.dev('[email:regenerate] PROMPT:', prompt);
      try {
        regenerated = await regenerateEmail(prompt);
      } catch (err) {
        logger.error('[email:regenerate] generation failed:', err);
        return createSecureResponse(
          {
            success: false,
            error: 'generation_failed',
            message: err instanceof Error ? err.message : 'Failed to regenerate email',
            recoverable: true,
          },
          500,
        );
      }
    }

    // Read-modify-write: replace ONLY emails[position], keep key/position stable.
    const nextEmails: StoredEmail[] = stored.map((e) =>
      e.position === position
        ? {
            position,
            key: def.emails[position]?.key ?? e.key,
            subject: regenerated.subject,
            body: regenerated.body,
          }
        : e,
    );

    // Persist + ledger = ONE atomic unit (decision #11), same event type + regen metadata.
    const [updated] = await prisma.$transaction([
      prisma.emailSequence.update({
        where: { id: row.id },
        data: { emails: nextEmails as unknown as Prisma.InputJsonValue },
      }),
      prisma.usageEvent.create({
        data: {
          userId: clerkId,
          eventType: UsageEventType.EMAIL_SEQUENCE_GENERATION,
          creditsUsed: 0,
          projectId: project.id,
          metadata: { tokenId, intent: row.intent, archetype: def.archetype, regen: true, position },
          endpoint: ENDPOINT,
          duration: Date.now() - startTime,
          success: true,
        },
      }),
    ]);

    return createSecureResponse({
      success: true,
      persisted: true,
      sequence: {
        id: updated.id,
        intent: updated.intent,
        archetype: updated.archetype,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        emails: withTimingLabels(nextEmails, def),
      },
    });
  } catch (error) {
    logger.error('[email:regenerate] endpoint error:', error);
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

// withRateLimit drops the (req, ctx) second arg, so bind params per request.
export async function POST(
  req: NextRequest,
  ctx: { params: { token: string } },
): Promise<Response> {
  if (isDisabled()) return disabledResponse();
  return withAIRateLimit((r) => regenerateHandler(r, ctx))(req);
}
