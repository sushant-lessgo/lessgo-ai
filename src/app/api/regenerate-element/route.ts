// src/app/api/regenerate-element/route.ts
// ============================================================================
// ELEMENT REGEN — the regen-modernization PILOT (plan phase 3).
//
// Rebuilt on the phase-2 scoped-generation primitive. This route's sequence is
// the CANONICAL one phases 4–5 reuse verbatim (plan D2). Do NOT rearrange:
//
//   1. requireAICredits            — CHECK only, never charges.
//   2. Zod body validation         — tokenId stays in the QUERY string (caller
//                                    contract, `aiActions.ts:543`).
//   3. assertProjectOwner          — SKIPPED when isMock (requireAICredits hands
//                                    back a synthetic demo user id; the demo
//                                    token short-circuits `security.ts:63`
//                                    anyway, before any DB read).
//   4. Project load                — wrapped in `if (tokenId !== DEMO_TOKEN)`;
//                                    REQUIRED on the real path (404 if missing).
//   5. Mock short-circuit          — BEFORE engine dispatch. The demo token has
//                                    no project row, so dispatch-first would 422
//                                    a request that must return mock variations.
//   6. resolveCopyEngine           — real path only → 422 unsupported_project.
//   7. generateScopedCopy          — retry loop inside; failure → 500, NO charge.
//   8. consumeCredits              — success only; failure is warn-only.
//
// Behavior change vs the legacy route (DELIBERATE, spec's filler-copy criterion):
// this route no longer returns 200 + fabricated "… - Enhanced version" filler
// when the AI fails. It returns 500 `generation_failed`; the caller's
// `if (!response.ok) throw` path surfaces it via `aiGeneration.errors`.
// ============================================================================

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { withAIRateLimit } from '@/lib/rateLimit';
import { requireAICredits } from '@/lib/middleware/planCheck';
import { consumeCredits, UsageEventType, CREDIT_COSTS } from '@/lib/creditSystem';
import { createSecureResponse, assertProjectOwner } from '@/lib/security';
import {
  generateScopedCopy,
  resolveCopyEngine,
  resolveMockEngine,
  UnsupportedProjectError,
  ScopeInputError,
  ScopedGenerationError,
  type LayoutState,
  type ScopedProject,
} from '@/modules/generation/scopedRegen';

export const dynamic = 'force-dynamic';

const DEMO_TOKEN = 'lessgodemomockdata';

/** Element scope regenerates ONE short field — it must not pay for an 8k cap. */
const ELEMENT_MAX_TOKENS = 2048;

const RegenerateElementRequestSchema = z.object({
  sectionId: z.string().min(1),
  elementKey: z.string().min(1),
  currentContent: z.string().min(1),
  variationCount: z.number().int().min(1).max(10).default(5),
});

// ─────────────────────────────────────────────────────────────────────────────
// Persisted layout state (D4: element scope reads its layout from the PROJECT,
// never from the request — the element caller sends no layout).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merge every place `finalContent` can carry layout state, so any editable
 * section resolves: the body-only home slice (top-level `sections`/
 * `sectionLayouts`), the legacy `layout.*` nesting, every entry of the
 * multi-page `pages` map, and the shared `chrome` header/footer entries
 * (which live OUTSIDE `sections` — `pageHelpers.ts:47-68`).
 */
