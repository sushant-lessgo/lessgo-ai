export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * /api/outreach/[token]/regenerate — regenerate ONE outreach message in place.
 *
 * POST body `{ messageId }`. Read-modify-write on the OutreachMessage row:
 *   - Rebuilds grounding from the row's DENORMALIZED `grounding` snapshot — NEVER
 *     re-scrapes (the snapshot is self-contained even after cache expiry).
 *   - Siblings = same-platform recent messages for tone coherence.
 *   - Same retry contract, atomic tx + creditsUsed:0 ledger row as the parent route.
 *
 * Demo bearer → ephemeral mock, persists NOTHING (demo-first ordering).
 *
 * DEFENSIVE (Phase-3 review): the single-message validator does not assert the
 * returned platform id matches the target platform. We verify `platform === def.id`
 * here BEFORE persisting, guarding against a wrong-platform model response.
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
import { buildBrandContext } from '@/modules/email/brandContext';
import type { ProspectExtract } from '@/modules/outreach/prospectExtraction';
import {
  buildSingleMessagePrompt,
  singleMessageOutputSchema,
  validateSingleMessage,
  mockSingleMessageOutput,
  type OutreachGrounding,
  type OutreachMessageItem,
  type OutreachSibling,
} from '@/modules/outreach/outreachEngine';
import { getPlatformDef, type PlatformDef } from '@/modules/outreach/platforms';

const ENDPOINT = '/api/outreach/[token]/regenerate';

// ---- kill-switch -------------------------------------------------------------

function isDisabled(): boolean {
  return process.env.NEXT_PUBLIC_COLD_OUTREACH_DISABLED === 'true';
}

function disabledResponse(): Response {
  return createSecureResponse({ success: false, error: 'not_found' }, 404);
}

// ---- request validation ------------------------------------------------------

const RegenerateSchema = z.object({ messageId: z.string().min(1) });

// ---- response shaping --------------------------------------------------------

function toMessageView(row: {
  id: string;
  platform: string;
  kind: string;
  groundingLevel: string;
  prospectLabel: string | null;
  subject: string | null;
  body: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    platform: row.platform,
    kind: row.kind,
    groundingLevel: row.groundingLevel,
    prospectLabel: row.prospectLabel,
    subject: row.subject,
    body: row.body,
    createdAt: row.createdAt,
  };
}

/** Rebuild the generation grounding from a persisted `grounding` snapshot. */
function groundingFromSnapshot(raw: unknown): OutreachGrounding {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.rawText === 'string') return { rawText: r.rawText };
  // Otherwise treat as a ProspectExtract snapshot (defensive narrowing).
  if (typeof r.whatTheyDo === 'string' || typeof r.whoFor === 'string' || Array.isArray(r.specifics)) {
    return {
      name: typeof r.name === 'string' ? r.name : null,
      whatTheyDo: typeof r.whatTheyDo === 'string' ? r.whatTheyDo : '',
      whoFor: typeof r.whoFor === 'string' ? r.whoFor : '',
      specifics: Array.isArray(r.specifics) ? (r.specifics as unknown[]).filter((s): s is string => typeof s === 'string') : [],
    } as ProspectExtract;
  }
  return null;
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

function trimToWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ');
}

function trimMessage(msg: OutreachMessageItem, def: PlatformDef): OutreachMessageItem {
  const caps = def.caps;
  let subject = msg.subject;
  if (caps.subjectMaxChars !== undefined && typeof subject === 'string') {
    subject = trimToSentence(subject, caps.subjectMaxChars);
  }
  let body = msg.body;
  if (caps.bodyMaxChars !== undefined) body = trimToSentence(body, caps.bodyMaxChars);
  if (caps.bodyMaxWords !== undefined) body = trimToWords(body, caps.bodyMaxWords);
  return {
    platform: msg.platform,
    ...(typeof subject === 'string' ? { subject } : {}),
    body,
  };
}

interface Attempt {
  raw: OutreachMessageItem | null;
  result: ReturnType<typeof validateSingleMessage>;
}

async function attemptSingle(prompt: string, def: PlatformDef): Promise<Attempt> {
  try {
    const raw = await generateRawJson('cold-outreach', prompt, singleMessageOutputSchema(def));
    return { raw, result: validateSingleMessage(raw, def) };
  } catch (err) {
    return {
      raw: null,
      result: {
        ok: false,
        reason: 'invalid_shape',
        detail: err instanceof Error ? err.message : 'generation failed',
      },
    };
  }
}

/**
 * Real single-message regeneration with the retry contract (decision #9):
 *   - too_long      → retry ONCE; still long → trim the shape-valid raw to caps.
 *   - invalid_shape → retry ONCE; still bad → throw (route returns generation_failed).
 */
