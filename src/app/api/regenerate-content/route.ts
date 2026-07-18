// src/app/api/regenerate-content/route.ts
// ============================================================================
// WHOLE-PAGE COPY REGEN — rebuilt on the scoped-generation primitive (phase 5).
//
// THIS ROUTE WAS THE H3 HOLE. The legacy version had NO auth, NO ownership, NO
// credit check and NO charge — only a rate limit — and it took a CLIENT-SUPPLIED
// `prompt` string straight to OpenAI. Any signed-in user had an unlimited
// completion proxy on our API key, for free. Closed here:
//   • Prompt construction is now SERVER-side. The body carries no `prompt` field;
//     an injected one is stripped by the Zod schema and can never reach a model.
//   • `tokenId` is now part of the contract (the legacy body had none — so there
//     was nothing to hang ownership off), and ownership is asserted on it.
//   • The route charges 3 credits — CREDIT_COSTS.GENERATE_COPY /
//     UsageEventType.GENERATE_COPY (R7, founder-answered; existing constant and
//     existing event type — no new billing surface).
//
// Sequence = phase 3's CANONICAL one (plan D2) — do NOT rearrange:
//   1. requireAICredits            — CHECK only, never charges.
//   2. Zod body validation         — `tokenId` in the BODY; `prompt` stripped.
//   3. assertProjectOwner          — SKIPPED when isMock.
//   4. Project load                — `if (tokenId !== DEMO_TOKEN)`; REQUIRED on
//                                    the real path (404).
//   5. Mock short-circuit          — BEFORE engine dispatch (mock never 422s).
//   6. resolveCopyEngine           — real path only → 422 unsupported_project.
//   7. generateScopedCopy ('all')  — failure → 422 invalid_scope / 500, NO charge.
//   8. consumeCredits              — success only; failure is warn-only.
//
// THIN BY RULING (R6.1): no strategy phase is re-run, persisted or fabricated.
// The bar is "≥ today's legacy regen" (R6.2), NOT first-gen parity.
//
// DESIGN RANDOMIZATION STAYS CLIENT-SIDE (D4): the design+copy path randomizes
// layouts/background BEFORE calling and sends the RESULT as schema-validated
// STRUCTURE (`sections` / `sectionLayouts`) — structure, not a prompt. H3 holds.
//
// Behavior changes (DELIBERATE):
//  • No filler copy. The legacy route answered provider failure, parse failure
//    and ANY server error with 200 + mock content (`isPartial: true`). Gone.
//  • Sections with no copy contract are REPORTED (`skippedSections` + warnings),
//    never silently dropped (R6.3).
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
  type SkippedSection,
} from '@/modules/generation/scopedRegen';

export const dynamic = 'force-dynamic';

const DEMO_TOKEN = 'lessgodemomockdata';

/**
 * The new server-side contract. NOTE what is NOT here: `prompt`. Zod's default
 * strip behavior means a client that still sends one has it silently discarded
 * before anything downstream can see it — the H3 fix, enforced by the schema
 * rather than by a hand-rolled check.
 *
 * `sections`/`sectionLayouts` are STRUCTURE the caller already computed (D4:
 * design randomization stays client-side). `updatedInputs` are the editor's
 * unsaved field edits — the only genuinely client-only copy inputs.
 */
const RegenerateContentRequestSchema = z.object({
  tokenId: z.string().min(1),
  preserveDesign: z.boolean().default(true),
  sections: z.array(z.string().min(1)).min(1),
  sectionLayouts: z.record(z.string()).default({}),
  updatedInputs: z.record(z.unknown()).optional(),
  /** Client-side design output — accepted for contract compatibility, then discarded. Never prompted, never echoed. */
  backgroundSystem: z.record(z.unknown()).optional(),
});

/** Mirrors `regenerationActions.extractHiddenFields` — moved server-side. */
const HIDDEN_FIELD_KEYS = [
  'awarenessLevel',
  'copyIntent',
  'toneProfile',
  'marketSophisticationLevel',
  'problemType',
] as const;

/** `hero-abc12345` → `hero` (the key the copy builders + model responses use). */
function sectionTypeKey(sectionId: string): string {
  const dash = sectionId.indexOf('-');
  return dash > 0 ? sectionId.slice(0, dash) : sectionId;
}

function isTestimonialsSection(sectionId: string): boolean {
  return sectionTypeKey(sectionId).toLowerCase().startsWith('testimonials');
}

/**
 * Fold the editor's unsaved field edits into the PERSISTED onboarding view the
 * primitive reads. This is the whole point of the route (the caller regenerates
 * *because* inputs changed) and it is the only place client input touches the
 * prompt — as validated FIELDS, never as prose.
 */
