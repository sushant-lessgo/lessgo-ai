// src/app/api/regenerate-section/route.ts
// ============================================================================
// SECTION REGEN — rebuilt on the scoped-generation primitive (plan phase 4).
//
// ENGINE SWAP, not a gating rebuild: this route's gates were already correct
// (requireAICredits / assertProjectOwner / charge-on-success). What changed is
// everything BELOW the gates — the hand-rolled `callAIProvider` + inline prompt
// + `JSON.parse`-or-guess parser + THREE filler-copy exits are gone, replaced by
// `generateScopedCopy` (section scope), which owns engine dispatch, narrowing,
// prompting, contract validation and the retry loop.
//
// The sequence is phase 3's CANONICAL one (plan D2) — do NOT rearrange:
//   1. requireAICredits            — CHECK only, never charges.
//   2. Zod body validation         — tokenId stays in the BODY (caller D).
//   3. assertProjectOwner          — SKIPPED when isMock.
//   4. Project load                — `if (tokenId !== DEMO_TOKEN)`; REQUIRED on
//                                    the real path (404), replacing the legacy
//                                    "proceed without context" leniency.
//   5. Mock short-circuit          — BEFORE engine dispatch (mock never 422s).
//   6. resolveCopyEngine           — real path only → 422 unsupported_project.
//   7. generateScopedCopy          — failure → 422 invalid_scope / 500, NO charge.
//   8. consumeCredits              — success only; failure is warn-only.
//
// THIN BY RULING (R6.1): no strategy phase is re-run or persisted. The prompt's
// strategic fields are honestly empty. The bar is "≥ today's legacy regen"
// (R6.2), NOT first-gen parity.
//
// Behavior changes (DELIBERATE):
//  • No filler copy. The legacy route answered provider failure / parse failure /
//    ANY server error with 200 + hardcoded "Transform Your Business with AI-
//    Powered Solutions" mock content. All three exits are removed.
//  • Sections with no AI copy contract (atelier's `quote` band — a real block the
//    copy engine has never written) now 422 `invalid_scope` with an HONEST,
//    user-renderable message instead of silently receiving mock filler (R6.3).
// ============================================================================

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { withAIRateLimit } from '@/lib/rateLimit';
import { requireAICredits } from '@/lib/middleware/planCheck';
import { consumeCredits, UsageEventType, CREDIT_COSTS } from '@/lib/creditSystem';
import { createSecureResponse, assertProjectOwner } from '@/lib/security';
import { listTestimonialsByOwner } from '@/lib/testimonials/repo';
import { injectRealTestimonials as injectProductTestimonials } from '@/modules/audience/product/parseCopy';
import { injectRealTestimonials as injectServiceTestimonials } from '@/modules/audience/service/parseCopy';
import {
  generateScopedCopy,
  resolveCopyEngine,
  resolveMockEngine,
  UnsupportedProjectError,
  ScopeInputError,
  ScopedGenerationError,
  type ScopedProject,
} from '@/modules/generation/scopedRegen';

export const dynamic = 'force-dynamic';

const DEMO_TOKEN = 'lessgodemomockdata';

const RegenerateSectionRequestSchema = z.object({
  sectionId: z.string().min(1),
  tokenId: z.string().min(1),
  userGuidance: z.string().optional(),
  currentContent: z.record(z.unknown()).optional(),
  sectionType: z.string().optional(),
  layout: z.string().optional(),
});

/** `hero-abc12345` → `hero` (the key every copy builder / model response uses). */
function sectionTypeKey(sectionId: string): string {
  const dash = sectionId.indexOf('-');
  return dash > 0 ? sectionId.slice(0, dash) : sectionId;
}

// proof-truth phase 3: is this a testimonials section? (sectionType is the bare
// type; sectionId is `${type}-${uuid}` — check both, normalized.)
function isTestimonialsSection(sectionType?: string, sectionId?: string): boolean {
  const norm = (s?: string) => String(s ?? '').toLowerCase();
  return norm(sectionType).startsWith('testimonials') || norm(sectionId).startsWith('testimonials');
}

/**
 * Pull the target section's elements out of the primitive's result. The model
 * keys sections by section TYPE (that is what the builders' `uiblocks` carry);
 * accept the raw sectionId too, and fall back to the single key when the scope
 * produced exactly one section.
 */
function pickSectionElements(
  sections: Record<string, { elements?: Record<string, unknown> }> | undefined,
  sectionId: string
): Record<string, unknown> {
  if (!sections) return {};
  const hit = sections[sectionTypeKey(sectionId)] ?? sections[sectionId];
  if (hit?.elements) return hit.elements;
  const keys = Object.keys(sections);
  if (keys.length === 1 && sections[keys[0]]?.elements) return sections[keys[0]].elements!;
  return {};
}

