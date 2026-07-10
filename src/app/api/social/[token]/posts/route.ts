export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * /api/social/[token]/posts — social-post generation + library list.
 *
 * Token-scoped, owner-gated. Modeled on the audience generate-copy route but with
 * NO credit spend (D3). The atomic persist+ledger write (D4/D5) is the SOURCE OF
 * TRUTH for the Free lifetime cap (phase 7 counts UsageEvent rows), so it is a
 * CORRECTNESS requirement, not telemetry.
 *
 * ID SPACE (D6): `clerkId` from auth() (NOT the internal `userRecord.id` returned
 * by assertProjectOwner) goes into BOTH `SocialPost.userId` and `UsageEvent.userId`.
 * Variables are named `clerkId` / `internalUserId` so a swap reads wrong here.
 */
import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { createSecureResponse, assertProjectOwner } from '@/lib/security';
import { withAIRateLimit } from '@/lib/rateLimit';
import { UsageEventType } from '@/lib/creditSystem';
import { generateRawJson } from '@/lib/aiClient';
import { buildBrandContext } from '@/modules/social/brandContext';
import {
  buildSocialPostPrompt,
  validatePostOutput,
  socialPostOutputSchema,
  type ValidatePostResult,
} from '@/modules/social/postEngine';
import { getMockPost } from '@/modules/social/mockPosts';
import { PLATFORM_PRESETS, ACTIVE_PLATFORMS, type PlatformPreset } from '@/modules/social/presets';

const ENDPOINT = '/api/social/[token]/posts';

// ---- request validation ------------------------------------------------------

const GenerateSchema = z
  .object({
    platform: z.enum(['linkedin', 'x', 'facebook']),
    mode: z.enum(['archetype', 'archetype_context', 'polish']),
    archetype: z
      .enum([
        'inspirational',
        'product_spotlight',
        'testimonial_quote',
        'tip',
        'announcement',
      ])
      .optional(),
    freshContext: z.string().max(4000).optional(),
    draft: z.string().max(8000).optional(),
  })
  .superRefine((v, ctx) => {
    // archetype required unless polishing an existing draft
    if (v.mode !== 'polish' && !v.archetype) {
      ctx.addIssue({ code: 'custom', message: 'archetype is required', path: ['archetype'] });
    }
    // polish needs a draft to rewrite
    if (v.mode === 'polish' && !v.draft?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'draft is required for polish mode', path: ['draft'] });
    }
    // archetype_context needs the user's fresh text
    if (v.mode === 'archetype_context' && !v.freshContext?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'freshContext is required for archetype_context mode',
        path: ['freshContext'],
      });
    }
  });

// ---- generation helpers ------------------------------------------------------

/** Trim `text` to <= maxChars, preferring a sentence boundary, then a word boundary. */
function trimToSentence(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const lastSentenceEnd = Math.max(
    slice.lastIndexOf('.'),
    slice.lastIndexOf('!'),
    slice.lastIndexOf('?'),
  );
  if (lastSentenceEnd > maxChars * 0.5) {
    return slice.slice(0, lastSentenceEnd + 1).trim();
  }
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace > 0) return slice.slice(0, lastSpace).trim();
  return slice.trim();
}

/** One real generation attempt: LLM call + validate. LLM errors become `invalid_shape`. */
async function attemptGeneration(
  prompt: string,
  preset: PlatformPreset,
): Promise<ValidatePostResult> {
  try {
    const raw = await generateRawJson('social-posts', prompt, socialPostOutputSchema);
    return validatePostOutput(raw, preset);
  } catch (err) {
    return {
      ok: false,
      reason: 'invalid_shape',
      error: err instanceof Error ? err.message : 'generation failed',
    };
  }
}

/**
 * Real LLM generation with the phase-3 retry contract:
 *  - `too_long`      → retry ONCE with a stricter instruction; still too long → trim.
 *  - `invalid_shape` → retry ONCE; still bad → throw (route returns generation_failed).
 * Returns the final post text.
 */
async function generatePostText(
  prompt: string,
  preset: PlatformPreset,
): Promise<string> {
  let result = await attemptGeneration(prompt, preset);

  if (!result.ok) {
    const retryPrompt =
      result.reason === 'too_long'
        ? prompt +
          `\n\n=== RETRY ===\nYour previous attempt was ${result.length} characters — too long. ` +
          `The post MUST be at most ${preset.maxChars} characters. Be more concise; cut ruthlessly.`
        : prompt;
    result = await attemptGeneration(retryPrompt, preset);
  }

  if (result.ok) return result.post;
  if (result.reason === 'too_long') return trimToSentence(result.post, preset.maxChars);
  throw new Error(result.error);
}

// ---- POST (generate) ---------------------------------------------------------