function projectWithUpdatedInputs(
  project: ScopedProject,
  updatedInputs?: Record<string, unknown>
): ScopedProject {
  if (!updatedInputs || !Object.keys(updatedInputs).length) return project;

  const content = (project.content ?? {}) as Record<string, unknown>;
  const onboarding = (content.onboarding ?? {}) as Record<string, unknown>;
  const validatedFields = (onboarding.validatedFields ?? {}) as Record<string, unknown>;
  const hiddenInferredFields = (onboarding.hiddenInferredFields ?? {}) as Record<string, unknown>;

  const hiddenFromInputs: Record<string, unknown> = {};
  for (const key of HIDDEN_FIELD_KEYS) {
    if (updatedInputs[key]) hiddenFromInputs[key] = updatedInputs[key];
  }

  return {
    ...project,
    content: {
      ...content,
      onboarding: {
        ...onboarding,
        validatedFields: { ...validatedFields, ...updatedInputs },
        hiddenInferredFields: { ...hiddenInferredFields, ...hiddenFromInputs },
      },
    },
  };
}

/**
 * Model output (keyed by section TYPE) → the store's wire shape (keyed by the
 * page's real section IDs, elements FLAT).
 *
 * `generationActions.updateFromAIResponse` walks `content[sectionId]` entries as
 * `elementKey → value` and ignores any key not in `state.sections` — so the id
 * space must be the caller's, not the model's.
 */
function toStoreContent(
  modelSections: Record<string, { elements?: Record<string, unknown> }> | undefined,
  sectionIds: string[]
): Record<string, Record<string, unknown>> {
  const content: Record<string, Record<string, unknown>> = {};
  if (!modelSections) return content;
  for (const sectionId of sectionIds) {
    const hit = modelSections[sectionTypeKey(sectionId)] ?? modelSections[sectionId];
    if (hit?.elements && Object.keys(hit.elements).length) {
      content[sectionId] = { ...hit.elements };
    }
  }
  return content;
}

/**
 * Mock-mode page copy. Deliberately NOT `mockResponseGenerator*` (whole-page
 * generators needing strategy/work-facts inputs the demo token — project null —
 * has no honest source for; and the legacy `generateMockResponse` is deleted in
 * phase 6). `resolveMockEngine` is still called: it is the dispatch seam the
 * sequence test guards, and it is reported as `meta.engine`.
 */
function generateMockPageContent(sectionIds: string[]): Record<string, Record<string, unknown>> {
  const perType: Record<string, Record<string, unknown>> = {
    hero: {
      headline: 'Transform Your Business with AI-Powered Solutions',
      subheadline: 'Leverage cutting-edge technology to streamline operations',
    },
    features: {
      section_title: 'Powerful Features Built for Growth',
      feature_1_title: 'Lightning Fast Performance',
    },
    cta: { headline: 'Ready to Get Started?', cta_button: 'Start Your Free Trial' },
  };
  const content: Record<string, Record<string, unknown>> = {};
  for (const sectionId of sectionIds) {
    content[sectionId] = { ...(perType[sectionTypeKey(sectionId)] ?? { title: 'Section Title' }) };
  }
  return content;
}