function readPersistedLayoutState(content: unknown): LayoutState {
  const sections: string[] = [];
  const sectionLayouts: Record<string, string> = {};

  const addSlice = (slice: any) => {
    if (!slice || typeof slice !== 'object') return;
    const sliceSections = slice.sections ?? slice.layout?.sections;
    const sliceLayouts = slice.sectionLayouts ?? slice.layout?.sectionLayouts;
    if (Array.isArray(sliceSections)) {
      for (const id of sliceSections) {
        if (typeof id === 'string' && !sections.includes(id)) sections.push(id);
      }
    }
    if (sliceLayouts && typeof sliceLayouts === 'object') {
      for (const [id, layout] of Object.entries(sliceLayouts as Record<string, unknown>)) {
        if (typeof layout === 'string') {
          sectionLayouts[id] = layout;
          if (!sections.includes(id)) sections.push(id);
        }
      }
    }
  };

  const addChromeEntry = (entry: any) => {
    if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string') return;
    if (!sections.includes(entry.id)) sections.push(entry.id);
    if (typeof entry.layout === 'string') sectionLayouts[entry.id] = entry.layout;
  };

  const root = (content ?? {}) as Record<string, any>;
  const finalContent = root.finalContent ?? root; // legacy: content IS the page data

  addSlice(finalContent);
  for (const page of Object.values(finalContent?.pages ?? {})) addSlice(page);
  addChromeEntry(finalContent?.chrome?.header);
  addChromeEntry(finalContent?.chrome?.footer);

  return { sections, sectionLayouts };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock variations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mock-mode variations. Deliberately NOT one of the `mockResponseGenerator*`
 * siblings: those emit whole-page `SectionCopy` records and require strategy /
 * work-facts inputs the demo token (project === null) has no source for. The
 * engine is still resolved via `resolveMockEngine` (never throws) and reported
 * back as `meta.engine`, so the mock path exercises the same dispatch seam.
 */
function generateMockVariations(content: string, count: number): string[] {
  const suffixes = [
    'Enhanced version',
    'Professional tone',
    'Casual approach',
    'Technical focus',
    'Persuasive style',
  ];
  const base = content || 'Default content';
  return Array.from({ length: count }, (_, i) => `${base} - ${suffixes[i % suffixes.length]}`);
}

async function handler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    // 1. Auth + credits — CHECK only. No charge here.
    const creditCheck = await requireAICredits(
      req,
      UsageEventType.ELEMENT_REGEN,
      CREDIT_COSTS.ELEMENT_REGENERATION
    );
    if (!creditCheck.allowed) {
      return creditCheck.response!;
    }
    const userId = creditCheck.userId!;

    // 2. Body validation. `tokenId` is in the QUERY string (caller contract).
    const tokenId = new URL(req.url).searchParams.get('tokenId') ?? '';
    const body = await req.json().catch(() => null);
    const validation = RegenerateElementRequestSchema.safeParse(body);
    if (!tokenId || !validation.success) {
      return createSecureResponse(
        {
          error: 'validation_error',
          detail: !tokenId
            ? 'tokenId query parameter is required'
            : 'sectionId, elementKey and currentContent are required',
          issues: validation.success ? undefined : validation.error.issues,
        },
        400
      );
    }
    const { sectionId, elementKey, currentContent, variationCount } = validation.data;

    const isMock = process.env.NEXT_PUBLIC_USE_MOCK_GPT === 'true' || tokenId === DEMO_TOKEN;

    // 3. Ownership — NEW on this route. Skipped in mock/demo.
    if (!isMock) {
      const access = await assertProjectOwner(userId, tokenId, { action: 'regenerate-element' });
      if (!access.ok) {
        return createSecureResponse({ error: access.error }, access.status);
      }
    }

    // 4. Project load. The demo token has NO project row → never fetch for it.
    let project: ScopedProject | null = null;
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
      })) as ScopedProject | null;

      // REQUIRED on the real path: engine dispatch + prompt context hang off it.
      if (!project && !isMock) {
        return createSecureResponse({ error: 'Project not found' }, 404);
      }
    }

    // 5. Mock short-circuit — BEFORE engine dispatch (mock mode never 422s).
    if (isMock) {
      const engine = resolveMockEngine(project);
      logger.dev(`[regenerate-element] mock variations (engine=${engine})`);
      return createSecureResponse({
        variations: generateMockVariations(currentContent, variationCount),
        originalContent: currentContent,
        elementKey,
        sectionId,
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
              "AI copy isn't available for this kind of project, so this element can't be regenerated.",
            detail: err.message,
          },
          422
        );
      }
      throw err;
    }

    // 7. Generate — the primitive owns narrowing, prompting, validation, retries.
    let result;
    try {
      result = await generateScopedCopy({
        project: project!,
        layoutState: readPersistedLayoutState(project!.content),
        scope: { kind: 'element', sectionId, elementKey },
        currentContent,
        variationCount,
        maxTokens: ELEMENT_MAX_TOKENS,
      });
    } catch (err) {
      // An unknown section / element, or a section with no AI copy contract at
      // all (e.g. atelier's `quote` band — a real block the copy engine has
      // never written). Honest message: this element isn't AI-written.
      if (err instanceof ScopeInputError) {
        return createSecureResponse(
          {
            error: 'invalid_scope',
            message: `This element isn't AI-written, so it can't be regenerated: ${err.message}`,
            detail: err.message,
          },
          422
        );
      }
      // Retries exhausted. NO charge, NO filler copy (the legacy route returned
      // 200 + fabricated variations here — that is the failure mode being killed).
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

    // 8. Charge — success only, after the last failure exit. Warn-only on failure.
    const consumption = await consumeCredits(
      userId,
      UsageEventType.ELEMENT_REGEN,
      CREDIT_COSTS.ELEMENT_REGENERATION,
      {
        endpoint: '/api/regenerate-element',
        duration: Date.now() - startTime,
        sectionId,
        elementKey,
        metadata: { variationCount, engine, attempts: result.attempts },
      }
    );
    if (!consumption.success) {
      logger.warn(
        `[regenerate-element] Credit consumption failed for user ${userId}: ${consumption.error}`
      );
    }

    // 9. Response — contract preserved: the store reads `result.variations`.
    return createSecureResponse({
      variations: result.variations ?? [],
      originalContent: currentContent,
      elementKey,
      sectionId,
      creditsUsed: CREDIT_COSTS.ELEMENT_REGENERATION,
      creditsRemaining: consumption.remaining,
      meta: { mock: false, engine: result.engine, attempts: result.attempts },
    });
  } catch (error: any) {
    logger.error('[regenerate-element] Endpoint error:', error);
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