async function generateHandler(
  req: NextRequest,
  { params }: { params: { token: string } },
): Promise<Response> {
  const startTime = Date.now();
  const tokenId = params.token;

  try {
    // 1. Validate body
    const body = await req.json().catch(() => null);
    const parsed = GenerateSchema.safeParse(body);
    if (!parsed.success) {
      return createSecureResponse(
        { success: false, error: 'validation_error', details: parsed.error.issues },
        400,
      );
    }
    const { platform, mode, archetype, freshContext, draft } = parsed.data;

    // Platform must be currently active (X/Facebook are inactive until phase 6).
    if (!ACTIVE_PLATFORMS.includes(platform)) {
      return createSecureResponse(
        { success: false, error: 'platform_inactive', message: `${platform} is not available yet` },
        400,
      );
    }
    const preset = PLATFORM_PRESETS[platform];

    // 2. Auth (clerkId — the id space for ledger + SocialPost.userId, per D6)
    const { userId: clerkId } = await auth();

    // 3. Ownership gate (selects only { userId }; does NOT return brand data)
    const access = await assertProjectOwner(clerkId, tokenId, { action: 'social-posts' });
    if (!access.ok) {
      return createSecureResponse({ success: false, error: access.error }, access.status);
    }

    // 3a. Demo-bearer path (D7): no real clerkId → EPHEMERAL mock, persist NOTHING.
    // A null/empty userId ledger row would poison gating counts, so we write neither
    // a SocialPost nor a UsageEvent row here.
    if (access.isDemo) {
      const demoCtx = buildBrandContext({});
      const content = getMockPost({ platform, mode, ctx: demoCtx, archetype, freshContext, draft });
      return createSecureResponse({
        success: true,
        persisted: false,
        post: {
          id: 'demo-ephemeral',
          platform,
          archetype: archetype ?? null,
          mode,
          content,
          createdAt: new Date().toISOString(),
        },
      });
    }

    // Non-demo + ok ⇒ clerkId is guaranteed non-null (assertProjectOwner 401s otherwise);
    // this guard makes that explicit for the type system and the id-space invariant.
    if (!clerkId) {
      return createSecureResponse({ success: false, error: 'Unauthorized' }, 401);
    }
    // internalUserId is the Project FK id space — MUST NOT flow into ledger/SocialPost.
    const internalUserId = access.userRecord?.id ?? null;
    void internalUserId;

    // 4. Load brand data SEPARATELY (assertProjectOwner does not return it).
    //    NOTE: Project has NO `name` column — the display field is `title` (phase-1 finding).
    const project = await prisma.project.findUnique({
      where: { tokenId },
      select: { id: true, brief: true, content: true, inputText: true, title: true },
    });
    if (!project) {
      return createSecureResponse({ success: false, error: 'Project not found' }, 404);
    }
    const ctx = buildBrandContext(project);

    // 5. Generate — env-mock short-circuit vs real LLM (D7 path (a): real clerkId → persist).
    let content: string;
    const envMock = process.env.NEXT_PUBLIC_USE_MOCK_GPT === 'true';
    if (envMock) {
      logger.info('[social:generate] env mock mode');
      content = getMockPost({ platform, mode, ctx, archetype, freshContext, draft });
    } else {
      const prompt = buildSocialPostPrompt({ ctx, platform, mode, archetype, freshContext, draft });
      logger.dev('[social:generate] PROMPT:', prompt);
      try {
        content = await generatePostText(prompt, preset);
      } catch (err) {
        logger.error('[social:generate] generation failed:', err);
        return createSecureResponse(
          {
            success: false,
            error: 'generation_failed',
            message: err instanceof Error ? err.message : 'Failed to generate post',
            recoverable: true,
          },
          500,
        );
      }
    }

    // 6. Persist + ledger = ONE atomic unit (D4/D5).
    //    Both rows write `userId: clerkId` (D6). We call tx.usageEvent.create DIRECTLY —
    //    NOT logUsageEvent(): logUsageEvent uses the module-level prisma client and swallows
    //    errors without rethrow, so it cannot join a $transaction. Field shape mirrors it.
    //    If either write fails, NEITHER persists → a persisted post can never lack its ledger row.
    const [post] = await prisma.$transaction([
      prisma.socialPost.create({
        data: {
          userId: clerkId,
          projectId: project.id,
          tokenId,
          platform,
          archetype: archetype ?? null,
          mode,
          content,
        },
      }),
      prisma.usageEvent.create({
        data: {
          userId: clerkId,
          eventType: UsageEventType.SOCIAL_POST_GENERATION,
          creditsUsed: 0,
          projectId: project.id,
          metadata: { tokenId, platform, mode, archetype: archetype ?? null },
          endpoint: ENDPOINT,
          duration: Date.now() - startTime,
          success: true,
        },
      }),
    ]);

    return createSecureResponse({ success: true, persisted: true, post });
  } catch (error) {
    logger.error('[social:generate] endpoint error:', error);
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
  return withAIRateLimit((r) => generateHandler(r, ctx))(req);
}

// ---- GET (library list) ------------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } },
): Promise<Response> {
  const tokenId = params.token;
  try {
    const { userId: clerkId } = await auth();
    const access = await assertProjectOwner(clerkId, tokenId, { action: 'social-posts.list' });
    if (!access.ok) {
      return createSecureResponse({ success: false, error: access.error }, access.status);
    }

    // Demo bearer has no persisted rows.
    if (access.isDemo) {
      return createSecureResponse({ success: true, posts: [] });
    }

    const posts = await prisma.socialPost.findMany({
      where: { tokenId },
      orderBy: { createdAt: 'desc' },
    });
    return createSecureResponse({ success: true, posts });
  } catch (error) {
    logger.error('[social:list] endpoint error:', error);
    return createSecureResponse({ success: false, error: 'internal_error' }, 500);
  }
}