async function handler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    // 1. Auth + credits (3 credits, R7) — CHECK only. No charge here.
    //    This single line closes H3's "no auth, no credit gate" half.
    const creditCheck = await requireAICredits(
      req,
      UsageEventType.GENERATE_COPY,
      CREDIT_COSTS.GENERATE_COPY
    );
    if (!creditCheck.allowed) {
      return creditCheck.response!;
    }
    const userId = creditCheck.userId!;

    // 2. Body validation. Any `prompt` field dies here (H3).
    const body = await req.json().catch(() => null);
    const validation = RegenerateContentRequestSchema.safeParse(body);
    if (!validation.success) {
      return createSecureResponse(
        {
          error: 'validation_error',
          detail: 'tokenId and sections are required',
          issues: validation.error.issues,
        },
        400
      );
    }
    const { tokenId, preserveDesign, sections, sectionLayouts, updatedInputs } = validation.data;

    logger.dev('[regenerate-content] request', {
      tokenId,
      preserveDesign,
      sectionCount: sections.length,
      hasUpdatedInputs: !!updatedInputs,
    });

    const isMock = process.env.NEXT_PUBLIC_USE_MOCK_GPT === 'true' || tokenId === DEMO_TOKEN;

    // 3. Ownership — A01. The legacy route had NONE (its body had no tokenId to
    //    check against). Skipped in mock/demo (synthetic demo user id).
    if (!isMock) {
      const access = await assertProjectOwner(userId, tokenId, { action: 'regenerate-content' });
      if (!access.ok) {
        return createSecureResponse({ error: access.error }, access.status);
      }
    }

    // 4. Project load. The demo token has NO project row → never fetch for it.
    let project: (ScopedProject & { id?: string }) | null = null;
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

      if (!project && !isMock) {
        return createSecureResponse({ error: 'Project not found' }, 404);
      }
    }

    const regenerationType = preserveDesign ? 'content-only' : 'design-and-copy';
    const preservedElements = preserveDesign ? Object.keys(sectionLayouts) : [];

    // 5. Mock short-circuit — BEFORE engine dispatch (mock mode never 422s).
    if (isMock) {
      const engine = resolveMockEngine(project);
      const content = generateMockPageContent(sections);
      logger.dev(`[regenerate-content] mock content (engine=${engine})`);
      return createSecureResponse({
        success: true,
        content,
        preservedElements,
        updatedElements: Object.keys(content),
        regenerationType,
        isMock: true,
        creditsUsed: 0,
        skippedSections: [],
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
            message: "AI copy isn't available for this kind of project, so it can't be regenerated.",
            detail: err.message,
          },
          422
        );
      }
      throw err;
    }

    // 7. Generate. 'all' scope's layout state comes from the REQUEST (D4).
    const scopedProject = projectWithUpdatedInputs(project!, updatedInputs);
    let result;
    try {
      result = await generateScopedCopy({
        project: scopedProject,
        layoutState: { sections, sectionLayouts },
        scope: { kind: 'all' },
      });
    } catch (err) {
      // Nothing on the page has a copy contract, a layout is missing, or work
      // facts are absent. HONEST message (R6.3), never filler.
      if (err instanceof ScopeInputError) {
        return createSecureResponse(
          {
            error: 'invalid_scope',
            message: `This page can't be regenerated: ${err.message}`,
            detail: err.message,
          },
          422
        );
      }
      // Retries exhausted. NO charge, NO filler copy (the legacy route answered
      // this with 200 + mock content + `isPartial: true`).
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

    // proof-truth: real approved testimonials always beat freshly invented ones.
    // Ownership is asserted above, so this cross-tenant read is owner-guarded.
    // Work-engine projects inject praise inside `parseWorkCopy` (see scopedRegen),
    // so this path is product/service only — same split as regenerate-section.
    let reinjectedRealProof = false;
    if (project?.id && engine !== 'work' && sections.some(isTestimonialsSection)) {
      try {
        const rows = await listTestimonialsByOwner(userId, {
          projectId: project.id,
          status: 'approved',
        });
        if (rows.length > 0 && result.sections) {
          const real = rows.map((t) => ({
            quote: t.quote,
            author_name: t.authorName ?? '',
            author_role: t.authorRole ?? '',
          }));
          const inject =
            project.audienceType === 'product' ? injectProductTestimonials : injectServiceTestimonials;
          inject(result.sections as any, real);
          reinjectedRealProof = (result.sections as any).testimonials?.realProof === true;
        }
      } catch (injectErr) {
        logger.warn('[regenerate-content] real-testimonial re-injection failed:', injectErr);
      }
    }

    const content = toStoreContent(result.sections, sections);

    // R6.3: sections with no copy contract are REPORTED, not silently omitted.
    // `warnings` lands in the store's `aiGeneration.warnings` slot
    // (`generationActions.ts:191`), but NO component reads that slot today, so the
    // reason reaches store state and stops there — it is NOT user-visible yet.
    // `skippedSections` is the structured form an honest disabled/greyed control
    // can render from. Rendering either is an editor-lane merge-gate decision.
    const skippedSections: SkippedSection[] = result.skippedSections ?? [];
    const warnings = skippedSections.map((s) => `${s.sectionId}: ${s.reason}`);

    // 8. Charge — success only, after the last failure exit. Warn-only on failure.
    const consumption = await consumeCredits(
      userId,
      UsageEventType.GENERATE_COPY,
      CREDIT_COSTS.GENERATE_COPY,
      {
        endpoint: '/api/regenerate-content',
        duration: Date.now() - startTime,
        metadata: {
          regenerationType,
          engine: result.engine,
          attempts: result.attempts,
          sectionCount: sections.length,
          skippedCount: skippedSections.length,
        },
      }
    );
    if (!consumption.success) {
      logger.warn(
        `[regenerate-content] Credit consumption failed for user ${userId}: ${consumption.error}`
      );
    }

    // 9. Response — D8 wire shape preserved EXACTLY: the store passes this whole
    //    object to `updateFromAIResponse`, which reads `.content` / `.success` /
    //    `.warnings`. Top-level `content`. Do not "tidy" this into a `data` nest.
    return createSecureResponse({
      success: true,
      content,
      ...(warnings.length ? { warnings } : {}),
      preservedElements,
      updatedElements: Object.keys(content),
      regenerationType,
      skippedSections,
      ...(reinjectedRealProof ? { aiMetadata: { realProof: true } } : {}),
      creditsUsed: CREDIT_COSTS.GENERATE_COPY,
      creditsRemaining: consumption.remaining,
      meta: { mock: false, engine: result.engine, attempts: result.attempts },
    });
  } catch (error: any) {
    logger.error('[regenerate-content] Endpoint error:', error);
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
