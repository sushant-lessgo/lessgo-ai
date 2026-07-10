export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * /api/outreach/[token] — the per-project cold-outreach message library.
 *   GET    — the message library (desc by createdAt).
 *   POST   — generate one message per selected platform, grounded in a prospect
 *            (URL scrape+extract, pasted text, or none), and persist the rows.
 *   DELETE — owner-checked delete of a single message (library hygiene).
 *
 * Cloned from the email-sequences rail (kill-switch FIRST → auth →
 * assertProjectOwner → withAIRateLimit on the AI POST → createSecureResponse).
 *
 * ORDER OF OPERATIONS (load-bearing — decisions #11/#12):
 *   1. kill-switch → auth → assertProjectOwner
 *   2. DEMO/MOCK SHORT-CIRCUIT FIRST — `access.isDemo || !clerkId` returns an
 *      ephemeral mock (groundingLevel 'generic') with NO scrapeSite, NO
 *      consumeCredits, NO persist — even when prospectUrl/prospectText is set.
 *   3. load intake (400 if missing) + Brief → buildBrandContext
 *   4. GROUNDING LADDER: URL → cache-hit (no charge) OR check-credits-BEFORE-scrape
 *      → scrape → extract → upsert → charge (miss path ONLY). ScrapeError /
 *      extraction-invalid → grounding null + `groundingWarning:'scrape_failed'`,
 *      NOT an error status, NO charge. Pasted text → used verbatim (never fetched).
 *      Neither → grounding null.
 *   5. generate (retry contract) → 6. persist rows + creditsUsed:0 ledger row in
 *      ONE $transaction → 7. respond.
 *
 * Length caps live OUTSIDE the generateRawJson schema (decision #10): the SHAPE
 * schema `outreachOutputSchema(platforms)` has no char caps, so `too_long` stays
 * distinguishable from `invalid_shape` for the retry/trim contract.
 */
import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createSecureResponse, assertProjectOwner } from '@/lib/security';
import { withAIRateLimit } from '@/lib/rateLimit';
import { CREDIT_COSTS, UsageEventType, checkCredits, consumeCredits } from '@/lib/creditSystem';
import { generateRawJson, generateWithSchema } from '@/lib/aiClient';
import { scrapeSite, ScrapeError } from '@/lib/scrape/fetchSite';
import { BriefSchema } from '@/lib/schemas/brief.schema';
import { buildBrandContext } from '@/modules/email/brandContext';
import {
  normalizeProspectUrlKey,
  getFreshProspectScrape,
  upsertProspectScrape,
} from '@/lib/prospectScrape';
import {
  buildProspectExtractionPrompt,
  ProspectExtractSchema,
  type ProspectExtract,
} from '@/modules/outreach/prospectExtraction';
import {
  buildOutreachPrompt,
  outreachOutputSchema,
  validateOutreachMessages,
  mockOutreachOutput,
  type OutreachGrounding,
  type OutreachMessageItem,
} from '@/modules/outreach/outreachEngine';
import { getPlatformDef, type PlatformDef } from '@/modules/outreach/platforms';

const ENDPOINT = '/api/outreach/[token]';

// ---- kill-switch -------------------------------------------------------------

function isDisabled(): boolean {
  return process.env.NEXT_PUBLIC_COLD_OUTREACH_DISABLED === 'true';
}

function disabledResponse(): Response {
  return createSecureResponse({ success: false, error: 'not_found' }, 404);
}

// ---- request validation ------------------------------------------------------

const KNOWN_PLATFORMS = [
  'cold_email',
  'linkedin_note',
  'linkedin_inmail',
  'whatsapp',
  'instagram_dm',
] as const;

const GenerateSchema = z
  .object({
    platforms: z.array(z.enum(KNOWN_PLATFORMS)).min(1, 'select at least one platform'),
    prospectUrl: z.string().trim().min(1).optional(),
    prospectText: z.string().trim().min(1).optional(),
  })
  .refine((v) => !(v.prospectUrl && v.prospectText), {
    message: 'provide a prospect URL or pasted text, not both',
    path: ['prospectText'],
  });

// ---- response shaping --------------------------------------------------------

interface MessageRow {
  id: string;
  platform: string;
  kind: string;
  groundingLevel: string;
  prospectLabel: string | null;
  subject: string | null;
  body: string;
  createdAt: Date;
}

function toMessageView(row: MessageRow) {
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

/** Trim a single message's fields to its platform caps (final too_long fallback). */
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
  raw: { messages: OutreachMessageItem[] } | null;
  result: ReturnType<typeof validateOutreachMessages>;
}

/** One real attempt: LLM call (cap-FREE SHAPE schema) + validateOutreachMessages. */
async function attemptOutreach(prompt: string, platforms: PlatformDef[]): Promise<Attempt> {
  try {
    const raw = await generateRawJson('cold-outreach', prompt, outreachOutputSchema(platforms));
    return { raw, result: validateOutreachMessages(raw, platforms) };
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
 * Real multi-platform generation with the retry contract (decision #9):
 *   - too_long      → retry ONCE with a stricter instruction; still long → trim
 *                     the shape-valid raw messages to their caps.
 *   - invalid_shape → retry ONCE; still bad → throw (route returns generation_failed).
 */
async function generateOutreach(prompt: string, platforms: PlatformDef[]): Promise<OutreachMessageItem[]> {
  let attempt = await attemptOutreach(prompt, platforms);

  if (!attempt.result.ok) {
    const retryPrompt =
      attempt.result.reason === 'too_long'
        ? prompt +
          '\n\n=== RETRY ===\nYour previous attempt exceeded the length limits for one or more ' +
          'platforms. Respect EVERY platform length cap exactly. Be more concise; cut ruthlessly.'
        : prompt;
    attempt = await attemptOutreach(retryPrompt, platforms);
  }

  if (attempt.result.ok) return attempt.result.messages;
  if (attempt.result.reason === 'too_long' && attempt.raw) {
    return attempt.raw.messages.map((m, i) => trimMessage(m, platforms[i]));
  }
  throw new Error(attempt.result.detail);
}

// ---- GET (message library) ---------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } },
): Promise<Response> {
  if (isDisabled()) return disabledResponse();

  const tokenId = params.token;
  try {
    const { userId: clerkId } = await auth();
    const access = await assertProjectOwner(clerkId, tokenId, { action: 'outreach.get' });
    if (!access.ok) {
      return createSecureResponse({ success: false, error: access.error }, access.status);
    }

    // Demo bearer never persisted rows → empty library.
    if (access.isDemo || !clerkId) {
      return createSecureResponse({ success: true, messages: [] });
    }

    const rows = await prisma.outreachMessage.findMany({
      where: { tokenId, userId: clerkId },
      orderBy: { createdAt: 'desc' },
    });
    return createSecureResponse({ success: true, messages: rows.map(toMessageView) });
  } catch (error) {
    logger.error('[outreach:get] endpoint error:', error);
    return createSecureResponse({ success: false, error: 'internal_error' }, 500);
  }
}

// ---- POST (generate) ---------------------------------------------------------

async function generateHandler(
  req: NextRequest,
  { params }: { params: { token: string } },
): Promise<Response> {
  if (isDisabled()) return disabledResponse();

  const startTime = Date.now();
  const tokenId = params.token;

  try {
    const body = await req.json().catch(() => null);
    const parsed = GenerateSchema.safeParse(body);
    if (!parsed.success) {
      return createSecureResponse(
        { success: false, error: 'validation_error', details: parsed.error.issues },
        400,
      );
    }
    const { platforms: platformIds, prospectUrl, prospectText } = parsed.data;

    // Resolve platform defs (unknown / not-yet-implemented → not available).
    const platformDefs: PlatformDef[] = [];
    for (const id of platformIds) {
      const def = getPlatformDef(id);
      if (!def) {
        return createSecureResponse(
          { success: false, error: 'platform_not_available', platform: id },
          409,
        );
      }
      platformDefs.push(def);
    }

    // 1. Auth + ownership.
    const { userId: clerkId } = await auth();
    const access = await assertProjectOwner(clerkId, tokenId, { action: 'outreach' });
    if (!access.ok) {
      return createSecureResponse({ success: false, error: access.error }, access.status);
    }

    // 2. DEMO/MOCK SHORT-CIRCUIT FIRST — ephemeral mock, NO scrape/charge/persist,
    //    even when prospectUrl/prospectText is present (decisions #11/#12).
    if (access.isDemo || !clerkId) {
      const mock = mockOutreachOutput(platformDefs);
      return createSecureResponse({
        success: true,
        persisted: false,
        groundingLevel: 'generic',
        messages: mock.messages.map((m, i) => ({
          id: `demo-ephemeral-${i}`,
          platform: m.platform,
          kind: 'initial',
          groundingLevel: 'generic',
          prospectLabel: null,
          subject: m.subject ?? null,
          body: m.body,
          createdAt: new Date(),
        })),
      });
    }

    // 3. Load intake (400 if missing) + Brief → brand context.
    const project = await prisma.project.findUnique({
      where: { tokenId },
      select: { id: true, brief: true },
    });
    if (!project) {
      return createSecureResponse({ success: false, error: 'Project not found' }, 404);
    }
    const intakeRow = await prisma.outreachIntake.findUnique({ where: { projectId: project.id } });
    if (!intakeRow) {
      return createSecureResponse(
        { success: false, error: 'intake_required', message: 'Save your outreach intake first.' },
        400,
      );
    }
    const intake = {
      targetDescriptor: intakeRow.targetDescriptor,
      openerContext: intakeRow.openerContext ?? undefined,
    };
    const brandContext = buildBrandContext(BriefSchema.safeParse(project.brief).data ?? null);

    // 4. GROUNDING LADDER.
    let grounding: OutreachGrounding = null;
    let groundingLevel: 'prospect' | 'generic' = 'generic';
    let groundingWarning: string | undefined;
    let prospectLabel: string | null = null;
    let groundingSnapshot: ProspectExtract | { rawText: string } | null = null;

    const envMock = process.env.NEXT_PUBLIC_USE_MOCK_GPT === 'true';

    if (!envMock && prospectUrl) {
      let urlKey: string | null = null;
      try {
        urlKey = normalizeProspectUrlKey(prospectUrl);
      } catch {
        // Malformed URL — degrade to generic, never a hard error.
        groundingWarning = 'scrape_failed';
      }

      if (urlKey) {
        const cached = await getFreshProspectScrape(project.id, urlKey);
        if (cached) {
          // Cache HIT — no charge.
          grounding = cached.extract;
          groundingLevel = 'prospect';
          prospectLabel = urlKey;
          groundingSnapshot = cached.extract;
        } else {
          // Cache MISS — check credits BEFORE any network / AI spend.
          const check = await checkCredits(clerkId, CREDIT_COSTS.OUTREACH_SCRAPE);
          if (!check.allowed) {
            return createSecureResponse(
              {
                success: false,
                error: 'insufficient_credits',
                message: `Insufficient credits. Required: ${check.required}, Available: ${check.remaining}`,
                required: check.required,
                remaining: check.remaining,
              },
              402,
            );
          }
          try {
            const site = await scrapeSite(prospectUrl);
            const extract = (await generateWithSchema(
              'cold-outreach',
              [{ role: 'user', content: buildProspectExtractionPrompt(site.combinedText) }],
              ProspectExtractSchema,
              'prospect_extract',
            )) as ProspectExtract;
            await upsertProspectScrape({
              userId: clerkId,
              projectId: project.id,
              tokenId,
              urlRaw: prospectUrl,
              pages: site.pages,
              extract,
            });
            // Charge ONLY on the successful cache-miss scrape+extract path.
            await consumeCredits(clerkId, UsageEventType.OUTREACH_SCRAPE, CREDIT_COSTS.OUTREACH_SCRAPE, {
              projectId: project.id,
              endpoint: ENDPOINT,
              metadata: { tokenId, urlKey },
            });
            grounding = extract;
            groundingLevel = 'prospect';
            prospectLabel = urlKey;
            groundingSnapshot = extract;
          } catch (err) {
            // ScrapeError OR extraction-invalid → generic fallback, NO charge, NOT an error.
            if (err instanceof ScrapeError) {
              logger.warn(`[outreach:generate] scrape failed (${err.code}) for ${prospectUrl}`);
            } else {
              logger.warn('[outreach:generate] prospect extraction failed:', err as Error);
            }
            grounding = null;
            groundingLevel = 'generic';
            groundingWarning = 'scrape_failed';
          }
        }
      }
    } else if (!envMock && prospectText) {
      // Pasted text — used verbatim, never fetched (LinkedIn ToS).
      grounding = { rawText: prospectText };
      groundingLevel = 'prospect';
      prospectLabel = 'pasted text';
      groundingSnapshot = { rawText: prospectText };
    }
    // Neither (or env mock) → grounding stays null / generic.

    // 5. Generate — env-mock short-circuit vs real LLM with the retry contract.
    let messages: OutreachMessageItem[];
    if (envMock) {
      logger.info('[outreach:generate] env mock mode');
      messages = mockOutreachOutput(platformDefs).messages;
    } else {
      const prompt = buildOutreachPrompt({ platforms: platformDefs, brandContext, intake, grounding });
      logger.dev('[outreach:generate] PROMPT:', prompt);
      try {
        messages = await generateOutreach(prompt, platformDefs);
      } catch (err) {
        logger.error('[outreach:generate] generation failed:', err);
        return createSecureResponse(
          {
            success: false,
            error: 'generation_failed',
            message: err instanceof Error ? err.message : 'Failed to generate messages',
            recoverable: true,
          },
          500,
        );
      }
    }

    // 6. Persist message rows + creditsUsed:0 ledger row in ONE $transaction.
    const groundingJson: Prisma.InputJsonValue | undefined = groundingSnapshot
      ? (groundingSnapshot as unknown as Prisma.InputJsonValue)
      : undefined;

    const createOps = messages.map((m) =>
      prisma.outreachMessage.create({
        data: {
          userId: clerkId,
          projectId: project.id,
          tokenId,
          platform: m.platform,
          kind: 'initial',
          groundingLevel,
          ...(groundingJson !== undefined ? { grounding: groundingJson } : {}),
          prospectLabel,
          subject: typeof m.subject === 'string' ? m.subject : null,
          body: m.body,
        },
      }),
    );

    const results = await prisma.$transaction([
      ...createOps,
      prisma.usageEvent.create({
        data: {
          userId: clerkId,
          eventType: UsageEventType.OUTREACH_GENERATION,
          creditsUsed: 0,
          projectId: project.id,
          metadata: {
            tokenId,
            platforms: platformIds,
            groundingLevel,
            messageCount: messages.length,
          },
          endpoint: ENDPOINT,
          duration: Date.now() - startTime,
          success: true,
        },
      }),
    ]);

    const rows = results.slice(0, messages.length) as MessageRow[];

    return createSecureResponse({
      success: true,
      persisted: true,
      groundingLevel,
      ...(groundingWarning ? { groundingWarning } : {}),
      messages: rows.map(toMessageView),
    });
  } catch (error) {
    logger.error('[outreach:generate] endpoint error:', error);
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

// ---- DELETE (remove one message) ---------------------------------------------

const DeleteSchema = z.object({ messageId: z.string().min(1) });

export async function DELETE(
  req: NextRequest,
  { params }: { params: { token: string } },
): Promise<Response> {
  if (isDisabled()) return disabledResponse();

  const tokenId = params.token;
  try {
    const body = await req.json().catch(() => null);
    const parsed = DeleteSchema.safeParse(body);
    if (!parsed.success) {
      return createSecureResponse(
        { success: false, error: 'validation_error', details: parsed.error.issues },
        400,
      );
    }
    const { messageId } = parsed.data;

    const { userId: clerkId } = await auth();
    const access = await assertProjectOwner(clerkId, tokenId, { action: 'outreach.delete' });
    if (!access.ok) {
      return createSecureResponse({ success: false, error: access.error }, access.status);
    }

    // Demo bearer never persisted rows → nothing to delete.
    if (access.isDemo || !clerkId) {
      return createSecureResponse({ success: false, error: 'Message not found' }, 404);
    }

    const row = await prisma.outreachMessage.findUnique({ where: { id: messageId } });
    if (!row || row.userId !== clerkId || row.tokenId !== tokenId) {
      return createSecureResponse({ success: false, error: 'Message not found' }, 404);
    }

    await prisma.outreachMessage.delete({ where: { id: row.id } });
    return createSecureResponse({ success: true, deleted: true });
  } catch (error) {
    logger.error('[outreach:delete] endpoint error:', error);
    return createSecureResponse({ success: false, error: 'internal_error' }, 500);
  }
}