/**
 * Mock-mode section content. Deliberately NOT one of the `mockResponseGenerator*`
 * siblings: those emit whole-PAGE copy and need strategy / work-facts inputs the
 * demo token (project === null) has no honest source for. `resolveMockEngine` is
 * still called — it is the dispatch seam the sequence test guards — and reported
 * back as `meta.engine`.
 *
 * Shape matches the caller's merge loop (`aiActions.ts:147-171`), which accepts
 * `string | { content, type }`.
 */
function generateMockSectionContent(
  sectionId: string,
  sectionType?: string
): Record<string, unknown> {
  const type = (sectionType || sectionTypeKey(sectionId)).toLowerCase().replace(/[-_]/g, '');
  const mockTemplates: Record<string, Record<string, string>> = {
    hero: {
      headline: 'Transform Your Business with AI-Powered Solutions',
      subheadline:
        'Leverage cutting-edge technology to streamline operations and boost productivity',
      cta_primary: 'Get Started Free',
    },
    features: {
      section_title: 'Powerful Features Built for Growth',
      feature_1_title: 'Lightning Fast Performance',
      feature_1_description: 'Experience blazing-fast load times and seamless interactions',
      feature_2_title: 'Advanced Analytics',
      feature_2_description: 'Gain deep insights with comprehensive data analysis tools',
    },
    pricing: {
      section_title: 'Simple, Transparent Pricing',
      section_subtitle: 'Choose the plan that fits your needs',
      starter_price: '$29/month',
      pro_price: '$79/month',
    },
    testimonials: {
      section_title: 'Trusted by Industry Leaders',
      testimonial_1: 'This product has revolutionized how we handle our daily operations.',
      testimonial_1_author: 'Sarah Johnson, CEO at TechCorp',
    },
    cta: {
      headline: 'Ready to Get Started?',
      subheadline: 'Join thousands of satisfied customers today',
      cta_button: 'Start Your Free Trial',
    },
    default: {
      title: 'Section Title',
      content: 'This is placeholder content for the section. Update with your actual content.',
    },
  };

  let template = mockTemplates.default;
  for (const [key, value] of Object.entries(mockTemplates)) {
    if (type.includes(key) || key.includes(type)) {
      template = value;
      break;
    }
  }
  return { ...template };
}

