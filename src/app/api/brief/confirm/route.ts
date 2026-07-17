// src/app/api/brief/confirm/route.ts
// POST /api/brief/confirm — the authoritative serve gate (scale-02 phase 4, D1/D2).
// The entry page's client-side verdict is advisory only: the server ALWAYS
// re-runs decideServe() on the confirmed Brief and never trusts a client
// outcome. SERVE ⇒ one Project update {brief, audienceType, templateId} +
// wizard redirect. MANUAL ⇒ NO project write; client goes to demand capture.
// Firewall: pure @/modules/brief + prisma only — no template resolver/registry.
// (@/types/service `templateIds` is a plain const string list — pure data, no
//  resolver/registry graph; used only to validate the dev/pilot template override.)
// (proof-truth phase 3) @/lib/testimonials/autoImport is firewall-compatible: a
// plain prisma-backed lib with NO template/resolver import; it runs on the serve
// branch to durably import scraped verbatim quotes into the Testimonial table.
export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { createSecureResponse, assertProjectOwner, validateToken } from '@/lib/security';
import { BriefSchema } from '@/lib/schemas/brief.schema';
import { decideServe } from '@/modules/brief/serveGate';
import { importScrapedTestimonials } from '@/lib/testimonials/autoImport';
import { templateIds } from '@/types/service';

/**
 * DEV/PILOT-ONLY template override (work-onboarding-ingestion E2 / D7, D7b). When
 * `WORK_JOURNEY_TEMPLATE_OVERRIDE` names a valid templateId AND the serve gate
 * resolved to `atelier` (a work journey), persist the override instead — the
 * smallest seam to route a manual dev journey onto the `atelier2` skeleton pilot
 * without touching decideServe/shortlist/fit. SERVER env, UNSET in prod ⇒ this is a
 * no-op and the persisted templateId is byte-identical to the gate's verdict.
 */
function applyWorkTemplateOverride(templateId: string): string {
  const override = process.env.WORK_JOURNEY_TEMPLATE_OVERRIDE;
  if (
    templateId === 'atelier' &&
    override &&
    (templateIds as readonly string[]).includes(override)
  ) {
    return override;
  }
  return templateId;
}

/** Safely pull scraped verbatim quote strings from the confirmed Brief's entry facts. */
function extractEntryTestimonials(brief: unknown): string[] {
  const facts = (brief as { facts?: unknown } | null)?.facts;
  const entry = (facts as { entry?: unknown } | null)?.entry;
  const raw = (entry as { testimonials?: unknown } | null)?.testimonials;
  if (!Array.isArray(raw)) return [];
  return raw.filter((q): q is string => typeof q === 'string');
}

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
      const updated = await prisma.project.update({
        where: { tokenId },
        data: {
          brief: brief as Prisma.InputJsonValue,
          audienceType: decision.audienceType,
          // D7/D7b: env-gated dev/pilot override (unset in prod ⇒ decision.templateId).
          templateId: applyWorkTemplateOverride(decision.templateId),
        },
        select: { id: true },
      });

      // proof-truth phase 3: durably import scraped verbatim quotes into the
      // Testimonial table ONCE, here (single pre-generation entry point). Demo
      // short-circuit (userRecord === null) → skip. Empty/absent testimonials →
      // no-op. Import failure MUST NOT fail the confirm (this route's job is the
      // serve verdict) — log + continue.
      //
      // Tenant key = Clerk id (`clerkId`), NOT `access.userRecord.id` (DB cuid):
      // Testimonial.userId stores the Clerk id (prisma schema comment) and every
      // existing testimonial route — POST /api/testimonials, apply-to-page,
      // collect — plus the regenerate-section table read all key on the Clerk id.
      // Writing the DB cuid here would orphan these rows from the dashboard AND
      // from the regen re-injection (which reads by Clerk id). `access.userRecord`
      // is used only as the not-demo guard.
      if (access.userRecord) {
        const quotes = extractEntryTestimonials(brief);
        if (quotes.length > 0) {
          try {
            await importScrapedTestimonials(clerkId, updated.id, quotes);
          } catch (importErr) {
            console.error('[brief] testimonial auto-import failed (non-fatal):', importErr);
          }
        }
      }

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
