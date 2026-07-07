// src/app/api/demand-lead/route.ts
// Demand capture for the MANUAL-ONBOARD path (scale-02 phase 4, spec §11.10/11.11).
// POST  — Clerk-gated (beta-private) create; userId = caller's Clerk id (the
//         ownership column, phase 2). Founder notify AFTER the DB write in
//         try/catch (forms/submit idiom — lead saved even if email fails).
// PATCH — fast-track upgrade, OWNERSHIP-SCOPED: updateMany({id, userId}) so a
//         Clerk-authed user can't flip arbitrary leads (count 0 ⇒ 404).
// Firewall: pure @/modules/brief + prisma + infra helpers only.
export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { createSecureResponse } from '@/lib/security';
import { withFormRateLimit } from '@/lib/rateLimit';
import { sendLeadNotification } from '@/lib/email/sendLeadNotification';
import { BriefSchema } from '@/lib/schemas/brief.schema';
import { getEntryFacts } from '@/modules/brief/classify';
import type { Brief } from '@/types/brief';

const CreateLeadSchema = z.object({
  input: z.string().min(1).max(2000),
  briefDraft: BriefSchema,
  missing: z.string().min(1),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  fasttrack: z.boolean().optional(),
});

const FasttrackSchema = z.object({
  id: z.string().min(1),
  fasttrack: z.literal(true),
});

// Flat string map for the founder email (helper drops empty values).
function leadEmailData(args: {
  input: string;
  briefDraft: Brief;
  missing: string;
  email: string;
  phone?: string | null;
  fasttrack: boolean;
}): Record<string, string> {
  const entry = getEntryFacts(args.briefDraft);
  return {
    input: args.input,
    businessType: args.briefDraft.businessType ?? '',
    engine: entry?.resolvedEngine ?? '',
    missing: args.missing,
    email: args.email,
    phone: args.phone ?? '',
    fasttrack: args.fasttrack ? 'yes' : '',
  };
}

async function createLeadHandler(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return createSecureResponse({ error: 'Unauthorized' }, 401);
    }

    const body = await req.json();
    const parsed = CreateLeadSchema.safeParse(body);
    if (!parsed.success) {
      return createSecureResponse(
        { error: 'Invalid request format', details: parsed.error.issues },
        400
      );
    }
    const { input, briefDraft, missing, email, phone, fasttrack } = parsed.data;

    const lead = await prisma.demandLead.create({
      data: {
        userId: clerkId,
        input,
        briefDraft: briefDraft as Prisma.InputJsonValue,
        missing,
        email,
        phone: phone ?? null,
        fasttrack: fasttrack === true,
      },
    });

    // Founder notify AFTER the DB write — a send failure never 500s a saved lead
    // (helper is env-gated + never throws; guard is defensive, forms/submit idiom).
    try {
      await sendLeadNotification({
        formName: `Demand lead${fasttrack ? ' — FAST TRACK' : ''}`,
        data: leadEmailData({ input, briefDraft, missing, email, phone, fasttrack: fasttrack === true }),
        replyTo: email,
      });
    } catch {
      // defensive only
    }

    return createSecureResponse({ id: lead.id });
  } catch (err) {
    console.error('[demand-lead] create failed:', err);
    return createSecureResponse({ error: 'Failed to save demand lead' }, 500);
  }
}

async function fasttrackHandler(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return createSecureResponse({ error: 'Unauthorized' }, 401);
    }

    const body = await req.json();
    const parsed = FasttrackSchema.safeParse(body);
    if (!parsed.success) {
      return createSecureResponse(
        { error: 'Invalid request format', details: parsed.error.issues },
        400
      );
    }
    const { id } = parsed.data;

    // Ownership-scoped flip: only the creator's own lead matches. count === 0
    // covers both "not found" and "not yours" — 404 either way (no oracle).
    const result = await prisma.demandLead.updateMany({
      where: { id, userId: clerkId },
      data: { fasttrack: true },
    });
    if (result.count === 0) {
      return createSecureResponse({ error: 'Lead not found' }, 404);
    }

    // Second, high-priority notification (spec §11.11 double-intent signal).
    // businessType/engine read from the STORED row, not the request body.
    try {
      const lead = await prisma.demandLead.findUnique({ where: { id } });
      if (lead) {
        const briefDraft = (lead.briefDraft ?? {}) as Brief;
        await sendLeadNotification({
          formName: 'Demand lead — FAST TRACK',
          data: leadEmailData({
            input: lead.input,
            briefDraft,
            missing: lead.missing,
            email: lead.email,
            phone: lead.phone,
            fasttrack: true,
          }),
          replyTo: lead.email,
        });
      }
    } catch {
      // defensive only — fasttrack flag already persisted
    }

    return createSecureResponse({ id, fasttrack: true });
  } catch (err) {
    console.error('[demand-lead] fasttrack failed:', err);
    return createSecureResponse({ error: 'Failed to update demand lead' }, 500);
  }
}

export const POST = withFormRateLimit(createLeadHandler);
export const PATCH = withFormRateLimit(fasttrackHandler);