async function handler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    // 1. Auth + credits (2 credits) — CHECK only. No charge here.
    const creditCheck = await requireAICredits(
      req,
      UsageEventType.SECTION_REGEN,
      CREDIT_COSTS.SECTION_REGENERATION
    );
    if (!creditCheck.allowed) {
      return creditCheck.response!;
    }
    const userId = creditCheck.userId!;

    // 2. Body validation. `tokenId` stays in the BODY (caller D contract).
    const body = await req.json().catch(() => null);
    const validation = RegenerateSectionRequestSchema.safeParse(body);
    if (!validation.success) {
      return createSecureResponse(
        {
          error: 'validation_error',
          detail: 'sectionId and tokenId are required',
          issues: validation.error.issues,
        },
        400
      );
    }
    const { sectionId, tokenId, userGuidance, currentContent, sectionType, layout } =
      validation.data;

    logger.dev('[regenerate-section] request', {
      tokenId,
      sectionId,
      sectionType,
      layout,
      hasUserGuidance: !!userGuidance,
      currentContentKeys: currentContent ? Object.keys(currentContent) : [],
    });

    const isMock = process.env.NEXT_PUBLIC_USE_MOCK_GPT === 'true' || tokenId === DEMO_TOKEN;

    // 3. Ownership — A01. Before any cross-tenant read or charge. Skipped in
    //    mock/demo (requireAICredits hands back a synthetic demo user id).
    if (!isMock) {
      const access = await assertProjectOwner(userId, tokenId, { action: 'regenerate-section' });
      if (!access.ok) {
        return createSecureResponse({ error: access.error }, access.status);
      }
    }

    // 4. Project load. The demo token has NO project row → never fetch for it.
    let project: ScopedProject & { id?: string } | null = null;
    if (tokenId !== DEMO_TOKEN) {
      project = (await prisma.project.findUnique({
        where: { tokenId },
        select: {
          id: true,
          audienceType: true,
          templateId: true,
          content: true,
          brief: true,
          title: true,
          inputText: true,
        },
      })) as (ScopedProject & { id?: string }) | null;

      // REQUIRED on the real path now: engine dispatch + prompt context hang off
      // it. Legacy proceeded with a context-free prompt instead.
      if (!project && !isMock) {
        return createSecureResponse({ error: 'Project not found' }, 404);
      }
    }

    // 5. Mock short-circuit — BEFORE engine dispatch (mock mode never 422s).
    if (isMock) {
      const engine = resolveMockEngine(project);
      logger.dev(`[regenerate-section] mock content (engine=${engine})`);
      return createSecureResponse({
        content: generateMockSectionContent(sectionId, sectionType),
        sectionId,
        originalContent: currentContent,
        regenerationType: 'section',
        isMock: true,
        creditsUsed: 0,
        meta: { mock: true, engine },
      });
    }

    // 6. Engine dispatch — real path only. Writer/ecommerce → 422, no charge,
    //    before any AI call (R5).
    let engine: string;
    try {
      engine = resolveCopyEngine(project).engine;
    } catch (err) {
      if (err instanceof UnsupportedProjectError) {
        return createSecureResponse(
          {
            error: 'unsupported_project',
            message:
              "AI copy isn't available for this kind of project, so this section can't be regenerated.",
            detail: err.message,
          },
          422
        );
      }
      throw err;
    }

    // 7. Generate. Section scope's layout state comes from the REQUEST (D4):
    //    the caller already sends `sectionId` + `layout` — a size-1 map.
    let result;
    try {
      result = await generateScopedCopy({
        project: project!,
        layoutState: {
          sections: [sectionId],
          sectionLayouts: layout ? { [sectionId]: layout } : {},
        },
        scope: { kind: 'section', sectionId },
        currentContent: currentContent ? JSON.stringify(currentContent) : undefined,
        userGuidance,
      });
    } catch (err) {
      // A section the copy engine has no contract for (atelier's `quote` band), a
      // missing layout, or missing work facts. HONEST message (R6.3): never a
      // silent drop, never relabelled filler.
      if (err instanceof ScopeInputError) {
        return createSecureResponse(
          {
            error: 'invalid_scope',
            message: `This section isn't AI-written, so it can't be regenerated: ${err.message}`,
            detail: err.message,
          },
          422
        );
      }
      // Retries exhausted. NO charge, NO filler copy (the legacy route answered
      // this with 200 + hardcoded mock content — the failure mode being killed).
      if (err instanceof ScopedGenerationError) {
        return createSecureResponse(
          {
            error: 'generation_failed',
            message: err.message,
            recoverable: true,
            attempts: err.attempts,
          },
          500
        );
      }
      throw err;
    }

    // Contract-validated elements for the target section only. Values stay in
    // their generated shape (string | string[] | object[]); the caller's merge
    // loop is shape-preserving and accepts `string | { content, type }`.
    const sectionContent = pickSectionElements(result.sections, sectionId);

    // proof-truth phase 3 (acceptance criterion 4): real proof always wins over
    // fresh AI inventions. Ownership is asserted above, so this cross-tenant read
    // is owner-guarded. Work-engine projects inject praise inside `parseWorkCopy`
    // (see scopedRegen), so this path is product/service only, as before.
    let reinjectedRealProof = false;
    if (project?.id && engine !== 'work' && isTestimonialsSection(sectionType, sectionId)) {
      try {
        const rows = await listTestimonialsByOwner(userId, {
          projectId: project.id,
          status: 'approved',
        });
        if (rows.length > 0) {
          const real = rows.map((t) => ({
            quote: t.quote,
            author_name: t.authorName ?? '',
            author_role: t.authorRole ?? '',
          }));
          const wrapper = { testimonials: { elements: sectionContent } } as any;
          if (project.audienceType === 'product') {
            injectProductTestimonials(wrapper, real);
          } else {
            injectServiceTestimonials(wrapper, real);
          }
          reinjectedRealProof = wrapper.testimonials?.realProof === true;
        }
      } catch (injectErr) {
        logger.warn('[regenerate-section] real-testimonial re-injection failed:', injectErr);
      }
    }

    // 8. Charge — success only, after the last failure exit. Warn-only on failure.
    const consumption = await consumeCredits(
      userId,
      UsageEventType.SECTION_REGEN,
      CREDIT_COSTS.SECTION_REGENERATION,
      {
        endpoint: '/api/regenerate-section',
        duration: Date.now() - startTime,
        sectionId,
        metadata: {
          sectionType,
          hasUserGuidance: !!userGuidance,
          engine: result.engine,
          attempts: result.attempts,
        },
      }
    );
    if (!consumption.success) {
      logger.warn(
        `[regenerate-section] Credit consumption failed for user ${userId}: ${consumption.error}`
      );
    }

    // 9. Response — contract preserved: the store reads `data.content` as a
    //    Record<string, string | { content, type }> and merges it shape-preservingly.
    return createSecureResponse({
      content: sectionContent,
      sectionId,
      originalContent: currentContent,
      regenerationType: 'section',
      ...(reinjectedRealProof ? { aiMetadata: { realProof: true } } : {}),
      creditsUsed: CREDIT_COSTS.SECTION_REGENERATION,
      creditsRemaining: consumption.remaining,
      meta: { mock: false, engine: result.engine, attempts: result.attempts },
    });
  } catch (error: any) {
    logger.error('[regenerate-section] Endpoint error:', error);
    return createSecureResponse(
      {
        error: 'internal_error',
        message: error?.message || 'An unexpected error occurred',
        recoverable: true,
      },
      500
    );
  }
}

export const POST = withAIRateLimit(handler);