async function regenerateMessage(prompt: string, def: PlatformDef): Promise<OutreachMessageItem> {
  let attempt = await attemptSingle(prompt, def);

  if (!attempt.result.ok) {
    const retryPrompt =
      attempt.result.reason === 'too_long'
        ? prompt +
          '\n\n=== RETRY ===\nYour previous attempt exceeded the length limit. Respect the ' +
          'platform length cap exactly. Be more concise; cut ruthlessly.'
        : prompt;
    attempt = await attemptSingle(retryPrompt, def);
  }

  if (attempt.result.ok) return attempt.result.message;
  if (attempt.result.reason === 'too_long' && attempt.raw) return trimMessage(attempt.raw, def);
  throw new Error(attempt.result.detail);
}

// ---- POST (regenerate one message) -------------------------------------------

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
    const { messageId } = parsed.data;

    const { userId: clerkId } = await auth();
    const access = await assertProjectOwner(clerkId, tokenId, { action: 'outreach.regenerate' });
    if (!access.ok) {
      return createSecureResponse({ success: false, error: access.error }, access.status);
    }

    // Demo bearer never persisted rows → nothing to regenerate (no load/AI/spend).
    if (access.isDemo || !clerkId) {
      return createSecureResponse({ success: false, error: 'Message not found' }, 404);
    }

    // Load the existing message (404 if none / not owner).
    const row = await prisma.outreachMessage.findUnique({ where: { id: messageId } });
    if (!row || row.userId !== clerkId || row.tokenId !== tokenId) {
      return createSecureResponse({ success: false, error: 'Message not found' }, 404);
    }

    const def = getPlatformDef(row.platform);
    if (!def) {
      return createSecureResponse(
        { success: false, error: 'platform_not_available', platform: row.platform },
        409,
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

    // Rebuild grounding from the row's snapshot — NEVER re-scrape.
    const grounding = groundingFromSnapshot(row.grounding);

    // Load intake for target descriptor / opener context.
    const intakeRow = await prisma.outreachIntake.findUnique({ where: { projectId: project.id } });
    const intake = {
      targetDescriptor: intakeRow?.targetDescriptor ?? '',
      openerContext: intakeRow?.openerContext ?? undefined,
    };

    // Siblings = same-platform recent messages (excluding this one) for coherence.
    const siblingRows = await prisma.outreachMessage.findMany({
      where: { tokenId, userId: clerkId, platform: row.platform, id: { not: row.id } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const siblings: OutreachSibling[] = siblingRows.map((s) => ({
      platform: s.platform,
      ...(s.subject ? { subject: s.subject } : {}),
      body: s.body,
    }));

    // Generate — env-mock short-circuit vs real LLM with the retry contract.
    let regenerated: OutreachMessageItem;
    const envMock = process.env.NEXT_PUBLIC_USE_MOCK_GPT === 'true';
    if (envMock) {
      logger.info('[outreach:regenerate] env mock mode');
      regenerated = mockSingleMessageOutput(def);
    } else {
      const prompt = buildSingleMessagePrompt({ platformDef: def, siblings, brandContext, intake, grounding });
      logger.dev('[outreach:regenerate] PROMPT:', prompt);
      try {
        regenerated = await regenerateMessage(prompt, def);
      } catch (err) {
        logger.error('[outreach:regenerate] generation failed:', err);
        return createSecureResponse(
          {
            success: false,
            error: 'generation_failed',
            message: err instanceof Error ? err.message : 'Failed to regenerate message',
            recoverable: true,
          },
          500,
        );
      }
    }

    // DEFENSIVE: reject a wrong-platform model response before persisting.
    if (regenerated.platform !== def.id) {
      logger.error(
        `[outreach:regenerate] platform mismatch: got "${regenerated.platform}", expected "${def.id}"`,
      );
      return createSecureResponse(
        {
          success: false,
          error: 'generation_failed',
          message: 'The model returned a message for the wrong platform.',
          recoverable: true,
        },
        500,
      );
    }

    // Read-modify-write: replace subject/body in place, keep platform/grounding stable.
    const [updated] = await prisma.$transaction([
      prisma.outreachMessage.update({
        where: { id: row.id },
        data: {
          subject: typeof regenerated.subject === 'string' ? regenerated.subject : null,
          body: regenerated.body,
        },
      }),
      prisma.usageEvent.create({
        data: {
          userId: clerkId,
          eventType: UsageEventType.OUTREACH_GENERATION,
          creditsUsed: 0,
          projectId: project.id,
          metadata: { tokenId, platform: row.platform, regen: true, messageId: row.id },
          endpoint: ENDPOINT,
          duration: Date.now() - startTime,
          success: true,
        },
      }),
    ]);

    return createSecureResponse({ success: true, persisted: true, message: toMessageView(updated) });
  } catch (error) {
    logger.error('[outreach:regenerate] endpoint error:', error);
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
