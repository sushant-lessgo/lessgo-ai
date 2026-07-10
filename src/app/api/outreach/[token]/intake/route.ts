export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * /api/outreach/[token]/intake — the single per-project cold-outreach intake row.
 *   GET  — the stored intake row, or `{ intake: null, prefill }` where
 *          `prefill.targetDescriptor` derives from the Brief ICP (audiences).
 *   POST — validate + upsert-replace the single row (keyed projectId).
 *
 * Cloned from the email-sequences rail idioms (kill-switch FIRST → auth →
 * assertProjectOwner → createSecureResponse). Intake is NOT an AI/spend op, so
 * there is no rate-limit wrapper. Demo bearer persists NOTHING (email invariant):
 * GET returns null + prefill, POST echoes the submitted intake without a write.
 */
import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createSecureResponse, assertProjectOwner } from '@/lib/security';
import { BriefSchema } from '@/lib/schemas/brief.schema';
import { buildBrandContext } from '@/modules/email/brandContext';
import type { OutreachPlatform } from '@/modules/outreach/platforms';

// ---- kill-switch -------------------------------------------------------------

function isDisabled(): boolean {
  return process.env.NEXT_PUBLIC_COLD_OUTREACH_DISABLED === 'true';
}

function disabledResponse(): Response {
  return createSecureResponse({ success: false, error: 'not_found' }, 404);
}

// ---- request validation ------------------------------------------------------

/** Known outreach-platform ids (full union — pilot + phase-6 platforms). */
const KNOWN_PLATFORMS = [
  'cold_email',
  'linkedin_note',
  'linkedin_inmail',
  'whatsapp',
  'instagram_dm',
] as const satisfies readonly OutreachPlatform[];

const IntakeSchema = z.object({
  targetDescriptor: z.string().trim().min(1, 'targetDescriptor is required'),
  platforms: z.array(z.enum(KNOWN_PLATFORMS)).min(1, 'select at least one platform'),
  openerContext: z.string().trim().optional(),
});

// ---- response shaping --------------------------------------------------------

interface IntakeView {
  id: string;
  targetDescriptor: string;
  platforms: string[];
  openerContext: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toIntakeView(row: {
  id: string;
  targetDescriptor: string;
  platforms: unknown;
  openerContext: string | null;
  createdAt: Date;
  updatedAt: Date;
}): IntakeView {
  return {
    id: row.id,
    targetDescriptor: row.targetDescriptor,
    platforms: Array.isArray(row.platforms) ? (row.platforms as string[]) : [],
    openerContext: row.openerContext,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Prefill the target descriptor from the Brief's captured audiences (ICP). */
function prefillFromBrief(brief: unknown): { targetDescriptor: string } {
  const parsed = BriefSchema.safeParse(brief);
  const ctx = buildBrandContext(parsed.success ? parsed.data : null);
  return { targetDescriptor: ctx.audiences.join(', ') };
}

// ---- GET (fetch intake / prefill) --------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } },
): Promise<Response> {
  if (isDisabled()) return disabledResponse();

  const tokenId = params.token;
  try {
    const { userId: clerkId } = await auth();
    const access = await assertProjectOwner(clerkId, tokenId, { action: 'outreach.intake.get' });
    if (!access.ok) {
      return createSecureResponse({ success: false, error: access.error }, access.status);
    }

    const project = await prisma.project.findUnique({
      where: { tokenId },
      select: { id: true, brief: true },
    });
    const prefill = prefillFromBrief(project?.brief);

    // Demo bearer never persisted a row → null intake + prefill.
    if (access.isDemo || !clerkId) {
      return createSecureResponse({ success: true, intake: null, prefill });
    }

    const row = project
      ? await prisma.outreachIntake.findUnique({ where: { projectId: project.id } })
      : null;
    if (!row) {
      return createSecureResponse({ success: true, intake: null, prefill });
    }

    return createSecureResponse({ success: true, intake: toIntakeView(row) });
  } catch (error) {
    logger.error('[outreach:intake:get] endpoint error:', error);
    return createSecureResponse({ success: false, error: 'internal_error' }, 500);
  }
}

// ---- POST (upsert intake) ----------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } },
): Promise<Response> {
  if (isDisabled()) return disabledResponse();

  const tokenId = params.token;
  try {
    const body = await req.json().catch(() => null);
    const parsed = IntakeSchema.safeParse(body);
    if (!parsed.success) {
      return createSecureResponse(
        { success: false, error: 'validation_error', details: parsed.error.issues },
        400,
      );
    }
    const { targetDescriptor, platforms, openerContext } = parsed.data;

    const { userId: clerkId } = await auth();
    const access = await assertProjectOwner(clerkId, tokenId, { action: 'outreach.intake' });
    if (!access.ok) {
      return createSecureResponse({ success: false, error: access.error }, access.status);
    }

    // Demo bearer persists NOTHING — echo the submitted intake ephemerally.
    if (access.isDemo || !clerkId) {
      return createSecureResponse({
        success: true,
        persisted: false,
        intake: {
          id: 'demo-ephemeral',
          targetDescriptor,
          platforms,
          openerContext: openerContext ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    const project = await prisma.project.findUnique({
      where: { tokenId },
      select: { id: true },
    });
    if (!project) {
      return createSecureResponse({ success: false, error: 'Project not found' }, 404);
    }

    const platformsJson = platforms as unknown as Prisma.InputJsonValue;
    const row = await prisma.outreachIntake.upsert({
      where: { projectId: project.id },
      create: {
        userId: clerkId,
        projectId: project.id,
        tokenId,
        targetDescriptor,
        platforms: platformsJson,
        openerContext: openerContext ?? null,
      },
      update: {
        userId: clerkId,
        tokenId,
        targetDescriptor,
        platforms: platformsJson,
        openerContext: openerContext ?? null,
      },
    });

    return createSecureResponse({ success: true, persisted: true, intake: toIntakeView(row) });
  } catch (error) {
    logger.error('[outreach:intake:post] endpoint error:', error);
    return createSecureResponse({ success: false, error: 'internal_error' }, 500);
  }
}
