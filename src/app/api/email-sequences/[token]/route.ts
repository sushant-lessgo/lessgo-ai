export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * /api/email-sequences/[token] — the one goal-matched email sequence per project.
 *   GET    — fetch the current sequence (+ static per-email timing labels) or the
 *            clean not-available status for this project's goal intent.
 *   POST   — generate the whole sequence and upsert-replace the single row.
 *   DELETE — owner-checked delete of the project's sequence.
 *
 * Cloned from /api/social/[token]/posts (the social-posts rail). Differences:
 *   - Kill-switch FIRST in every handler (NEXT_PUBLIC_EMAIL_SEQUENCES_DISABLED).
 *   - Single-row upsert model (not a library) — POST replaces the row atomically.
 *   - OpenAI-only endpoint config ('emailSequence', backup:null) — never Anthropic.
 *
 * ID SPACE (mirrors social D6): `clerkId` from auth() — NOT the internal
 * userRecord.id — goes into BOTH EmailSequence.userId and UsageEvent.userId.
 *
 * Persist + ledger are ONE atomic $transaction (decision #11). We call
 * tx.usageEvent.create DIRECTLY (NOT logUsageEvent, which can't join a tx).
 * Demo bearer → ephemeral mock, persists NOTHING.
 *
 * Length caps live OUTSIDE the generateRawJson schema (decision #10): the SHAPE
 * schema `sequenceOutputSchema(def)` has no char caps, so `too_long` stays
 * distinguishable from `invalid_shape` for the retry/trim contract (decision #9).
 */
import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
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
  buildSequencePrompt,
  sequenceOutputSchema,
  validateSequence,
  mockSequenceOutput,
  SUBJECT_MAX_CHARS,
  BODY_MAX_CHARS,
  type EmailItem,
} from '@/modules/email/sequenceEngine';
import type { GoalIntent } from '@/modules/goals/vocabulary';

const ENDPOINT = '/api/email-sequences/[token]';

// ---- kill-switch -------------------------------------------------------------

function isDisabled(): boolean {
  return process.env.NEXT_PUBLIC_EMAIL_SEQUENCES_DISABLED === 'true';
}

/** 404-style JSON returned when the feature is killed. */
function disabledResponse(): Response {
  return createSecureResponse({ success: false, error: 'not_found' }, 404);
}

// ---- persisted-row shape -----------------------------------------------------

/** One stored email (persisted on the EmailSequence.emails Json array). */
interface StoredEmail {
  position: number;
  key: string;
  subject: string;
  body: string;
}

/** Merge static timing labels + purpose from the archetype def onto stored emails. */
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

/** Coerce the untyped Json emails column into StoredEmail[] defensively. */
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

/** Resolve the project's intent + 3-state plan from its Brief (defensive). */
function resolvePlan(brief: unknown): {
  intent: GoalIntent | null;
  status: 'available' | 'deferred' | 'skipped';
  def: SequenceDef | null;
} {
  const parsed = BriefSchema.safeParse(brief);
  const intent = parsed.success ? parsed.data.goal?.intent ?? null : null;
  if (!intent) {
    // No goal captured → clean "not available" empty state (never an error).
    return { intent: null, status: 'skipped', def: null };
  }
  const plan = getSequencePlanForIntent(intent);
  if (plan.status === 'available') {
    return { intent, status: 'available', def: plan.def };
  }
  return { intent, status: plan.status, def: null };
}

// ---- generation helpers (retry contract, decision #9) ------------------------

/** Trim `text` to <= maxChars, preferring a sentence boundary, then a word boundary. */
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

function trimEmails(emails: EmailItem[]): EmailItem[] {
  return emails.map((e) => ({
    subject: trimToSentence(e.subject, SUBJECT_MAX_CHARS),
    body: trimToSentence(e.body, BODY_MAX_CHARS),
  }));
}

/** One real attempt: LLM call (cap-FREE SHAPE schema) + validateSequence. */
async function attemptSequence(prompt: string, def: SequenceDef) {
  try {
    const raw = await generateRawJson('emailSequence', prompt, sequenceOutputSchema(def));
    return validateSequence(raw, def);
  } catch (err) {
    return {
      status: 'invalid_shape' as const,
      error: err instanceof Error ? err.message : 'generation failed',
    };
  }
}

/**
 * Real LLM sequence generation with the retry contract (decision #9):
 *   - too_long      → retry ONCE with a stricter instruction; still long → trim.
 *   - invalid_shape → retry ONCE; still bad → throw (route returns generation_failed).
 */
async function generateSequenceEmails(prompt: string, def: SequenceDef): Promise<EmailItem[]> {
  let result = await attemptSequence(prompt, def);

  if (result.status !== 'ok') {
    const retryPrompt =
      result.status === 'too_long'
        ? prompt +
          `\n\n=== RETRY ===\nYour previous attempt exceeded the length limits. Each subject ` +
          `MUST be at most ${SUBJECT_MAX_CHARS} characters and each body at most ` +
          `${BODY_MAX_CHARS} characters. Be more concise; cut ruthlessly.`
        : prompt;
    result = await attemptSequence(retryPrompt, def);
  }

  if (result.status === 'ok') return result.emails;
  if (result.status === 'too_long') return trimEmails(result.emails);
  throw new Error(result.error);
}

/** Zip validated email items with their static def slot (position + key). */
function toStoredEmails(emails: EmailItem[], def: SequenceDef): StoredEmail[] {
  return emails.map((e, i) => ({
    position: i,
    key: def.emails[i]?.key ?? `email-${i}`,
    subject: e.subject,
    body: e.body,
  }));
}

// ---- GET (fetch current sequence / status) -----------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } },
): Promise<Response> {
  if (isDisabled()) return disabledResponse();

  const tokenId = params.token;
  try {
    const { userId: clerkId } = await auth();
    const access = await assertProjectOwner(clerkId, tokenId, { action: 'email-sequences.get' });
    if (!access.ok) {
      return createSecureResponse({ success: false, error: access.error }, access.status);
    }

    // Load the project's Brief to resolve intent → plan status (works for demo too).
    const project = await prisma.project.findUnique({
      where: { tokenId },
      select: { id: true, brief: true },
    });
    // Current-brief plan → drives the `status` field + the no-row empty state only.
    const { status } = resolvePlan(project?.brief);

    // Demo bearer never persisted a row → sequence null, status from the plan.
    if (access.isDemo || !clerkId) {
      return createSecureResponse({ success: true, sequence: null, status });
    }

    const row = await prisma.emailSequence.findFirst({ where: { tokenId } });
    if (!row) {
      return createSecureResponse({ success: true, sequence: null, status });
    }

    // Resolve the timing-label def from the STORED intent (mirrors regenerate),
    // NOT the current brief intent — the user may have edited their goal after
    // generating, which would merge labels from the wrong/absent def onto real
    // persisted emails. Defensive: if the stored intent no longer resolves to an
    // available def, fall back to null (withTimingLabels keeps the stored
    // subjects/bodies, labels blank) — never drop the stored emails.
    const storedPlan = getSequencePlanForIntent(row.intent as GoalIntent);
    const rowDef = storedPlan.status === 'available' ? storedPlan.def : null;

    const stored = readStoredEmails(row.emails);
    return createSecureResponse({
      success: true,
      status,
      sequence: {
        id: row.id,
        intent: row.intent,
        archetype: row.archetype,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        emails: withTimingLabels(stored, rowDef),
      },
    });
  } catch (error) {
    logger.error('[email:get] endpoint error:', error);
    return createSecureResponse({ success: false, error: 'internal_error' }, 500);
  }
}

// ---- POST (generate whole sequence) ------------------------------------------

async function generateHandler(
  req: NextRequest,
  { params }: { params: { token: string } },
): Promise<Response> {
  if (isDisabled()) return disabledResponse();

  const startTime = Date.now();
  const tokenId = params.token;

  try {
    // Auth (clerkId — the id space for EmailSequence.userId + ledger, per social D6).
    const { userId: clerkId } = await auth();
    const access = await assertProjectOwner(clerkId, tokenId, { action: 'email-sequences' });
    if (!access.ok) {
      return createSecureResponse({ success: false, error: access.error }, access.status);
    }

    // Load Brief → resolve intent + plan. Non-available / missing goal → JSON, NO throw.
    const project = await prisma.project.findUnique({
      where: { tokenId },
      select: { id: true, brief: true },
    });
    if (!project) {
      return createSecureResponse({ success: false, error: 'Project not found' }, 404);
    }
    const { intent, status, def } = resolvePlan(project.brief);
    if (status !== 'available' || !def || !intent) {
      // 409 — the goal simply has no live sequence (deferred/skipped/missing goal).
      return createSecureResponse(
        { success: false, error: 'not_available', status },
        409,
      );
    }

    const brandContext = buildBrandContext(BriefSchema.safeParse(project.brief).data ?? null);

    // Demo bearer (D7): EPHEMERAL mock, persist NOTHING.
    if (access.isDemo || !clerkId) {
      const { emails } = mockSequenceOutput(def);
      return createSecureResponse({
        success: true,
        persisted: false,
        status,
        sequence: {
          id: 'demo-ephemeral',
          intent,
          archetype: def.archetype,
          emails: withTimingLabels(toStoredEmails(emails, def), def),
        },
      });
    }

    // Generate — env-mock short-circuit vs real LLM with the retry contract.
    let emails: EmailItem[];
    const envMock = process.env.NEXT_PUBLIC_USE_MOCK_GPT === 'true';
    if (envMock) {
      logger.info('[email:generate] env mock mode');
      emails = mockSequenceOutput(def).emails;
    } else {
      const prompt = buildSequencePrompt({ def, brandContext, intent });
      logger.dev('[email:generate] PROMPT:', prompt);
      try {
        emails = await generateSequenceEmails(prompt, def);
      } catch (err) {
        logger.error('[email:generate] generation failed:', err);
        return createSecureResponse(
          {
            success: false,
            error: 'generation_failed',
            message: err instanceof Error ? err.message : 'Failed to generate sequence',
            recoverable: true,
          },
          500,
        );
      }
    }

    const stored = toStoredEmails(emails, def);
    const emailsJson = stored as unknown as Prisma.InputJsonValue;

    // Persist + ledger = ONE atomic unit (decision #11). Upsert-replace the single row.
    const [row] = await prisma.$transaction([
      prisma.emailSequence.upsert({
        where: { projectId: project.id },
        create: {
          userId: clerkId,
          projectId: project.id,
          tokenId,
          intent,
          archetype: def.archetype,
          emails: emailsJson,
        },
        update: {
          userId: clerkId,
          tokenId,
          intent,
          archetype: def.archetype,
          emails: emailsJson,
        },
      }),
      prisma.usageEvent.create({
        data: {
          userId: clerkId,
          eventType: UsageEventType.EMAIL_SEQUENCE_GENERATION,
          creditsUsed: 0,
          projectId: project.id,
          metadata: { tokenId, intent, archetype: def.archetype, emailCount: stored.length },
          endpoint: ENDPOINT,
          duration: Date.now() - startTime,
          success: true,
        },
      }),
    ]);

    return createSecureResponse({
      success: true,
      persisted: true,
      status,
      sequence: {
        id: row.id,
        intent: row.intent,
        archetype: row.archetype,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        emails: withTimingLabels(stored, def),
      },
    });
  } catch (error) {
    logger.error('[email:generate] endpoint error:', error);
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
  return withAIRateLimit((r) => generateHandler(r, ctx))(req);
}

// ---- DELETE (clear the project's sequence) -----------------------------------

export async function DELETE(
  req: NextRequest,
  { params }: { params: { token: string } },
): Promise<Response> {
  if (isDisabled()) return disabledResponse();

  const tokenId = params.token;
  try {
    const { userId: clerkId } = await auth();
    const access = await assertProjectOwner(clerkId, tokenId, { action: 'email-sequences.delete' });
    if (!access.ok) {
      return createSecureResponse({ success: false, error: access.error }, access.status);
    }

    // Demo bearer never persisted a row → nothing to delete.
    if (access.isDemo || !clerkId) {
      return createSecureResponse({ success: false, error: 'Sequence not found' }, 404);
    }

    const row = await prisma.emailSequence.findFirst({ where: { tokenId } });
    if (!row || row.userId !== clerkId) {
      return createSecureResponse({ success: false, error: 'Sequence not found' }, 404);
    }

    await prisma.emailSequence.delete({ where: { id: row.id } });
    return createSecureResponse({ success: true, deleted: true });
  } catch (error) {
    logger.error('[email:delete] endpoint error:', error);
    return createSecureResponse({ success: false, error: 'internal_error' }, 500);
  }
}
