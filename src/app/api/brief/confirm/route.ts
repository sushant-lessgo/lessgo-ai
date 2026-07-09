// src/app/api/brief/confirm/route.ts
// POST /api/brief/confirm — the authoritative serve gate (scale-02 phase 4, D1/D2).
// The entry page's client-side verdict is advisory only: the server ALWAYS
// re-runs decideServe() on the confirmed Brief and never trusts a client
// outcome. SERVE ⇒ one Project update {brief, audienceType, templateId} +
// wizard redirect. MANUAL ⇒ NO project write; client goes to demand capture.
// Firewall: pure @/modules/brief + prisma only — no template resolver/registry.
export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { createSecureResponse, assertProjectOwner, validateToken } from '@/lib/security';
import { BriefSchema } from '@/lib/schemas/brief.schema';
import { decideServe } from '@/modules/brief/serveGate';

const ConfirmRequestSchema = z.object({
  tokenId: z.string(),
  // BriefSchema.parse is the D2 tripwire: a draft carrying place/quick-yes in
  // copyEngine would throw here — by construction classify.ts never sets it
  // (resolved engine rides facts.entry.resolvedEngine).
  brief: BriefSchema,
});

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return createSecureResponse({ error: 'Unauthorized' }, 401);
    }

    const body = await req.json();
    const parsed = ConfirmRequestSchema.safeParse(body);
    if (!parsed.success) {
      return createSecureResponse(
        { error: 'Invalid request format', details: parsed.error.issues },
        400
      );
    }
    const { tokenId, brief } = parsed.data;

    if (!validateToken(tokenId)) {
      return createSecureResponse({ error: 'Invalid tokenId' }, 400);
    }

    // Write route: claim orphan rows (first authed writer wins — saveDraft
    // idiom); project must already exist (/api/start created it) ⇒ no allowMissing.
    const access = await assertProjectOwner(clerkId, tokenId, {
      action: 'brief:confirm',
      claimIfOrphan: true,
    });
    if (!access.ok) {
      return createSecureResponse({ error: access.error }, access.status);
    }

    // D1: authoritative gate — server-side decideServe on the confirmed Brief.
    const decision = decideServe(brief);

    if (decision.outcome === 'serve') {
      await prisma.project.update({
        where: { tokenId },
        data: {
          brief: brief as Prisma.InputJsonValue,
          audienceType: decision.audienceType,
          templateId: decision.templateId,
        },
      });
      // scale-06 phase 10: every engine is now served by the unified wizard, so
      // the redirect is UNCONDITIONAL. Load-detection on `/onboarding/[token]`
      // re-hydrates the brief and renders the wizard. The old per-audience
      // wizard routes are gone (redirect stubs forward to here).
      return createSecureResponse({
        outcome: 'serve',
        redirectTo: `/onboarding/${tokenId}`,
      });
    }

    // MANUAL: nothing written to Project — draft goes into DemandLead client-side.
    return createSecureResponse({
      outcome: 'manual',
      missing: decision.missing,
      outOfIcp: decision.outOfIcp,
    });
  } catch (err) {
    console.error('[brief] confirm failed:', err);
    return createSecureResponse({ error: 'Failed to confirm brief' }, 500);
  }
}
